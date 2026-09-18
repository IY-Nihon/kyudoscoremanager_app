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
const f = 44;
const X要素 = ({ data, value, onValueChange, label, flex = 1 }) => {
  const x = React.useRef(null);
  const y = React.useRef(null);
  const [b, p] = React.useState(false);
  const w = React.useMemo(() => {
    const t = data.indexOf(value);
    return -1 !== t ? t : 0;
  }, [data, value]);
  React.useEffect(() => {
    b || x.current?.scrollTo({ y: w * f, animated: true });
  }, [w, b]);
  const C = (t) => {
    const n = Math.round(t / f);
    const l = Math.max(0, Math.min(n, data.length - 1));
    x.current?.scrollTo({ y: l * f, animated: true });
    const s = data[l];
    if (s !== value) onValueChange(s);
    setTimeout(() => {
      p(false);
    }, 150);
  };
  return (
    <View style={[j.wheelContainer, { flex: flex }]}>
      {label ? <Text style={j.wheelLabel}>{label}</Text> : null}
      <View style={j.wheelClip}>
        <View style={j.selectionIndicator} pointerEvents="none" />
        <ScrollView
          ref={x}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const t = e.nativeEvent.contentOffset.y;
            if (!b) p(true);
            if (y.current) clearTimeout(y.current);
            y.current = setTimeout(() => {
              C(t);
            }, 100);
          }}
          onScrollBeginDrag={() => p(true)}
          onMomentumScrollBegin={() => p(true)}
          contentContainerStyle={{ paddingVertical: f * Math.floor(2.5) }}
        >
          {data.map((e, t) => (
            <TouchableOpacity
              key={`item-${t}-${e}`}
              style={j.wheelItem}
              activeOpacity={0.7}
              onPress={() => {
                onValueChange(e);
                x.current?.scrollTo({ y: t * f, animated: true });
              }}
            >
              <Text style={[j.wheelItemText, e === value ? j.wheelItemTextSelected : null]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};
const CustomCalendarModal = ({ visible, onClose, selectedDate, onSelectDate, title = '日付を選択' }) => {
  const [y, b] = React.useState(new Date(selectedDate));
  React.useEffect(() => {
    if (visible) b(new Date(selectedDate));
  }, [visible, selectedDate]);
  const p = React.useMemo(() => {
    const e = DateFns.getYear(new Date());
    const t = [];
    for (let n = e - 5; n <= e + 5; n++) t.push(n);
    const n = DateFns.getYear(y);
    return (t.includes(n) || (t.push(n), t.sort((e, t) => e - t)), t);
  }, [y]);
  const w = React.useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []);
  const C = React.useMemo(() => {
    const e = DateFns.getDaysInMonth(y);
    return Array.from({ length: e }, (e, t) => t + 1);
  }, [DateFns.getYear(y), DateFns.getMonth(y)]);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={j.overlay}>
        <TouchableOpacity style={j.dismissOverlay} activeOpacity={1} onPress={onClose} />
        <View style={j.container}>
          <View style={j.modalHeader}>
            <TouchableOpacity onPress={onClose} style={j.headerBtn}>
              <Text style={j.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={j.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                onSelectDate(y);
                onClose();
              }}
              style={j.headerBtn}
            >
              <Text style={j.confirmText}>完了</Text>
            </TouchableOpacity>
          </View>
          <View style={j.pickerArea}>
            <X要素
              label="年"
              data={p}
              value={DateFns.getYear(y)}
              onValueChange={(e) => {
                const t = DateFns.setYear(y, e);
                const n = DateFns.getDaysInMonth(t);
                if (DateFns.getDate(t) > n) b(DateFns.setDate(t, n));
                else b(t);
              }}
              flex={1.5}
            />
            <X要素
              label="月"
              data={w}
              value={DateFns.getMonth(y) + 1}
              onValueChange={(e) => {
                const t = DateFns.setMonth(y, e - 1);
                const n = DateFns.getDaysInMonth(t);
                if (DateFns.getDate(t) > n) b(DateFns.setDate(t, n));
                else b(t);
              }}
              flex={1}
            />
            <X要素
              label="日"
              data={C}
              value={DateFns.getDate(y)}
              onValueChange={(e) => {
                b(DateFns.setDate(y, e));
              }}
              flex={1}
            />
          </View>
          <TouchableOpacity
            style={j.todayBtn}
            onPress={() => {
              const e = new Date();
              b(e);
            }}
          >
            <Text style={j.todayBtnText}>今日に設定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const j = StyleSheet.create({
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
    height: f,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    zIndex: 0,
  },
  wheelItem: { height: f, justifyContent: 'center', alignItems: 'center' },
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
