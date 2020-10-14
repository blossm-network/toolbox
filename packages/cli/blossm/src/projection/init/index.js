const init = require("@blossm/init-cli-template");
module.exports = init({
  domain: "projection",
  dir: __dirname,
  customActionSuggestions: `
       • \`blossm replay\`
         Run all relevant aggregates through the projection.`,
});
