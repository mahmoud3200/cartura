import { notFoundError } from "../../shared/errors/index.js";

export function notificationNotFoundError(): Error {
  return notFoundError("NOTIFICATION_NOT_FOUND", "Notification not found");
}
