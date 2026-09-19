'use strict';

// 成績の数え方は分析画面と共通（src/statsRules.js）
const 集 = require('./statsRules');
const _xlsx = require('./excelExport');
const themeMod = require('./theme');
const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const ScrollView = require('./ScrollView').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const Switch = require('./Switch').default;
const Alert = require('./alertBridge').default;
const Modal = require('./Modal').default;
const TextInput = require('./TextInput').default;
const Pressable = require('./Pressable').default;
const { IS_IOS, IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
const 規則 = require('./syncRules');
const 案内 = require('./TutorialGuide');
const Icons = require('@expo/vector-icons');
const ReactNativeSafeAreaContext = require('react-native-safe-area-context');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const { use横流し } = require('./yokoNagashi');
const { auth, db } = require('./db');
const FirebaseAuth = require('firebase/auth');
const { getShadowStyle } = require('./shadowStyle');
const Firestore = require('firebase/firestore');
const ExpoImagePicker = require('expo-image-picker');
const _RN = require('react-native');
const _IM = require('expo-image-manipulator');
// ログアウトの確認の文言は src/logoutPrompt.js にある（画面を動かさずに
// 出し分けを検査できるようにするため）
const {
  logoutMessage: ログアウトの文言,
  logoutButtonLabel: ログアウトのボタン名,
  logoutButtonsDisabled: ログアウトのボタンを止める,
  shouldTrySendFirst: 先に送信すべきか,
} = require('./logoutPrompt');
// ─────────────────────────────────────────
// 書き出しの共通ヘルパー
// ─────────────────────────────────────────

// Excel が日付として解釈でき、文字列ソートも崩れない形式にする。
function csvDate(時刻) {
  const 日付 = new Date(時刻);
  const 二桁 = (数) => String(数).padStart(2, '0');
  return 日付.getFullYear() + '-' + 二桁(日付.getMonth() + 1) + '-' + 二桁(日付.getDate());
}
// memberId（無ければ氏名）でメンバーを引く。学年・性別・期の補完に使う。
function findMemberInfo(archer, memberList, alumniList, normalizeName) {
  const all = [].concat(memberList || [], alumniList || []);
  const 整えた名 = normalizeName(archer.name || '');
  return (
    all.find(function (部員) {
      return (
        (archer.memberId && 部員.id === archer.memberId) ||
        (部員.name && normalizeName(部員.name) === 整えた名)
      );
    }) || null
  );
}
const SettingsScreen = () => {
  const { mode: themeMode, setThemeMode: setThemeModeFn } = themeMod.useThemeMode();
  const {
    currentFreshmanTerm = 1,
    alumni = [],
    trash = [],
    shotsPerRound = 8,
    updateCurrentFreshmanTerm,
    syncStatus = 'IDLE',
    lastSyncTime,
    isNetworkOnline = true,
    syncAllToCloud,
    activeGroupId,
    activeGroupName,
    updateGroupName,
    activeRole,
    myMemberId,
    myMemberName,
    members = [],
    setAuth,
    isAdminMode,
    自動ロックする,
    set自動ロックする,
    保存時に出欠を確認する = true,
    set保存時に出欠を確認する,
    setAdminMode,
    verifyGroupPassword,
    deleteGroupAccount: 団体を消す,
    tagTemplates = [],
    addTagTemplate,
    removeTagTemplate,
    autoPromotionEnabled = true,
    setAutoPromotionEnabled,
    enableArrowLocation,
    arrowTargetType,
    setEnableArrowLocation,
    setArrowTargetType,
    sessions: sList = [],
  } = useScoreStore();
  const [書き出しの窓, 書き出しの窓を出す] = React.useState(false);
  const [ガイドの窓, ガイドの窓を出す] = React.useState(false);
  const [ログアウトの窓, ログアウトの窓を出す] = React.useState(false);
  const // ログアウトの確認の段階。'確認' → '送信中' → '送信済み' / '失敗'
    [ログアウトの段階, ログアウトの段階を設定] = React.useState('確認');
  const [残った未送信, 残った未送信を設定] = React.useState(0);
  const [期間の始め, 期間の始めを置く] = React.useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [期間の終わり, 期間の終わりを置く] = React.useState(new Date());
  const [部員名の絞り, 部員名の絞りを置く] = React.useState('all');
  const [言葉の絞り, 言葉の絞りを置く] = React.useState('');
  const [書き出しの形, 書き出しの形を置く] = React.useState('standard');
  const [暦を出す, 暦を出すを置く] = React.useState(false);
  const [暦の対象, 暦の対象を置く] = React.useState('start');
  const [タグの下書き, タグの下書きを置く] = React.useState('');
  const [選んだタグ, 選んだタグを置く] = React.useState([]);
  const [タグの論理, タグの論理を置く] = React.useState('AND');
  const [絞り込みを開く, 絞り込みを開くを置く] = React.useState(false);
  const [管理者の合言葉の窓, 管理者の合言葉の窓を出す] = React.useState(false);
  const [管理者の合言葉, 管理者の合言葉を置く] = React.useState('');
  const [合言葉を確かめ中, 合言葉を確かめ中を置く] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const // アカウントの削除。窓の開閉・入れたパスワード・消している最中の段階
    [削除の窓, 削除の窓を開く] = React.useState(false);
  const [削除の合言葉, 削除の合言葉を設定] = React.useState('');
  const [削除の段階, 削除の段階を設定] = React.useState('');
  const [削除の失敗, 削除の失敗を設定] = React.useState('');
  const [selectedKeywords, setSelectedKeywords] = React.useState([]);
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  const [inquiryVisible, setInquiryVisible] = React.useState(false);
  const [inquiryEmail, setInquiryEmail] = React.useState('');
  const [inquiryContent, setInquiryContent] = React.useState('');
  const [inquirySending, setInquirySending] = React.useState(false);
  const [inquiryImages, setInquiryImages] = React.useState([]);
  // 候補の並びは横に流す。パソコンの車の動きは横に読み替える（src/yokoNagashi.js）
  const titleRefCallback = use横流し();
  const memberRefCallback = use横流し();
  // 問い合わせに付ける写真の並びも同じ
  const 写真の横流し = use横流し();
  const 今日 = new Date();
  const 今の年度 = 今日.getMonth() + 1 >= 4 ? 今日.getFullYear() : 今日.getFullYear() - 1;
  const [書き出す年度, 書き出す年度を置く] = React.useState(今の年度);
  const 年度を動かす = (差) => {
    書き出す年度を置く((今) => 今 + 差);
  };
  const titleSuggestions = React.useMemo(() => {
    try {
      const src =
        'member' === activeRole && myMemberId
          ? sList.filter(
              (記録) =>
                記録 &&
                記録.archers &&
                記録.archers.some(
                  (射手) =>
                    射手 &&
                    (射手.memberId === myMemberId ||
                      (myMemberName &&
                        !射手.memberId &&
                        射手.name &&
                        射手.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName))
                )
            )
          : sList;
      if (!src) return [];
      const titles = src.map((記録) => 記録.title).filter((x) => x && x.trim() !== '');
      return Array.from(new Set(titles)).slice(0, 10);
    } catch (_) {
      return [];
    }
  }, [sList, activeRole, myMemberId, myMemberName]);
  const memberSuggestions = React.useMemo(() => {
    try {
      if ('member' === activeRole) return myMemberName ? [myMemberName] : [];
      const sortMembers = (甲, 乙) => {
        const 甲の学年 = 甲.grade === undefined || 甲.grade === null ? 99 : Number(甲.grade);
        const 乙の学年 = 乙.grade === undefined || 乙.grade === null ? 99 : Number(乙.grade);
        const 甲の順 = 0 === 甲の学年 ? 99 : 甲の学年;
        const 乙の順 = 0 === 乙の学年 ? 99 : 乙の学年;
        if (甲の順 !== 乙の順) return 甲の順 - 乙の順;
        const 性別の順 = (性別) => {
          const 整えた = (性別 || '').trim();
          return '男子' === 整えた ? 0 : '女子' === 整えた ? 1 : 2;
        };
        return (
          性別の順(甲.gender) - 性別の順(乙.gender) || (甲.name || '').localeCompare(乙.name || '', 'ja')
        );
      };
      const list = [...members, ...alumni]
        .sort(sortMembers)
        .map((部員) => 部員.name)
        .filter((名) => 名 && 名.trim() !== '');
      return Array.from(new Set(list));
    } catch (_) {
      return [];
    }
  }, [members, alumni, activeRole, myMemberName]);
  const タグの一覧 = React.useMemo(() => {
    const 集めた = new Set();
    const src =
      'member' === activeRole && myMemberId
        ? sList.filter(
            (記録) =>
              記録 &&
              記録.archers &&
              記録.archers.some(
                (射手) =>
                  射手 &&
                  (射手.memberId === myMemberId ||
                    (myMemberName &&
                      !射手.memberId &&
                      射手.name &&
                      射手.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName))
              )
          )
        : sList;
    return (
      src.forEach((記録) => {
        if (記録.tags && Array.isArray(記録.tags)) 記録.tags.forEach((タグ) => 集めた.add(タグ));
      }),
      Array.from(集めた).sort((甲, 乙) => 甲.localeCompare(乙))
    );
  }, [sList, activeRole, myMemberId, myMemberName]);
  const タグを切り替える = (タグ) => {
    選んだタグを置く((今の) =>
      今の.includes(タグ) ? 今の.filter((タグ1つ) => タグ1つ !== タグ) : [...今の, タグ]
    );
  };
  const 書き出す = async (範囲) => {
    try {
      const { sessions, members: 部員たち } = useScoreStore.getState();
      const 自分の部員ID = 'member' === activeRole ? myMemberId : null;
      const rSessions = 自分の部員ID
        ? sessions.filter(
            (記録) =>
              記録 &&
              記録.archers &&
              記録.archers.some(
                (射手) =>
                  射手 &&
                  (射手.memberId === 自分の部員ID ||
                    (myMemberName &&
                      !射手.memberId &&
                      射手.name &&
                      射手.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName))
              )
          )
        : sessions;
      const 対象の記録 = rSessions.filter((記録) => {
        if ('all' === 範囲) return true;
        const 日付 = new Date(記録.date);
        if ('fiscal' === 範囲) {
          const 年 = 日付.getFullYear();
          return (日付.getMonth() + 1 >= 4 ? 年 : 年 - 1) === 書き出す年度;
        }
        if ('custom' === 範囲) {
          const 始め = new Date(期間の始め);
          始め.setHours(0, 0, 0, 0);
          const 終わり = new Date(期間の終わり);
          if ((終わり.setHours(23, 59, 59, 999), 日付 < 始め || 日付 > 終わり)) return false;
          if (選んだタグ.length > 0) {
            const タグたち = 記録.tags || [];
            if ('AND' === タグの論理) {
              if (!選んだタグ.every((タグ1つ) => タグたち.includes(タグ1つ))) return false;
            } else if (!選んだタグ.some((タグ1つ) => タグたち.includes(タグ1つ))) return false;
          }
          if (selectedKeywords.length > 0) {
            const 題 = 記録.title?.toLowerCase() || '';
            const 覚え書き = 記録.note?.toLowerCase() || '';
            const 日付 = new Date(記録.date);
            const 日付の文 = `${日付.getFullYear()}/${String(日付.getMonth() + 1).padStart(2, '0')}/${String(日付.getDate()).padStart(2, '0')}`;
            const 当たった = selectedKeywords.some((言葉) => {
              const 小文字 = 言葉.toLowerCase();
              return 題.includes(小文字) || 覚え書き.includes(小文字) || 日付の文.includes(小文字);
            });
            if (!当たった) return false;
          }
          if (言葉の絞り) {
            const 言葉 = 言葉の絞り.toLowerCase();
            const 題に有る = 記録.title?.toLowerCase().includes(言葉);
            const 覚え書きに有る = 記録.note?.toLowerCase().includes(言葉);
            const 日付 = new Date(記録.date);
            const 日付に有る =
              `${日付.getFullYear()}/${String(日付.getMonth() + 1).padStart(2, '0')}/${String(日付.getDate()).padStart(2, '0')}`.includes(
                言葉
              );
            if (!(題に有る || 覚え書きに有る || 日付に有る)) return false;
          }
          return true;
        }
        return true;
      });
      if (0 === 対象の記録.length) {
        const 文 = '対象期間のデータがありません';
        return void Alert.alert('通知', 文);
      }
      // 「集計に含めない」にした記録は、本表から外して別のシートに回す。
      // 混ぜると分析画面の数字と食い違う（画面はこれを外して数えている）
      const 集計しない記録 = 対象の記録.filter((記録) => !集.集計に入れるか(記録));
      const 集計する記録 = 対象の記録.filter((記録) => 集.集計に入れるか(記録));
      const 名を整える = (名) => (名 || '').replace(/\s*\(\d+\)$/, '').trim();
      let xlsxHeaders = [];
      let xlsxRows = [];
      if ('matrix' !== 書き出しの形) {
        const mList = 部員たち;
        const aList = alumni;
        xlsxHeaders = [
          '日付',
          'タイトル',
          '射手名',
          '学年',
          '性別',
          '期',
          '的中数',
          '総矢数',
          '的中率',
          'タグ',
          'メモ',
          '集計対象',
        ];
        集計する記録.forEach((記録) => {
          if (!記録 || !記録.archers || !Array.isArray(記録.archers)) return;
          const dateStr = csvDate(記録.date);
          記録.archers.forEach((射手) => {
            if (!射手 || 射手.isSeparator || 射手.isTotalCalculator) return;
            // 途中交代があると1つの列に2人ぶんが入る。区間に分けて人ごとの行にする。
            // 分けないと、交代後の射も交代前の人の行に入ってしまう
            const 区間たち = 集.射手を区間に分ける(射手);
            // ○×が1つも入っていない列も、誰が立っていたかは残す
            const 書く区間 = 区間たち.length
              ? 区間たち
              : [{ 部員id: 射手.memberId, 名前: 射手.name || '', 的中: 0, 射数: 0 }];
            const tagsV = (記録.tags || []).join(' ');
            const noteV = 記録.note || '';
            const // TRUE / FALSE では何の真偽か伝わらない。日本語で書く
              statV = 集.集計に入れるか(記録) ? '対象' : '対象外';
            書く区間.forEach((区間) => {
              // 絞り込みは列ではなく人ごとに見る。列で見ると、交代で入った人が
              // 自分の書き出しから丸ごと落ちる（列の持ち主は別人のため）
              if (自分の部員ID) {
                const 自分か =
                  String(区間.部員id || '') === String(自分の部員ID) ||
                  (myMemberName &&
                    !区間.部員id &&
                    区間.名前 &&
                    区間.名前.replace(/\s*\(\d+\)$/, '').trim() === myMemberName);
                if (!自分か) return;
              } else if ('custom' === 範囲) {
                if (selectedMembers.length > 0) {
                  if (!selectedMembers.includes(名を整える(区間.名前))) return;
                } else if (!(
                  'all' === 部員名の絞り ||
                  (区間.名前 && 区間.名前.toLowerCase().includes(部員名の絞り.toLowerCase()))
                ))
                  return;
              }
              // 分母は実際に引いた数。記録の射数（割り当て）だと、
              // 途中で帰った人の的中率が低く出る（分析画面は実射数で数えている）
              const hits = 区間.的中;
              const shots = 区間.射数;
              const rateNum = shots > 0 ? Number(((hits / shots) * 100).toFixed(1)) : 0;
              const // 交代で入った人の学年や性別は、その人の名簿から引く
                部員の情報 = findMemberInfo(
                  { memberId: 区間.部員id, name: 区間.名前 },
                  mList,
                  aList,
                  名を整える
                );
              const // 名簿に無いときは射手側の値を使うが、それが使えるのは
                // 列の持ち主のときだけ。交代で入った人に列の持ち主の学年を
                // 当てると別人の情報になる
                列の持ち主か = 区間.名前 === (射手.name || '');
              const gradeV =
                部員の情報 && null != 部員の情報.grade
                  ? 部員の情報.grade
                  : 列の持ち主か && null != 射手.grade
                    ? 射手.grade
                    : '';
              const genderV =
                部員の情報 && 部員の情報.gender ? 部員の情報.gender : 列の持ち主か ? 射手.gender || '' : '';
              const termV = 部員の情報 && null != 部員の情報.termKi ? 部員の情報.termKi : '';
              xlsxRows.push([
                dateStr,
                記録.title || '',
                名を整える(区間.名前 || 射手.name),
                gradeV,
                genderV,
                termV,
                hits,
                shots,
                rateNum,
                tagsV,
                noteV,
                statV,
              ]);
            });
          });
        });
      } else {
        const 日付の集まり = new Set();
        対象の記録.forEach((記録) => {
          const 日付 = new Date(記録.date);
          日付の集まり.add(
            `${日付.getFullYear()}/${(日付.getMonth() + 1).toString().padStart(2, '0')}/${日付.getDate().toString().padStart(2, '0')}`
          );
        });
        const 日付たち = Array.from(日付の集まり).sort();
        const 人たち = new Map();
        対象の記録.forEach((記録) => {
          記録.archers.forEach((射手) => {
            if (!射手 || 射手.isSeparator || 射手.isTotalCalculator) return;
            if (自分の部員ID) {
              if (
                射手.memberId !== 自分の部員ID &&
                !(
                  myMemberName &&
                  !射手.memberId &&
                  射手.name &&
                  射手.name.replace(/\s*\(\d+\)$/, '').trim() === myMemberName
                )
              )
                return;
            } else if ('custom' === 範囲) {
              if (selectedMembers.length > 0) {
                if (!selectedMembers.includes(名を整える(射手.name || '不明'))) return;
              } else if (!(
                'all' === 部員名の絞り ||
                (射手.name && 射手.name.toLowerCase().includes(部員名の絞り.toLowerCase()))
              ))
                return;
            }
            const 名 = 名を整える(射手.name || '不明');
            const 鍵 = 射手.memberId || 名 || 'unknown';
            if (!人たち.has(鍵)) 人たち.set(鍵, { id: 射手.memberId || '', name: 名 });
          });
        });
        const 名簿 = [...部員たち, ...alumni];
        人たち.forEach((人, _) => {
          const 部員 = 名簿.find((部員1人) => 部員1人.id === 人.id || 部員1人.name === 人.name);
          部員 && ((人.grade = 部員.grade), (人.name = 部員.name));
        });
        const 並べた人たち = Array.from(人たち.values()).sort((甲, 乙) =>
          甲.grade !== 乙.grade ? (甲.grade || 9) - (乙.grade || 9) : 甲.name.localeCompare(乙.name, 'ja-JP')
        );
        const 日付の見出し = 日付たち.map((日付) => {
          const 片 = 日付.split('/');
          return `${parseInt(片[1])}月${parseInt(片[2])}日`;
        });
        xlsxHeaders = ['氏名', '学年', '的中率', '的中数', '総矢数'].concat(日付の見出し);
        並べた人たち.forEach((人) => {
          let 的中の計 = 0;
          let 射数の計 = 0;
          const 日ごと = [];
          日付たち.forEach((その日) => {
            let 的中 = 0;
            let 射数 = 0;
            let 引いた = false;
            集計する記録.forEach((記録) => {
              const 日付 = new Date(記録.date);
              if (
                `${日付.getFullYear()}/${(日付.getMonth() + 1).toString().padStart(2, '0')}/${日付.getDate().toString().padStart(2, '0')}` ===
                その日
              )
                記録.archers.forEach((射手) => {
                  if (!射手 || 射手.isSeparator || 射手.isTotalCalculator) return;
                  // 分析画面と同じ数え方をする。部員IDだけで判定し、途中交代を
                  // 踏まえ、分母は実際に引いた数にする。以前は氏名でも拾い、
                  // 交代を見ず、割り当ての射数を分母にしていたため画面と食い違っていた
                  集.射手を区間に分ける(射手).forEach((区間) => {
                    if (!人.id || String(区間.部員id) !== String(人.id)) return;
                    引いた = true;
                    的中 += 区間.的中;
                    射数 += 区間.射数;
                  });
                });
            });
            引いた
              ? (日ごと.push(`${的中}/${射数}`), (的中の計 += 的中), (射数の計 += 射数))
              : 日ごと.push('');
          });
          const 率 = 射数の計 > 0 ? Number(((的中の計 / 射数の計) * 100).toFixed(1)) : 0;
          xlsxRows.push([人.name, null != 人.grade ? 人.grade : '', 率, 的中の計, 射数の計].concat(日ごと));
        });
      }
      const stamp = csvDate(Date.now());
      const rangeLabel = 'fiscal' === 範囲 ? `${書き出す年度}nendo` : 'custom' === 範囲 ? 'filtered' : 'all';
      const fname = `kyudo_records_${rangeLabel}_${stamp}.xlsx`;
      if (!IS_WEB) {
        Alert.alert('未対応', '書き出しはWeb版のみ対応しています。');
        return;
      }
      if (0 === xlsxRows.length) {
        const msg = '対象のデータがありません';
        Alert.alert('書き出し', msg);
        return;
      }
      const 幅 =
        'matrix' === 書き出しの形
          ? [16, 7, 9, 9, 9].concat(xlsxHeaders.slice(5).map(() => 9))
          : [12, 22, 14, 6, 8, 6, 9, 9, 10, 18, 26, 10];
      // 的中率の列は「38.9%」と見せる。中身は 38.9 のままなので、
      // 表計算の式や並べ替えはこれまでどおり使える
      const 見た目 = 'matrix' === 書き出しの形 ? ['', '', '率'] : ['', '', '', '', '', '', '', '', '率'];
      const シートたち = [
        {
          name: 'matrix' === 書き出しの形 ? '集計' : '記録',
          headers: xlsxHeaders,
          rows: xlsxRows,
          widths: 幅,
          formats: 見た目,
        },
      ];
      // 「集計に含めない」にした記録は、本表から外したぶんを別のシートに残す。
      // 消してしまうと、何が外れたのかを確かめる手立てが無くなる
      if (集計しない記録.length > 0) {
        const 除外の見出し = ['日付', '題', '氏名', '的中数', '射数', '的中率', 'タグ', 'メモ'];
        const 除外の行 = [];
        集計しない記録.forEach((記録) => {
          if (!記録 || !Array.isArray(記録.archers)) return;
          const dateStr = csvDate(記録.date);
          記録.archers.forEach((射手) => {
            if (!射手 || 射手.isSeparator || 射手.isTotalCalculator) return;
            集.射手を区間に分ける(射手).forEach((区間) => {
              除外の行.push([
                dateStr,
                記録.title || '',
                名を整える(区間.名前 || 射手.name),
                区間.的中,
                区間.射数,
                区間.射数 > 0 ? Number(((区間.的中 / 区間.射数) * 100).toFixed(1)) : 0,
                (記録.tags || []).join(' '),
                記録.note || '',
              ]);
            });
          });
        });
        シートたち.push({
          name: '集計に含めない記録',
          headers: 除外の見出し,
          rows: 除外の行,
          widths: [12, 22, 14, 9, 9, 10, 18, 26],
          formats: ['', '', '', '', '', '率'],
        });
      }
      await _xlsx.exportXlsxSheets(シートたち, fname);
    } catch (誤り) {
      console.error('Export Error:', 誤り);
      const 文 = 'ファイルの生成に失敗しました。';
      Alert.alert('エラー', 文);
    }
  };
  const pickInquiryImage = async () => {
    try {
      if (inquiryImages.length >= 3) {
        const msg = '画像は最大3枚まで添付できます。';
        return void Alert.alert('エラー', msg);
      }
      const perm = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        const msg = '画像ライブラリへのアクセスが許可されていません。';
        return void Alert.alert('エラー', msg);
      }
      const res = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions ? ExpoImagePicker.MediaTypeOptions.Images : ['images'],
        quality: 0.8,
      });
      if (res.canceled || !res.assets || !res.assets.length) return;
      const asset = res.assets[0];
      let quality = 0.5;
      let width = 1000;
      let base64 = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const manipulated = await _IM.manipulateAsync(asset.uri, [{ resize: { width } }], {
          compress: quality,
          format: _IM.SaveFormat.JPEG,
          base64: true,
        });
        base64 = manipulated.base64;
        if (!base64 || base64.length <= 300000) break;
        width = Math.round(width * 0.75);
        quality = Math.max(0.3, quality - 0.1);
      }
      if (!base64) {
        const msg = '画像の読み込みに失敗しました。';
        return void Alert.alert('エラー', msg);
      }
      if (base64.length > 300000) {
        const msg = '画像サイズが大きすぎます。別の画像（より小さいサイズ・低解像度）を選んでください。';
        return void Alert.alert('エラー', msg);
      }
      setInquiryImages((prev) => [...prev, `data:image/jpeg;base64,${base64}`]);
    } catch (誤り) {
      console.error('[Settings] Inquiry image pick error:', 誤り);
    }
  };
  const 節 = (題, 中身) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{題}</Text>
      <View style={styles.sectionContainer}>{中身}</View>
    </View>
  );
  const 行 = (絵, 題, 押したとき, 色 = '#007AFF', 右の中身, 赤字 = false) => (
    <Pressable // 使い方の案内が指す先。行の名前をそのまま目印にする
      ref={(node) => 案内.setTutorialTargetNode(`設定.${題}`, node)}
      style={({ hovered }) => [
        styles.item,
        hovered && styles.hovered,
        IS_WEB && !!押したとき && { cursor: 'pointer' },
      ]}
      onPress={押したとき}
      disabled={!押したとき}
    >
      <View style={styles.itemLeft}>
        <Icons.Ionicons name={絵} size={22} color={色} style={styles.itemIcon} />
        <Text style={[styles.itemText, 赤字 && { color: '#FF3B30' }]}>{題}</Text>
      </View>
      <View style={styles.itemRight}>
        {右の中身 || <Icons.Ionicons name="chevron-forward" size={18} color="#C6C6C8" />}
      </View>
    </Pressable>
  );
  return (
    <ReactNativeSafeAreaContext.SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <CustomCalendarModal
        visible={暦を出す}
        onClose={() => 暦を出すを置く(false)}
        selectedDate={'start' === 暦の対象 ? 期間の始め : 期間の終わり}
        onSelectDate={(日付) => {
          if ('start' === 暦の対象) 期間の始めを置く(日付);
          else 期間の終わりを置く(日付);
          暦を出すを置く(false);
        }}
        title={'start' === 暦の対象 ? '開始日を選択' : '終了日を選択'}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>設定</Text>
        {節(
          'アカウント',
          <>
            <View style={[styles.item, styles.itemStack]}>
              <View style={styles.itemLeft}>
                <Icons.Ionicons name="business-outline" size={22} color="#007AFF" style={styles.itemIcon} />
                <Text style={styles.itemText}>団体ID / 団体名</Text>
              </View>
              <Text style={[styles.timestamp, styles.timestampStack]}>
                {activeGroupId || '---'}
                {' / '}
                {activeGroupName || '未設定'}
              </Text>
            </View>
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Icons.Ionicons name="person-outline" size={22} color="#5856D6" style={styles.itemIcon} />
                <Text style={styles.itemText}>ログイン種別</Text>
              </View>
              <Text style={styles.timestamp}>
                {'group' === activeRole
                  ? '団体アカウント'
                  : `メンバー (${(() => {
                      const 自分 = members.find((部員) => 部員.id === myMemberId);
                      return 自分?.personalId
                        ? `ID: ${自分.personalId} / ${自分.name || myMemberName || ''}`
                        : myMemberName || myMemberId || '---';
                    })()})`}
              </Text>
            </View>
            {/* 初めての人向けの案内。初回は自動で出るが、ここからいつでも見返せる。 */
            /* ライブ中は始めない（案内中の書き換えが全員の画面に流れてしまう） */}
            {行('school-outline', '使い方を見る', () => {
              if ('ライブ中' === 案内.startTutorial()) {
                const 文 = 'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。';
                Alert.alert('使い方を見る', 文);
              }
            })}
            {行('help-circle-outline', '運用ガイド・ヘルプ', () => ガイドの窓を出す(true))}
            {行(
              'log-out-outline',
              'ログアウト',
              () => {
                // ログアウトは手元の記録を全部捨てるので、送れていないものが
                // 何件あるかを先に数えて確認に出す。送信するかどうかは
                // 利用者が押してから
                残った未送信を設定(useScoreStore.getState().countUnsynced());
                ログアウトの段階を設定('確認');
                ログアウトの窓を出す(true);
              },
              '#FF3B30',
              null,
              true
            )}
            {/* 団体アカウントで、管理者モードのときだけ出す。押すと警告の窓へ */}
            {'group' === activeRole &&
              isAdminMode &&
              行(
                'trash-outline',
                'アカウントを削除する',
                () => {
                  削除の合言葉を設定('');
                  削除の失敗を設定('');
                  削除の段階を設定('');
                  削除の窓を開く(true);
                },
                '#FF3B30',
                null,
                true
              )}
          </>
        )}
        {節(
          '表示',
          <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={[styles.itemLeft, { marginBottom: 10 }]}>
              <Icons.Ionicons name="contrast-outline" size={22} color="#5856D6" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.itemText}>外観</Text>
                <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                  画面全体の配色を切り替えます
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
              <TouchableOpacity
                style={[styles.radioBtn, themeMode === 'light' && styles.radioBtnActive]}
                onPress={() => setThemeModeFn('light')}
              >
                <Text style={[styles.radioBtnText, themeMode === 'light' && styles.radioBtnTextActive]}>
                  ライト
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioBtn, themeMode === 'dark' && styles.radioBtnActive]}
                onPress={() => setThemeModeFn('dark')}
              >
                <Text style={[styles.radioBtnText, themeMode === 'dark' && styles.radioBtnTextActive]}>
                  ダーク
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioBtn, themeMode === 'system' && styles.radioBtnActive]}
                onPress={() => setThemeModeFn('system')}
              >
                <Text style={[styles.radioBtnText, themeMode === 'system' && styles.radioBtnTextActive]}>
                  端末に合わせる
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {'member' !== activeRole &&
          節(
            '基本設定',
            <>
              {'group' === activeRole && (
                <View style={styles.item}>
                  <View style={[styles.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons
                      name="business-outline"
                      size={22}
                      color="#007AFF"
                      style={styles.itemIcon}
                    />
                    <Text style={styles.itemText}>
                      {'団体ID: '}
                      {activeGroupId}
                    </Text>
                  </View>
                </View>
              )}
              {'group' === activeRole && (
                <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={[styles.itemLeft, { marginBottom: 8 }]}>
                    <Icons.Ionicons name="pencil-outline" size={22} color="#007AFF" style={styles.itemIcon} />
                    <Text style={styles.itemText}>団体名</Text>
                  </View>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="団体名を入力"
                    value={activeGroupName || ''}
                    onChangeText={updateGroupName}
                  />
                </View>
              )}
              {'group' === activeRole && (
                <View style={styles.item}>
                  <View style={[styles.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons
                      name="sparkles-outline"
                      size={22}
                      color="#5856D6"
                      style={styles.itemIcon}
                    />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.itemText}>4月1日の自動進級</Text>
                      <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                        毎年4月1日に自動で学年を更新し、4年生を卒業生へ移動します
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={autoPromotionEnabled}
                    onValueChange={setAutoPromotionEnabled}
                    trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  />
                </View>
              )}
              {'group' === activeRole && (
                <View style={styles.item}>
                  <View style={[styles.itemLeft, { flex: 1 }]}>
                    <Icons.Ionicons name="school-outline" size={22} color="#AF52DE" style={styles.itemIcon} />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.itemText}>現在の期 (新入生)</Text>
                      <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                        新入生（1年生）が何期生にあたるかを設定します
                      </Text>
                    </View>
                  </View>
                  <View style={styles.stepperContainer}>
                    <TextInput
                      style={[styles.stepperValue, { width: 40, textAlign: 'center', padding: 0 }]}
                      value={String(currentFreshmanTerm)}
                      onChangeText={(文) => {
                        const 数 = parseInt(文.replace(/[^0-9]/g, ''));
                        isNaN(数) ? '' === 文 && updateCurrentFreshmanTerm(0) : updateCurrentFreshmanTerm(数);
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={{ fontSize: 14, color: '#8E8E93', marginRight: 8 }}>期</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        style={({ hovered }) => [
                          styles.stepperBtn,
                          hovered && { backgroundColor: '#D1D1D6' },
                        ]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="減らす"
                        aria-label="減らす"
                        onPress={() => updateCurrentFreshmanTerm(Math.max(1, currentFreshmanTerm - 1))}
                      >
                        <Icons.Ionicons name="remove" size={20} color="#007AFF" />
                      </Pressable>
                      <View style={styles.stepperDivider} />
                      <Pressable
                        style={({ hovered }) => [
                          styles.stepperBtn,
                          hovered && { backgroundColor: '#D1D1D6' },
                        ]} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="増やす"
                        aria-label="増やす"
                        onPress={() => updateCurrentFreshmanTerm(currentFreshmanTerm + 1)}
                      >
                        <Icons.Ionicons name="add" size={20} color="#007AFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
              {'group' === activeRole && (
                <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View style={styles.itemLeft}>
                      <Icons.Ionicons
                        name="pricetags-outline"
                        size={22}
                        color="#FF9500"
                        style={styles.itemIcon}
                      />
                      <Text style={styles.itemText}>タグの定型文</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {tagTemplates.map((タグ) => (
                      <View
                        key={`template-${タグ}`}
                        style={{
                          backgroundColor: '#E5E5EA',
                          borderRadius: 16,
                          paddingLeft: 12,
                          paddingRight: 6,
                          paddingVertical: 4,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: '#000' }}>
                          {/* しまう形は「#合宿」だが、画面では # を付けない */}
                          {規則.タグの見た目(タグ)}
                        </Text>
                        <Pressable // 絵だけのボタン。どのタグを消すのかまで読ませる
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel={規則.タグの見た目(タグ) + ' を消す'}
                          aria-label={タグ + ' を消す'}
                          onPress={() => removeTagTemplate(タグ)}
                          style={({ hovered }) => [
                            hovered && { opacity: 0.7 },
                            IS_WEB && { cursor: 'pointer' },
                          ]}
                        >
                          <Icons.Ionicons name="close-circle" size={18} color="#8E8E93" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.filterInput, { flex: 1, paddingVertical: 8 }]}
                      placeholder="新しいタグを追加"
                      value={タグの下書き}
                      onChangeText={タグの下書きを置く}
                      onSubmitEditing={() => {
                        タグの下書き.trim() &&
                          (addTagTemplate(
                            タグの下書き.trim().startsWith('#')
                              ? タグの下書き.trim()
                              : `#${タグの下書き.trim()}`
                          ),
                          タグの下書きを置く(''));
                      }}
                    />
                    <Pressable
                      style={({ hovered }) => [
                        {
                          backgroundColor: '#007AFF',
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          justifyContent: 'center',
                        },
                        hovered && { backgroundColor: '#0062CC' },
                        IS_WEB && { cursor: 'pointer' },
                      ]}
                      onPress={() => {
                        タグの下書き.trim() &&
                          (addTagTemplate(
                            タグの下書き.trim().startsWith('#')
                              ? タグの下書き.trim()
                              : `#${タグの下書き.trim()}`
                          ),
                          タグの下書きを置く(''));
                      }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>追加</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        {節(
          '入力の保護',
          <View ref={(node) => 案内.setTutorialTargetNode('設定.自動ロック', node)} style={styles.item}>
            <View style={[styles.itemLeft, { flex: 1 }]}>
              <Icons.Ionicons name="lock-closed-outline" size={22} color="#34C759" style={styles.itemIcon} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.itemText}>入れたマスを自動でロック</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                  入れて3秒たつと押しても変わらなくなります。直すときは長押しで、そのマスだけ開きます。1立が全部埋まったときは、間隔・計の鍵も自動でかかります
                </Text>
              </View>
            </View>
            <Switch
              value={自動ロックする}
              onValueChange={set自動ロックする}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        )}
        {節(
          '保存のしかた',
          <View style={styles.item}>
            <View style={[styles.itemLeft, { flex: 1 }]}>
              <Icons.Ionicons name="checkbox-outline" size={22} color="#34C759" style={styles.itemIcon} />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.itemText}>保存のときに出欠を確認する</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                  「終了・保存」を押したときに出欠の確認を出します。切ると、そのまま保存の画面へ進みます。記録に出ている人は出欠画面で出席として数えられますが、遅刻・早退の区別は付かなくなります
                </Text>
              </View>
            </View>
            <Switch
              value={保存時に出欠を確認する}
              onValueChange={set保存時に出欠を確認する}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        )}
        {節(
          '矢所の記録',
          <>
            <View // 使い方の案内が指す先。この行は Je() を通らない作りなので、
              // ここで直接登録する
              ref={(node) => 案内.setTutorialTargetNode('設定.矢所の記録機能を有効化', node)}
              style={styles.item}
            >
              <View style={[styles.itemLeft, { flex: 1 }]}>
                <Icons.Ionicons name="location-outline" size={22} color="#34C759" style={styles.itemIcon} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemText}>矢所の記録機能を有効化</Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
                    記録時に矢所も記録できるようにします
                  </Text>
                </View>
              </View>
              <Switch
                value={enableArrowLocation}
                onValueChange={setEnableArrowLocation}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            {enableArrowLocation && (
              <View style={[styles.item, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={[styles.itemLeft, { marginBottom: 8 }]}>
                  <Icons.Ionicons name="disc-outline" size={22} color="#34C759" style={styles.itemIcon} />
                  <Text style={styles.itemText}>使用する的の種類</Text>
                </View>
                <View style={styles.flexRow}>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('kasumi36')}
                    style={[styles.radioBtn, 'kasumi36' === arrowTargetType && styles.radioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.radioBtnText,
                        'kasumi36' === arrowTargetType && styles.radioBtnTextActive,
                      ]}
                    >
                      霞的
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('hoshi36')}
                    style={[styles.radioBtn, 'hoshi36' === arrowTargetType && styles.radioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.radioBtnText,
                        'hoshi36' === arrowTargetType && styles.radioBtnTextActive,
                      ]}
                    >
                      星的
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setArrowTargetType('hoshi24')}
                    style={[styles.radioBtn, 'hoshi24' === arrowTargetType && styles.radioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.radioBtnText,
                        'hoshi24' === arrowTargetType && styles.radioBtnTextActive,
                      ]}
                    >
                      星的(八寸)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
        {'member' !== activeRole &&
          節(
            '管理者設定',
            <View
              style={styles.item} // 使い方の案内から指せるように登録する
              ref={(node) => 案内.setTutorialTargetNode('設定.管理者モード', node)}
            >
              <View style={[styles.itemLeft, { flex: 1 }]}>
                <Icons.Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#FF3B30"
                  style={styles.itemIcon}
                />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemText}>管理者モード</Text>
                  <Text
                    style={{ fontSize: 11, color: '#8E8E93', marginTop: 2, flexShrink: 1 }}
                    numberOfLines={0}
                  >
                    オンにすると、保存済みの記録をあとから直せます。各メンバーの個人ID（数字）も表示されます
                  </Text>
                </View>
              </View>
              <Switch
                value={isAdminMode}
                onValueChange={async (入れる) => {
                  入れる ? (管理者の合言葉を置く(''), 管理者の合言葉の窓を出す(true)) : setAdminMode(false);
                }}
                trackColor={{ false: '#D1D1D6', true: '#FF3B30' }}
              />
            </View>
          )}
        {節(
          'データ管理',
          <>
            {'member' === activeRole && (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#FFF9E6',
                  marginBottom: 8,
                  borderRadius: 8,
                  marginHorizontal: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icons.Ionicons name="information-circle-outline" size={18} color="#FF9500" />
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FF9500', marginLeft: 4 }}>
                    個人用モードの同期について
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#666', lineHeight: 18 }}>
                  同期時、クラウドには自分を含む全員の記録が送信されますが、完了後にこの端末からは自分以外の氏名や的中データが自動的に削除されます。これにより、履歴や分析には自分のデータのみが表示されるようになります。
                </Text>
              </View>
            )}
            {行(
              'share-outline',
              'データをExcel形式で書き出し',
              async () => {
                書き出しの窓を出す(true);
              },
              '#34C759'
            )}
            {行('mail-outline', 'お問い合わせ', () => setInquiryVisible(true), '#FF9500')}
            <Pressable
              style={({ hovered }) => [
                styles.item,
                hovered && styles.hovered,
                IS_WEB && { cursor: 'pointer' },
              ]}
              onPress={syncAllToCloud}
            >
              <View style={styles.itemLeft}>
                <Icons.Ionicons
                  name="cloud-upload-outline"
                  size={22}
                  color="#5856D6"
                  style={styles.itemIcon}
                />
                <Text style={styles.itemText}>クラウドへ同期</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.timestamp}>
                  {lastSyncTime
                    ? new Date(lastSyncTime).toLocaleTimeString('ja-JP')
                    : '同期済み' === syncStatus
                      ? ''
                      : syncStatus}
                </Text>
                <Icons.Ionicons name="chevron-forward" size={18} color="#C6C6C8" />
              </View>
            </Pressable>
          </>
        )}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 2.0.0 (Expo SQLite/Firebase)</Text>
          <Text style={styles.statusText}>
            {'● '}
            {isNetworkOnline ? 'Firebase 接続済み' : '未接続'}
            {' | '}
            {lastSyncTime ? `最終同期: ${new Date(lastSyncTime).toLocaleString('ja-JP')}` : syncStatus}
          </Text>
          {/* 多くのアプリと同じく、バージョン表記の足元に小さく置く。 */
          /* 一覧の行にすると設定画面が煩雑になるが、無くすと */
          /* 「読める場所」が登録画面の一度きりになってしまう */}
          <Pressable
            onPress={() => {
              const 法 = require('./legalDocs');
              require('./AppDialog').出す('法的情報', '', [
                { text: '利用規約', onPress: () => 法.開く(法.規約のURL) },
                { text: 'プライバシーポリシー', onPress: () => 法.開く(法.プライバシーのURL) },
                { text: '閉じる', style: 'cancel' },
              ]);
            }}
          >
            <Text style={styles.legalText}>利用規約・プライバシーポリシー</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        visible={書き出しの窓}
        transparent
        animationType="fade"
        onRequestClose={() => 書き出しの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => 書き出しの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Excel形式で書き出し</Text>
            {絞り込みを開く ? (
              <ScrollView style={{ width: '100%', maxHeight: 450 }}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>出力形式</Text>
                  <View style={styles.flexRow}>
                    <TouchableOpacity
                      onPress={() => 書き出しの形を置く('standard')}
                      style={[styles.radioBtn, 'standard' === 書き出しの形 && styles.radioBtnActive]}
                    >
                      <Text
                        style={[
                          styles.radioBtnText,
                          'standard' === 書き出しの形 && styles.radioBtnTextActive,
                        ]}
                      >
                        標準形式
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => 書き出しの形を置く('matrix')}
                      style={[styles.radioBtn, 'matrix' === 書き出しの形 && styles.radioBtnActive]}
                    >
                      <Text
                        style={[styles.radioBtnText, 'matrix' === 書き出しの形 && styles.radioBtnTextActive]}
                      >
                        印刷向け形式
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.ratioHintText}>
                    {'standard' === 書き出しの形
                      ? '1行に1記録を出力します。データ加工に適しています。'
                      : 'メンバーを各行、日付を各列に配置します。掲示や閲覧に適しています。'}
                  </Text>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>日付範囲</Text>
                  <View style={styles.flexRow}>
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => {
                        暦の対象を置く('start');
                        暦を出すを置く(true);
                      }}
                    >
                      <Text style={styles.dateSelectorText}>{期間の始め.toLocaleDateString('ja-JP')}</Text>
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 8 }}>〜</Text>
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => {
                        暦の対象を置く('end');
                        暦を出すを置く(true);
                      }}
                    >
                      <Text style={styles.dateSelectorText}>{期間の終わり.toLocaleDateString('ja-JP')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>キーワード (タイトル・メモ)</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="キーワードで絞り込み"
                    value={言葉の絞り}
                    onChangeText={言葉の絞りを置く}
                    placeholderTextColor="#C6C6C8"
                  />
                  {titleSuggestions.length > 0 && (
                    <ScrollView
                      ref={titleRefCallback}
                      horizontal
                      keyboardShouldPersistTaps="always"
                      showsHorizontalScrollIndicator={false}
                      style={[styles.suggestionsContainer, IS_WEB && { overflowX: 'auto' }]}
                    >
                      {titleSuggestions.map((題) => {
                        const 選択中 = selectedKeywords.includes(題);
                        return (
                          <TouchableOpacity
                            key={`suggest-title-${題}`}
                            onPress={() =>
                              setSelectedKeywords((今の) =>
                                今の.includes(題) ? 今の.filter((題1つ) => 題1つ !== 題) : [...今の, 題]
                              )
                            }
                            style={[styles.suggestionChip, 選択中 && { backgroundColor: '#007AFF' }]}
                          >
                            <Text style={[styles.suggestionText, 選択中 && { color: '#FFF' }]}>{題}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  {selectedKeywords.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSelectedKeywords([])}
                      style={{ marginTop: 4, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 12, color: '#007AFF' }}>選択をクリア</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {'member' !== activeRole && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>メンバー名</Text>
                    <TextInput
                      style={styles.filterInput}
                      placeholder="未入力ですべて対象"
                      value={'all' === 部員名の絞り ? '' : 部員名の絞り}
                      onChangeText={(文) => 部員名の絞りを置く(文 || 'all')}
                      placeholderTextColor="#C6C6C8"
                    />
                    {memberSuggestions.length > 0 && (
                      <ScrollView
                        ref={memberRefCallback}
                        horizontal
                        keyboardShouldPersistTaps="always"
                        showsHorizontalScrollIndicator={false}
                        style={[styles.suggestionsContainer, IS_WEB && { overflowX: 'auto' }]}
                      >
                        {memberSuggestions.map((名前) => {
                          const 選択中 = selectedMembers.includes(名前);
                          return (
                            <TouchableOpacity
                              key={`suggest-member-${名前}`}
                              onPress={() =>
                                setSelectedMembers((今の) =>
                                  今の.includes(名前)
                                    ? 今の.filter((名前1つ) => 名前1つ !== 名前)
                                    : [...今の, 名前]
                                )
                              }
                              style={[styles.suggestionChip, 選択中 && { backgroundColor: '#007AFF' }]}
                            >
                              <Text style={[styles.suggestionText, 選択中 && { color: '#FFF' }]}>{名前}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                    {selectedMembers.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSelectedMembers([])}
                        style={{ marginTop: 4, alignSelf: 'flex-start' }}
                      >
                        <Text style={{ fontSize: 12, color: '#007AFF' }}>選択をクリア</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={styles.filterGroup}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={styles.filterLabel}>タグ絞り込み</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: '#E5E5EA',
                        borderRadius: 8,
                        padding: 2,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => タグの論理を置く('AND')}
                        style={[
                          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                          'AND' === タグの論理 && { backgroundColor: '#FFF' },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: 'AND' === タグの論理 ? '#007AFF' : '#8E8E93',
                          }}
                        >
                          すべて含む
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => タグの論理を置く('OR')}
                        style={[
                          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                          'OR' === タグの論理 && { backgroundColor: '#FFF' },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: 'OR' === タグの論理 ? '#007AFF' : '#8E8E93',
                          }}
                        >
                          いずれか含む
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {タグの一覧.length > 0 ? (
                      タグの一覧.map((タグ) => {
                        const 選択中 = 選んだタグ.includes(タグ);
                        return (
                          <TouchableOpacity
                            key={`export-tag-${タグ}`}
                            onPress={() => タグを切り替える(タグ)}
                            style={[
                              styles.tagChip,
                              選択中 && styles.tagChipActive,
                              {
                                backgroundColor: 選択中 ? '#007AFF' : '#F2F2F7',
                                paddingVertical: 6,
                                marginVertical: 2,
                              },
                            ]}
                          >
                            <Text style={[styles.tagChipText, 選択中 && { color: '#FFF' }]}>
                              {タグ.replace(/^#/, '')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={{ fontSize: 12, color: '#8E8E93' }}>使用されているタグがありません</Text>
                    )}
                  </View>
                  {選んだタグ.length > 0 && (
                    <TouchableOpacity onPress={() => 選んだタグを置く([])} style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 12, color: '#007AFF' }}>選択をクリア</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.modalButtons, { marginTop: 20 }]}>
                  <Pressable
                    style={({ hovered }) => [
                      styles.modalBtn,
                      { backgroundColor: '#007AFF' },
                      hovered && { backgroundColor: '#0062CC' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => {
                      書き出しの窓を出す(false);
                      絞り込みを開くを置く(false);
                      書き出す('custom');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>この条件で書き出す</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered }) => [
                      styles.modalBtn,
                      { backgroundColor: '#F2F2F7' },
                      hovered && { backgroundColor: '#E5E5EA' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => 絞り込みを開くを置く(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>戻る</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <>
                <Text style={styles.modalMessage}>書き出すデータの範囲を選択してください。</Text>
                <View style={styles.modalButtons}>
                  <Pressable
                    style={({ hovered }) => [
                      styles.modalBtn,
                      { backgroundColor: '#F2F2F7' },
                      hovered && { backgroundColor: '#E5E5EA' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => 書き出しの窓を出す(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
                  </Pressable>
                  <View style={styles.monthNav}>
                    <TouchableOpacity
                      style={styles.monthNavBtn} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="前へ"
                      aria-label="前へ"
                      onPress={() => 年度を動かす(-1)}
                    >
                      <Icons.Ionicons name="chevron-back" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.monthNavText}>{書き出す年度}年度のデータ</Text>
                    <TouchableOpacity
                      style={styles.monthNavBtn} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="次へ"
                      aria-label="次へ"
                      onPress={() => 年度を動かす(1)}
                    >
                      <Icons.Ionicons name="chevron-forward" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                  <Pressable
                    style={({ hovered }) => [
                      styles.modalBtn,
                      { backgroundColor: '#007AFF', marginTop: 8 },
                      hovered && { backgroundColor: '#0062CC' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => {
                      書き出しの窓を出す(false);
                      書き出す('fiscal');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{書き出す年度}年度を書き出す</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered }) => [
                      styles.modalBtn,
                      { backgroundColor: '#34C759' },
                      hovered && { backgroundColor: '#28A745' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => {
                      書き出しの窓を出す(false);
                      書き出す('all');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>すべてのデータ</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered }) => [
                      styles.modalBtn,
                      { backgroundColor: '#5856D6' },
                      hovered && { backgroundColor: '#4845C6' },
                      IS_WEB && { cursor: 'pointer' },
                    ]}
                    onPress={() => 絞り込みを開くを置く(true)}
                  >
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>詳細な条件で絞り込む...</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={削除の窓}
        transparent
        animationType="fade"
        onRequestClose={() => !削除の段階 && 削除の窓を開く(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !削除の段階 && 削除の窓を開く(false)}
          />
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#FF3B30' }]}>アカウントを削除する</Text>
            <Text style={[styles.modalMessage, { textAlign: 'left' }]}>
              {`団体「${activeGroupName || activeGroupId || ''}」のアカウントを削除します。\n\n` +
                '・記録・部員・卒業生・ゴミ箱・設定がすべて消え、団体IDでログインできなくなります。\n' +
                '・部員も、この団体には入れなくなります。\n' +
                '・削除後30日間は復旧のために運営者が保管し、その後に消去します。この画面から戻すことはできません。\n' +
                '・必要な記録は、先に「データ管理」から書き出してください。\n\n' +
                '続けるには団体パスワードを入力してください。'}
            </Text>
            <View
              style={[
                styles.filterInput,
                {
                  width: '100%',
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                },
              ]}
            >
              <TextInput
                style={{ flex: 1, height: 48, fontSize: 16 }}
                placeholder="団体パスワード"
                secureTextEntry={!showPw}
                value={削除の合言葉}
                onChangeText={削除の合言葉を設定}
                editable={!削除の段階}
              />
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel="パスワードの表示を切り替える"
                aria-label="パスワードの表示を切り替える"
                onPress={() => setShowPw(!showPw)}
                style={{ padding: 4 }}
              >
                <Icons.Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#8E8E93" />
              </Pressable>
            </View>
            {!!削除の失敗 && (
              <Text style={{ color: '#FF3B30', fontSize: 13, marginBottom: 10 }}>{削除の失敗}</Text>
            )}
            {!!削除の段階 && (
              <Text style={{ color: '#8E8E93', fontSize: 13, marginBottom: 10 }}>{`${削除の段階}…`}</Text>
            )}
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={() => 削除の窓を開く(false)}
                disabled={!!削除の段階}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  hovered && { backgroundColor: '#D70015' },
                  (!!削除の段階 || !削除の合言葉) && { opacity: 0.5 },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={async () => {
                  if (!削除の合言葉 || 削除の段階) return;
                  削除の失敗を設定('');
                  削除の段階を設定('本人確認');
                  const 結果 = await 団体を消す(削除の合言葉, (文) => 削除の段階を設定(文));
                  if (!結果.ok) {
                    削除の段階を設定('');
                    削除の失敗を設定(結果.訳 || '削除に失敗しました');
                    return;
                  }
                  削除の窓を開く(false);
                  削除の段階を設定('');
                  try {
                    await FirebaseAuth.signOut(auth);
                  } catch (誤り) {
                    // 口座はもう無いので、ここで失敗しても構わない
                  }
                  setAuth(null, null, null, null);
                  Alert.alert('削除しました', '団体アカウントを削除しました。ご利用ありがとうございました。');
                }}
                disabled={!!削除の段階 || !削除の合言葉}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                  {削除の段階 ? '削除中…' : '削除する'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={管理者の合言葉の窓}
        transparent
        animationType="fade"
        onRequestClose={() => 管理者の合言葉の窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !合言葉を確かめ中 && 管理者の合言葉の窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>管理者認証</Text>
            <Text style={styles.modalMessage}>団体パスワードを入力してください</Text>
            <View
              style={[
                styles.filterInput,
                {
                  width: '100%',
                  marginBottom: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                },
              ]}
            >
              <TextInput
                style={{ flex: 1, height: 48, fontSize: 16 }}
                placeholder="パスワード"
                secureTextEntry={!showPw}
                value={管理者の合言葉}
                onChangeText={管理者の合言葉を置く}
                autoFocus
              />
              <Pressable // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                accessible
                accessibilityRole="button"
                accessibilityLabel="パスワードの表示を切り替える"
                aria-label="パスワードの表示を切り替える"
                onPress={() => setShowPw(!showPw)}
                style={{ padding: 4 }}
              >
                <Icons.Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#8E8E93" />
              </Pressable>
            </View>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={() => 管理者の合言葉の窓を出す(false)}
                disabled={合言葉を確かめ中}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                  hovered && { backgroundColor: '#0062CC' },
                  IS_WEB && { cursor: 'pointer' },
                ]}
                onPress={async () => {
                  if (管理者の合言葉) {
                    合言葉を確かめ中を置く(true);
                    try {
                      (await verifyGroupPassword(管理者の合言葉))
                        ? (setAdminMode(true), 管理者の合言葉の窓を出す(false), 管理者の合言葉を置く(''))
                        : Alert.alert('エラー', 'パスワードが正しくありません。');
                    } catch (誤り) {
                      Alert.alert('エラー', '認証に失敗しました。');
                    } finally {
                      合言葉を確かめ中を置く(false);
                    }
                  }
                }}
                disabled={合言葉を確かめ中 || !管理者の合言葉}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                  {合言葉を確かめ中 ? '認証中...' : '認証'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={ログアウトの窓}
        transparent
        animationType="fade"
        onRequestClose={() => ログアウトの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => ログアウトの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ログアウト</Text>
            <Text style={styles.modalMessage}>{ログアウトの文言(ログアウトの段階, 残った未送信)}</Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && { backgroundColor: '#E5E5EA' },
                  IS_WEB && { cursor: 'pointer' },
                  ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                ]}
                disabled={ログアウトのボタンを止める(ログアウトの段階)}
                onPress={() => ログアウトの窓を出す(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  hovered && { backgroundColor: '#D63027' },
                  IS_WEB && { cursor: 'pointer' },
                  ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                ]}
                disabled={ログアウトのボタンを止める(ログアウトの段階)}
                onPress={async () => {
                  // 未送信があるうちは、まず送信を試す。送れなかったときだけ
                  // 「捨てて抜ける」を選べるようにする
                  if (先に送信すべきか(ログアウトの段階, 残った未送信)) {
                    ログアウトの段階を設定('送信中');
                    let 残り = 残った未送信;
                    try {
                      残り = await useScoreStore.getState().flushUnsyncedForLogout();
                    } catch (誤り) {
                      残り = useScoreStore.getState().countUnsynced();
                    }
                    残った未送信を設定(残り);
                    if (残り > 0) return void ログアウトの段階を設定('失敗');
                    ログアウトの段階を設定('送信済み');
                    await new Promise((解く) => setTimeout(解く, 900));
                  }
                  ログアウトの窓を出す(false);
                  try {
                    if ('member' === activeRole && auth.currentUser) {
                      await Firestore.deleteDoc(
                        Firestore.doc(db, 'member_claims', auth.currentUser.uid)
                      ).catch(() => {});
                    }
                    await FirebaseAuth.signOut(auth);
                    setAuth(null, null, null, null);
                  } catch (誤り) {
                    console.error('Logout error:', 誤り);
                  }
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                  {ログアウトのボタン名(ログアウトの段階, 残った未送信)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={ガイドの窓}
        transparent
        animationType="fade"
        onRequestClose={() => ガイドの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => ガイドの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>運用ガイド</Text>
            <View
              style={{
                width: '100%',
                marginBottom: 20,
                backgroundColor: '#FFF9E6',
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#FFE066',
                marginTop: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icons.Ionicons name="alert-circle" size={18} color="#FF9500" />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FF9500', marginLeft: 6 }}>
                  セキュリティとログイン
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: 20 }}>
                ・「団体ID」はメンバーログインに必要です。メンバー全員に共有してください。{'\n'}
                ・「パスワード」は管理者のみが知るものとして厳重に保管してください。{'\n'}
                ・メールアドレス変更の際は、セキュリティ保護のため旧アドレス宛に確認メールが自動送信されます。
              </Text>
            </View>
            <Pressable
              style={({ hovered }) => [
                styles.modalBtn,
                { backgroundColor: '#F2F2F7', width: '100%' },
                hovered && { backgroundColor: '#E5E5EA' },
                IS_WEB && { cursor: 'pointer' },
              ]}
              onPress={() => ガイドの窓を出す(false)}
            >
              <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <CustomCalendarModal
        visible={暦を出す}
        onClose={() => 暦を出すを置く(false)}
        selectedDate={'start' === 暦の対象 ? 期間の始め : 期間の終わり}
        onSelectDate={(日付) => {
          if ('start' === 暦の対象) 期間の始めを置く(日付);
          else 期間の終わりを置く(日付);
        }}
        title={'start' === 暦の対象 ? '開始日を選択' : '終了日を選択'}
      />
      <Modal
        visible={inquiryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !inquirySending && setInquiryVisible(false)}
      >
        {/* スマホで本文の欄を押すとキーボードが出て、下の「送信」 */
        /* 「キャンセル」が隠れる。窓ごと持ち上げ、中身は流せるようにする。 */
        /* keyboardShouldPersistTaps を handled にしないと、キーボードが */
        /* 出ているあいだ、釦を押しても1回目は閉じるだけで終わる */}
        <_RN.KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => !inquirySending && setInquiryVisible(false)}
            />
            <_RN.ScrollView // 巻物にするので高さの上限が要る。無いと中身のぶんだけ
              // 伸びて、キーボードに押し上げても釦が画面の外へ出る
              style={[styles.modalContent, { maxHeight: '80%', flexGrow: 0 }]}
              contentContainerStyle={{ alignItems: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>お問い合わせ</Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 12, textAlign: 'center' }}>
                開発者へお問い合わせを送信します
              </Text>
              <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 10, lineHeight: 17 }}>
                メールアドレスは書かなくても送れます。書いていただくと、こちらから返事ができます。
              </Text>
              <TextInput
                style={[styles.filterInput, { width: '100%', marginBottom: 10 }]}
                placeholder="メールアドレス（任意）"
                value={inquiryEmail}
                onChangeText={(文) => setInquiryEmail(文)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!inquirySending}
              />
              <TextInput
                style={[
                  styles.filterInput,
                  { width: '100%', marginBottom: 15, height: 120, textAlignVertical: 'top' },
                ]}
                placeholder="お問い合わせ内容"
                value={inquiryContent}
                onChangeText={(文) => setInquiryContent(文)}
                multiline
                editable={!inquirySending}
              />
              {inquiryImages.length > 0 ? (
                <_RN.ScrollView
                  ref={写真の横流し}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ width: '100%', marginBottom: 10 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {inquiryImages.map((uri, idx) => (
                    <_RN.View
                      key={`inquiry-img-${idx}`}
                      style={{ width: 100, height: 100, position: 'relative' }}
                    >
                      <_RN.Image
                        source={{ uri }}
                        style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: '#F2F2F7' }}
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => setInquiryImages((prev) => prev.filter((_, 番) => 番 !== idx))}
                        disabled={inquirySending}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderRadius: 10,
                          padding: 3,
                        }}
                      >
                        <Icons.Ionicons name="close" size={14} color="#FFF" />
                      </Pressable>
                    </_RN.View>
                  ))}
                </_RN.ScrollView>
              ) : null}
              {inquiryImages.length < 3 ? (
                <Pressable
                  onPress={pickInquiryImage}
                  disabled={inquirySending}
                  style={({ hovered }) => [
                    {
                      width: '100%',
                      marginBottom: 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderWidth: 1,
                      borderColor: '#C6C6C8',
                      borderStyle: 'dashed',
                      borderRadius: 8,
                      paddingVertical: 12,
                    },
                    hovered && { backgroundColor: '#F2F2F7' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                >
                  <Icons.Ionicons name="image-outline" size={18} color="#8E8E93" />
                  <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                    {inquiryImages.length > 0 ? '画像を追加（任意・最大3枚）' : '画像を添付（任意・最大3枚）'}
                  </Text>
                </Pressable>
              ) : null}
              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={({ hovered }) => [
                    styles.modalBtn,
                    { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                    hovered && { backgroundColor: '#E5E5EA' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                  onPress={() => {
                    setInquiryVisible(false);
                    setInquiryEmail('');
                    setInquiryContent('');
                    setInquiryImages([]);
                  }}
                  disabled={inquirySending}
                >
                  <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
                </Pressable>
                <Pressable
                  style={({ hovered }) => [
                    styles.modalBtn,
                    { backgroundColor: '#FF9500', flex: 1, marginLeft: 5 },
                    hovered && { backgroundColor: '#E68A00' },
                    IS_WEB && { cursor: 'pointer' },
                  ]}
                  onPress={async () => {
                    const emailVal = inquiryEmail;
                    const contentVal = inquiryContent;
                    // メールアドレスは任意。書いていないことより、
                    // 困っていることが伝わらないままになるほうが困る
                    if (emailVal.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim())) {
                      const msg = 'メールアドレスの形が正しくありません。空のままでも送れます';
                      Alert.alert('エラー', msg);
                      return;
                    }
                    if (!contentVal.trim()) {
                      const msg = 'お問い合わせ内容を入力してください';
                      Alert.alert('エラー', msg);
                      return;
                    }
                    setInquirySending(true);
                    try {
                      await Firestore.addDoc(Firestore.collection(db, 'inquiries'), {
                        email: emailVal.trim(),
                        content: contentVal,
                        imagesBase64: inquiryImages || [],
                        createdAt: new Date(),
                        groupId: activeGroupId || '',
                        groupName: activeGroupName || '',
                        role: activeRole || '',
                        memberId: activeRole === 'member' ? myMemberId || '' : '',
                        memberName: activeRole === 'member' ? myMemberName || '' : '',
                      });
                      const msg = 'お問い合わせを送信しました';
                      Alert.alert('完了', msg);
                      setInquiryVisible(false);
                      setInquiryEmail('');
                      setInquiryContent('');
                      setInquiryImages([]);
                    } catch (err) {
                      console.error('Inquiry send error:', err);
                      const msg = '送信に失敗しました。再度お試しください。';
                      Alert.alert('エラー', msg);
                    } finally {
                      setInquirySending(false);
                    }
                  }}
                  disabled={inquirySending}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                    {inquirySending ? '送信中...' : '送信'}
                  </Text>
                </Pressable>
              </View>
            </_RN.ScrollView>
          </View>
        </_RN.KeyboardAvoidingView>
      </Modal>
    </ReactNativeSafeAreaContext.SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: IS_WEB ? WEB_TOP_PADDING : SAFE_TOP_PADDING },
  container: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  section: { marginTop: 20, marginBottom: 10 },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginLeft: 32,
    marginBottom: 6,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#FFF',
  },
  hovered: { backgroundColor: '#F2F2F7' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 24, marginRight: 12 },
  itemText: { fontSize: 17, color: '#000' },
  iconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  timestamp: { fontSize: 12, color: '#8E8E93' },
  // 団体ID/団体名は値が長く、狭い画面ではラベルと同じ行に収まらない。
  // 値をラベルの下へ回し、折り返しても見出しと衝突しないようにする
  itemStack: { flexDirection: 'column', alignItems: 'flex-start' },
  timestampStack: { marginTop: 4, marginLeft: 36 },
  footer: { marginTop: 30, marginBottom: 50, alignItems: 'center' },
  versionText: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  statusText: { fontSize: 12, color: '#34C759' },
  // 目立たせないが、探して見つからないと困る。すぐ上の versionText と同じ濃さにする。
  // #C7C7CC だと明るいテーマで地との比が 1.5 しかなく、ほぼ見えなかった
  legalText: { fontSize: 11, color: '#8E8E93', marginTop: 10, textDecorationLine: 'underline' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalButtons: { width: '100%', gap: 10 },
  modalButtonsRow: { flexDirection: 'row', width: '100%', gap: 10 },
  radioBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  radioBtnActive: { backgroundColor: '#007AFF' },
  radioBtnText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold' },
  radioBtnTextActive: { color: '#FFF' },
  ratioHintText: { fontSize: 11, color: '#8E8E93', marginTop: 6, paddingHorizontal: 4 },
  dateSelector: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateSelectorText: { fontSize: 14, color: '#000' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: 'bold' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 4,
  },
  monthNavBtn: { padding: 8 },
  monthNavText: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#000' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    height: 36,
    paddingLeft: 12,
  },
  stepperValue: { fontSize: 16, color: '#000', marginRight: 8 },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    height: 32,
    marginRight: 2,
  },
  stepperBtn: { paddingHorizontal: 12, height: '100%', justifyContent: 'center', alignItems: 'center' },
  stepperDivider: { width: 1, height: 20, backgroundColor: '#C6C6C8' },
  filterGroup: { width: '100%', marginBottom: 16 },
  filterLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4, fontWeight: '600' },
  filterInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  supportButton: Object.assign(
    {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FF2D55',
      marginHorizontal: 16,
      marginVertical: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    getShadowStyle({
      shadowColor: '#FF2D55',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    })
  ),
  supportButtonHovered: { backgroundColor: '#E0284A', transform: [{ scale: 0.99 }] },
  supportButtonContent: { flexDirection: 'row', alignItems: 'center' },
  supportButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  tagChip: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  tagChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  tagChipText: { fontSize: 13, color: '#000' },
  suggestionsContainer: { flexDirection: 'row', marginTop: 8, paddingVertical: 4 },
  suggestionChip: {
    backgroundColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  suggestionText: { fontSize: 12, color: '#333' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.SettingsScreen = SettingsScreen;
