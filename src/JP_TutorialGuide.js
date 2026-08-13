/**
 * Module ID: TutorialGuide (hand-written, not bundler-generated)
 *
 * 初めて使う人向けの案内。実際の画面のボタンを指さして、吹き出しで説明する。
 * 「押してみましょう」の手順では、指した部分だけ触れるようにして、
 * 実際に操作してもらってから次へ進む。
 *
 * ■ 作りの方針
 * 指す先は「タブバー」と「記録画面の主要ボタン」に絞ってある。各画面の奥まで
 * 目印を付けると、画面を少し変えるたびに案内が壊れるため。
 * 目印が見つからないときは、穴を開けずに中央の吹き出しだけ出して先へ進む。
 * 案内が途中で止まるより、説明だけでも最後まで読めるほうがよい。
 *
 * Modal を使っていない。Modal だと穴の部分も覆われて、下のボタンを押せない。
 * 代わりに画面全体に重ねた View を置き、暗幕は指す先の周り4枚の帯で作る。
 * 穴の部分には何も置かないので、そのまま本物のボタンに届く。
 *
 * 手順の中身は tutorialSteps.js（画面の部品を持たない）に分けてある。
 *
 * ■ 使い方
 *   画面側： const ref = useTutorialTarget('記録.人');  → <View ref={ref} />
 *   繰り返しの中： ref={(node) => setTutorialTargetNode('タブ.履歴', node)}
 *   起動側： <TutorialOverlay navRef={navigationContainerRef} />
 *   任意起動： startTutorial()（設定の「使い方を見る」から）
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const React = require('react');
const { useState, useEffect, useRef, useCallback } = React;
const RN = require('react-native');
const _View = RN.View;
const _Text = require('./default_217').default; // テーマ変換を通すためブリッジ経由
const _StyleSheet = require('./default_45').default; // テーマ変換を通すためブリッジ経由
const _TouchableOpacity = RN.TouchableOpacity;
const _ScrollView = RN.ScrollView;

const { create } = require('zustand');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { Ionicons } = require('./AntDesign_600');
const { useScoreStore } = require('./JP_useScoreStore_174');
const { IS_WEB } = require('./IS_WEB_199');
const { 手順を作る } = require('./tutorialSteps');

// 案内の版。手順を作り直したら上げる。上げると、一度見た人にもまた出る
const TUTORIAL_VERSION = '2026-08-13-01';
const 保存キー = 'tutorialDoneVersion';

// ─────────────────────────────────────────
// 目印の登録先。画面側が ref を置き、案内側が位置を測る
// ─────────────────────────────────────────
const 目印帳 = new Map();

/** 画面側で使う。返ってきた ref を、指してほしい要素に付ける */
function useTutorialTarget(名前) {
  const ref = useRef(null);
  useEffect(() => {
    目印帳.set(名前, ref);
    return () => {
      // 付け替えの途中で他の画面の ref を消さないよう、自分のときだけ外す
      if (目印帳.get(名前) === ref) 目印帳.delete(名前);
    };
  }, [名前]);
  return ref;
}

/**
 * 繰り返しの中で使う登録。タブバーのように数が変わる場所ではフックが使えない
 * （役割でタブ数が変わり、フックの数が変わってしまう）ので、こちらを使う。
 *   ref={(node) => setTutorialTargetNode('タブ.履歴', node)}
 */
function setTutorialTargetNode(名前, node) {
  if (node) 目印帳.set(名前, { current: node });
  else 目印帳.delete(名前);
}

/** 目印の画面上の位置を測る。測れなければ null */
function 位置を測る(名前) {
  return new Promise((解決) => {
    const ref = 目印帳.get(名前);
    const 中身 = ref && ref.current;
    if (!中身 || typeof 中身.measureInWindow !== 'function') return 解決(null);
    let 済み = false;
    const 終わる = (v) => {
      if (!済み) ((済み = true), 解決(v));
    };
    try {
      中身.measureInWindow((x, y, 幅, 高さ) => {
        if (typeof x !== 'number' || !幅 || !高さ) return 終わる(null);
        終わる({ x, y, 幅, 高さ });
      });
    } catch (e) {
      終わる(null);
    }
    // measureInWindow は画面に無いと呼ばれ返らないことがある
    setTimeout(() => 終わる(null), 400);
  });
}

// ─────────────────────────────────────────
// 案内の進み具合。設定画面からも始められるよう、外に出してある
// ─────────────────────────────────────────
const use案内 = create((set) => ({
  進行中: false,
  番号: 0,
  始める: () => set({ 進行中: true, 番号: 0 }),
  進める: (n) => set({ 番号: n }),
  終える: () => set({ 進行中: false, 番号: 0 }),
}));

/** 設定画面などから案内を始める */
function startTutorial() {
  use案内.getState().始める();
}

/**
 * 「操作」の達成を測るための、いまの値。
 * 数が増える種類（射手を足すなど）と、値が変わる種類（射数を変えるなど）がある。
 */
function いまの値(状態, 種類) {
  const 射手 = 状態.archers || [];
  if (種類 === '射手を増やす') return 射手.filter((a) => a && !a.isSeparator && !a.isTotalCalculator).length;
  if (種類 === '間隔を足す') return 射手.filter((a) => a && a.isSeparator).length;
  if (種類 === '計を足す') return 射手.filter((a) => a && a.isTotalCalculator).length;
  if (種類 === '○×を入れる')
    return 射手.reduce(
      (合計, a) => 合計 + ((a && a.marks) || []).filter((m) => m === '○' || m === '×').length,
      0
    );
  if (種類 === '射数を変える') return 状態.shotsPerRound;
  if (種類 === '表示を変える') return 状態.viewScale;
  return null;
}

/** その種類は「増えたら達成」か、「変わったら達成」か */
function 達成した(種類, 基準, 現在) {
  if (基準 === null || 現在 === null || 現在 === undefined) return false;
  if (種類 === '射数を変える' || 種類 === '表示を変える') return 現在 !== 基準;
  return 現在 > 基準;
}

// ─────────────────────────────────────────
// 本体
// ─────────────────────────────────────────
const 既定の吹き出しの幅 = 300;
const 余白 = 12;

const TutorialOverlay = ({ navRef }) => {
  const 進行中 = use案内((s) => s.進行中);
  const 番号 = use案内((s) => s.番号);
  const 進める = use案内((s) => s.進める);
  const 終える = use案内((s) => s.終える);
  const 役割 = useScoreStore((s) => s.activeRole);
  const いまの画面 = useScoreStore((s) => s.currentRouteName);
  const [枠, 枠を置く] = useState(null);
  const [画面の大きさ, 大きさを置く] = useState(() => RN.Dimensions.get('window'));
  const 済み確認 = useRef(false);
  const 基準 = useRef(null);

  const 手順 = React.useMemo(() => 手順を作る(役割), [役割]);
  const いまの手順 = 進行中 ? 手順[番号] : null;

  // 画面の回転や窓の大きさ変更に追随する
  useEffect(() => {
    const 購読 = RN.Dimensions.addEventListener('change', ({ window: w }) => 大きさを置く(w));
    return () => 購読 && 購読.remove && 購読.remove();
  }, []);

  // 初めての人には自動で出す
  useEffect(() => {
    if (済み確認.current || !役割) return;
    済み確認.current = true;
    (async () => {
      try {
        const 済み = await AsyncStorage.getItem(保存キー);
        if (済み !== TUTORIAL_VERSION) use案内.getState().始める();
      } catch (e) {
        // 読めなくても勝手に出すほどではない。設定からいつでも見られる
        console.error('[TutorialGuide] 保存領域を読めませんでした:', e);
      }
    })();
  }, [役割]);

  // 手順が変わるたび、必要なら画面を移動してから位置を測る
  useEffect(() => {
    if (!いまの手順) return;
    let 捨てた = false;
    枠を置く(null);
    基準.current =
      いまの手順.操作 && いまの手順.操作.種類 !== 'タブへ移動'
        ? いまの値(useScoreStore.getState(), いまの手順.操作.種類)
        : null;
    (async () => {
      if (いまの手順.画面 && navRef && navRef.current) {
        try {
          const 現在 = navRef.current.getCurrentRoute();
          if (!現在 || 現在.name !== いまの手順.画面) {
            navRef.current.navigate(いまの手順.画面);
            // 画面が描かれるのを待つ。待たずに測ると必ず失敗する
            await new Promise((r) => setTimeout(r, 400));
          }
        } catch (e) {
          console.error('[TutorialGuide] 画面を移動できませんでした:', e);
        }
      }
      if (捨てた || !いまの手順.目印) return;
      let 位置 = await 位置を測る(いまの手順.目印);
      if (!位置 && !捨てた) {
        // 一度で測れないことがある（描画の途中など）ので、少し待って再挑戦
        await new Promise((r) => setTimeout(r, 300));
        位置 = await 位置を測る(いまの手順.目印);
      }
      if (!捨てた) 枠を置く(位置);
    })();
    return () => {
      捨てた = true;
    };
  }, [いまの手順, navRef]);

  // 「押してみましょう」の手順は、実際に操作されたら次へ進む
  useEffect(() => {
    const 操作 = いまの手順 && いまの手順.操作;
    if (!操作) return;
    if (操作.種類 === 'タブへ移動') {
      if (いまの画面 === 操作.先) {
        const t = setTimeout(() => 進める(番号 + 1), 500);
        return () => clearTimeout(t);
      }
      return;
    }
    const 解除 = useScoreStore.subscribe((状態) => {
      if (達成した(操作.種類, 基準.current, いまの値(状態, 操作.種類))) {
        基準.current = null;
        // 押した手応えが見えるよう、少し置いてから進む
        setTimeout(() => 進める(番号 + 1), 500);
      }
    });
    return 解除;
  }, [いまの手順, いまの画面, 番号, 進める]);

  const 閉じる = useCallback(async () => {
    終える();
    try {
      await AsyncStorage.setItem(保存キー, TUTORIAL_VERSION);
    } catch (e) {
      console.error('[TutorialGuide] 保存領域に書けませんでした:', e);
    }
  }, [終える]);

  if (!進行中 || !いまの手順) return null;

  const 最後 = 番号 >= 手順.length - 1;
  const 触ってもらう = !!いまの手順.操作;
  const { width: 画面幅, height: 画面高 } = 画面の大きさ;

  // 吹き出しの位置。
  // 高さを当てにしない。上に出すときは「下端」を指す先の上に固定するので、
  // 中身が何行になっても指す先を覆わない。
  // 上下どちらにも読める広さが無いときだけ、真ん中に出す。指す先の一部に
  // 重なるが、画面の外へはみ出して読めなくなるよりはよい
  const 読める高さ = 200;
  // 幅の狭い端末では画面からはみ出す。画面に合わせて縮める
  const 吹き出しの幅 = Math.min(既定の吹き出しの幅, 画面幅 - 余白 * 2);
  let 置き場 = { top: Math.max(余白, (画面高 - 読める高さ) / 2), maxHeight: 画面高 - 余白 * 2 };
  let 吹き出しの左 = (画面幅 - 吹き出しの幅) / 2;
  if (枠) {
    const 下の空き = 画面高 - (枠.y + 枠.高さ) - 余白 * 2;
    const 上の空き = 枠.y - 余白 * 2;
    if (下の空き >= 読める高さ && 下の空き >= 上の空き)
      置き場 = { top: 枠.y + 枠.高さ + 余白, maxHeight: 下の空き };
    else if (上の空き >= 読める高さ) 置き場 = { bottom: 画面高 - 枠.y + 余白, maxHeight: 上の空き };
    else if (下の空き >= 読める高さ) 置き場 = { top: 枠.y + 枠.高さ + 余白, maxHeight: 下の空き };
    吹き出しの左 = Math.min(
      Math.max(余白, 枠.x + 枠.幅 / 2 - 吹き出しの幅 / 2),
      Math.max(余白, 画面幅 - 吹き出しの幅 - 余白)
    );
  }

  // 穴あきの暗幕は、指す先の周り4枚の帯で作る。
  // SVG の切り抜きを使わないので、Web でもアプリでも同じに出る。
  // 穴の部分には何も置かないため、本物のボタンをそのまま押せる
  const 暗幕 = [];
  if (枠) {
    暗幕.push(
      { key: '上', top: 0, left: 0, right: 0, height: Math.max(0, 枠.y - 4) },
      { key: '下', top: 枠.y + 枠.高さ + 4, left: 0, right: 0, bottom: 0 },
      { key: '左', top: Math.max(0, 枠.y - 4), left: 0, width: Math.max(0, 枠.x - 4), height: 枠.高さ + 8 },
      { key: '右', top: Math.max(0, 枠.y - 4), left: 枠.x + 枠.幅 + 4, right: 0, height: 枠.高さ + 8 }
    );
  } else {
    暗幕.push({ key: '全面', top: 0, left: 0, right: 0, bottom: 0 });
  }

  return (
    <_View style={styles.根} pointerEvents="box-none">
      {暗幕.map(({ key, ...位置 }) => (
        <_TouchableOpacity key={key} activeOpacity={1} onPress={() => {}} style={[styles.暗幕, 位置]} />
      ))}

      {枠 && (
        <_View
          pointerEvents="none"
          style={[styles.強調, { top: 枠.y - 4, left: 枠.x - 4, width: 枠.幅 + 8, height: 枠.高さ + 8 }]}
        />
      )}

      <_View style={[styles.吹き出し, 置き場, { left: 吹き出しの左, width: 吹き出しの幅 }]}>
        <_View style={styles.見出し行}>
          <_Text style={styles.番号}>{`${番号 + 1} / ${手順.length}`}</_Text>
          <_TouchableOpacity onPress={閉じる} style={styles.閉じるボタン}>
            <_Text style={styles.閉じる文字}>スキップ</_Text>
          </_TouchableOpacity>
        </_View>

        <_Text style={styles.題}>{いまの手順.題}</_Text>
        {/* 説明はここに収める。上限を超えたぶんは中で送る。
            そのまま並べると枠の外へはみ出して、下の画面に重なって見える */}
        <_ScrollView style={styles.本文} contentContainerStyle={{ paddingBottom: 2 }}>
          {いまの手順.文.map((一文, i) => (
            <_Text key={i} style={styles.文}>
              {一文}
            </_Text>
          ))}
        </_ScrollView>

        {触ってもらう && (
          <_View style={styles.やってみる}>
            <Ionicons name="hand-left-outline" size={16} color="#FF9500" />
            <_Text style={styles.やってみる文字}>{いまの手順.操作.案内}</_Text>
          </_View>
        )}

        <_View style={styles.操作行}>
          {番号 > 0 ? (
            <_TouchableOpacity onPress={() => 進める(番号 - 1)} style={styles.戻るボタン}>
              <Ionicons name="chevron-back" size={16} color="#007AFF" />
              <_Text style={styles.戻る文字}>戻る</_Text>
            </_TouchableOpacity>
          ) : (
            <_View />
          )}
          {触ってもらう ? (
            // 押せない事情があっても行き止まりにならないよう、控えめな逃げ道を置く
            <_TouchableOpacity onPress={() => 進める(番号 + 1)} style={styles.とばすボタン}>
              <_Text style={styles.とばす文字}>とばす</_Text>
            </_TouchableOpacity>
          ) : (
            <_TouchableOpacity onPress={() => (最後 ? 閉じる() : 進める(番号 + 1))} style={styles.次へボタン}>
              <_Text style={styles.次へ文字}>{最後 ? '始める' : '次へ'}</_Text>
            </_TouchableOpacity>
          )}
        </_View>
      </_View>
    </_View>
  );
};

const styles = _StyleSheet.create({
  根: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 },
  暗幕: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  強調: { position: 'absolute', borderWidth: 2, borderColor: '#007AFF', borderRadius: 10 },
  吹き出し: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
    ...(IS_WEB ? { boxShadow: '0 6px 24px rgba(0,0,0,0.25)' } : { elevation: 8 }),
  },
  見出し行: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  番号: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  閉じるボタン: { paddingVertical: 2, paddingHorizontal: 4 },
  閉じる文字: { fontSize: 13, color: '#8E8E93' },
  題: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  本文: { flexShrink: 1 },
  文: { fontSize: 14, color: '#3A3A3C', lineHeight: 21, marginBottom: 3 },
  やってみる: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6E5',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  やってみる文字: { fontSize: 14, color: '#B26A00', fontWeight: 'bold', marginLeft: 6, flexShrink: 1 },
  操作行: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  戻るボタン: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  戻る文字: { fontSize: 15, color: '#007AFF' },
  とばすボタン: { paddingVertical: 8, paddingHorizontal: 12 },
  とばす文字: { fontSize: 15, color: '#8E8E93' },
  次へボタン: { backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22 },
  次へ文字: { fontSize: 15, color: '#FFFFFF', fontWeight: 'bold' },
});

exports.TutorialOverlay = TutorialOverlay;
exports.useTutorialTarget = useTutorialTarget;
exports.setTutorialTargetNode = setTutorialTargetNode;
exports.startTutorial = startTutorial;
exports.TUTORIAL_VERSION = TUTORIAL_VERSION;
