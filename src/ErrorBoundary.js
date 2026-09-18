'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const StyleSheet = require('./StyleSheet').default;
const { useScoreStore } = require('./useScoreStore');
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(e) {
    return { hasError: true, error: e };
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
    useScoreStore.getState().clearAllData();
    this.setState({ hasError: false, error: null });
  };
  render() {
    return this.state.hasError ? (
      <View style={styles.container}>
        <Text style={styles.title}>申し訳ありません</Text>
        <Text style={styles.message}>予期せぬエラーが発生しました。</Text>
        <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>データをリセットして復旧</Text>
        </TouchableOpacity>
      </View>
    ) : (
      this.props.children
    );
  }
}
const styles = StyleSheet.create({
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.ErrorBoundary = ErrorBoundary;
