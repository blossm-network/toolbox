import { scripts, suite } from "./integration_suite.js";

export default ({ strict } = {}) => suite({ script: scripts.base, strict });
