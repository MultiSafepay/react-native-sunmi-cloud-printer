require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ReactNativeSunmiCloudPrinter'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/MultiSafepay/react-native-sunmi-cloud-printer' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
  s.exclude_files = "SDK/*"
  #s.vendored_frameworks = "SDK/SunmiPrinterSDK.xcframework"
  s.frameworks = "ExternalAccessory", "CoreBluetooth"
  # s.vendored_frameworks = "PrinterSDK/SunmiPrinterSDK.xcframework"
  # s.libraries = "xml2.2"
  # s.frameworks = "ExternalAccessory", "CoreBluetooth"
end
