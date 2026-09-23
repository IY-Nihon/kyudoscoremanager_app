/**
 * メンバーの招待リンクの画面。
 *
 *   招待の窓       … 招待リンクを開いた人を迎える。押すとそのメンバーとして入る
 *   招待リンクの欄 … 団体の持ち主がメンバーの編集で、リンクを作る・写す・送る・作り直す
 *
 * 仕組みは src/memberInvite.js、入る道は src/groupLogin.js の 部員として入る。
 */
'use strict';

const React = require('react');
const { Alert, Modal, Pressable, Text, View, StyleSheet } = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const 招 = require('./memberInvite');
const 写 = require('./clipboard_bridge');

/** 部員の認証方式の版（src/LoginScreen.js と App.js の MEMBER_AUTH_VERSION と同じ） */
const 部員のログインの版 = 2;

const 道具を取る = () => {
  const { auth, db } = require('./db');
  return { Firestore: require('firebase/firestore'), FirebaseAuth: require('firebase/auth'), db, auth };
};

/** リンクの配り元。web では開いているサイト、それ以外は本番 */
const 配り元 = () =>
  typeof window !== 'undefined' && window.location && /^https?:/.test(window.location.origin || '')
    ? window.location.origin
    : 'https://kyudoscoremanager.web.app';

/**
 * 招待リンクを開いた人を迎える窓。
 * すでに誰かで入っている端末では入れ替えない（まだ送れていない記録を守るため、ログアウトの
 * 確かめを通してもらう）。ログアウトしたあと、同じタブならこの窓がまた出る（App.js がタブの控えに持つ）
 */
const 招待の窓 = ({ 招待, onClose }) => {
  const 入っている = useScoreStore((状態) => 状態.activeGroupId);
  const [作業中, 作業中を置く] = React.useState(false);
  const [難点, 難点を置く] = React.useState(null);
  if (!招待) return null;
  const 入る = async () => {
    難点を置く(null);
    作業中を置く(true);
    try {
      const 道具 = 道具を取る();
      // リンクの団体は人が打つ団体ID（6 桁）。団体の鍵（groups/{鍵}）は、個人ID で入るときと
      // 同じく公開の帳面から引く。古い団体は鍵と団体ID が違うことがある。帳面が無ければ
      // 団体の鍵がそのまま載っているリンクとみなす
      const 帳面 = await 道具.Firestore.getDoc(道具.Firestore.doc(道具.db, 'group_accounts', 招待.団体));
      const 団体の鍵 = (帳面.exists() && 帳面.data().id) || 招待.団体;
      const { memberId, 名前 } = await require('./groupLogin').部員として入る(
        道具,
        団体の鍵,
        招待.合言葉,
        'この招待リンクは使えません。作り直されたか、メンバーから外れた可能性があります。団体の管理者に確かめてください。'
      );
      const 店 = useScoreStore.getState();
      店.setAuth(団体の鍵, 'member', memberId, null, 招待.団体, null, 名前);
      店.setMemberAuthVersion(部員のログインの版);
      onClose(true);
      Alert.alert('入りました', `${名前 || 'メンバー'} さんとして入りました。`);
    } catch (誤り) {
      const 符号 = String((誤り && 誤り.code) || '');
      難点を置く(
        /network|unavailable/.test(符号)
          ? '接続できませんでした。電波の良い場所でもう一度お試しください。'
          : (誤り && 誤り.message) || '入れませんでした。'
      );
    } finally {
      作業中を置く(false);
    }
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View style={styles.外}>
        <View style={styles.箱} testID="招待の窓">
          <Text style={styles.見出し}>招待リンク</Text>
          {入っている ? (
            <Text style={styles.説明}>
              いまは別のログインで入っています。招待されたメンバーとして入るには、設定からログアウトしてから、このリンクをもう一度開いてください。
            </Text>
          ) : (
            <Text style={styles.説明}>このリンクで、団体のメンバーとして入ります。</Text>
          )}
          {難点 ? <Text style={styles.難点}>{難点}</Text> : null}
          {入っている ? null : (
            <Pressable style={[styles.ボタン, 作業中 && styles.作業中]} disabled={作業中} onPress={入る}>
              <Text style={styles.ボタンの字}>{作業中 ? '入っています…' : '入る'}</Text>
            </Pressable>
          )}
          <Pressable style={styles.閉じる} onPress={() => onClose(false)}>
            <Text style={styles.閉じるの字}>{入っている ? '閉じる' : 'やめる'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

/**
 * メンバーの編集に出す、招待リンクの欄（団体の持ち主だけ）。
 * 開いたときに今の合言葉を探し、無ければ「作る」、あればリンクと「写す」「送る」「作り直す」を出す
 */
const 招待リンクの欄 = ({ 団体, 部員 }) => {
  const [合言葉, 合言葉を置く] = React.useState(undefined); // undefined は探している途中
  const [作業中, 作業中を置く] = React.useState(false);
  const [知らせ, 知らせを置く] = React.useState(null);
  const memberId = 部員 && 部員.id;
  // リンクには人が知っている団体ID を載せる（団体の鍵と違う古い団体がある）
  const 団体ID = useScoreStore((状態) => 状態.publicGroupId) || 団体;
  React.useEffect(() => {
    let 生きている = true;
    合言葉を置く(undefined);
    知らせを置く(null);
    if (!団体 || !memberId) return undefined;
    招.招待を探す(道具を取る(), 団体, memberId)
      .then((x) => 生きている && 合言葉を置く(x))
      .catch(() => 生きている && 合言葉を置く(null));
    return () => {
      生きている = false;
    };
  }, [団体, memberId]);
  if (!団体 || !memberId) return null;
  const リンク = 合言葉 ? 招.招待リンクを作る(配り元(), 団体ID, 合言葉) : null;

  const 作る = async (作り直しか) => {
    const 進める = async () => {
      作業中を置く(true);
      知らせを置く(null);
      try {
        合言葉を置く(await 招.招待を作り直す(道具を取る(), 団体, memberId));
        知らせを置く(作り直しか ? '作り直しました。前のリンクはもう使えません。' : '作りました。');
      } catch (誤り) {
        知らせを置く('作れませんでした: ' + ((誤り && 誤り.message) || ''));
      } finally {
        作業中を置く(false);
      }
    };
    if (!作り直しか) return 進める();
    Alert.alert('作り直しますか？', '前の招待リンクは使えなくなります（すでに入っている端末はそのままです）。', [
      { text: 'やめる', style: 'cancel' },
      { text: '作り直す', style: 'destructive', onPress: 進める },
    ]);
  };
  const 写す = async () => {
    const 出来た = await 写.写す(リンク);
    知らせを置く(出来た ? 'リンクを写しました。' : '写せませんでした。リンクを長押しして写してください。');
  };
  const 送れるか = typeof navigator !== 'undefined' && navigator && typeof navigator.share === 'function';
  const 送る = async () => {
    try {
      await navigator.share({ title: '弓道部的中ノートの招待', text: `${部員.name || ''} さんの招待リンク`, url: リンク });
    } catch {
      // 閉じただけのときも投げる。何もしない
    }
  };

  return (
    <View style={styles.欄} testID="招待リンクの欄">
      <Text style={styles.欄の題}>招待リンク</Text>
      <Text style={styles.欄の説明}>
        このリンクを本人に送ると、団体IDと個人IDを打たずに、このメンバーとして入れます。本人以外に送らないでください。
      </Text>
      {undefined === 合言葉 ? (
        <Text style={styles.欄の説明}>確かめています…</Text>
      ) : リンク ? (
        <>
          <Text selectable style={styles.リンク} testID="招待リンク">
            {リンク}
          </Text>
          <View style={styles.並び}>
            <Pressable style={styles.小ボタン} onPress={写す}>
              <Text style={styles.小ボタンの字}>リンクを写す</Text>
            </Pressable>
            {送れるか ? (
              <Pressable style={styles.小ボタン} onPress={送る}>
                <Text style={styles.小ボタンの字}>送る</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.小ボタン} disabled={作業中} onPress={() => 作る(true)}>
              <Text style={[styles.小ボタンの字, styles.危ない字]}>作り直す</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable style={[styles.ボタン, 作業中 && styles.作業中]} disabled={作業中} onPress={() => 作る(false)}>
          <Text style={styles.ボタンの字}>{作業中 ? '作っています…' : '招待リンクを作る'}</Text>
        </Pressable>
      )}
      {知らせ ? <Text style={styles.知らせ}>{知らせ}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  外: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  箱: { width: '100%', maxWidth: 420, backgroundColor: '#FFF', borderRadius: 14, padding: 18 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 },
  説明: { fontSize: 14, color: '#3C3C43', lineHeight: 20, marginBottom: 6 },
  難点: { fontSize: 13, color: '#FF3B30', marginTop: 8 },
  ボタン: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  作業中: { backgroundColor: '#8E8E93' },
  ボタンの字: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  閉じる: { paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  閉じるの字: { color: '#007AFF', fontSize: 15 },
  欄: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  欄の題: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  欄の説明: { fontSize: 12, color: '#3C3C43', lineHeight: 18, marginBottom: 6 },
  リンク: { fontSize: 12, color: '#007AFF', marginVertical: 6 },
  並び: { flexDirection: 'row', flexWrap: 'wrap' },
  小ボタン: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginRight: 8,
    marginTop: 6,
  },
  小ボタンの字: { color: '#007AFF', fontSize: 14, fontWeight: 'bold' },
  危ない字: { color: '#FF3B30' },
  知らせ: { fontSize: 13, color: '#248A3D', marginTop: 8 },
});

Object.defineProperty(exports, '__esModule', { value: true });
exports.招待の窓 = 招待の窓;
exports.招待リンクの欄 = 招待リンクの欄;
