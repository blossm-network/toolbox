const difference = require("@blossm/array-difference");
module.exports = {
  "add-roles": (state, payload) => {
    state.roles = state.roles || [];
    return {
      ...state,
      ...payload,
      roles: state.roles.concat(
        difference(
          payload.roles.map(
            role => `${role.id}:${role.service}:${role.network}`
          ),
          state.roles.map(role => `${role.id}:${role.service}:${role.network}`)
        ).map(stringRole => {
          const [id, service, network] = stringRole.split(":");
          return {
            id,
            service,
            network
          };
        })
      )
    };
  },
  "remove-roles": (state, payload) => {
    return {
      ...state,
      ...payload,
      roles: difference(
        state.roles.map(role => `${role.id}:${role.service}:${role.network}`),
        payload.roles.map(role => `${role.id}:${role.service}:${role.network}`)
      ).map(stringRole => {
        const [id, service, network] = stringRole.split(":");
        return {
          id,
          service,
          network
        };
      })
    };
  },
  "add-scenes": (state, payload) => {
    state.scenes = state.scenes || [];
    return {
      ...state,
      ...payload,
      scenes: state.scenes.concat(
        difference(
          payload.scenes.map(
            scene => `${scene.root}:${scene.service}:${scene.network}`
          ),
          state.scenes.map(
            scene => `${scene.root}:${scene.service}:${scene.network}`
          )
        ).map(stringScene => {
          const [root, service, network] = stringScene.split(":");
          return {
            root,
            service,
            network
          };
        })
      )
    };
  },
  "remove-scenes": (state, payload) => {
    return {
      ...state,
      ...payload,
      scenes: difference(
        state.scenes.map(
          scene => `${scene.root}:${scene.service}:${scene.network}`
        ),
        payload.scenes.map(
          scene => `${scene.root}:${scene.service}:${scene.network}`
        )
      ).map(stringScene => {
        const [root, service, network] = stringScene.split(":");
        return {
          root,
          service,
          network
        };
      })
    };
  }
};
