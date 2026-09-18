'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const { UIConfig } = require('./uiConfig');
const { ScoreCell } = require('./ScoreCell');
const { useScoreStore } = require('./useScoreStore');
const // 読み上げが読む言葉。射位の呼び方もここが持つ
  読み = require('./a11yLabels');
const Icons = require('@expo/vector-icons');
const { formatMemberName } = require('./formatMemberName');
const 組 = require('./teamGrouping');
const ArcherColumnView = React.memo(
  ({
    archer,
    shots,
    allArchers,
    indexInList,
    showFooter = true,
    // 横に並べる（名前が左、○×が右へ伸びる）。鍵も交代も規則は同じで、置き方だけ変える
    横並び: 横 = false,
    isReadOnly = false,
    isAdminMode = false,
    onPressName,
    onLongPressName,
    onDelete,
    onToggleMark,
    onToggleLock,
    // 区切りを長押ししたとき（チーム名を付ける）
    onLongPressSeparator: 区切りを長押し,
  }) => {
    // この列がどのチームか。区切りに付けた名前から決まる（teamGrouping）。
    // 立ち全体を見ないと決まらないので、allArchers から数える
    const チーム = (() => {
      const 一覧 = Array.isArray(allArchers) ? allArchers : [];
      const 割り当て = 組.チームを割り当てる(一覧);
      const 見つけた = 割り当て.find((一人) => 一人 && archer && 一人.id === archer.id);
      return 見つけた || { チーム: null, 色: null };
    })();
    const 区切りの名 = 組.区切りのチーム名(archer);
    // 鍵が効くかどうか。
    // toggleLock は押した列から右へ進み、間隔か計にぶつかったところで止める。
    // 右どなりが間隔・計だと一歩目で止まるので自分の列しか掴まず、射手は
    // 1人も固定されない。鍵は閉じるのに○×は編集できたままになり、効いた
    // ように見えて効いていない状態になる。そういう鍵は初めから出さない
    const 鍵が効く = (() => {
      const 一覧 = Array.isArray(allArchers) ? allArchers : [];
      const 右どなり = 一覧[indexInList - 1];
      return !!(indexInList > 0 && 右どなり && !右どなり.isSeparator && !右どなり.isTotalCalculator);
    })();
    // 途中交代があると、計は「山田 3, 交代太郎 2」と内訳で出る。
    // 押すと合わせた数（5）に切り替わる。どちらで見たいかは場面による
    const [合算で見る, 合算を置く] = React.useState(false);
    const 鍵を切り替える = useScoreStore((状態) => 状態.toggleLock);
    const viewScale = useScoreStore((状態) => 状態.viewScale);
    const 倍率 = 'number' == typeof viewScale && !isNaN(viewScale) && viewScale > 0 ? viewScale : 1;
    const 部員たち = useScoreStore((状態) => 状態.members || []);
    const 的中の数 = (() => {
      // どこまで数えるかの規則は teamGrouping に1つだけ置く。
      // ここに写しを持つと、欄と行で数が食い違う（2026-09-08 に起きた）
      if (archer.isTotalCalculator)
        return 組.合計を数える(Array.isArray(allArchers) ? allArchers : [], indexInList);
      return (archer.marks || []).filter((印) => '○' === 印).length;
    })();
    const 射番の並び = [];
    // 縦の表は下から上へ数える（1射目が下）。横の表は左から右へ数える
    if (!archer.isSeparator) {
      if (横) for (let 射番 = 0; 射番 < shots; 射番++) 射番の並び.push(射番);
      else for (let 射番 = shots - 1; 射番 >= 0; 射番--) 射番の並び.push(射番);
    }
    // 立の切れ目に引く太線。縦は「その立の1本目の下」、横は「その立の4本目の右」
    const 切れ目 = (位置) => (横 ? 位置 % 4 == 3 && 位置 !== shots - 1 : 位置 % 4 == 0 && 0 !== 位置);
    // 1ますの外枠。横のとき、間隔は細い列ではなく細い行になる
    const ます幅 =
      (横 ? UIConfig.cellWidth : archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * 倍率;
    const ます高 = (横 && archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellHeight) * 倍率;
    const 列の幅 = (archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * 倍率;
    const 背景の色 = archer.isSeparator
      ? 'rgba(142,142,147,0.15)'
      : archer.isTotalCalculator
        ? 'rgba(0,122,255,0.1)'
        : '#F2F2F7';
    const // 立ごとの行に出す数を作るために、この合計が受け持つ射手を集める。
      // 上の「計」の欄とまったく同じ規則を使う。以前はここに写しを持っていて、
      // 欄は総計になっているのに行の数だけ0のままだった（2026-09-08）
      受け持つ射手 = () => 組.合計が受け持つ射手(Array.isArray(allArchers) ? allArchers : [], indexInList);
    const 立の的中 = (立) => {
      const 仲間 = 受け持つ射手();
      if (0 === 仲間.length) return 0;
      const 頭 = 4 * 立;
      const 尻 = Math.min(頭 + 4, shots);
      return 仲間.reduce((計, 射手) => {
        let 中り = 0;
        const 印たち = 射手.marks || [];
        for (let 射番 = 頭; 射番 < 尻; 射番++) '○' === 印たち[射番] && 中り++;
        return 計 + 中り;
      }, 0);
    };
    const // 読み上げ（VoiceOver / TalkBack）が読む言葉。
      // 画面の字は「○」「×」だけで、そのままだと「まる」「かける」と読まれる
      読み上げの言葉 = (射番) =>
        読み.ますの読み({
          射手名: archer.name,
          番: 射位の番,
          人数: 実の並び.length,
          射番,
          印: (archer.marks || [])[射番],
        });
    const 鍵を押した = (射手ID, 立) => {
      if (onToggleLock) onToggleLock(射手ID, 立);
      else 鍵を切り替える(射手ID, 立);
    };
    const 名前を整える = (名) => formatMemberName(名, 部員たち);
    const // 手前の計もまとめる合計は「総計」。ふつうの「計」と見分けるため
      見出しの字 = () =>
        archer.isTotalCalculator
          ? archer.またぐ合計
            ? '総計'
            : '合計'
          : archer.name
            ? 名前を整える(archer.name)
            : '選択';
    const 間隔か合計 = archer.isSeparator || archer.isTotalCalculator;
    const 枠の太さ = 間隔か合計 ? 1.5 : 1;
    const 枠の左 = 間隔か合計 ? 1.5 : 0;
    // 1立が全部埋まって少し経ったら、鍵を自動でかける。
    // 鍵ボタンは「間隔」「計」の列に付いていて、押すと自分より右の射手を
    // まとめて閉じる。だから受け持つのもその列だけでよい。
    // 履歴の編集画面（onToggleLock を渡してくる）と、そもそも押せない場では何もしない
    // 射位（大前・N番・落）は、区切りや合計の行を除いた並びで数える。
    // chatStats と同じ数え方でないと、AIの答えと読み上げで呼び方が食い違う
    const 実の並び = (Array.isArray(allArchers) ? allArchers : []).filter(
      (一人) => 一人 && !一人.isSeparator && !一人.isTotalCalculator
    );
    const 射位の番 = 実の並び.findIndex((一人) => 一人 && 一人.id === archer.id);
    const 自動ロックする = useScoreStore((状態) => 状態.自動ロックする);
    const 自動ロックまでの秒 = useScoreStore((状態) => 状態.自動ロックまでの秒);
    const 立を閉じる = useScoreStore((状態) => 状態.立を閉じる);
    const 埋まった時刻 = React.useRef({});
    const 閉じた覚え = React.useRef({});
    // 埋まっている立の番号。中身が変わったときだけ数え直したいので文字にする
    const 埋まった立 = (() => {
      if (!間隔か合計 || !鍵が効く || onToggleLock || (isReadOnly && !isAdminMode)) return '';
      const 仲間 = 受け持つ射手();
      if (!仲間.length) return '';
      const 出 = [];
      for (let 立 = 0; 4 * 立 < shots; 立++) {
        const 端 = Math.min(4 * 立 + 4, shots);
        let 全部 = true;
        for (let 仲間の番 = 0; 仲間の番 < 仲間.length && 全部; 仲間の番++) {
          const 印 = 仲間[仲間の番].marks || [];
          for (let 射番 = 4 * 立; 射番 < 端; 射番++)
            if (!(印[射番] ?? '')) {
              全部 = false;
              break;
            }
        }
        if (全部) 出.push(立);
      }
      return 出.join(',');
    })();
    React.useEffect(() => {
      const 立たち = 埋まった立 ? 埋まった立.split(',').map(Number) : [];
      // 埋まらなくなった立は覚えを捨てる。入れ直せば、また閉じるように
      const いま = new Set(立たち);
      [埋まった時刻, 閉じた覚え].forEach((箱) => {
        Object.keys(箱.current).forEach((立) => {
          if (!いま.has(Number(立))) delete 箱.current[立];
        });
      });
      if (!自動ロックする || !立たち.length) return;
      const 今 = Date.now();
      立たち.forEach((立) => {
        if (!埋まった時刻.current[立]) 埋まった時刻.current[立] = 今;
        // すでに閉じている立は、自分で開け直した人の邪魔をしないよう放っておく
        if (archer.lockedBlocks?.[立]) 閉じた覚え.current[立] = true;
      });
      const 残り = 立たち.filter((立) => !閉じた覚え.current[立]);
      if (!残り.length) return;
      const 待つ = Math.max(
        0,
        Math.min(...残り.map((立) => 埋まった時刻.current[立])) + 自動ロックまでの秒 * 1000 - 今
      );
      const 札 = setTimeout(() => {
        const 頃 = Date.now();
        残り.forEach((立) => {
          if (埋まった時刻.current[立] + 自動ロックまでの秒 * 1000 <= 頃) {
            閉じた覚え.current[立] = true;
            立を閉じる(archer.id, 立);
          }
        });
      }, 待つ);
      return () => clearTimeout(札);
    }, [自動ロックする, 自動ロックまでの秒, 埋まった立, archer.id, archer.lockedBlocks, 立を閉じる]);
    return (
      <View
        style={
          横
            ? {
                flexDirection: 'row',
                flexShrink: 0,
                width: UIConfig.cellWidth * (shots + 1) * 倍率,
                backgroundColor: 'transparent',
              }
            : { width: 列の幅, backgroundColor: 'transparent' }
        }
      >
        <View style={{ flexDirection: 横 ? 'row-reverse' : 'column' }}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.header,
              横
                ? {
                    width: UIConfig.cellWidth * 倍率,
                    height: ます高,
                    backgroundColor: 背景の色,
                    marginBottom: 0,
                    borderBottomWidth: 枠の太さ,
                    borderBottomColor: '#000',
                    borderTopWidth: 枠の左,
                    borderTopColor: '#000',
                  }
                : {
                    width: 列の幅,
                    height: UIConfig.headerHeight * 倍率,
                    backgroundColor: 背景の色,
                    marginBottom: 0,
                    borderRightWidth: 枠の太さ,
                    borderRightColor: '#000',
                    borderLeftWidth: 枠の左,
                    borderLeftColor: '#000',
                  },
            ]} // 内訳が出ているときだけ押せる。押すと合算とを行き来する
            disabled={
              !(
                !archer.isSeparator &&
                !archer.isTotalCalculator &&
                Object.keys(archer.substitutions || {}).length > 0
              )
            }
            onPress={() => 合算を置く((前) => !前)}
          >
            {archer.isSeparator || archer.isTotalCalculator
              ? null
              : (() => {
                  const 交代 = archer.substitutions || {};
                  const 印たち = Array.isArray(archer.marks) ? archer.marks : [];
                  const 交代の射番 = Object.keys(交代)
                    .map(Number)
                    .sort((甲, 乙) => 甲 - 乙)
                    .filter((射番) => 射番 < 印たち.length);
                  if (交代の射番.length > 0 && !合算で見る) {
                    const 内訳 = [];
                    const 最初の交代 = 交代の射番[0];
                    const 最初の中り = 印たち.slice(0, 最初の交代).filter((印) => '○' === 印).length;
                    内訳.push({ name: 見出しの字(), hits: 最初の中り });
                    for (let 番 = 0; 番 < 交代の射番.length; 番++) {
                      const 始め = 交代の射番[番];
                      const 終わり = 番 + 1 < 交代の射番.length ? 交代の射番[番 + 1] : 印たち.length;
                      const 交代の名 = 交代[始め] || '?';
                      内訳.push({
                        name: 名前を整える(交代の名),
                        hits: 印たち.slice(始め, 終わり).filter((印) => '○' === 印).length,
                      });
                    }
                    return (
                      <Text style={[styles.hitCountSub, { fontSize: 8 * 倍率 }]}>
                        {内訳.map((一人, 番) => (
                          <React.Fragment key={番}>
                            <Text>
                              {一人.name} {一人.hits}
                            </Text>
                            {番 < 内訳.length - 1 ? <Text>{', '}</Text> : null}
                          </React.Fragment>
                        ))}
                      </Text>
                    );
                  }
                  return <Text style={[styles.hitCount, { fontSize: 22 * 倍率 }]}>{的中の数}</Text>;
                })()}
            {archer.isTotalCalculator ? (
              <Text style={[styles.hitCount, { color: '#007AFF', fontSize: 22 * 倍率 }]}>{的中の数}</Text>
            ) : null}
            <View
              style={
                横
                  ? { position: 'absolute', top: 0, bottom: 0, left: 0, width: 1.5, backgroundColor: '#000' }
                  : {
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 1.5,
                      backgroundColor: '#000',
                    }
              }
            />
          </TouchableOpacity>
          {archer.isSeparator ? (
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {Array.from({ length: shots }, (無し, 番) => (横 ? 番 : shots - 1 - 番)).map((射番) => {
                const 立 = Math.floor(射番 / 4);
                const 太線 = 切れ目(射番);
                const 立の端 = 射番 === Math.min(shots - 1, 4 * 立 + 3);
                const 鍵 = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[立] || false);
                return (
                  <View key={射番} style={{ width: ます幅, height: ます高 }}>
                    <ScoreCell
                      archerId={archer.id}
                      index={射番}
                      横並び={横}
                      isLocked={鍵}
                      isBlockBottom={太線}
                      isBlockTop={立の端}
                      isFirst={0 === 射番}
                      hideMark
                      isNormalArcher={!鍵が効く}
                      columnType="separator"
                      mark={archer.marks?.[射番]}
                      onToggle={onToggleMark}
                    />
                    {立の端 && (
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                        disabled={isReadOnly && !isAdminMode}
                        onPress={() => 鍵を押した(archer.id, 立)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ) : archer.isTotalCalculator ? (
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {射番の並び.map((射番) => {
                const 立 = Math.floor(射番 / 4);
                const 立の的中数 = 立の的中(立);
                const // 立ごとの合計を出すます。縦なら立の一番下、横なら立の左端
                  合計を出すます = 射番 % 4 == 0;
                const 立の端 = 射番 === Math.min(shots - 1, 4 * 立 + 3);
                const 鍵 = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[立] || false);
                return (
                  <View key={射番} style={{ width: ます幅, height: ます高 }}>
                    <ScoreCell
                      archerId={archer.id}
                      index={射番}
                      横並び={横}
                      mark={archer.marks?.[射番]}
                      isLocked={鍵}
                      isBlockBottom={横 ? 切れ目(射番) : 射番 % 4 == 0 && (0 !== 射番 || shots > 4)}
                      isBlockTop={立の端}
                      isFirst={0 === 射番}
                      hideMark
                      isNormalArcher={!鍵が効く}
                      columnType="total"
                      onToggle={onToggleMark}
                    />
                    {合計を出すます && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        pointerEvents="none"
                      >
                        <Text style={[styles.blockTotalText, { fontSize: 24 * 倍率 }]}>{立の的中数}</Text>
                      </View>
                    )}
                    {立の端 && (
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                        disabled={isReadOnly && !isAdminMode}
                        onPress={() => 鍵を押した(archer.id, 立)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {射番の並び.map((射番) => {
                const 交代の名 = archer.substitutions?.[射番];
                let 交代の表示名 = '';
                交代の名 && (交代の表示名 = 名前を整える(交代の名));
                const 立 = Math.floor(射番 / 4);
                const 立の端 = 射番 === Math.min(shots - 1, 4 * 立 + 3);
                const 鍵 = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[立] || false);
                return (
                  <ScoreCell
                    key={射番}
                    archerId={archer.id}
                    index={射番}
                    横並び={横}
                    mark={archer.marks?.[射番] || ''}
                    subName={交代の表示名}
                    isLocked={鍵}
                    isBlockBottom={切れ目(射番)}
                    isBlockTop={立の端}
                    isFirst={0 === 射番}
                    isNormalArcher
                    columnType="normal"
                    読み={読み上げの言葉(射番)}
                    onToggle={onToggleMark}
                  />
                );
              })}
            </View>
          )}
        </View>
        {showFooter && (
          <View
            style={[
              styles.footer,
              {
                width: 列の幅,
                height: UIConfig.footerHeight * 倍率,
                backgroundColor: archer.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                padding: 0,
                borderRightWidth: 枠の太さ,
                borderRightColor: '#000',
                borderLeftWidth: 枠の左,
                borderLeftColor: '#000',
              },
            ]}
          >
            {archer.isSeparator ? (
              <TouchableOpacity
                style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
                onPress={onDelete} // 長押しでチーム名を付ける（リーグの大学名）。
                // 押す＝外す は今までどおりにして、覚え直さずに済むようにする
                onLongPress={区切りを長押し}
                delayLongPress={500}
                disabled={isReadOnly && !isAdminMode}
                accessible
                accessibilityRole="button"
                accessibilityLabel={
                  区切りの名
                    ? `区切り ${区切りの名}。押すと外します。長押しでチーム名を変えられます`
                    : '区切りを外す。長押しでチーム名を付けられます'
                } // react-native-web の TouchableOpacity は accessibilityLabel を通さない。
                // 端末側は accessibilityLabel が要るので、両方渡す
                aria-label={
                  区切りの名
                    ? `区切り ${区切りの名}。押すと外します。長押しでチーム名を変えられます`
                    : '区切りを外す。長押しでチーム名を付けられます'
                }
              >
                {/* 名前が付いていれば、その名前を縦に出す。付いていなければ今までの×印 */}
                {区切りの名 ? (
                  <Text
                    style={{
                      fontSize: 組.区切りの名の字(倍率, UIConfig).fontSize,
                      lineHeight: 組.区切りの名の字(倍率, UIConfig).lineHeight,
                      fontWeight: '700',
                      color: 組.チームの色(区切りの名) || '#8E8E93',
                      textAlign: 'center',
                    }} // 欄の高さに入るだけ行を使う（3 行では大学名が切れた）
                    numberOfLines={組.区切りの名の字(倍率, UIConfig).numberOfLines}
                  >
                    {区切りの名}
                  </Text>
                ) : (
                  <Icons.Ionicons name="close-circle" size={24 * 倍率} color="#8E8E93" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  {
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    padding: 4,
                  },
                  // チームの色を、名前の欄の上に細い帯で出す。
                  // 名前の字を染めると読みにくくなるので、帯にする
                  チーム.色 && {
                    borderTopWidth: 3 * 倍率,
                    borderTopColor: チーム.色,
                    paddingTop: 4 - Math.min(3 * 倍率, 4),
                  },
                ]}
                onPress={onPressName}
                onLongPress={onLongPressName}
                delayLongPress={500} // 読み上げには射位と名前と成績をまとめて読ませる。
                // 名前だけだと、その人が何番目に立っているのか分からない
                accessible
                accessibilityRole="button"
                accessibilityLabel={
                  archer.isTotalCalculator
                    ? '合計の列'
                    : 読み.射手の読み({
                        射手名: archer.name,
                        番: 射位の番,
                        人数: 実の並び.length,
                        marks: archer.marks,
                      })
                } // web の TouchableOpacity は accessibilityLabel を通さない
                aria-label={
                  archer.isTotalCalculator
                    ? '合計の列'
                    : 読み.射手の読み({
                        射手名: archer.name,
                        番: 射位の番,
                        人数: 実の並び.length,
                        marks: archer.marks,
                      })
                }
                accessibilityHint={
                  archer.isTotalCalculator ? undefined : '押すと名前を選べます。長押しで交代や削除ができます'
                }
              >
                <Text style={[styles.footerName, { color: '#000', fontSize: 12 * 倍率 }]} numberOfLines={2}>
                  {見出しの字()}
                </Text>
                {archer.isGuest ? (
                  <Text style={[styles.guestLabel, { fontSize: 9 * 倍率 }]}>(ゲスト)</Text>
                ) : null}
                {archer.isTotalCalculator || '' === archer.name ? null : (
                  <View
                    style={{
                      marginTop: 2,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: 10,
                      backgroundColor:
                        archer.isGuest ||
                        !archer.gender ||
                        archer.gender === '未設定' ||
                        !['男子', '女子'].includes(archer.gender)
                          ? '#8E8E93'
                          : '男子' === archer.gender
                            ? '#007AFF'
                            : '#FF2D55',
                    }}
                  >
                    <Icons.Ionicons name="person" size={10 * 倍率} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }
);
const styles = StyleSheet.create({
  header: {
    height: UIConfig.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  hitCount: { fontSize: 22, fontWeight: 'bold' },
  hitCountSub: { fontSize: 8, fontWeight: 'bold', color: '#000', textAlign: 'center', paddingHorizontal: 2 },
  sepCell: {
    width: UIConfig.separatorWidth,
    height: UIConfig.cellHeight,
    backgroundColor: 'rgba(142,142,147,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCell: {
    width: UIConfig.cellWidth,
    height: UIConfig.cellHeight,
    backgroundColor: 'rgba(0,122,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockTotalText: { fontSize: 24, fontWeight: '900', color: '#007AFF' },
  footer: {
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    padding: 4,
  },
  footerName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  guestLabel: { fontSize: 9, color: '#8E8E93' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.ArcherColumnView = ArcherColumnView;
