const fs = require('fs');
const acorn = require('acorn');
try {
  const code = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8');
  acorn.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
  console.log("Success!");
} catch (err) {
  if (err.pos !== undefined) {
    const code = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8');
    const start = Math.max(0, err.pos - 100);
    const end = Math.min(code.length, err.pos + 100);
    console.error("Error context:");
    console.error(code.substring(start, end));
    console.error(" ".repeat(err.pos - start) + "^");
  } else {
    console.error(err);
  }
}
