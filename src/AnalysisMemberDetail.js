'use strict';

const { 色: 基本色 } = require('./iro.js');
const React = require('react');
const { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } = require('./rn');

const { use入れ替える組 } = require('./useIrekae');
// 「自分が写っているか」の判定。履歴画面・案内の見本と同じものを使う
const { 学年でまとめる } = require('./syncRules');
// 「その射は誰のものか」の決まりは1か所に寄せてある（src/statsRules.js）
const 集 = require('./statsRules');
// 比較のひな型（よく見る組み合わせ）の決まり
const ひ = require('./comparePresets');
const { 出す } = require('./AppDialog');
const Icons = require('@expo/vector-icons');
const Svgの部品 = require('react-native-svg');
const Svg = require('react-native-svg').default ?? require('react-native-svg');
const { ArrowLocationView } = require('./ArrowLocationView');
// 見た目の決まりと部品は分析画面と同じ
const { styles } = require('./analysisStyles');
const { 型の節, 弓具の節, 比較の色たち, 立ちの結果の棒たち, 的の選び } = require('./analysisParts');

/**
 * 分析画面の「部員の詳細」の窓（2026-10-05 に AnalysisScreen.js から切り出した。動きは変えていない）。
 * 期間の成績・推移の図・ほかの部員との比較（ひな型も）・矢所・弓具の前後を出す。
 * 比較の相手を選んでいるか・ひな型の名前・閉じた学年と、窓の中だけの計算（詳細の成績・比較の成績・推移）は
 * この窓が持つ。期間や絞った記録、推移の数え方は分析画面から受け取る
 */
const 部員の詳細の窓 = ({
  比較のひな型を足す,
  比較のひな型を消す,
  いまの団体id,
  members,
  alumni,
  ひな型たち,
  compareMembers,
  setCompareMembers,
  狭い画面,
  goToHistoryRecord,
  gatherAllArrowLocations,
  期間の種類,
  詳細の部員,
  詳細の部員を置く,
  modalTargetType,
  setModalTargetType,
  selectedModalTrendLabel,
  setSelectedModalTrendLabel,
  絞った記録,
  推移を数える,
  推移の図,
  選択肢の帯,
  期間の成績,
  点の期間で絞る,
}) => {
  const [isSelectingCompareTarget, setIsSelectingCompareTarget] = React.useState(false);
  // ひな型に付ける名前。窓を閉じたら捨てる（書きかけを持ち越さない）
  const [ひな型の名前, ひな型の名前を置く] = React.useState('');
  // 比較する相手も学年でまとめる。記録表の人の選択と同じ形にしてある。
  // 覚えるのは「閉じた学年」。開く側を決め打ちすると、想定外の学年が
  // 閉じたまま出て、中の人に辿り着けなくなる
  const [閉じた学年, 学年を開け閉め] = use入れ替える組();
  // 個人の詳細を開いているときの、その人の成績
  const 詳細の期間の成績 = React.useMemo(
    () => (詳細の部員 ? 期間の成績(詳細の部員.id, selectedModalTrendLabel) : null),
    [詳細の部員, 絞った記録, selectedModalTrendLabel]
  );
  // 比較相手の成績。1〜4射目のマスごとに数え直すと、記録の数だけ何度も
  // 走って重くなる。相手が変わったときだけ数える
  const 比較の成績 = React.useMemo(() => {
    const 表 = new Map();
    const 記録たち = 点の期間で絞る(絞った記録, selectedModalTrendLabel);
    for (const 相手 of compareMembers)
      if (相手 && 相手.id) 表.set(相手.id, 集.成績を数える(記録たち, 相手.id));
    return 表;
  }, [compareMembers, 絞った記録, selectedModalTrendLabel]);
  const 詳細の推移 = React.useMemo(
    () => (詳細の部員 ? 推移を数える(詳細の部員.id) : []),
    [詳細の部員, 推移を数える]
  );
  const CompareGraph = ({ baseData, baseName, compareTargets, selectedLabel, onSelectLabel }) => {
    const COLORS = 比較の色たち;
    const allDataSets = [
      { name: baseName, data: baseData, color: 基本色.青, isBase: true },
      ...compareTargets.map((target, idx) => ({
        name: target.name,
        data: target.data,
        color: COLORS[idx % COLORS.length],
        isBase: false,
      })),
    ];
    const allLabels = Array.from(new Set(allDataSets.flatMap((set) => set.data.map((点) => 点.label)))).sort(
      (甲, 乙) => {
        // 'YYYY/MM' を new Date に渡すと、Safari（iPhone）では読めず NaN になり、
        // 比べる相手だけにある月が並びの外へ飛んだ。数字を取り出して比べる
        const 並びの値 = (ラベル) => {
          const 数 = String(ラベル).match(/\d+/g) || [];
          const 年 = Number(数[0]) || 0;
          const 月 = String(ラベル).includes('年度') ? 4 : Number(数[1]) || 1;
          const 日 = Number(数[2]) || 1;
          return 年 * 10000 + 月 * 100 + 日;
        };
        return 並びの値(甲) - 並びの値(乙);
      }
    );
    if (allLabels.length === 0) {
      return (
        <View style={styles.noDataGraph}>
          <Text style={{ color: 基本色.灰 }}>比較するデータがありません</Text>
        </View>
      );
    }
    const hHeight = 150;
    const paddingX = 25;
    const paddingY = 20;
    const usableHeight = 110;
    const usableWidth = 250;
    const datasetsWithPoints = allDataSets.map((dataset) => {
      const points = [];
      allLabels.forEach((label, idx) => {
        const xVal = paddingX + (idx / (allLabels.length > 1 ? allLabels.length - 1 : 1)) * usableWidth;
        const item = dataset.data.find((点) => 点.label === label);
        if (item) {
          points.push({
            x: xVal,
            y: hHeight - (paddingY + (item.rate / 100) * usableHeight),
            rate: item.rate,
            label,
          });
        }
      });
      let path = '';
      points.forEach((点, idx) => {
        path += idx === 0 ? `M ${点.x} ${点.y}` : ` L ${点.x} ${点.y}`;
      });
      return { ...dataset, points, path };
    });
    return (
      <View style={styles.graphContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <Text style={styles.graphTitle}>的中率推移の比較 (%)</Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              maxWidth: '75%',
              justifyContent: 'flex-end',
            }}
          >
            {datasetsWithPoints.map((組, idx) => (
              <View
                key={`legend-${idx}`}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}
              >
                <View
                  style={{ width: 8, height: 8, backgroundColor: 組.color, borderRadius: 4, marginRight: 4 }}
                />
                <Text style={{ fontSize: 9, color: 基本色.文字_二 }}>{組.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <Svg width="100%" height={hHeight} viewBox="0 0 300 150">
          {[0, 25, 50, 75, 100].map((目盛) => (
            <React.Fragment key={`grid-compare-${目盛}`}>
              <Svgの部品.Line
                x1={paddingX}
                y1={hHeight - (paddingY + (目盛 / 100) * usableHeight)}
                x2={280}
                y2={hHeight - (paddingY + (目盛 / 100) * usableHeight)}
                stroke={基本色.地_濃い}
                strokeWidth="1"
              />
              <Svgの部品.Text
                x={20}
                y={hHeight - (paddingY + (目盛 / 100) * usableHeight) + 3}
                fontSize="8"
                fill={基本色.灰}
                textAnchor="end"
              >
                {目盛}
              </Svgの部品.Text>
            </React.Fragment>
          ))}
          {datasetsWithPoints.map((組, idx) => (
            <Svgの部品.Path
              key={`path-${idx}`}
              d={組.path}
              fill="none"
              stroke={組.color}
              strokeWidth={組.isBase ? '2.5' : '2.0'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* 押した期間の目印。線が何本も重なるので、縦の帯で示す */}
          {selectedLabel && allLabels.indexOf(selectedLabel) >= 0 ? (
            <Svgの部品.Line
              x1={
                paddingX +
                (allLabels.indexOf(selectedLabel) / (allLabels.length > 1 ? allLabels.length - 1 : 1)) *
                  usableWidth
              }
              y1={hHeight - paddingY - usableHeight}
              x2={
                paddingX +
                (allLabels.indexOf(selectedLabel) / (allLabels.length > 1 ? allLabels.length - 1 : 1)) *
                  usableWidth
              }
              y2={hHeight - paddingY}
              stroke={基本色.橙}
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ) : null}
          {datasetsWithPoints.flatMap((組, dsIdx) =>
            組.points.map((点, idx) => (
              <Svgの部品.Circle
                key={`pt-${dsIdx}-${idx}`}
                cx={点.x}
                cy={点.y}
                // 選んでいる期間の点は大きくする。押せることが伝わるよう、
                // 押す的も見た目より広く取る（下の透明な丸）
                r={点.label === selectedLabel ? (組.isBase ? '5.5' : '5.0') : 組.isBase ? '3.5' : '3.0'}
                fill={組.color}
                onPress={() => onSelectLabel && onSelectLabel(点.label === selectedLabel ? null : 点.label)}
              />
            ))
          )}
          {/* 指で押しやすいよう、見えない広い的を重ねる（本人の線のぶんだけ） */}
          {(datasetsWithPoints[0] ? datasetsWithPoints[0].points : []).map((点, idx) => (
            <Svgの部品.Circle
              key={`hit-${idx}`}
              cx={点.x}
              cy={点.y}
              r="11"
              fill="transparent"
              onPress={() => onSelectLabel && onSelectLabel(点.label === selectedLabel ? null : 点.label)}
            />
          ))}
        </Svg>
      </View>
    );
  };
  return (
    <>
      <Modal
        visible={!!詳細の部員}
        transparent
        animationType="fade"
        // 見るだけの窓。端末の戻るでも、外を押しても閉じる
        onRequestClose={() => 詳細の部員を置く(null)}
      >
        <View style={styles.modalOverlay}>
          {/* 外側。押したら閉じる。中身より下に敷く */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            accessibilityLabel="閉じる"
            onPress={() => 詳細の部員を置く(null)}
          />
          <View // 背景の板より上に置く。置かないと、板が中身の押すを横取りする
            style={[styles.modalContent, { maxHeight: '85%', zIndex: 1 }]}
          >
            {詳細の部員 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {compareMembers.length > 0 ? (
                  <Text style={styles.modalTitle}>
                    {詳細の部員.name}
                    {' vs '}
                    {compareMembers.map((相手) => 相手.name).join(', ')}
                    {' の比較'}
                  </Text>
                ) : (
                  <Text style={styles.modalTitle}>{詳細の部員.name}の分析詳細</Text>
                )}
                {compareMembers.length > 0 ? (
                  <View>
                    <Text style={styles.modalDesc}>
                      {期間の種類}
                      {' の的中成績比較'}
                    </Text>
                    {/* 全体の的中率を、比べている人ぶんまとめて出す。 */
                    /* これまでは本人の分しか出ておらず、相手の全体の */
                    /* 的中率はランキングへ戻らないと見られなかった */}
                    <View style={styles.比較の的中率}>
                      {[
                        {
                          // 本人もグラフで押した点の期間にそろえる（相手だけ期間の成績になっていた）
                          名: 詳細の部員.name,
                          hits: (詳細の期間の成績 || 詳細の部員).hits,
                          shots: (詳細の期間の成績 || 詳細の部員).shots,
                          rate: (詳細の期間の成績 || 詳細の部員).rate,
                        },
                        ...compareMembers.map((相手) => {
                          const 成績 = 比較の成績.get(相手.id) || {};
                          const 中 = 成績.hits ?? 成績.的中 ?? 0;
                          const 射 = 成績.shots ?? 成績.射数 ?? 0;
                          return { 名: 相手.name, hits: 中, shots: 射, rate: 射 > 0 ? (中 / 射) * 100 : 0 };
                        }),
                      ].map((行, 番) => (
                        <View key={`全体-${行.名}-${番}`} style={styles.比較の的中率の行}>
                          <Text
                            style={[
                              styles.比較の的中率の名,
                              { color: 比較の色たち[番 % 比較の色たち.length] },
                            ]}
                            numberOfLines={1}
                          >
                            {行.名}
                          </Text>
                          <Text style={styles.比較の的中率の数}>{行.rate.toFixed(1)}%</Text>
                          <Text style={styles.比較の的中率の内訳}>
                            {行.hits}/{行.shots}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.modalDesc}>
                    {期間の種類}の成績 ({詳細の部員.hits}/{詳細の部員.shots}
                    {') '}
                    {詳細の部員.rate.toFixed(1)}%
                  </Text>
                )}
                <View style={{ marginVertical: 12 }}>
                  {compareMembers.length > 0 ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setCompareMembers([]);
                          setIsSelectingCompareTarget(false);
                        }}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: 基本色.地_濃い,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: 基本色.灰, fontSize: 13, fontWeight: 'bold' }}>
                          比較をすべて解除
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setIsSelectingCompareTarget(true)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: 基本色.青の地,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: 基本色.青, fontSize: 13, fontWeight: 'bold' }}>
                          比較メンバーを追加
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setIsSelectingCompareTarget(true)}
                      style={{
                        alignSelf: 'flex-start',
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        backgroundColor: 基本色.青の地,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: 基本色.青, fontSize: 13, fontWeight: 'bold' }}>
                        他のメンバーと比較
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* 比較のひな型。よく見る組み合わせを名前で残して呼び出す。 */
                /* 毎回いちいち学年を開いて選び直すのが手間だった。 */
                /* 持つのは部員IDだけ。氏名で持つと、改名や同姓同名で別人を呼ぶ */}
                {(() => {
                  const この団体の = ひ.この団体のひな型(ひな型たち, いまの団体id);
                  if (この団体の.length === 0 && compareMembers.length === 0) return null;
                  const 選べる人 = [...members, ...alumni];
                  return (
                    <View style={{ marginBottom: 12 }}>
                      {この団体の.length > 0 ? (
                        <View
                          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
                        >
                          <Text style={{ fontSize: 12, color: 基本色.灰, marginRight: 2 }}>ひな型</Text>
                          {[
                            ...この団体の.map((型) => (
                              <View
                                key={型.id}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: 基本色.地,
                                  borderRadius: 8,
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() => {
                                    const 出来 = ひ.ひな型を当てはめる(
                                      型,
                                      選べる人,
                                      詳細の部員 && 詳細の部員.id
                                    );
                                    setCompareMembers(出来.人たち);
                                    setIsSelectingCompareTarget(false);
                                    // 抜けた部員は黙って落とさない。人数が違って見える
                                    if (出来.見つからない > 0)
                                      出す(
                                        'ひな型',
                                        'このひな型の ' +
                                          出来.見つからない +
                                          ' 人は、いまの名簿に居ないため外しました。'
                                      );
                                  }}
                                  style={{ paddingVertical: 6, paddingLeft: 10, paddingRight: 4 }}
                                >
                                  <Text style={{ color: 基本色.青, fontSize: 13, fontWeight: 'bold' }}>
                                    {型.名前}
                                    {' ('}
                                    {型.部員idたち.length})
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    出す('ひな型を消す', '「' + 型.名前 + '」を消しますか。', [
                                      { text: 'やめる', style: 'cancel' },
                                      {
                                        text: '消す',
                                        style: 'destructive',
                                        onPress: () => 比較のひな型を消す(型.id),
                                      },
                                    ])
                                  }
                                  style={{ paddingVertical: 6, paddingRight: 8, paddingLeft: 2 }}
                                >
                                  <Text style={{ color: 基本色.灰, fontSize: 13, fontWeight: 'bold' }}>
                                    ×
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )),
                          ]}
                        </View>
                      ) : null}
                      {compareMembers.length > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <TextInput
                            aria-label="組み合わせの名前"
                            style={{
                              flex: 1,
                              height: 34,
                              paddingHorizontal: 10,
                              borderWidth: 1,
                              borderColor: 基本色.地_濃い,
                              borderRadius: 8,
                              fontSize: 13,
                              color: 基本色.文字,
                              backgroundColor: 基本色.白,
                            }}
                            placeholder="この組み合わせに名前を付けて残す"
                            placeholderTextColor={基本色.灰_薄い}
                            value={ひな型の名前}
                            onChangeText={ひな型の名前を置く}
                            maxLength={20}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              const 名 = (ひな型の名前 || '').trim();
                              if (!名) {
                                出す('ひな型', '名前を書いてください。');
                                return;
                              }
                              比較のひな型を足す(
                                名,
                                compareMembers.map((相手) => 相手.id)
                              );
                              ひな型の名前を置く('');
                            }}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 14,
                              backgroundColor: 基本色.青の地,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: 基本色.青, fontSize: 13, fontWeight: 'bold' }}>保存</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
                {isSelectingCompareTarget ? (
                  <View
                    style={{
                      padding: 12,
                      backgroundColor: 基本色.白,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 基本色.地_濃い,
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: 基本色.文字 }}>
                        比較するメンバーを選択
                      </Text>
                      <TouchableOpacity onPress={() => setIsSelectingCompareTarget(false)}>
                        <Text style={{ color: 基本色.青, fontSize: 13, fontWeight: 'bold' }}>完了</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 240 }}>
                      {(() => {
                        // 学年でまとめる。卒業生は最後にひとまとめ、
                        // 学年の無い人は「その他/ゲスト」（人の選択と同じ分け方）
                        const 候補 = [...members, ...alumni].filter((item) => item.id !== 詳細の部員.id);
                        return 学年でまとめる(候補).map(({ 学年: 印, 題, 人たち }) => {
                          const 束 = { [印]: 人たち };
                          const 開 = !閉じた学年.has(印);
                          return (
                            <View key={`組-${印}`}>
                              <TouchableOpacity
                                onPress={() => 学年を開け閉め(印)}
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingVertical: 10,
                                  borderBottomWidth: 1,
                                  borderBottomColor: 基本色.地,
                                }}
                              >
                                <Text style={{ fontSize: 14, fontWeight: '600', color: 基本色.文字_三 }}>
                                  {題}
                                  {' ('}
                                  {束[印].length}人)
                                </Text>
                                <Icons.Ionicons
                                  name={開 ? 'chevron-up' : 'chevron-down'}
                                  size={14}
                                  color={基本色.灰}
                                />
                              </TouchableOpacity>
                              {[
                                ...(開 ? 束[印] : []).map((item) => {
                                  const isSelected = compareMembers.some((相手) => 相手.id === item.id);
                                  return (
                                    <TouchableOpacity
                                      key={`select-${item.id}`}
                                      onPress={() => {
                                        setCompareMembers((prev) => {
                                          if (prev.some((相手) => 相手.id === item.id)) {
                                            return prev.filter((相手) => 相手.id !== item.id);
                                          } else {
                                            return [...prev, item];
                                          }
                                        });
                                      }}
                                      style={{
                                        paddingVertical: 10,
                                        paddingLeft: 12,
                                        borderBottomWidth: 1,
                                        borderBottomColor: 基本色.地,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      {/* 男女が分かるよう、名前の前に色の丸を置く。 */
                                      /* メンバー画面と同じ色にそろえてある */}
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          flex: 1,
                                          minWidth: 0,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 10,
                                            marginRight: 6,
                                            color:
                                              item.gender === '男子'
                                                ? 基本色.青
                                                : item.gender === '女子'
                                                  ? 基本色.桃
                                                  : 基本色.灰,
                                          }}
                                        >
                                          ●
                                        </Text>
                                        <Text
                                          style={{
                                            fontSize: 14,
                                            color: isSelected ? 基本色.青 : 基本色.文字,
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            flexShrink: 1,
                                          }}
                                          numberOfLines={1}
                                        >
                                          {item.name}
                                        </Text>
                                      </View>
                                      {isSelected && (
                                        <Text style={{ color: 基本色.青, fontSize: 14, fontWeight: 'bold' }}>
                                          ✓
                                        </Text>
                                      )}
                                    </TouchableOpacity>
                                  );
                                }),
                              ]}
                            </View>
                          );
                        });
                      })()}
                    </ScrollView>
                  </View>
                ) : null}
                {compareMembers.length > 0 ? (
                  <View>
                    <CompareGraph
                      baseData={詳細の推移}
                      baseName={詳細の部員.name}
                      compareTargets={compareMembers.map((相手) => ({
                        id: 相手.id,
                        name: 相手.name,
                        data: 推移を数える(相手.id),
                      }))}
                      selectedLabel={selectedModalTrendLabel}
                      onSelectLabel={setSelectedModalTrendLabel}
                    />
                    <View style={{ marginBottom: 20, marginTop: 20, alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: 基本色.文字_三,
                          marginBottom: 8,
                          alignSelf: 'flex-start',
                        }}
                      >
                        {selectedModalTrendLabel
                          ? `矢所の傾向 (${selectedModalTrendLabel})`
                          : '矢所の傾向 (集計)'}
                      </Text>
                      <View style={{ width: '100%', marginBottom: 12 }}>
                        <選択肢の帯
                          options={的の選び}
                          selected={modalTargetType}
                          onSelect={setModalTargetType}
                          isWrap
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          paddingVertical: 4,
                          gap: 16,
                          width: '100%',
                        }}
                      >
                        <View style={{ alignItems: 'center', minWidth: 110, width: 110 }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: 'bold',
                              marginBottom: 4,
                              color: 基本色.文字_二,
                              textAlign: 'center',
                            }}
                            numberOfLines={1}
                          >
                            {詳細の部員.name}
                          </Text>
                          <ArrowLocationView
                            arrowLocations={gatherAllArrowLocations(詳細の部員.id, selectedModalTrendLabel)}
                            size={100}
                            targetType={modalTargetType}
                            hideNumbers
                          />
                        </View>
                        {[
                          ...compareMembers.map((相手, cmIdx) => {
                            const COLORS = 比較の色たち;
                            const dsColor = COLORS[cmIdx % COLORS.length];
                            return (
                              <View
                                key={`arrow-compare-${相手.id}`}
                                style={{ alignItems: 'center', minWidth: 110, width: 110 }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    marginBottom: 4,
                                    color: dsColor,
                                    textAlign: 'center',
                                  }}
                                  numberOfLines={1}
                                >
                                  {相手.name}
                                </Text>
                                <ArrowLocationView
                                  arrowLocations={gatherAllArrowLocations(相手.id, selectedModalTrendLabel)}
                                  size={100}
                                  targetType={modalTargetType}
                                  hideNumbers
                                />
                              </View>
                            );
                          }),
                        ]}
                      </View>
                    </View>
                    {/* 立ち順別の的中率。 */
                    /*  */
                    /* 射目ごとに人を並べていたころは、4人比べると */
                    /* 4区画×4行で20行になり、上下に離れた数字を */
                    /* 見比べることになって読めなかった。 */
                    /* 1人1行の表にして、横に射目を並べる */}
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: 'bold', color: 基本色.文字_三, marginBottom: 12 }}
                      >
                        {selectedModalTrendLabel
                          ? `立ち順別の的中率 (${selectedModalTrendLabel})`
                          : '立ち順別の的中率 (1-4射目)'}
                      </Text>
                      {(() => {
                        const COLORS = 比較の色たち;
                        const 空 = [];
                        const 並び = [
                          {
                            name: 詳細の部員.name,
                            色: 基本色.青,
                            表: (詳細の期間の成績 || 詳細の部員).perShotStats || 空,
                          },
                          ...compareMembers.map((相手, 番) => ({
                            name: 相手.name,
                            色: COLORS[番 % COLORS.length],
                            表: (比較の成績.get(相手.id) || {}).perShotStats || 空,
                          })),
                        ];
                        const 率 = (数) => (数 && 数.shots > 0 ? (数.hits / 数.shots) * 100 : 0);
                        // 濃さは、この表の中でいちばん高い率を基準にする。
                        // 決め打ちの目盛だと、的中率が低い団体では全部同じ薄さになる
                        let 最大 = 0;
                        for (const 人 of 並び)
                          for (let 番 = 0; 番 < 4; 番++) 最大 = Math.max(最大, 率(人.表[番]));
                        const 淡く = (濃さ) => `rgba(0, 122, 255, ${濃さ})`;
                        return (
                          <View style={styles.patternsCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
                              <View style={{ width: 狭い画面 ? 52 : 64 }} />
                              {[
                                ...[0, 1, 2, 3].map((番) => (
                                  <View key={`head-shot-${番}`} style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: 基本色.文字_三 }}>
                                      {番 + 1}射目
                                    </Text>
                                  </View>
                                )),
                              ]}
                              <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, color: 基本色.灰 }}>射数</Text>
                              </View>
                            </View>
                            {[
                              ...並び.map((人, 番) => {
                                const 総射数 = [0, 1, 2, 3].reduce(
                                  (合計, 射目) => 合計 + ((人.表[射目] && 人.表[射目].shots) || 0),
                                  0
                                );
                                return (
                                  <View
                                    key={`per-shot-row-${番}`}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                                  >
                                    <View
                                      style={{
                                        width: 狭い画面 ? 52 : 64,
                                        paddingRight: 4,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <View
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: 4,
                                          marginRight: 4,
                                          backgroundColor: 人.色,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          flex: 1,
                                          fontSize: 11,
                                          fontWeight: 'bold',
                                          color: 基本色.文字,
                                        }}
                                        numberOfLines={1}
                                      >
                                        {人.name}
                                      </Text>
                                    </View>
                                    {[
                                      ...[0, 1, 2, 3].map((射目) => {
                                        const 枡 = 人.表[射目] || { shots: 0, hits: 0 };
                                        const そのマスの率 = 率(枡);
                                        return (
                                          <View
                                            key={`compare-per-shot-${射目}-${番}`}
                                            style={{
                                              flex: 1,
                                              alignItems: 'center',
                                              paddingVertical: 4,
                                              marginHorizontal: 1,
                                              borderRadius: 6,
                                              backgroundColor:
                                                枡.shots > 0 && 最大 > 0
                                                  ? 淡く(0.06 + (そのマスの率 / 最大) * 0.36)
                                                  : 'transparent',
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 狭い画面 ? 12 : 13,
                                                fontWeight: '600',
                                                color: 枡.shots > 0 ? 基本色.文字 : 基本色.灰_薄い,
                                              }}
                                              numberOfLines={1}
                                            >
                                              {そのマスの率.toFixed(0)}%
                                            </Text>
                                            {狭い画面 ? null : (
                                              <Text // 副次テキスト。暗いテーマでは #EBEBF5 に変わる。
                                                // #48484A は変換表に無く、暗い面の上で沈む
                                                style={{ fontSize: 9, color: 基本色.文字_二 }}
                                                numberOfLines={1}
                                              >
                                                {枡.hits}/{枡.shots}
                                              </Text>
                                            )}
                                          </View>
                                        );
                                      }),
                                    ]}
                                    <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                      <Text style={{ fontSize: 11, color: 基本色.灰 }}>{String(総射数)}</Text>
                                    </View>
                                  </View>
                                );
                              }),
                            ]}
                          </View>
                        );
                      })()}
                    </View>
                    {/* 立ちの結果分布。比較のときも出す。 */
                    /* 分けていたころは、比較を始めるとこの節ごと消えていた。 */
                    /*  */
                    /* 比較なしのときと同じ帯を人数ぶん並べると、3人で15行、 */
                    /* 4人で20行になって読めない。比較のときは1人1行の表にし、 */
                    /* マスの濃さでその人の中での多い少ないを見せる。 */
                    /* 回数そのものは書いてあるので、濃さは目安でよい */}
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: 'bold', color: 基本色.文字_三, marginBottom: 12 }}
                      >
                        {selectedModalTrendLabel
                          ? `立ちの結果分布 (${selectedModalTrendLabel})`
                          : '立ちの結果分布 (4射単位)'}
                      </Text>
                      {(() => {
                        const 区分たち = [
                          { label: '皆中', key: 'kaichu', color: 基本色.橙 },
                          { label: '三中', key: 'sanchu', color: 基本色.緑 },
                          { label: '羽分', key: 'hake', color: 基本色.青 },
                          { label: '一中', key: 'icchu', color: 基本色.藍 },
                          { label: '残念', key: 'zannen', color: 基本色.赤 },
                        ];
                        const COLORS = 比較の色たち;
                        const 空 = { kaichu: 0, sanchu: 0, hake: 0, icchu: 0, zannen: 0 };
                        const 並び = [
                          {
                            name: 詳細の部員.name,
                            // 立ち順別の比較と同じ。同じ画面で同じ人の色が変わると迷う
                            色: 基本色.青,
                            表: (詳細の期間の成績 || 詳細の部員).patterns || 空,
                          },
                          ...compareMembers.map((相手, 番) => ({
                            name: 相手.name,
                            色: COLORS[番 % COLORS.length],
                            表: (比較の成績.get(相手.id) || {}).patterns || 空,
                          })),
                        ];
                        // 区分の色を薄く敷く。'#RRGGBB' から rgba を作る
                        const 淡く = (色, 濃さ) => {
                          const 数 = parseInt(色.slice(1), 16);
                          const 赤 = (数 >> 16) & 255;
                          const 緑 = (数 >> 8) & 255;
                          const 青 = 数 & 255;
                          return `rgba(${赤}, ${緑}, ${青}, ${濃さ})`;
                        };
                        return (
                          <View style={styles.patternsCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
                              <View style={{ width: 狭い画面 ? 52 : 64 }} />
                              {[
                                ...区分たち.map((区分) => (
                                  <View key={`head-${区分.key}`} style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: 区分.color }}>
                                      {区分.label}
                                    </Text>
                                  </View>
                                )),
                              ]}
                              <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, color: 基本色.灰 }}>立数</Text>
                              </View>
                            </View>
                            {[
                              ...並び.map((人, 番) => {
                                const 全 = Object.values(人.表).reduce((甲, 乙) => 甲 + 乙, 0);
                                return (
                                  <View
                                    key={`bunpu-${番}`}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                                  >
                                    <View
                                      style={{
                                        width: 狭い画面 ? 52 : 64,
                                        paddingRight: 4,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <View
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: 4,
                                          marginRight: 4,
                                          backgroundColor: 人.色,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          flex: 1,
                                          fontSize: 11,
                                          fontWeight: 'bold',
                                          color: 基本色.文字,
                                        }}
                                        numberOfLines={1}
                                      >
                                        {人.name}
                                      </Text>
                                    </View>
                                    {[
                                      ...区分たち.map((区分) => {
                                        const 回 = 人.表[区分.key] || 0;
                                        const 割 = 全 > 0 ? 回 / 全 : 0;
                                        return (
                                          <View
                                            key={`${区分.key}-${番}`}
                                            style={{
                                              flex: 1,
                                              alignItems: 'center',
                                              paddingVertical: 6,
                                              marginHorizontal: 1,
                                              borderRadius: 6,
                                              backgroundColor:
                                                回 > 0 ? 淡く(区分.color, 0.1 + 割 * 0.45) : 'transparent',
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                fontWeight: '600',
                                                color: 回 > 0 ? 基本色.文字 : 基本色.灰_薄い,
                                              }}
                                            >
                                              {String(回)}
                                            </Text>
                                          </View>
                                        );
                                      }),
                                    ]}
                                    <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                      <Text style={{ fontSize: 11, color: 基本色.灰 }}>{String(全)}</Text>
                                    </View>
                                  </View>
                                );
                              }),
                            ]}
                          </View>
                        );
                      })()}
                      {/* 4射そろわない末尾は分布に入れられない。 */
                      /* 断らないと「的中率と数が合わない」と見える */}
                      {(() => {
                        const 端 =
                          ((詳細の期間の成績 || 詳細の部員).端数の射 || 0) +
                          compareMembers.reduce(
                            (合計, 相手) => 合計 + ((比較の成績.get(相手.id) || {}).端数の射 || 0),
                            0
                          );
                        return 端 > 0 ? (
                          <Text
                            style={{ fontSize: 11, color: 基本色.灰, marginTop: 8, lineHeight: 16 }}
                          >{`※ 4射に満たない射（この画面の全員で ${端} 射）は皆中・残念などに分けられないため、この分布に入れていません（的中率には入っています）。`}</Text>
                        ) : null;
                      })()}
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={{ marginBottom: 20 }}>
                      <推移の図
                        data={詳細の推移}
                        selectedLabel={selectedModalTrendLabel}
                        onSelectLabel={setSelectedModalTrendLabel}
                        onJumpToRecord={(sessionId) => {
                          詳細の部員を置く(null);
                          goToHistoryRecord(sessionId, 詳細の部員?.id);
                        }}
                      />
                    </View>
                    <View style={{ marginBottom: 20, alignItems: 'center' }}>
                      <Text
                        style={[
                          {
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: 基本色.文字_三,
                            marginBottom: 8,
                            alignSelf: 'flex-start',
                          },
                        ]}
                      >
                        {selectedModalTrendLabel
                          ? `矢所の傾向 (${selectedModalTrendLabel})`
                          : '矢所の傾向 (集計)'}
                      </Text>
                      <View style={{ width: '100%', marginBottom: 12 }}>
                        <選択肢の帯
                          options={的の選び}
                          selected={modalTargetType}
                          onSelect={setModalTargetType}
                          isWrap
                        />
                      </View>
                      <ArrowLocationView
                        arrowLocations={gatherAllArrowLocations(詳細の部員.id, selectedModalTrendLabel)}
                        size={200}
                        targetType={modalTargetType}
                        hideNumbers
                      />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: 'bold', color: 基本色.文字_三, marginBottom: 8 }}
                      >
                        {selectedModalTrendLabel
                          ? `立ち順別の的中率 (${selectedModalTrendLabel})`
                          : '立ち順別の的中率 (1-4射目)'}
                      </Text>
                      <View style={styles.statsGrid}>
                        {Array.from({ length: 4 }).map((_, 番) => {
                          const 元 = 詳細の期間の成績 || 詳細の部員;
                          const そのマス = 元.perShotStats[番] || { shots: 0, hits: 0 };
                          const 率 = そのマス.shots > 0 ? (そのマス.hits / そのマス.shots) * 100 : 0;
                          return (
                            <View key={`per-shot-modal-${番}`} style={styles.statBox}>
                              <Text style={styles.statBoxTitle}>{番 + 1}射目</Text>
                              <Text style={styles.statBoxRate}>{率.toFixed(0)}%</Text>
                              <Text style={styles.statBoxCounts}>
                                {そのマス.hits}/{そのマス.shots}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: 'bold', color: 基本色.文字_三, marginBottom: 12 }}
                      >
                        {selectedModalTrendLabel
                          ? `立ちの結果分布 (${selectedModalTrendLabel})`
                          : '立ちの結果分布 (4射単位)'}
                      </Text>
                      <View style={styles.patternsCard}>
                        <立ちの結果の棒たち patterns={(詳細の期間の成績 || 詳細の部員).patterns} />
                      </View>
                      {/* 4射そろわない末尾は分布に入れられない。 */
                      /* 断らないと「的中率と数が合わない」と見える */}
                      {(() => {
                        const 端 = (詳細の期間の成績 || 詳細の部員).端数の射 || 0;
                        return 端 > 0 ? (
                          <Text
                            style={{ fontSize: 11, color: 基本色.灰, marginTop: 8, lineHeight: 16 }}
                          >{`※ 4射に満たない ${端} 射は皆中・残念などに分けられないため、この分布に入れていません（的中率には入っています）。`}</Text>
                        ) : null;
                      })()}
                    </View>
                  </View>
                )}
                {/* 弓具を変えた前後。 */
                /*  */
                /* 比較の分岐（compareMembers.length > 0）の中に置いていたため、 */
                /* 比較相手を足したときしか出ていなかった。求められたのは */
                /* 「個人の詳細で見たい」なので、比較の有無に関わらず出す。 */
                /*  */
                /* 置き場所は詳細のいちばん下（閉じるの手前）。ここは */
                /* 弓具を記録していない団体では案内だけが出る節なので、 */
                /* 上に置くと、毎日見る数字より先に目に入ってしまう。 */
                /*  */
                /* 的中の型。結果分布のすぐ下に置く。 */
                /* 上の分布で「三中が多い」と分かったあと、すぐ */
                /* 「その三中はどこで抜いているのか」へ目が移るため。 */
                /*  */
                /* 比較中は人数ぶん並べる。名前の見出しを付けて誰の型かを示す */}
                {型の節(
                  詳細の期間の成績 || 詳細の部員,
                  selectedModalTrendLabel,
                  compareMembers.length > 0 ? 詳細の部員.name : null
                )}
                {[
                  ...(compareMembers.length > 0
                    ? compareMembers.map((相手) =>
                        型の節(比較の成績.get(相手.id), selectedModalTrendLabel, 相手.name)
                      )
                    : []),
                ]}
                {/* 弓具の履歴が無い人には、どこで記録するかだけを出す */
                /* （何も出さないと、この節が在ることに気づけない） */}
                {弓具の節(詳細の部員, 絞った記録)}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    詳細の部員を置く(null);
                    setCompareMembers([]);
                    setIsSelectingCompareTarget(false);
                  }}
                >
                  <Text style={styles.closeBtnText}>閉じる</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

module.exports = { 部員の詳細の窓 };
