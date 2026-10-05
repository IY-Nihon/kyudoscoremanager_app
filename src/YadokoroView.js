/**
 * 矢所の画面。記録画面の下の「矢所」で、記録表の上にかぶせて開く（表は裏に置いたまま。流した位置も残る）。
 *
 *  ・大きな的を押すと、いまの射に矢所を置いて、次の射へ進む。○×が空なら一緒に入る（内側＝○・外側＝×）
 *  ・上の帯：メンバーの小さな的（同じ立ちの矢所）。押すとその人へ
 *  ・その下：その人のこの立ちの射。押すとその射へ
 *  ・下の道具：取り消し・消す・飛ばす。置いたあとの進み方は設定の入れ方で決まる（まとめて＝その人の 4 本、ほかは隣の人）
 *  ・○×に合わない側には置けない（押している間の下絵が灰色になる）
 *  ・全員：全員の的を並べて見る（広い画面では的の横・下に並ぶ。狭い画面は「全員」に切り替える）
 * 決まりは src/yadokoroRules.js、的の絵は src/YadokoroTarget.js。
 */
'use strict';

const React = require('react');
const { View, Text, Pressable, ScrollView } = require('./rn');
const Icons = require('@expo/vector-icons');
const ExpoHaptics = require('expo-haptics');
const { useScoreStore } = require('./useScoreStore');
const { useストアの一部 } = require('./storeSlice');
const { formatMemberName } = require('./formatMemberName');
const { 戻るで閉じる } = require('./backToClose');
const 組 = require('./teamGrouping');
const 決まり = require('./yadokoroRules');
const { 的の絵, 押せる的 } = require('./YadokoroTarget');

const 青 = '#007AFF';
const 的の種類たち = [
  ['kasumi36', '霞的(尺二寸)'],
  ['hoshi36', '星的(尺二寸)'],
  ['hoshi24', '星的(八寸)'],
];
const 的の種類の名 = (種類) => (的の種類たち.find(([値]) => 値 === 種類) || 的の種類たち[0])[1];
const 次の的の種類 = (種類) => {
  const 番 = 的の種類たち.findIndex(([値]) => 値 === 種類);
  return 的の種類たち[(番 + 1) % 的の種類たち.length][0];
};
const 軽く = () => {
  try {
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
  } catch (_) {
    /* 震えなくても困らない */
  }
};

/** 小さなボタン。字だけ・絵つき・選んでいる、を同じ形で */
function 札({ 字, 絵, 押す, 選んだ, 使える = true, testID, 読み, 幅, 色 = 青, 小さい = false }) {
  return (
    <Pressable
      testID={testID}
      onPress={使える ? 押す : undefined}
      disabled={!使える}
      accessibilityRole="button"
      accessibilityLabel={読み || 字}
      aria-label={読み || 字}
      style={({ pressed }) => ({
        flex: 幅 ? undefined : 1,
        width: 幅,
        minHeight: 40,
        paddingHorizontal: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: 選んだ ? 色 : '#FFFFFF',
        borderWidth: 1,
        borderColor: 選んだ ? 色 : '#C6C6C8',
        opacity: !使える ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      {絵 ? <Icons.Ionicons name={絵} size={16} color={選んだ ? '#FFFFFF' : 色} /> : null}
      {字 ? (
        <Text
          numberOfLines={1}
          style={{ fontSize: 小さい ? 12 : 13, fontWeight: '600', color: 選んだ ? '#FFFFFF' : 色 }}
        >
          {字}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** メンバーの小さな的（上の帯と全員で使う） */
const メンバーの的 = React.memo(
  ({ 射手, 名, 立, 的の種類, 大きさ, 選んだ, 押す, 射数, testID, 数を出す }) => {
    const 点たち = 決まり.的の点たち(射手, 立, 的の種類);
    const 数 = 数を出す ? 決まり.数える(射手, 射数, 立) : null;
    const 未 = 数 ? 数.射った - 数.置いた : 0;
    return (
      <Pressable
        testID={testID}
        onPress={押す}
        accessibilityRole="button"
        accessibilityLabel={`${名}${数 ? ` ${数.射った}射 ${数.中り}中` : ''}。押すとこの人へ`}
        aria-label={`${名}${数 ? ` ${数.射った}射 ${数.中り}中` : ''}。押すとこの人へ`}
        accessibilityState={{ selected: !!選んだ }}
        aria-selected={!!選んだ}
        style={({ pressed }) => ({
          width: 大きさ + 12,
          paddingVertical: 4,
          alignItems: 'center',
          borderRadius: 10,
          borderWidth: 2,
          borderColor: 選んだ ? 青 : 'transparent',
          backgroundColor: 選んだ ? '#E1F0FF' : 'transparent',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <的の絵 大きさ={大きさ} 的の種類={的の種類} 点たち={点たち} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: 選んだ ? 'bold' : '500',
            color: '#000',
            marginTop: 3,
            maxWidth: 大きさ + 8,
          }}
        >
          {名}
        </Text>
        {数 ? (
          <Text numberOfLines={1} style={{ fontSize: 10, color: '#8E8E93' }}>
            {数.中り}/{数.射った}
            {未 > 0 ? <Text style={{ color: '#FF9500' }}>{` 未${未}`}</Text> : null}
          </Text>
        ) : null}
      </Pressable>
    );
  }
);

function 矢所の画面({ 閉じる }) {
  const {
    archers = [],
    shotsPerRound = 8,
    members = [],
    arrowTargetType = 'kasumi36',
    矢所の入れ方,
    isLiveActive = false,
    liveSessionName,
    ライブは見るだけ = false,
    historyStack = [],
    historySharedLen = 0,
  } = useストアの一部([
    'archers',
    'shotsPerRound',
    'members',
    'arrowTargetType',
    '矢所の入れ方',
    'isLiveActive',
    'liveSessionName',
    'ライブは見るだけ',
    'historyStack',
    'historySharedLen',
  ]);
  const 店 = () => useScoreStore.getState();
  const 進み方 = 決まり.入れ方の進み方(矢所の入れ方);
  const 見るだけ = !!(isLiveActive && ライブは見るだけ);
  const 戻せる = isLiveActive && liveSessionName ? (historySharedLen || 0) > 0 : historyStack.length > 0;
  const 射手たち = React.useMemo(() => 決まり.射手だけ(archers), [archers]);
  const 名前 = (射手) => (射手 && 射手.name ? formatMemberName(射手.name, members) : '名前なし');

  戻るで閉じる(true, 閉じる);

  const [広さ, 広さを置く] = React.useState({ 幅: 0, 高さ: 0 });
  const 分け方 = 決まり.画面の分け方(広さ.幅, 広さ.高さ);
  const [タブ, タブを置く] = React.useState(見るだけ ? '全員' : '入れる');
  const [範囲, 範囲を置く] = React.useState('立');
  const [いまの射, いまの射を置く] = React.useState(() => 決まり.開く射(archers, shotsPerRound, 進み方));
  const [知らせ, 知らせを置く] = React.useState('');
  // この画面で最後に置いた射。取り消したら、その射へ戻る
  const 最後に置いた = React.useRef(null);

  // メンバーを消した・射数を減らした・ライブで盤面が入れ替わった → いまの射を選び直す
  React.useEffect(() => {
    if (!決まり.射があるか(archers, shotsPerRound, いまの射)) {
      いまの射を置く(決まり.開く射(archers, shotsPerRound, 進み方));
    }
  }, [archers, shotsPerRound]);

  const いまの射手 = いまの射 ? 射手たち.find((射手) => 射手.id === いまの射.射手ID) : null;
  const 立 = いまの射 ? 決まり.立の番(いまの射.射番) : 0;
  const 立の数 = 決まり.立の数(shotsPerRound);
  const 射番たち = 決まり.立の射番(立, shotsPerRound);
  const いまの印 = いまの射手 && いまの射 ? (いまの射手.marks || [])[いまの射.射番] || '' : '';
  const 鍵 = !!(いまの射手 && いまの射手.lockedBlocks && いまの射手.lockedBlocks[立]);

  /** その人の、この立ちで最初の置いていない射（無ければ立の頭） */
  const 人の射 = (射手ID, 立の番号) => {
    const 射手 = 射手たち.find((一人) => 一人.id === 射手ID);
    const 番たち = 決まり.立の射番(立の番号, shotsPerRound);
    const 空き = 番たち.find((番) => !決まり.置いてあるか(射手, 番));
    return { 射手ID, 射番: undefined === 空き ? 番たち[0] : 空き };
  };
  // ほかの的で置いた射を選んだら、的もその種類に切り替える（いまの的の矢しか出さないので、見えるように）
  const 射を選ぶ = (射) => {
    いまの射を置く(射);
    知らせを置く('');
    const 的 =
      射 &&
      決まり.射の的(
        射手たち.find((一人) => 一人.id === 射.射手ID),
        射.射番
      );
    if (的 && 的 !== arrowTargetType) {
      店().setArrowTargetType(的);
      知らせを置く(`この射は${的の種類の名(的)}で置いてあるので、的を切り替えました`);
    }
  };
  const 人を選ぶ = (射手ID) => {
    射を選ぶ(人の射(射手ID, 立));
    if (!分け方.全員を並べる) タブを置く('入れる');
  };
  const 立を動かす = (向き) => {
    const 先 = Math.max(0, Math.min(立の数 - 1, 立 + 向き));
    if (先 === 立 || !いまの射) return;
    射を選ぶ(人の射(いまの射.射手ID, 先));
  };

  /** 書いたあとの盤面で次の射へ。置き直し（前から置いてあった射）のときは動かない */
  const 進む = (置いた射, 置き直し) => {
    if (置き直し) return;
    const 次 = 決まり.次の射(店().archers, 店().shotsPerRound, 進み方, 置いた射);
    if (次) いまの射を置く(次);
  };
  const 書く = (射, 位置, 印, 一緒に) => {
    const 前から = 決まり.置いてあるか(
      射手たち.find((一人) => 一人.id === 射.射手ID),
      射.射番
    );
    const 矢所 = { x: 位置.x, y: 位置.y, targetType: arrowTargetType };
    if (一緒に) 店().矢所を置いて印を入れる(射.射手ID, 射.射番, 印, 矢所);
    else 店().updateArrowLocation(射.射手ID, 射.射番, 矢所);
    最後に置いた.current = 射;
    軽く();
    const 射手 = 射手たち.find((一人) => 一人.id === 射.射手ID);
    知らせを置く(`${名前(射手)} ${射.射番 + 1}射目に${印}を置きました`);
    進む(射, 前から);
  };
  const 置く = (位置) => {
    if (!いまの射 || !いまの射手) return;
    const 決め = 決まり.置き方(いまの印, 位置.内側, { 見るだけ, 鍵 });
    if ('置けない' === 決め.する) return void 知らせを置く('見るだけで入っているので、置けません');
    if ('鍵' === 決め.する)
      return void 知らせを置く(
        いまの印
          ? `鍵のかかった立ちです。${'○' === いまの印 ? '的の中' : '的の外'}なら置けます`
          : '鍵のかかった立ちです。表で鍵を開けてから置いてください'
      );
    if ('合わない' === 決め.する)
      return void 知らせを置く(
        `この射は${いまの印}です。${'○' === いまの印 ? '的の中' : '的の外'}に置いてください`
      );
    書く(いまの射, 位置, 決め.印, '一緒に入れる' === 決め.する);
  };
  const 取り消す = () => {
    if (!戻せる) return;
    店().undo();
    if (最後に置いた.current) いまの射を置く(最後に置いた.current);
    最後に置いた.current = null;
    知らせを置く('元に戻しました');
  };
  const 消す = () => {
    if (!いまの射 || !いまの射手 || !決まり.置いてあるか(いまの射手, いまの射.射番)) return;
    店().updateArrowLocation(いまの射.射手ID, いまの射.射番, null);
    知らせを置く(`${いまの射.射番 + 1}射目の矢所を消しました（○×はそのまま）`);
  };
  const 飛ばす = () => {
    const 次 = 決まり.次の射(archers, shotsPerRound, 進み方, いまの射);
    if (!次 || 決まり.同じ射(次, いまの射)) return void 知らせを置く('ほかに置いていない射はありません');
    射を選ぶ(次);
  };

  // メンバーの帯：選んだ人が見えるように流す
  const 帯 = React.useRef(null);
  const 帯の幅 = React.useRef(0);
  // 札の位置は組の箱の中の位置なので、組の箱の位置を足して帯の中の位置にする
  const 札の位置 = React.useRef({});
  const 組の位置 = React.useRef({});
  const 選んだ人 = いまの射 ? いまの射.射手ID : null;
  const 帯を合わせる = React.useCallback(() => {
    const 位置 = 選んだ人 && 札の位置.current[選んだ人];
    if (!位置 || !帯.current || 'function' !== typeof 帯.current.scrollTo) return;
    const x = (組の位置.current[位置.組] || 0) + 位置.x;
    帯.current.scrollTo({ x: Math.max(0, x - (帯の幅.current - 位置.width) / 2), animated: false });
  }, [選んだ人]);
  React.useEffect(() => {
    帯を合わせる();
  }, [帯を合わせる]);

  const 組たち = React.useMemo(() => 決まり.組に分ける(archers), [archers]);
  const チーム = React.useMemo(() => {
    const 表 = {};
    for (const 一つ of 組.チームを割り当てる(archers)) if (一つ.id) 表[一つ.id] = 一つ.チーム;
    return 表;
  }, [archers]);

  const 的の大きさ = 分け方.的の大きさ;
  const 的の種類の札 = (
    <札
      testID="矢所-的の種類"
      字={的の種類の名(arrowTargetType)}
      読み={`的の種類：${的の種類の名(arrowTargetType)}。押すと切り替えます`}
      幅={110}
      押す={() => 店().setArrowTargetType(次の的の種類(arrowTargetType))}
    />
  );

  // ── 上の帯：立ちの移り・（狭いとき）入れる／全員・表へ戻る
  const 上の帯 = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 }}>
      <札
        testID="矢所-立-前"
        絵="chevron-back"
        読み="前の立ち"
        幅={40}
        使える={立 > 0}
        押す={() => 立を動かす(-1)}
      />
      <Text
        testID="矢所-立"
        style={{ fontSize: 15, fontWeight: 'bold', color: '#000', minWidth: 48, textAlign: 'center' }}
      >
        {立 + 1}立目
      </Text>
      <札
        testID="矢所-立-次"
        絵="chevron-forward"
        読み="次の立ち"
        幅={40}
        使える={立 < 立の数 - 1}
        押す={() => 立を動かす(1)}
      />
      <View style={{ flex: 1 }} />
      {広さ.幅 >= 480 ? 的の種類の札 : null}
      {分け方.全員を並べる ? null : (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <札
            testID="矢所-入れる"
            字="入れる"
            幅={64}
            選んだ={'入れる' === タブ}
            押す={() => タブを置く('入れる')}
          />
          <札 testID="矢所-全員" 字="全員" 幅={56} 選んだ={'全員' === タブ} 押す={() => タブを置く('全員')} />
        </View>
      )}
      <札
        testID="矢所-表へ"
        絵="grid-outline"
        字={広さ.幅 >= 420 ? '表へ' : undefined}
        読み="○×の表へ戻る"
        幅={広さ.幅 >= 420 ? 72 : 44}
        押す={閉じる}
      />
    </View>
  );

  // ── メンバーの帯（記録表と同じく、並びの最初の人が右）
  const メンバーの帯 = (
    <ScrollView
      ref={帯}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        flexDirection: 'row-reverse',
        minWidth: '100%',
        justifyContent: 'center',
        gap: 2,
      }}
      onLayout={(出来事) => {
        帯の幅.current = 出来事.nativeEvent.layout.width;
        帯を合わせる();
      }}
    >
      {組たち.map((一組, 組の番) => (
        <View
          key={一組[0].id}
          onLayout={(出来事) => {
            組の位置.current[組の番] = 出来事.nativeEvent.layout.x;
            setTimeout(帯を合わせる, 0);
          }}
          style={{
            flexDirection: 'row-reverse',
            gap: 2,
            ...(組の番 > 0
              ? { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#C6C6C8' }
              : null),
          }}
        >
          {一組.map((射手) => (
            <View
              key={射手.id}
              onLayout={(出来事) => {
                const 箱 = 出来事.nativeEvent.layout;
                札の位置.current[射手.id] = { x: 箱.x, width: 箱.width, 組: 組の番 };
                if (射手.id === 選んだ人) setTimeout(帯を合わせる, 0);
              }}
            >
              <メンバーの的
                testID={`矢所-人-${射手.id}`}
                射手={射手}
                名={名前(射手)}
                立={立}
                的の種類={arrowTargetType}
                大きさ={38}
                選んだ={!!いまの射 && いまの射.射手ID === 射手.id}
                押す={() => 人を選ぶ(射手.id)}
              />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  // ── その人のこの立ちの射
  const 射の帯 = (
    <View style={{ flexDirection: 'row', gap: 6, height: 52, alignItems: 'stretch' }}>
      {鍵 ? (
        <View
          style={{ justifyContent: 'center' }}
          accessibilityLabel="鍵のかかった立ち"
          aria-label="鍵のかかった立ち"
        >
          <Icons.Ionicons name="lock-closed" size={16} color="#FF3B30" />
        </View>
      ) : null}
      {射番たち.map((番) => {
        const 印 = いまの射手 ? (いまの射手.marks || [])[番] || '' : '';
        const 矢所 = いまの射手 ? (いまの射手.arrowLocations || [])[番] : null;
        const 置いた = 決まり.置いてあるか(いまの射手, 番);
        const ずれ = 置いた && 決まり.食い違っているか(矢所, 印);
        // ほかの的で置いた射は、いまの的には出さない。射のボタンに的の名前を小さく出す
        const ほかの的 =
          置いた && 決まり.矢所の的(矢所) !== arrowTargetType ? 的の種類の名(決まり.矢所の的(矢所)) : '';
        const いま = !!いまの射 && いまの射.射番 === 番;
        return (
          <Pressable
            key={番}
            testID={`矢所-射-${番}`}
            onPress={() => いまの射手 && 射を選ぶ({ 射手ID: いまの射手.id, 射番: 番 })}
            accessibilityRole="button"
            accessibilityLabel={`${番 + 1}射目 ${印 || '未記入'} ${置いた ? '矢所あり' : '矢所なし'}${ずれ ? ' ○×と位置が合っていません' : ''}`}
            aria-label={`${番 + 1}射目 ${印 || '未記入'} ${置いた ? '矢所あり' : '矢所なし'}${ずれ ? ' ○×と位置が合っていません' : ''}`}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 10,
              borderWidth: いま ? 2.5 : 1,
              borderColor: いま ? 青 : '#C6C6C8',
              backgroundColor: いま ? '#E1F0FF' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 10, color: '#8E8E93', position: 'absolute', top: 3, left: 6 }}>
              {番 + 1}射
            </Text>
            {ほかの的 ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 9,
                  color: '#8E8E93',
                  position: 'absolute',
                  bottom: 2,
                  left: 4,
                  right: 4,
                  textAlign: 'center',
                }}
              >
                {ほかの的}
              </Text>
            ) : null}
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '○' === 印 ? '#FF3B30' : 印 ? '#000' : '#C7C7CC',
              }}
            >
              {印 || '—'}
            </Text>
            {置いた ? (
              <View
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 6,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: ずれ ? '#FF9500' : '○' === 印 ? '#34C759' : '#FF3B30',
                }}
              />
            ) : null}
            {ずれ ? (
              <Text
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 5,
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: '#FF9500',
                }}
              >
                !
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  // ── 大きな的と、その上の案内
  const 案内 = !いまの射手
    ? ''
    : 見るだけ
      ? '見るだけで入っています'
      : 鍵
        ? '鍵のかかった立ち（○×は変わりません）'
        : !いまの印
          ? '押すと○×も入ります（中＝○・外＝×）'
          : `${いまの印} なので${'○' === いまの印 ? '的の中' : '的の外'}に置けます`;
  const 的の区画 = (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 的の大きさ, height: 的の大きさ }}>
        <押せる的
          testID="矢所-的"
          読み={いまの射手 ? `${名前(いまの射手)} ${いまの射.射番 + 1}射目の矢所を置く的` : '矢所を置く的'}
          大きさ={的の大きさ}
          的の種類={arrowTargetType}
          点たち={いまの射手 ? 決まり.的の点たち(いまの射手, 立, arrowTargetType) : []}
          いまの番={いまの射 ? いまの射.射番 : null}
          使える={!見るだけ && !!いまの射手}
          合う側={決まり.印か(いまの印) ? いまの印 : null}
          置く={置く}
        />
        {いまの射手 ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 6, left: 8, right: 8 }}>
            <Text
              testID="矢所-いまの射"
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#000',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.85)',
                paddingHorizontal: 6,
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {名前(いまの射手)} {いまの射.射番 + 1}射目
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: '#3C3C43',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.85)',
                paddingHorizontal: 6,
                borderRadius: 6,
                marginTop: 2,
                overflow: 'hidden',
              }}
            >
              {案内}
            </Text>
          </View>
        ) : (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: '#3C3C43',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: 8,
                borderRadius: 8,
              }}
            >
              メンバーを足すと、ここで矢所を置けます
            </Text>
          </View>
        )}
        {知らせ ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', bottom: 6, left: 8, right: 8, alignItems: 'flex-start' }}
          >
            <Text
              testID="矢所-知らせ"
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: '#FFFFFF',
                backgroundColor: 'rgba(28,28,30,0.8)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {知らせ}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  // ── 下の道具
  const 下の道具 = (
    <View style={{ flexDirection: 'row', gap: 6, height: 52, alignItems: 'center' }}>
      <札 testID="矢所-取り消し" 絵="arrow-undo" 字="取り消し" 使える={!見るだけ && 戻せる} 押す={取り消す} />
      <札
        testID="矢所-消す"
        絵="trash-outline"
        字="消す"
        色="#FF3B30"
        使える={!見るだけ && !!いまの射手 && 決まり.置いてあるか(いまの射手, いまの射 && いまの射.射番)}
        押す={消す}
      />
      <札
        testID="矢所-飛ばす"
        絵="play-skip-forward"
        字="飛ばす"
        使える={!見るだけ && !!いまの射手}
        押す={飛ばす}
      />
    </View>
  );

  // ── 全員
  const 全員の広さ = 分け方.横長 ? Math.max(200, 広さ.幅 - 的の大きさ - 48) : Math.max(200, 広さ.幅 - 24);
  const 列の数 = Math.max(3, Math.min(10, Math.floor(全員の広さ / 92)));
  const ます幅 = Math.floor((全員の広さ - (列の数 - 1) * 6) / 列の数);
  const 全員 = (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#3C3C43' }}>全員</Text>
        <札
          testID="矢所-範囲-立"
          字={`${立 + 1}立目`}
          幅={72}
          選んだ={'立' === 範囲}
          押す={() => 範囲を置く('立')}
        />
        <札
          testID="矢所-範囲-全部"
          字="全部の射"
          幅={84}
          選んだ={'全部' === 範囲}
          押す={() => 範囲を置く('全部')}
        />
        <View style={{ flex: 1 }} />
        {広さ.幅 < 480 ? 的の種類の札 : null}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        {組たち.length === 0 ? (
          <Text style={{ fontSize: 13, color: '#8E8E93', padding: 12 }}>メンバーがいません</Text>
        ) : null}
        {組たち.map((一組) => {
          const 名 = チーム[一組[0].id];
          return (
            <View key={一組[0].id} style={{ marginBottom: 8 }}>
              {名 ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: 組.チームの色(名) || '#8E8E93',
                    marginBottom: 2,
                    textAlign: 'right',
                  }}
                >
                  {名}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                {一組.map((射手) => (
                  <メンバーの的
                    key={射手.id}
                    testID={`矢所-全員-${射手.id}`}
                    射手={射手}
                    名={名前(射手)}
                    立={'立' === 範囲 ? 立 : null}
                    的の種類={arrowTargetType}
                    大きさ={Math.max(48, ます幅 - 12)}
                    選んだ={!!いまの射 && いまの射.射手ID === 射手.id}
                    押す={() => 人を選ぶ(射手.id)}
                    射数={shotsPerRound}
                    数を出す
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const 入れる区画 = (
    <View style={{ gap: 8 }}>
      {メンバーの帯}
      {射の帯}
      {分け方.横長 ? null : 的の区画}
      {下の道具}
    </View>
  );

  return (
    <View
      testID="矢所の画面"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 6,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingTop: 4,
      }}
      onLayout={(出来事) => {
        const { width, height } = 出来事.nativeEvent.layout;
        広さを置く({ 幅: Math.round(width), 高さ: Math.round(height) });
      }}
    >
      {広さ.幅 > 0 ? (
        分け方.横長 ? (
          <View style={{ flex: 1, flexDirection: 'row', gap: 16 }}>
            <View style={{ justifyContent: 'center' }}>{的の区画}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {上の帯}
              {入れる区画}
              {全員}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {上の帯}
            {'全員' === タブ && !分け方.全員を並べる ? (
              全員
            ) : (
              <>
                {入れる区画}
                {分け方.全員を並べる ? 全員 : null}
              </>
            )}
          </View>
        )
      ) : null}
    </View>
  );
}

module.exports = { 矢所の画面 };
