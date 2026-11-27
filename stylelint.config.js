/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-prettier/recommended'],
  // No escape hatches: `stylelint-disable` comments are ignored (docs/architecture/quality.md)
  ignoreDisables: true,
  rules: {
    'prettier/prettier': true,
    'rule-empty-line-before': [
      'always',
      { except: ['first-nested'], ignore: ['after-comment'] },
    ],
    'length-zero-no-unit': true,
    'no-empty-source': null,
    'declaration-no-important': true,
    'max-nesting-depth': 3,
    'selector-max-id': 0,
    'selector-max-compound-selectors': 4,
    'color-named': 'never',
  },
};
