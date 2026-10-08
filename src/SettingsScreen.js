'use strict';

const themeMod = require('./theme');
const React = require('react');
const {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Pressable,
} = require('./rn');
const { IS_WEB } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
// 見た目の決まりは、切り出した窓と分け合うので別のファイル（2026-10-05）
const { styles } = require('./settingsStyles');
// 画面が使う項目だけを購読する（ストア全体だと、ますを押すたびに裏のタブまで描き直す）
const { useストアの一部 } = require('./storeSlice');
const 規則 = require('./syncRules');
const 案内 = require('./TutorialGuide');
const Icons = require('@expo/vector-icons');
const ReactNativeSafeAreaContext = require('react-native-safe-area-context');
// 書き出しの窓（期間・形・絞り込み・CSV と Excel）は別のファイル（2026-10-05）
const { データの書き出し窓 } = require('./SettingsExport');
// お問い合わせの窓も別のファイル（2026-10-05）
const { 問い合わせの窓 } = require('./SettingsInquiry');
const { auth, db } = require('./db');
const FirebaseAuth = require('firebase/auth');
const Firestore = require('firebase/firestore');
// ログアウトの確認の文言は src/logoutPrompt.js にある（画面を動かさずに
// 出し分けを検査できるようにするため）
const {
  logoutMessage: ログアウトの文言,
  logoutButtonLabel: ログアウトのボタン名,
  logoutButtonsDisabled: ログアウトのボタンを止める,
  shouldTrySendFirst: 先に送信すべきか,
} = require('./logoutPrompt');

const SettingsScreen = () => {
  const { mode: themeMode, setThemeMode: setThemeModeFn } = themeMod.useThemeMode();
  const {
    currentFreshmanTerm = 1,
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
    自動ロックする,
    set自動ロックする,
    保存時に出欠を確認する = true,
    set保存時に出欠を確認する,
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
  } = useストアの一部([
    'currentFreshmanTerm',
    'trash',
    'shotsPerRound',
    'updateCurrentFreshmanTerm',
    'syncStatus',
    'lastSyncTime',
    'isNetworkOnline',
    'syncAllToCloud',
    'activeGroupId',
    'activeGroupName',
    'updateGroupName',
    'activeRole',
    'myMemberId',
    'myMemberName',
    'members',
    'setAuth',
    'isAdminMode',
    '自動ロックする',
    'set自動ロックする',
    '保存時に出欠を確認する',
    'set保存時に出欠を確認する',
    'setAdminMode',
    'verifyGroupPassword',
    'deleteGroupAccount',
    'tagTemplates',
    'addTagTemplate',
    'removeTagTemplate',
    'autoPromotionEnabled',
    'setAutoPromotionEnabled',
    'enableArrowLocation',
    'arrowTargetType',
    'setEnableArrowLocation',
    'setArrowTargetType',
  ]);
  const [書き出しの窓, 書き出しの窓を出す] = React.useState(false);
  const [ガイドの窓, ガイドの窓を出す] = React.useState(false);
  const [ログアウトの窓, ログアウトの窓を出す] = React.useState(false);
  const // ログアウトの確認の段階。'確認' → '送信中' → '送信済み' / '失敗'
    [ログアウトの段階, ログアウトの段階を設定] = React.useState('確認');
  const [残った未送信, 残った未送信を設定] = React.useState(0);
  const [タグの下書き, タグの下書きを置く] = React.useState('');
  const [管理者の合言葉の窓, 管理者の合言葉の窓を出す] = React.useState(false);
  const [管理者の合言葉, 管理者の合言葉を置く] = React.useState('');
  const [合言葉を確かめ中, 合言葉を確かめ中を置く] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const // アカウントの削除。窓の開閉・入れたパスワード・消している最中の段階
    [削除の窓, 削除の窓を開く] = React.useState(false);
  const [削除の合言葉, 削除の合言葉を設定] = React.useState('');
  const [削除の段階, 削除の段階を設定] = React.useState('');
  const [削除の失敗, 削除の失敗を設定] = React.useState('');
  const [inquiryVisible, setInquiryVisible] = React.useState(false);
  const 節 = (題, 中身) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{題}</Text>
      <View style={styles.sectionContainer}>{中身}</View>
    </View>
  );
  const 行 = (絵, 題, 押したとき, 色 = '#007AFF', 右の中身, 赤字 = false) => (
    <Pressable // 使い方の案内が指す先。行の名前をそのまま目印にする
      ref={(node) => 案内.setTutorialTargetNode(`設定.${題}`, node)}
      style={({ hovered }) => [
        styles.item,
        hovered && styles.hovered,
        IS_WEB && !!押したとき && { cursor: 'pointer' },
      ]}
      onPress={押したとき}
      disabled={!押したとき}
    >
      <View style={styles.itemLeft}>
        <Icons.Ionicons name={絵} size={22} color={色} style={styles.itemIcon} />
        <Text style={[styles.itemText, 赤字 && { color: '#FF3B30' }]}>{題}</Text>
      </View>
      <View style={styles.itemRight}>
        {右の中身 || <Icons.Ionicons name="chevron-forward" size={18} color="#C6C6C8" />}
      </View>
    </Pressable>
  );
  return (
    <ReactNativeSafeAreaContext.SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>設定</Text>
        {節(
          'アカウント',
          <>
            <View style={[styles.item, styles.itemStack]}>
              <View style={styles.itemLeft}>
                <Icons.Ionicons name="business-outline" size={22} color="#007AFF" style={styles.itemIcon} />
                <Text style={styles.itemText}>団体ID / 団体名</Text>
              </View>
              <Text style={[styles.timestamp, styles.timestampStack]}>
                {activeGroupId || '---'}
                {' / '}
                {activeGroupName || '未設定'}
              </Text>
            </View>
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Icons.Ionicons name="person-outline" size={22} color="#5856D6" style={styles.itemIcon} />
                <Text style={styles.itemText}>ログイン種別</Text>
              </View>
              <Text style={styles.timestamp}>
                {'group' === activeRole
                  ? '団体アカウント'
                  : `メンバー (${(() => {
                      const 自分 = members.find((部員) => 部員.id === myMemberId);
                      return 自分?.personalId
                        ? `ID: ${自分.personalId} / ${自分.name || myMemberName || ''}`
                        : myMemberName || myMemberId || '---';
                    })()})`}
              </Text>
            </View>
            {/* 初めての人向けの案内。初回は自動で出るが、ここからいつでも見返せる。 */
            /* ライブ中は始めない（案内中の書き換えが全員の画面に流れてしまう） */}
            {行('school-outline', '使い方を見る', () => {
              if ('ライブ中' === 案内.startTutorial()) {
                const 文 = 'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。';
                Alert.alert('使い方を見る', 文);
              }
            })}
            {行('help-circle-outline', '運用ガイド・ヘルプ', () => ガイドの窓を出す(true))}
            {行(
              'log-out-outline',
              'ログアウト',
              () => {
                // ログアウトは手元の記録を全部捨てるので、送れていないものが
                // 何件あるかを先に数えて確認に出す。送信するかどうかは
                // 利用者が押してから
                残った未送信を設定(useScoreStore.getState().countUnsynced());
                ログアウトの段階を設定('確認');
                ログアウトの窓を出す(true);
              },
              '#FF3B30',
              null,
              true
            )}
            {/* 団体アカウントで、管理者モードのときだけ出す。押すと警告の窓へ */}
            {'group' === activeRole &&
              isAdminMode &&
              行(
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
        {節(
          '表示',
          <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={[styles.itemLeft, { marginBottom: 10 }]}>
              <Icons.Ionicons name="contrast-outline" size={22} color="#5856D6" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.itemText}>外観</Text>
                <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                  画面全体の配色を切り替えます
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
              <TouchableOpacity
                style={[styles.radioBtn, themeMode === 'light' && styles.radioBtnActive]}
                onPress={() => setThemeModeFn('light')}
              >
                <Text style={[styles.radioBtnText, themeMode === 'light' && styles.radioBtnTextActive]}>
                  ライト
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioBtn, themeMode === 'dark' && styles.radioBtnActive]}
                onPress={() => setThemeModeFn('dark')}
              >
                <Text style={[styles.radioBtnText, themeMode === 'dark' && styles.radioBtnTextActive]}>
                  ダーク
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioBtn, themeMode === 'system' && styles.radioBtnActive]}
                onPress={() => setThemeModeFn('system')}
              >
                <Text style={[styles.radioBtnText, themeMode === 'system' && styles.radioBtnTextActive]}>
                  端末に合わせる
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {'member' !== activeRole &&
          節(
            '基本設定',
            <>
              {'group' === activeRole && (
                <View style={styles.item}>
                  <View style={[styles.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons
                      name="business-outline"
                      size={22}
                      color="#007AFF"
                      style={styles.itemIcon}
                    />
                    <Text style={styles.itemText}>
                      {'団体ID: '}
                      {activeGroupId}
                    </Text>
                  </View>
                </View>
              )}
              {'group' === activeRole && (
                <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={[styles.itemLeft, { marginBottom: 8 }]}>
                    <Icons.Ionicons name="pencil-outline" size={22} color="#007AFF" style={styles.itemIcon} />
                    <Text style={styles.itemText}>団体名</Text>
                  </View>
                  <TextInput
                    aria-label="団体名"
                    style={styles.filterInput}
                    placeholder="団体名を入力"
                    value={activeGroupName || ''}
                    onChangeText={updateGroupName}
                  />
                </View>
              )}
              {'group' === activeRole && (
                <View style={styles.item}>
                  <View style={[styles.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons
                      name="sparkles-outline"
                      size={22}
                      color="#5856D6"
                      style={styles.itemIcon}
                    />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.itemText}>4月1日の自動進級</Text>
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
                <View style={styles.item}>
                  <View style={[styles.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons name="school-outline" size={22} color="#AF52DE" style={styles.itemIcon} />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.itemText}>現在の期 (新入生)</Text>
                      <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                        新入生（1年生）が何期生にあたるかを設定します
                      </Text>
                    </View>
                  </View>
                  <View style={styles.stepperContainer}>
                    <TextInput
                      aria-label="新入生の期"
                      style={[styles.stepperValue, { width: 40, textAlign: 'center', padding: 0 }]}
                      value={String(currentFreshmanTerm)}
                      onChangeText={(文) => {
                        const 数 = parseInt(文.replace(/[^0-9]/g, ''));
                        isNaN(数) ? '' === 文 && updateCurrentFreshmanTerm(0) : updateCurrentFreshmanTerm(数);
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={{ fontSize: 14, color: '#8E8E93', marginRight: 8 }}>期</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        style={({ hovered }) => [
                          styles.stepperBtn,
                          hovered && { backgroundColor: '#D1D1D6' },
                        ]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="減らす"
                        aria-label="減らす"
                        onPress={() => updateCurrentFreshmanTerm(Math.max(1, currentFreshmanTerm - 1))}
                      >
                        <Icons.Ionicons name="remove" size={20} color="#007AFF" />
                      </Pressable>
                      <View style={styles.stepperDivider} />
                      <Pressable
                        style={({ hovered }) => [
                          styles.stepperBtn,
                          hovered && { backgroundColor: '#D1D1D6' },
                        ]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
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
                <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View style={styles.itemLeft}>
                      <Icons.Ionicons
                        name="pricetags-outline"
                        size={22}
                        color="#FF9500"
                        style={styles.itemIcon}
                      />
                      <Text style={styles.itemText}>タグの定型文</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {tagTemplates.map((タグ) => (
                      <View
                        key={`template-${タグ}`}
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
                          {規則.タグの見た目(タグ)}
                        </Text>
                        <Pressable // 絵だけのボタン。どのタグを消すのかまで読ませる
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel={規則.タグの見た目(タグ) + ' を消す'}
                          aria-label={タグ + ' を消す'}
                          onPress={() => removeTagTemplate(タグ)}
                          style={({ hovered }) => [
                            hovered && { opacity: 0.7 },
                            IS_WEB && { cursor: 'pointer' },
                          ]}
                        >
                          <Icons.Ionicons name="close-circle" size={18} color="#8E8E93" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      aria-label="新しいタグ"
                      style={[styles.filterInput, { flex: 1, paddingVertical: 8 }]}
                      placeholder="新しいタグを追加"
                      value={タグの下書き}
                      onChangeText={タグの下書きを置く}
                      onSubmitEditing={() => {
                        タグの下書き.trim() &&
                          (addTagTemplate(
                            タグの下書き.trim().startsWith('#')
                              ? タグの下書き.trim()
                              : `#${タグの下書き.trim()}`
                          ),
                          タグの下書きを置く(''));
                      }}
                    />
                    <Pressable
                      style={({ hovered }) => [
                        {
                          backgroundColor: '#007AFF',
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          justifyContent: 'center',
                        },
                        hovered && { backgroundColor: '#0062CC' },
                        IS_WEB && { cursor: 'pointer' },
                      ]}
                      onPress={() => {
                        タグの下書き.trim() &&
                          (addTagTemplate(
                            タグの下書き.trim().startsWith('#')
                              ? タグの下書き.trim()
                              : `#${タグの下書き.trim()}`
                          ),
                          タグの下書きを置く(''));
                      }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>追加</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        {節(
          '入力の保護',
          <View ref={(node) => 案内.setTutorialTargetNode('設定.自動ロック', node)} style={styles.item}>
            <View style={[styles.itemLeft, { flex: 1 }]}>
              <Icons.Ionicons name="lock-closed-outline" size={22} color="#34C759" style={styles.itemIcon} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.itemText}>入れたマスを自動でロック</Text>
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
        {節(
          '保存のしかた',
          <View style={styles.item}>
            <View style={[styles.itemLeft, { flex: 1 }]}>
              <Icons.Ionicons name="checkbox-outline" size={22} color="#34C759" style={styles.itemIcon} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.itemText}>保存のときに出欠を確認する</Text>
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
        {節(
          '矢所の記録',
          <>
            <View // 使い方の案内が指す先。この行は Je() を通らない作りなので、
              // ここで直接登録する
              ref={(node) => 案内.setTutorialTargetNode('設定.矢所の記録機能を有効化', node)}
              style={styles.item}
            >
              <View style={[styles.itemLeft, { flex: 1 }]}>
                <Icons.Ionicons name="location-outline" size={22} color="#34C759" style={styles.itemIcon} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemText}>矢所の記録機能を有効化</Text>
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
              <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={[styles.itemLeft, { marginBottom: 8 }]}>
                  <Icons.Ionicons name="disc-outline" size={22} color="#34C759" style={styles.itemIcon} />
                  <Text style={styles.itemText}>使用する的の種類</Text>
                </View>
                <View style={styles.flexRow}>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('kasumi36')}
                    style={[styles.radioBtn, 'kasumi36' === arrowTargetType && styles.radioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.radioBtnText,
                        'kasumi36' === arrowTargetType && styles.radioBtnTextActive,
                      ]}
                    >
                      霞的
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('hoshi36')}
                    style={[styles.radioBtn, 'hoshi36' === arrowTargetType && styles.radioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.radioBtnText,
                        'hoshi36' === arrowTargetType && styles.radioBtnTextActive,
                      ]}
                    >
                      星的
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('hoshi24')}
                    style={[styles.radioBtn, 'hoshi24' === arrowTargetType && styles.radioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.radioBtnText,
                        'hoshi24' === arrowTargetType && styles.radioBtnTextActive,
                      ]}
                    >
                      星的(八寸)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
        {'member' !== activeRole &&
          節(
            '管理者設定',
            <View
              style={styles.item} // 使い方の案内から指せるように登録する
              ref={(node) => 案内.setTutorialTargetNode('設定.管理者モード', node)}
            >
              <View style={[styles.itemLeft, { flex: 1 }]}>
                <Icons.Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#FF3B30"
                  style={styles.itemIcon}
                />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemText}>管理者モード</Text>
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
                onValueChange={async (入れる) => {
                  入れる ? (管理者の合言葉を置く(''), 管理者の合言葉の窓を出す(true)) : setAdminMode(false);
                }}
                trackColor={{ false: '#D1D1D6', true: '#FF3B30' }}
              />
            </View>
          )}
        {節(
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
            {行(
              'share-outline',
              'データをExcel形式で書き出し',
              async () => {
                書き出しの窓を出す(true);
              },
              '#34C759'
            )}
            {行('mail-outline', 'お問い合わせ', () => setInquiryVisible(true), '#FF9500')}
            <Pressable
              style={({ hovered }) => [
                styles.item,
                hovered && styles.hovered,
                IS_WEB && { cursor: 'pointer' },
              ]}
              onPress={syncAllToCloud}
            >
              <View style={styles.itemLeft}>
                <Icons.Ionicons
                  name="cloud-upload-outline"
                  size={22}
                  color="#5856D6"
                  style={styles.itemIcon}
                />
                <Text style={styles.itemText}>クラウドへ同期</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.timestamp}>
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
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 2.0.0 (Expo SQLite/Firebase)</Text>
          <Text style={styles.statusText}>
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
            <Text style={styles.legalText}>利用規約・プライバシーポリシー</Text>
          </Pressable>
        </View>
      </ScrollView>
      <データの書き出し窓 見える={書き出しの窓} 閉じる={() => 書き出しの窓を出す(false)} />
      <Modal
        visible={削除の窓}
        transparent
        animationType="fade"
        onRequestClose={() => !削除の段階 && 削除の窓を開く(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !削除の段階 && 削除の窓を開く(false)}
          />
          {/* 説明が長いので流せるようにする。横向きのスマホでは「キャンセル」に届かなかった（2026-09-26） */}
          <View style={[styles.modalContent, { maxHeight: '90%', padding: 0 }]}>
            <ScrollView
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ padding: 20, alignItems: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.modalTitle, { color: '#FF3B30' }]}>アカウントを削除する</Text>
              <Text style={[styles.modalMessage, { textAlign: 'left' }]}>
                {`団体「${activeGroupName || activeGroupId || ''}」のアカウントを削除します。\n\n` +
                  '・記録・部員・卒業生・ゴミ箱・設定がすべて消え、団体IDでログインできなくなります。\n' +
                  '・部員も、この団体には入れなくなります。\n' +
                  '・削除後30日間は復旧のために運営者が保管し、その後に消去します。この画面から戻すことはできません。\n' +
                  '・必要な記録は、先に「データ管理」から書き出してください。\n\n' +
                  '続けるには団体パスワードを入力してください。'}
              </Text>
              <View
                style={[
                  styles.filterInput,
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
                  aria-label="団体パスワード"
                  autoComplete="current-password"
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
              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={({ hovered }) => [
                    styles.modalBtn,
                    { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                    hovered && { backgroundColor: '#E5E5EA' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                  onPress={() => 削除の窓を開く(false)}
                  disabled={!!削除の段階}
                >
                  <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
                </Pressable>
                <Pressable
                  style={({ hovered }) => [
                    styles.modalBtn,
                    { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                    hovered && { backgroundColor: '#D70015' },
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
                    } catch (誤り) {
                      // 口座はもう無いので、ここで失敗しても構わない
                    }
                    setAuth(null, null, null, null);
                    Alert.alert(
                      '削除しました',
                      '団体アカウントを削除しました。ご利用ありがとうございました。'
                    );
                  }}
                  disabled={!!削除の段階 || !削除の合言葉}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                    {削除の段階 ? '削除中…' : '削除する'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={管理者の合言葉の窓}
        transparent
        animationType="fade"
        onRequestClose={() => 管理者の合言葉の窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !合言葉を確かめ中 && 管理者の合言葉の窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>管理者認証</Text>
            <Text style={styles.modalMessage}>団体パスワードを入力してください</Text>
            <View
              style={[
                styles.filterInput,
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
                aria-label="管理者モードのパスワード"
                style={{ flex: 1, height: 48, fontSize: 16 }}
                placeholder="パスワード"
                secureTextEntry={!showPw}
                value={管理者の合言葉}
                onChangeText={管理者の合言葉を置く}
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
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={() => 管理者の合言葉の窓を出す(false)}
                disabled={合言葉を確かめ中}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                  hovered && { backgroundColor: '#0062CC' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={async () => {
                  if (管理者の合言葉) {
                    合言葉を確かめ中を置く(true);
                    try {
                      (await verifyGroupPassword(管理者の合言葉))
                        ? (setAdminMode(true), 管理者の合言葉の窓を出す(false), 管理者の合言葉を置く(''))
                        : Alert.alert('エラー', 'パスワードが正しくありません。');
                    } catch (誤り) {
                      Alert.alert('エラー', '認証に失敗しました。');
                    } finally {
                      合言葉を確かめ中を置く(false);
                    }
                  }
                }}
                disabled={合言葉を確かめ中 || !管理者の合言葉}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                  {合言葉を確かめ中 ? '認証中...' : '認証'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={ログアウトの窓}
        transparent
        animationType="fade"
        onRequestClose={() => ログアウトの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => ログアウトの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ログアウト</Text>
            <Text style={styles.modalMessage}>{ログアウトの文言(ログアウトの段階, 残った未送信)}</Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                  ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                ]}
                disabled={ログアウトのボタンを止める(ログアウトの段階)}
                onPress={() => ログアウトの窓を出す(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  hovered && { backgroundColor: '#D63027' },
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
                    } catch (誤り) {
                      残り = useScoreStore.getState().countUnsynced();
                    }
                    残った未送信を設定(残り);
                    if (残り > 0) return void ログアウトの段階を設定('失敗');
                    ログアウトの段階を設定('送信済み');
                    await new Promise((解く) => setTimeout(解く, 900));
                  }
                  ログアウトの窓を出す(false);
                  try {
                    if ('member' === activeRole && auth.currentUser) {
                      await Firestore.deleteDoc(
                        Firestore.doc(db, 'member_claims', auth.currentUser.uid)
                      ).catch(() => {});
                      // 匿名の口座も消す。証を消して出るだけだと、誰のものでもない口座が
                      // 認証に溜まる（2026-09-24 に本番で 164 人。scripts/prune-anonymous-users.mjs）。
                      // 入ってから日が経つと「入り直しが要る」で断られるので、そのときは出るだけ
                      if (auth.currentUser && auth.currentUser.isAnonymous) {
                        await FirebaseAuth.deleteUser(auth.currentUser).catch(() => {});
                      }
                    }
                    await FirebaseAuth.signOut(auth);
                    setAuth(null, null, null, null);
                  } catch (誤り) {
                    console.error('Logout error:', 誤り);
                  }
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                  {ログアウトのボタン名(ログアウトの段階, 残った未送信)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={ガイドの窓}
        transparent
        animationType="fade"
        onRequestClose={() => ガイドの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => ガイドの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>運用ガイド</Text>
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
                ・登録メールアドレスは、ログイン画面の「メールアドレスを忘れた」から変えられます。新しいアドレスに届く確認のメールのリンクを開くと切り替わります。
              </Text>
            </View>
            <Pressable
              style={({ hovered }) => [
                styles.modalBtn,
                { backgroundColor: '#F2F2F7', width: '100%' },
                hovered && { backgroundColor: '#E5E5EA' },
                IS_WEB && { cursor: 'pointer' },
              ]}
              onPress={() => ガイドの窓を出す(false)}
            >
              <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <問い合わせの窓 見える={inquiryVisible} 閉じる={() => setInquiryVisible(false)} />
    </ReactNativeSafeAreaContext.SafeAreaView>
  );
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.SettingsScreen = SettingsScreen;
