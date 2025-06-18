import crypto from "crypto";
export default () => crypto.randomBytes(16).toString("hex");
