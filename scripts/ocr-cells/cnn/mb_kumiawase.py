# mb.py が残した確からしさから、単独と組み合わせ（CNN が迷ったマスだけ MobileNet に回す）を数える
#   python mb_kumiawase.py 候補,候補 [尾（int8 など）] [CNN の尾]
import sys, os, glob, json
import numpy as np
ここ = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(ここ, 'data')
meta = json.load(open(os.path.join(D, 'real.json'), encoding='utf-8'))
札 = np.array([s['札'] for s in meta['札']]); 組 = np.array([s['組'] for s in meta['札']])
種類 = meta['種類']
尾 = '-' + sys.argv[2] if len(sys.argv) > 2 else ''
Cの尾 = '-' + sys.argv[3] if len(sys.argv) > 3 else 尾
import re
def 読む辞書(c, 尾=尾):
    return {int(re.search(r'-(\d)' + re.escape(尾) + r'\.npy$', f).group(1)): np.load(f) for f in glob.glob(os.path.join(ここ, 'probs', f'{c}-[0-9]{尾}.npy'))}
C辞 = 読む辞書('CNN', Cの尾)
C = [C辞[k] for k in sorted(C辞)]
print('CNN', [int((p.argmax(1) == 札).sum()) for p in C], '/', len(札))
for p in C:
    i = np.where(p.argmax(1) != 札)[0]
    print('  CNN の外れ', [(組[k], 種類[札[k]], 種類[p[k].argmax()], round(float(p[k].max()), 3)) for k in i])
    print('  CNN の確からしさの分布：0.9 未満', int((p.max(1) < 0.9).sum()), ' 0.95 未満', int((p.max(1) < 0.95).sum()), ' 0.99 未満', int((p.max(1) < 0.99).sum()))
for c in sys.argv[1].split(','):
    M辞 = 読む辞書(c)
    共 = sorted(set(M辞) & set(C辞))
    if not 共: continue
    M = [M辞[k] for k in 共]
    Cs = [C辞[k] for k in 共]
    print(c, '種', 共)
    print(c, '単独', [int((p.argmax(1) == 札).sum()) for p in M], ' 外れ', [[(組[k], 種類[札[k]], 種類[p[k].argmax()], round(float(p[k].max()), 2)) for k in np.where(p.argmax(1) != 札)[0]] for p in M])
    for t in [0.8, 0.9, 0.95, 0.99]:
        行 = []
        for pc, pm in zip(Cs, M):
            迷 = pc.max(1) < t
            替 = np.where(迷[:, None], pm, pc)
            平 = np.where(迷[:, None], (pm + pc) / 2, pc)
            行.append(f'回す{int(迷.sum())} 替え{int((替.argmax(1) == 札).sum())} 平均{int((平.argmax(1) == 札).sum())}')
        print(f'  CNN が {t} 未満なら {c}：', ' / '.join(行))
    print('  全部を平均：', [int((((pc + pm) / 2).argmax(1) == 札).sum()) for pc, pm in zip(Cs, M)])
