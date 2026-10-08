# 学習した CNN（cmp.py の CNN）を、アプリで読む JSON に書き出す。
# 畳み込みの BatchNorm は重みに畳み込む（アプリでは掛け算と足し算だけにする）。
# 重みは層ごとに int8 に丸めて base64（scripts/ocr-cells/omomi.mjs の 丸める と同じ形）。
import base64, json
import numpy as np
import torch

def 丸める(a):
    a = np.asarray(a, dtype=np.float32).ravel()
    最大 = float(np.abs(a).max()) or 1.0
    目盛 = 最大 / 127
    粒 = np.clip(np.round(a / 目盛), -127, 127).astype(np.int8)
    return {'目盛': 目盛, '粒': base64.b64encode(粒.tobytes()).decode('ascii')}

def 畳み込みを畳む(conv, bn):
    w = conv.weight.detach().cpu().numpy().astype(np.float64)
    b = conv.bias.detach().cpu().numpy().astype(np.float64) if conv.bias is not None else np.zeros(w.shape[0])
    g = bn.weight.detach().cpu().numpy(); be = bn.bias.detach().cpu().numpy()
    mu = bn.running_mean.detach().cpu().numpy(); var = bn.running_var.detach().cpu().numpy()
    s = g / np.sqrt(var + bn.eps)
    return (w * s[:, None, None, None]).astype(np.float32), ((b - mu) * s + be).astype(np.float32)

def 書き出す(models, 横の入, 辺, 種類, 道):
    網たち = []
    for m in models:
        m = m.cpu().eval()
        層 = []
        for c, bn in [(m.c1, m.b1), (m.c2, m.b2), (m.c3, m.b3)]:
            w, b = 畳み込みを畳む(c, bn)
            層.append({'種': '畳み', '入': int(w.shape[1]), '出': int(w.shape[0]), 'W': 丸める(w), 'b': b.tolist()})
        層.append({'種': '全', '入': int(m.f1.in_features), '出': int(m.f1.out_features), 'W': 丸める(m.f1.weight.detach().numpy()), 'b': m.f1.bias.detach().numpy().tolist()})
        層.append({'種': '全', '入': int(m.f2.in_features), '出': int(m.f2.out_features), 'W': 丸める(m.f2.weight.detach().numpy()), 'b': m.f2.bias.detach().numpy().tolist()})
        網たち.append({'層': 層})
    json.dump({'形': 'CNN', '辺': 辺, '横の入': 横の入, '種類': 種類, 'ずらし': [[0, 0]], '網たち': 網たち}, open(道, 'w', encoding='utf-8'), ensure_ascii=False)
