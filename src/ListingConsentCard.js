/**
 * 「使っている部として、紹介に載せてもよいですか？」の札と、設定でも使う選び（2026-10-09）。
 *
 *   掲載の選び … 何を載せるか（団体名／地域だけ／載せない）と、どこに載せるか（ホームページ／他校へのご案内）。
 *                 載せる先は最初どちらもチェック（本人の指示）。札と設定で同じものを使う
 *   掲載の札   … 記録を保存した直後、使い慣れた団体に 1 回だけ出す。窓（Modal）にはせず、閉じられる札にする
 *                 （作業を止めない。帯は Modal に入れない、の決まりとも合わせる）
 *
 * いつ出すか・どう残すかは src/listingConsent.js と src/storeListing.js。
 */
'use strict';

const React = require('react');
const { View, Text, TextInput, Pressable } = require('./rn');
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
const 決まり = require('./listingConsent');
const { styles: 設定の見た目 } = require('./settingsStyles');

const 青 = '#007AFF';
const 薄い = '#8E8E93';

/** 何を載せるか・どこに載せるか（札と設定で同じ） */
function 掲載の選び({ 選び, 選びを置く, 置き場 = '掲載' }) {
  const 置く = (足す) => 選びを置く(Object.assign({}, 選び, 足す));
  const 載せ方の札 = [
    ['団体名', '団体名'],
    ['地域', '地域だけ'],
    ['載せない', '載せない'],
  ];
  const 印 = (入っている) => (
    <Icons.Ionicons name={入っている ? 'checkbox' : 'square-outline'} size={20} color={入っている ? 青 : 薄い} />
  );
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, color: '#3C3C43' }}>何を載せるか</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 6 }}>
        {載せ方の札.map(([値, 名]) => {
          const 選んだ = 選び.載せ方 === 値;
          return (
            <Pressable
              key={値}
              testID={`${置き場}-載せ方-${値}`}
              onPress={() => 置く({ 載せ方: 値 })}
              accessibilityRole="radio"
              accessibilityState={{ selected: 選んだ }}
              aria-checked={選んだ}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 選んだ ? 青 : '#C6C6C8',
                backgroundColor: 選んだ ? '#E1F0FF' : '#FFFFFF',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: 選んだ ? 青 : '#000000', fontWeight: 選んだ ? '600' : '400' }}>
                {名}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {'団体名' === 選び.載せ方 ? (
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: '#3C3C43' }}>載せる名前（正式な名前に直せます）</Text>
          <TextInput
            testID={`${置き場}-名前`}
            value={選び.載せる名前}
            onChangeText={(文) => 置く({ 載せる名前: 文 })}
            accessibilityLabel="載せる名前"
            aria-label="載せる名前"
            autoComplete="off"
            style={{
              borderWidth: 1,
              borderColor: '#C6C6C8',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              fontSize: 14,
              color: '#000000',
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>
      ) : null}
      {'地域' === 選び.載せ方 ? (
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: '#3C3C43' }}>地域</Text>
          <TextInput
            testID={`${置き場}-地域`}
            value={選び.地域}
            onChangeText={(文) => 置く({ 地域: 文 })}
            placeholder="例：関東の大学"
            accessibilityLabel="地域"
            aria-label="地域"
            autoComplete="off"
            style={{
              borderWidth: 1,
              borderColor: '#C6C6C8',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              fontSize: 14,
              color: '#000000',
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>
      ) : null}
      {選び.載せ方 && '載せない' !== 選び.載せ方 ? (
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 12, color: '#3C3C43' }}>どこに載せるか</Text>
          {[
            ['ホームページ', 'ホームページ'],
            ['他校への案内', '他校へのご案内（DM）'],
          ].map(([鍵, 名]) => (
            <Pressable
              key={鍵}
              testID={`${置き場}-${鍵}`}
              onPress={() => 置く({ [鍵]: !選び[鍵] })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!選び[鍵] }}
              aria-checked={!!選び[鍵]}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
            >
              {印(!!選び[鍵])}
              <Text style={{ fontSize: 13, color: '#000000' }}>{名}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * 記録を保存した直後の札。
 * @param {{ 見える: boolean, 閉じる: () => void, 知らせる: (文: string) => void }} props
 */
function 掲載の札({ 見える, 閉じる, 知らせる }) {
  const 団体名 = useScoreStore((状態) => 状態.activeGroupName);
  const [選び, 選びを置く] = React.useState(() => 決まり.最初の選び(null, 団体名));
  const [誤り, 誤りを置く] = React.useState('');
  const [送っている, 送っているを置く] = React.useState(false);
  React.useEffect(() => {
    if (見える) {
      選びを置く(決まり.最初の選び(useScoreStore.getState().いまの掲載の許可(), 団体名));
      誤りを置く('');
    }
  }, [見える]);
  if (!見える) return null;
  const 決める = async () => {
    if (送っている) return;
    送っているを置く(true);
    const 結果 = await useScoreStore.getState().掲載の許可を答える(選び);
    送っているを置く(false);
    if (結果.誤り) return void 誤りを置く(結果.誤り);
    閉じる();
    知らせる('保存しました。設定の「紹介への掲載」で変えられます');
  };
  return (
    <View
      testID="掲載の札"
      accessibilityRole="dialog"
      aria-label="紹介への掲載のお願い"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 88,
        alignItems: 'center',
        zIndex: 20,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#C6C6C8',
          padding: 14,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: 'bold', color: '#000000', lineHeight: 21 }}>
            使っている部として、紹介に載せてもよいですか？
          </Text>
          <Pressable
            testID="掲載-閉じる"
            onPress={閉じる}
            accessibilityRole="button"
            accessibilityLabel="閉じる（あとで聞く）"
            aria-label="閉じる（あとで聞く）"
            hitSlop={10}
          >
            <Icons.Ionicons name="close" size={22} color={薄い} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 12, color: '#3C3C43', lineHeight: 18 }}>
          載せるのは団体名か地域だけです。記録や部員の名前は出しません。あとから設定で変えられます。
        </Text>
        <掲載の選び 選び={選び} 選びを置く={選びを置く} />
        {誤り ? (
          <Text testID="掲載-誤り" style={{ fontSize: 12, color: '#FF3B30' }}>
            {誤り}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable testID="掲載-あとで" onPress={閉じる} accessibilityRole="button" hitSlop={8}>
            <Text style={{ fontSize: 14, color: 青 }}>あとで</Text>
          </Pressable>
          <Pressable
            testID="掲載-決める"
            onPress={決める}
            accessibilityRole="button"
            aria-label="決める"
            style={{
              paddingHorizontal: 22,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: 青,
              opacity: 送っている ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>決める</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * 設定の「紹介への掲載」。札で一度でも聞いた団体の団体ログインにだけ出す（案内が来ていない団体には出さない。本人）。
 * 開いたときに雲から読み直す（別の端末で答えているかもしれない）。
 */
function 掲載の設定() {
  const 役割 = useScoreStore((状態) => 状態.activeRole);
  const 団体ID = useScoreStore((状態) => 状態.activeGroupId);
  const 団体名 = useScoreStore((状態) => 状態.activeGroupName);
  const 許可 = useScoreStore((状態) =>
    状態.掲載の許可 && 状態.掲載の許可.団体ID === 状態.activeGroupId ? 状態.掲載の許可 : null
  );
  const [選び, 選びを置く] = React.useState(() => 決まり.最初の選び(許可, 団体名));
  const [知らせ, 知らせを置く] = React.useState('');
  const [送っている, 送っているを置く] = React.useState(false);
  React.useEffect(() => {
    if ('group' === 役割 && 団体ID) useScoreStore.getState().掲載の許可を読む();
  }, [役割, 団体ID]);
  // 雲から読み直した答えを、選びに映す（答えた日時が変わったときだけ。打ちかけを消さない）
  const 答えた日時 = 許可 && 許可.答えた日時;
  React.useEffect(() => {
    選びを置く(決まり.最初の選び(許可, 団体名));
  }, [答えた日時, 団体ID]);
  if (!決まり.設定に出すか(役割, 許可)) return null;
  const 保存する = async () => {
    if (送っている) return;
    送っているを置く(true);
    const 結果 = await useScoreStore.getState().掲載の許可を答える(選び);
    送っているを置く(false);
    知らせを置く(結果.誤り || '保存しました');
  };
  const いつ = 決まり.答えたか(許可) && 決まり.ミリ秒(許可.答えた日時)
    ? new Date(決まり.ミリ秒(許可.答えた日時)).toLocaleDateString('ja-JP') + ' に答えました'
    : 'まだ答えていません（何も選ばなければ載せません）';
  return (
    <View style={設定の見た目.section} testID="設定-紹介への掲載">
      <Text style={設定の見た目.sectionTitle}>紹介への掲載</Text>
      <View style={設定の見た目.sectionContainer}>
        <View style={[設定の見た目.item, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
          <Text style={{ fontSize: 12, color: '#3C3C43', lineHeight: 18 }}>
            使っている部として、ホームページや他校へのご案内に載せてよいかを選べます。載せるのは団体名か地域だけで、記録や部員の名前は出しません。
          </Text>
          <掲載の選び 選び={選び} 選びを置く={(次) => (知らせを置く(''), 選びを置く(次))} 置き場="設定-掲載" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 12, color: 薄い }}>{知らせ || いつ}</Text>
            <Pressable
              testID="設定-掲載-保存"
              onPress={保存する}
              accessibilityRole="button"
              aria-label="紹介への掲載を保存"
              style={{ paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: 青, opacity: 送っている ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>保存</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

module.exports = { 掲載の選び, 掲載の札, 掲載の設定 };
