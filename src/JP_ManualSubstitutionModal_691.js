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
      [単位, 単位を置く] = (0, t.useState)('立目'),
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
      立か = '立目' === 単位,
      上限 = 立か ? 立の数(C) : C,
      // 交代相手を学年でまとめる。人の選択と同じで、0年（学年なし）は
      // 「その他/ゲスト」として最後に置く
      学年ごと = (() => {
        const 束 = {};
        H.forEach((e) => {
          const g = void 0 === e.grade || null === e.grade ? 0 : Number(e.grade);
          (束[g] || (束[g] = [])).push(e);
        });
        return Object.keys(束)
          .map(Number)
          .sort((a, b) => (0 === a ? 1 : 0 === b ? -1 : a - b))
          .map((g) => ({ 学年: g, 題: 0 === g ? 'その他/ゲスト' : `${g}年生`, 人たち: 束[g] }));
      })(),
      // 選べる番号。1立目、2立目…（射目のときは 1射目、2射目…）
      番号たち = Array.from({ length: 上限 }, (e, t) => t + 1),
      選んだ = parseInt(z, 10),
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
        (R(''), I(''), v(''), 単位を置く('立目'), j());
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
                        children: ['立目', '射目'].map((名) =>
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
                      // 番号は打ち込まずに選ぶ。記録表で人を選ぶのと同じ並びにしてある
                      (0, p.jsx)(g.default, {
                        data: 番号たち,
                        keyExtractor: (e) => String(e),
                        style: y.番号の一覧,
                        keyboardShouldPersistTaps: 'handled',
                        renderItem: ({ item: e }) =>
                          (0, p.jsxs)(u.default, {
                            style: [y.番号の行, e === 選んだ && y.番号の行選択中],
                            onPress: () => R(String(e)),
                            children: [
                              (0, p.jsxs)(o.default, {
                                style: [y.番号の字, e === 選んだ && y.番号の字選択中],
                                children: [e, 単位],
                              }),
                              e === 選んだ
                                ? (0, p.jsx)(h.Ionicons, { name: 'checkmark', size: 20, color: '#007AFF' })
                                : null,
                            ],
                          }),
                      }),
                      (0, p.jsx)(o.default, {
                        style: y.案内,
                        children:
                          null === 何射目()
                            ? '上から交代するところを選んでください'
                            : 立か
                              ? `${選んだ}立目（${何射目() + 1}射目）から交代します`
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
                        data: 学年ごと,
                        keyExtractor: (e) => String(e.学年),
                        style: y.list,
                        keyboardShouldPersistTaps: 'handled',
                        renderItem: ({ item: 組 }) =>
                          (0, p.jsxs)(n.default, {
                            children: [
                              (0, p.jsxs)(o.default, {
                                style: y.学年の見出し,
                                children: [組.題, ' (', 組.人たち.length, '人)'],
                              }),
                              ...組.人たち.map((e, 順) => {
                                if (!e || !e.name || 'string' != typeof e.name) return null;
                                const t = e.name.trim().split(/[\s\u3000]+/),
                                   姓 = t && t.length > 0 ? t[0] || '' : '不明',
                                   名前 = (t && t.length > 1 && t[1]) || '';
                                return (0, p.jsxs)(
                                  u.default,
                                  {
                                    style: y.memberItem,
                                    onPress: () => {
                                      A(e.name, e.id);
                                    },
                                    children: [
                                      (0, p.jsxs)(o.default, { style: y.memberName, children: [姓, ' ', 名前] }),
                                      (0, p.jsx)(o.default, { style: y.memberSub, children: e.gender }),
                                    ],
                                  },
                                  typeof e.id === 'string' ? e.id : `subst-${組.学年}-${順}-${e.name}`
                                );
                              }),
                            ],
                          }),
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
    単位の列: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    // 番号の一覧。人を選ぶ一覧（list / memberItem）と同じ見た目にそろえる
    // flexGrow: 0 が無いと、行が少なくても maxHeight ぶんの白い箱が残る
    番号の一覧: { backgroundColor: '#FFF', borderRadius: 10, maxHeight: 148, flexGrow: 0, marginBottom: 6 },
    番号の行: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: a.default.hairlineWidth,
      borderBottomColor: '#C6C6C8',
    },
    番号の行選択中: { backgroundColor: 'rgba(0,122,255,0.08)' },
    番号の字: { fontSize: 16, color: '#000' },
    番号の字選択中: { color: '#007AFF', fontWeight: 'bold' },
    // 学年の見出し。人の選択（termHeader / termTitle）と同じ見た目
    学年の見出し: {
      fontSize: 15,
      color: '#333',
      fontWeight: '600',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#FFF',
      borderBottomWidth: a.default.hairlineWidth,
      borderBottomColor: '#EEE',
    },
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
