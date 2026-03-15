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
      return JSON.parse(localStorage.getItem("boutiquebloomCurrentUser")) || null;
    } catch {
      return null;
    }
  }

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
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = ($("#email", loginForm)?.value || "").trim();
      const password = ($("#password", loginForm)?.value || "").trim();

      if (!email || !password) {
        showToast("Please enter both email and password.", "error");
        return;
      }

      const users = getStoredUsers();
      const matchedUser = users.find(
        (user) =>
          normalizeText(user.email) === normalizeText(email) &&
          user.password === password
      );

      if (matchedUser) {
        setCurrentUser(matchedUser);
      } else {
        // Frontend-only fallback so demo still works
        setCurrentUser({
          fullName: email.split("@")[0] || "Guest User",
          businessName: "BoutiqueBloom Demo Business",
          email,
        });
      }

      showToast("Signed in successfully.");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    });
  }

  // -----------------------------
  // Signup form
  // -----------------------------
  const signupForm = $("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();

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

      const requiredFields = $$("input, textarea, select", contactForm);
      const hasEmpty = requiredFields.some((field) => !String(field.value).trim());

      if (hasEmpty) {
        showToast("Please complete all contact form fields.", "error");
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

      const fullName = $("#full-name", settingsPageForm)?.value?.trim() || "";
      const businessName = $("#business-name", settingsPageForm)?.value?.trim() || "";
      const email = $("#email", settingsPageForm)?.value?.trim() || "";

      const existingUser = getCurrentUser() || {};
      const updatedUser = {
        ...existingUser,
        fullName,
        businessName,
        email,
      };

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
});