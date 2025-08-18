import crypto from "crypto";

const create= async ({ secret, message }) => {
  return await crypto.createHmac("sha256", secret).update(message).digest('hex');
};

export default {
  create
}
