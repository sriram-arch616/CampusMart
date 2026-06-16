const sellBtn = document.getElementById("sellBtn");
const lendBtn = document.getElementById("lendBtn");
const flipCard = document.getElementById("flipCard");

const sellForm = document.getElementById("sellForm");
const lendForm = document.getElementById("lendForm");

let productType = "sell";

sellBtn.addEventListener("click", () => {
    productType = "sell";
    sellBtn.classList.add("active");
    lendBtn.classList.remove("active");
    flipCard.classList.remove("flip");
});

lendBtn.addEventListener("click", () => {
    productType = "lend";
    lendBtn.classList.add("active");
    sellBtn.classList.remove("active");
    flipCard.classList.add("flip");
});

const imageSell = document.getElementById("imageSell");
const previewSellContainer = document.getElementById("previewSellContainer");

imageSell.addEventListener("change", () => {
    const file = imageSell.files[0];
    if (file) {
        previewSellContainer.innerHTML = `<img id="previewSell" src="${URL.createObjectURL(file)}">`;
    }
});

// Click preview to trigger file upload
previewSellContainer.addEventListener("click", () => {
    imageSell.click();
});

const imageLend = document.getElementById("imageLend");
const previewLendContainer = document.getElementById("previewLendContainer");

imageLend.addEventListener("change", () => {
    const file = imageLend.files[0];
    if (file) {
        previewLendContainer.innerHTML = `<img id="previewLend" src="${URL.createObjectURL(file)}">`;
    }
});

// Click preview to trigger file upload
previewLendContainer.addEventListener("click", () => {
    imageLend.click();
});

async function submitProduct(e, type) {
    e.preventDefault();

    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login to add a product.", "info");
        setTimeout(() => {
            window.location.href = "/login";
        }, 1500);
        return;
    }

    const formData = new FormData();
    formData.append("type", type);

    if (type === "sell") {
        formData.append("title", document.getElementById("sellTitle").value);
        formData.append("price", document.getElementById("sellPrice").value);
        formData.append("category", document.getElementById("sellCategory").value);
        formData.append("description", document.getElementById("sellDescription").value);
        if (imageSell.files[0]) {
            formData.append("image", imageSell.files[0]);
        }
    } else {
        formData.append("title", document.getElementById("lendTitle").value);
        formData.append("price", document.getElementById("lendPrice").value);
        formData.append("category", document.getElementById("lendCategory").value);
        formData.append("description", document.getElementById("lendDescription").value);
        if (imageLend.files[0]) {
            formData.append("image", imageLend.files[0]);
        }
    }

    try {
        const response = await fetch("/api/products", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to add product");
        }

        showToast("Product added successfully!", "success");
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1500);
    } catch (error) {
        console.error("Error creating product:", error);
        showToast("Error adding product. Please try again.", "error");
    }
}

sellForm.addEventListener("submit", (e) => submitProduct(e, "sell"));
lendForm.addEventListener("submit", (e) => submitProduct(e, "lend"));
