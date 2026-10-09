# アプリに入れる紙の網（畳み込み・幅 8・網 3 枚）を、描いた紙＋本物 2 枚（9/6・10/1）で学ばせて書き出す
#   python scripts/ocr-cells/cnn/kami_prod.py scripts/ocr-cells/kami-tatami.json
import sys, os, json, torch, torch.nn.functional as F, numpy as np
出 = sys.argv[1]
sys.argv = [sys.argv[0], '0']
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kami_cnn.py'), encoding='utf-8').read().split('種の数 = int')[0])
from export import 書き出す
X = torch.cat([S[0]] + [A[0]] * 8 + [B[0]] * 8); Y = torch.cat([S[1]] + [A[1]] * 8 + [B[1]] * 8)
ms = [学ぶ(X, Y, s, 8) for s in (2000, 2001, 2002)]
with torch.no_grad():
    p = sum(F.softmax(m(cmp.正規化(B[0][:20].to(cmp.dev))), 1) for m in ms).cpu().numpy() / 3
json.dump({'確からしさ': p.round(4).tolist(), '札': B[1][:20].tolist()}, open(出 + '.mihon.json', 'w'))
書き出す(ms, 0, 32, ['×', '○'], 出)
print('書いた', 出, os.path.getsize(出))
