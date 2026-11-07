// https://docs.expo.dev/guides/using-eslint/
const A11Y_PROP = "JSXAttribute[name.name=/^accessibility(Label|Hint)$/]";
const A11Y_VALUE =
  'JSXAttribute[name.name="accessibilityValue"] Property[key.name="text"]';
// A template counts when its fixed text has letters, `${a}, ${b}` joins data
const WORDS = "TemplateElement[value.raw=/[A-Za-z]/]";

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
      {
        selector: [
          `${A11Y_PROP} > Literal`,
          `${A11Y_PROP} > JSXExpressionContainer > Literal`,
          `${A11Y_PROP} > JSXExpressionContainer > TemplateLiteral > ${WORDS}`,
          `${A11Y_PROP} > JSXExpressionContainer > ConditionalExpression > Literal`,
          `${A11Y_VALUE} > Literal`,
          `${A11Y_VALUE} > TemplateLiteral > ${WORDS}`,
          `${A11Y_VALUE} > ConditionalExpression > Literal`,
        ].join(", "),
        message:
          "Accessibility text comes from t(), put it in translation/en.json",
      },
    ],
    // Bare text in JSX has to come from t(), other string props are out of scope
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
      rules: {
        "react/jsx-no-literals": "off",
        "no-restricted-syntax": "off",
      },
    },
  ],
};
