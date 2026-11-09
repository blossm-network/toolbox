import { dockerImage } from "../../../runtime.js";

export default {
  name: dockerImage,
  entrypoint: "docker",
  args: ["compose", "logs"],
};
