/**
 * Module ID: AttendanceCheckModal
 */
"use strict";

const _e = exports;

Object.defineProperty(_e, '__esModule', { value: true });
Object.defineProperty(_e, "AttendanceCheckModal", { enumerable: true, get: function() { return AttendanceCheckModal; } });

var t = require("react");
var o = require("react-native");
var m = require("./AntDesign_600");
var b = require("./JP_useScoreStore_174");
var x = require("./IS_WEB_199");
var F = require("./module_592");
var j = require("./module_427");

const AttendanceCheckModal = ({ visible, onClose, onConfirm }) => {
  const { members, archers } = (0, b.useScoreStore)();
  const [attendance, setAttendance] = (0, t.useState)({});

  (0, t.useEffect)(() => {
    if (visible) {
      const initial = {};
      members.forEach(m => {
        initial[m.id] = "absent";
      });
      archers.forEach(a => {
        if (a && a.memberId) {
          initial[a.memberId] = "present";
        }
      });
      setAttendance(initial);
    }
  }, [visible, members, archers]);

  const updateStatus = (memberId, status) => {
    setAttendance(prev => {
      const next = { ...prev };
      next[memberId] = status;
      return next;
    });
  };

  const StatusButton = ({ memberId, status, current, label, color }) => {
    const isActive = current === status;
    return (0, j.jsx)(o.TouchableOpacity, {
      onPress: () => updateStatus(memberId, status),
      style: [
        styles.statusBtn,
        isActive && { backgroundColor: color, borderColor: color }
      ],
      children: (0, j.jsx)(o.Text, {
        style: [styles.statusBtnText, isActive && { color: "#FFF" }],
        children: label
      })
    });
  };

  const attendingMembers = members.filter(m => attendance[m.id] !== "absent");
  const absentMembers = members.filter(m => attendance[m.id] === "absent");

  const renderMemberItem = (m) => (0, j.jsxs)(o.View, {
    style: styles.memberRow,
    children: [
      (0, j.jsxs)(o.View, {
        style: styles.memberNameContainer,
        children: [
          (0, j.jsxs)(o.View, {
            style: styles.nameRow,
            children: [
              (0, j.jsx)(o.Text, { style: [styles.genderDot, { color: m.gender === '男子' ? '#007AFF' : m.gender === '女子' ? '#FF2D55' : '#8E8E93' }], children: "\u25cf" }),
              (0, j.jsx)(o.Text, { style: styles.memberName, children: m.name })
            ]
          }),
          (0, j.jsxs)(o.Text, { style: styles.memberSub, children: [m.termKi ? `${m.termKi}\u671f / ` : '', m.gender, " / ", m.grade > 0 ? `${m.grade}\u5e74` : '\u5352\u696d\u751f'] })
        ]
      }),
      (0, j.jsxs)(o.View, {
        style: styles.statusGroup,
        children: [
          (0, j.jsx)(StatusButton, { memberId: m.id, status: "present", current: attendance[m.id], label: "\u901a\u5e38", color: "#34C759" }),
          (0, j.jsx)(StatusButton, { memberId: m.id, status: "late", current: attendance[m.id], label: "\u9045\u523b", color: "#FF9500" }),
          (0, j.jsx)(StatusButton, { memberId: m.id, status: "early", current: attendance[m.id], label: "\u65e9\u9000", color: "#5856D6" }),
          (0, j.jsx)(StatusButton, { memberId: m.id, status: "absent", current: attendance[m.id], label: "\u6b20\u5e2d", color: "#8E8E93" })
        ]
      })
    ]
  }, m.id);

  return (0, j.jsx)(o.Modal, {
    visible: visible,
    transparent: true,
    animationType: "fade",
    children: (0, j.jsx)(o.View, {
      style: styles.overlay,
      children: (0, j.jsxs)(o.View, {
        style: styles.container,
        children: [
          (0, j.jsxs)(o.View, {
            style: styles.header,
            children: [
              (0, j.jsx)(o.Text, { style: styles.headerTitle, children: "\u51fa\u6b20\u306e\u6700\u7d42\u78ba\u8a8d" }),
              (0, j.jsx)(o.Text, { style: styles.subTitle, children: "\u9045\u523b\u30fb\u65e9\u9000\u306a\u3069\u306e\u8a73\u7d30\u304c\u3042\u308a\u307e\u305b\u3093\u304b\uff1f" })
            ]
          }),
          (0, j.jsxs)(o.ScrollView, {
            style: styles.scroll,
            showsVerticalScrollIndicator: false,
            children: [
              (0, j.jsx)(o.Text, { style: styles.sectionTitle, children: "\u53c2\u52a0\u8005" }),
              attendingMembers.length > 0 ? attendingMembers.map(renderMemberItem) : (0, j.jsx)(o.Text, { style: styles.emptyText, children: "\u8a18\u9332\u306b\u53c2\u52a0\u8005\u304c\u3042\u308a\u307e\u305b\u3093" }),
              (0, j.jsx)(o.View, { style: styles.separator }),
              (0, j.jsx)(o.Text, { style: styles.sectionTitle, children: "\u305d\u306e\u4ed6\u306e\u90e8\u54e1" }),
              absentMembers.map(renderMemberItem)
            ]
          }),
          (0, j.jsxs)(o.View, {
            style: styles.footer,
            children: [
              (0, j.jsx)(o.TouchableOpacity, {
                style: styles.confirmBtn,
                onPress: () => onConfirm(attendance),
                children: (0, j.jsx)(o.Text, { style: styles.confirmBtnText, children: "\u51fa\u6b20\u3092\u78ba\u5b9a\u3057\u3066\u6b21\u3078" })
              }),
              (0, j.jsx)(o.TouchableOpacity, {
                style: styles.cancelBtn,
                onPress: onClose,
                children: (0, j.jsx)(o.Text, { style: styles.cancelBtnText, children: "\u30ad\u30e3\u30f3\u30bb\u30eb" })
              })
            ]
          })
        ]
      })
    })
  });
};

const styles = o.StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 600, maxHeight: '90%', backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  header: { marginBottom: 15, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  subTitle: { fontSize: 13, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: o.StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  memberNameContainer: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  genderDot: { fontSize: 10 },
  memberName: { fontSize: 16, color: '#000', fontWeight: 'bold' },
  memberSub: { fontSize: 11, color: '#8E8E93' },
  statusGroup: { flexDirection: 'row', gap: 4 },
  statusBtn: { paddingHorizontal: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA', minWidth: 42, alignItems: 'center' },
  statusBtnText: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#C6C6C8', paddingVertical: 20, fontSize: 14 },
  separator: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 15 },
  footer: { marginTop: 20, gap: 10 },
  confirmBtn: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' }
});
