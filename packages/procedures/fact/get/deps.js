import { forbidden } from "@blossm/errors";
import { unlinkSync } from "fs";

export default {
  forbiddenError: forbidden,
  unlinkFile: unlinkSync,
};
