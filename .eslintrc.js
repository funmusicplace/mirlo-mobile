// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "plugin:react-native-a11y/all", "prettier"],
  ignorePatterns: ["/dist/*"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "warn",
    // Hints only where the label doesn't make the result clear
    "react-native-a11y/has-accessibility-hint": "off",
    "no-restricted-syntax": [
      "error",
      {
        selector: 'CallExpression[callee.name="t"] > Literal:nth-child(2)',
        message:
          "Put the text in translation/en.json, t() takes the key and options only",
      },
      {
        selector:
          'CallExpression[callee.name="t"] Property[key.name="defaultValue"]',
        message:
          "Put the text in translation/en.json, t() takes the key and options only",
      },
    ],
    // Bare text in JSX has to come from t(), string props are out of scope
    "react/jsx-no-literals": [
      "error",
      {
        noStrings: true,
        ignoreProps: true,
        allowedStrings: ["·", "/", "(", ")", "•", "-", ":"],
      },
    ],
  },
  overrides: [
    {
      files: ["stories/**", "**/*.stories.*", "__tests__/**"],
      rules: { "react/jsx-no-literals": "off" },
    },
  ],
};
