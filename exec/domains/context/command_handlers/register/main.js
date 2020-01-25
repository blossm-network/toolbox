module.exports = async ({ payload, root }) => {
  // Create a group and a principle if needed.
  return { events: [{ payload, root, correctNumber: 0 }] };
};
