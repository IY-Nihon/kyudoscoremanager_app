'use strict';

const { 色 } = require('./iro.js');
const React = require('react');
const { View, Text, TouchableOpacity, StyleSheet } = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const { 失われるもの, 確認の文 } = require('./resetWarning');
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, 確認中: false };
  static getDerivedStateFromError(誤り) {
    return { hasError: true, error: 誤り, 確認中: false };
  }
  componentDidCatch(誤り, 部品の履歴) {
    console.error('Uncaught error:', 誤り, 部品の履歴);
    // 画面ごと落ちたときこそ、何が起きたか残らないと直せない
    try {
      require('./errorReporter').不具合を送る('画面が落ちた', 誤り);
    } catch {
      /* 控えられなくても、復旧の画面は出す */
    }
  }
  // 消す前に、何が失われるかを見せて確かめる（雲に送れていない記録・保存前の盤面は戻らない）
  handleReset = () => this.setState({ 確認中: true });
  handleCancel = () => this.setState({ 確認中: false });
  handleConfirm = () => {
    useScoreStore.getState().clearAllData();
    this.setState({ hasError: false, error: null, 確認中: false });
  };
  // 消さずに直るなら、それがいちばん良い
  handleReload = () => {
    if (typeof location !== 'undefined' && location.reload) location.reload();
  };
  render() {
    return this.state.hasError ? (
      <View style={styles.container}>
        <Text style={styles.title}>申し訳ありません</Text>
        <Text style={styles.message}>予期せぬエラーが発生しました。</Text>
        <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
        {this.state.確認中 ? (
          <>
            <Text style={styles.message}>{確認の文(失われるもの(useScoreStore.getState()))}</Text>
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={this.handleConfirm}>
              <Text style={styles.buttonText}>消して復旧する</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subButton} onPress={this.handleCancel}>
              <Text style={styles.subButtonText}>やめる</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={this.handleReload}>
              <Text style={styles.buttonText}>読み込み直す</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subButton} onPress={this.handleReset}>
              <Text style={styles.subButtonText}>データをリセットして復旧</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    ) : (
      this.props.children
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 色.地,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: 色.黒 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 8, color: 色.文字_二 },
  errorText: {
    fontSize: 12,
    color: 色.赤,
    backgroundColor: 色.白,
    padding: 8,
    borderRadius: 8,
    marginBottom: 24,
    fontFamily: 'Courier',
  },
  button: { backgroundColor: 色.青, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  dangerButton: { backgroundColor: 色.赤 },
  subButton: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  subButtonText: { color: 色.青, fontSize: 15 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.ErrorBoundary = ErrorBoundary;
