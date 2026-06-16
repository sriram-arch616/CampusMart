document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("token", data.token);
        showToast("Login successful!", "success");
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1000);
    } else {
        showToast(data.message || "Login failed", "error");
    }

});