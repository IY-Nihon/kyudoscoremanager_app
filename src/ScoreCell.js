'use strict';

const { View, Text, StyleSheet, Pressable } = require('./rn');
const { UIConfig } = require('./uiConfig');
const { useScoreStore } = require('./useScoreStore');
const { useShallow } = require('zustand/react/shallow');
const ExpoHaptics = require('expo-haptics');
const Icons = require('@expo/vector-icons');
const React = require('react');
const ScoreCell = React.memo(
  ({
    archerId,
    index,
    mark,
    subName,
    isLocked,
    isBlockBottom,
    isBlockTop,
    isFirst,
    hideMark = false,
    isNormalArcher = false,
    columnType = 'normal',
    横並び: 横 = false,
    // 読み上げが読む言葉（src/a11yLabels.js）。
    // 画面の字は「○」「×」だけなので、そのままだと
    //「まる」「かける」としか読まれず、どのますかも分からない
    読み,
    // この射に矢所が置いてあるか。置いたマスにだけ小さな点を出す（矢所の記録を使うときだけ持ち主が渡す）
    矢所あり = false,
    onToggle,
  }) => {
    // ますは 20 人 × 20 射で 400 個ある。1 つのますが店（zustand）を 10 か所で
    // 購読していると、○× を 1 つ入れるたびに 4000 の選び出しが走る。
    // 変わり得る値だけを 1 つの購読にまとめ、店の手（toggleMark など）は
    // 呼ぶときに getState() から取る（手は変わらないので購読しなくてよい）
    const 店 = () => useScoreStore.getState();
    const 印を切り替える = (...引) => 店().toggleMark(...引);
    // 矢所：置いたマスに小さな点・長押しでその射の窓・入れ方が「○×のあと」なら○×の 0.5 秒後に窓（src/YadokoroWindow.js）
    const { viewScale, 自動ロックする, 自動ロックまでの秒, 矢所を使う, 矢所の入れ方 } = useScoreStore(
      useShallow((状態) => ({
        viewScale: 状態.viewScale,
        矢所を使う: !!状態.enableArrowLocation,
        矢所の入れ方: 状態.矢所の入れ方,
        自動ロックする: 状態.自動ロックする,
        自動ロックまでの秒: 状態.自動ロックまでの秒,
      }))
    );
    const 倍率 = 'number' == typeof viewScale && !isNaN(viewScale) && viewScale > 0 ? viewScale : 1;
    const 印 = mark ?? '';
    const 背景の色 =
      'total' === columnType
        ? 'rgba(0,122,255,0.08)'
        : 'separator' === columnType
          ? 'rgba(142,142,147,0.1)'
          : isLocked
            ? '#F2F2F7'
            : '#FFFFFF';
    const 下線の太さ = isFirst ? 1 : isBlockBottom ? 2 : 1;
    const 間隔か合計 = 'separator' === columnType || 'total' === columnType;
    const 枠の太さ = 間隔か合計 ? 1 : 0;
    const 細い = 'separator' === columnType ? UIConfig.separatorWidth : null;
    const 幅 = (横 ? UIConfig.cellWidth : (細い ?? UIConfig.cellWidth)) * 倍率;
    const 高さ = (横 ? (細い ?? UIConfig.cellHeight) : UIConfig.cellHeight) * 倍率;
    const // 縦は「下に太線・右に細線」。横はそれを90度まわして「右に太線・下に細線」
      線 = 横
        ? {
            borderRightWidth: 下線の太さ,
            borderRightColor: '#000',
            borderBottomWidth: 1,
            borderBottomColor: '#000',
            borderTopWidth: 枠の太さ,
            borderTopColor: '#000',
          }
        : {
            borderBottomWidth: 下線の太さ,
            borderBottomColor: '#000',
            borderRightWidth: 1,
            borderRightColor: '#000',
            borderLeftWidth: 枠の太さ,
            borderLeftColor: '#000',
          };
    const longPressTimerRef = React.useRef(null);
    const isLongPressedRef = React.useRef(false);
    const cellRef = React.useRef(null);
    // 誤タップ防止。入れてから少し経ったますは、押しても変わらないようにする。
    // 直したいときは長押しで、そのますだけ開く。
    // 記録そのものには持たせない（同期の形を変えないため）
    const ますを開ける = (...引) => 店().ますを開ける(...引);
    const 閉じたますが押された = (...引) => 店().閉じたますが押された(...引);
    const この鍵 = archerId + ':' + index;
    const 入れた = useScoreStore((状態) => 状態.入れた時刻[この鍵]);
    const [経った, 経ったを置く] = React.useState(false);
    React.useEffect(() => {
      経ったを置く(false);
      if (!自動ロックする || !入れた) return;
      const 残り = 自動ロックまでの秒 * 1000 - (Date.now() - 入れた);
      if (残り <= 0) return void 経ったを置く(true);
      const 札 = setTimeout(() => 経ったを置く(true), 残り);
      return () => clearTimeout(札);
    }, [自動ロックする, 自動ロックまでの秒, 入れた]);
    // 鍵をかけるのは記録中の板だけ。
    // 履歴の編集画面は onToggle を渡してくる。あちらは直しに来ている画面なので、
    // 同じ射手・同じ射番の鍵（記録側で付いたもの）を持ち込まない
    const 鍵をかける板 = !onToggle;
    // 「計」と「間隔」の列は、数字や区切りを出すだけで○×を入れる場所ではない。
    // ここを普通のますとして扱うと、押しただけで見えない○が入り（hideMark が
    // 立っているので画面には出ない）、3秒後に灰色になる
    const 印を入れる列 = 'total' !== columnType && 'separator' !== columnType;
    // 空のますは閉じない（これから入れるところなので）。
    // 手元に入れた覚えが無い○×は、読み込み直後かライブで届いたもの。
    // どちらも「もう入れ終わったます」なので、初めから閉じておく
    const 自動で閉じている =
      印を入れる列 && 鍵をかける板 && 自動ロックする && !!(mark ?? '') && (経った || !入れた);
    const 閉じている = isLocked || 自動で閉じている;
    // 長押しの中で読む値。ここで閉じ込めると、ますが別の射手に使い回されたときに前の人を見てしまう
    const latestPropsRef = React.useRef({
      archerId,
      shotIndex: index,
      isLocked,
      自動で閉じている,
      ますを開ける,
      窓を開ける: false,
    });
    // 長押しで矢所の窓を開けるのは、記録中の板の射手のマスだけ（履歴の直しの画面では開かない）
    const 窓を開ける = 矢所を使う && 鍵をかける板 && 印を入れる列;
    latestPropsRef.current = {
      archerId,
      shotIndex: index,
      isLocked,
      自動で閉じている,
      ますを開ける,
      窓を開ける,
    };
    const 窓の札 = React.useRef(null);
    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        if (窓の札.current) clearTimeout(窓の札.current);
      };
    }, []);
    React.useEffect(() => {
      const 節点 = cellRef.current;
      if (!節点) return;
      const startPress = (出来事) => {
        const props = latestPropsRef.current;
        if (props.isLocked) return;
        // 自動で閉じたますは、長押しで1つだけ開ける。矢所を使うときは、長押しでその射の矢所の窓も開く
        if (!props.自動で閉じている && !props.窓を開ける) return;
        isLongPressedRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
          isLongPressedRef.current = true;
          if (props.自動で閉じている) props.ますを開ける(props.archerId, props.shotIndex);
          if (props.窓を開ける) useScoreStore.getState().set矢所の窓({ 射手ID: props.archerId, 射番: props.shotIndex });
        }, 500);
      };
      const endPress = () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      };
      // 閉じたますを開けるのに長押しを使う。止めておかないと、
      // 開けようと押さえた指に対してブラウザの長押しメニューが出る
      const suppressContext = (出来事) => {
        出来事.preventDefault();
      };
      節点.addEventListener('mousedown', startPress);
      節点.addEventListener('mouseup', endPress);
      節点.addEventListener('mouseleave', endPress);
      節点.addEventListener('touchstart', startPress, { passive: true });
      節点.addEventListener('touchend', endPress);
      節点.addEventListener('touchcancel', endPress);
      節点.addEventListener('contextmenu', suppressContext);
      return () => {
        // 押さえている最中にこのますが消えることがある（射手を消した、
        // 射数を減らした、ライブで盤面が入れ替わった）。止めておかないと、
        // 消えたあとに鍵が開く
        endPress();
        節点.removeEventListener('mousedown', startPress);
        節点.removeEventListener('mouseup', endPress);
        節点.removeEventListener('mouseleave', endPress);
        節点.removeEventListener('touchstart', startPress);
        節点.removeEventListener('touchend', endPress);
        節点.removeEventListener('touchcancel', endPress);
        節点.removeEventListener('contextmenu', suppressContext);
      };
    }, []);
    const handlePress = () => {
      // 「計」と「間隔」の列には○×を入れない。押しても何もしない。
      // 鍵の印はこの上に別に重ねてあるので、そちらは今までどおり押せる
      if (!印を入れる列) return;
      // 閉じているますは押しても変わらない。ただし黙って何も起きないと、
      // 開け方が分からないまま何度も押すことになる。押されたことを伝えて
      // 記録画面に「長押しで開きます」と出してもらう
      if (閉じている) return void 閉じたますが押された();
      if (isLongPressedRef.current) {
        isLongPressedRef.current = false;
        return;
      }
      const currentMark = mark ?? '';
      const nextMark = currentMark === '' ? '○' : currentMark === '○' ? '\xd7' : '';
      if (onToggle) {
        onToggle(archerId, index);
      } else {
        印を切り替える(archerId, index);
        // ○×を空に戻したら、その射の矢所も消す（空の射に位置だけ残さない）。
        // 射手は購読せず（ますは 400 個ある）、要るときに取りに行く
        if ('' === nextMark) {
          const 射手 = useScoreStore.getState().archers.find((一人) => 一人 && 一人.id === archerId);
          if (射手 && Array.isArray(射手.arrowLocations) && 射手.arrowLocations[index]) 店().updateArrowLocation(archerId, index, null);
        }
        // 入れ方が「○×のあと」なら、○×を入れて 0.5 秒後にその射の矢所の窓を開く（10/3 まで本番にあった開き方）
        if (窓の札.current) clearTimeout(窓の札.current);
        if (窓を開ける && '' !== nextMark && '○×のあと' === 矢所の入れ方) {
          窓の札.current = setTimeout(() => {
            if (!useScoreStore.getState().書き換えを止めるか()) useScoreStore.getState().set矢所の窓({ 射手ID: archerId, 射番: index });
          }, 500);
        }
      }
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    };
    return (
      <View
        ref={cellRef} // 自動での確かめ用。どのますかを外から指せるようにしておく
        testID={'ます-' + archerId + '-' + index}
        onTouchEnd={(出来事) => {
          出来事.stopPropagation();
        }}
        style={[
          styles.cell,
          { width: 幅, height: 高さ, backgroundColor: 自動で閉じている ? '#F2F2F7' : 背景の色 },
          線,
        ]}
      >
        <Pressable
          onPress={handlePress}
          disabled={isLocked} // 読み上げにはここだけを読ませる。中の「○」だけを拾われると、
          // どの射手のどの射なのかが分からない
          accessible
          accessibilityRole="button"
          accessibilityLabel={読み || undefined}
          accessibilityHint={読み ? '押すと 未記入・的中・はずれ の順に変わります' : undefined}
          style={({ pressed }) => [
            {
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <React.Fragment>
            {!hideMark && (
              <Text
                style={[
                  styles.markText,
                  {
                    color: '○' === 印 ? '#FF3B30' : '\xd7' === 印 ? '#000000' : 'transparent',
                    fontSize: 34 * 倍率,
                    lineHeight: 高さ,
                  },
                ]}
              >
                {印}
              </Text>
            )}
            {矢所あり && 印 ? (
              <View
                testID={'矢所の点-' + archerId + '-' + index}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 3 * 倍率,
                  right: 3 * 倍率,
                  width: 7 * 倍率,
                  height: 7 * 倍率,
                  borderRadius: 4 * 倍率,
                  backgroundColor: '○' === 印 ? '#34C759' : '#FF3B30',
                }}
              />
            ) : null}
            {subName ? (
              <View style={[styles.subContainer, { bottom: 2 * 倍率 }]}>
                <Text style={[styles.subText, { fontSize: 9 * 倍率 }]} numberOfLines={1}>
                  {subName}
                </Text>
              </View>
            ) : null}
          </React.Fragment>
        </Pressable>
        {isBlockTop && !isNormalArcher && (
          <View style={[styles.lockIconOverlay, { top: 3 * 倍率 }]}>
            <Icons.Ionicons
              name={isLocked ? 'lock-closed' : 'lock-open'}
              size={16 * 倍率}
              color={isLocked ? '#FF3B30' : '#8E8E93'}
            />
          </View>
        )}
      </View>
    );
  }
);
const styles = StyleSheet.create({
  cell: {
    width: '100%',
    height: UIConfig.cellHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: '#000',
    position: 'relative',
    // 閉じたますは長押しで開ける。押さえたままにすると、ブラウザ側が
    // 文字を選び始めたり長押しメニューを出したりして、こちらの長押しと
    // ぶつかる。ますは押すための場所で、文字を選ぶ用は無い
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  },
  markText: Object.assign({ fontSize: 28, fontWeight: '900' }, {}),
  lockIconOverlay: { position: 'absolute', top: 2, alignItems: 'center', width: '100%', zIndex: 1 },
  subContainer: { position: 'absolute', bottom: 2, width: '100%', alignItems: 'center' },
  subText: { fontSize: 9, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 2 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.ScoreCell = ScoreCell;
