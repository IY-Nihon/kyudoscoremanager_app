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
  const [T, W] = React.useState('');
  const [z, D] = React.useState(false);
  const [q, v] = React.useState(null);
  const [k, A] = React.useState('');
  const [R, H] = React.useState('未設定');
  const [P, _] = React.useState('1');
  const [M, O] = React.useState('');
  const G = useScoreStore((e) => e.currentFreshmanTerm);
  const [L, N] = React.useState(false);
  // 端末の日付で出す。toISOString は世界標準時なので、日本では
  // 朝9時より前に開くと前の日が入ってしまう（弓具を変えた日がずれる）
  const [V, K] = React.useState(
    (() => {
      const 今 = new Date();
      return `${今.getFullYear()}-${String(今.getMonth() + 1).padStart(2, '0')}-${String(今.getDate()).padStart(2, '0')}`;
    })()
  );
  const [Y, $] = React.useState('');
  const [U, J] = React.useState('');
  const { addEquipment, deleteEquipment } = useScoreStore();
  const [isAlumniExpanded, setIsAlumniExpanded] = React.useState(false);
  const [calVis, setCalVis] = React.useState(false);
  // 個人ログインでは自分だけを出す。他人は開けない作りなので、並べても
  // 押せない行が続くだけだった。人数の多い団体ほど自分を探しにくい。
  // 弓具を登録しに来る人にとって、この画面に用があるのは自分の行だけ
  const 見せる名簿 =
    'member' === activeRole ? (members || []).filter((x) => x && x.id === myMemberId) : members || [];
  const filteredMembers = 見せる名簿.filter(
    (e) => e && e.name && e.name.toLowerCase().includes(T.toLowerCase())
  );
  const activeMembers = filteredMembers
    .filter((m) => (m.grade || 0) < 5)
    .sort((e, t) => {
      const n = undefined === e.grade || null === e.grade ? 99 : Number(e.grade);
      const o = undefined === t.grade || null === t.grade ? 99 : Number(t.grade);
      const l = 0 === n ? 99 : n;
      const a = 0 === o ? 99 : o;
      if (l !== a) return l - a;
      const s = (e) => {
        const t = (e || '').trim();
        return '男子' === t ? 0 : '女子' === t ? 1 : 2;
      };
      const c = s(e.gender) - s(t.gender);
      return 0 !== c ? c : (e.name || '').localeCompare(t.name || '', 'ja');
    });
  const graduateMembers = filteredMembers
    .filter((m) => m.grade === 5)
    .sort((e, t) => {
      const kiA = e.termKi || 0;
      const kiB = t.termKi || 0;
      if (kiB !== kiA) return kiB - kiA;
      const s = (e) => {
        const t = (e || '').trim();
        return '男子' === t ? 0 : '女子' === t ? 1 : 2;
      };
      const c = s(e.gender) - s(t.gender);
      return 0 !== c ? c : (e.name || '').localeCompare(t.name || '', 'ja');
    });
  const graduateGroups = graduateMembers.reduce((groups, member) => {
    const ki = member.termKi || '期不明';
    if (!groups[ki]) groups[ki] = [];
    groups[ki].push(member);
    return groups;
  }, {});
  const renderMemberCard = (e) => {
    const t =
      e.equipments && e.equipments.length > 0 ? [...e.equipments].sort((e, t) => t.date - e.date)[0] : null;
    return (
      <Pressable
        key={typeof e.id === 'string' ? e.id : `member-${e.name}`}
        style={({ hovered: e_h }) => [
          j.memberCard,
          e_h && { backgroundColor: 'rgba(0,122,255,0.05)' },
          IS_WEB && { cursor: 'pointer' },
        ]}
        onPress={() => {
          if ('member' !== activeRole || e.id === myMemberId) ee(e);
          else Alert.alert('制限', 'メンバーモードでは自分以外の情報は編集できません。');
        }}
      >
        <View style={j.memberInfoMain}>
          <View style={j.nameRow}>
            <Text
              style={[
                j.genderDot,
                { color: '男子' === e.gender ? '#007AFF' : '女子' === e.gender ? '#FF2D55' : '#8E8E93' },
              ]}
            >
              ●
            </Text>
            <Text style={j.memberName} numberOfLines={1}>
              {e.name}
            </Text>
          </View>
          <Text style={j.memberSub}>
            {e.termKi ? `${e.termKi}期 / ` : ''}
            {e.gender}
            {' / '}
            {e.grade === 5 ? '卒業生' : e.grade > 0 ? `${e.grade}年` : 'その他'}
          </Text>
        </View>
        <View style={j.memberEqInfo}>
          {/* 弓力は弓具の中身。個人ログインでは自分のぶんだけ見せる。 */
          /* 他人の行では「弓具未登録」も出さない（登録の有無も中身のうち） */}
          {'member' === activeRole && e.id !== myMemberId ? null : t?.weight ? (
            <View style={j.listWeightBadge}>
              <Text style={j.listWeightText}>
                {t.weight}
                <Text style={{ fontSize: 10 }}>kg</Text>
              </Text>
            </View>
          ) : (
            <Text style={j.noEqText}>弓具未登録</Text>
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
    ee(自分);
  }, [activeRole, members, myMemberId]);
  const ee = (e) => {
    if ((v(e), A(e.name), H(e.gender), _(e.grade.toString()), !e.termKi && G)) {
      const t = e.grade || 1;
      O(t >= 1 && t <= 5 ? String(G - (t - 1)) : '');
    } else O(e.termKi?.toString() || '');
    D(true);
  };
  const te = (e, t) => {
    const n = `${t} さんを削除しますか？`;
    const o = () => {
      deleteMember(e);
      D(false);
    };
    // ブラウザの確認窓は使わない。受け口（alertBridge）がアプリの中の窓へ流す
    Alert.alert('確認', n, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: o },
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
    const t = members.find((e) => e.id === 部員id);
    return t ? (
      <>
        {/* 見出しと×は、窓として出すときだけ。編集画面の中に並べるときは、 */
        /* すぐ上に「弓具管理」の見出しが在るので二重になる */}
        {閉じるを出す ? (
          <View style={j.eqModalHeader}>
            <Text style={j.modalTitle}>弓具変更履歴 ({t.name})</Text>
            <TouchableOpacity
              onPress={() => {
                N(false);
                setCalVis(false);
              }}
            >
              <Icons.Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={j.eqForm}>
          <View style={j.eqInputRow}>
            <TouchableOpacity
              style={[j.eqInput, { flex: 1, minWidth: 0, justifyContent: 'center' }]}
              onPress={() => setCalVis(true)}
            >
              <Text style={{ fontSize: 15, color: '#000' }}>{V}</Text>
            </TouchableOpacity>
            <View style={[j.eqWeightInputWrapper, { flex: 1, minWidth: 0 }]}>
              <TextInput
                style={j.eqInputInside}
                placeholder="弓力"
                value={U}
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
                  J(filtered);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={j.kgUnit}>kg</Text>
            </View>
          </View>
          <TextInput
            style={[j.eqInput, { height: 60 }]}
            placeholder="内容 (弦交換、弓の変更など)"
            value={Y}
            onChangeText={$}
            multiline
          />
          <TouchableOpacity
            style={j.eqAddBtn}
            onPress={() => {
              (Y.trim() || U.trim()) &&
                (addEquipment(t.id, {
                  date: new Date(V + 'T12:00:00').getTime() || Date.now(),
                  note: Y,
                  weight: U,
                }),
                $(''),
                J(''));
            }}
          >
            <Text style={j.eqAddBtnText}>履歴を追加</Text>
          </TouchableOpacity>
        </View>
        <FlatList // 画面として出すときは、外側の ScrollView が流す。
          // ここでも流すと入れ子になって、指の動きを取り合う
          scrollEnabled={!!閉じるを出す}
          data={[...(t.equipments || [])].sort((e, t) => t.date - e.date)}
          keyExtractor={(e, index) => (typeof e.id === 'string' ? e.id : `eq-${index}-${e.date}`)}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <View style={j.eqItem}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={j.eqItemHeader}>
                  <Text style={j.eqItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
                  {item.weight && (
                    <View style={j.eqWeightBadge}>
                      <Text style={j.eqWeightText}>
                        {item.weight}
                        {' kg'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={j.eqItemNote}>{item.note}</Text>
              </View>
              <TouchableOpacity // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                accessible
                accessibilityRole="button"
                accessibilityLabel="この弓具の記録を消す"
                aria-label="この弓具の記録を消す"
                onPress={() => deleteEquipment(t.id, item.id)}
                style={{ padding: 4 }}
              >
                <Icons.Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={j.emptyText}>履歴がありません</Text>}
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
      style={窓として出す ? j.modalContent : { flex: 1, width: '100%', backgroundColor: '#FFF' }}
    >
      {/* 見出しと×は窓のときだけ。画面のときは上に「自分の情報」が在る */}
      {窓として出す ? (
        <View style={j.modalHeader}>
          <Text style={j.modalTitle}>{q ? 'メンバー編集' : '新規登録'}</Text>
          <TouchableOpacity onPress={() => D(false)} style={j.closeBtn}>
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
                <Text style={j.label}>名前</Text>,
                <TextInput
                  style={j.input}
                  value={k}
                  onChangeText={A}
                  placeholder="例: 山田 太郎"
                  placeholderTextColor="#C7C7CC"
                />,
                <Text style={j.inputHelperText}>姓名の間にスペースを入力してください</Text>,
                q && q.personalId && (
                  <>
                    <Text style={j.label}>個人ID (自動採番)</Text>
                    <View style={[j.input, { justifyContent: 'center', opacity: 0.6 }]}>
                      <Text style={{ fontSize: 16 }}>
                        {isAdminMode || q.id === myMemberId ? q.personalId : '******** (管理者のみ表示)'}
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
            <Text style={j.label}>性別</Text>
            <View style={j.genderRow}>
              {['男子', '女子', '未設定'].map((e) => (
                <Pressable
                  key={e}
                  style={({ hovered }) => [
                    j.genderBtn,
                    R === e && j.genderBtnActive,
                    hovered && R !== e && { backgroundColor: '#E5E5EA' },
                  ]}
                  onPress={() => H(e)}
                >
                  <Text style={[j.genderBtnText, R === e && j.genderBtnTextActive]}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={j.label}>学年</Text>
            <View style={j.stepperContainer}>
              <Text style={j.stepperValue}>{'0' === P ? 'その他' : '5' === P ? '卒業生' : `${P}年生`}</Text>
              <View style={j.stepperControls}>
                <Pressable
                  style={({ hovered: e }) => [j.stepperBtn, e && { backgroundColor: '#D1D1D6' }]}
                  onPress={() => {
                    const e = parseInt(P) || 0;
                    if (e > 0) {
                      const t = e - 1;
                      _(String(t));
                      if (G && t >= 1 && t <= 5) O(String(G - (t - 1)));
                    }
                  }}
                >
                  <Icons.Ionicons name="remove" size={24} color="#007AFF" />
                </Pressable>
                <View style={j.stepperDivider} />
                <Pressable
                  style={({ hovered: e }) => [j.stepperBtn, e && { backgroundColor: '#D1D1D6' }]}
                  onPress={() => {
                    const e = parseInt(P) || 0;
                    if (e < 5) {
                      const t = e + 1;
                      _(String(t));
                      if (G && t >= 1 && t <= 5) O(String(G - (t - 1)));
                    }
                  }}
                >
                  <Icons.Ionicons name="add" size={24} color="#007AFF" />
                </Pressable>
              </View>
            </View>
            <Text style={j.label}>期</Text>
            <TextInput
              style={j.input}
              value={M}
              onChangeText={O}
              placeholder="例: 70"
              keyboardType="number-pad"
              placeholderTextColor="#C7C7CC"
            />
          </>
        ) : (
          <View style={j.きまり}>
            <View style={j.きまりの行}>
              <Text style={j.きまりの名}>名前</Text>
              <Text style={j.きまりの値}>{(いまの自分 || {}).name || k || '未設定'}</Text>
            </View>
            {q && q.personalId ? (
              <View style={j.きまりの行}>
                <Text style={j.きまりの名}>個人ID</Text>
                <Text style={j.きまりの値}>{q.personalId}</Text>
              </View>
            ) : null}
            <View style={j.きまりの行}>
              <Text style={j.きまりの名}>性別</Text>
              <Text style={j.きまりの値}>{(いまの自分 || {}).gender || R || '未設定'}</Text>
            </View>
            <View style={j.きまりの行}>
              <Text style={j.きまりの名}>学年</Text>
              <Text style={j.きまりの値}>
                {(() => {
                  const 学 = String((いまの自分 && いまの自分.grade != null ? いまの自分.grade : P) ?? '');
                  return '5' === 学 ? '卒業生' : '0' === 学 ? 'その他' : `${学}年`;
                })()}
              </Text>
            </View>
            <View style={[j.きまりの行, { borderBottomWidth: 0 }]}>
              <Text style={j.きまりの名}>期</Text>
              <Text style={j.きまりの値}>
                {(() => {
                  const 期 = (いまの自分 && いまの自分.termKi) || M;
                  return 期 ? `${期}期` : '未設定';
                })()}
              </Text>
            </View>
            <Text style={j.きまりの但し書き}>名前・性別・学年・期は団体の担当者が直します</Text>
          </View>
        )}
        {/* 弓具は、団体アカウントか本人だけ。個人ログインで他人の */
        /* 画面を開く道は塞いであるが、ここでも確かめる */}
        {q && ('member' !== activeRole || q.id === myMemberId) && (
          <>
            <Text style={j.label}>弓具管理</Text>
            {/* 個人ログインでは、窓を挟まずにそのまま履歴を出す。 */
            /* 自分のぶんしか触れないので、隠す意味がない */}
            {'member' === activeRole ? (
              弓具履歴の中身(q?.id, false)
            ) : (
              <Pressable
                style={({ hovered: e }) => [j.eqHistoryBtn, e && { backgroundColor: '#E5E5EA' }]}
                onPress={() => N(true)}
              >
                <Icons.Ionicons name="construct-outline" size={20} color="#007AFF" />
                <Text style={j.eqHistoryBtnText}>弓具変更履歴を表示・編集</Text>
              </Pressable>
            )}
          </>
        )}
        {[
          ...(窓として出す
            ? [
                <View style={j.modalFooter}>
                  {q && 'member' !== activeRole ? (
                    <TouchableOpacity style={j.deleteBtn} onPress={() => te(q.id, q.name)}>
                      <Icons.Ionicons
                        name="trash-outline"
                        size={18}
                        color="#FF3B30"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={j.deleteBtnText}>メンバーを削除</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    style={j.saveBtn}
                    onPress={() => {
                      if (!k.trim()) return void Alert.alert('お知らせ', '名前を入力してください');
                      const e = parseInt(P) || 0;
                      const t = '' === M ? undefined : parseInt(M) || undefined;
                      if (q) updateMember(q.id, { name: k, gender: R, grade: e, termKi: t });
                      else addMember(k, R, e, t);
                      D(false);
                    }}
                  >
                    <Text style={j.saveBtnText}>保存する</Text>
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
      <SafeAreaView style={j.safeArea}>
        <View style={j.header}>
          <View>
            <Text style={j.title}>自分の情報</Text>
            {(publicGroupId || activeGroupId) && (
              <View style={j.headerGroupIdBadge}>
                <Text style={j.headerGroupIdText}>
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
            <Text style={j.emptyText}>自分の情報を読み込んでいます</Text>
          </View>
        )}
        <CustomCalendarModal
          visible={calVis}
          onClose={() => setCalVis(false)}
          selectedDate={new Date(V + 'T12:00:00')}
          onSelectDate={(date) => {
            K(
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
    <SafeAreaView style={j.safeArea}>
      <View style={j.header}>
        <View>
          <Text style={j.title}>メンバー管理</Text>
          {(publicGroupId || activeGroupId) && (
            <View style={j.headerGroupIdBadge}>
              <Text style={j.headerGroupIdText}>
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
              style={({ hovered: e }) => [
                j.addBtn,
                e && { backgroundColor: 'rgba(0,122,255,0.05)', borderRadius: 8, padding: 4 },
              ]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
              accessible
              accessibilityRole="button"
              accessibilityLabel="部員を追加"
              aria-label="部員を追加"
              onPress={() => {
                v(null);
                A('');
                H('未設定');
                _('1');
                O(G ? String(G) : '');
                D(true);
              }}
            >
              <Icons.Ionicons name="person-add" size={24} color="#007AFF" />
            </Pressable>
          )}
        </View>
      </View>
      <View style={j.searchBar}>
        <Icons.Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput style={j.searchInput} placeholder="メンバーを検索..." value={T} onChangeText={W} />
        {'' !== T && (
          <TouchableOpacity // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
            accessible
            accessibilityRole="button"
            accessibilityLabel="絞り込みを消す"
            aria-label="絞り込みを消す"
            onPress={() => W('')}
          >
            <Icons.Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={activeMembers}
        keyExtractor={(e, index) => (typeof e.id === 'string' ? e.id : `member-${index}-${e.name}`)}
        contentContainerStyle={j.listContent}
        ListEmptyComponent={
          activeMembers.length === 0 && graduateMembers.length === 0 ? (
            <View style={j.empty}>
              <Text style={j.emptyText}>メンバーがいません</Text>
            </View>
          ) : null
        }
        renderItem={({ item: e }) => renderMemberCard(e)}
        ListFooterComponent={
          graduateMembers.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Pressable style={j.alumniHeader} onPress={() => setIsAlumniExpanded(!isAlumniExpanded)}>
                <Text style={j.alumniHeaderText}>{`卒業生を表示 (${graduateMembers.length}名)`}</Text>
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
                      <Text style={j.alumniGroupTitle}>{ki === '期不明' ? '期不明' : `${ki}期`}</Text>
                      {graduateGroups[ki].map(renderMemberCard)}
                    </View>
                  ))}
            </View>
          ) : null
        }
      />
      <Modal visible={z} animationType="slide" transparent>
        <View style={j.modalOverlay}>{編集の中身(true)}</View>
      </Modal>
      <Modal visible={L} animationType="slide" transparent>
        <View style={j.modalOverlay}>
          <View style={[j.modalContent, { height: '80%', padding: 0 }]}>{弓具履歴の中身(q?.id, true)}</View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={calVis}
        onClose={() => setCalVis(false)}
        selectedDate={new Date(V + 'T12:00:00')}
        onSelectDate={(date) => {
          K(
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
const j = StyleSheet.create({
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
