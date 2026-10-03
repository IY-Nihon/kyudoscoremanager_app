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
const { Text, StyleSheet, View, Modal, Pressable, ScrollView, Platform, Animated } = require('./rn');
// 帯か窓かの決まりは純粋な関数なので外に出してある。
// 43か所ぶんの実際の文で、node --test から確かめている（test/dialogRules.test.js）
const { 窓で止めるか, 帯の長さ, 帯の時計をつくる } = require('./dialogRules');

const IS_WEB = Platform.OS === 'web';

/**
 * 帯を出す層。web では body の直下に、画面いっぱいの固定の箱を作って、その中へ描く。
 *
 * ■ なぜ Modal に入れないか（2026-10-03）
 * 以前は帯も Modal の中に描いていた（あとから開く窓より手前に出すため）。ところが
 * react-native-web の Modal は、いちばん手前の Modal の外へ焦点が移ると、中へ戻す囲い
 * （ModalFocusTrap）を持つ。帯が出ている 2.6〜6 秒のあいだ、下の入力欄を押しても焦点が取れず、
 * キーボードが出ない・字が打てなかった（ログインに失敗した帯が出ている間は、IDを打ち直せない。
 * 窓の中でも同じで、メンバーの編集の窓で名前を空にして保存した帯のあいだ、名前の欄に打てない）。
 * 帯の Modal に role=dialog・aria-modal が付き、読み上げでも窓として扱われていた。
 *
 * 2026-08-29 には「帯の下の入力欄が押せない」を、容器に pointer-events: none を付けて直した。
 * 押せても焦点が戻される、という残りがこちら。帯は読ませるだけで、押させない・焦点も取らない。
 * 焦点にも指にも関わらない箱に描く。
 *
 * ■ 重なり
 * 箱は帯を出すときに作って body の末尾に置き、消すときに外す。RNW の Modal は 9999 なので、
 * 10000 にして、帯が出ている間に開いた窓にも隠れないようにする（Modal のままだと DOM の順で、
 * あとから開いた窓が上に来た）。
 *
 * 端末（web 以外）では箱を作らず、そのまま重ねる。
 */
const 帯の層 = ({ children }) => {
  const [箱, 箱を置く] = useState(null);
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return undefined;
    const 新しい箱 = document.createElement('div');
    新しい箱.setAttribute('data-testid', 'アプリの帯の層');
    Object.assign(新しい箱.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      zIndex: '10000',
      pointerEvents: 'none',
    });
    document.body.appendChild(新しい箱);
    箱を置く(新しい箱);
    return () => {
      if (新しい箱.parentNode) 新しい箱.parentNode.removeChild(新しい箱);
    };
  }, []);
  if (!IS_WEB) return children;
  return 箱 ? require('react-dom').createPortal(children, 箱) : null;
};

/** 帯の見た目。出るとき 300 ミリ秒かけて濃くなる（前の Modal の fade と同じ） */
const 帯の見た目 = ({ 字 }) => {
  const 濃さ = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(濃さ, { toValue: 1, duration: 300, useNativeDriver: false }).start();
  }, [濃さ]);
  return (
    <Animated.View
      style={[styles.帯, { opacity: 濃さ }]}
      pointerEvents="none"
      testID="アプリの帯"
      role="status"
      aria-live="polite"
    >
      <Text style={styles.帯の字}>{字}</Text>
    </Animated.View>
  );
};

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
        どちらも「出すときだけ置く」。Modal は置かれたときに body の末尾へ場所を作る。場所には
        重なりの指定が無いので、先に置いたものほど下になる。ずっと置いておくと、あとから開いた
        部員の窓などに隠れて、見えているのに押せなくなる。
        帯は Modal に入れない。焦点も指も取らない専用の箱（帯の層）に描く（理由は帯の層の説明）。
      */}
      {帯 ? (
        <帯の層>
          <帯の見た目 字={帯} />
        </帯の層>
      ) : null}
      {いま ? (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => 置く(null)}
      >
        <View style={styles.背景}>
          <View style={styles.札} testID="アプリの窓">
            {いま && いま.題 ? <Text style={styles.題}>{いま.題}</Text> : null}
            {/* 登録完了の控えのように長い文が来る。画面からはみ出して
                ボタンが押せなくならないよう、文だけを中でスクロールさせる */}
            {いま && いま.文 ? (
              <ScrollView style={styles.文の枠} contentContainerStyle={styles.文の中}>
                <Text style={styles.文}>{いま.文}</Text>
              </ScrollView>
            ) : null}
            <View style={[styles.ボタンの列, (いま.ボタン || []).length > 2 && styles.ボタンの列縦]}>
              {(いま ? いま.ボタン : []).map((b, i) => (
                <Pressable
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
                  <Text
                    style={[
                      styles.ボタンの字,
                      b.style === 'cancel' && styles.打ち消し,
                      b.style === 'destructive' && styles.危ない,
                    ]}
                  >
                    {b.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  // ボタンが3つ以上のときは縦に積む。横3等分だと長い文字が折り返して詰まる
  ボタンの列縦: { flexDirection: 'column' },
  ボタン: { flex: 1, padding: 16, alignItems: 'center' },
  仕切り: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: '#C6C6C8' },
  仕切り縦: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8' },
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
