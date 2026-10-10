/**
 * 上から引っ張って更新（履歴・分析・メンバー・出欠の一覧。2026-10-10）。
 *
 * ■ なぜ自分で見るか
 * react-native-web の RefreshControl は引く手を持たない（中身を描くだけ）。一覧の DOM に指の出来事を付け、
 * いちばん上まで流れているときに下へ引いたら更新する。PanResponder は使わない（中の state が固まる・
 * 字の選択で取り上げられる。memory の rnweb-drag-pan-responder-pitfalls）。値は ref で持つ。
 * 引いている間はブラウザの引き下ろし（ページの再読み込み）を止める（touchmove を preventDefault）。
 *
 * 使い方：
 *   const 引く = use引いて更新(() => useScoreStore.getState().雲から取り直す());
 *   {引く.しるし}
 *   <FlatList ref={引く.ref} ... />   （ScrollView でもよい）
 */
'use strict';

const React = require('react');
const { useRef, useState, useEffect, useCallback } = React;
const { View, Text, ActivityIndicator } = require('./rn');
const { IS_WEB } = require('./IS_WEB');

/** 引いた長さ（指の動きの半分）がこれを越えて離したら更新する */
const 更新の引き = 60;
const 最大の引き = 90;

/** 一覧の部品（FlatList・ScrollView）から、流れる DOM の節を取る */
function 流れる節(部品) {
  if (!部品) return null;
  if (typeof 部品.getScrollableNode === 'function') return 部品.getScrollableNode();
  if (typeof 部品.getNativeScrollRef === 'function') return 部品.getNativeScrollRef();
  return 部品.nodeType === 1 ? 部品 : null;
}

function use引いて更新(更新する) {
  const ref = useRef(null);
  const [引き, set引き] = useState(0);
  const [更新中, set更新中] = useState(false);
  const 場 = useRef({ 始め: null, 引き: 0, 更新中: false });
  const 更新する_ref = useRef(更新する);
  更新する_ref.current = 更新する;

  const 始める = useCallback(async () => {
    if (場.current.更新中) return;
    場.current.更新中 = true;
    set更新中(true);
    // 検査（e2e/hikiOroshi.spec.mjs）が「更新が始まったか」を数えるための口
    globalThis.__引いて更新した回数 = (globalThis.__引いて更新した回数 || 0) + 1;
    try {
      await 更新する_ref.current();
    } catch (誤り) {
      console.warn('[引いて更新] 失敗:', 誤り);
    } finally {
      場.current.更新中 = false;
      set更新中(false);
      場.current.引き = 0;
      set引き(0);
    }
  }, []);

  useEffect(() => {
    if (!IS_WEB) return undefined;
    let 節 = null;
    let 外す = () => {};
    // 一覧は描いたあとに ref が入る。入るまで少し待って付ける
    const 付ける = () => {
      節 = 流れる節(ref.current);
      if (!節 || !節.addEventListener) return false;
      const 押した = (e) => {
        if (場.current.更新中 || 節.scrollTop > 0 || !e.touches || e.touches.length !== 1) {
          場.current.始め = null;
          return;
        }
        場.current.始め = e.touches[0].clientY;
      };
      const 動いた = (e) => {
        if (場.current.始め == null) return;
        const 差 = e.touches[0].clientY - 場.current.始め;
        if (差 <= 0 || 節.scrollTop > 0) {
          if (場.current.引き) {
            場.current.引き = 0;
            set引き(0);
          }
          return;
        }
        // 引いている間はページの引き下ろし（再読み込み）とはね返りを止める
        if (e.cancelable) e.preventDefault();
        const 長さ = Math.min(最大の引き, 差 * 0.5);
        場.current.引き = 長さ;
        set引き(長さ);
      };
      const 離した = () => {
        if (場.current.始め == null) return;
        場.current.始め = null;
        if (場.current.引き >= 更新の引き) 始める();
        else {
          場.current.引き = 0;
          set引き(0);
        }
      };
      節.addEventListener('touchstart', 押した, { passive: true });
      節.addEventListener('touchmove', 動いた, { passive: false });
      節.addEventListener('touchend', 離した, { passive: true });
      節.addEventListener('touchcancel', 離した, { passive: true });
      外す = () => {
        節.removeEventListener('touchstart', 押した);
        節.removeEventListener('touchmove', 動いた);
        節.removeEventListener('touchend', 離した);
        節.removeEventListener('touchcancel', 離した);
      };
      return true;
    };
    let 待ち = null;
    if (!付ける()) 待ち = setInterval(() => 付ける() && clearInterval(待ち), 300);
    return () => {
      if (待ち) clearInterval(待ち);
      外す();
    };
  }, [始める]);

  const 高さ = 更新中 ? 44 : 引き;
  const しるし =
    高さ > 0 ? (
      <View
        testID="引いて更新"
        style={{ height: 高さ, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexDirection: 'row', gap: 8 }}
      >
        {更新中 ? <ActivityIndicator size="small" color="#007AFF" /> : null}
        <Text style={{ fontSize: 13, color: '#8E8E93' }}>
          {更新中 ? '更新中…' : 引き >= 更新の引き ? '離すと更新' : '引いて更新'}
        </Text>
      </View>
    ) : null;

  return { ref, しるし, 更新中, 始める };
}

module.exports = { use引いて更新, 更新の引き };
