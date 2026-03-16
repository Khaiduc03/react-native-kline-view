
Pod::Spec.new do |s|
  s.name         = "RNKLineView"
  s.version      = "1.0.1"
  s.summary      = "High-performance K-line chart for React Native"
  s.description  = <<-DESC
                  Professional candlestick chart component for React Native with native iOS/Android rendering.
                   DESC
  s.homepage     = "https://github.com/Khaiduc03/react-native-kline-view"
  s.license      = { :type => "Apache-2.0", :file => "LICENSE" }
  s.author       = "Khaiduc03"
  s.platform     = :ios, "9.0"
  s.source       = { :git => "https://github.com/Khaiduc03/react-native-kline-view.git", :tag => s.version.to_s }
  s.source_files  = "ios/Classes/**/*"
  s.requires_arc = true
  s.swift_version = "4.0"

  s.dependency "React"
  s.dependency 'lottie-ios', '~> 4.5.0'

end

  
