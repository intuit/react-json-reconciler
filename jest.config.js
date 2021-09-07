module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  coverageDirectory: "<rootDir>/coverage/",
  collectCoverage: true,
  verbose: true,
  coverageReporters: ["text", "cobertura", "html", "lcov", "json-summary"],
  collectCoverageFrom: [
    "**/src/**",
    "!**/*.json",
    "!**/theme.*",
    "!**/*.stories.*",
    "!**/*.snippet.*",
    "!**/__tests__/**",
    "!**/*.snap",
    "!**/dist/**",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
