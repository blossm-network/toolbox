module.exports = () => {
  const key = this.headers.root;
  const value = {
    ...this,
    count: 0
  };

  //eslint-disable-next-line
  emit(key, value);
};
