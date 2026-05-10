import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UIConfig } from '../constants/UIConfig';
import { useScoreStore } from '../stores/useScoreStore';


interface LabelColumnProps {
  shots: number;
  showFooter?: boolean; // false when footer managed by MainScreen (isTall)
}

export const LabelColumn: React.FC<LabelColumnProps> = ({ shots, showFooter = true }) => {
  const { viewScale } = useScoreStore();
  const indices: number[] = [];
  for (let i = shots; i >= 1; i--) {
    indices.push(i);
  }


  return (
    <View style={[styles.column, { width: UIConfig.headerWidth * viewScale }]}>
      <View style={{ flexDirection: 'column' }}>
        {/* Header "計" */}
        <View style={[styles.header, { height: UIConfig.headerHeight * viewScale }]}>
          <Text style={[styles.headerText, { fontSize: 10 * viewScale }]}>計</Text>
        </View>

        {/* Shot number rows (12 down to 1) */}
        {indices.map(num => {
          const isBlockSep = (num - 1) % 4 === 0 && num !== 1;
          return (
            <View
              key={num}
              style={[
                styles.cell, 
                { 
                  height: UIConfig.cellHeight * viewScale,
                  borderBottomWidth: isBlockSep ? 2 : 1, 
                  borderBottomColor: '#000' 
                }
              ]}
            >
              <Text style={[styles.numText, { fontSize: 10 * viewScale }]}>{num}</Text>
            </View>
          );
        })}
      </View>

      {/* Footer "名" - shown only in compact mode */}
      {showFooter && (
        <View style={[styles.footer, { height: UIConfig.footerHeight * viewScale }]}>
          <Text style={[styles.footerText, { fontSize: 10 * viewScale }]}>名</Text>
        </View>
      )}
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
