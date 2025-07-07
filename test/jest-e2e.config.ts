module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testRegex: '\\.e2e-spec\\.ts$', // only *.spec.ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
};
