import bcrypt from "bcryptjs";

export const hash = async (string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(string, salt, null);
};

export const compare = (string, hash) => bcrypt.compare(string, hash);
