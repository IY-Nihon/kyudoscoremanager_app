'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const Modal = require('./Modal').default;
const TextInput = require('./TextInput').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const KeyboardAvoidingView = require('./KeyboardAvoidingView').default;
const Keyboard = require('./Keyboard').default;
const ScrollView = require('./ScrollView').default;
const { useScoreStore } = require('./useScoreStore');
const { IS_IOS } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');
const { normalizeTag, タグの見た目 } = require('./syncRules');
const 既定のタグ = [
  '練習試合',
  '正規練習',
  '大会',
  '自主稽古',
  'アリーナ',
  '屋外',
  '晴れ',
  '曇り',
  '雨天',
  '強風',
];
const SaveSessionModal = ({ visible, onClose, onSave }) => {
  const {
    includeInStats,
    setIncludeInStats,
    tagTemplates = [],
    currentSessionTags = [],
    setCurrentSessionTags,
    toggleCurrentSessionTag,
  } = useScoreStore();
  const 出すタグ = tagTemplates.length > 0 ? tagTemplates : 既定のタグ;
  const [題, 題を置く] = React.useState('');
  const [覚え書き, 覚え書きを置く] = React.useState('');
  const // 入力欄には # を付けずに出す（空白区切り。読むときに normalizeTag で # を付ける）
    [タグの文, タグの文を置く] = React.useState(currentSessionTags.map(タグの見た目).join(' '));
  const [統計を聞いている, 統計を聞いているを置く] = React.useState(false);
  React.useEffect(() => {
    タグの文を置く(currentSessionTags.map(タグの見た目).join(' '));
  }, [currentSessionTags, visible]);
  const 統計の答え = (入れる) => {
    入れる
      ? (setIncludeInStats(true),
        onSave(題.trim(), 覚え書き.trim(), true, currentSessionTags.join(' ')),
        題を置く(''),
        覚え書きを置く(''))
      : 統計を聞いているを置く(true);
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={Keyboard.dismiss} />
        <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : undefined} style={styles.container}>
          {統計を聞いている ? (
            <View>
              <Text style={styles.headerTitle}>統計の除外確認</Text>
              <Text style={styles.subTitle}>
                この記録を統計（分析画面）に含めずに保存しますか？{'\n'}
                （特定の練習などを除外したい場合に利用します）
              </Text>
              <View style={styles.separator} />
              <TouchableOpacity
                style={[styles.mainSaveBtn, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  setIncludeInStats(false);
                  onSave(題.trim(), 覚え書き.trim(), false, currentSessionTags.join(' '));
                  題を置く('');
                  覚え書きを置く('');
                  統計を聞いているを置く(false);
                }}
              >
                <Text style={styles.mainSaveTxt}>統計に含めず保存</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => 統計を聞いているを置く(false)}>
                <Text style={styles.cancelTxt}>戻る</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.headerTitle}>練習記録の保存</Text>
              <Text style={styles.subTitle}>保存内容を入力してください。</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="大会名・練習名（例: ○○大会）"
                  placeholderTextColor="#C7C7CC"
                  value={題}
                  onChangeText={題を置く}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="練習メモ（例: 合宿1日目）"
                  placeholderTextColor="#C7C7CC"
                  value={覚え書き}
                  onChangeText={覚え書きを置く}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.tagsAreaContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="タグ（例: 審査前 雨天）"
                  placeholderTextColor="#C7C7CC"
                  value={タグの文}
                  onChangeText={(文) => {
                    タグの文を置く(文);
                    const タグたち = 文
                      .split(/[\s,\u3001]+/)
                      .map(normalizeTag)
                      .filter(Boolean);
                    setCurrentSessionTags(タグたち);
                  }}
                  returnKeyType="done"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetTagsScroll}
                  contentContainerStyle={styles.presetTagsContainer}
                >
                  {出すタグ.map((タグ) => {
                    const 整えた = normalizeTag(タグ);
                    const 選択中 = currentSessionTags.map(normalizeTag).includes(整えた);
                    return (
                      <TouchableOpacity
                        key={タグ}
                        style={[styles.presetTagBtn, 選択中 && styles.presetTagBtnActive]}
                        onPress={() => {
                          toggleCurrentSessionTag(整えた);
                        }}
                      >
                        <Text style={[styles.presetTagTxt, 選択中 && styles.presetTagTxtActive]}>
                          {タグの見た目(整えた)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.separator} />
              <TouchableOpacity style={styles.mainSaveBtn} onPress={() => 統計の答え(true)}>
                <Text style={styles.mainSaveTxt}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => 統計の答え(false)}>
                <Text style={styles.secondaryTxt}>統計に含めないで保存</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  題を置く('');
                  覚え書きを置く('');
                  タグの文を置く('');
                  統計を聞いているを置く(false);
                  onClose();
                }}
              >
                <Text style={styles.cancelTxt}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: Object.assign(
    { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 14, padding: 20 },
    getShadowStyle({ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 })
  ),
  headerTitle: { fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subTitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 16 },
  inputContainer: { marginBottom: 10 },
  tagsAreaContainer: { marginBottom: 8 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  presetTagsScroll: { marginTop: 8 },
  presetTagsContainer: { paddingRight: 10, gap: 8, flexDirection: 'row' },
  presetTagBtn: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  presetTagBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  presetTagTxt: { fontSize: 13, color: '#666' },
  presetTagTxtActive: { color: '#FFF', fontWeight: 'bold' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginVertical: 10 },
  mainSaveBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#007AFF',
    marginBottom: 8,
  },
  mainSaveTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  secondaryTxt: { color: '#FF3B30', fontWeight: '600', fontSize: 15 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#F2F2F7' },
  cancelTxt: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.SaveSessionModal = SaveSessionModal;
