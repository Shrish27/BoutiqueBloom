import { attachLogoutHandlers, requireRole } from "./auth.js";

const SELLER_PAGES = new Set([
  "dashboard.html",
  "campaigns.html",
  "planner.html",
  "catalogue.html",
  "settings.html",
  "seller-profile.html",
  "coming-soon.html",
]);

const CUSTOMER_PAGES = new Set([
  "marketplace.html",
  "cart.html",
  "customer-profile.html",
]);

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

async function protectPage() {
  attachLogoutHandlers();

  const page = getCurrentPage();

  if (CUSTOMER_PAGES.has(page)) {
    await requireRole("customer");
    return;
  }

  if (SELLER_PAGES.has(page)) {
    await requireRole("seller");
  }
}

protectPage();
