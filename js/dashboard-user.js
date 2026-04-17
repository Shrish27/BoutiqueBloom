import { attachLogoutHandlers, requireRole } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  attachLogoutHandlers();
  const welcomeText = document.getElementById("welcome-user");

  const session = await requireRole("seller");
  if (!session) return;

  if (welcomeText) {
    const displayName =
      session.profile.full_name ||
      session.profile.email?.split("@")[0] ||
      "Seller";

    welcomeText.textContent = `Welcome Back, ${displayName}`;
  }
});
