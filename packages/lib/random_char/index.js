import deps from "./deps.js";

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default () => characters.charAt(deps.randomInt(characters.length));
