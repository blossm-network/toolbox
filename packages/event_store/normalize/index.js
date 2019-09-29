module.exports =
  "function() { const key = this.headers.root; const value = { headers: { root: this.headers.root }, payload: this.payload, metadata: { count: 0 } }; emit(key, value); }";
