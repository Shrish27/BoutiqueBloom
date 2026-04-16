import { supabase } from "./supabase.js";

async function loadProducts() {
  const output = document.getElementById("product-output");

  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    console.error("Supabase error:", error);
    if (output) {
      output.innerHTML = `<p>Error: ${error.message}</p>`;
    }
    return;
  }

  console.log("Connected successfully. Data:", data);

  if (!output) {
    return;
  }

  if (!data || data.length === 0) {
    output.innerHTML = "<p>No products found in Supabase.</p>";
    return;
  }

  output.innerHTML = data
    .map(
      (product) => `
        <div style="border:1px solid #ddd; padding:16px; margin:12px 0; border-radius:12px; background:#fff;">
          <h3 style="margin:0 0 8px 0;">${product.product_name ?? "Unnamed Product"}</h3>
          <p style="margin:4px 0;">Category: ${product.category ?? "N/A"}</p>
          <p style="margin:4px 0;">Price: ₹${product.price ?? 0}</p>
          <p style="margin:4px 0;">Stock: ${product.stock ?? 0}</p>
        </div>
      `
    )
    .join("");
}

loadProducts();