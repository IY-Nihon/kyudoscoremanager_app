# MobileNet を小さくした形と、いまの CNN との組み合わせを、板ごとに外して測る。
#   python mb.py 候補,候補,... [種の数]   （SEEDS=1,2,3,4 で種を選ぶ。HI=1 で日ごとに外す。DATA32=1 でアプリと同じ 32×32 の切り抜き）
# 候補：CNN（いまの形）／ mb96 mb64（全部・元の頭）／ mb96s mb64s（頭を小さく）／ mb96t9 mb64t9（9 段目で切る）
# 外した板ごとの確からしさを probs/<候補>-<種>.npy に、網を models/ に残す（組み合わせは mb_kumiawase.py で数える）
import sys, os, time, math, json
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
import cmp
import torchvision

ここ = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ここ, 'probs'), exist_ok=True)

class MB(nn.Module):
    def __init__(self, 辺=96, 切り=13, 頭='元'):
        super().__init__()
        m = torchvision.models.mobilenet_v3_small(weights=torchvision.models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
        self.辺 = 辺
        self.features = m.features[:切り]
        出 = self.features[-1].out_channels if hasattr(self.features[-1], 'out_channels') else [x for x in self.features[-1].modules() if isinstance(x, nn.Conv2d)][-1].out_channels
        if 頭 == '元' and 切り == 13:
            m.classifier[3] = nn.Linear(m.classifier[3].in_features, 4)
            self.classifier = m.classifier
        else:
            self.classifier = nn.Sequential(nn.Linear(出, 128), nn.Hardswish(), nn.Dropout(0.2), nn.Linear(128, 4))
        self.register_buffer('mean', torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1))
        self.register_buffer('std', torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1))
    def forward(self, 画, 形=None):
        x = F.interpolate(画, size=self.辺, mode='bilinear', align_corners=False).repeat(1, 3, 1, 1)
        x = self.features((x - self.mean) / self.std)
        return self.classifier(F.adaptive_avg_pool2d(x, 1).flatten(1))

def 作る(候補, 横):
    if 候補 == 'CNN': return cmp.CNN(横, 12)
    辺 = int(候補[2:4])
    頭 = '小' if 候補.endswith('s') else '元'
    切り = int(候補.split('t')[1]) if 't' in 候補 else 13
    return MB(辺, 切り, 頭)

def 数える(m):
    # 1 マスの掛け算の回数と、重みの数
    macs = [0]
    def 鉤(mod, i, o):
        if isinstance(mod, nn.Conv2d):
            macs[0] += o.numel() // o.shape[0] * (mod.in_channels // mod.groups) * mod.kernel_size[0] * mod.kernel_size[1]
        elif isinstance(mod, nn.Linear):
            macs[0] += mod.in_features * mod.out_features
    hs = [x.register_forward_hook(鉤) for x in m.modules() if isinstance(x, (nn.Conv2d, nn.Linear))]
    with torch.no_grad(): m.eval()(torch.rand(1, 1, 32, 32), torch.rand(1, 492))
    for h in hs: h.remove()
    return macs[0], sum(p.numel() for p in m.parameters())

def 学ぶ(候補, 横, X, Fx, Y, 種):
    torch.manual_seed(種)
    m = 作る(候補, 横).to(cmp.dev)
    巡 = 14 if 候補 == 'CNN' else 6
    lr = 2e-3 if 候補 == 'CNN' else 1e-3
    opt = torch.optim.AdamW(m.parameters(), lr=lr, weight_decay=1e-4)
    n = len(Y)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=lr, total_steps=巡 * math.ceil(n / 256))
    X, Fx, Y = X.to(cmp.dev), Fx.to(cmp.dev), Y.to(cmp.dev)
    m.train()
    for e in range(巡):
        perm = torch.randperm(n, device=cmp.dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            loss = F.cross_entropy(m(cmp.正規化(cmp.増やす(X[j])), Fx[j]), Y[j], label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    return m.eval()

def int8にする(m, ビット=8):
    # 重みを出力の列ごとに int8（ビット数を変えられる）に丸めて戻す（JS で読むのと同じ丸め）
    上 = 2 ** (ビット - 1) - 1
    with torch.no_grad():
        for x in m.modules():
            if isinstance(x, (nn.Conv2d, nn.Linear)):
                w = x.weight
                s = w.abs().flatten(1).amax(1).clamp_min(1e-8) / 上
                s = s.view(-1, *([1] * (w.dim() - 1)))
                w.copy_((w / s).round().clamp(-上, 上) * s)
    return m

if __name__ == '__main__':
    候補たち = sys.argv[1].split(',')
    種の数 = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    Sx, Sf, Sy = cmp.画にする(cmp.S画), torch.from_numpy(cmp.S形), torch.from_numpy(cmp.S札)
    Rx, Rf, Ry = cmp.画にする(cmp.R画), torch.from_numpy(cmp.R形), torch.from_numpy(cmp.R札)
    R札 = cmp.R札
    if os.environ.get('DATA32'):
        # アプリと同じ切り抜き（32×32 の 縮める）で学び、測る（本番の学び方 prod.py と同じ）
        a画, a形, a札, a組, _, _ = cmp.読む('real32'); b画, b形, b札, _, _, _ = cmp.読む('syn32')
        assert (a組 == cmp.R組).all() and (a札 == cmp.R札).all()
        Rx = torch.from_numpy(a画).float().div(255).unsqueeze(1); Rf = torch.from_numpy(a形); Ry = torch.from_numpy(a札)
        Sx = torch.from_numpy(b画).float().div(255).unsqueeze(1); Sf = torch.from_numpy(b形); Sy = torch.from_numpy(b札)
    横 = Sf.shape[1] - 400
    # HI=1 … 日（部）ごとにまとめて外す（初めての部の板に近い測り方）
    日ごと = bool(os.environ.get('HI'))
    R組 = np.array([g[:5] for g in cmp.R組]) if 日ごと else cmp.R組
    組たち = sorted(set(R組.tolist()))
    尾 = ('-hi' if 日ごと else '') + ('-32' if os.environ.get('DATA32') else '')
    種たち = [int(x) for x in os.environ['SEEDS'].split(',')] if os.environ.get('SEEDS') else range(種の数)
    for 候補 in 候補たち:
        macs, 重み数 = 数える(作る(候補, 横))
        for s in 種たち:
            t0 = time.time()
            P = np.zeros((len(Ry), 4), np.float32); Pq = np.zeros((len(Ry), 4), np.float32)
            P6 = np.zeros((len(Ry), 4), np.float32); P4 = np.zeros((len(Ry), 4), np.float32)
            os.makedirs(os.path.join(ここ, 'models'), exist_ok=True)
            for g in 組たち:
                外 = R組 == g; 内 = ~外
                X = torch.cat([Sx] + [Rx[内]] * 8); Fx = torch.cat([Sf] + [Rf[内]] * 8); Y = torch.cat([Sy] + [Ry[内]] * 8)
                m = 学ぶ(候補, 横, X, Fx, Y, 1000 + s)
                with torch.no_grad():
                    x = cmp.正規化(Rx[外].to(cmp.dev)); f = Rf[外].to(cmp.dev)
                    P[外] = F.softmax(m(x, f), 1).cpu().numpy()
                    torch.save(m.state_dict(), os.path.join(ここ, 'models', f'{候補}-{s}{尾}-{g}.pt'))
                    import copy
                    P6[外] = F.softmax(int8にする(copy.deepcopy(m), 6)(x, f), 1).cpu().numpy()
                    P4[外] = F.softmax(int8にする(copy.deepcopy(m), 4)(x, f), 1).cpu().numpy()
                    Pq[外] = F.softmax(int8にする(m)(x, f), 1).cpu().numpy()
            np.save(os.path.join(ここ, 'probs', f'{候補}-{s}{尾}.npy'), P)
            np.save(os.path.join(ここ, 'probs', f'{候補}-{s}{尾}-int8.npy'), Pq)
            np.save(os.path.join(ここ, 'probs', f'{候補}-{s}{尾}-int6.npy'), P6)
            np.save(os.path.join(ここ, 'probs', f'{候補}-{s}{尾}-int4.npy'), P4)
            合6 = int((P6.argmax(1) == cmp.R札).sum()); 合4 = int((P4.argmax(1) == cmp.R札).sum())
            合 = int((P.argmax(1) == cmp.R札).sum()); 合q = int((Pq.argmax(1) == cmp.R札).sum())
            外れ = [(R組[i], int(cmp.R札[i]), int(P[i].argmax()), round(float(P[i].max()), 2)) for i in np.where(P.argmax(1) != cmp.R札)[0]]
            print(f'{候補} 種{s}: {合}/{len(Ry)}  int8 {合q} int6 {合6} int4 {合4}  掛け算 {macs / 1e6:.2f}M 重み {重み数 / 1e6:.2f}M  ({time.time() - t0:.0f}秒)  外れ {外れ}', flush=True)
