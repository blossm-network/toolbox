module.exports = async ({ payload, root }) => {
  return { events: [{ payload, root, correctNumber: 0 }] };
};
