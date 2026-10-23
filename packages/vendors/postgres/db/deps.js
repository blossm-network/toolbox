import pg from "pg";
import { setTimeout } from "node:timers/promises";
import logger from "@blossm/logger";

export default { Pool: pg.Pool, sleep: setTimeout, logger };
