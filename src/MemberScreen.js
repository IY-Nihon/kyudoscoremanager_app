'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const FlatList = require('./FlatList').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const TextInput = require('./TextInput').default;
const SafeAreaView = require('./SafeAreaView').default;
const ScrollView = require('./ScrollView').default;
const Modal = require('./Modal').default;
const Alert = require('./alertBridge').default;
const Pressable = require('./Pressable').default;
const { IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
const 案内 = require('./TutorialGuide');
const Icons = require('@expo/vector-icons');
const { getShadowStyle } = require('./shadowStyle');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const MemberScreen = () => {
  const {
    members = [],
    addMember,
    updateMember,
    deleteMember,
    incrementAllGrades,
    activeGroupId,
    publicGroupId,
    isAdminMode,
    activeRole,
    myMemberId,
  } = useScoreStore();
  // 使い方の案内が指す先
  const 案内の部員追加 = 案内.useTutorialTarget('メンバー.追加');
  const [検索の文, 検索の文を置く] = React.useState('');
  const [編集の窓, 編集の窓を出す] = React.useState(false);
  const [編集中の部員, 編集中の部員を置く] = React.useState(null);
  const [名前の下書き, 名前の下書きを置く] = React.useState('');
  const [性別の下書き, 性別の下書きを置く] = React.useState('未設定');
  const [学年の下書き, 学年の下書きを置く] = React.useState('1');
  const [期の下書き, 期の下書きを置く] = React.useState('');
  const 今の一年生の期 = useScoreStore((x) => x.currentFreshmanTerm);
  const [弓具の窓, 弓具の窓を出す] = React.useState(false);
  // 端末の日付で出す。toISOString は世界標準時なので、日本では
  // 朝9時より前に開くと前の日が入ってしまう（弓具を変えた日がずれる）
  const [弓具の日付, 弓具の日付を置く] = React.useState(
    (() => {
      const 今 = new Date();
      return `${今.getFullYear()}-${String(今.getMonth() + 1).padStart(2, '0')}-${String(今.getDate()).padStart(2, '0')}`;
    })()
  );
  const [弓具の覚え書き, 弓具の覚え書きを置く] = React.useState('');
  const [弓力の下書き, 弓力の下書きを置く] = React.useState('');
  const { addEquipment, deleteEquipment } = useScoreStore();
  const [isAlumniExpanded, setIsAlumniExpanded] = React.useState(false);
  const [calVis, setCalVis] = React.useState(false);
  // 個人ログインでは自分だけを出す。他人は開けない作りなので、並べても
  // 押せない行が続くだけだった。人数の多い団体ほど自分を探しにくい。
  // 弓具を登録しに来る人にとって、この画面に用があるのは自分の行だけ
  const 見せる名簿 =
    'member' === activeRole ? (members || []).filter((x) => x && x.id === myMemberId) : members || [];
  const filteredMembers = 見せる名簿.filter(
    (部員) => 部員 && 部員.name && 部員.name.toLowerCase().includes(検索の文.toLowerCase())
  );
  const activeMembers = filteredMembers
    .filter((部員) => (部員.grade || 0) < 5)
    .sort((甲, 乙) => {
      const 甲の学年 = undefined === 甲.grade || null === 甲.grade ? 99 : Number(甲.grade);
      const 乙の学年 = undefined === 乙.grade || null === 乙.grade ? 99 : Number(乙.grade);
      const 甲の順 = 0 === 甲の学年 ? 99 : 甲の学年;
      const 乙の順 = 0 === 乙の学年 ? 99 : 乙の学年;
      if (甲の順 !== 乙の順) return 甲の順 - 乙の順;
      const 性別の順 = (性別) => {
        const 整えた = (性別 || '').trim();
        return '男子' === 整えた ? 0 : '女子' === 整えた ? 1 : 2;
      };
      const 性別の差 = 性別の順(甲.gender) - 性別の順(乙.gender);
      return 0 !== 性別の差 ? 性別の差 : (甲.name || '').localeCompare(乙.name || '', 'ja');
    });
  const graduateMembers = filteredMembers
    .filter((部員) => 部員.grade === 5)
    .sort((甲, 乙) => {
      const kiA = 甲.termKi || 0;
      const kiB = 乙.termKi || 0;
      if (kiB !== kiA) return kiB - kiA;
      const 性別の順 = (性別) => {
        const 整えた = (性別 || '').trim();
        return '男子' === 整えた ? 0 : '女子' === 整えた ? 1 : 2;
      };
      const 性別の差 = 性別の順(甲.gender) - 性別の順(乙.gender);
      return 0 !== 性別の差 ? 性別の差 : (甲.name || '').localeCompare(乙.name || '', 'ja');
    });
  const graduateGroups = graduateMembers.reduce((groups, member) => {
    const ki = member.termKi || '期不明';
    if (!groups[ki]) groups[ki] = [];
    groups[ki].push(member);
    return groups;
  }, {});
  const renderMemberCard = (部員) => {
    const 最新の弓具 =
      部員.equipments && 部員.equipments.length > 0
        ? [...部員.equipments].sort((甲, 乙) => 乙.date - 甲.date)[0]
        : null;
    return (
      <Pressable
        key={typeof 部員.id === 'string' ? 部員.id : `member-${部員.name}`}
        style={({ hovered: e_h }) => [
          styles.memberCard,
          e_h && { backgroundColor: 'rgba(0,122,255,0.05)' },
          IS_WEB && { cursor: 'pointer' },
        ]}
        onPress={() => {
          if ('member' !== activeRole || 部員.id === myMemberId) 編集を開く(部員);
          else Alert.alert('制限', 'メンバーモードでは自分以外の情報は編集できません。');
        }}
      >
        <View style={styles.memberInfoMain}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.genderDot,
                {
                  color: '男子' === 部員.gender ? '#007AFF' : '女子' === 部員.gender ? '#FF2D55' : '#8E8E93',
                },
              ]}
            >
              ●
            </Text>
            <Text style={styles.memberName} numberOfLines={1}>
              {部員.name}
            </Text>
          </View>
          <Text style={styles.memberSub}>
            {部員.termKi ? `${部員.termKi}期 / ` : ''}
            {部員.gender}
            {' / '}
            {部員.grade === 5 ? '卒業生' : 部員.grade > 0 ? `${部員.grade}年` : 'その他'}
          </Text>
        </View>
        <View style={styles.memberEqInfo}>
          {/* 弓力は弓具の中身。個人ログインでは自分のぶんだけ見せる。 */
          /* 他人の行では「弓具未登録」も出さない（登録の有無も中身のうち） */}
          {'member' === activeRole && 部員.id !== myMemberId ? null : 最新の弓具?.weight ? (
            <View style={styles.listWeightBadge}>
              <Text style={styles.listWeightText}>
                {最新の弓具.weight}
                <Text style={{ fontSize: 10 }}>kg</Text>
              </Text>
            </View>
          ) : (
            <Text style={styles.noEqText}>弓具未登録</Text>
          )}
          <Icons.Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
      </Pressable>
    );
  };
  // 個人ログインでは、自分の編集をはじめから開いておく。
  // 一覧に自分1人しか出ないので、そこを押させる一手間に意味がない。
  // 名簿は雲から遅れて届くので、届いたところで一度だけ開く
  const 自分を開いた = React.useRef(false);
  React.useEffect(() => {
    if ('member' !== activeRole || 自分を開いた.current) return;
    const 自分 = (members || []).find((x) => x && x.id === myMemberId);
    if (!自分) return;
    自分を開いた.current = true;
    編集を開く(自分);
  }, [activeRole, members, myMemberId]);
  const 編集を開く = (部員) => {
    if (
      (編集中の部員を置く(部員),
      名前の下書きを置く(部員.name),
      性別の下書きを置く(部員.gender),
      学年の下書きを置く(部員.grade.toString()),
      !部員.termKi && 今の一年生の期)
    ) {
      const 学年 = 部員.grade || 1;
      期の下書きを置く(学年 >= 1 && 学年 <= 5 ? String(今の一年生の期 - (学年 - 1)) : '');
    } else 期の下書きを置く(部員.termKi?.toString() || '');
    編集の窓を出す(true);
  };
  const 削除を確かめる = (部員ID, 名前) => {
    const 文 = `${名前} さんを削除しますか？`;
    const 消す = () => {
      deleteMember(部員ID);
      編集の窓を出す(false);
    };
    // ブラウザの確認窓は使わない。受け口（alertBridge）がアプリの中の窓へ流す
    Alert.alert('確認', 文, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: 消す },
    ]);
  };
  /**
   * 弓具変更履歴の中身。窓の中にも、個人ログインの編集画面の中にも同じものを出す。
   *
   * 個人ログインでは一覧も窓も挟まず、自分の編集と履歴をそのまま出す（本人しか
   * 触れないので、隠す意味がない）。同じ見た目を2か所に書き写すと必ずずれるので、
   * ここ1つにして呼び分ける。
   *
   * @param {string} 部員id  誰の履歴か
   * @param {boolean} 閉じるを出す 窓として出すときだけ true（見出しと×を付ける）
   */
  const 弓具履歴の中身 = (部員id, 閉じるを出す) => {
    const 部員 = members.find((x) => x.id === 部員id);
    return 部員 ? (
      <>
        {/* 見出しと×は、窓として出すときだけ。編集画面の中に並べるときは、 */
        /* すぐ上に「弓具管理」の見出しが在るので二重になる */}
        {閉じるを出す ? (
          <View style={styles.eqModalHeader}>
            <Text style={styles.modalTitle}>弓具変更履歴 ({部員.name})</Text>
            <TouchableOpacity
              onPress={() => {
                弓具の窓を出す(false);
                setCalVis(false);
              }}
            >
              <Icons.Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.eqForm}>
          <View style={styles.eqInputRow}>
            <TouchableOpacity
              style={[styles.eqInput, { flex: 1, minWidth: 0, justifyContent: 'center' }]}
              onPress={() => setCalVis(true)}
            >
              <Text style={{ fontSize: 15, color: '#000' }}>{弓具の日付}</Text>
            </TouchableOpacity>
            <View style={[styles.eqWeightInputWrapper, { flex: 1, minWidth: 0 }]}>
              <TextInput
                style={styles.eqInputInside}
                placeholder="弓力"
                value={弓力の下書き}
                onChangeText={(text) => {
                  let filtered = text.replace(/[^0-9.]/g, '');
                  const dotPos = filtered.indexOf('.');
                  if (dotPos !== -1) {
                    const intPart = filtered.slice(0, dotPos).slice(0, 3);
                    const decPart = filtered
                      .slice(dotPos + 1)
                      .replace(/\./g, '')
                      .slice(0, 1);
                    filtered = intPart + '.' + decPart;
                  } else {
                    filtered = filtered.slice(0, 3);
                  }
                  弓力の下書きを置く(filtered);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.kgUnit}>kg</Text>
            </View>
          </View>
          <TextInput
            style={[styles.eqInput, { height: 60 }]}
            placeholder="内容 (弦交換、弓の変更など)"
            value={弓具の覚え書き}
            onChangeText={弓具の覚え書きを置く}
            multiline
          />
          <TouchableOpacity
            style={styles.eqAddBtn}
            onPress={() => {
              (弓具の覚え書き.trim() || 弓力の下書き.trim()) &&
                (addEquipment(部員.id, {
                  date: new Date(弓具の日付 + 'T12:00:00').getTime() || Date.now(),
                  note: 弓具の覚え書き,
                  weight: 弓力の下書き,
                }),
                弓具の覚え書きを置く(''),
                弓力の下書きを置く(''));
            }}
          >
            <Text style={styles.eqAddBtnText}>履歴を追加</Text>
          </TouchableOpacity>
        </View>
        <FlatList // 画面として出すときは、外側の ScrollView が流す。
          // ここでも流すと入れ子になって、指の動きを取り合う
          scrollEnabled={!!閉じるを出す}
          data={[...(部員.equipments || [])].sort((甲, 乙) => 乙.date - 甲.date)}
          keyExtractor={(記録, index) => (typeof 記録.id === 'string' ? 記録.id : `eq-${index}-${記録.date}`)}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <View style={styles.eqItem}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.eqItemHeader}>
                  <Text style={styles.eqItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
                  {item.weight && (
                    <View style={styles.eqWeightBadge}>
                      <Text style={styles.eqWeightText}>
                        {item.weight}
                        {' kg'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.eqItemNote}>{item.note}</Text>
              </View>
              <TouchableOpacity // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                accessible
                accessibilityRole="button"
                accessibilityLabel="この弓具の記録を消す"
                aria-label="この弓具の記録を消す"
                onPress={() => deleteEquipment(部員.id, item.id)}
                style={{ padding: 4 }}
              >
                <Icons.Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>履歴がありません</Text>}
        />
      </>
    ) : null;
  };
  /**
   * メンバー編集の中身。団体ログインでは窓の中、個人ログインでは画面そのものに出す。
   *
   * 個人ログインでは一覧に自分しか出ないので、押して窓を開かせる一手間に意味がない。
   * 同じ見た目を2か所に書き写すと必ずずれるので、ここ1つにして呼び分ける。
   */
  // 見るだけの欄は、開いたときに写した値ではなく名簿から直に読む。
  // 写した値のままだと、団体側で名前や学年を直しても
  // 読み込み直すまで古いまま出る
  const いまの自分 = 'member' === activeRole ? (members || []).find((x) => x && x.id === myMemberId) : null;
  const 編集の中身 = (窓として出す) => (
    <View // 窓のときは窓の見た目、画面のときは画面いっぱいに広げる。
      // 窓の枠のまま画面に置くと、右half が空いたままになる
      style={窓として出す ? styles.modalContent : { flex: 1, width: '100%', backgroundColor: '#FFF' }}
    >
      {/* 見出しと×は窓のときだけ。画面のときは上に「自分の情報」が在る */}
      {窓として出す ? (
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{編集中の部員 ? 'メンバー編集' : '新規登録'}</Text>
          <TouchableOpacity onPress={() => 編集の窓を出す(false)} style={styles.closeBtn}>
            <Icons.Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={{ padding: 20 }}>
        {[
          // 個人ログインでは名前も変えられない。名簿は団体で管理する
          // ものなので、本人が動かすと記録の名寄せまでずれる
          ...(窓として出す
            ? [
                <Text style={styles.label}>名前</Text>,
                <TextInput
                  style={styles.input}
                  value={名前の下書き}
                  onChangeText={名前の下書きを置く}
                  placeholder="例: 山田 太郎"
                  placeholderTextColor="#C7C7CC"
                />,
                <Text style={styles.inputHelperText}>姓名の間にスペースを入力してください</Text>,
                編集中の部員 && 編集中の部員.personalId && (
                  <>
                    <Text style={styles.label}>個人ID (自動採番)</Text>
                    <View style={[styles.input, { justifyContent: 'center', opacity: 0.6 }]}>
                      <Text style={{ fontSize: 16 }}>
                        {isAdminMode || 編集中の部員.id === myMemberId
                          ? 編集中の部員.personalId
                          : '******** (管理者のみ表示)'}
                      </Text>
                    </View>
                  </>
                ),
              ]
            : []),
        ]}
        {/* 性別・学年・期は団体で管理する項目。個人ログインでは */
        /* 見るだけにする。本人が動かすと名簿と食い違い、進級や */
        /* 卒業の扱いまでずれる */}
        {窓として出す ? (
          <>
            <Text style={styles.label}>性別</Text>
            <View style={styles.genderRow}>
              {['男子', '女子', '未設定'].map((性別) => (
                <Pressable
                  key={性別}
                  style={({ hovered }) => [
                    styles.genderBtn,
                    性別の下書き === 性別 && styles.genderBtnActive,
                    hovered && 性別の下書き !== 性別 && { backgroundColor: '#E5E5EA' },
                  ]}
                  onPress={() => 性別の下書きを置く(性別)}
                >
                  <Text style={[styles.genderBtnText, 性別の下書き === 性別 && styles.genderBtnTextActive]}>
                    {性別}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>学年</Text>
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperValue}>
                {'0' === 学年の下書き ? 'その他' : '5' === 学年の下書き ? '卒業生' : `${学年の下書き}年生`}
              </Text>
              <View style={styles.stepperControls}>
                <Pressable
                  style={({ hovered }) => [styles.stepperBtn, hovered && { backgroundColor: '#D1D1D6' }]}
                  onPress={() => {
                    const 今の学年 = parseInt(学年の下書き) || 0;
                    if (今の学年 > 0) {
                      const 次の学年 = 今の学年 - 1;
                      学年の下書きを置く(String(次の学年));
                      if (今の一年生の期 && 次の学年 >= 1 && 次の学年 <= 5)
                        期の下書きを置く(String(今の一年生の期 - (次の学年 - 1)));
                    }
                  }}
                >
                  <Icons.Ionicons name="remove" size={24} color="#007AFF" />
                </Pressable>
                <View style={styles.stepperDivider} />
                <Pressable
                  style={({ hovered }) => [styles.stepperBtn, hovered && { backgroundColor: '#D1D1D6' }]}
                  onPress={() => {
                    const 今の学年 = parseInt(学年の下書き) || 0;
                    if (今の学年 < 5) {
                      const 次の学年 = 今の学年 + 1;
                      学年の下書きを置く(String(次の学年));
                      if (今の一年生の期 && 次の学年 >= 1 && 次の学年 <= 5)
                        期の下書きを置く(String(今の一年生の期 - (次の学年 - 1)));
                    }
                  }}
                >
                  <Icons.Ionicons name="add" size={24} color="#007AFF" />
                </Pressable>
              </View>
            </View>
            <Text style={styles.label}>期</Text>
            <TextInput
              style={styles.input}
              value={期の下書き}
              onChangeText={期の下書きを置く}
              placeholder="例: 70"
              keyboardType="number-pad"
              placeholderTextColor="#C7C7CC"
            />
          </>
        ) : (
          <View style={styles.きまり}>
            <View style={styles.きまりの行}>
              <Text style={styles.きまりの名}>名前</Text>
              <Text style={styles.きまりの値}>{(いまの自分 || {}).name || 名前の下書き || '未設定'}</Text>
            </View>
            {編集中の部員 && 編集中の部員.personalId ? (
              <View style={styles.きまりの行}>
                <Text style={styles.きまりの名}>個人ID</Text>
                <Text style={styles.きまりの値}>{編集中の部員.personalId}</Text>
              </View>
            ) : null}
            <View style={styles.きまりの行}>
              <Text style={styles.きまりの名}>性別</Text>
              <Text style={styles.きまりの値}>{(いまの自分 || {}).gender || 性別の下書き || '未設定'}</Text>
            </View>
            <View style={styles.きまりの行}>
              <Text style={styles.きまりの名}>学年</Text>
              <Text style={styles.きまりの値}>
                {(() => {
                  const 学 = String(
                    (いまの自分 && いまの自分.grade != null ? いまの自分.grade : 学年の下書き) ?? ''
                  );
                  return '5' === 学 ? '卒業生' : '0' === 学 ? 'その他' : `${学}年`;
                })()}
              </Text>
            </View>
            <View style={[styles.きまりの行, { borderBottomWidth: 0 }]}>
              <Text style={styles.きまりの名}>期</Text>
              <Text style={styles.きまりの値}>
                {(() => {
                  const 期 = (いまの自分 && いまの自分.termKi) || 期の下書き;
                  return 期 ? `${期}期` : '未設定';
                })()}
              </Text>
            </View>
            <Text style={styles.きまりの但し書き}>名前・性別・学年・期は団体の担当者が直します</Text>
          </View>
        )}
        {/* 弓具は、団体アカウントか本人だけ。個人ログインで他人の */
        /* 画面を開く道は塞いであるが、ここでも確かめる */}
        {編集中の部員 && ('member' !== activeRole || 編集中の部員.id === myMemberId) && (
          <>
            <Text style={styles.label}>弓具管理</Text>
            {/* 個人ログインでは、窓を挟まずにそのまま履歴を出す。 */
            /* 自分のぶんしか触れないので、隠す意味がない */}
            {'member' === activeRole ? (
              弓具履歴の中身(編集中の部員?.id, false)
            ) : (
              <Pressable
                style={({ hovered }) => [styles.eqHistoryBtn, hovered && { backgroundColor: '#E5E5EA' }]}
                onPress={() => 弓具の窓を出す(true)}
              >
                <Icons.Ionicons name="construct-outline" size={20} color="#007AFF" />
                <Text style={styles.eqHistoryBtnText}>弓具変更履歴を表示・編集</Text>
              </Pressable>
            )}
          </>
        )}
        {[
          ...(窓として出す
            ? [
                <View style={styles.modalFooter}>
                  {編集中の部員 && 'member' !== activeRole ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => 削除を確かめる(編集中の部員.id, 編集中の部員.name)}
                    >
                      <Icons.Ionicons
                        name="trash-outline"
                        size={18}
                        color="#FF3B30"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.deleteBtnText}>メンバーを削除</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => {
                      if (!名前の下書き.trim()) return void Alert.alert('お知らせ', '名前を入力してください');
                      const 学年 = parseInt(学年の下書き) || 0;
                      const 期 = '' === 期の下書き ? undefined : parseInt(期の下書き) || undefined;
                      if (編集中の部員)
                        updateMember(編集中の部員.id, {
                          name: 名前の下書き,
                          gender: 性別の下書き,
                          grade: 学年,
                          termKi: 期,
                        });
                      else addMember(名前の下書き, 性別の下書き, 学年, 期);
                      編集の窓を出す(false);
                    }}
                  >
                    <Text style={styles.saveBtnText}>保存する</Text>
                  </TouchableOpacity>
                </View>,
              ]
            : []),
        ]}
      </View>
    </View>
  );
  // ── 個人ログインの画面 ──────────────────────────────
  //
  // 出るのは自分1人だけなので、一覧から選ばせる作りをそのまま使うと、
  // 「1行だけの一覧を押して窓を開く」という空回りになる。ここは自分の
  // 情報と弓具だけを、そのまま並べた画面にする。
  // 中身（編集の欄・弓具の履歴）は団体ログインと同じものを呼んでいるので、
  // 直すところは1か所で済む。
  if ('member' === activeRole) {
    const 自分 = (members || []).find((x) => x && x.id === myMemberId);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>自分の情報</Text>
            {(publicGroupId || activeGroupId) && (
              <View style={styles.headerGroupIdBadge}>
                <Text style={styles.headerGroupIdText}>
                  {'団体ID: '}
                  {publicGroupId || activeGroupId}
                </Text>
              </View>
            )}
          </View>
        </View>
        {自分 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
            {編集の中身(false)}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={styles.emptyText}>自分の情報を読み込んでいます</Text>
          </View>
        )}
        <CustomCalendarModal
          visible={calVis}
          onClose={() => setCalVis(false)}
          selectedDate={new Date(弓具の日付 + 'T12:00:00')}
          onSelectDate={(date) => {
            弓具の日付を置く(
              date.getFullYear() +
                '-' +
                String(date.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(date.getDate()).padStart(2, '0')
            );
            setCalVis(false);
          }}
        />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>メンバー管理</Text>
          {(publicGroupId || activeGroupId) && (
            <View style={styles.headerGroupIdBadge}>
              <Text style={styles.headerGroupIdText}>
                {'団体ID: '}
                {publicGroupId || activeGroupId}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {'member' !== activeRole && (
            <Pressable
              ref={案内の部員追加}
              style={({ hovered }) => [
                styles.addBtn,
                hovered && { backgroundColor: 'rgba(0,122,255,0.05)', borderRadius: 8, padding: 4 },
              ]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
              accessible
              accessibilityRole="button"
              accessibilityLabel="部員を追加"
              aria-label="部員を追加"
              onPress={() => {
                編集中の部員を置く(null);
                名前の下書きを置く('');
                性別の下書きを置く('未設定');
                学年の下書きを置く('1');
                期の下書きを置く(今の一年生の期 ? String(今の一年生の期) : '');
                編集の窓を出す(true);
              }}
            >
              <Icons.Ionicons name="person-add" size={24} color="#007AFF" />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.searchBar}>
        <Icons.Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="メンバーを検索..."
          value={検索の文}
          onChangeText={検索の文を置く}
        />
        {'' !== 検索の文 && (
          <TouchableOpacity // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
            accessible
            accessibilityRole="button"
            accessibilityLabel="絞り込みを消す"
            aria-label="絞り込みを消す"
            onPress={() => 検索の文を置く('')}
          >
            <Icons.Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={activeMembers}
        keyExtractor={(部員, index) =>
          typeof 部員.id === 'string' ? 部員.id : `member-${index}-${部員.name}`
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          activeMembers.length === 0 && graduateMembers.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>メンバーがいません</Text>
            </View>
          ) : null
        }
        renderItem={({ item: 部員 }) => renderMemberCard(部員)}
        ListFooterComponent={
          graduateMembers.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Pressable style={styles.alumniHeader} onPress={() => setIsAlumniExpanded(!isAlumniExpanded)}>
                <Text style={styles.alumniHeaderText}>{`卒業生を表示 (${graduateMembers.length}名)`}</Text>
                <Icons.Ionicons
                  name={isAlumniExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#8E8E93"
                />
              </Pressable>
              {isAlumniExpanded &&
                Object.keys(graduateGroups)
                  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
                  .map((ki) => (
                    <View key={`group-${ki}`} style={{ marginTop: 10 }}>
                      <Text style={styles.alumniGroupTitle}>{ki === '期不明' ? '期不明' : `${ki}期`}</Text>
                      {graduateGroups[ki].map(renderMemberCard)}
                    </View>
                  ))}
            </View>
          ) : null
        }
      />
      <Modal visible={編集の窓} animationType="slide" transparent>
        <View style={styles.modalOverlay}>{編集の中身(true)}</View>
      </Modal>
      <Modal visible={弓具の窓} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%', padding: 0 }]}>
            {弓具履歴の中身(編集中の部員?.id, true)}
          </View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={calVis}
        onClose={() => setCalVis(false)}
        selectedDate={new Date(弓具の日付 + 'T12:00:00')}
        onSelectDate={(date) => {
          弓具の日付を置く(
            date.getFullYear() +
              '-' +
              String(date.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date.getDate()).padStart(2, '0')
          );
        }}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: IS_WEB ? WEB_TOP_PADDING : SAFE_TOP_PADDING },
  header: {
    minHeight: IS_WEB ? 60 : 70,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  listContent: { padding: 12 },
  memberCard: Object.assign(
    {
      backgroundColor: '#FFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    getShadowStyle({
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    })
  ),
  memberInfoMain: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  genderDot: { fontSize: 12 },
  memberName: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  memberSub: { fontSize: 12, color: '#8E8E93' },
  memberPersonalId: { fontSize: 11, color: '#007AFF', fontWeight: 'bold', marginTop: 2 },
  headerGroupIdBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  headerGroupIdText: { fontSize: 10, color: '#8E8E93', fontWeight: 'bold' },
  memberEqInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listWeightBadge: {
    backgroundColor: '#E1F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    minWidth: 45,
    alignItems: 'center',
  },
  listWeightText: { fontSize: 13, color: '#007AFF', fontWeight: 'bold' },
  noEqText: { fontSize: 11, color: '#C7C7CC' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#F9F9F9',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  closeBtn: { position: 'absolute', right: 16 },
  // 個人ログインで「見るだけ」の項目を並べる一枚。
  // 入力欄と見た目を分けて、触れないことがひと目で分かるようにする
  きまり: {
    backgroundColor: '#F7F7FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 4,
  },
  きまりの行: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  きまりの名: { fontSize: 14, color: '#8E8E93' },
  きまりの値: { fontSize: 15, color: '#000', fontWeight: '600' },
  きまりの但し書き: { fontSize: 11, color: '#8E8E93', paddingVertical: 8 },
  label: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
  inputHelperText: { fontSize: 11, color: '#8E8E93', marginTop: 4, marginLeft: 4 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: '#007AFF' },
  genderBtnText: { color: '#000', fontWeight: '500' },
  genderBtnTextActive: { color: '#FFF' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 8,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  deleteBtnText: { color: '#FF3B30', fontSize: 15, fontWeight: '500' },
  cancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    paddingHorizontal: 24,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    height: 44,
    paddingLeft: 16,
  },
  stepperValue: { fontSize: 16, color: '#000' },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    marginRight: 2,
    height: 40,
  },
  stepperBtn: { paddingHorizontal: 16, height: '100%', justifyContent: 'center', alignItems: 'center' },
  stepperDivider: { width: 1, height: 24, backgroundColor: '#C6C6C8' },
  eqHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  eqHistoryBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  eqModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  eqForm: {
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  eqInputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  eqInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    height: 40,
  },
  eqAddBtn: { backgroundColor: '#34C759', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  eqAddBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  eqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  eqItemHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  eqItemDate: { fontSize: 14, color: '#8E8E93', fontWeight: '600' },
  eqItemNote: { fontSize: 16, color: '#000' },
  eqWeightBadge: { backgroundColor: '#E5E5EA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  eqWeightText: { fontSize: 12, color: '#000', fontWeight: '700' },
  eqWeightInputWrapper: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 40,
  },
  eqInputInside: { flex: 1, minWidth: 0, height: 40, fontSize: 15 },
  kgUnit: { marginLeft: 4, color: '#8E8E93', fontSize: 14, fontWeight: 'bold' },
  alumniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  alumniHeaderText: { fontSize: 15, fontWeight: 'bold', color: '#8E8E93' },
  alumniGroupTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 12,
  },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.MemberScreen = MemberScreen;
