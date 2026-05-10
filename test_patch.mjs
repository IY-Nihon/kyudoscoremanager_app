
const fs = require('fs');

function patchSwiftUIHostingView(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Remove @MainActor from protocol
  content = content.replace('@MainActor internal protocol AnyExpoSwiftUIHostingView', 'internal protocol AnyExpoSwiftUIHostingView');

  // 2. updateProps
  // It looks like:
  // public override func updateProps(_ rawProps: [String: Any]) {
  //   ...
  //     hasSafeAreaBeenConfigured = true
  //   }
  // }
  // We want to make it nonisolated and wrap the body in MainActor.assumeIsolated.
  
  let updatePropsRegex = /public override func updateProps\(_ rawProps: \[String: Any\]\) \{([\s\S]*?)(hasSafeAreaBeenConfigured = true\n\s*\}\n\s*)\}/;
  content = content.replace(updatePropsRegex, (match, prefix, suffix) => {
    return 'nonisolated public override func updateProps(_ rawProps: [String: Any]) {\n    MainActor.assumeIsolated {\n' + prefix + suffix + '    }\n  }';
  });

  // 3. getContentView
  let getContentViewRegex = /public func getContentView\(\) -> any ExpoSwiftUI\.View \{\n\s*return contentView\n\s*\}/;
  content = content.replace(getContentViewRegex, \
onisolated public func getContentView() -> any ExpoSwiftUI.View {
    return MainActor.assumeIsolated { self.contentView }
  }\);

  // 4. getProps
  let getPropsRegex = /public func getProps\(\) -> ExpoSwiftUI\.ViewProps \{\n\s*return props\n\s*\}/;
  content = content.replace(getPropsRegex, \
onisolated public func getProps() -> ExpoSwiftUI.ViewProps {
    return MainActor.assumeIsolated { self.props }
  }\);

  // Ensure the class itself has @MainActor if it doesn't already, wait.
  // The class is already public final class HostingView: ExpoView.
  // BUT the @MainActor public final class HostingView was maybe added by my previous patch layer!
  // I must be careful about multiple runs.
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched SwiftUIHostingView.swift successfully');
}

patchSwiftUIHostingView('node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift');
