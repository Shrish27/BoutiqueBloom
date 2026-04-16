import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const welcomeText = document.getElementById("welcome-user");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "login.html";
    return;
  }

  console.log("Current user:", user);

  if (welcomeText) {
    const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("full_name")
  .eq("id", user.id)
  .single();

let displayName = "User";

if (!profileError && profile) {
  displayName = profile.full_name;
} else {
  displayName = user.email.split("@")[0]; // fallback
}

welcomeText.textContent = `Welcome Back, ${displayName}`;
  }
  console.log("User ID:", user.id);
});