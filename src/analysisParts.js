'use strict';

const React = require('react');
const { View, Text, TouchableOpacity } = require('./rn');
// 「その射は誰のものか」の決まりは1か所に寄せてある（src/statsRules.js）
const 集 = require('./statsRules');
// 弓具を変えた前後で的中率がどう動いたか（src/equipmentTrend.js）
const 弓 = require('./equipmentTrend');
const Icons = require('@expo/vector-icons');
// 見た目の決まりは分析画面と同じ
const { styles } = require('./analysisStyles');

/*
 * 分析画面の部品（2026-10-05 に AnalysisScreen.js から移した。動きは変えていない）。
 * 分析画面と部員の詳細の窓（AnalysisMemberDetail.js）の両方で使う。
 */

// 比較相手を見分けるための色。グラフ・矢所・立ち順別・結果分布で同じ順に使う。
// 別々に書いていたころは、増やしたときに片方だけ色がずれる心配があった
// 明るい面でも暗い面でも読める色を選ぶ。緑・橙・黄をそのまま使っていたころは、
// 白いカードの上で比が 2.2／2.2／1.5 しかなく、名前も丸も薄くて追えなかった。
// 濃いほうを置いて、暗い面では theme.js が鮮やかな色に戻す
// 比較相手を見分ける色。名前も隣に出るので、色は補助の手がかり。
// それでも、色覚によって同じに見える組は避ける。
// 元は最後が #8B6D00（黄土）で、#C93400（濃い橙）とD型で隔たり2.6しかなく、
// ほぼ同じ色に見えていた。#0000CF に替えて 14.1 まで広げてある。
// 健常色覚での最小は 25.9 のまま変わらない（scripts で測って決めた）
/**
 * 弓具を変えた前後の節。個人の詳細に出す。
 *
 * 数字は「弓具のせい」を意味しない。前後で動いても、時期・体調・相手が
 * 絡む。射数が少なければなお揺れる。だから射数も一緒に出し、
 * 言い切らない言葉を添える（src/equipmentTrend.js の 見立ての言葉）
 */
/**
 * 弓具の履歴がまだ無い人に出す案内。
 *
 * 何も出さないと、この節そのものが在ることに気づけない。
 * 記録するところ（メンバー → 弓具管理）だけを伝える。
 */
function 弓具の案内() {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 4 }}>
        弓具を変えた前後
      </Text>
      <Text style={{ fontSize: 11, color: '#8E8E93', lineHeight: 16 }}>
        まだ弓具の記録がありません。メンバーの画面で「弓具管理」から弓力・矢・弦の変更を残すと、その前後の的中がここに並びます。
      </Text>
    </View>
  );
}
/**
 * 的中の型の節。「三中のうちどこで抜いたか」を並べる。
 *
 * 結果分布（皆中・三中…）は中り数までしか見ないので、同じ三中でも
 * 「留矢を抜いた」のか「初矢を抜いた」のかが分からなかった。
 *
 * 数える決まりは statsRules（型を並べる）に置いてある。ここは並べるだけ。
 * 個人の詳細と、部員として入ったときの自分の画面の2か所から呼ぶ。
 *
 * 比較中は人数ぶん並べる。誰の型かが分かるよう、名前の見出しを付ける
 * （もとは「16通りを人数ぶん並べても読めない」として出していなかったが、
 *  本人の分だけが残るので、かえって紛らわしかった）。
 *
 * @param {any} 成績 statsRules.成績を数える の返り
 * @param {string|null} 期間の名 推移の点を押しているときの期間（見出しに出す）
 * @param {string|null} 誰の 比較中に出す名前の見出し。単体で見るときは渡さない
 */
function 型の節(成績, 期間の名, 誰の) {
  // 開く・畳むを覚える部品にした。比較中は人ぶん並ぶので、名前で鍵を分ける
  return <型の節の部品 key={誰の ? `型:${誰の}` : '型'} 成績={成績} 期間の名={期間の名} 誰の={誰の} />;
}
/**
 * 型の節の中身。見出しを押すと開く（既定は畳む）。
 *
 * もとは常に開いていたが、16通りが縦に並ぶと個人の詳細が長くなり、
 * 下の弓具の節まで遠かった。畳んでいる間は、要点だけを1行で出す。
 *
 * 4射の型のほかに、一射のとき（1本しか引いていない記録）と一手のとき（2本だけ
 * 引いた記録）の的中率も出す（2026-09-14 に使う人が求めた。「人たちで一本しか
 * 引いていないとき」の的中率）。一手は1本目が甲矢・2本目が乙矢なので、どちらを
 * 抜いたかを言える（四つ矢では甲矢・乙矢が2回ずつ現れて区別できないが、一手の中なら決まる）
 */
function 型の節の部品({ 成績, 期間の名, 誰の }) {
  const [開いている, set開いている] = React.useState(false);
  const 並び = 集.型を並べる((成績 || {}).型 || {});
  const 一射 = (成績 || {}).一射 || { shots: 0, hits: 0 };
  const 一手 = (成績 || {}).一手 || { shots: 0, hits: 0, 型: {} };
  const 手の並び = 集.一手の型を並べる(一手.型 || {});
  if (!並び.length && !一射.shots && !一手.shots) return null;
  // 中り数ごとにまとめて、見出しを1回だけ出す。
  // 型ごとに「三中」を繰り返すと、同じ字が縦に並んで読みにくい
  const 束 = [];
  for (const 型1つ of 並び) {
    const 尻 = 束[束.length - 1];
    if (尻 && 尻.中り === 型1つ.中り) 尻.型たち.push(型1つ);
    else 束.push({ 中り: 型1つ.中り, 呼び名: 型1つ.呼び名, 型たち: [型1つ] });
  }
  const 手の数 = 手の並び.reduce((計, 型1つ) => 計 + 型1つ.回数, 0);
  const 立ちの数 = 並び.reduce((計, 型1つ) => 計 + 型1つ.回数, 0);
  const 率 = (数) => (数.shots > 0 ? ((数.hits / 数.shots) * 100).toFixed(1) + '%' : null);
  const 立ちの皆中 = 並び.find((型1つ) => 型1つ.型 === '○○○○');
  // 畳んでいる間の要点。開かなくても、いちばん見たい数字は分かるように。
  // 無いものは出さない（「一射 —」が並ぶと、何が無いのか分からない）
  const 要点 = [
    一射.shots > 0 ? `一射 ${率(一射)}` : null,
    一手.shots > 0 ? `一手 ${率(一手)}` : null,
    立ちの数 > 0 ? `皆中 ${Math.round(((立ちの皆中 ? 立ちの皆中.回数 : 0) / 立ちの数) * 100)}%` : null,
  ]
    .filter(Boolean)
    .join('　');
  return (
    <View style={{ marginBottom: 20 }}>
      <TouchableOpacity
        testID="的中の型の見出し"
        accessibilityRole="button"
        accessibilityState={{ expanded: 開いている }}
        accessibilityLabel={(開いている ? '的中の型を畳む' : '的中の型を開く') + (誰の ? `（${誰の}）` : '')}
        onPress={() => set開いている(!開いている)}
        style={styles.型の見出しの行}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.sectionSubTitle, { marginBottom: 0 }]}>
            {/* 比較中は誰の型かが分からないと読めないので、名前を見出しに出す */}
            {誰の ? `的中の型 — ${誰の}` : 期間の名 ? `的中の型 (${期間の名})` : '的中の型'}
          </Text>
          {!開いている && (
            <Text style={styles.型の要点の行} numberOfLines={1}>
              {要点 + '　押すと開く'}
            </Text>
          )}
        </View>
        <Icons.Ionicons name={開いている ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
      </TouchableOpacity>
      {開いている && (
        <View style={[styles.patternsCardDash, { marginTop: 12 }]}>
          {/* 一射のとき。1本しか引いていない記録の的中率 */}
          <Text style={styles.型の区切り}>一射のとき（1本だけ引いた記録）</Text>
          <View style={styles.型の行}>
            <Text style={styles.型の要点}>的中率</Text>
            <Text style={一射.shots > 0 ? styles.型の回数 : styles.型の無し}>
              {一射.shots > 0 ? 率(一射) + '（' + 一射.hits + '中／' + 一射.shots + '射）' : 'まだありません'}
            </Text>
          </View>
          {/* 一手のとき。2本だけ引いた記録の的中率と、2射の型 */}
          <Text style={styles.型の区切り}>
            {'一手のとき（2本だけ引いた記録）' + (手の数 > 0 ? '　' + 手の数 + '手' : '')}
          </Text>
          <View style={styles.型の行}>
            <Text style={styles.型の要点}>的中率</Text>
            <Text style={一手.shots > 0 ? styles.型の回数 : styles.型の無し}>
              {一手.shots > 0 ? 率(一手) + '（' + 一手.hits + '中／' + 一手.shots + '射）' : 'まだありません'}
            </Text>
          </View>
          {[
            ...手の並び.map((型1つ) => (
              <View key={'手' + 型1つ.型} style={styles.型の行}>
                <Text style={styles.型の印}>{型1つ.型}</Text>
                <Text style={styles.型の要点} numberOfLines={1}>
                  {型1つ.要点 ? 型1つ.呼び名 + '　' + 型1つ.要点 : 型1つ.呼び名}
                </Text>
                <Text style={styles.型の回数}>
                  {型1つ.回数}
                  {'手 '}
                  {Math.round(型1つ.割合)}%
                </Text>
              </View>
            )),
          ]}
          {/* 4射単位。立ちの型 */}
          {束.length > 0 && <Text style={styles.型の区切り}>{'4射単位（立ち）　' + 立ちの数 + '立'}</Text>}
          {[
            ...束.map((組) => (
              <View key={組.中り} style={styles.型の組}>
                <Text style={styles.型の見出し}>
                  {組.呼び名} {組.型たち.reduce((計, 型1つ) => 計 + 型1つ.回数, 0)}立
                </Text>
                {[
                  ...組.型たち.map((型1つ) => (
                    <View key={型1つ.型} style={styles.型の行}>
                      <Text style={styles.型の印}>{型1つ.型}</Text>
                      <Text style={styles.型の要点} numberOfLines={1}>
                        {型1つ.要点 || ''}
                      </Text>
                      <Text style={styles.型の回数}>
                        {型1つ.回数}
                        {'立 '}
                        {Math.round(型1つ.割合)}%
                      </Text>
                    </View>
                  )),
                ]}
              </View>
            )),
          ]}
        </View>
      )}
      {開いている && (
        <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 8, lineHeight: 16 }}>
          ※
          4射単位の割合は同じ中り数の中での割合です（三中のうち、その抜き方が何割か）。一手のときの型の割合は、その手すべての中での割合です。
        </Text>
      )}
    </View>
  );
}
function 弓具の節(人, 記録たち) {
  const 並び = 弓.弓具の移り変わり(人, 記録たち);
  // 履歴が無い人には、どこで記録するかだけ出す。
  // 何も出さないと、この節そのものが在ることに気づけない
  // （実際「分析で見たい」と二度言われた。作ってあったが空だった）
  if (!並び.length) return 弓具の案内();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 4 }}>
        弓具を変えた前後
      </Text>
      <Text style={{ fontSize: 11, color: '#8E8E93', marginBottom: 10, lineHeight: 16 }}>
        その弓具を使っていた間の成績です。次に変えた日の前日までを数えます。的中の動きが弓具のせいとは限りません。
      </Text>
      {[
        ...並び.map((一件) => (
          <View
            key={一件.変更.id || String(一件.変更.date)}
            style={{ backgroundColor: '#F2F2F7', borderRadius: 8, padding: 10, marginBottom: 8 }}
          >
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' }}>
              {new Date(一件.変更.date).toLocaleDateString() +
                '　' +
                (一件.変更.weight ? 一件.変更.weight + 'kg へ' : 一件.種類)}
            </Text>
            {一件.変更.note ? (
              <Text style={{ fontSize: 12, color: '#3C3C43', marginTop: 2 }}>{一件.変更.note}</Text>
            ) : null}
            <Text style={{ fontSize: 12, color: '#3C3C43', marginTop: 4, lineHeight: 17 }}>
              {弓.見立ての言葉(一件)}
            </Text>
          </View>
        )),
      ]}
    </View>
  );
}
const 比較の色たち = ['#FF2D55', '#248A3D', '#C93400', '#AF52DE', '#056B7A', '#5856D6', '#0000CF'];

module.exports = { 弓具の案内, 型の節, 型の節の部品, 弓具の節, 比較の色たち };
