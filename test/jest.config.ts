module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './unit',
  testRegex: '\\.spec\\.ts$', // only *.spec.ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
};
