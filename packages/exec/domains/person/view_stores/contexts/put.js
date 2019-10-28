module.exports = body => {
  return {
    update: {
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
    }
  };
};
