/**
 * Module ID: LiveShareModal
 *
 * ライブをURLで配るための窓。主催者だけが開ける。
 *
 * 出すものは2本。
 *   ・編集用 … 記録できる。○×を入れると全員に届く
 *   ・閲覧用 … 見るだけ。写しを読むので、何をしても記録には届かない
 *
 * 合言葉を付けると、枝の名前そのものが合言葉から決まる（src/liveShare.js）。
 * 画面で照らし合わせているのではないので、URLだけ持っていても入れない。
 * そのかわり忘れると誰も入れないので、そのことは画面にも書いてある。
 */
'use strict';

function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(exports, '__esModule', { value: !0 }),
  Object.defineProperty(exports, 'LiveShareModal', {
    enumerable: !0,
    get: function () {
      return 窓;
    },
  }));

var t = require('react'),
  l = e(require('./View')),
  o = e(require('./Text')),
  s = e(require('./StyleSheet')),
  c = e(require('./Modal')),
  u = e(require('./TextInput')),
  f = e(require('./TouchableOpacity')),
  h = e(require('./ScrollView')),
  y = require('./JP_useScoreStore_174'),
  共 = require('./liveShare'),
  写 = require('./clipboard_bridge'),
  A = require('./themedJsx');

/** 配り元。web なら開いている場所、端末なら本番の住所 */
function 配り元() {
  if (typeof window !== 'undefined' && window.location && window.location.origin)
    return window.location.origin;
  return 'https://kyudoscoremanager.web.app';
}

const 窓 = ({ visible, onClose }) => {
  const [合言葉, 合言葉を置く] = (0, t.useState)('');
  const [合言葉を使うか, 使うかを置く] = (0, t.useState)(!0);
  const [作業中, 作業中を置く] = (0, t.useState)(!1);
  const [出来上がり, 出来上がりを置く] = (0, t.useState)(null);
  const [知らせ, 知らせを置く] = (0, t.useState)(null);
  const [難点, 難点を置く] = (0, t.useState)(null);
  // どれだけ持たせるか。既定は24時間（src/liveShare.js の 期限の選択肢）
  const [持ち, 持ちを置く] = (0, t.useState)(共.期限の既定);

  // 窓を開け直したら最初から。前のライブのリンクが残っていると配り間違える
  (0, t.useEffect)(() => {
    if (visible)
      (出来上がりを置く(null),
        知らせを置く(null),
        難点を置く(null),
        合言葉を置く(''),
        使うかを置く(!0),
        持ちを置く(共.期限の既定));
  }, [visible]);

  const 作る = async () => {
    const 鍵 = 合言葉を使うか ? 合言葉 : '';
    if (合言葉を使うか) {
      const だめ = 共.合言葉の難点(鍵);
      if (だめ) return void 難点を置く(だめ);
    }
    (難点を置く(null), 作業中を置く(!0));
    try {
      const 荷 = await y.useScoreStore.getState().ライブを共有する(鍵, 持ち);
      if (!荷) return void 難点を置く('共有できませんでした。通信を確かめてもう一度お試しください。');
      出来上がりを置く({
        編集: 共.リンクを作る(配り元(), 荷.編集の荷),
        閲覧: 共.リンクを作る(配り元(), 荷.閲覧の荷),
        合言葉が要るか: 荷.合言葉が要るか,
        期限: 荷.期限 || null,
        すでに配られていた: !!荷.すでに配られていた,
      });
    } finally {
      作業中を置く(!1);
    }
  };

  const 写して知らせる = async (文字列, 何を) => {
    const 出来た = await 写.写す(文字列);
    知らせを置く(出来た ? `${何を}のリンクを写しました` : '写せませんでした。長押しで選んでください');
  };

  return (0, A.jsx)(c.default, {
    visible: !!visible,
    transparent: !0,
    animationType: 'fade',
    onRequestClose: onClose,
    children: (0, A.jsx)(l.default, {
      style: S.外,
      children: (0, A.jsxs)(l.default, {
        style: S.箱,
        children: [
          (0, A.jsx)(o.default, { style: S.見出し, children: 'ライブをリンクで配る' }),
          (0, A.jsx)(h.default, {
            style: { maxHeight: 420 },
            children: 出来上がり ? 出来たところ(出来上がり, 写して知らせる) : 作るところ(),
          }),
          知らせ ? (0, A.jsx)(o.default, { style: S.知らせ, children: 知らせ }) : null,
          (0, A.jsx)(f.default, {
            style: S.閉じる,
            onPress: onClose,
            children: (0, A.jsx)(o.default, {
              style: S.閉じるの字,
              children: 出来上がり ? '閉じる' : 'やめる',
            }),
          }),
        ],
      }),
    }),
  });

  function 作るところ() {
    return (0, A.jsxs)(l.default, {
      children: [
        (0, A.jsx)(o.default, {
          style: S.説明,
          children:
            'このライブだけを配ります。団体の他のライブには入れません。配ったあとも、部員はこれまでどおり参加一覧から入れます。',
        }),
        (0, A.jsxs)(f.default, {
          style: S.選び,
          onPress: () => 使うかを置く(!合言葉を使うか),
          // ✓ は絵で描いてあるので、そのままでは入か切かが読み上げられない。
          // web には aria- を明示する（TouchableOpacity は渡さない）
          accessibilityRole: 'checkbox',
          accessibilityState: { checked: 合言葉を使うか },
          'aria-checked': 合言葉を使うか,
          accessibilityLabel: '合言葉を付ける',
          'aria-label': '合言葉を付ける',
          children: [
            (0, A.jsx)(l.default, {
              style: [S.印, 合言葉を使うか && S.印が入り],
              children: 合言葉を使うか ? (0, A.jsx)(o.default, { style: S.印の字, children: '✓' }) : null,
            }),
            (0, A.jsx)(o.default, { style: S.選びの字, children: '合言葉を付ける' }),
          ],
        }),
        合言葉を使うか
          ? (0, A.jsxs)(l.default, {
              children: [
                (0, A.jsx)(u.default, {
                  style: S.入力,
                  value: 合言葉,
                  onChangeText: (x) => (合言葉を置く(x), 難点を置く(null)),
                  placeholder: `${共.合言葉の最短}文字以上`,
                  placeholderTextColor: '#8E8E93',
                  autoCapitalize: 'none',
                  autoCorrect: !1,
                }),
                (0, A.jsx)(o.default, {
                  style: S.注意,
                  children:
                    '合言葉はリンクに入りません。忘れると誰も入れなくなります。短い合言葉は当てられることがあるので、長めにしてください。',
                }),
              ],
            })
          : (0, A.jsx)(o.default, {
              style: S.注意,
              children: 'リンクを知っている人は誰でも入れます。外へ出さないリンクにしてください。',
            }),
        (0, A.jsx)(o.default, { style: S.小見出し, children: 'リンクの有効期限' }),
        (0, A.jsx)(l.default, {
          style: S.期限の列,
          children: 共.期限の選択肢.map((選) =>
            (0, A.jsx)(
              f.default,
              {
                style: [S.期限の札, 持ち === 選.値 && S.期限の札が入り],
                onPress: () => 持ちを置く(選.値),
                accessibilityRole: 'button',
                // accessibilityState も web の DOM には届かない
                // （accessibilityLabel と同じで、TouchableOpacity は渡さない）。
                // 付けないと、読み上げが「どれを選んでいるか」を言えない
                accessibilityState: { selected: 持ち === 選.値 },
                'aria-selected': 持ち === 選.値,
                accessibilityLabel: `有効期限 ${選.名}`,
                'aria-label': `有効期限 ${選.名}`,
                children: (0, A.jsx)(o.default, {
                  style: [S.期限の札の字, 持ち === 選.値 && S.期限の札の字が入り],
                  children: 選.名,
                }),
              },
              String(選.値)
            )
          ),
        }),
        (0, A.jsx)(o.default, {
          style: S.注意,
          children:
            持ち > 0
              ? '期限が過ぎると、このライブは配った方も含めて全員がつながらなくなります（お手元の記録は残ります）。あとから延ばすことはできません。延ばしたいときは配り直してください。'
              : '期限を付けないリンクは、ずっと開いたままです。配る先が決まっているときだけにしてください。',
        }),
        難点 ? (0, A.jsx)(o.default, { style: S.難点, children: 難点 }) : null,
        (0, A.jsx)(f.default, {
          style: [S.作るボタン, 作業中 && S.作業中],
          disabled: 作業中,
          onPress: 作る,
          children: (0, A.jsx)(o.default, {
            style: S.作るボタンの字,
            children: 作業中 ? '作っています…' : 'リンクを作る',
          }),
        }),
      ],
    });
  }
};

function 出来たところ(出来上がり, 写して知らせる) {
  const 一本 = (題, 説明, URL, 何を) =>
    (0, A.jsxs)(l.default, {
      style: S.一本,
      children: [
        (0, A.jsx)(o.default, { style: S.一本の題, children: 題 }),
        (0, A.jsx)(o.default, { style: S.一本の説明, children: 説明 }),
        (0, A.jsx)(o.default, { style: S.URL, selectable: !0, children: URL }),
        (0, A.jsx)(f.default, {
          style: S.写すボタン,
          onPress: () => 写して知らせる(URL, 何を),
          children: (0, A.jsx)(o.default, { style: S.写すボタンの字, children: 'リンクを写す' }),
        }),
      ],
    });
  return (0, A.jsxs)(l.default, {
    children: [
      一本(
        '編集用',
        '記録できます。○×を入れると全員に届きます。',
        出来上がり.編集,
        '編集用'
      ),
      一本(
        '閲覧用',
        '見るだけです。この人が何をしても、記録には届きません。',
        出来上がり.閲覧,
        '閲覧用'
      ),
      (0, A.jsx)(o.default, {
        style: S.注意,
        children: 出来上がり.合言葉が要るか
          ? '合言葉はリンクに入っていません。別に伝えてください。'
          : '合言葉はありません。リンクを知っている人は誰でも入れます。',
      }),
      (0, A.jsx)(o.default, {
        style: S.注意,
        children: 出来上がり.期限
          ? `有効期限：${期限の日時(出来上がり.期限)}（${共.期限の文言(出来上がり.期限) || ''}）`
          : '有効期限はありません。このリンクはずっと開いたままです。',
      }),
      // 二度目に配ったときは、選んだ期限ではなく最初のものが使われる。
      // 黙っていると「7日にしたのに1日で切れた」と見える
      出来上がり.すでに配られていた
        ? (0, A.jsx)(o.default, {
            style: S.注意,
            children:
              'このライブはすでに配られています。同じリンクをお渡しします。期限は最初に配ったときのままです。',
          })
        : null,
    ],
  });
}

/** 期限を日時の字にする。端末の言葉づかいに任せる */
function 期限の日時(期限) {
  try {
    return new Date(期限).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return new Date(期限).toISOString();
  }
}

const S = s.default.create({
  外: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  箱: { width: '100%', maxWidth: 420, backgroundColor: '#FFF', borderRadius: 14, padding: 18 },
  見出し: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 },
  説明: { fontSize: 13, color: '#3C3C43', lineHeight: 19, marginBottom: 14 },
  小見出し: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E', marginTop: 14, marginBottom: 6 },
  期限の列: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  期限の札: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  // 選ばれていることを、色だけでなく枠の太さでも示す。
  // 色の見え方は人によって違う（src/theme.js と同じ考え方）
  期限の札が入り: { backgroundColor: '#0A84FF', borderColor: '#0A84FF', borderWidth: 2 },
  期限の札の字: { fontSize: 13, color: '#3C3C43' },
  期限の札の字が入り: { color: '#FFF', fontWeight: 'bold' },
  選び: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  印: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  印が入り: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  印の字: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  選びの字: { fontSize: 15, color: '#1C1C1E' },
  入力: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1C1C1E',
    marginTop: 6,
  },
  注意: { fontSize: 12, color: '#3C3C43', lineHeight: 18, marginTop: 8 },
  難点: { fontSize: 13, color: '#FF3B30', marginTop: 8 },
  作るボタン: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  作業中: { backgroundColor: '#8E8E93' },
  作るボタンの字: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  一本: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  一本の題: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' },
  一本の説明: { fontSize: 12, color: '#3C3C43', marginTop: 2, marginBottom: 8, lineHeight: 18 },
  URL: { fontSize: 11, color: '#007AFF', marginBottom: 10 },
  写すボタン: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  写すボタンの字: { color: '#007AFF', fontSize: 14, fontWeight: 'bold' },
  知らせ: { fontSize: 13, color: '#248A3D', marginTop: 10, textAlign: 'center' },
  閉じる: { paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  閉じるの字: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
});

/**
 * 共有リンクで来た人を迎える窓。
 *
 * リンクを開いただけの人は、団体にも入っていないし Firebase にも繋がっていない。
 * RTDB の決まりは「ログインしている誰か」を求めるので、ここで匿名のまま
 * 繋いでから入る。団体のデータには一切触れない。
 *
 * 合言葉が要るリンクなら、先に聞く。照らし合わせているのではなく、
 * 合言葉から枝の名前を作るので、違っていれば「見つからない」になる。
 */
const 来客の窓 = ({ 荷, onClose }) => {
  const [合言葉, 合言葉を置く] = (0, t.useState)('');
  const [作業中, 作業中を置く] = (0, t.useState)(!1);
  const [難点, 難点を置く] = (0, t.useState)(null);
  const 中身 = 荷 ? 共.共有の荷を解く(荷) : null;
  // いま団体に入っていて、手元に書きかけの記録があるか。
  // 参加すると盤面はライブのもので上書きされる。ふつうの参加には確認が
  // あるのに、リンクから入る道にだけ無いと、黙って消えることになる
  const 団体 = (0, y.useScoreStore)((e) => e.activeGroupId);
  const 手元の射手 = (0, y.useScoreStore)((e) => e.archers);
  const 消えるもの =
    !!団体 &&
    (手元の射手 || []).some(
      (a) => a && !a.isSeparator && !a.isTotalCalculator && (a.marks || []).some((m) => m)
    );

  if (!中身) return null;

  const 入る = async () => {
    (難点を置く(null), 作業中を置く(!0));
    try {
      // RTDB は「ログインしている誰か」を求める。団体には入らない
      try {
        const 認 = require('./db_178');
        const 匿 = require('firebase/auth');
        if (認.auth && !認.auth.currentUser) await (0, 匿.signInAnonymously)(認.auth);
      } catch {
        return void 難点を置く('接続できませんでした。電波の良い場所でもう一度お試しください。');
      }
      const 結果 = await y.useScoreStore.getState().共有リンクで入る(荷, 合言葉);
      if ('入った' === 結果) return void onClose();
      難点を置く(
        '期限切れ' === 結果
          ? 'このリンクは有効期限が切れています。配った人に、あらためて配り直してもらってください。'
          : '見つからない' === 結果
            ? 中身.鍵が要るか
              ? '合言葉が違うか、このライブは終わっています。'
              : 'このライブは終わっているようです。'
            : 'リンクを読めませんでした。'
      );
    } finally {
      作業中を置く(!1);
    }
  };

  return (0, A.jsx)(c.default, {
    visible: !0,
    transparent: !0,
    animationType: 'fade',
    onRequestClose: onClose,
    children: (0, A.jsx)(l.default, {
      style: S.外,
      children: (0, A.jsxs)(l.default, {
        style: S.箱,
        children: [
          (0, A.jsx)(o.default, { style: S.見出し, children: 'ライブに参加します' }),
          (0, A.jsx)(o.default, {
            style: S.説明,
            children: `「${中身.名前}」に${中身.役 === 共.閲覧 ? '見るだけで' : '記録する側で'}入ります。`,
          }),
          中身.鍵が要るか
            ? (0, A.jsx)(u.default, {
                style: S.入力,
                value: 合言葉,
                onChangeText: (x) => (合言葉を置く(x), 難点を置く(null)),
                placeholder: '合言葉',
                placeholderTextColor: '#8E8E93',
                autoCapitalize: 'none',
                autoCorrect: !1,
                secureTextEntry: !0,
                onSubmitEditing: 入る,
              })
            : null,
          消えるもの
            ? (0, A.jsx)(o.default, {
                style: S.難点,
                children:
                  '手元に書きかけの記録があります。参加すると、ライブの内容で上書きされます。',
              })
            : null,
          難点 ? (0, A.jsx)(o.default, { style: S.難点, children: 難点 }) : null,
          (0, A.jsx)(f.default, {
            style: [S.作るボタン, 作業中 && S.作業中],
            disabled: 作業中,
            onPress: 入る,
            children: (0, A.jsx)(o.default, {
              style: S.作るボタンの字,
              children: 作業中
                ? '入っています…'
                : 消えるもの
                  ? '手元の記録を捨てて参加する'
                  : '参加する',
            }),
          }),
          (0, A.jsx)(f.default, {
            style: S.閉じる,
            onPress: onClose,
            children: (0, A.jsx)(o.default, { style: S.閉じるの字, children: 'やめる' }),
          }),
        ],
      }),
    }),
  });
};

Object.defineProperty(exports, '来客の窓', {
  enumerable: !0,
  get: function () {
    return 来客の窓;
  },
});
