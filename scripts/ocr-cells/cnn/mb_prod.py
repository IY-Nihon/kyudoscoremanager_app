# アプリに入れる MobileNet（9 段目で切る・96px）を、本物を全部入れて学ばせ、.bin に書き出す
#   python mb_prod.py ../omomi-mobilenet.bin 2 [外す組,...]
import sys, os, json, numpy as np, torch, torch.nn.functional as F
import mb as exp, cmp, mb_kakidasu as kakidasu_bin
出, 網の数 = sys.argv[1], int(sys.argv[2])
外す = set(sys.argv[3].split(',')) if len(sys.argv) > 3 and sys.argv[3] else set()
R画, R形, R札, R組, _, Rmeta = cmp.読む('real32')
S画, S形, S札, _, _, _ = cmp.読む('syn32')
使う = np.array([g not in 外す for g in R組])
Rx = torch.from_numpy(R画[使う]).float().div(255).unsqueeze(1)
Sx = torch.from_numpy(S画).float().div(255).unsqueeze(1)
X = torch.cat([Sx] + [Rx] * 8); Fx = torch.cat([torch.from_numpy(S形)] + [torch.from_numpy(R形[使う])] * 8)
Y = torch.cat([torch.from_numpy(S札)] + [torch.from_numpy(R札[使う])] * 8)
print('本物', int(使う.sum()), '外した', sorted(外す), '学習', len(Y), flush=True)
models = [exp.学ぶ('mb96t9', 92, X, Fx, Y, 1000 + s) for s in range(網の数)]
with torch.no_grad():
    x = cmp.正規化(torch.from_numpy(R画[:40]).float().div(255).unsqueeze(1).to(cmp.dev))
    p = sum(F.softmax(m(x), 1) for m in models) / len(models)
# test/ocrMobilenet.mihon.json と同じ形の見本（9/6 の板のマス 40 個。docs/ocr-samples の写真）。ここ（倉庫に入れない）に置く
import base64
ここ = os.path.dirname(os.path.abspath(__file__))
json.dump({'説明': 'docs/ocr-samples/PXL_20260906_081921509.jpg の板のマス 40 個（アプリと同じ切り抜き・32×32）と、PyTorch で読んだ確からしさ（omomi-mobilenet.bin を書き出した網 2 枚の平均）',
           '辺': 32, '画': base64.b64encode(R画[:40].astype(np.uint8).tobytes()).decode(), '正解': R札[:40].tolist(),
           '確からしさ': [[round(float(v), 5) for v in r] for r in p.cpu().numpy()]},
          open(os.path.join(ここ, os.path.basename(出) + '.mihon.json'), 'w', encoding='utf-8'), ensure_ascii=False)
kakidasu_bin.書き出す(models, 出, Rmeta['種類'])
print('書いた', 出, os.path.getsize(出), 'バイト', flush=True)
