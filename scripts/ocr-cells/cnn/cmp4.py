# 端末で速く動く大きさの CNN（幅 8・12・16、形の特徴あり／なし）を、1 回読みと 5 回ずらしで比べる。
#   python cmp4.py [幅,...] [種の数]
import sys, time, math
import numpy as np
import torch, torch.nn.functional as F
import cmp

def 学ぶ(w, 横, X, Fx, Y, 種, 巡=14):
    torch.manual_seed(種)
    m = cmp.CNN(横, w).to(cmp.dev)
    opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=1e-4)
    n = len(Y)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=巡 * math.ceil(n / 256))
    X, Fx, Y = X.to(cmp.dev), Fx.to(cmp.dev), Y.to(cmp.dev)
    m.train()
    for e in range(巡):
        perm = torch.randperm(n, device=cmp.dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            loss = F.cross_entropy(m(cmp.正規化(cmp.増やす(X[j])), Fx[j]), Y[j], label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    m.eval()
    return m

if __name__ == '__main__':
    幅たち = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '8,12,16').split(',')]
    種の数 = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    Sx, Sf, Sy = cmp.画にする(cmp.S画), torch.from_numpy(cmp.S形), torch.from_numpy(cmp.S札)
    Rx, Rf, Ry = cmp.画にする(cmp.R画), torch.from_numpy(cmp.R形), torch.from_numpy(cmp.R札)
    for w in 幅たち:
        for 横 in (0, Sf.shape[1] - 400):
            t0 = time.time()
            合 = {'1回': 0, '5回': 0}; 数 = 0
            for g in cmp.組たち:
                外 = cmp.R組 == g; 内 = ~外
                X = torch.cat([Sx] + [Rx[内]] * 8); Fx = torch.cat([Sf] + [Rf[内]] * 8); Y = torch.cat([Sy] + [Ry[内]] * 8)
                p1 = 0; p5 = 0
                for s in range(種の数):
                    m = 学ぶ(w, 横, X, Fx, Y, 1000 + s)
                    p1 = p1 + cmp.見分ける(m, 'B', Rx[外], Rf[外], 揺らす=False).cpu()
                    p5 = p5 + cmp.見分ける(m, 'B', Rx[外], Rf[外], 揺らす=True).cpu()
                数 += int(外.sum())
                合['1回'] += int((p1.argmax(1).numpy() == cmp.R札[外]).sum())
                合['5回'] += int((p5.argmax(1).numpy() == cmp.R札[外]).sum())
            print(f'幅{w} {"形あり" if 横 else "形なし"} 網{種の数}: 1回読み {合["1回"]}/{数} = {100 * 合["1回"] / 数:.2f}%  5回ずらし {合["5回"]}/{数} = {100 * 合["5回"] / 数:.2f}%  ({time.time() - t0:.0f}秒)', flush=True)
