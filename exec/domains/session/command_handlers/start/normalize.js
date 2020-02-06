module.exports = async payload => {
  return {
    device: {
      os: payload.device.os,
      version: payload.device.version,
      hardware: payload.device.hardware,
      manufacturer: payload.device.manufacturer
    }
  };
};
