const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'apple/Sources/ExpoModulesJSI/Contexts/HostFunctionContext.swift',
  'apple/Sources/ExpoModulesJSI/Contexts/HostObjectContext.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/JavaScriptActor.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/JavaScriptPropNameID.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptFunction.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptError.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptArrayBuffer.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptPromise.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptTypedArray.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptWeakObject.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptBigInt.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptObject.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptValue.swift',
  'apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptArray.swift'
];

const basePath = path.join(__dirname, '../node_modules/expo-modules-jsi');

console.log('Applying Expo JSI Swift compiler fix...');

filesToPatch.forEach(file => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Patch 'weak let runtime' to 'weak var runtime'
    if (content.includes('weak let runtime')) {
      content = content.replace(/weak let runtime/g, 'weak var runtime');
      modified = true;
    }

    // 2. Patch Sendable conformance to @unchecked Sendable for classes that have mutable properties now
    if (file.endsWith('HostFunctionContext.swift') && content.includes('class HostFunctionContext: Sendable')) {
      content = content.replace('class HostFunctionContext: Sendable', 'class HostFunctionContext: @unchecked Sendable');
      modified = true;
    }

    if (file.endsWith('HostObjectContext.swift') && content.includes('class HostObjectContext: Sendable')) {
      content = content.replace('class HostObjectContext: Sendable', 'class HostObjectContext: @unchecked Sendable');
      modified = true;
    }

    if (file.endsWith('JavaScriptPropNameID.swift') && content.includes('class JavaScriptPropNameID: JavaScriptType') && !content.includes('@unchecked Sendable')) {
      content = content.replace('class JavaScriptPropNameID: JavaScriptType', 'class JavaScriptPropNameID: JavaScriptType, @unchecked Sendable');
      modified = true;
    }

    if (file.endsWith('JavaScriptValue.swift') && content.includes('class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error') && !content.includes('@unchecked Sendable')) {
      content = content.replace('class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error', 'class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error, @unchecked Sendable');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched: ${file}`);
    } else {
      console.log(`Already patched or no match: ${file}`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
});

// 3. Patch 'weak let appContext' and 'Sendable' conformance in expo-modules-core
const coreFilePath = path.join(__dirname, '../node_modules/expo-modules-core/ios/Core/SharedObjects/SharedObjectRegistry.swift');
if (fs.existsSync(coreFilePath)) {
  let content = fs.readFileSync(coreFilePath, 'utf8');
  let modified = false;
  if (content.includes('weak let appContext')) {
    content = content.replace('weak let appContext', 'weak var appContext');
    modified = true;
  }
  if (content.includes('class SharedObjectRegistry: Sendable')) {
    content = content.replace('class SharedObjectRegistry: Sendable', 'class SharedObjectRegistry: @unchecked Sendable');
    modified = true;
  }
  if (modified) {
    fs.writeFileSync(coreFilePath, content, 'utf8');
    console.log('Successfully patched SharedObjectRegistry.swift in expo-modules-core');
  } else {
    console.log('SharedObjectRegistry.swift in expo-modules-core is already patched.');
  }
} else {
  console.error(`File not found: ${coreFilePath}`);
}

console.log('Expo JSI Swift compiler fix applied.');
