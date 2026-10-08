# マスの見分け方を、板ごとに外して測る（leave-one-board-out）。
#   python cmp.py [候補 A,B,C,D] [種の数]
# 学習：描いた板の全部 ＋ 外した板以外の本物（本物は 8 回ずつ混ぜる。いまの学習と同じ）
# 測る：外した板の本物だけ
import json, os, sys, time, math, random
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F

ここ = os.path.dirname(os.path.abspath(__file__))
D = os.environ.get('CNN_DATA') or os.path.join(ここ, 'data')
dev = 'cuda'

def 読む(名):
    meta = json.load(open(os.path.join(D, 名 + '.json'), encoding='utf-8'))
    辺, 入 = meta['辺'], meta['入']
    画 = np.fromfile(os.path.join(D, 名 + '.u8'), dtype=np.uint8).reshape(-1, 辺, 辺)
    形 = np.fromfile(os.path.join(D, 名 + '.f32'), dtype=np.float32).reshape(-1, 入)
    札 = np.array([s['札'] for s in meta['札']], dtype=np.int64)
    組 = np.array([s['組'] for s in meta['札']])
    アプリ = np.array([s.get('アプリ', -1) for s in meta['札']], dtype=np.int64)
    return 画, 形, 札, 組, アプリ, meta

R画, R形, R札, R組, Rアプリ, Rmeta = 読む('real')
S画, S形, S札, _, _, _ = 読む('syn')
組たち = sorted(set(R組.tolist()))
print('本物', len(R札), '描いた', len(S札), '組', 組たち)

# ── 増やし方（CNN 用）：ずらし・拡大縮小・回し・太さ・明るさ・ぼかし ──
def 増やす(x):
    # x: (B,1,H,W) 0..1（1 が白）
    B = x.shape[0]
    ang = (torch.rand(B, device=x.device) - 0.5) * 2 * math.radians(8)
    sc = 1 + (torch.rand(B, device=x.device) - 0.5) * 0.3
    tx = (torch.rand(B, device=x.device) - 0.5) * 0.24
    ty = (torch.rand(B, device=x.device) - 0.5) * 0.24
    cos, sin = torch.cos(ang) / sc, torch.sin(ang) / sc
    theta = torch.stack([torch.stack([cos, -sin, tx], 1), torch.stack([sin, cos, ty], 1)], 1)
    grid = F.affine_grid(theta, x.shape, align_corners=False)
    y = F.grid_sample(x, grid, padding_mode='border', align_corners=False)
    # 線の太さ：暗い所を広げる（min）か狭める（max）
    k = torch.rand(B, device=x.device)
    太 = -F.max_pool2d(-y, 3, 1, 1)
    細 = F.max_pool2d(y, 3, 1, 1)
    y = torch.where((k < 0.2)[:, None, None, None], 太, torch.where((k > 0.85)[:, None, None, None], 細, y))
    # 明るさ・締まり
    a = 0.7 + torch.rand(B, 1, 1, 1, device=x.device) * 0.6
    b = (torch.rand(B, 1, 1, 1, device=x.device) - 0.5) * 0.3
    y = ((y - 0.5) * a + 0.5 + b).clamp(0, 1)
    # ざらつき
    y = (y + torch.randn_like(y) * 0.04 * (torch.rand(B, 1, 1, 1, device=x.device) < 0.5)).clamp(0, 1)
    return y

def 正規化(x):
    # 切り抜きごとに明るさをそろえる（白板の照り返し・紙の色の違い）
    lo = x.amin(dim=(2, 3), keepdim=True)
    hi = x.amax(dim=(2, 3), keepdim=True)
    return (x - lo) / (hi - lo + 1e-3)

class MLP(nn.Module):
    def __init__(self, 入, 隠れ=96):
        super().__init__()
        self.a = nn.Linear(入, 隠れ); self.b = nn.Linear(隠れ, 4)
    def forward(self, 画, 形):
        return self.b(F.relu(self.a(形)))

class CNN(nn.Module):
    def __init__(self, 横の入=0, w=16):
        super().__init__()
        self.c1 = nn.Conv2d(1, w, 3, padding=1); self.b1 = nn.BatchNorm2d(w)
        self.c2 = nn.Conv2d(w, w * 2, 3, padding=1); self.b2 = nn.BatchNorm2d(w * 2)
        self.c3 = nn.Conv2d(w * 2, w * 4, 3, padding=1); self.b3 = nn.BatchNorm2d(w * 4)
        self.横 = 横の入
        self.f1 = nn.Linear(w * 4 * 16 + 横の入, 64); self.f2 = nn.Linear(64, 4)
        self.drop = nn.Dropout(0.3)
    def forward(self, 画, 形):
        x = F.max_pool2d(F.relu(self.b1(self.c1(画))), 2)   # 32→16
        x = F.max_pool2d(F.relu(self.b2(self.c2(x))), 2)    # 16→8
        x = F.max_pool2d(F.relu(self.b3(self.c3(x))), 2)    # 8→4
        x = x.flatten(1)
        if self.横: x = torch.cat([x, 形[:, 400:]], 1)
        return self.f2(self.drop(F.relu(self.f1(x))))

class MobileNet(nn.Module):
    def __init__(self):
        super().__init__()
        import torchvision
        m = torchvision.models.mobilenet_v3_small(weights=torchvision.models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
        m.classifier[3] = nn.Linear(m.classifier[3].in_features, 4)
        self.m = m
        self.register_buffer('mean', torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1))
        self.register_buffer('std', torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1))
    def forward(self, 画, 形):
        x = F.interpolate(画, size=96, mode='bilinear', align_corners=False).repeat(1, 3, 1, 1)
        return self.m((x - self.mean) / self.std)

def 作る(候補, 入):
    if 候補 == 'A': return MLP(入)
    if 候補 == 'B': return CNN(0)
    if 候補 == 'C': return CNN(入 - 400)
    if 候補 == 'D': return MobileNet()

def 画にする(u8):
    x = torch.from_numpy(u8).float().div(255).unsqueeze(1)
    return F.interpolate(x, size=32, mode='bilinear', align_corners=False)

def 学ぶ(候補, 画, 形, 札, 種, 巡=None):
    torch.manual_seed(種); np.random.seed(種); random.seed(種)
    model = 作る(候補, 形.shape[1]).to(dev)
    巡 = 巡 or {'A': 12, 'B': 12, 'C': 12, 'D': 6}[候補]
    opt = torch.optim.AdamW(model.parameters(), lr={'A': 2e-3, 'B': 2e-3, 'C': 2e-3, 'D': 1e-3}[候補], weight_decay=1e-4)
    n = len(札)
    steps = 巡 * math.ceil(n / 256)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=opt.param_groups[0]['lr'], total_steps=steps)
    画 = 画.to(dev); 形 = 形.to(dev); 札 = 札.to(dev)
    model.train()
    for e in range(巡):
        perm = torch.randperm(n, device=dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            x = 画[j]
            if 候補 != 'A': x = 正規化(増やす(x))
            loss = F.cross_entropy(model(x, 形[j]), 札[j], label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    model.eval()
    return model

@torch.no_grad()
def 見分ける(model, 候補, 画, 形, 揺らす=True):
    画 = 画.to(dev); 形 = 形.to(dev)
    if 候補 == 'A' or not 揺らす:
        x = 画 if 候補 == 'A' else 正規化(画)
        return F.softmax(model(x, 形), 1)
    # 少しずつずらして何度も読み、平均する（TTA）
    合 = 0
    for dx, dy in [(0, 0), (2, 0), (-2, 0), (0, 2), (0, -2)]:
        x = torch.roll(画, shifts=(dy, dx), dims=(2, 3))
        合 = 合 + F.softmax(model(正規化(x), 形), 1)
    return 合 / 5

def 測る(候補たち, 種の数):
    Sx, Sf, Sy = 画にする(S画), torch.from_numpy(S形), torch.from_numpy(S札)
    Rx, Rf, Ry = 画にする(R画), torch.from_numpy(R形), torch.from_numpy(R札)
    結果 = {}
    for 候補 in 候補たち:
        t0 = time.time()
        合計, 数計 = 0, 0
        行 = []
        for g in 組たち:
            外 = R組 == g
            内 = ~外
            重ね = 8
            X = torch.cat([Sx] + [Rx[内]] * 重ね); Fx = torch.cat([Sf] + [Rf[内]] * 重ね); Y = torch.cat([Sy] + [Ry[内]] * 重ね)
            p = 0
            for s in range(種の数):
                m = 学ぶ(候補, X, Fx, Y, 1000 + s)
                p = p + 見分ける(m, 候補, Rx[外], Rf[外]).cpu()
            読 = p.argmax(1).numpy()
            合 = int((読 == R札[外]).sum()); 数 = int(外.sum())
            合計 += 合; 数計 += 数
            行.append(f'{g}:{合}/{数}')
        結果[候補] = (合計, 数計)
        print(f'{候補}: {合計}/{数計} = {100 * 合計 / 数計:.2f}%  ({time.time() - t0:.0f}秒)  ' + ' '.join(行), flush=True)
    # いまのアプリ（学習に本物を使った網＋決まり 3 つ）。外した測りではない（参考）
    アプリ合 = int((Rアプリ == R札).sum())
    行 = ' '.join(f'{g}:{int(((Rアプリ == R札) & (R組 == g)).sum())}/{int((R組 == g).sum())}' for g in 組たち)
    print(f'いまのアプリ（参考・外していない）: {アプリ合}/{len(R札)} = {100 * アプリ合 / len(R札):.2f}%  {行}')
    return 結果

if __name__ == '__main__':
    候補たち = (sys.argv[1] if len(sys.argv) > 1 else 'A,B,C,D').split(',')
    種の数 = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    測る(候補たち, 種の数)

def 外れを見る(候補, 種の数=1):
    Sx, Sf, Sy = 画にする(S画), torch.from_numpy(S形), torch.from_numpy(S札)
    Rx, Rf, Ry = 画にする(R画), torch.from_numpy(R形), torch.from_numpy(R札)
    種類 = Rmeta['種類']
    for g in 組たち:
        外 = R組 == g; 内 = ~外
        X = torch.cat([Sx] + [Rx[内]] * 8); Fx = torch.cat([Sf] + [Rf[内]] * 8); Y = torch.cat([Sy] + [Ry[内]] * 8)
        p = 0
        for s in range(種の数):
            p = p + 見分ける(学ぶ(候補, X, Fx, Y, 1000 + s), 候補, Rx[外], Rf[外]).cpu()
        p = p / 種の数
        読 = p.argmax(1).numpy()
        idx = np.where(外)[0]
        for k, i in enumerate(idx):
            if 読[k] != R札[i]:
                m = Rmeta['札'][i]
                print(f'  {候補} {g} {m["写真"][:14]} 板{m["板"]} 列{m["列"]} 行{m["行"]} 正{種類[R札[i]]} 読{種類[読[k]]} 点{p[k].max():.2f} アプリ{種類[Rアプリ[i]] if Rアプリ[i] >= 0 else "空"}')
