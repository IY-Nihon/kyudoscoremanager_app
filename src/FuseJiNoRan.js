'use strict';

/**
 * 伏せ字の入力欄（パスワード・合言葉）に、目のマークで字を見せる・隠すボタンを付けたもの（2026-11-28 本人
 * 「団体と管理者のパスワードのところが常に見えなくて合っているか確認しづらい。目のマークで見えるように」）。
 *
 * 欄の形（style）はそのまま使い、右に目のボタンを重ねる（欄の右に余白を足して、字がボタンに隠れないようにする）。
 * 欄の外の余白（margin）は外側の箱へ移す（ボタンを欄の高さの真ん中に置くため）。
 * ボタンの名前は「入力した字を表示／隠す」。欄の名前（「管理者の合言葉」など）を入れると、名前で欄を探す検査が
 * ボタンにも当たるので入れない。ほかの props は TextInput にそのまま渡す
 */
const React = require('react');
const { View, TextInput, Pressable, StyleSheet } = require('./rn');
const Icons = require('@expo/vector-icons');
const { 色 } = require('./iro');
const { IS_WEB } = require('./IS_WEB');

const 外の余白の鍵 = [
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'alignSelf',
  'flex',
  'width',
];

function 伏せ字の欄({ style, 隠す = true, ...入力 }) {
  const [見せる, 見せるを置く] = React.useState(false);
  if (!隠す) return <TextInput style={style} {...入力} />;
  const 平ら = StyleSheet.flatten(style) || {};
  const 外 = {};
  const 中 = {};
  for (const [鍵, 値] of Object.entries(平ら)) (外の余白の鍵.includes(鍵) ? 外 : 中)[鍵] = 値;
  return (
    <View style={[外, { position: 'relative', justifyContent: 'center' }]}>
      <TextInput
        {...入力}
        style={[中, { paddingRight: 44 }, 外.width != null || 外.flex != null ? { width: '100%' } : null]}
        secureTextEntry={!見せる}
      />
      <Pressable
        testID={入力.testID ? `${入力.testID}-目` : undefined}
        accessibilityRole="button"
        accessibilityLabel={見せる ? '入力した字を隠す' : '入力した字を表示'}
        aria-label={見せる ? '入力した字を隠す' : '入力した字を表示'}
        onPress={() => 見せるを置く((前) => !前)}
        hitSlop={6}
        style={[
          {
            position: 'absolute',
            right: 4,
            top: 0,
            bottom: 0,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
          },
          IS_WEB && { cursor: 'pointer' },
        ]}
      >
        <Icons.Ionicons name={見せる ? 'eye-off' : 'eye'} size={20} color={色.灰} />
      </Pressable>
    </View>
  );
}

module.exports = { 伏せ字の欄 };
