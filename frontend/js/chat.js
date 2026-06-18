const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const conversationList = document.getElementById("conversationList");
const chatUserName = document.getElementById("chatUserName");
const chatSearchBtn = document.getElementById("chatSearchBtn");
const chatSearchContainer = document.getElementById("chatSearchContainer");
const chatSearchInput = document.getElementById("chatSearchInput");
const tradeDealBtn = document.getElementById("tradeDealBtn");
const tradeDealBtnText = document.getElementById("tradeDealBtnText");

chatSearchBtn.addEventListener("click", () => {
    chatSearchContainer.classList.toggle("active");
    if (chatSearchContainer.classList.contains("active")) {
        chatSearchInput.focus();
    } else {
        chatSearchInput.value = "";
        filterUsers("");
    }
});

chatSearchInput.addEventListener("input", (e) => {
    filterUsers(e.target.value.toLowerCase());
});

function filterUsers(query) {
    const items = conversationList.querySelectorAll(".chat-sb-item");
    items.forEach(item => {
        const nameNode = item.querySelector(".chat-sb-name");
        if (nameNode) {
            const name = nameNode.textContent.toLowerCase();
            if (name.includes(query)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        }
    });
}

let socket;
let currentUser = null;
let currentConversationId = null;
let activeReceiverId = null;
let currentProduct = null; // { id, seller_id, type, status }
const onlineUsers = new Set();

// Initialize chat application
async function initChat() {
    const user = localStorage.getItem("user");
    if (!user) {
        window.location.href = "/login";
        return;
    }

    try {
        // Fetch current user info
        const res = await fetch("/protected");

        if (!res.ok) {
            window.location.href = "/login";
            return;
        }

        const data = await res.json();
        currentUser = data.user;

        // Use Global Socket
        socket = CampusSocket.getSocket();
        if (!socket) {
            // In case it's not ready yet, we can try to wait or re-init
            CampusSocket.init();
            socket = CampusSocket.getSocket();
        }

        setupSocketListeners();

        // Fetch conversations
        await loadConversations();

    } catch (err) {
        console.error("Error initializing chat:", err);
    }
}

function setupSocketListeners() {
    socket.on("receive_message", (message) => {
        // Only append if it belongs to the currently active conversation
        if (message.conversation_id === currentConversationId) {
            const type = message.sender_id === currentUser.id ? "me" : "them";
            addMessageToDOM(message.content, type, new Date(message.created_at));
        }
    });

    socket.on("user_status", (data) => {
        if (data.online) onlineUsers.add(String(data.userId));
        else onlineUsers.delete(String(data.userId));
        
        if (String(data.userId) === String(activeReceiverId)) {
            updateCurrentChatHeaderStatus();
        }
    });

    socket.on("online_users_list", (users) => {
        onlineUsers.clear();
        users.forEach(id => onlineUsers.add(String(id)));
        updateCurrentChatHeaderStatus();
    });

    // Trade request events
    socket.on("trade_request_received", (tradeRequest) => {
        if (tradeRequest.conversation_id === currentConversationId) {
            addTradeRequestToDOM(tradeRequest);
        }
    });

    socket.on("trade_request_updated", (tradeRequest) => {
        if (tradeRequest.conversation_id === currentConversationId) {
            updateTradeRequestInDOM(tradeRequest);
        }
    });

    socket.emit("request_online_status");
}

function updateCurrentChatHeaderStatus() {
    const statusDiv = document.getElementById("chatUserStatus");
    if (!statusDiv || !activeReceiverId) return;

    if (onlineUsers.has(String(activeReceiverId))) {
        statusDiv.style.opacity = "1";
    } else {
        statusDiv.style.opacity = "0";
    }
}

async function loadConversations() {
    try {
        const res = await fetch("/api/chat/conversations");

        if (!res.ok) throw new Error("Failed to fetch conversations");

        const result = await res.json();
        const conversations = result.data || result;
        conversationList.innerHTML = "";

        if (conversations.length === 0) {
            conversationList.innerHTML = `
                <div class="chat-sb-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>No conversations yet.<br>Contact a seller to start chatting.</p>
                </div>`;
            return;
        }

        // Determine which conversation to auto-select
        let autoSelectIndex = 0;
        if (targetConversationId || targetUserId) {
            const targetIdx = conversations.findIndex(c => 
                (targetConversationId && c.conversation_id === targetConversationId) ||
                (targetUserId && String(c.other_user_id) === String(targetUserId))
            );
            if (targetIdx !== -1) autoSelectIndex = targetIdx;
            // Clear targets after use
            targetConversationId = null;
            targetUserId = null;
        }

        conversations.forEach((conv, index) => {
            const item = document.createElement("div");
            item.className = `chat-sb-item ${index === autoSelectIndex ? "active" : ""}`;

            // Format name with product info if available
            let displayName = conv.other_user_name;
            if (conv.other_user_verified) {
                displayName += ` <svg title="Student Verified" style="display:inline-block; width:16px; height:16px; vertical-align:middle; color:#0e8bf1; margin-bottom: 2px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
            }
            if (conv.product_name) {
                displayName += ` <span style='font-size: 11px; color:#aaa'>(${conv.product_name})</span>`;
            }

            const avatarSrc = conv.other_user_pic || "/assets/images/NoPfp.jpg";
            const avatarHtml = `<img src="${avatarSrc}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;

                item.innerHTML = `
                    <div class="chat-sb-avatar">${avatarHtml}</div>
                    <div class="chat-sb-info">
                        <span class="chat-sb-name">${displayName}</span>
                    </div>
                    <a href="/user?id=${conv.other_user_id}" class="chat-sb-profile-link" onclick="event.stopPropagation()" title="View profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </a>
                `;

            // Store product info on the item for later use
            item.dataset.productId = conv.product_id || "";
            item.dataset.productType = conv.product_type || "";
            item.dataset.productStatus = conv.product_status || "";
            item.dataset.productSellerId = conv.product_seller_id || "";

            item.addEventListener("click", () => {
                document.querySelectorAll(".chat-sb-item").forEach(el => el.classList.remove("active"));
                item.classList.add("active");
                const productInfo = conv.product_id ? {
                    id: conv.product_id,
                    seller_id: conv.product_seller_id,
                    type: conv.product_type,
                    status: conv.product_status
                } : null;
                loadMessages(conv.conversation_id, conv.other_user_id, conv.other_user_name, conv.other_user_pic, conv.other_user_verified, productInfo);
            });

            conversationList.appendChild(item);

            // Auto-select the target conversation
            if (index === autoSelectIndex) {
                const productInfo = conv.product_id ? {
                    id: conv.product_id,
                    seller_id: conv.product_seller_id,
                    type: conv.product_type,
                    status: conv.product_status
                } : null;
                loadMessages(conv.conversation_id, conv.other_user_id, conv.other_user_name, conv.other_user_pic, conv.other_user_verified, productInfo);
            }
        });

    } catch (err) {
        console.error("Error loading conversations:", err);
    }
}

async function loadMessages(conversationId, receiverId, receiverName, receiverPic, isVerified, productInfo) {
    currentConversationId = conversationId;
    activeReceiverId = receiverId;
    currentProduct = productInfo;
    
    let headerName = receiverName;
    if (isVerified) {
        headerName += ` <svg title="Student Verified" style="display:inline-block; width:20px; height:20px; vertical-align:middle; color:#0e8bf1; margin-bottom: 2px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    }
    chatUserName.innerHTML = `<a href="/user?id=${receiverId}" style="color: inherit; text-decoration: none;" title="View profile">${headerName}</a>`;
    chatUserName.style.cursor = "pointer";
    updateCurrentChatHeaderStatus();
    
    // Notify global socket client about active conversation to suppress toasts
    if (window.CampusSocket) {
        window.CampusSocket.setActiveConversation(conversationId);
    }

    // Show header and input form
    document.getElementById("chatMainHeader").style.display = "";
    document.getElementById("chatForm").style.display = "";

    // Hide the empty state
    const emptyState = document.getElementById("chatEmptyState");
    if (emptyState) emptyState.remove();

    // Update main header avatar
    const headerAvatar = document.querySelector(".chat-main-header .chat-sb-avatar.small");
    if (headerAvatar) {
        const picToUse = receiverPic || "/assets/images/NoPfp.jpg";
        headerAvatar.innerHTML = `<a href="/user?id=${receiverId}" title="View profile"><img src="${picToUse}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"></a>`;
        headerAvatar.style.background = "transparent";
    }

    // Update trade deal button
    updateTradeDealButton();

    chatMessages.innerHTML = ""; // Clear current messages

    try {
        // Fetch messages and trade requests in parallel
        const [messagesRes, tradeRes] = await Promise.all([
            fetch(`/api/chat/conversations/${conversationId}/messages`),
            fetch(`/api/chat/trade-requests/${conversationId}`)
        ]);

        if (!messagesRes.ok) throw new Error("Failed to fetch messages");

        const messagesResult = await messagesRes.json();
        const messages = messagesResult.data || messagesResult;

        let tradeRequests = [];
        if (tradeRes.ok) {
            const tradeResult = await tradeRes.json();
            tradeRequests = tradeResult.data || [];
        }

        // Combine messages and trade requests, sort by time
        const allItems = [];

        messages.forEach(msg => {
            allItems.push({
                type: 'message',
                data: msg,
                timestamp: new Date(msg.created_at).getTime()
            });
        });

        tradeRequests.forEach(tr => {
            allItems.push({
                type: 'trade_request',
                data: tr,
                timestamp: new Date(tr.created_at).getTime()
            });
        });

        allItems.sort((a, b) => a.timestamp - b.timestamp);

        // Show welcome if nothing
        if (allItems.length === 0) {
            chatMessages.innerHTML = `
                <div class="chat-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>No messages yet. Say hi! 👋</p>
                </div>`;
            return;
        }

        allItems.forEach(item => {
            if (item.type === 'message') {
                const msgType = item.data.sender_id === currentUser.id ? "me" : "them";
                addMessageToDOM(item.data.content, msgType, new Date(item.data.created_at));
            } else {
                addTradeRequestToDOM(item.data, false);
            }
        });

    } catch (err) {
        console.error("Error loading messages:", err);
    }
}

function updateTradeDealButton() {
    if (!currentProduct || !currentUser) {
        tradeDealBtn.style.display = "none";
        return;
    }

    // Only show if: product exists, is available, and current user is NOT the seller
    const isSeller = currentUser.id === currentProduct.seller_id;
    const isAvailable = currentProduct.status === "available";

    if (!isSeller && isAvailable) {
        tradeDealBtn.style.display = "flex";
        const actionText = currentProduct.type === "sell" ? "Request to Buy" : "Request to Rent";
        tradeDealBtnText.textContent = actionText;
    } else {
        tradeDealBtn.style.display = "none";
    }
}

// Handle trade deal button click
tradeDealBtn.addEventListener("click", async () => {
    if (!currentProduct || !currentConversationId) return;

    try {
        tradeDealBtn.disabled = true;
        tradeDealBtn.style.opacity = "0.5";

        const res = await fetch("/api/chat/trade-request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                conversationId: currentConversationId,
                productId: currentProduct.id,
                sellerId: currentProduct.seller_id
            })
        });

        const result = await res.json();

        if (!res.ok) {
            showToast(result.message || "Failed to send request.", "error");
            tradeDealBtn.disabled = false;
            tradeDealBtn.style.opacity = "1";
            return;
        }

        // Emit socket event for real-time
        socket.emit("trade_request_send", {
            sellerId: currentProduct.seller_id,
            tradeRequest: result.data
        });

        // Update DOM immediately
        addTradeRequestToDOM(result.data);

        // Hide button after sending request
        tradeDealBtn.style.display = "none";

        showToast("Trade request sent!", "success");

    } catch (err) {
        console.error("Error sending trade request:", err);
        showToast("Error sending request.", "error");
        tradeDealBtn.disabled = false;
        tradeDealBtn.style.opacity = "1";
    }
});

function addTradeRequestToDOM(tr, scroll = true) {
    // Remove empty state if it exists
    const emptyState = chatMessages.querySelector(".chat-empty-state");
    if (emptyState) emptyState.remove();

    const isBuyer = currentUser.id === tr.buyer_id;
    const isSeller = currentUser.id === tr.seller_id;
    const actionLabel = tr.product_type === "sell" ? "buy" : "rent";
    const doneLabel = tr.product_type === "sell" ? "Sold" : "Lent";

    let statusHtml = "";
    let actionsHtml = "";

    if (tr.status === "pending") {
        statusHtml = `<span class="tr-status tr-pending">⏳ Pending</span>`;
        if (isSeller) {
            actionsHtml = `
                <div class="tr-actions">
                    <button class="tr-accept-btn" onclick="respondTradeRequest(${tr.id}, 'accept', ${tr.buyer_id})" title="Accept">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Accept
                    </button>
                    <button class="tr-reject-btn" onclick="respondTradeRequest(${tr.id}, 'reject', ${tr.buyer_id})" title="Reject">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Reject
                    </button>
                </div>
            `;
        } else if (isBuyer) {
            actionsHtml = `
                <div class="tr-actions">
                    <button class="tr-cancel-btn" onclick="cancelTradeRequest(${tr.id}, ${tr.seller_id})" title="Cancel Request">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Cancel Request
                    </button>
                </div>
            `;
        }
    } else if (tr.status === "accepted") {
        statusHtml = `<span class="tr-status tr-accepted">✓ ${doneLabel}!</span>`;
    } else if (tr.status === "cancelled") {
        statusHtml = `<span class="tr-status tr-cancelled">∅ Cancelled</span>`;
    } else {
        statusHtml = `<span class="tr-status tr-rejected">✗ Rejected</span>`;
    }

    const dateStr = new Date(tr.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const card = document.createElement("div");
    card.className = "tr-card";
    card.id = `trade-request-${tr.id}`;
    card.innerHTML = `
        <div class="tr-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </div>
        <div class="tr-body">
            <div class="tr-title">
                <strong>@${tr.buyer_username}</strong> wants to <strong>${actionLabel}</strong>
            </div>
            <div class="tr-product">${tr.product_title} — ₹${tr.product_price}</div>
            <div class="tr-footer">
                ${statusHtml}
                <span class="tr-time">${dateStr}</span>
            </div>
            ${actionsHtml}
        </div>
    `;

    chatMessages.appendChild(card);
    if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateTradeRequestInDOM(tr) {
    const existing = document.getElementById(`trade-request-${tr.id}`);
    if (existing) {
        existing.remove();
    }
    addTradeRequestToDOM(tr);

    // If accepted, hide the deal button and update current product status
    if (tr.status === "accepted" && currentProduct && currentProduct.id === tr.product_id) {
        currentProduct.status = tr.product_type === "sell" ? "sold" : "lent";
        updateTradeDealButton();
    }
}

async function respondTradeRequest(requestId, action, buyerId) {
    try {
        const res = await fetch(`/api/chat/trade-request/${requestId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action })
        });

        const result = await res.json();

        if (!res.ok) {
            showToast(result.message || "Failed to respond.", "error");
            return;
        }

        // Emit socket event
        socket.emit("trade_request_respond", {
            buyerId: buyerId,
            tradeRequest: result.data
        });

        // Update DOM immediately
        updateTradeRequestInDOM(result.data);

        const actionText = action === "accept" ? "accepted" : "rejected";
        showToast(`Trade request ${actionText}!`, action === "accept" ? "success" : "info");

    } catch (err) {
        console.error("Error responding to trade request:", err);
        showToast("Error responding to request.", "error");
    }
}

async function cancelTradeRequest(requestId, sellerId) {
    const confirmed = await showConfirm("Are you sure you want to cancel this trade request?");
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/chat/trade-request/${requestId}`, {
            method: "DELETE"
        });

        const result = await res.json();

        if (!res.ok) {
            showToast(result.message || "Failed to cancel request.", "error");
            return;
        }

        // Emit socket event
        socket.emit("trade_request_cancel", {
            sellerId: sellerId,
            tradeRequest: result.data
        });

        // Update DOM immediately
        updateTradeRequestInDOM(result.data);

        showToast("Trade request cancelled.", "info");

    } catch (err) {
        console.error("Error cancelling trade request:", err);
        showToast("Error cancelling request.", "error");
    }
}

chatForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const messageContent = chatInput.value.trim();
    if (!messageContent || !currentConversationId) return;

    // Emit via socket
    socket.emit("send_message", {
        conversationId: currentConversationId,
        senderId: currentUser.id,
        receiverId: activeReceiverId,
        content: messageContent
    });

    chatInput.value = "";
});

function addMessageToDOM(text, type, dateObj = new Date()) {
    // Remove empty state if it exists
    const emptyState = chatMessages.querySelector(".chat-empty-state");
    if (emptyState) emptyState.remove();

    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-bubble-wrap", type);

    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    const p = document.createElement("p");
    p.textContent = text;

    const time = document.createElement("span");
    time.classList.add("chat-time");

    time.textContent = dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    bubble.appendChild(p);
    bubble.appendChild(time);
    wrapper.appendChild(bubble);

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Check for deep link to start a new chat (e.g. from product page or user profile)
const urlParams = new URLSearchParams(window.location.search);
const newChatUserId = urlParams.get('userId');
const newChatProductId = urlParams.get('productId');

let targetConversationId = null;
let targetUserId = null;

if (newChatUserId) {
    targetUserId = targetUserId || newChatUserId;
    const user = localStorage.getItem("user");
    if (user) {
        fetch("/api/chat/conversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId2: newChatUserId, productId: newChatProductId })
        }).then(res => res.json()).then(data => {
            if (data.conversationId) {
                targetConversationId = data.conversationId;
            }
            // Remove params from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            initChat();
        }).catch(err => {
            console.error("Error creating chat:", err);
            initChat();
        });
    } else {
        window.location.href = "/login";
    }
} else {
    initChat();
}