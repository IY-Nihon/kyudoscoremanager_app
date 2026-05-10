const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withSwift5 = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfile)) {
        let contents = fs.readFileSync(podfile, 'utf8');
        
        // Add post_install workaround for SWIFT_VERSION
        const workaround = `
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # SwiftUI / Swift Concurrency fix
      config.build_settings['SWIFT_VERSION'] = '5.10'
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
      
      # Folly coroutine fix
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
      ['FOLLY_HAS_COROUTINES=0', 'FOLLY_CFG_NO_COROUTINES=1'].each do |value|
        unless config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'].include?(value)
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << value
        end
      end
    end
  end
`;
        
        if (!contents.includes("FOLLY_CFG_NO_COROUTINES=1")) {
          if (contents.includes('post_install do |installer|')) {
            contents = contents.replace(
              'post_install do |installer|',
              'post_install do |installer|' + workaround
            );
            fs.writeFileSync(podfile, contents);
          }
        }
      }
      return config;
    },
  ]);
};

module.exports = withSwift5;
