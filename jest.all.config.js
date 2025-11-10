import base from './jest.config.js'

const config = {
  ...base,
  testPathIgnorePatterns: [
    ...(base.testPathIgnorePatterns || []),
    '<rootDir>/__tests__/smoke.test.js'
  ]
}

export { config as default }
