/**
 * 矢所の窓。1 つの射の矢所を大きな的で置く。
 *  ・入れ方が「○×のあと」のとき、○×を押して 0.5 秒後に開く（10/3 まで本番にあった開き方。窓は大きくした）
 *  ・どの入れ方でも、表のマスを長押しすると、その射の窓が開く
 *  ・置いても閉じない（置いた所を見て押し直せる）。「完了」・✕・戻るで閉じる
 *  ・○×に合わない側には置けない。○×が空の射（長押しで開いたとき）は、置くと○×も一緒に入る
 * 決まりは src/yadokoroRules.js、的は src/YadokoroTarget.js。開く射は店の 矢所の窓（{ 射手ID, 射番 }）。
 */
'use strict';

const React = require('react');
const { View, Text, Pressable, Modal, useWindowDimensions } = require('./rn');
const Icons = require('@expo/vector-icons');
const ExpoHaptics = require('expo-haptics');
const { useScoreStore } = require('./useScoreStore');
const { useストアの一部 } = require('./storeSlice');
const { formatMemberName } = require('./formatMemberName');
const 決まり = require('./yadokoroRules');
const { 押せる的 } = require('./YadokoroTarget');

const 的の種類たち = [
  ['kasumi36', '霞的(尺二寸)'],
  ['hoshi36', '星的(尺二寸)'],
  ['hoshi24', '星的(八寸)'],
];

function 矢所の窓() {
  const {
    矢所の窓: 開く射,
    archers = [],
    members = [],
    arrowTargetType = 'kasumi36',
    isLiveActive = false,
    ライブは見るだけ = false,
  } = useストアの一部([
    '矢所の窓',
    'archers',
    'members',
    'arrowTargetType',
    'isLiveActive',
    'ライブは見るだけ',
  ]);
  const 店 = () => useScoreStore.getState();
  const 閉じる = () => 店().set矢所の窓(null);
  const 窓 = useWindowDimensions();
  const [知らせ, 知らせを置く] = React.useState('');
  // 開いた射がほかの的で置いてあれば、的もその種類にする（いまの的の矢しか出さないので）
  React.useEffect(() => {
    知らせを置く('');
    const 一人 = 開く射
      ? 決まり.射手だけ(useScoreStore.getState().archers).find((x) => x.id === 開く射.射手ID)
      : null;
    const 的 = 一人 ? 決まり.射の的(一人, 開く射.射番) : null;
    if (的 && 的 !== useScoreStore.getState().arrowTargetType)
      useScoreStore.getState().setArrowTargetType(的);
  }, [開く射 && 開く射.射手ID, 開く射 && 開く射.射番]);

  const 射手 = 開く射 ? 決まり.射手だけ(archers).find((一人) => 一人.id === 開く射.射手ID) : null;
  const 見えている = !!(開く射 && 射手);
  const 番 = 開く射 ? 開く射.射番 : 0;
  const 立 = 決まり.立の番(番);
  const 印 = 射手 ? (射手.marks || [])[番] || '' : '';
  const 鍵 = !!(射手 && 射手.lockedBlocks && 射手.lockedBlocks[立]);
  const 見るだけ = !!(isLiveActive && ライブは見るだけ);
  const 置いた = 決まり.置いてあるか(射手, 番);
  const 名 = 射手 && 射手.name ? formatMemberName(射手.name, members) : '名前なし';
  // 窓は画面いっぱいに近く。的は幅と高さの両方に収める（見出し・案内・下のボタンのぶんを引く）
  const 窓の幅 = Math.min(窓.width - 24, 600);
  const 的の大きさ = Math.max(200, Math.min(窓の幅 - 24, 窓.height - 230, 560));

  const 置く = (位置) => {
    if (!射手) return;
    const 決め = 決まり.置き方(印, 位置.内側, { 見るだけ, 鍵 });
    if ('置けない' === 決め.する) return void 知らせを置く('見るだけで入っているので、置けません');
    if ('鍵' === 決め.する) return void 知らせを置く('鍵のかかった立ちです。○×と合う側なら置けます');
    if ('合わない' === 決め.する)
      return void 知らせを置く(`この射は${印}です。${'○' === 印 ? '的の中' : '的の外'}に置いてください`);
    const 矢所 = { x: 位置.x, y: 位置.y, targetType: arrowTargetType };
    if ('一緒に入れる' === 決め.する) 店().矢所を置いて印を入れる(射手.id, 番, 決め.印, 矢所);
    else 店().updateArrowLocation(射手.id, 番, 矢所);
    try {
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } catch (_) {
      /* 震えなくても困らない */
    }
    知らせを置く(`${番 + 1}射目に${決め.印}を置きました。押し直すと置き直せます`);
  };
  const 消す = () => {
    if (!射手 || !置いた || 見るだけ) return;
    店().updateArrowLocation(射手.id, 番, null);
    知らせを置く(`${番 + 1}射目の矢所を消しました（○×はそのまま）`);
  };
  const 種類の番 = Math.max(
    0,
    的の種類たち.findIndex(([値]) => 値 === arrowTargetType)
  );
  const 案内 = 見るだけ
    ? '見るだけで入っています'
    : !決まり.印か(印)
      ? '押すと○×も入ります（中＝○・外＝×）'
      : `${印} なので${'○' === 印 ? '的の中' : '的の外'}に置けます`;

  return (
    <Modal visible={見えている} transparent animationType="fade" onRequestClose={閉じる}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={閉じる} />
        {見えている ? (
          <View
            testID="矢所の窓"
            style={{
              width: 窓の幅,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 12,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <Text
                testID="矢所の窓-射"
                numberOfLines={1}
                style={{ flex: 1, fontSize: 17, fontWeight: 'bold', color: '#000' }}
              >
                {名} {番 + 1}射目 {印}
              </Text>
              <Pressable
                onPress={閉じる}
                accessibilityRole="button"
                accessibilityLabel="閉じる"
                aria-label="閉じる"
                hitSlop={10}
              >
                <Icons.Ionicons name="close" size={24} color="#8E8E93" />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: '#3C3C43' }}>
                {案内}
              </Text>
              <Pressable
                testID="矢所の窓-的の種類"
                onPress={() => 店().setArrowTargetType(的の種類たち[(種類の番 + 1) % 的の種類たち.length][0])}
                accessibilityRole="button"
                aria-label={`的の種類：${的の種類たち[種類の番][1]}。押すと切り替えます`}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#C6C6C8',
                }}
              >
                <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '600' }}>
                  {的の種類たち[種類の番][1]}
                </Text>
              </Pressable>
            </View>
            <押せる的
              testID="矢所の窓-的"
              読み={`${名} ${番 + 1}射目の矢所を置く的`}
              大きさ={的の大きさ}
              的の種類={arrowTargetType}
              点たち={決まり.的の点たち(射手, 立, arrowTargetType)}
              いまの番={番}
              使える={!見るだけ}
              合う側={決まり.印か(印) ? 印 : null}
              置く={置く}
            />
            <Text
              testID="矢所の窓-知らせ"
              numberOfLines={1}
              style={{ fontSize: 12, color: '#3C3C43', minHeight: 16 }}
            >
              {知らせ}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Pressable
                testID="矢所の窓-消す"
                onPress={消す}
                disabled={!置いた || 見るだけ}
                accessibilityRole="button"
                aria-label="この射の矢所を消す"
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#F2F2F7',
                  alignItems: 'center',
                  opacity: !置いた || 見るだけ ? 0.4 : 1,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FF3B30' }}>消す</Text>
              </Pressable>
              <Pressable
                testID="矢所の窓-完了"
                onPress={閉じる}
                accessibilityRole="button"
                aria-label="完了"
                style={{
                  flex: 2,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#007AFF',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' }}>完了</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

module.exports = { 矢所の窓 };
