module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    "^react-router-dom$": "<rootDir>/node_modules/react-router-dom"
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
