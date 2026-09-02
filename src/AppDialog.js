/**
 * アプリの中で出す確認・お知らせの窓。
 *
 * ブラウザの window.confirm / window.alert は、見た目がアプリと揃わず、
 * 出る位置も機種によって違う。ここを通せば、どの画面から呼んでも
 * 同じ形の窓が画面の中に出る。
 *
 * 呼び口は Alert と同じ形にしてある（alertBridge.js が中でこれを呼ぶ）。
 *   出す('題', '文')                          … OKだけの知らせ
 *   出す('題', '文', [{ text, onPress, style }]) … 選ばせる確認
 *
 * ボタンが無い／1つだけのものは「知らせ」なので、押す手間を増やさないよう
 * 画面下の帯（トースト）で出して自動で消す。2つ以上あるものだけ窓で止める。
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const React = require('react');
const { useState, useEffect, useRef } = React;
const RN = require('react-native');
const _View = RN.View;
const _Text = require('./Text').default; // テーマ変換を通すためブリッジ経由
const _StyleSheet = require('./StyleSheet').default;
const _Modal = RN.Modal;
// 帯か窓かの決まりは純粋な関数なので外に出してある。
// 43か所ぶんの実際の文で、node --test から確かめている（test/dialogRules.test.js）
const { 窓で止めるか, 帯の長さ, 帯の時計をつくる } = require('./dialogRules');
const _Pressable = RN.Pressable;
const _ScrollView = RN.ScrollView;

/**
 * 帯を包んでいる Modal の容器を、指が素通りする状態にする。
 *
 * Modal に pointerEvents="none" を渡しても、react-native-web は中の View に
 * しか渡さない。容器（画面いっぱいの position:fixed の箱）は指を吸ったまま
 * なので、帯が出ているあいだ、下の入力欄や釦が押せなくなる。
 * 実際、新規作成で「すべての項目を入力してください」の帯が出ているあいだ、
 * メールアドレスの欄を押せなかった。
 *
 * 帯は読ませるだけで押させないので、容器ごと素通りにしてよい。
 * 中の View で受け取った節から親をたどって、画面いっぱいの箱に印を付ける。
 */
function 帯を素通りにする(節) {
  if (!節 || typeof window === 'undefined') return;
  let n = 節;
  for (let i = 0; i < 6 && n; i++) {
    if (n.style) n.style.pointerEvents = 'none';
    const 親 = n.parentNode;
    // 画面いっぱいの箱まで来たら、そこで止める
    if (!親 || 親 === document.body) break;
    n = 親;
  }
}

// 画面側（アプリの窓）が入れ替わっても届くよう、購読の形にしておく
let 聞き手 = null;
let 待ち = [];

/** 窓を出す。Alert.alert と同じ引数 */
function 出す(題, 文, ボタン) {
  const 要求 = { 題: 題 || '', 文: 文 || '', ボタン: Array.isArray(ボタン) ? ボタン : [] };
  if (聞き手) 聞き手(要求);
  else 待ち.push(要求); // まだ描かれていないときは覚えておく
}

/** 画面の根っこに1つだけ置く */
const アプリの窓 = () => {
  const [いま, 置く] = useState(null);
  const [帯, 帯を置く] = useState(null);
  // 帯を消す時計。掛け直すときに前のぶんを止める面倒は部品が持つ
  const 時計 = useRef(null);
  if (時計.current === null) 時計.current = 帯の時計をつくる(setTimeout, clearTimeout);

  useEffect(() => {
    聞き手 = (要求) => {
      if (窓で止めるか(要求)) {
        // ボタンが無い長い知らせは、閉じる手が要る。OK を1つ足す
        置く(要求.ボタン.length ? 要求 : { ...要求, ボタン: [{ text: 'OK' }] });
      } else {
        const 字 = 要求.文 || 要求.題;
        帯を置く(字);
        時計.current.掛ける(帯の長さ(字), () => 帯を置く(null));
        // 1つだけのボタンにも onPress があれば呼ぶ（従来と同じ動き）
        要求.ボタン[0] && 要求.ボタン[0].onPress && 要求.ボタン[0].onPress();
      }
    };
    const 残り = 待ち;
    待ち = [];
    残り.forEach((x) => 聞き手(x));
    return () => {
      聞き手 = null;
      時計.current.片付ける();
    };
  }, []);

  return (
    <>
      {/*
        Modal は「置かれたとき」に body の末尾へ場所を作る。場所には重なりの
        指定が無いので、先に置いたものほど下になる。ずっと置いておくと、
        あとから開いた部員の窓などに隠れて、見えているのに押せなくなる。
        だから出すときだけ置く。帯は押す邪魔をしないよう素通しにする。
      */}
      {帯 ? (
        <_Modal visible transparent animationType="fade" pointerEvents="none">
          <_View
            style={styles.帯}
            pointerEvents="none"
            testID="アプリの帯"
            /* pointerEvents は容器まで届かないので、描かれた節から親をたどって
               素通りにする。これが無いと、帯が出ているあいだ下が押せない */
            ref={帯を素通りにする}
          >
            <_Text style={styles.帯の字}>{帯}</_Text>
          </_View>
        </_Modal>
      ) : null}
      {いま ? (
      <_Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => 置く(null)}
      >
        <_View style={styles.背景}>
          <_View style={styles.札} testID="アプリの窓">
            {いま && いま.題 ? <_Text style={styles.題}>{いま.題}</_Text> : null}
            {/* 登録完了の控えのように長い文が来る。画面からはみ出して
                ボタンが押せなくならないよう、文だけを中でスクロールさせる */}
            {いま && いま.文 ? (
              <_ScrollView style={styles.文の枠} contentContainerStyle={styles.文の中}>
                <_Text style={styles.文}>{いま.文}</_Text>
              </_ScrollView>
            ) : null}
            <_View style={[styles.ボタンの列, (いま.ボタン || []).length > 2 && styles.ボタンの列縦]}>
              {(いま ? いま.ボタン : []).map((b, i) => (
                <_Pressable
                  key={`${b.text}-${i}`}
                  testID={`窓のボタン-${b.text}`}
                  style={[
                    styles.ボタン,
                    (いま.ボタン || []).length > 2 ? i > 0 && styles.仕切り縦 : i > 0 && styles.仕切り,
                  ]}
                  onPress={() => {
                    置く(null);
                    b.onPress && b.onPress();
                  }}
                >
                  <_Text
                    style={[
                      styles.ボタンの字,
                      b.style === 'cancel' && styles.打ち消し,
                      b.style === 'destructive' && styles.危ない,
                    ]}
                  >
                    {b.text}
                  </_Text>
                </_Pressable>
              ))}
            </_View>
          </_View>
        </_View>
      </_Modal>
      ) : null}
    </>
  );
};

const styles = _StyleSheet.create({
  背景: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  札: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  題: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E', paddingHorizontal: 20, paddingTop: 20 },
  文の枠: { maxHeight: 320 },
  文の中: { padding: 20 },
  文: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },
  ボタンの列: {
    flexDirection: 'row',
    borderTopWidth: _StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  // ボタンが3つ以上のときは縦に積む。横3等分だと長い文字が折り返して詰まる
  ボタンの列縦: { flexDirection: 'column' },
  ボタン: { flex: 1, padding: 16, alignItems: 'center' },
  仕切り: { borderLeftWidth: _StyleSheet.hairlineWidth, borderLeftColor: '#C6C6C8' },
  仕切り縦: { borderTopWidth: _StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8' },
  ボタンの字: { fontSize: 17, color: '#007AFF', fontWeight: 'bold' },
  打ち消し: { fontWeight: 'normal' },
  危ない: { color: '#FF3B30' },
  帯: {
    position: 'absolute',
    // 記録画面には自前の帯（bottom:100）がある。近いと同時に出たとき
    // 重なって読めないので、こちらは十分に離す
    bottom: 156,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20000,
  },
  帯の字: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '90%',
  },
});

exports.出す = 出す;
exports.アプリの窓 = アプリの窓;
