'use strict';

const React = require('react');
const {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
} = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const Icons = require('@expo/vector-icons');
const { IS_IOS } = require('./IS_WEB');
const { 立の数, 立の頭の射, 学年でまとめる } = require('./syncRules');
const ManualSubstitutionModal = ({ visible, archerId, onClose }) => {
  const { members, shotsPerRound, setArcherMember, setArcherGuestName, setSubstitution } = useScoreStore();
  const [番号の入力, 番号の入力を置く] = React.useState('');
  const // 交代は立の切れ目ですることが多い。射目でも入れられるよう、単位を選べる
    [単位, 単位を置く] = React.useState('立目');
  const // 閉じた学年を覚える（開いた学年ではなく）。初めは全部開く。
    // 開く側を決め打ちすると、進級で出る5年生のように想定外の学年が
    // 閉じたまま出て、中の人に辿り着けなくなる
    [閉じた学年, 閉じた学年を置く] = React.useState(new Set());
  const [検索の文, 検索の文を置く] = React.useState('');
  const [客名の入力, 客名の入力を置く] = React.useState('');
  const 候補 = (
    '' === 検索の文.trim()
      ? [...members]
      : members.filter((部員) => (部員.name || '').toLowerCase().includes(検索の文.toLowerCase()))
  ).sort((甲, 乙) => {
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
  const 立か = '立目' === 単位;
  const 上限 = 立か ? 立の数(shotsPerRound) : shotsPerRound;
  const 学年を開け閉め = (印) => {
    閉じた学年を置く((前) => {
      const 次 = new Set(前);
      return (次.has(印) ? 次.delete(印) : 次.add(印), 次);
    });
  };
  const // 名前で絞り込んでいるあいだは開いておく。閉じたままだと
    // 探した人が隠れたままで「居ない」と見えてしまう
    開いているか = (学年) => '' !== 検索の文.trim() || !閉じた学年.has(String(学年));
  const // 交代相手を学年でまとめる。人の選択と同じで、0年（学年なし）は
    // 「その他/ゲスト」として最後に置く
    学年ごと = 学年でまとめる(候補);
  const // 選べる番号。1立目、2立目…（射目のときは 1射目、2射目…）
    番号たち = Array.from({ length: 上限 }, (_, 番) => 番 + 1);
  const 選んだ = parseInt(番号の入力, 10);
  const // 入れた番号が何射目にあたるか。立なら、その立の1本目
    何射目 = () => {
      const 番号 = parseInt(番号の入力, 10);
      if (isNaN(番号) || 番号 < 1 || 番号 > 上限) return null;
      return 立か ? 立の頭の射(番号, shotsPerRound) : 番号 - 1;
    };
  const 交代を入れる = (名前, 部員ID) => {
    const 射番 = 何射目();
    null !== 射番 && archerId && (setSubstitution(archerId, 射番, 名前, 部員ID), 入力を空にする());
  };
  const 入力を空にする = () => {
    番号の入力を置く('');
    検索の文を置く('');
    客名の入力を置く('');
    単位を置く('立目');
    onClose();
  };
  return visible ? (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : undefined} style={styles.overlay}>
        <TouchableWithoutFeedback onPress={入力を空にする}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={入力を空にする} style={styles.headerBtn}>
              <Text style={styles.headerBtnTxt}>閉じる</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>途中交代の設定</Text>
            <View style={styles.headerBtn} />
          </View>
          {/* 中身は窓ごと縦に流す。中に別々の流せる箱を置くと、細い画面で */
          /* 下の相手の一覧が0pxまで潰れ、部員が1人も見えなくなる */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.中身} // 上の「交代するタイミング」は貼り付けたまま、下だけ流す。
            // 細い画面で相手の一覧が潰れるのを避けつつ、選んだ立目を見ながら探せる
            stickyHeaderIndices={[0]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.貼り付け}>
              <Text style={styles.sectionTitle}>交代するタイミング</Text>
              <View style={styles.単位の列}>
                {['立目', '射目'].map((名) => (
                  <TouchableOpacity
                    key={名}
                    style={[styles.単位ボタン, 名 === 単位 && styles.単位ボタン選択中]}
                    onPress={() => {
                      単位を置く(名);
                      番号の入力を置く('');
                    }}
                  >
                    <Text style={[styles.単位の字, 名 === 単位 && styles.単位の字選択中]}>{名}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* 番号は打ち込まずに選ぶ。記録表で人を選ぶのと同じ並びにしてある */}
              <View style={styles.番号の一覧}>
                {番号たち.map((番号) => (
                  <TouchableOpacity
                    key={String(番号)}
                    style={[styles.番号の行, 番号 === 選んだ && styles.番号の行選択中]}
                    onPress={() => 番号の入力を置く(String(番号))}
                  >
                    <Text style={[styles.番号の字, 番号 === 選んだ && styles.番号の字選択中]}>
                      {番号}
                      {単位}
                    </Text>
                    {番号 === 選んだ ? <Icons.Ionicons name="checkmark" size={20} color="#007AFF" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.案内}>
                {null === 何射目()
                  ? '上から交代するところを選んでください'
                  : 立か
                    ? `${選んだ}立目（${何射目() + 1}射目）から交代します`
                    : `${何射目() + 1}射目から交代します`}
              </Text>
            </View>
            <Text style={styles.sectionTitle}>交代相手（メンバーまたはゲスト）</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="名前で検索..."
              value={検索の文}
              onChangeText={検索の文を置く}
            />
            <View style={styles.guestRow}>
              <Icons.Ionicons name="person-add" size={20} color="#007AFF" />
              <TextInput
                style={styles.guestInput}
                placeholder="ゲスト名を入力"
                value={客名の入力}
                onChangeText={客名の入力を置く}
              />
              <TouchableOpacity
                style={[styles.confirmBtn, (!客名の入力 || null === 何射目()) && styles.confirmBtnDisabled]}
                onPress={() => {
                  if ('' !== 客名の入力.trim()) 交代を入れる(客名の入力.trim());
                }}
                disabled={!客名の入力 || null === 何射目()}
              >
                <Text style={styles.confirmTxt}>確定</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {学年ごと.map((組) => (
                <View key={String(組.学年)}>
                  <TouchableOpacity
                    style={styles.学年の見出し}
                    onPress={() => 学年を開け閉め(String(組.学年))}
                  >
                    <Text style={styles.学年の字}>
                      {組.題}
                      {' ('}
                      {組.人たち.length}人)
                    </Text>
                    <Icons.Ionicons
                      name={開いているか(組.学年) ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>
                  {[
                    ...(開いているか(組.学年) ? 組.人たち : []).map((部員, 順) => {
                      if (!部員 || !部員.name || 'string' != typeof 部員.name) return null;
                      const 名の片 = 部員.name.trim().split(/[\s\u3000]+/);
                      const 姓 = 名の片 && 名の片.length > 0 ? 名の片[0] || '' : '不明';
                      const 名前 = (名の片 && 名の片.length > 1 && 名の片[1]) || '';
                      return (
                        <TouchableOpacity
                          key={typeof 部員.id === 'string' ? 部員.id : `subst-${組.学年}-${順}-${部員.name}`}
                          style={styles.memberItem}
                          onPress={() => {
                            交代を入れる(部員.name, 部員.id);
                          }}
                        >
                          <Text style={styles.memberName}>
                            {姓} {名前}
                          </Text>
                          <Text style={styles.memberSub}>{部員.gender}</Text>
                        </TouchableOpacity>
                      );
                    }),
                  ]}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  ) : null;
};
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  container: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  headerBtn: { width: 60 },
  headerBtnTxt: { fontSize: 17, color: '#007AFF' },
  content: { flex: 1 },
  中身: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  // 貼り付ける側。流れる中身が下からのぞかないよう背景を敷く
  貼り付け: { backgroundColor: '#F2F2F7', paddingBottom: 4 },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  単位の列: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  // 番号の一覧。人を選ぶ一覧（list / memberItem）と同じ見た目にそろえる
  // flexGrow: 0 が無いと、行が少なくても maxHeight ぶんの白い箱が残る。
  // flexShrink: 0 が無いと、細い画面（iPhone SE）で52pxまで潰れ、
  // 5立ぶんの一覧が1行しか見えなくなる。縮むのは下の相手の一覧に任せる
  // 窓ごと流すので、ここでは高さを縛らない
  // 貼り付ける側が大きくなりすぎないよう高さを縛る。射目にすると
  // 8〜20行に伸び、相手の一覧が画面の外へ押し出されていた
  番号の一覧: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 6,
    maxHeight: 148,
    overflow: 'scroll',
  },
  番号の行: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  番号の行選択中: { backgroundColor: 'rgba(0,122,255,0.08)' },
  番号の字: { fontSize: 16, color: '#000' },
  番号の字選択中: { color: '#007AFF', fontWeight: 'bold' },
  // 学年の見出し。人の選択（termHeader / termTitle）と同じ見た目
  学年の見出し: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  学年の字: { fontSize: 15, color: '#333', fontWeight: '600' },
  単位ボタン: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
  },
  単位ボタン選択中: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  単位の字: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  単位の字選択中: { color: '#FFF' },
  案内: { fontSize: 13, color: '#8E8E93', marginLeft: 4, marginBottom: 24 },
  searchBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  guestInput: { flex: 1, fontSize: 16, color: '#000', height: 40 },
  confirmBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  confirmBtnDisabled: { backgroundColor: '#A2C8F2' },
  confirmTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  list: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  memberName: { fontSize: 16, color: '#000' },
  memberSub: { fontSize: 12, color: '#8E8E93' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.ManualSubstitutionModal = ManualSubstitutionModal;
