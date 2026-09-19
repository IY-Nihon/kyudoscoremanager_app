'use strict';

const { View, Text, StyleSheet } = require('./rn');
const { UIConfig } = require('./uiConfig');
const { useScoreStore } = require('./useScoreStore');
const LabelColumn = ({ shots, showFooter = true, 横並び: 横 = false }) => {
  const viewScale = useScoreStore((状態) => 状態.viewScale);
  const 倍率 = 'number' == typeof viewScale && !isNaN(viewScale) && viewScale > 0 ? viewScale : 1;
  const 番号たち = [];
  // 縦の表は下から上へ数える（1射目が下）。横の表は左から右へ数える
  if (横) for (let 番 = 1; 番 <= shots; 番++) 番号たち.push(番);
  else for (let 番 = shots; 番 >= 1; 番--) 番号たち.push(番);
  return (
    <View
      style={[
        styles.column,
        横
          ? {
              width: UIConfig.cellWidth * (shots + 1) * 倍率,
              height: UIConfig.cellHeight * 倍率,
              flexDirection: 'row',
              flexShrink: 0,
              borderLeftWidth: 0,
              borderTopWidth: 1.5,
              borderTopColor: '#000',
            }
          : { width: UIConfig.headerWidth * 倍率 },
      ]}
    >
      <View style={{ flexDirection: 横 ? 'row-reverse' : 'column' }}>
        <View
          style={[
            styles.header,
            横
              ? {
                  width: UIConfig.cellWidth * 倍率,
                  height: UIConfig.cellHeight * 倍率,
                  borderBottomWidth: 0,
                  borderRightWidth: 0,
                  borderLeftWidth: 1.5,
                  borderLeftColor: '#000',
                }
              : { height: UIConfig.headerHeight * 倍率 },
          ]}
        >
          <Text style={[styles.headerText, { fontSize: 10 * 倍率 }]}>計</Text>
        </View>
        <View style={横 ? { flexDirection: 'row' } : undefined}>
          {番号たち.map((番号) => {
            // 立の切れ目。縦では下の線、横では右の線を太くする
            const 縦の切れ目 = (番号 - 1) % 4 == 0 && 1 !== 番号;
            const 切れ目 = 横 ? 番号 % 4 == 0 && 番号 !== 番号たち.length : 縦の切れ目;
            return (
              <View
                key={番号}
                style={[
                  styles.cell,
                  横
                    ? {
                        width: UIConfig.cellWidth * 倍率,
                        height: UIConfig.cellHeight * 倍率,
                        borderRightWidth: 切れ目 ? 2 : 1,
                        borderRightColor: '#000',
                      }
                    : {
                        height: UIConfig.cellHeight * 倍率,
                        borderBottomWidth: 縦の切れ目 ? 2 : 1,
                        borderBottomColor: '#000',
                      },
                ]}
              >
                <Text style={[styles.numText, { fontSize: 10 * 倍率 }]}>{番号}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {showFooter && (
        <View style={[styles.footer, { height: UIConfig.footerHeight * 倍率 }]}>
          <Text style={[styles.footerText, { fontSize: 10 * 倍率 }]}>名</Text>
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
