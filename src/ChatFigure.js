/**
 * AI チャットの答えの下に出す図（折れ線・棒・表・矢所）。図の形は src/chatFigures.js が作る。
 * 押すと窓で大きく出す（戻るボタンでも閉じる。src/rn.js の Modal が onRequestClose を戻るに結ぶ）。
 * 色は iro.js の名前で渡す（ダークモードでは描くときに差し替わる。SVG の fill・stroke も）。
 */
'use strict';

const React = require('react');
const { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } = require('./rn');
const Svgの部品 = require('react-native-svg');
const Svg = Svgの部品.default ?? Svgの部品;
const { ArrowLocationView } = require('./ArrowLocationView');
const { 色 } = require('./iro');
const { IS_WEB } = require('./IS_WEB');

/**
 * SVG の字の字体。Web の SVG の字は親の CSS を受け継ぐので、大きく出す窓（画面の外側に描かれる）では
 * ブラウザの既定（明朝体）になっていた。Web では端末の字を指定する
 */
const 図の字体 = IS_WEB
  ? '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", "Segoe UI", Roboto, sans-serif'
  : undefined;

/** 系列の色（折れ線が 2 本以上のとき） */
const 系列の色 = [色.青, 色.橙, 色.緑, 色.藍, 色.桃, 色.灰_濃い];

/** 数らしい字（右に寄せる） */
const 数らしい = (字) => /^[+-]?[\d.,]+(%|射|中|回|人)?$|^—$/.test(String(字));

function 折れ線({ 図, 大きく }) {
  const W = 300;
  const H = 150;
  const 左 = 34;
  const 右 = 16;
  const 上 = 20;
  const 下 = 24;
  const 値たち = 図.系列.flatMap((系列) => 系列.点.map((点) => 点.y));
  if (!値たち.length) return null;
  const 低 = Math.max(0, Math.floor(Math.min(...値たち) / 5) * 5 - 5);
  const 高 = Math.min(100, Math.ceil(Math.max(...値たち) / 5) * 5 + 5);
  const 名たち = 図.系列[0].点.map((点) => 点.x);
  const 数 = Math.max(1, 名たち.length - 1);
  const x = (i) => 左 + 8 + ((W - 左 - 右 - 8) * i) / 数;
  const y = (v) => 上 + ((H - 上 - 下) * (高 - v)) / Math.max(1, 高 - 低);
  const 目盛り = [];
  const 刻み = 高 - 低 > 30 ? 10 : 5;
  for (let v = 低; v <= 高; v += 刻み) 目盛り.push(v);
  // x の名は多いときに間引く（重ならないように）
  const 間 = Math.ceil(名たち.length / 6);
  const 一本 = 図.系列.length === 1;
  return (
    <View>
      <View style={{ width: '100%', aspectRatio: W / H }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          {目盛り.map((v) => (
            <React.Fragment key={`目盛り-${v}`}>
              <Svgの部品.Line x1={左} x2={W - 右} y1={y(v)} y2={y(v)} stroke={色.地_濃い} strokeWidth="1" />
              <Svgの部品.Text
                fontFamily={図の字体}
                x={左 - 4}
                y={y(v) + 3}
                fontSize="8"
                fill={色.灰}
                textAnchor="end"
              >
                {`${v}${図.単位}`}
              </Svgの部品.Text>
            </React.Fragment>
          ))}
          {名たち.map((名, i) =>
            i % 間 === 0 || i === 名たち.length - 1 ? (
              <Svgの部品.Text
                fontFamily={図の字体}
                key={`名-${i}`}
                x={x(i)}
                y={H - 8}
                fontSize="8"
                fill={色.灰}
                textAnchor="middle"
              >
                {String(名).length > 7 ? String(名).slice(-5) : String(名)}
              </Svgの部品.Text>
            ) : null
          )}
          {図.系列.map((系列, 番) => {
            const 線の色 = 系列の色[番 % 系列の色.length];
            const 位置 = (点) => 名たち.indexOf(点.x);
            const 道 = 系列.点
              .filter((点) => 位置(点) >= 0)
              .map((点, i) => `${i ? 'L' : 'M'}${x(位置(点))},${y(点.y)}`)
              .join(' ');
            return (
              <React.Fragment key={`系列-${番}`}>
                <Svgの部品.Path d={道} fill="none" stroke={線の色} strokeWidth="2" />
                {系列.点.map((点, i) =>
                  位置(点) >= 0 ? (
                    <React.Fragment key={`点-${番}-${i}`}>
                      <Svgの部品.Circle
                        cx={x(位置(点))}
                        cy={y(点.y)}
                        r="3.5"
                        fill={線の色}
                        stroke={色.白}
                        strokeWidth="1.5"
                      />
                      {一本 && (名たち.length <= 8 || i === 系列.点.length - 1) ? (
                        <Svgの部品.Text
                          fontFamily={図の字体}
                          x={x(位置(点))}
                          y={y(点.y) - 7}
                          fontSize="8.5"
                          fontWeight="bold"
                          fill={色.文字}
                          textAnchor="middle"
                        >
                          {`${Number(点.y).toFixed(1)}`}
                        </Svgの部品.Text>
                      ) : null}
                    </React.Fragment>
                  ) : null
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
      {!一本 && (
        <View style={styles.凡例}>
          {図.系列.map((系列, 番) => (
            <View key={`凡例-${番}`} style={styles.凡例の一つ}>
              <View style={[styles.凡例の印, { backgroundColor: 系列の色[番 % 系列の色.length] }]} />
              <Text style={styles.凡例の字}>{系列.名}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function 縦の棒({ 図, 大きく }) {
  const W = 300;
  const H = 150;
  const 上 = 16;
  const 下 = 20;
  const 単位が率 = 図.単位 === '%';
  const 高 = 単位が率
    ? Math.max(...図.並び.map((項) => 項.値), 1)
    : Math.max(...図.並び.map((項) => 項.値), 1);
  const いちばん = Math.max(...図.並び.map((項) => 項.値));
  const 幅 = (W - 8) / 図.並び.length;
  return (
    <View style={{ width: '100%', aspectRatio: W / H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {図.並び.map((項, i) => {
          // 棒は 0 から（差を大きく見せない）
          const h = ((H - 上 - 下) * 項.値) / 高;
          const 濃い = 項.値 === いちばん;
          return (
            <React.Fragment key={`棒-${i}`}>
              <Svgの部品.Rect
                x={4 + i * 幅 + 幅 * 0.15}
                y={H - 下 - h}
                width={幅 * 0.7}
                height={Math.max(h, 1)}
                rx="3"
                fill={色.青}
                fillOpacity={濃い ? 1 : 0.35}
              />
              <Svgの部品.Text
                fontFamily={図の字体}
                x={4 + i * 幅 + 幅 / 2}
                y={H - 下 - h - 4}
                fontSize="8"
                fontWeight="bold"
                fill={濃い ? 色.青 : 色.文字_二}
                textAnchor="middle"
              >
                {単位が率 ? Number(項.値).toFixed(1) : `${項.値}`}
              </Svgの部品.Text>
              <Svgの部品.Text
                fontFamily={図の字体}
                x={4 + i * 幅 + 幅 / 2}
                y={H - 6}
                fontSize="8"
                fill={色.灰}
                textAnchor="middle"
              >
                {String(項.名).length > 5 ? String(項.名).slice(0, 5) : String(項.名)}
              </Svgの部品.Text>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function 横の棒({ 図, 大きく }) {
  const 高 = Math.max(...図.並び.map((項) => 項.値), 1);
  const 上限 = 図.単位 === '%' ? Math.max(100, 高) : 高;
  const いちばん = Math.max(...図.並び.map((項) => 項.値));
  return (
    <View>
      {図.並び.map((項, i) => (
        <View key={`横-${i}`} style={styles.横の行}>
          <Text style={[styles.横の名, 大きく && styles.大きい字]} numberOfLines={1}>
            {項.名}
          </Text>
          <View style={styles.横の地}>
            <View
              style={[
                styles.横の棒,
                { width: `${Math.max(2, (項.値 / 上限) * 100)}%`, opacity: 項.値 === いちばん ? 1 : 0.4 },
              ]}
            />
          </View>
          <Text style={[styles.横の値, 大きく && styles.大きい字]}>
            {図.単位 === '%' ? `${Number(項.値).toFixed(1)}%` : `${項.値}${図.単位}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

function 表({ 図, 大きく }) {
  const 列の数 = 図.列.length;
  const 強める = 図.強める列 == null ? null : 図.強める列 < 0 ? 列の数 + 図.強める列 : 図.強める列;
  // 列の幅は字の幅から決める（全角は 13px、半角は 7.5px ほど）。全部を全角で見積もると、
  // 数の列が広がりすぎて、いちばん右の的中率がカードの外へ押し出された（2026-10-25 の確かめ）
  const 字の幅 = (文) =>
    [...String(文 ?? '')].reduce((和, 字) => 和 + (字.charCodeAt(0) < 0x100 ? 7.5 : 13), 0) *
    (大きく ? 1.12 : 1);
  const 幅たち = 図.列.map((名, 列) => {
    const 長さ = Math.max(字の幅(名) * 0.9, ...図.行.map((行) => 字の幅(行[列])));
    return Math.min(大きく ? 220 : 150, Math.max(26, 長さ + 10));
  });
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.表の行, styles.表の頭]}>
          {図.列.map((名, 列) => (
            <Text
              key={`頭-${列}`}
              style={[
                styles.表の頭の字,
                { width: 幅たち[列] },
                列 > 0 && 数らしい(図.行[0] && 図.行[0][列]) && styles.右,
              ]}
            >
              {名}
            </Text>
          ))}
        </View>
        {図.行.map((行, 番) => (
          <View key={`行-${番}`} style={styles.表の行}>
            {行.map((値, 列) => (
              <Text
                key={`升-${番}-${列}`}
                style={[
                  styles.表の字,
                  大きく && styles.大きい字,
                  { width: 幅たち[列] },
                  数らしい(値) && styles.右,
                  列 === 強める && styles.強める,
                ]}
                numberOfLines={2}
              >
                {値}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function 矢所({ 図, 大きく }) {
  return (
    <View style={styles.矢所の並び}>
      <ArrowLocationView
        arrowLocations={図.点たち}
        size={大きく ? 280 : 160}
        targetType={図.的}
        hideNumbers
      />
      <View style={styles.矢所の凡例}>
        <Text style={styles.凡例の字}>
          <Text style={{ color: 色.緑 }}>●</Text> 中り {図.中り}
        </Text>
        <Text style={styles.凡例の字}>
          <Text style={{ color: 色.赤 }}>●</Text> 外れ {図.外れ}
        </Text>
      </View>
    </View>
  );
}

function 中身({ 図, 大きく }) {
  if (図.形 === '折れ線') return <折れ線 図={図} 大きく={大きく} />;
  if (図.形 === '棒')
    return 図.向き === '横' ? <横の棒 図={図} 大きく={大きく} /> : <縦の棒 図={図} 大きく={大きく} />;
  if (図.形 === '表') return <表 図={図} 大きく={大きく} />;
  if (図.形 === '矢所') return <矢所 図={図} 大きく={大きく} />;
  return null;
}

/** 答えの下に出す図。押すと窓で大きく出す */
function ChatFigure({ 図 }) {
  const [大きく, 大きくを置く] = React.useState(false);
  if (!図 || !図.形) return null;
  return (
    <View style={styles.枠}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => 大きくを置く(true)}
        accessibilityRole="button"
        accessibilityLabel={`${図.題}の図。押すと大きく出ます`}
        testID="AIの図"
      >
        <View style={styles.題の行}>
          <Text style={styles.題} numberOfLines={1}>
            {図.題}
          </Text>
          <Text style={styles.大きくの字}>押すと大きく</Text>
        </View>
        <中身 図={図} 大きく={false} />
        {図.注 ? <Text style={styles.注}>{図.注}</Text> : null}
      </TouchableOpacity>
      <Modal visible={大きく} transparent animationType="fade" onRequestClose={() => 大きくを置く(false)}>
        <View style={styles.窓の地}>
          <View style={styles.窓}>
            <View style={styles.題の行}>
              <Text style={[styles.題, styles.大きい題]} numberOfLines={2}>
                {図.題}
              </Text>
              <TouchableOpacity
                onPress={() => 大きくを置く(false)}
                accessibilityRole="button"
                accessibilityLabel="閉じる"
                aria-label="閉じる"
                testID="AIの図を閉じる"
              >
                <Text style={styles.閉じる}>閉じる</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.窓の中}>
              <中身 図={図} 大きく />
              {図.注 ? <Text style={styles.注}>{図.注}</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // 答えの吹き出しの左のキャラクターのぶん、右へずらす
  枠: {
    marginLeft: 38,
    marginTop: -4,
    marginBottom: 12,
    backgroundColor: 色.白,
    borderRadius: 14,
    padding: 12,
  },
  題の行: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  題: { flex: 1, fontSize: 13, fontWeight: 'bold', color: 色.文字 },
  大きい題: { fontSize: 16 },
  大きくの字: { fontSize: 11, fontWeight: '600', color: 色.青, marginLeft: 8 },
  注: { fontSize: 11, color: 色.灰, marginTop: 6 },
  凡例: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  凡例の一つ: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  凡例の印: { width: 10, height: 3, borderRadius: 2, marginRight: 4 },
  凡例の字: { fontSize: 12, color: 色.文字_二, marginBottom: 4 },
  横の行: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  横の名: { width: 82, fontSize: 12, color: 色.文字 },
  横の地: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 色.地,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  横の棒: { height: 10, borderRadius: 5, backgroundColor: 色.青 },
  横の値: { width: 52, fontSize: 12, fontWeight: 'bold', color: 色.文字, textAlign: 'right' },
  表の行: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 色.地 },
  表の頭: { borderBottomColor: 色.地_濃い },
  表の頭の字: { fontSize: 11, fontWeight: '600', color: 色.灰, paddingVertical: 4, paddingHorizontal: 4 },
  表の字: { fontSize: 12.5, color: 色.文字, paddingVertical: 6, paddingHorizontal: 4 },
  右: { textAlign: 'right' },
  強める: { color: 色.青, fontWeight: 'bold' },
  大きい字: { fontSize: 14 },
  矢所の並び: { flexDirection: 'row', alignItems: 'center' },
  矢所の凡例: { marginLeft: 12 },
  窓の地: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  窓: { backgroundColor: 色.白, borderRadius: 16, padding: 16, maxHeight: '90%' },
  窓の中: { flexGrow: 0 },
  閉じる: { fontSize: 15, fontWeight: '600', color: 色.青, marginLeft: 12 },
});

module.exports = { ChatFigure };
