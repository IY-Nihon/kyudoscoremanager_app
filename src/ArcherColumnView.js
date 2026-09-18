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
      const 見つけた = 割り当て.find((x) => x && archer && x.id === archer.id);
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
    const F = useScoreStore((e) => e.toggleLock);
    const A = useScoreStore((e) => e.viewScale);
    const z = 'number' == typeof A && !isNaN(A) && A > 0 ? A : 1;
    const L = useScoreStore((e) => e.members || []);
    const B = (() => {
      // どこまで数えるかの規則は teamGrouping に1つだけ置く。
      // ここに写しを持つと、欄と行で数が食い違う（2026-09-08 に起きた）
      if (archer.isTotalCalculator)
        return 組.合計を数える(Array.isArray(allArchers) ? allArchers : [], indexInList);
      return (archer.marks || []).filter((e) => '○' === e).length;
    })();
    const M = [];
    // 縦の表は下から上へ数える（1射目が下）。横の表は左から右へ数える
    if (!archer.isSeparator) {
      if (横) for (let e = 0; e < shots; e++) M.push(e);
      else for (let e = shots - 1; e >= 0; e--) M.push(e);
    }
    // 立の切れ目に引く太線。縦は「その立の1本目の下」、横は「その立の4本目の右」
    const 切れ目 = (位置) => (横 ? 位置 % 4 == 3 && 位置 !== shots - 1 : 位置 % 4 == 0 && 0 !== 位置);
    // 1ますの外枠。横のとき、間隔は細い列ではなく細い行になる
    const ます幅 =
      (横 ? UIConfig.cellWidth : archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * z;
    const ます高 = (横 && archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellHeight) * z;
    const W = (archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * z;
    const w = archer.isSeparator
      ? 'rgba(142,142,147,0.15)'
      : archer.isTotalCalculator
        ? 'rgba(0,122,255,0.1)'
        : '#F2F2F7';
    const // 立ごとの行に出す数を作るために、この合計が受け持つ射手を集める。
      // 上の「計」の欄とまったく同じ規則を使う。以前はここに写しを持っていて、
      // 欄は総計になっているのに行の数だけ0のままだった（2026-09-08）
      N = () => 組.合計が受け持つ射手(Array.isArray(allArchers) ? allArchers : [], indexInList);
    const U = (e) => {
      const t = N();
      if (0 === t.length) return 0;
      const o = 4 * e;
      const l = Math.min(o + 4, shots);
      return t.reduce((e, t) => {
        let i = 0;
        const n = t.marks || [];
        for (let e = o; e < l; e++) '○' === n[e] && i++;
        return e + i;
      }, 0);
    };
    const // 読み上げ（VoiceOver / TalkBack）が読む言葉。
      // 画面の字は「○」「×」だけで、そのままだと「まる」「かける」と読まれる
      読み上げの言葉 = (射番) =>
        読み.ますの読み({
          射手名: archer.name,
          番: 射位の番,
          人数: 実の並び.length,
          射番: 射番,
          印: (archer.marks || [])[射番],
        });
    const H = (e, t) => {
      if (onToggleLock) onToggleLock(e, t);
      else F(e, t);
    };
    const P = (e) => formatMemberName(e, L);
    const // 手前の計もまとめる合計は「総計」。ふつうの「計」と見分けるため
      v = () =>
        archer.isTotalCalculator
          ? archer.またぐ合計
            ? '総計'
            : '合計'
          : archer.name
            ? P(archer.name)
            : '選択';
    const O = archer.isSeparator || archer.isTotalCalculator;
    const R = O ? 1.5 : 1;
    const _ = O ? 1.5 : 0;
    // 1立が全部埋まって少し経ったら、鍵を自動でかける。
    // 鍵ボタンは「間隔」「計」の列に付いていて、押すと自分より右の射手を
    // まとめて閉じる。だから受け持つのもその列だけでよい。
    // 履歴の編集画面（onToggleLock を渡してくる）と、そもそも押せない場では何もしない
    // 射位（大前・N番・落）は、区切りや合計の行を除いた並びで数える。
    // chatStats と同じ数え方でないと、AIの答えと読み上げで呼び方が食い違う
    const 実の並び = (Array.isArray(allArchers) ? allArchers : []).filter(
      (a) => a && !a.isSeparator && !a.isTotalCalculator
    );
    const 射位の番 = 実の並び.findIndex((a) => a && a.id === archer.id);
    const 自動ロックする = useScoreStore((e) => e.自動ロックする);
    const 自動ロックまでの秒 = useScoreStore((e) => e.自動ロックまでの秒);
    const 立を閉じる = useScoreStore((e) => e.立を閉じる);
    const 埋まった時刻 = React.useRef({});
    const 閉じた覚え = React.useRef({});
    // 埋まっている立の番号。中身が変わったときだけ数え直したいので文字にする
    const 埋まった立 = (() => {
      if (!O || !鍵が効く || onToggleLock || (isReadOnly && !isAdminMode)) return '';
      const 仲間 = N();
      if (!仲間.length) return '';
      const 出 = [];
      for (let b = 0; 4 * b < shots; b++) {
        const 端 = Math.min(4 * b + 4, shots);
        let 全部 = true;
        for (let j = 0; j < 仲間.length && 全部; j++) {
          const 印 = 仲間[j].marks || [];
          for (let x = 4 * b; x < 端; x++)
            if (!(印[x] ?? '')) {
              全部 = false;
              break;
            }
        }
        if (全部) 出.push(b);
      }
      return 出.join(',');
    })();
    React.useEffect(() => {
      const 立たち = 埋まった立 ? 埋まった立.split(',').map(Number) : [];
      // 埋まらなくなった立は覚えを捨てる。入れ直せば、また閉じるように
      const いま = new Set(立たち);
      [埋まった時刻, 閉じた覚え].forEach((箱) => {
        Object.keys(箱.current).forEach((b) => {
          if (!いま.has(Number(b))) delete 箱.current[b];
        });
      });
      if (!自動ロックする || !立たち.length) return;
      const 今 = Date.now();
      立たち.forEach((b) => {
        if (!埋まった時刻.current[b]) 埋まった時刻.current[b] = 今;
        // すでに閉じている立は、自分で開け直した人の邪魔をしないよう放っておく
        if (archer.lockedBlocks?.[b]) 閉じた覚え.current[b] = true;
      });
      const 残り = 立たち.filter((b) => !閉じた覚え.current[b]);
      if (!残り.length) return;
      const 待つ = Math.max(
        0,
        Math.min(...残り.map((b) => 埋まった時刻.current[b])) + 自動ロックまでの秒 * 1000 - 今
      );
      const 札 = setTimeout(() => {
        const 頃 = Date.now();
        残り.forEach((b) => {
          if (埋まった時刻.current[b] + 自動ロックまでの秒 * 1000 <= 頃) {
            閉じた覚え.current[b] = true;
            立を閉じる(archer.id, b);
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
                width: UIConfig.cellWidth * (shots + 1) * z,
                backgroundColor: 'transparent',
              }
            : { width: W, backgroundColor: 'transparent' }
        }
      >
        <View style={{ flexDirection: 横 ? 'row-reverse' : 'column' }}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              b.header,
              横
                ? {
                    width: UIConfig.cellWidth * z,
                    height: ます高,
                    backgroundColor: w,
                    marginBottom: 0,
                    borderBottomWidth: R,
                    borderBottomColor: '#000',
                    borderTopWidth: _,
                    borderTopColor: '#000',
                  }
                : {
                    width: W,
                    height: UIConfig.headerHeight * z,
                    backgroundColor: w,
                    marginBottom: 0,
                    borderRightWidth: R,
                    borderRightColor: '#000',
                    borderLeftWidth: _,
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
            onPress={() => 合算を置く((x) => !x)}
          >
            {archer.isSeparator || archer.isTotalCalculator
              ? null
              : (() => {
                  const o = archer.substitutions || {};
                  const i = Array.isArray(archer.marks) ? archer.marks : [];
                  const n = Object.keys(o)
                    .map(Number)
                    .sort((e, t) => e - t)
                    .filter((e) => e < i.length);
                  if (n.length > 0 && !合算で見る) {
                    const e = [];
                    const s = n[0];
                    const a = i.slice(0, s).filter((e) => '○' === e).length;
                    e.push({ name: v(), hits: a });
                    for (let t = 0; t < n.length; t++) {
                      const l = n[t];
                      const s = t + 1 < n.length ? n[t + 1] : i.length;
                      const a = o[l] || '?';
                      e.push({ name: P(a), hits: i.slice(l, s).filter((e) => '○' === e).length });
                    }
                    return (
                      <Text style={[b.hitCountSub, { fontSize: 8 * z }]}>
                        {e.map((o, i) => (
                          <React.Fragment key={i}>
                            <Text>
                              {o.name} {o.hits}
                            </Text>
                            {i < e.length - 1 ? <Text>{', '}</Text> : null}
                          </React.Fragment>
                        ))}
                      </Text>
                    );
                  }
                  return <Text style={[b.hitCount, { fontSize: 22 * z }]}>{B}</Text>;
                })()}
            {archer.isTotalCalculator ? (
              <Text style={[b.hitCount, { color: '#007AFF', fontSize: 22 * z }]}>{B}</Text>
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
              {Array.from({ length: shots }, (e, t) => (横 ? t : shots - 1 - t)).map((t) => {
                const l = Math.floor(t / 4);
                const c = 切れ目(t);
                const h = t === Math.min(shots - 1, 4 * l + 3);
                const u = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[l] || false);
                return (
                  <View key={t} style={{ width: ます幅, height: ます高 }}>
                    <ScoreCell
                      archerId={archer.id}
                      index={t}
                      横並び={横}
                      isLocked={u}
                      isBlockBottom={c}
                      isBlockTop={h}
                      isFirst={0 === t}
                      hideMark
                      isNormalArcher={!鍵が効く}
                      columnType="separator"
                      mark={archer.marks?.[t]}
                      onToggle={onToggleMark}
                    />
                    {h && (
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                        disabled={isReadOnly && !isAdminMode}
                        onPress={() => H(archer.id, l)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ) : archer.isTotalCalculator ? (
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {M.map((t) => {
                const c = Math.floor(t / 4);
                const h = U(c);
                const // 立ごとの合計を出すます。縦なら立の一番下、横なら立の左端
                  u = t % 4 == 0;
                const m = t === Math.min(shots - 1, 4 * c + 3);
                const C = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[c] || false);
                return (
                  <View key={t} style={{ width: ます幅, height: ます高 }}>
                    <ScoreCell
                      archerId={archer.id}
                      index={t}
                      横並び={横}
                      mark={archer.marks?.[t]}
                      isLocked={C}
                      isBlockBottom={横 ? 切れ目(t) : t % 4 == 0 && (0 !== t || shots > 4)}
                      isBlockTop={m}
                      isFirst={0 === t}
                      hideMark
                      isNormalArcher={!鍵が効く}
                      columnType="total"
                      onToggle={onToggleMark}
                    />
                    {u && (
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
                        <Text style={[b.blockTotalText, { fontSize: 24 * z }]}>{h}</Text>
                      </View>
                    )}
                    {m && (
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                        disabled={isReadOnly && !isAdminMode}
                        onPress={() => H(archer.id, c)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={横 ? { flexDirection: 'row' } : undefined}>
              {M.map((t) => {
                const o = archer.substitutions?.[t];
                let l = '';
                o && (l = P(o));
                const n = Math.floor(t / 4);
                const s = t === Math.min(shots - 1, 4 * n + 3);
                const c = !(isReadOnly && !isAdminMode) && (archer.lockedBlocks?.[n] || false);
                return (
                  <ScoreCell
                    key={t}
                    archerId={archer.id}
                    index={t}
                    横並び={横}
                    mark={archer.marks?.[t] || ''}
                    subName={l}
                    isLocked={c}
                    isBlockBottom={切れ目(t)}
                    isBlockTop={s}
                    isFirst={0 === t}
                    isNormalArcher
                    columnType="normal"
                    読み={読み上げの言葉(t)}
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
              b.footer,
              {
                width: W,
                height: UIConfig.footerHeight * z,
                backgroundColor: archer.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                padding: 0,
                borderRightWidth: R,
                borderRightColor: '#000',
                borderLeftWidth: _,
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
                      fontSize: 組.区切りの名の字(z, UIConfig).fontSize,
                      lineHeight: 組.区切りの名の字(z, UIConfig).lineHeight,
                      fontWeight: '700',
                      color: 組.チームの色(区切りの名) || '#8E8E93',
                      textAlign: 'center',
                    }} // 欄の高さに入るだけ行を使う（3 行では大学名が切れた）
                    numberOfLines={組.区切りの名の字(z, UIConfig).numberOfLines}
                  >
                    {区切りの名}
                  </Text>
                ) : (
                  <Icons.Ionicons name="close-circle" size={24 * z} color="#8E8E93" />
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
                    borderTopWidth: 3 * z,
                    borderTopColor: チーム.色,
                    paddingTop: 4 - Math.min(3 * z, 4),
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
                <Text style={[b.footerName, { color: '#000', fontSize: 12 * z }]} numberOfLines={2}>
                  {v()}
                </Text>
                {archer.isGuest ? <Text style={[b.guestLabel, { fontSize: 9 * z }]}>(ゲスト)</Text> : null}
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
                    <Icons.Ionicons name="person" size={10 * z} color="#FFF" />
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
const b = StyleSheet.create({
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
