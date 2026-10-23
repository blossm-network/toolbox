import { nodeImage } from "../../../runtime.js";

export default {
  name: nodeImage,
  entrypoint: "yarn",
  args: ["test:unit"],
};
