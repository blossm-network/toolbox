module.exports = body => {
  return {
    data: {
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
