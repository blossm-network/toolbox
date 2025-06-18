import { unauthorized } from "@blossm/errors";
import cors from "cors";
import allow from "./src/allow.js";

export default {
  cors,
  allow,
  unauthorizedError: unauthorized,
};
