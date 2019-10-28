module.exports = body => {
  return {
    ...(body.add && {
      $push: {
        contexts: body.add
      }
    }),
    ...(body.remove && {
      $pull: {
        contexts: {
          root: body.remove
        }
      }
    })
  };
};
