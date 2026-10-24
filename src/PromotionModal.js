'use strict';

/**
 * 進級の窓（年度の始まり）と、記録画面の「進級がまだです」の帯。
 *
 * 4 月 1 日を過ぎて最初に団体ログインで開いたときに出す（店の 進級待ちの年。src/gakunen.js の 進級待ちの年）。
 * 全員を 1 つ上げ、最後の学年は卒業にする。留年などで上げない人だけ名前を押して選ぶ（最後の学年なら卒業しない）。
 * 押されるまで全員の学年は前の年度のまま。「あとで」で閉じたら、記録画面の上に帯を出し続ける。
 * 押せるのは団体ログインの人なら誰でも（docs/plans/group-types-and-grades.md の「進級の窓」）。
 */
const React = require('react');
const { Text, View, Pressable, ScrollView, Modal, ActivityIndicator, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const 学 = require('./gakunen');
const { use団体の決まり } = require('./useGakunen');
const { IS_WEB } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');

/** 名簿を学年ごとの組にする（最後の学年から）。その他・卒業生・退部した人は入れない。決まりを省くと今の団体の決まり */
function 学年の組(部員たち, 決まりを渡す) {
  const 決まり = 決まりを渡す || 学.今の決まりを見る();
  const 在籍 = (部員たち || []).filter((部員) => 学.現役か(部員, 決まり) && !学.その他か(部員, 決まり));
  return [...決まり.在籍の学年]
    .reverse()
    .map((学年) => ({
      学年,
      // 何もしなければ卒業する学年か（ふつうは最後の学年。院生もいる部は 4 年と M2）
      最後: 決まり.卒業する学年.includes(学年),
      人たち: 在籍
        .filter((部員) => 学.学年の値(部員, 決まり) === 学年)
        .sort((甲, 乙) => (甲.name || '').localeCompare(乙.name || '', 'ja')),
    }))
    .filter((組) => 組.人たち.length);
}

/**
 * @param {{ 見える: boolean, 知らせる: (文: string) => void }} props
 */
function 進級の窓({ 見える, 知らせる }) {
  const 待ちの年 = useScoreStore((状態) => 状態.進級待ちの年);
  // 進級が済むと待ちの年は空になる。窓が消えていくあいだも題を「null年度」にしないよう、出していた年を覚えておく
  const 出した年 = React.useRef(待ちの年);
  if (待ちの年) 出した年.current = 待ちの年;
  const 年 = 出した年.current;
  const 部員たち = useScoreStore((状態) => 状態.members);
  const 決まり = use団体の決まり();
  const 名 = (学年) => 学.学年だけの名前(学年, 決まり);
  // 説明の 1 行目（「4年生は卒業」「4年生とM2は卒業」）
  const 卒業の説明 = 決まり.卒業する学年
    .map((学年) => 学.学年だけの名前(学年, 決まり, { 生: true }))
    .join('と');
  const 院へ進める = Object.keys(決まり.院へ).length > 0;
  const 組たち = React.useMemo(() => 学年の組(部員たち, 決まり), [部員たち, 決まり]);
  const その他の人数 = React.useMemo(
    () => (部員たち || []).filter((部員) => 学.その他か(部員, 決まり)).length,
    [部員たち, 決まり]
  );
  // 選んだこと（部員の id → '残す'（上げない・卒業しない）か '院へ'（院生もいる部の 4 年 → M1））
  const [選び, 選びを置く] = React.useState(() => new Map());
  // 開いている組（学年）。卒業する学年だけ初めから開く（卒業か残るかを確かめてほしいので）
  const [開いた組, 開いた組を置く] = React.useState(() => new Set());
  const [押した, 押したを置く] = React.useState(false);
  const [誤り, 誤りを置く] = React.useState('');
  React.useEffect(() => {
    if (!見える) return;
    選びを置く(new Map());
    開いた組を置く(new Set(決まり.卒業する学年));
    誤りを置く('');
  }, [見える, 決まり]);
  /** 押したときの次の選び（卒業する学年で院へ進めるなら 卒業 → 院へ → そのまま → 卒業） */
  const 次の選び = (部員, 今) => {
    const 順 = 学.院へ進む先(部員, 決まり) !== null ? [null, '院へ', '残す'] : [null, '残す'];
    return 順[(順.indexOf(今 || null) + 1) % 順.length];
  };
  const 選ぶ = (部員) => {
    const 次 = new Map(選び);
    const 選んだ = 次の選び(部員, 選び.get(部員.id));
    if (選んだ) {
      次.set(部員.id, 選んだ);
    } else {
      次.delete(部員.id);
    }
    選びを置く(次);
  };
  /** その人の札（「卒業」「M1へ」「4年のまま」「2年へ」） */
  const 札の字 = (部員, 学年, 卒業) => {
    const 今 = 選び.get(部員.id);
    if (今 === '残す') return `${名(学年)}のまま`;
    if (今 === '院へ') return `${名(学.院へ進む先(部員, 決まり))}へ`;
    if (卒業) return '卒業';
    const 次 = 学.次の学年の値(学年, 決まり);
    return 次 === null ? 'そのまま' : `${名(次)}へ`;
  };

  const 切り替える = (集まり, 置く, 鍵) => {
    const 次 = new Set(集まり);
    if (次.has(鍵)) {
      次.delete(鍵);
    } else {
      次.add(鍵);
    }
    置く(次);
  };
  const 後にする = () => useScoreStore.getState().進級の窓を後にする();
  const 進級する = async () => {
    if (押した) return;
    押したを置く(true);
    誤りを置く('');
    const 結果 = await useScoreStore.getState().進級する(Object.fromEntries(選び));
    押したを置く(false);
    if (結果.誤り) {
      誤りを置く(結果.誤り);
      return;
    }
    知らせる(結果.済んでいた ? 'ほかの端末で進級が済んでいました' : `${年}年度の進級を済ませました`);
  };

  return (
    <Modal visible={!!見える && !!待ちの年} transparent animationType="fade" onRequestClose={後にする}>
      <View style={styles.幕}>
        <View style={styles.窓} accessibilityViewIsModal aria-modal testID="進級の窓">
          <Text style={styles.題} accessibilityRole="header">{`${年}年度の進級`}</Text>
          <Text style={styles.説明}>
            {(卒業の説明
              ? `全員の学年を1つ上げ、${卒業の説明}は卒業にします。`
              : '全員の学年を1つ上げます。') +
              (院へ進める
                ? '\n院へ進む人・上げない人は、名前を押してください。'
                : '\n留年などで上げない人は、名前を押してください。')}
          </Text>
          <ScrollView style={styles.一覧} contentContainerStyle={{ paddingBottom: 4 }}>
            {組たち.map((組) => {
              const 開いた = 開いた組.has(組.学年);
              const 次 = 学.次の学年の値(組.学年, 決まり);
              const 行き先 = 組.最後 ? '卒業' : 次 === null ? 'そのまま' : 名(次);
              const 残す数 = 組.人たち.filter((部員) => 選び.get(部員.id) === '残す').length;
              const 院へ数 = 組.人たち.filter((部員) => 選び.get(部員.id) === '院へ').length;
              return (
                <View key={組.学年} style={styles.組}>
                  <Pressable
                    accessibilityRole="button"
                    aria-expanded={開いた}
                    onPress={() => 切り替える(開いた組, 開いた組を置く, 組.学年)}
                    style={({ hovered }) => [
                      styles.組の頭,
                      hovered && styles.触れた,
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                  >
                    <Text style={styles.組の題}>{`${名(組.学年)} → ${行き先}（${組.人たち.length}人）`}</Text>
                    {院へ数 ? <Text style={styles.院へ数}>{`${院へ数}人院へ`}</Text> : null}
                    {残す数 ? <Text style={styles.残す数}>{`${残す数}人そのまま`}</Text> : null}
                    <Text style={styles.開け閉め} aria-hidden>
                      {開いた ? '▲' : '▼'}
                    </Text>
                  </Pressable>
                  {開いた
                    ? 組.人たち.map((部員) => {
                        const そのまま = 選び.get(部員.id) === '残す';
                        const 院へ = 選び.get(部員.id) === '院へ';
                        const 札 = 札の字(部員, 組.学年, 組.最後);
                        return (
                          <Pressable
                            key={部員.id}
                            accessibilityRole="button"
                            aria-label={`${部員.name || ''} ${札}`}
                            onPress={() => 選ぶ(部員)}
                            style={({ hovered }) => [
                              styles.行,
                              hovered && styles.触れた,
                              IS_WEB && { cursor: 'pointer' },
                            ]}
                          >
                            <Text style={styles.名前} numberOfLines={1}>
                              {部員.name || '名前なし'}
                            </Text>
                            <View style={[styles.札, そのまま && styles.札_そのまま, 院へ && styles.札_院へ]}>
                              <Text
                                style={[
                                  styles.札の字,
                                  そのまま && styles.札の字_そのまま,
                                  院へ && styles.札の字_院へ,
                                ]}
                              >
                                {札}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })
                    : null}
                </View>
              );
            })}
            {!組たち.length ? <Text style={styles.注}>学年のある人がいません</Text> : null}
            {その他の人数 ? <Text style={styles.注}>{`その他の${その他の人数}人は変わりません`}</Text> : null}
          </ScrollView>
          {誤り ? <Text style={styles.誤り}>{誤り}</Text> : null}
          <View style={styles.ボタンの列}>
            <Pressable
              accessibilityRole="button"
              testID="進級-あとで"
              onPress={後にする}
              disabled={押した}
              style={({ hovered }) => [
                styles.ボタン,
                styles.あとで,
                hovered && styles.触れた,
                IS_WEB && { cursor: 'pointer' },
              ]}
            >
              <Text style={styles.あとでの字}>あとで</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              testID="進級-進級する"
              onPress={進級する}
              disabled={押した}
              style={({ hovered }) => [
                styles.ボタン,
                styles.進級する,
                hovered && { backgroundColor: 色.青_濃い },
                IS_WEB && { cursor: 'pointer' },
              ]}
            >
              {押した ? (
                <ActivityIndicator color={色.白} />
              ) : (
                <Text style={styles.進級するの字}>進級する</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 記録画面の上の帯。「あとで」で閉じたあとも、進級するまで出し続ける。押すと窓を開き直す
 * @param {{ 見える: boolean }} props
 */
function 進級待ちの帯({ 見える }) {
  const 年 = useScoreStore((状態) => 状態.進級待ちの年);
  if (!見える || !年) return null;
  return (
    <Pressable
      accessibilityRole="button"
      aria-label={`${年}年度の進級がまだです。進級の窓を開く`}
      testID="進級の帯"
      onPress={() => useScoreStore.setState({ 進級の窓を閉じた: false })}
      style={({ hovered }) => [
        styles.帯,
        hovered && { backgroundColor: 色.黄の地 },
        IS_WEB && { cursor: 'pointer' },
      ]}
    >
      <Text style={styles.帯の字} numberOfLines={1}>{`${年}年度の進級がまだです`}</Text>
      <Text style={styles.帯の押す字}>進級する ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  幕: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  窓: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: 色.白,
    borderRadius: 16,
    padding: 20,
  },
  題: { fontSize: 18, fontWeight: 'bold', color: 色.文字 },
  説明: { fontSize: 13, color: 色.灰_濃い, marginTop: 6, marginBottom: 12, lineHeight: 19 },
  一覧: { flexGrow: 0, flexShrink: 1 },
  組: { marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: 色.地_濃い, overflow: 'hidden' },
  組の頭: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 色.地_F7F7FA,
  },
  組の題: { flex: 1, fontSize: 14, fontWeight: 'bold', color: 色.文字 },
  残す数: { fontSize: 12, color: 色.橙_濃い, marginRight: 8 },
  開け閉め: { fontSize: 11, color: 色.灰 },
  行: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: 色.地_濃い,
  },
  触れた: { backgroundColor: 色.地_F0F0F5 },
  名前: { flex: 1, fontSize: 15, color: 色.文字, marginRight: 8 },
  札: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 色.灰_明るい,
    backgroundColor: 色.白,
  },
  札_そのまま: { borderColor: 色.橙, backgroundColor: 色.橙の地 },
  札_院へ: { borderColor: 色.青, backgroundColor: 色.青の地 },
  札の字_院へ: { color: 色.青, fontWeight: 'bold' },
  院へ数: { fontSize: 12, color: 色.青, marginRight: 8 },
  札の字: { fontSize: 13, color: 色.文字_二 },
  札の字_そのまま: { color: 色.橙_濃い, fontWeight: 'bold' },
  注: { fontSize: 12, color: 色.灰, marginTop: 4 },
  誤り: { fontSize: 13, color: 色.赤, marginTop: 8 },
  ボタンの列: { flexDirection: 'row', gap: 10, marginTop: 14 },
  ボタン: { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  あとで: { backgroundColor: 色.地 },
  あとでの字: { fontSize: 16, fontWeight: 'bold', color: 色.青 },
  進級する: { backgroundColor: 色.青 },
  進級するの字: { fontSize: 16, fontWeight: 'bold', color: 色.白 },
  帯: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 色.黄の地_3,
    borderBottomWidth: 1,
    borderBottomColor: 色.黄の地,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  帯の字: { flex: 1, fontSize: 13, color: 色.橙_濃い },
  帯の押す字: { fontSize: 13, fontWeight: 'bold', color: 色.橙_濃い, marginLeft: 8 },
});

module.exports = { 進級の窓, 進級待ちの帯, 学年の組 };
