module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  ignorePatterns: ['*.config.js', '.*.js'],
  parser: '@typescript-eslint/parser',
  plugins: [
    "react-hooks",
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'no-cond-assign': 'warn',
  },
};