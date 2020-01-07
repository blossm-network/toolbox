module.exports =
  "function() { const key = this.headers.root; const value = { headers: { root: this.headers.root, lastEventNumber: this.headers.number }, state: this.payload }; emit(key, value); }";
