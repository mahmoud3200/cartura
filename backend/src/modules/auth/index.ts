export { auth } from "./better-auth.js";
export {
  rejectRestrictedAccount,
  requireAuthentication,
} from "./auth.middleware.js";
export { authNodeHandler } from "./auth.routes.js";
export { signUpWithEmail } from "./auth.signup.js";
export type {
  AuthenticatedRequest,
  Principal,
} from "../../shared/types/authenticated-request.js";
