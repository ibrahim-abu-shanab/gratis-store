// ═══════════════════════════════════════════════════════════
//  GLAM STORE — app.js
// ═══════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

  const selectedQty = {};
  const isAdmin = new URLSearchParams(window.location.search).has("admin");

  // ══════════════════════════════════════════════════════════
  //  FAVORİLER
  // ══════════════════════════════════════════════════════════
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem("glamstore_favorites") || "[]"); }
    catch { return []; }
  }
  function saveFavorites(favs) {
    localStorage.setItem("glamstore_favorites", JSON.stringify(favs));
  }
  function isFavorite(id) { return getFavorites().some(f => f.id === id); }

  function toggleFavorite(product) {
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.id === product.id);
    if (idx === -1) { favs.push(product); saveFavorites(favs); updateFavNavBadge(); return true; }
    else { favs.splice(idx, 1); saveFavorites(favs); updateFavNavBadge(); return false; }
  }

  function updateFavNavBadge() {
    const count = getFavorites().length;
    document.querySelectorAll("#fav-nav-count").forEach(b => {
      b.textContent = count > 0 ? count : "";
      b.classList.toggle("visible", count > 0);
    });
  }

  // ══════════════════════════════════════════════════════════
  //  بناء بطاقة منتج
  // ══════════════════════════════════════════════════════════
  function buildProductCard(p) {
    if (!selectedQty[p.id]) selectedQty[p.id] = 1;
    const outOfStock = p.stock <= 0;
    const fav = isFavorite(p.id);

    const div = document.createElement("div");
    div.className = "product-card";
    div.id = `product-card-${p.id}`;
    div.dataset.category = p.category || "";

    const imgHTML = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
      : `<div class="no-img">💄</div>`;

    const delBtn = isAdmin
      ? `<button onclick="deleteProduct(${p.id})" style="position:absolute;top:8px;left:8px;z-index:5;background:rgba(0,0,0,.55);color:#fff;border:none;padding:3px 7px;font-size:.65rem;cursor:pointer;letter-spacing:.5px;">✕ SİL</button>`
      : "";

    div.innerHTML = `
      ${delBtn}
      <div class="product-image">
        ${imgHTML}
        <button class="heart-btn ${fav ? "active" : ""}" onclick="handleHeart(${p.id})">
          <span class="heart-icon">${fav ? "❤️" : "🤍"}</span>
        </button>
        <div class="quick-add-overlay">
          ${outOfStock
            ? `<button class="qao-cart" disabled style="opacity:.4;cursor:not-allowed;">Stok Tükendi</button>`
            : `<button class="qao-cart" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-shopping"></i> Sepete Ekle</button>
               <button class="qao-fav ${fav ? "active" : ""}" onclick="handleHeart(${p.id})"><i class="fa-${fav ? "solid" : "regular"} fa-heart"></i></button>`
          }
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="price">₺${Number(p.price).toFixed(2)}</p>
        ${outOfStock ? `<p class="stock out-of-stock">❌ Stok Tükendi</p>` : `
        <div class="quantity-control">
          <button onclick="changeQty(${p.id},-1,${p.stock})">−</button>
          <span class="qty-value" id="qty-${p.id}">1</span>
          <button onclick="changeQty(${p.id},+1,${p.stock})">+</button>
        </div>`}
      </div>
      <div class="card-actions">
        ${outOfStock
          ? `<button class="btn-cart" disabled style="opacity:.4;cursor:not-allowed;">Stok Tükendi</button>`
          : `<button class="btn-cart" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-shopping"></i> Sepete Ekle</button>`
        }
        <button class="btn-fav-card ${fav ? "active" : ""}" onclick="handleHeart(${p.id})">
          <i class="fa-${fav ? "solid" : "regular"} fa-heart"></i>
        </button>
      </div>
    `;
    return div;
  }
function openProductModal(){
    document.getElementById("productModal")
            .classList.add("show");
}

function closeProductModal(){
    document.getElementById("productModal")
            .classList.remove("show");
}
  // ══════════════════════════════════════════════════════════
  //  تحميل منتجات لحاوية معينة
  // ══════════════════════════════════════════════════════════
  function loadProductsInto(containerId, params = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let url = "/api/products?";
    if (params.category) url += `category=${params.category}&`;
    if (params.subcategory) url += `subcategory=${params.subcategory}&`;
    if (params.random) url += `random=${params.random}&`;

    fetch(url)
      .then(r => r.json())
      .then(products => {
        container.innerHTML = "";
        if (products.length === 0) {
          container.innerHTML = `<div class="empty-state"><span class="empty-icon">🛍️</span><p>Henüz ürün eklenmedi.</p></div>`;
          return;
        }
        products.forEach(p => container.appendChild(buildProductCard(p)));
      })
      .catch(err => console.error("Ürünler yüklenemedi:", err));
  }

  // ══════════════════════════════════════════════════════════
  //  تحميل حسب نوع الصفحة
  // ══════════════════════════════════════════════════════════
  const page = window.location.pathname.split("/").pop().replace(".html", "");

  if (page === "index" || page === "" || page === "pages") {
    // الصفحة الرئيسية: منتجات عشوائية
    loadProductsInto("products", { random: 9999 });
  } else if (page === "makyaj") {
    loadProductsInto("products", { category: "makyaj" });
    initCategorySlider([
      "/images/makyaj/luxury_lip_gloss.jpg",
      "/images/makyaj/smokey_eyes_palette.jpg",
      "/images/makyaj/velvet_rose_lipstick.jpg",
      "/images/makyaj/soft_glam_eyeshadow.jpg",
      "/images/makyaj/full_coverage_foundation.jpg"
    ]);
  } else if (page === "parfum") {
    loadProductsInto("products", { category: "parfum" });
    initCategorySlider([
      "/images/parfum/5801029026552943181_121.jpg",
      "/images/parfum/5801029026552943184_121.jpg",
      "/images/parfum/5801029026552943186_121.jpg",
      "/images/parfum/5801029026552943188_121.jpg",
      "/images/parfum/5801029026552943190_121.jpg"
    ]);
  } else if (page === "sac") {
    loadProductsInto("products", { category: "sac" });
    initCategorySlider([
      "/images/sac/5801029026552943165_121.jpg",
      "/images/sac/5801029026552943167_121.jpg",
      "/images/sac/5801029026552943172_121.jpg",
      "/images/sac/5801029026552943175_121.jpg",
      "/images/sac/5801029026552943177_121.jpg"
    ]);
  } else if (page === "vucut") {
    loadProductsInto("products", { category: "vucut" });
    initCategorySlider([
      "/images/vucut/5801029026552943153_121.jpg",
      "/images/vucut/5801029026552943154_121.jpg",
      "/images/vucut/5801029026552943157_121.jpg",
      "/images/vucut/5801029026552943162_121.jpg",
      "/images/vucut/5801029026552943163_121.jpg"
    ]);
  } else if (page === "taki") {
    // صفحة التاكي: تحميل كل فئة فرعية لحاله
    loadProductsInto("kolye-products", { category: "taki", subcategory: "kolye" });
    loadProductsInto("kupe-products", { category: "taki", subcategory: "kupe" });
    loadProductsInto("yuzuk-products", { category: "taki", subcategory: "yuzuk" });
    loadProductsInto("bileklik-products", { category: "taki", subcategory: "bileklik" });
    loadProductsInto("saat-products", { category: "taki", subcategory: "saat" });
    initCategorySlider([
      "/images/taki/kolye/5801029026552943192_121.jpg",
      "/images/taki/kupe/5801029026552943207_121.jpg",
      "/images/taki/yuzuk/5801029026552943213_121.jpg",
      "/images/taki/bileklik/5801029026552943222_121.jpg",
      "/images/taki/kol saati/5801029026552943244_121.jpg"
    ]);
  }

  // ══════════════════════════════════════════════════════════
  //  Category Slider — تبديل صور بانر الفئة
  // ══════════════════════════════════════════════════════════
  function initCategorySlider(images) {

    const img = document.getElementById("heroImage");

    if (!img || images.length === 0) return;

    // preload all images
    images.forEach(src => {
        const i = new Image();
        i.src = src;
    });

    img.src = images[0];
    img.style.opacity = "1";

    let current = 0;

    setInterval(() => {

        img.style.opacity = "0";

        setTimeout(() => {

            current = (current + 1) % images.length;

            img.src = images[current];

            img.style.opacity = "1";

        }, 400);

    }, 1500);
}

  // ══════════════════════════════════════════════════════════
  //  أزرار المنتج
  // ══════════════════════════════════════════════════════════
  window.changeQty = function(productId, delta, maxStock) {
    let qty = (selectedQty[productId] || 1) + delta;
    if (qty < 1) qty = 1;
    if (qty > maxStock) { showToast("⚠️ Stok limiti aşıldı!"); qty = maxStock; }
    selectedQty[productId] = qty;
    const el = document.getElementById("qty-" + productId);
    if (el) { el.textContent = qty; el.style.transform = "scale(1.4)"; setTimeout(() => el.style.transform = "scale(1)", 180); }
  };

  window.addToCart = function(id) {
    const qty = selectedQty[id] || 1;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, quantity: qty })
    })
    .then(r => r.json())
    .then(() => {
      selectedQty[id] = 1;
      const el = document.getElementById("qty-" + id);
      if (el) el.textContent = 1;
      loadCartBadge();
      // إعادة تحميل المنتجات لتحديث الستوك
      refreshCurrentPage();
      showToast(`✨ ${qty} adet ürün sepete eklendi`);
      const badge = document.getElementById("cart-count");
      if (badge) { badge.classList.add("bounce"); setTimeout(() => badge.classList.remove("bounce"), 400); }
    })
    .catch(() => showToast("⚠️ Bir hata oluştu"));
  };

  function refreshCurrentPage() {
    if (page === "index" || page === "" || page === "pages") {
      loadProductsInto("products", { random: 9999 });
    } else if (["makyaj","parfum","sac","vucut"].includes(page)) {
      loadProductsInto("products", { category: page });
    } else if (page === "taki") {
      ["kolye","kupe","yuzuk","bileklik","saat"].forEach(sub => {
        loadProductsInto(`${sub}-products`, { category: "taki", subcategory: sub });
      });
    }
  }

  window.handleHeart = function(productId) {
    const card = document.getElementById("product-card-" + productId);
    if (!card) return;
    const nameEl  = card.querySelector(".product-name");
    const priceEl = card.querySelector(".price");
    const imgEl   = card.querySelector(".product-image img");
    const product = {
      id:    productId,
      name:  nameEl  ? nameEl.textContent  : "",
      price: priceEl ? priceEl.textContent.replace("₺","") : "0",
      image: imgEl   ? imgEl.getAttribute("src") : null
    };
    const added = toggleFavorite(product);
    // تحديث زر القلب الكبير
    const heartBtn = card.querySelector(".heart-btn");
    if (heartBtn) {
      heartBtn.classList.add("pop");
      heartBtn.classList.toggle("active", added);
      const icon = heartBtn.querySelector(".heart-icon");
      if (icon) icon.textContent = added ? "❤️" : "🤍";
      heartBtn.title = added ? "Favorilerden çıkar" : "Favorilere ekle";
      setTimeout(() => heartBtn.classList.remove("pop"), 360);
    }
    // تحديث كل أزرار المفضلة على البطاقة (overlay + bottom bar)
    card.querySelectorAll(".btn-fav-card, .qao-fav").forEach(btn => {
      btn.classList.toggle("active", added);
      const ico = btn.querySelector("i");
      if (ico) ico.className = `fa-${added ? "solid" : "regular"} fa-heart`;
    });
    showToast(added ? "❤️ Favorilere eklendi!" : "💔 Favorilerden çıkarıldı");
  };

  window.deleteProduct = function(id) {
    if (!confirm("Ürünü silmek istiyor musun?")) return;
    fetch(`/api/products/${id}`, { method: "DELETE", headers: { admin: sessionStorage.getItem("adminKey") || "" } })
      .then(r => r.json())
      .then(() => { refreshCurrentPage(); showToast("🗑️ Ürün silindi"); })
      .catch(err => console.error(err));
  };

  // ══════════════════════════════════════════════════════════
  //  Badge السلة
  // ══════════════════════════════════════════════════════════
  function loadCartBadge() {
    fetch("/api/cart")
      .then(r => r.json())
      .then(items => {
        const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);
        document.querySelectorAll("#cart-count").forEach(el => {
          el.textContent = totalQty > 0 ? totalQty : "";
          el.classList.toggle("visible", totalQty > 0);
        });
      })
      .catch(() => {});
  }

  // ══════════════════════════════════════════════════════════
  //  صفحة السلة
  // ══════════════════════════════════════════════════════════
  function loadCart() {
    const cartContainer = document.getElementById("cart");
    if (!cartContainer) return;

    fetch("/api/cart")
      .then(r => r.json())
      .then(items => {
        const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);
        document.querySelectorAll("#cart-count").forEach(el => {
          el.textContent = totalQty > 0 ? totalQty : "";
          el.classList.toggle("visible", totalQty > 0);
        });
        cartContainer.innerHTML = "";
        if (items.length === 0) {
          cartContainer.innerHTML = `<div class="empty-state"><span class="empty-icon">🛒</span><p>Sepetiniz boş.</p></div>`;
          return;
        }
        const list = document.createElement("div");
        list.className = "cart-list";
        let grandTotal = 0;
        items.forEach(item => {
          const qty = item.quantity || 1;
          const unitPrice = Number(item.product.price);
          const lineTotal = unitPrice * qty;
          grandTotal += lineTotal;
          const imgHTML = item.product.image
            ? `<img src="${item.product.image}" alt="${item.product.name}">`
            : `<span class="cart-placeholder">💄</span>`;
          const div = document.createElement("div");
          div.className = "cart-item";
          div.dataset.price = unitPrice;
          div.innerHTML = `
  <div class="cart-item-img">
      ${imgHTML}
  </div>

  <h3 class="cart-item-name">
      ${item.product.name}
  </h3>

  <p class="cart-item-price">
      ₺${unitPrice.toFixed(2)}
  </p>

  <div class="quantity-control">
      <button onclick="changeCartQty(${item.id}, -1)">−</button>
      <span class="qty-value" id="cqty-${item.id}">
          ${qty}
      </span>
      <button onclick="changeCartQty(${item.id}, +1)">+</button>
  </div>

  <button class="btn-cart" onclick="removeFromCart(${item.id})">
      Ürünü Sil
  </button>
`;
          list.appendChild(div);
        });
        cartContainer.appendChild(list);
        const summary = document.createElement("div");
        summary.className = "cart-summary";
        summary.innerHTML = `
          <div class="cart-summary-row"><span>Toplam Ürün</span><span>${totalQty} adet</span></div>
          <div class="cart-summary-row total"><span>Toplam Tutar</span><span class="cart-total-amount" id="grand-total">₺${grandTotal.toFixed(2)}</span></div>
          <button class="btn-checkout" onclick="showToast('🎉 Sipariş özelliği yakında!')">✨ Siparişi Tamamla</button>
        `;
        cartContainer.appendChild(summary);
      })
      .catch(err => console.error("Sepet yüklenemedi:", err));
  }

  window.changeCartQty = function(cartItemId, delta) {
    const qtyEl   = document.getElementById("cqty-" + cartItemId);
    const priceEl = document.getElementById("cprice-" + cartItemId);
    if (!qtyEl) return;
    const currentQty = parseInt(qtyEl.textContent) || 1;
    const newQty = currentQty + delta;
    if (newQty < 1) { if (confirm("Ürünü sepetten çıkarmak istiyor musun?")) removeFromCart(cartItemId); return; }
    qtyEl.textContent = newQty;
    qtyEl.style.transform = "scale(1.4)";
    setTimeout(() => qtyEl.style.transform = "scale(1)", 180);
    if (priceEl) {
      const card = qtyEl.closest(".cart-item");
      const unitPrice = card ? parseFloat(card.dataset.price) : 0;
      priceEl.textContent = "₺" + (unitPrice * newQty).toFixed(2);
    }
    recalcGrandTotal();
    fetch(`/api/cart/${cartItemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: newQty }) })
      .then(r => r.json())
      .then(() => {
        const totalQty = Array.from(document.querySelectorAll(".cart-qty-val")).reduce((s, el) => s + (parseInt(el.textContent) || 1), 0);
        document.querySelectorAll("#cart-count").forEach(el => el.textContent = totalQty);
      })
      .catch(() => loadCart());
  };

  function recalcGrandTotal() {
    let total = 0;
    document.querySelectorAll(".cart-item").forEach(card => {
      total += (parseFloat(card.dataset.price) || 0) * (parseInt(card.querySelector(".cart-qty-val")?.textContent) || 1);
    });
    const el = document.getElementById("grand-total");
    if (el) el.textContent = "₺" + total.toFixed(2);
  }

  window.removeFromCart = function(id) {
    fetch(`/api/cart/${id}`, { method: "DELETE" })
      .then(r => r.json())
      .then(() => { loadCart(); showToast("🗑️ Ürün sepetten çıkarıldı"); })
      .catch(err => console.error(err));
  };

  // ══════════════════════════════════════════════════════════
  //  صفحة المفضلة
  // ══════════════════════════════════════════════════════════
  function loadFavoritesPage() {
    const container = document.getElementById("favorites-list");
    if (!container) return;
    const favs = getFavorites();
    container.innerHTML = "";
    if (favs.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">🤍</span><p>Henüz favori ürün eklemediniz.</p></div>`;
      return;
    }
    favs.forEach(p => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.id = "fav-card-" + p.id;
      const imgHTML = p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div class="no-img">💄</div>`;
      const priceNum = parseFloat(p.price) || 0;
      div.innerHTML = `
        <div class="product-image">${imgHTML}</div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="price">₺${priceNum.toFixed(2)}</p>
          <div class="card-actions">
            <button class="btn-cart" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-shopping"></i> Sepete Ekle</button>
            <button class="btn-fav-card active" onclick="removeFavFromPage(${p.id})"><i class="fa-solid fa-heart"></i></button>
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  window.removeFavFromPage = function(id) {
    let favs = getFavorites().filter(f => f.id !== id);
    saveFavorites(favs);
    updateFavNavBadge();
    loadFavoritesPage();
    showToast("💔 Favorilerden çıkarıldı");
  };

  // ══════════════════════════════════════════════════════════
  //  Toast
  // ══════════════════════════════════════════════════════════
  window.showToast = function(msg) {
    let toast = document.getElementById("toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "toast"; toast.className = "toast"; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2800);
  };

  // ══════════════════════════════════════════════════════════
  //  التشغيل الأولي
  // ══════════════════════════════════════════════════════════
  loadCartBadge();
  updateFavNavBadge();

  // تحميل صفحة السلة إذا فيها حاوية
  if (document.getElementById("cart")) loadCart();
  // تحميل صفحة المفضلة
  if (document.getElementById("favorites-list")) loadFavoritesPage();

  // Sticky header
  window.addEventListener("scroll", () => {
    document.querySelector(".site-header")?.classList.toggle("scrolled", window.scrollY > 10);
  });
});
