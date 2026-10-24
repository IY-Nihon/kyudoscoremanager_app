const { 色 } = require('./iro.js');
const React = require('react');
const { View, Modal, StyleSheet, Text, TouchableOpacity, TextInput, Switch, ScrollView } = require('./rn');
const { IS_IOS } = require('./IS_WEB');
const Icons = require('@expo/vector-icons');
const ExpoHaptics = require('expo-haptics');
const { CustomCalendarModal } = require('./CustomCalendarModal');

const 学 = require('./gakunen');
const { useストアの一部 } = require('./storeSlice');
const { normalizeTag, タグの見た目 } = require('./syncRules');
/**
 * 記録に出ている部員の id。部員は memberId で引き、無ければ名前で引く。途中交代で入った人
 * （substitutionIds）も入れる。前は personalId 同士も比べていて、どちらも未設定（undefined）だと
 * 一致し、名簿の先頭の人が誰でも出席になった。射手の id は列の id なので部員とは比べない
 */
function 記録に出た部員のid(session, allMembers) {
  const 出 = new Set();
  const 部員たち = Array.isArray(allMembers) ? allMembers : [];
  ((session && session.archers) || []).forEach((archer) => {
    if (!archer || archer.isSeparator || archer.isTotalCalculator) return;
    const 本人 = archer.memberId
      ? 部員たち.find((member) => member.id === archer.memberId)
      : archer.name
        ? 部員たち.find((member) => member.name === archer.name)
        : null;
    if (本人) 出.add(本人.id);
    Object.values(archer.substitutionIds || {}).forEach((id) => {
      if (部員たち.some((member) => member.id === id)) 出.add(id);
    });
  });
  return [...出];
}

const EditSessionModal = ({ visible, session, onClose, onSave }) => {
  const [題, 題を置く] = React.useState('');
  const [覚え書き, 覚え書きを置く] = React.useState('');
  const [本数, 本数を置く] = React.useState(8);
  const [統計に入れる, 統計に入れるを置く] = React.useState(true);
  const [日付, 日付を置く] = React.useState(new Date());
  const [暦を出す, 暦を出すを置く] = React.useState(false);
  const [タグたち, タグたちを置く] = React.useState([]);
  const [タグの下書き, タグの下書きを置く] = React.useState('');
  const [射数の確認, 射数の確認を出す] = React.useState(false);
  const [attendanceEdit, setAttendanceEdit] = React.useState({});
  const {
    isAdminMode,
    tagTemplates = [],
    members: membersState = [],
    alumni: alumniState = [],
  } = useストアの一部(['isAdminMode', 'tagTemplates', 'members', 'alumni']);
  const allMembers = React.useMemo(() => [...membersState, ...alumniState], [membersState, alumniState]);
  // 下書きを作り直すのは、窓を開いたときと、別の記録に替わったときだけ。
  // 同じ記録が雲から届き直すと（同期で記録の一覧が入れ替わると、中身が同じでも別のオブジェクトになる）、
  // 打っている途中の題・タグ・出欠が開いたときの内容に戻っていた（2026-09-26 に e2e で踏んだ）
  const 下書きの記録 = React.useRef(null);
  React.useEffect(() => {
    if (!visible) {
      下書きの記録.current = null;
      return;
    }
    if (session && 下書きの記録.current !== session.id) {
      下書きの記録.current = session.id;
      題を置く(session.title || '');
      覚え書きを置く(session.note || '');
      本数を置く(session.shotCount || 8);
      統計に入れるを置く(session.includeInStats);
      日付を置く(new Date(session.date));
      const cleanedTags = Array.from(new Set((session.tags || []).map(normalizeTag).filter(Boolean)));
      タグたちを置く(cleanedTags);
      let initialAtt = session.attendance ? Object.assign({}, session.attendance) : {};
      if (session.archers && Object.keys(initialAtt).length === 0) {
        記録に出た部員のid(session, allMembers).forEach((id) => (initialAtt[id] = 'present'));
      }
      setAttendanceEdit(initialAtt);
    }
  }, [session, visible, allMembers]);
  const 保存する = (日付) => {
    const 変更 = {
      title: 題,
      note: 覚え書き,
      date: 日付,
      includeInStats: 統計に入れる,
      shotCount: 本数,
      tags: タグたち,
    };
    if (isAdminMode) {
      変更.attendance = attendanceEdit;
    }
    if (session && 本数 !== session.shotCount) {
      変更.archers = session.archers.map((射手) => {
        if (射手.isSeparator || 射手.isTotalCalculator) return 射手;
        const 印 = [...(射手.marks || [])];
        if (本数 > 印.length) {
          印.push(...Array(本数 - 印.length).fill(''));
        } else {
          印.splice(本数);
        }
        return Object.assign(
          {},
          射手,
          { marks: 印 },
          // 減らしたときは、切り捨てた射の矢所も落とす（記録画面の射数の変更と同じ）
          Array.isArray(射手.arrowLocations) && 射手.arrowLocations.length > 本数
            ? { arrowLocations: 射手.arrowLocations.slice(0, 本数) }
            : null
        );
      });
    }
    onSave(変更);
    onClose();
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
  };
  const attStyles = {
    present: { label: '出席', color: 色.緑, icon: 'checkmark-circle' },
    late: { label: '遅刻', color: 色.橙, icon: 'time' },
    early: { label: '早退', color: 色.藍, icon: 'exit' },
    absent: { label: '欠席', color: 色.灰, icon: 'ellipse-outline' },
  };
  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>記録の情報を変える</Text>
              <TouchableOpacity // 絵だけのボタン。読み上げと検査のために名を付ける
                accessible
                accessibilityRole="button"
                accessibilityLabel="閉じる"
                aria-label="閉じる"
                onPress={onClose}
              >
                <Icons.Ionicons name="close" size={24} color={色.黒} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              <View style={styles.body}>
                <Text style={styles.label}>日付</Text>
                <TouchableOpacity style={styles.dateSelector} onPress={() => 暦を出すを置く(true)}>
                  <Text style={styles.dateSelectorText}>
                    {日付.getFullYear()}
                    {'年 '}
                    {日付.getMonth() + 1}
                    {'月 '}
                    {日付.getDate()}日
                  </Text>
                  <Icons.Ionicons name="calendar-outline" size={20} color={色.青} />
                </TouchableOpacity>
                <Text style={styles.label}>タイトル</Text>
                <TextInput
                  aria-label="大会名・練習名"
                  style={styles.input}
                  value={題}
                  onChangeText={題を置く}
                  placeholder="例: 午前練習"
                />
                <Text style={styles.label}>メモ</Text>
                <TextInput
                  aria-label="練習メモ"
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={覚え書き}
                  onChangeText={覚え書きを置く}
                  placeholder="練習のメモなど"
                  multiline
                />
                {isAdminMode && (
                  <>
                    <Text style={styles.label}>タグ</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {タグたち.map((タグ, 番) => (
                        <TouchableOpacity
                          key={番}
                          style={styles.selectedTagChip}
                          onPress={() => タグたちを置く(タグたち.filter((無し, 位置) => 位置 !== 番))}
                        >
                          <Text style={styles.selectedTagText}>{タグの見た目(タグ)}</Text>
                          <Icons.Ionicons name="close-circle" size={16} color={色.白} />
                        </TouchableOpacity>
                      ))}
                      {タグたち.length === 0 && (
                        <Text style={{ color: 色.灰_薄い, fontSize: 13, marginBottom: 4 }}>設定なし</Text>
                      )}
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <View style={styles.tagInputContainer}>
                        <TextInput
                          aria-label="タグを追加"
                          style={styles.tagInput}
                          value={タグの下書き}
                          onChangeText={タグの下書きを置く}
                          placeholder="新規追加"
                          onSubmitEditing={() => {
                            const 整えた = normalizeTag(タグの下書き);
                            if (整えた) {
                              const normalizedD = タグたち.map(normalizeTag).filter(Boolean);
                              if (!normalizedD.includes(整えた)) タグたちを置く([...タグたち, 整えた]);
                            }
                            タグの下書きを置く('');
                          }}
                        />
                        <TouchableOpacity
                          style={styles.tagAddButton}
                          onPress={() => {
                            const 整えた = normalizeTag(タグの下書き);
                            if (整えた) {
                              const normalizedD = タグたち.map(normalizeTag).filter(Boolean);
                              if (!normalizedD.includes(整えた)) タグたちを置く([...タグたち, 整えた]);
                            }
                            タグの下書きを置く('');
                          }}
                        >
                          <Text style={styles.tagAddButtonText}>追加</Text>
                        </TouchableOpacity>
                      </View>
                      {tagTemplates.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {tagTemplates.map((タグ) => (
                            <TouchableOpacity
                              key={タグ}
                              style={styles.templateTagChip}
                              onPress={() => {
                                const 整えた = normalizeTag(タグ);
                                if (整えた) {
                                  const normalizedD = タグたち.map(normalizeTag).filter(Boolean);
                                  if (!normalizedD.includes(整えた)) タグたちを置く([...タグたち, 整えた]);
                                }
                              }}
                            >
                              <Text style={styles.templateTagText}>{タグの見た目(タグ)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                )}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>
                      {'総矢数 (現在: '}
                      {(session && session.shotCount) || 8}射)
                    </Text>
                    <TextInput
                      aria-label="総矢数"
                      style={styles.input}
                      value={String(本数)}
                      onChangeText={(文) => 本数を置く(parseInt(文) || 0)}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ width: 20 }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.label}>統計に含める</Text>
                    <Switch
                      value={統計に入れる}
                      onValueChange={統計に入れるを置く}
                      trackColor={{ false: 色.スイッチの地, true: 色.緑 }}
                    />
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
                      <Text style={styles.label}>出席管理</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: 色.青の地_5,
                            borderRadius: 8,
                          }}
                          onPress={() =>
                            setAttendanceEdit((prev) => {
                              const 次 = Object.assign({}, prev);
                              記録に出た部員のid(session, allMembers).forEach((id) => (次[id] = 'present'));
                              return 次;
                            })
                          }
                        >
                          <Text style={{ color: 色.青_2196, fontSize: 11, fontWeight: 'bold' }}>
                            記録にいる人を出席
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: 色.緑の地,
                            borderRadius: 8,
                          }}
                          onPress={() =>
                            setAttendanceEdit((prev) => {
                              const 次 = Object.assign({}, prev);
                              allMembers.forEach((部員) => {
                                次[部員.id] = 'present';
                              });
                              return 次;
                            })
                          }
                        >
                          <Text style={{ color: 色.緑, fontSize: 11, fontWeight: 'bold' }}>全員出席</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: 色.地,
                            borderRadius: 8,
                          }}
                          onPress={() =>
                            setAttendanceEdit((prev) => {
                              const 次 = Object.assign({}, prev);
                              allMembers.forEach((部員) => {
                                次[部員.id] = 'absent';
                              });
                              return 次;
                            })
                          }
                        >
                          <Text style={{ color: 色.灰, fontSize: 11, fontWeight: 'bold' }}>全員欠席</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: 色.地_濃い,
                        borderRadius: 10,
                        marginBottom: 16,
                        overflow: 'hidden',
                      }}
                    >
                      {[...allMembers].sort(学.名簿の順に比べる).map((member, idx) => {
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
                              backgroundColor: idx % 2 === 0 ? 色.地_FAFAFA : 色.白,
                              borderBottomWidth: idx < allMembers.length - 1 ? 1 : 0,
                              borderBottomColor: 色.地_濃い,
                            }}
                          >
                            <Text style={{ fontSize: 14, color: 色.文字, flex: 1 }}>
                              {member.name || member.personalId || member.id}
                              <Text style={{ fontSize: 11, color: 色.灰, marginLeft: 4 }}>
                                ({学.学年の名前(member)})
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
                                      backgroundColor: active ? info.color : 色.地,
                                      minWidth: 40,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 'bold',
                                        color: active ? 色.白 : 色.灰,
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
              // 射数が空や 0 のまま保存すると、全員の○×が消える。1 射以上のときだけ押せる
              style={[styles.saveButton, !(本数 >= 1) && { opacity: 0.4 }]}
              disabled={!(本数 >= 1)}
              onPress={() => {
                if (!(本数 >= 1)) return;
                if (session && 本数 < session.shotCount) 射数の確認を出す(true);
                else 保存する(日付.getTime());
              }}
            >
              <Text style={styles.saveButtonText}>変更を保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={暦を出す}
        selectedDate={日付}
        onSelectDate={(日付) => {
          日付を置く(日付);
        }}
        onClose={() => 暦を出すを置く(false)}
      />
      <Modal
        visible={射数の確認}
        transparent
        animationType="fade"
        onRequestClose={() => 射数の確認を出す(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>射数の変更</Text>
            <Text style={styles.confirmMessage}>
              射数を減らすと、減らした分の○╳記録が削除されます。よろしいですか？
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: 色.地 }]}
                onPress={() => 射数の確認を出す(false)}
              >
                <Text style={{ color: 色.青, fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: 色.赤 }]}
                onPress={() => {
                  射数の確認を出す(false);
                  保存する(日付.getTime());
                }}
              >
                <Text style={{ color: 色.白, fontWeight: 'bold' }}>変更する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: 色.白,
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
    borderBottomColor: 色.罫,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  body: { marginBottom: 20 },
  label: { fontSize: 14, color: 色.墨_66, marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: 色.罫,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 色.地_FAFAFA,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 色.罫,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 色.地_FAFAFA,
  },
  dateSelectorText: { fontSize: 16, color: 色.黒 },
  selectedTagChip: {
    backgroundColor: 色.青,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  selectedTagText: { color: 色.白, fontSize: 13 },
  tagInputContainer: { flexDirection: 'row', gap: 8 },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 色.罫,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: 色.地_FAFAFA,
  },
  tagAddButton: {
    backgroundColor: 色.緑,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tagAddButtonText: { color: 色.白, fontWeight: 'bold' },
  templateTagChip: {
    backgroundColor: 色.地_濃い,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  templateTagText: { color: 色.文字_二, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  saveButton: {
    backgroundColor: 色.青,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: IS_IOS ? 20 : 0,
  },
  saveButtonText: { color: 色.白, fontSize: 18, fontWeight: 'bold' },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: { width: '85%', backgroundColor: 色.白, borderRadius: 14, padding: 24, alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: 色.文字_二, textAlign: 'center', marginBottom: 24 },
  confirmButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.EditSessionModal = EditSessionModal;
