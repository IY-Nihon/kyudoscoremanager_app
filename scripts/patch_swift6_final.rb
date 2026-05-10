# scripts/patch_swift6_final.rb
# v20.0.0 - Robust isolation fixes and "Silver Bullet" Podspec patch
require 'fileutils'

VERSION = "20.0.0"
BASE_DIR = "node_modules/expo-modules-core"

puts "Applying Swift 6 strict concurrency patches v#{VERSION}..."

def patch_file(rel_path, patches)
  path = File.join(BASE_DIR, rel_path)
  unless File.exist?(path)
    puts "  File not found: #{path}"
    return
  end

  content = File.read(path)
  patched = false

  patches.each do |p|
    if content.match?(p[:target])
      content.gsub!(p[:target], p[:replacement])
      puts "    Matched and replaced: #{p[:target].inspect[0..50]}..."
      patched = true
    else
      puts "    Could not find target: #{p[:target].inspect[0..50]}..."
    end
  end

  if patched
    File.write(path, content)
    puts "  Successfully patched: #{rel_path}"
  end
end

# 1. ObjectFactories - Fix isolated autoclosure in Constants
patch_file("ios/Api/Factories/ObjectFactories.swift", [
  {
    target: /func Constants\(@_implicitSelfCapture _ body: @escaping \(\) -> \[String: Any\?\]\)/,
    replacement: "func Constants(@_implicitSelfCapture _ body: @MainActor @escaping () -> [String: Any?])"
  },
  {
    target: /func Constants\(@_implicitSelfCapture _ body: @autoclosure @escaping \(\) -> \[String: Any\?\]\)/,
    replacement: "func Constants(@_implicitSelfCapture _ body: @autoclosure @MainActor @escaping () -> [String: Any?])"
  }
])

# 2. ModuleDefinition - match ConstantsDefinition to the new MainActor closure
patch_file("ios/Core/Modules/ModuleDefinition.swift", [
  {
    target: /struct ConstantsDefinition: AnyDefinition \{\s*let body: \(\) -> \[String: Any\?\]\s*\}/m,
    replacement: "struct ConstantsDefinition: AnyDefinition {\n  let body: @MainActor () -> [String: Any?]\n}"
  },
  { target: /@MainActor\s+public final class ModuleDefinition/, replacement: "public final class ModuleDefinition" }
])

# 3. ComponentData - strictly MainActor for UIKit interaction
patch_file("ios/Core/Views/ComponentData.swift", [
  {
    target: /public final class ComponentData: RCTComponentDataSwiftAdapter \{/,
    replacement: "@MainActor\npublic final class ComponentData: RCTComponentDataSwiftAdapter {"
  }
])

# 4. ViewModuleWrapper - RCTViewManager subclass (UIKit)
patch_file("ios/Core/Views/ViewModuleWrapper.swift", [
  {
    target: /public final class ViewModuleWrapper: RCTViewManager, DynamicModuleWrapperProtocol \{/,
    replacement: "@MainActor\npublic final class ViewModuleWrapper: RCTViewManager, DynamicModuleWrapperProtocol {"
  }
])

# 5. ConcreteViewProp - directly calls UIKit setter lambdas
patch_file("ios/Core/Views/ConcreteViewProp.swift", [
  {
    target: /public final class ConcreteViewProp/,
    replacement: "@MainActor\npublic final class ConcreteViewProp"
  },
  {
    target: /try MainActor\.assumeIsolated \{/,
    replacement: "// try MainActor.assumeIsolated {"
  },
  {
    target: /\}\s+\}\n\s+static func/m,
    replacement: "    }\n  }\n  static func"
  }
])

# 6. ViewFactories - mark as @MainActor for DSL functions that create UIKit objects
patch_file("ios/Api/Factories/ViewFactories.swift", [
  { target: /func View<ViewType: UIView>\(/, replacement: "@MainActor\npublic func View<ViewType: UIView>(" },
  { target: /func Prop<ViewType: UIView/ , replacement: "@MainActor\npublic func Prop<ViewType: UIView" }
])

# 7. URLSessionDelegateProxy - needs Sendable for Swift 6
patch_file("ios/Core/Arguments/URLSessionSessionDelegateProxy.swift", [
  {
    target: /DelegateProxy: NSObject, URLSessionDelegate/,
    replacement: "DelegateProxy: NSObject, URLSessionDelegate, @unchecked Sendable"
  }
])

# 8. Decouple data models from MainActor
patch_file("ios/Core/Views/ViewDefinition.swift", [
  { target: /@MainActor public class ViewDefinition/, replacement: "public class ViewDefinition" },
  { target: /extension UIView: @MainActor AnyArgument/, replacement: "extension UIView: AnyArgument" }
])
patch_file("ios/Core/Protocols/AnyViewDefinition.swift", [
  { target: /@MainActor public protocol AnyViewDefinition/, replacement: "public protocol AnyViewDefinition" }
])

# 9. SwiftUIVirtualView - Fix invalid/redundant MainActor conformance and childView isolation
patch_file("ios/Core/Views/SwiftUI/SwiftUIVirtualView.swift", [
  {
    target: /extension\s+ExpoSwiftUI\.SwiftUIVirtualView:\s+@MainActor\s+ExpoSwiftUI\.ViewWrapper\s+\{/,
    replacement: "extension ExpoSwiftUI.SwiftUIVirtualView: ExpoSwiftUI.ViewWrapper {"
  },
  {
    target: /@MainActor\s+override\s+func\s+viewDidUpdateProps\(\)/,
    replacement: "override func viewDidUpdateProps()" # It's already MainActor via ObjC/NS_SWIFT_UI_ACTOR
  }
])

# 10. AnyChild - Resolve isolation mismatch by making requirement @MainActor
patch_file("ios/Core/Views/SwiftUI/AnyChild.swift", [
  {
    target: /(?<!@MainActor\s)var\s+childView:\s+ChildViewType\s+\{\s*get\s*\}/,
    replacement: "@MainActor var childView: ChildViewType { get }"
  },
  {
    target: /(?<!@MainActor\s)var\s+childView:\s+ChildViewType\s+\{\s*self\s*\}/m,
    replacement: "@MainActor var childView: ChildViewType { self }"
  }
])

# 11. ExpoSwiftUI - Make ViewWrapper @MainActor to match its implementers
patch_file("ios/Core/Views/SwiftUI/ExpoSwiftUI.swift", [
  {
    target: /(?<!@MainActor\s)public\s+protocol\s+ViewWrapper/,
    replacement: "@MainActor public protocol ViewWrapper"
  }
])

# 12. Podspec - Force minimal strict concurrency AND Swift 5.0
patch_file("ExpoModulesCore.podspec", [
  {
    target: /s\.swift_version\s+=\s+'6\.0'/,
    replacement: "s.swift_version  = '5.0'"
  },
  {
    target: /'SWIFT_COMPILATION_MODE' => 'wholemodule',/,
    replacement: "'SWIFT_COMPILATION_MODE' => 'wholemodule',\n    'SWIFT_STRICT_CONCURRENCY' => 'minimal',"
  }
])

puts "Done applying patches v#{VERSION}."


