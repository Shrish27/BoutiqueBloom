(function () {
  const VALID_ROLES = ["seller", "customer"];

  function normalizeRole(role) {
    return VALID_ROLES.includes(role) ? role : "seller";
  }

  function getRole() {
    return "seller";
  }

  function setRole(role) {
    return normalizeRole(role);
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
        const nextRole = normalizeRole(control.value);

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
