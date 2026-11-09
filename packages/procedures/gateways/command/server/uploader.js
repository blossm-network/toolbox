import multer from "multer";

export default (limits) =>
  multer({
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 10,
      fields: 100,
      fieldSize: 1024 * 1024,
      parts: 110,
      ...limits,
    },
  }).any();
