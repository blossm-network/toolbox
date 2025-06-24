import gcpKms from "@blossm/gcp-kms";
import storage from "@blossm/gcp-storage";
import uuid from "@blossm/uuid";
import { writeFile, readFile, unlink } from "fs";
import { promisify } from "util";

export default {
  decrypt: gcpKms.decrypt,
  encrypt: gcpKms.encrypt,
  createKey: gcpKms.createKey,
  download: storage.download,
  upload: storage.upload,
  uuid,
  readFile: promisify(readFile),
  writeFile: promisify(writeFile),
  unlink: promisify(unlink),
};
