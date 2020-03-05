module.exports = ({ context }) => {
  //eslint-disable-next-line no-console
  console.log({ context });
  return { root: context.identity };
};
