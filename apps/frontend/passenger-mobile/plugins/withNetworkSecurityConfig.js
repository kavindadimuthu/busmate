const { withAndroidManifest, withStringsXml } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withNetworkSecurityConfig = (config) => {
  // Add network security config to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Add network security config attributes
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    return config;
  });

  // Add the network security XML file manually during Android build
  config = withAndroidManifest(config, async (config) => {
    if (config.modRequest.platformProjectRoot) {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      const xmlPath = path.join(xmlDir, 'network_security_config.xml');

      // Create directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Create the network security config XML
      const networkSecurityXml = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">107.21.189.199</domain>
        <domain includeSubdomains="false">18.140.161.237</domain>
        <domain includeSubdomains="false">54.91.217.117</domain>
        <domain includeSubdomains="false">47.128.250.151</domain>
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">127.0.0.1</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>
</network-security-config>`;

      // Write the file
      fs.writeFileSync(xmlPath, networkSecurityXml, 'utf8');
    }

    return config;
  });

  return config;
};

module.exports = withNetworkSecurityConfig;