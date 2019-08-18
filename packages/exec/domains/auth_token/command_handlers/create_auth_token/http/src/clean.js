module.exports = async body => {
  body.payload.metadata = body.payload.metadata || {};
};
