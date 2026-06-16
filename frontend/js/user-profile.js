document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    loadPublicProfile();
});

function getProfileUserId() {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    if (!id) {
        // Fallback for path parameter routing (e.g. /user/2)
        const pathParts = window.location.pathname.split('/');
        const userIdx = pathParts.indexOf('user');
        if (userIdx !== -1 && pathParts[userIdx + 1]) {
            id = pathParts[userIdx + 1];
        }
    }
    return id;
}

function getCurrentUserId() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch (e) {
        return null;
    }
}

async function loadPublicProfile() {
    const userId = getProfileUserId();
    if (!userId || isNaN(userId)) {
        showError("Invalid user ID.");
        return;
    }

    // If the user is viewing their own profile, redirect to /profile
    const currentUserId = getCurrentUserId();
    if (currentUserId && String(currentUserId) === String(userId)) {
        window.location.href = "/profile";
        return;
    }

    try {
        const [profileRes, productsRes] = await Promise.all([
            fetch(`/api/users/profile/${userId}`),
            fetch(`/api/products/user/${userId}`)
        ]);

        if (!profileRes.ok) {
            showError("User not found.");
            return;
        }

        const profileResult = await profileRes.json();
        const profile = profileResult.data || profileResult;

        const productsResult = await productsRes.json();
        const products = productsResult.data || [];

        renderProfile(profile);
        renderProducts(products, profile.name);

    } catch (err) {
        console.error("Error loading public profile:", err);
        showError("Error loading profile.");
    }
}

function renderProfile(profile) {
    document.getElementById("upLoading").classList.add("hide");
    document.getElementById("upContent").classList.remove("hide");

    // Breadcrumb
    document.getElementById("breadcrumbName").textContent = profile.name || "User Profile";

    // Title
    document.title = `${profile.name || profile.username} — CampusMarketPlace`;

    // Profile picture
    document.getElementById("upPic").src = profile.profile_pic || "/assets/images/NoPfp.jpg";

    // Name with verified badge
    let nameHtml = profile.name || "N/A";
    if (profile.is_verified) {
        nameHtml += ` <svg class="up-verified-badge" title="Student Verified" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    }
    document.getElementById("upName").innerHTML = nameHtml;

    document.getElementById("upUsername").textContent = profile.username || "N/A";

    // Joined date
    if (profile.created_at) {
        const date = new Date(profile.created_at);
        document.getElementById("upJoinedDate").textContent = date.toLocaleDateString("en-US", {
            month: "long", year: "numeric"
        });
    }

    // Details
    document.getElementById("upType").textContent = profile.student_type || "Not provided";
    document.getElementById("upHostel").textContent = profile.hostel || "Not provided";
    document.getElementById("upYear").textContent = profile.year_of_study || "Not provided";
    document.getElementById("upCourse").textContent = profile.course || "Not provided";

    // Chat button
    const actionsDiv = document.getElementById("upActions");
    actionsDiv.innerHTML = `
        <a class="up-btn up-btn-chat" href="/chat?userId=${profile.id}" id="upChatBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Message ${profile.name ? profile.name.split(' ')[0] : 'User'}
        </a>
    `;
}

function renderProducts(products, userName) {
    const heading = document.getElementById("upProductsHeading");
    heading.textContent = `${userName ? userName.split(' ')[0] + "'s" : ""} Products`;

    const container = document.getElementById("upProductGrid");
    container.innerHTML = "";

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="up-empty-products">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <p>This user hasn't listed any products yet.</p>
            </div>
        `;
        return;
    }

    let html = "";
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

        const card = `
            <div class="card ${isSoldOrLent ? 'card-sold' : ''}" onclick="window.location.href='/product?id=${product.id}'" style="cursor:pointer">
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
                    <div class="bottom">
                        <div class="price">
                            <span class="new">₹${product.price}${product.type === 'lend' ? '/day' : ''}</span>
                        </div>
                        <div class="pd-type-badge" style="margin: 0; padding: 2px 10px; font-size: 11px;">
                            ${typeText}
                        </div>
                    </div>
                </div>
            </div>
        `;
        html += card;
    });
    container.innerHTML = html;
}

function showError(msg) {
    document.getElementById("upLoading").classList.add("hide");
    const errorEl = document.getElementById("upError");
    errorEl.textContent = msg;
    errorEl.style.display = "block";
}
