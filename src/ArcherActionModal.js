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
const j = ({
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
  const [O, M] = React.useState('');
  const [_, N] = React.useState(false);
  const [G, K] = React.useState('');
  const [expandedTerms, setExpandedTerms] = React.useState(new Set());
  const [expandedActiveGrades, setExpandedActiveGrades] = React.useState(new Set(['1', '2', '3', '4', '0']));
  // いまこの射手に入っている途中交代。1つでもあれば取り消す道を出す。
  // これまで解除する口がどこにも無く、履歴にも積んでいないので取り消しでも
  // 戻らなかった（間違えるとリセットするしかなかった）
  const いまの交代 = React.useMemo(() => {
    const 射手 = (archers || []).find((e) => e && e.id === archerId);
    const 表 = (射手 && 射手.substitutions) || {};
    return Object.keys(表)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b)
      .map((位置) => ({ 位置, 名: 表[位置] }));
  }, [archers, archerId]);
  const q = existingArchers || archers;
  // 男女の絞り込み。'全員' | '男子' | '女子'
  const [男女の絞り, set男女の絞り] = React.useState('全員');
  const L = React.useMemo(() => {
    return (
      members
        .filter((e) => (e.grade || 0) < 5)
        .filter((e) => '' === O || (e.name || '').includes(O))
        // 男女で絞る。男女別の立ちを組むとき、毎回名前を探さずに済む
        .filter((e) => '全員' === 男女の絞り || (e.gender || '') === 男女の絞り)
        .sort((e, t) => {
          const o = q.some((t) => t.memberId === e.id);
          if (o !== q.some((e) => e.memberId === t.id)) return o ? 1 : -1;
          const n = undefined === e.grade || null === e.grade ? 99 : Number(e.grade);
          const l = undefined === t.grade || null === t.grade ? 99 : Number(t.grade);
          const sVal = 0 === n ? 99 : n;
          const aVal = 0 === o ? 99 : o;
          if (sVal !== aVal) return sVal - aVal;
          const cVal = (e) => {
            const t = (e || '').trim();
            return '男子' === t ? 0 : '女子' === t ? 1 : 2;
          };
          const uVal = cVal(e.gender) - cVal(t.gender);
          return 0 !== uVal ? uVal : (e.name || '').localeCompare(t.name || '', 'ja');
        })
    );
  }, [members, archers, O, q, 男女の絞り]);
  const activeGroups = React.useMemo(() => {
    const groups = {};
    L.forEach((e) => {
      const gVal = undefined === e.grade || null === e.grade ? 0 : Number(e.grade);
      groups[gVal] || (groups[gVal] = []);
      groups[gVal].push(e);
    });
    const sortedGrades = Object.keys(groups)
      .map(Number)
      .sort((a, b) => {
        if (a === 0) return 1;
        if (b === 0) return -1;
        return a - b;
      });
    return sortedGrades.map((gVal) => {
      let title = `${gVal}年生`;
      if (gVal === 0) title = 'その他/ゲスト';
      return { grade: gVal, title, members: groups[gVal] };
    });
  }, [L]);
  const alumniByTerm = React.useMemo(() => {
    const e = members
      .filter((e) => e.grade === 5 || e.isAlumni)
      .concat(alumniState || [])
      .filter((e) => '' === O || (e.name || '').includes(O));
    const tVal = {};
    e.forEach((e) => {
      const o = e.termKi || 999;
      tVal[o] || (tVal[o] = []);
      tVal[o].push(e);
    });
    return Object.keys(tVal)
      .sort((e, t) => Number(t) - Number(e))
      .map((e) => ({
        term: e,
        members: tVal[e].sort((e, t) => (e.name || '').localeCompare(t.name || '', 'ja')),
      }));
  }, [members, alumniState, O]);
  const $ = (e) => {
    if (onSetMember) onSetMember(e);
    else setArcherMember(archerId, e);
    onClose();
  };
  const toggleTerm = (e) => {
    setExpandedTerms((t) => {
      const o = new Set(t);
      if (o.has(e)) o.delete(e);
      else o.add(e);
      return o;
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
  const J = () => {
    const e = G.trim();
    e && (onSetGuestName ? onSetGuestName(e) : useScoreStore.getState().setArcherGuestName(archerId, e));
    N(false);
    K('');
    onClose();
  };
  const Q = Dimensions.get('window').height;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={y.fullScreen}>
        <TouchableOpacity style={y.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[y.menuContainer, { maxHeight: 0.7 * Q }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {!jVal && !isTotalCalculator && (
              <View style={y.section}>
                <View style={y.actionRow}>
                  <Pressable
                    style={({ pressed, hovered }) => [
                      y.actionBtn,
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
                    <Text style={[y.actionBtnText, { color: '#FF3B30' }]}>名前クリア</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed: e, hovered: t }) => [
                      y.actionBtn,
                      t && { backgroundColor: '#E5E5EA' },
                      e && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      onClose();
                      onSubstitution();
                    }}
                  >
                    <Icons.Ionicons name="repeat" size={18} color="#007AFF" />
                    <Text style={[y.actionBtnText, { color: '#007AFF' }]}>途中交代</Text>
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
                            style={({ pressed: e, hovered: t }) => [
                              y.actionBtn,
                              // 文が長いので1行いっぱいを使う。space-around の
                              // 折り返しに任せると右へ寄って見える
                              { flexBasis: '100%', justifyContent: 'center' },
                              t && { backgroundColor: '#FFE5E5' },
                              e && { opacity: 0.7 },
                            ]}
                            onPress={() => {
                              交代を書く(archerId, 交代.位置, '', null);
                              onClose();
                            }}
                          >
                            <Icons.Ionicons name="close-circle" size={18} color="#FF3B30" />
                            <Text style={[y.actionBtnText, { color: '#FF3B30' }]}>
                              {交代.位置 + 1}
                              {'射目〜 '}
                              {交代.名}
                              {' の交代を取り消す'}
                            </Text>
                          </Pressable>
                        ))
                      : []),
                  ]}
                  {_ ? (
                    <View style={y.guestInputRow}>
                      <TextInput
                        style={y.guestInput}
                        placeholder="ゲスト名"
                        value={G}
                        onChangeText={K}
                        autoFocus
                        onSubmitEditing={J}
                      />
                      <TouchableOpacity onPress={J}>
                        <Text style={y.guestConfirmText}>決定</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          N(false);
                          K('');
                        }}
                      >
                        <Icons.Ionicons name="close" size={20} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed: e, hovered: t }) => [
                        y.actionBtn,
                        t && { backgroundColor: '#E5E5EA' },
                        e && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        N(true);
                      }}
                    >
                      <Icons.Ionicons name="person-outline" size={18} color="#5856D6" />
                      <Text style={[y.actionBtnText, { color: '#5856D6' }]}>ゲスト登録</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            {/* 区切りのときだけ出す。チーム名を入れる道は長押ししか無く、 */
            /* 気づけなかった（押す＝消す だったので、なおさら触れない） */}
            {jVal && onチーム名 && (
              <Pressable
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#F2F7FF' },
                  e && { opacity: 0.7 },
                ]}
                onPress={onチーム名}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[y.menuText, { color: '#007AFF', fontWeight: 'bold' }]}>
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
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#F2F7FF' },
                  e && { opacity: 0.7 },
                ]}
                onPress={() => on動かす('前')}
                accessibilityLabel="立ち順で1つ前へ動かす"
              >
                <Text style={[y.menuText, { color: '#007AFF' }]}>
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
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#F2F7FF' },
                  e && { opacity: 0.7 },
                ]}
                onPress={() => on動かす('後')}
                accessibilityLabel="立ち順で1つ後ろへ動かす"
              >
                <Text style={[y.menuText, { color: '#007AFF' }]}>
                  {横に並べている ? '下へ動かす' : '左へ動かす'}
                </Text>
                <Icons.Ionicons
                  name={横に並べている ? 'arrow-down' : 'arrow-back'}
                  size={20}
                  color="#007AFF"
                />
              </Pressable>
            )}
            <View style={y.dividerFull} />
            {!jVal && !isTotalCalculator && (
              <>
                <View style={y.sectionHeader}>
                  <Text style={y.sectionHeaderText}>メンバーを選択</Text>
                </View>
                <View style={y.searchRow}>
                  <Icons.Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                  <TextInput
                    style={y.searchInput}
                    placeholder="メンバーを検索"
                    value={O}
                    onChangeText={M}
                    placeholderTextColor="#8E8E93"
                  />
                  {'' !== O && (
                    <TouchableOpacity onPress={() => M('')}>
                      <Icons.Ionicons name="close-circle" size={18} color="#C6C6C8" />
                    </TouchableOpacity>
                  )}
                </View>
                {/* 男女で絞る。男女別の立ちを組むとき、毎回名前を探さずに済む */}
                <View style={y.男女の絞りの列}>
                  {['全員', '男子', '女子'].map((名) => (
                    <TouchableOpacity
                      key={`絞り-${名}`}
                      style={[y.男女の絞りのボタン, 男女の絞り === 名 && y.男女の絞りのボタン選択中]}
                      onPress={() => set男女の絞り(名)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: 男女の絞り === 名 }}
                    >
                      <Text style={[y.男女の絞りの字, 男女の絞り === 名 && y.男女の絞りの字選択中]}>
                        {名}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={y.section}>
                  {activeGroups.map((group) => {
                    const gStr = group.grade.toString();
                    const isOpen = expandedActiveGrades.has(gStr);
                    return (
                      <React.Fragment key={`group-${group.grade}`}>
                        <TouchableOpacity style={y.termHeader} onPress={() => toggleActiveGrade(gStr)}>
                          <Text style={y.termTitle}>
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
                          group.members.map((e, idx) => {
                            const sVal = q.some((t) => t.memberId === e.id);
                            return (
                              <React.Fragment key={e.id}>
                                {idx > 0 && <View style={[y.divider, { marginLeft: 32 }]} />}
                                <Pressable
                                  style={({ pressed: e, hovered: t }) => [
                                    y.menuItem,
                                    { paddingLeft: 32 },
                                    sVal && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                                    !sVal && t && { backgroundColor: '#F2F2F7' },
                                    e && { opacity: 0.7 },
                                  ]}
                                  onPress={() => $(e)}
                                >
                                  <Text
                                    style={[
                                      y.menuText,
                                      '男子' === e.gender && { color: '#007AFF' },
                                      '女子' === e.gender && { color: '#FF2D55' },
                                      sVal && { opacity: 0.5 },
                                    ]}
                                  >
                                    {e.name}{' '}
                                    <Text style={{ fontSize: 11, color: '#8E8E93' }}>
                                      {e.termKi ? `(${e.termKi}期)` : ''}
                                    </Text>
                                  </Text>
                                  {sVal && (
                                    <View style={y.selectedBadge}>
                                      <Text style={y.selectedBadgeText}>選択済</Text>
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
              <View style={y.sectionHeader}>
                <Text style={y.sectionHeaderText}>卒業生を選択</Text>
              </View>
            )}
            {!jVal && !isTotalCalculator && (
              <View style={y.section}>
                {alumniByTerm.map((e) => (
                  <React.Fragment key={e.term}>
                    <TouchableOpacity style={y.termHeader} onPress={() => toggleTerm(e.term)}>
                      <Text style={y.termTitle}>{999 === Number(e.term) ? '不明' : e.term}期</Text>
                      <Icons.Ionicons
                        name={expandedTerms.has(e.term) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                    {expandedTerms.has(e.term) &&
                      e.members.map((e, t) => {
                        const sVal = q.some((t) => t.memberId === e.id);
                        return (
                          <React.Fragment key={e.id}>
                            <View style={[y.divider, { marginLeft: 32 }]} />
                            <Pressable
                              style={({ pressed: e, hovered: t }) => [
                                y.menuItem,
                                { paddingLeft: 32 },
                                sVal && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                                !sVal && t && { backgroundColor: '#F2F2F7' },
                                e && { opacity: 0.7 },
                              ]}
                              onPress={() => $(e)}
                            >
                              <Text
                                style={[
                                  y.menuText,
                                  '男子' === e.gender && { color: '#007AFF' },
                                  '女子' === e.gender && { color: '#FF2D55' },
                                  sVal && { opacity: 0.5 },
                                ]}
                              >
                                {e.name} <Text style={{ fontSize: 11, color: '#8E8E93' }}>(卒業生)</Text>
                              </Text>
                              {sVal && (
                                <View style={y.selectedBadge}>
                                  <Text style={y.selectedBadgeText}>選択済</Text>
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
            <View style={y.dividerFull} />
            <View style={y.section}>
              <Pressable
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#F2F2F7' },
                  e && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onAddArcher) onAddArcher(pVal + 1);
                  else addArcher(pVal + 1, undefined);
                  onClose();
                }}
              >
                <Text style={y.menuText}>左に射手を追加</Text>
                <Icons.Ionicons name="person-add-outline" size={20} color="#8E8E93" />
              </Pressable>
              <View style={y.divider} />
              <Pressable
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#F2F2F7' },
                  e && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onAddSeparator) onAddSeparator(pVal + 1);
                  else addSeparator(pVal + 1);
                  onClose();
                }}
              >
                <Text style={y.menuText}>左に間隔を追加</Text>
                <Icons.Ionicons name="reorder-four-outline" size={20} color="#8E8E93" />
              </Pressable>
              <View style={y.divider} />
              <Pressable
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#F2F2F7' },
                  e && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onAddTotal) onAddTotal(pVal + 1);
                  else addTotalCalculator(pVal + 1);
                  onClose();
                }}
              >
                <Text style={y.menuText}>左に計を追加</Text>
                <Icons.Ionicons name="calculator-outline" size={20} color="#8E8E93" />
              </Pressable>
              <View style={y.divider} />
              {/* 合計の列だけに出す。数える範囲を切り替える。 */
              /* 「計」は区切りで止まる（1立ぶん）、「総計」は端まで数える */}
              {isTotalCalculator && on合計の範囲 && (
                <Pressable
                  style={({ pressed: e, hovered: t }) => [
                    y.menuItem,
                    t && { backgroundColor: '#F2F7FF' },
                    e && { opacity: 0.7 },
                  ]}
                  onPress={on合計の範囲}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[y.menuText, { color: '#007AFF', fontWeight: 'bold' }]}>
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
                style={({ pressed: e, hovered: t }) => [
                  y.menuItem,
                  t && { backgroundColor: '#FFF0F0' },
                  e && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onDeleteArcher) onDeleteArcher(archerId);
                  else deleteArcher(archerId);
                  onClose();
                }}
              >
                <Text style={[y.menuText, { color: '#FF3B30', fontWeight: 'bold' }]}>削除</Text>
                <Icons.Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
exports.ArcherActionModal = j;
const y = StyleSheet.create({
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
