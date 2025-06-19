import init from "@blossm/init-cli-template";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default init({
  domain: "projection",
  dir: __dirname,
  customActionSuggestions: `
       • \`blossm replay\`
          Run all relevant aggregates through the projection.`,
});
