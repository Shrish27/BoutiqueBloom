import { supabase } from "./supabase.js";
import { attachLogoutHandlers, requireRole } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  attachLogoutHandlers();
  const session = await requireRole("customer");
  if (!session) return;

  const currentCustomerId = session.user.id;
  const products = [];
  const grid = document.getElementById("marketplace-grid");
  const emptyState = document.getElementById("marketplace-empty");
  const clearButton = document.getElementById("clear-marketplace-filters");
  const searchInput = document.getElementById("marketplace-search");
  const categoryFilter = document.getElementById("marketplace-category");
  const stockFilter = document.getElementById("marketplace-stock");
  const sortSelect = document.getElementById("marketplace-sort");
  const modal = document.getElementById("customer-product-modal");
  const featuredCount = document.querySelector(".marketplace-hero-card strong");

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const fallbackImage = "images/logo.png";

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getBusiness(product) {
    return product.business || product.businesses || product.businesses?.[0] || null;
  }

  function toMarketplaceProduct(product) {
    const business = getBusiness(product);

    return {
      id: product.id,
      businessId: product.business_id,
      name: product.name || "Untitled Product",
      description: product.description || "No description available.",
      fullDescription: product.description || "No description available.",
      price: Number(product.price || 0),
      boutiqueName: business?.name || "BoutiqueBloom seller",
      category: product.category || "General",
      stock: Number(product.stock || 0),
      createdAt: product.created_at || "",
      image: product.image_url || fallbackImage,
    };
  }

  function getStockLabel(stock) {
    if (stock <= 0) return "Out of stock";
    if (stock <= 5) return `Low stock: ${stock} left`;
    return `In stock: ${stock} available`;
  }

  function setEmptyState(title, message, showClearButton = true) {
    if (!emptyState) return;

    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = title;
    emptyState.querySelector("p").textContent = message;
    if (clearButton) clearButton.hidden = !showClearButton;
  }

  function hideEmptyState() {
    if (!emptyState) return;

    emptyState.hidden = true;
    if (clearButton) clearButton.hidden = false;
  }

  function setLoadingState() {
    if (grid) {
      grid.innerHTML = `<p>Loading boutique products...</p>`;
    }
    hideEmptyState();
  }

  function showMarketplaceMessage(message, type = "success") {
    let toast = document.getElementById("marketplace-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "marketplace-toast";
      toast.className = "site-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.toggle("is-error", type === "error");
    toast.classList.add("is-visible");

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
          id,
          business_id,
          name,
          category,
          price,
          stock,
          image_url,
          description,
          created_at,
          business:businesses (
            id,
            name,
            category,
            description
          )
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Marketplace product fetch failed:", error);
      throw new Error("We could not load marketplace products right now.");
    }

    return (data || []).map(toMarketplaceProduct);
  }

  function getFilteredProducts() {
    const query = normalize(searchInput?.value);
    const category = categoryFilter?.value || "all";
    const stock = stockFilter?.value || "all";
    const sort = sortSelect?.value || "featured";

    const filtered = products.filter((product) => {
      const content = normalize(`${product.name} ${product.description} ${product.boutiqueName} ${product.category}`);
      const matchesSearch = !query || content.includes(query);
      const matchesCategory = category === "all" || product.category === category;
      const matchesStock =
        stock === "all" ||
        (stock === "in-stock" && product.stock > 0) ||
        (stock === "low-stock" && product.stock > 0 && product.stock <= 5);

      return matchesSearch && matchesCategory && matchesStock;
    });

    if (sort === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "newest" || sort === "featured") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  }

  function renderProducts() {
    const filtered = getFilteredProducts();

    if (!grid) return;

    grid.innerHTML = filtered
      .map((product) => `
        <article class="product-card card">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          <div class="product-card-body">
            <p class="package-tag">${escapeHtml(product.category)}</p>
            <h2>${escapeHtml(product.name)}</h2>
            <p class="seller-name">By ${escapeHtml(product.boutiqueName)}</p>
            <p>${escapeHtml(product.description)}</p>
            <div class="product-card-footer">
              <strong>${formatter.format(product.price)}</strong>
              <span>${escapeHtml(getStockLabel(product.stock))}</span>
            </div>
            <div class="product-card-actions">
              <button class="btn btn-primary view-customer-product" type="button" data-product-id="${escapeHtml(product.id)}">
                View Details
              </button>
              <button class="btn btn-accent add-cart-product" type="button" data-product-id="${escapeHtml(product.id)}" ${product.stock <= 0 ? "disabled" : ""}>
                Add to Cart
              </button>
              <button class="btn buy-now-product" type="button" data-product-id="${escapeHtml(product.id)}" ${product.stock <= 0 ? "disabled" : ""}>
                Buy Now
              </button>
            </div>
          </div>
        </article>
      `)
      .join("");

    if (filtered.length > 0) {
      hideEmptyState();
      return;
    }

    const hasProducts = products.length > 0;
    setEmptyState(
      hasProducts ? "No boutique finds match that search." : "No boutique products are available yet.",
      hasProducts
        ? "Try a softer search term, clear the filters, or browse all categories again."
        : "Check back soon as sellers add their latest boutique products.",
      hasProducts
    );
  }

  function openProductModal(product) {
    if (!product || !modal) return;

    const image = document.getElementById("customer-modal-image");
    image.src = product.image;
    image.alt = product.name;
    document.getElementById("customer-modal-category").textContent = product.category;
    document.getElementById("customer-modal-title").textContent = product.name;
    document.getElementById("customer-modal-description").textContent = product.fullDescription;
    document.getElementById("customer-modal-boutique").textContent = product.boutiqueName;
    document.getElementById("customer-modal-price").textContent = formatter.format(product.price);
    document.getElementById("customer-modal-stock").textContent = getStockLabel(product.stock);

    const addButton = document.getElementById("customer-modal-add-cart");
    const buyButton = document.getElementById("customer-modal-buy-now");

    [addButton, buyButton].forEach((button) => {
      if (!button) return;
      button.dataset.productId = product.id;
      button.disabled = product.stock <= 0;
    });

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  async function addToCart(productId, quantity = 1) {
    const product = products.find((item) => String(item.id) === String(productId));

    if (!product) {
      throw new Error("This product is no longer available.");
    }

    if (product.stock <= 0) {
      throw new Error("This product is currently out of stock.");
    }

    const { data: existingItem, error: lookupError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("customer_id", currentCustomerId)
      .eq("product_id", product.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Cart lookup failed:", lookupError);
      throw new Error("We could not check your cart.");
    }

    if (existingItem) {
      const nextQuantity = Math.min(Number(existingItem.quantity || 0) + quantity, product.stock);
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: nextQuantity })
        .eq("id", existingItem.id)
        .eq("customer_id", currentCustomerId);

      if (updateError) {
        console.error("Cart update failed:", updateError);
        throw new Error("We could not update your cart.");
      }

      return;
    }

    const { error: insertError } = await supabase.from("cart_items").insert({
      customer_id: currentCustomerId,
      product_id: product.id,
      quantity: Math.min(quantity, product.stock),
    });

    if (insertError) {
      console.error("Cart insert failed:", insertError);
      throw new Error("We could not add this product to your cart.");
    }
  }

  async function handleCartAction(button, redirectAfterAdd = false) {
    const productId = button?.dataset.productId;
    if (!productId) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = redirectAfterAdd ? "Preparing..." : "Adding...";

    try {
      await addToCart(productId, 1);

      if (redirectAfterAdd) {
        window.location.href = "cart.html";
        return;
      }

      showMarketplaceMessage("Added to cart.");
    } catch (error) {
      showMarketplaceMessage(error.message || "Could not add item to cart.", "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function closeProductModal() {
    modal?.classList.add("hidden");
    modal?.setAttribute("aria-hidden", "true");
  }

  [searchInput, categoryFilter, stockFilter, sortSelect].forEach((control) => {
    control?.addEventListener(control.tagName === "INPUT" ? "input" : "change", renderProducts);
  });

  clearButton?.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "all";
    stockFilter.value = "all";
    sortSelect.value = "featured";
    renderProducts();
  });

  grid?.addEventListener("click", (event) => {
    const viewButton = event.target.closest(".view-customer-product");
    const addButton = event.target.closest(".add-cart-product");
    const buyButton = event.target.closest(".buy-now-product");

    if (addButton) {
      handleCartAction(addButton);
      return;
    }

    if (buyButton) {
      handleCartAction(buyButton, true);
      return;
    }

    if (!viewButton) return;

    const product = products.find((item) => String(item.id) === String(viewButton.dataset.productId));
    openProductModal(product);
  });

  modal?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-product-modal]")) {
      closeProductModal();
      return;
    }

    const addButton = event.target.closest("#customer-modal-add-cart");
    const buyButton = event.target.closest("#customer-modal-buy-now");

    if (addButton) {
      handleCartAction(addButton);
      return;
    }

    if (buyButton) {
      handleCartAction(buyButton, true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
  });

  setLoadingState();

  try {
    const fetchedProducts = await fetchProducts();
    products.splice(0, products.length, ...fetchedProducts);
    if (featuredCount) {
      featuredCount.textContent = `${products.length} boutique ${products.length === 1 ? "pick" : "picks"}`;
    }
    renderProducts();
  } catch (error) {
    console.error(error);
    if (grid) grid.innerHTML = "";
    setEmptyState(
      "Marketplace products could not load.",
      error.message || "Please refresh the page and try again.",
      false
    );
  }
});
