/**
 * 矢所の決まり。画面にも店にも触れない（Node から検査できる）。
 *
 * 2026-10-05 に聞き取りをして作り直した（それまでの形は、入れるのが手間で遅い・表がごちゃごちゃする・
 * 全員の矢所が分からない・スマホで小さく押しにくい、が困りごとだった）。入れ方は設定で 3 つから選ぶ：
 *  的で入れる（既定）… 矢所の画面の大きな的を押すと、矢所と○×が一緒に入って次の人へ進む
 *  ○×のあと        … ○×を押すと 0.5 秒後に大きな的の窓が開く（10/3 まで本番にあった開き方）。「完了」で閉じる
 *  まとめて          … 引いている間は○×だけ。名前を押すと、その人のその立ちの 4 本を続けて置く
 * どの入れ方でも、○×に合わない側には置けない（○の射は的の中だけ）。表は置いたマスに小さな点だけ出し、
 * マスの長押しでその射の的を開く。矢所の画面へは、表の上の取っ手の横の丸いボタンから入る。
 *
 * 位置は今までと同じ形（{x, y, targetType}、的の中心が 0・的の縁が 1）。分析の的（ArrowLocationView）も
 * 前の記録もそのまま読める。
 */
'use strict';

/** 1 立の射の数 */
const 立の本数 = 4;

/** 入れ方（設定）。既定は 的で */
const 入れ方たち = ['的で', '○×のあと', 'まとめて'];

function 入れ方を整える(値) {
  return 入れ方たち.includes(値) ? 値 : '的で';
}

/** 入れ方ごとの進み方。まとめて＝その人のその立ちの 4 本を続けて、ほかは隣の人の同じ射へ */
function 入れ方の進み方(入れ方) {
  return 'まとめて' === 入れ方を整える(入れ方) ? '立の中で同じ人' : '人を回る';
}

/**
 * 的の直径が、押せる四角の何割か。霞的・星的（36cm）は 0.75、星的（24cm）は 0.5。
 * 前の窓（四角 320・的 240／160）と分析の的と同じ割合なので、置いた位置の意味が変わらない
 */
function 的の割合(的の種類) {
  return 'hoshi24' === 的の種類 ? 0.5 : 0.75;
}

const 印か = (印) => '○' === 印 || '\xd7' === 印;

/** 射手の列だけ（区切りと計の列を除く） */
function 射手だけ(射手たち) {
  return (Array.isArray(射手たち) ? 射手たち : []).filter(
    (射手) => 射手 && 射手.id && !射手.isSeparator && !射手.isTotalCalculator
  );
}

/** 一緒に引く組。区切りか計の列で分かれる（鍵・立を閉じる と同じ分け方） */
function 組に分ける(射手たち) {
  const 組たち = [[]];
  for (const 射手 of Array.isArray(射手たち) ? 射手たち : []) {
    if (!射手) continue;
    if (射手.isSeparator || 射手.isTotalCalculator) {
      if (組たち[組たち.length - 1].length) 組たち.push([]);
      continue;
    }
    if (射手.id) 組たち[組たち.length - 1].push(射手);
  }
  return 組たち.filter((組) => 組.length);
}

function 射数を整える(射数) {
  const 数 = Math.floor(Number(射数) || 0);
  return 数 > 0 ? 数 : 0;
}

function 立の数(射数) {
  return Math.max(1, Math.ceil(射数を整える(射数) / 立の本数));
}

/** その立の射番（射数を超えない） */
function 立の射番(立, 射数) {
  const 出 = [];
  const 本数 = 射数を整える(射数);
  for (let 番 = 立 * 立の本数; 番 < Math.min(本数, (立 + 1) * 立の本数); 番++) 出.push(番);
  return 出;
}

const 立の番 = (射番) => Math.floor(射番 / 立の本数);

/**
 * 射の順。次へ進むときと、飛ばすときに使う。
 *  人を回る：立ごとに → 組ごとに → 射ごとに → 組のメンバーを並び順に
 *  立の中で同じ人：立ごとに → 組ごとに → メンバーごとに → その立ちの射（まとめて置くとき）
 * @returns {{射手ID:string, 射番:number}[]}
 */
function 射の順(射手たち, 射数, 進み方) {
  const 本数 = 射数を整える(射数);
  const 出 = [];
  const 組たち = 組に分ける(射手たち);
  if ('立の中で同じ人' === 進み方) {
    for (let 立 = 0; 立 < 立の数(本数); 立++)
      for (const 組 of 組たち)
        for (const 射手 of 組) for (const 番 of 立の射番(立, 本数)) 出.push({ 射手ID: 射手.id, 射番: 番 });
    return 出;
  }
  for (let 立 = 0; 立 < 立の数(本数); 立++)
    for (const 組 of 組たち)
      for (const 番 of 立の射番(立, 本数)) for (const 射手 of 組) 出.push({ 射手ID: 射手.id, 射番: 番 });
  return 出;
}

/** 置いてあるか。○×が空の射に残った位置（表で○×を消したときなど）は、置いていないと見る */
function 置いてあるか(射手, 番) {
  const 矢所 = 射手 && Array.isArray(射手.arrowLocations) ? 射手.arrowLocations[番] : null;
  const 印 = 射手 && Array.isArray(射手.marks) ? 射手.marks[番] : '';
  return !!矢所 && 印か(印);
}

const 同じ射 = (甲, 乙) => !!甲 && !!乙 && 甲.射手ID === 乙.射手ID && 甲.射番 === 乙.射番;

/**
 * 次の射：いまの射より後ろで、まだ置いていない射。後ろに無ければ頭から（飛ばした射に戻る）。
 * 全部置いてあれば null
 */
function 次の射(射手たち, 射数, 進み方, いま) {
  const 順 = 射の順(射手たち, 射数, 進み方);
  if (!順.length) return null;
  const 人 = new Map(射手だけ(射手たち).map((射手) => [射手.id, 射手]));
  const 空き = (射) => !置いてあるか(人.get(射.射手ID), 射.射番);
  const 位置 = 順.findIndex((射) => 同じ射(射, いま));
  for (let 歩 = 1; 歩 <= 順.length; 歩++) {
    const 射 = 順[(Math.max(位置, -1) + 歩 + 順.length) % 順.length];
    if (位置 >= 0 && 同じ射(射, いま)) break;
    if (空き(射)) return 射;
  }
  return null;
}

/**
 * 画面を開いたときの射。
 *  ・どこかに置いてあれば、順でいちばん後ろに置いた射の次の、置いていない射（続きから）
 *  ・どこにも無ければ、○×が入っている最初の射（○×だけ先に入れて、あとから矢所を入れるとき）。
 *    ○×も無ければ最初の射
 */
function 開く射(射手たち, 射数, 進み方) {
  const 順 = 射の順(射手たち, 射数, 進み方);
  if (!順.length) return null;
  const 人 = new Map(射手だけ(射手たち).map((射手) => [射手.id, 射手]));
  let 最後 = -1;
  順.forEach((射, 番) => {
    if (置いてあるか(人.get(射.射手ID), 射.射番)) 最後 = 番;
  });
  if (最後 >= 0) return 次の射(射手たち, 射数, 進み方, 順[最後]) || 順[最後];
  const 入っている = 順.find((射) => 印か(((人.get(射.射手ID) || {}).marks || [])[射.射番]));
  return 入っている || 順[0];
}

/** いまの射が盤面に無くなったか（メンバーを消した・射数を減らした） */
function 射があるか(射手たち, 射数, 射) {
  return !!射 && 射.射番 < 射数を整える(射数) && 射手だけ(射手たち).some((射手) => 射手.id === 射.射手ID);
}

/**
 * 押した所を、的の中心が 0・的の縁が 1 の位置に直す。
 * 四角の外で離したら null（指を外へ逃がすと、置かずにやめられる）
 * @param {{left:number, top:number, width:number, height:number}} 枠 押せる四角（画面上の位置）
 * @returns {{x:number, y:number, 内側:boolean} | null}
 */
function 押した所(点x, 点y, 枠, 的の種類) {
  if (!枠 || !(枠.width > 0) || !(枠.height > 0) || !Number.isFinite(点x) || !Number.isFinite(点y))
    return null;
  const 横 = 点x - 枠.left;
  const 縦 = 点y - 枠.top;
  if (横 < 0 || 縦 < 0 || 横 > 枠.width || 縦 > 枠.height) return null;
  const 半径 = (Math.min(枠.width, 枠.height) * 的の割合(的の種類)) / 2;
  const x = (横 - 枠.width / 2) / 半径;
  const y = (縦 - 枠.height / 2) / 半径;
  return { x, y, 内側: Math.sqrt(x * x + y * y) <= 1 };
}

/**
 * 置いたときに何をするか。
 *  置けない    … 見るだけで入っている
 *  鍵          … 鍵のかかった立ちは○×を変えない。○×が入っていて合っていれば矢所だけ置く（矢所だけ）
 *  一緒に入れる… ○×が空。矢所と○×を一緒に入れる（内側＝○・外側＝×）
 *  矢所だけ    … ○×と合っている
 *  合わない    … ○×と合わない側。置かない（○の射は的の中だけ、×の射は外だけ。使う人が決めた）
 * @returns {{する:string, 印:string}} 印は、置いたあとの○×
 */
function 置き方(いまの印, 内側, 場 = {}) {
  const 押した印 = 内側 ? '○' : '\xd7';
  if (場.見るだけ) return { する: '置けない', 印: いまの印 || '' };
  if (場.鍵)
    return 印か(いまの印) && いまの印 === 押した印
      ? { する: '矢所だけ', 印: いまの印 }
      : { する: '鍵', 印: いまの印 || '' };
  if (!印か(いまの印)) return { する: '一緒に入れる', 印: 押した印 };
  if (いまの印 === 押した印) return { する: '矢所だけ', 印: いまの印 };
  return { する: '合わない', 印: いまの印 };
}

/** 位置と○×が食い違っているか（あとから表で○×を直したとき）。○×が空なら食い違いとは言わない */
function 食い違っているか(矢所, 印) {
  if (!矢所 || !印か(印)) return false;
  const x = Number(矢所.x) || 0;
  const y = Number(矢所.y) || 0;
  const 内側 = Math.sqrt(x * x + y * y) <= 1;
  return 内側 !== ('○' === 印);
}

/**
 * 的に載せる点。色はいまの○×で決める（あとから○×を直しても色がずれない）。○×が空の射は載せない。
 * 立を渡せばその立ちだけ
 * @returns {{x:number, y:number, 印:string, 射番:number}[]}
 */
function 的の点たち(射手, 立 = null, 的の種類 = null) {
  const 矢所たち = Array.isArray(射手 && 射手.arrowLocations) ? 射手.arrowLocations : [];
  const 出 = [];
  for (let 番 = 0; 番 < 矢所たち.length; 番++) {
    if (!置いてあるか(射手, 番)) continue;
    if (null !== 立 && 立の番(番) !== 立) continue;
    // 的の種類を渡したら、その的で置いた矢だけ（同じ記録でも射ごとに的が違うことがある。10/3 の本番と同じ分け方）
    if (null !== 的の種類 && 矢所の的(矢所たち[番]) !== 的の種類) continue;
    const 矢所 = 矢所たち[番];
    出.push({ x: Number(矢所.x) || 0, y: Number(矢所.y) || 0, 印: 射手.marks[番], 射番: 番 });
  }
  return 出;
}

/**
 * 矢所を置いた的の種類。射ごとに置いたときの的が残る。種類の無い古い矢所は霞的とみなす
 * （分析の的 ArrowLocationView と、10/3 までの窓と同じ）
 */
function 矢所の的(矢所) {
  return (矢所 && 矢所.targetType) || 'kasumi36';
}

/** その射に置いた矢所の的の種類。置いていなければ null */
function 射の的(射手, 番) {
  return 置いてあるか(射手, 番) ? 矢所の的(射手.arrowLocations[番]) : null;
}

/**
 * 矢の集まり：中心（矢の平均の位置）と、散らばりの大きさ（中心からの距離の二乗平均の平方根）。
 * 的中も外れも全部の矢で数える（使う人が決めた。2026-10-05）。点が無ければ null
 * @param {{x:number, y:number}[]} 点たち 的の縁が 1 の位置
 * @returns {{x:number, y:number, 半径:number, 本数:number} | null}
 */
function 集まり(点たち) {
  const 点 = (Array.isArray(点たち) ? 点たち : []).filter(
    (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
  );
  if (!点.length) return null;
  const x = 点.reduce((和, p) => 和 + Number(p.x), 0) / 点.length;
  const y = 点.reduce((和, p) => 和 + Number(p.y), 0) / 点.length;
  const 半径 = Math.sqrt(
    点.reduce((和, p) => 和 + (Number(p.x) - x) ** 2 + (Number(p.y) - y) ** 2, 0) / 点.length
  );
  return { x, y, 半径, 本数: 点.length };
}

/** その範囲（立を渡せばその立ち、null なら全部）の、○×の入った射・中り・置いた矢所の数 */
function 数える(射手, 射数, 立 = null) {
  const 印たち = Array.isArray(射手 && 射手.marks) ? 射手.marks : [];
  const 番たち = null === 立 ? [...Array(射数を整える(射数)).keys()] : 立の射番(立, 射数);
  let 射った = 0;
  let 中り = 0;
  let 置いた = 0;
  for (const 番 of 番たち) {
    if (!印か(印たち[番])) continue;
    射った++;
    if ('○' === 印たち[番]) 中り++;
    if (置いてあるか(射手, 番)) 置いた++;
  }
  return { 射った, 中り, 置いた };
}

/**
 * 画面の分け方。測った広さから決める。
 *  横長 … 左に的、右に道具と全員（タブレットの横・スマホの横）
 *  縦長 … 上から道具・的・下の道具。的の下に全員が入るだけの高さがあれば並べ、無ければ「全員」に切り替えて見る
 * @returns {{横長:boolean, 的の大きさ:number, 全員を並べる:boolean}}
 */
function 画面の分け方(幅, 高さ) {
  const 幅の数 = Math.max(0, Number(幅) || 0);
  const 高さの数 = Math.max(0, Number(高さ) || 0);
  const 寄せる = (v, 下, 上) => Math.max(下, Math.min(上, v));
  if (幅の数 >= 560 && 幅の数 >= 高さの数 * 1.15) {
    return {
      横長: true,
      的の大きさ: Math.round(寄せる(Math.min(高さの数 - 24, 幅の数 * 0.5), 140, 560)),
      全員を並べる: true,
    };
  }
  // 縦：上の帯 44・メンバー 70・射 56・下の道具 52・すき間
  const 道具の高さ = 44 + 70 + 56 + 52 + 20;
  const 的 = Math.round(寄せる(Math.min(幅の数 - 24, 高さの数 - 道具の高さ), 140, 560));
  return { 横長: false, 的の大きさ: 的, 全員を並べる: 高さの数 - 道具の高さ - 的 >= 220 };
}

module.exports = {
  立の本数,
  入れ方たち,
  入れ方を整える,
  入れ方の進み方,
  的の割合,
  印か,
  射手だけ,
  組に分ける,
  立の数,
  立の射番,
  立の番,
  射の順,
  置いてあるか,
  同じ射,
  次の射,
  開く射,
  射があるか,
  押した所,
  置き方,
  食い違っているか,
  的の点たち,
  矢所の的,
  射の的,
  集まり,
  数える,
  画面の分け方,
};
