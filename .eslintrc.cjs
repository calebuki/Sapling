module.exports = {
  root: true,
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: [".next", "dist", "node_modules", "coverage"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  }
};
