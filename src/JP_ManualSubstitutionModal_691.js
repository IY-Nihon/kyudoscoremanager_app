/**
 * Module ID: 691
 */
'use strict';

const _g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const _a = typeof id !== 'undefined' ? id : 691;
const _m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'ManualSubstitutionModal', {
    enumerable: !0,
    get: function () {
      return x;
    },
  }));
var t = require('./module_37'),
  n = e(require('./default_144')),
  o = e(require('./default_217')),
  a = e(require('./default_45')),
  l = e(require('./default_386')),
  s = e(require('./default_398')),
  u = e(require('./default_382')),
  c = e(require('./default_385')),
  f = e(require('./default_406')),
  g = e(require('./default_289')),
  m = require('./JP_useScoreStore_174'),
  h = require('./AntDesign_600'),
  b = require('./IS_WEB_199'),
  p = require('./module_427');
var { 立の数, 立の頭の射 } = require('./syncRules');
const x = ({ visible: e, archerId: x, onClose: j }) => {
    const {
        members: F,
        shotsPerRound: C,
        setArcherMember: S,
        setArcherGuestName: B,
        setSubstitution: T,
      } = (0, m.useScoreStore)(),
      [z, R] = (0, t.useState)(''),
      // 交代は立の切れ目ですることが多い。射目でも入れられるよう、単位を選べる
      [単位, 単位を置く] = (0, t.useState)('立'),
      [w, I] = (0, t.useState)(''),
      [k, v] = (0, t.useState)(''),
      H = ('' === w.trim() ? [...F] : F.filter((e) => (e.name || '').toLowerCase().includes(w.toLowerCase()))).sort(
        (e, t) => {
          const n = void 0 === e.grade || null === e.grade ? 99 : Number(e.grade),
            o = void 0 === t.grade || null === t.grade ? 99 : Number(t.grade),
            a = 0 === n ? 99 : n,
            l = 0 === o ? 99 : o;
          if (a !== l) return a - l;
          const s = (e) => {
              const t = (e || '').trim();
              return '男子' === t ? 0 : '女子' === t ? 1 : 2;
            },
            u = s(e.gender) - s(t.gender);
          return 0 !== u ? u : (e.name || '').localeCompare(t.name || '', 'ja');
        }
      ),
      立か = '立' === 単位,
      上限 = 立か ? 立の数(C) : C,
      // 入れた番号が何射目にあたるか。立なら、その立の1本目
      何射目 = () => {
        const n = parseInt(z, 10);
        if (isNaN(n) || n < 1 || n > 上限) return null;
        return 立か ? 立の頭の射(n, C) : n - 1;
      },
      A = (e, t) => {
        const n = 何射目();
        null !== n && x && (T(x, n, e, t), P());
      },
      P = () => {
        (R(''), I(''), v(''), 単位を置く('立'), j());
      };
    return e
      ? (0, p.jsx)(l.default, {
          visible: e,
          transparent: !0,
          animationType: 'slide',
          children: (0, p.jsxs)(c.default, {
            behavior: b.IS_IOS ? 'padding' : void 0,
            style: y.overlay,
            children: [
              (0, p.jsx)(f.default, {
                onPress: P,
                children: (0, p.jsx)(n.default, { style: a.default.absoluteFill }),
              }),
              (0, p.jsxs)(n.default, {
                style: y.container,
                children: [
                  (0, p.jsxs)(n.default, {
                    style: y.header,
                    children: [
                      (0, p.jsx)(u.default, {
                        onPress: P,
                        style: y.headerBtn,
                        children: (0, p.jsx)(o.default, { style: y.headerBtnTxt, children: '閉じる' }),
                      }),
                      (0, p.jsx)(o.default, { style: y.headerTitle, children: '途中交代の設定' }),
                      (0, p.jsx)(n.default, { style: y.headerBtn }),
                    ],
                  }),
                  (0, p.jsxs)(n.default, {
                    style: y.content,
                    children: [
                      (0, p.jsx)(o.default, { style: y.sectionTitle, children: '交代するタイミング' }),
                      (0, p.jsx)(n.default, {
                        style: y.単位の列,
                        children: ['立', '射目'].map((名) =>
                          (0, p.jsx)(
                            u.default,
                            {
                              style: [y.単位ボタン, 名 === 単位 && y.単位ボタン選択中],
                              onPress: () => {
                                (単位を置く(名), R(''));
                              },
                              children: (0, p.jsx)(o.default, {
                                style: [y.単位の字, 名 === 単位 && y.単位の字選択中],
                                children: 名,
                              }),
                            },
                            名
                          )
                        ),
                      }),
                      (0, p.jsxs)(n.default, {
                        style: y.inputRow,
                        children: [
                          (0, p.jsx)(o.default, {
                            style: y.label,
                            children: 立か ? '立の番号' : '射目番号',
                          }),
                          (0, p.jsx)(s.default, {
                            style: y.inputShot,
                            // 幅100pxの欄に「番号 (1〜2)」は入り切らず、閉じ括弧が切れていた。
                            // 何の番号かは左の見出しと下の案内で分かるので、ここは短くする
                            placeholder: `1〜${上限}`,
                            keyboardType: 'number-pad',
                            value: z,
                            onChangeText: R,
                            textAlign: 'right',
                          }),
                        ],
                      }),
                      (0, p.jsx)(o.default, {
                        style: y.案内,
                        children:
                          null === 何射目()
                            ? `1〜${上限} で入れてください`
                            : 立か
                              ? `${parseInt(z, 10)}立目（${何射目() + 1}射目）から交代します`
                              : `${何射目() + 1}射目から交代します`,
                      }),
                      (0, p.jsx)(o.default, {
                        style: y.sectionTitle,
                        children: '交代相手（メンバーまたはゲスト）',
                      }),
                      (0, p.jsx)(s.default, {
                        style: y.searchBar,
                        placeholder: '名前で検索...',
                        value: w,
                        onChangeText: I,
                      }),
                      (0, p.jsxs)(n.default, {
                        style: y.guestRow,
                        children: [
                          (0, p.jsx)(h.Ionicons, { name: 'person-add', size: 20, color: '#007AFF' }),
                          (0, p.jsx)(s.default, {
                            style: y.guestInput,
                            placeholder: 'ゲスト名を入力',
                            value: k,
                            onChangeText: v,
                          }),
                          (0, p.jsx)(u.default, {
                            style: [y.confirmBtn, (!k || null === 何射目()) && y.confirmBtnDisabled],
                            onPress: () => {
                              '' !== k.trim() && A(k.trim());
                            },
                            disabled: !k || null === 何射目(),
                            children: (0, p.jsx)(o.default, { style: y.confirmTxt, children: '確定' }),
                          }),
                        ],
                      }),
                      (0, p.jsx)(g.default, {
                        data: H,
                        keyExtractor: (e, index) =>
                          typeof e.id === 'string' ? e.id : `subst-${index}-${e.name}`,
                        style: y.list,
                        keyboardShouldPersistTaps: 'handled',
                        renderItem: ({ item: e }) => {
                          if (!e || !e.name || 'string' != typeof e.name) return null;
                          const t = e.name.trim().split(/[\s\u3000]+/),
                            n = t && t.length > 0 ? t[0] || '' : '不明',
                            a = (t && t.length > 1 && t[1]) || '';
                          return (0, p.jsxs)(u.default, {
                            style: y.memberItem,
                            onPress: () => {
                              A(e.name, e.id);
                            },
                            children: [
                              (0, p.jsxs)(o.default, { style: y.memberName, children: [n, ' ', a] }),
                              (0, p.jsxs)(o.default, {
                                style: y.memberSub,
                                children: [e.gender, '・', e.grade > 0 ? `${e.grade}年` : 'その他'],
                              }),
                            ],
                          });
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        })
      : null;
  },
  y = a.default.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    container: {
      backgroundColor: '#F2F2F7',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      height: '80%',
      paddingBottom: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: '#FFF',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomWidth: a.default.hairlineWidth,
      borderBottomColor: '#C6C6C8',
    },
    headerTitle: { fontSize: 17, fontWeight: 'bold' },
    headerBtn: { width: 60 },
    headerBtnTxt: { fontSize: 17, color: '#007AFF' },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    sectionTitle: {
      fontSize: 13,
      color: '#8E8E93',
      marginBottom: 8,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    inputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      marginBottom: 6,
    },
    単位の列: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    単位ボタン: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#FFF',
      borderWidth: 1.5,
      borderColor: '#D1D1D6',
      alignItems: 'center',
    },
    単位ボタン選択中: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    単位の字: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
    単位の字選択中: { color: '#FFF' },
    案内: { fontSize: 13, color: '#8E8E93', marginLeft: 4, marginBottom: 24 },
    label: { fontSize: 16, color: '#000' },
    inputShot: {
      fontSize: 16,
      color: '#000',
      backgroundColor: '#F2F2F7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      width: 100,
      textAlign: 'right',
    },
    searchBar: {
      backgroundColor: '#FFF',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 12,
    },
    guestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 16,
      gap: 8,
    },
    guestInput: { flex: 1, fontSize: 16, color: '#000', height: 40 },
    confirmBtn: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      minHeight: 38,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    confirmBtnDisabled: { backgroundColor: '#A2C8F2' },
    confirmTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    list: { backgroundColor: '#FFF', borderRadius: 10, flex: 1, marginBottom: 20 },
    memberItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: a.default.hairlineWidth,
      borderBottomColor: '#C6C6C8',
    },
    memberName: { fontSize: 16, color: '#000' },
    memberSub: { fontSize: 12, color: '#8E8E93' },
  });
