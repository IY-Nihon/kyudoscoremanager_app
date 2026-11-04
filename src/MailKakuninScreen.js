'use strict';

const { 色 } = require('./iro.js');
/**
 * 登録メールアドレスの確認が済むまでの画面（2026-11-03 本人：確認が済むまで団体は何もできない）。
 * App.js が、団体で入っているのにメールの確認が済んでいない（持ち主）・団体の確認が済んでいない（部員）
 * ときに、アプリの画面の代わりに出す。止めるのは決まり（firestore.rules）で、ここは理由と確認の仕方を出す。
 *
 *   持ち主：確認メールを送る → メールのリンクを押す →「確認した」で確かめ直して先へ
 *   部員：団体の担当者に確認を頼む。「もう一度確かめる」で見直す
 * どちらもログアウトできる（送れていない記録は setAuth(null) が団体ごとの控えへ移す）。
 */

const React = require('react');
const { Modal, Pressable, ScrollView, Text, View, StyleSheet } = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const 確 = require('./mailKakunin');
const { useSafeAreaInsets } = require('react-native-safe-area-context');

const 道具を取る = () => require('./db').雲の道具();
const 入り直しを下ろす = { 入り直しが要る: false, 入り直しをあとに: false, 再ログインの案内: null };

const MailKakuninScreen = ({ 様子, 閉じる }) => {
  // 猶予中（帯から開いた）も持ち主の確認の画面。閉じる があれば「あとで」で戻れる
  const 持ち主 = 様子 === '持ち主がまだ' || 様子 === '猶予中';
  const [作業中, 作業中を置く] = React.useState(false);
  const [知らせ, 知らせを置く] = React.useState('');
  const [難点, 難点を置く] = React.useState('');
  const 道具 = 道具を取る();
  const メール = (道具.auth && 道具.auth.currentUser && 道具.auth.currentUser.email) || '';

  const する = async (手) => {
    if (作業中) return;
    作業中を置く(true);
    難点を置く('');
    try {
      await 手();
    } catch (誤り) {
      難点を置く(String((誤り && 誤り.message) || 誤り));
    } finally {
      作業中を置く(false);
    }
  };

  const 送る = () =>
    する(async () => {
      await 確.確認メールを送る(道具.FirebaseAuth, 道具.auth);
      知らせを置く(`${メール} に確認メールを送りました。メールのリンクを押してから、「確認した」を押してください。`);
    });

  const 確かめる = () =>
    する(async () => {
      const 状 = useScoreStore.getState();
      if (持ち主) {
        if (!(await 確.確認が済んだか(道具.auth))) {
          知らせを置く('');
          難点を置く('まだ確認が済んでいません。メールのリンクを押してから、もう一度押してください。');
          return;
        }
        await 確.帳面に確認済みを書く(道具, 状.activeGroupId).catch(() => {});
        // 確認の画面のあいだに決まりに断られて立った「入り直しが要る」も下ろす（ログインは今確かめた）。
        // 残すと、確認を済ませた直後に「ログインの有効期限が切れました」が出た
        useScoreStore.setState({ メールの確認: '済み', ...入り直しを下ろす });
        if (閉じる) 閉じる();
        return;
      }
      const 済み = await 確.団体の確認は済んだか(道具, 状.activeGroupId);
      if (済み === false) {
        難点を置く('まだ確認が済んでいません。');
        return;
      }
      useScoreStore.setState({ メールの確認: '済み', ...入り直しを下ろす });
    });

  // 電波が無くても出られるように、証の削除などは待ちきらない（src/groupLogin.js の 団体から出る）
  const 出る = () =>
    する(async () => {
      const 状 = useScoreStore.getState();
      await require('./groupLogin').団体から出る(道具, 状.activeRole);
      状.setAuth(null, null, null, null);
    });

  return (
    <ScrollView style={styles.流し} contentContainerStyle={styles.流しの中}>
      <View style={styles.箱} testID="メールの確認の画面">
        <Text style={styles.見出し}>{持ち主 ? 'メールアドレスの確認' : 'まだ使えません'}</Text>
        {持ち主 ? (
          <>
            <Text style={styles.説明}>
              {様子 === '猶予中'
                ? `団体のアカウントを使い続けるには、登録メールアドレスの確認が要ります。${確.猶予の最後の日()}までに確認が済まないと、記録やメンバーなどが使えなくなります（部員も入れなくなります）。`
                : '団体のアカウントを使うには、登録メールアドレスの確認が要ります。確認が済むまで、記録やメンバーなどは使えません（部員も入れません）。'}
            </Text>
            <Text style={styles.宛先}>{メール}</Text>
            <Text style={styles.説明}>「確認メールを送る」を押し、届いたメールのリンクを押してから、「確認した」を押してください。</Text>
          </>
        ) : (
          <Text style={styles.説明}>{確.団体がまだの文}</Text>
        )}
        {知らせ ? <Text style={styles.知らせ}>{知らせ}</Text> : null}
        {難点 ? <Text style={styles.難点}>{難点}</Text> : null}
        {持ち主 ? (
          <Pressable
            accessibilityRole="button"
            style={[styles.ボタン, 作業中 && styles.作業中]}
            onPress={送る}
            disabled={作業中}
          >
            <Text style={styles.ボタンの字}>確認メールを送る</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          style={[styles.ボタン, 持ち主 && styles.二番目, 作業中 && styles.作業中]}
          onPress={確かめる}
          disabled={作業中}
        >
          <Text style={[styles.ボタンの字, 持ち主 && styles.二番目の字]}>
            {持ち主 ? '確認した' : 'もう一度確かめる'}
          </Text>
        </Pressable>
        {持ち主 ? (
          <Text style={styles.注}>
            メールが届かないときは、迷惑メールのフォルダーも見てください。登録メールアドレスを変えるときは、ログアウトして、ログイン画面の「メールアドレスを忘れた」から変えられます。
          </Text>
        ) : null}
        {閉じる ? (
          <Pressable accessibilityRole="button" style={styles.出る} onPress={閉じる} disabled={作業中}>
            <Text style={styles.出るの字}>あとで</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" style={styles.出る} onPress={出る} disabled={作業中}>
            <Text style={styles.出るの字}>ログアウト</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

/**
 * 今ある団体の猶予のあいだ、画面の下に出す帯。押すと確認の画面を窓で開く（「あとで」で閉じる）
 */
const 確認の帯 = () => {
  const [開く, 開くを置く] = React.useState(false);
  // iPhone の下の帯（ホームの線）の分だけ空ける
  const 余白 = useSafeAreaInsets();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        testID="メールの確認の帯"
        style={[styles.帯, { paddingBottom: 10 + (余白.bottom || 0) }]}
        onPress={() => 開くを置く(true)}
      >
        <Text style={styles.帯の字}>
          {`登録メールアドレスの確認をお願いします（${確.猶予の最後の日()}まで。過ぎると使えなくなります）`}
        </Text>
        <Text style={styles.帯の押す}>確認する</Text>
      </Pressable>
      <Modal visible={開く} transparent animationType="fade" onRequestClose={() => 開くを置く(false)}>
        <View style={styles.窓の外}>
          <MailKakuninScreen 様子="猶予中" 閉じる={() => 開くを置く(false)} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // 画面のいちばん下に、ふつうの段として置く（画面がその分だけ縮み、記録画面の下のボタンに重ならない）
  帯: {
    backgroundColor: 色.文字,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  帯の字: { flex: 1, color: 色.白, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  帯の押す: { color: 色.橙, fontSize: 14, fontWeight: 'bold' },
  窓の外: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  流し: { flex: 1, width: '100%' },
  流しの中: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  箱: { width: '100%', maxWidth: 420, backgroundColor: 色.白, borderRadius: 14, padding: 18 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10, textAlign: 'center' },
  説明: { fontSize: 14, color: 色.文字_二, lineHeight: 20, marginBottom: 12 },
  宛先: { fontSize: 15, color: 色.文字, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  知らせ: { fontSize: 13, color: 色.青, lineHeight: 19, marginBottom: 4 },
  難点: { fontSize: 13, color: 色.赤, lineHeight: 19, marginBottom: 4 },
  注: { fontSize: 12, color: 色.灰, lineHeight: 18, marginTop: 12 },
  ボタン: { backgroundColor: 色.青, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  二番目: { backgroundColor: 色.白, borderWidth: 1.5, borderColor: 色.青 },
  作業中: { opacity: 0.5 },
  ボタンの字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  二番目の字: { color: 色.青 },
  出る: { paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  出るの字: { color: 色.文字_二, fontSize: 14 },
});

module.exports = { MailKakuninScreen, 確認の帯 };
