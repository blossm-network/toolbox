module.exports =
  "function() { const key = this.headers.root; const value = { ...this.payload, _metadata: { count: 0 } }; emit(key, value); }";
