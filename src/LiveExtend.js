'use strict';

/**
 * ライブのリンクの期限を延ばす画面（2026-11-26 B3 本人「見本のとおり」）。処理は src/liveEnchou.js。
 *
 *   期限を延ばす欄 … 今から 12時間／24時間／7日間 を選んで延ばす（配る窓の「配ったあと」と、下の帯から開く窓で使う）
 *   期限を延ばす窓 … 下の帯の「延ばす」で開く
 *   ライブの期限の帯 … 残り 30 分で下に出す（延ばす・閉じる）。閉じたらその期限のあいだは出さない（延ばしてまた近づいたら出す）
 * 出すのは延ばせる人（団体アカウントと個人ログイン）だけ。リンクで来た部外の人には出さない
 */
const React = require('react');
const { Modal, Pressable, ScrollView, Text, View, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const { useScoreStore } = require('./useScoreStore');
const 延 = require('./liveEnchou');

/** 期限を日時の字にする（配る窓と同じく端末の言葉づかい） */
function 日時(ミリ秒) {
  try {
    return new Date(ミリ秒).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ミリ秒).toISOString();
  }
}

/** 延ばす欄。延ばした … 延ばせたときに新しい期限で呼ぶ */
function 期限を延ばす欄({ 延ばした }) {
  const 期 = useScoreStore((状態) => 状態.いまのライブの期限);
  const 団体 = useScoreStore((状態) => 状態.activeGroupId);
  const 名前 = useScoreStore((状態) => 状態.liveSessionName);
  const [今, 今を置く] = React.useState(() => Date.now());
  const 選べる = 延.延ばせる選択肢.filter((選) => 延.延ばせる長さか(選.値, 期, 今));
  const 初め = () => (選べる.find((選) => 選.既定) || 選べる[0] || { 値: null }).値;
  const [持ち, 持ちを置く] = React.useState(初め);
  const [作業中, 作業中を置く] = React.useState(false);
  const [文, 文を置く] = React.useState(null);
  const [済んだ, 済んだを置く] = React.useState(null);
  // 新しい期限の表示を 1 分ごとに進める
  React.useEffect(() => {
    const 札 = setInterval(() => 今を置く(Date.now()), 60000);
    return () => clearInterval(札);
  }, []);
  const 選んだのが使える = !!持ち && 選べる.some((選) => 選.値 === 持ち);
  const 押す = async () => {
    if (作業中 || !選んだのが使える) return;
    作業中を置く(true);
    文を置く(null);
    try {
      const 結果 = await 延.延ばす(団体, 名前, 持ち);
      if (結果.結果 === '延ばした') {
        // 盤面の期限が届くのを待たずに、この端末の帯を消す（届けば同じ値になる）
        useScoreStore.setState({ いまのライブの期限: 結果.期限 });
        済んだを置く(結果.期限);
        if (延ばした) 延ばした(結果.期限);
      } else {
        文を置く(結果.文);
      }
    } finally {
      作業中を置く(false);
    }
  };
  if (済んだ)
    return (
      <Text style={styles.済んだ} testID="期限を延ばした">
        {`期限を延ばしました（新しい期限：${日時(済んだ)}）`}
      </Text>
    );
  return (
    <View testID="期限を延ばす欄">
      <Text style={styles.説明}>リンクは変わりません。今から選んだ長さのあいだ開いたままにします</Text>
      <View style={styles.札の列}>
        {延.延ばせる選択肢.map((選) => {
          const 使える = 延.延ばせる長さか(選.値, 期, 今);
          const 入り = 持ち === 選.値 && 使える;
          return (
            <Pressable
              key={選.値}
              accessibilityRole="radio"
              accessibilityState={{ checked: 入り, disabled: !使える }}
              aria-label={`延ばす長さ ${選.名}`}
              disabled={!使える || 作業中}
              onPress={() => 持ちを置く(選.値)}
              style={[styles.札, 入り && styles.札が入り, !使える && styles.使えない]}
            >
              <Text style={[styles.札の字, 入り && styles.札の字が入り]}>{選.名}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.新しい期限}>
        {選んだのが使える ? `新しい期限：${日時(今 + 持ち)}` : '今の期限より長くなる長さを選んでください'}
      </Text>
      {文 ? (
        <Text style={styles.誤り} accessibilityLiveRegion="polite">
          {文}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        testID="期限を延ばす"
        disabled={作業中 || !選んだのが使える}
        onPress={押す}
        style={[styles.ボタン, (作業中 || !選んだのが使える) && styles.作業中]}
      >
        <Text style={styles.ボタンの字}>{作業中 ? '延ばしています…' : '延ばす'}</Text>
      </Pressable>
    </View>
  );
}

/** 下の帯の「延ばす」で開く窓 */
function 期限を延ばす窓({ 見える, 閉じる }) {
  const [済んだ, 済んだを置く] = React.useState(false);
  React.useEffect(() => {
    if (見える) 済んだを置く(false);
  }, [見える]);
  return (
    <Modal visible={!!見える} transparent animationType="fade" onRequestClose={閉じる}>
      <View style={styles.外}>
        <ScrollView
          style={styles.流し}
          contentContainerStyle={styles.流しの中}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.箱} testID="期限を延ばす窓">
            <Text style={styles.見出し}>リンクの期限を延ばす</Text>
            {見える ? <期限を延ばす欄 延ばした={() => 済んだを置く(true)} /> : null}
            <Pressable accessibilityRole="button" style={styles.キャンセル} onPress={閉じる}>
              <Text style={styles.キャンセルの字}>{済んだ ? '閉じる' : 'キャンセル'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** 閉じた期限（アプリを開いている間は覚える。4 桁の帯の「あとで」と同じ） */
let 閉じた期限の控え = null;

/** 残り 30 分で下に出す帯 */
function ライブの期限の帯() {
  const 状態 = {
    activeRole: useScoreStore((s) => s.activeRole),
    activeGroupId: useScoreStore((s) => s.activeGroupId),
    共有の来客: useScoreStore((s) => s.共有の来客),
    isLiveActive: useScoreStore((s) => s.isLiveActive),
    liveSessionName: useScoreStore((s) => s.liveSessionName),
    いまのライブの期限: useScoreStore((s) => s.いまのライブの期限),
  };
  const 期 = 状態.いまのライブの期限;
  const [閉じた期限, 閉じた期限を置く] = React.useState(閉じた期限の控え);
  const [窓, 窓を置く] = React.useState(false);
  const [今, 今を置く] = React.useState(() => Date.now());
  const 余白 = require('react-native-safe-area-context').useSafeAreaInsets();
  // 残りが 30 分を切るころに起き、出ている間は 30 秒ごとに数え直す（ずっと数えると重い記録画面を描き直す）
  React.useEffect(() => {
    if (typeof 期 !== 'number') return undefined;
    const 残り = 期 - Date.now();
    if (残り <= 0) return undefined;
    const 次 = 残り > 延.帯を出す残り ? 残り - 延.帯を出す残り + 500 : 30000;
    const 札 = setTimeout(() => 今を置く(Date.now()), Math.min(次, 2147483647));
    return () => clearTimeout(札);
  }, [期, 今]);
  const 出す = 延.帯を出すか(状態, 閉じた期限, 今);
  return (
    <>
      {出す ? (
        <View style={[styles.帯, { paddingBottom: 10 + (余白.bottom || 0) }]} testID="ライブの期限の帯">
          <Text style={styles.帯の字}>{延.帯の文(期, 今)}</Text>
          <Pressable accessibilityRole="button" onPress={() => 窓を置く(true)} hitSlop={8}>
            <Text style={styles.帯の押す}>延ばす</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              閉じた期限の控え = 期;
              閉じた期限を置く(期);
            }}
            hitSlop={8}
          >
            <Text style={styles.帯の閉じる}>閉じる</Text>
          </Pressable>
        </View>
      ) : null}
      {延.延ばせる人か(状態) ? <期限を延ばす窓 見える={窓} 閉じる={() => 窓を置く(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  // 窓は「全員の個人IDを新しくする」の窓（src/KojinIdModal.js）と同じ形
  外: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  流し: { flex: 1, width: '100%' },
  流しの中: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  箱: { width: '100%', maxWidth: 440, backgroundColor: 色.白, borderRadius: 14, padding: 18 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: 色.文字, marginBottom: 10, textAlign: 'center' },
  説明: { fontSize: 14, color: 色.文字_二, lineHeight: 20, marginBottom: 10 },
  // 札は配る窓（src/LiveShareModal.js）の期限の札と同じ形
  札の列: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  札: {
    borderWidth: 1,
    borderColor: 色.地_濃い,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 色.白,
  },
  札が入り: { backgroundColor: 色.青_暗所, borderColor: 色.青_暗所, borderWidth: 2 },
  使えない: { opacity: 0.4 },
  札の字: { fontSize: 13, color: 色.文字_二 },
  札の字が入り: { color: 色.白, fontWeight: 'bold' },
  新しい期限: { fontSize: 14, color: 色.文字, marginTop: 2 },
  誤り: { fontSize: 13, color: 色.赤, lineHeight: 19, marginTop: 8 },
  済んだ: { fontSize: 14, color: 色.文字, lineHeight: 20, marginTop: 4 },
  ボタン: {
    backgroundColor: 色.青,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  作業中: { backgroundColor: 色.灰 },
  ボタンの字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  キャンセル: { paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  キャンセルの字: { color: 色.文字_二, fontSize: 14 },
  // 帯はメールの確認の帯・4 桁の帯（src/KojinIdModal.js）と同じ形
  帯: {
    backgroundColor: 色.文字,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  帯の字: { flex: 1, color: 色.白, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  帯の押す: { color: 色.橙, fontSize: 14, fontWeight: 'bold' },
  帯の閉じる: { color: 色.灰, fontSize: 13 },
});

module.exports = { 期限を延ばす欄, 期限を延ばす窓, ライブの期限の帯 };
