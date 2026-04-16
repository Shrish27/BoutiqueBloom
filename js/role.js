(function () {
  const ROLE_KEY = "boutiquebloomRole";
  const VALID_ROLES = ["seller", "customer"];

  function getRole() {
    const storedRole = localStorage.getItem(ROLE_KEY);
    return VALID_ROLES.includes(storedRole) ? storedRole : "seller";
  }

  function setRole(role) {
    const nextRole = VALID_ROLES.includes(role) ? role : "seller";
    localStorage.setItem(ROLE_KEY, nextRole);
    return nextRole;
  }

  function getDashboardRoute(role = getRole()) {
    return role === "customer" ? "marketplace.html" : "dashboard.html";
  }

  function getProfileRoute(role = getRole()) {
    return role === "customer" ? "customer-profile.html" : "seller-profile.html";
  }

  function syncRoleControls(parent = document) {
    const role = getRole();

    parent.querySelectorAll("[data-role-control]").forEach((control) => {
      control.value = role;
      control.addEventListener("change", () => {
        const nextRole = setRole(control.value);

        parent.querySelectorAll("[data-role-route]").forEach((link) => {
          const routeType = link.getAttribute("data-role-route");
          link.setAttribute(
            "href",
            routeType === "profile" ? getProfileRoute(nextRole) : getDashboardRoute(nextRole)
          );
        });

        if (control.dataset.roleRedirect === "home") {
          window.location.href = getDashboardRoute(nextRole);
        }
      });
    });

    parent.querySelectorAll("[data-role-route]").forEach((link) => {
      const routeType = link.getAttribute("data-role-route");
      link.setAttribute(
        "href",
        routeType === "profile" ? getProfileRoute(role) : getDashboardRoute(role)
      );
    });
  }

  function redirectToRoleHome() {
    window.location.href = getDashboardRoute();
  }

  window.BoutiqueBloomRole = {
    getRole,
    setRole,
    getDashboardRoute,
    getProfileRoute,
    syncRoleControls,
    redirectToRoleHome,
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncRoleControls();
  });
})();
