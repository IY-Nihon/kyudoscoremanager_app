'use strict';

/**
 * 部員の役の窓（2026-11-19 本人。11/13・11/14 の案：役を選ぶだけ → 質問に答えて作る → 文で確かめる）。
 * 設定の「部員の役」（団体の口座で管理者モードのとき）から開く。
 *
 * 段：
 *   一覧 … 役の札（名前・人数・できること）。押すと 直す。「役を作る」で 作る
 *   直す … 名前と、部品ごとの問い（はい・いいえ）。下に「この役の人は、…」の文。保存・（作った役は）消す
 * 割り当ては、メンバーの編集の中（src/MemberScreen.js の 役を選ぶ欄）。中身の決まりは src/yaku.js、書くのは src/storeYaku.js。
 */

const React = require('react');
const { View, Text, TextInput, Pressable, Modal, StyleSheet, ScrollView, Switch } = require('./rn');
const { 色 } = require('./iro');
const { IS_WEB } = require('./IS_WEB');
const 役の決まり = require('./yaku');
const { useScoreStore } = require('./useScoreStore');

function ボタン({ 字, 押す, 主 = false, 危ない = false, testID }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={押す}
      style={({ hovered }) => [
        形.ボタン,
        主
          ? { backgroundColor: hovered ? 色.青_濃い : 色.青 }
          : { backgroundColor: hovered ? 色.地_濃い : 色.地 },
        IS_WEB && { cursor: 'pointer' },
      ]}
    >
      <Text style={[形.ボタンの字, { color: 主 ? 色.白 : 危ない ? 色.赤 : 色.青 }]}>{字}</Text>
    </Pressable>
  );
}

/**
 * @param {{見える: boolean, 閉じる: Function}} props
 */
function YakuModal({ 見える, 閉じる }) {
  const 役の設定 = useScoreStore((状態) => 状態.役の設定);
  const members = useScoreStore((状態) => 状態.members);
  const [直す役, 直す役を置く] = React.useState(null); // null＝一覧、{id?, 名, 部品}＝直す
  const [誤り, 誤りを置く] = React.useState('');

  React.useEffect(() => {
    if (!見える) {
      直す役を置く(null);
      誤りを置く('');
    }
  }, [見える]);

  const 一覧 = 役の決まり.役の一覧(役の設定);
  const 人数 = (id) =>
    (members || []).filter((人) => 人 && 人.id && 役の決まり.役を引く(役の設定, 人.id) === id).length;

  const 開く = (役) => {
    誤りを置く('');
    直す役を置く(
      役 ? { id: 役.id, 名: 役.名, 部品: [...役.部品], 最初から: 役.最初から } : { 名: '', 部品: ['付ける'] }
    );
  };
  const 部品を切り替える = (鍵, 入れる) =>
    直す役を置く((前) => ({
      ...前,
      部品: 役の決まり.部品の鍵.filter((一つ) => (一つ === 鍵 ? 入れる : 前.部品.includes(一つ))),
    }));
  const 保存する = () => {
    const 答え = useScoreStore.getState().役を置く({ id: 直す役.id, 名: 直す役.名, 部品: 直す役.部品 });
    if (答え.誤り) return 誤りを置く(答え.誤り);
    直す役を置く(null);
  };
  const 消す = () => {
    const 答え = useScoreStore.getState().役を消す(直す役.id);
    if (答え.誤り) return 誤りを置く(答え.誤り);
    直す役を置く(null);
  };

  let 中身;
  if (!直す役) {
    中身 = (
      <>
        <Text style={形.題}>部員の役</Text>
        <Text style={形.文}>
          個人ログインのメンバーが、何をできるかを決めます。役はメンバーの編集で選びます。役の無い人は「
          {役の決まり.役の中身(役の設定, 役の決まり.既定の役).名}」です。
        </Text>
        <ScrollView style={{ maxHeight: 420 }}>
          {一覧.map((役) => (
            <Pressable
              key={役.id}
              testID={`役の札-${役.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${役.名}を直す`}
              onPress={() => 開く(役)}
              style={({ hovered }) => [形.札, hovered && { backgroundColor: 色.地_F7F7FA }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Text style={形.札の名}>{役.名}</Text>
                <Text style={形.札の数}>{`${人数(役.id)} 人`}</Text>
              </View>
              <Text style={形.札の文}>{役の決まり.役の短い文(役.部品)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={形.ボタンの列}>
          <ボタン 字="閉じる" 押す={閉じる} />
          {一覧.length < 役の決まり.役の数の上限 ? (
            <ボタン 字="役を作る" 押す={() => 開く(null)} 主 testID="役を作る" />
          ) : null}
        </View>
      </>
    );
  } else {
    中身 = (
      <>
        <Text style={形.題}>{直す役.id ? '役を直す' : '役を作る'}</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          <Text style={形.欄の名}>役の名前</Text>
          <TextInput
            aria-label="役の名前"
            accessibilityLabel="役の名前"
            placeholder="例：出欠の係"
            placeholderTextColor={色.灰_薄い}
            style={形.入れ物}
            value={直す役.名}
            onChangeText={(字) => 直す役を置く((前) => ({ ...前, 名: 字 }))}
            maxLength={役の決まり.役の名の長さ + 5}
          />
          {役の決まり.部品の一覧.map((部品) => (
            <View key={部品.鍵} style={形.問い}>
              <Text style={形.問いの字}>{部品.名}</Text>
              <Switch
                testID={`役の部品-${部品.鍵}`}
                accessibilityLabel={部品.名}
                value={直す役.部品.includes(部品.鍵)}
                onValueChange={(入れる) => 部品を切り替える(部品.鍵, 入れる)}
                trackColor={{ false: 色.灰_明るい, true: 色.青 }}
              />
            </View>
          ))}
          {直す役.id && !直す役.最初から ? (
            <Pressable
              accessibilityRole="button"
              testID="役を消す"
              onPress={消す}
              style={[{ alignSelf: 'flex-start', paddingVertical: 8 }, IS_WEB && { cursor: 'pointer' }]}
            >
              <Text style={{ fontSize: 14, color: 色.赤 }}>
                この役を消す（この役の人は「部員（自分）」に戻ります）
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
        {/* 文で確かめる（11/13 本人）。問いを流しても、いつも見えるように流す範囲の外に置く */}
        <View style={形.箱} testID="役の文">
          <Text style={形.箱の字}>{役の決まり.役の文(直す役.部品)}</Text>
        </View>
        {誤り ? (
          <Text style={形.誤り} testID="役の誤り">
            {誤り}
          </Text>
        ) : null}
        <View style={形.ボタンの列}>
          <ボタン 字="戻る" 押す={() => 直す役を置く(null)} />
          <ボタン 字="保存" 押す={保存する} 主 testID="役を保存" />
        </View>
      </>
    );
  }

  return (
    <Modal
      visible={見える}
      transparent
      animationType="fade"
      onRequestClose={直す役 ? () => 直す役を置く(null) : 閉じる}
    >
      <View style={形.地}>
        <View style={形.窓} testID="部員の役の窓">
          {中身}
        </View>
      </View>
    </Modal>
  );
}

/**
 * メンバーの編集の中の「役」の欄（2026-11-19 本人：役はメンバーの編集の中で割り当てる）。
 * 団体の口座で管理者モードのときだけ出す（呼ぶ側で 役を決める を見る）。押すとすぐ割り当てる
 */
function 役を選ぶ欄({ 部員id }) {
  const 役の設定 = useScoreStore((状態) => 状態.役の設定);
  const [誤り, 誤りを置く] = React.useState('');
  const 今の役 = 役の決まり.役を引く(役の設定, 部員id);
  return (
    <View testID="役を選ぶ欄" style={{ marginTop: 12 }}>
      <Text style={形.欄の名}>役（個人ログインでできること）</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {役の決まり.役の一覧(役の設定).map((役) => {
          const 選んだ = 役.id === 今の役;
          return (
            <Pressable
              key={役.id}
              testID={`役を選ぶ-${役.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: 選んだ }}
              aria-pressed={選んだ}
              onPress={() => {
                const 答え = useScoreStore.getState().役を割り当てる(部員id, 役.id);
                誤りを置く(答え.誤り || '');
              }}
              style={({ hovered }) => [
                形.選ぶ札,
                選んだ ? 形.選んだ札 : hovered && { backgroundColor: 色.地_濃い },
                IS_WEB && { cursor: 'pointer' },
              ]}
            >
              <Text style={[形.選ぶ札の字, 選んだ && { color: 色.白 }]}>{役.名}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={形.札の文}>{役の決まり.役の短い文(役の決まり.役の中身(役の設定, 今の役).部品)}</Text>
      {誤り ? <Text style={形.誤り}>{誤り}</Text> : null}
    </View>
  );
}

const 形 = StyleSheet.create({
  選ぶ札: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 色.地 },
  選んだ札: { backgroundColor: 色.青 },
  選ぶ札の字: { fontSize: 14, color: 色.文字 },
  地: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  窓: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: 色.白,
    borderRadius: 16,
    padding: 20,
  },
  題: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10 },
  文: { fontSize: 14, color: 色.文字_二, lineHeight: 21, marginBottom: 12 },
  札: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 色.区切り,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  札の名: { fontSize: 16, fontWeight: 'bold', color: 色.文字, marginRight: 8 },
  札の数: { fontSize: 13, color: 色.灰 },
  札の文: { fontSize: 13, color: 色.文字_二, marginTop: 4, lineHeight: 19 },
  欄の名: { fontSize: 13, color: 色.灰, marginBottom: 4 },
  入れ物: {
    height: 44,
    borderWidth: 1,
    borderColor: 色.地_濃い,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: 色.文字,
    marginBottom: 8,
  },
  問い: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 色.区切り,
  },
  問いの字: { fontSize: 15, color: 色.文字, flex: 1, paddingRight: 8 },
  箱: { backgroundColor: 色.地, borderRadius: 10, padding: 12, marginTop: 12, marginBottom: 4 },
  箱の字: { fontSize: 13, color: 色.文字, lineHeight: 20 },
  誤り: { fontSize: 13, color: 色.赤, marginTop: 8 },
  ボタンの列: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  ボタン: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  ボタンの字: { fontSize: 15, fontWeight: '600' },
});

module.exports = { YakuModal, 役を選ぶ欄 };
