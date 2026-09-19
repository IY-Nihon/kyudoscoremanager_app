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
    onToggle,
  }) => {
    // ますは 20 人 × 20 射で 400 個ある。1 つのますが店（zustand）を 10 か所で
    // 購読していると、○× を 1 つ入れるたびに 4000 の選び出しが走る。
    // 変わり得る値だけを 1 つの購読にまとめ、店の手（toggleMark など）は
    // 呼ぶときに getState() から取る（手は変わらないので購読しなくてよい）
    const 店 = () => useScoreStore.getState();
    const 印を切り替える = (...引) => 店().toggleMark(...引);
    const { viewScale, enableArrowLocation, 自動ロックする, 自動ロックまでの秒 } = useScoreStore(
      useShallow((状態) => ({
        viewScale: 状態.viewScale,
        enableArrowLocation: 状態.enableArrowLocation,
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
    const timerRef = React.useRef(null);
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
    const setActiveArrowLocationEdit = (...引) => 店().setActiveArrowLocationEdit(...引);
    const updateArrowLocation = (...引) => 店().updateArrowLocation(...引);
    // ここで (s) => s.archers.find(...) を購読していた。ますの数だけ
    // 全射手の走査が走り、○×を1つ入れるたびに盤面全体が重くなっていた。
    // この射手を使うのは長押しの中だけなので、そのとき取りに行けばよい
    // 射手IDは控え（latestPropsRef）から読む。ここで e を閉じ込めると、
    // ますが別の射手に使い回されたときに前の人を返してしまう
    const 射手を取る = () => {
      const id = latestPropsRef.current ? latestPropsRef.current.archerId : archerId;
      return useScoreStore.getState().archers.find((射手) => 射手 && 射手.id === id);
    };
    const latestPropsRef = React.useRef({
      mark,
      archerId,
      shotIndex: index,
      isLocked,
      enableArrowLocation,
      自動で閉じている,
      ますを開ける,
    });
    latestPropsRef.current = {
      mark,
      archerId,
      shotIndex: index,
      isLocked,
      enableArrowLocation,
      自動で閉じている,
      ますを開ける,
    };
    React.useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      };
    }, []);
    React.useEffect(() => {
      const 節点 = cellRef.current;
      if (!節点) return;
      const startPress = (出来事) => {
        const props = latestPropsRef.current;
        if (props.isLocked) return;
        // 自動で閉じたますは、長押しで1つだけ開ける
        if (props.自動で閉じている) {
          isLongPressedRef.current = false;
          longPressTimerRef.current = setTimeout(() => {
            isLongPressedRef.current = true;
            props.ますを開ける(props.archerId, props.shotIndex);
            // 矢所を使っているなら、長押しは「このますを直す」合図。
            // 開けるだけで終わると、矢所を出すのに二度長押しさせることになる
            const 印 = props.mark ?? '';
            const 射手 = 射手を取る();
            if (props.enableArrowLocation && '' !== 印 && 射手) {
              setActiveArrowLocationEdit({
                archerId: props.archerId,
                shotIndex: props.shotIndex,
                currentMark: 印,
                arrowLocations: 射手.arrowLocations || [],
              });
            }
          }, 500);
          return;
        }
        if (!props.enableArrowLocation) return;
        isLongPressedRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
          const currentMark = props.mark ?? '';
          const 射手2 = 射手を取る();
          if (currentMark !== '' && 射手2) {
            isLongPressedRef.current = true;
            setActiveArrowLocationEdit({
              archerId: props.archerId,
              shotIndex: props.shotIndex,
              currentMark,
              arrowLocations: 射手2.arrowLocations || [],
            });
          }
        }, 500);
      };
      const endPress = () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      };
      // 矢所を使っていなくても、閉じたますを開けるのに長押しを使う。
      // 矢所のときだけ止めていたので、既定の設定（矢所は切ってある）だと
      // 開けようと押さえた指に対してブラウザの長押しメニューが出ていた
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
        // 消えたあとに鍵が開いたり矢所の窓が出たりする
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
      }
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      if (enableArrowLocation) {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (nextMark === '') {
          updateArrowLocation(archerId, index, null);
        } else {
          timerRef.current = setTimeout(() => {
            // 射手は購読せず、要るときに取りに行く（上の 射手を取る の説明）。
            // ここだけ差し替え漏れがあり、矢所を出す設定のときに落ちていた
            const 射手 = 射手を取る();
            if (射手) {
              setActiveArrowLocationEdit({
                archerId,
                shotIndex: index,
                currentMark: nextMark,
                arrowLocations: 射手.arrowLocations || [],
              });
            }
          }, 500);
        }
      }
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
