const path = require("path");
const { createDefaultPreset, pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require('./tsconfig');

const srcRootDir = path.join('<rootDir>', compilerOptions.baseUrl);

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  ...createDefaultPreset(),
  roots: [srcRootDir],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: srcRootDir }),
};
