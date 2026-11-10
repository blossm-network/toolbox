import eventStore from "@blossm/event-store-rpc";
import command from "@blossm/command-rpc";
import uuid from "@blossm/uuid";
import createEvent from "@blossm/create-event";
import { hash } from "@blossm/crypt";

export default { eventStore, command, uuid, createEvent, hash };
