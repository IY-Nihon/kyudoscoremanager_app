'use strict';

const React = require('react');
// Text と StyleSheet はダークモードのテーマ変換を通すためブリッジ経由で差し替える
const RN = Object.assign({}, require('react-native'), {
  Text: require('./Text').default,
  StyleSheet: require('./StyleSheet').default,
});
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
const IS_WEB = require('./IS_WEB');
const shadowStyle = require('./shadowStyle');
// 出欠の自動判定。交代で入った人も数えるため、決まりは切り出してある
const { 出ていた部員たち } = require('./attendanceRules');
const AttendanceCheckModal = ({ visible, onClose, onConfirm }) => {
  const { members, archers } = useScoreStore();
  const [attendance, setAttendance] = React.useState({});
  React.useEffect(() => {
    if (visible) {
      const initial = {};
      members.forEach((m) => {
        initial[m.id] = 'absent';
      });
      // 立っていた人を出席にする。途中交代で入った人も、実際に引いているので
      // 出席にする（archer.memberId には出てこず substitutionIds にだけ出てくる）
      for (const id of 出ていた部員たち(archers)) {
        initial[id] = 'present';
      }
      setAttendance(initial);
    }
  }, [visible, members, archers]);
  const updateStatus = (memberId, status) => {
    setAttendance((prev) => {
      const next = { ...prev };
      next[memberId] = status;
      return next;
    });
  };
  const StatusButton = ({ memberId, status, current, label, color }) => {
    const isActive = current === status;
    return (
      <RN.TouchableOpacity
        onPress={() => updateStatus(memberId, status)}
        style={[styles.statusBtn, isActive && { backgroundColor: color, borderColor: color }]}
      >
        <RN.Text style={[styles.statusBtnText, isActive && { color: '#FFF' }]}>{label}</RN.Text>
      </RN.TouchableOpacity>
    );
  };
  const sortMembers = (a, b) => {
    // 1. 学年順 (1→4年、卒業生は末尾)
    const gradeA = a.grade === undefined || a.grade === null ? 99 : Number(a.grade);
    const gradeB = b.grade === undefined || b.grade === null ? 99 : Number(b.grade);
    const gA = gradeA === 0 ? 99 : gradeA;
    const gB = gradeB === 0 ? 99 : gradeB;
    if (gA !== gB) return gA - gB;
    // 2. 男女順 (男子→女子→未設定)
    const genderOrder = (g) => {
      const s = (g || '').trim();
      if (s === '男子') return 0;
      if (s === '女子') return 1;
      return 2;
    };
    const genderDiff = genderOrder(a.gender) - genderOrder(b.gender);
    if (genderDiff !== 0) return genderDiff;
    // 3. あいうえお順
    return (a.name || '').localeCompare(b.name || '', 'ja');
  };
  const attendingMembers = members.filter((m) => attendance[m.id] !== 'absent').sort(sortMembers);
  const absentMembers = members.filter((m) => attendance[m.id] === 'absent').sort(sortMembers);
  const renderMemberItem = (m) => (
    <RN.View key={m.id} style={styles.memberRow}>
      <RN.View style={styles.memberNameContainer}>
        <RN.View style={styles.nameRow}>
          <RN.Text
            style={[
              styles.genderDot,
              { color: m.gender === '男子' ? '#007AFF' : m.gender === '女子' ? '#FF2D55' : '#8E8E93' },
            ]}
          >
            ●
          </RN.Text>
          <RN.Text style={styles.memberName}>{m.name}</RN.Text>
        </RN.View>
        <RN.Text style={styles.memberSub}>
          {m.termKi ? `${m.termKi}期 / ` : ''}
          {m.gender}
          {' / '}
          {m.grade > 0 ? `${m.grade}年` : '卒業生'}
        </RN.Text>
      </RN.View>
      <RN.View style={styles.statusGroup}>
        <StatusButton
          memberId={m.id}
          status="present"
          current={attendance[m.id]}
          label="出席"
          color="#34C759"
        />
        <StatusButton memberId={m.id} status="late" current={attendance[m.id]} label="遅刻" color="#FF9500" />
        <StatusButton
          memberId={m.id}
          status="early"
          current={attendance[m.id]}
          label="早退"
          color="#5856D6"
        />
        <StatusButton
          memberId={m.id}
          status="absent"
          current={attendance[m.id]}
          label="欠席"
          color="#8E8E93"
        />
      </RN.View>
    </RN.View>
  );
  return (
    <RN.Modal visible={visible} transparent animationType="fade">
      <RN.View style={styles.overlay}>
        <RN.View style={styles.container}>
          <RN.View style={styles.header}>
            <RN.Text style={styles.headerTitle}>出欠の最終確認</RN.Text>
            <RN.Text style={styles.subTitle}>遅刻・早退などの詳細がありませんか？</RN.Text>
          </RN.View>
          <RN.ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <RN.Text style={styles.sectionTitle}>参加者</RN.Text>
            {attendingMembers.length > 0 ? (
              attendingMembers.map(renderMemberItem)
            ) : (
              <RN.Text style={styles.emptyText}>記録に参加者がありません</RN.Text>
            )}
            <RN.View style={styles.separator} />
            <RN.Text style={styles.sectionTitle}>その他のメンバー</RN.Text>
            {absentMembers.map(renderMemberItem)}
          </RN.ScrollView>
          <RN.View style={styles.footer}>
            <RN.TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(attendance)}>
              <RN.Text style={styles.confirmBtnText}>出欠を確定して次へ</RN.Text>
            </RN.TouchableOpacity>
            <RN.TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <RN.Text style={styles.cancelBtnText}>キャンセル</RN.Text>
            </RN.TouchableOpacity>
          </RN.View>
        </RN.View>
      </RN.View>
    </RN.Modal>
  );
};
const styles = RN.StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  header: { marginBottom: 15, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  subTitle: { fontSize: 13, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  scroll: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: RN.StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  memberNameContainer: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  genderDot: { fontSize: 10 },
  memberName: { fontSize: 16, color: '#000', fontWeight: 'bold' },
  memberSub: { fontSize: 11, color: '#8E8E93' },
  statusGroup: { flexDirection: 'row', gap: 4 },
  statusBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: 42,
    alignItems: 'center',
  },
  statusBtnText: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#C6C6C8', paddingVertical: 20, fontSize: 14 },
  separator: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 15 },
  footer: { marginTop: 20, gap: 10 },
  confirmBtn: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.AttendanceCheckModal = AttendanceCheckModal;
