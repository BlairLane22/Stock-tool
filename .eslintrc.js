module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-warning-comments': [1, { terms: ['todo', 'fixme'], location: 'anywhere' }],
  },
  ignorePatterns: ['**/lib/**/*.js', '**/lib/**/*.ts'],
};
