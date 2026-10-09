# 紙のマス（× と ○）を畳み込みの網で見分ける。用紙ごとに外して測る
#   python scripts/ocr-cells/cnn/kami_cnn.py [種の数]   （先に kami-dump.mjs）
import sys, os, json, math, time
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
import cmp  # 増やす・正規化 を板と同じにする（cmp は読み込むときに板のマスも読むので、data/ に書き出しておく）
ここ = os.path.dirname(os.path.abspath(__file__))
def 読む(名):
    m = json.load(open(os.path.join(ここ, 'kdata', 名 + '.json'), encoding='utf-8'))
    x = np.fromfile(os.path.join(ここ, 'kdata', 名 + '.u8'), dtype=np.uint8).reshape(-1, 1, 32, 32)
    return torch.from_numpy(x).float().div(255), torch.tensor(m['札'])
S = 読む('syn'); A = 読む('k0906'); B = 読む('k1001')
class 紙CNN(nn.Module):
    def __init__(self, w=8):
        super().__init__()
        self.c1 = nn.Conv2d(1, w, 3, padding=1); self.b1 = nn.BatchNorm2d(w)
        self.c2 = nn.Conv2d(w, w * 2, 3, padding=1); self.b2 = nn.BatchNorm2d(w * 2)
        self.c3 = nn.Conv2d(w * 2, w * 4, 3, padding=1); self.b3 = nn.BatchNorm2d(w * 4)
        self.f1 = nn.Linear(w * 4 * 16, 32); self.f2 = nn.Linear(32, 2); self.drop = nn.Dropout(0.3)
    def forward(self, x):
        x = F.max_pool2d(F.relu(self.b1(self.c1(x))), 2)
        x = F.max_pool2d(F.relu(self.b2(self.c2(x))), 2)
        x = F.max_pool2d(F.relu(self.b3(self.c3(x))), 2)
        return self.f2(self.drop(F.relu(self.f1(x.flatten(1)))))
def 学ぶ(X, Y, 種, w=8, 巡=10):
    torch.manual_seed(種)
    m = 紙CNN(w).to(cmp.dev)
    opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=1e-4)
    n = len(Y); sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=巡 * math.ceil(n / 256))
    X, Y = X.to(cmp.dev), Y.to(cmp.dev); m.train()
    for e in range(巡):
        perm = torch.randperm(n, device=cmp.dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            loss = F.cross_entropy(m(cmp.正規化(cmp.増やす(X[j]))), Y[j], label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    return m.eval()
@torch.no_grad()
def 測る(m, X, Y):
    p = F.softmax(m(cmp.正規化(X.to(cmp.dev))), 1).cpu()
    外 = [(int(i), round(float(p[i].max()), 2)) for i in np.where(p.argmax(1).numpy() != Y.numpy())[0]]
    return int((p.argmax(1) == Y).sum()), 外
種の数 = int(sys.argv[1]) if len(sys.argv) > 1 else 3
for w in [8, 12]:
    for 名, X, Y, 測りたち in [
        ('描いた紙だけ', S[0], S[1], [('9/6', A), ('10/1', B)]),
        ('描いた紙＋9/6', torch.cat([S[0]] + [A[0]] * 8), torch.cat([S[1]] + [A[1]] * 8), [('10/1', B)]),
        ('描いた紙＋10/1', torch.cat([S[0]] + [B[0]] * 8), torch.cat([S[1]] + [B[1]] * 8), [('9/6', A)]),
    ]:
        行 = []
        for s in range(種の数):
            m = 学ぶ(X, Y, 1000 + s, w)
            行.append(' '.join(f'{t}:{測る(m, *d)[0]}/{len(d[1])}{測る(m, *d)[1] if 測る(m, *d)[1] else ""}' for t, d in 測りたち))
        print(f'幅{w} {名}: ' + ' | '.join(行), flush=True)
