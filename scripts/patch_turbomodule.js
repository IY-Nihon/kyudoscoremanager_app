const fs = require('fs');
const path = 'node_modules/react-native/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/RCTTurboModule.mm';

if (!fs.existsSync(path)) {
  console.log(`[Patch] Skip: ${path} not found.`);
  process.exit(0);
}

let content = fs.readFileSync(path, 'utf8');

// The original pattern to find was @catch (NSException *exception) { ... } @finally
const regex1 = /@catch \((NSException \*exception)\) \{([\s\S]*?)\} @finally/g;

let modifiedContent = content.replace(regex1, (match, exceptionDecl, catchBody) => {
  // If we already patched it, avoid double patching
  if (catchBody.includes('Crash detected')) {
    return match;
  }
  
  // We extract the original code but comment it out so it doesn't throw and kill the app
  const commentedOriginal = catchBody.trim().split('\\n').map(line => '    // ' + line).join('\\n');

  return `@catch (NSException *exception) {
    NSString *stackTrace = [[exception callStackSymbols] componentsJoinedByString:@"\\n"];
    NSString *message = [NSString stringWithFormat:@"Crash detected!\\nName: %@\\nReason: %@\\n\\nStack:\\n%@", exception.name, exception.reason, stackTrace];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"TurboModule Crash" message:message preferredStyle:UIAlertControllerStyleAlert];
        [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleCancel handler:nil]];
        
        UIWindow *window = [UIApplication sharedApplication].keyWindow;
        UIViewController *rootViewController = window.rootViewController;
        while (rootViewController.presentedViewController) {
            rootViewController = rootViewController.presentedViewController;
        }
        [rootViewController presentViewController:alert animated:YES completion:nil];
    });
    
    // Log to console for Xcode logging
    NSLog(@"[FATAL TURBOMODULE CRASH] %@", message);
    
    // Suppress the original throw so the app doesn't crash immediately and we can see the alert
    // Original code:
${commentedOriginal}
  } @finally`;
});

fs.writeFileSync(path, modifiedContent, 'utf8');
console.log('RCTTurboModule.mm patched successfully');
