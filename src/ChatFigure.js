/**
 * AI チャットの答えの下に出す図（折れ線・棒・表・矢所）。図の形は src/chatFigures.js が作る。
 * 押すと窓で大きく出す（戻るボタンでも閉じる。src/rn.js の Modal が onRequestClose を戻るに結ぶ）。
 * 色は iro.js の名前で渡す（ダークモードでは描くときに差し替わる。SVG の fill・stroke も）。
 */
'use strict';

const React = require('react');
const { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, useWindowDimensions } = require('./rn');
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

/** 字の幅の見積もり（全角は字の大きさほど、半角はその 6 割） */
const 字の幅 = (文, 大きさ) =>
  [...String(文 ?? '')].reduce((和, 字) => 和 + (字.charCodeAt(0) < 0x100 ? 大きさ * 0.6 : 大きさ * 1.02), 0);

const 合計 = (数たち) => 数たち.reduce((和, 数) => 和 + 数, 0);

/**
 * 図の幅を測る。SVG の座標も表の列も、実際の幅で決める。
 * 前は 300 の幅で描いて画面へ伸ばしていて、狭い画面では字が 7px ほどに縮み、
 * パソコンで大きく出すと字が大きくなりすぎた。表は固い幅で、カードの右が空いていた（2026-10-25）
 */
function use幅() {
  const [幅, 幅を置く] = React.useState(0);
  const 測る = React.useCallback((出来事) => {
    const 測った = Math.floor(出来事.nativeEvent.layout.width);
    if (測った > 0) 幅を置く((前) => (前 === 測った ? 前 : 測った));
  }, []);
  return [幅, 測る];
}

/** 大きく出す窓の中で、図に使える高さ（窓の余白・題の行・注のぶんを引く） */
function use窓の高さ() {
  const { height } = useWindowDimensions();
  return Math.max(160, Math.floor(height * 0.9) - 32 - 44 - 24);
}

/** 折れ線・縦の棒の高さ。横向きのスマホで大きく出しても、窓に収まるようにする */
function 図の高さ(幅, 大きく, 窓の高さ) {
  if (!大きく) return Math.round(Math.min(200, Math.max(140, 幅 * 0.5)));
  return Math.round(Math.min(380, 窓の高さ, Math.max(180, 幅 * 0.55)));
}

function 折れ線({ 図, 大きく }) {
  const [W, 測る] = use幅();
  const 窓の高さ = use窓の高さ();
  const 値たち = 図.系列.flatMap((系列) => 系列.点.map((点) => 点.y));
  if (!値たち.length) return null;
  const H = 図の高さ(W, 大きく, 窓の高さ);
  const 字 = 大きく ? 11 : 10;
  const 値の字 = 大きく ? 11.5 : 10.5;
  const 左 = Math.round(字 * 3.4) + 4;
  const 右 = 14;
  const 上 = 値の字 + 10;
  const 下 = 字 + 12;
  const 低 = Math.max(0, Math.floor(Math.min(...値たち) / 5) * 5 - 5);
  const 高 = Math.min(100, Math.ceil(Math.max(...値たち) / 5) * 5 + 5);
  const 名たち = 図.系列[0].点.map((点) => 点.x);
  const 短い名 = (名) => (String(名).length > 7 ? String(名).slice(-5) : String(名));
  const 数 = Math.max(1, 名たち.length - 1);
  const 内の幅 = Math.max(1, W - 左 - 右 - 8);
  const x = (i) => 左 + 8 + (内の幅 * i) / 数;
  const y = (v) => 上 + ((H - 上 - 下) * (高 - v)) / Math.max(1, 高 - 低);
  const 目盛り = [];
  // 目盛りは 18px より詰めない（高さが足りなければ 5→10→20→25→50 と粗くする）
  const 刻み = [5, 10, 20, 25, 50].find((k) => ((H - 上 - 下) * k) / Math.max(1, 高 - 低) >= 18) || 50;
  for (let v = 低; v <= 高; v += 刻み) 目盛り.push(v);
  // x の名は、重ならない数まで間引く
  const 名の幅 = Math.max(...名たち.map((名) => 字の幅(短い名(名), 字))) + 8;
  const 間 = Math.ceil(名たち.length / Math.max(1, Math.floor((内の幅 + 名の幅) / 名の幅)));
  const 一本 = 図.系列.length === 1;
  // 点の上の値は、隣と重ならないときだけ全部出す
  const 値を全部 = 内の幅 / 数 >= 値の字 * 2.8;
  // 点が混むときは、いちばん高い・低い点（最初の 1 つ）にだけ数を付ける
  const 一本目 = 図.系列[0].点.map((点) => 点.y);
  const 高い点 = 一本目.indexOf(Math.max(...一本目));
  const 低い点 = 一本目.indexOf(Math.min(...一本目));
  // 端の点の数は、目盛りの字や図の右の端にかからないように内側へ寄せる
  // 両隣より低い点の数は点の下に書く（上に書くと、上る線にかかる）。下に入る隙間があるときだけ
  const 下に書くか = (点たち, i) => {
    const 隣 = [点たち[i - 1], 点たち[i + 1]].filter(Boolean);
    return 隣.length > 0 && 隣.every((p) => p.y > 点たち[i].y) && y(低) - y(点たち[i].y) >= 値の字 + 8;
  };
  const 値の位置 = (点のx, 字) => {
    const 半分 = 字の幅(字, 値の字) / 2 + 2;
    return Math.min(W - 2 - 半分, Math.max(左 + 半分, 点のx));
  };
  return (
    <View>
      <View style={[styles.図の箱, { height: H }]} onLayout={測る}>
        {W > 0 ? (
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {目盛り.map((v) => (
              <React.Fragment key={`目盛り-${v}`}>
                <Svgの部品.Line x1={左} x2={W - 右} y1={y(v)} y2={y(v)} stroke={色.地_濃い} strokeWidth="1" />
                <Svgの部品.Text
                  fontFamily={図の字体}
                  x={左 - 4}
                  y={y(v) + 字 * 0.35}
                  fontSize={字}
                  fill={色.灰}
                  textAnchor="end"
                >
                  {`${v}${図.単位}`}
                </Svgの部品.Text>
              </React.Fragment>
            ))}
            {名たち.map((名, i) =>
              i % 間 === 0 || (i === 名たち.length - 1 && ((i % 間) * 内の幅) / 数 >= 名の幅) ? (
                <Svgの部品.Text
                  fontFamily={図の字体}
                  key={`名-${i}`}
                  x={x(i)}
                  y={H - 6}
                  fontSize={字}
                  fill={色.灰}
                  textAnchor={i === 名たち.length - 1 && 名たち.length > 1 ? 'end' : 'middle'}
                >
                  {短い名(名)}
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
                          r={内の幅 / 数 < 12 ? 2.5 : 3.5}
                          fill={線の色}
                          stroke={色.白}
                          strokeWidth="1.5"
                        />
                        {一本 && (値を全部 || i === 高い点 || i === 低い点) ? (
                          <Svgの部品.Text
                            fontFamily={図の字体}
                            x={値の位置(x(位置(点)), Number(点.y).toFixed(1))}
                            y={下に書くか(系列.点, i) ? y(点.y) + 値の字 + 5 : y(点.y) - 7}
                            fontSize={値の字}
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
        ) : null}
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
  const [W, 測る] = use幅();
  const 窓の高さ = use窓の高さ();
  const H = 図の高さ(W, 大きく, 窓の高さ);
  const 字 = 大きく ? 11 : 10;
  const 上 = 字 + 8;
  const 下 = 字 + 10;
  const 単位が率 = 図.単位 === '%';
  const 高 = Math.max(...図.並び.map((項) => 項.値), 1);
  const いちばん = Math.max(...図.並び.map((項) => 項.値));
  const 幅 = (W - 8) / Math.max(1, 図.並び.length);
  // 棒が細くて数が隣と重なるときは、いちばん高い・低い棒の数だけ出す。名は切らずに間引く
  //（前は 30 本の数が重なり、名が 1 字に切れていた。10/26 本番）
  const 値の字 = 字;
  const 値を全部 = 幅 >= 値の字 * 2.4;
  // 同じ値の棒が並ぶときも、数を付けるのは最初の 1 本だけ
  const 高い番 = 図.並び.findIndex((項) => 項.値 === いちばん);
  const 低い番 = 図.並び.findIndex((項) => 項.値 === Math.min(...図.並び.map((x) => x.値)));
  const 名の幅 = Math.max(...図.並び.map((項) => 字の幅(項.名, 字))) + 4;
  const 名の間 = Math.max(1, Math.ceil(名の幅 / Math.max(1, 幅)));
  return (
    <View style={[styles.図の箱, { height: H }]} onLayout={測る}>
      {W > 0 ? (
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {図.並び.map((項, i) => {
            // 棒は 0 から（差を大きく見せない）
            const h = ((H - 上 - 下) * 項.値) / 高;
            const 濃い = 項.値 === いちばん;
            const 名 = String(項.名);
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
                {値を全部 || i === 高い番 || i === 低い番 ? (
                  <Svgの部品.Text
                    fontFamily={図の字体}
                    x={Math.min(W - 16, Math.max(16, 4 + i * 幅 + 幅 / 2))}
                    y={H - 下 - h - 4}
                    fontSize={値の字}
                    fontWeight="bold"
                    fill={濃い ? 色.青 : 色.文字_二}
                    textAnchor="middle"
                  >
                    {単位が率 ? Number(項.値).toFixed(1) : `${項.値}`}
                  </Svgの部品.Text>
                ) : null}
                {i % 名の間 === 0 ? (
                  <Svgの部品.Text
                    fontFamily={図の字体}
                    x={4 + i * 幅 + 幅 / 2}
                    y={H - 6}
                    fontSize={字}
                    fill={色.灰}
                    textAnchor="middle"
                  >
                    {名}
                  </Svgの部品.Text>
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

function 横の棒({ 図, 大きく }) {
  const [W, 測る] = use幅();
  const 上限 =
    図.単位 === '%'
      ? Math.max(100, ...図.並び.map((項) => 項.値))
      : Math.max(1, ...図.並び.map((項) => 項.値));
  const いちばん = Math.max(...図.並び.map((項) => 項.値));
  // 名前の欄は、いちばん長い名前の幅まで。ただし図の幅の 4 割まで（棒の長さを残す）
  const 字 = 大きく ? 14 : 12;
  const 長い名 = Math.max(...図.並び.map((項) => 字の幅(項.名, 字))) + 6;
  const 名の幅 = Math.round(Math.max(48, Math.min(長い名, (W || 300) * 0.4)));
  return (
    <View onLayout={測る}>
      {図.並び.map((項, i) => (
        <View key={`横-${i}`} style={styles.横の行}>
          <Text
            style={[styles.横の名, 大きく && styles.大きい字, { width: 名の幅 }]}
            numberOfLines={大きく ? 2 : 1}
          >
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
          <Text style={[styles.横の値, 大きく && styles.大きい字, 大きく && { width: 60 }]}>
            {図.単位 === '%' ? `${Number(項.値).toFixed(1)}%` : `${項.値}${図.単位}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * 表の列の幅。数の列は字の幅のまま、残りを字の列（名前・顔ぶれなど）で分ける。
 * 収まるときは字の列を広げて図の幅いっぱいに、収まらないときは短い列から字の幅どおりに取り、
 * 長い列で残りを等しく分ける（それでも最小の幅を割るときだけ横に流す）
 */
function 列の幅を決める(見積もり, 数の列, 使える, 大きく) {
  if (!(使える > 0)) return 見積もり.map((w) => Math.min(w, 大きく ? 220 : 150));
  const 字の列 = 見積もり.map((_, 列) => 列).filter((列) => !数の列[列]);
  const 広げる列 = 字の列.length ? 字の列 : 見積もり.map((_, 列) => 列);
  const 決めた = [...見積もり];
  const 残り = 使える - 合計(見積もり.filter((_, 列) => !広げる列.includes(列)));
  const 広げる列の和 = 合計(広げる列.map((列) => 見積もり[列]));
  if (広げる列の和 <= 残り) {
    for (const 列 of 広げる列)
      決めた[列] = 見積もり[列] + ((残り - 広げる列の和) * 見積もり[列]) / 広げる列の和;
  } else {
    const 最小 = 大きく ? 96 : 72;
    let 余り = 残り;
    const 短い順 = [...広げる列].sort((甲, 乙) => 見積もり[甲] - 見積もり[乙]);
    for (let i = 0; i < 短い順.length; i++) {
      const 等分 = 余り / (短い順.length - i);
      if (見積もり[短い順[i]] <= 等分) {
        余り -= 見積もり[短い順[i]];
        continue;
      }
      for (const 列 of 短い順.slice(i)) 決めた[列] = Math.max(Math.min(最小, 見積もり[列]), 等分);
      break;
    }
  }
  return 決めた.map((w) => Math.floor(w));
}

function 表({ 図, 大きく }) {
  const [幅, 測る] = use幅();
  const 列の数 = 図.列.length;
  const 強める = 図.強める列 == null ? null : 図.強める列 < 0 ? 列の数 + 図.強める列 : 図.強める列;
  const 字 = 大きく ? 14 : 12.5;
  const 数の列 = 図.列.map((_, 列) => 図.行.length > 0 && 図.行.every((行) => 数らしい(行[列])));
  // 升の左右の余白（4 ずつ）と、見積もりのずれのぶんを足す
  const 見積もり = 図.列.map((名, 列) =>
    Math.ceil(Math.max(字の幅(名, 11), ...図.行.map((行) => 字の幅(行[列], 字))) + 12)
  );
  const 幅たち = 列の幅を決める(見積もり, 数の列, 幅, 大きく);
  const 流す = 幅 > 0 && 合計(幅たち) > 幅 + 1;
  return (
    <View style={styles.図の箱} onLayout={測る} testID="AIの表">
      {/* 横に流さないときは ScrollView にしない（touch-action: none になり、表の上でチャットを上下に巻けなかった） */}
      <横に流す箱 流す={流す}>
        <View>
          <View style={[styles.表の行, styles.表の頭]}>
            {図.列.map((名, 列) => (
              <Text
                key={`頭-${列}`}
                style={[styles.表の頭の字, { width: 幅たち[列] }, 列 > 0 && 数の列[列] && styles.右]}
              >
                {名}
              </Text>
            ))}
          </View>
          {図.行.map((行, 番) => (
            <View key={`行-${番}`} style={styles.表の行}>
              {行.map((値, 列) => (
                // 余白は字の外の箱に付ける。字に付けると、2 行で切った 3 行目の頭が下の余白に覗く（iPhone）
                <View key={`升-${番}-${列}`} style={[styles.升, { width: 幅たち[列] }]}>
                  <Text
                    style={[
                      styles.表の字,
                      大きく && styles.大きい表の字,
                      数の列[列] && styles.右,
                      列 === 強める && styles.強める,
                    ]}
                    numberOfLines={大きく ? undefined : 2}
                  >
                    {値}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </横に流す箱>
    </View>
  );
}

function 横に流す箱({ 流す, children }) {
  return 流す ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View>{children}</View>
  );
}

function 矢所({ 図, 大きく }) {
  const [幅, 測る] = use幅();
  const 窓の高さ = use窓の高さ();
  const 凡例 = (
    <View style={[styles.矢所の凡例, 大きく && styles.矢所の凡例_下]}>
      <Text style={[styles.凡例の字, 大きく && styles.大きい字]}>
        <Text style={{ color: 色.緑 }}>●</Text> 中り {図.中り}
      </Text>
      <Text style={[styles.凡例の字, 大きく && styles.大きい字, 大きく && { marginLeft: 16 }]}>
        <Text style={{ color: 色.赤 }}>●</Text> 外れ {図.外れ}
      </Text>
    </View>
  );
  // 答えの下では凡例を右に、大きく出すときは凡例を下に置き、的を窓の幅と高さに収める
  const 大きさ = 大きく
    ? Math.floor(Math.max(160, Math.min(360, 幅 || 280, 窓の高さ - 36)))
    : Math.floor(Math.max(120, Math.min(160, (幅 || 260) - 84)));
  return (
    <View style={大きく ? styles.矢所の縦 : styles.矢所の並び} onLayout={測る}>
      <ArrowLocationView arrowLocations={図.点たち} size={大きさ} targetType={図.的} hideNumbers />
      {凡例}
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

/**
 * 図が描けなかったら、その図だけを出さない（チャットの窓ごと落とさない）。
 * 会話の控えに残った古い形の図や、思わない形の結果で落ちても、答えの文は読める
 */
class 図の守り extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 落ちた: false };
  }
  static getDerivedStateFromError() {
    return { 落ちた: true };
  }
  componentDidCatch(誤り) {
    console.warn('[ChatFigure] 図を描けませんでした', 誤り && 誤り.message);
  }
  render() {
    return this.state.落ちた ? null : this.props.children;
  }
}

/** 答えの下に出す図。押すと窓で大きく出す */
function ChatFigure(props) {
  return (
    <図の守り>
      <図の本体 {...props} />
    </図の守り>
  );
}

function 図の本体({ 図 }) {
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
          <View style={styles.窓} testID="AIの図の窓">
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
  // 画面の幅が変わって測り直すまでの間も、前の幅の SVG でページを押し広げない
  図の箱: { width: '100%', overflow: 'hidden' },
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
  升: { paddingVertical: 6, paddingHorizontal: 4 },
  表の字: { fontSize: 12.5, lineHeight: 18, color: 色.文字 },
  大きい表の字: { fontSize: 14, lineHeight: 20 },
  右: { textAlign: 'right' },
  強める: { color: 色.青, fontWeight: 'bold' },
  大きい字: { fontSize: 14 },
  矢所の並び: { flexDirection: 'row', alignItems: 'center' },
  矢所の縦: { alignItems: 'center' },
  矢所の凡例: { marginLeft: 12 },
  矢所の凡例_下: { flexDirection: 'row', marginLeft: 0, marginTop: 8 },
  窓の地: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  // パソコンでも広がりすぎないように幅は 720 まで
  窓: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: 色.白,
    borderRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  // 縮めないと中身の高さのまま窓の外で切れて、巻けなかった
  窓の中: { flexGrow: 0, flexShrink: 1 },
  閉じる: { fontSize: 15, fontWeight: '600', color: 色.青, marginLeft: 12 },
});

module.exports = { ChatFigure };
