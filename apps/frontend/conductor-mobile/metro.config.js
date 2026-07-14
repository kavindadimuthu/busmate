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

module.exports = config;
