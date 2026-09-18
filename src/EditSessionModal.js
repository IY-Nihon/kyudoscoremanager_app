const React = require('react');
const View = require('./View').default;
const Modal = require('./Modal').default;
const StyleSheet = require('./StyleSheet').default;
const Text = require('./Text').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const TextInput = require('./TextInput').default;
const Switch = require('./Switch').default;
const { IS_IOS } = require('./IS_WEB');
const Icons = require('@expo/vector-icons');
const ScrollView = require('./ScrollView').default;
const ExpoHaptics = require('expo-haptics');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const { useScoreStore } = require('./useScoreStore');
const { normalizeTag, タグの見た目 } = require('./syncRules');
const EditSessionModal = ({ visible, session, onClose, onSave }) => {
  const [y, F] = React.useState('');
  const [S, T] = React.useState('');
  const [B, k] = React.useState(8);
  const [A, I] = React.useState(true);
  const [w, v] = React.useState(new Date());
  const [z, W] = React.useState(false);
  const [D, R] = React.useState([]);
  const [P, M] = React.useState('');
  const [_, O] = React.useState(false);
  const [attendanceEdit, setAttendanceEdit] = React.useState({});
  const {
    isAdminMode,
    tagTemplates = [],
    members: membersState = [],
    alumni: alumniState = [],
  } = useScoreStore();
  const allMembers = React.useMemo(() => [...membersState, ...alumniState], [membersState, alumniState]);
  React.useEffect(() => {
    if (session) {
      F(session.title || '');
      T(session.note || '');
      k(session.shotCount || 8);
      I(session.includeInStats);
      v(new Date(session.date));
      const cleanedTags = Array.from(new Set((session.tags || []).map(normalizeTag).filter(Boolean)));
      R(cleanedTags);
      let initialAtt = session.attendance ? Object.assign({}, session.attendance) : {};
      if (session.archers && Object.keys(initialAtt).length === 0) {
        session.archers.forEach((archer) => {
          if (!archer.isSeparator && archer.name) {
            const m = allMembers.find(
              (member) =>
                member.name === archer.name ||
                member.id === archer.id ||
                member.personalId === archer.personalId
            );
            if (m) initialAtt[m.id] = 'present';
          }
        });
      }
      setAttendanceEdit(initialAtt);
    }
  }, [session, visible, allMembers]);
  const H = (e) => {
    const t = { title: y, note: S, date: e, includeInStats: A, shotCount: B, tags: D };
    isAdminMode && (t.attendance = attendanceEdit);
    session &&
      B !== session.shotCount &&
      (t.archers = session.archers.map((e) => {
        if (e.isSeparator || e.isTotalCalculator) return e;
        const t = [...e.marks];
        return (
          B > e.marks.length ? t.push(...Array(B - e.marks.length).fill('')) : t.splice(B),
          Object.assign({}, e, { marks: t })
        );
      }));
    onSave(t);
    onClose();
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
  };
  const attStyles = {
    present: { label: '出席', color: '#34C759', icon: 'checkmark-circle' },
    late: { label: '遅刻', color: '#FF9500', icon: 'time' },
    early: { label: '早退', color: '#5856D6', icon: 'exit' },
    absent: { label: '欠席', color: '#8E8E93', icon: 'ellipse-outline' },
  };
  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={j.backdrop}>
          <View style={j.container}>
            <View style={j.header}>
              <Text style={j.headerTitle}>記録の情報を変える</Text>
              <TouchableOpacity onPress={onClose}>
                <Icons.Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              <View style={j.body}>
                <Text style={j.label}>日付</Text>
                <TouchableOpacity style={j.dateSelector} onPress={() => W(true)}>
                  <Text style={j.dateSelectorText}>
                    {w.getFullYear()}
                    {'年 '}
                    {w.getMonth() + 1}
                    {'月 '}
                    {w.getDate()}日
                  </Text>
                  <Icons.Ionicons name="calendar-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
                <Text style={j.label}>タイトル</Text>
                <TextInput style={j.input} value={y} onChangeText={F} placeholder="例: 午前練習" />
                <Text style={j.label}>メモ</Text>
                <TextInput
                  style={[j.input, { height: 80, textAlignVertical: 'top' }]}
                  value={S}
                  onChangeText={T}
                  placeholder="練習のメモなど"
                  multiline
                />
                {isAdminMode && (
                  <>
                    <Text style={j.label}>タグ</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {D.map((e, t) => (
                        <TouchableOpacity
                          key={t}
                          style={j.selectedTagChip}
                          onPress={() => R(D.filter((e, o) => o !== t))}
                        >
                          <Text style={j.selectedTagText}>{タグの見た目(e)}</Text>
                          <Icons.Ionicons name="close-circle" size={16} color="#FFF" />
                        </TouchableOpacity>
                      ))}
                      {0 === D.length && (
                        <Text style={{ color: '#C7C7CC', fontSize: 13, marginBottom: 4 }}>設定なし</Text>
                      )}
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <View style={j.tagInputContainer}>
                        <TextInput
                          style={j.tagInput}
                          value={P}
                          onChangeText={M}
                          placeholder="新規追加"
                          onSubmitEditing={() => {
                            const e = normalizeTag(P);
                            if (e) {
                              const normalizedD = D.map(normalizeTag).filter(Boolean);
                              if (!normalizedD.includes(e)) R([...D, e]);
                            }
                            M('');
                          }}
                        />
                        <TouchableOpacity
                          style={j.tagAddButton}
                          onPress={() => {
                            const e = normalizeTag(P);
                            if (e) {
                              const normalizedD = D.map(normalizeTag).filter(Boolean);
                              if (!normalizedD.includes(e)) R([...D, e]);
                            }
                            M('');
                          }}
                        >
                          <Text style={j.tagAddButtonText}>追加</Text>
                        </TouchableOpacity>
                      </View>
                      {tagTemplates.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {tagTemplates.map((e) => (
                            <TouchableOpacity
                              key={e}
                              style={j.templateTagChip}
                              onPress={() => {
                                const t = normalizeTag(e);
                                if (t) {
                                  const normalizedD = D.map(normalizeTag).filter(Boolean);
                                  if (!normalizedD.includes(t)) R([...D, t]);
                                }
                              }}
                            >
                              <Text style={j.templateTagText}>{e}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                )}
                <View style={j.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={j.label}>
                      {'総矢数 (現在: '}
                      {(session && session.shotCount) || 8}射)
                    </Text>
                    <TextInput
                      style={j.input}
                      value={String(B)}
                      onChangeText={(e) => k(parseInt(e) || 0)}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ width: 20 }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={j.label}>統計に含める</Text>
                    <Switch value={A} onValueChange={I} trackColor={{ false: '#767577', true: '#34C759' }} />
                  </View>
                </View>
                {isAdminMode && allMembers.length > 0 && (
                  <>
                    <View
                      key={undefined}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <Text style={j.label}>出席管理</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: '#E3F2FD',
                            borderRadius: 8,
                          }}
                          onPress={() =>
                            setAttendanceEdit((prev) => {
                              const n = Object.assign({}, prev);
                              if (session && session.archers) {
                                session.archers.forEach((archer) => {
                                  if (!archer.isSeparator && archer.name) {
                                    const m = allMembers.find(
                                      (member) =>
                                        member.name === archer.name ||
                                        member.id === archer.id ||
                                        member.personalId === archer.personalId
                                    );
                                    if (m) n[m.id] = 'present';
                                  }
                                });
                              }
                              return n;
                            })
                          }
                        >
                          <Text style={{ color: '#2196F3', fontSize: 11, fontWeight: 'bold' }}>
                            記録にいる人を出席
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: '#E8F5E9',
                            borderRadius: 8,
                          }}
                          onPress={() =>
                            setAttendanceEdit((prev) => {
                              const n = Object.assign({}, prev);
                              allMembers.forEach((m) => {
                                n[m.id] = 'present';
                              });
                              return n;
                            })
                          }
                        >
                          <Text style={{ color: '#34C759', fontSize: 11, fontWeight: 'bold' }}>全員出席</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: '#F2F2F7',
                            borderRadius: 8,
                          }}
                          onPress={() =>
                            setAttendanceEdit((prev) => {
                              const n = Object.assign({}, prev);
                              allMembers.forEach((m) => {
                                n[m.id] = 'absent';
                              });
                              return n;
                            })
                          }
                        >
                          <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: 'bold' }}>全員欠席</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: '#E5E5EA',
                        borderRadius: 10,
                        marginBottom: 16,
                        overflow: 'hidden',
                      }}
                    >
                      {[...allMembers]
                        .sort((e, t) => {
                          const n = undefined === e.grade || null === e.grade ? 99 : Number(e.grade);
                          const o = undefined === t.grade || null === t.grade ? 99 : Number(t.grade);
                          const l = 0 === n ? 99 : n;
                          const a = 0 === o ? 99 : o;
                          if (l !== a) return l - a;
                          const s = (e) => {
                            const t = (e || '').trim();
                            return '男子' === t ? 0 : '女子' === t ? 1 : 2;
                          };
                          const c = s(e.gender) - s(t.gender);
                          return 0 !== c ? c : (e.name || '').localeCompare(t.name || '', 'ja');
                        })
                        .map((member, idx) => {
                          const status = attendanceEdit[member.id] || 'absent';
                          return (
                            <View
                              key={member.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#FFF',
                                borderBottomWidth: idx < allMembers.length - 1 ? 1 : 0,
                                borderBottomColor: '#E5E5EA',
                              }}
                            >
                              <Text style={{ fontSize: 14, color: '#1C1C1E', flex: 1 }}>
                                {member.name || member.personalId || member.id}
                                <Text style={{ fontSize: 11, color: '#8E8E93', marginLeft: 4 }}>
                                  (
                                  {member.grade === 5
                                    ? '卒業生'
                                    : member.grade === 0
                                      ? 'その他'
                                      : `${member.grade}年`}
                                  )
                                </Text>
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 4 }}>
                                {['present', 'late', 'early', 'absent'].map((sVal) => {
                                  const active = status === sVal;
                                  const info = attStyles[sVal];
                                  return (
                                    <TouchableOpacity
                                      key={sVal}
                                      onPress={() =>
                                        setAttendanceEdit((prev) =>
                                          Object.assign({}, prev, { [member.id]: sVal })
                                        )
                                      }
                                      style={{
                                        paddingVertical: 4,
                                        paddingHorizontal: 6,
                                        borderRadius: 6,
                                        backgroundColor: active ? info.color : '#F2F2F7',
                                        minWidth: 40,
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 'bold',
                                          color: active ? '#FFF' : '#8E8E93',
                                        }}
                                      >
                                        {info.label}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={j.saveButton}
              onPress={() => {
                if (session && B < session.shotCount) O(true);
                else H(w.getTime());
              }}
            >
              <Text style={j.saveButtonText}>変更を保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={z}
        selectedDate={w}
        onSelectDate={(e) => {
          v(e);
        }}
        onClose={() => W(false)}
      />
      <Modal visible={_} transparent animationType="fade">
        <View style={j.confirmBackdrop}>
          <View style={j.confirmBox}>
            <Text style={j.confirmTitle}>射数の変更</Text>
            <Text style={j.confirmMessage}>
              射数を減らすと、減らした分の○╳記録が削除されます。よろしいですか？
            </Text>
            <View style={j.confirmButtons}>
              <TouchableOpacity
                style={[j.confirmBtn, { backgroundColor: '#F2F2F7' }]}
                onPress={() => O(false)}
              >
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[j.confirmBtn, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  O(false);
                  H(w.getTime());
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>変更する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
const j = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  body: { marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  dateSelectorText: { fontSize: 16, color: '#000' },
  selectedTagChip: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  selectedTagText: { color: '#FFF', fontSize: 13 },
  tagInputContainer: { flexDirection: 'row', gap: 8 },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  tagAddButton: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tagAddButtonText: { color: '#FFF', fontWeight: 'bold' },
  templateTagChip: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  templateTagText: { color: '#3C3C43', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: IS_IOS ? 20 : 0,
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 14, padding: 24, alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 24 },
  confirmButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.EditSessionModal = EditSessionModal;
