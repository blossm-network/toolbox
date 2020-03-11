module.exports = payload => {
  return {
    scene: {
      root: payload.scene.root,
      service: payload.scene.service,
      network: payload.scene.network
    }
  };
};
