'use strict';

exports.ArcherActionModal = undefined;
const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const Modal = require('./Modal').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const TextInput = require('./TextInput').default;
const ScrollView = require('./ScrollView').default;
const Dimensions = require('./Dimensions').default;
const Pressable = require('./Pressable').default;
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
const { getShadowStyle } = require('./shadowStyle');
const ArcherActionModal = ({
  visible,
  archerId,
  archerOrigIdx: pVal,
  isSeparator: jVal,
  isTotalCalculator,
  // 合計の列が、いま手前の計もまとめて数えているか／切り替える手立て
  またぐ合計,
  on合計の範囲,
  // 区切りにチーム名を付ける。長押しでしか入れられず気づけなかったので、
  // 窓からも入れるようにした
  onチーム名,
  いまのチーム名 = '',
  // 立ち順の入れ替え。store へは並びの向き（'前' / '後'）で渡す。
  // 字と矢印は並べ方しだい（縦なら右／左、横なら上／下）なので、
  // どちらに並べているかを受け取って出し分ける
  on動かす,
  横に並べている = false,
  手前へ動かせる = false,
  奥へ動かせる = false,
  onClose,
  onSubstitution,
  onSetMember,
  onSetGuestName,
  onClearName,
  onDeleteArcher,
  onAddArcher,
  onAddSeparator,
  onAddTotal,
  existingArchers,
  // 途中交代を取り消す道を出すか。履歴の編集から開いたときは出さない
  //（あちらの射手は記録中の盤面ではないので、消すと別の記録を触ってしまう）
  交代を消せる = false,
}) => {
  const {
    members,
    alumni: alumniState,
    archers,
    setArcherMember,
    setSubstitution: 交代を書く,
    addArcher,
    addSeparator,
    addTotalCalculator,
    deleteArcher,
  } = useScoreStore();
  const [検索の文, 検索の文を置く] = React.useState('');
  const [客名の入力中, 客名の入力中を置く] = React.useState(false);
  const [客名の下書き, 客名の下書きを置く] = React.useState('');
  const [expandedTerms, setExpandedTerms] = React.useState(new Set());
  const [expandedActiveGrades, setExpandedActiveGrades] = React.useState(new Set(['1', '2', '3', '4', '0']));
  // いまこの射手に入っている途中交代。1つでもあれば取り消す道を出す。
  // これまで解除する口がどこにも無く、履歴にも積んでいないので取り消しでも
  // 戻らなかった（間違えるとリセットするしかなかった）
  const いまの交代 = React.useMemo(() => {
    const 射手 = (archers || []).find((一人) => 一人 && 一人.id === archerId);
    const 表 = (射手 && 射手.substitutions) || {};
    return Object.keys(表)
      .map(Number)
      .filter((数) => !isNaN(数))
      .sort((甲, 乙) => 甲 - 乙)
      .map((位置) => ({ 位置, 名: 表[位置] }));
  }, [archers, archerId]);
  const 今の射手たち = existingArchers || archers;
  // 男女の絞り込み。'全員' | '男子' | '女子'
  const [男女の絞り, set男女の絞り] = React.useState('全員');
  const 現役の候補 = React.useMemo(() => {
    return (
      members
        .filter((部員) => (部員.grade || 0) < 5)
        .filter((部員) => '' === 検索の文 || (部員.name || '').includes(検索の文))
        // 男女で絞る。男女別の立ちを組むとき、毎回名前を探さずに済む
        .filter((部員) => '全員' === 男女の絞り || (部員.gender || '') === 男女の絞り)
        .sort((甲, 乙) => {
          const 甲は入っている = 今の射手たち.some((一人) => 一人.memberId === 甲.id);
          if (甲は入っている !== 今の射手たち.some((一人) => 一人.memberId === 乙.id))
            return 甲は入っている ? 1 : -1;
          const 甲の学年 = undefined === 甲.grade || null === 甲.grade ? 99 : Number(甲.grade);
          const 乙の学年 = undefined === 乙.grade || null === 乙.grade ? 99 : Number(乙.grade);
          // 「その他」（学年0）は後ろへ。乙の側は、以前は o（入っているか）を
          // 見ていて学年の比べ合いになっておらず、一覧が学年順に並ばなかった
          const 甲の順 = 0 === 甲の学年 ? 99 : 甲の学年;
          const 乙の順 = 0 === 乙の学年 ? 99 : 乙の学年;
          if (甲の順 !== 乙の順) return 甲の順 - 乙の順;
          const cVal = (性別) => {
            const 整えた = (性別 || '').trim();
            return '男子' === 整えた ? 0 : '女子' === 整えた ? 1 : 2;
          };
          const uVal = cVal(甲.gender) - cVal(乙.gender);
          return 0 !== uVal ? uVal : (甲.name || '').localeCompare(乙.name || '', 'ja');
        })
    );
  }, [members, archers, 検索の文, 今の射手たち, 男女の絞り]);
  const activeGroups = React.useMemo(() => {
    const groups = {};
    現役の候補.forEach((部員) => {
      const gVal = undefined === 部員.grade || null === 部員.grade ? 0 : Number(部員.grade);
      groups[gVal] || (groups[gVal] = []);
      groups[gVal].push(部員);
    });
    const sortedGrades = Object.keys(groups)
      .map(Number)
      .sort((甲, 乙) => {
        if (甲 === 0) return 1;
        if (乙 === 0) return -1;
        return 甲 - 乙;
      });
    return sortedGrades.map((gVal) => {
      let title = `${gVal}年生`;
      if (gVal === 0) title = 'その他/ゲスト';
      return { grade: gVal, title, members: groups[gVal] };
    });
  }, [現役の候補]);
  const alumniByTerm = React.useMemo(() => {
    const 候補 = members
      .filter((部員) => 部員.grade === 5 || 部員.isAlumni)
      .concat(alumniState || [])
      .filter((部員) => '' === 検索の文 || (部員.name || '').includes(検索の文));
    const tVal = {};
    候補.forEach((部員) => {
      const 期 = 部員.termKi || 999;
      tVal[期] || (tVal[期] = []);
      tVal[期].push(部員);
    });
    return Object.keys(tVal)
      .sort((甲, 乙) => Number(乙) - Number(甲))
      .map((期) => ({
        term: 期,
        members: tVal[期].sort((甲, 乙) => (甲.name || '').localeCompare(乙.name || '', 'ja')),
      }));
  }, [members, alumniState, 検索の文]);
  const 部員を当てる = (部員) => {
    if (onSetMember) onSetMember(部員);
    else setArcherMember(archerId, 部員);
    onClose();
  };
  const toggleTerm = (期) => {
    setExpandedTerms((前) => {
      const 次 = new Set(前);
      if (次.has(期)) 次.delete(期);
      else 次.add(期);
      return 次;
    });
  };
  const toggleActiveGrade = (gVal) => {
    setExpandedActiveGrades((prev) => {
      const next = new Set(prev);
      if (next.has(gVal)) next.delete(gVal);
      else next.add(gVal);
      return next;
    });
  };
  const 客名で決める = () => {
    const 名前 = 客名の下書き.trim();
    名前 &&
      (onSetGuestName ? onSetGuestName(名前) : useScoreStore.getState().setArcherGuestName(archerId, 名前));
    客名の入力中を置く(false);
    客名の下書きを置く('');
    onClose();
  };
  const 画面の高さ = Dimensions.get('window').height;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fullScreen}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.menuContainer, { maxHeight: 0.7 * 画面の高さ }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {!jVal && !isTotalCalculator && (
              <View style={styles.section}>
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed, hovered }) => [
                      styles.actionBtn,
                      hovered && { backgroundColor: '#E5E5EA' },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      if (onClearName) onClearName();
                      else useScoreStore.getState().setArcherMember(archerId, null);
                      onClose();
                    }}
                  >
                    <Icons.Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
                    <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>名前クリア</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed, hovered }) => [
                      styles.actionBtn,
                      hovered && { backgroundColor: '#E5E5EA' },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      onClose();
                      onSubstitution();
                    }}
                  >
                    <Icons.Ionicons name="repeat" size={18} color="#007AFF" />
                    <Text style={[styles.actionBtnText, { color: '#007AFF' }]}>途中交代</Text>
                  </Pressable>
                  {[
                    // 交代が入っているときだけ、取り消す道を出す。
                    // 誰といつ代わっているかも一緒に見せる（間違いに気づけるように）
                    // 入っている交代を1つずつ取り消せるようにする。
                    // まとめて消すと、2か所以上あるときに1つだけ戻せない
                    ...(交代を消せる
                      ? いまの交代.map((交代) => (
                          <Pressable
                            key={`交代取消-${交代.位置}`}
                            style={({ pressed, hovered }) => [
                              styles.actionBtn,
                              // 文が長いので1行いっぱいを使う。space-around の
                              // 折り返しに任せると右へ寄って見える
                              { flexBasis: '100%', justifyContent: 'center' },
                              hovered && { backgroundColor: '#FFE5E5' },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={() => {
                              交代を書く(archerId, 交代.位置, '', null);
                              onClose();
                            }}
                          >
                            <Icons.Ionicons name="close-circle" size={18} color="#FF3B30" />
                            <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>
                              {交代.位置 + 1}
                              {'射目〜 '}
                              {交代.名}
                              {' の交代を取り消す'}
                            </Text>
                          </Pressable>
                        ))
                      : []),
                  ]}
                  {客名の入力中 ? (
                    <View style={styles.guestInputRow}>
                      <TextInput
                        style={styles.guestInput}
                        placeholder="ゲスト名"
                        value={客名の下書き}
                        onChangeText={客名の下書きを置く}
                        autoFocus
                        onSubmitEditing={客名で決める}
                      />
                      <TouchableOpacity onPress={客名で決める}>
                        <Text style={styles.guestConfirmText}>決定</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          客名の入力中を置く(false);
                          客名の下書きを置く('');
                        }}
                      >
                        <Icons.Ionicons name="close" size={20} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed, hovered }) => [
                        styles.actionBtn,
                        hovered && { backgroundColor: '#E5E5EA' },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        客名の入力中を置く(true);
                      }}
                    >
                      <Icons.Ionicons name="person-outline" size={18} color="#5856D6" />
                      <Text style={[styles.actionBtnText, { color: '#5856D6' }]}>ゲスト登録</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            {/* 区切りのときだけ出す。チーム名を入れる道は長押ししか無く、 */
            /* 気づけなかった（押す＝消す だったので、なおさら触れない） */}
            {jVal && onチーム名 && (
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#F2F7FF' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={onチーム名}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.menuText, { color: '#007AFF', fontWeight: 'bold' }]}>
                    {いまのチーム名 ? 'チーム名を変える' : 'チーム名を付ける'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                    {いまのチーム名
                      ? `いまは「${いまのチーム名}」`
                      : '大学名などを入れると、この区切りより左に色が付きます'}
                  </Text>
                </View>
                <Icons.Ionicons name="pricetag-outline" size={20} color="#007AFF" />
              </Pressable>
            )}
            {/* 立ち順の入れ替え。矢印のとおりに、画面で1つ動く。 */
            /* 記録表は右から左へ並ぶので、右が大前寄り・左が落寄り。 */
            /* ○×も矢所も列に付いているので、列ごと動けば付いていく。 */
            /* 端の列では、その向きを出さない（押せるのに動かないのを避ける） */
            /* 脇の窓は狭いので、2つ並べずに他の項目と同じ全幅の行にする。 */
            /* 横に並べたら「右へ動か／す」と折り返し、字を詰めたら消えた */}
            {on動かす && 手前へ動かせる && (
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#F2F7FF' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => on動かす('前')}
                accessibilityLabel="立ち順で1つ前へ動かす"
              >
                <Text style={[styles.menuText, { color: '#007AFF' }]}>
                  {横に並べている ? '上へ動かす' : '右へ動かす'}
                </Text>
                {/* 矢印は動く向きに合わせる。縦の表は右から左へ並ぶので */
                /* 「前へ」は右向き、横の表では上向きになる */}
                <Icons.Ionicons
                  name={横に並べている ? 'arrow-up' : 'arrow-forward'}
                  size={20}
                  color="#007AFF"
                />
              </Pressable>
            )}
            {on動かす && 奥へ動かせる && (
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#F2F7FF' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => on動かす('後')}
                accessibilityLabel="立ち順で1つ後ろへ動かす"
              >
                <Text style={[styles.menuText, { color: '#007AFF' }]}>
                  {横に並べている ? '下へ動かす' : '左へ動かす'}
                </Text>
                <Icons.Ionicons
                  name={横に並べている ? 'arrow-down' : 'arrow-back'}
                  size={20}
                  color="#007AFF"
                />
              </Pressable>
            )}
            <View style={styles.dividerFull} />
            {!jVal && !isTotalCalculator && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>メンバーを選択</Text>
                </View>
                <View style={styles.searchRow}>
                  <Icons.Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="メンバーを検索"
                    value={検索の文}
                    onChangeText={検索の文を置く}
                    placeholderTextColor="#8E8E93"
                  />
                  {'' !== 検索の文 && (
                    <TouchableOpacity onPress={() => 検索の文を置く('')}>
                      <Icons.Ionicons name="close-circle" size={18} color="#C6C6C8" />
                    </TouchableOpacity>
                  )}
                </View>
                {/* 男女で絞る。男女別の立ちを組むとき、毎回名前を探さずに済む */}
                <View style={styles.男女の絞りの列}>
                  {['全員', '男子', '女子'].map((名) => (
                    <TouchableOpacity
                      key={`絞り-${名}`}
                      style={[
                        styles.男女の絞りのボタン,
                        男女の絞り === 名 && styles.男女の絞りのボタン選択中,
                      ]}
                      onPress={() => set男女の絞り(名)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: 男女の絞り === 名 }}
                    >
                      <Text style={[styles.男女の絞りの字, 男女の絞り === 名 && styles.男女の絞りの字選択中]}>
                        {名}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.section}>
                  {activeGroups.map((group) => {
                    const gStr = group.grade.toString();
                    const isOpen = expandedActiveGrades.has(gStr);
                    return (
                      <React.Fragment key={`group-${group.grade}`}>
                        <TouchableOpacity style={styles.termHeader} onPress={() => toggleActiveGrade(gStr)}>
                          <Text style={styles.termTitle}>
                            {group.title}
                            {' ('}
                            {group.members.length}人)
                          </Text>
                          <Icons.Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#8E8E93"
                          />
                        </TouchableOpacity>
                        {isOpen &&
                          group.members.map((部員, idx) => {
                            const sVal = 今の射手たち.some((一人) => 一人.memberId === 部員.id);
                            return (
                              <React.Fragment key={部員.id}>
                                {idx > 0 && <View style={[styles.divider, { marginLeft: 32 }]} />}
                                <Pressable
                                  style={({ pressed, hovered }) => [
                                    styles.menuItem,
                                    { paddingLeft: 32 },
                                    sVal && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                                    !sVal && hovered && { backgroundColor: '#F2F2F7' },
                                    pressed && { opacity: 0.7 },
                                  ]}
                                  onPress={() => 部員を当てる(部員)}
                                >
                                  <Text
                                    style={[
                                      styles.menuText,
                                      '男子' === 部員.gender && { color: '#007AFF' },
                                      '女子' === 部員.gender && { color: '#FF2D55' },
                                      sVal && { opacity: 0.5 },
                                    ]}
                                  >
                                    {部員.name}{' '}
                                    <Text style={{ fontSize: 11, color: '#8E8E93' }}>
                                      {部員.termKi ? `(${部員.termKi}期)` : ''}
                                    </Text>
                                  </Text>
                                  {sVal && (
                                    <View style={styles.selectedBadge}>
                                      <Text style={styles.selectedBadgeText}>選択済</Text>
                                    </View>
                                  )}
                                </Pressable>
                              </React.Fragment>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </View>
              </>
            )}
            {/* 「計」と「間隔」の列は射手ではないので、人を選ぶところは出さない。 */
            /* すぐ上の「メンバーを選択」には同じ条件が付いているのに、卒業生の */
            /* ほうだけ付いておらず、合計の欄を押すと卒業生の一覧だけが出ていた */}
            {!jVal && !isTotalCalculator && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>卒業生を選択</Text>
              </View>
            )}
            {!jVal && !isTotalCalculator && (
              <View style={styles.section}>
                {alumniByTerm.map((期の組) => (
                  <React.Fragment key={期の組.term}>
                    <TouchableOpacity style={styles.termHeader} onPress={() => toggleTerm(期の組.term)}>
                      <Text style={styles.termTitle}>
                        {999 === Number(期の組.term) ? '不明' : 期の組.term}期
                      </Text>
                      <Icons.Ionicons
                        name={expandedTerms.has(期の組.term) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                    {expandedTerms.has(期の組.term) &&
                      期の組.members.map((部員, 無し) => {
                        const sVal = 今の射手たち.some((一人) => 一人.memberId === 部員.id);
                        return (
                          <React.Fragment key={部員.id}>
                            <View style={[styles.divider, { marginLeft: 32 }]} />
                            <Pressable
                              style={({ pressed, hovered }) => [
                                styles.menuItem,
                                { paddingLeft: 32 },
                                sVal && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                                !sVal && hovered && { backgroundColor: '#F2F2F7' },
                                pressed && { opacity: 0.7 },
                              ]}
                              onPress={() => 部員を当てる(部員)}
                            >
                              <Text
                                style={[
                                  styles.menuText,
                                  '男子' === 部員.gender && { color: '#007AFF' },
                                  '女子' === 部員.gender && { color: '#FF2D55' },
                                  sVal && { opacity: 0.5 },
                                ]}
                              >
                                {部員.name} <Text style={{ fontSize: 11, color: '#8E8E93' }}>(卒業生)</Text>
                              </Text>
                              {sVal && (
                                <View style={styles.selectedBadge}>
                                  <Text style={styles.selectedBadgeText}>選択済</Text>
                                </View>
                              )}
                            </Pressable>
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                ))}
              </View>
            )}
            <View style={styles.dividerFull} />
            <View style={styles.section}>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#F2F2F7' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onAddArcher) onAddArcher(pVal + 1);
                  else addArcher(pVal + 1, undefined);
                  onClose();
                }}
              >
                <Text style={styles.menuText}>左に射手を追加</Text>
                <Icons.Ionicons name="person-add-outline" size={20} color="#8E8E93" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#F2F2F7' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onAddSeparator) onAddSeparator(pVal + 1);
                  else addSeparator(pVal + 1);
                  onClose();
                }}
              >
                <Text style={styles.menuText}>左に間隔を追加</Text>
                <Icons.Ionicons name="reorder-four-outline" size={20} color="#8E8E93" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#F2F2F7' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onAddTotal) onAddTotal(pVal + 1);
                  else addTotalCalculator(pVal + 1);
                  onClose();
                }}
              >
                <Text style={styles.menuText}>左に計を追加</Text>
                <Icons.Ionicons name="calculator-outline" size={20} color="#8E8E93" />
              </Pressable>
              <View style={styles.divider} />
              {/* 合計の列だけに出す。数える範囲を切り替える。 */
              /* 「計」は区切りで止まる（1立ぶん）、「総計」は端まで数える */}
              {isTotalCalculator && on合計の範囲 && (
                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.menuItem,
                    hovered && { backgroundColor: '#F2F7FF' },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={on合計の範囲}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.menuText, { color: '#007AFF', fontWeight: 'bold' }]}>
                      {またぐ合計 ? 'この立ちだけの合計にする' : '手前の計もまとめた総計にする'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                      {またぐ合計
                        ? 'いまは手前の計もまとめて数えています（間隔で止まります）'
                        : 'いまはこの立ちだけを数えています'}
                    </Text>
                  </View>
                  <Icons.Ionicons name="swap-horizontal" size={20} color="#007AFF" />
                </Pressable>
              )}
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  hovered && { backgroundColor: '#FFF0F0' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onDeleteArcher) onDeleteArcher(archerId);
                  else deleteArcher(archerId);
                  onClose();
                }}
              >
                <Text style={[styles.menuText, { color: '#FF3B30', fontWeight: 'bold' }]}>削除</Text>
                <Icons.Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
exports.ArcherActionModal = ArcherActionModal;
const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  backdrop: Object.assign({}, StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.15)' }),
  menuContainer: Object.assign(
    { position: 'absolute', top: 60, right: 20, width: 280, backgroundColor: '#FFF', borderRadius: 14 },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    }),
    { overflow: 'hidden' }
  ),
  section: { backgroundColor: '#FFF', paddingVertical: 4 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  sectionHeaderText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  termTitle: { fontSize: 15, color: '#333', fontWeight: '600' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  menuText: { fontSize: 17, color: '#000', flex: 1 },
  dividerFull: { height: 8, backgroundColor: '#F2F2F7' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8', marginHorizontal: 16 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  guestInputRow: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 10,
    marginVertical: 2,
  },
  guestInput: { flex: 1, fontSize: 15, color: '#000', paddingVertical: 4 },
  guestConfirmText: { color: '#007AFF', fontWeight: 'bold', fontSize: 15, paddingHorizontal: 4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  // 男女の絞り込み。検索欄のすぐ下に、3つ並べる
  男女の絞りの列: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: '#FFF',
  },
  男女の絞りのボタン: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  男女の絞りのボタン選択中: { backgroundColor: '#007AFF' },
  男女の絞りの字: { fontSize: 14, color: '#3A3A3C', fontWeight: '600' },
  男女の絞りの字選択中: { color: '#FFF' },
  selectedBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  selectedBadgeText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
});
