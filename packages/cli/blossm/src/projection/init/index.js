import init from "@blossm/init-cli-template";
export default init({
  domain: "projection",
  dir: __dirname,
  customActionSuggestions: `
       • \`blossm replay\`
          Run all relevant aggregates through the projection.`,
});
