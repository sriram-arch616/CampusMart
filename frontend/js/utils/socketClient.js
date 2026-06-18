/* socketClient.js */
(function() {
    let socket = null;
    let activeConversationId = null;

    function initSocket() {
        // Need to identify the current user to register
        let userId = null;
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            userId = user ? user.id : null;
        } catch (e) {
            console.error("Error parsing user from localStorage for socket registration");
            return;
        }
        if (!userId) return;

        if (typeof io !== 'undefined') {
            socket = io(window.API_BASE_URL || '');
            
            socket.on('connect', () => {
                socket.emit('register', userId);
                console.log('Socket connected and registered for user:', userId);
            });

            socket.on('receive_message', (message) => {
                // If we are on the chat page and this is the active conversation, 
                // we don't show a toast/notification (chat.js handles UI).
                if (window.location.pathname.includes('chat') && 
                    activeConversationId == message.conversation_id) {
                    return;
                }

                if (typeof window.addLiveNotification === 'function') {
                    window.addLiveNotification({
                        message: `New message from User ${message.sender_id}: "${truncateContent(message.content)}"`,
                        type: 'message',
                        link: `/chat?id=${message.sender_id}`
                    });
                }
            });

            socket.on('trade_request_received', (tradeRequest) => {
                // Only show notification banner if the current user is the seller (recipient)
                if (String(tradeRequest.seller_id) === String(userId)) {
                    if (typeof window.addLiveNotification === 'function') {
                        window.addLiveNotification({
                            message: `Someone sent you a trade request for "${tradeRequest.product_title}"`,
                            type: 'trade',
                            link: `/profile`
                        });
                    }
                }
            });

            socket.on('trade_request_updated', (tradeRequest) => {
                if (typeof window.addLiveNotification === 'function') {
                    if (tradeRequest.status === 'cancelled') {
                        // Only show notification banner to the seller if request is cancelled by buyer
                        if (String(tradeRequest.seller_id) === String(userId)) {
                            window.addLiveNotification({
                                message: `Trade request for "${tradeRequest.product_title}" was cancelled`,
                                type: 'trade',
                                link: `/profile`
                            });
                        }
                    } else {
                        // Only show notification banner to the buyer if request is accepted/rejected by seller
                        if (String(tradeRequest.buyer_id) === String(userId)) {
                            const statusMsg = tradeRequest.status === 'accepted' ? 'accepted' : 'rejected';
                            window.addLiveNotification({
                                message: `Your trade request for "${tradeRequest.product_title}" was ${statusMsg}`,
                                type: 'trade',
                                link: `/profile`
                            });
                        }
                    }
                }
            });

            socket.on('message_error', (data) => {
                if (typeof showToast === 'function') {
                    showToast(data.error || 'Message error', 'error');
                }
            });
        }
    }

    function truncateContent(content) {
        if (!content) return '';
        return content.length > 30 ? content.substring(0, 27) + '...' : content;
    }

    // Expose globally
    window.CampusSocket = {
        getSocket: () => socket,
        setActiveConversation: (id) => { activeConversationId = id; },
        init: initSocket
    };

    // Auto-init if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSocket);
    } else {
        initSocket();
    }
})();
