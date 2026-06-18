document.addEventListener("DOMContentLoaded", () => {
    requireAuth(); // From utils/auth.js
    loadProductDetails();
});

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');

    if (!productId) {
        // Fallback for path parameter routing (e.g. /product/2)
        const pathParts = window.location.pathname.split('/');
        const productIdx = pathParts.indexOf('product');
        if (productIdx !== -1 && pathParts[productIdx + 1]) {
            productId = pathParts[productIdx + 1];
        }
    }

    if (!productId) {
        showError("Invalid Product ID.");
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch product details");
        }

        const result = await response.json();
        const product = result.data || result;
        
        if (!product) {
            showError("Product not found.");
            return;
        }

        renderProduct(product);

    } catch (err) {
        console.error(err);
        showError("Error loading product.");
    }
}

function renderProduct(product) {
    document.getElementById("loading").classList.add("hide");
    document.getElementById("error").classList.add("hide");
    document.getElementById("productDetail").classList.remove("hide");

    // Image
    const imageSection = document.querySelector(".product-image-section");
    if (product.image_url) {
        imageSection.innerHTML = `<img id="pdImage" src="${product.image_url}" alt="${product.title}">`;
    } else {
        imageSection.innerHTML = `<div class="no-image-placeholder h-full">
                 <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                   <circle cx="8.5" cy="8.5" r="1.5"/>
                   <polyline points="21 15 16 10 5 21"/>
                 </svg>
                 <span>No Image Available</span>
               </div>`;
    }

    // Info
    document.getElementById("pdCategory").innerText = product.category || "";
    document.getElementById("pdTitle").innerText = product.title || "Untitled";
    const priceSuffix = product.type === "lend" ? "/day" : "";
    document.getElementById("pdPrice").innerText = "₹" + (product.price || "0") + priceSuffix;
    const typeText = product.type === "sell" ? "For Buy" : "For Rent";
    document.getElementById("pdType").innerText = typeText;

    // Status Badge
    const isSoldOrLent = product.status === "sold" || product.status === "lent";
    if (isSoldOrLent) {
        const badgeText = product.status === "sold" ? "SOLD" : "LENT";
        document.getElementById("pdType").insertAdjacentHTML("afterend", `
            <span class="pd-status-badge" style="display: inline-block; padding: 6px 16px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border-radius: 20px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-left: 10px; margin-bottom: 30px;">
                ${badgeText}
            </span>
        `);
    }

    document.getElementById("pdDescription").innerText = product.description || "No description provided.";
    
    // Seller info section
    const sellerBox = document.querySelector(".seller-box");
    const sellerInfoHtml = `
        <a href="/user?id=${product.seller_id}" class="pd-seller-info" id="pdSellerInfo">
            <img src="${product.seller_pic || '/assets/images/NoPfp.jpg'}" alt="${product.seller_name || 'Seller'}" class="pd-seller-avatar">
            <div class="pd-seller-details">
                <span class="pd-seller-name">${product.seller_name || 'Unknown'}${product.is_verified ? ' <svg style="display:inline-block; width:16px; height:16px; vertical-align:middle; color:#0e8bf1; margin-bottom: 2px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : ''}</span>
                <span class="pd-seller-username">@${product.seller_username || 'unknown'}</span>
            </div>
            <span class="pd-seller-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </span>
        </a>
    `;
    sellerBox.insertAdjacentHTML("afterbegin", sellerInfoHtml);
    
    const contactBtn = document.getElementById("contactBtn");
    const contactText = product.type === "sell" ? "to buy" : "to rent";
    contactBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" width=24 height=24 xmlns="http://www.w3.org/2000/svg" stroke="#fff"> <path d="M14.05 6C15.0268 6.19057 15.9244 6.66826 16.6281 7.37194C17.3318 8.07561 17.8095 8.97326 18 9.95M14.05 2C16.0793 2.22544 17.9716 3.13417 19.4163 4.57701C20.8609 6.01984 21.7721 7.91101 22 9.94M18.5 21C9.93959 21 3 14.0604 3 5.5C3 5.11378 3.01413 4.73086 3.04189 4.35173C3.07375 3.91662 3.08968 3.69907 3.2037 3.50103C3.29814 3.33701 3.4655 3.18146 3.63598 3.09925C3.84181 3 4.08188 3 4.56201 3H7.37932C7.78308 3 7.98496 3 8.15802 3.06645C8.31089 3.12515 8.44701 3.22049 8.55442 3.3441C8.67601 3.48403 8.745 3.67376 8.88299 4.05321L10.0491 7.26005C10.2096 7.70153 10.2899 7.92227 10.2763 8.1317C10.2643 8.31637 10.2012 8.49408 10.0942 8.64506C9.97286 8.81628 9.77145 8.93713 9.36863 9.17882L8 10C9.2019 12.6489 11.3501 14.7999 14 16L14.8212 14.6314C15.0629 14.2285 15.1837 14.0271 15.3549 13.9058C15.5059 13.7988 15.6836 13.7357 15.8683 13.7237C16.0777 13.7101 16.2985 13.7904 16.74 13.9509L19.9468 15.117C20.3262 15.255 20.516 15.324 20.6559 15.4456C20.7795 15.553 20.8749 15.6891 20.9335 15.842C21 16.015 21 16.2169 21 16.6207V19.438C21 19.9181 21 20.1582 20.9007 20.364C20.8185 20.5345 20.663 20.7019 20.499 20.7963C20.3009 20.9103 20.0834 20.9262 19.6483 20.9581C19.2691 20.9859 18.8862 21 18.5 21Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </svg>
        &nbsp; Contact Seller ${contactText}
    `;

    contactBtn.onclick = () => {
        window.location.href = `/chat?userId=${product.seller_id}&productId=${product.id}`;
    };

    // Hide contact button if the user is the seller OR if the product is sold/lent
    if (isSoldOrLent) {
        contactBtn.style.display = 'none';
    } else {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.id === product.seller_id) {
                    contactBtn.style.display = 'none';
                }
            } catch (e) {
                console.error("Error parsing token", e);
            }
        }
    }

    // Admin deletion logic
    const adminDeleteBtn = document.getElementById("adminDeleteBtn");
    if (getUserRole() === "admin") {
        adminDeleteBtn.classList.remove("hide");
        adminDeleteBtn.onclick = async () => {
            const confirmed = await showConfirm("Admin Action: Are you sure you want to delete this product?");
            if (!confirmed) return;
            
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/products/${product.id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    showToast("Product deleted successfully!", "success");
                    setTimeout(() => window.location.href = '/dashboard', 1500);
                } else {
                    showToast("Failed to delete product.", "error");
                    const data = await res.json();
                    console.error(data.message);
                }
            } catch (err) {
                console.error(err);
                showToast("Error deleting product.", "error");
            }
        };
    }
}

function showError(msg) {
    document.getElementById("loading").classList.add("hide");
    const errorEl = document.getElementById("error");
    errorEl.innerText = msg;
    errorEl.classList.remove("hide");
}
