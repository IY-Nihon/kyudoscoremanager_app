'use strict';

/**
 * 「団体のパスワードを変える」の窓（設定。2026-11-26 U1 本人「管理者モードでなくても出す」）。
 *
 * 今のパスワード・新しいパスワード・もう一度を入力して変える。入力漏れや誤りは欄の下の赤い字（U5 と同じ）。
 * 欄の確かめと誤りの訳は src/groupPassword.js、変えるのは店の changeGroupPassword（今のパスワードで確かめてから）。
 * 変えると、ほかの端末の団体アカウントはログインし直し（Firebase が切る）。管理者の合言葉は変わらない。
 * この端末の管理者モードは切れる（確かめでログインの時刻が変わり、中継の「管理者」の印が効かなくなるため）
 */

const React = require('react');
const { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const { useScoreStore } = require('./useScoreStore');
const 確 = require('./groupPassword');

const 欄の並び = [
  { 鍵: '今', 名: '今のパスワード', 自動: 'current-password' },
  { 鍵: '新しい', 名: `新しいパスワード（${確.最短}文字以上）`, 自動: 'new-password' },
  { 鍵: 'もう一度', 名: '新しいパスワード（もう一度）', 自動: 'new-password' },
];
const 空の字 = { 今: '', 新しい: '', もう一度: '' };

const 団体のパスワードを変える窓 = ({ 見える, 閉じる }) => {
  const [字, 字を置く] = React.useState(空の字);
  const [誤り, 誤りを置く] = React.useState({});
  const [全体の誤り, 全体の誤りを置く] = React.useState('');
  const [作業中, 作業中を置く] = React.useState(false);
  const [済んだ, 済んだを置く] = React.useState(false);
  const [管理者を切った, 管理者を切ったを置く] = React.useState(false);

  React.useEffect(() => {
    if (!見える) return;
    // 開くたびに初めから
    字を置く(空の字);
    誤りを置く({});
    全体の誤りを置く('');
    済んだを置く(false);
    管理者を切ったを置く(false);
  }, [見える]);

  const 変える = async () => {
    if (作業中) return;
    const 見つけた = 確.入れ替えを確かめる(字);
    誤りを置く(見つけた);
    全体の誤りを置く('');
    if (Object.keys(見つけた).length) return;
    const 店 = useScoreStore.getState();
    if (!店.isNetworkOnline) {
      全体の誤りを置く('通信できませんでした。電波の良い場所でもう一度お試しください');
      return;
    }
    作業中を置く(true);
    const 管理者だった = !!店.isAdminMode;
    try {
      await 店.changeGroupPassword(字.今, 字.新しい);
      管理者を切ったを置く(管理者だった);
      済んだを置く(true);
      字を置く(空の字);
    } catch (e) {
      const 訳 = 確.誤りの訳(e);
      if (訳.欄) 誤りを置く({ [訳.欄]: 訳.文 });
      else 全体の誤りを置く(訳.文);
    } finally {
      作業中を置く(false);
    }
  };

  return (
    <Modal visible={!!見える} transparent animationType="fade" onRequestClose={閉じる}>
      <View style={styles.外}>
        <ScrollView
          style={styles.流し}
          contentContainerStyle={styles.流しの中}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.箱} testID="団体のパスワードの窓">
            <Text style={styles.見出し}>団体のパスワードを変える</Text>
            {済んだ ? (
              <>
                <Text style={styles.説明} testID="団体のパスワードを変えた">
                  {'パスワードを変えました。ほかの端末で団体アカウントに入っている人は、ログインし直しになります（記録は残ります）。' +
                    (管理者を切った
                      ? 'この端末の管理者モードは切れたので、使うときは管理者の合言葉で入り直してください。'
                      : '')}
                </Text>
                <Pressable accessibilityRole="button" style={styles.ボタン} onPress={閉じる}>
                  <Text style={styles.ボタンの字}>閉じる</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.説明}>
                  変えると、ほかの端末で団体アカウントに入っている人はログインし直しになります（記録は残ります）。管理者の合言葉は変わりません。
                </Text>
                {欄の並び.map((欄) => (
                  <View key={欄.鍵}>
                    <Text style={styles.ラベル}>{欄.名}</Text>
                    <TextInput
                      testID={`団体のパスワード-${欄.鍵}`}
                      accessibilityLabel={欄.名}
                      aria-label={欄.名}
                      style={[styles.欄, 誤り[欄.鍵] ? styles.誤りの枠 : null]}
                      value={字[欄.鍵]}
                      onChangeText={(値) => {
                        字を置く((前) => ({ ...前, [欄.鍵]: 値 }));
                        // 字を入れ始めたら、その欄の知らせは消す
                        if (誤り[欄.鍵]) 誤りを置く((前) => ({ ...前, [欄.鍵]: null }));
                      }}
                      secureTextEntry
                      autoComplete={欄.自動}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!作業中}
                    />
                    {誤り[欄.鍵] ? (
                      <Text
                        style={styles.誤り}
                        testID={`入力の誤り-${欄.名}`}
                        accessibilityLiveRegion="polite"
                      >
                        {誤り[欄.鍵]}
                      </Text>
                    ) : null}
                  </View>
                ))}
                {全体の誤り ? (
                  <Text style={styles.誤り} accessibilityLiveRegion="polite">
                    {全体の誤り}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  testID="団体のパスワードを決める"
                  style={[styles.ボタン, 作業中 && styles.作業中]}
                  disabled={作業中}
                  onPress={変える}
                >
                  <Text style={styles.ボタンの字}>{作業中 ? '変えています…' : '変える'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.キャンセル}
                  onPress={閉じる}
                  disabled={作業中}
                >
                  <Text style={styles.キャンセルの字}>キャンセル</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// 「全員の個人IDを新しくする」の窓（src/KojinIdModal.js）と同じ形
const styles = StyleSheet.create({
  外: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  流し: { flex: 1, width: '100%' },
  流しの中: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  箱: { width: '100%', maxWidth: 440, backgroundColor: 色.白, borderRadius: 14, padding: 18 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10, textAlign: 'center' },
  説明: { fontSize: 14, color: 色.文字_二, lineHeight: 20, marginBottom: 4 },
  ラベル: { fontSize: 13, color: 色.文字_二, marginBottom: 4, marginTop: 10 },
  欄: {
    borderWidth: 1,
    borderColor: 色.地_濃い,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: 色.文字,
  },
  誤りの枠: { borderColor: 色.赤 },
  誤り: { fontSize: 13, color: 色.赤, lineHeight: 19, marginTop: 4 },
  ボタン: {
    backgroundColor: 色.青,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  作業中: { backgroundColor: 色.灰 },
  ボタンの字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  キャンセル: { paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  キャンセルの字: { color: 色.文字_二, fontSize: 14 },
});

module.exports = { 団体のパスワードを変える窓 };
