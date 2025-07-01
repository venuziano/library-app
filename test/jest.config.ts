module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  roots: ['<rootDir>/src'],
  testRegex: '\\.spec\\.ts$', // only *.spec.ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
};
