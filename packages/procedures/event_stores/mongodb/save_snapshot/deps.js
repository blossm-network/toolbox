import { write } from "@blossm/mongodb-database";
import { root as merkleRoot } from "@blossm/merkle-tree";

export default {
  db: { write },
  merkleRoot,
};
