# mb.MB（何枚でも）を scripts/ocr-cells/mobilenet.mjs の .bin に書き出す。
# 形：[頭の長さ uint32 LE][頭 JSON（UTF-8）][0 で 2 の倍数にそろえる][重み float16 LE の並び]
# 頭の 重み・偏り は {at: 並びの何番目から, n: 数}。BatchNorm は畳み込みへ畳み、最初の畳み込みには色の平均と幅を畳む。
import json, struct
import numpy as np
import torch, torch.nn as nn
from torchvision.ops.misc import SqueezeExcitation
from torchvision.models.mobilenetv3 import InvertedResidual

class 並び:
    def __init__(self): self.部 = []; self.数 = 0
    def 足す(self, a):
        a = np.asarray(a, dtype=np.float64).reshape(-1)
        at = self.数; self.部.append(a.astype(np.float16)); self.数 += a.size
        return {'at': at, 'n': int(a.size)}

def 活の名(mods):
    for m in mods:
        if isinstance(m, nn.ReLU): return 'relu'
        if isinstance(m, nn.Hardswish): return 'hs'
    return ''

def 畳みを畳む(seq, 並, 色=None):
    c, bn = seq[0], seq[1]
    w = c.weight.detach().double().cpu()
    sc = (bn.weight.detach().double() / torch.sqrt(bn.running_var.double() + bn.eps)).cpu()
    b = (bn.bias.detach().double() - bn.running_mean.double() * bn.weight.detach().double() / torch.sqrt(bn.running_var.double() + bn.eps)).cpu()
    w = w * sc.view(-1, 1, 1, 1)
    l = {'種': '畳み', '入': c.in_channels, '出': c.out_channels, '核': c.kernel_size[0], '歩': c.stride[0], '群': c.groups, '活': 活の名(list(seq)[2:])}
    if 色 is not None:
        mean, std = 色
        端 = -(w * (mean / std).view(1, 3, 1, 1)).sum(1)
        w = (w / std.view(1, 3, 1, 1)).sum(1, keepdim=True)
        l['入'] = 1
        l['端'] = 並.足す(端.numpy())
    l['W'] = 並.足す(w.numpy()); l['b'] = 並.足す(b.numpy())
    return l

def SEを書く(se, 並):
    return {'種': 'SE', '入': se.fc1.in_channels, '中': se.fc1.out_channels,
            'W1': 並.足す(se.fc1.weight.detach().cpu().numpy()), 'b1': 並.足す(se.fc1.bias.detach().cpu().numpy()),
            'W2': 並.足す(se.fc2.weight.detach().cpu().numpy()), 'b2': 並.足す(se.fc2.bias.detach().cpu().numpy())}

def 網を書く(model, 並):
    model = model.cpu().eval()
    層 = []
    for k, f in enumerate(model.features):
        if isinstance(f, InvertedResidual):
            内 = [SEを書く(m, 並) if isinstance(m, SqueezeExcitation) else 畳みを畳む(m, 並) for m in f.block]
            層.append({'種': '塊', '足す': bool(f.use_res_connect), '層': 内})
        else:
            層.append(畳みを畳む(f, 並, (model.mean.view(3).double().cpu(), model.std.view(3).double().cpu()) if k == 0 else None))
    層.append({'種': '平均'})
    mods = list(model.classifier)
    for i, L in enumerate(mods):
        if not isinstance(L, nn.Linear): continue
        活 = 'hs' if i + 1 < len(mods) and isinstance(mods[i + 1], nn.Hardswish) else ''
        層.append({'種': '全', '入': L.in_features, '出': L.out_features, 'W': 並.足す(L.weight.detach().cpu().numpy()), 'b': 並.足す(L.bias.detach().cpu().numpy()), '活': 活})
    return 層

def 書き出す(models, 道, 種類, 辺=32, 迷いの境=0.9):
    並 = 並び()
    網たち = [網を書く(m, 並) for m in models]
    頭 = json.dumps({'形': '薄い', '辺': 辺, '中の辺': models[0].辺, '種類': 種類, '迷いの境': 迷いの境, '網たち': 網たち}, ensure_ascii=False).encode('utf-8')
    if (4 + len(頭)) % 2: 頭 += b' '
    with open(道, 'wb') as f:
        f.write(struct.pack('<I', len(頭))); f.write(頭)
        f.write(np.concatenate(並.部).astype('<f2').tobytes())
