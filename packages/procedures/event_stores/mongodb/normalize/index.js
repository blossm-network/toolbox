module.exports =
  "function() { const key = this.headers.root; const value = { headers: { root: this.headers.root, created: this.created, version: 1 }, state: this.payload }; emit(key, value); }";
