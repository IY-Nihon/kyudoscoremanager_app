'use strict';

// 成績の数え方は分析画面と共通（src/statsRules.js）
const 集 = require('./statsRules');
const _xlsx = require('./excelExport');
const React = require('react');
const {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,
} = require('./rn');
const { IS_WEB } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
// 見た目の決まりは設定画面と同じ
const { styles } = require('./settingsStyles');
// 画面が使う項目だけを購読する（ストア全体だと、ますを押すたびに裏のタブまで描き直す）
const { useストアの一部 } = require('./storeSlice');
const Icons = require('@expo/vector-icons');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const { use横流し } = require('./yokoNagashi');

/**
 * 設定画面の「書き出し」の窓（2026-10-05 に SettingsScreen.js から切り出した。動きは変えていない）。
 * 期間・年度・形（標準／表）・タグ・言葉・部員名で絞り、CSV か Excel で書き出す。
 * 期間を選ぶ暦の窓は、前は同じ条件で 2 つ描かれていた（9/19 の書き換えから）。上に出ていたほう
 * （日付を選んでも閉じない）だけを残した
 */
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

const データの書き出し窓 = ({ 見える, 閉じる }) => {
  const {
    activeRole,
    myMemberId,
    myMemberName,
    alumni = [],
    members = [],
    sessions: sList = [],
  } = useストアの一部(['activeRole', 'myMemberId', 'myMemberName', 'alumni', 'members', 'sessions']);
  const [期間の始め, 期間の始めを置く] = React.useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [期間の終わり, 期間の終わりを置く] = React.useState(new Date());
  const [部員名の絞り, 部員名の絞りを置く] = React.useState('all');
  const [言葉の絞り, 言葉の絞りを置く] = React.useState('');
  const [書き出しの形, 書き出しの形を置く] = React.useState('standard');
  const [暦を出す, 暦を出すを置く] = React.useState(false);
  const [暦の対象, 暦の対象を置く] = React.useState('start');
  const [選んだタグ, 選んだタグを置く] = React.useState([]);
  const [タグの論理, タグの論理を置く] = React.useState('AND');
  const [絞り込みを開く, 絞り込みを開くを置く] = React.useState(false);
  const [selectedKeywords, setSelectedKeywords] = React.useState([]);
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  // 候補の並びは横に流す。パソコンの車の動きは横に読み替える（src/yokoNagashi.js）
  const titleRefCallback = use横流し();
  const memberRefCallback = use横流し();
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
  return (
    <>
      <Modal visible={見える} transparent animationType="fade" onRequestClose={() => 閉じる()}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => 閉じる()} />
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
                    aria-label="キーワードで絞り込み"
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
                      aria-label="メンバー名で絞り込み"
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
                      閉じる();
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
                    onPress={() => 閉じる()}
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
                      閉じる();
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
                      閉じる();
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
    </>
  );
};

module.exports = { データの書き出し窓 };
