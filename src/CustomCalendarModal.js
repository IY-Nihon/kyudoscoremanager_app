'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const Modal = require('./Modal').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const ScrollView = require('./ScrollView').default;
const { getShadowStyle } = require('./shadowStyle');
const DateFns = require('date-fns');
const 一段の高さ = 44;
const 回す選択 = ({ data, value, onValueChange, label, flex = 1 }) => {
  const 流しのref = React.useRef(null);
  const 止まりの札 = React.useRef(null);
  const [指で動かし中, 指で動かし中を置く] = React.useState(false);
  const 選んだ番 = React.useMemo(() => {
    const 番 = data.indexOf(value);
    return -1 !== 番 ? 番 : 0;
  }, [data, value]);
  React.useEffect(() => {
    指で動かし中 || 流しのref.current?.scrollTo({ y: 選んだ番 * 一段の高さ, animated: true });
  }, [選んだ番, 指で動かし中]);
  const 止まった所で決める = (縦の位置) => {
    const 近い番 = Math.round(縦の位置 / 一段の高さ);
    const 番 = Math.max(0, Math.min(近い番, data.length - 1));
    流しのref.current?.scrollTo({ y: 番 * 一段の高さ, animated: true });
    const 値 = data[番];
    if (値 !== value) onValueChange(値);
    setTimeout(() => {
      指で動かし中を置く(false);
    }, 150);
  };
  return (
    <View style={[styles.wheelContainer, { flex }]}>
      {label ? <Text style={styles.wheelLabel}>{label}</Text> : null}
      <View style={styles.wheelClip}>
        <View style={styles.selectionIndicator} pointerEvents="none" />
        <ScrollView
          ref={流しのref}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(出来事) => {
            const 縦の位置 = 出来事.nativeEvent.contentOffset.y;
            if (!指で動かし中) 指で動かし中を置く(true);
            if (止まりの札.current) clearTimeout(止まりの札.current);
            止まりの札.current = setTimeout(() => {
              止まった所で決める(縦の位置);
            }, 100);
          }}
          onScrollBeginDrag={() => 指で動かし中を置く(true)}
          onMomentumScrollBegin={() => 指で動かし中を置く(true)}
          contentContainerStyle={{ paddingVertical: 一段の高さ * Math.floor(2.5) }}
        >
          {data.map((項目, 番) => (
            <TouchableOpacity
              key={`item-${番}-${項目}`}
              style={styles.wheelItem}
              activeOpacity={0.7}
              onPress={() => {
                onValueChange(項目);
                流しのref.current?.scrollTo({ y: 番 * 一段の高さ, animated: true });
              }}
            >
              <Text style={[styles.wheelItemText, 項目 === value ? styles.wheelItemTextSelected : null]}>
                {項目}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};
const CustomCalendarModal = ({ visible, onClose, selectedDate, onSelectDate, title = '日付を選択' }) => {
  const [選んでいる日, 選んでいる日を置く] = React.useState(new Date(selectedDate));
  React.useEffect(() => {
    if (visible) 選んでいる日を置く(new Date(selectedDate));
  }, [visible, selectedDate]);
  const 年の一覧 = React.useMemo(() => {
    const 今年 = DateFns.getYear(new Date());
    const 一覧 = [];
    for (let 年 = 今年 - 5; 年 <= 今年 + 5; 年++) 一覧.push(年);
    const 選んだ年 = DateFns.getYear(選んでいる日);
    return (一覧.includes(選んだ年) || (一覧.push(選んだ年), 一覧.sort((甲, 乙) => 甲 - 乙)), 一覧);
  }, [選んでいる日]);
  const 月の一覧 = React.useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []);
  const 日の一覧 = React.useMemo(() => {
    const 日数 = DateFns.getDaysInMonth(選んでいる日);
    return Array.from({ length: 日数 }, (_, 番) => 番 + 1);
  }, [DateFns.getYear(選んでいる日), DateFns.getMonth(選んでいる日)]);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                onSelectDate(選んでいる日);
                onClose();
              }}
              style={styles.headerBtn}
            >
              <Text style={styles.confirmText}>完了</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerArea}>
            <回す選択
              label="年"
              data={年の一覧}
              value={DateFns.getYear(選んでいる日)}
              onValueChange={(年) => {
                const 直した日 = DateFns.setYear(選んでいる日, 年);
                const 日数 = DateFns.getDaysInMonth(直した日);
                if (DateFns.getDate(直した日) > 日数) 選んでいる日を置く(DateFns.setDate(直した日, 日数));
                else 選んでいる日を置く(直した日);
              }}
              flex={1.5}
            />
            <回す選択
              label="月"
              data={月の一覧}
              value={DateFns.getMonth(選んでいる日) + 1}
              onValueChange={(月) => {
                const 直した日 = DateFns.setMonth(選んでいる日, 月 - 1);
                const 日数 = DateFns.getDaysInMonth(直した日);
                if (DateFns.getDate(直した日) > 日数) 選んでいる日を置く(DateFns.setDate(直した日, 日数));
                else 選んでいる日を置く(直した日);
              }}
              flex={1}
            />
            <回す選択
              label="日"
              data={日の一覧}
              value={DateFns.getDate(選んでいる日)}
              onValueChange={(日) => {
                選んでいる日を置く(DateFns.setDate(選んでいる日, 日));
              }}
              flex={1}
            />
          </View>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => {
              const 今日 = new Date();
              選んでいる日を置く(今日);
            }}
          >
            <Text style={styles.todayBtnText}>今日に設定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dismissOverlay: Object.assign({}, StyleSheet.absoluteFillObject),
  container: Object.assign(
    {
      backgroundColor: '#FFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      width: '100%',
    },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 20,
    })
  ),
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  cancelText: { fontSize: 17, color: '#8E8E93' },
  confirmText: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
  pickerArea: { flexDirection: 'row', height: 220, paddingHorizontal: 20, backgroundColor: '#FFF' },
  wheelContainer: { height: '100%' },
  wheelLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: -10,
    zIndex: 10,
  },
  wheelClip: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  selectionIndicator: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 88,
    height: 一段の高さ,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    zIndex: 0,
  },
  wheelItem: { height: 一段の高さ, justifyContent: 'center', alignItems: 'center' },
  wheelItemText: { fontSize: 20, color: '#8E8E93' },
  wheelItemTextSelected: { color: '#000', fontWeight: '600', fontSize: 22 },
  todayBtn: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  todayBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.CustomCalendarModal = CustomCalendarModal;
