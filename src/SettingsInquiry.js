'use strict';

const { 色 } = require('./iro.js');
const React = require('react');
const {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Image,
} = require('./rn');
const { IS_IOS, IS_WEB } = require('./IS_WEB');
// 見た目の決まりは設定画面と同じ
const { styles } = require('./settingsStyles');
// 画面が使う項目だけを購読する（ストア全体だと、ますを押すたびに裏のタブまで描き直す）
const { useストアの一部 } = require('./storeSlice');
const Icons = require('@expo/vector-icons');
const { use横流し } = require('./yokoNagashi');
const { db } = require('./db');
const Firestore = require('firebase/firestore');
const ExpoImagePicker = require('expo-image-picker');
const _IM = require('expo-image-manipulator');

// 付けられる写真は 3 枚まで。1 枚は文字に直して 30 万字まで（3 枚でも Firestore の 1 件 1MiB に収まる）
const 写真の枚数の上限 = 3;
const 写真の字数の上限 = 300000;
// 窓の見た目（設定の modalContent）から、中身の並べ方（alignItems）を外したもの。この窓は ScrollView で、
// 中身の並べ方は contentContainerStyle でしか受け取らない（style に入れると開発のときに落ちる。本番は通る）
const { alignItems: _中身の並べ方, ...流す窓の形 } = StyleSheet.flatten(styles.modalContent);

/**
 * 設定画面の「お問い合わせ」の窓（2026-10-05 に SettingsScreen.js から切り出した）。
 * メールアドレス（任意）・内容・写真（縮めて文字に直す）を Firestore の inquiries に書く。
 * 書きかけの文と写真は窓の中で持つ。外を押して閉じたときは残り、キャンセルと送ったあとは空にする
 */
const 問い合わせの窓 = ({ 見える, 閉じる }) => {
  const { activeGroupId, activeGroupName, activeRole, myMemberId, myMemberName } = useストアの一部([
    'activeGroupId',
    'activeGroupName',
    'activeRole',
    'myMemberId',
    'myMemberName',
  ]);
  const [inquiryEmail, setInquiryEmail] = React.useState('');
  const [inquiryContent, setInquiryContent] = React.useState('');
  const [inquirySending, setInquirySending] = React.useState(false);
  const [inquiryImages, setInquiryImages] = React.useState([]);
  // 付ける写真の並びは横に流す。パソコンの車の動きは横に読み替える（src/yokoNagashi.js）
  const 写真の横流し = use横流し();
  const 空にして閉じる = () => {
    閉じる();
    setInquiryEmail('');
    setInquiryContent('');
    setInquiryImages([]);
  };
  const pickInquiryImage = async () => {
    try {
      if (inquiryImages.length >= 写真の枚数の上限) {
        Alert.alert('エラー', '画像は最大3枚まで添付できます。');
        return;
      }
      const perm = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('エラー', '画像ライブラリへのアクセスが許可されていません。');
        return;
      }
      const res = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions ? ExpoImagePicker.MediaTypeOptions.Images : ['images'],
        quality: 0.8,
      });
      if (res.canceled || !res.assets || !res.assets.length) return;
      const asset = res.assets[0];
      // 上限の字数に収まるまで、幅と画質を下げて縮め直す（5 回まで）
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
        if (!base64 || base64.length <= 写真の字数の上限) break;
        width = Math.round(width * 0.75);
        quality = Math.max(0.3, quality - 0.1);
      }
      if (!base64) {
        Alert.alert('エラー', '画像の読み込みに失敗しました。');
        return;
      }
      if (base64.length > 写真の字数の上限) {
        Alert.alert(
          'エラー',
          '画像サイズが大きすぎます。別の画像（より小さいサイズ・低解像度）を選んでください。'
        );
        return;
      }
      setInquiryImages((prev) => [...prev, `data:image/jpeg;base64,${base64}`]);
    } catch (誤り) {
      console.error('[Settings] Inquiry image pick error:', 誤り);
    }
  };
  const 送る = async () => {
    const メール = inquiryEmail.trim();
    // メールアドレスは任意。書いていないことより、
    // 困っていることが伝わらないままになるほうが困る
    if (メール && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(メール)) {
      Alert.alert('エラー', 'メールアドレスの形が正しくありません。空のままでも送れます');
      return;
    }
    if (!inquiryContent.trim()) {
      Alert.alert('エラー', 'お問い合わせ内容を入力してください');
      return;
    }
    setInquirySending(true);
    try {
      await Firestore.addDoc(Firestore.collection(db, 'inquiries'), {
        email: メール,
        content: inquiryContent,
        imagesBase64: inquiryImages,
        createdAt: new Date(),
        groupId: activeGroupId || '',
        groupName: activeGroupName || '',
        role: activeRole || '',
        memberId: activeRole === 'member' ? myMemberId || '' : '',
        memberName: activeRole === 'member' ? myMemberName || '' : '',
      });
      Alert.alert('完了', 'お問い合わせを送信しました');
      空にして閉じる();
    } catch (err) {
      console.error('Inquiry send error:', err);
      Alert.alert('エラー', '送信に失敗しました。再度お試しください。');
    } finally {
      setInquirySending(false);
    }
  };
  return (
    <Modal
      visible={見える}
      transparent
      animationType="fade"
      onRequestClose={() => !inquirySending && 閉じる()}
    >
      {/* スマホで本文の欄を押すとキーボードが出て、下の「送信」 */
      /* 「キャンセル」が隠れる。窓ごと持ち上げ、中身は流せるようにする。 */
      /* keyboardShouldPersistTaps を handled にしないと、キーボードが */
      /* 出ているあいだ、ボタンを押しても1回目は閉じるだけで終わる */}
      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !inquirySending && 閉じる()}
          />
          <ScrollView // 流すので高さの上限が要る。無いと中身のぶんだけ
            // 伸びて、キーボードに押し上げてもボタンが画面の外へ出る
            style={[流す窓の形, { maxHeight: '80%', flexGrow: 0 }]}
            contentContainerStyle={{ alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>お問い合わせ</Text>
            <Text style={{ fontSize: 13, color: 色.灰, marginBottom: 12, textAlign: 'center' }}>
              開発者へお問い合わせを送信します
            </Text>
            <Text style={{ fontSize: 12, color: 色.灰, marginBottom: 10, lineHeight: 17 }}>
              メールアドレスは書かなくても送れます。書いていただくと、こちらから返事ができます。
            </Text>
            <TextInput
              aria-label="メールアドレス（任意）"
              autoComplete="email"
              style={[styles.filterInput, { width: '100%', marginBottom: 10 }]}
              placeholder="メールアドレス（任意）"
              value={inquiryEmail}
              onChangeText={setInquiryEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!inquirySending}
            />
            <TextInput
              aria-label="お問い合わせ内容"
              style={[
                styles.filterInput,
                { width: '100%', marginBottom: 15, height: 120, textAlignVertical: 'top' },
              ]}
              placeholder="お問い合わせ内容"
              value={inquiryContent}
              onChangeText={setInquiryContent}
              multiline
              editable={!inquirySending}
            />
            {inquiryImages.length > 0 ? (
              <ScrollView
                ref={写真の横流し}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ width: '100%', marginBottom: 10 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {inquiryImages.map((uri, idx) => (
                  <View key={`inquiry-img-${idx}`} style={{ width: 100, height: 100, position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: 色.地 }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => setInquiryImages((prev) => prev.filter((_, 番) => 番 !== idx))}
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
                      <Icons.Ionicons name="close" size={14} color={色.白} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {inquiryImages.length < 写真の枚数の上限 ? (
              <Pressable
                onPress={pickInquiryImage}
                disabled={inquirySending}
                style={({ hovered }) => [
                  {
                    width: '100%',
                    marginBottom: 15,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: 色.区切り,
                    borderStyle: 'dashed',
                    borderRadius: 8,
                    paddingVertical: 12,
                  },
                  hovered && { backgroundColor: 色.地 },
                  IS_WEB && { cursor: 'pointer' },
                ]}
              >
                <Icons.Ionicons name="image-outline" size={18} color={色.灰} />
                <Text style={{ fontSize: 13, color: 色.灰 }}>
                  {inquiryImages.length > 0 ? '画像を追加（任意・最大3枚）' : '画像を添付（任意・最大3枚）'}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: 色.地, flex: 1, marginRight: 5 },
                  hovered && { backgroundColor: 色.地_濃い },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={空にして閉じる}
                disabled={inquirySending}
              >
                <Text style={[styles.modalBtnText, { color: 色.青 }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: 色.橙, flex: 1, marginLeft: 5 },
                  hovered && { backgroundColor: 色.橙_押した },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={送る}
                disabled={inquirySending}
              >
                <Text style={[styles.modalBtnText, { color: 色.白 }]}>
                  {inquirySending ? '送信中...' : '送信'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

module.exports = { 問い合わせの窓 };
