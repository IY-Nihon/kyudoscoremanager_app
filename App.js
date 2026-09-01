import React, { useState, useEffect } from 'react';
import { View, Platform, Alert, AppState } from 'react-native';
// StyleSheet はテーマ変換を通すためブリッジ経由で取得する
import StyleSheet from './src/default_45';
import { useScoreStore } from './src/JP_useScoreStore_174';
import { MainNavigator } from './src/JP_MainNavigator_216';
import { LoginScreen } from './src/JP_LoginScreen_1036';
import { LoadingScreen } from './src/JP_LoadingScreen_1037';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/JP_ErrorBoundary_1041';
import { OfflineIndicator } from './src/JP_OfflineIndicator_1042';
import { WhatsNewModal } from './src/JP_WhatsNewModal';
import { アプリの窓, 出す } from './src/AppDialog';
import { getShadowStyle } from './src/module_592';
import { initTheme, useThemeMode } from './src/theme';
import { auth } from './src/db_178';
import { onAuthStateChanged } from './src/module_191';
import { 見張りを始める, 溜まりを流す, 行動を残す } from './src/errorReporter';
import { 来客の窓 } from './src/JP_LiveShareModal';
import { UpdateBar } from './src/JP_UpdateBar';
import { URLから荷を取る } from './src/liveShare';
import { 見張りを作る } from './src/backgroundSaver';
import { goOffline, goOnline } from './src/module_186';
import { rtdb } from './src/db_178';

const IS_WEB = Platform.OS === 'web';

// 部員の認証方式の版。JP_LoginScreen_1036.js の同名の定数と必ず揃えること。
// 値を上げると、古い方式でログイン中の部員は次回起動時にログアウトされる。
const MEMBER_AUTH_VERSION = 2;

// 共有リンクの荷を、タブ限りで控えておく鍵。
// URL から消したあとも、再読み込みで入り直せるようにするために持つ。
// タブを閉じれば消えるので、次に端末を使う人には残らない。
const 共有の荷の鍵 = 'kyudo.共有の荷';

// 保存済みのテーマと OS 配色の追従を、最初の描画前に開始しておく
initTheme();

export default function App() {
  // テーマが変わったらアプリ全体を再描画させる（色の変換は描画時に走る）
  const { theme } = useThemeMode();
  const isHydrated = useScoreStore(e => e.isHydrated);
  const activeGroupId = useScoreStore(e => e.activeGroupId);
  // 共有リンクだけで来ている人。団体に入っていなくても記録画面を出す
  const 共有の来客 = useScoreStore(e => e.共有の来客);
  // URL に載っていた共有の荷。窓を出して、合言葉があれば聞く
  const [共有の荷, 共有の荷を置く] = useState(null);

  // 裏に回っているあいだは、Realtime Database との線を休ませる。
  //
  // 無料枠の同時接続は100で、数えているのは「接続」であって見張りではない。
  // 見張りを外しても線は残るので、減らすには線そのものを切る（src/backgroundSaver.js）。
  // 切っているあいだの書き込みは Realtime Database が溜めて、つなぎ直したときに送る
  useEffect(() => {
    if (!rtdb) return;
    const 見張り = 見張りを作る({
      切る: () => goOffline(rtdb),
      つなぐ: () => goOnline(rtdb),
    });
    // web は画面が見えているか、端末はアプリが前面か
    let 外す = () => {};
    if (typeof document !== 'undefined' && document.addEventListener) {
      const 変わった = () =>
        'hidden' === document.visibilityState ? 見張り.裏に回った() : 見張り.表に戻った();
      (document.addEventListener('visibilitychange', 変わった),
        (外す = () => document.removeEventListener('visibilitychange', 変わった)));
    } else {
      const 手 = AppState.addEventListener('change', (状態) =>
        'active' === 状態 ? 見張り.表に戻った() : 見張り.裏に回った()
      );
      外す = () => 手 && 手.remove && 手.remove();
    }
    return () => {
      (外す(), 見張り.片付ける());
    };
  }, []);

  // 共有リンクで開かれたかを、起動のときに一度だけ見る。
  //
  // 荷は「#」の後ろにあるので、配り元の記録（サーバーのログや Referer）には
  // 流れない。
  //
  // 読めたらタブ限りの控えへ移す。router は起動のときに URL を /record へ
  // 書き換えてハッシュを落とすので、控えが無いと**再読み込みで来客が
  // 締め出される**（共有で入った状態は端末に残していない）。実際、控えを
  // 止めて焼き直すと e2e の再読み込みの件が落ちる。
  // 控えはタブを閉じれば消えるので、次に端末を使う人には残らない。
  //
  // URL からも消す。router も結果として落とすので見た目は変わらないが、
  // 読んだ直後に自分で消しておけば、router の振る舞いに頼らずに済む。
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.location) return;
      const URLの荷 = URLから荷を取る(String(window.location.href || ''));
      if (URLの荷) {
        try {
          window.sessionStorage.setItem(共有の荷の鍵, URLの荷);
        } catch (e) {
          // 控えられなくても、この画面のあいだは荷を持っている
        }
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {
          // 消せなくても、荷は読めているので先へ進む
        }
        共有の荷を置く(URLの荷);
        return;
      }
      // 再読み込み。URL には無いが、タブの控えに残っている
      let 控え = null;
      try {
        控え = window.sessionStorage.getItem(共有の荷の鍵);
      } catch (e) {
        // 読めなければ、共有リンクでは来ていない扱いにする
      }
      if (控え) 共有の荷を置く(控え);
    } catch (e) {
      console.warn('[App] 共有リンクを読めませんでした', e);
    }
  }, []);
  const activeRole = useScoreStore(e => e.activeRole);
  const memberAuthVersion = useScoreStore(e => e.memberAuthVersion);
  const setAuth = useScoreStore(e => e.setAuth);
  const 同意の確認が要る = useScoreStore(e => e.同意の確認が要る);
  const startPeriodicSync = useScoreStore(e => e.startPeriodicSync);
  const fetchAndOverwriteFromCloud = useScoreStore(e => e.fetchAndOverwriteFromCloud);
  const setupNetworkListener = useScoreStore(e => e.setupNetworkListener);
  const [hasMounted, setHasMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const cleanup = setupNetworkListener();
    // 画面の外で起きた不具合も拾う。捕まえ損ねると誰にも届かない
    const 見張りをやめる = 見張りを始める();
    行動を残す('アプリを開く');
    // 前回、電波が無くて送れなかったぶんを出し直す
    溜まりを流す();
    return () => {
      cleanup();
      見張りをやめる();
    };
  }, []);

  // ログイン情報は端末に保存されており起動直後に復元されるが、Firebase Auth の
  // セッション復元は非同期で、こちらの方が遅い。待たずにクラウドへ問い合わせると
  // 未認証のまま送られて拒否される。最初の認証状態が確定してから読み書きを始める。
  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    const unsub = onAuthStateChanged(auth, (使う人) => {
      setAuthReady(true);
      // ログインする前に起きた不具合は、決まりの上で送れない（未ログインを弾く）。
      // 入れたところで出し直さないと、ログイン画面での不具合が永久に届かない
      if (使う人) 溜まりを流す();
    });
    return () => unsub();
  }, []);

  // 部員の認証方式を変更したため、古い方式でログイン中の端末は一度だけ入り直してもらう。
  // 端末に個人IDを保存していない＝所属を証明できないため、そのままでは全ての
  // 読み書きが拒否される。黙って失敗させず、明示的にログイン画面へ戻す。
  useEffect(() => {
    if (!isHydrated) return;
    if (activeRole === 'member' && memberAuthVersion !== MEMBER_AUTH_VERSION) {
      console.log('[App] 部員の認証方式が更新されたため再ログインを求めます');
      setAuth(null, null, null, null);
      const msg = 'セキュリティ強化のため、お手数ですが個人IDで再度ログインしてください。';
      出す('再ログインのお願い', msg);
    }
  }, [isHydrated]);

  // 規約とプライバシーポリシーを改定したときだけ出る。
  // 練習の最中に出ることもあるので、「あとで」を必ず添える。
  // 「あとで」を選んだときは記録を残さないため、次の起動でまた出る
  useEffect(() => {
    if (!同意の確認が要る) return;
    const 法 = require('./src/legalDocs');
    const 窓を出す = () => {
      出す(
        '利用規約とプライバシーポリシーの改定',
        '内容が変わりました。お手数ですが、ご確認のうえ同意をお願いします。',
        [
          // 読みに行くと窓は閉じるので、戻ってこられるようもう一度出す
          { text: '利用規約を読む', onPress: () => { 法.開く(法.規約のURL); setTimeout(窓を出す, 500); } },
          { text: 'プライバシーポリシーを読む', onPress: () => { 法.開く(法.プライバシーのURL); setTimeout(窓を出す, 500); } },
          { text: '同意する', onPress: () => useScoreStore.getState().同意を記録する() },
          { text: 'あとで', style: 'cancel', onPress: () => useScoreStore.getState().同意をあとにする() },
        ]
      );
    };
    窓を出す();
  }, [同意の確認が要る]);

  useEffect(() => {
    if (isHydrated && activeGroupId && authReady) {
      console.log('[App] Initializing data for group:', activeGroupId);
      // ライブを置く枝の合言葉。団体IDそのままだと総当たりで覗かれるので、
      // 推測できない名前を使う。入った時点で取っておかないと、ライブを
      // 始める瞬間に取りにいくことになり、間に合わないことがある。
      //
      // 下の取り込みとは別に呼ぶ。同じ try に入れると、雲からの取り込みが
      // 遅れたり失敗したりしただけでライブが使えなくなる
      useScoreStore.getState().ライブの合言葉を用意する();
      (async () => {
        try {
          await fetchAndOverwriteFromCloud();
          startPeriodicSync();
          // 同意の記録を確かめる。記録が無ければ静かに補い、
          // 版が古ければ取り直しの窓を出す（下の効果で拾う）
          useScoreStore.getState().同意を確かめる();
        } catch (e) {
          console.error('[App] Initial data fetch error:', e);
        }
      })();
    } else {
      console.log('[App] Waiting for:', { isHydrated, activeGroupId });
    }
  }, [isHydrated, activeGroupId, authReady]);

  console.log(`[App] Rendering. hasMounted: ${hasMounted}, isHydrated: ${isHydrated}, activeGroupId: ${activeGroupId}`);

  if (!hasMounted || !isHydrated) {
    return <LoadingScreen />;
  }

  const isDarkTheme = theme === 'dark';
  // styles 側の色は default_45 のブリッジが変換するため、ここでは上書きしない
  // （上書きするとダーク色がもう一度変換されて元に戻ってしまう）。
  // 下の <style> は生のCSSで props を通らないため、変換対象外＝直接指定でよい。
  const rootBg = isDarkTheme ? '#000000' : '#F2F2F7';
  const scrollTrack = isDarkTheme ? '#1C1C1E' : '#F2F2F7';
  const scrollThumb = isDarkTheme ? '#48484A' : '#C7C7CC';

  return (
    <View style={styles.appContainer}>
      {IS_WEB && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background: ${rootBg}; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: ${scrollTrack}; }
          ::-webkit-scrollbar-thumb { background: ${scrollThumb}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #8E8E93; }
          * { scrollbar-width: thin; scrollbar-color: ${scrollThumb} ${scrollTrack}; }
        `}} />
      )}
      <View style={styles.responsiveWrapper}>
        <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
          <ErrorBoundary>
            <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
            {/* 新しい版が出たことの知らせ。開いたままのタブは、読み込み直す
                まで古い束のまま動く。ライブの置き場所が変わる回では、古い
                ままの端末が別の枝を見て「相手の○×が出ない」形になる。
                ログインの前後どちらでも出す（気づけないのは同じく困る） */}
            <UpdateBar />
            {activeGroupId || 共有の来客 ? (
              // 色の変換は「描画時」に行うため、テーマを変えたら配下を再マウントして
              // 全画面を描画し直す。React Navigation の画面はメモ化されており、
              // key を変えないと再描画されず配色が古いままになる。
              // 記録データは zustand ストア側にあるため再マウントしても失われない。
              <React.Fragment key={theme}>
                <MainNavigator />
                <OfflineIndicator />
                <WhatsNewModal />
              </React.Fragment>
            ) : (
              <LoginScreen />
            )}
            {/* 共有リンクで来た人を迎える窓。団体に入る前に出す */}
            {共有の荷 && !共有の来客 ? (
              <来客の窓 荷={共有の荷} onClose={() => 共有の荷を置く(null)} />
            ) : null}
            {/* 確認とお知らせの窓。ログインの前の画面でも使うので、
                入った後・入る前のどちらにも入らない外側に1つだけ置く。
                2つ置くと後に描かれた方が受け口を奪うので、必ず1つ。 */}
            <アプリの窓 />
          </ErrorBoundary>
        </SafeAreaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: IS_WEB ? 1000 : undefined,
    backgroundColor: '#FFFFFF',
    ...getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: IS_WEB ? 0.1 : 0,
      shadowRadius: 12,
      elevation: 5
    })
  }
});
