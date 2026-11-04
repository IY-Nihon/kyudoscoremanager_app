'use strict';

/**
 * 「全員の個人IDを新しくする」の窓（設定。2026-11-04 本人）。
 *
 * 管理者モードにしなくても使える。押したときに団体のパスワードを聞き（管理者モードと同じ verifyGroupPassword）、
 * 通ったら新しくして、名前と新しい ID の一覧をその場で出す（写せる）。メンバーのタブの ID の表示は今までどおり管理者モードだけ。
 *
 *   4 桁の人だけ替える … まだ 4 桁の人を 6 字にする（12/3 からは 4 桁では入れない）
 *   6 字の人も替える … 全員を替える（前の版では部員の端末から全員の個人ID が見えたので、漏れた ID を配り直す）
 * 替えた人の前の ID はその場で使えなくなる（ログインしている端末はそのまま。4 桁でログインしている端末は 12/3 から入り直し）
 */

const React = require('react');
const { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const { useScoreStore } = require('./useScoreStore');
const 個人ID = require('./kojinId');

const 終わりの日 = () => `${Number(個人ID.古い形を使える終わり.slice(5, 7))}月${Number(個人ID.古い形を使える終わり.slice(8, 10))}日`;

/** 一覧を写す（端末の写す機能。無ければ何もしない） */
async function 写す(字) {
  try {
    await require('expo-clipboard').setStringAsync(字);
    return true;
  } catch {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(字);
        return true;
      }
    } catch {
      /* 写せなくても一覧は画面に出ている */
    }
    return false;
  }
}

/** 一覧の字（写す・画面に出す） */
const 一覧の字 = (振った) => 振った.map((人) => `${人.名前 || '（名前なし）'}：${人.個人ID}`).join('\n');

const 個人IDを新しくする窓 = ({ 見える, 閉じる }) => {
  const 個人IDの表 = useScoreStore((状態) => 状態.個人IDの表 || {});
  const 四桁の人がいる = Object.values(個人IDの表).some((id) => 個人ID.古い形.test(String(id || '')));
  const [全員, 全員を置く] = React.useState(false);
  const [合言葉, 合言葉を置く] = React.useState('');
  const [作業中, 作業中を置く] = React.useState(false);
  const [難点, 難点を置く] = React.useState('');
  const [振った, 振ったを置く] = React.useState(null);
  const [写した, 写したを置く] = React.useState(false);

  React.useEffect(() => {
    if (!見える) return;
    // 開くたびに初めから。4 桁の人がいなければ「6 字の人も替える」を選んでおく
    全員を置く(!四桁の人がいる);
    合言葉を置く('');
    難点を置く('');
    振ったを置く(null);
    写したを置く(false);
  }, [見える]);

  const 新しくする = async () => {
    if (作業中) return;
    if (!合言葉) {
      難点を置く('団体のパスワードを入れてください');
      return;
    }
    作業中を置く(true);
    難点を置く('');
    try {
      const 店 = useScoreStore.getState();
      if (!店.isNetworkOnline) throw new Error('電波の良い場所でお試しください');
      if (!(await 店.verifyGroupPassword(合言葉))) throw new Error('パスワードが正しくありません');
      const 結果 = await 店.ensurePersonalIds(true, 全員);
      振ったを置く(Array.isArray(結果) ? 結果 : []);
      合言葉を置く('');
    } catch (誤り) {
      難点を置く(String((誤り && 誤り.message) || '新しくできませんでした。時間を置いてもう一度お試しください'));
    } finally {
      作業中を置く(false);
    }
  };

  return (
    <Modal visible={!!見える} transparent animationType="fade" onRequestClose={閉じる}>
      <View style={styles.外}>
        <ScrollView style={styles.流し} contentContainerStyle={styles.流しの中} keyboardShouldPersistTaps="handled">
          <View style={styles.箱} testID="個人IDを新しくする窓">
            <Text style={styles.見出し}>全員の個人IDを新しくする</Text>
            {振った === null ? (
              <>
                <Text style={styles.説明}>
                  {`個人IDを、大文字と数字の 6 字（例 K7MP3X）に替えます。前の ID は、すぐに使えなくなります（ログインしたままの端末はそのまま使えますが、4 桁の ID でログインしている端末は${終わりの日()}から入り直しが必要です）。替えたら、出てくる一覧で各自の新しい ID を伝えてください。`}
                </Text>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: !全員 }}
                  style={[styles.選び, !全員 && styles.選んだ, !四桁の人がいる && styles.使えない]}
                  disabled={!四桁の人がいる}
                  onPress={() => 全員を置く(false)}
                >
                  <Text style={styles.選びの字}>
                    {四桁の人がいる ? '4 桁の人だけ替える' : '4 桁の人だけ替える（4 桁の人はいません）'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: 全員 }}
                  style={[styles.選び, 全員 && styles.選んだ]}
                  onPress={() => 全員を置く(true)}
                >
                  <Text style={styles.選びの字}>6 字の人も替える（全員）</Text>
                  <Text style={styles.選びの注}>前の版では、部員の端末からほかの人の個人IDが見えました。念のため配り直すときはこちら</Text>
                </Pressable>
                <Text style={styles.ラベル}>団体のパスワード</Text>
                <TextInput
                  testID="個人IDの窓のパスワード"
                  accessibilityLabel="団体のパスワード"
                  style={styles.欄}
                  value={合言葉}
                  onChangeText={(値) => {
                    合言葉を置く(値);
                    if (難点) 難点を置く('');
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={新しくする}
                />
                {難点 ? <Text style={styles.難点}>{難点}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  style={[styles.ボタン, 作業中 && styles.作業中]}
                  disabled={作業中}
                  onPress={新しくする}
                >
                  <Text style={styles.ボタンの字}>{作業中 ? '新しくしています…' : '新しくする'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.やめる} onPress={閉じる} disabled={作業中}>
                  <Text style={styles.やめるの字}>やめる</Text>
                </Pressable>
              </>
            ) : 振った.length === 0 ? (
              <>
                <Text style={styles.説明}>
                  替える人はいませんでした（全員がもう 6 字の ID です）。全員を替えるときは「6 字の人も替える」を選んでください。
                </Text>
                <Pressable accessibilityRole="button" style={styles.ボタン} onPress={閉じる}>
                  <Text style={styles.ボタンの字}>閉じる</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.説明}>
                  {`${振った.length} 人の個人IDを新しくしました。各自に新しい ID を伝えてください（この一覧は閉じると出ません。メンバーのタブでも管理者モードで見られます）。`}
                </Text>
                <View style={styles.一覧} testID="新しい個人IDの一覧">
                  {振った.map((人) => (
                    <View key={人.id} style={styles.一覧の行}>
                      <Text style={styles.一覧の名}>{人.名前 || '（名前なし）'}</Text>
                      <Text style={styles.一覧のID} selectable>
                        {人.個人ID}
                      </Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={styles.ボタン}
                  onPress={async () => 写したを置く(await 写す(一覧の字(振った)))}
                >
                  <Text style={styles.ボタンの字}>{写した ? '写しました' : '一覧を写す'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.やめる} onPress={閉じる}>
                  <Text style={styles.やめるの字}>閉じる</Text>
                </Pressable>
              </>
            )}
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
  箱: { width: '100%', maxWidth: 440, backgroundColor: 色.白, borderRadius: 14, padding: 18 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10, textAlign: 'center' },
  説明: { fontSize: 14, color: 色.文字_二, lineHeight: 20, marginBottom: 12 },
  選び: { borderWidth: 1.5, borderColor: 色.地_濃い, borderRadius: 10, padding: 12, marginBottom: 8 },
  選んだ: { borderColor: 色.青, backgroundColor: 色.地 },
  使えない: { opacity: 0.5 },
  選びの字: { fontSize: 15, color: 色.文字, fontWeight: '600' },
  選びの注: { fontSize: 12, color: 色.灰, lineHeight: 17, marginTop: 4 },
  ラベル: { fontSize: 13, color: 色.文字_二, marginBottom: 4, marginTop: 8 },
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
  ボタン: { backgroundColor: 色.青, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  作業中: { backgroundColor: 色.灰 },
  ボタンの字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  やめる: { paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  やめるの字: { color: 色.文字_二, fontSize: 14 },
  一覧: { borderWidth: 1, borderColor: 色.地_濃い, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  一覧の行: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 色.地_濃い,
  },
  一覧の名: { fontSize: 15, color: 色.文字, flex: 1 },
  一覧のID: { fontSize: 16, color: 色.文字, fontWeight: 'bold', letterSpacing: 1 },
});

module.exports = { 個人IDを新しくする窓, 一覧の字 };
