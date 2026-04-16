console.log("script.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // -----------------------------
  // Helpers
  // -----------------------------
  function showToast(message, type = "success") {
    let toast = document.getElementById("site-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.style.position = "fixed";
      toast.style.right = "20px";
      toast.style.bottom = "20px";
      toast.style.zIndex = "9999";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "14px";
      toast.style.boxShadow = "0 10px 30px rgba(69, 26, 3, 0.12)";
      toast.style.fontFamily = "Open Sans, sans-serif";
      toast.style.fontWeight = "600";
      toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background = type === "error" ? "#fff1f2" : "#fffaf5";
    toast.style.color = type === "error" ? "#9f1239" : "#451a03";
    toast.style.border = `1px solid ${type === "error" ? "#fda4af" : "#fed7aa"}`;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
    }, 2200);
  }

  function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function normalizeSpaces(text) {
  return text.replace(/\s+/g, " ");
}

  function getFieldLabel(field) {
    const explicitLabel = field.id ? document.querySelector(`label[for="${field.id}"]`) : null;
    return (
      explicitLabel?.textContent?.trim() ||
      field.getAttribute("aria-label") ||
      field.name ||
      field.id ||
      "This field"
    );
  }

  function setFieldState(field, message = "") {
    field.setCustomValidity(message);
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  function sanitizeFieldValue(field) {
  if (
    !field ||
    field.matches(
      '[type="checkbox"], [type="radio"], [type="hidden"], [type="submit"], [type="button"], [type="reset"]'
    )
  ) {
    return;
  }

  const tagName = field.tagName.toLowerCase();
  const type = (field.getAttribute("type") || "").toLowerCase();
  const originalValue = String(field.value || "");

  if (tagName === "select") return;

  let sanitized = originalValue;

  if (type === "password") {
    sanitized = originalValue.trim();
  } else if (type === "email" || type === "url") {
    sanitized = originalValue.trim();
  } else if (type === "tel") {
    sanitized = originalValue.replace(/[^\d+()\-\s]/g, "");
    sanitized = sanitized.replace(/\s+/g, " ").trim();
  } else if (tagName === "textarea") {
    // Keep spaces while typing; only remove unsafe characters
    sanitized = originalValue.replace(/[<>]/g, "").replace(/\r/g, "");
  } else {
  sanitized = normalizeSpaces(originalValue.replace(/[<>]/g, ""));
}

  if (sanitized !== originalValue) {
    field.value = sanitized;
  }
}
  function isStrongPassword(value) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/.test(value);
  }

  function validateField(field) {
    if (!field || field.disabled) return true;
    if (field.matches('[type="checkbox"], [type="radio"], [type="hidden"], [type="submit"], [type="button"], [type="reset"]')) {
      return true;
    }

    sanitizeFieldValue(field);

    const form = field.form;
    const tagName = field.tagName.toLowerCase();
    const type = (field.getAttribute("type") || "").toLowerCase();
    const key = `${field.id || ""} ${field.name || ""}`.toLowerCase();
    const label = getFieldLabel(field);
    const value = String(field.value || "");
    const trimmedValue = value.trim();
    let message = "";

    if (field.required && !trimmedValue) {
      message = `${label} is required.`;
    } else if (/[<>]/.test(value)) {
      message = `${label} contains invalid characters.`;
    } else if (type === "email" && trimmedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedValue)) {
      message = "Enter a valid email address.";
    } else if (type === "tel" && trimmedValue && !/^\+?[\d()\-\s]{7,20}$/.test(trimmedValue)) {
      message = "Enter a valid phone number.";
    } else if (type === "url" && trimmedValue) {
      try {
        const parsed = new URL(trimmedValue);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          message = "Website must start with http:// or https://.";
        }
      } catch {
        message = "Enter a valid website URL.";
      }
    } else if ((key.includes("full-name") || key.includes("full_name")) && trimmedValue && !/^[A-Za-z][A-Za-z\s.'-]{1,59}$/.test(trimmedValue)) {
      message = "Enter a valid full name.";
    } else if (key.includes("business-name") || key.includes("business_name")) {
      if (trimmedValue && trimmedValue.length < 2) {
        message = "Business name must be at least 2 characters.";
      } else if (trimmedValue && trimmedValue.length > 80) {
        message = "Business name must be 80 characters or fewer.";
      }
    } else if (key.includes("subject") && trimmedValue && trimmedValue.length < 3) {
      message = "Subject must be at least 3 characters.";
    } else if (tagName === "textarea" && trimmedValue && trimmedValue.length < 10) {
      message = `${label} must be at least 10 characters.`;
    } else if (key.includes("primary-color") || key.includes("primary_color")) {
      if (trimmedValue && !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmedValue)) {
        message = "Enter a valid hex color like #FDA4AF.";
      }
    } else if (type === "password") {
      const isSignupPassword = form?.id === "signup-form" && field.id === "password";
      const isNewPassword = field.id === "new-password";
      const isConfirmPassword = field.id === "confirm-password";

      if ((isSignupPassword || isNewPassword) && trimmedValue && !isStrongPassword(trimmedValue)) {
        message = "Password must be 8+ characters with uppercase, lowercase, and a number.";
      } else if (isConfirmPassword) {
        const sourcePassword =
          $("#password", form) ||
          $("#new-password", form);

        if (trimmedValue && sourcePassword && trimmedValue !== String(sourcePassword.value || "").trim()) {
          message = "Passwords do not match.";
        }
      }
    } else if (trimmedValue && trimmedValue.length > 1000) {
      message = `${label} is too long.`;
    }

    setFieldState(field, message);
    return !message;
  }

  function getProtectedFields(parent = document) {
    return $$("input, textarea, select", parent).filter(
      (field) =>
        !field.disabled &&
        !field.matches('[type="checkbox"], [type="radio"], [type="hidden"], [type="submit"], [type="button"], [type="reset"]')
    );
  }

  function validateFormFields(form) {
    const invalidField = getProtectedFields(form).find((field) => !validateField(field));
    if (invalidField) {
      invalidField.reportValidity();
      invalidField.focus();
      return false;
    }

    return true;
  }

  function protectInteractiveFields(parent = document) {
    getProtectedFields(parent).forEach((field) => {
      if (field.dataset.authProtected === "true") return;

      field.dataset.authProtected = "true";

      if (!field.hasAttribute("maxlength")) {
        const type = (field.getAttribute("type") || "").toLowerCase();
        const maxLength =
          field.tagName.toLowerCase() === "textarea" ? 1000 :
          type === "password" ? 64 :
          type === "email" ? 120 :
          type === "url" ? 200 :
          type === "tel" ? 20 :
          80;

        field.setAttribute("maxlength", String(maxLength));
      }

      const eventName = field.tagName.toLowerCase() === "select" ? "change" : "input";
      field.addEventListener(eventName, () => {
        validateField(field);
      });

      field.addEventListener("blur", () => {
        validateField(field);
      });
    });
  }

  function getStoredUsers() {
    try {
      return JSON.parse(localStorage.getItem("boutiquebloomUsers")) || [];
    } catch {
      return [];
    }
  }

  function setStoredUsers(users) {
    localStorage.setItem("boutiquebloomUsers", JSON.stringify(users));
  }

  function setCurrentUser(user) {
    localStorage.setItem("boutiquebloomCurrentUser", JSON.stringify(user));
  }

  function getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem("boutiquebloomCurrentUser")) || null;
      if (
        user &&
        normalizeText(user.email || "") === "shrish.alva@boutiquebloom.com"
      ) {
        user.fullName = "Shrish";
      }
      return user;
    } catch {
      return null;
    }
  }

  protectInteractiveFields();

  // -----------------------------
  // Global active link highlighting
  // -----------------------------
  $$("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    const targetPage = href.split("/").pop().split("?")[0];
    if (targetPage && targetPage === currentPage) {
      if (link.classList.contains("sidebar-link")) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    }
  });

  // -----------------------------
  // Coming soon page dynamic title
  // -----------------------------
  const moduleTitle = $("#module-title");
  if (moduleTitle) {
    const params = new URLSearchParams(window.location.search);
    const module = params.get("module");
    if (module) {
      const formatted = module
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      moduleTitle.textContent = formatted;
      document.title = `BoutiqueBloom | ${formatted}`;
    }
  }

  // -----------------------------
  // Login form
  // -----------------------------
  const loginForm = $("#login-form");
  if (loginForm && !loginForm.matches("[data-supabase-login]")) {
    const errorMsg = $("#errorMsg", loginForm);

    const setLoginError = (message = "") => {
      if (!errorMsg) return;
      errorMsg.textContent = message;
      errorMsg.hidden = !message;
    };

    const handleLogin = (event) => {
      event.preventDefault();

      if (!validateFormFields(loginForm)) {
        setLoginError("Please correct the highlighted fields.");
        return;
      }

      const email = ($("#email", loginForm)?.value || "").trim();
      const password = ($("#password", loginForm)?.value || "").trim();
      const validEmail = "shrish.alva@boutiquebloom.com";
      const validPassword = "12345";
      const storedUser = getStoredUsers().find(
        (user) => normalizeText(user.email || "") === normalizeText(email)
      );

      if (!email || !password) {
        setLoginError("Please fill all fields");
        return;
      }

      if (
        normalizeText(email) === normalizeText(validEmail) &&
        password === validPassword
      ) {
        setLoginError("");
        const selectedRole = $("#login-role", loginForm)?.value || "seller";
        window.BoutiqueBloomRole?.setRole(selectedRole);
        setCurrentUser({
          fullName: "Shrish",
          businessName: "BoutiqueBloom",
          email: validEmail,
          password: validPassword,
          role: selectedRole,
        });
        window.location.href = window.BoutiqueBloomRole?.getDashboardRoute(selectedRole) || "dashboard.html";
        return;
      }

      if (storedUser && storedUser.password === password) {
        setLoginError("");
        const selectedRole = $("#login-role", loginForm)?.value || storedUser.role || "seller";
        window.BoutiqueBloomRole?.setRole(selectedRole);
        setCurrentUser({ ...storedUser, role: selectedRole });
        window.location.href = window.BoutiqueBloomRole?.getDashboardRoute(selectedRole) || "dashboard.html";
        return;
      }

      setLoginError("Invalid email or password");
    };

    loginForm.addEventListener("submit", handleLogin);
  }

  // -----------------------------
  // Signup form
  // -----------------------------
  const signupForm = $("#signup-form");
  if (signupForm && !signupForm.matches("[data-supabase-signup]")) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validateFormFields(signupForm)) {
        showToast("Please correct the highlighted signup fields.", "error");
        return;
      }

      const fullName = ($("#full-name", signupForm)?.value || "").trim();
      const businessName = ($("#business-name", signupForm)?.value || "").trim();
      const email = ($("#email", signupForm)?.value || "").trim();
      const password = ($("#password", signupForm)?.value || "").trim();
      const confirmPassword = ($("#confirm-password", signupForm)?.value || "").trim();

      if (!fullName || !businessName || !email || !password || !confirmPassword) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Passwords do not match.", "error");
        return;
      }

      const users = getStoredUsers();
      const alreadyExists = users.some(
        (user) => normalizeText(user.email) === normalizeText(email)
      );

      if (alreadyExists) {
        showToast("An account with this email already exists.", "error");
        return;
      }

      const newUser = {
        fullName,
        businessName,
        email,
        password,
      };

      users.push(newUser);
      setStoredUsers(users);
      setCurrentUser(newUser);

      showToast("Account created successfully.");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    });
  }

  // -----------------------------
  // Fill greeting/user details
  // -----------------------------
  const currentUser = getCurrentUser();
  if (currentUser) {
    const dashboardHeading = $(".dashboard-header h1");
    if (dashboardHeading) {
      const firstName = (currentUser.fullName || "Mira").split(" ")[0];
      dashboardHeading.textContent = `Good Evening, ${firstName}`;
    }

    const avatar = $(".avatar-placeholder");
    if (avatar && currentUser.fullName) {
      const initials = currentUser.fullName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      avatar.textContent = initials;
    }

    const profileName = $("#full-name");
    const businessName = $("#business-name");
    const email = $("#email");

    if (currentPage === "settings.html") {
      if (profileName && !profileName.dataset.locked) profileName.value = currentUser.fullName || profileName.value;
      if (businessName && !businessName.dataset.locked) businessName.value = currentUser.businessName || businessName.value;
      if (email && !email.dataset.locked) email.value = currentUser.email || email.value;
    }
  }

  // -----------------------------
  // Logout links/buttons
  // -----------------------------
  $$('a[href="login.html"], button').forEach((el) => {
    const label = (el.textContent || "").trim().toLowerCase();
    if (label === "logout") {
      el.addEventListener("click", (event) => {
        localStorage.removeItem("boutiquebloomCurrentUser");
        if (el.tagName.toLowerCase() === "button") {
          event.preventDefault();
          window.location.href = "login.html";
        }
      });
    }
  });

  // -----------------------------
  // Planner search
  // -----------------------------
  const plannerSearch = $("#planner-search");
  const plannerCards = $$(".planner-card");

  if (plannerSearch && plannerCards.length) {
    plannerSearch.addEventListener("input", () => {
      const query = normalizeText(plannerSearch.value);

      plannerCards.forEach((card) => {
        const content = normalizeText(card.textContent || "");
        card.style.display = !query || content.includes(query) ? "" : "none";
      });
    });
  }

  // -----------------------------
  // Catalogue search + filters
  // -----------------------------
  const catalogueSearch = $("#catalogue-search-input");
  const categoryFilter = $("#category-filter");
  const sortBy = $("#sort-by");
  const packageCards = $$(".package-card");

  function getCardCategory(card) {
    const tag = $(".package-tag", card);
    return normalizeText(tag?.textContent || "");
  }

  function getCardPrice(card) {
    const meta = $(".package-meta", card)?.textContent || "";
    const match = meta.match(/\$([0-9]+)/);
    return match ? Number(match[1]) : 0;
  }

  function filterAndSortCatalogue() {
    if (!packageCards.length) return;

    const query = normalizeText(catalogueSearch?.value || "");
    const category = normalizeText(categoryFilter?.value || "all categories");
    const sort = normalizeText(sortBy?.value || "most popular");

    const grid = $(".package-grid");
    if (!grid) return;

    let visibleCards = [...packageCards].filter((card) => {
      const content = normalizeText(card.textContent || "");
      const cardCategory = getCardCategory(card);

      const matchesQuery = !query || content.includes(query);
      const matchesCategory =
        category === "all categories" ||
        cardCategory.includes(category.replace("brand design", "brand design"));

      return matchesQuery && matchesCategory;
    });

    if (sort === "price: low to high") {
      visibleCards.sort((a, b) => getCardPrice(a) - getCardPrice(b));
    } else if (sort === "price: high to low") {
      visibleCards.sort((a, b) => getCardPrice(b) - getCardPrice(a));
    }

    packageCards.forEach((card) => {
      card.style.display = "none";
    });

    visibleCards.forEach((card) => {
      card.style.display = "";
      grid.appendChild(card);
    });
  }

  if (catalogueSearch || categoryFilter || sortBy) {
    catalogueSearch?.addEventListener("input", filterAndSortCatalogue);
    categoryFilter?.addEventListener("change", filterAndSortCatalogue);
    sortBy?.addEventListener("change", filterAndSortCatalogue);
  }

  // -----------------------------
  // Campaigns search + filters
  // -----------------------------
  const campaignSearch = $("#campaign-search");
  const campaignTypeFilter = $("#campaign-filter");
  const campaignStatusFilter = $("#campaign-status-filter");
  const campaignCards = $$(".campaign-card");

  function filterCampaignCards() {
    if (!campaignCards.length) return;

    const query = normalizeText(campaignSearch?.value || "");
    const typeValue = normalizeText(campaignTypeFilter?.value || "all types");
    const statusValue = normalizeText(campaignStatusFilter?.value || "all statuses");

    campaignCards.forEach((card) => {
      const text = normalizeText(card.textContent || "");
      const status = normalizeText($(".campaign-status", card)?.textContent || "");

      const matchesQuery = !query || text.includes(query);
      const matchesType = typeValue === "all types" || text.includes(typeValue);
      const matchesStatus = statusValue === "all statuses" || status.includes(statusValue);

      card.style.display = matchesQuery && matchesType && matchesStatus ? "" : "none";
    });
  }

  if (campaignSearch || campaignTypeFilter || campaignStatusFilter) {
    campaignSearch?.addEventListener("input", filterCampaignCards);
    campaignTypeFilter?.addEventListener("change", filterCampaignCards);
    campaignStatusFilter?.addEventListener("change", filterCampaignCards);
  }

  // -----------------------------
  // Contact form
  // -----------------------------
  const contactForm = $(".contact-form-card form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validateFormFields(contactForm)) {
        showToast("Please correct the highlighted contact fields.", "error");
        return;
      }

      contactForm.reset();
      showToast("Your message has been sent.");
    });
  }

  // -----------------------------
  // Settings save
  // -----------------------------
  const settingsPageForm = $(".settings-main form");
  if (settingsPageForm) {
    settingsPageForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validateFormFields(settingsPageForm)) {
        showToast("Please correct the highlighted settings fields.", "error");
        return;
      }

      const fullName = $("#full-name", settingsPageForm)?.value?.trim() || "";
      const businessName = $("#business-name", settingsPageForm)?.value?.trim() || "";
      const email = $("#email", settingsPageForm)?.value?.trim() || "";
      const newPassword = $("#new-password", settingsPageForm)?.value?.trim() || "";

      const existingUser = getCurrentUser() || {};
      const updatedUser = {
        ...existingUser,
        fullName,
        businessName,
        email,
      };

      if (newPassword) {
        updatedUser.password = newPassword;
      }

      setCurrentUser(updatedUser);

      const users = getStoredUsers();
      if (users.length) {
        const updatedUsers = users.map((user) =>
          normalizeText(user.email) === normalizeText(existingUser.email || "")
            ? { ...user, ...updatedUser }
            : user
        );
        setStoredUsers(updatedUsers);
      }

      showToast("Settings saved successfully.");
    });
  }

  // -----------------------------
  // Prevent empty demo buttons
  // -----------------------------
  $$("button").forEach((button) => {
    const label = normalizeText(button.textContent || "");
    const isActionOnly =
      [
        "create campaign",
        "open campaign",
        "new post",
        "new campaign",
        "view details",
        "select package",
        "explore package",
        "see recommendations",
        "open asset library",
        "schedule post",
        "upload brand asset",
        "create campaign"
      ].includes(label);

    if (isActionOnly && !button.closest("form")) {
      button.addEventListener("click", () => {
        showToast("This action is ready for the next frontend/backend step.");
      });
    }
  });

  // -----------------------------
  // Back to top
  // -----------------------------
  const backToTopButton = $(".back-to-top");
  if (backToTopButton) {
    const toggleBackToTop = () => {
      backToTopButton.classList.toggle("is-visible", window.scrollY > 200);
    };

    toggleBackToTop();

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
});
/* ==========================
   Page Loading Animation
========================== */

window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");

  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 300);
  }
});

/* show loader when navigating */

document.querySelectorAll("a[href]").forEach(link => {
  const href = link.getAttribute("href");

  if (
    href &&
    !href.startsWith("#") &&
    !href.startsWith("mailto") &&
    !href.startsWith("tel")
  ) {
    link.addEventListener("click", () => {
      const loader = document.getElementById("page-loader");
      if (loader) {
        loader.classList.remove("hidden");
      }
    });
  }
});
/* ==========================
   Dashboard Counter Animation
========================== */

function animateCounters() {
  const counters = document.querySelectorAll(".stat-value[data-target]");

  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    let current = 0;

    const increment = target / 60;

    const updateCounter = () => {
      current += increment;

      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    updateCounter();
  });
}

window.addEventListener("load", () => {
  if (document.querySelector(".stat-value")) {
    animateCounters();
  }
});
