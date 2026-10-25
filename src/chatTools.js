'use strict';

/**
 * AI チャットの道具（Function Calling）の宣言。AIChatBot.js の handleSend が模型に渡す。
 * 呼ばれたときに何を返すかは AIChatBot.js の handleSend（数えるのは src/chatStats.js）。
 * 個人ログインに出す道具は src/chatPersonal.js の 個人向けの道具 で絞る。
 * 画面の部品を持たないので、Node からそのまま読める（test/chatPersonal.test.js）。
 * （2026-10-24 に AIChatBot.js から分けた）
 */

/** タグで記録を絞る引数（成績の 3 つの道具で同じ） */
const タグで絞る引数 = {
  type: 'ARRAY',
  items: { type: 'STRING' },
  description:
    "タグで記録を絞り込む。例: ['自主稽古']。「自主練の的中率」「試合だけの成績」のように、タグで分けて聞かれたときに渡す。記録のタグの名前に含まれる言葉で当たる（# は付けても付けなくてもよい）。複数渡すと、すべてのタグが付いた記録だけ。タグの名前が分からないときは、先に何も渡さず呼ぶか、searchSessions で記録の目印を確かめる",
};

/** 性別で絞る引数（成績・比べる・射位の道具で同じ） */
const 性別で絞る引数 = {
  type: 'STRING',
  description:
    "性別で絞る。'男子' か '女子'。「男子の中で」「女子だけで」と聞かれたときに渡す。省略すると全員",
};

/**
 * 道具の宣言（模型の tools にそのまま渡す形）。
 * @param {number} 学年の数 在籍の学年の数（大学なら 4。団体の種類で変わる。src/gakunen.js）
 */
function 道具の宣言(学年の数) {
  const 学年の説明 = `学年（1〜${学年の数} の数。コーチ・ゲストなど学年の無い人は 0）`;
  const 学年で絞る引数 = {
    type: 'INTEGER',
    description: `学年で絞る（1〜${学年の数}）。「1年生の中で」と聞かれたときに渡す。省略すると全員`,
  };
  return [
    {
      functionDeclarations: [
        {
          name: 'getAllMembersStats',
          description:
            '全部員の成績を集計し、順位を付けて返します。「全員の5月の的中率を教えて」「部員のランキングを見せて」「一番当てているのは誰」「男子の上位10人」「的中率が安定している人」などに使います。性別・学年で絞ると、その人たちだけで順位を付けます（「男子の中で何位」もこれで答える）。順位付け・並べ替え・絞り込みはこのツールが行うので、返ってきた順番と数字をそのまま使ってください。自分で並べ替えたり足し算したりしないでください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              dateFrom: {
                type: 'STRING',
                description: "集計対象期間の開始日 (YYYY-MM-DD形式)。例: '2026-05-01'",
              },
              dateTo: {
                type: 'STRING',
                description: "集計対象期間の終了日 (YYYY-MM-DD形式)。例: '2026-05-31'",
              },
              sortBy: {
                type: 'STRING',
                description:
                  "並び順。'的中率'（既定）, '的中数', '射数', '名前', '安定' のいずれか。'安定' は記録ごとの的中率の散らばり（標準偏差・ポイント）が小さい順で、4射以上の記録が3件以上ある人だけを並べる",
              },
              limit: {
                type: 'INTEGER',
                description: '上位何人を返すか。「トップ3」なら3。省略すると全員',
              },
              gender: 性別で絞る引数,
              grade: 学年で絞る引数,
              minShots: {
                type: 'INTEGER',
                description:
                  'この射数に満たない人を順位から外す。既定は1。少ない射数の高い的中率を上位に出したくないときは10〜20を指定する',
              },
              keyword: {
                type: 'STRING',
                description:
                  "記録の題・覚え書きに含まれる言葉で記録を絞り込む。例: 'リーグ戦'。「リーグ戦に出た選手の的中率」「〇〇大会の成績」のように、タグではなく大会名・練習名で分けて聞かれたときに渡す",
              },
              tags: タグで絞る引数,
            },
          },
        },
        {
          name: 'makeBalancedTeams',
          description:
            "部員を何人ずつかの組（チーム）に分けます。組の見込みの的中率をそろえる（goal '均等'。既定）だけでなく、いちばん当たる組から順に作る（goal '強い順'。「一番的中の出るチームを組んで」「1軍と2軍を作って」）、作る組の数（teamCount。「最強の1組だけ」なら 1）、この人たちだけで（onlyNames）、必ず入れる人（mustInclude）、同じ組にする人（together）・別の組にする人（apart）、学年や男女を各組に散らす（spread）も指定できます。「3人立ちでチームの的中率が均等になるように分けて」「〇〇以外で5人ずつのチームを作って」「男女混合で」などに使います。外す人以外の全員を入れます（射数の少ない人も外しません。teamCount を指定したときは、見込みの高い人から選び、選ばなかった人を返します）。組分け・人数・組の的中率の見込みはこのツールが計算するので、自分で組み替えたり足し算したりせず、返ってきた組と数字をそのまま伝えてください。守れなかった決まり があれば必ず伝えてください。人数が割り切れないのに、余りの扱いを利用者が言っていないときは、先に「余った人をどこかの組に足す／余りとして別にする／1人少ない組を作る」のどれにするかを聞いてください（teamCount を指定したときは聞かない）。聞くときに、それぞれ何人の組がいくつになるかを自分で計算して書き添えないでください（数え違えます。決まったあとにこのツールが返します）。",
          parameters: {
            type: 'OBJECT',
            properties: {
              teamSize: {
                type: 'INTEGER',
                description: '1 組の人数。「3人立ち」なら 3、「5人立ち」なら 5',
              },
              excludeNames: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description:
                  '組に入れない人の名前（利用者が言った書き方のまま。コーチなども、外すと言われたらここに）',
              },
              remainder: {
                type: 'STRING',
                description:
                  "人数が割り切れないときの扱い。'足す'（余った人をどこかの組に1人ずつ足す）、'別に'（組に入れず余りとして別に出す）、'少ない組'（組の数を1つ増やし、足りない分だけ1人少ない組にする。例：10人を3人ずつなら 3・3・2・2）のいずれか",
              },
              dateFrom: {
                type: 'STRING',
                description: '的中率を見る期間の開始日 (YYYY-MM-DD)。「直近2ヶ月」なら今日から2か月前',
              },
              dateTo: { type: 'STRING', description: '的中率を見る期間の終了日 (YYYY-MM-DD)' },
              goal: {
                type: 'STRING',
                description:
                  "組み方。'均等'（既定。組の見込みの的中率をそろえる）か '強い順'（見込みの高い人から 1 組目・2 組目…と組む。いちばん当たる組を作るとき）",
              },
              teamCount: {
                type: 'INTEGER',
                description:
                  '作る組の数。「最強の1組だけ」「3組だけ作って」のときに渡す。省略すると全員が入るだけ組む',
              },
              onlyNames: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'この人たちだけで組む（名前の一覧）',
              },
              mustInclude: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'teamCount で人を選ぶときに、必ず入れる人',
              },
              together: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description:
                  "同じ組にする人たち。1 つの文字に 1 組ぶんの名前を「・」で区切って入れる。例: ['山田・佐藤']",
              },
              apart: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description:
                  "別々の組にする人たち。1 つの文字に名前を「・」で区切って入れる。例: ['山田・鈴木']",
              },
              spread: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: "各組に散らすもの。'学年'（学年を混ぜる）・'性別'（男女混合）",
              },
              tags: タグで絞る引数,
              gender: {
                type: 'STRING',
                description:
                  "この性別の人だけで組を作る。'男子' か '女子'。「男子だけで組を分けて」のときに渡す。省略すると全員",
              },
              grade: {
                type: 'INTEGER',
                description: `この学年の人だけで組を作る（1〜${学年の数}）。省略すると全員`,
              },
            },
            required: ['teamSize'],
          },
        },
        {
          name: 'getAttendanceStats',
          description:
            '部員の出欠を集計し、順位を付けて返します。「今月いちばん練習に来ているのは誰」「◯◯さんの出席率は」「休みが多いのは誰」などに使います。「男子で休みが多いのは誰」のように性別・学年でも絞れます。期間に一度も来ていない人は順位に入れず「一度も来ていない人」として別に返すので、答えでも順位とは分けて伝えてください。出欠画面と同じ数え方（正規練習日ごとに、記録に出ていれば来た、無ければ欠席。出席率＝来た日数÷今日までの練習日数）です。遅刻・早退は「来た」に数えます。順位・並べ替えはこのツールが行うので、返った順番と数字をそのまま使ってください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              dateFrom: { type: 'STRING', description: '集計対象期間の開始日 (YYYY-MM-DD形式)' },
              dateTo: { type: 'STRING', description: '集計対象期間の終了日 (YYYY-MM-DD形式)' },
              sortBy: {
                type: 'STRING',
                description: "並び順。'出席率'（既定）, '来た回数', '欠席', '名前' のいずれか",
              },
              limit: { type: 'INTEGER', description: '上位何人を返すか。省略すると全員' },
              gender: { type: 'STRING', description: "性別で絞る。'男子' か '女子'。省略すると全員" },
              grade: { type: 'INTEGER', description: '学年で絞る（1〜4 など）。省略すると全員' },
              byMonth: {
                type: 'BOOLEAN',
                description:
                  '月ごとに数える（人ごとに、各月の来た回数・練習日数・出席率）。「各月でカウントして」「月ごとの出欠」のときに渡す',
              },
              maxRate: {
                type: 'NUMBER',
                description:
                  '出席率がこの値（百分率）以下の人だけ。「3分の1以下」なら 33.3。byMonth と一緒に渡すと、この値以下だった月を人ごとに数え、多い順に並べる',
              },
              minRate: { type: 'NUMBER', description: '出席率がこの値（百分率）以上の人だけ' },
            },
          },
        },
        {
          name: 'searchSessions',
          description:
            '記録を言葉で探します。題・覚え書き・目印（タグ）・出ている人の名前を見ます。「雨で中断した練習はいつ」「審査のタグが付いた記録を見せて」「山田さんが出た記録」など、日付が分からないときに使います。日付が分かっているときは getSessionsByDate を使ってください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              keyword: { type: 'STRING', description: '探す言葉。空にすると期間内すべて' },
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
              limit: { type: 'INTEGER', description: '何件まで返すか。既定は20' },
            },
          },
        },
        {
          name: 'countSessionParticipation',
          description:
            '目印（タグ）や言葉で絞った記録に、部員が何回参加したかを人ごとに数えて、多い順に返します。「自主練が一番多いのは誰」「#審査の記録に出た回数」「合宿に何回参加したか」などに使います。出欠の集計（getAttendanceStats）とは別で、正規練習日ではなく、言葉で絞った記録を数えます。ゲストは数えません。',
          parameters: {
            type: 'OBJECT',
            properties: {
              keyword: {
                type: 'STRING',
                description:
                  "記録を絞る言葉。題・覚え書き・目印・出ている人の名前を見ます。例: '#自主稽古'、'合宿'",
              },
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
              limit: { type: 'INTEGER', description: '上位何人を返すか。省略すると全員' },
            },
            required: ['keyword'],
          },
        },
        {
          name: 'getPositionStats',
          description:
            '射位（大前・2番・落など）ごとの的中率を返します。立ち順を考えるときの材料です。「大前に向いているのは誰」「落で強いのは」「山田さんは大前と落でどちらが良い」などに使います。誰をどこに置くかはこのツールでは決めません。返した数字をもとに、根拠を添えて提案してください。射数が少ない射位は数字が揺れるので、射数も一緒に伝えてください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
              memberNames: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'この人たちだけに絞る。省略すると全員',
              },
              minShots: { type: 'INTEGER', description: 'この射数に満たない人を外す。既定は1' },
              position: {
                type: 'STRING',
                description:
                  "この射位に向いている人を、見込みの的中率の高い順に並べて返す（その射位の順位）。'大前'・'2番'・'3番'・'落' など。「大前に向いているのは誰」のときに渡す",
              },
              tags: タグで絞る引数,
              gender: 性別で絞る引数,
              grade: 学年で絞る引数,
            },
          },
        },
        {
          name: 'getSessionsByDate',
          description:
            '日付・期間・題・id を指定して練習記録を取得します。「昨日の記録」「今週の練習」「5月の記録」「直近3回」「○○戦の結果」「この試合」「今月いちばん当たった日」などの質問に使います。dateとdateFrom/dateToとrecentCountはいずれか一つを指定してください（keyword・sessionId・sortBy は単独でも、日付と一緒でも使えます）。',
          parameters: {
            type: 'OBJECT',
            properties: {
              date: {
                type: 'STRING',
                description: "特定の1日を指定する場合のYYYY-MM-DD形式の日付。例: '2026-05-23'",
              },
              dateFrom: { type: 'STRING', description: '期間指定の開始日 (YYYY-MM-DD形式)' },
              dateTo: { type: 'STRING', description: '期間指定の終了日 (YYYY-MM-DD形式)' },
              recentCount: {
                type: 'INTEGER',
                description: '直近N件取得する場合の件数。例: 3 → 直近3回分',
              },
              keyword: {
                type: 'STRING',
                description:
                  '記録の題・メモ・目印（タグ）で絞る言葉。「○○戦」「リーグ戦」など。日付と一緒に使うこともできます',
              },
              sessionId: {
                type: 'STRING',
                description:
                  '記録の id。いま開いている記録（「この記録」「この試合」）や、searchSessions で見つけた記録を読むときに渡します',
              },
              sortBy: {
                type: 'STRING',
                description:
                  "並び順。'新しい順'（既定）, '的中率', '的中数' のいずれか。「いちばん当たった日」「的中率が高かった練習」は '的中率' か '的中数' を渡し、返ってきた順のまま答える",
              },
            },
          },
        },
        {
          name: 'compareMemberStats',
          description:
            '2つの期間の的中率を部員ごとに比べ、下がった順・上がった順などに並べて返します。「最近的中率が落ちている人」「調子を上げているのは誰」「先月と比べて伸びた人」「一番波に乗っているのは」などに使います。期間を省くと、今日までの30日と、その前の30日を比べます。差（ポイント）・並べ替えはこのツールが計算するので、返ってきた順番と数字をそのまま使ってください。どちらかの期間で射数が足りない人は比べていません（人数だけ返ります）。',
          parameters: {
            type: 'OBJECT',
            properties: {
              dateFrom: { type: 'STRING', description: '今の期間の開始日 (YYYY-MM-DD)。省くと今日の29日前' },
              dateTo: { type: 'STRING', description: '今の期間の終了日 (YYYY-MM-DD)。省くと今日' },
              compareFrom: {
                type: 'STRING',
                description: '比べる前の期間の開始日 (YYYY-MM-DD)。省くと、今の期間のすぐ前の同じ日数',
              },
              compareTo: { type: 'STRING', description: '比べる前の期間の終了日 (YYYY-MM-DD)' },
              sortBy: {
                type: 'STRING',
                description:
                  "並び順。'下がった'（既定。下がり幅の大きい順）, '上がった', '差の大きさ'（上下を問わず動いた順）のいずれか",
              },
              minShots: {
                type: 'INTEGER',
                description: '両方の期間でこの射数以上引いた人だけを比べる。既定は8',
              },
              limit: { type: 'INTEGER', description: '何人返すか。省略すると全員' },
              gender: 性別で絞る引数,
              grade: 学年で絞る引数,
              tags: タグで絞る引数,
            },
          },
        },
        {
          name: 'compareShotRanges',
          description:
            '1回の記録の中で、前の射と後の射（既定は1〜4射目と5〜8射目）の的中率を部員ごとに比べて返します。「最初の4射と後半の4射で安定している人のランキング」「後半に強いのは誰」「後半で崩れる人」などに使います。差（後−前のポイント）・並べ替えはこのツールが計算するので、返ってきた順番と数字をそのまま使ってください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              firstFrom: { type: 'INTEGER', description: '前の射の始め（何射目から。既定は1）' },
              firstTo: { type: 'INTEGER', description: '前の射の終わり（何射目まで。既定は4）' },
              secondFrom: { type: 'INTEGER', description: '後の射の始め（既定は5）' },
              secondTo: { type: 'INTEGER', description: '後の射の終わり（既定は8）' },
              sortBy: {
                type: 'STRING',
                description:
                  "並び順。'差が小さい'（既定。前と後がそろっている＝安定している順）, '後が上がった', '後が下がった', '前の的中率', '後の的中率' のいずれか",
              },
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)。省くと全期間' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
              minShots: {
                type: 'INTEGER',
                description: '前・後それぞれでこの射数以上の人だけを比べる。既定は8',
              },
              limit: { type: 'INTEGER', description: '何人返すか。省略すると全員' },
              gender: 性別で絞る引数,
              grade: 学年で絞る引数,
              tags: タグで絞る引数,
            },
          },
        },
        {
          name: 'aggregateStats',
          description:
            "記録を好きな条件で絞り、好きな切り口（1つか2つ）でまとめて、的中・射数・的中率・皆中・記録の数を数える万能の集計です。ほかの道具にぴったり合うものが無い問いは、これで条件と切り口を組み合わせて答えてください。例：「月ごとの部全体の的中率の推移」→ groupBy ['月']／「曜日ごとの的中率」→ ['曜日']／「何射目が一番当たるか」→ ['射目']／「1年生の月ごとの的中率」→ ['月'] と grade 1／「山田さんの月ごとの推移」→ ['月'] と memberNames／「タグごとの的中率」→ ['タグ']／「男女別の的中率」→ ['性別']／「月ごとの落差が激しい人」→ ['人', '月'] と sortBy '振れ幅'／「土日だけの的中率」→ weekdays／「大前の月ごとの的中率」→ ['月'] と positions ['大前']／「皆中が多い人」→ ['人'] と sortBy '皆中'。部員でない人（ゲスト・相手校）の射は数えません。数字と並びは計算済みなので、そのまま使ってください。",
          parameters: {
            type: 'OBJECT',
            properties: {
              groupBy: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description:
                  '切り口（1つか2つ）。人・月・週・日・曜日・記録・射目（列の何本目）・立目・射位・タグ・学年・性別・区分 から選ぶ。2つ渡すと、1つ目ごとに2つ目の内訳と、内訳の的中率のいちばん高い所・低い所・振れ幅を返す',
              },
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD)。省くと全期間' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD)' },
              memberNames: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'この人たちの射だけを数える。省略すると全員',
              },
              gender: 性別で絞る引数,
              grade: 学年で絞る引数,
              shotFrom: {
                type: 'INTEGER',
                description: '列の何射目から数えるか（1 始まり）。「後半の4射」なら 5',
              },
              shotTo: { type: 'INTEGER', description: '列の何射目まで数えるか。「最初の4射」なら 4' },
              positions: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: "射位で絞る。'大前'・'2番'・'3番'・'落' など",
              },
              weekdays: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: "曜日で絞る。'日'・'月'・'火'・'水'・'木'・'金'・'土' から",
              },
              tags: タグで絞る引数,
              keyword: {
                type: 'STRING',
                description: '記録の題・覚え書きに含まれる言葉で絞る（「リーグ戦」など）',
              },
              sortBy: {
                type: 'STRING',
                description:
                  "並び順。'キー'（切り口の順。月・日・射目などの既定）, '的中率'（人・タグなどの既定）, '的中数', '射数', '皆中', '記録の数', '振れ幅'（切り口が2つのとき）",
              },
              order: {
                type: 'STRING',
                description: "'高い順' か '低い順'。省くと、キーは古い順・小さい順、それ以外は高い順",
              },
              minShots: { type: 'INTEGER', description: 'この射数に満たないまとまりは外す。既定は1' },
              limit: { type: 'INTEGER', description: '何件返すか（最大100）' },
            },
            required: ['groupBy'],
          },
        },
        {
          name: 'listMembers',
          description:
            '部員の名簿を絞って、人数・学年ごと・性別ごとの人数と一覧を返します。「1年生は何人」「女子は誰」「部員は全部で何人」「期ごとの人数」「卒業生は何人」などに使います。人数と内訳はこのツールが数えるので、部員一覧を自分で数えないでください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              grade: 学年で絞る引数,
              gender: 性別で絞る引数,
              division: { type: 'STRING', description: '区分の名前で絞る（区分を使っている団体だけ）' },
              nameIncludes: { type: 'STRING', description: '名前にこの字が入る人だけ' },
              includeAlumni: { type: 'BOOLEAN', description: '卒業生の人数と名前も返すか' },
            },
          },
        },
        {
          name: 'calculate',
          description:
            '式を計算します。ツールが返した数字を足す・引く・割合にする・平均するなど、計算が要るときは暗算せず必ずこれを使ってください。例：「(15+12)/40*100」「95-87」「あと何中で5割か」は「40*0.5-17」。使えるのは数と + - * / と括弧だけです。',
          parameters: {
            type: 'OBJECT',
            properties: {
              expression: { type: 'STRING', description: '式。例: (15+12)/40*100' },
              digits: { type: 'INTEGER', description: '小数の桁（既定 2）' },
            },
            required: ['expression'],
          },
        },
        {
          name: 'showFigure',
          description:
            '答えの下に図（折れ線・棒・表・矢所）を出します。道具の返事に「図にするとき」（source と 使える形）があるものだけ図にできます。月ごとの推移は折れ線、何射目・曜日ごと・ランキングは棒、「表にして」や数の多い一覧は表、矢所の傾向は矢所。図は道具の結果から端末が描くので、数字を渡す必要はありません。図を出したら、文には要点だけを短く書いてください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              source: {
                type: 'STRING',
                description: '図にする結果の番号（道具の返事の 図にするとき.source。例: R1）',
              },
              kind: {
                type: 'STRING',
                description: "図の形。'折れ線'・'棒'・'表'・'矢所' のうち、その結果の 使える形 にあるもの",
              },
              title: { type: 'STRING', description: '図の題（短く。例: 部全体の月ごとの的中率）' },
            },
            required: ['source', 'kind'],
          },
        },
        {
          name: 'getEquipmentTrend',
          description:
            '部員が弓具（弓力など）を変えた日ごとに、その弓具を使っていたあいだの的中率と、前の弓具のあいだの的中率を返します。「弓を変えてから当たるようになった？」「弓力を上げた影響は」などに使います。前後で率が動いても弓具だけが理由とは限らないこと（時期・体調など）と、射数を必ず添えてください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              memberName: { type: 'STRING', description: '部員の名前' },
            },
            required: ['memberName'],
          },
        },
        {
          name: 'getDetailedMemberStats',
          description:
            '指定した選手の詳細な成績データを取得します。初矢から4本目（留矢）まで何本目の矢が当たりやすいか、また大前や落など立順ごとの成績などを分析する際に呼び出してください。一射（1本だけ引いた行）・一手（2本だけ）・三射の成績と、それがいつの記録かも返します（oneShot・oneHand・threeShots。分析の「的中の型」と同じ数え方）。「一手だけの記録はいつ」「一本のときの的中率」はこれで答えてください。「9月の」「今年度の」のように期間が付いていれば dateFrom / dateTo を渡してください（省くと全期間）。',
          parameters: {
            type: 'OBJECT',
            properties: {
              memberName: { type: 'STRING', description: '選手の名前' },
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)。省くと全期間' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)。省くと全期間' },
              tags: タグで絞る引数,
            },
            required: ['memberName'],
          },
        },
        {
          name: 'getArrowLocationStats',
          description:
            '部員の矢所の着弾位置や傾向（全体の集まり・中心位置・まとまり具合・外れ矢の抜ける方向など）を集計して返します。「矢所の傾向を教えて」「矢所がどこに集まっているか」「外れ矢はどこに抜けているか」などに使います。返された中心位置や方位、散らばりをもとに自然言語で分かりやすく解説やアドバイスを行ってください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              memberName: { type: 'STRING', description: '選手の名前' },
              dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)。省くと全期間' },
              dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)。省くと全期間' },
              targetType: {
                type: 'STRING',
                description: "的の種類（'kasumi36', 'hoshi36', 'hoshi24' のいずれか）。省略するとすべての的",
              },
              tags: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description:
                  "タグで記録を絞り込む。例: ['自主稽古']。「自主練の矢所」「試合だけの矢所」のように、タグで分けて聞かれたときに渡す",
              },
            },
            required: ['memberName'],
          },
        },
        {
          name: 'navigateToScreen',
          description: '指定した画面タブへ遷移します。',
          parameters: {
            type: 'OBJECT',
            properties: {
              screenName: {
                type: 'STRING',
                description: '遷移先の画面名（記録, 履歴, 分析, メンバー, 出欠, 設定 のいずれか）',
              },
            },
            required: ['screenName'],
          },
        },
        {
          name: 'startTutorial',
          description:
            '初めての人向けの使い方の案内（チュートリアル）を開始します。「チュートリアルを見せて」「使い方ツアーを始めて」「案内をもう一度見たい」などの依頼で呼び出してください。',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'addMember',
          description:
            '新しい部員を1人追加します。追加する前にユーザーへの確認が行われます。2人以上は addMembers を使ってください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: '追加する部員の名前' },
              grade: {
                type: 'INTEGER',
                description: 学年の説明,
              },
              gender: { type: 'STRING', description: "性別（'male', 'female', '未設定' のいずれか）" },
            },
            required: ['name', 'grade', 'gender'],
          },
        },
        {
          name: 'addMembers',
          description:
            '新しい部員を2人以上まとめて追加します。人ごとに確認のカードが出て、利用者がまとめて承認できます。「山田と佐藤を追加して」「1年生を3人登録して」のように複数人を頼まれたときは、addMember を何度も呼ばず、必ずこちらを1回だけ呼んでください。',
          parameters: {
            type: 'OBJECT',
            properties: {
              members: {
                type: 'ARRAY',
                description: '追加する部員の一覧',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING', description: '名前' },
                    grade: {
                      type: 'INTEGER',
                      description: 学年の説明,
                    },
                    gender: {
                      type: 'STRING',
                      description: "性別（'male', 'female', '未設定' のいずれか）",
                    },
                  },
                  required: ['name', 'grade', 'gender'],
                },
              },
            },
            required: ['members'],
          },
        },
      ],
    },
  ];
}

module.exports = { 道具の宣言 };
