import { supabase } from "./supabase.js";

const VALID_ROLES = ["seller", "customer"];

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.hidden = true;
}

function getDashboardRoute(role) {
  if (window.BoutiqueBloomRole) {
    return window.BoutiqueBloomRole.getDashboardRoute(role);
  }

  return role === "customer" ? "marketplace.html" : "dashboard.html";
}

async function getProfileRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile role lookup failed:", error);
    throw new Error("We could not load your account profile. Please try again.");
  }

  if (!data) {
    throw new Error("No profile was found for this account. Please contact support or sign up again.");
  }

  if (!VALID_ROLES.includes(data.role)) {
    throw new Error("This account has an unsupported role. Please contact support.");
  }

  return data.role;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Please enter both email and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing In...";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showError(error.message || "Invalid email or password.");
      return;
    }

    console.log("Login success:", data);

    if (!data.user?.id) {
      showError("Login succeeded, but we could not identify your account.");
      return;
    }

    const role = await getProfileRole(data.user.id);

    window.BoutiqueBloomRole?.setRole(role);
    window.location.href = getDashboardRoute(role);
  } catch (err) {
    console.error("Unexpected login error:", err);
    showError(err.message || "Something went wrong while signing in.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});
