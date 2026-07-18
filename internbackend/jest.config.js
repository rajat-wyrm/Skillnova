module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/modules/auth/**/*.js',
    'src/modules/meetings/**/*.js',
    'src/middleware/**/*.js',
  ],
};
