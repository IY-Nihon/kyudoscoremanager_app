/**
 * 矢所パネル：記録画面のそばに、射手ごとの大きな的を並べて、置いた矢所をその場で確かめる。
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった（2026-10-04 の依頼）。
 * ますの隅に小さな的を出す案は、58×42px では読めず取りやめた。ここは別の場所に、立ごと（4 本ずつ）の的を出す。
 *  ・広い画面（PC・タブレットの横）は記録表の右、狭い画面（スマホ）は下に出す
 *  ・畳める（畳むと細い帯だけ残る）。矢所の記録が OFF のときは、そもそも出さない（呼ぶ側）
 *  ・的の下の ①〜④ を押すと、その矢所を直す窓（ArrowLocationPopover）が開く
 * どの立を出すかは、本人が選ぶまでは「いま記録している立」（印が入っているいちばん後ろ）に自動で付いていく。
 */
'use strict';

const React = require('react');
const { useState } = React;
const { View, Text, Pressable, ScrollView, StyleSheet } = require('./rn');
const { ArrowLocationView } = require('./ArrowLocationView');
const { useストアの一部 } = require('./storeSlice');
const { 立の数, 的を出す射手, 既定の立, 立の矢所, 立のます } = require('./arrowPanelRules');

const 丸数字 = ['①', '②', '③', '④'];

const 矢所パネル = ({ 広い }) => {
  const { archers = [], shotsPerRound = 8, setActiveArrowLocationEdit } = useストアの一部([
    'archers',
    'shotsPerRound',
    'setActiveArrowLocationEdit',
  ]);
  const [畳む, 畳むを置く] = useState(false);
  const [選んだ立, 選んだ立を置く] = useState(null);
  const 射数 = Number(shotsPerRound) || 8;
  const 立の総数 = 立の数(射数);
  const いまの立 = Math.min(立の総数 - 1, 選んだ立 === null ? 既定の立(archers, 射数) : 選んだ立);
  const 人たち = 的を出す射手(archers);
  const 的の大きさ = 広い ? 200 : 150;

  if (畳む) {
    return (
      <Pressable
        testID="矢所パネルを開く"
        accessibilityRole="button"
        accessibilityLabel="矢所パネルを開く"
        aria-label="矢所パネルを開く"
        onPress={() => 畳むを置く(false)}
        style={[S.畳んだ, 広い ? S.畳んだ縦 : S.畳んだ横]}
      >
        <Text style={S.畳んだ字}>{広い ? '矢\n所\n▸' : '矢所 ▴'}</Text>
      </Pressable>
    );
  }

  return (
    <View testID="矢所パネル" style={[S.外, 広い ? S.外の広い : S.外の狭い]}>
      <View style={S.頭}>
        <Text style={S.題}>矢所</Text>
        <View style={S.立の列}>
          {Array.from({ length: 立の総数 }, (無し, 立) => (
            <Pressable
              key={立}
              testID={`矢所パネル-立-${立 + 1}`}
              onPress={() => 選んだ立を置く(立)}
              style={[S.立の札, 立 === いまの立 && S.立の札の今]}
            >
              <Text style={[S.立の字, 立 === いまの立 && S.立の字の今]}>{立 + 1}立</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          testID="矢所パネルを畳む"
          accessibilityRole="button"
          accessibilityLabel="矢所パネルを畳む"
          aria-label="矢所パネルを畳む"
          onPress={() => 畳むを置く(true)}
          hitSlop={8}
        >
          <Text style={S.畳む字}>{広い ? '▸' : '▾'}</Text>
        </Pressable>
      </View>
      {人たち.length === 0 ? (
        <Text style={S.空}>射手を追加すると、ここに的が出ます</Text>
      ) : (
        <ScrollView horizontal={!広い} showsVerticalScrollIndicator={false} contentContainerStyle={広い ? S.中の縦 : S.中の横}>
          {人たち.map((射手, 番) => {
            const ます = 立のます(射手, いまの立, 射数);
            return (
              <View key={typeof 射手.id === 'string' ? 射手.id : `a-${番}`} testID="矢所パネル-的" style={S.札}>
                <Text style={S.名前} numberOfLines={1}>
                  {射手.name || `射手${番 + 1}`}
                </Text>
                <ArrowLocationView arrowLocations={立の矢所(射手, いまの立, 射数)} size={的の大きさ} />
                <View style={S.ますの列}>
                  {ます.map((一つ) => (
                    <Pressable
                      key={一つ.射番}
                      testID={`矢所パネル-ます-${一つ.射番}`}
                      disabled={!一つ.印}
                      onPress={() =>
                        setActiveArrowLocationEdit({
                          archerId: 射手.id,
                          shotIndex: 一つ.射番,
                          currentMark: 一つ.印,
                          arrowLocations: 射手.arrowLocations || [],
                        })
                      }
                      style={[S.ます, 一つ.印 === '○' && S.ますの的中, 一つ.印 === '\xd7' && S.ますの外れ]}
                    >
                      <Text style={[S.ますの字, !一つ.印 && S.ますの空]}>
                        {丸数字[一つ.立の中]}
                        {一つ.印 ? (一つ.矢所あり ? '' : '・') : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const S = StyleSheet.create({
  外: { backgroundColor: '#F2F2F7', borderColor: '#C6C6C8' },
  外の広い: { width: 260, borderLeftWidth: 1 },
  外の狭い: { maxHeight: 250, borderTopWidth: 1 },
  頭: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 8 },
  題: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
  立の列: { flex: 1, flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  立の札: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#E5E5EA' },
  立の札の今: { backgroundColor: '#007AFF' },
  立の字: { fontSize: 12, color: '#3C3C43' },
  立の字の今: { color: '#FFF', fontWeight: 'bold' },
  畳む字: { fontSize: 16, color: '#8E8E93', paddingHorizontal: 4 },
  空: { fontSize: 12, color: '#8E8E93', padding: 12 },
  中の縦: { alignItems: 'center', paddingBottom: 12, gap: 8 },
  中の横: { alignItems: 'flex-start', paddingHorizontal: 8, paddingBottom: 8, gap: 8 },
  札: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 6 },
  名前: { fontSize: 12, fontWeight: 'bold', color: '#3C3C43', maxWidth: 200, marginBottom: 2 },
  ますの列: { flexDirection: 'row', gap: 6, marginTop: 2 },
  ます: { minWidth: 34, paddingVertical: 4, borderRadius: 8, alignItems: 'center', backgroundColor: '#F2F2F7' },
  ますの的中: { backgroundColor: 'rgba(52,199,89,0.18)' },
  ますの外れ: { backgroundColor: 'rgba(255,59,48,0.15)' },
  ますの字: { fontSize: 15, color: '#1C1C1E' },
  ますの空: { color: '#C7C7CC' },
  畳んだ: { backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', borderColor: '#C6C6C8' },
  畳んだ縦: { width: 28, borderLeftWidth: 1 },
  畳んだ横: { height: 30, borderTopWidth: 1 },
  畳んだ字: { fontSize: 12, color: '#3C3C43', textAlign: 'center', lineHeight: 15 },
});

exports.矢所パネル = 矢所パネル;
