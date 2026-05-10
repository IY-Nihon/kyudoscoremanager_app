import os
import re

search_path = r"C:\Users\yutoi\Documents\復元アプリ\AppBase\src"
patterns = ["shadowColor", "shadowOffset", "shadowOpacity", "shadowRadius", "elevation"]

for root, dirs, files in os.walk(search_path):
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for i, line in enumerate(f, 1):
                    if any(p in line for p in patterns):
                        if "getShadowStyle" not in line:
                            print(f"{path}:{i}: {line.strip()}")
