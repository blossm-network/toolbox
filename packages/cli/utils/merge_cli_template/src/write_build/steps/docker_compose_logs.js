import { dockerImage } from "../../../runtime.js";
import { scripts, logsThenVerdict } from "./integration_suite.js";

// The last step of a test-only build: print container logs, then fail the
// build if a suite it ran did not record success.
export default ({ runBaseIntegrationTests, runIntegrationTests } = {}) => ({
  name: dockerImage,
  entrypoint: "sh",
  args: [
    "-c",
    logsThenVerdict([
      ...(runBaseIntegrationTests ? [scripts.base] : []),
      ...(runIntegrationTests ? [scripts.custom] : []),
    ]),
  ],
});
