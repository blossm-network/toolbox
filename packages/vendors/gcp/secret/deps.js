import { decrypt, createKey, encrypt } from "@blossm/gcp-kms";
import { download, upload } from "@blossm/gcp-storage";
import uuid from "@blossm/uuid";
import { writeFile, readFile, unlink } from "fs";
import { promisify } from "util";

export default {
  decrypt,
  encrypt,
  createKey,
  download,
  upload,
  uuid,
  readFile: promisify(readFile),
  writeFile: promisify(writeFile),
  unlink: promisify(unlink),
};
