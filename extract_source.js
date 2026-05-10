const fs = require('fs');
try {
  const data = fs.readFileSync('sourcemap.json', 'utf8');
  if (data.startsWith('<')) {
    console.log('Downloaded file is HTML (likely 404 Not Found). Source maps are not deployed.');
    process.exit(1);
  }
  const map = JSON.parse(data);
  let found = false;
  for (let i = 0; i < map.sources.length; i++) {
    const sourcePath = map.sources[i];
    if (sourcePath.includes('LoginScreen.tsx')) {
      fs.writeFileSync('LoginScreen_live.tsx', map.sourcesContent[i]);
      console.log('Successfully extracted LoginScreen_live.tsx from: ' + sourcePath);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('LoginScreen.tsx not found in sourcemap');
  }
} catch (e) {
  console.error('Error parsing sourcemap:', e.message);
}
