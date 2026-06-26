import { toNodeHandler } from "better-auth/node";

import { auth } from "./better-auth.js";

export const authNodeHandler = toNodeHandler(auth);
