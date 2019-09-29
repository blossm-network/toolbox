module.exports = () => {
  const key = this.headers.root;
  const value = {
    ...this.payload,
    _metadata: {
      count: 0
    }
  };

  //eslint-disable-next-line
  emit(key, value);
};
