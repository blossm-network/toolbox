import deployCliTemplate from "@blossm/deploy-cli-template";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default deployCliTemplate({
  domain: "projection",
  dir: __dirname,
});
