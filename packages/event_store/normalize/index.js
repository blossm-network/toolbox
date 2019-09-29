module.exports =
  "function() { const key = this.headers.root; const value = { payload: this.payload, metadata: { count: 0 } }; emit(key, value); }";
