'use strict';

const { 色 } = require('./iro.js');
/**
 * ログインし直しの窓。ログアウトさせずに、その場で入り直す。
 *
 * ■ なぜ要るか
 * 2026-10-17、端末のログインが外れたとき、帯は「設定からログアウトして、もう一度ログイン」と
 * 案内していた。ログアウトは手元の記録を捨てるので、送れていない記録（部内戦 27 人分）が消えた。
 * 入り直すだけなら、手元の記録には触らずに済む。
 *
 * 出すとき（店の 入り直しが要る が立つ）
 *   ・開いたとき、団体で入っているのに Firebase のログインが無い（App.js）
 *   ・雲に permission-denied で断られた（storeSync・AttendanceScreen）
 * 「あとで」を押すと、この起動のあいだは自動では出さない。記録の画面の赤い帯を押すとまた出る。
 *
 * 入れるのは今の団体だけ（団体 ID は変えられない）。別の団体の ID で入ると記録が混ざるので断る。
 * 入れたら setAuth で入り直し（同じ団体なので手元は消えない）、すぐ送る。
 */

const React = require('react');
const {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  useWindowDimensions,
} = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const { 団体で入る, 部員として入る } = require('./groupLogin');

/** 部員の認証方式の版（src/LoginScreen.js・App.js の MEMBER_AUTH_VERSION と同じ） */
const 部員のログインの版 = 2;

const 道具を取る = () => {
  const { auth, db } = require('./db');
  return { Firestore: require('firebase/firestore'), FirebaseAuth: require('firebase/auth'), db, auth };
};

const 整える = (値) =>
  String(値 || '')
    .trim()
    .toUpperCase();

/** 入れなかった訳（src/LoginScreen.js の 誤りの文 と同じ言い方） */
const 訳 = (誤り) => {
  const 符号 = String((誤り && 誤り.code) || '');
  if (/wrong-password|invalid-credential|invalid-login/.test(符号)) return 'パスワードが正しくありません';
  if (/too-many-requests/.test(符号)) return '試した回数が上限に達しました。しばらくたってからお試しください';
  if (/network/.test(符号)) return '通信できませんでした。電波の良い場所でお試しください';
  return String((誤り && 誤り.message) || '入れませんでした');
};

const 入り直しの窓 = () => {
  const 要る = useScoreStore((状態) => 状態.入り直しが要る);
  const 団体の鍵 = useScoreStore((状態) => 状態.activeGroupId);
  const 見える団体ID = useScoreStore((状態) => 状態.publicGroupId || 状態.activeGroupId);
  const 役割 = useScoreStore((状態) => 状態.activeRole);
  const 未送信 = useScoreStore((状態) =>
    ['sessions', 'members', 'alumni', 'trash'].reduce(
      (和, 種) => 和 + (状態[種] || []).filter((一つ) => 一つ && '未同期' === 一つ.syncStatus).length,
      0
    )
  );
  const [入力, 入力を置く] = React.useState('');
  const [作業中, 作業中を置く] = React.useState(false);
  const [難点, 難点を置く] = React.useState(null);
  const 走っている = React.useRef(false);
  // 横向きのスマホなど高さが低い画面では、余白を詰めて 1 画面に収める
  const 低い = useWindowDimensions().height < 480;
  const 部員 = 'member' === 役割;
  if (!要る || !団体の鍵) return null;

  const あとで = () => {
    難点を置く(null);
    // 帯を出しておく（押すとこの窓に戻る）。開いたときにログインが無かった場合は、まだ帯が立っていない
    useScoreStore.setState({
      入り直しが要る: false,
      入り直しをあとに: true,
      再ログインの案内: require('./storeShared').入り直しの案内,
    });
  };

  const 入り直す = async () => {
    if (走っている.current) return;
    if (!入力.trim()) return void 難点を置く(部員 ? '個人IDを入れてください' : 'パスワードを入れてください');
    走っている.current = true;
    作業中を置く(true);
    難点を置く(null);
    try {
      const 道具 = 道具を取る();
      const 店 = useScoreStore.getState();
      if (部員) {
        const { memberId, 名前 } = await 部員として入る(道具, 団体の鍵, 整える(入力));
        店.setAuth(団体の鍵, 'member', memberId, null, 見える団体ID, null, 名前);
        店.setMemberAuthVersion(部員のログインの版);
      } else {
        const { id, メール } = await 団体で入る(道具, 整える(見える団体ID), 入力);
        if (整える(id) !== 整える(団体の鍵)) {
          // 入れたが別の団体だった（起こらないはずだが、混ざると戻せない）
          await 道具.FirebaseAuth.signOut(道具.auth).catch(() => {});
          throw new Error('この端末で使っている団体とは別の団体です');
        }
        店.setAuth(id, 'group', null, メール, 見える団体ID);
      }
      useScoreStore.setState({ 入り直しが要る: false, 入り直しをあとに: false, 再ログインの案内: null });
      入力を置く('');
      // 送れていない記録をすぐ送る（見張りの付け直しは setAuth がしている）
      useScoreStore
        .getState()
        .syncSessions()
        .catch(() => {});
    } catch (誤り) {
      難点を置く(訳(誤り));
    } finally {
      走っている.current = false;
      作業中を置く(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={あとで}>
      <View style={styles.外}>
        {/* 横向きのスマホや、キーボードが出て高さが足りないときは流せるように（窓が画面からはみ出さない） */}
        <ScrollView
          style={styles.流し}
          contentContainerStyle={[styles.流しの中, 低い && styles.流しの中_低い]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.箱, 低い && styles.箱_低い]} testID="入り直しの窓">
            <Text style={[styles.見出し, 低い && { marginBottom: 4 }]}>ログインし直してください</Text>
            <Text style={[styles.説明, 低い && { marginBottom: 4 }]}>
              ログインの有効期限が切れました。この端末の記録はそのまま残っています。
              {未送信 > 0 ? `ログインし直すと、送れていない${未送信}件も送られます。` : ''}
            </Text>
            <Text style={styles.ラベル}>団体ID</Text>
            <View style={styles.固定の欄}>
              <Text style={styles.固定の字}>{見える団体ID}</Text>
            </View>
            <Text style={styles.ラベル}>{部員 ? '個人ID' : 'パスワード'}</Text>
            <TextInput
              testID="入り直しの入力"
              accessibilityLabel={部員 ? '個人ID' : 'パスワード'}
              style={styles.欄}
              value={入力}
              onChangeText={(値) => {
                入力を置く(値);
                難点 && 難点を置く(null);
              }}
              secureTextEntry={!部員}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={部員 ? '例: 1234' : ''}
              onSubmitEditing={入り直す}
            />
            {難点 ? <Text style={styles.難点}>{難点}</Text> : null}
            <Pressable
              style={[styles.ボタン, 低い && styles.ボタン_低い, 作業中 && styles.作業中]}
              disabled={作業中}
              onPress={入り直す}
            >
              <Text style={styles.ボタンの字}>{作業中 ? 'ログインしています…' : 'ログインし直す'}</Text>
            </Pressable>
            <Pressable style={[styles.あとで, 低い && { paddingVertical: 8, marginTop: 2 }]} onPress={あとで}>
              <Text style={styles.あとでの字}>あとで（記録は続けられます）</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  外: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  流し: { flex: 1, width: '100%' },
  流しの中: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  流しの中_低い: { padding: 8 },
  箱: { width: '100%', maxWidth: 420, backgroundColor: 色.白, borderRadius: 14, padding: 18 },
  箱_低い: { paddingVertical: 10 },
  ボタン_低い: { paddingVertical: 9, marginTop: 8 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10, textAlign: 'center' },
  説明: { fontSize: 14, color: 色.文字_二, lineHeight: 20, marginBottom: 12 },
  ラベル: { fontSize: 13, color: 色.文字_二, marginBottom: 4, marginTop: 6 },
  固定の欄: { backgroundColor: 色.地, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  固定の字: { fontSize: 15, color: 色.文字_二 },
  欄: {
    borderWidth: 1,
    borderColor: 色.地_濃い,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: 色.文字,
  },
  難点: { fontSize: 13, color: 色.赤, marginTop: 8 },
  ボタン: {
    backgroundColor: 色.青,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  作業中: { backgroundColor: 色.灰 },
  ボタンの字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  あとで: { paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  あとでの字: { color: 色.文字_二, fontSize: 14 },
});

module.exports = { 入り直しの窓 };
