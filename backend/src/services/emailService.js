exports.sendOTP = async (toEmail, otp, context = "reset") => {
    try {
        const isVerification = context === "verification";
        const subject = isVerification ? "CampusMarketPlace - Email Verification OTP" : "CampusMarketPlace - Password Reset OTP";
        const title = isVerification ? "Email Verification" : "Password Reset Request";
        const msg = isVerification ? "You are registering a new account. Use the following OTP to verify your email:" : "You requested to reset your password. Use the following OTP to proceed:";

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #4CAF50;">${title}</h2>
                <p>${msg}</p>
                <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; font-weight: bold; margin: 20px 0; border-radius: 5px;">
                    ${otp}
                </div>
                <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                <p>Thank you,<br>CampusMarketPlace Team</p>
            </div>
        `;

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": process.env.BREVO_API_KEY || process.env.SMTP_PASS,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
                    name: "CampusMarketPlace"
                },
                to: [{ email: toEmail }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Brevo API Error: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("Email sent successfully via API: " + data.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email via API:", error);
        throw new Error("Failed to send OTP email.");
    }
};
