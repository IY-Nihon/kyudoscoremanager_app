'use strict';

const { 色 } = require('./iro.js');
const { View, Text, StyleSheet, Pressable } = require('./rn');
const { UIConfig } = require('./uiConfig');
const { useScoreStore } = require('./useScoreStore');
const { useShallow } = require('zustand/react/shallow');
const ExpoHaptics = require('expo-haptics');
const React = require('react');
/**
 * 記録表の ○× の 1 マス。射手の列（ArcherColumnView）だけが使う。
 * 間隔と計の列は立ごとの箱で、このマスは使わない。
 */
const ScoreCell = React.memo(
  ({
    archerId,
    index,
    mark,
    subName,
    isLocked,
    // このマスの後ろ（縦は下・横は右）に、立の切れ目の太線を引くか
    立の切れ目 = false,
    横並び: 横 = false,
    // 読み上げが読む言葉（src/a11yLabels.js）。
    // 画面の字は「○」「×」だけなので、そのままだと
    //「まる」「かける」としか読まれず、どのますかも分からない
    読み,
    onToggle,
  }) => {
    // ますは 20 人 × 20 射で 400 個ある。1 つのますが店（zustand）を 10 か所で
    // 購読していると、○× を 1 つ入れるたびに 4000 の選び出しが走る。
    // 変わり得る値だけを 1 つの購読にまとめ（入れた時刻はこのますの分だけ別に読む）、
    // 店の手（toggleMark など）は呼ぶときに getState() から取る（手は変わらないので購読しなくてよい）
    const 店 = () => useScoreStore.getState();
    const 印を切り替える = (...引) => 店().toggleMark(...引);
    const ますを開ける = (...引) => 店().ますを開ける(...引);
    const 閉じたますが押された = (...引) => 店().閉じたますが押された(...引);
    const setActiveArrowLocationEdit = (...引) => 店().setActiveArrowLocationEdit(...引);
    const updateArrowLocation = (...引) => 店().updateArrowLocation(...引);
    const { viewScale, enableArrowLocation, 自動ロックする, 自動ロックまでの秒 } = useScoreStore(
      useShallow((状態) => ({
        viewScale: 状態.viewScale,
        enableArrowLocation: 状態.enableArrowLocation,
        自動ロックする: 状態.自動ロックする,
        自動ロックまでの秒: 状態.自動ロックまでの秒,
      }))
    );
    const 倍率 = typeof viewScale === 'number' && !isNaN(viewScale) && viewScale > 0 ? viewScale : 1;
    const 印 = mark ?? '';
    const 幅 = UIConfig.cellWidth * 倍率;
    const 高さ = UIConfig.cellHeight * 倍率;
    // 縦は「下に太線・右に細線」。横はそれを90度まわして「右に太線・下に細線」
    const 線 = 横
      ? {
          borderRightWidth: 立の切れ目 ? 2 : 1,
          borderRightColor: 色.黒,
          borderBottomWidth: 1,
          borderBottomColor: 色.黒,
        }
      : {
          borderBottomWidth: 立の切れ目 ? 2 : 1,
          borderBottomColor: 色.黒,
          borderRightWidth: 1,
          borderRightColor: 色.黒,
        };
    const timerRef = React.useRef(null);
    const longPressTimerRef = React.useRef(null);
    const isLongPressedRef = React.useRef(false);
    const cellRef = React.useRef(null);
    // 誤タップ防止。入れてから少し経ったますは、押しても変わらないようにする。
    // 直したいときは長押しで、そのますだけ開く。
    // 記録そのものには持たせない（同期の形を変えないため）
    const この鍵 = archerId + ':' + index;
    const 入れた = useScoreStore((状態) => 状態.入れた時刻[この鍵]);
    const [経った, 経ったを置く] = React.useState(false);
    React.useEffect(() => {
      経ったを置く(false);
      if (!自動ロックする || !入れた) return;
      const 残り = 自動ロックまでの秒 * 1000 - (Date.now() - 入れた);
      if (残り <= 0) {
        経ったを置く(true);
        return;
      }
      const 札 = setTimeout(() => 経ったを置く(true), 残り);
      return () => clearTimeout(札);
    }, [自動ロックする, 自動ロックまでの秒, 入れた]);
    // 鍵をかけるのは記録中の板だけ。
    // 履歴の編集画面は onToggle を渡してくる。あちらは直しに来ている画面なので、
    // 同じ射手・同じ射番の鍵（記録側で付いたもの）を持ち込まない
    const 鍵をかける板 = !onToggle;
    // 空のますは閉じない（これから入れるところなので）。
    // 手元に入れた覚えが無い○×は、読み込み直後かライブで届いたもの。
    // どちらも「もう入れ終わったます」なので、初めから閉じておく
    const 自動で閉じている = 鍵をかける板 && 自動ロックする && !!印 && (経った || !入れた);
    const 閉じている = isLocked || 自動で閉じている;
    // 長押しの手は 1 度だけ付ける（下の useEffect）。中から今の props を読めるよう、描くたびに控えを差し替える。
    // ここで props を閉じ込めると、ますが別の射手に使い回されたときに前の人を返してしまう
    const latestPropsRef = React.useRef(null);
    latestPropsRef.current = {
      mark,
      archerId,
      shotIndex: index,
      isLocked,
      enableArrowLocation,
      自動で閉じている,
      ますを開ける,
    };
    // 射手は購読しない（購読すると、ますの数だけ全射手の走査が走り、○×を 1 つ入れるたびに
    // 盤面全体が重くなっていた）。使うのは矢所の窓を出すときだけなので、そのとき取りに行く
    const 射手を取る = () => {
      const id = latestPropsRef.current.archerId;
      return useScoreStore.getState().archers.find((射手) => 射手 && 射手.id === id);
    };
    /** 矢所の窓を出す。射手が見つからなければ出さずに false */
    const 矢所の窓を出す = (射手ID, 射番, 今の印) => {
      const 射手 = 射手を取る();
      if (!射手) return false;
      setActiveArrowLocationEdit({
        archerId: 射手ID,
        shotIndex: 射番,
        currentMark: 今の印,
        arrowLocations: 射手.arrowLocations || [],
      });
      return true;
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
      const startPress = () => {
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
            const 今の印 = props.mark ?? '';
            if (props.enableArrowLocation && 今の印 !== '')
              矢所の窓を出す(props.archerId, props.shotIndex, 今の印);
          }, 500);
          return;
        }
        if (!props.enableArrowLocation) return;
        isLongPressedRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
          const 今の印 = props.mark ?? '';
          if (今の印 !== '' && 矢所の窓を出す(props.archerId, props.shotIndex, 今の印)) {
            isLongPressedRef.current = true;
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
      // 閉じているますは押しても変わらない。ただし黙って何も起きないと、
      // 開け方が分からないまま何度も押すことになる。押されたことを伝えて
      // 記録画面に「長押しで開きます」と出してもらう
      if (閉じている) {
        閉じたますが押された();
        return;
      }
      if (isLongPressedRef.current) {
        isLongPressedRef.current = false;
        return;
      }
      const 次の印 = 印 === '' ? '○' : 印 === '○' ? '×' : '';
      if (onToggle) {
        onToggle(archerId, index);
      } else {
        印を切り替える(archerId, index);
      }
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      if (enableArrowLocation) {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (次の印 === '') {
          updateArrowLocation(archerId, index, null);
        } else {
          timerRef.current = setTimeout(() => 矢所の窓を出す(archerId, index, 次の印), 500);
        }
      }
    };
    return (
      <View
        ref={cellRef}
        // 自動での確かめ用。どのますかを外から指せるようにしておく
        testID={'ます-' + archerId + '-' + index}
        onTouchEnd={(出来事) => {
          出来事.stopPropagation();
        }}
        style={[
          styles.cell,
          // 閉じたマス（立の鍵・自動ロック）の地。色.地（#F2F2F7）では白とほとんど見分けがつかなかった（2026-10-19 本人）
          { width: 幅, height: 高さ, backgroundColor: 閉じている ? 色.地_濃い : 色.白 },
          線,
        ]}
      >
        <Pressable
          onPress={handlePress}
          disabled={isLocked}
          // 読み上げにはここだけを読ませる。中の「○」だけを拾われると、
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
          <Text
            style={[
              styles.markText,
              {
                color: 印 === '○' ? 色.赤 : 印 === '×' ? 色.黒 : 'transparent',
                fontSize: 34 * 倍率,
                lineHeight: 高さ,
              },
            ]}
          >
            {印}
          </Text>
          {subName ? (
            <View style={[styles.subContainer, { bottom: 2 * 倍率 }]}>
              <Text
                style={[styles.subText, { fontSize: 9 * 倍率, paddingHorizontal: 2 * 倍率 }]}
                numberOfLines={1}
              >
                {subName}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  }
);
const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // 閉じたますは長押しで開ける。押さえたままにすると、ブラウザ側が
    // 文字を選び始めたり長押しメニューを出したりして、こちらの長押しと
    // ぶつかる。ますは押すための場所で、文字を選ぶ用は無い
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  },
  markText: { fontWeight: '900' },
  subContainer: { position: 'absolute', width: '100%', alignItems: 'center' },
  subText: { color: 色.灰, textAlign: 'center' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.ScoreCell = ScoreCell;
