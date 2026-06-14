const db = require("./db");
const notificationService = require("../services/notificationService");


module.exports = (io) => {
    // Keep a local Set of registered userIds on this server instance
    const onlineUsers = new Set();

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // User registers their socket with their user ID
        socket.on("register", (userId) => {
            if (userId) {
                const strUserId = String(userId);
                socket.userId = strUserId;
                onlineUsers.add(strUserId);
                socket.join(`user:${strUserId}`);
                console.log(`User ${userId} registered with socket ${socket.id}`);
                // Broadcast that this user is online
                io.emit("user_status", { userId: strUserId, online: true });
            }
        });

        // Handle request for currently online users
        socket.on("request_online_status", () => {
            socket.emit("online_users_list", Array.from(onlineUsers));
        });

        // Handle sending a message
        socket.on("send_message", async (data) => {
            const { conversationId, senderId, receiverId, content } = data;

            try {
                // Save to database
                const [result] = await db.promise().query(
                    "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
                    [conversationId, senderId, content]
                );

                const messageId = result.insertId;

                const [messages] = await db.promise().query(
                    "SELECT * FROM messages WHERE id = ?",
                    [messageId]
                );

                const newMessage = messages[0];

                // Send back to sender for confirmation
                socket.emit("receive_message", newMessage);

                // If receiver is connected (has joined their user room), send to room
                const receiverRoom = `user:${receiverId}`;
                const isReceiverOnline = io.sockets.adapter.rooms.has(receiverRoom);

                if (isReceiverOnline) {
                    io.to(receiverRoom).emit("receive_message", newMessage);
                } else {
                    // User is offline, store notification
                    await notificationService.createNotification(
                        receiverId,
                        `New message from User ${senderId}`,
                        "message",
                        `/chat?id=${senderId}`
                    );
                }
            } catch (err) {
                console.error("Error saving/sending message:", err);
                socket.emit("message_error", { error: "Failed to send message" });
            }
        });

        // Handle trade request notifications
        socket.on("trade_request_send", async (data) => {
            const { sellerId, tradeRequest, buyerName } = data;
            const sellerRoom = `user:${sellerId}`;
            const isSellerOnline = io.sockets.adapter.rooms.has(sellerRoom);
            
            // Store notification in DB regardless of online status for persistent history
            await notificationService.createNotification(
                sellerId,
                `${buyerName || 'Someone'} sent you a trade request for "${tradeRequest.product_title}"`,
                "trade",
                `/profile`
            );

            if (isSellerOnline) {
                io.to(sellerRoom).emit("trade_request_received", tradeRequest);
            }
            socket.emit("trade_request_received", tradeRequest);
        });

        socket.on("trade_request_respond", async (data) => {
            const { buyerId, tradeRequest, sellerName } = data;
            const buyerRoom = `user:${buyerId}`;
            const isBuyerOnline = io.sockets.adapter.rooms.has(buyerRoom);

            await notificationService.createNotification(
                buyerId,
                `${sellerName || 'The seller'} ${tradeRequest.status} your trade request for "${tradeRequest.product_title}"`,
                "trade",
                `/profile`
            );

            if (isBuyerOnline) {
                io.to(buyerRoom).emit("trade_request_updated", tradeRequest);
            }
            socket.emit("trade_request_updated", tradeRequest);
        });
        
        socket.on("trade_request_cancel", (data) => {
            const { sellerId, tradeRequest } = data;
            const sellerRoom = `user:${sellerId}`;
            const isSellerOnline = io.sockets.adapter.rooms.has(sellerRoom);
            if (isSellerOnline) {
                io.to(sellerRoom).emit("trade_request_updated", tradeRequest);
            }
            // Also echo back to buyer
            socket.emit("trade_request_updated", tradeRequest);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
            if (socket.userId) {
                const userId = socket.userId;
                const userRoom = `user:${userId}`;
                
                // Check if the user has any other active connections/tabs open
                const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
                if (!socketsInRoom || socketsInRoom.size === 0) {
                    onlineUsers.delete(userId);
                    console.log(`Removed user ${userId} from active sockets`);
                    // Broadcast offline status
                    io.emit("user_status", { userId: userId, online: false });
                }
            }
        });
    });
};
