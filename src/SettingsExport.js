'use strict';

const { 色 } = require('./iro.js');
// 記録の選び方とシートの組み方は src/kakidashiNoHyou.js（数え方は分析画面と同じ statsRules）
const { 書き出しのシートを作る, 自分の分がある記録か, csvDate } = require('./kakidashiNoHyou');
const _xlsx = require('./excelExport');
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
} = require('./rn');
const { IS_WEB } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
const 学 = require('./gakunen');
// 見た目の決まりは設定画面と同じ
const { styles } = require('./settingsStyles');
// 画面が使う項目だけを購読する（ストア全体だと、ますを押すたびに裏のタブまで描き直す）
const { useストアの一部 } = require('./storeSlice');
const Icons = require('@expo/vector-icons');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const { use横流し } = require('./yokoNagashi');

/** 窓のボタンの形。上に乗せると地が濃くなる */
const ボタンの形 =
  (地, 乗せた地, 足す) =>
  ({ hovered }) => [
    styles.modalBtn,
    { backgroundColor: 地 },
    足す,
    hovered && { backgroundColor: 乗せた地 },
    IS_WEB && { cursor: 'pointer' },
  ];

/** 選べる候補の札を横に並べる（題・メンバー名）。押すと選ぶ／外す。選んでいれば「選択をクリア」も出す */
const 候補の並び = ({ 候補, 選んだもの, 選んだものを置く, 流しの手, 鍵の頭 }) => (
  <>
    {候補.length > 0 && (
      <ScrollView
        ref={流しの手}
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        style={[styles.suggestionsContainer, IS_WEB && { overflowX: 'auto' }]}
      >
        {候補.map((字) => {
          const 選択中 = 選んだもの.includes(字);
          return (
            <TouchableOpacity
              key={`${鍵の頭}-${字}`}
              onPress={() =>
                選んだものを置く((今の) =>
                  今の.includes(字) ? 今の.filter((一つ) => 一つ !== 字) : [...今の, 字]
                )
              }
              style={[styles.suggestionChip, 選択中 && { backgroundColor: 色.青 }]}
            >
              <Text style={[styles.suggestionText, 選択中 && { color: 色.白 }]}>{字}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    )}
    {選んだもの.length > 0 && (
      <TouchableOpacity
        onPress={() => 選んだものを置く([])}
        style={{ marginTop: 4, alignSelf: 'flex-start' }}
      >
        <Text style={{ fontSize: 12, color: 色.青 }}>選択をクリア</Text>
      </TouchableOpacity>
    )}
  </>
);

/**
 * 設定画面の「書き出し」の窓（2026-10-05 に SettingsScreen.js から切り出した）。
 * 年度・すべて・詳しい条件（期間・形（標準／印刷向け）・タグ・言葉・メンバー名）で選び、Excel で書き出す。
 * 個人ログインでは自分の分だけ
 */
const データの書き出し窓 = ({ 見える, 閉じる }) => {
  const {
    activeRole,
    myMemberId,
    myMemberName,
    alumni = [],
    members = [],
    sessions: sList = [],
  } = useストアの一部(['activeRole', 'myMemberId', 'myMemberName', 'alumni', 'members', 'sessions']);
  const [期間の始め, 期間の始めを置く] = React.useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [期間の終わり, 期間の終わりを置く] = React.useState(new Date());
  const [部員名の絞り, 部員名の絞りを置く] = React.useState('all');
  const [言葉の絞り, 言葉の絞りを置く] = React.useState('');
  const [書き出しの形, 書き出しの形を置く] = React.useState('standard');
  const [暦を出す, 暦を出すを置く] = React.useState(false);
  const [暦の対象, 暦の対象を置く] = React.useState('start');
  const [選んだタグ, 選んだタグを置く] = React.useState([]);
  const [タグの論理, タグの論理を置く] = React.useState('AND');
  const [絞り込みを開く, 絞り込みを開くを置く] = React.useState(false);
  const [selectedKeywords, setSelectedKeywords] = React.useState([]);
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  // 候補の並びは横に流す。パソコンの車の動きは横に読み替える（src/yokoNagashi.js）
  const titleRefCallback = use横流し();
  const memberRefCallback = use横流し();
  const [書き出す年度, 書き出す年度を置く] = React.useState(() => 学.年度(new Date()));
  const 年度を動かす = (差) => 書き出す年度を置く((今) => 今 + 差);
  // 候補（題・タグ）の元。個人ログインなら自分の分がある記録だけ
  const 見える記録 = React.useMemo(
    () =>
      activeRole === 'member' && myMemberId
        ? sList.filter((記録) => 自分の分がある記録か(記録, myMemberId, myMemberName))
        : sList.filter(Boolean),
    [sList, activeRole, myMemberId, myMemberName]
  );
  const titleSuggestions = React.useMemo(() => {
    const 題たち = 見える記録.map((記録) => 記録.title).filter((題) => 題 && 題.trim() !== '');
    return Array.from(new Set(題たち)).slice(0, 10);
  }, [見える記録]);
  const memberSuggestions = React.useMemo(() => {
    if (activeRole === 'member') return myMemberName ? [myMemberName] : [];
    const 名前たち = [...members, ...alumni]
      .sort(学.名簿の順に比べる)
      .map((部員) => 部員.name)
      .filter((名) => 名 && 名.trim() !== '');
    return Array.from(new Set(名前たち));
  }, [members, alumni, activeRole, myMemberName]);
  const タグの一覧 = React.useMemo(() => {
    const 集めた = new Set();
    見える記録.forEach((記録) => {
      if (Array.isArray(記録.tags)) 記録.tags.forEach((タグ) => 集めた.add(タグ));
    });
    return Array.from(集めた).sort((甲, 乙) => 甲.localeCompare(乙));
  }, [見える記録]);
  const 書き出す = async (範囲) => {
    if (!IS_WEB) {
      Alert.alert('未対応', '書き出しはWeb版のみ対応しています。');
      return;
    }
    try {
      const { sessions, members: 部員たち } = useScoreStore.getState();
      const { 記録の数, シートたち } = 書き出しのシートを作る(
        sessions,
        {
          範囲,
          年度: 書き出す年度,
          始め: 期間の始め,
          終わり: 期間の終わり,
          選んだタグ,
          タグの論理,
          選んだ言葉: selectedKeywords,
          言葉の絞り,
          選んだ部員: selectedMembers,
          部員名の絞り,
          自分id: activeRole === 'member' ? myMemberId : null,
          自分名: myMemberName,
          形: 書き出しの形,
        },
        [...部員たち, ...alumni]
      );
      if (記録の数 === 0) {
        Alert.alert('通知', '対象期間のデータがありません');
        return;
      }
      if (シートたち[0].rows.length === 0) {
        Alert.alert('書き出し', '対象のデータがありません');
        return;
      }
      const 範囲の名 = 範囲 === 'fiscal' ? `${書き出す年度}nendo` : 範囲 === 'custom' ? 'filtered' : 'all';
      await _xlsx.exportXlsxSheets(シートたち, `kyudo_records_${範囲の名}_${csvDate(Date.now())}.xlsx`);
    } catch (誤り) {
      console.error('Export Error:', 誤り);
      Alert.alert('エラー', 'ファイルの生成に失敗しました。');
    }
  };
  return (
    <>
      <Modal visible={見える} transparent animationType="fade" onRequestClose={() => 閉じる()}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => 閉じる()} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Excel形式で書き出し</Text>
            {絞り込みを開く ? (
              <ScrollView style={{ width: '100%', maxHeight: 450 }}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>出力形式</Text>
                  <View style={styles.flexRow}>
                    <TouchableOpacity
                      onPress={() => 書き出しの形を置く('standard')}
                      style={[styles.radioBtn, 書き出しの形 === 'standard' && styles.radioBtnActive]}
                    >
                      <Text
                        style={[
                          styles.radioBtnText,
                          書き出しの形 === 'standard' && styles.radioBtnTextActive,
                        ]}
                      >
                        標準形式
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => 書き出しの形を置く('matrix')}
                      style={[styles.radioBtn, 書き出しの形 === 'matrix' && styles.radioBtnActive]}
                    >
                      <Text
                        style={[styles.radioBtnText, 書き出しの形 === 'matrix' && styles.radioBtnTextActive]}
                      >
                        印刷向け形式
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.ratioHintText}>
                    {書き出しの形 === 'standard'
                      ? '1行に1記録を出力します。データ加工に適しています。'
                      : 'メンバーを各行、日付を各列に配置します。掲示や閲覧に適しています。'}
                  </Text>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>日付範囲</Text>
                  <View style={styles.flexRow}>
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => {
                        暦の対象を置く('start');
                        暦を出すを置く(true);
                      }}
                    >
                      <Text style={styles.dateSelectorText}>{期間の始め.toLocaleDateString('ja-JP')}</Text>
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 8 }}>〜</Text>
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => {
                        暦の対象を置く('end');
                        暦を出すを置く(true);
                      }}
                    >
                      <Text style={styles.dateSelectorText}>{期間の終わり.toLocaleDateString('ja-JP')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>キーワード (タイトル・メモ)</Text>
                  <TextInput
                    aria-label="キーワードで絞り込み"
                    style={styles.filterInput}
                    placeholder="キーワードで絞り込み"
                    value={言葉の絞り}
                    onChangeText={言葉の絞りを置く}
                    placeholderTextColor={色.区切り}
                  />
                  <候補の並び
                    候補={titleSuggestions}
                    選んだもの={selectedKeywords}
                    選んだものを置く={setSelectedKeywords}
                    流しの手={titleRefCallback}
                    鍵の頭="suggest-title"
                  />
                </View>
                {activeRole !== 'member' && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>メンバー名</Text>
                    <TextInput
                      aria-label="メンバー名で絞り込み"
                      style={styles.filterInput}
                      placeholder="未入力ですべて対象"
                      value={部員名の絞り === 'all' ? '' : 部員名の絞り}
                      onChangeText={(文) => 部員名の絞りを置く(文 || 'all')}
                      placeholderTextColor={色.区切り}
                    />
                    <候補の並び
                      候補={memberSuggestions}
                      選んだもの={selectedMembers}
                      選んだものを置く={setSelectedMembers}
                      流しの手={memberRefCallback}
                      鍵の頭="suggest-member"
                    />
                  </View>
                )}
                <View style={styles.filterGroup}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={styles.filterLabel}>タグ絞り込み</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: 色.地_濃い,
                        borderRadius: 8,
                        padding: 2,
                      }}
                    >
                      {[
                        ['AND', 'すべて含む'],
                        ['OR', 'いずれか含む'],
                      ].map(([論理, 字]) => (
                        <TouchableOpacity
                          key={論理}
                          onPress={() => タグの論理を置く(論理)}
                          style={[
                            { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                            タグの論理 === 論理 && { backgroundColor: 色.白 },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: タグの論理 === 論理 ? 色.青 : 色.灰,
                            }}
                          >
                            {字}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {タグの一覧.length > 0 ? (
                      タグの一覧.map((タグ) => {
                        const 選択中 = 選んだタグ.includes(タグ);
                        return (
                          <TouchableOpacity
                            key={`export-tag-${タグ}`}
                            onPress={() =>
                              選んだタグを置く((今の) =>
                                今の.includes(タグ) ? 今の.filter((一つ) => 一つ !== タグ) : [...今の, タグ]
                              )
                            }
                            style={[
                              styles.tagChip,
                              選択中 && styles.tagChipActive,
                              {
                                backgroundColor: 選択中 ? 色.青 : 色.地,
                                paddingVertical: 6,
                                marginVertical: 2,
                              },
                            ]}
                          >
                            <Text style={[styles.tagChipText, 選択中 && { color: 色.白 }]}>
                              {タグ.replace(/^#/, '')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={{ fontSize: 12, color: 色.灰 }}>使用されているタグがありません</Text>
                    )}
                  </View>
                  {選んだタグ.length > 0 && (
                    <TouchableOpacity onPress={() => 選んだタグを置く([])} style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 12, color: 色.青 }}>選択をクリア</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.modalButtons, { marginTop: 20 }]}>
                  <Pressable
                    style={ボタンの形(色.青, 色.青_濃い)}
                    onPress={() => {
                      閉じる();
                      絞り込みを開くを置く(false);
                      書き出す('custom');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: 色.白 }]}>この条件で書き出す</Text>
                  </Pressable>
                  <Pressable
                    style={ボタンの形(色.地, 色.地_濃い)}
                    onPress={() => 絞り込みを開くを置く(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: 色.青 }]}>戻る</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <>
                <Text style={styles.modalMessage}>書き出すデータの範囲を選択してください。</Text>
                <View style={styles.modalButtons}>
                  <Pressable style={ボタンの形(色.地, 色.地_濃い)} onPress={() => 閉じる()}>
                    <Text style={[styles.modalBtnText, { color: 色.青 }]}>キャンセル</Text>
                  </Pressable>
                  <View style={styles.monthNav}>
                    {/* 年度を前後に動かす。絵だけのボタンなので、読み上げのために名前を付ける */}
                    <TouchableOpacity
                      style={styles.monthNavBtn}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="前へ"
                      aria-label="前へ"
                      onPress={() => 年度を動かす(-1)}
                    >
                      <Icons.Ionicons name="chevron-back" size={20} color={色.青} />
                    </TouchableOpacity>
                    <Text style={styles.monthNavText}>{書き出す年度}年度のデータ</Text>
                    <TouchableOpacity
                      style={styles.monthNavBtn}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="次へ"
                      aria-label="次へ"
                      onPress={() => 年度を動かす(1)}
                    >
                      <Icons.Ionicons name="chevron-forward" size={20} color={色.青} />
                    </TouchableOpacity>
                  </View>
                  <Pressable
                    style={ボタンの形(色.青, 色.青_濃い, { marginTop: 8 })}
                    onPress={() => {
                      閉じる();
                      書き出す('fiscal');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: 色.白 }]}>{書き出す年度}年度を書き出す</Text>
                  </Pressable>
                  <Pressable
                    style={ボタンの形(色.緑, 色.緑_28A7)}
                    onPress={() => {
                      閉じる();
                      書き出す('all');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: 色.白 }]}>すべてのデータ</Text>
                  </Pressable>
                  <Pressable style={ボタンの形(色.藍, 色.藍_濃い)} onPress={() => 絞り込みを開くを置く(true)}>
                    <Text style={[styles.modalBtnText, { color: 色.白 }]}>詳細な条件で絞り込む...</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={暦を出す}
        onClose={() => 暦を出すを置く(false)}
        selectedDate={暦の対象 === 'start' ? 期間の始め : 期間の終わり}
        onSelectDate={(日付) => {
          if (暦の対象 === 'start') 期間の始めを置く(日付);
          else 期間の終わりを置く(日付);
        }}
        title={暦の対象 === 'start' ? '開始日を選択' : '終了日を選択'}
      />
    </>
  );
};

module.exports = { データの書き出し窓 };
