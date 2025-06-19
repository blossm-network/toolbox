import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import deployCliTemplate from "@blossm/deploy-cli-template";

export default deployCliTemplate({
  domain: "command",
  dir: __dirname,
});
