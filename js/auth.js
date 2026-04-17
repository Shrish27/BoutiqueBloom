import { supabase } from "./supabase.js";

export const ROLES = {
  seller: "seller",
  customer: "customer",
};

export const ROLE_HOME = {
  seller: "dashboard.html",
  customer: "marketplace.html",
};

export function getRoleHome(role) {
  return ROLE_HOME[role] || "login.html";
}

export function getProfileRoute(role) {
  return role === ROLES.customer ? "customer-profile.html" : "seller-profile.html";
}

export async function getCurrentSessionProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup failed:", profileError);
    throw new Error("PROFILE_LOOKUP_FAILED");
  }

  if (!profile || !Object.values(ROLES).includes(profile.role)) {
    throw new Error("PROFILE_ROLE_INVALID");
  }

  return { user, profile };
}

export async function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  try {
    const session = await getCurrentSessionProfile();

    if (!roles.includes(session.profile.role)) {
      window.location.replace(getRoleHome(session.profile.role));
      return null;
    }

    return session;
  } catch (error) {
    if (error.message === "AUTH_REQUIRED") {
      window.location.replace("login.html");
      return null;
    }

    console.error("Route protection failed:", error);
    await supabase.auth.signOut();
    window.location.replace("login.html");
    return null;
  }
}

export function attachLogoutHandlers(parent = document) {
  parent.querySelectorAll("[data-logout], a, button").forEach((element) => {
    const label = (element.textContent || "").trim().toLowerCase();
    const isLogout =
      element.matches("[data-logout]") ||
      (label === "logout" && element.getAttribute("href") === "login.html") ||
      (label === "logout" && element.tagName.toLowerCase() === "button");

    if (!isLogout || element.dataset.supabaseLogout === "true") return;

    element.dataset.supabaseLogout = "true";
    element.addEventListener("click", async (event) => {
      event.preventDefault();
      localStorage.removeItem("boutiquebloomCurrentUser");
      localStorage.removeItem("boutiquebloomRole");
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  });
}
