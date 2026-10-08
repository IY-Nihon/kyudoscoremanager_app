# 学習済みの小さな網（timm の MobileNetV3）を、入力の大きさを変えて板ごとに外して測る。
#   python cmp3.py 名前:辺 [種の数]   例: mobilenetv3_small_050:64
import sys, time, math
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
import timm
import cmp

class 借りた網(nn.Module):
    def __init__(self, 名前, 辺, 学習済み=True):
        super().__init__()
        self.m = timm.create_model(名前, pretrained=学習済み, num_classes=4)
        self.辺 = 辺
        cfg = self.m.pretrained_cfg
        self.register_buffer('mean', torch.tensor(cfg.get('mean', (0.485, 0.456, 0.406))).view(1, 3, 1, 1))
        self.register_buffer('std', torch.tensor(cfg.get('std', (0.229, 0.224, 0.225))).view(1, 3, 1, 1))
    def forward(self, 画, 形):
        x = F.interpolate(画, size=self.辺, mode='bilinear', align_corners=False).repeat(1, 3, 1, 1)
        return self.m((x - self.mean) / self.std)

def 学ぶ(名前, 辺, 画, 形, 札, 種, 巡=6, 学習済み=True):
    torch.manual_seed(種)
    model = 借りた網(名前, 辺, 学習済み).to(cmp.dev)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    n = len(札)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=1e-3, total_steps=巡 * math.ceil(n / 256))
    画 = 画.to(cmp.dev); 形 = 形.to(cmp.dev); 札 = 札.to(cmp.dev)
    model.train()
    for e in range(巡):
        perm = torch.randperm(n, device=cmp.dev)
        for i in range(0, n, 256):
            j = perm[i:i + 256]
            loss = F.cross_entropy(model(cmp.正規化(cmp.増やす(画[j])), 形[j]), 札[j], label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    model.eval()
    return model

@torch.no_grad()
def 見分ける(model, 画, 形, ずらす):
    画 = 画.to(cmp.dev); 形 = 形.to(cmp.dev)
    if not ずらす:
        return F.softmax(model(cmp.正規化(画), 形), 1)
    合 = 0
    for dx, dy in [(0, 0), (2, 0), (-2, 0), (0, 2), (0, -2)]:
        合 = 合 + F.softmax(model(cmp.正規化(torch.roll(画, shifts=(dy, dx), dims=(2, 3))), 形), 1)
    return 合 / 5

if __name__ == '__main__':
    名前, 辺 = sys.argv[1].split(':'); 辺 = int(辺)
    種の数 = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    学習済み = '素' not in sys.argv
    Sx, Sf, Sy = cmp.画にする(cmp.S画), torch.from_numpy(cmp.S形), torch.from_numpy(cmp.S札)
    Rx, Rf, Ry = cmp.画にする(cmp.R画), torch.from_numpy(cmp.R形), torch.from_numpy(cmp.R札)
    種類 = cmp.Rmeta['種類']
    t0 = time.time()
    for ずらす in [False, True]:
        globals()['_'] = None
    合計 = {False: 0, True: 0}; 数計 = 0; 行 = []; 外れ = []
    for g in cmp.組たち:
        外 = cmp.R組 == g; 内 = ~外
        X = torch.cat([Sx] + [Rx[内]] * 8); Fx = torch.cat([Sf] + [Rf[内]] * 8); Y = torch.cat([Sy] + [Ry[内]] * 8)
        p = {False: 0, True: 0}
        for s in range(種の数):
            m = 学ぶ(名前, 辺, X, Fx, Y, 1000 + s, 学習済み=学習済み)
            for z in (False, True):
                p[z] = p[z] + 見分ける(m, Rx[外], Rf[外], z).cpu()
        数計 += int(外.sum())
        for z in (False, True):
            読 = p[z].argmax(1).numpy()
            合計[z] += int((読 == cmp.R札[外]).sum())
            if not z:
                行.append(f'{g}:{int((読 == cmp.R札[外]).sum())}/{int(外.sum())}')
                for k, i in enumerate(np.where(外)[0]):
                    if 読[k] != cmp.R札[i]:
                        mm = cmp.Rmeta['札'][i]
                        外れ.append(f'{g} {mm["写真"][:14]} 板{mm["板"]} 列{mm["列"]} 行{mm["行"]} 正{種類[cmp.R札[i]]} 読{種類[読[k]]} 点{p[z][k].max() / 種の数:.2f}')
    print(f'{名前}@{辺}{"" if 学習済み else "（素）"}: 1回読み {合計[False]}/{数計} = {100 * 合計[False] / 数計:.2f}%  ずらし5回 {合計[True]}/{数計} = {100 * 合計[True] / 数計:.2f}%  ({time.time() - t0:.0f}秒)  ' + ' '.join(行), flush=True)
    for s in 外れ: print('   ', s)
