module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    mocha: true
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ["eslint:recommended", "prettier"],
  plugins: ["import"],
  rules: {
    "import/no-unresolved": 2,
    "import/no-cycle": 2,
    "no-useless-escape": "off",
    "prefer-template": 2,
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "object-shorthand": ["error", "always"]
  }
};
