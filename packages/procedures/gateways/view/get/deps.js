import viewStore from "@blossm/view-store-rpc";
import viewComposite from "@blossm/view-composite-rpc";
import { forbidden } from "@blossm/errors";

export default {
  viewStore,
  viewComposite,
  forbiddenError: forbidden,
};
