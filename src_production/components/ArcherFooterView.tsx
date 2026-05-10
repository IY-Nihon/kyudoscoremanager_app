import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Archer } from '../models/types';
import * as Haptics from 'expo-haptics';
import { Settings, Trash2, ArrowUpDown, UserPlus } from 'lucide-react-native';

interface Props {
  archer: Archer;
  onClear: () => void;
  onMove: () => void;
  onSubstitute: () => void;
}

export const ArcherFooterView: React.FC<Props> = ({ archer, onClear, onMove, onSubstitute }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClear(); }}>
        <Trash2 size={16} color="#FF453A" />
        <Text style={styles.buttonTextRed}>クリア</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSubstitute(); }}>
        <UserPlus size={16} color="#0A84FF" />
        <Text style={styles.buttonTextBlue}>交代</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMove(); }}>
        <ArrowUpDown size={16} color="#0A84FF" />
        <Text style={styles.buttonTextBlue}>入替</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Settings size={16} color="#0A84FF" />
        <Text style={styles.buttonTextBlue}>設定</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 8,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
  },
  buttonTextBlue: { color: '#0A84FF', fontSize: 12, fontWeight: '600' },
  buttonTextRed: { color: '#FF453A', fontSize: 12, fontWeight: '600' }
});
