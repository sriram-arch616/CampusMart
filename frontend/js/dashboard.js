document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    fetchProducts();
});

let currentPage = 1;

function openProduct(id) {
    window.location.href = `/product?id=${id}`;
}

const searchInput = document.getElementById("searchInput");
const filterOverlay = document.getElementById("filterOverlay");
const filterBox = document.getElementById("filterBox");

searchInput.addEventListener("input", () => {
    currentPage = 1;
    filterProducts();
});

function openFilter() {
    filterOverlay.classList.remove("hide");
    filterBox.classList.remove("hide");
}

function closeFilter() {
    filterOverlay.classList.add("hide");
    filterBox.classList.add("hide");
}

function applyFilters() {
    currentPage = 1;
    closeFilter();
    filterProducts();
}

function clearFilters() {
    document.getElementById("fCategory").value = "";
    document.getElementById("fMinPrice").value = "";
    document.getElementById("fMaxPrice").value = "";
    
    const typeRadios = document.getElementsByName("fType");
    typeRadios[0].checked = true;

    const timeRadios = document.getElementsByName("fTime");
    timeRadios[0].checked = true;

    currentPage = 1;
    closeFilter();
    filterProducts();
}

async function filterProducts() {
    const search = searchInput.value;
    const category = document.getElementById("fCategory").value;
    const minPrice = document.getElementById("fMinPrice").value;
    const maxPrice = document.getElementById("fMaxPrice").value;
    
    let type = "";
    const typeRadios = document.getElementsByName("fType");
    typeRadios.forEach(r => { if(r.checked) type = r.value; });

    let timeframe = "";
    const timeRadios = document.getElementsByName("fTime");
    timeRadios.forEach(r => { if(r.checked) timeframe = r.value; });

    const token = localStorage.getItem("token");

    try {
        let url = `/api/products?search=${search}&category=${category}&minPrice=${minPrice}&maxPrice=${maxPrice}&type=${type}&timeframe=${timeframe}&page=${currentPage}`;
        
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Filter failed");

        const result = await res.json();
        const products = result.data || result;
        displayProducts(products);
        renderPagination(result.pagination);

    } catch (error) {
        console.error("Error filtering products:", error);
    }
}

function contactSeller(sellerId, productId, event) {
    if (event) event.stopPropagation();
    window.location.href = `/chat?userId=${sellerId}&productId=${productId}`;
}

async function fetchProducts() {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`/api/products?page=${currentPage}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const result = await response.json();
        const products = result.data || result;
        displayProducts(products);
        renderPagination(result.pagination);

    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

function goToPage(page) {
    currentPage = page;
    // Check if any filters are active
    const search = searchInput.value;
    if (search || document.getElementById("fCategory").value) {
        filterProducts();
    } else {
        fetchProducts();
    }
    // Scroll to top of product grid
    document.getElementById("productContainer").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPagination(pagination) {
    const container = document.getElementById("paginationControls");
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const { currentPage: page, totalPages } = pagination;
    let html = "";

    // Previous button
    html += `<button ${page <= 1 ? "disabled" : ""} onclick="goToPage(${page - 1})">‹ Prev</button>`;

    // Page number buttons
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-info">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-info">…</span>`;
        html += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    html += `<button ${page >= totalPages ? "disabled" : ""} onclick="goToPage(${page + 1})">Next ›</button>`;

    container.innerHTML = html;
}

function displayProducts(products) {
    const container = document.getElementById("productContainer");
    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = "<p>No products available.</p>";
        return;
    }

    let html = "";

    const role = getUserRole();

    products.forEach(product => {
        const imageHtml = product.image_url 
            ? `<img src="${product.image_url}" alt="${product.title}">`
            : `<div class="no-image-placeholder">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                   <circle cx="8.5" cy="8.5" r="1.5"/>
                   <polyline points="21 15 16 10 5 21"/>
                 </svg>
                 <span>No Image Available</span>
               </div>`;

        const typeText = product.type === "sell" ? "For Buy" : "For Rent";

        const isSoldOrLent = product.status === "sold" || product.status === "lent";
        const statusBadge = isSoldOrLent
            ? `<div class="sold-overlay-badge">${product.status === "sold" ? "SOLD" : "LENT"}</div>`
            : "";

        const deleteBtnHtml = role === 'admin' 
            ? `<button class="btn delete-btn" style="background: #ff4d4d; margin-right: 8px;" onclick="deleteProductAdmin(${product.id}, event)">
                <svg viewBox="0 0 24 24" fill="none" width=20 height=20 xmlns="http://www.w3.org/2000/svg" stroke="#fff">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
               </button>`
            : "";

        const contactBtnHtml = isSoldOrLent
            ? ""
            : `<button class="btn" onclick="contactSeller(${product.seller_id}, ${product.id}, event)">
                <span>Contact</span>
                <svg viewBox="0 0 24 24" fill="none" width=20 height=20 xmlns="http://www.w3.org/2000/svg" stroke="#fff"> <g id="SVGRepo_bgCarrier" stroke-width="0"></g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g> <g id="SVGRepo_iconCarrier"> <path d="M14.05 6C15.0268 6.19057 15.9244 6.66826 16.6281 7.37194C17.3318 8.07561 17.8095 8.97326 18 9.95M14.05 2C16.0793 2.22544 17.9716 3.13417 19.4163 4.57701C20.8609 6.01984 21.7721 7.91101 22 9.94M18.5 21C9.93959 21 3 14.0604 3 5.5C3 5.11378 3.01413 4.73086 3.04189 4.35173C3.07375 3.91662 3.08968 3.69907 3.2037 3.50103C3.29814 3.33701 3.4655 3.18146 3.63598 3.09925C3.84181 3 4.08188 3 4.56201 3H7.37932C7.78308 3 7.98496 3 8.15802 3.06645C8.31089 3.12515 8.44701 3.22049 8.55442 3.3441C8.67601 3.48403 8.745 3.67376 8.88299 4.05321L10.0491 7.26005C10.2096 7.70153 10.2899 7.92227 10.2763 8.1317C10.2643 8.31637 10.2012 8.49408 10.0942 8.64506C9.97286 8.81628 9.77145 8.93713 9.36863 9.17882L8 10C9.2019 12.6489 11.3501 14.7999 14 16L14.8212 14.6314C15.0629 14.2285 15.1837 14.0271 15.3549 13.9058C15.5059 13.7988 15.6836 13.7357 15.8683 13.7237C16.0777 13.7101 16.2985 13.7904 16.74 13.9509L19.9468 15.117C20.3262 15.255 20.516 15.324 20.6559 15.4456C20.7795 15.553 20.8749 15.6891 20.9335 15.842C21 16.015 21 16.2169 21 16.6207V19.438C21 19.9181 21 20.1582 20.9007 20.364C20.8185 20.5345 20.663 20.7019 20.499 20.7963C20.3009 20.9103 20.0834 20.9262 19.6483 20.9581C19.2691 20.9859 18.8862 21 18.5 21Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </svg>
              </button>`;

        const card = `
            <div class="card ${isSoldOrLent ? 'card-sold' : ''}" onclick="openProduct(${product.id})">
                <div class="tilt">
                    <div class="img">
                        ${imageHtml}
                        ${statusBadge}
                    </div>
                </div>

                <div class="info">
                    <div class="cat">${product.category}</div>

                    <h2 class="title">${product.title}</h2>

                    <p class="desc">${product.description}</p>

                    <div class="feats">
                        <span class="feat">Campus Deal</span>
                        ${product.is_verified ? '<span class="feat">Student Verified</span>' : ''}
                    </div>

                    <div class="bottom">
                        <div class="price">
                            <span class="new">₹${product.price}${product.type === 'lend' ? '/day' : ''}</span>
                        </div>

                        <div style="display: flex; align-items: center;">
                            ${deleteBtnHtml}
                            ${contactBtnHtml}
                        </div>
                    </div>

                    <div class="meta">
                        <div class="stock">${typeText}</div>
                    </div>
                </div>
            </div>
        `;

        html += card;
    })
    container.innerHTML = html;
}

async function deleteProductAdmin(productId, event) {
    if (event) event.stopPropagation();
    
    const confirmed = await showConfirm("Are you sure you want to delete this product? This action cannot be undone.");
    if (!confirmed) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (result.success) {
            showToast("Product deleted successfully", "success");
            fetchProducts(); // Refresh the list
        } else {
            showToast(result.message || "Failed to delete product", "error");
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        showToast("An error occurred while deleting the product", "error");
    }
}