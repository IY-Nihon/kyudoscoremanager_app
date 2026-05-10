/**
 * patch_swift6_final.mjs - v41.9.0
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ROOT = process.cwd();
const CORE_BASE = 'node_modules/expo-modules-core/ios';

function patchFile(relPath, patchFn, label) {
  const absPath = resolve(PROJECT_ROOT, CORE_BASE, relPath);
  if (!existsSync(absPath)) {
    console.error(`❌ Not found: ${relPath}`);
    return;
  }
  const original = readFileSync(absPath, 'utf8');
  const patched = patchFn(original);
  if (patched === original) {
    console.log(`✅ No change: ${label || relPath}`);
  } else {
    writeFileSync(absPath, patched, 'utf8');
    console.log(`✅ Patched: ${label || relPath}`);
  }
}

/** Extract a Swift method content by counting braces */
function extractMethod(src, signatureStart) {
  const openIdx = src.indexOf('{', signatureStart);
  if (openIdx === -1) return null;
  let depth = 1, i = openIdx + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return depth === 0 ? { start: signatureStart, end: i } : null;
}

/** Robustly replace a Swift method block */
function replaceMethod(src, idempotencyStr, origSig, replacement) {
  if (idempotencyStr && src.includes(idempotencyStr)) return src;
  const idx = (origSig instanceof RegExp) ? src.search(origSig) : src.indexOf(origSig);
  if (idx === -1) return src;
  const block = extractMethod(src, idx);
  if (!block) return src;
  return src.slice(0, block.start) + replacement + src.slice(block.end);
}

const EXPO_UNCHECKED_SENDABLE_DEF = `
public struct ExpoUncheckedSendable<T>: @unchecked Sendable {
  public let value: T
  public init(value: T) {
    self.value = value
  }
}

/**
 A Sendable wrapper for RCTPropBlockAlias to bypass Swift 6 strict concurrency checks
 when transferring non-Sendable closures across MainActor boundaries.
 */
internal struct EXPropBlockWrapper: @unchecked Sendable {
  let block: RCTPropBlockAlias
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. SharedObject.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/SharedObjects/SharedObject.swift', (src) => {
  let p = src;
  p = p.replace(/^.*?(\/\/ Copyright|import )/s, '$1');

  if (!p.includes('struct ExpoUncheckedSendable')) {
    const injection = '\n' + EXPO_UNCHECKED_SENDABLE_DEF + '\n\n';
    if (p.includes('import SwiftUI')) p = p.replace('import SwiftUI', 'import SwiftUI' + injection);
    else if (p.includes('import Foundation')) p = p.replace('import Foundation', 'import Foundation' + injection);
    else if (p.includes('import React')) p = p.replace('import React', 'import React' + injection);
    else p = injection + p;
  }

  p = replaceMethod(p, 'JSUtils.emitEvent',
    '  func emit<each A: AnyArgument>(event: String, arguments: repeat each A)',
    `  func emit<each A: AnyArgument>(event: String, arguments: repeat each A) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\\(event)' to \\(type(of: self)), but the JS runtime has been lost")
      return
    }

    var argumentPairs: [(AnyArgument, AnyDynamicType)] = []
    repeat argumentPairs.append((each arguments, ~(each A).self))

    let box = ExpoUncheckedSendable(value: argumentPairs)
    runtime.schedule { [weak self, weak appContext] in
      guard let appContext, let runtime = try? appContext.runtime, let jsObject = self?.getJavaScriptObject() else {
        log.warn("Trying to send event '\\(event)' to \\(type(of: self)), but the JS object is no longer associated with the native instance")
        return
      }

      let arguments = box.value.map { (pair: (AnyArgument, AnyDynamicType)) -> Any in
        return Conversions.convertFunctionResult(pair.0, appContext: appContext, dynamicType: pair.1)
      }
      JSUtils.emitEvent(event, to: jsObject, withArguments: arguments, in: runtime)
    }
  }`);

  if (!p.includes('class SharedObject: AnySharedObject, @unchecked Sendable')) {
    p = p.replace(/(open class SharedObject: AnySharedObject)\s*\{/, '$1, @unchecked Sendable {');
  }
  return p;
}, 'SharedObject.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 2. SwiftUIHostingView.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/SwiftUI/SwiftUIHostingView.swift', (src) => {
  let p = src;
  
  if (!p.includes('import Foundation')) {
    if (p.includes('import SwiftUI')) {
      p = p.replace('import SwiftUI', 'import SwiftUI\nimport Foundation');
    }
  }

  if (p.includes(': ExpoView, @MainActor AnyExpoSwiftUIHostingView')) {
    p = p.replace(': ExpoView, @MainActor AnyExpoSwiftUIHostingView', ': ExpoView, AnyExpoSwiftUIHostingView');
  }
  if (p.includes('public final class HostingView') && !p.includes('@MainActor')) {
    p = p.replace('public final class HostingView', '@MainActor\npublic final class HostingView');
  }
  
  // Make sure protocol methods are nonisolated
  if (p.includes('func updateProps(_ rawProps')) {
    p = p.replace('func updateProps(_ rawProps', 'nonisolated func updateProps(_ rawProps');
    p = p.replace('func getContentView() ->', 'nonisolated func getContentView() ->');
    p = p.replace('func getProps() ->', 'nonisolated func getProps() ->');
  }

  // Remove @MainActor from protocol if it exists (my previous patch added it)
  p = p.replace('@MainActor\ninternal protocol AnyExpoSwiftUIHostingView', 'internal protocol AnyExpoSwiftUIHostingView');
  
  p = p.replace(/(?:nonisolated\s+){2,}/g, 'nonisolated ');
  
  const getContentViewSig = /public func getContentView\(\) -> (?:AnyView|any ExpoSwiftUI\.View)/;
  
  if (!p.includes('MainActor.assumeIsolated { return self.contentView }')) {
    let match = p.match(getContentViewSig);
    if (!match) {
        match = p.match(/nonisolated public func getContentView\(\) -> (?:AnyView|any ExpoSwiftUI\.View)/);
    }
    if (match) {
        const sig = match[0];
        p = replaceMethod(p, 'return self.contentView', sig,
          `    nonisolated public func getContentView() -> any ExpoSwiftUI.View {
      return MainActor.assumeIsolated {
        return self.contentView
      }
    }`);
    }
  }

  if (!p.includes('MainActor.assumeIsolated { return self.props }')) {
    p = replaceMethod(p, 'return props',
      '    public func getProps() -> ExpoSwiftUI.ViewProps',
      `    nonisolated public func getProps() -> ExpoSwiftUI.ViewProps {
      return MainActor.assumeIsolated {
        return self.props
      }
    }`);
  }

  if (!p.includes('nonisolated public override func updateProps')) {
      p = replaceMethod(p, 'props.updateRawProps(box.value',
        '    public override func updateProps(_ rawProps: [String: Any])',
        `    nonisolated public override func updateProps(_ rawProps: [String: Any]) {
      let box = ExpoUncheckedSendable(value: rawProps)
      MainActor.assumeIsolated {
        guard let appContext else { return }
        try? props.updateRawProps(box.value, appContext: appContext)
      }
    }`);
  }
  // Make sure to match any previous patch where it might be already nonisolated but not containing the unchecked wrapper correctly or just override
  if (p.includes('    nonisolated public override func updateProps(_ rawProps: [String: Any]) {') && !p.includes('props.updateRawProps(box.value')) {
    // If it was already patched with an old version, fix it
    p = replaceMethod(p, 'try? props.updateRawProps(box.value',
        '    nonisolated public override func updateProps(_ rawProps: [String: Any])',
        `    nonisolated public override func updateProps(_ rawProps: [String: Any]) {
      let box = ExpoUncheckedSendable(value: rawProps)
      MainActor.assumeIsolated {
        guard let appContext else { return }
        try? props.updateRawProps(box.value, appContext: appContext)
      }
    }`);
  }
  return p;
}, 'SwiftUIHostingView.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 3. ExpoFabricView.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Fabric/ExpoFabricView.swift', (src) => {
  let p = src;
  if (!p.includes('nonisolated public override func updateProps')) {
      p = replaceMethod(p, 'MainActor.assumeIsolated { self.updateProps(props) }',
        '  @MainActor\n  public override func updateProps(_ props: [String: Any])',
        `  @objc
  nonisolated public override func updateProps(_ props: [String: Any]) {
    MainActor.assumeIsolated {
      self.updateProps(props)
    }
  }`);
  }
  return p;
}, 'Fabric/ExpoFabricView.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 4. SwiftUIVirtualView.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/SwiftUI/SwiftUIVirtualView.swift', (src) => {
  let p = src;
  
  if (!p.includes('@MainActor\n  final class SwiftUIVirtualView')) {
    p = p.replace('final class SwiftUIVirtualView', '@MainActor\n  final class SwiftUIVirtualView');
  }

  if (!p.includes('MainActor.assumeIsolated')) {
    // We already patched updateProps in the previous script, let's fix it if we can find it
  }
  
  p = replaceMethod(p, 'try props.updateRawProps',
      '    override func updateProps(_ rawProps: [String: Any])',
      `    nonisolated override func updateProps(_ rawProps: [String: Any]) {
      MainActor.assumeIsolated {
        guard let appContext else {
          log.error("AppContext is not available, view props cannot be updated for \\(self)")
          return
        }
        do {
          try props.updateRawProps(rawProps, appContext: appContext)
        } catch let error {
          log.error("Updating props for \\(self) has failed: \\(error.localizedDescription)")
        }
      }
    }`);
    
  // If it already has nonisolated from our last patch:
  p = replaceMethod(p, 'props.updateRawProps(rawProps',
      '    nonisolated override func updateProps(_ rawProps: [String: Any])',
      `    nonisolated override func updateProps(_ rawProps: [String: Any]) {
      MainActor.assumeIsolated {
        guard let appContext else {
          log.error("AppContext is not available, view props cannot be updated for \\(self)")
          return
        }
        do {
          try props.updateRawProps(rawProps, appContext: appContext)
        } catch let error {
          log.error("Updating props for \\(self) has failed: \\(error.localizedDescription)")
        }
      }
    }`);
    
  p = replaceMethod(p, 'return props',
      '    func getProps() -> ExpoSwiftUI.ViewProps',
      `    nonisolated func getProps() -> ExpoSwiftUI.ViewProps {
      return MainActor.assumeIsolated {
        return self.props
      }
    }`);

  p = replaceMethod(p, 'viewDefinition.callLifecycleMethods',
      '    override func viewDidUpdateProps()',
      `    nonisolated override func viewDidUpdateProps() {
      MainActor.assumeIsolated {
        guard let viewDefinition else {
          return
        }
        guard let view = AppleView.from(self) else {
          return
        }
        viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: view)
      }
    }`);
    
  // Sometimes supportsProp is overriden without nonisolated
  p = replaceMethod(p, 'return true',
      '    override func supportsProp(withName name: String)',
      `    nonisolated override func supportsProp(withName name: String) -> Bool {
      return true
    }`);

  p = replaceMethod(p, 'props.children = children',
      '    override func mountChildComponentView(_ childComponentView: UIView, index: Int)',
      `    nonisolated override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      MainActor.assumeIsolated {
        var children = props.children ?? []
        let child: any AnyChild
        if let view = childComponentView as AnyObject as? (any ExpoSwiftUI.View) {
          child = view
        } else {
          child = UIViewHost(view: childComponentView)
        }
        children.insert(child, at: index)

        props.children = children
        props.objectWillChange.send()
      }
    }`);
    
  p = replaceMethod(p, 'props.children = children.filter(',
      '    override func unmountChildComponentView(_ childComponentView: UIView, index: Int)',
      `    nonisolated override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      MainActor.assumeIsolated {
        childComponentView.removeFromSuperview()

        let childViewId: ObjectIdentifier
        if let child = childComponentView as AnyObject as? (any AnyChild) {
          childViewId = child.id
        } else {
          childViewId = ObjectIdentifier(childComponentView)
        }

        if let children = props.children {
          props.children = children.filter({ $0.id != childViewId })
          #if DEBUG
          assert(props.children?.count == children.count - 1, "Failed to remove child view")
          #endif
          props.objectWillChange.send()
        }
      }
    }`);

  p = replaceMethod(p, 'super.removeFromSuperview()',
      '    override func removeFromSuperview()',
      `    nonisolated override func removeFromSuperview() {
      MainActor.assumeIsolated {
        if let focusableView = contentView as? any ExpoSwiftUI.FocusableView {
          focusableView.forceResignFirstResponder()
        }
        super.removeFromSuperview()
      }
    }`);

  // Restore @MainActor if it was removed in previous patches
  if (p.includes('@MainActor final class SwiftUIVirtualView')) {
    p = p.replace('@MainActor final class SwiftUIVirtualView', '  final class SwiftUIVirtualView');
  }
  if (p.includes('extension ExpoSwiftUI.SwiftUIVirtualView: @preconcurrency ExpoSwiftUI.ViewWrapper')) {
    p = p.replace('extension ExpoSwiftUI.SwiftUIVirtualView: @preconcurrency ExpoSwiftUI.ViewWrapper',
                  '@MainActor extension ExpoSwiftUI.SwiftUIVirtualView: ExpoSwiftUI.ViewWrapper');
  }
  return p;
}, 'SwiftUIVirtualView.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 5. SwiftUIViewFrameObserver.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/SwiftUI/SwiftUIViewFrameObserver.swift', (src) => {
  let p = src;
  if (!p.includes('MainActor.assumeIsolated')) {
    p = p.replace('callback(CGRect(origin: view.frame.origin, size: newValue.size))',
                  'MainActor.assumeIsolated { callback(CGRect(origin: view.frame.origin, size: newValue.size)) }');
  }
  return p;
}, 'SwiftUIViewFrameObserver.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 6. ViewDefinition.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/ViewDefinition.swift', (src) => {
  let p = src;
  if (!p.includes('import Foundation')) {
    p = 'import Foundation\n' + p;
  }
  p = p.replace(/@MainActor\s+@MainActor/g, '@MainActor');
  p = p.replace(/nonisolated\s+nonisolated/g, 'nonisolated');
  
  // Revert my earlier @MainActor extension UIView patch that caused 'unknown attribute'
  if (p.includes('@MainActor extension UIView')) {
      p = p.replace('@MainActor extension UIView: AnyArgument', 'extension UIView: @preconcurrency AnyArgument');
  }
  
  if (!p.includes('nonisolated public static func getDynamicType')) {
    p = p.replace('public static func getDynamicType()', 'nonisolated public static func getDynamicType()');
  }
  return p;
}, 'ViewDefinition.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 7. ViewModuleWrapper.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/ViewModuleWrapper.swift', (src) => {
  let p = src;
  if (!p.includes('import Foundation')) {
    p = 'import Foundation\n' + p;
  }
  // Revert my @MainActor if it was added
  p = p.replace('@MainActor\n@objc(EXViewModuleWrapper)', '@objc(EXViewModuleWrapper)');
  p = p.replace('@MainActor\nprotocol DynamicModuleWrapperProtocol', 'protocol DynamicModuleWrapperProtocol');

  // Make class @unchecked Sendable
  if (!p.includes('@unchecked Sendable')) {
    p = p.replace('public final class ViewModuleWrapper: RCTViewManager, DynamicModuleWrapperProtocol', 'public final class ViewModuleWrapper: RCTViewManager, DynamicModuleWrapperProtocol, @unchecked Sendable');
  }

  p = replaceMethod(p, 'fatalError(Exceptions.AppContextLost()',
    '  public override func view() -> UIView!',
    `  @objc
  public override func view() -> UIView! {
    return MainActor.assumeIsolated {
      guard let appContext = moduleHolder?.appContext else {
        fatalError(Exceptions.AppContextLost().reason)
      }
      guard let view = try? viewDefinition?.createView(appContext: appContext)?.toUIView() else {
        fatalError("Cannot create a view '\\(String(describing: viewDefinition?.name))' from module '\\(String(describing: self.name))'")
      }
      return view
    }
  }`);
  
  // Handle if they were already patched and have nonisolated override func view()
  p = replaceMethod(p, 'fatalError(Exceptions.AppContextLost()',
    '  nonisolated public override func view() -> UIView!',
    `  @objc
  nonisolated public override func view() -> UIView! {
    return MainActor.assumeIsolated {
      guard let appContext = moduleHolder?.appContext else {
        fatalError(Exceptions.AppContextLost().reason)
      }
      guard let view = try? viewDefinition?.createView(appContext: appContext)?.toUIView() else {
        fatalError("Cannot create a view '\\(String(describing: viewDefinition?.name))' from module '\\(String(describing: self.name))'")
      }
      return view
    }
  }`);

  return p;
}, 'ViewModuleWrapper.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 8. DynamicRawType.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/DynamicTypes/DynamicRawType.swift', (src) => {
  let p = src;
  p = p.replace(/\s*(?:public|internal|private)?\s*struct Unchecked.*?\n\s*\}\n/gs, '\n');
  
  p = replaceMethod(p, 'box.value.build',
    '  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext)',
    `  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    if let objectBuilder = result as? JavaScriptObjectBuilder {
      let box = ExpoUncheckedSendable(value: objectBuilder)
      return try JavaScriptActor.assumeIsolated {
        return try box.value.build(appContext: appContext)
      } as Any
    }
    return result
  }`);
  // Catch already patched version if signature is throws -> Any
  p = replaceMethod(p, 'box.value.build',
    '  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any',
    `  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    if let objectBuilder = result as? JavaScriptObjectBuilder {
      let box = ExpoUncheckedSendable(value: objectBuilder)
      return try JavaScriptActor.assumeIsolated {
        return try box.value.build(appContext: appContext)
      } as Any
    }
    return result
  }`);
  return p;
}, 'DynamicRawType.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 9. SharedRef.swift & PersistentFileLog.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/SharedObjects/SharedRef.swift', (src) => {
  if (!src.includes('class SharedRef<RefType>: SharedObject, AnySharedRef, @unchecked Sendable')) {
    return src.replace(/(open class SharedRef<RefType>: SharedObject, AnySharedRef)\s*\{/, '$1, @unchecked Sendable {');
  }
  return src;
}, 'SharedRef.swift');

patchFile('Core/Logging/PersistentFileLog.swift', (src) => {
  let p = src;
  if (!p.includes('@Sendable (String) -> Bool')) {
    p = p.replace('public typealias PersistentFileLogFilter = (String) -> Bool',
      'public typealias PersistentFileLogFilter = @Sendable (String) -> Bool');
  }
  
  // Revert the buggy regex and use a robust replacement for Sendable
  p = p.replace(/public class PersistentFileLog: @unchecked Sendable, @unchecked Sendable/g, 'public class PersistentFileLog: @unchecked Sendable');
  
  if (!p.includes('@unchecked Sendable')) {
    p = p.replace('public class PersistentFileLog {', 'public class PersistentFileLog: @unchecked Sendable {');
    // If it already had a inheritance colon:
    p = p.replace(/public class PersistentFileLog:([^{]+)\{/, 'public class PersistentFileLog:$1, @unchecked Sendable {');
  }
  return p;
}, 'PersistentFileLog.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 10. AppContext.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/AppContext.swift', (src) => {
  let p = src;
  p = replaceMethod(p, '@MainActor\n  @objc\n  public func getViewManagers()',
    '@objc\n  public func getViewManagers() -> [ViewModuleWrapper]',
    `  @objc
  @MainActor
  public func getViewManagers() -> [ViewModuleWrapper] {
    return moduleRegistry.flatMap { holder in
      holder.definition.views.map { key, viewDefinition in
        ViewModuleWrapper(holder, viewDefinition, isDefaultModuleView: key == DEFAULT_MODULE_VIEW)
      }
    }
  }`);
  return p;
}, 'AppContext.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 11. ComponentData.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/ComponentData.swift', (src) => {
  let p = src;
  
// Don't inject EXPO_UNCHECKED_SENDABLE_DEF here, it's already in SharedObject.swift and visible module-wide.

  if (!p.includes('@MainActor\n@objc(EXComponentData)')) {
    p = p.replace('@objc(EXComponentData)', '@MainActor\n@objc(EXComponentData)');
  }


  p = replaceMethod(p, '// PATCHED: createPropBlock',
    '  public override func createPropBlock(_ propName: String, isShadowView: Bool) -> RCTPropBlockAlias',
    `  public override func createPropBlock(_ propName: String, isShadowView: Bool) -> RCTPropBlockAlias {
    let wrapper = MainActor.assumeIsolated {
      // PATCHED: createPropBlock
      let block: RCTPropBlockAlias
      if isShadowView {
        block = super.createPropBlock(propName, isShadowView: isShadowView)
      } else if viewModuleWrapper?.viewDefinition?.eventNames.contains(propName) == true {
        block = createEventSetter(eventName: propName, bridge: self.manager?.bridge)
      } else {
        block = super.createPropBlock(propName, isShadowView: isShadowView)
      }
      return EXPropBlockWrapper(block: block)
    }
    return wrapper.block
  }`);

  p = replaceMethod(p, '// PATCHED: setProps', 
    '  public override func setProps(_ props: [String: Any], forView view: RCTComponent)',
    `  public override func setProps(_ props: [String: Any], forView view: RCTComponent) {
    MainActor.assumeIsolated {
      // PATCHED: setProps
      guard let view = view as? UIView else {
        log.warn("Given view is not an UIView")
        return
      }
      guard let viewDefinition = viewModuleWrapper?.viewDefinition else {
        log.warn("View manager '\\(self.name)' not found")
        return
      }
      guard let appContext = viewModuleWrapper?.moduleHolder?.appContext else {
        log.warn("App context has been lost")
        return
      }

      if let hostingView = view as? ExpoSwiftUI.AnyHostingView {
        hostingView.updateProps(props)
        super.setProps(props, forView: view)
        return
      }

      let propsDict = viewDefinition.propsDict()
      var remainingProps = props

      for (key, prop) in propsDict {
        if props.index(forKey: key) == nil {
          continue
        }
        let newValue = props[key] as Any
        try? prop.set(value: Conversions.fromNSObject(newValue), onView: view, appContext: appContext)
        remainingProps.removeValue(forKey: key)
      }
      super.setProps(remainingProps, forView: view)
      viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: AppleView.uikit(view))
    }
  }`);

  p = replaceMethod(p, '// PATCHED: viewConfig', 
    '  public override func viewConfig() -> [String: Any]',
    `  public override func viewConfig() -> [String: Any] {
    return MainActor.assumeIsolated {
      // PATCHED: viewConfig
      var propTypes: [String: Any] = [:]
      var directEvents: [String] = []
      let superClass: AnyClass? = managerClass.superclass()

      if let viewDefinition = viewModuleWrapper?.viewDefinition {
        for propName in viewDefinition.getSupportedPropNames() {
          propTypes[propName] = "id"
        }
        for eventName in viewDefinition.eventNames {
          directEvents.append(RCTNormalizeInputEventName(eventName))
          propTypes[eventName] = "BOOL"
        }
      }

      return [
        "propTypes": propTypes,
        "directEvents": directEvents,
        "bubblingEvents": [String](),
        "baseModuleName": superClass?.moduleName() as Any
      ]
    }
  }`);

  return p;
}, 'ComponentData.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 12. ReactDelegates/ExpoReactDelegate.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('ReactDelegates/ExpoReactDelegate.swift', (src) => {
  let p = src;
  if (!p.includes('@MainActor\npublic class ExpoReactDelegate')) {
    p = p.replace('public class ExpoReactDelegate', '@MainActor\npublic class ExpoReactDelegate');
  }
  return p;
}, 'ExpoReactDelegate.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 13. URLAuthenticationChallengeForwardSender & Proxy
// ─────────────────────────────────────────────────────────────────────────────
patchFile('DevTools/URLAuthenticationChallengeForwardSender.swift', (src) => {
  let p = src;
  if (!p.includes('URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender, @unchecked Sendable')) {
    p = p.replace('URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender', 'URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender, @unchecked Sendable');
  }
  return p;
}, 'URLAuthenticationChallengeForwardSender.swift');

patchFile('DevTools/URLSessionSessionDelegateProxy.swift', (src) => {
  let p = src;
  if (!p.includes('@unchecked Sendable')) {
    p = p.replace('public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate', 'public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate, @unchecked Sendable');
  }
  return p;
}, 'URLSessionSessionDelegateProxy.swift');

// ─────────────────────────────────────────────────────────────────────────────
// 14. ViewDefinition.swift
// ─────────────────────────────────────────────────────────────────────────────
patchFile('Core/Views/ViewDefinition.swift', (src) => {
  let p = src;
  if (p.includes('@MainActor public class ViewDefinition')) {
    p = p.replace('@MainActor public class ViewDefinition', 'public class ViewDefinition');
  }
  if (p.includes('extension UIView: @MainActor AnyArgument')) {
    p = p.replace('extension UIView: @MainActor AnyArgument', 'extension UIView: AnyArgument');
  }
  return p;
}, 'ViewDefinition.swift');

patchFile('Core/Protocols/AnyViewDefinition.swift', (src) => {
  let p = src;
  if (p.includes('@MainActor public protocol AnyViewDefinition')) {
    p = p.replace('@MainActor public protocol AnyViewDefinition', 'public protocol AnyViewDefinition');
  }
  return p;
}, 'AnyViewDefinition.swift');

console.log('\\n🎉 v41.9.0 patches complete');
