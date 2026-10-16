'use strict';

/**
 * 設定の「区分」の欄（団体ログインのとき）。区分の名前を足す・直す・消す・並べ替える。
 *
 * 1 行に 1 区分の縦の並びにし、各行の「↑」「↓」で 1 つずつ動かす。指で引いて動かす形は使わない
 * （RN-web では動いてから掴むと掴めない・字が選ばれることがある。並べ替えは本人が「欲しい」と決めた。2026-10-16）。
 * 並び順がそのまま、メンバーの編集の札・一覧の見出し・絞り込み・人を選ぶ窓の組の順になる。
 * 決まりは src/kubun.js、雲へ書くのは店（区分を足す など）。
 */
const React = require('react');
const { Text, View, Pressable, TextInput, Alert, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const Icons = require('@expo/vector-icons');
const { IS_WEB } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
const 区 = require('./kubun');
const 学 = require('./gakunen');

/** 押せる小さなボタン（↑・↓・✕・✓） */
function 小さなボタン({ 名前, 絵, 色: 絵の色, 押す, 止める }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-label={名前}
      onPress={止める ? undefined : 押す}
      style={({ hovered }) => [
        styles.小さなボタン,
        hovered && !止める && { backgroundColor: 色.地_濃い },
        止める && { opacity: 0.3 },
        IS_WEB && !止める && { cursor: 'pointer' },
      ]}
    >
      <Icons.Ionicons name={絵} size={18} color={絵の色 || 色.青} />
    </Pressable>
  );
}

/**
 * 名前を並べて、足す・直す・↑↓で並べ替える・消す欄（区分と、自分で決める学年で使う）。
 * 項目たち … [{ 鍵, 名前 }]。足す・直すは、断るとき（空・同じ名前）に画面へ出す文を返す。
 * 何 … 「区分」「学年」。読み上げの名前（「区分の名前」「足す区分の名前」）に使う
 */
function 並べる一覧({
  testID,
  何,
  題,
  注,
  絵,
  絵の色,
  例,
  初めの例,
  上限,
  項目たち,
  足す,
  直す,
  動かす,
  消す,
}) {
  const [足す名前, 足す名前を置く] = React.useState('');
  const [直す鍵, 直す鍵を置く] = React.useState(null);
  const [直す名前, 直す名前を置く] = React.useState('');
  const [誤り, 誤りを置く] = React.useState('');

  const 足し終える = () => {
    const 断り = 足す(足す名前);
    if (断り) return void 誤りを置く(断り);
    足す名前を置く('');
    誤りを置く('');
  };
  const 直し始める = (項目) => {
    直す鍵を置く(項目.鍵);
    直す名前を置く(項目.名前);
    誤りを置く('');
  };
  const 直し終える = () => {
    const 断り = 直す(直す鍵, 直す名前);
    if (断り) return void 誤りを置く(断り);
    直す鍵を置く(null);
    誤りを置く('');
  };

  return (
    <View style={styles.枠} testID={testID}>
      <View style={styles.頭}>
        <Icons.Ionicons name={絵} size={22} color={絵の色} style={{ width: 24, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.題}>{題}</Text>
          <Text style={styles.注}>{注}</Text>
        </View>
      </View>
      {項目たち.map((項目, 番) =>
        直す鍵 === 項目.鍵 ? (
          <View key={項目.鍵} style={styles.行}>
            <TextInput
              aria-label={`${何}の名前`}
              style={[styles.入力, { flex: 1 }]}
              value={直す名前}
              onChangeText={直す名前を置く}
              onSubmitEditing={直し終える}
              maxLength={上限}
              autoFocus
            />
            <小さなボタン 名前="名前を決める" 絵="checkmark" 押す={直し終える} />
            <小さなボタン
              名前="直すのをやめる"
              絵="close"
              色={色.灰}
              押す={() => (直す鍵を置く(null), 誤りを置く(''))}
            />
          </View>
        ) : (
          <View key={項目.鍵} style={styles.行}>
            <Pressable
              accessibilityRole="button"
              aria-label={`${項目.名前} の名前を直す`}
              onPress={() => 直し始める(項目)}
              style={({ hovered }) => [
                styles.名前の枠,
                hovered && { opacity: 0.6 },
                IS_WEB && { cursor: 'pointer' },
              ]}
            >
              <Text style={styles.名前} numberOfLines={1}>
                {項目.名前}
              </Text>
            </Pressable>
            <小さなボタン
              名前={`${項目.名前} を上へ`}
              絵="arrow-up"
              止める={0 === 番}
              押す={() => 動かす(項目.鍵, -1)}
            />
            <小さなボタン
              名前={`${項目.名前} を下へ`}
              絵="arrow-down"
              止める={番 === 項目たち.length - 1}
              押す={() => 動かす(項目.鍵, 1)}
            />
            <小さなボタン 名前={`${項目.名前} を消す`} 絵="close" 色={色.赤} 押す={() => 消す(項目)} />
          </View>
        )
      )}
      <View style={[styles.行, { borderBottomWidth: 0 }]}>
        <TextInput
          aria-label={`足す${何}の名前`}
          style={[styles.入力, { flex: 1 }]}
          placeholder={項目たち.length ? 例 : 初めの例}
          placeholderTextColor={色.灰_薄い}
          value={足す名前}
          onChangeText={(文) => (足す名前を置く(文), 誤りを置く(''))}
          onSubmitEditing={足し終える}
          maxLength={上限}
        />
        <Pressable
          accessibilityRole="button"
          onPress={足し終える}
          style={({ hovered }) => [
            styles.足す,
            hovered && { backgroundColor: 色.青_濃い },
            IS_WEB && { cursor: 'pointer' },
          ]}
        >
          <Text style={styles.足すの字}>足す</Text>
        </Pressable>
      </View>
      {誤り ? <Text style={styles.誤り}>{誤り}</Text> : null}
    </View>
  );
}

function 区分の設定() {
  const 区分たち = useScoreStore((状態) => 状態.divisions) || [];
  const 店 = () => useScoreStore.getState();
  return (
    <並べる一覧
      testID="区分の設定"
      何="区分"
      題="区分"
      注="メンバーの編集で付けます（いくつでも）。この順に並びます"
      絵="pricetags-outline"
      絵の色={色.緑}
      例="例: Aチーム"
      初めの例="例: 一般・学生・少年 を 1 つずつ"
      上限={区.名前の上限}
      項目たち={区分たち.map((区分) => ({ 鍵: 区分.id, 名前: 区分.name }))}
      足す={(名前) => 店().区分を足す(名前)}
      直す={(鍵, 名前) => 店().区分の名前を直す(鍵, 名前)}
      動かす={(鍵, 向き) => 店().区分を動かす(鍵, 向き)}
      消す={(項目) =>
        Alert.alert(
          '区分を消す',
          `「${項目.名前}」を消しますか？付けていた人から外れます。記録は変わりません。`,
          [
            { text: 'やめる', style: 'cancel' },
            { text: '消す', style: 'destructive', onPress: () => 店().区分を消す(項目.鍵) },
          ]
        )
      }
    />
  );
}

/** 自分で決める団体の学年の並び（名前を直しても並べ替えても、その学年の人はそのまま） */
function 学年の並びの設定() {
  const 学年たち = useScoreStore((状態) => 状態.customGrades) || [];
  const 人数 = useScoreStore((状態) => 状態.members) || [];
  const 店 = () => useScoreStore.getState();
  return (
    <並べる一覧
      testID="学年の並びの設定"
      何="学年"
      題="学年の並び"
      注="上から順に進級します。メンバーの編集で選びます"
      絵="list-outline"
      絵の色={色.紫}
      例="例: 上級"
      初めの例="例: 初級・中級・上級 を 1 つずつ"
      上限={8}
      項目たち={学.自分の学年たち(学年たち).map((学年) => ({ 鍵: 学年.value, 名前: 学年.name }))}
      足す={(名前) => 店().学年を足す(名前)}
      直す={(鍵, 名前) => 店().学年の名前を直す(鍵, 名前)}
      動かす={(鍵, 向き) => 店().学年を動かす(鍵, 向き)}
      消す={(項目) => {
        const 数 = 人数.filter((部員) => 学.現役か(部員) && 項目.鍵 === 学.学年の値(部員)).length;
        Alert.alert(
          '学年を消す',
          `「${項目.名前}」を消しますか？` + (数 ? `この学年の${数}人は「その他」になります。` : ''),
          [
            { text: 'やめる', style: 'cancel' },
            { text: '消す', style: 'destructive', onPress: () => 店().学年を消す(項目.鍵) },
          ]
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  枠: {
    marginLeft: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 色.区切り,
  },
  頭: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  題: { fontSize: 17, color: 色.黒 },
  注: { fontSize: 11, color: 色.灰, marginTop: 2 },
  行: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 色.区切り,
  },
  名前の枠: { flex: 1, paddingVertical: 6 },
  名前: { fontSize: 16, color: 色.文字 },
  小さなボタン: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  入力: {
    backgroundColor: 色.地,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    color: 色.黒,
    borderWidth: 1,
    borderColor: 色.地_濃い,
  },
  足す: { marginLeft: 6, backgroundColor: 色.青, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 16 },
  足すの字: { color: 色.白, fontSize: 15, fontWeight: 'bold' },
  誤り: { fontSize: 12, color: 色.赤, marginTop: 6 },
});

module.exports = { 区分の設定, 学年の並びの設定, 並べる一覧 };
