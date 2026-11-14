'use strict';

/**
 * 管理者の合言葉の窓（2026-11-14）。設定の「管理者モード」を入れるとき（入る）と、「管理者の合言葉を変える」（変える）で出す。
 *
 * 段：
 *   聞く   … 中継に合言葉があるかを聞いている
 *   入る   … 合言葉を入れて管理者モードへ（「合言葉を忘れたとき」→ 忘れた）
 *   初めて … 合言葉がまだ無い団体。何のための合言葉かを見せ、ログインのパスワードで本人を確かめる → 新しく
 *   忘れた … ログインのパスワードで本人を確かめる → 新しく
 *   新しく … 新しい合言葉を 2 回入れる（作る・作り直す）
 *   変える … 今の合言葉と新しい合言葉（設定の「管理者の合言葉を変える」）
 *   古い   … 中継がまだ /kanri を持たない（配る前）。前のとおりログインのパスワードで入る
 * 中継とのやり取りは src/kanriAikotoba.js。戻るボタンでも閉じる（src/rn.js の Modal）。
 */

const React = require('react');
const { View, Text, TextInput, Pressable, Modal, StyleSheet, ActivityIndicator } = require('./rn');
const { 色 } = require('./iro');
const { IS_WEB } = require('./IS_WEB');
const 合 = require('./kanriAikotoba');

function 入れ物({ ラベル, 値, 置く, 隠す = true, 初めに = false, 決める, 置き字 }) {
  return (
    <TextInput
      aria-label={ラベル}
      accessibilityLabel={ラベル}
      placeholder={置き字 || ラベル}
      placeholderTextColor={色.灰_薄い}
      style={形.入れ物}
      secureTextEntry={隠す}
      value={値}
      onChangeText={置く}
      autoFocus={初めに}
      autoCapitalize="none"
      autoCorrect={false}
      onSubmitEditing={決める}
    />
  );
}

function ボタン({ 字, 押す, 主 = false, 止める = false, testID }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={止める}
      onPress={押す}
      style={({ hovered }) => [
        形.ボタン,
        主
          ? { backgroundColor: hovered ? 色.青_濃い : 色.青 }
          : { backgroundColor: hovered ? 色.地_濃い : 色.地 },
        止める && { opacity: 0.5 },
        IS_WEB && { cursor: 'pointer' },
      ]}
    >
      <Text style={[形.ボタンの字, { color: 主 ? 色.白 : 色.青 }]}>{字}</Text>
    </Pressable>
  );
}

/**
 * @param {{見える: boolean, 何: '入る'|'変える', 団体: string, 閉じる: Function, 入れた: (期限?: number) => void,
 *   ログインのパスワードを確かめる: (字: string) => Promise<boolean>, 道具?: object}} props
 */
function KanriAikotobaModal({
  見える,
  何 = '入る',
  団体,
  閉じる,
  入れた,
  ログインのパスワードを確かめる,
  道具,
}) {
  const [段, 段を置く] = React.useState('聞く');
  const [字1, 字1を置く] = React.useState('');
  const [字2, 字2を置く] = React.useState('');
  const [字3, 字3を置く] = React.useState('');
  const [誤り, 誤りを置く] = React.useState('');
  const [待つ, 待つを置く] = React.useState(false);
  // 新しく の段で、作るか（初めて）作り直すか（忘れた）
  const [作り方, 作り方を置く] = React.useState('作る');
  // 本人の確かめに使ったログインのパスワード（新しい合言葉と同じにさせない。窓を閉じたら捨てる）
  const ログインの字 = React.useRef('');

  const 空にする = () => {
    字1を置く('');
    字2を置く('');
    字3を置く('');
    誤りを置く('');
  };
  const 段へ = (次) => {
    空にする();
    段を置く(次);
  };

  React.useEffect(() => {
    if (!見える) {
      ログインの字.current = '';
      空にする();
      段を置く('聞く');
      return;
    }
    if (何 === '変える') {
      段を置く('変える');
      return;
    }
    let やめた = false;
    段を置く('聞く');
    合.様子を聞く(団体, 道具).then((答え) => {
      if (やめた) return;
      if (答え.結果 === '古い中継') return 段を置く('古い');
      if (答え.結果 === '様子') return 段を置く(答え.合言葉あり ? '入る' : '初めて');
      誤りを置く(答え.文 || 'いまは確かめられません');
      段を置く('入る');
    });
    return () => {
      やめた = true;
    };
  }, [見える, 何, 団体]);

  const 済んだ = (答え) => {
    ログインの字.current = '';
    入れた(答え && 答え.期限);
  };
  const 答えの文 = (答え) => {
    if (答え.結果 === '違う')
      return `合言葉が違います${Number.isFinite(答え.残り) ? `（あと ${答え.残り} 回まちがえると 15 分止まります）` : ''}`;
    if (答え.結果 === '入り直しが要る')
      return '確かめに時間がかかりました。ログインのパスワードからもう一度お試しください';
    return 答え.文 || 'いまは確かめられません。少し待ってからお試しください';
  };
  const 走る = async (手) => {
    if (待つ) return;
    待つを置く(true);
    誤りを置く('');
    try {
      await 手();
    } finally {
      待つを置く(false);
    }
  };

  const 入るを押す = () =>
    走る(async () => {
      if (!字1) return 誤りを置く('合言葉を入れてください');
      const 答え = await 合.合言葉で入る(団体, 字1, 道具);
      if (答え.結果 === '入れた') return 済んだ(答え);
      誤りを置く(答えの文(答え));
    });
  const 本人を確かめる = (次の作り方) =>
    走る(async () => {
      if (!字1) return 誤りを置く('ログインのパスワードを入れてください');
      const 合った = await ログインのパスワードを確かめる(字1).catch(() => false);
      if (!合った) return 誤りを置く('ログインのパスワードが正しくありません');
      ログインの字.current = 字1;
      作り方を置く(次の作り方);
      段へ('新しく');
    });
  const 新しくを押す = () =>
    走る(async () => {
      const 形の文 = 合.合言葉の形の文(字1);
      if (形の文) return 誤りを置く(形の文);
      if (字1 !== 字2) return 誤りを置く('2 回の合言葉が違います');
      if (ログインの字.current && 字1 === ログインの字.current)
        return 誤りを置く('ログインのパスワードとは違う合言葉にしてください');
      const 答え =
        作り方 === '作る'
          ? await 合.合言葉を作る(団体, 字1, 道具)
          : await 合.合言葉を変える(団体, 字1, '', 道具);
      if (['作った', '変えた'].includes(答え.結果)) return 済んだ(答え);
      if (答え.結果 === 'もうある') return 段へ('入る');
      誤りを置く(答えの文(答え));
    });
  const 変えるを押す = () =>
    走る(async () => {
      if (!字1) return 誤りを置く('今の合言葉を入れてください');
      const 形の文 = 合.合言葉の形の文(字2);
      if (形の文) return 誤りを置く(形の文);
      if (字2 !== 字3) return 誤りを置く('2 回の新しい合言葉が違います');
      const 答え = await 合.合言葉を変える(団体, 字2, 字1, 道具);
      if (答え.結果 === '変えた') return 済んだ(答え);
      誤りを置く(答えの文(答え));
    });
  const 古いを押す = () =>
    走る(async () => {
      if (!字1) return 誤りを置く('パスワードを入れてください');
      const 合った = await ログインのパスワードを確かめる(字1).catch(() => false);
      if (!合った) return 誤りを置く('パスワードが正しくありません');
      済んだ(null);
    });

  const 忘れた札 = (
    <Pressable
      accessibilityRole="button"
      onPress={() => 段へ('忘れた')}
      style={[{ alignSelf: 'flex-start', paddingVertical: 8 }, IS_WEB && { cursor: 'pointer' }]}
    >
      <Text style={{ fontSize: 13, color: 色.青 }}>合言葉を忘れたとき</Text>
    </Pressable>
  );

  let 題 = '管理者モード';
  let 中身;
  let 決める = null;
  let 決める字 = '';
  switch (段) {
    case '聞く':
      中身 = <ActivityIndicator color={色.青} style={{ marginVertical: 24 }} />;
      break;
    case '入る':
      中身 = (
        <>
          <Text style={形.文}>管理者の合言葉を入れてください。</Text>
          {入れ物({ ラベル: '管理者の合言葉', 値: 字1, 置く: 字1を置く, 初めに: true, 決める: 入るを押す })}
          {忘れた札}
        </>
      );
      決める = 入るを押す;
      決める字 = '入る';
      break;
    case '初めて':
      題 = '管理者の合言葉を作ります';
      中身 = (
        <>
          <Text style={形.文}>
            管理者モードに入るための合言葉です。ログインのパスワードとは別のものにします。
          </Text>
          <View style={形.箱}>
            <Text style={形.箱の字}>
              ・合言葉を知っている人だけが、記録を消す・メンバーを管理する・団体の設定を変えることができます。
            </Text>
            <Text style={形.箱の字}>
              ・団体のアカウントでログインしている端末でも、合言葉を入れるまでは、記録を付けて見ることだけができます。
            </Text>
            <Text style={形.箱の字}>・合言葉は、管理者と、任せたい人にだけ伝えてください。</Text>
          </View>
          <Text style={形.文}>まず本人の確認のため、ログインのパスワードを入れてください。</Text>
          {入れ物({
            ラベル: 'ログインのパスワード',
            値: 字1,
            置く: 字1を置く,
            初めに: true,
            決める: () => 本人を確かめる('作る'),
          })}
        </>
      );
      決める = () => 本人を確かめる('作る');
      決める字 = '次へ';
      break;
    case '忘れた':
      題 = '合言葉を作り直す';
      中身 = (
        <>
          <Text style={形.文}>
            ログインのパスワードを入れてください。確かめてから、新しい合言葉を決めます。
          </Text>
          {入れ物({
            ラベル: 'ログインのパスワード',
            値: 字1,
            置く: 字1を置く,
            初めに: true,
            決める: () => 本人を確かめる('作り直す'),
          })}
        </>
      );
      決める = () => 本人を確かめる('作り直す');
      決める字 = '次へ';
      break;
    case '新しく':
      題 = 作り方 === '作る' ? '管理者の合言葉を作ります' : '新しい合言葉';
      中身 = (
        <>
          <Text style={形.文}>6〜64 字で決めてください。ログインのパスワードとは違うものにします。</Text>
          {入れ物({ ラベル: '新しい合言葉', 値: 字1, 置く: 字1を置く, 初めに: true })}
          {入れ物({ ラベル: 'もう一度', 値: 字2, 置く: 字2を置く, 決める: 新しくを押す })}
        </>
      );
      決める = 新しくを押す;
      決める字 = '決める';
      break;
    case '変える':
      題 = '管理者の合言葉を変える';
      中身 = (
        <>
          {入れ物({ ラベル: '今の合言葉', 値: 字1, 置く: 字1を置く, 初めに: true })}
          {入れ物({ ラベル: '新しい合言葉（6〜64 字）', 値: 字2, 置く: 字2を置く })}
          {入れ物({ ラベル: '新しい合言葉をもう一度', 値: 字3, 置く: 字3を置く, 決める: 変えるを押す })}
          {忘れた札}
        </>
      );
      決める = 変えるを押す;
      決める字 = '変える';
      break;
    default:
      // 前の窓と同じ題・欄（中継がまだ /kanri を持たないとき。今ある検査もこの題と欄で入る）
      題 = '管理者認証';
      中身 = (
        <>
          <Text style={形.文}>団体のパスワードを入力してください</Text>
          {入れ物({
            ラベル: '管理者モードのパスワード',
            置き字: 'パスワード',
            値: 字1,
            置く: 字1を置く,
            初めに: true,
            決める: 古いを押す,
          })}
        </>
      );
      決める = 古いを押す;
      決める字 = '認証';
  }

  return (
    <Modal visible={見える} transparent animationType="fade" onRequestClose={閉じる}>
      <View style={形.地}>
        <View style={形.窓} testID="管理者の合言葉の窓">
          <Text style={形.題}>{題}</Text>
          {中身}
          {誤り ? (
            <Text style={形.誤り} testID="管理者の合言葉の誤り">
              {誤り}
            </Text>
          ) : null}
          <View style={形.ボタンの列}>
            <ボタン 字="キャンセル" 押す={閉じる} />
            {決める ? (
              <ボタン
                字={待つ ? '確かめています…' : 決める字}
                押す={決める}
                主
                止める={待つ}
                testID="管理者の合言葉を決める"
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const 形 = StyleSheet.create({
  地: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  窓: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: 色.白,
    borderRadius: 16,
    padding: 20,
  },
  題: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10 },
  文: { fontSize: 14, color: 色.文字, lineHeight: 21, marginBottom: 10 },
  箱: { backgroundColor: 色.地, borderRadius: 10, padding: 12, marginBottom: 12 },
  箱の字: { fontSize: 13, color: 色.文字_二, lineHeight: 20 },
  入れ物: {
    height: 48,
    borderWidth: 1,
    borderColor: 色.地_濃い,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: 色.文字,
    marginBottom: 10,
  },
  誤り: { fontSize: 13, color: 色.赤, marginBottom: 8, lineHeight: 19 },
  ボタンの列: { flexDirection: 'row', gap: 10, marginTop: 6 },
  ボタン: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  ボタンの字: { fontSize: 16, fontWeight: '600' },
});

module.exports = { KanriAikotobaModal };
