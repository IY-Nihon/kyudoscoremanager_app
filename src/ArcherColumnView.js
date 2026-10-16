'use strict';

const { 色 } = require('./iro.js');
const React = require('react');
const { View, Text, StyleSheet, TouchableOpacity } = require('./rn');
const { UIConfig } = require('./uiConfig');
const { ScoreCell } = require('./ScoreCell');
const { useScoreStore } = require('./useScoreStore');
const { useShallow } = require('zustand/react/shallow');
const // 読み上げが読む言葉。射位の呼び方もここが持つ
  読み = require('./a11yLabels');
const Icons = require('@expo/vector-icons');
const { formatMemberName } = require('./formatMemberName');
const 組 = require('./teamGrouping');
/**
 * 記録表の 1 列（射手・区切り・計）。
 *
 * React.memo で包んであり、渡されたものが変わらなければ描き直さない。そのため
 * 立ち全体を見ないと決まらないもの（チームの色・鍵が効くか・射位・計の数）は
 * 一覧をまるごと受け取らず、親が retsuNoMitate で数字と文字にした見立てを受ける。
 * 押したときの手（onPressName など）も、親は同じ関数を渡し続けること
 * （描き直すたびに作り直すと、memo が効かなくなる）。
 */
const ArcherColumnView = React.memo(
  ({
    archer,
    shots,
    indexInList,
    // 列の見立て（src/retsuNoMitate.js）。一覧から親が数えて、数字と文字で渡す
    チームの色 = null,
    鍵が効く = false,
    射位の番 = -1,
    人数 = 0,
    合計の的中 = 0,
    立の的中 = '',
    立の射数 = '',
    埋まった立: 受け持ちの埋まった立 = '',
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
    // 区切りを長押ししたとき（チーム名を付ける）。onPressName・onDelete と同じく、列の id を渡して呼ぶ
    onLongPressSeparator: 区切りを長押し,
  }) => {
    const 区切りの名 = 組.区切りのチーム名(archer);
    // 途中交代があると、計は「山田 3, 交代太郎 2」と内訳で出る。
    // 押すと合わせた数（5）に切り替わる。どちらで見たいかは場面による
    const [合算で見る, 合算を置く] = React.useState(false);
    // 店（zustand）の購読は 1 つにまとめる（ます と同じ理由。列は 30 本ほど並ぶ）。
    // 店の手（toggleLock・立を閉じる）は呼ぶときに getState() から取る
    const { viewScale, members, 自動ロックする, 自動ロックまでの秒, 計の見せ方 } = useScoreStore(
      useShallow((状態) => ({
        viewScale: 状態.viewScale,
        計の見せ方: 状態.計の見せ方,
        members: 状態.members,
        自動ロックする: 状態.自動ロックする,
        自動ロックまでの秒: 状態.自動ロックまでの秒,
      }))
    );
    const 鍵を切り替える = (...引) => useScoreStore.getState().toggleLock(...引);
    const 立を閉じる = (...引) => useScoreStore.getState().立を閉じる(...引);
    const 倍率 = 'number' == typeof viewScale && !isNaN(viewScale) && viewScale > 0 ? viewScale : 1;
    const 部員たち = members || [];
    // 計の列の数は親が数えて渡す（どこまで数えるかの規則は teamGrouping に1つだけ）。
    // 射手の列は自分の○×を数えるだけ
    const 的中の数 = archer.isTotalCalculator
      ? 合計の的中
      : (archer.marks || []).filter((印) => '○' === 印).length;
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
        : 色.地;
    // 立ごとの行に出す数。親が「計」の欄と同じ規則（合計が受け持つ射手）で数えて、
    // 「3,2,4」の形で渡してくる
    const 立ごとの的中 = 立の的中 ? 立の的中.split(',').map(Number) : [];
    const 立の的中数を出す = (立) => 立ごとの的中[立] || 0;
    // 計の見せ方（useScoreStore の 計の見せ方）。射数は ○ か × が入ったマスだけ数える。
    // 累計は 1 立目からその立までの足し上げ
    const 立ごとの射数 = 立の射数 ? 立の射数.split(',').map(Number) : [];
    const 見せ方 = Number(計の見せ方) || 0;
    const 率 = (中, 射) => (射 > 0 ? Math.round((中 / 射) * 100) + '%' : '-');
    const 足し上げ = (並び, 立) => 並び.slice(0, 立 + 1).reduce((和, 数) => 和 + (数 || 0), 0);
    const 立の計の字 = (立) => {
      const 中 = 立の的中数を出す(立);
      const 射 = 立ごとの射数[立] || 0;
      if (1 === 見せ方) return `${中}/${射}`;
      if (2 === 見せ方) return `${中}/${足し上げ(立ごとの的中, 立)}`;
      if (3 === 見せ方) return 率(中, 射);
      if (4 === 見せ方) return 率(足し上げ(立ごとの的中, 立), 足し上げ(立ごとの射数, 立));
      return String(中);
    };
    const 全部の射数 = 立ごとの射数.reduce((和, 数) => 和 + (数 || 0), 0);
    const 合計の字 =
      1 === 見せ方 ? `${的中の数}/${全部の射数}` : 3 <= 見せ方 ? 率(的中の数, 全部の射数) : String(的中の数);
    // 的中数のとき以外は、何を出しているかを合計の上に小さく書く
    const 見せ方の名 = ['', '中/射', '立/累計', '立の率', '累計の率'][見せ方] || '';
    const 計の見せ方を次へ = () => useScoreStore.getState().計の見せ方を次へ();
    const // 読み上げ（VoiceOver / TalkBack）が読む言葉。
      // 画面の字は「○」「×」だけで、そのままだと「まる」「かける」と読まれる
      読み上げの言葉 = (射番) =>
        読み.ますの読み({
          射手名: archer.name,
          番: 射位の番,
          人数,
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
    const 埋まった時刻 = React.useRef({});
    const 閉じた覚え = React.useRef({});
    // 埋まっている立の番号（「0,2」の形。親が受け持つ射手を見て数える）。
    // 中身が変わったときだけ数え直したいので文字のまま持つ
    const 埋まった立 =
      !間隔か合計 || !鍵が効く || onToggleLock || (isReadOnly && !isAdminMode) ? '' : 受け持ちの埋まった立;
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
      // 立を閉じる は getState() から取る手なので、依存に入れない（入れると毎回新しい関数で効果が回り直す）
    }, [自動ロックする, 自動ロックまでの秒, 埋まった立, archer.id, archer.lockedBlocks]);
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
                    borderBottomColor: 色.黒,
                    borderTopWidth: 枠の左,
                    borderTopColor: 色.黒,
                  }
                : {
                    width: 列の幅,
                    height: UIConfig.headerHeight * 倍率,
                    backgroundColor: 背景の色,
                    marginBottom: 0,
                    borderRightWidth: 枠の太さ,
                    borderRightColor: 色.黒,
                    borderLeftWidth: 枠の左,
                    borderLeftColor: 色.黒,
                  },
            ]} // 内訳が出ているときだけ押せる。押すと合算とを行き来する
            // 計の列は押すと見せ方が次へ進む
            disabled={
              !(
                archer.isTotalCalculator ||
                (!archer.isSeparator && Object.keys(archer.substitutions || {}).length > 0)
              )
            }
            onPress={() => (archer.isTotalCalculator ? 計の見せ方を次へ() : 合算を置く((前) => !前))}
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
                      <Text style={[styles.hitCountSub, { fontSize: 8 * 倍率, paddingHorizontal: 2 * 倍率 }]}>
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
              <View style={{ alignItems: 'center' }} testID="計の見せ方">
                {!!見せ方の名 && (
                  <Text style={{ fontSize: 9 * 倍率, color: 色.青, fontWeight: 'bold' }}>{見せ方の名}</Text>
                )}
                <Text
                  style={[
                    styles.hitCount,
                    { color: 色.青, fontSize: (合計の字.length > 4 ? 15 : 見せ方の名 ? 18 : 22) * 倍率 },
                  ]}
                >
                  {合計の字}
                </Text>
              </View>
            ) : null}
            <View
              style={
                横
                  ? { position: 'absolute', top: 0, bottom: 0, left: 0, width: 1.5, backgroundColor: 色.黒 }
                  : {
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 1.5,
                      backgroundColor: 色.黒,
                    }
              }
            />
          </TouchableOpacity>
          {archer.isSeparator ? (
            // 間隔の列も立ごとに 1 つの箱にして、中のマス目は引かない。
            // 鍵が効くときは箱の端に鍵のアイコンを出し、箱のどこを押しても鍵が切り替わる（今までは端のマスだけ）
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {Array.from({ length: Math.ceil(shots / 4) }, (無し, 番) =>
                横 ? 番 : Math.ceil(shots / 4) - 1 - 番
              ).map((立) => {
                const 頭 = 4 * 立;
                const 本数 = Math.min(shots, 頭 + 4) - 頭;
                const 鍵 = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[立] || false);
                const 太線 = 横 ? 頭 + 本数 < shots : 0 !== 立;
                const 線 = 横
                  ? {
                      borderRightWidth: 太線 ? 2 : 1,
                      borderRightColor: 色.黒,
                      borderBottomWidth: 1,
                      borderBottomColor: 色.黒,
                      borderTopWidth: 1,
                      borderTopColor: 色.黒,
                    }
                  : {
                      borderBottomWidth: 太線 ? 2 : 1,
                      borderBottomColor: 色.黒,
                      borderRightWidth: 1,
                      borderRightColor: 色.黒,
                      borderLeftWidth: 1,
                      borderLeftColor: 色.黒,
                    };
                return (
                  <TouchableOpacity
                    key={立}
                    testID={'間隔の箱-' + archer.id + '-' + 立}
                    disabled={!鍵が効く || (isReadOnly && !isAdminMode)}
                    onPress={() => 鍵を押した(archer.id, 立)}
                    activeOpacity={0.7}
                    accessible={鍵が効く}
                    accessibilityRole="button"
                    accessibilityLabel={`${立 + 1}立目の鍵を${鍵 ? '開ける' : '掛ける'}`}
                    aria-label={鍵が効く ? `${立 + 1}立目の鍵を${鍵 ? '開ける' : '掛ける'}` : undefined}
                    style={[
                      {
                        width: 横 ? ます幅 * 本数 : ます幅,
                        height: 横 ? ます高 : ます高 * 本数,
                        backgroundColor: 'rgba(142,142,147,0.1)',
                        alignItems: 横 ? 'flex-end' : 'center',
                        justifyContent: 横 ? 'center' : 'flex-start',
                        paddingTop: 横 ? 0 : 3 * 倍率,
                        paddingRight: 横 ? 8 * 倍率 : 0,
                      },
                      線,
                    ]}
                  >
                    {鍵が効く && (
                      <Icons.Ionicons
                        name={鍵 ? 'lock-closed' : 'lock-open'}
                        size={16 * 倍率}
                        color={鍵 ? 色.赤 : 色.灰}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : archer.isTotalCalculator ? (
            // 計の列は立ごとに 1 つの箱。中のマス目は引かず、数を立の真ん中に置く。
            // 鍵は箱の端（縦は上・横は右）のアイコンを押したときだけ。ほかを押すと見せ方が次へ進む
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {Array.from({ length: Math.ceil(shots / 4) }, (無し, 番) =>
                横 ? 番 : Math.ceil(shots / 4) - 1 - 番
              ).map((立) => {
                const 頭 = 4 * 立;
                const 本数 = Math.min(shots, 頭 + 4) - 頭;
                const 鍵 = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[立] || false);
                // 立の切れ目の太線。縦は箱の下（1 立目の下は細い）、横は箱の右（最後の立の右は細い）
                const 太線 = 横 ? 頭 + 本数 < shots : 0 !== 立;
                const 線 = 横
                  ? {
                      borderRightWidth: 太線 ? 2 : 1,
                      borderRightColor: 色.黒,
                      borderBottomWidth: 1,
                      borderBottomColor: 色.黒,
                      borderTopWidth: 1,
                      borderTopColor: 色.黒,
                    }
                  : {
                      borderBottomWidth: 太線 ? 2 : 1,
                      borderBottomColor: 色.黒,
                      borderRightWidth: 1,
                      borderRightColor: 色.黒,
                      borderLeftWidth: 1,
                      borderLeftColor: 色.黒,
                    };
                const 字 = 立の計の字(立);
                return (
                  <TouchableOpacity
                    key={立}
                    testID={'計の箱-' + archer.id + '-' + 立}
                    onPress={計の見せ方を次へ}
                    activeOpacity={0.7}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${立 + 1}立目の計 ${字}。押すと見せ方が変わります`}
                    aria-label={`${立 + 1}立目の計 ${字}。押すと見せ方が変わります`}
                    style={[
                      {
                        width: 横 ? ます幅 * 本数 : ます幅,
                        height: 横 ? ます高 : ます高 * 本数,
                        backgroundColor: 'rgba(0,122,255,0.08)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                      線,
                    ]}
                  >
                    {!横 && 字.includes('/') ? (
                      // 縦の表の分数は、上に分子・横線・下に分母と積む（箱が縦に長いので読みやすい）
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.blockTotalText, { fontSize: 22 * 倍率, lineHeight: 26 * 倍率 }]}>
                          {字.split('/')[0]}
                        </Text>
                        <View
                          style={{
                            width: 30 * 倍率,
                            height: Math.max(1, 2 * 倍率),
                            backgroundColor: 色.青,
                            marginVertical: 2 * 倍率,
                          }}
                        />
                        <Text style={[styles.blockTotalText, { fontSize: 22 * 倍率, lineHeight: 26 * 倍率 }]}>
                          {字.split('/')[1]}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.blockTotalText,
                          { fontSize: (字.length > 4 ? 16 : 字.length > 2 ? 20 : 24) * 倍率 },
                        ]}
                      >
                        {字}
                      </Text>
                    )}
                    {鍵が効く && (
                      <TouchableOpacity
                        testID={'計の鍵-' + archer.id + '-' + 立}
                        disabled={isReadOnly && !isAdminMode}
                        onPress={() => 鍵を押した(archer.id, 立)}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={`${立 + 1}立目の鍵を${鍵 ? '開ける' : '掛ける'}`}
                        aria-label={`${立 + 1}立目の鍵を${鍵 ? '開ける' : '掛ける'}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          width: ます幅,
                          height: 26 * 倍率,
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          ...(横 ? { right: 0 } : { left: 0, right: 0 }),
                        }}
                      >
                        <Icons.Ionicons
                          name={鍵 ? 'lock-closed' : 'lock-open'}
                          size={16 * 倍率}
                          color={鍵 ? 色.赤 : 色.灰}
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
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
                backgroundColor: archer.isTotalCalculator ? 'rgba(0,122,255,0.05)' : 色.地,
                padding: 0,
                borderRightWidth: 枠の太さ,
                borderRightColor: 色.黒,
                borderLeftWidth: 枠の左,
                borderLeftColor: 色.黒,
              },
            ]}
          >
            {archer.isSeparator ? (
              <TouchableOpacity
                style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
                onPress={() => onDelete && onDelete(archer.id)} // 長押しでチーム名を付ける（リーグの大学名）。
                // 押す＝外す は今までどおりにして、覚え直さずに済むようにする
                onLongPress={() => 区切りを長押し && 区切りを長押し(archer.id)}
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
                      color: 組.チームの色(区切りの名) || 色.灰,
                      textAlign: 'center',
                    }} // 欄の高さに入るだけ行を使う（3 行では大学名が切れた）
                    numberOfLines={組.区切りの名の字(倍率, UIConfig).numberOfLines}
                  >
                    {区切りの名}
                  </Text>
                ) : (
                  <Icons.Ionicons name="close-circle" size={24 * 倍率} color={色.灰} />
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
                    // 余白も表示の大きさに合わせる（25% で中身が隣の行へはみ出した）
                    padding: 4 * 倍率,
                  },
                  // チームの色を、名前の欄の上に細い帯で出す。
                  // 名前の字を染めると読みにくくなるので、帯にする
                  チームの色 && {
                    borderTopWidth: 3 * 倍率,
                    borderTopColor: チームの色,
                    paddingTop: 4 * 倍率 - Math.min(3 * 倍率, 4 * 倍率),
                  },
                ]}
                onPress={() => onPressName && onPressName(archer.id, archer.name, indexInList)}
                onLongPress={() => onLongPressName && onLongPressName(archer.id, archer.name, indexInList)}
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
                        人数,
                        marks: archer.marks,
                      })
                } // web の TouchableOpacity は accessibilityLabel を通さない
                aria-label={
                  archer.isTotalCalculator
                    ? '合計の列'
                    : 読み.射手の読み({
                        射手名: archer.name,
                        番: 射位の番,
                        人数,
                        marks: archer.marks,
                      })
                }
                accessibilityHint={
                  archer.isTotalCalculator ? undefined : '押すと名前を選べます。長押しで交代や削除ができます'
                }
              >
                <Text style={[styles.footerName, { color: 色.黒, fontSize: 12 * 倍率 }]} numberOfLines={2}>
                  {見出しの字()}
                </Text>
                {archer.isGuest ? (
                  <Text style={[styles.guestLabel, { fontSize: 9 * 倍率 }]}>(ゲスト)</Text>
                ) : null}
                {archer.isTotalCalculator || '' === archer.name ? null : (
                  <View
                    style={{
                      marginTop: 2 * 倍率,
                      paddingHorizontal: 4 * 倍率,
                      paddingVertical: 2 * 倍率,
                      borderRadius: 10 * 倍率,
                      backgroundColor:
                        archer.isGuest ||
                        !archer.gender ||
                        archer.gender === '未設定' ||
                        !['男子', '女子'].includes(archer.gender)
                          ? 色.灰
                          : '男子' === archer.gender
                            ? 色.青
                            : 色.桃,
                    }}
                  >
                    <Icons.Ionicons name="person" size={10 * 倍率} color={色.白} />
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
    borderBottomColor: 色.黒,
  },
  hitCount: { fontSize: 22, fontWeight: 'bold' },
  hitCountSub: { fontSize: 8, fontWeight: 'bold', color: 色.黒, textAlign: 'center', paddingHorizontal: 2 },
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
  blockTotalText: { fontSize: 24, fontWeight: '900', color: 色.青 },
  footer: {
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 色.黒,
    padding: 4,
  },
  footerName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  guestLabel: { fontSize: 9, color: 色.灰 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.ArcherColumnView = ArcherColumnView;
