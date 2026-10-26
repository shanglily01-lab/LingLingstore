module.exports = {
  extends: ['next/core-web-vitals', '../../.eslintrc.cjs'],
  ignorePatterns: ['.next', 'node_modules'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
