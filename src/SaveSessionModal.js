'use strict';

const { 色 } = require('./iro.js');
const React = require('react');
const {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
} = require('./rn');

const { useストアの一部 } = require('./storeSlice');
const { useScoreStore } = require('./useScoreStore');
const { IS_IOS } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');
const { normalizeTag, タグの見た目, cleanUpTagsArray } = require('./syncRules');

/** タグの欄の字を、しまう形のタグの並びに（空白・読点で区切る。ほかと同じ決まりでそろえる） */
const 欄のタグ = (文) => cleanUpTagsArray(String(文 || '').split(/[\s,、]+/));
const 同じ並び = (甲, 乙) => 甲.length === 乙.length && 甲.every((タグ, 番) => タグ === 乙[番]);
const { use横流し } = require('./yokoNagashi');
// タグの候補。団体で定型のタグ（設定のタグの定型）を決めていないときに出す
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
/**
 * 記録画面の「終了・保存」の窓。題・メモ・タグを入れて保存する。
 * 「統計に含めないで保存」は、確かめの段を 1 つはさんでから保存する
 */
const SaveSessionModal = ({ visible, onClose, onSave }) => {
  const {
    setIncludeInStats,
    tagTemplates = [],
    currentSessionTags = [],
    setCurrentSessionTags,
    toggleCurrentSessionTag,
  } = useストアの一部([
    'setIncludeInStats',
    'tagTemplates',
    'currentSessionTags',
    'setCurrentSessionTags',
    'toggleCurrentSessionTag',
  ]);
  const 出すタグ = tagTemplates.length > 0 ? tagTemplates : 既定のタグ;
  const [題, 題を置く] = React.useState('');
  const [覚え書き, 覚え書きを置く] = React.useState('');
  // 入力欄には # を付けずに出す（空白区切り。読むときに normalizeTag で # を付ける）
  const [タグの文, タグの文を置く] = React.useState(currentSessionTags.map(タグの見た目).join(' '));
  const [統計を聞いている, 統計を聞いているを置く] = React.useState(false);
  // タグの候補の並びは横に流す。パソコンでは車を回しても動かなかったので、横に読み替える
  const 定型文の横流し = use横流し();
  React.useEffect(() => {
    // 開いたとき、この盤面でまだなら「いつも付けるタグ」を入れる（設定で選んだもの。外せば外れる）
    if (visible) useScoreStore.getState().いつものタグを入れる();
    タグの文を置く((useScoreStore.getState().currentSessionTags || []).map(タグの見た目).join(' '));
    // 開いたときだけ。タグが変わるたびに書き直すと、打ちかけ（「#」だけ・後ろの空白）が消えて次のタグを打てなかった
  }, [visible]);
  // 欄に打って置いたタグ。店から戻ってきたのがこれなら、欄は打ったままにする
  const 欄から置いたタグ = React.useRef(null);
  React.useEffect(() => {
    // 候補を押したなど、欄の外でタグが変わったときだけ欄を書き直す（打っている途中の字はそのまま）。
    // 欄の字と比べると、WebKit では店の変わりが欄の字より先に届き、打った字を消していた
    if (欄から置いたタグ.current && 同じ並び(欄から置いたタグ.current, currentSessionTags)) return;
    タグの文を置く(currentSessionTags.map(タグの見た目).join(' '));
  }, [currentSessionTags]);
  // 続けて押されても 1 回だけ保存する（窓が閉じる描き直しの前に 2 回目が届くと、保存が 2 回走る）。
  // 開き直したら、また押せる
  const 保存した = React.useRef(false);
  React.useEffect(() => {
    if (visible) 保存した.current = false;
  }, [visible]);
  const 保存する = (統計に入れる) => {
    if (保存した.current) return;
    保存した.current = true;
    setIncludeInStats(統計に入れる);
    onSave(題.trim(), 覚え書き.trim(), 統計に入れる, currentSessionTags.join(' '));
    題を置く('');
    覚え書きを置く('');
    統計を聞いているを置く(false);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                style={[styles.mainSaveBtn, { backgroundColor: 色.赤 }]}
                onPress={() => 保存する(false)}
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
                  aria-label="大会名・練習名"
                  style={styles.input}
                  placeholder="大会名・練習名（例: ○○大会）"
                  placeholderTextColor={色.灰_薄い}
                  value={題}
                  onChangeText={題を置く}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  aria-label="練習メモ"
                  style={styles.input}
                  placeholder="練習メモ（例: 合宿1日目）"
                  placeholderTextColor={色.灰_薄い}
                  value={覚え書き}
                  onChangeText={覚え書きを置く}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.tagsAreaContainer}>
                <TextInput
                  aria-label="タグ"
                  style={styles.input}
                  placeholder="タグ（例: 審査前 雨天）"
                  placeholderTextColor={色.灰_薄い}
                  value={タグの文}
                  onChangeText={(文) => {
                    const タグたち = 欄のタグ(文);
                    欄から置いたタグ.current = タグたち;
                    タグの文を置く(文);
                    setCurrentSessionTags(タグたち);
                  }}
                  returnKeyType="done"
                />
                <ScrollView
                  ref={定型文の横流し}
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
                        onPress={() => toggleCurrentSessionTag(整えた)}
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
              <TouchableOpacity style={styles.mainSaveBtn} onPress={() => 保存する(true)}>
                <Text style={styles.mainSaveTxt}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => 統計を聞いているを置く(true)}>
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
    { width: '100%', maxWidth: 400, backgroundColor: 色.白, borderRadius: 14, padding: 20 },
    getShadowStyle({ shadowColor: 色.黒, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 })
  ),
  headerTitle: { fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subTitle: { fontSize: 13, color: 色.灰, textAlign: 'center', marginBottom: 16 },
  inputContainer: { marginBottom: 10 },
  tagsAreaContainer: { marginBottom: 8 },
  input: {
    backgroundColor: 色.地,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: 色.黒,
  },
  presetTagsScroll: { marginTop: 8 },
  presetTagsContainer: { paddingRight: 10, gap: 8, flexDirection: 'row' },
  presetTagBtn: {
    backgroundColor: 色.地,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 色.地_濃い,
  },
  presetTagBtnActive: { backgroundColor: 色.青, borderColor: 色.青 },
  presetTagTxt: { fontSize: 13, color: 色.墨_66 },
  presetTagTxtActive: { color: 色.白, fontWeight: 'bold' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: 色.地_濃い, marginVertical: 10 },
  mainSaveBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 色.青,
    marginBottom: 8,
  },
  mainSaveTxt: { color: 色.白, fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 色.地,
    marginBottom: 8,
  },
  secondaryTxt: { color: 色.赤, fontWeight: '600', fontSize: 15 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: 色.地 },
  cancelTxt: { color: 色.青, fontWeight: '600', fontSize: 16 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.SaveSessionModal = SaveSessionModal;
