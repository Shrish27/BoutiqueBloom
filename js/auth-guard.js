import { supabase } from "./supabase.js";

async function protectPage() {
  const localUser = localStorage.getItem("boutiquebloomCurrentUser");

  if (localUser) {
    return;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "login.html";
    return;
  }

  console.log("Logged in user:", user);
}

protectPage();
