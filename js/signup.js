import { supabase } from "./supabase.js";

const VALID_ROLES = ["seller", "customer"];

const form = document.getElementById("signup-form");
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const roleInput = document.getElementById("signup-role");
const messageBox = document.getElementById("signupMessage");
const signupBtn = document.getElementById("signupBtn");

function setMessage(message, type = "error") {
  messageBox.textContent = message;
  messageBox.hidden = false;
  messageBox.classList.toggle("auth-error-text", type === "error");
  messageBox.classList.toggle("auth-success-text", type === "success");
}

function clearMessage() {
  messageBox.textContent = "";
  messageBox.hidden = true;
  messageBox.classList.remove("auth-error-text", "auth-success-text");
}

function getSignupValues() {
  return {
    fullName: fullNameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput?.value.trim() || "",
    password: passwordInput.value,
    confirmPassword: confirmPasswordInput.value,
    role: roleInput.value,
  };
}

function validateSignup(values) {
  if (!values.fullName || !values.email || !values.password || !values.confirmPassword || !values.role) {
    return "Please fill in all required fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
    return "Enter a valid email address.";
  }

  if (values.phone && !/^\+?[\d()\-\s]{7,20}$/.test(values.phone)) {
    return "Enter a valid phone number.";
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/.test(values.password)) {
    return "Password must be 8+ characters with uppercase, lowercase, and a number.";
  }

  if (values.password !== values.confirmPassword) {
    return "Passwords do not match.";
  }

  if (!VALID_ROLES.includes(values.role)) {
    return "Please choose either seller or customer.";
  }

  return "";
}

function setLoading(isLoading) {
  signupBtn.disabled = isLoading;
  signupBtn.textContent = isLoading ? "Creating Account..." : "Create Account";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const values = getSignupValues();
  const validationError = validateSignup(values);

  if (validationError) {
    setMessage(validationError);
    return;
  }

  setLoading(true);

  try {
    const { data, error: signupError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone: values.phone,
          role: values.role,
        },
      },
    });

    if (signupError) {
      setMessage(signupError.message || "Could not create your account.");
      return;
    }

    const user = data.user;

    if (!user?.id) {
      setMessage("Signup succeeded, but no user profile could be created yet. Please check your email and try logging in.");
      return;
    }

    // Keep the public profile row in sync with the Supabase Auth user.
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: values.fullName,
      email: values.email,
      phone: values.phone,
      role: values.role,
    });

    if (profileError) {
      setMessage(profileError.message || "Account created, but profile setup failed.");
      return;
    }

    localStorage.removeItem("boutiquebloomCurrentUser");
    localStorage.removeItem("boutiquebloomRole");
    setMessage("Account created successfully. Redirecting to login...", "success");
    form.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  } catch (error) {
    console.error("Unexpected signup error:", error);
    setMessage("Something went wrong while creating your account.");
  } finally {
    setLoading(false);
  }
});
