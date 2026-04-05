/* ===== CellTech Store JavaScript ===== */

const API = 'http://127.0.0.1:5000';

// ======================= UTILITIES =======================

function formatPrice(n) {
    if (n == null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function parseImages(imgStr) {
    if (!imgStr) return [];
    if (Array.isArray(imgStr)) return imgStr;
    try {
        const parsed = JSON.parse(imgStr);
        return Array.isArray(parsed) ? parsed : [String(imgStr)];
    } catch {
        return imgStr ? [String(imgStr)] : [];
    }
}

function getFirstImage(imgStr) {
    const imgs = parseImages(imgStr);
    return imgs.length > 0 ? imgs[0] : null;
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='%23cbd5e1'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48'%3E📱%3C/text%3E%3C/svg%3E";

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeHtmlWithBreaks(str) {
    if (!str) return '';
    const escaped = escapeHtml(String(str));
    return escaped.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
}

// ======================= PAGINATION & SEARCH STATE =======================

const PRODUCTS_PER_PAGE = 12;
let _currentPage = 1;
let _filteredProducts = [];
let _productsLoading = null;

function buildProductList(products, variants) {
    const variantMap = {};
    (Array.isArray(variants) ? variants : []).forEach(v => {
        const pid = v.ProductID;
        if (!variantMap[pid]) variantMap[pid] = [];
        variantMap[pid].push(v);
    });
    return (Array.isArray(products) ? products : []).map(p => {
        const pvs = variantMap[p.ProductID] || [];
        const prices = pvs.map(v => v.SellingPrice).filter(x => x != null);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const totalStock = pvs.reduce((s, v) => s + (v.StockQuantity || 0), 0);
        const colors = [...new Set(pvs.map(v => v.Color).filter(Boolean))];
        const img = getFirstImage(p.Images) || (pvs.length > 0 ? pvs[0].Image : null);
        return { ...p, variants: pvs, minPrice, maxPrice, totalStock, colors, displayImage: img };
    });
}

async function ensureProductsLoaded() {
    if (window._allProducts) return window._allProducts;
    if (_productsLoading) return _productsLoading;
    _productsLoading = (async () => {
        const [products, variants] = await Promise.all([
            apiFetch('/products/getall'),
            apiFetch('/variants/getall')
        ]);
        window._allProducts = buildProductList(products, variants);
        return window._allProducts;
    })();
    return _productsLoading;
}

// ======================= AUTH =======================

function isLoggedIn() { return !!localStorage.getItem('AccountID'); }
function getAccountID() { return localStorage.getItem('AccountID'); }
function getRole() { return localStorage.getItem('Role'); }
function getCustomerID() { return localStorage.getItem('CustomerID'); }

async function fetchAndStoreCustomerID() {
    const accId = getAccountID();
    if (!accId) return null;
    try {
        const res = await fetch(`${API}/accounts/${encodeURIComponent(accId)}`);
        const data = await res.json();
        const acc = Array.isArray(data) ? data[0] : data;
        if (acc && acc.CustomerID) {
            localStorage.setItem('CustomerID', acc.CustomerID);
            return acc.CustomerID;
        }
    } catch (e) { console.error('Failed to fetch CustomerID:', e); }
    return null;
}

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('AccountID');
        localStorage.removeItem('Role');
        localStorage.removeItem('CustomerID');
        window.location.href = '/';
    }
}

function requireLogin(redirectTo) {
    if (!isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', redirectTo || window.location.pathname);
        window.location.href = '/Login/Index';
        return false;
    }
    return true;
}

// ======================= CART (localStorage) =======================

function getCart() {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); }
    catch { return []; }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(variantId, productId, name, color, price, image, maxStock) {
    if (!isLoggedIn()) {
        requireLogin();
        return;
    }
    const cart = getCart();
    const existing = cart.find(c => c.variantId === variantId);
    if (existing) {
        if (existing.qty < maxStock) {
            existing.qty++;
            showToast('Đã cập nhật số lượng trong giỏ hàng!', 'success');
        } else {
            showToast('Đã đạt số lượng tối đa có sẵn!', 'warning');
            return;
        }
    } else {
        cart.push({ variantId, productId, name, color, price: Number(price), image, qty: 1, maxStock });
        showToast('Đã thêm vào giỏ hàng!', 'success');
    }
    saveCart(cart);
}

function removeFromCart(variantId) {
    let cart = getCart().filter(c => c.variantId !== variantId);
    saveCart(cart);
    showToast('Đã xóa khỏi giỏ hàng', 'info');
}

function updateCartQty(variantId, qty) {
    const cart = getCart();
    const item = cart.find(c => c.variantId === variantId);
    if (item) {
        item.qty = Math.max(1, Math.min(Number(qty), item.maxStock));
    }
    saveCart(cart);
}

function getCartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartBadge();
}

// ======================= UI HELPERS =======================

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('navLogin');
    const logoutBtn = document.getElementById('navLogout');
    const ordersLink = document.getElementById('navOrders');
    const cartBtn = document.getElementById('navCart');

    if (isLoggedIn()) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = '';
        if (ordersLink) ordersLink.style.display = '';
        if (cartBtn) cartBtn.style.display = '';
    } else {
        if (loginBtn) loginBtn.style.display = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (ordersLink) ordersLink.style.display = 'none';
        if (cartBtn) cartBtn.style.display = '';
    }
}

function showToast(message, type) {
    type = type || 'info';
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add('toast-show'); });
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderSkeletons(container, count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += '<div class="skeleton skeleton-card"></div>';
    }
    container.innerHTML = html;
}

// ======================= API HELPERS =======================

async function apiFetch(path) {
    const res = await fetch(API + path);
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
}

// ======================= PRODUCT LISTING (Home/Index) =======================

async function loadStorefront() {
    const grid = document.getElementById('productGrid');
    const pillsContainer = document.getElementById('categoryPills');
    if (!grid) return;

    renderSkeletons(grid, 8);

    try {
        const [productList, categories] = await Promise.all([
            ensureProductsLoaded(),
            apiFetch('/categories/getall').catch(() => [])
        ]);

        // Render categories
        if (pillsContainer && Array.isArray(categories) && categories.length > 0) {
            let pillsHtml = '<button class="category-pill active" data-cat="all">Tất cả</button>';
            categories.forEach(c => {
                pillsHtml += `<button class="category-pill" data-cat="${escapeHtml(c.CategoryID)}">${escapeHtml(c.Name)}</button>`;
            });
            pillsContainer.innerHTML = pillsHtml;

            pillsContainer.addEventListener('click', e => {
                const pill = e.target.closest('.category-pill');
                if (!pill) return;
                pillsContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const cat = pill.dataset.cat;
                renderProducts(cat === 'all' ? productList : productList.filter(p => p.CategoryID === cat));
            });
        }

        renderProducts(productList);

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:3rem">Không thể tải sản phẩm. Vui lòng kiểm tra kết nối.</p>';
    }
}

function renderProducts(products) {
    _filteredProducts = products || [];
    _currentPage = 1;
    renderProductPage();
}

function renderProductPage() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (!_filteredProducts || _filteredProducts.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:3rem">Không tìm thấy sản phẩm nào.</p>';
        removeLoadMore();
        return;
    }

    const end = _currentPage * PRODUCTS_PER_PAGE;
    const visible = _filteredProducts.slice(0, end);

    grid.innerHTML = visible.map(p => {
        const outOfStock = p.totalStock <= 0;
        const img = p.displayImage || PLACEHOLDER_IMG;
        const priceText = p.minPrice === p.maxPrice
            ? formatPrice(p.minPrice)
            : formatPrice(p.minPrice) + ' – ' + formatPrice(p.maxPrice);

        return `
        <div class="product-card ${outOfStock ? 'out-of-stock' : ''}" onclick="window.location.href='/Product/Detail?id=${encodeURIComponent(p.ProductID)}'">
            <div class="product-card-img">
                ${outOfStock ? '<span class="badge-stock badge-out-of-stock">Hết hàng</span>' : ''}
                <img src="${escapeHtml(img)}" alt="${escapeHtml(p.ProductName)}" onerror="this.src='${PLACEHOLDER_IMG}'" loading="lazy">
            </div>
            <div class="product-card-body">
                <div class="product-card-brand">${escapeHtml(p.Brand || '')}</div>
                <div class="product-card-name">${escapeHtml(p.ProductName)}</div>
                <div class="product-card-price">${priceText}</div>
            </div>
        </div>`;
    }).join('');

    if (end < _filteredProducts.length) {
        showLoadMore();
    } else {
        removeLoadMore();
    }
}

function showLoadMore() {
    let btn = document.getElementById('loadMoreBtn');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'loadMoreBtn';
        btn.className = 'load-more-container';
        btn.innerHTML = '<button class="btn-load-more" onclick="loadMoreProducts()"></button>';
        const grid = document.getElementById('productGrid');
        grid.parentNode.insertBefore(btn, grid.nextSibling);
    }
    const remaining = _filteredProducts.length - _currentPage * PRODUCTS_PER_PAGE;
    btn.querySelector('button').innerHTML = `<i class="bi bi-plus-circle"></i> Xem thêm (${remaining} sản phẩm)`;
    btn.style.display = '';
}

function removeLoadMore() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = 'none';
}

function loadMoreProducts() {
    _currentPage++;
    renderProductPage();
}

// ======================= LIVE SEARCH =======================

async function liveSearch(keyword) {
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    keyword = keyword.toLowerCase();
    dropdown.innerHTML = '<div class="search-loading"><div class="spinner" style="width:24px;height:24px;border-width:2px"></div></div>';
    dropdown.classList.add('active');

    try {
        const products = await ensureProductsLoaded();
        const filtered = products.filter(p =>
            (p.ProductName || '').toLowerCase().includes(keyword) ||
            (p.Brand || '').toLowerCase().includes(keyword)
        ).slice(0, 8);

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="search-empty">Không tìm thấy sản phẩm nào</div>';
            return;
        }

        dropdown.innerHTML = filtered.map(p => {
            const img = p.displayImage || PLACEHOLDER_IMG;
            const priceText = p.minPrice === p.maxPrice
                ? formatPrice(p.minPrice)
                : formatPrice(p.minPrice) + ' – ' + formatPrice(p.maxPrice);
            const outOfStock = p.totalStock <= 0;

            return `
            <a class="search-result-item ${outOfStock ? 'out-of-stock' : ''}" href="/Product/Detail?id=${encodeURIComponent(p.ProductID)}">
                <img src="${escapeHtml(img)}" alt="" onerror="this.src='${PLACEHOLDER_IMG}'">
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(p.ProductName)}</div>
                    <div class="search-result-price">${priceText}</div>
                    ${outOfStock ? '<span class="search-result-stock">Hết hàng</span>' : ''}
                </div>
            </a>`;
        }).join('');
    } catch (err) {
        dropdown.innerHTML = '<div class="search-empty">Lỗi tìm kiếm</div>';
    }
}

function hideSearchDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
    }
}

// ======================= PRODUCT DETAIL =======================

async function loadProductDetail(productId) {
    const container = document.getElementById('productDetail');
    if (!container || !productId) return;

    container.innerHTML = '<div class="spinner"></div>';

    try {
        const [product, variants] = await Promise.all([
            apiFetch('/products/' + encodeURIComponent(productId)),
            apiFetch('/products/' + encodeURIComponent(productId) + '/variants')
        ]);

        if (!product || (Array.isArray(product) && product.length === 0)) {
            container.innerHTML = '<p class="text-muted" style="text-align:center;padding:3rem">Không tìm thấy sản phẩm.</p>';
            return;
        }

        const prod = Array.isArray(product) ? product[0] : product;
        const variantList = Array.isArray(variants) ? variants : [];

        // Extract specs from product (keys that aren't standard columns)
        const standardKeys = ['ProductID', 'ProductName', 'Brand', 'Images', 'CategoryID', 'Information'];
        const specs = {};
        Object.keys(prod).forEach(k => {
            if (!standardKeys.includes(k) && prod[k] != null && prod[k] !== '') {
                specs[k] = prod[k];
            }
        });

        // Build gallery images: product images + unique variant images
        const productImages = parseImages(prod.Images);
        const variantImages = variantList.map(v => v.Image).filter(Boolean);
        const allImagesSet = new Set();
        const allImages = [];
        [...productImages, ...variantImages].forEach(img => {
            if (img && !allImagesSet.has(img)) {
                allImagesSet.add(img);
                allImages.push(img);
            }
        });
        if (allImages.length === 0) allImages.push(PLACEHOLDER_IMG);

        window._galleryImages = allImages;
        window._galleryIndex = 0;

        // Default to first variant
        const defaultVariant = variantList.length > 0 ? variantList[0] : null;
        const defaultImg = defaultVariant && defaultVariant.Image ? defaultVariant.Image : allImages[0];
        const defaultImgIdx = allImages.indexOf(defaultImg);
        if (defaultImgIdx >= 0) window._galleryIndex = defaultImgIdx;

        let specsHtml = '';
        if (Object.keys(specs).length > 0) {
            specsHtml = '<table class="specs-table">' +
                Object.entries(specs).map(([k, v]) => {
                    if (typeof v === 'object') {
                        return Object.entries(v).map(([sk, sv]) =>
                            `<tr><th>${escapeHtml(sk)}</th><td>${escapeHtmlWithBreaks(String(sv))}</td></tr>`
                        ).join('');
                    }
                    return `<tr><th>${escapeHtml(k)}</th><td>${escapeHtmlWithBreaks(String(v))}</td></tr>`;
                }).join('') +
                '</table>';
        }

        const thumbsHtml = allImages.map((img, i) =>
            `<img class="gallery-thumb ${i === window._galleryIndex ? 'active' : ''}" src="${escapeHtml(img)}" alt="" onclick="gallerySelect(${i})" onerror="this.src='${PLACEHOLDER_IMG}'">`
        ).join('');

        container.innerHTML = `
        <div class="row g-4">
            <div class="col-md-5">
                <div class="detail-gallery">
                    <div class="gallery-main">
                        ${allImages.length > 1 ? '<button class="gallery-nav gallery-prev" onclick="galleryPrev()"><i class="bi bi-chevron-left"></i></button>' : ''}
                        <img id="detailMainImg" src="${escapeHtml(allImages[window._galleryIndex])}" alt="${escapeHtml(prod.ProductName)}" onerror="this.src='${PLACEHOLDER_IMG}'">
                        ${allImages.length > 1 ? '<button class="gallery-nav gallery-next" onclick="galleryNext()"><i class="bi bi-chevron-right"></i></button>' : ''}
                    </div>
                    ${allImages.length > 1 ? '<div class="gallery-thumbs" id="galleryThumbs">' + thumbsHtml + '</div>' : ''}
                </div>
            </div>
            <div class="col-md-7">
                <div class="detail-info">
                    <div class="detail-brand">${escapeHtml(prod.Brand || '')}</div>
                    <h1 class="detail-name">${escapeHtml(prod.ProductName)}</h1>
                    <div class="detail-price" id="detailPrice">${defaultVariant ? formatPrice(defaultVariant.SellingPrice) : 'Liên hệ'}</div>

                    ${variantList.length > 0 ? (() => {
                        // Group variants by version (Note field = Description)
                        const versions = [];
                        const versionMap = {};
                        variantList.forEach((v, i) => {
                            const ver = v.Note || v.Description || '';
                            if (!versionMap[ver]) {
                                versionMap[ver] = [];
                                versions.push(ver);
                            }
                            versionMap[ver].push({ variant: v, idx: i });
                        });
                        const hasVersions = versions.length > 1 || (versions.length === 1 && versions[0] !== '');

                        // Get colors for the first version
                        const firstVersionVariants = versionMap[versions[0]] || [];
                        const defaultVerColors = firstVersionVariants.map(item => ({
                            color: item.variant.Color || 'Mặc định',
                            idx: item.idx,
                            stock: item.variant.StockQuantity || 0
                        }));

                        let html = '<div class="variant-selector">';
                        if (hasVersions) {
                            html += '<div class="variant-label">Phiên bản</div>';
                            html += '<div class="variant-options" id="versionOptions">';
                            html += versions.map((ver, vi) => {
                                const verVariants = versionMap[ver];
                                const allOutOfStock = verVariants.every(item => (item.variant.StockQuantity || 0) <= 0);
                                return `<button class="variant-option ${vi === 0 ? 'active' : ''} ${allOutOfStock ? 'out-of-stock' : ''}"
                                    data-version="${escapeHtml(ver)}"
                                    ${allOutOfStock ? 'title="Hết hàng"' : ''}>
                                    ${escapeHtml(ver || 'Mặc định')}
                                </button>`;
                            }).join('');
                            html += '</div>';
                        }
                        // Color selector
                        const showColors = defaultVerColors.length > 1 || !hasVersions;
                        html += '<div class="variant-label" style="margin-top:.75rem">Màu sắc</div>';
                        html += '<div class="variant-options" id="variantOptions">';
                        html += defaultVerColors.map((c, ci) => `
                            <button class="variant-option ${ci === 0 ? 'active' : ''} ${c.stock <= 0 ? 'out-of-stock' : ''}"
                                data-idx="${c.idx}"
                                ${c.stock <= 0 ? 'title="Hết hàng"' : ''}>
                                ${escapeHtml(c.color)}
                            </button>
                        `).join('');
                        html += '</div></div>';
                        return html;
                    })() : ''}

                    <div class="stock-info ${defaultVariant && defaultVariant.StockQuantity > 0 ? 'in-stock' : 'out-of-stock'}" id="stockInfo">
                        <i class="bi ${defaultVariant && defaultVariant.StockQuantity > 0 ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                        <span id="stockText">${defaultVariant ? (defaultVariant.StockQuantity > 0 ? 'Còn ' + defaultVariant.StockQuantity + ' sản phẩm' : 'Hết hàng') : 'Không có phiên bản'}</span>
                    </div>

                    <div class="qty-selector" id="qtySelector" style="${!defaultVariant || defaultVariant.StockQuantity <= 0 ? 'display:none' : ''}">
                        <button class="qty-btn" onclick="changeQty(-1)">−</button>
                        <input type="number" class="qty-input" id="qtyInput" value="1" min="1" max="${defaultVariant ? defaultVariant.StockQuantity : 1}" oninput="clampQtyInput(this)">
                        <button class="qty-btn" onclick="changeQty(1)">+</button>
                    </div>

                    <button class="btn-add-cart" id="btnAddCart" ${!defaultVariant || defaultVariant.StockQuantity <= 0 ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus"></i>
                        ${!defaultVariant || defaultVariant.StockQuantity <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                    </button>

                    ${specsHtml ? '<h3 style="margin-top:2rem;font-size:1.1rem;font-weight:600">Thông số kỹ thuật</h3>' + specsHtml : ''}
                </div>
            </div>
        </div>`;

        // Store variants and version map for interaction
        window._detailVariants = variantList;
        window._detailProduct = prod;
        // Build version map
        window._versionMap = {};
        variantList.forEach((v, i) => {
            const ver = v.Note || v.Description || '';
            if (!window._versionMap[ver]) window._versionMap[ver] = [];
            window._versionMap[ver].push({ variant: v, idx: i });
        });

        // Version selection
        const versionContainer = document.getElementById('versionOptions');
        if (versionContainer) {
            versionContainer.addEventListener('click', e => {
                const btn = e.target.closest('.variant-option');
                if (!btn || btn.classList.contains('out-of-stock')) return;
                versionContainer.querySelectorAll('.variant-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const ver = btn.dataset.version;
                updateColorOptions(ver);
            });
        }

        // Variant color selection
        const optionsContainer = document.getElementById('variantOptions');
        if (optionsContainer) {
            optionsContainer.addEventListener('click', e => {
                const btn = e.target.closest('.variant-option');
                if (!btn || btn.classList.contains('out-of-stock')) return;
                optionsContainer.querySelectorAll('.variant-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const idx = parseInt(btn.dataset.idx);
                selectVariant(idx);
            });
        }

        // Add to cart
        document.getElementById('btnAddCart').addEventListener('click', () => {
            const activeBtn = document.querySelector('.variant-option.active');
            const idx = activeBtn ? parseInt(activeBtn.dataset.idx) : 0;
            const v = window._detailVariants[idx];
            if (!v || v.StockQuantity <= 0) return;

            const maxStock = v.StockQuantity;
            let qty = parseInt(document.getElementById('qtyInput').value) || 1;
            qty = Math.max(1, Math.min(qty, maxStock));

            const img = v.Image || getFirstImage(prod.Images) || PLACEHOLDER_IMG;
            const cart = getCart();
            const existing = cart.find(c => c.variantId === v.ProductVariantID);
            if (existing) {
                const maxAdd = maxStock - existing.qty;
                if (maxAdd <= 0) {
                    showToast('Đã đạt số lượng tối đa có sẵn!', 'warning');
                    return;
                }
                const addQty = Math.min(qty, maxAdd);
                existing.qty += addQty;
                if (addQty < qty) {
                    showToast(`Chỉ thêm được ${addQty} sản phẩm (đã có ${existing.qty - addQty} trong giỏ)`, 'warning');
                } else {
                    showToast('Đã cập nhật giỏ hàng!', 'success');
                }
            } else {
                if (!isLoggedIn()) { requireLogin(); return; }
                cart.push({
                    variantId: v.ProductVariantID,
                    productId: prod.ProductID,
                    name: prod.ProductName,
                    color: v.Color || '',
                    price: Number(v.SellingPrice),
                    image: img,
                    qty: qty,
                    maxStock: maxStock
                });
                showToast('Đã thêm vào giỏ hàng!', 'success');
            }
            saveCart(cart);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:3rem">Không thể tải thông tin sản phẩm.</p>';
    }
}

function updateColorOptions(version) {
    const colorContainer = document.getElementById('variantOptions');
    if (!colorContainer || !window._versionMap) return;
    const items = window._versionMap[version] || [];
    colorContainer.innerHTML = items.map((item, ci) => `
        <button class="variant-option ${ci === 0 ? 'active' : ''} ${(item.variant.StockQuantity || 0) <= 0 ? 'out-of-stock' : ''}"
            data-idx="${item.idx}"
            ${(item.variant.StockQuantity || 0) <= 0 ? 'title="Hết hàng"' : ''}>
            ${escapeHtml(item.variant.Color || 'Mặc định')}
        </button>
    `).join('');
    // Re-attach click handler
    colorContainer.addEventListener('click', e => {
        const btn = e.target.closest('.variant-option');
        if (!btn || btn.classList.contains('out-of-stock')) return;
        colorContainer.querySelectorAll('.variant-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const idx = parseInt(btn.dataset.idx);
        selectVariant(idx);
    });
    // Select first available variant in this version
    const firstAvailable = items.find(item => (item.variant.StockQuantity || 0) > 0);
    if (firstAvailable) {
        selectVariant(firstAvailable.idx);
    } else if (items.length > 0) {
        selectVariant(items[0].idx);
    }
}

function selectVariant(idx) {
    const v = window._detailVariants[idx];
    if (!v) return;

    document.getElementById('detailPrice').textContent = formatPrice(v.SellingPrice);

    const stockInfo = document.getElementById('stockInfo');
    const stockText = document.getElementById('stockText');
    const btnAdd = document.getElementById('btnAddCart');
    const qtySel = document.getElementById('qtySelector');
    const qtyInput = document.getElementById('qtyInput');

    if (v.StockQuantity > 0) {
        stockInfo.className = 'stock-info in-stock';
        stockInfo.querySelector('i').className = 'bi bi-check-circle-fill';
        stockText.textContent = 'Còn ' + v.StockQuantity + ' sản phẩm';
        btnAdd.disabled = false;
        btnAdd.innerHTML = '<i class="bi bi-cart-plus"></i> Thêm vào giỏ hàng';
        qtySel.style.display = '';
        qtyInput.max = v.StockQuantity;
        qtyInput.value = 1;
    } else {
        stockInfo.className = 'stock-info out-of-stock';
        stockInfo.querySelector('i').className = 'bi bi-x-circle-fill';
        stockText.textContent = 'Hết hàng';
        btnAdd.disabled = true;
        btnAdd.innerHTML = '<i class="bi bi-cart-plus"></i> Hết hàng';
        qtySel.style.display = 'none';
    }

    // Switch gallery to variant image
    if (v.Image && window._galleryImages) {
        const imgIdx = window._galleryImages.indexOf(v.Image);
        if (imgIdx >= 0) {
            gallerySelect(imgIdx);
        } else {
            document.getElementById('detailMainImg').src = v.Image;
        }
    }
}

function changeQty(delta) {
    const input = document.getElementById('qtyInput');
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(val + delta, parseInt(input.max) || 99));
    input.value = val;
}

function clampQtyInput(input) {
    let val = parseInt(input.value);
    const max = parseInt(input.max) || 1;
    if (isNaN(val) || val < 1) input.value = 1;
    else if (val > max) input.value = max;
}

// ======================= IMAGE GALLERY =======================

function gallerySelect(idx) {
    if (!window._galleryImages || idx < 0 || idx >= window._galleryImages.length) return;
    window._galleryIndex = idx;
    document.getElementById('detailMainImg').src = window._galleryImages[idx];
    document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
    });
}

function galleryPrev() {
    if (!window._galleryImages) return;
    const idx = (window._galleryIndex - 1 + window._galleryImages.length) % window._galleryImages.length;
    gallerySelect(idx);
}

function galleryNext() {
    if (!window._galleryImages) return;
    const idx = (window._galleryIndex + 1) % window._galleryImages.length;
    gallerySelect(idx);
}

// ======================= CART PAGE =======================

function loadCartPage() {
    const container = document.getElementById('cartContainer');
    if (!container) return;

    const cart = getCart();
    if (cart.length === 0) {
        container.innerHTML = `
        <div class="cart-empty">
            <i class="bi bi-cart-x"></i>
            <h3>Giỏ hàng trống</h3>
            <p>Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
            <a href="/" class="btn-outline"><i class="bi bi-arrow-left"></i> Tiếp tục mua sắm</a>
        </div>`;
        return;
    }

    let itemsHtml = cart.map(item => `
    <div class="cart-item" data-vid="${escapeHtml(item.variantId)}">
        <div class="cart-item-img">
            <img src="${escapeHtml(item.image || PLACEHOLDER_IMG)}" alt="" onerror="this.src='${PLACEHOLDER_IMG}'">
        </div>
        <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div class="cart-item-variant">${item.color ? escapeHtml(item.color) : ''}</div>
        </div>
        <div class="cart-item-actions">
            <div class="qty-selector">
                <button class="qty-btn" onclick="cartChangeQty('${escapeHtml(item.variantId)}', -1)">−</button>
                <input type="number" class="qty-input" value="${item.qty}" min="1" max="${item.maxStock}"
                    onchange="cartSetQty('${escapeHtml(item.variantId)}', this.value)">
                <button class="qty-btn" onclick="cartChangeQty('${escapeHtml(item.variantId)}', 1)">+</button>
            </div>
        </div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
        <button class="cart-remove-btn" onclick="cartRemove('${escapeHtml(item.variantId)}')">
            <i class="bi bi-trash3"></i>
        </button>
    </div>`).join('');

    const total = getCartTotal();
    container.innerHTML = `
    <div>${itemsHtml}</div>
    <div class="cart-summary">
        <div class="cart-summary-row">
            <span>Tạm tính (${cart.reduce((s, i) => s + i.qty, 0)} sản phẩm)</span>
            <span>${formatPrice(total)}</span>
        </div>
        <div class="cart-summary-row total">
            <span>Tổng cộng</span>
            <span class="price">${formatPrice(total)}</span>
        </div>
        <a href="/Home/Checkout" class="btn-checkout">Tiến hành thanh toán</a>
    </div>
    <div style="margin-top:1rem">
        <a href="/" class="btn-outline"><i class="bi bi-arrow-left"></i> Tiếp tục mua sắm</a>
    </div>`;
}

function cartChangeQty(variantId, delta) {
    const cart = getCart();
    const item = cart.find(c => c.variantId === variantId);
    if (item) {
        item.qty = Math.max(1, Math.min(item.qty + delta, item.maxStock));
        saveCart(cart);
    }
    loadCartPage();
}

function cartSetQty(variantId, val) {
    const cart = getCart();
    const item = cart.find(c => c.variantId === variantId);
    if (item) {
        item.qty = Math.max(1, Math.min(parseInt(val) || 1, item.maxStock));
        saveCart(cart);
    }
    loadCartPage();
}

function cartRemove(variantId) {
    removeFromCart(variantId);
    loadCartPage();
}

// ======================= CHECKOUT =======================

function loadCheckoutPage() {
    const container = document.getElementById('checkoutContainer');
    if (!container) return;

    if (!isLoggedIn()) {
        requireLogin('/Home/Checkout');
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        window.location.href = '/Home/Cart';
        return;
    }

    const total = getCartTotal();

    // Load customer info
    const custId = getCustomerID();

    let summaryHtml = cart.map(item => `
    <div class="order-summary-item">
        <span class="item-name">${escapeHtml(item.name)} ${item.color ? '<small style="color:var(--text-muted)">- ' + escapeHtml(item.color) + '</small>' : ''}</span>
        <span class="item-qty">x${item.qty}</span>
        <span class="item-price">${formatPrice(item.price * item.qty)}</span>
    </div>`).join('');

    container.innerHTML = `
    <div class="row g-4">
        <div class="col-lg-7">
            <div class="checkout-section">
                <h3><i class="bi bi-person"></i> Thông tin giao hàng</h3>
                <div id="customerInfoArea">
                    <div class="spinner" style="margin:1rem auto"></div>
                </div>
            </div>
            <div class="checkout-section">
                <h3><i class="bi bi-credit-card"></i> Phương thức thanh toán</h3>
                <div class="payment-options">
                    <div class="payment-option active" data-method="Cash">
                        <i class="bi bi-cash-stack"></i> Tiền mặt
                    </div>
                    <div class="payment-option" data-method="Transfer">
                        <i class="bi bi-bank"></i> Chuyển khoản
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-5">
            <div class="checkout-section">
                <h3><i class="bi bi-receipt"></i> Đơn hàng của bạn</h3>
                ${summaryHtml}
                <div class="cart-summary-row total" style="border-top:2px solid var(--border);margin-top:.75rem;padding-top:.75rem">
                    <span>Tổng cộng</span>
                    <span class="price">${formatPrice(total)}</span>
                </div>
            </div>
            <button class="btn-checkout" id="btnPlaceOrder" onclick="placeOrder()">
                <i class="bi bi-bag-check"></i> Đặt hàng
            </button>
        </div>
    </div>`;

    // Load customer info
    loadCustomerInfo();

    // Payment method selection
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
}

async function loadCustomerInfo() {
    const area = document.getElementById('customerInfoArea');
    if (!area) return;

    let custId = getCustomerID();
    if (!custId) {
        custId = await fetchAndStoreCustomerID();
    }

    if (!custId) {
        area.innerHTML = '<p class="text-muted">Không thể tải thông tin khách hàng.</p>';
        return;
    }

    try {
        const data = await apiFetch('/customers/' + encodeURIComponent(custId));
        const cust = Array.isArray(data) ? data[0] : data;
        if (!cust) {
            area.innerHTML = '<p class="text-muted">Không tìm thấy thông tin khách hàng.</p>';
            return;
        }
        area.innerHTML = `
        <div class="mb-3">
            <label class="form-label-modern">Họ và tên</label>
            <input class="form-input" id="custName" value="${escapeHtml(cust.FullName || '')}" readonly>
        </div>
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label-modern">Số điện thoại</label>
                <input class="form-input" id="custPhone" value="${escapeHtml(cust.Phone || '')}" readonly>
            </div>
            <div class="col-md-6">
                <label class="form-label-modern">Email</label>
                <input class="form-input" id="custEmail" value="${escapeHtml(cust.Email || '')}" readonly>
            </div>
        </div>
        <div class="mt-3">
            <label class="form-label-modern">Địa chỉ giao hàng</label>
            <input class="form-input" id="custAddress" value="${escapeHtml(cust.Address || '')}">
        </div>`;
    } catch (err) {
        console.error(err);
        area.innerHTML = '<p class="text-muted">Lỗi tải thông tin khách hàng.</p>';
    }
}

async function placeOrder() {
    const btn = document.getElementById('btnPlaceOrder');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto"></span>';

    try {
        const cart = getCart();
        if (cart.length === 0) { showToast('Giỏ hàng trống!', 'warning'); return; }

        const custId = getCustomerID();
        if (!custId) { showToast('Vui lòng đăng nhập lại!', 'danger'); return; }

        const payMethod = document.querySelector('.payment-option.active')?.dataset.method || 'Cash';

        // 1. Create bill
        const billRes = await apiPost('/bills/add', {
            CustomerID: custId,
            EmployeeID: null,
            PaymentMethod: payMethod,
            Status: 'Draft',
            TotalPrice: 0
        });

        if (billRes.status !== 200 || !billRes.data.BillID) {
            throw new Error(billRes.data.mess || billRes.data.error || 'Không thể tạo đơn hàng');
        }

        const billId = billRes.data.BillID;

        // 2. Add bill details
        for (const item of cart) {
            const detailRes = await apiPost('/bill-details/add', {
                BillID: billId,
                ProductVariantID: item.variantId,
                Num: item.qty
            });
            if (detailRes.status !== 200) {
                throw new Error(detailRes.data.mess || 'Lỗi thêm sản phẩm vào đơn hàng');
            }
        }

        // 3. Checkout (deduct stock)
        const checkoutRes = await apiPost('/bills/' + encodeURIComponent(billId) + '/checkout', {});

        if (checkoutRes.status === 200 && !checkoutRes.data.mess?.includes('out of stock')) {
            clearCart();
            showToast('Đặt hàng thành công!', 'success');
            setTimeout(() => { window.location.href = '/Home/Orders'; }, 1500);
        } else {
            throw new Error(checkoutRes.data.mess || 'Sản phẩm đã hết hàng');
        }

    } catch (err) {
        console.error(err);
        showToast(err.message || 'Đã xảy ra lỗi khi đặt hàng', 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-bag-check"></i> Đặt hàng';
    }
}

// ======================= ORDERS =======================

async function loadOrdersPage() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (!isLoggedIn()) {
        requireLogin('/Home/Orders');
        return;
    }

    container.innerHTML = '<div class="spinner"></div>';

    let custId = getCustomerID();
    if (!custId) {
        custId = await fetchAndStoreCustomerID();
    }

    if (!custId) {
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:3rem">Không thể xác định tài khoản. Vui lòng đăng nhập lại.</p>';
        return;
    }

    try {
        const allBills = await apiFetch('/bills/getall');
        const myBills = (Array.isArray(allBills) ? allBills : [])
            .filter(b => b.CustomerID === custId)
            .sort((a, b) => new Date(b.DateOrder || 0) - new Date(a.DateOrder || 0));

        if (myBills.length === 0) {
            container.innerHTML = `
            <div class="cart-empty">
                <i class="bi bi-receipt-cutoff"></i>
                <h3>Chưa có đơn hàng</h3>
                <p>Bạn chưa đặt đơn hàng nào.</p>
                <a href="/" class="btn-outline"><i class="bi bi-arrow-left"></i> Mua sắm ngay</a>
            </div>`;
            return;
        }

        // Load details for each bill
        const billsWithDetails = await Promise.all(myBills.map(async bill => {
            try {
                const details = await apiFetch('/bills/bill-details/get/' + encodeURIComponent(bill.BillID));
                return { ...bill, details: Array.isArray(details) ? details : [] };
            } catch {
                return { ...bill, details: [] };
            }
        }));

        container.innerHTML = billsWithDetails.map(bill => {
            const statusClass = (bill.Status || '').toLowerCase() === 'completed' ? 'status-completed'
                : (bill.Status || '').toLowerCase() === 'cancelled' ? 'status-cancelled'
                : 'status-draft';
            const statusText = (bill.Status || '').toLowerCase() === 'completed' ? 'Hoàn thành'
                : (bill.Status || '').toLowerCase() === 'cancelled' ? 'Đã hủy'
                : 'Đang xử lý';
            const dateStr = bill.DateOrder ? new Date(bill.DateOrder).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            const payMethodText = (bill.PayMethod || '').toLowerCase() === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';
            const itemCount = bill.details.reduce((s, d) => s + (d.Num || 0), 0);

            return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <span class="order-id">Đơn hàng #${escapeHtml(bill.BillID)}</span>
                        <span class="order-date" style="margin-left:.75rem">${dateStr}</span>
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-card-body">
                    ${bill.details.map(d => {
                        const img = d.Image || PLACEHOLDER_IMG;
                        const name = d.ProductName || d.ProductVariantID || '';
                        const color = d.Color || '';
                        const version = d.VariantDescription || '';
                        const subtotal = (d.Price || 0) * (d.Num || 0);
                        return `
                        <div class="order-detail-item">
                            <img class="order-detail-img" src="${escapeHtml(img)}" alt="" onerror="this.src='${PLACEHOLDER_IMG}'">
                            <div class="order-detail-info">
                                <div class="order-detail-name">${escapeHtml(name)}</div>
                                <div class="order-detail-meta">${version ? escapeHtml(version) : ''}${version && color ? ' · ' : ''}${color ? escapeHtml(color) : ''}</div>
                                <div class="order-detail-price">${formatPrice(d.Price || 0)} × ${d.Num || 0}</div>
                            </div>
                            <div class="order-detail-subtotal">${formatPrice(subtotal)}</div>
                        </div>`;
                    }).join('')}
                </div>
                <div class="order-card-footer">
                    <div class="order-footer-info">
                        <span class="order-payment"><i class="bi bi-credit-card"></i> ${payMethodText}</span>
                        <span class="order-item-count">${itemCount} sản phẩm</span>
                    </div>
                    <div class="order-total">Tổng: ${formatPrice(bill.TotalPrice || 0)}</div>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:3rem">Không thể tải lịch sử đơn hàng.</p>';
    }
}

// ======================= INIT =======================

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    updateAuthUI();

    // Fetch CustomerID if logged in and not yet stored
    if (isLoggedIn() && !getCustomerID()) {
        fetchAndStoreCustomerID();
    }

    // Live search
    const headerSearch = document.getElementById('headerSearchInput');
    if (headerSearch) {
        let searchTimeout;
        headerSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const val = headerSearch.value.trim();
            if (!val) {
                hideSearchDropdown();
                return;
            }
            searchTimeout = setTimeout(() => liveSearch(val), 300);
        });

        // Also trigger on search button click
        const searchBtn = document.getElementById('headerSearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const val = headerSearch.value.trim();
                if (val) liveSearch(val);
            });
        }

        // Close dropdown on click outside
        document.addEventListener('click', e => {
            if (!e.target.closest('.header-search')) {
                hideSearchDropdown();
            }
        });

        // Close on Escape
        headerSearch.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                hideSearchDropdown();
                headerSearch.blur();
            }
        });
    }
});
