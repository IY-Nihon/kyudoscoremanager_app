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
const Icons = require('@expo/vector-icons');

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

/**
 * 系列ごとの横の名を、それぞれの並びを保って 1 つに混ぜる（前の形の図のため）。
 * 前の系列に無い名は、その系列で直前に出てきた名のすぐ後ろに入れる
 */
function 系列の名を混ぜる(系列たち) {
  const 名たち = [];
  for (const 系列 of 系列たち) {
    let 前 = -1;
    for (const 点 of 系列.点) {
      const 既に = 名たち.indexOf(点.x);
      if (既に >= 0) {
        前 = 既に;
        continue;
      }
      名たち.splice(前 + 1, 0, 点.x);
      前 += 1;
    }
  }
  return 名たち;
}

/**
 * 的中率の縦軸を 0% から始めるか。既定は値のある所に寄せ、使う人が「0% から」と頼んだ図（図.縦軸 = '零から'）
 * だけ 0 から（2026-11-14 本人）。検査では globalThis.__図の縦軸 = '零から' で全部を 0 からにできる
 */
const 縦軸を零から = (図) =>
  図.縦軸 === '零から' || (typeof globalThis !== 'undefined' && globalThis.__図の縦軸 === '零から');

/** 線の右端に書く名前（長い名前は 5 字と「…」） */
const 端の名 = (名) => (String(名).length > 6 ? `${String(名).slice(0, 5)}…` : String(名));

function 折れ線({ 図, 大きく }) {
  const [W, 測る] = use幅();
  const 窓の高さ = use窓の高さ();
  // 大きく出したとき、押した点（[系列の番, 点の番]）。その点の日付・率・射数を出す
  const [選んだ点, 選んだ点を置く] = React.useState(null);
  const 値たち = 図.系列.flatMap((系列) => 系列.点.map((点) => 点.y));
  if (!値たち.length) return null;
  const H = 図の高さ(W, 大きく, 窓の高さ);
  const 字 = 大きく ? 11 : 10;
  const 値の字 = 大きく ? 11.5 : 10.5;
  const 左 = Math.round(字 * 3.4) + 4;
  const 一本 = 図.系列.length === 1;
  // 線が 2 本以上のときは、線の右端に名前を書く。そのぶん右を空ける
  const 右 = 一本 ? 14 : Math.ceil(Math.max(...図.系列.map((系列) => 字の幅(端の名(系列.名), 字)))) + 12;
  const 上 = 値の字 + 10;
  const 下 = 字 + 12;
  const 率 = 図.単位 === '%';
  const 通算 = Number.isFinite(図.通算) ? 図.通算 : null;
  const 最大値 = Math.max(...値たち, 通算 ?? -Infinity);
  const 最小値 = Math.min(...値たち, 通算 ?? Infinity);
  // 縦軸。的中率は値のある所に寄せる（頼まれたときだけ 0% から）。上は 10 刻みで、100% で止める
  //（射数・本数などの図は 100 を超えるので止めない）
  const 零から = !率 || 縦軸を零から(図);
  const 低 = 零から ? 0 : Math.max(0, Math.floor((最小値 - 3) / 10) * 10);
  const 上の目安 = Math.max(低 + 10, Math.ceil((最大値 + 3) / 10) * 10);
  const 高 = 率 && 最大値 <= 100 ? Math.min(100, 上の目安) : 上の目安;
  // 横の名は、作るときに決めた並び（どの系列の点も入る）。控えに残った前の形の図は、系列の名を並びを保って混ぜる
  const 名たち = Array.isArray(図.名たち) && 図.名たち.length ? 図.名たち : 系列の名を混ぜる(図.系列);
  const 短い名 = (名) => (String(名).length > 7 ? String(名).slice(-5) : String(名));
  const 数 = Math.max(1, 名たち.length - 1);
  const 内の幅 = Math.max(1, W - 左 - 右 - 8);
  // 点が 1 つだけのときは真ん中に置く
  const x = (i) => (名たち.length === 1 ? 左 + 8 + 内の幅 / 2 : 左 + 8 + (内の幅 * i) / 数);
  const y = (v) => 上 + ((H - 上 - 下) * (高 - v)) / Math.max(1, 高 - 低);
  // 目盛りは切りのよい刻み（10・20・25・50）で、18px より詰めず、6 本まで
  const 幅の差 = 高 - 低;
  const 刻み =
    [5, 10, 20, 25, 50, 100].find(
      (k) => ((H - 上 - 下) * k) / Math.max(1, 幅の差) >= 18 && 幅の差 / k <= 6
    ) || Math.max(1, 幅の差);
  // 目盛りは刻みの倍数に置く（30% から 20 刻みなら 40・60・80・100）
  const 目盛り = [];
  for (let v = Math.ceil(低 / 刻み) * 刻み; v <= 高 + 0.001; v += 刻み) 目盛り.push(v);
  // x の名は、重ならない数まで間引く
  const 名の幅 = Math.max(...名たち.map((名) => 字の幅(短い名(名), 字))) + 8;
  const 間 = Math.ceil(名たち.length / Math.max(1, Math.floor((内の幅 + 名の幅) / 名の幅)));
  // 点の丸は 30 個までのときだけ描く（多いと線が丸で埋まる）
  const 丸を描く = 名たち.length <= 30;
  // 点の上の値は、隣と重ならないときだけ全部出す
  const 値を全部 = 内の幅 / 数 >= 値の字 * 2.8;
  const 丸の半径 = 内の幅 / 数 < 12 ? 2.5 : 3.5;
  // ── 数の置き場（2026-11-13 本人：字と線・点を重ねない）──
  // 線・点・ほかの数・図の端にかからない所を、上 → 下 → 斜め → 横の順に探す。どこにも入らなければ出さない。
  // 置く順は、いちばん高い点・低い点が先（大事な数から場所を取る）
  const 位置の番 = (点) => 名たち.indexOf(点.x);
  const 点の座標 = 図.系列.map((系列) =>
    系列.点.map((点) => (位置の番(点) >= 0 ? { x: x(位置の番(点)), y: y(点.y) } : null))
  );
  const 線分たち = [];
  点の座標.forEach((点たち) => {
    const 有る = 点たち.filter(Boolean);
    for (let i = 1; i < 有る.length; i++) 線分たち.push([有る[i - 1], 有る[i]]);
  });
  if (通算 != null)
    線分たち.push([
      { x: 左, y: y(通算) },
      { x: W - 右, y: y(通算) },
    ]);
  const 丸たち = 点の座標.flat().filter(Boolean);
  const 置いた箱 = [];
  // 横の名の字も、数がかからないように先に置いておく
  名たち.forEach((名, i) => {
    if (!(i % 間 === 0 || (i === 名たち.length - 1 && ((i % 間) * 内の幅) / 数 >= 名の幅))) return;
    const w = 字の幅(短い名(名), 字);
    const 右寄せ = i === 名たち.length - 1 && 名たち.length > 1;
    置いた箱.push({
      l: 右寄せ ? x(i) - w : x(i) - w / 2,
      r: 右寄せ ? x(i) : x(i) + w / 2,
      t: H - 6 - 字 * 1.1,
      b: H,
    });
  });
  const 重なる箱 = (甲, 乙) => 甲.l < 乙.r && 乙.l < 甲.r && 甲.t < 乙.b && 乙.t < 甲.b;
  const 線にかかる = (箱) =>
    線分たち.some(([p, q]) => {
      // 線分の上を細かくたどって、箱（少し広げる）に入る所があるか
      const 長さ = Math.hypot(q.x - p.x, q.y - p.y);
      const 刻み数 = Math.max(2, Math.ceil(長さ / 2));
      for (let k = 0; k <= 刻み数; k++) {
        const px = p.x + ((q.x - p.x) * k) / 刻み数;
        const py = p.y + ((q.y - p.y) * k) / 刻み数;
        if (px > 箱.l - 1.5 && px < 箱.r + 1.5 && py > 箱.t - 1.5 && py < 箱.b + 1.5) return true;
      }
      return false;
    });
  const 丸にかかる = (箱) =>
    丸たち.some((c) => {
      const 近x = Math.max(箱.l, Math.min(c.x, 箱.r));
      const 近y = Math.max(箱.t, Math.min(c.y, 箱.b));
      return Math.hypot(c.x - 近x, c.y - 近y) < 丸の半径 + 2;
    });
  const 数の置き場 = new Map();
  if (一本 && W > 0) {
    const 点たち = 図.系列[0].点;
    const 値 = 点たち.map((点) => 点.y);
    const 高い点 = 値.indexOf(Math.max(...値));
    const 低い点 = 値.indexOf(Math.min(...値));
    const 端 = [0, 点たち.length - 1];
    const 候補の番 = 値を全部 ? 点たち.map((_, i) => i) : [高い点, 低い点];
    const 順 = [...new Set([高い点, 低い点, ...端.filter((i) => 候補の番.includes(i)), ...候補の番])];
    // 字の箱の高さ（ブラウザの字の箱は字の大きさより 2 割ほど高い）
    const 高さ = 値の字 * 1.2;
    for (const i of 順) {
      const c = 点の座標[0][i];
      if (!c) continue;
      const 字 = Number(点たち[i].y).toFixed(1);
      const w = 字の幅(字, 値の字) + 2;
      // 字の真ん中の座標の候補。近い所から試し、だめなら少し離す（3 段）
      const 候補 = [];
      for (const 足す of [0, 7, 14]) {
        const 離れ = 丸の半径 + 3 + 足す;
        候補.push(
          [c.x, c.y - 離れ - 高さ / 2],
          [c.x, c.y + 離れ + 高さ / 2],
          [c.x + w / 2 + 2, c.y - 離れ - 高さ / 2 + 2],
          [c.x - w / 2 - 2, c.y - 離れ - 高さ / 2 + 2],
          [c.x + w / 2 + 2, c.y + 離れ + 高さ / 2 - 2],
          [c.x - w / 2 - 2, c.y + 離れ + 高さ / 2 - 2],
          [c.x + 離れ + w / 2 + 1, c.y],
          [c.x - 離れ - w / 2 - 1, c.y]
        );
      }
      for (const [cx, cy] of 候補) {
        const 箱 = { l: cx - w / 2, r: cx + w / 2, t: cy - 高さ / 2, b: cy + 高さ / 2 };
        // 下は横の名の字の上まで（0% の点の横にも置けるように）
        if (箱.l < 左 || 箱.r > W - 2 || 箱.t < 1 || 箱.b > H - 6 - 字 * 1.3) continue;
        if (線にかかる(箱) || 丸にかかる(箱) || 置いた箱.some((前) => 重なる箱(前, 箱))) continue;
        置いた箱.push(箱);
        // 字の下の線（baseline）は、真ん中から字の高さの 3 割ほど下
        数の置き場.set(i, { x: cx, y: cy + 値の字 * 0.36, 字 });
        break;
      }
    }
  }
  const 通算の字 = 通算 == null ? '' : `通算 ${Number(通算).toFixed(1)}${図.単位}`;
  // 線の右端の名前の高さ。最後の点の高さに置き、近すぎる名前は上下に押し広げる
  const 端の名の置き場 = 一本
    ? []
    : 図.系列
        .map((系列, 番) => {
          const 最後 = 点の座標[番].filter(Boolean).slice(-1)[0];
          return 最後 ? { 番, y: 最後.y } : null;
        })
        .filter(Boolean)
        .sort((甲, 乙) => 甲.y - 乙.y);
  const 名の間 = 字 * 1.25;
  for (let k = 1; k < 端の名の置き場.length; k++)
    端の名の置き場[k].y = Math.max(端の名の置き場[k].y, 端の名の置き場[k - 1].y + 名の間);
  // 下にはみ出したら、下から押し戻す
  const 下の端 = H - 下 - 2;
  for (let k = 端の名の置き場.length - 1; k >= 0; k--) {
    const 上限 = k === 端の名の置き場.length - 1 ? 下の端 : 端の名の置き場[k + 1].y - 名の間;
    端の名の置き場[k].y = Math.min(端の名の置き場[k].y, 上限);
  }
  // 押した点の中身（大きく出したとき）
  const 選んだ中身 = (() => {
    if (!選んだ点 || !大きく) return null;
    const [番, i] = 選んだ点;
    const 点 = 図.系列[番] && 図.系列[番].点[i];
    const 座標 = 点の座標[番] && 点の座標[番][i];
    if (!点 || !座標) return null;
    const 行たち = [
      `${一本 ? '' : `${図.系列[番].名}  `}${点.x}`,
      `${Number(点.y).toFixed(1)}${図.単位}${Number.isFinite(点.射数) ? `（${点.射数}射）` : 点.補足 ? `（${点.補足}）` : ''}`,
    ];
    const 幅 = Math.max(...行たち.map((行) => 字の幅(行, 13.5))) + 22;
    const 左の位置 = Math.min(Math.max(2, 座標.x - 幅 / 2), Math.max(2, W - 幅 - 2));
    // 点の上に出す。上に入らなければ下に
    const 上の位置 = 座標.y - 52 >= 0 ? 座標.y - 52 : 座標.y + 12;
    return { 行たち, 幅, 左の位置, 上の位置 };
  })();
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
            {通算 != null ? (
              <Svgの部品.Line
                x1={左}
                x2={W - 右}
                y1={y(通算)}
                y2={y(通算)}
                stroke={色.灰}
                strokeWidth="1.2"
                strokeDasharray="4 3"
                testID="通算の線"
              />
            ) : null}
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
                  {一本 && 名たち.length > 1 && 道 ? (
                    // 線が 1 本のときは、線の下をうすく塗る（推移が目で追いやすい）
                    <Svgの部品.Path
                      d={`${道} L${x(位置(系列.点.filter((点) => 位置(点) >= 0).slice(-1)[0]))},${y(低)} L${x(位置(系列.点.find((点) => 位置(点) >= 0)))},${y(低)} Z`}
                      fill={線の色}
                      fillOpacity={0.07}
                    />
                  ) : null}
                  <Svgの部品.Path d={道} fill="none" stroke={線の色} strokeWidth="2" strokeLinejoin="round" />
                  {系列.点.map((点, i) => {
                    if (位置(点) < 0) return null;
                    const 数を付ける = 番 === 0 && 数の置き場.has(i);
                    return (
                      <React.Fragment key={`点-${番}-${i}`}>
                        {丸を描く || 数を付ける ? (
                          <Svgの部品.Circle
                            cx={x(位置(点))}
                            cy={y(点.y)}
                            r={丸の半径}
                            fill={線の色}
                            stroke={色.白}
                            strokeWidth="1.5"
                          />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {端の名の置き場.map((置き場) => (
              <Svgの部品.Text
                key={`端の名-${置き場.番}`}
                fontFamily={図の字体}
                x={W - 右 + 6}
                y={置き場.y + 字 * 0.35}
                fontSize={字}
                fontWeight="bold"
                fill={系列の色[置き場.番 % 系列の色.length]}
                textAnchor="start"
              >
                {端の名(図.系列[置き場.番].名)}
              </Svgの部品.Text>
            ))}
            {選んだ点 && 大きく ? (
              <Svgの部品.Circle
                cx={点の座標[選んだ点[0]][選んだ点[1]].x}
                cy={点の座標[選んだ点[0]][選んだ点[1]].y}
                r={丸の半径 + 3}
                fill="none"
                stroke={系列の色[選んだ点[0] % 系列の色.length]}
                strokeWidth="2"
              />
            ) : null}
            {[...数の置き場].map(([i, 置き場]) => (
              <Svgの部品.Text
                key={`数-${i}`}
                fontFamily={図の字体}
                x={置き場.x}
                y={置き場.y}
                fontSize={値の字}
                fontWeight="bold"
                fill={色.文字}
                textAnchor="middle"
              >
                {置き場.字}
              </Svgの部品.Text>
            ))}
          </Svg>
        ) : null}
        {/* 大きく出したときだけ、点を押せる（押すとその点の日付・率・射数） */}
        {大きく && W > 0 ? (
          // 押した位置にいちばん近い点を選ぶ（点ごとに押す所を置くと、点が多い図で隣の点と重なった）
          <View
            testID="図の押す面"
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(出来事) => {
              const { locationX: px, locationY: py } = 出来事.nativeEvent;
              let 近い = null;
              点の座標.forEach((点たち, 番) =>
                点たち.forEach((座標, i) => {
                  if (!座標) return;
                  // 横の近さを重く見る（同じ日の 2 本の線は、縦の近さで分ける）
                  const 距離 = Math.abs(座標.x - px) * 3 + Math.abs(座標.y - py);
                  if (!近い || 距離 < 近い.距離) 近い = { 番, i, 距離 };
                })
              );
              if (!近い) return;
              選んだ点を置く((前) =>
                前 && 前[0] === 近い.番 && 前[1] === 近い.i ? null : [近い.番, 近い.i]
              );
            }}
          />
        ) : null}
        {選んだ中身 ? (
          <View
            pointerEvents="none"
            testID="図の点の中身"
            style={[
              styles.点の中身,
              { left: 選んだ中身.左の位置, top: 選んだ中身.上の位置, width: 選んだ中身.幅 },
            ]}
          >
            {選んだ中身.行たち.map((行, k) => (
              <Text key={`中身-${k}`} style={[styles.点の中身の字, k === 1 && styles.点の中身の数]}>
                {行}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      {大きく ? <Text style={styles.注}>点を押すと、その点の的中率と射数が出ます</Text> : null}
      {通算 != null ? (
        // 通算の字は図の外に書く（図の中では点の数字に重なった）
        <View style={styles.凡例の一つ}>
          <View style={styles.通算の印} />
          <Text style={styles.凡例の字}>{通算の字}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 縦の棒と、その下の通算の字 */
function 縦の棒と通算(props) {
  const 通算 = Number.isFinite(props.図.通算) ? props.図.通算 : null;
  return (
    <View>
      <縦の棒 {...props} />
      {通算 != null ? (
        <View style={styles.凡例の一つ}>
          <View style={styles.通算の印} />
          <Text style={styles.凡例の字}>
            {`通算 ${Number(通算).toFixed(1)}${props.図.単位}（これより上の棒を濃く）`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function 縦の棒({ 図, 大きく }) {
  const [W, 測る] = use幅();
  const 窓の高さ = use窓の高さ();
  // 並びが空の図は描かない（いちばん高い棒が -Infinity になって崩れる）
  if (!Array.isArray(図.並び) || !図.並び.length) return null;
  const H = 図の高さ(W, 大きく, 窓の高さ);
  const 字 = 大きく ? 11 : 10;
  const 上 = 字 + 8;
  const 下 = 字 + 10;
  const 単位が率 = 図.単位 === '%';
  // 通算（分かるとき）。通算より上の棒を濃くし、点線を引く。分からないときは、いちばん高い棒だけ濃く
  const 通算 = Number.isFinite(図.通算) ? 図.通算 : null;
  const 高 = Math.max(...図.並び.map((項) => 項.値), 通算 ?? 0, 1);
  const いちばん = Math.max(...図.並び.map((項) => 項.値));
  const 濃いか = (項) => (通算 != null ? 項.値 >= 通算 : 項.値 === いちばん);
  const 通算のy = 通算 == null ? null : H - 下 - ((H - 上 - 下) * 通算) / 高;
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
          {/* 通算の点線は棒の後ろに引き、数の字の下には白い札を敷く（点線が数を横切っていた） */}
          {通算のy != null ? (
            <Svgの部品.Line
              x1={4}
              x2={W - 4}
              y1={通算のy}
              y2={通算のy}
              stroke={色.灰_濃い}
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          ) : null}
          {図.並び.map((項, i) => {
            // 棒は 0 から（差を大きく見せない）
            // 負の値（差の図など）は 0 の高さにする（負の高さの棒は下へ突き抜けて、名の字に重なる）
            const h = ((H - 上 - 下) * Math.max(0, 項.値)) / 高;
            const 濃い = 濃いか(項);
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
                {(値を全部 || i === 高い番 || i === 低い番) && 通算のy != null ? (
                  <Svgの部品.Rect
                    x={
                      Math.min(W - 16, Math.max(16, 4 + i * 幅 + 幅 / 2)) -
                      字の幅(単位が率 ? Number(項.値).toFixed(1) : `${項.値}`, 値の字) / 2 -
                      2
                    }
                    y={H - 下 - h - 4 - 値の字}
                    width={字の幅(単位が率 ? Number(項.値).toFixed(1) : `${項.値}`, 値の字) + 4}
                    height={値の字 + 3}
                    fill={色.白}
                  />
                ) : null}
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
  // 並びが空の図は描かない（縦の棒と同じ）
  if (!Array.isArray(図.並び) || !図.並び.length) return null;
  const 上限 =
    図.単位 === '%'
      ? Math.max(100, ...図.並び.map((項) => 項.値))
      : Math.max(1, ...図.並び.map((項) => 項.値));
  const いちばん = Math.max(...図.並び.map((項) => 項.値));
  // 名前の欄は、いちばん長い名前の幅まで。ただし図の幅の 4 割まで（棒の長さを残す）
  const 字 = 大きく ? 14 : 12;
  const 長い名 = Math.max(...図.並び.map((項) => 字の幅(項.名, 字))) + 6;
  const 名の幅 = Math.round(Math.max(48, Math.min(長い名, (W || 300) * 0.4)));
  // 順位があれば、名前の左に出す（2026-11-14）
  const 順位あり = 図.並び.some((項) => 項.順位 != null);
  // 射数の少ない人（平均の 3 分の 1 未満）は、名前を灰色にして射数を小さく添える（率が振れやすい）
  const 射数たち = 図.並び.map((項) => 項.射数).filter((n) => Number.isFinite(n));
  const 平均の射数 = 射数たち.length ? 合計(射数たち) / 射数たち.length : 0;
  const 少ない = (項) => Number.isFinite(項.射数) && 項.射数 < 平均の射数 / 3;
  return (
    <View onLayout={測る}>
      {図.並び.map((項, i) => (
        <View key={`横-${i}`} style={styles.横の行}>
          {順位あり ? (
            <Text style={[styles.横の順位, 大きく && styles.大きい字]}>{項.順位 != null ? 項.順位 : ''}</Text>
          ) : null}
          <View style={{ width: 名の幅 }}>
            <Text
              style={[
                styles.横の名,
                大きく && styles.大きい字,
                { width: 名の幅 },
                少ない(項) && styles.薄い名,
              ]}
              numberOfLines={大きく ? 2 : 1}
            >
              {項.名}
            </Text>
            {少ない(項) ? <Text style={styles.横の射数}>{`${項.射数}射`}</Text> : null}
          </View>
          <View style={styles.横の地}>
            <View
              style={[
                styles.横の棒,
                // 負の値は最短の棒にする（負の幅は描けない）
                {
                  width: `${Math.max(2, (Math.max(0, 項.値) / 上限) * 100)}%`,
                  opacity: 項.値 === いちばん ? 1 : 0.4,
                },
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
  // 広げる列の見積もりが全部 0（空の列だけの表）なら、比で分けられない（0 で割ると幅が NaN になる）
  if (広げる列の和 <= 残り && 広げる列の和 > 0) {
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
  // 列の無い表・行の無い形の図は描かない（控えに残った前の形の図など）
  if (!Array.isArray(図.列) || !図.列.length || !Array.isArray(図.行)) return null;
  const 列の数 = 図.列.length;
  const 強める = 図.強める列 == null ? null : 図.強める列 < 0 ? 列の数 + 図.強める列 : 図.強める列;
  const 字 = 大きく ? 14 : 12.5;
  const 数の列 = 図.列.map((_, 列) => 図.行.length > 0 && 図.行.every((行) => 数らしい(行[列])));
  // 升の左右の余白（4 ずつ）と、見積もりのずれのぶんを足す
  const 見積もり = 図.列.map((名, 列) =>
    Math.ceil(Math.max(字の幅(名, 11), ...図.行.map((行) => 字の幅(行[列], 字))) + 12)
  );
  const 幅たち = 列の幅を決める(見積もり, 数の列, 幅, 大きく);
  // 「差」の列は、プラスを緑・マイナスを赤にする（2026-11-14。前はどちらも青）
  const 差の列 = 図.列.findIndex((名) => /差$/.test(String(名)));
  const 差の色 = (値) =>
    /^\+/.test(String(値)) ? styles.差_上 : /^[-−]/.test(String(値)) ? styles.差_下 : null;
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
            <View key={`行-${番}`} style={[styles.表の行, 番 % 2 === 1 && styles.表の行_縞]}>
              {行.map((値, 列) => (
                // 余白は字の外の箱に付ける。字に付けると、2 行で切った 3 行目の頭が下の余白に覗く（iPhone）
                <View key={`升-${番}-${列}`} style={[styles.升, { width: 幅たち[列] }]}>
                  <Text
                    style={[
                      styles.表の字,
                      大きく && styles.大きい表の字,
                      数の列[列] && styles.右,
                      列 === 強める && 列 !== 差の列 && styles.強める,
                      列 === 差の列 && 差の色(値),
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
    return 図.向き === '横' ? <横の棒 図={図} 大きく={大きく} /> : <縦の棒と通算 図={図} 大きく={大きく} />;
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
          {/* 題は 2 行まで（1 行で「…」に切れていた。2026-11-13） */}
          <Text style={styles.題} numberOfLines={2}>
            {図.題}
          </Text>
          <Icons.Ionicons name="expand-outline" size={16} color={色.青} style={styles.大きくの絵} />
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
  題の行: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  題: { flex: 1, fontSize: 13, fontWeight: 'bold', color: 色.文字 },
  大きい題: { fontSize: 16 },
  大きくの絵: { marginLeft: 8 },
  注: { fontSize: 11, color: 色.灰, marginTop: 6 },
  // 画面の幅が変わって測り直すまでの間も、前の幅の SVG でページを押し広げない
  図の箱: { width: '100%', overflow: 'hidden' },
  凡例: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  凡例の一つ: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  凡例の印: { width: 10, height: 3, borderRadius: 2, marginRight: 4 },
  点の中身: {
    position: 'absolute',
    backgroundColor: 色.文字,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  点の中身の字: { fontSize: 12, color: 色.白, lineHeight: 17 },
  点の中身の数: { fontWeight: 'bold', fontSize: 13 },
  通算の印: {
    width: 14,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 色.灰,
    marginRight: 4,
  },
  凡例の字: { fontSize: 12, color: 色.文字_二, marginBottom: 4 },
  横の行: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  横の名: { width: 82, fontSize: 12, color: 色.文字 },
  横の順位: { width: 20, fontSize: 11, fontWeight: '600', color: 色.灰, textAlign: 'right', marginRight: 6 },
  薄い名: { color: 色.灰 },
  横の射数: { fontSize: 10, color: 色.灰, lineHeight: 12 },
  // 表の 1 行おきの色
  表の行_縞: { backgroundColor: 色.地 },
  差_上: { color: 色.緑, fontWeight: 'bold' },
  差_下: { color: 色.赤, fontWeight: 'bold' },
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

// 流し読みのあいだは、1 かけらごとに会話が描き直される。図は中身が同じなら描き直さない（D7）
const 覚えた図 = React.memo(ChatFigure);
module.exports = { ChatFigure: 覚えた図 };
