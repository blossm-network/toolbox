// module.exports =
//   "() => { const key = this.headers.root; const value = { ...this.payload, _metadata: { count: 0 } }; emit(key, value); }";

module.exports = `() => {
  const key = this.headers.root;
  const value = {
    headers: {
      root: this.headers.root
    },
    ...this.payload,
    _metadata: {
      count: 0
    }
  };
  emit(key, value);
}`;
