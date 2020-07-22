const { MerkleTree } = require("merkletreejs");

exports.root = ({ data, hashFn }) => {
  //TODO
  console.log({ data });
  const leaves = data.map(hashFn);
  const tree = new MerkleTree(leaves, hashFn);
  const root = tree.getRoot().toString("hex");
  return root;
};

exports.verify = ({ element, data, root, hashFn }) => {
  const leaves = data.map(hashFn);
  const tree = new MerkleTree(leaves, hashFn);
  const leaf = hashFn(element);
  const proof = tree.getProof(leaf);
  return tree.verify(proof, leaf, root);
};
