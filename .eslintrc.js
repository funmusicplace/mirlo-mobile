// https://docs.expo.dev/guides/using-eslint/
module.exports = {
    extends: ["expo", "plugin:react-native-a11y/all", "prettier"],
    ignorePatterns: ["/dist/*"],
    plugins: ["prettier"],
    rules: {
        "prettier/prettier": "warn",
        // Hints only where the label doesn't make the result clear
        "react-native-a11y/has-accessibility-hint": "off",
    },
};
