#!/usr/bin/env python3
"""Generate the dependency-free Xcode project; stable IDs make diffs reviewable."""
from pathlib import Path
import hashlib
root = Path(__file__).resolve().parent.parent / 'ios'
objects = {}
def ident(name): return hashlib.sha256(name.encode()).hexdigest()[:24].upper()
def add(name, value):
    objects[ident(name)] = value
    return ident(name)
def arr(xs): return '(' + ', '.join(xs) + (',)' if xs else ')')
def ref(key, path, kind): return add(key, f'{{isa = PBXFileReference; lastKnownFileType = {kind}; path = "{path}"; sourceTree = "<group>";}}')
# The widget's files share names with the app's, so its keys carry the folder.
def key(group, filename): return f'{group}/{filename}' if group == 'PreacherWidget' else filename
appfiles = sorted(p.name for p in (root/'Preacher').glob('*.swift'))
widgetfiles = sorted(p.name for p in (root/'PreacherWidget').glob('*.swift'))
KINDS = {'Localizable.xcstrings':'text.json.xcstrings','Info.plist':'text.plist.xml','PrivacyInfo.xcprivacy':'text.xml','Assets.xcassets':'folder.assetcatalog','Preacher.entitlements':'text.plist.entitlements'}
for group, files in [('Preacher',appfiles+['Localizable.xcstrings','Info.plist','PrivacyInfo.xcprivacy','Assets.xcassets','Preacher.entitlements']),('PreacherWidget',widgetfiles+['Info.plist','PrivacyInfo.xcprivacy']),('PreacherTests',['ReadingLibraryTests.swift']),('PreacherUITests',['PreacherUITests.swift']),('config',['App.xcconfig','Version.xcconfig','Widget.xcconfig'])]:
    ids=[]
    for filename in files:
        kind = 'sourcecode.swift' if filename.endswith('.swift') else 'text.xcconfig' if filename.endswith('.xcconfig') else KINDS[filename]
        ids.append(ref(key(group, filename), filename, kind))
    add(group+'Group',f'{{isa = PBXGroup; children = {arr(ids)}; path = {group}; sourceTree = "<group>";}}')
products=[]
WRAPPERS = {'app':'wrapper.application','xctest':'wrapper.cfbundle','appex':'wrapper.app-extension'}
for target,files,productType,ext in [('PreacherWidget',widgetfiles,'app-extension','appex'),('Preacher',appfiles,'application','app'),('PreacherTests',['ReadingLibraryTests.swift'],'bundle.unit-test','xctest'),('PreacherUITests',['PreacherUITests.swift'],'bundle.ui-testing','xctest')]:
    product=add(target+'Product',f'{{isa = PBXFileReference; explicitFileType = {WRAPPERS[ext]}; path = {target}.{ext}; sourceTree = BUILT_PRODUCTS_DIR;}}')
    products.append(product)
    builds=[]
    group = 'PreacherWidget' if target == 'PreacherWidget' else ''
    for filename in files:
        builds.append(add(key(group, filename)+'Build',f'{{isa = PBXBuildFile; fileRef = {ident(key(group, filename))};}}'))
    sources=add(target+'Sources',f'{{isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = {arr(builds)}; runOnlyForDeploymentPostprocessing = 0;}}')
    resources=[]
    if target=='Preacher':
        for filename in ['PrivacyInfo.xcprivacy','Assets.xcassets','Localizable.xcstrings']:
            resources.append(add(filename+'Build',f'{{isa = PBXBuildFile; fileRef = {ident(filename)};}}'))
    if target=='PreacherWidget':
        resources.append(add('PreacherWidget/PrivacyInfo.xcprivacyBuild',f'{{isa = PBXBuildFile; fileRef = {ident("PreacherWidget/PrivacyInfo.xcprivacy")};}}'))
    res=add(target+'Resources',f'{{isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = {arr(resources)}; runOnlyForDeploymentPostprocessing = 0;}}')
    fw=add(target+'Frameworks','{isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0;}')
    phases=[sources,fw,res]
    if target=='Preacher':
        # The widget ships inside the app, in PlugIns.
        embedded=add('PreacherWidgetEmbedBuild',f'{{isa = PBXBuildFile; fileRef = {ident("PreacherWidgetProduct")}; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }}')
        phases.append(add('PreacherEmbedExtensions',f'{{isa = PBXCopyFilesBuildPhase; buildActionMask = 2147483647; dstPath = ""; dstSubfolderSpec = 13; files = {arr([embedded])}; name = "Embed Foundation Extensions"; runOnlyForDeploymentPostprocessing = 0;}}'))
    configs=[]
    for mode in ['Debug','Release']:
        settings='SWIFT_EMIT_LOC_STRINGS = YES;'
        base=''
        if target=='Preacher':
            base=f'baseConfigurationReference = {ident("App.xcconfig")};'
            settings+=' PRODUCT_NAME = "$(TARGET_NAME)";'
        elif target=='PreacherWidget':
            base=f'baseConfigurationReference = {ident("Widget.xcconfig")};'
            settings+=' PRODUCT_NAME = "$(TARGET_NAME)";'
        else:
            settings+=f' PRODUCT_NAME = "$(TARGET_NAME)"; PRODUCT_BUNDLE_IDENTIFIER = app.thepreacher.ios.{target}; GENERATE_INFOPLIST_FILE = YES; SWIFT_VERSION = 5.0; IPHONEOS_DEPLOYMENT_TARGET = 17.0; TARGETED_DEVICE_FAMILY = 1; CODE_SIGN_STYLE = Automatic;'
            if target=='PreacherTests': settings+=' TEST_HOST = "$(BUILT_PRODUCTS_DIR)/Preacher.app/Preacher"; BUNDLE_LOADER = "$(TEST_HOST)";'
            else: settings+=' TEST_TARGET_NAME = Preacher;'
        configs.append(add(target+mode,f'{{isa = XCBuildConfiguration; {base} buildSettings = {{{settings}}}; name = {mode};}}'))
    cl=add(target+'Configs',f'{{isa = XCConfigurationList; buildConfigurations = {arr(configs)}; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;}}')
    deps=[]
    if target=='Preacher':
        proxy=add('PreacherWidgetProxy',f'{{isa = PBXContainerItemProxy; containerPortal = {ident("Project")}; proxyType = 1; remoteGlobalIDString = {ident("PreacherWidgetTarget")}; remoteInfo = PreacherWidget;}}')
        deps=[add('PreacherWidgetDependency',f'{{isa = PBXTargetDependency; target = {ident("PreacherWidgetTarget")}; targetProxy = {proxy};}}')]
    elif target!='PreacherWidget':
        proxy=add(target+'Proxy',f'{{isa = PBXContainerItemProxy; containerPortal = {ident("Project")}; proxyType = 1; remoteGlobalIDString = {ident("PreacherTarget")}; remoteInfo = Preacher;}}')
        deps=[add(target+'Dependency',f'{{isa = PBXTargetDependency; target = {ident("PreacherTarget")}; targetProxy = {proxy};}}')]
    add(target+'Target',f'{{isa = PBXNativeTarget; buildConfigurationList = {cl}; buildPhases = {arr(phases)}; buildRules = (); dependencies = {arr(deps) if deps else "()"}; name = {target}; productName = {target}; productReference = {product}; productType = "com.apple.product-type.{productType}";}}')
add('Products','{isa = PBXGroup; children = '+arr(products)+'; name = Products; sourceTree = "<group>";}')
add('Root','{isa = PBXGroup; children = '+arr([ident(n) for n in ['PreacherGroup','PreacherWidgetGroup','PreacherTestsGroup','PreacherUITestsGroup','configGroup','Products']])+'; sourceTree = "<group>";}')
configs=[]
for mode in ['Debug','Release']:
    extra='DEBUG_INFORMATION_FORMAT = dwarf; SWIFT_OPTIMIZATION_LEVEL = "-Onone"; ENABLE_TESTABILITY = YES; SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;' if mode=='Debug' else 'DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym"; SWIFT_COMPILATION_MODE = wholemodule; VALIDATE_PRODUCT = YES;'
    configs.append(add('Project'+mode,f'{{isa = XCBuildConfiguration; buildSettings = {{SDKROOT = iphoneos; CLANG_ENABLE_MODULES = YES; CLANG_ENABLE_OBJC_ARC = YES; GCC_C_LANGUAGE_STANDARD = gnu17; {extra}}}; name = {mode};}}'))
add('ProjectConfigs','{isa = XCConfigurationList; buildConfigurations = '+arr(configs)+'; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;}')
add('Project','{isa = PBXProject; attributes = {BuildIndependentTargetsInParallel = YES; LastUpgradeCheck = 2700;}; buildConfigurationList = '+ident('ProjectConfigs')+'; compatibilityVersion = "Xcode 14.0"; developmentRegion = es; hasScannedForEncodings = 0; knownRegions = (es, en, Base); mainGroup = '+ident('Root')+'; productRefGroup = '+ident('Products')+'; projectDirPath = ""; projectRoot = ""; targets = '+arr([ident(t+'Target') for t in ['Preacher','PreacherWidget','PreacherTests','PreacherUITests']])+';}')
project=root/'Preacher.xcodeproj'
project.mkdir(exist_ok=True)
(project/'project.pbxproj').write_text('// !$*UTF8*$!\n{archiveVersion = 1; classes = {}; objectVersion = 56; objects = {\n'+'\n'.join(k+' = '+v+';' for k,v in objects.items())+'\n}; rootObject = '+ident('Project')+'; }\n')
def buildref(t): return f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident(t+"Target")}" BuildableName="{t}.{ "app" if t=="Preacher" else "xctest"}" BlueprintName="{t}" ReferencedContainer="container:Preacher.xcodeproj"/>'
scheme=f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2700" version="1.3">
<BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{buildref('Preacher')}</BuildActionEntry></BuildActionEntries></BuildAction>
<TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables>{''.join('<TestableReference skipped="NO">'+buildref(t)+'</TestableReference>' for t in ['PreacherTests','PreacherUITests'])}</Testables></TestAction>
<LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{buildref('Preacher')}</BuildableProductRunnable></LaunchAction>
<ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{buildref('Preacher')}</BuildableProductRunnable></ProfileAction>
<AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>'''
p=project/'xcshareddata/xcschemes'; p.mkdir(parents=True,exist_ok=True)
(p/'Preacher.xcscheme').write_text(scheme)
print(project)
