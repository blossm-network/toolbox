module.exports = async ({ payload, root }) => {
  // Create a group.
  return { events: [{ payload, root, correctNumber: 0 }] };
};
