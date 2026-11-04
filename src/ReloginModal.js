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
const { 団体で入る, 部員として入る, 部員のログインの版 } = require('./groupLogin');

const 道具を取る = () => require('./db').雲の道具();

// 団体ID・個人ID は全角と見えない空白を直して大文字に（ログイン画面と同じ。src/totonoeru.js）
const { IDを整える: 整える } = require('./totonoeru');

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
      (和, 種) => 和 + (状態[種] || []).filter((一つ) => 一つ && 一つ.syncStatus === '未同期').length,
      0
    )
  );
  const [入力, 入力を置く] = React.useState('');
  const [作業中, 作業中を置く] = React.useState(false);
  const [難点, 難点を置く] = React.useState(null);
  const 走っている = React.useRef(false);
  // 横向きのスマホなど高さが低い画面では、余白を詰めて 1 画面に収める
  const 低い = useWindowDimensions().height < 480;
  const 部員 = 役割 === 'member';
  // 12/3 を過ぎて、4 桁の個人ID で入っていた部員（決まりが 4 桁の証を止めたので入り直しの窓が出る）。
  // 「有効期限が切れました」ではなく、新しい ID が要ることを出す（ログインに使った ID は自分の所属の証から読む）
  const 自分の個人ID = useScoreStore((状態) => 状態.自分の個人ID);
  React.useEffect(() => {
    if (要る && 部員 && !自分の個人ID) useScoreStore.getState().自分の個人IDを読む();
  }, [要る, 部員, 自分の個人ID]);
  const 個 = require('./kojinId');
  const 四桁が終わった = 部員 && 個.古い形.test(String(自分の個人ID || '')) && !個.古い形を使えるか();
  if (!要る || !団体の鍵) return null;
  // この端末の App Check の印が取れていない（強制していると、ログインし直しても断られ続ける。H3）
  const 印が取れていない = (() => {
    try {
      return require('./setupAppCheck').印が取れていないか();
    } catch {
      return false;
    }
  })();

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
    if (!入力.trim()) {
      難点を置く(部員 ? '個人IDを入れてください' : 'パスワードを入れてください');
      return;
    }
    走っている.current = true;
    作業中を置く(true);
    難点を置く(null);
    try {
      const 道具 = 道具を取る();
      const 店 = useScoreStore.getState();
      if (部員) {
        // 整えてから 6 字で見る（4 桁は使える終わりまで）。12/3 を過ぎた 4 桁は 部員として入る が分かる言葉で断る
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
            <Text style={[styles.見出し, 低い && { marginBottom: 4 }]}>
              {印が取れていない ? 'この端末の確かめに失敗しました' : 'ログインし直してください'}
            </Text>
            {印が取れていない ? (
              <Text style={[styles.説明, 低い && { marginBottom: 4 }]}>
                ブラウザを新しくして、読み込み直してください。この端末の記録はそのまま残っています（読み込み直しても消えません）。
              </Text>
            ) : null}
            {印が取れていない ? (
              <Pressable
                style={[styles.ボタン, 低い && styles.ボタン_低い]}
                onPress={() => {
                  try {
                    window.location.reload();
                  } catch {
                    /* 読み込み直せない端末では、閉じて開き直してもらう */
                  }
                }}
              >
                <Text style={styles.ボタンの字}>読み込み直す</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.説明, 低い && { marginBottom: 4 }]}>
              {四桁が終わった
                ? '4桁の個人IDは使えなくなりました。団体の担当者から新しい個人ID（大文字と数字の6字）を受け取って入れてください。この端末の記録はそのまま残っています。'
                : 'ログインの有効期限が切れました。この端末の記録はそのまま残っています。'}
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
                if (難点) {
                  難点を置く(null);
                }
              }}
              secureTextEntry={!部員}
              autoCapitalize={部員 ? 'characters' : 'none'}
              autoCorrect={false}
              placeholder={部員 ? '例: K7MP3X' : ''}
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
