'use strict';

function t(e) {
  if (e && e.__esModule) return e;
  const t = {};
  return (
    e &&
      Object.keys(e).forEach(function (l) {
        const o = Object.getOwnPropertyDescriptor(e, l);
        Object.defineProperty(
          t,
          l,
          o.get
            ? o
            : {
                enumerable: true,
                get: function () {
                  return e[l];
                },
              }
        );
      }),
    (t.default = e),
    t
  );
}
// 成績の数え方は分析画面と共通（src/statsRules.js）
const 集 = require('./statsRules');
const _xlsx = require('./excelExport');
const themeMod = require('./theme');
const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const ScrollView = require('./ScrollView').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const Switch = require('./Switch').default;
const Alert = require('./alertBridge').default;
const Modal = require('./Modal').default;
const TextInput = require('./TextInput').default;
const Pressable = require('./Pressable').default;
const { IS_IOS, IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
const 規則 = require('./syncRules');
const 案内 = require('./TutorialGuide');
const Icons = require('@expo/vector-icons');
const ReactNativeSafeAreaContext = require('react-native-safe-area-context');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const C = t(require('expo-file-system/legacy'));
const b = t(require('expo-sharing'));
const fileSaver = require('./fileSaver');
const { auth, db } = require('./db');
const FirebaseAuth = require('firebase/auth');
const { getShadowStyle } = require('./shadowStyle');
const Firestore = require('firebase/firestore');
const ExpoImagePicker = require('expo-image-picker');
const _RN = require('react-native');
const _IM = require('expo-image-manipulator');
// ログアウトの確認の文言は src/logoutPrompt.js にある（画面を動かさずに
// 出し分けを検査できるようにするため）
const {
  logoutMessage: ログアウトの文言,
  logoutButtonLabel: ログアウトのボタン名,
  logoutButtonsDisabled: ログアウトのボタンを止める,
  shouldTrySendFirst: 先に送信すべきか,
} = require('./logoutPrompt');
// ─────────────────────────────────────────
// 書き出しの共通ヘルパー
// ─────────────────────────────────────────

// Excel が日付として解釈でき、文字列ソートも崩れない形式にする。
function csvDate(ts) {
  const d = new Date(ts);
  const p2 = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}
// memberId（無ければ氏名）でメンバーを引く。学年・性別・期の補完に使う。
function findMemberInfo(archer, memberList, alumniList, normalizeName) {
  const all = [].concat(memberList || [], alumniList || []);
  const nm = normalizeName(archer.name || '');
  return (
    all.find(function (m) {
      return (archer.memberId && m.id === archer.memberId) || (m.name && normalizeName(m.name) === nm);
    }) || null
  );
}
const SettingsScreen = () => {
  const { mode: themeMode, setThemeMode: setThemeModeFn } = themeMod.useThemeMode();
  const {
    currentFreshmanTerm = 1,
    alumni = [],
    trash = [],
    shotsPerRound = 8,
    updateCurrentFreshmanTerm,
    syncStatus = 'IDLE',
    lastSyncTime,
    isNetworkOnline = true,
    syncAllToCloud,
    activeGroupId,
    activeGroupName,
    updateGroupName,
    activeRole,
    myMemberId,
    myMemberName,
    members = [],
    setAuth,
    isAdminMode,
    自動ロックする: 自動ロックする,
    set自動ロックする: set自動ロックする,
    保存時に出欠を確認する = true,
    set保存時に出欠を確認する: set保存時に出欠を確認する,
    setAdminMode,
    verifyGroupPassword,
    deleteGroupAccount: 団体を消す,
    tagTemplates = [],
    addTagTemplate,
    removeTagTemplate,
    autoPromotionEnabled = true,
    setAutoPromotionEnabled,
    enableArrowLocation,
    arrowTargetType,
    setEnableArrowLocation,
    setArrowTargetType,
    sessions: sList = [],
  } = useScoreStore();
  const [Z, ee] = React.useState(false);
  const [te, le] = React.useState(false);
  const [re, oe] = React.useState(false);
  const // ログアウトの確認の段階。'確認' → '送信中' → '送信済み' / '失敗'
    [ログアウトの段階, ログアウトの段階を設定] = React.useState('確認');
  const [残った未送信, 残った未送信を設定] = React.useState(0);
  const [ne, ae] = React.useState('');
  const [se, ie] = React.useState('');
  const [de, ce] = React.useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [ue, fe] = React.useState(new Date());
  const [me, he] = React.useState('all');
  const [xe, ge] = React.useState('');
  const [ye, pe] = React.useState('standard');
  const [je, Fe] = React.useState(false);
  const [Ce, be] = React.useState('start');
  const [Se, Ee] = React.useState('');
  const [Be, Ie] = React.useState([]);
  const [Te, we] = React.useState('AND');
  const [De, ve] = React.useState(false);
  const [Ae, ke] = React.useState(false);
  const [ze, Pe] = React.useState('');
  const [Re, We] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const // アカウントの削除。窓の開閉・入れたパスワード・消している最中の段階
    [削除の窓, 削除の窓を開く] = React.useState(false);
  const [削除の合言葉, 削除の合言葉を設定] = React.useState('');
  const [削除の段階, 削除の段階を設定] = React.useState('');
  const [削除の失敗, 削除の失敗を設定] = React.useState('');
  const [selectedKeywords, setSelectedKeywords] = React.useState([]);
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  const [inquiryVisible, setInquiryVisible] = React.useState(false);
  const [inquiryEmail, setInquiryEmail] = React.useState('');
  const [inquiryContent, setInquiryContent] = React.useState('');
  const [inquirySending, setInquirySending] = React.useState(false);
  const [inquiryImages, setInquiryImages] = React.useState([]);
  const titleScrollRef = React.useRef(null);
  const memberScrollRef = React.useRef(null);
  const titleRefCallback = React.useCallback((e) => {
    if (IS_WEB) {
      if (titleScrollRef.current && titleScrollRef.current._wheelHandler) {
        const t = titleScrollRef.current.getScrollableNode
          ? titleScrollRef.current.getScrollableNode()
          : titleScrollRef.current;
        if (t) t.removeEventListener('wheel', titleScrollRef.current._wheelHandler);
      }
      titleScrollRef.current = e;
      const t = e && e.getScrollableNode ? e.getScrollableNode() : e;
      if (t) {
        const e = (e) => {
          t.scrollLeft += e.deltaY;
          e.preventDefault();
        };
        t.addEventListener('wheel', e, { passive: false });
        titleScrollRef.current._wheelHandler = e;
      }
    } else titleScrollRef.current = e;
  }, []);
  const memberRefCallback = React.useCallback((e) => {
    if (IS_WEB) {
      if (memberScrollRef.current && memberScrollRef.current._wheelHandler) {
        const t = memberScrollRef.current.getScrollableNode
          ? memberScrollRef.current.getScrollableNode()
          : memberScrollRef.current;
        if (t) t.removeEventListener('wheel', memberScrollRef.current._wheelHandler);
      }
      memberScrollRef.current = e;
      const t = e && e.getScrollableNode ? e.getScrollableNode() : e;
      if (t) {
        const e = (e) => {
          t.scrollLeft += e.deltaY;
          e.preventDefault();
        };
        t.addEventListener('wheel', e, { passive: false });
        memberScrollRef.current._wheelHandler = e;
      }
    } else memberScrollRef.current = e;
  }, []);
  const Le = new Date();
  const $e = Le.getMonth() + 1 >= 4 ? Le.getFullYear() : Le.getFullYear() - 1;
  const [Ve, Me] = React.useState($e);
  const He = (e) => {
    Me((t) => t + e);
  };
  const titleSuggestions = React.useMemo(() => {
    try {
      const src =
        'member' === activeRole && myMemberId
          ? sList.filter(
              (s) =>
                s &&
                s.archers &&
                s.archers.some(
                  (a) =>
                    a &&
                    (a.memberId === myMemberId ||
                      (myMemberName &&
                        !a.memberId &&
                        a.name &&
                        a.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName))
                )
            )
          : sList;
      if (!src) return [];
      const titles = src.map((s) => s.title).filter((t) => t && t.trim() !== '');
      return Array.from(new Set(titles)).slice(0, 10);
    } catch (e) {
      return [];
    }
  }, [sList, activeRole, myMemberId, myMemberName]);
  const memberSuggestions = React.useMemo(() => {
    try {
      if ('member' === activeRole) return myMemberName ? [myMemberName] : [];
      const sortMembers = (e, t) => {
        const l = e.grade === undefined || e.grade === null ? 99 : Number(e.grade);
        const o = t.grade === undefined || t.grade === null ? 99 : Number(t.grade);
        const n = 0 === l ? 99 : l;
        const a = 0 === o ? 99 : o;
        if (n !== a) return n - a;
        const s = (e) => {
          const t = (e || '').trim();
          return '男子' === t ? 0 : '女子' === t ? 1 : 2;
        };
        return s(e.gender) - s(t.gender) || (e.name || '').localeCompare(t.name || '', 'ja');
      };
      const list = [...members, ...alumni]
        .sort(sortMembers)
        .map((m) => m.name)
        .filter((n) => n && n.trim() !== '');
      return Array.from(new Set(list));
    } catch (e) {
      return [];
    }
  }, [members, alumni, activeRole, myMemberName]);
  const Oe = React.useMemo(() => {
    const t = new Set();
    const src =
      'member' === activeRole && myMemberId
        ? sList.filter(
            (s) =>
              s &&
              s.archers &&
              s.archers.some(
                (a) =>
                  a &&
                  (a.memberId === myMemberId ||
                    (myMemberName &&
                      !a.memberId &&
                      a.name &&
                      a.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName))
              )
          )
        : sList;
    return (
      src.forEach((e) => {
        if (e.tags && Array.isArray(e.tags)) e.tags.forEach((e) => t.add(e));
      }),
      Array.from(t).sort((e, t) => e.localeCompare(t))
    );
  }, [sList, activeRole, myMemberId, myMemberName]);
  const Ne = (e) => {
    Ie((t) => (t.includes(e) ? t.filter((t) => t !== e) : [...t, e]));
  };
  const Ge = async (e) => {
    try {
      const { sessions, members: o } = useScoreStore.getState();
      const n = 'member' === activeRole ? myMemberId : null;
      const rSessions = n
        ? sessions.filter(
            (e) =>
              e &&
              e.archers &&
              e.archers.some(
                (t) =>
                  t &&
                  (t.memberId === n ||
                    (myMemberName &&
                      !t.memberId &&
                      t.name &&
                      t.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName))
              )
          )
        : sessions;
      const a = rSessions.filter((t) => {
        if ('all' === e) return true;
        const l = new Date(t.date);
        if ('fiscal' === e) {
          const e = l.getFullYear();
          return (l.getMonth() + 1 >= 4 ? e : e - 1) === Ve;
        }
        if ('custom' === e) {
          const e = new Date(de);
          e.setHours(0, 0, 0, 0);
          const o = new Date(ue);
          if ((o.setHours(23, 59, 59, 999), l < e || l > o)) return false;
          if (Be.length > 0) {
            const e = t.tags || [];
            if ('AND' === Te) {
              if (!Be.every((t) => e.includes(t))) return false;
            } else if (!Be.some((t) => e.includes(t))) return false;
          }
          if (selectedKeywords.length > 0) {
            const e = t.title?.toLowerCase() || '';
            const l = t.note?.toLowerCase() || '';
            const o = new Date(t.date);
            const n = `${o.getFullYear()}/${String(o.getMonth() + 1).padStart(2, '0')}/${String(o.getDate()).padStart(2, '0')}`;
            const a = selectedKeywords.some((t) => {
              const a = t.toLowerCase();
              return e.includes(a) || l.includes(a) || n.includes(a);
            });
            if (!a) return false;
          }
          if (xe) {
            const e = xe.toLowerCase();
            const l = t.title?.toLowerCase().includes(e);
            const o = t.note?.toLowerCase().includes(e);
            const n = new Date(t.date);
            const a =
              `${n.getFullYear()}/${String(n.getMonth() + 1).padStart(2, '0')}/${String(n.getDate()).padStart(2, '0')}`.includes(
                e
              );
            if (!(l || o || a)) return false;
          }
          return true;
        }
        return true;
      });
      if (0 === a.length) {
        const e = '対象期間のデータがありません';
        return void Alert.alert('通知', e);
      }
      // 「集計に含めない」にした記録は、本表から外して別のシートに回す。
      // 混ぜると分析画面の数字と食い違う（画面はこれを外して数えている）
      const 集計しない記録 = a.filter((t) => !集.集計に入れるか(t));
      const 集計する記録 = a.filter((t) => 集.集計に入れるか(t));
      const s = (e) => (e || '').replace(/\s*\(\d+\)$/, '').trim();
      let d = '';
      let xlsxHeaders = [];
      let xlsxRows = [];
      if ('matrix' !== ye) {
        const mList = o;
        const aList = alumni;
        xlsxHeaders = [
          '日付',
          'タイトル',
          '射手名',
          '学年',
          '性別',
          '期',
          '的中数',
          '総矢数',
          '的中率',
          'タグ',
          'メモ',
          '集計対象',
        ];
        集計する記録.forEach((t) => {
          if (!t || !t.archers || !Array.isArray(t.archers)) return;
          const dateStr = csvDate(t.date);
          t.archers.forEach((l) => {
            if (!l || l.isSeparator || l.isTotalCalculator) return;
            // 途中交代があると1つの列に2人ぶんが入る。区間に分けて人ごとの行にする。
            // 分けないと、交代後の射も交代前の人の行に入ってしまう
            const 区間たち = 集.射手を区間に分ける(l);
            // ○×が1つも入っていない列も、誰が立っていたかは残す
            const 書く区間 = 区間たち.length
              ? 区間たち
              : [{ 部員id: l.memberId, 名前: l.name || '', 的中: 0, 射数: 0 }];
            const tagsV = (t.tags || []).join(' ');
            const noteV = t.note || '';
            const // TRUE / FALSE では何の真偽か伝わらない。日本語で書く
              statV = 集.集計に入れるか(t) ? '対象' : '対象外';
            書く区間.forEach((区間) => {
              // 絞り込みは列ではなく人ごとに見る。列で見ると、交代で入った人が
              // 自分の書き出しから丸ごと落ちる（列の持ち主は別人のため）
              if (n) {
                const 自分か =
                  String(区間.部員id || '') === String(n) ||
                  (myMemberName &&
                    !区間.部員id &&
                    区間.名前 &&
                    区間.名前.replace(/\s*\(\d+\)$/, '').trim() === myMemberName);
                if (!自分か) return;
              } else if ('custom' === e) {
                if (selectedMembers.length > 0) {
                  if (!selectedMembers.includes(s(区間.名前))) return;
                } else if (!(
                  'all' === me ||
                  (区間.名前 && 区間.名前.toLowerCase().includes(me.toLowerCase()))
                ))
                  return;
              }
              // 分母は実際に引いた数。記録の射数（割り当て）だと、
              // 途中で帰った人の的中率が低く出る（分析画面は実射数で数えている）
              const hits = 区間.的中;
              const shots = 区間.射数;
              const rateNum = shots > 0 ? Number(((hits / shots) * 100).toFixed(1)) : 0;
              const // 交代で入った人の学年や性別は、その人の名簿から引く
                mi = findMemberInfo({ memberId: 区間.部員id, name: 区間.名前 }, mList, aList, s);
              const // 名簿に無いときは射手側の値を使うが、それが使えるのは
                // 列の持ち主のときだけ。交代で入った人に列の持ち主の学年を
                // 当てると別人の情報になる
                列の持ち主か = 区間.名前 === (l.name || '');
              const gradeV =
                mi && null != mi.grade ? mi.grade : 列の持ち主か && null != l.grade ? l.grade : '';
              const genderV = mi && mi.gender ? mi.gender : 列の持ち主か ? l.gender || '' : '';
              const termV = mi && null != mi.termKi ? mi.termKi : '';
              xlsxRows.push([
                dateStr,
                t.title || '',
                s(区間.名前 || l.name),
                gradeV,
                genderV,
                termV,
                hits,
                shots,
                rateNum,
                tagsV,
                noteV,
                statV,
              ]);
            });
          });
        });
      } else {
        const l = new Set();
        a.forEach((e) => {
          const t = new Date(e.date);
          l.add(
            `${t.getFullYear()}/${(t.getMonth() + 1).toString().padStart(2, '0')}/${t.getDate().toString().padStart(2, '0')}`
          );
        });
        const c = Array.from(l).sort();
        const u = new Map();
        a.forEach((t) => {
          t.archers.forEach((t) => {
            if (!t || t.isSeparator || t.isTotalCalculator) return;
            if (n) {
              if (
                t.memberId !== n &&
                !(
                  myMemberName &&
                  !t.memberId &&
                  t.name &&
                  t.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName
                )
              )
                return;
            } else if ('custom' === e) {
              if (selectedMembers.length > 0) {
                if (!selectedMembers.includes(s(t.name || '不明'))) return;
              } else if (!('all' === me || (t.name && t.name.toLowerCase().includes(me.toLowerCase()))))
                return;
            }
            const l = s(t.name || '不明');
            const o = t.memberId || l || 'unknown';
            if (!u.has(o)) u.set(o, { id: t.memberId || '', name: l });
          });
        });
        const f = [...o, ...alumni];
        u.forEach((e, t) => {
          const l = f.find((t) => t.id === e.id || t.name === e.name);
          l && ((e.grade = l.grade), (e.name = l.name));
        });
        const m = Array.from(u.values()).sort((e, t) =>
          e.grade !== t.grade ? (e.grade || 9) - (t.grade || 9) : e.name.localeCompare(t.name, 'ja-JP')
        );
        const h = c.map((e) => {
          const t = e.split('/');
          return `${parseInt(t[1])}月${parseInt(t[2])}日`;
        });
        xlsxHeaders = ['氏名', '学年', '的中率', '的中数', '総矢数'].concat(h);
        m.forEach((e) => {
          let t = 0;
          let l = 0;
          const o = [];
          c.forEach((n) => {
            let s = 0;
            let d2 = 0;
            let c2 = false;
            集計する記録.forEach((t) => {
              const l = new Date(t.date);
              if (
                `${l.getFullYear()}/${(l.getMonth() + 1).toString().padStart(2, '0')}/${l.getDate().toString().padStart(2, '0')}` ===
                n
              )
                t.archers.forEach((l) => {
                  if (!l || l.isSeparator || l.isTotalCalculator) return;
                  // 分析画面と同じ数え方をする。部員IDだけで判定し、途中交代を
                  // 踏まえ、分母は実際に引いた数にする。以前は氏名でも拾い、
                  // 交代を見ず、割り当ての射数を分母にしていたため画面と食い違っていた
                  集.射手を区間に分ける(l).forEach((区間) => {
                    if (!e.id || String(区間.部員id) !== String(e.id)) return;
                    c2 = true;
                    s += 区間.的中;
                    d2 += 区間.射数;
                  });
                });
            });
            c2 ? (o.push(`${s}/${d2}`), (t += s), (l += d2)) : o.push('');
          });
          const n2 = l > 0 ? Number(((t / l) * 100).toFixed(1)) : 0;
          xlsxRows.push([e.name, null != e.grade ? e.grade : '', n2, t, l].concat(o));
        });
      }
      const stamp = csvDate(Date.now());
      const rangeLabel = 'fiscal' === e ? `${Ve}nendo` : 'custom' === e ? 'filtered' : 'all';
      const fname = `kyudo_records_${rangeLabel}_${stamp}.xlsx`;
      if (!IS_WEB) {
        Alert.alert('未対応', '書き出しはWeb版のみ対応しています。');
        return;
      }
      if (0 === xlsxRows.length) {
        const msg = '対象のデータがありません';
        Alert.alert('書き出し', msg);
        return;
      }
      const 幅 =
        'matrix' === ye
          ? [16, 7, 9, 9, 9].concat(xlsxHeaders.slice(5).map(() => 9))
          : [12, 22, 14, 6, 8, 6, 9, 9, 10, 18, 26, 10];
      // 的中率の列は「38.9%」と見せる。中身は 38.9 のままなので、
      // 表計算の式や並べ替えはこれまでどおり使える
      const 見た目 = 'matrix' === ye ? ['', '', '率'] : ['', '', '', '', '', '', '', '', '率'];
      const シートたち = [
        {
          name: 'matrix' === ye ? '集計' : '記録',
          headers: xlsxHeaders,
          rows: xlsxRows,
          widths: 幅,
          formats: 見た目,
        },
      ];
      // 「集計に含めない」にした記録は、本表から外したぶんを別のシートに残す。
      // 消してしまうと、何が外れたのかを確かめる手立てが無くなる
      if (集計しない記録.length > 0) {
        const 除外の見出し = ['日付', '題', '氏名', '的中数', '射数', '的中率', 'タグ', 'メモ'];
        const 除外の行 = [];
        集計しない記録.forEach((t) => {
          if (!t || !Array.isArray(t.archers)) return;
          const dateStr = csvDate(t.date);
          t.archers.forEach((l) => {
            if (!l || l.isSeparator || l.isTotalCalculator) return;
            集.射手を区間に分ける(l).forEach((区間) => {
              除外の行.push([
                dateStr,
                t.title || '',
                s(区間.名前 || l.name),
                区間.的中,
                区間.射数,
                区間.射数 > 0 ? Number(((区間.的中 / 区間.射数) * 100).toFixed(1)) : 0,
                (t.tags || []).join(' '),
                t.note || '',
              ]);
            });
          });
        });
        シートたち.push({
          name: '集計に含めない記録',
          headers: 除外の見出し,
          rows: 除外の行,
          widths: [12, 22, 14, 9, 9, 10, 18, 26],
          formats: ['', '', '', '', '', '率'],
        });
      }
      await _xlsx.exportXlsxSheets(シートたち, fname);
    } catch (e) {
      console.error('Export Error:', e);
      const t = 'ファイルの生成に失敗しました。';
      Alert.alert('エラー', t);
    }
  };
  const pickInquiryImage = async () => {
    try {
      if (inquiryImages.length >= 3) {
        const msg = '画像は最大3枚まで添付できます。';
        return void Alert.alert('エラー', msg);
      }
      const perm = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        const msg = '画像ライブラリへのアクセスが許可されていません。';
        return void Alert.alert('エラー', msg);
      }
      const res = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions ? ExpoImagePicker.MediaTypeOptions.Images : ['images'],
        quality: 0.8,
      });
      if (res.canceled || !res.assets || !res.assets.length) return;
      const asset = res.assets[0];
      let quality = 0.5;
      let width = 1000;
      let base64 = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const manipulated = await _IM.manipulateAsync(asset.uri, [{ resize: { width } }], {
          compress: quality,
          format: _IM.SaveFormat.JPEG,
          base64: true,
        });
        base64 = manipulated.base64;
        if (!base64 || base64.length <= 300000) break;
        width = Math.round(width * 0.75);
        quality = Math.max(0.3, quality - 0.1);
      }
      if (!base64) {
        const msg = '画像の読み込みに失敗しました。';
        return void Alert.alert('エラー', msg);
      }
      if (base64.length > 300000) {
        const msg = '画像サイズが大きすぎます。別の画像（より小さいサイズ・低解像度）を選んでください。';
        return void Alert.alert('エラー', msg);
      }
      setInquiryImages((prev) => [...prev, `data:image/jpeg;base64,${base64}`]);
    } catch (e) {
      console.error('[Settings] Inquiry image pick error:', e);
    }
  };
  const Ye = (e, t) => (
    <View style={D.section}>
      <Text style={D.sectionTitle}>{e}</Text>
      <View style={D.sectionContainer}>{t}</View>
    </View>
  );
  const Je = (e, t, l, a = '#007AFF', s, d = false) => (
    <Pressable // 使い方の案内が指す先。行の名前をそのまま目印にする
      ref={(node) => 案内.setTutorialTargetNode(`設定.${t}`, node)}
      style={({ hovered }) => [D.item, hovered && D.hovered, IS_WEB && !!l && { cursor: 'pointer' }]}
      onPress={l}
      disabled={!l}
    >
      <View style={D.itemLeft}>
        <Icons.Ionicons name={e} size={22} color={a} style={D.itemIcon} />
        <Text style={[D.itemText, d && { color: '#FF3B30' }]}>{t}</Text>
      </View>
      <View style={D.itemRight}>
        {s || <Icons.Ionicons name="chevron-forward" size={18} color="#C6C6C8" />}
      </View>
    </Pressable>
  );
  return (
    <ReactNativeSafeAreaContext.SafeAreaView style={D.safeArea} edges={['left', 'right']}>
      <CustomCalendarModal
        visible={je}
        onClose={() => Fe(false)}
        selectedDate={'start' === Ce ? de : ue}
        onSelectDate={(e) => {
          if ('start' === Ce) ce(e);
          else fe(e);
          Fe(false);
        }}
        title={'start' === Ce ? '開始日を選択' : '終了日を選択'}
      />
      <ScrollView style={D.container}>
        <Text style={D.headerTitle}>設定</Text>
        {Ye(
          'アカウント',
          <>
            <View style={[D.item, D.itemStack]}>
              <View style={D.itemLeft}>
                <Icons.Ionicons name="business-outline" size={22} color="#007AFF" style={D.itemIcon} />
                <Text style={D.itemText}>団体ID / 団体名</Text>
              </View>
              <Text style={[D.timestamp, D.timestampStack]}>
                {activeGroupId || '---'}
                {' / '}
                {activeGroupName || '未設定'}
              </Text>
            </View>
            <View style={D.item}>
              <View style={D.itemLeft}>
                <Icons.Ionicons name="person-outline" size={22} color="#5856D6" style={D.itemIcon} />
                <Text style={D.itemText}>ログイン種別</Text>
              </View>
              <Text style={D.timestamp}>
                {'group' === activeRole
                  ? '団体アカウント'
                  : `メンバー (${(() => {
                      const e = members.find((e) => e.id === myMemberId);
                      return e?.personalId
                        ? `ID: ${e.personalId} / ${e.name || myMemberName || ''}`
                        : myMemberName || myMemberId || '---';
                    })()})`}
              </Text>
            </View>
            {/* 初めての人向けの案内。初回は自動で出るが、ここからいつでも見返せる。 */
            /* ライブ中は始めない（案内中の書き換えが全員の画面に流れてしまう） */}
            {Je('school-outline', '使い方を見る', () => {
              if ('ライブ中' === 案内.startTutorial()) {
                const e = 'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。';
                Alert.alert('使い方を見る', e);
              }
            })}
            {Je('help-circle-outline', '運用ガイド・ヘルプ', () => le(true))}
            {Je(
              'log-out-outline',
              'ログアウト',
              () => {
                // ログアウトは手元の記録を全部捨てるので、送れていないものが
                // 何件あるかを先に数えて確認に出す。送信するかどうかは
                // 利用者が押してから
                残った未送信を設定(useScoreStore.getState().countUnsynced());
                ログアウトの段階を設定('確認');
                oe(true);
              },
              '#FF3B30',
              null,
              true
            )}
            {/* 団体アカウントで、管理者モードのときだけ出す。押すと警告の窓へ */}
            {'group' === activeRole &&
              isAdminMode &&
              Je(
                'trash-outline',
                'アカウントを削除する',
                () => {
                  削除の合言葉を設定('');
                  削除の失敗を設定('');
                  削除の段階を設定('');
                  削除の窓を開く(true);
                },
                '#FF3B30',
                null,
                true
              )}
          </>
        )}
        {Ye(
          '表示',
          <View style={[D.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={[D.itemLeft, { marginBottom: 10 }]}>
              <Icons.Ionicons name="contrast-outline" size={22} color="#5856D6" style={{ marginRight: 12 }} />
              <View>
                <Text style={D.itemText}>外観</Text>
                <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                  画面全体の配色を切り替えます
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
              <TouchableOpacity
                style={[D.radioBtn, themeMode === 'light' && D.radioBtnActive]}
                onPress={() => setThemeModeFn('light')}
              >
                <Text style={[D.radioBtnText, themeMode === 'light' && D.radioBtnTextActive]}>ライト</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[D.radioBtn, themeMode === 'dark' && D.radioBtnActive]}
                onPress={() => setThemeModeFn('dark')}
              >
                <Text style={[D.radioBtnText, themeMode === 'dark' && D.radioBtnTextActive]}>ダーク</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[D.radioBtn, themeMode === 'system' && D.radioBtnActive]}
                onPress={() => setThemeModeFn('system')}
              >
                <Text style={[D.radioBtnText, themeMode === 'system' && D.radioBtnTextActive]}>
                  端末に合わせる
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {'member' !== activeRole &&
          Ye(
            '基本設定',
            <>
              {'group' === activeRole && (
                <View style={D.item}>
                  <View style={[D.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons name="business-outline" size={22} color="#007AFF" style={D.itemIcon} />
                    <Text style={D.itemText}>
                      {'団体ID: '}
                      {activeGroupId}
                    </Text>
                  </View>
                </View>
              )}
              {'group' === activeRole && (
                <View style={[D.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={[D.itemLeft, { marginBottom: 8 }]}>
                    <Icons.Ionicons name="pencil-outline" size={22} color="#007AFF" style={D.itemIcon} />
                    <Text style={D.itemText}>団体名</Text>
                  </View>
                  <TextInput
                    style={D.filterInput}
                    placeholder="団体名を入力"
                    value={activeGroupName || ''}
                    onChangeText={updateGroupName}
                  />
                </View>
              )}
              {'group' === activeRole && (
                <View style={D.item}>
                  <View style={[D.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons name="sparkles-outline" size={22} color="#5856D6" style={D.itemIcon} />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={D.itemText}>4月1日の自動進級</Text>
                      <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                        毎年4月1日に自動で学年を更新し、4年生を卒業生へ移動します
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={autoPromotionEnabled}
                    onValueChange={setAutoPromotionEnabled}
                    trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  />
                </View>
              )}
              {'group' === activeRole && (
                <View style={D.item}>
                  <View style={[D.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons name="school-outline" size={22} color="#AF52DE" style={D.itemIcon} />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={D.itemText}>現在の期 (新入生)</Text>
                      <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                        新入生（1年生）が何期生にあたるかを設定します
                      </Text>
                    </View>
                  </View>
                  <View style={D.stepperContainer}>
                    <TextInput
                      style={[D.stepperValue, { width: 40, textAlign: 'center', padding: 0 }]}
                      value={String(currentFreshmanTerm)}
                      onChangeText={(e) => {
                        const t = parseInt(e.replace(/[^0-9]/g, ''));
                        isNaN(t) ? '' === e && updateCurrentFreshmanTerm(0) : updateCurrentFreshmanTerm(t);
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={{ fontSize: 14, color: '#8E8E93', marginRight: 8 }}>期</Text>
                    <View style={D.stepperControls}>
                      <Pressable
                        style={({ hovered: e }) => [D.stepperBtn, e && { backgroundColor: '#D1D1D6' }]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="減らす"
                        aria-label="減らす"
                        onPress={() => updateCurrentFreshmanTerm(Math.max(1, currentFreshmanTerm - 1))}
                      >
                        <Icons.Ionicons name="remove" size={20} color="#007AFF" />
                      </Pressable>
                      <View style={D.stepperDivider} />
                      <Pressable
                        style={({ hovered: e }) => [D.stepperBtn, e && { backgroundColor: '#D1D1D6' }]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="増やす"
                        aria-label="増やす"
                        onPress={() => updateCurrentFreshmanTerm(currentFreshmanTerm + 1)}
                      >
                        <Icons.Ionicons name="add" size={20} color="#007AFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
              {'group' === activeRole && (
                <View style={[D.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View style={D.itemLeft}>
                      <Icons.Ionicons name="pricetags-outline" size={22} color="#FF9500" style={D.itemIcon} />
                      <Text style={D.itemText}>タグの定型文</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {tagTemplates.map((e) => (
                      <View
                        key={`template-${e}`}
                        style={{
                          backgroundColor: '#E5E5EA',
                          borderRadius: 16,
                          paddingLeft: 12,
                          paddingRight: 6,
                          paddingVertical: 4,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: '#000' }}>
                          {/* しまう形は「#合宿」だが、画面では # を付けない */}
                          {規則.タグの見た目(e)}
                        </Text>
                        <Pressable // 絵だけのボタン。どのタグを消すのかまで読ませる
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel={規則.タグの見た目(e) + ' を消す'}
                          aria-label={e + ' を消す'}
                          onPress={() => removeTagTemplate(e)}
                          style={({ hovered: e }) => [e && { opacity: 0.7 }, IS_WEB && { cursor: 'pointer' }]}
                        >
                          <Icons.Ionicons name="close-circle" size={18} color="#8E8E93" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[D.filterInput, { flex: 1, paddingVertical: 8 }]}
                      placeholder="新しいタグを追加"
                      value={Se}
                      onChangeText={Ee}
                      onSubmitEditing={() => {
                        Se.trim() &&
                          (addTagTemplate(Se.trim().startsWith('#') ? Se.trim() : `#${Se.trim()}`), Ee(''));
                      }}
                    />
                    <Pressable
                      style={({ hovered: e }) => [
                        {
                          backgroundColor: '#007AFF',
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          justifyContent: 'center',
                        },
                        e && { backgroundColor: '#0062CC' },
                        IS_WEB && { cursor: 'pointer' },
                      ]}
                      onPress={() => {
                        Se.trim() &&
                          (addTagTemplate(Se.trim().startsWith('#') ? Se.trim() : `#${Se.trim()}`), Ee(''));
                      }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>追加</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        {Ye(
          '入力の保護',
          <View ref={(node) => 案内.setTutorialTargetNode('設定.自動ロック', node)} style={D.item}>
            <View style={[D.itemLeft, { flex: 1 }]}>
              <Icons.Ionicons name="lock-closed-outline" size={22} color="#34C759" style={D.itemIcon} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={D.itemText}>入れたマスを自動でロック</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                  入れて3秒たつと押しても変わらなくなります。直すときは長押しで、そのマスだけ開きます。1立が全部埋まったときは、間隔・計の鍵も自動でかかります
                </Text>
              </View>
            </View>
            <Switch
              value={自動ロックする}
              onValueChange={set自動ロックする}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        )}
        {Ye(
          '保存のしかた',
          <View style={D.item}>
            <View style={[D.itemLeft, { flex: 1 }]}>
              <Icons.Ionicons name="checkbox-outline" size={22} color="#34C759" style={D.itemIcon} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={D.itemText}>保存のときに出欠を確認する</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                  「終了・保存」を押したときに出欠の確認を出します。切ると、そのまま保存の画面へ進みます。記録に出ている人は出欠画面で出席として数えられますが、遅刻・早退の区別は付かなくなります
                </Text>
              </View>
            </View>
            <Switch
              value={保存時に出欠を確認する}
              onValueChange={set保存時に出欠を確認する}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        )}
        {Ye(
          '矢所の記録',
          <>
            <View // 使い方の案内が指す先。この行は Je() を通らない作りなので、
              // ここで直接登録する
              ref={(node) => 案内.setTutorialTargetNode('設定.矢所の記録機能を有効化', node)}
              style={D.item}
            >
              <View style={[D.itemLeft, { flex: 1 }]}>
                <Icons.Ionicons name="location-outline" size={22} color="#34C759" style={D.itemIcon} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={D.itemText}>矢所の記録機能を有効化</Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                    記録時に矢所も記録できるようにします
                  </Text>
                </View>
              </View>
              <Switch
                value={enableArrowLocation}
                onValueChange={setEnableArrowLocation}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            {enableArrowLocation && (
              <View style={[D.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={[D.itemLeft, { marginBottom: 8 }]}>
                  <Icons.Ionicons name="disc-outline" size={22} color="#34C759" style={D.itemIcon} />
                  <Text style={D.itemText}>使用する的の種類</Text>
                </View>
                <View style={D.flexRow}>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('kasumi36')}
                    style={[D.radioBtn, 'kasumi36' === arrowTargetType && D.radioBtnActive]}
                  >
                    <Text style={[D.radioBtnText, 'kasumi36' === arrowTargetType && D.radioBtnTextActive]}>
                      霞的
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('hoshi36')}
                    style={[D.radioBtn, 'hoshi36' === arrowTargetType && D.radioBtnActive]}
                  >
                    <Text style={[D.radioBtnText, 'hoshi36' === arrowTargetType && D.radioBtnTextActive]}>
                      星的
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('hoshi24')}
                    style={[D.radioBtn, 'hoshi24' === arrowTargetType && D.radioBtnActive]}
                  >
                    <Text style={[D.radioBtnText, 'hoshi24' === arrowTargetType && D.radioBtnTextActive]}>
                      星的(八寸)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
        {'member' !== activeRole &&
          Ye(
            '管理者設定',
            <View
              style={D.item} // 使い方の案内から指せるように登録する
              ref={(node) => 案内.setTutorialTargetNode('設定.管理者モード', node)}
            >
              <View style={[D.itemLeft, { flex: 1 }]}>
                <Icons.Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#FF3B30"
                  style={D.itemIcon}
                />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={D.itemText}>管理者モード</Text>
                  <Text
                    style={{ fontSize: 11, color: '#8E8E93', marginTop: 2, flexShrink: 1 }}
                    numberOfLines={0}
                  >
                    オンにすると、保存済みの記録をあとから直せます。各メンバーの個人ID（数字）も表示されます
                  </Text>
                </View>
              </View>
              <Switch
                value={isAdminMode}
                onValueChange={async (e) => {
                  e ? (Pe(''), ke(true)) : setAdminMode(false);
                }}
                trackColor={{ false: '#D1D1D6', true: '#FF3B30' }}
              />
            </View>
          )}
        {Ye(
          'データ管理',
          <>
            {'member' === activeRole && (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#FFF9E6',
                  marginBottom: 8,
                  borderRadius: 8,
                  marginHorizontal: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icons.Ionicons name="information-circle-outline" size={18} color="#FF9500" />
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FF9500', marginLeft: 4 }}>
                    個人用モードの同期について
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#666', lineHeight: 18 }}>
                  同期時、クラウドには自分を含む全員の記録が送信されますが、完了後にこの端末からは自分以外の氏名や的中データが自動的に削除されます。これにより、履歴や分析には自分のデータのみが表示されるようになります。
                </Text>
              </View>
            )}
            {Je(
              'share-outline',
              'データをExcel形式で書き出し',
              async () => {
                ee(true);
              },
              '#34C759'
            )}
            {Je('mail-outline', 'お問い合わせ', () => setInquiryVisible(true), '#FF9500')}
            <Pressable
              style={({ hovered: e }) => [D.item, e && D.hovered, IS_WEB && { cursor: 'pointer' }]}
              onPress={syncAllToCloud}
            >
              <View style={D.itemLeft}>
                <Icons.Ionicons name="cloud-upload-outline" size={22} color="#5856D6" style={D.itemIcon} />
                <Text style={D.itemText}>クラウドへ同期</Text>
              </View>
              <View style={D.itemRight}>
                <Text style={D.timestamp}>
                  {lastSyncTime
                    ? new Date(lastSyncTime).toLocaleTimeString('ja-JP')
                    : '同期済み' === syncStatus
                      ? ''
                      : syncStatus}
                </Text>
                <Icons.Ionicons name="chevron-forward" size={18} color="#C6C6C8" />
              </View>
            </Pressable>
          </>
        )}
        <View style={D.footer}>
          <Text style={D.versionText}>Version 2.0.0 (Expo SQLite/Firebase)</Text>
          <Text style={D.statusText}>
            {'● '}
            {isNetworkOnline ? 'Firebase 接続済み' : '未接続'}
            {' | '}
            {lastSyncTime ? `最終同期: ${new Date(lastSyncTime).toLocaleString('ja-JP')}` : syncStatus}
          </Text>
          {/* 多くのアプリと同じく、バージョン表記の足元に小さく置く。 */
          /* 一覧の行にすると設定画面が煩雑になるが、無くすと */
          /* 「読める場所」が登録画面の一度きりになってしまう */}
          <Pressable
            onPress={() => {
              const 法 = require('./legalDocs');
              require('./AppDialog').出す('法的情報', '', [
                { text: '利用規約', onPress: () => 法.開く(法.規約のURL) },
                { text: 'プライバシーポリシー', onPress: () => 法.開く(法.プライバシーのURL) },
                { text: '閉じる', style: 'cancel' },
              ]);
            }}
          >
            <Text style={D.legalText}>利用規約・プライバシーポリシー</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal visible={Z} transparent animationType="fade" onRequestClose={() => ee(false)}>
        <View style={D.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => ee(false)} />
          <View style={D.modalContent}>
            <Text style={D.modalTitle}>Excel形式で書き出し</Text>
            {De ? (
              <ScrollView style={{ width: '100%', maxHeight: 450 }}>
                <View style={D.filterGroup}>
                  <Text style={D.filterLabel}>出力形式</Text>
                  <View style={D.flexRow}>
                    <TouchableOpacity
                      onPress={() => pe('standard')}
                      style={[D.radioBtn, 'standard' === ye && D.radioBtnActive]}
                    >
                      <Text style={[D.radioBtnText, 'standard' === ye && D.radioBtnTextActive]}>
                        標準形式
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pe('matrix')}
                      style={[D.radioBtn, 'matrix' === ye && D.radioBtnActive]}
                    >
                      <Text style={[D.radioBtnText, 'matrix' === ye && D.radioBtnTextActive]}>
                        印刷向け形式
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={D.ratioHintText}>
                    {'standard' === ye
                      ? '1行に1記録を出力します。データ加工に適しています。'
                      : 'メンバーを各行、日付を各列に配置します。掲示や閲覧に適しています。'}
                  </Text>
                </View>
                <View style={D.filterGroup}>
                  <Text style={D.filterLabel}>日付範囲</Text>
                  <View style={D.flexRow}>
                    <TouchableOpacity
                      style={D.dateSelector}
                      onPress={() => {
                        be('start');
                        Fe(true);
                      }}
                    >
                      <Text style={D.dateSelectorText}>{de.toLocaleDateString('ja-JP')}</Text>
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 8 }}>〜</Text>
                    <TouchableOpacity
                      style={D.dateSelector}
                      onPress={() => {
                        be('end');
                        Fe(true);
                      }}
                    >
                      <Text style={D.dateSelectorText}>{ue.toLocaleDateString('ja-JP')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={D.filterGroup}>
                  <Text style={D.filterLabel}>キーワード (タイトル・メモ)</Text>
                  <TextInput
                    style={D.filterInput}
                    placeholder="キーワードで絞り込み"
                    value={xe}
                    onChangeText={ge}
                    placeholderTextColor="#C6C6C8"
                  />
                  {titleSuggestions.length > 0 && (
                    <ScrollView
                      ref={titleRefCallback}
                      horizontal
                      keyboardShouldPersistTaps="always"
                      showsHorizontalScrollIndicator={false}
                      style={[D.suggestionsContainer, IS_WEB && { overflowX: 'auto' }]}
                    >
                      {titleSuggestions.map((e) => {
                        const t = selectedKeywords.includes(e);
                        return (
                          <TouchableOpacity
                            key={`suggest-title-${e}`}
                            onPress={() =>
                              setSelectedKeywords((t) =>
                                t.includes(e) ? t.filter((t) => t !== e) : [...t, e]
                              )
                            }
                            style={[D.suggestionChip, t && { backgroundColor: '#007AFF' }]}
                          >
                            <Text style={[D.suggestionText, t && { color: '#FFF' }]}>{e}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  {selectedKeywords.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSelectedKeywords([])}
                      style={{ marginTop: 4, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 12, color: '#007AFF' }}>選択をクリア</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {'member' !== activeRole && (
                  <View style={D.filterGroup}>
                    <Text style={D.filterLabel}>メンバー名</Text>
                    <TextInput
                      style={D.filterInput}
                      placeholder="未入力ですべて対象"
                      value={'all' === me ? '' : me}
                      onChangeText={(e) => he(e || 'all')}
                      placeholderTextColor="#C6C6C8"
                    />
                    {memberSuggestions.length > 0 && (
                      <ScrollView
                        ref={memberRefCallback}
                        horizontal
                        keyboardShouldPersistTaps="always"
                        showsHorizontalScrollIndicator={false}
                        style={[D.suggestionsContainer, IS_WEB && { overflowX: 'auto' }]}
                      >
                        {memberSuggestions.map((e) => {
                          const t = selectedMembers.includes(e);
                          return (
                            <TouchableOpacity
                              key={`suggest-member-${e}`}
                              onPress={() =>
                                setSelectedMembers((t) =>
                                  t.includes(e) ? t.filter((t) => t !== e) : [...t, e]
                                )
                              }
                              style={[D.suggestionChip, t && { backgroundColor: '#007AFF' }]}
                            >
                              <Text style={[D.suggestionText, t && { color: '#FFF' }]}>{e}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                    {selectedMembers.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSelectedMembers([])}
                        style={{ marginTop: 4, alignSelf: 'flex-start' }}
                      >
                        <Text style={{ fontSize: 12, color: '#007AFF' }}>選択をクリア</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={D.filterGroup}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={D.filterLabel}>タグ絞り込み</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: '#E5E5EA',
                        borderRadius: 8,
                        padding: 2,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => we('AND')}
                        style={[
                          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                          'AND' === Te && { backgroundColor: '#FFF' },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: 'AND' === Te ? '#007AFF' : '#8E8E93',
                          }}
                        >
                          すべて含む
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => we('OR')}
                        style={[
                          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                          'OR' === Te && { backgroundColor: '#FFF' },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: 'OR' === Te ? '#007AFF' : '#8E8E93',
                          }}
                        >
                          いずれか含む
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {Oe.length > 0 ? (
                      Oe.map((e) => {
                        const t = Be.includes(e);
                        return (
                          <TouchableOpacity
                            key={`export-tag-${e}`}
                            onPress={() => Ne(e)}
                            style={[
                              D.tagChip,
                              t && D.tagChipActive,
                              {
                                backgroundColor: t ? '#007AFF' : '#F2F2F7',
                                paddingVertical: 6,
                                marginVertical: 2,
                              },
                            ]}
                          >
                            <Text style={[D.tagChipText, t && { color: '#FFF' }]}>{e.replace(/^#/, '')}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={{ fontSize: 12, color: '#8E8E93' }}>使用されているタグがありません</Text>
                    )}
                  </View>
                  {Be.length > 0 && (
                    <TouchableOpacity onPress={() => Ie([])} style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 12, color: '#007AFF' }}>選択をクリア</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[D.modalButtons, { marginTop: 20 }]}>
                  <Pressable
                    style={({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#007AFF' },
                      e && { backgroundColor: '#0062CC' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => {
                      ee(false);
                      ve(false);
                      Ge('custom');
                    }}
                  >
                    <Text style={[D.modalBtnText, { color: '#FFF' }]}>この条件で書き出す</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#F2F2F7' },
                      e && { backgroundColor: '#E5E5EA' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => ve(false)}
                  >
                    <Text style={[D.modalBtnText, { color: '#007AFF' }]}>戻る</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <>
                <Text style={D.modalMessage}>書き出すデータの範囲を選択してください。</Text>
                <View style={D.modalButtons}>
                  <Pressable
                    style={({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#F2F2F7' },
                      e && { backgroundColor: '#E5E5EA' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => ee(false)}
                  >
                    <Text style={[D.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
                  </Pressable>
                  <View style={D.monthNav}>
                    <TouchableOpacity
                      style={D.monthNavBtn} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="前へ"
                      aria-label="前へ"
                      onPress={() => He(-1)}
                    >
                      <Icons.Ionicons name="chevron-back" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={D.monthNavText}>{Ve}年度のデータ</Text>
                    <TouchableOpacity
                      style={D.monthNavBtn} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="次へ"
                      aria-label="次へ"
                      onPress={() => He(1)}
                    >
                      <Icons.Ionicons name="chevron-forward" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                  <Pressable
                    style={({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#007AFF', marginTop: 8 },
                      e && { backgroundColor: '#0062CC' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => {
                      ee(false);
                      Ge('fiscal');
                    }}
                  >
                    <Text style={[D.modalBtnText, { color: '#FFF' }]}>{Ve}年度を書き出す</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#34C759' },
                      e && { backgroundColor: '#28A745' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => {
                      ee(false);
                      Ge('all');
                    }}
                  >
                    <Text style={[D.modalBtnText, { color: '#FFF' }]}>すべてのデータ</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#5856D6' },
                      e && { backgroundColor: '#4845C6' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => ve(true)}
                  >
                    <Text style={[D.modalBtnText, { color: '#FFF' }]}>詳細な条件で絞り込む...</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={削除の窓}
        transparent
        animationType="fade"
        onRequestClose={() => !削除の段階 && 削除の窓を開く(false)}
      >
        <View style={D.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !削除の段階 && 削除の窓を開く(false)}
          />
          <View style={D.modalContent}>
            <Text style={[D.modalTitle, { color: '#FF3B30' }]}>アカウントを削除する</Text>
            <Text style={[D.modalMessage, { textAlign: 'left' }]}>
              {`団体「${activeGroupName || activeGroupId || ''}」のアカウントを削除します。\n\n` +
                '・記録・部員・卒業生・ゴミ箱・設定がすべて消え、団体IDでログインできなくなります。\n' +
                '・部員も、この団体には入れなくなります。\n' +
                '・削除後30日間は復旧のために運営者が保管し、その後に消去します。この画面から戻すことはできません。\n' +
                '・必要な記録は、先に「データ管理」から書き出してください。\n\n' +
                '続けるには団体パスワードを入力してください。'}
            </Text>
            <View
              style={[
                D.filterInput,
                {
                  width: '100%',
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                },
              ]}
            >
              <TextInput
                style={{ flex: 1, height: 48, fontSize: 16 }}
                placeholder="団体パスワード"
                secureTextEntry={!showPw}
                value={削除の合言葉}
                onChangeText={削除の合言葉を設定}
                editable={!削除の段階}
              />
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel="パスワードの表示を切り替える"
                aria-label="パスワードの表示を切り替える"
                onPress={() => setShowPw(!showPw)}
                style={{ padding: 4 }}
              >
                <Icons.Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#8E8E93" />
              </Pressable>
            </View>
            {!!削除の失敗 && (
              <Text style={{ color: '#FF3B30', fontSize: 13, marginBottom: 10 }}>{削除の失敗}</Text>
            )}
            {!!削除の段階 && (
              <Text style={{ color: '#8E8E93', fontSize: 13, marginBottom: 10 }}>{`${削除の段階}…`}</Text>
            )}
            <View style={D.modalButtonsRow}>
              <Pressable
                style={({ hovered: e }) => [
                  D.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  e && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={() => 削除の窓を開く(false)}
                disabled={!!削除の段階}
              >
                <Text style={[D.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered: e }) => [
                  D.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  e && { backgroundColor: '#D70015' },
                  (!!削除の段階 || !削除の合言葉) && { opacity: 0.5 },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={async () => {
                  if (!削除の合言葉 || 削除の段階) return;
                  削除の失敗を設定('');
                  削除の段階を設定('本人確認');
                  const 結果 = await 団体を消す(削除の合言葉, (文) => 削除の段階を設定(文));
                  if (!結果.ok) {
                    削除の段階を設定('');
                    削除の失敗を設定(結果.訳 || '削除に失敗しました');
                    return;
                  }
                  削除の窓を開く(false);
                  削除の段階を設定('');
                  try {
                    await FirebaseAuth.signOut(auth);
                  } catch (e) {
                    // 口座はもう無いので、ここで失敗しても構わない
                  }
                  setAuth(null, null, null, null);
                  Alert.alert('削除しました', '団体アカウントを削除しました。ご利用ありがとうございました。');
                }}
                disabled={!!削除の段階 || !削除の合言葉}
              >
                <Text style={[D.modalBtnText, { color: '#FFF' }]}>{削除の段階 ? '削除中…' : '削除する'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Ae} transparent animationType="fade" onRequestClose={() => ke(false)}>
        <View style={D.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !Re && ke(false)}
          />
          <View style={D.modalContent}>
            <Text style={D.modalTitle}>管理者認証</Text>
            <Text style={D.modalMessage}>団体パスワードを入力してください</Text>
            <View
              style={[
                D.filterInput,
                {
                  width: '100%',
                  marginBottom: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                },
              ]}
            >
              <TextInput
                style={{ flex: 1, height: 48, fontSize: 16 }}
                placeholder="パスワード"
                secureTextEntry={!showPw}
                value={ze}
                onChangeText={Pe}
                autoFocus
              />
              <Pressable // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                accessible
                accessibilityRole="button"
                accessibilityLabel="パスワードの表示を切り替える"
                aria-label="パスワードの表示を切り替える"
                onPress={() => setShowPw(!showPw)}
                style={{ padding: 4 }}
              >
                <Icons.Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#8E8E93" />
              </Pressable>
            </View>
            <View style={D.modalButtonsRow}>
              <Pressable
                style={({ hovered: e }) => [
                  D.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  e && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={() => ke(false)}
                disabled={Re}
              >
                <Text style={[D.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered: e }) => [
                  D.modalBtn,
                  { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                  e && { backgroundColor: '#0062CC' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={async () => {
                  if (ze) {
                    We(true);
                    try {
                      (await verifyGroupPassword(ze))
                        ? (setAdminMode(true), ke(false), Pe(''))
                        : Alert.alert('エラー', 'パスワードが正しくありません。');
                    } catch (e) {
                      Alert.alert('エラー', '認証に失敗しました。');
                    } finally {
                      We(false);
                    }
                  }
                }}
                disabled={Re || !ze}
              >
                <Text style={[D.modalBtnText, { color: '#FFF' }]}>{Re ? '認証中...' : '認証'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={re} transparent animationType="fade" onRequestClose={() => oe(false)}>
        <View style={D.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => oe(false)} />
          <View style={D.modalContent}>
            <Text style={D.modalTitle}>ログアウト</Text>
            <Text style={D.modalMessage}>{ログアウトの文言(ログアウトの段階, 残った未送信)}</Text>
            <View style={D.modalButtonsRow}>
              <Pressable
                style={({ hovered: e }) => [
                  D.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  e && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                  ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                ]}
                disabled={ログアウトのボタンを止める(ログアウトの段階)}
                onPress={() => oe(false)}
              >
                <Text style={[D.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered: e }) => [
                  D.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  e && { backgroundColor: '#D63027' },
                  IS_WEB && { cursor: 'pointer' },
                  ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                ]}
                disabled={ログアウトのボタンを止める(ログアウトの段階)}
                onPress={async () => {
                  // 未送信があるうちは、まず送信を試す。送れなかったときだけ
                  // 「捨てて抜ける」を選べるようにする
                  if (先に送信すべきか(ログアウトの段階, 残った未送信)) {
                    ログアウトの段階を設定('送信中');
                    let 残り = 残った未送信;
                    try {
                      残り = await useScoreStore.getState().flushUnsyncedForLogout();
                    } catch (e) {
                      残り = useScoreStore.getState().countUnsynced();
                    }
                    残った未送信を設定(残り);
                    if (残り > 0) return void ログアウトの段階を設定('失敗');
                    ログアウトの段階を設定('送信済み');
                    await new Promise((e) => setTimeout(e, 900));
                  }
                  oe(false);
                  try {
                    if ('member' === activeRole && auth.currentUser) {
                      await Firestore.deleteDoc(
                        Firestore.doc(db, 'member_claims', auth.currentUser.uid)
                      ).catch(() => {});
                    }
                    await FirebaseAuth.signOut(auth);
                    setAuth(null, null, null, null);
                  } catch (e) {
                    console.error('Logout error:', e);
                  }
                }}
              >
                <Text style={[D.modalBtnText, { color: '#FFF' }]}>
                  {ログアウトのボタン名(ログアウトの段階, 残った未送信)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={te} transparent animationType="fade" onRequestClose={() => le(false)}>
        <View style={D.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => le(false)} />
          <View style={D.modalContent}>
            <Text style={D.modalTitle}>運用ガイド</Text>
            <View
              style={{
                width: '100%',
                marginBottom: 20,
                backgroundColor: '#FFF9E6',
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#FFE066',
                marginTop: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icons.Ionicons name="alert-circle" size={18} color="#FF9500" />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FF9500', marginLeft: 6 }}>
                  セキュリティとログイン
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: 20 }}>
                ・「団体ID」はメンバーログインに必要です。メンバー全員に共有してください。{'\n'}
                ・「パスワード」は管理者のみが知るものとして厳重に保管してください。{'\n'}
                ・メールアドレス変更の際は、セキュリティ保護のため旧アドレス宛に確認メールが自動送信されます。
              </Text>
            </View>
            <Pressable
              style={({ hovered: e }) => [
                D.modalBtn,
                { backgroundColor: '#F2F2F7', width: '100%' },
                e && { backgroundColor: '#E5E5EA' },
                IS_WEB && { cursor: 'pointer' },
              ]}
              onPress={() => le(false)}
            >
              <Text style={[D.modalBtnText, { color: '#007AFF' }]}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={je}
        onClose={() => Fe(false)}
        selectedDate={'start' === Ce ? de : ue}
        onSelectDate={(e) => {
          if ('start' === Ce) ce(e);
          else fe(e);
        }}
        title={'start' === Ce ? '開始日を選択' : '終了日を選択'}
      />
      <Modal
        visible={inquiryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !inquirySending && setInquiryVisible(false)}
      >
        {/* スマホで本文の欄を押すとキーボードが出て、下の「送信」 */
        /* 「キャンセル」が隠れる。窓ごと持ち上げ、中身は流せるようにする。 */
        /* keyboardShouldPersistTaps を handled にしないと、キーボードが */
        /* 出ているあいだ、釦を押しても1回目は閉じるだけで終わる */}
        <_RN.KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={D.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => !inquirySending && setInquiryVisible(false)}
            />
            <_RN.ScrollView // 巻物にするので高さの上限が要る。無いと中身のぶんだけ
              // 伸びて、キーボードに押し上げても釦が画面の外へ出る
              style={[D.modalContent, { maxHeight: '80%', flexGrow: 0 }]}
              contentContainerStyle={{ alignItems: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={D.modalTitle}>お問い合わせ</Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 12, textAlign: 'center' }}>
                開発者へお問い合わせを送信します
              </Text>
              <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 10, lineHeight: 17 }}>
                メールアドレスは書かなくても送れます。書いていただくと、こちらから返事ができます。
              </Text>
              <TextInput
                style={[D.filterInput, { width: '100%', marginBottom: 10 }]}
                placeholder="メールアドレス（任意）"
                value={inquiryEmail}
                onChangeText={(e) => setInquiryEmail(e)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!inquirySending}
              />
              <TextInput
                style={[
                  D.filterInput,
                  { width: '100%', marginBottom: 15, height: 120, textAlignVertical: 'top' },
                ]}
                placeholder="お問い合わせ内容"
                value={inquiryContent}
                onChangeText={(e) => setInquiryContent(e)}
                multiline
                editable={!inquirySending}
              />
              {inquiryImages.length > 0 ? (
                <_RN.ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ width: '100%', marginBottom: 10 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {inquiryImages.map((uri, idx) => (
                    <_RN.View
                      key={`inquiry-img-${idx}`}
                      style={{ width: 100, height: 100, position: 'relative' }}
                    >
                      <_RN.Image
                        source={{ uri }}
                        style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: '#F2F2F7' }}
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => setInquiryImages((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={inquirySending}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderRadius: 10,
                          padding: 3,
                        }}
                      >
                        <Icons.Ionicons name="close" size={14} color="#FFF" />
                      </Pressable>
                    </_RN.View>
                  ))}
                </_RN.ScrollView>
              ) : null}
              {inquiryImages.length < 3 ? (
                <Pressable
                  onPress={pickInquiryImage}
                  disabled={inquirySending}
                  style={({ hovered: e }) => [
                    {
                      width: '100%',
                      marginBottom: 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderWidth: 1,
                      borderColor: '#C6C6C8',
                      borderStyle: 'dashed',
                      borderRadius: 8,
                      paddingVertical: 12,
                    },
                    e && { backgroundColor: '#F2F2F7' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                >
                  <Icons.Ionicons name="image-outline" size={18} color="#8E8E93" />
                  <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                    {inquiryImages.length > 0 ? '画像を追加（任意・最大3枚）' : '画像を添付（任意・最大3枚）'}
                  </Text>
                </Pressable>
              ) : null}
              <View style={D.modalButtonsRow}>
                <Pressable
                  style={({ hovered: e }) => [
                    D.modalBtn,
                    { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                    e && { backgroundColor: '#E5E5EA' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                  onPress={() => {
                    setInquiryVisible(false);
                    setInquiryEmail('');
                    setInquiryContent('');
                    setInquiryImages([]);
                  }}
                  disabled={inquirySending}
                >
                  <Text style={[D.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
                </Pressable>
                <Pressable
                  style={({ hovered: e }) => [
                    D.modalBtn,
                    { backgroundColor: '#FF9500', flex: 1, marginLeft: 5 },
                    e && { backgroundColor: '#E68A00' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                  onPress={async () => {
                    const emailVal = inquiryEmail;
                    const contentVal = inquiryContent;
                    // メールアドレスは任意。書いていないことより、
                    // 困っていることが伝わらないままになるほうが困る
                    if (emailVal.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim())) {
                      const msg = 'メールアドレスの形が正しくありません。空のままでも送れます';
                      Alert.alert('エラー', msg);
                      return;
                    }
                    if (!contentVal.trim()) {
                      const msg = 'お問い合わせ内容を入力してください';
                      Alert.alert('エラー', msg);
                      return;
                    }
                    setInquirySending(true);
                    try {
                      await Firestore.addDoc(Firestore.collection(db, 'inquiries'), {
                        email: emailVal.trim(),
                        content: contentVal,
                        imagesBase64: inquiryImages || [],
                        createdAt: new Date(),
                        groupId: activeGroupId || '',
                        groupName: activeGroupName || '',
                        role: activeRole || '',
                        memberId: activeRole === 'member' ? myMemberId || '' : '',
                        memberName: activeRole === 'member' ? myMemberName || '' : '',
                      });
                      const msg = 'お問い合わせを送信しました';
                      Alert.alert('完了', msg);
                      setInquiryVisible(false);
                      setInquiryEmail('');
                      setInquiryContent('');
                      setInquiryImages([]);
                    } catch (err) {
                      console.error('Inquiry send error:', err);
                      const msg = '送信に失敗しました。再度お試しください。';
                      Alert.alert('エラー', msg);
                    } finally {
                      setInquirySending(false);
                    }
                  }}
                  disabled={inquirySending}
                >
                  <Text style={[D.modalBtnText, { color: '#FFF' }]}>
                    {inquirySending ? '送信中...' : '送信'}
                  </Text>
                </Pressable>
              </View>
            </_RN.ScrollView>
          </View>
        </_RN.KeyboardAvoidingView>
      </Modal>
    </ReactNativeSafeAreaContext.SafeAreaView>
  );
};
const D = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: IS_WEB ? WEB_TOP_PADDING : SAFE_TOP_PADDING },
  container: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  section: { marginTop: 20, marginBottom: 10 },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginLeft: 32,
    marginBottom: 6,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#FFF',
  },
  hovered: { backgroundColor: '#F2F2F7' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 24, marginRight: 12 },
  itemText: { fontSize: 17, color: '#000' },
  iconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  timestamp: { fontSize: 12, color: '#8E8E93' },
  // 団体ID/団体名は値が長く、狭い画面ではラベルと同じ行に収まらない。
  // 値をラベルの下へ回し、折り返しても見出しと衝突しないようにする
  itemStack: { flexDirection: 'column', alignItems: 'flex-start' },
  timestampStack: { marginTop: 4, marginLeft: 36 },
  footer: { marginTop: 30, marginBottom: 50, alignItems: 'center' },
  versionText: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  statusText: { fontSize: 12, color: '#34C759' },
  // 目立たせないが、探して見つからないと困る。すぐ上の versionText と同じ濃さにする。
  // #C7C7CC だと明るいテーマで地との比が 1.5 しかなく、ほぼ見えなかった
  legalText: { fontSize: 11, color: '#8E8E93', marginTop: 10, textDecorationLine: 'underline' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalButtons: { width: '100%', gap: 10 },
  modalButtonsRow: { flexDirection: 'row', width: '100%', gap: 10 },
  radioBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  radioBtnActive: { backgroundColor: '#007AFF' },
  radioBtnText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold' },
  radioBtnTextActive: { color: '#FFF' },
  ratioHintText: { fontSize: 11, color: '#8E8E93', marginTop: 6, paddingHorizontal: 4 },
  dateSelector: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateSelectorText: { fontSize: 14, color: '#000' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: 'bold' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 4,
  },
  monthNavBtn: { padding: 8 },
  monthNavText: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#000' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    height: 36,
    paddingLeft: 12,
  },
  stepperValue: { fontSize: 16, color: '#000', marginRight: 8 },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    height: 32,
    marginRight: 2,
  },
  stepperBtn: { paddingHorizontal: 12, height: '100%', justifyContent: 'center', alignItems: 'center' },
  stepperDivider: { width: 1, height: 20, backgroundColor: '#C6C6C8' },
  filterGroup: { width: '100%', marginBottom: 16 },
  filterLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4, fontWeight: '600' },
  filterInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  supportButton: Object.assign(
    {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FF2D55',
      marginHorizontal: 16,
      marginVertical: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    getShadowStyle({
      shadowColor: '#FF2D55',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    })
  ),
  supportButtonHovered: { backgroundColor: '#E0284A', transform: [{ scale: 0.99 }] },
  supportButtonContent: { flexDirection: 'row', alignItems: 'center' },
  supportButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  tagChip: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  tagChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  tagChipText: { fontSize: 13, color: '#000' },
  suggestionsContainer: { flexDirection: 'row', marginTop: 8, paddingVertical: 4 },
  suggestionChip: {
    backgroundColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  suggestionText: { fontSize: 12, color: '#333' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.SettingsScreen = SettingsScreen;
