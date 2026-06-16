document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    loadProfile();
    loadMyProducts();
});

let currentProfile = {};

async function loadProfile() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users/profile", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch profile");
        
        const result = await res.json();
        const profile = result.data || result;
        currentProfile = profile;
        displayProfile(profile);
    } catch (err) {
        console.error(err);
    }
}

function displayProfile(profile) {
    let nameHtml = profile.name || "N/A";
    if (profile.is_verified) {
        nameHtml += ` <svg title="Student Verified" style="display:inline-block; width:24px; height:24px; vertical-align:middle; color:#0e8bf1; margin-bottom: 2px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    }
    document.getElementById("profileName").innerHTML = nameHtml;
    document.getElementById("profileUsername").innerText = profile.username || "N/A";
    document.getElementById("profileEmail").innerText = profile.email || "N/A";
    document.getElementById("profileMobile").innerText = profile.mobile_number || "Not provided";
    document.getElementById("profileType").innerText = profile.student_type || "Not provided";
    document.getElementById("profileHostel").innerText = profile.hostel || "Not provided";
    document.getElementById("profileYear").innerText = profile.year_of_study || "Not provided";
    document.getElementById("profileCourse").innerText = profile.course || "Not provided";

    document.getElementById("profilePicImg").src = profile.profile_pic || "/assets/images/NoPfp.jpg";

    // Populate edit form fields
    document.getElementById("editMobile").value = profile.mobile_number || "";
    document.getElementById("editType").value = profile.student_type || "";
    document.getElementById("editHostel").value = profile.hostel || "";
    document.getElementById("editYear").value = profile.year_of_study || "";
    document.getElementById("editCourse").value = profile.course || "";
}

function toggleEditMode() {
    const readMode = document.getElementById("profileReadMode");
    const editForm = document.getElementById("profileEditForm");
    
    if (readMode.classList.contains("hide")) {
        readMode.classList.remove("hide");
        editForm.classList.add("hide");
    } else {
        readMode.classList.add("hide");
        editForm.classList.remove("hide");
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const formData = new FormData();
    formData.append("mobile_number", document.getElementById("editMobile").value);
    formData.append("student_type", document.getElementById("editType").value);
    formData.append("hostel", document.getElementById("editHostel").value);
    formData.append("year_of_study", document.getElementById("editYear").value);
    formData.append("course", document.getElementById("editCourse").value);
    
    const fileInput = document.getElementById("editProfilePic");
    if (fileInput.files[0]) {
        formData.append("profile_pic", fileInput.files[0]);
    }

    try {
        const res = await fetch("/api/users/profile", {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            showToast("Profile updated successfully!", "success");
            toggleEditMode();
            loadProfile(); // Reload profile
        } else {
            showToast("Failed to update profile.", "error");
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleDirectPhotoUpload(input) {
    if (!input.files || !input.files[0]) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("profile_pic", input.files[0]);

    try {
        const res = await fetch("/api/users/profile", {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            showToast("Profile picture updated!", "success");
            loadProfile();
        } else {
            showToast("Failed to update picture.", "error");
            const data = await res.json();
            console.error(data.message);
        }
    } catch (err) {
        console.error("Direct photo upload error:", err);
        showToast("Error updating picture.", "error");
    }
}

let myProducts = [];

async function loadMyProducts() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/products/my-products", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch products");

        const result = await response.json();
        const products = result.data || result;
        myProducts = products;
        displayMyProducts(products);
    } catch (error) {
        console.error("Error fetching my products:", error);
    }
}

function displayMyProducts(products) {
    const container = document.getElementById("myProductContainer");
    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>You haven't added any products yet.</p>
                <button class="btn btn-save" onclick="window.location.href='/add-product'">Add your first product</button>
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

        const isSoldOrLent = product.status === "sold" || product.status === "lent";
        const statusBadge = isSoldOrLent
            ? `<div class="sold-overlay-badge">${product.status === "sold" ? "SOLD" : "LENT"}</div>`
            : "";

        // Create product card but modify the bottom section for Edit / Delete instead of Contact
        const card = `
            <div class="card ${isSoldOrLent ? 'card-sold' : ''}" onclick="openProduct(${product.id})" style="cursor:pointer">
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
                            ${product.type === 'sell' ? 'For Buy' : 'For Rent'}
                        </div>
                    </div>
                    <div class="my-product-actions">
                        <button class="btn btn-edit-profile" onclick="event.stopPropagation(); openEditProductModal(${product.id})">✏️ Edit</button>
                        <button class="btn btn-delete" onclick="event.stopPropagation(); handleDeleteProduct(${product.id})">🗑 Delete</button>
                    </div>
                </div>
            </div>
        `;
        html += card;
    });
    container.innerHTML = html;
}

function openProduct(id) {
    window.location.href = `/product?id=${id}`;
}

async function handleDeleteProduct(id) {
    const confirmed = await showConfirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/products/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            showToast("Product deleted successfully!", "success");
            loadMyProducts();
        } else {
            showToast("Failed to delete product.", "error");
        }
    } catch (err) {
        console.error(err);
    }
}

function openEditProductModal(id) {
    const product = myProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById("editProductId").value = product.id;
    document.getElementById("editPTitle").value = product.title;
    document.getElementById("editPDesc").value = product.description;
    document.getElementById("editPPrice").value = product.price;
    document.getElementById("editPCat").value = product.category;
    document.getElementById("editPType").value = product.type;
    
    document.getElementById("editProductModal").classList.remove("hide");
}

function closeEditModal() {
    document.getElementById("editProductModal").classList.add("hide");
}

async function handleProductUpdate(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const id = document.getElementById("editProductId").value;
    const formData = new FormData();
    formData.append("title", document.getElementById("editPTitle").value);
    formData.append("description", document.getElementById("editPDesc").value);
    formData.append("price", document.getElementById("editPPrice").value);
    formData.append("category", document.getElementById("editPCat").value);
    formData.append("type", document.getElementById("editPType").value);
    
    const fileInput = document.getElementById("editPImage");
    if (fileInput.files[0]) {
        formData.append("image", fileInput.files[0]);
    }

    try {
        const res = await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            showToast("Product updated successfully!", "success");
            closeEditModal();
            loadMyProducts();
        } else {
            showToast("Failed to update product.", "error");
        }
    } catch (err) {
        console.error(err);
    }
}
