// Jest mock for @sentry/react-native — no-ops to prevent native module init in tests.
const Sentry = {
  init: jest.fn(),
  wrap: jest.fn((Component) => Component),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setContext: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  startTransaction: jest.fn(() => ({ finish: jest.fn() })),
  getCurrentHub: jest.fn(() => ({ getClient: jest.fn() })),
};

module.exports = { __esModule: true, default: Sentry, ...Sentry };
