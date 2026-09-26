'use strict';

const React = require('react');
const { TouchableOpacity, Text, View, Modal, ScrollView, StyleSheet } = require('./rn');
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
      members.forEach((部員) => {
        initial[部員.id] = 'absent';
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
      <TouchableOpacity
        onPress={() => updateStatus(memberId, status)}
        style={[styles.statusBtn, isActive && { backgroundColor: color, borderColor: color }]}
      >
        <Text style={[styles.statusBtnText, isActive && { color: '#FFF' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };
  const sortMembers = (甲, 乙) => {
    // 1. 学年順 (1→4年、卒業生は末尾)
    const gradeA = 甲.grade === undefined || 甲.grade === null ? 99 : Number(甲.grade);
    const gradeB = 乙.grade === undefined || 乙.grade === null ? 99 : Number(乙.grade);
    const 甲の順 = gradeA === 0 ? 99 : gradeA;
    const 乙の順 = gradeB === 0 ? 99 : gradeB;
    if (甲の順 !== 乙の順) return 甲の順 - 乙の順;
    // 2. 男女順 (男子→女子→未設定)
    const genderOrder = (性別) => {
      const 整えた = (性別 || '').trim();
      if (整えた === '男子') return 0;
      if (整えた === '女子') return 1;
      return 2;
    };
    const genderDiff = genderOrder(甲.gender) - genderOrder(乙.gender);
    if (genderDiff !== 0) return genderDiff;
    // 3. あいうえお順
    return (甲.name || '').localeCompare(乙.name || '', 'ja');
  };
  const attendingMembers = members.filter((部員) => attendance[部員.id] !== 'absent').sort(sortMembers);
  const absentMembers = members.filter((部員) => attendance[部員.id] === 'absent').sort(sortMembers);
  const renderMemberItem = (部員) => (
    <View key={部員.id} style={styles.memberRow}>
      <View style={styles.memberNameContainer}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.genderDot,
              { color: 部員.gender === '男子' ? '#007AFF' : 部員.gender === '女子' ? '#FF2D55' : '#8E8E93' },
            ]}
          >
            ●
          </Text>
          <Text style={styles.memberName}>{部員.name}</Text>
        </View>
        <Text style={styles.memberSub}>
          {部員.termKi ? `${部員.termKi}期 / ` : ''}
          {部員.gender}
          {' / '}
          {部員.grade > 0 ? `${部員.grade}年` : '卒業生'}
        </Text>
      </View>
      <View style={styles.statusGroup}>
        <StatusButton
          memberId={部員.id}
          status="present"
          current={attendance[部員.id]}
          label="出席"
          color="#34C759"
        />
        <StatusButton
          memberId={部員.id}
          status="late"
          current={attendance[部員.id]}
          label="遅刻"
          color="#FF9500"
        />
        <StatusButton
          memberId={部員.id}
          status="early"
          current={attendance[部員.id]}
          label="早退"
          color="#5856D6"
        />
        <StatusButton
          memberId={部員.id}
          status="absent"
          current={attendance[部員.id]}
          label="欠席"
          color="#8E8E93"
        />
      </View>
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>出欠の最終確認</Text>
            <Text style={styles.subTitle}>遅刻・早退などの詳細がありませんか？</Text>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>参加者</Text>
            {attendingMembers.length > 0 ? (
              attendingMembers.map(renderMemberItem)
            ) : (
              <Text style={styles.emptyText}>記録に参加者がありません</Text>
            )}
            <View style={styles.separator} />
            <Text style={styles.sectionTitle}>その他のメンバー</Text>
            {absentMembers.map(renderMemberItem)}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(attendance)}>
              <Text style={styles.confirmBtnText}>出欠を確定して次へ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
