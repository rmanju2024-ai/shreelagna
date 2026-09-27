export function googleAuthHelp(message: string | undefined, status?: number): string {
  const m = (message ?? "").toLowerCase();
  if (status === 400 || m.includes("400") || m.includes("validation") || m.includes("unsupported provider")) {
    return "Google sign-in is not available just now. Please try again shortly.";
  }
  if (m.includes("invalid") && m.includes("api")) {
    return "Sign-in is not available just now. Please try again shortly.";
  }
  return "Could not start Google sign-in. Please try again.";
}
