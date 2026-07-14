const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const resolveFromProject = (packageName) =>
  path.dirname(require.resolve(`${packageName}/package.json`, { paths: [projectRoot] }));

const config = getDefaultConfig(projectRoot);

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
