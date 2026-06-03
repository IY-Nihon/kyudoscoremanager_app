import subprocess
import re
import os

# 整形してdiffを取る関数
def get_clean_diff(file_path):
    # GitのHEADでのファイル内容を取得
    try:
        head_content = subprocess.check_output(['git', 'show', f'HEAD:{file_path}'], stderr=subprocess.DEVNULL).decode('utf-8')
    except Exception:
        # コミットされていない新規ファイルなどの場合
        head_content = ""
        
    # 現在のファイル内容を取得
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            current_content = f.read()
    else:
        current_content = ""

    # ミニファイされたJSを大雑把に改行を入れて整形する簡易フォーマッタ
    def format_code(code):
        # セミコロンや波括弧の後に改行を入れる
        formatted = code.replace(';', ';\n')
        formatted = formatted.replace('{', '{\n')
        formatted = formatted.replace('}', '}\n')
        formatted = formatted.replace(',', ',\n')
        return formatted

    head_fmt = format_code(head_content)
    curr_fmt = format_code(current_content)

    head_lines = head_fmt.splitlines()
    curr_lines = curr_fmt.splitlines()

    # 行数が違う部分や異なる部分を簡易的に比較
    import difflib
    diff = difflib.unified_diff(
        head_lines, curr_lines, 
        fromfile=f'HEAD:{file_path}', 
        tofile=f'WORKING:{file_path}',
        n=1 # 前後1行のコンテキスト
    )
    
    # 差分を最大100行まで取得
    diff_lines = list(diff)
    print(f"=== Diff for {file_path} (Showing first 50 differences) ===")
    count = 0
    for line in diff_lines:
        if line.startswith('+') or line.startswith('-') or line.startswith('@'):
            print(line)
            count += 1
            if count > 50:
                print("... (truncated)")
                break
    print("\n")

# 対象ファイル
files_to_check = [
    'src/JP_SettingsScreen_1023.js',
    'src/JP_RecordScreen_593.js',
    'src/JP_ScoreCell_596.js',
    'src/JP_useScoreStore_174.js'
]

for f in files_to_check:
    get_clean_diff(f)
