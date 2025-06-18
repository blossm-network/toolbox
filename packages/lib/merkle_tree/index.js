import { BaseTrie as Trie } from "merkle-patricia-tree";

export const root = async (pairs) => {
  const trie = new Trie();
  const ops = pairs.map((pair) => ({
    type: "put",
    key: Buffer.from(pair[0]),
    value: Buffer.from(pair[1]),
  }));
  await trie.batch(ops);
  return trie.root;
};

export const verify = async ({ pairs, key, value, root }) => {
  const trie = new Trie();
  const ops = pairs.map((pair) => ({
    type: "put",
    key: Buffer.from(pair[0]),
    value: Buffer.from(pair[1]),
  }));
  await trie.batch(ops);
  const proof = await Trie.createProof(trie, Buffer.from(key));
  const recordedValue = await Trie.verifyProof(root, Buffer.from(key), proof);
  return recordedValue == null ? false : value == recordedValue.toString();
};
