const path = require('path');
// Drop-in replacement for expo/metro-config's getDefaultConfig that additionally wires
// Metro's serializer to emit Sentry debug IDs, so uploaded source maps (Phase 5
// observability) actually match release bundles. Accepts the same config shape —
// everything below is unchanged from before Sentry was added.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const resolveFromProject = (packageName) =>
  path.dirname(require.resolve(`${packageName}/package.json`, { paths: [projectRoot] }));

const config = getSentryExpoConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  react: resolveFromProject('react'),
  'react-dom': resolveFromProject('react-dom'),
  'react-native': resolveFromProject('react-native'),
};

// Ensure assets are handled properly
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

// Platform-specific asset handling for Android
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Asset registration for Android
config.resolver.platforms = [...config.resolver.platforms, 'android', 'ios'];

module.exports = config;
