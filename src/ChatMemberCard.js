'use strict';

/**
 * AI アシスタントの部員登録のカード（2026-11-08 作り直し。本人「ダサいので作り直して」→ 案 A の改良で決めた）。
 *
 * AI が addMember / addMembers を呼ぶと、人ごとに actionCard が会話に並ぶ。それを 1 枚にまとめて出す。
 *   ・1 人 1 行（名前・学年・性別）。学年と性別は押すとその場で直せる（AI の読み違えを頼み直さずに直す）
 *   ・× で外す。名簿に同じ名前の人がいれば、初めから外しておき「同じ名前の人がもういます」と出す（「戻す」で入れる）
 *   ・押すのは「N人を登録」1 つだけ。「やめる」は小さな字
 *   ・決めたあとは「✓ N人を登録しました」と名前だけにたたみ、「メンバーで見る」で名簿へ
 */
const React = require('react');
const { View, Text, Pressable, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const 学 = require('./gakunen');

/** 名前を比べる形（空白の有無を見ない。\s は全角の空白も含む） */
const 比べる名前 = (名) => String(名 || '').replace(/\s+/g, '');

const 性別たち = ['男子', '女子', '未設定'];

/**
 * @param {object} props
 * @param {object[]} props.カードたち   同じ頼みから出た actionCard（会話に並んだ順）
 * @param {object[]} props.名簿         今の members（同じ名前を見つけるため）
 * @param {string[]} props.学年の札     選べる学年の値（'1'〜と '0'＝その他）
 * @param {(性別: string) => string} props.性別にそろえる
 * @param {(id: string, 変更: object) => void} props.直す     args の学年・性別、外す を書き換える
 * @param {(足す: string[]) => void} props.決める            足すカードの id（空＝やめる）
 * @param {() => void} props.メンバーを見る
 */
function ChatMemberCard({ カードたち, 名簿, 学年の札, 性別にそろえる, 直す, 決める, メンバーを見る }) {
  const [開いた, 開いたを置く] = React.useState(null); // { id, 種: '学年' | '性別' }
  const 名簿の名前 = React.useMemo(
    () => new Set((名簿 || []).map((人) => 比べる名前(人 && 人.name))),
    [名簿]
  );
  const 待ち = カードたち.some((一つ) => 一つ.status === 'pending');
  const 同じ名前か = (一つ) => 名簿の名前.has(比べる名前(一つ.args && 一つ.args.name));
  // 外すかどうか：押していなければ、名簿に同じ名前の人がいるときだけ外す
  const 外したか = (一つ) => (typeof 一つ.外す === 'boolean' ? 一つ.外す : 同じ名前か(一つ));
  const 入れる人 = カードたち.filter((一つ) => !外したか(一つ));

  if (!待ち) {
    const 登録した = カードたち.filter((一つ) => 一つ.status === 'approved');
    return (
      <View style={styles.カード} testID="部員登録のカード">
        <View style={styles.済みの中}>
          {登録した.length ? (
            <>
              <Text style={styles.済み}>✓ {登録した.length}人を登録しました</Text>
              {登録した.map((一つ) => (
                <Text key={一つ.id} style={styles.済みの名前}>
                  {一つ.args.name}（{学.学年の値の名前(一つ.args.grade)}・
                  {学.性別の名前(性別にそろえる(一つ.args.gender))}）
                </Text>
              ))}
              <Pressable accessibilityRole="button" onPress={メンバーを見る} hitSlop={8}>
                <Text style={styles.見る}>メンバーで見る ›</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.やめた}>登録をやめました</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.カード} testID="部員登録のカード">
      <View style={styles.見出しの段}>
        <Text style={styles.見出し}>メンバーを登録</Text>
        <Text style={styles.人数}>{入れる人.length}人</Text>
      </View>
      {カードたち.map((一つ) => {
        const 外した = 外したか(一つ);
        const 学年 = String(一つ.args.grade ?? '1');
        const 性別 = 性別にそろえる(一つ.args.gender);
        const 開いている = 開いた && 開いた.id === 一つ.id ? 開いた.種 : null;
        const 札 = (種, 字) => (
          <Pressable
            accessibilityRole="button"
            aria-label={`${一つ.args.name}の${種}を直す（今は${字}）`}
            disabled={外した}
            onPress={() => 開いたを置く(開いている === 種 ? null : { id: 一つ.id, 種 })}
            style={[styles.札, 開いている === 種 && styles.札_開いた]}
          >
            <Text style={styles.札の字}>{字} ▾</Text>
          </Pressable>
        );
        return (
          <View key={一つ.id} style={styles.行の枠}>
            <View style={[styles.行, 外した && styles.行_外した]}>
              <View style={styles.名前の枠}>
                <Text style={[styles.名前, 外した && styles.名前_外した]} numberOfLines={1}>
                  {一つ.args.name}
                </Text>
                {同じ名前か(一つ) ? <Text style={styles.注意}>同じ名前の人がもういます</Text> : null}
              </View>
              {札('学年', 学.学年の値の名前(一つ.args.grade))}
              {札('性別', 学.性別の名前(性別))}
              <Pressable
                accessibilityRole="button"
                aria-label={外した ? `${一つ.args.name}を戻す` : `${一つ.args.name}を外す`}
                onPress={() => {
                  開いたを置く(null);
                  直す(一つ.id, { 外す: !外した });
                }}
                hitSlop={10}
                style={styles.外す}
              >
                <Text style={外した ? styles.戻すの字 : styles.外すの字}>{外した ? '戻す' : '×'}</Text>
              </Pressable>
            </View>
            {開いている ? (
              <View style={styles.選びの段}>
                {(開いている === '学年' ? 学年の札 : 性別たち).map((値) => {
                  const 選んだ = 開いている === '学年' ? 値 === 学年 : 値 === 性別;
                  return (
                    <Pressable
                      key={値}
                      accessibilityRole="radio"
                      aria-checked={選んだ}
                      onPress={() => {
                        直す(一つ.id, 開いている === '学年' ? { grade: Number(値) } : { gender: 値 });
                        開いたを置く(null);
                      }}
                      style={[styles.選び, 選んだ && styles.選び_選んだ]}
                    >
                      <Text style={[styles.選びの字, 選んだ && styles.選びの字_選んだ]}>
                        {開いている === '学年' ? 学.学年の値の名前(Number(値)) : 学.性別の名前(値)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
      <View style={styles.下}>
        <Pressable
          accessibilityRole="button"
          disabled={!入れる人.length}
          onPress={() => 決める(入れる人.map((一つ) => 一つ.id))}
          style={[styles.登録, !入れる人.length && styles.登録_押せない]}
          testID="部員登録のカードの登録"
        >
          <Text style={styles.登録の字}>
            {入れる人.length ? `${入れる人.length}人を登録` : '登録する人がいません'}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => 決める([])} hitSlop={8}>
          <Text style={styles.やめる}>やめる</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  カード: {
    backgroundColor: 色.白,
    borderRadius: 16,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 色.区切り_薄い,
    alignSelf: 'stretch',
  },
  見出しの段: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  見出し: { fontSize: 16, fontWeight: 'bold', color: 色.文字 },
  人数: { fontSize: 13, color: 色.灰 },
  行の枠: { borderTopWidth: 1, borderTopColor: 色.区切り_薄い },
  行: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 6 },
  行_外した: { opacity: 0.45 },
  名前の枠: { flex: 1, minWidth: 0 },
  名前: { fontSize: 16, fontWeight: '600', color: 色.文字 },
  名前_外した: { textDecorationLine: 'line-through' },
  注意: { fontSize: 12, color: 色.橙, marginTop: 2 },
  札: {
    borderWidth: 1,
    borderColor: 色.区切り,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  札_開いた: { borderColor: 色.青 },
  札の字: { fontSize: 14, color: 色.青 },
  外す: { minWidth: 32, alignItems: 'flex-end' },
  外すの字: { fontSize: 19, color: 色.灰_薄い },
  戻すの字: { fontSize: 14, color: 色.青 },
  選びの段: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  選び: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 色.地 },
  選び_選んだ: { backgroundColor: 色.青 },
  選びの字: { fontSize: 14, color: 色.文字 },
  選びの字_選んだ: { color: 色.白, fontWeight: 'bold' },
  下: {
    borderTopWidth: 1,
    borderTopColor: 色.区切り_薄い,
    padding: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  登録: {
    alignSelf: 'stretch',
    backgroundColor: 色.青,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  登録_押せない: { backgroundColor: 色.灰_薄い },
  登録の字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  やめる: { color: 色.灰, fontSize: 14, marginTop: 10 },
  済みの中: { padding: 16 },
  済み: { fontSize: 16, fontWeight: 'bold', color: 色.緑, marginBottom: 6 },
  済みの名前: { fontSize: 14, color: 色.文字_二, lineHeight: 22 },
  見る: { fontSize: 14, color: 色.青, marginTop: 10 },
  やめた: { fontSize: 14, color: 色.灰 },
});

module.exports = { ChatMemberCard, 比べる名前 };
