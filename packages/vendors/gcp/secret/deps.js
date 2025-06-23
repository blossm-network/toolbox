import kms from "@blossm/gcp-kms";
import storage from "@blossm/gcp-storage";
import uuid from "@blossm/uuid";
import { writeFile, readFile, unlink } from "fs";
import { promisify } from "util";

export default {
  decrypt: kms.decrypt,
  encrypt: kms.encrypt,
  createKey: kms.createKey,
  download: storage.download,
  upload: storage.upload,
  uuid,
  readFile: promisify(readFile),
  writeFile: promisify(writeFile),
  unlink: promisify(unlink),
};
