/**
 * Module ID: 694
 */
// "use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 694);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

function e(e) {
    return e && e.__esModule ? e : {
        default: e
    }
}
Object.defineProperty(_e, '__esModule', {
    value: !0
}), Object.defineProperty(_e, "EditSessionModal", {
    enumerable: !0,
    get: function() {
        return C
    }
});
var t = require("./module_37"),
    o = e(require("./default_144")),
    n = e(require("./default_386")),
    l = e(require("./default_45")),
    s = e(require("./default_217")),
    i = e(require("./default_382")),
    d = e(require("./default_398")),
    c = e(require("./default_396")),
    u = require("./IS_WEB_199"),
    f = require("./AntDesign_600"),
    sv = e(require("./default_297")),
    h = (function(e) {
        if (e && e.__esModule) return e;
        var t = {};
        return e && Object.keys(e).forEach(function(o) {
            var n = Object.getOwnPropertyDescriptor(e, o);
            Object.defineProperty(t, o, n.get ? n : {
                enumerable: !0,
                get: function() {
                    return e[o]
                }
            })
        }), t.default = e, t
    })(require("./NotificationFeedbackType_597")),
    x = require("./JP_CustomCalendarModal_695"),
    p = require("./JP_useScoreStore_174"),
    b = require("./module_427");
const C = ({
    visible: e,
    session: l,
    onClose: u,
    onSave: C
}) => {
    const [y, F] = (0, t.useState)(''), [S, T] = (0, t.useState)(''), [B, k] = (0, t.useState)(8), [A, I] = (0, t.useState)(!0), [w, v] = (0, t.useState)(new Date), [z, W] = (0, t.useState)(!1), [D, R] = (0, t.useState)([]), [P, M] = (0, t.useState)(''), [_, O] = (0, t.useState)(!1), [attendanceEdit, setAttendanceEdit] = (0, t.useState)({}), {
        isAdminMode: E,
        tagTemplates: V = [],
        members: membersState = [],
        alumni: alumniState = []
    } = (0, p.useScoreStore)();
    const allMembers = (0, t.useMemo)(() => [...membersState, ...alumniState], [membersState, alumniState]);
    (0, t.useEffect)(() => {
        if (l) {
            F(l.title || '');
            T(l.note || '');
            k(l.shotCount || 8);
            I(l.includeInStats);
            v(new Date(l.date));
            R([...l.tags || []]);
            let initialAtt = l.attendance ? Object.assign({}, l.attendance) : {};
            if (l.archers && Object.keys(initialAtt).length === 0) {
                l.archers.forEach(archer => {
                    if (!archer.isSeparator && archer.name) {
                        const m = allMembers.find(member => member.name === archer.name || member.id === archer.id || member.personalId === archer.personalId);
                        if (m) initialAtt[m.id] = 'present'
                    }
                })
            }
            setAttendanceEdit(initialAtt)
        }
    }, [l, e, allMembers]);
    const H = e => {
        const t = {
            title: y,
            note: S,
            date: e,
            includeInStats: A,
            shotCount: B,
            tags: D
        };
        E && (t.attendance = attendanceEdit);
        l && B !== l.shotCount && (t.archers = l.archers.map(e => {
            if (e.isSeparator) return e;
            const t = [...e.marks];
            return B > e.marks.length ? t.push(...Array(B - e.marks.length).fill('')) : t.splice(B), Object.assign({}, e, {
                marks: t
            })
        })), C(t), u(), h.notificationAsync(h.NotificationFeedbackType.Success)
    };
    const toggleAttendance = (memberId) => {
        setAttendanceEdit(prev => {
            const cur = prev[memberId] || 'absent';
            const states = ['present', 'late', 'early', 'absent'];
            const nextIdx = (states.indexOf(cur) + 1) % states.length;
            const nxt = Object.assign({}, prev);
            nxt[memberId] = states[nextIdx];
            return nxt;
        });
    };
    const attStyles = {
        present: {
            label: '出席',
            color: '#34C759',
            icon: 'checkmark-circle'
        },
        late: {
            label: '遅刻',
            color: '#FF9500',
            icon: 'time'
        },
        early: {
            label: '早退',
            color: '#5856D6',
            icon: 'exit'
        },
        absent: {
            label: '欠席',
            color: '#8E8E93',
            icon: 'ellipse-outline'
        }
    };
    return (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsx)(n.default, {
            visible: e,
            transparent: !0,
            animationType: "slide",
            onRequestClose: u,
            children: (0, b.jsxs)(o.default, {
                style: j.backdrop,
                children: [(0, b.jsxs)(o.default, {
                    style: j.container,
                    children: [(0, b.jsxs)(o.default, {
                        style: j.header,
                        children: [(0, b.jsx)(s.default, {
                            style: j.headerTitle,
                            children: "\u8a18\u9332\u306e\u7de8\u96c6"
                        }), (0, b.jsx)(i.default, {
                            onPress: u,
                            children: (0, b.jsx)(f.Ionicons, {
                                name: "close",
                                size: 24,
                                color: "#000"
                            })
                        })]
                    }), (0, b.jsx)(sv.default, {
                        style: {
                            flex: 1
                        },
                        children: (0, b.jsxs)(o.default, {
                            style: j.body,
                            children: [(0, b.jsx)(s.default, {
                                style: j.label,
                                children: "\u65e5\u4ed8"
                            }), (0, b.jsxs)(i.default, {
                                style: j.dateSelector,
                                onPress: () => W(!0),
                                children: [(0, b.jsxs)(s.default, {
                                                                    style: j.dateSelectorText,
                                                                    children: [w.getFullYear(), "\u5e74 ", w.getMonth() + 1, "\u6708 ", w.getDate(), "\u65e5"]
                                                                }), (0, b.jsx)(f.Ionicons, {
                                                                    name: "calendar-outline",
                                                                    size: 20,
                                                                    color: "#007AFF"
                                                                })]
                            }), (0, b.jsx)(s.default, {
                                style: j.label,
                                children: "\u30bf\u30a4\u30c8\u30eb"
                            }), (0, b.jsx)(d.default, {
                                style: j.input,
                                value: y,
                                onChangeText: F,
                                placeholder: "\u4f8b: \u5348\u524d\u7df4\u7fd2"
                            }), (0, b.jsx)(s.default, {
                                style: j.label,
                                children: "\u30e1\u30e2"
                            }), (0, b.jsx)(d.default, {
                                style: [j.input, {
                                    height: 80,
                                    textAlignVertical: 'top'
                                }],
                                value: S,
                                onChangeText: T,
                                placeholder: "\u7df4\u7fd2\u306e\u30e1\u30e2\u306a\u3069",
                                multiline: !0
                            }), E && (0, b.jsxs)(b.Fragment, {
                                children: [(0, b.jsx)(s.default, {
                                    style: j.label,
                                    children: "\u30bf\u30b0"
                                }), (0, b.jsxs)(o.default, {
                                    style: {
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: 6,
                                        marginBottom: 8
                                    },
                                    children: [D.map((e, t) => (0, b.jsxs)(i.default, {
                                        style: j.selectedTagChip,
                                        onPress: () => R(D.filter((e, o) => o !== t)),
                                        children: [(0, b.jsx)(s.default, {
                                            style: j.selectedTagText,
                                            children: e
                                        }), (0, b.jsx)(f.Ionicons, {
                                            name: "close-circle",
                                            size: 16,
                                            color: "#FFF"
                                        })]
                                    }, t)), 0 === D.length && (0, b.jsx)(s.default, {
                                        style: {
                                            color: '#C7C7CC',
                                            fontSize: 13,
                                            marginBottom: 4
                                        },
                                        children: "\u8a2d\u5b9a\u306a\u3057"
                                    })]
                                }), (0, b.jsxs)(o.default, {
                                    style: {
                                        marginBottom: 16
                                    },
                                    children: [(0, b.jsxs)(o.default, {
                                        style: j.tagInputContainer,
                                        children: [(0, b.jsx)(d.default, {
                                            style: j.tagInput,
                                            value: P,
                                            onChangeText: M,
                                            placeholder: "\u65b0\u898f\u8ffd\u52a0",
                                            onSubmitEditing: () => {
                                                const e = P.trim();
                                                e && !D.includes(e) && R([...D, e.startsWith('#') ? e : '#' + e]), M('')
                                            }
                                        }), (0, b.jsx)(i.default, {
                                            style: j.tagAddButton,
                                            onPress: () => {
                                                const e = P.trim();
                                                e && !D.includes(e) && R([...D, e.startsWith('#') ? e : '#' + e]), M('')
                                            },
                                            children: (0, b.jsx)(s.default, {
                                                style: j.tagAddButtonText,
                                                children: "\u8ffd\u52a0"
                                            })
                                        })]
                                    }), V.length > 0 && (0, b.jsx)(o.default, {
                                        style: {
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            gap: 6,
                                            marginTop: 8
                                        },
                                        children: V.map(e => (0, b.jsx)(i.default, {
                                            style: j.templateTagChip,
                                            onPress: () => {
                                                D.includes(e) || R([...D, e])
                                            },
                                            children: (0, b.jsx)(s.default, {
                                                style: j.templateTagText,
                                                children: e
                                            })
                                        }, e))
                                    })]
                                })]
                            }), (0, b.jsxs)(o.default, {
                                style: j.row,
                                children: [(0, b.jsxs)(o.default, {
                                    style: {
                                        flex: 1
                                    },
                                    children: [(0, b.jsxs)(s.default, {
                                        style: j.label,
                                        children: ["\u7dcf\u77e2\u6570 (\u73fe\u5728: ", (l && l.shotCount) || 8, "\u5c04)"]
                                    }), (0, b.jsx)(d.default, {
                                        style: j.input,
                                        value: String(B),
                                        onChangeText: e => k(parseInt(e) || 0),
                                        keyboardType: "number-pad"
                                    })]
                                }), (0, b.jsx)(o.default, {
                                    style: {
                                        width: 20
                                    }
                                }), (0, b.jsxs)(o.default, {
                                    style: {
                                        alignItems: 'center'
                                    },
                                    children: [(0, b.jsx)(s.default, {
                                        style: j.label,
                                        children: "\u7d71\u8a08\u306b\u542b\u3081\u308b"
                                    }), (0, b.jsx)(c.default, {
                                        value: A,
                                        onValueChange: I,
                                        trackColor: {
                                            false: "#767577",
                                            true: "#34C759"
                                        }
                                    })]
                                })]
                            }), E && allMembers.length > 0 && (0, b.jsxs)(b.Fragment, {
                                children: [(0, b.jsxs)(o.default, {
                                    style: {
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 6
                                    },
                                    children: [(0, b.jsx)(s.default, {
                                        style: j.label,
                                        children: "\u51fa\u5e2d\u7ba1\u7406"
                                    }), (0, b.jsxs)(o.default, {
                                        style: {
                                            flexDirection: 'row',
                                            gap: 6
                                        },
                                        children: [(0, b.jsx)(i.default, {
                                            style: {
                                                paddingVertical: 4,
                                                paddingHorizontal: 8,
                                                backgroundColor: '#E3F2FD',
                                                borderRadius: 8
                                            },
                                            onPress: () => setAttendanceEdit(prev => {
                                                const n = Object.assign({}, prev);
                                                if (l && l.archers) {
                                                    l.archers.forEach(archer => {
                                                        if (!archer.isSeparator && archer.name) {
                                                            const m = allMembers.find(member => member.name === archer.name || member.id === archer.id || member.personalId === archer.personalId);
                                                            if (m) n[m.id] = 'present'
                                                        }
                                                    })
                                                }
                                                return n
                                            }),
                                            children: (0, b.jsx)(s.default, {
                                                style: {
                                                    color: '#2196F3',
                                                    fontSize: 11,
                                                    fontWeight: 'bold'
                                                },
                                                children: "\u8a18\u9332\u306b\u3044\u308b\u4eba\u3092\u51fa\u5e2d"
                                            })
                                        }), (0, b.jsx)(i.default, {
                                            style: {
                                                paddingVertical: 4,
                                                paddingHorizontal: 8,
                                                backgroundColor: '#E8F5E9',
                                                borderRadius: 8
                                            },
                                            onPress: () => setAttendanceEdit(prev => {
                                                const n = Object.assign({}, prev);
                                                allMembers.forEach(m => {
                                                    n[m.id] = 'present'
                                                });
                                                return n
                                            }),
                                            children: (0, b.jsx)(s.default, {
                                                style: {
                                                    color: '#34C759',
                                                    fontSize: 11,
                                                    fontWeight: 'bold'
                                                },
                                                children: "\u5168\u54e1\u51fa\u5e2d"
                                            })
                                        }), (0, b.jsx)(i.default, {
                                            style: {
                                                paddingVertical: 4,
                                                paddingHorizontal: 8,
                                                backgroundColor: '#F2F2F7',
                                                borderRadius: 8
                                            },
                                            onPress: () => setAttendanceEdit(prev => {
                                                const n = Object.assign({}, prev);
                                                allMembers.forEach(m => {
                                                    n[m.id] = 'absent'
                                                });
                                                return n
                                            }),
                                            children: (0, b.jsx)(s.default, {
                                                style: {
                                                    color: '#8E8E93',
                                                    fontSize: 11,
                                                    fontWeight: 'bold'
                                                },
                                                children: "\u5168\u54e1\u6b20\u5e2d"
                                            })
                                        })]
                                    })]
                                }, void 0), (0, b.jsx)(o.default, {
                                    style: {
                                        borderWidth: 1,
                                        borderColor: '#E5E5EA',
                                        borderRadius: 10,
                                        marginBottom: 16,
                                        overflow: 'hidden'
                                    },
                                    children: [...allMembers].sort((e, t) => {
                                        const n = void 0 === e.grade || null === e.grade ? 99 : Number(e.grade),
                                            o = void 0 === t.grade || null === t.grade ? 99 : Number(t.grade),
                                            l = 0 === n ? 99 : n,
                                            a = 0 === o ? 99 : o;
                                        if (l !== a) return l - a;
                                        const s = e => {
                                                const t = (e || '').trim();
                                                return '\u7537\u5b50' === t ? 0 : '\u5973\u5b50' === t ? 1 : 2
                                            },
                                            c = s(e.gender) - s(t.gender);
                                        return 0 !== c ? c : (e.name || '').localeCompare(t.name || '', 'ja')
                                    }).map((member, idx) => {
                                        const status = attendanceEdit[member.id] || 'absent';
                                        return (0, b.jsxs)(o.default, {
                                            style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 10,
                                                paddingHorizontal: 12,
                                                backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#FFF',
                                                borderBottomWidth: idx < allMembers.length - 1 ? 1 : 0,
                                                borderBottomColor: '#E5E5EA'
                                            },
                                            children: [(0, b.jsxs)(s.default, {
                                                style: {
                                                    fontSize: 14,
                                                    color: '#1C1C1E',
                                                    flex: 1
                                                },
                                                children: [
                                                    member.name || member.personalId || member.id,
                                                    (0, b.jsx)(s.default, {
                                                        style: { fontSize: 11, color: '#8E8E93', marginLeft: 4 },
                                                        children: ["(", member.grade === 5 ? '卒業生' : member.grade === 0 ? 'その他' : `${member.grade}年`, ")"]
                                                    })
                                                ]
                                            }), (0, b.jsxs)(o.default, {
                                                style: {
                                                    flexDirection: 'row',
                                                    gap: 4
                                                },
                                                children: ['present', 'late', 'early', 'absent'].map(sVal => {
                                                    const active = status === sVal;
                                                    const info = attStyles[sVal];
                                                    return (0, b.jsx)(i.default, {
                                                        onPress: () => setAttendanceEdit(prev => Object.assign({}, prev, {
                                                            [member.id]: sVal
                                                        })),
                                                        style: {
                                                            paddingVertical: 4,
                                                            paddingHorizontal: 6,
                                                            borderRadius: 6,
                                                            backgroundColor: active ? info.color : '#F2F2F7',
                                                            minWidth: 40,
                                                            alignItems: 'center'
                                                        },
                                                        children: (0, b.jsx)(s.default, {
                                                            style: {
                                                                fontSize: 11,
                                                                fontWeight: 'bold',
                                                                color: active ? '#FFF' : '#8E8E93'
                                                            },
                                                            children: info.label
                                                        })
                                                    }, sVal)
                                                })
                                            })]
                                        }, member.id)
                                    })
                                })]
                            })]
                        })
                    }), (0, b.jsx)(i.default, {
                        style: j.saveButton,
                        onPress: () => {
                            l && B < l.shotCount ? O(!0) : H(w.getTime())
                        },
                        children: (0, b.jsx)(s.default, {
                            style: j.saveButtonText,
                            children: "\u5909\u66f4\u3092\u4fdd\u5b58"
                        })
                    })]
                })]
            })
        }), (0, b.jsx)(x.CustomCalendarModal, {
            visible: z,
            selectedDate: w,
            onSelectDate: e => {
                v(e);
            },
            onClose: () => W(!1)
        })]
    })
}, j = l.default.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: l.default.hairlineWidth,
        borderBottomColor: '#CCC',
        paddingBottom: 10
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    body: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        fontWeight: '600'
    },
    input: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#FAFAFA'
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
        backgroundColor: '#FAFAFA'
    },
    dateSelectorText: {
        fontSize: 16,
        color: '#000'
    },
    selectedTagChip: {
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 4
    },
    selectedTagText: {
        color: '#FFF',
        fontSize: 13
    },
    tagInputContainer: {
        flexDirection: 'row',
        gap: 8
    },
    tagInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        backgroundColor: '#FAFAFA'
    },
    tagAddButton: {
        backgroundColor: '#34C759',
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: 8
    },
    tagAddButtonText: {
        color: '#FFF',
        fontWeight: 'bold'
    },
    templateTagChip: {
        backgroundColor: '#E5E5EA',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12
    },
    templateTagText: {
        color: '#3C3C43',
        fontSize: 13
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: u.IS_IOS ? 20 : 0
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold'
    },
    confirmBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmBox: {
        width: '85%',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 24,
        alignItems: 'center'
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8
    },
    confirmMessage: {
        fontSize: 14,
        color: '#3C3C43',
        textAlign: 'center',
        marginBottom: 24
    },
    confirmButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    }
});