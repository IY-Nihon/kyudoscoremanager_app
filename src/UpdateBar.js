/**
 * Module ID: UpdateBar
 *
 * 新しい版が出たことを、画面の上に細く知らせる帯。web だけ。
 *
 * 何を見て気づくかは src/updateNotice.js にある（純粋な関数なので検査できる）。
 * ここは出し方と、押されたときの読み込み直しだけ。
 *
 * ■ 勝手に読み込み直さない
 * 記録の途中で画面が入れ替わると、何が起きたのか分からない。
 * 押されたときだけ読み込み直す。閉じることもできる。
 *
 * ■ ライブ記録中と案内中は出さない
 * この帯は画面の流れの中に置いてあるので、出ると下が押し下がる。
 *   ・○×を入れている最中に降りてくると、押す先がずれる
 *   ・案内（チュートリアル）は手順ごとに1回しか位置を測らないので、
 *     測ったあとに出ると、指す穴が本来の場所からずれる
 * どちらも終われば出る。見落としても、次に開いたときに出る。
 *
 * 流れの中に置いているのは、覆い隠さないため。オフラインの知らせ
 *（OfflineIndicator.js）は絶えず出たり消えたりするので浮かせて
 * あるが、こちらは出たら押されるまで居座るので、覆うと邪魔になる。
 *
 * ■ 手元の記録は消えない
 * 盤面も名簿も端末に残してあるので（ストアの 端末の置き場）、
 * 読み込み直しても戻ってくる。帯にもそう書いてある。
 */
'use strict';

import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import StyleSheet from './StyleSheet';
import { 束の名前, 新しい版が出たか, 見に行く間隔 } from './updateNotice';
import { useScoreStore } from './useScoreStore';
import { use案内中 } from './TutorialGuide';

const IS_WEB = Platform.OS === 'web';

/** いま動いている束の名前。読めなければ null（そのときは何も知らせない） */
function いまの束() {
  if (typeof document === 'undefined') return null;
  const 札 = [...document.querySelectorAll('script[src]')]
    .map((x) => x.getAttribute('src'))
    .filter((x) => x && /AppEntry-|\.js$/.test(x));
  return 札.length ? 札[0] : null;
}

export function UpdateBar() {
  const [出すか, 出すかを置く] = useState(false);
  const [閉じたか, 閉じたかを置く] = useState(false);
  // 記録中と案内中は出さない（上の説明を参照）。見に行くのは続ける
  const ライブ中 = useScoreStore((s) => s.isLiveActive);
  const 案内中 = use案内中();

  useEffect(() => {
    if (!IS_WEB) return;
    const 束 = いまの束();
    if (!束) return; // 何を比べればよいか分からない。黙る
    let 生きている = true;

    const 見に行く = async () => {
      if (!生きている || typeof fetch !== 'function') return;
      try {
        // 取り置きは使わない。使うと、まさに古いものを見て「変わっていない」と答える
        const 返り = await fetch('/index.html', { cache: 'no-store' });
        if (!返り || !返り.ok) return;
        const 文 = await 返り.text();
        if (生きている && 新しい版が出たか(束, 文)) 出すかを置く(true);
      } catch (e) {
        /* 通信できないだけ。次の機会に見る */
      }
    };

    // 画面が戻ってきたときに見る。裏に回っているあいだは見ない
    const 戻ってきたら = () => {
      if (typeof document !== 'undefined' && !document.hidden) 見に行く();
    };
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', 戻ってきたら);
    const 時計 = setInterval(見に行く, 見に行く間隔);
    // node（検査）では、走り続ける時計があるとまとめて終われない
    if (時計 && typeof 時計.unref === 'function') 時計.unref();

    return () => {
      生きている = false;
      clearInterval(時計);
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', 戻ってきたら);
    };
  }, []);

  if (!IS_WEB || !出すか || 閉じたか || ライブ中 || 案内中) return null;

  const 読み込み直す = async () => {
    try {
      // Service Worker も新しいものに入れ替える。入れ替えないと、
      // 通信できないときの後ろ盾が古いままになる
      if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
        const 登録 = await navigator.serviceWorker.getRegistration();
        if (登録) await 登録.update();
      }
    } catch (e) {
      /* 入れ替えられなくても、読み込み直せば新しい束にはなる */
    }
    if (typeof location !== 'undefined') location.reload();
  };

  return (
    <View style={S.帯} accessibilityRole="alert">
      <Text style={S.字} numberOfLines={2}>
        新しい版が出ています。読み込み直すと最新になります（お手元の記録は残ります）。
      </Text>
      <Text
        style={S.押す}
        onPress={読み込み直す}
        accessibilityRole="button"
        accessibilityLabel="読み込み直して最新にする"
        aria-label="読み込み直して最新にする"
      >
        更新
      </Text>
      <Text
        style={S.閉じる}
        onPress={() => 閉じたかを置く(true)}
        accessibilityRole="button"
        accessibilityLabel="この知らせを閉じる"
        aria-label="この知らせを閉じる"
      >
        ✕
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  帯: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  字: { flex: 1, color: '#FFF', fontSize: 12, lineHeight: 17 },
  押す: {
    color: '#0A84FF',
    backgroundColor: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 10,
    overflow: 'hidden',
  },
  閉じる: { color: '#FFF', fontSize: 16, paddingHorizontal: 10, paddingVertical: 4 },
});
