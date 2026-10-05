/**
 * 矢所の画面の的。大きな的（押して置く）と、メンバーごとの小さな的（見るだけ）を同じ絵で描く。
 *
 *  ・的の直径は四角の 0.75（星的 24cm は 0.5）。四角の灰色が的の外（×）。決まりは src/yadokoroRules.js
 *  ・的の白と黒は、ダークモードでも本物の的の色のまま（対応表に無い色を使う。src/theme.js は表にある色だけ替える）
 *  ・押す：指を置くと下絵が出て、動かすと付いてくる。離した所に置く。四角の外へ逃がして離すと置かない。
 *    マウスは動かすだけで下絵が付いてくる。PanResponder は使わず、的の節に pointer の出来事を直に付ける
 *    （react-native-web の responder は、動いてから掴むと取りこぼし、字の選択で取り上げられる）
 */
'use strict';

const React = require('react');
const { View, Text } = require('./rn');
const { 的の割合, 押した所 } = require('./yadokoroRules');

const 白 = '#FEFEFE';
const 黒 = '#111111';
const 外の色 = '#E5E5EA';
const 中りの色 = '#34C759';
const 外れの色 = '#FF3B30';

/** 下絵の色。置けない側（○×と合わない）は灰色 */
const 下絵の色 = (下絵) => (下絵.置けない ? '#8E8E93' : 下絵.内側 ? 中りの色 : 外れの色);

/** 的の輪。霞的は外から黒・白を 6 つ重ねる。星的は白の的に黒い星 */
function 輪たち(直径, 的の種類) {
  const 輪 = (割合, 色, 鍵, 枠) => (
    <View
      key={鍵}
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 直径 * 割合,
        height: 直径 * 割合,
        borderRadius: (直径 * 割合) / 2,
        backgroundColor: 色,
        ...(枠 ? { borderWidth: 1, borderColor: 黒 } : null),
      }}
    />
  );
  if ('hoshi36' === 的の種類 || 'hoshi24' === 的の種類) return [輪(1, 白, 'a', true), 輪(0.25, 黒, 'b')];
  return [1, 5 / 6, 4 / 6, 3 / 6, 2 / 6, 1 / 6].map((割合, 番) => 輪(割合, 番 % 2 ? 白 : 黒, 番));
}

/**
 * 的の絵。点たち：{x, y, 印, 射番}（x・y は的の縁が 1）。
 * 大きいとき（番号つき）は点に射番を出し、いまの射を大きく縁取る
 */
const 的の絵 = React.memo(
  ({ 大きさ, 的の種類, 点たち = [], いまの番 = null, 番号 = false, 下絵 = null, 待ち = null, 角 }) => {
    const 直径 = 大きさ * 的の割合(的の種類);
    const 半径 = 直径 / 2;
    const 点の径 = 番号 ? Math.max(22, Math.min(30, 大きさ * 0.085)) : Math.max(5, Math.round(大きさ * 0.15));
    const 置き場 = (x, y, 径) => {
      const 限り = 大きさ / 2 - 径 / 2;
      const 寄せる = (v) => Math.max(-限り, Math.min(限り, v));
      return { left: 大きさ / 2 + 寄せる(x * 半径) - 径 / 2, top: 大きさ / 2 + 寄せる(y * 半径) - 径 / 2 };
    };
    return (
      <View
        pointerEvents="none"
        style={{
          width: 大きさ,
          height: 大きさ,
          borderRadius: 角 == null ? Math.max(4, 大きさ * 0.05) : 角,
          backgroundColor: 外の色,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {輪たち(直径, 的の種類)}
        {点たち.map((点) => {
          const いま = 点.射番 === いまの番;
          const 径 = いま && 番号 ? 点の径 + 8 : 点の径;
          return (
            <View
              key={点.射番}
              pointerEvents="none"
              style={{
                position: 'absolute',
                ...置き場(点.x, 点.y, 径),
                width: 径,
                height: 径,
                borderRadius: 径 / 2,
                backgroundColor: '○' === 点.印 ? 中りの色 : 外れの色,
                borderWidth: いま && 番号 ? 3 : 番号 ? 1.5 : 0.8,
                borderColor: いま && 番号 ? 黒 : 白,
                opacity: 番号 && null !== いまの番 && !いま ? 0.75 : 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {番号 ? (
                <Text style={{ color: 白, fontSize: いま ? 13 : 11, fontWeight: 'bold' }}>{点.射番 + 1}</Text>
              ) : null}
            </View>
          );
        })}
        {待ち ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              ...置き場(待ち.x, 待ち.y, 30),
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 3,
              borderColor: '#FF9500',
              borderStyle: 'dashed',
            }}
          />
        ) : null}
        {下絵 ? (
          // 指で隠れても位置が分かるように、点を通る縦と横の線を的いっぱいに引く
          <>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 1.5,
                left: 置き場(下絵.x, 下絵.y, 0).left,
                backgroundColor: 下絵の色(下絵),
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 1.5,
                top: 置き場(下絵.x, 下絵.y, 0).top,
                backgroundColor: 下絵の色(下絵),
              }}
            />
          </>
        ) : null}
        {下絵 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              ...置き場(下絵.x, 下絵.y, 34),
              width: 34,
              height: 34,
              borderRadius: 17,
              borderWidth: 2,
              borderColor: 下絵の色(下絵),
              backgroundColor: 下絵.置けない
                ? 'rgba(142,142,147,0.45)'
                : 下絵.内側
                  ? 'rgba(52,199,89,0.45)'
                  : 'rgba(255,59,48,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 白, fontSize: 15, fontWeight: '900' }}>
              {下絵.置けない ? '—' : 下絵.内側 ? '○' : '\xd7'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
);

/**
 * 押して置く大きな的。置く(位置) は離したときに 1 回だけ呼ぶ（位置は {x, y, 内側}）。
 * 使える が偽のとき（見るだけ・メンバーがいない）は、押しても何もしない
 */
function 押せる的({ 大きさ, 的の種類, 点たち, いまの番, 使える, 置く, 待ち, testID, 読み, 合う側 = null }) {
  const 節 = React.useRef(null);
  const [下絵, 下絵を置く] = React.useState(null);
  // 出来事は一度だけ付ける。中で読む値は ref から（付けたときの値で固まらないように）
  const 最新 = React.useRef({});
  最新.current = { 的の種類, 使える, 置く, 合う側 };
  React.useEffect(() => {
    const 箱 = 節.current;
    if (!箱 || 'function' !== typeof 箱.addEventListener) return undefined;
    // 押している間に画面が流れたり、字が選ばれたり、長押しのメニューが出たりしないように
    if (箱.style) {
      箱.style.touchAction = 'none';
      箱.style.userSelect = 'none';
      箱.style.webkitUserSelect = 'none';
      箱.style.webkitTouchCallout = 'none';
    }
    let 押している = false;
    const 位置 = (e) => {
      const 所 = 押した所(e.clientX, e.clientY, 箱.getBoundingClientRect(), 最新.current.的の種類);
      const 合う = 最新.current.合う側;
      return 所 && 合う ? Object.assign(所, { 置けない: 所.内側 !== ('○' === 合う) }) : 所;
    };
    const 下 = (e) => {
      if (!最新.current.使える || (null != e.button && e.button > 0)) return;
      押している = true;
      try {
        箱.setPointerCapture(e.pointerId);
      } catch (_) {
        /* 掴めなくても、離した所で置ける */
      }
      下絵を置く(位置(e));
      e.preventDefault();
    };
    const 動く = (e) => {
      if (!最新.current.使える) return;
      if (!押している && 'mouse' !== e.pointerType) return;
      下絵を置く(位置(e));
    };
    const 上 = (e) => {
      if (!押している) return;
      押している = false;
      try {
        箱.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* 掴んでいなければ放すものも無い */
      }
      const 所 = 位置(e);
      下絵を置く(null);
      if (所 && 最新.current.置く) 最新.current.置く(所);
    };
    const やめる = () => {
      押している = false;
      下絵を置く(null);
    };
    const 出た = () => {
      if (!押している) 下絵を置く(null);
    };
    const 止める = (e) => e.preventDefault();
    箱.addEventListener('pointerdown', 下);
    箱.addEventListener('pointermove', 動く);
    箱.addEventListener('pointerup', 上);
    箱.addEventListener('pointercancel', やめる);
    箱.addEventListener('pointerleave', 出た);
    箱.addEventListener('contextmenu', 止める);
    return () => {
      箱.removeEventListener('pointerdown', 下);
      箱.removeEventListener('pointermove', 動く);
      箱.removeEventListener('pointerup', 上);
      箱.removeEventListener('pointercancel', やめる);
      箱.removeEventListener('pointerleave', 出た);
      箱.removeEventListener('contextmenu', 止める);
    };
  }, []);
  return (
    <View
      ref={節}
      testID={testID}
      aria-label={読み}
      accessibilityLabel={読み}
      style={{ width: 大きさ, height: 大きさ }}
    >
      <的の絵
        大きさ={大きさ}
        的の種類={的の種類}
        点たち={点たち}
        いまの番={いまの番}
        番号
        下絵={下絵}
        待ち={待ち}
      />
    </View>
  );
}

module.exports = { 的の絵, 押せる的, 中りの色, 外れの色 };
