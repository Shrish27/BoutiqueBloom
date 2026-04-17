import { supabase } from "./supabase.js";
import { attachLogoutHandlers, requireRole } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  attachLogoutHandlers();

  const session = await requireRole("customer");
  if (!session) return;

  const customerId = session.user.id;
  const cartList = document.getElementById("cart-list");
  const cartEmpty = document.getElementById("cart-empty");
  const cartStatus = document.getElementById("cart-status");
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");
  const checkoutButton = document.getElementById("checkout-button");

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const fallbackImage = "images/logo.png";
  let cartItems = [];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getProduct(item) {
    return item.product || item.products || item.products?.[0] || null;
  }

  function showStatus(message, type = "success", autoHide = true) {
    if (!cartStatus) return;

    cartStatus.textContent = message;
    cartStatus.hidden = false;
    cartStatus.classList.toggle("is-success", type === "success");
    cartStatus.classList.toggle("is-error", type === "error");

    clearTimeout(cartStatus._timer);
    if (autoHide) {
      cartStatus._timer = setTimeout(() => {
        cartStatus.hidden = true;
      }, 2600);
    }
  }

  async function loadCartItems() {
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
          id,
          customer_id,
          product_id,
          quantity,
          created_at,
          product:products (
            id,
            name,
            category,
            price,
            stock,
            image_url,
            description,
            business:businesses (
              id,
              name
            )
          )
        `
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Cart fetch failed:", error);
      throw new Error("We could not load your cart.");
    }

    cartItems = data || [];
  }

  function renderCart() {
    const validItems = cartItems.filter((item) => getProduct(item));
    const total = validItems.reduce((sum, item) => {
      const product = getProduct(item);
      return sum + Number(product.price || 0) * Number(item.quantity || 0);
    }, 0);

    if (cartCount) {
      const quantity = validItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      cartCount.textContent = `${quantity} ${quantity === 1 ? "item" : "items"}`;
    }

    if (cartTotal) {
      cartTotal.textContent = formatter.format(total);
    }

    if (checkoutButton) {
      checkoutButton.disabled = validItems.length === 0;
    }

    if (!cartList) return;

    if (!validItems.length) {
      cartList.innerHTML = "";
      if (cartEmpty) cartEmpty.hidden = false;
      return;
    }

    if (cartEmpty) cartEmpty.hidden = true;

    cartList.innerHTML = validItems
      .map((item) => {
        const product = getProduct(item);
        const business = product.business || product.businesses || product.businesses?.[0] || null;
        const quantity = Number(item.quantity || 1);
        const stock = Number(product.stock || 0);
        const subtotal = Number(product.price || 0) * quantity;

        return `
          <article class="cart-item card">
            <img src="${escapeHtml(product.image_url || fallbackImage)}" alt="${escapeHtml(product.name)}" />
            <div class="cart-item-main">
              <p class="package-tag">${escapeHtml(product.category || "General")}</p>
              <h2>${escapeHtml(product.name || "Untitled Product")}</h2>
              <p class="seller-name">By ${escapeHtml(business?.name || "BoutiqueBloom seller")}</p>
              <p>${escapeHtml(product.description || "No description available.")}</p>
              <p class="cart-stock">${stock > 0 ? `${stock} in stock` : "Out of stock"}</p>
            </div>
            <div class="cart-item-controls">
              <strong>${formatter.format(product.price || 0)}</strong>
              <label>
                <span>Qty</span>
                <input class="cart-quantity-input" type="number" min="1" max="${stock || 1}" value="${quantity}" data-cart-id="${escapeHtml(item.id)}" ${stock <= 0 ? "disabled" : ""} />
              </label>
              <span class="cart-subtotal">${formatter.format(subtotal)}</span>
              <button class="btn btn-outline remove-cart-item" type="button" data-cart-id="${escapeHtml(item.id)}">Remove</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function refreshCart() {
    if (cartList) {
      cartList.innerHTML = "<p>Loading your cart...</p>";
    }

    await loadCartItems();
    renderCart();
  }

  async function updateQuantity(cartId, quantity) {
    const item = cartItems.find((cartItem) => String(cartItem.id) === String(cartId));
    const product = item ? getProduct(item) : null;

    if (!item || !product) {
      throw new Error("This cart item is no longer available.");
    }

    const stock = Number(product.stock || 0);
    const nextQuantity = Math.max(1, Math.min(Number(quantity || 1), stock || 1));

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", cartId)
      .eq("customer_id", customerId);

    if (error) {
      console.error("Cart quantity update failed:", error);
      throw new Error("We could not update that quantity.");
    }
  }

  async function removeCartItem(cartId) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartId)
      .eq("customer_id", customerId);

    if (error) {
      console.error("Cart remove failed:", error);
      throw new Error("We could not remove that item.");
    }
  }

  cartList?.addEventListener("change", async (event) => {
    const input = event.target.closest(".cart-quantity-input");
    if (!input) return;

    input.disabled = true;

    try {
      await updateQuantity(input.dataset.cartId, input.value);
      await refreshCart();
      showStatus("Cart updated.");
    } catch (error) {
      showStatus(error.message || "Could not update cart.", "error", false);
      await refreshCart();
    }
  });

  cartList?.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-cart-item");
    if (!button) return;

    button.disabled = true;

    try {
      await removeCartItem(button.dataset.cartId);
      await refreshCart();
      showStatus("Item removed.");
    } catch (error) {
      showStatus(error.message || "Could not remove item.", "error", false);
      button.disabled = false;
    }
  });

  checkoutButton?.addEventListener("click", () => {
    showStatus("Checkout is ready for the next payment integration step.", "success");
  });

  try {
    await refreshCart();
  } catch (error) {
    if (cartList) cartList.innerHTML = "";
    showStatus(error.message || "Could not load cart.", "error", false);
  }
});
