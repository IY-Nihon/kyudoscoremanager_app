/**
 * Module ID: 1036
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 1036;
const m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

Object.defineProperty(_e, '__esModule', { value: true });
Object.defineProperty(_e, 'LoginScreen', {
  enumerable: true,
  get: function () {
    return T;
  },
});

var t = require('./module_37'),
  l = e(require('./default_380')),
  n = e(require('./default_385')),
  o = e(require('./default_297')),
  s = e(require('./module_198')),
  c = e(require('./default_218')),
  u = e(require('./default_144')),
  h = e(require('./default_217')),
  p = e(require('./default_45')),
  f = e(require('./default_398')),
  x = require('./JP_useScoreStore_174'),
  y = require('./IS_WEB_199'),
  b = require('./db_178'),
  C = require('./module_191'),
  j = require('./module_188'),
  w = require('./AntDesign_600'),
  I = require('./module_592'),
  E = require('./module_427');

function e(e) {
  return e && e.__esModule ? e : { default: e };
}

const Q = (e) => {
  const c = e.code || '';
  if (
    c === 'auth/wrong-password' ||
    c === 'auth/invalid-credential' ||
    c === 'auth/invalid-login-credentials'
  ) {
    return 'IDまたはパスワードが正しくありません';
  }
  if (c === 'auth/too-many-requests') {
    return 'ログイン試行回数が上限に達しました。しばらくたってから再試行してください';
  }
  if (c === 'auth/email-already-in-use') {
    return 'このメールアドレスはすでに登録されています';
  }
  if (c === 'auth/weak-password') {
    return 'パスワードは6文字以上で設定してください';
  }
  if (c === 'auth/invalid-email') {
    return 'メールアドレスの形式が正しくありません';
  }
  if (c === 'auth/requires-recent-login') {
    return 'セキュリティのため、一度ログアウトして再ログイン後に変更してください';
  }
  if (c === 'auth/network-request-failed') {
    return '通信エラーが発生しました。接続を確認して再試行してください';
  }
  if (c === 'auth/user-not-found') {
    return '入力内容を確認してください';
  }
  return e.message || '予期しないエラーが発生しました。時間を置いて再試行してください';
};

// 部員の認証方式の版。所属クレームを使う方式に切り替えたので 2。
// 起動時にこの値が古い端末はログアウトさせ、個人IDで入り直してもらう。
const MEMBER_AUTH_VERSION = 2;

const T = () => {
  const {
    setAuth: e,
    fetchAndOverwriteFromCloud: p,
    startPeriodicSync: I,
    setMemberAuthVersion: se,
  } = (0, x.useScoreStore)();
  const [T, F] = (0, t.useState)('login_group');
  const [_, v] = (0, t.useState)(false);
  const [D, k] = (0, t.useState)('');
  const [W, B] = (0, t.useState)('');
  const [P, A] = (0, t.useState)('');
  const [L, z] = (0, t.useState)('');
  const [O, G] = (0, t.useState)('');
  const [R, U] = (0, t.useState)('none');
  const [M, V] = (0, t.useState)('');
  const [H, X] = (0, t.useState)(false);
  // 規約とプライバシーポリシーへの同意。登録の前に取る。
  // 規約 第10条2項で、団体は部員本人から同意を得る責任を負うと定めている。
  // その責任をここで伝えないと、知らないまま部員を登録できてしまう
  const [規約に同意, 規約に同意を置く] = (0, t.useState)(false);
  const [部員の同意を取る, 部員の同意を取るを置く] = (0, t.useState)(false);

  const $ = async () => {
    if (P && L && O) {
      if (!規約に同意 || !部員の同意を取る) {
        s.default.alert('確認', '利用規約とプライバシーポリシーの同意、および部員本人の同意についての確認にチェックを入れてください。');
        return;
      }
      v(true);
      try {
        const e = Math.floor(1e5 + 9e5 * Math.random()).toString();
        const t = (0, j.doc)(b.db, 'group_accounts', e);
        if ((await (0, j.getDoc)(t)).exists()) {
          v(false);
          return $();
        }
        await (0, C.createUserWithEmailAndPassword)(b.auth, P, L);
        // どの版にいつ同意したかを残す。版を上げたときに、誰へ
        // 取り直しを求めるべきかが分からなくなるため
        await (0, j.setDoc)(t, Object.assign(
          { id: e, name: O, email: P, createdAt: Date.now() },
          require('./legalDocs').同意の記録()
        ));
        s.default.alert(
          '【重要】登録完了と運用ガイド',
          `団体アカウントを作成しました。\n\n■ 登録情報\n団体ID: ${e}\n\n【運用ガイド - スクリーンショット推奨】\n・「団体ID」はメンバーがログインする際、必要です。メンバー全員に共有してください。\n・「パスワード」は管理者のみが知るものとして保存してください。\n・メールアドレスを変更すると、セキュリティのため旧アドレスに確認・無効化のメールが自動送信されます。\n\n※ この運用ガイドの内容は忘れないよう必ず保存をお願いします。`
        );
        k(e);
        F('login_group');
      } catch (e) {
        s.default.alert('登録失敗', Q(e));
      } finally {
        v(false);
      }
    } else {
      s.default.alert('エラー', 'すべての項目を入力してください');
    }
  };

  return (0, E.jsxs)(u.default, {
    style: S.container,
    children: [
      (0, E.jsx)(require('./KyudoBackgroundAnimation').default, {}),
      (0, E.jsx)(n.default, {
        behavior: y.IS_IOS ? 'padding' : 'height',
        style: S.keyboardView,
        children: (0, E.jsxs)(o.default, {
          contentContainerStyle: S.scrollContent,
          keyboardShouldPersistTaps: 'handled',
          children: [
            (0, E.jsxs)(u.default, {
              style: S.header,
              children: [
                (0, E.jsx)(u.default, {
                  style: S.logoContainer,
                  children: (0, E.jsx)(require('react-native').Image, {
                    source: require('../assets/kyudo_icon.png'),
                    style: { width: 80, height: 80, borderRadius: 20 },
                  }),
                }),
                (0, E.jsx)(h.default, {
                  style: S.title,
                  children: '弓道記録アプリ',
                }),
                (0, E.jsx)(h.default, {
                  style: S.subtitle,
                  children:
                    'none' !== R
                      ? 'アカウントの復旧'
                      : 'login_group' === T
                        ? '団体ログイン'
                        : 'login_member' === T
                          ? '個人ログイン'
                          : '団体アカウント作成',
                }),
              ],
            }),
            (0, E.jsxs)(u.default, {
              style: S.card,
              children: [
                'register' !== T &&
                  'none' === R &&
                  (0, E.jsxs)(u.default, {
                    style: S.tabContainer,
                    children: [
                      (0, E.jsx)(
                        c.default,
                        {
                          style: function (state) {
                            return [
                              S.tab,
                              'login_group' === T && S.activeTab,
                              state.hovered &&
                                y.IS_WEB &&
                                !S.activeTab && { backgroundColor: 'rgba(255,255,255,0.1)' },
                            ];
                          },
                          onPress: () => F('login_group'),
                          children: (0, E.jsx)(h.default, {
                            style: [S.tabText, 'login_group' === T && S.activeTabText],
                            children: '団体',
                          }),
                        },
                        'tab-group'
                      ),
                      (0, E.jsx)(
                        c.default,
                        {
                          style: function (state) {
                            return [
                              S.tab,
                              'login_member' === T && S.activeTab,
                              state.hovered &&
                                y.IS_WEB &&
                                !S.activeTab && { backgroundColor: 'rgba(255,255,255,0.1)' },
                            ];
                          },
                          onPress: () => F('login_member'),
                          children: (0, E.jsx)(h.default, {
                            style: [S.tabText, 'login_member' === T && S.activeTabText],
                            children: '個人',
                          }),
                        },
                        'tab-member'
                      ),
                    ],
                  }),
                (0, E.jsxs)(u.default, {
                  style: S.form,
                  children: [
                    'email' === R &&
                      (0, E.jsxs)(E.Fragment, {
                        children: [
                          (0, E.jsxs)(u.default, {
                            style: S.inputGroup,
                            children: [
                              (0, E.jsx)(h.default, {
                                style: S.label,
                                children: '団体ID',
                              }),
                              (0, E.jsx)(u.default, {
                                style: S.inputWrapper,
                                children: (0, E.jsx)(f.default, {
                                  style: S.input,
                                  placeholder: '例: 123456',
                                  placeholderTextColor: '#8E8E93',
                                  value: D,
                                  onChangeText: k,
                                  keyboardType: 'number-pad',
                                }),
                              }),
                            ],
                          }),
                          (0, E.jsxs)(u.default, {
                            style: S.inputGroup,
                            children: [
                              (0, E.jsx)(h.default, {
                                style: S.label,
                                children: '現在のパスワード',
                              }),
                              (0, E.jsxs)(u.default, {
                                style: S.inputWrapper,
                                children: [
                                  (0, E.jsx)(f.default, {
                                    style: S.input,
                                    placeholder: '••••••••',
                                    placeholderTextColor: '#8E8E93',
                                    value: L,
                                    onChangeText: z,
                                    secureTextEntry: !H,
                                  }),
                                  (0, E.jsx)(c.default, {
                                    onPress: () => X(!H),
                                    style: { padding: 4 },
                                    children: (0, E.jsx)(w.Ionicons, {
                                      name: H ? 'eye-off' : 'eye',
                                      size: 20,
                                      color: '#8E8E93',
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, E.jsxs)(u.default, {
                            style: S.inputGroup,
                            children: [
                              (0, E.jsx)(h.default, {
                                style: S.label,
                                children: '新しいメールアドレス',
                              }),
                              (0, E.jsx)(u.default, {
                                style: S.inputWrapper,
                                children: (0, E.jsx)(f.default, {
                                  style: S.input,
                                  placeholder: 'new@example.com',
                                  placeholderTextColor: '#8E8E93',
                                  value: M,
                                  onChangeText: V,
                                  keyboardType: 'email-address',
                                  autoCapitalize: 'none',
                                }),
                              }),
                            ],
                          }),
                          (0, E.jsx)(c.default, {
                            style: function (state) {
                              return [
                                S.submitBtn,
                                _ && S.disabledBtn,
                                state.hovered && !_ && y.IS_WEB && { opacity: 0.8 },
                              ];
                            },
                            onPress: async () => {
                              if (D && L && M) {
                                v(true);
                                try {
                                  const e = D.toUpperCase();
                                  const t = (0, j.doc)(b.db, 'group_accounts', e);
                                  const l = await (0, j.getDoc)(t);
                                  if (!l.exists()) {
                                    throw new Error('入力内容を確認してください');
                                  }
                                  const { email: n } = l.data();
                                  const o = await (0, C.signInWithEmailAndPassword)(b.auth, n, L);
                                  if (o.user) {
                                    // Firestore を先に書く。updateEmail は ID トークンの
                                    // メールアドレスを更新してしまい、その後だと
                                    // 「本人だけが変更できる」ルールに引っかかるため。
                                    await (0, j.setDoc)(t, { email: M }, { merge: true });
                                    try {
                                      await (0, C.updateEmail)(o.user, M);
                                    } catch (err) {
                                      // 認証側が変わらなかったときは保存済みの値を戻す。
                                      // 放置すると保存メールと認証アカウントが食い違い、
                                      // その団体がログインできなくなる。
                                      await (0, j.setDoc)(t, { email: n }, { merge: true });
                                      throw err;
                                    }
                                    s.default.alert(
                                      '完了',
                                      'メールアドレスを変更しました。今後は新しいメールアドレスでログインできます。\n\n◆セキュリティ保護のため、古いメールアドレス宛に変更を通知するメールが自動送信されています。身に覚えのない変更だった場合は、そのメール内のリンクから変更を取り消すことができます。'
                                    );
                                    U('none');
                                  }
                                } catch (e) {
                                  s.default.alert('復旧失敗', Q(e));
                                } finally {
                                  v(false);
                                }
                              } else {
                                s.default.alert(
                                  'エラー',
                                  '団体ID、パスワード、新しいメールアドレスを入力してください'
                                );
                              }
                            },
                            disabled: _,
                            children: (0, E.jsx)(h.default, {
                              style: S.submitBtnText,
                              children: 'メールアドレスを更新',
                            }),
                          }),
                          (0, E.jsx)(c.default, {
                            onPress: () => U('none'),
                            children: function (state) {
                              return (0, E.jsx)(h.default, {
                                style: [
                                  S.cancelLink,
                                  state.hovered && y.IS_WEB && { textDecorationLine: 'underline' },
                                ],
                                children: 'キャンセル',
                              });
                            },
                          }),
                        ],
                      }),
                    'password' === R &&
                      (0, E.jsxs)(E.Fragment, {
                        children: [
                          (0, E.jsxs)(u.default, {
                            style: S.inputGroup,
                            children: [
                              (0, E.jsx)(h.default, {
                                style: S.label,
                                children: '団体ID',
                              }),
                              (0, E.jsx)(u.default, {
                                style: S.inputWrapper,
                                children: (0, E.jsx)(f.default, {
                                  style: S.input,
                                  placeholder: '例: 123456',
                                  placeholderTextColor: '#8E8E93',
                                  value: D,
                                  onChangeText: k,
                                  keyboardType: 'number-pad',
                                }),
                              }),
                            ],
                          }),
                          (0, E.jsx)(c.default, {
                            style: function (state) {
                              return [
                                S.submitBtn,
                                _ && S.disabledBtn,
                                state.hovered && !_ && y.IS_WEB && { opacity: 0.8 },
                              ];
                            },
                            onPress: async () => {
                              if (D) {
                                v(true);
                                try {
                                  const e = D.toUpperCase();
                                  const t = (0, j.doc)(b.db, 'group_accounts', e);
                                  const l = await (0, j.getDoc)(t);
                                  if (!l.exists()) {
                                    throw new Error('入力内容を確認してください');
                                  }
                                  const { email: n } = l.data();
                                  await (0, C.sendPasswordResetEmail)(b.auth, n);
                                  s.default.alert(
                                    '完了',
                                    '登録メールアドレスにパスワード再設定用のリンクを送信しました。'
                                  );
                                  U('none');
                                } catch (e) {
                                  s.default.alert('送信失敗', Q(e));
                                } finally {
                                  v(false);
                                }
                              } else {
                                s.default.alert('エラー', '団体IDを入力してください');
                              }
                            },
                            disabled: _,
                            children: (0, E.jsx)(h.default, {
                              style: S.submitBtnText,
                              children: 'パスワード再設定メールを送信',
                            }),
                          }),
                          (0, E.jsx)(c.default, {
                            onPress: () => U('none'),
                            children: function (state) {
                              return (0, E.jsx)(h.default, {
                                style: [
                                  S.cancelLink,
                                  state.hovered && y.IS_WEB && { textDecorationLine: 'underline' },
                                ],
                                children: 'キャンセル',
                              });
                            },
                          }),
                        ],
                      }),
                    'none' === R &&
                      (0, E.jsxs)(E.Fragment, {
                        children: [
                          ('login_group' === T || 'login_member' === T) &&
                            (0, E.jsxs)(u.default, {
                              style: S.inputGroup,
                              children: [
                                (0, E.jsx)(h.default, {
                                  style: S.label,
                                  children: '団体ID',
                                }),
                                (0, E.jsxs)(u.default, {
                                  style: S.inputWrapper,
                                  children: [
                                    (0, E.jsx)(w.Ionicons, {
                                      name: 'business',
                                      size: 20,
                                      color: '#8E8E93',
                                      style: S.inputIcon,
                                    }),
                                    (0, E.jsx)(f.default, {
                                      style: S.input,
                                      placeholder: '例: 123456',
                                      placeholderTextColor: '#8E8E93',
                                      value: D,
                                      onChangeText: k,
                                      keyboardType: 'number-pad',
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          'login_group' === T &&
                            (0, E.jsxs)(u.default, {
                              style: S.inputGroup,
                              children: [
                                (0, E.jsx)(h.default, {
                                  style: S.label,
                                  children: 'パスワード',
                                }),
                                (0, E.jsxs)(u.default, {
                                  style: S.inputWrapper,
                                  children: [
                                    (0, E.jsx)(w.Ionicons, {
                                      name: 'lock-closed',
                                      size: 20,
                                      color: '#8E8E93',
                                      style: S.inputIcon,
                                    }),
                                    (0, E.jsx)(f.default, {
                                      style: S.input,
                                      placeholder: '••••••••',
                                      placeholderTextColor: '#8E8E93',
                                      value: L,
                                      onChangeText: z,
                                      secureTextEntry: !H,
                                    }),
                                    (0, E.jsx)(c.default, {
                                      onPress: () => X(!H),
                                      style: { padding: 4 },
                                      children: (0, E.jsx)(w.Ionicons, {
                                        name: H ? 'eye-off' : 'eye',
                                        size: 20,
                                        color: '#8E8E93',
                                      }),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          'login_member' === T &&
                            (0, E.jsxs)(u.default, {
                              style: S.inputGroup,
                              children: [
                                (0, E.jsx)(h.default, {
                                  style: S.label,
                                  children: '個人ID（4桁）',
                                }),
                                (0, E.jsxs)(u.default, {
                                  style: S.inputWrapper,
                                  children: [
                                    (0, E.jsx)(w.Ionicons, {
                                      name: 'person',
                                      size: 20,
                                      color: '#8E8E93',
                                      style: S.inputIcon,
                                    }),
                                    (0, E.jsx)(f.default, {
                                      style: S.input,
                                      placeholder: '例: 1234',
                                      placeholderTextColor: '#8E8E93',
                                      value: W,
                                      onChangeText: B,
                                      keyboardType: 'number-pad',
                                      maxLength: 4,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          'register' === T &&
                            (0, E.jsxs)(E.Fragment, {
                              children: [
                                (0, E.jsxs)(u.default, {
                                  style: S.inputGroup,
                                  children: [
                                    (0, E.jsx)(h.default, {
                                      style: S.label,
                                      children: '団体名',
                                    }),
                                    (0, E.jsxs)(u.default, {
                                      style: S.inputWrapper,
                                      children: [
                                        (0, E.jsx)(w.Ionicons, {
                                          name: 'ribbon',
                                          size: 20,
                                          color: '#8E8E93',
                                          style: S.inputIcon,
                                        }),
                                        (0, E.jsx)(f.default, {
                                          style: S.input,
                                          placeholder: '例: ○○弓道部',
                                          placeholderTextColor: '#8E8E93',
                                          value: O,
                                          onChangeText: G,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                (0, E.jsxs)(u.default, {
                                  style: S.inputGroup,
                                  children: [
                                    (0, E.jsx)(h.default, {
                                      style: S.label,
                                      children: 'メールアドレス',
                                    }),
                                    (0, E.jsxs)(u.default, {
                                      style: S.inputWrapper,
                                      children: [
                                        (0, E.jsx)(w.Ionicons, {
                                          name: 'mail',
                                          size: 20,
                                          color: '#8E8E93',
                                          style: S.inputIcon,
                                        }),
                                        (0, E.jsx)(f.default, {
                                          style: S.input,
                                          placeholder: 'example@mail.com',
                                          placeholderTextColor: '#8E8E93',
                                          value: P,
                                          onChangeText: A,
                                          keyboardType: 'email-address',
                                          autoCapitalize: 'none',
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                (0, E.jsxs)(u.default, {
                                  style: S.inputGroup,
                                  children: [
                                    (0, E.jsx)(h.default, {
                                      style: S.label,
                                      children: 'パスワード',
                                    }),
                                    (0, E.jsxs)(u.default, {
                                      style: S.inputWrapper,
                                      children: [
                                        (0, E.jsx)(w.Ionicons, {
                                          name: 'lock-closed',
                                          size: 20,
                                          color: '#8E8E93',
                                          style: S.inputIcon,
                                        }),
                                        (0, E.jsx)(f.default, {
                                          style: S.input,
                                          placeholder: '••••••••',
                                          placeholderTextColor: '#8E8E93',
                                          value: L,
                                          onChangeText: z,
                                          secureTextEntry: !H,
                                        }),
                                        (0, E.jsx)(c.default, {
                                          onPress: () => X(!H),
                                          style: { padding: 4 },
                                          children: (0, E.jsx)(w.Ionicons, {
                                            name: H ? 'eye-off' : 'eye',
                                            size: 20,
                                            color: '#8E8E93',
                                          }),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                        ],
                      }),
                    // 登録の前に同意を取る。規約 第10条2項は、団体が部員本人から
                    // 同意を得る責任を負うと定めている。ここで伝えないと、
                    // その責任を知らないまま部員を登録できてしまう
                    'register' === T &&
                      (0, E.jsxs)(u.default, {
                        style: S.同意の枠,
                        children: [
                          (0, E.jsxs)(c.default, {
                            style: S.同意の行,
                            onPress: () => 規約に同意を置く(!規約に同意),
                            children: [
                              (0, E.jsx)(h.default, {
                                style: [S.同意の印, 規約に同意 && S.同意の印つき],
                                children: 規約に同意 ? '✓' : '',
                              }),
                              (0, E.jsxs)(h.default, {
                                style: S.同意の字,
                                children: [
                                  (0, E.jsx)(h.default, {
                                    style: S.同意のリンク,
                                    onPress: () => 法.開く(法.規約のURL),
                                    children: '利用規約',
                                  }),
                                  ' と ',
                                  (0, E.jsx)(h.default, {
                                    style: S.同意のリンク,
                                    onPress: () => 法.開く(法.プライバシーのURL),
                                    children: 'プライバシーポリシー',
                                  }),
                                  ' に同意します',
                                ],
                              }),
                            ],
                          }),
                          (0, E.jsxs)(c.default, {
                            style: S.同意の行,
                            onPress: () => 部員の同意を取るを置く(!部員の同意を取る),
                            children: [
                              (0, E.jsx)(h.default, {
                                style: [S.同意の印, 部員の同意を取る && S.同意の印つき],
                                children: 部員の同意を取る ? '✓' : '',
                              }),
                              (0, E.jsx)(h.default, {
                                style: S.同意の字,
                                children:
                                  '部員の氏名を登録する前に、本人（未成年の場合は保護者）から同意を得ます',
                              }),
                            ],
                          }),
                        ],
                      }),
                    (0, E.jsx)(c.default, {
                      style: function (state) {
                        return [
                          S.submitBtn,
                          _ && S.disabledBtn,
                          state.hovered && !_ && y.IS_WEB && { opacity: 0.8 },
                        ];
                      },
                      onPress:
                        'login_group' === T
                          ? async () => {
                              if (D && L) {
                                v(true);
                                try {
                                  const t = (0, j.doc)(b.db, 'group_accounts', D.toUpperCase());
                                  const l = await (0, j.getDoc)(t);
                                  if (!l.exists()) {
                                    throw new Error('団体IDまたはパスワードが正しくありません');
                                  }
                                  const { email: n, id: o } = l.data();
                                  await (0, C.signInWithEmailAndPassword)(b.auth, n, L);
                                  e(o || D.toUpperCase(), 'group', null, n, D.toUpperCase());
                                } catch (e) {
                                  s.default.alert('ログイン失敗', Q(e));
                                } finally {
                                  v(false);
                                }
                              } else {
                                s.default.alert('エラー', '団体IDとパスワードを入力してください');
                              }
                            }
                          : 'login_member' === T
                            ? async () => {
                                if (D && W) {
                                  v(true);
                                  try {
                                    const t = D.toUpperCase();
                                    const l = (0, j.doc)(b.db, 'group_accounts', t);
                                    const n = await (0, j.getDoc)(l);
                                    if (!n.exists()) {
                                      throw new Error('団体IDまたは個人IDが正しくありません');
                                    }
                                    const { id: o } = n.data();
                                    await (0, C.signInAnonymously)(b.auth);

                                    // 個人IDから1件だけ直接取得する。
                                    // 一覧(list)を使わないため、他団体の名簿は引けない。
                                    const lk = await (0, j.getDoc)(
                                      (0, j.doc)(b.db, `groups/${o}/member_lookup`, W)
                                    );
                                    if (!lk.exists()) {
                                      throw new Error('団体IDまたは個人IDが正しくありません');
                                    }
                                    const memberId = lk.data().memberId;

                                    // 所属を宣言する。ルール側が逆引き表と突き合わせて検証するため、
                                    // 正しい個人IDを知っている場合しか作れない。
                                    await (0, j.setDoc)(
                                      (0, j.doc)(b.db, 'member_claims', b.auth.currentUser.uid),
                                      { groupId: o, memberId: memberId, personalId: W, claimedAt: Date.now() }
                                    );

                                    const md = await (0, j.getDoc)(
                                      (0, j.doc)(b.db, `groups/${o}/members`, memberId)
                                    );
                                    const f = md.data() || {};
                                    e(o || t, 'member', memberId, null, t, null, f.name);
                                    se(MEMBER_AUTH_VERSION);
                                  } catch (e) {
                                    s.default.alert('ログイン失敗', Q(e));
                                  } finally {
                                    v(false);
                                  }
                                } else {
                                  s.default.alert('エラー', '団体IDと個人IDを入力してください');
                                }
                              }
                            : $,
                      disabled: _,
                      children: _
                        ? (0, E.jsx)(l.default, {
                            color: '#FFF',
                          })
                        : (0, E.jsx)(h.default, {
                            style: S.submitBtnText,
                            children: 'register' === T ? 'アカウント作成' : 'ログイン',
                          }),
                    }),
                    'login_group' === T &&
                      (0, E.jsxs)(u.default, {
                        style: S.helpLinks,
                        children: [
                          (0, E.jsx)(
                            c.default,
                            {
                              onPress: () => U('email'),
                              children: function (state) {
                                return (0, E.jsx)(h.default, {
                                  style: [S.helpLink, state.hovered && y.IS_WEB && { color: '#e5c184' }],
                                  children: 'メールアドレスを忘れた',
                                });
                              },
                            },
                            'email'
                          ),
                          (0, E.jsx)(
                            c.default,
                            {
                              onPress: () =>
                                s.default.alert(
                                  '通知',
                                  '団体IDは、アカウント登録時のメールに記載されています。見当たらない場合は管理者にお問い合わせください。'
                                ),
                              children: function (state) {
                                return (0, E.jsx)(h.default, {
                                  style: [S.helpLink, state.hovered && y.IS_WEB && { color: '#e5c184' }],
                                  children: '団体IDを忘れた',
                                });
                              },
                            },
                            'groupid'
                          ),
                          (0, E.jsx)(
                            c.default,
                            {
                              onPress: () => U('password'),
                              children: function (state) {
                                return (0, E.jsx)(h.default, {
                                  style: [S.helpLink, state.hovered && y.IS_WEB && { color: '#e5c184' }],
                                  children: 'パスワードを忘れた',
                                });
                              },
                            },
                            'password'
                          ),
                        ],
                      }),
                  ],
                }),
              ],
            }),
            (0, E.jsx)(u.default, {
              style: S.footer,
              children:
                'register' === T
                  ? (0, E.jsx)(c.default, {
                      onPress: () => F('login_group'),
                      children: function (state) {
                        return (0, E.jsx)(h.default, {
                          style: [
                            S.footerLink,
                            state.hovered && y.IS_WEB && { textDecorationLine: 'underline' },
                          ],
                          children: 'すでにアカウントをお持ちの方（ログイン）',
                        });
                      },
                    })
                  : (0, E.jsx)(c.default, {
                      onPress: () => F('register'),
                      children: function (state) {
                        return (0, E.jsx)(h.default, {
                          style: [
                            S.footerLink,
                            state.hovered && y.IS_WEB && { textDecorationLine: 'underline' },
                          ],
                          children: '団体アカウントを新規作成する',
                        });
                      },
                    }),
            }),
          ],
        }),
      }),
    ],
  });
};

var S = p.default.create({
  container: {
    flex: 1,
    backgroundColor: '#030508',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: y.SAFE_TOP_PADDING || 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: Object.assign(
    {
      width: 80,
      height: 80,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(184,150,90,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    (0, I.getShadowStyle)({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    })
  ),
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8965a',
  },
  card: Object.assign(
    {
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: 1.5,
      borderColor: 'rgba(184,150,90,0.2)',
      borderRadius: 24,
      padding: 24,
    },
    (0, I.getShadowStyle)({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    })
  ),
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: Object.assign(
    {
      backgroundColor: '#b8965a',
    },
    (0, I.getShadowStyle)({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    })
  ),
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#030508',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#e5c184',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#b8965a',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  disabledBtn: {
    backgroundColor: 'rgba(184,150,90,0.25)',
  },
  submitBtnText: {
    color: '#030508',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerLink: {
    color: '#e5c184',
    fontSize: 15,
    fontWeight: '600',
  },
  // 登録時の同意の欄
  同意の枠: { marginTop: 4, marginBottom: 12, gap: 10 },
  同意の行: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  // この画面は独自の暗い配色（#030508 + 金 #E5C184/#B8965A）で、テーマ変換の
  // 対象外という前提で組まれている。変換表に載っている色（#3C3C43 や #007AFF など）
  // を使うと、明るいテーマのときに変換されず、暗い背景に沈んで読めなくなる
  同意の印: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#a09880',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 15,
    color: 'transparent',
    overflow: 'hidden',
  },
  同意の印つき: { backgroundColor: '#b8965a', borderColor: '#b8965a', color: '#030508' },
  // 押す前に読んでもらう文なので、補助の #a09880 より明るくする
  同意の字: { flex: 1, fontSize: 13, color: '#c9c1ae', lineHeight: 20 },
  同意のリンク: { color: '#e5c184', textDecorationLine: 'underline' },
  helpLinks: {
    marginTop: 20,
    gap: 12,
    alignItems: 'center',
  },
  helpLink: {
    color: '#a09880',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  cancelLink: {
    color: '#FF453A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
