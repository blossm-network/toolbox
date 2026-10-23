import deps from "./pending_deps.js";

export default ({ actionsStore, deliverActionFn }) =>
  deps.deliverPending({
    store: actionsStore,
    key: "id",
    db: deps.db,
    deliverFn: async (action) => {
      const receipt = await deliverActionFn(action);
      if (
        receipt?.id !== action.id ||
        receipt?.intentHash !== action.intentHash
      )
        throw deps.internalServerError.message(
          "Action receiver did not acknowledge durable completion.",
          { info: { id: action.id } }
        );
    },
  });
