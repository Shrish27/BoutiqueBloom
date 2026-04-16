import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const productGrid = document.getElementById("product-grid");
  const addProductForm = document.getElementById("add-product-form");
  const addProductTitle = document.getElementById("add-product-title");
  const addProductSubmitBtn = document.getElementById("add-product-submit-btn");

  const openAddProductModalBtn = document.getElementById("open-add-product-modal");
  const closeAddProductModalBtn = document.getElementById("close-add-product-modal");
  const addProductModal = document.getElementById("add-product-modal");
  const addProductBackdrop = document.getElementById("add-product-backdrop");

  const productModal = document.getElementById("product-modal");
  const closeProductModalBtn = document.getElementById("close-modal");
  const productModalBackdrop = document.getElementById("modal-backdrop");

  const modalCategory = document.getElementById("modal-category");
  const modalTitle = document.getElementById("modal-title");
  const modalDescription = document.getElementById("modal-description");
  const modalPrice = document.getElementById("modal-price");
  const modalStock = document.getElementById("modal-stock");
  const modalImageWrapper = document.getElementById("modal-image-wrapper");
  const editProductBtn = document.getElementById("edit-product-btn");
  const deleteProductBtn = document.getElementById("delete-product-btn");

  const productNameInput = document.getElementById("product-name");
  const productCategoryInput = document.getElementById("product-category");
  const productPriceInput = document.getElementById("product-price");
  const productStockInput = document.getElementById("product-stock");
  const productImageUrlInput = document.getElementById("product-image-url");
  const productDescriptionInput = document.getElementById("product-description");
  const catalogueStatus = document.getElementById("catalogue-status");

  let currentProducts = [];
  let selectedProduct = null;
  let isEditMode = false;
  let editingProductId = null;
  let sellerBusiness = null;

  function showStatus(message, type = "error", autoHide = false) {
    if (!catalogueStatus) return;

    catalogueStatus.textContent = message;
    catalogueStatus.hidden = false;
    catalogueStatus.classList.toggle("is-success", type === "success");
    catalogueStatus.classList.toggle("is-error", type === "error");

    clearTimeout(catalogueStatus._timer);
    if (autoHide) {
      catalogueStatus._timer = setTimeout(() => {
        catalogueStatus.hidden = true;
      }, 2800);
    }
  }

  function clearStatus() {
    if (!catalogueStatus) return;

    catalogueStatus.textContent = "";
    catalogueStatus.hidden = true;
    catalogueStatus.classList.remove("is-success", "is-error");
  }

  function setAddProductEnabled(isEnabled) {
    if (!openAddProductModalBtn) return;

    openAddProductModalBtn.disabled = !isEnabled;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  async function fetchSellerBusiness(userId) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, owner_id, name, category, description")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error loading seller business:", error.message);
      throw new Error("We could not load your boutique profile.");
    }

    if (!data) {
      throw new Error("Create your seller profile before adding products.");
    }

    return data;
  }

  function resetProductForm() {
    addProductForm?.reset();
    isEditMode = false;
    editingProductId = null;

    if (addProductTitle) {
      addProductTitle.textContent = "Add Product";
    }

    if (addProductSubmitBtn) {
      addProductSubmitBtn.textContent = "Save Product";
    }
  }

  function populateProductForm(product) {
    productNameInput.value = product?.name || "";
    productCategoryInput.value = product?.category || "";
    productPriceInput.value = product?.price ?? "";
    productStockInput.value = product?.stock ?? "";
    productImageUrlInput.value = product?.image_url || "";
    productDescriptionInput.value = product?.description || "";
  }

  function openAddProductModal() {
    if (!sellerBusiness?.id) {
      showStatus("Create your seller profile before adding products.");
      return;
    }

    resetProductForm();
    addProductModal.classList.remove("hidden");
    addProductModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      productNameInput?.focus();
    }, 0);
  }

  function closeAddProductModal() {
    addProductModal.classList.add("hidden");
    addProductModal.setAttribute("aria-hidden", "true");
  }

  function openEditProductModal(product) {
    if (!product) return;

    isEditMode = true;
    editingProductId = product.id;
    populateProductForm(product);

    if (addProductTitle) {
      addProductTitle.textContent = "Edit Product";
    }

    if (addProductSubmitBtn) {
      addProductSubmitBtn.textContent = "Update Product";
    }

    addProductModal.classList.remove("hidden");
    addProductModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      productNameInput?.focus();
    }, 0);
  }

  function openProductModal(product) {
    selectedProduct = product;
    modalCategory.textContent = product.category || "General";
    modalTitle.textContent = product.name || "Untitled Product";
    modalDescription.textContent =
      product.description || "No description available.";
    modalPrice.textContent = `₹${product.price ?? 0}`;
    modalStock.textContent = `Stock: ${product.stock ?? 0}`;

    if (modalImageWrapper) {
      modalImageWrapper.innerHTML = "";
    }

    if (product.image_url && modalImageWrapper) {
      modalImageWrapper.innerHTML = `
        <img
          src="${product.image_url}"
          alt="${product.name || "Product image"}"
          class="modal-product-image"
        />
      `;
    }

    productModal.classList.remove("hidden");
    productModal.setAttribute("aria-hidden", "false");
  }

  function closeProductModal() {
    productModal.classList.add("hidden");
    productModal.setAttribute("aria-hidden", "true");
    selectedProduct = null;
  }

  function findProductById(productId) {
    return currentProducts.find(
      (product) => String(product.id) === String(productId)
    );
  }

  async function refreshProducts({ reopenProductId } = {}) {
    await loadProducts();

    if (reopenProductId) {
      const refreshedProduct = findProductById(reopenProductId);

      if (refreshedProduct) {
        openProductModal(refreshedProduct);
      }
    }
  }

  function protectTyping(element) {
    if (!element) return;

    const allowTyping = (event) => {
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    element.addEventListener("keydown", allowTyping, true);
    element.addEventListener("keypress", allowTyping, true);
    element.addEventListener("keyup", allowTyping, true);
  }

  protectTyping(productNameInput);
  protectTyping(productCategoryInput);
  protectTyping(productPriceInput);
  protectTyping(productStockInput);
  protectTyping(productImageUrlInput);
  protectTyping(productDescriptionInput);

  if (productDescriptionInput) {
    productDescriptionInput.addEventListener(
      "keydown",
      (event) => {
        if (event.key === " " || event.code === "Space") {
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true
    );
  }

  openAddProductModalBtn?.addEventListener("click", openAddProductModal);
  closeAddProductModalBtn?.addEventListener("click", () => {
    closeAddProductModal();
    resetProductForm();
  });
  addProductBackdrop?.addEventListener("click", () => {
    closeAddProductModal();
    resetProductForm();
  });

  closeProductModalBtn?.addEventListener("click", closeProductModal);
  productModalBackdrop?.addEventListener("click", closeProductModal);

  editProductBtn?.addEventListener("click", () => {
    if (!selectedProduct) return;

    closeProductModal();
    openEditProductModal(selectedProduct);
  });

  deleteProductBtn?.addEventListener("click", async () => {
    if (!selectedProduct) return;

    const confirmed = window.confirm(
      `Delete "${selectedProduct.name || "this product"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    const productIdToDelete = selectedProduct.id;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productIdToDelete)
      .eq("business_id", sellerBusiness.id);

    if (error) {
      console.error("Error deleting product:", error.message);
      alert("Failed to delete product.");
      return;
    }

    closeProductModal();
    await refreshProducts();
    alert("Product deleted successfully.");
  });

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName;
    const isTypingField =
      activeTag === "INPUT" ||
      activeTag === "TEXTAREA" ||
      document.activeElement?.isContentEditable;

    if (isTypingField) return;

    if (event.key === "Escape") {
      if (addProductModal && !addProductModal.classList.contains("hidden")) {
        closeAddProductModal();
      }

      if (productModal && !productModal.classList.contains("hidden")) {
        closeProductModal();
      }
    }
  });

  function renderProducts(products) {
    if (!products || products.length === 0) {
      productGrid.innerHTML = `<p>No products found.</p>`;
      return;
    }

    productGrid.innerHTML = products
      .map(
        (product) => {
          const seller =
            product.business ||
            product.businesses ||
            product.businesses?.[0] ||
            sellerBusiness ||
            null;
          const businessName = seller?.name || "Unknown Seller";

          return `
          <article class="package-card card">
            <p class="package-tag">${product.category || "General"}</p>
            <h3>${product.name || "Untitled Product"}</h3>
            <p class="seller-name">Sold by ${businessName}</p>
            <p class="product-description-text">
              ${product.description || "No description available."}
            </p>
            <div class="package-meta">
              <span>₹${product.price ?? 0} · Stock: ${product.stock ?? 0}</span>
              <button
                class="btn btn-primary view-details-btn"
                data-id="${product.id}"
                type="button"
              >
                View Details
              </button>
            </div>
          </article>
        `;
        }
      )
      .join("");
  }

  async function loadProducts() {
    if (!sellerBusiness?.id) {
      currentProducts = [];
      productGrid.innerHTML = `<p>Create your seller profile before adding products.</p>`;
      return;
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("id, business_id, name, category, price, stock, image_url, description, created_at")
      .eq("business_id", sellerBusiness.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error.message);
      productGrid.innerHTML = `<p>Failed to load products.</p>`;
      return;
    }

    currentProducts = products || [];
    renderProducts(currentProducts);
  }

  productGrid?.addEventListener("click", (event) => {
    const viewDetailsButton = event.target.closest(".view-details-btn");

    if (!viewDetailsButton) return;

    const selectedProductId = viewDetailsButton.getAttribute("data-id");
    const product = findProductById(selectedProductId);

    if (product) {
      openProductModal(product);
    }
  });

  addProductForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = productNameInput.value.trim();
    const category = productCategoryInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value, 10);
    const imageUrl = productImageUrlInput.value.trim();
    const description = productDescriptionInput.value.trim();

    if (!sellerBusiness?.id) {
      showStatus("Create your seller profile before adding products.");
      return;
    }

    if (!name || !category || Number.isNaN(price) || Number.isNaN(stock) || !description) {
      showStatus("Please complete all required product fields.");
      return;
    }

    const payload = {
      business_id: sellerBusiness.id,
      name,
      category,
      price,
      stock,
      image_url: imageUrl,
      description,
    };

    let error = null;

    if (isEditMode && editingProductId) {
      const response = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProductId)
        .eq("business_id", sellerBusiness.id);

      error = response.error;
    } else {
      const response = await supabase.from("products").insert([payload]);

      error = response.error;
    }

    if (error) {
      console.error(
        isEditMode ? "Error updating product:" : "Error adding product:",
        error.message
      );
      alert(isEditMode ? "Failed to update product." : "Failed to add product.");
      return;
    }

    const wasEditMode = isEditMode;
    const updatedProductId = editingProductId;

    closeAddProductModal();
    resetProductForm();

    if (wasEditMode && updatedProductId) {
      await refreshProducts({ reopenProductId: updatedProductId });
      showStatus("Product updated successfully.", "success", true);
      return;
    }

    await refreshProducts();
    showStatus("Product added successfully.", "success", true);
  });

  try {
    sellerBusiness = await fetchSellerBusiness(user.id);
    setAddProductEnabled(true);
  } catch (error) {
    console.error("Catalogue setup failed:", error);
    setAddProductEnabled(false);
    showStatus(error.message || "We could not load your boutique profile.");
  }

  await loadProducts();
});
