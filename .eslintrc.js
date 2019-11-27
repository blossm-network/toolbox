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
  plugins: ["import", "prettier"],
  rules: {
    "import/no-unresolved": 2,
    "import/no-cycle": 2,
    "prefer-template": 2,
    "prettier/prettier": [
      "error",
      {
        printWidth: 80
      }
    ]
  }
};
