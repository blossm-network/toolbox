module.exports =
  "function() { const key = this.headers.root; const value = { headers: { root: this.headers.root, events: 0 }, state: this.payload }; emit(key, value); }";
