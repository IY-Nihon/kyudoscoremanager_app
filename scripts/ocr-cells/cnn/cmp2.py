# D（MobileNet）の強さを小さな網に移せるか。板ごとに外して測る。
#   python cmp2.py [E,K] [種の数]
#   E … 幅を倍にした CNN（w=32）
#   K … 小さな CNN（B と同じ大きさ）を、D の答え（柔らかい確からしさ）にも合わせて学ばせる（蒸留）
import sys, time, math
import numpy as np
import torch, torch.nn.functional as F
import cmp

def 学ぶ_蒸留(先生, 画, 形, 札, 種, 巡=14, T=2.0, 重み=0.7, w=16, 横=0):
    torch.manual_seed(種)
    model = cmp.CNN(横, w).to(cmp.dev)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    n = len(札)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=巡 * math.ceil(n / 256))
    画 = 画.to(cmp.dev); 形 = 形.to(cmp.dev); 札 = 札.to(cmp.dev)
    先生.eval()
    model.train()
    for e in range(巡):
        perm = torch.randperm(n, device=cmp.dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            x = cmp.正規化(cmp.増やす(画[j]))
            with torch.no_grad():
                t = F.softmax(先生(x, 形[j]) / T, 1)
            o = model(x, 形[j])
            loss = (1 - 重み) * F.cross_entropy(o, 札[j], label_smoothing=0.05) + 重み * T * T * F.kl_div(F.log_softmax(o / T, 1), t, reduction='batchmean')
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    model.eval()
    return model

def 測る(候補たち, 種の数):
    Sx, Sf, Sy = cmp.画にする(cmp.S画), torch.from_numpy(cmp.S形), torch.from_numpy(cmp.S札)
    Rx, Rf, Ry = cmp.画にする(cmp.R画), torch.from_numpy(cmp.R形), torch.from_numpy(cmp.R札)
    種類 = cmp.Rmeta['種類']
    for 候補 in 候補たち:
        t0 = time.time(); 合計 = 数計 = 0; 行 = []; 外れ = []
        for g in cmp.組たち:
            外 = cmp.R組 == g; 内 = ~外
            X = torch.cat([Sx] + [Rx[内]] * 8); Fx = torch.cat([Sf] + [Rf[内]] * 8); Y = torch.cat([Sy] + [Ry[内]] * 8)
            p = 0
            for s in range(種の数):
                if 候補 == 'E':
                    torch.manual_seed(1000 + s)
                    m = cmp.CNN(0, 32).to(cmp.dev)
                    # cmp.学ぶ と同じ手順で、網だけ差し替える
                    opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=1e-4)
                    n = len(Y); 巡 = 14
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
                    p = p + cmp.見分ける(m, 'B', Rx[外], Rf[外]).cpu()
                else:
                    先生 = cmp.学ぶ('D', X, Fx, Y, 2000 + s)
                    m = 学ぶ_蒸留(先生, X, Fx, Y, 1000 + s)
                    p = p + cmp.見分ける(m, 'B', Rx[外], Rf[外]).cpu()
            読 = p.argmax(1).numpy()
            合 = int((読 == cmp.R札[外]).sum()); 数 = int(外.sum())
            合計 += 合; 数計 += 数; 行.append(f'{g}:{合}/{数}')
            for k, i in enumerate(np.where(外)[0]):
                if 読[k] != cmp.R札[i]:
                    mm = cmp.Rmeta['札'][i]
                    外れ.append(f'{g} {mm["写真"][:14]} 板{mm["板"]} 列{mm["列"]} 行{mm["行"]} 正{種類[cmp.R札[i]]} 読{種類[読[k]]}')
        print(f'{候補}: {合計}/{数計} = {100 * 合計 / 数計:.2f}%  ({time.time() - t0:.0f}秒)  ' + ' '.join(行), flush=True)
        for s in 外れ: print('   ', s)

if __name__ == '__main__':
    測る((sys.argv[1] if len(sys.argv) > 1 else 'E,K').split(','), int(sys.argv[2]) if len(sys.argv) > 2 else 1)
