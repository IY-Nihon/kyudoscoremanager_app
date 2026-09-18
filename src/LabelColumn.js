'use strict';

const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const { UIConfig } = require('./uiConfig');
const { useScoreStore } = require('./useScoreStore');
const LabelColumn = ({ shots, showFooter = true, 横並び: 横 = false }) => {
  const f = useScoreStore((e) => e.viewScale);
  const s = 'number' == typeof f && !isNaN(f) && f > 0 ? f : 1;
  const u = [];
  // 縦の表は下から上へ数える（1射目が下）。横の表は左から右へ数える
  if (横) for (let t = 1; t <= shots; t++) u.push(t);
  else for (let t = shots; t >= 1; t--) u.push(t);
  return (
    <View
      style={[
        styles.column,
        横
          ? {
              width: UIConfig.cellWidth * (shots + 1) * s,
              height: UIConfig.cellHeight * s,
              flexDirection: 'row',
              flexShrink: 0,
              borderLeftWidth: 0,
              borderTopWidth: 1.5,
              borderTopColor: '#000',
            }
          : { width: UIConfig.headerWidth * s },
      ]}
    >
      <View style={{ flexDirection: 横 ? 'row-reverse' : 'column' }}>
        <View
          style={[
            styles.header,
            横
              ? {
                  width: UIConfig.cellWidth * s,
                  height: UIConfig.cellHeight * s,
                  borderBottomWidth: 0,
                  borderRightWidth: 0,
                  borderLeftWidth: 1.5,
                  borderLeftColor: '#000',
                }
              : { height: UIConfig.headerHeight * s },
          ]}
        >
          <Text style={[styles.headerText, { fontSize: 10 * s }]}>計</Text>
        </View>
        <View style={横 ? { flexDirection: 'row' } : undefined}>
          {u.map((e) => {
            // 立の切れ目。縦では下の線、横では右の線を太くする
            const i = (e - 1) % 4 == 0 && 1 !== e;
            const 切れ目 = 横 ? e % 4 == 0 && e !== u.length : i;
            return (
              <View
                key={e}
                style={[
                  styles.cell,
                  横
                    ? {
                        width: UIConfig.cellWidth * s,
                        height: UIConfig.cellHeight * s,
                        borderRightWidth: 切れ目 ? 2 : 1,
                        borderRightColor: '#000',
                      }
                    : {
                        height: UIConfig.cellHeight * s,
                        borderBottomWidth: i ? 2 : 1,
                        borderBottomColor: '#000',
                      },
                ]}
              >
                <Text style={[styles.numText, { fontSize: 10 * s }]}>{e}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {showFooter && (
        <View style={[styles.footer, { height: UIConfig.footerHeight * s }]}>
          <Text style={[styles.footerText, { fontSize: 10 * s }]}>名</Text>
        </View>
      )}
      {横 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            // 見出しと本体の区切りなので、ますの線（1px）より太くする
            height: 3,
            backgroundColor: '#000',
          }}
        />
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  column: {
    width: UIConfig.headerWidth,
    backgroundColor: '#F2F2F7',
    borderLeftWidth: 1.5,
    borderLeftColor: '#000',
  },
  header: {
    height: UIConfig.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    borderRightWidth: 1.5,
    borderRightColor: '#000',
  },
  headerText: { color: '#3C3C43', fontSize: 10, fontWeight: 'bold' },
  cell: {
    height: UIConfig.cellHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRightWidth: 1.5,
    borderRightColor: '#000',
  },
  numText: { color: '#3C3C43', fontSize: 10 },
  footer: {
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderRightWidth: 1.5,
    borderRightColor: '#000',
    backgroundColor: '#F2F2F7',
  },
  footerText: { color: '#3C3C43', fontSize: 10, fontWeight: 'bold' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.LabelColumn = LabelColumn;
