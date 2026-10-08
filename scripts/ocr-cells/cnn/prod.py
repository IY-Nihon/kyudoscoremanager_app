# アプリに入れる CNN を学ばせて、JSON に書き出す（切り抜きは 32×32、アプリの 縮める と同じ）。
#   python prod.py 出力.json 幅 形あり(0/1) 網の数 [外す組,...]
# 学習：描いた板の全部 ＋ 本物（外す組を除く。8 回ずつ混ぜる）
import sys, math, json, os
import numpy as np
import torch, torch.nn.functional as F
import cmp
from export import 書き出す

出, w, 横あり, 網の数 = sys.argv[1], int(sys.argv[2]), sys.argv[3] == '1', int(sys.argv[4])
外す = set(sys.argv[5].split(',')) if len(sys.argv) > 5 and sys.argv[5] else set()
R画, R形, R札, R組, _, Rmeta = cmp.読む('real32')
S画, S形, S札, _, _, _ = cmp.読む('syn32')
assert Rmeta['辺'] == 32
使う = np.array([g not in 外す for g in R組])
Rx = torch.from_numpy(R画[使う]).float().div(255).unsqueeze(1)
Sx = torch.from_numpy(S画).float().div(255).unsqueeze(1)
X = torch.cat([Sx] + [Rx] * 8)
Fx = torch.cat([torch.from_numpy(S形)] + [torch.from_numpy(R形[使う])] * 8)
Y = torch.cat([torch.from_numpy(S札)] + [torch.from_numpy(R札[使う])] * 8)
横 = (S形.shape[1] - 400) if 横あり else 0
print('本物', int(使う.sum()), '外した', sorted(外す), '学習', len(Y), '幅', w, '形', 横)

models = []
for s in range(網の数):
    torch.manual_seed(1000 + s)
    m = cmp.CNN(横, w).to(cmp.dev)
    opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=1e-4)
    巡 = 14; n = len(Y)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=巡 * math.ceil(n / 256))
    Xd, Fd, Yd = X.to(cmp.dev), Fx.to(cmp.dev), Y.to(cmp.dev)
    m.train()
    for e in range(巡):
        perm = torch.randperm(n, device=cmp.dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            loss = F.cross_entropy(m(cmp.正規化(cmp.増やす(Xd[j])), Fd[j]), Yd[j], label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    m.eval()
    models.append(m)
# 書き出した JSON を JS と同じ手順（int8 に丸めた重み）で読んだときと、PyTorch の答えがそろうかの見本を残す
with torch.no_grad():
    x = cmp.正規化(Rx[:20].to(cmp.dev))
    p = sum(F.softmax(m(x, torch.from_numpy(R形[使う][:20]).to(cmp.dev)), 1) for m in models) / len(models)
json.dump({'札': R札[使う][:20].tolist(), '確からしさ': p.cpu().numpy().round(4).tolist()}, open(出 + '.mihon.json', 'w'))
書き出す(models, 横, 32, Rmeta['種類'], 出)
print('書いた', 出, os.path.getsize(出), 'バイト')
