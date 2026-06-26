export function getOtpEmailSubject(
  type: "sign-in" | "email-verification" | "forget-password" | "change-email",
): string {
  switch (type) {
    case "email-verification":
      return "Verify your Cartura email";
    case "forget-password":
      return "Reset your Cartura password";
    case "change-email":
      return "Confirm your Cartura email change";
    case "sign-in":
      return "Your Cartura sign-in code";
  }
}
