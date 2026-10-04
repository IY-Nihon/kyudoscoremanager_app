/**
 * 記録表の「矢所の行」：各列の下に、その列の人の小さな的を同じ幅・同じ位置で並べる。
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった（2026-10-04 の依頼）。
 * 決まりと、この形にした理由は src/arrowRowRules.js。
 *  ・的は点だけ（○は緑・×は赤）。小さいので、1 本ごとの位置は読めない。集まり方と、○×のどちらが多いかを見る。
 *    1 本ごとは、的を押して開く窓（ArrowLocationPopover）で見る・直す
 *  ・列と同じ幅（ます幅）なので、見比べなくても対応が分かる。表と一緒に横へ流れる
 *  ・左の見出し（矢所）を押すと、見せ方が 全部 → いまの立 → 隠す と変わる。隠すと細い行だけ残る
 *  ・ますは 400 個あるので店は購読しない。列の的は、列から渡された値だけで描く
 */
'use strict';

const React = require('react');
const { View, Text, Pressable, StyleSheet } = require('./rn');
const { UIConfig } = require('./uiConfig');
const { useScoreStore } = require('./useScoreStore');
const { 次の見せ方, 見せ方を整える, 的の点たち } = require('./arrowRowRules');

/** 行の高さ。隠すときは見出しだけの細さ */
function 行の高さ(見せ方, 倍率) {
  return ('隠す' === 見せ方 ? 26 : UIConfig.cellWidth) * 倍率;
}

/** 的の絵。入れ物の 0.82 倍が的（星的 24cm は 0.55 倍）。外れた矢は入れ物の縁まで */
const 小さな的 = React.memo(({ 点たち, 的の種類, 大きさ }) => {
  const 星24 = 'hoshi24' === 的の種類;
  const 的の直径 = 大きさ * (星24 ? 0.55 : 0.82);
  const 的の半径 = 的の直径 / 2;
  const 点 = Math.max(6, 大きさ * 0.17);
  const 限り = 大きさ / 2 - 点 / 2;
  const 寄せる = (v) => Math.max(-限り, Math.min(限り, v));
  const 輪 = (割合, 色) => (
    <View
      style={{
        position: 'absolute',
        width: 的の直径 * 割合,
        height: 的の直径 * 割合,
        borderRadius: (的の直径 * 割合) / 2,
        backgroundColor: 色,
      }}
    />
  );
  return (
    <View style={{ width: 大きさ, height: 大きさ, alignItems: 'center', justifyContent: 'center' }}>
      {'kasumi36' === 的の種類 || 星24 || !的の種類 ? (
        <>
          {輪(1, '#000')}
          {輪(5 / 6, '#FFF')}
          {輪(4 / 6, '#000')}
          {輪(3 / 6, '#FFF')}
          {輪(2 / 6, '#000')}
          {輪(1 / 6, '#FFF')}
        </>
      ) : (
        <>
          {輪(1, '#FFF')}
          {輪(0.25, '#000')}
          <View style={{ position: 'absolute', width: 的の直径, height: 的の直径, borderRadius: 的の半径, borderWidth: 1, borderColor: '#000' }} />
        </>
      )}
      {点たち.map((p) => (
        <View
          key={p.射番}
          style={{
            position: 'absolute',
            width: 点,
            height: 点,
            borderRadius: 点 / 2,
            left: 大きさ / 2 + 寄せる(p.x * 的の半径) - 点 / 2,
            top: 大きさ / 2 + 寄せる(p.y * 的の半径) - 点 / 2,
            backgroundColor: '○' === p.印 ? '#34C759' : '#FF3B30',
            borderColor: '#FFF',
            borderWidth: 0.8,
          }}
        />
      ))}
    </View>
  );
});

/** 列の下の 1 マス。射手の列だけ的を出し、区切り・計の列は同じ高さの空きにする */
const 矢所の行のます = React.memo(({ 射手, 見せ方, 立, 倍率, 的の種類, 幅, 右の線, 左の線, 押された }) => {
  const 高さ = 行の高さ(見せ方, 倍率);
  const 的を出す = '隠す' !== 見せ方 && !射手.isSeparator && !射手.isTotalCalculator;
  const 点たち = 的を出す ? 的の点たち(射手, 見せ方, 立) : [];
  const 余白 = 3 * 倍率;
  return (
    <Pressable
      testID={`矢所の行-${射手.id}`}
      disabled={!的を出す || 点たち.length === 0}
      onPress={() => 押された && 押された(射手)}
      accessibilityRole={的を出す ? 'button' : undefined}
      accessibilityLabel={的を出す ? `${射手.name || '射手'} の矢所。押すと窓で開きます` : undefined}
      aria-label={的を出す ? `${射手.name || '射手'} の矢所。押すと窓で開きます` : undefined}
      style={{
        width: 幅,
        height: 高さ,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 射手.isSeparator ? 'rgba(142,142,147,0.1)' : 射手.isTotalCalculator ? 'rgba(0,122,255,0.08)' : '#FFFFFF',
        borderTopWidth: 1.5,
        borderTopColor: '#000',
        borderRightWidth: 右の線,
        borderRightColor: '#000',
        borderLeftWidth: 左の線,
        borderLeftColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
      }}
    >
      {的を出す ? <小さな的 点たち={点たち} 的の種類={的の種類} 大きさ={Math.max(20, 幅 - 余白 * 2 - 右の線)} /> : null}
    </Pressable>
  );
});

/** 左の見出し。押すと見せ方が変わる。見せ方は端末に残す */
const 矢所の行の見出し = ({ 倍率 }) => {
  const 見せ方 = useScoreStore((状態) => 見せ方を整える(状態.矢所の行));
  const 高さ = 行の高さ(見せ方, 倍率);
  const 字 = '全部' === 見せ方 ? '全部' : '立' === 見せ方 ? 'この立' : '▸';
  return (
    <Pressable
      testID="矢所の行の見出し"
      onPress={() => useScoreStore.getState().set矢所の行(次の見せ方(見せ方))}
      accessibilityRole="button"
      accessibilityLabel={`矢所の行。いまは ${'隠す' === 見せ方 ? '隠している' : 見せ方 === '立' ? 'いまの立だけ' : '全部の射'}。押すと切り替えます`}
      aria-label={`矢所の行。いまは ${'隠す' === 見せ方 ? '隠している' : 見せ方 === '立' ? 'いまの立だけ' : '全部の射'}。押すと切り替えます`}
      style={[S.見出し, { height: 高さ }]}
    >
      <Text style={[S.見出しの字, { fontSize: 10 * 倍率 }]}>矢所</Text>
      <Text style={[S.見出しの小, { fontSize: 9 * 倍率 }]}>{字}</Text>
    </Pressable>
  );
};

const S = StyleSheet.create({
  見出し: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    borderRightWidth: 1.5,
    borderRightColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  見出しの字: { color: '#3C3C43', fontWeight: 'bold' },
  見出しの小: { color: '#007AFF', marginTop: 1 },
});

module.exports = { 矢所の行のます, 矢所の行の見出し, 行の高さ, 小さな的 };
