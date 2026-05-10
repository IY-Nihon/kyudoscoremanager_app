const fs = require('fs');
try {
  const mapData = JSON.parse(fs.readFileSync('bundle.js.map', 'utf8'));
  const sources = mapData.sources;
  const sourcesContent = mapData.sourcesContent;
  
  if (!sources || !sourcesContent) {
    console.log('No sources content found in sourcemap.');
    process.exit(1);
  }

  // Find LoginScreen.tsx
  const loginIdx = sources.findIndex(s => s.includes('LoginScreen.tsx'));
  if (loginIdx !== -1) {
    const loginContent = sourcesContent[loginIdx];
    fs.writeFileSync('LoginScreen_restored.tsx', loginContent);
    console.log(`Successfully restored LoginScreen.tsx!`);
  } else {
    console.log('LoginScreen.tsx not found in sourcemap sources.');
  }

  // Find SettingsScreen.tsx
  const settingsIdx = sources.findIndex(s => s.includes('SettingsScreen.tsx'));
  if (settingsIdx !== -1) {
    const settingsContent = sourcesContent[settingsIdx];
    fs.writeFileSync('SettingsScreen_restored.tsx', settingsContent);
    console.log(`Successfully restored SettingsScreen.tsx!`);
  }

  // Find MainNavigator.tsx
  const mainNavIdx = sources.findIndex(s => s.includes('MainNavigator.tsx'));
  if (mainNavIdx !== -1) {
    const mainNavContent = sourcesContent[mainNavIdx];
    fs.writeFileSync('MainNavigator_restored.tsx', mainNavContent);
    console.log(`Successfully restored MainNavigator.tsx!`);
  }
} catch (e) {
  console.error('Error parsing sourcemap:', e);
}
