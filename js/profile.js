import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const customerDefaults = {
    fullName: "Aarohi Mehta",
    email: "aarohi.mehta@example.com",
    phone: "+91 98765 12098",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80",
    address: "204, Rosewood Heights, Linking Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    preferences: "Soft florals, handmade accessories, linen dresses, and gift-ready home decor under ₹2500.",
  };

  function fillForm(form, data) {
    Object.entries(data).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field) field.value = value || "";
    });
  }

  function collectFormData(form) {
    return [...new FormData(form).entries()].reduce((profile, [key, value]) => {
      profile[key] = String(value).trim();
      return profile;
    }, {});
  }

  function setImagePreview(input, image) {
    if (!input || !image) return;

    const updatePreview = () => {
      image.src = input.value.trim();
      image.hidden = !input.value.trim();
    };

    input.addEventListener("input", updatePreview);
    updatePreview();
  }

  function showStatus(element, message, type = "success", autoHide = true) {
    if (!element) return;

    element.textContent = message;
    element.hidden = false;
    element.classList.toggle("is-success", type === "success");
    element.classList.toggle("is-error", type === "error");

    clearTimeout(element._timer);
    if (autoHide) {
      element._timer = setTimeout(() => {
        element.hidden = true;
      }, 2800);
    }
  }

  function setFormLoading(form, isLoading, label = "Save Changes") {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;

    button.disabled = isLoading;
    button.textContent = isLoading ? "Saving..." : label;
  }

  async function getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Please log in before editing your seller profile.");
    }

    return user;
  }

  async function fetchSellerProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Seller profile fetch failed:", error);
      throw new Error("We could not load your personal profile.");
    }

    if (!data) {
      throw new Error("No profile was found for this seller account.");
    }

    if (data.role !== "seller") {
      throw new Error("This page is only available for seller accounts.");
    }

    return data;
  }

  async function fetchSellerBusiness(userId) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, owner_id, name, category, description, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Seller business fetch failed:", error);
      throw new Error("We could not load your boutique details.");
    }

    return data;
  }

  function fillSellerForm(form, profile, business) {
    fillForm(form, {
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      boutiqueName: business?.name || "",
      category: business?.category || "",
      description: business?.description || "",
    });
  }

  async function saveSellerProfile(userId, businessId, formData) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: "seller",
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Seller profile update failed:", profileError);
      throw new Error("We could not save your personal profile.");
    }

    const businessPayload = {
      owner_id: userId,
      name: formData.boutiqueName,
      category: formData.category,
      description: formData.description,
    };

    if (businessId) {
      const { error: businessError } = await supabase
        .from("businesses")
        .update(businessPayload)
        .eq("id", businessId)
        .eq("owner_id", userId);

      if (businessError) {
        console.error("Seller business update failed:", businessError);
        throw new Error("We could not save your boutique details.");
      }

      return businessId;
    }

    const { data, error: businessError } = await supabase
      .from("businesses")
      .insert(businessPayload)
      .select("id")
      .single();

    if (businessError) {
      console.error("Seller business insert failed:", businessError);
      throw new Error("We could not create your boutique profile.");
    }

    return data.id;
  }

  async function setupSellerProfileForm() {
    const form = document.getElementById("seller-profile-form");
    if (!form) return;

    const status = document.getElementById("seller-profile-status");
    const profilePreview = document.getElementById("seller-profile-preview");
    const logoPreview = document.getElementById("seller-logo-preview");
    let user = null;
    let businessId = null;

    setImagePreview(document.getElementById("seller-profile-image"), profilePreview);
    setImagePreview(document.getElementById("seller-logo"), logoPreview);
    setFormLoading(form, true, "Save Changes");
    showStatus(status, "Loading your seller profile...", "success", false);

    try {
      user = await getCurrentUser();
      const [profile, business] = await Promise.all([
        fetchSellerProfile(user.id),
        fetchSellerBusiness(user.id),
      ]);

      businessId = business?.id || null;
      fillSellerForm(form, profile, business);
      window.BoutiqueBloomRole?.setRole("seller");

      if (!business) {
        showStatus(
          status,
          "No boutique profile exists yet. Add your boutique details and save to create one.",
          "success",
          false
        );
      } else {
        status.hidden = true;
      }
    } catch (error) {
      console.error("Seller profile setup failed:", error);
      showStatus(status, error.message || "We could not load your seller profile.", "error", false);
      form.dataset.loadFailed = "true";
    } finally {
      setFormLoading(form, false, "Save Changes");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (form.dataset.loadFailed === "true" || !user?.id) {
        showStatus(status, "Please log in with a valid seller account before saving.", "error", false);
        return;
      }

      if (!form.reportValidity()) {
        showStatus(status, "Please complete the required seller profile fields.", "error", false);
        return;
      }

      const formData = collectFormData(form);
      setFormLoading(form, true, "Save Changes");

      try {
        businessId = await saveSellerProfile(user.id, businessId, formData);
        showStatus(status, "Seller profile saved successfully.", "success");
      } catch (error) {
        console.error("Seller profile save failed:", error);
        showStatus(status, error.message || "We could not save your seller profile.", "error", false);
      } finally {
        setFormLoading(form, false, "Save Changes");
      }
    });
  }

  function readStoredProfile(key, defaults) {
    try {
      return { ...defaults, ...(JSON.parse(localStorage.getItem(key)) || {}) };
    } catch {
      return { ...defaults };
    }
  }

  function setupCustomerProfileForm() {
    const form = document.getElementById("customer-profile-form");
    if (!form) return;

    const profile = readStoredProfile("boutiquebloomCustomerProfile", customerDefaults);
    const status = document.getElementById("customer-profile-status");

    fillForm(form, profile);
    setImagePreview(document.getElementById("customer-profile-image"), document.getElementById("customer-profile-preview"));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const updatedProfile = collectFormData(form);

      localStorage.setItem("boutiquebloomCustomerProfile", JSON.stringify(updatedProfile));
      showStatus(status, "Changes saved successfully.");
    });
  }

  setupSellerProfileForm();
  setupCustomerProfileForm();
});
