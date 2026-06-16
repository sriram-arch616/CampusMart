document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    
    const stepRequestOTP = document.getElementById("stepRequestOTP");
    const stepResetPassword = document.getElementById("stepResetPassword");
    
    const resendOtpLink = document.getElementById("resendOtpLink");
    
    let currentEmail = "";

    // Step 1: Request OTP
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const email = document.getElementById("email").value;
            const submitBtn = document.getElementById("sendOtpBtn");
            
            // Basic validation
            if (!email) {
                showToast("Please enter an email address", "error");
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.value = "Sending...";
                
                const response = await fetch('/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(data.message, "success");
                    currentEmail = email;
                    
                    // Proceed to step 2
                    stepRequestOTP.style.display = "none";
                    stepResetPassword.style.display = "block";
                } else {
                    showToast(data.message || "Failed to send OTP", "error");
                }
            } catch (error) {
                showToast("An error occurred. Please try again.", "error");
                console.error("Forgot password error:", error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.value = "Send OTP";
            }
        });
    }

    const newPasswordInput = document.getElementById("newPassword");
    const reqs = {
        length: document.getElementById("req-length"),
        lower: document.getElementById("req-lower"),
        upper: document.getElementById("req-upper"),
        digit: document.getElementById("req-digit"),
        special: document.getElementById("req-special")
    };

    function updateReq(el, isValid) {
        if (!el) return;
        if (isValid) {
            el.classList.add("valid");
            el.querySelector("i").innerText = "✔";
        } else {
            el.classList.remove("valid");
            el.querySelector("i").innerText = "✖";
        }
    }

    if (newPasswordInput) {
        newPasswordInput.addEventListener("input", function () {
            const val = newPasswordInput.value;
            updateReq(reqs.length, val.length >= 8);
            updateReq(reqs.lower, /[a-z]/.test(val));
            updateReq(reqs.upper, /[A-Z]/.test(val));
            updateReq(reqs.digit, /[0-9]/.test(val));
            updateReq(reqs.special, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));
        });
    }

    // Step 2: Verify OTP and Reset
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const otp = document.getElementById("otp").value;
            const newPassword = document.getElementById("newPassword").value;
            const submitBtn = document.getElementById("resetPasswordBtn");
            
            if (!otp || !newPassword) {
                showToast("Please fill in both fields", "error");
                return;
            }

            if (newPassword.length < 8) {
                showToast("Password must be at least 8 characters", "error");
                return;
            }
            if (!/[a-z]/.test(newPassword)) {
                showToast("Password must contain a lowercase letter", "error");
                return;
            }
            if (!/[A-Z]/.test(newPassword)) {
                showToast("Password must contain an uppercase letter", "error");
                return;
            }
            if (!/[0-9]/.test(newPassword)) {
                showToast("Password must contain a digit", "error");
                return;
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
                showToast("Password must contain a special character", "error");
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.value = "Resetting...";
                
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail, otp, newPassword })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast("Password reset successful! Redirecting to login...", "success");
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showToast(data.message || "Failed to reset password. OTP is invalid or expired.", "error");
                }
            } catch (error) {
                showToast("An error occurred. Please try again.", "error");
                console.error("Reset password error:", error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.value = "Reset Password";
            }
        });
    }
    
    if (resendOtpLink) {
        resendOtpLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!currentEmail) return;
            
            try {
                showToast("Resending OTP...", "info");
                const response = await fetch('/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail })
                });
                const data = await response.json();
                if (data.success) {
                    showToast("A new OTP has been sent", "success");
                } else {
                    showToast(data.message || "Failed to resend OTP", "error");
                }
            } catch(error) {
                showToast("Error resending OTP", "error");
            }
        });
    }
});
