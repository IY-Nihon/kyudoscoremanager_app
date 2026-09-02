/**
 * Module ID: 1041
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 1041;
const m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'ErrorBoundary', {
    enumerable: !0,
    get: function () {
      return f;
    },
  }));
var t = require('react'),
  o = e(require('./View')),
  n = e(require('./Text')),
  l = e(require('./TouchableOpacity')),
  s = e(require('./StyleSheet')),
  c = require('./JP_useScoreStore_174'),
  u = require('./themedJsx');
class f extends t.Component {
  state = { hasError: !1, error: null };
  static getDerivedStateFromError(e) {
    return { hasError: !0, error: e };
  }
  componentDidCatch(e, t) {
    console.error('Uncaught error:', e, t);
    // 画面ごと落ちたときこそ、何が起きたか残らないと直せない
    try {
      require('./errorReporter').不具合を送る('画面が落ちた', e);
    } catch (_) {
      /* 控えられなくても、復旧の画面は出す */
    }
  }
  handleReset = () => {
    (c.useScoreStore.getState().clearAllData(), this.setState({ hasError: !1, error: null }));
  };
  render() {
    return this.state.hasError
      ? (0, u.jsxs)(o.default, {
          style: h.container,
          children: [
            (0, u.jsx)(n.default, { style: h.title, children: '申し訳ありません' }),
            (0, u.jsx)(n.default, { style: h.message, children: '予期せぬエラーが発生しました。' }),
            (0, u.jsx)(n.default, { style: h.errorText, children: this.state.error?.toString() }),
            (0, u.jsx)(l.default, {
              style: h.button,
              onPress: this.handleReset,
              children: (0, u.jsx)(n.default, { style: h.buttonText, children: 'データをリセットして復旧' }),
            }),
          ],
        })
      : this.props.children;
  }
}
const h = s.default.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#000' },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 8, color: '#3C3C43' },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 24,
    fontFamily: 'Courier',
  },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
