const db = require("../config/db");

// Start or get an existing conversation
exports.startConversation = async (req, res, next) => {
    let { userId2, productId } = req.body;
    const userId1 = req.user.id; 

    if (!userId2) {
        return res.status(400).json({ success: false, message: "Missing required fields: userId2 is required." });
    }

    // Sanitize productId
    if (productId === "undefined" || productId === "null") {
        productId = null;
    }

    // Prevent user from chatting with themselves
    if (userId1 === parseInt(userId2)) {
        return res.status(400).json({ success: false, message: "Cannot start a conversation with yourself." });
    }

    try {
        // Check if conversation already exists between these 2 users (one conversation per user pair)
        const query = `
            SELECT id FROM conversations 
            WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
            LIMIT 1
        `;
        const params = [userId1, userId2, userId2, userId1];

        const [existingConv] = await db.promise().query(query, params);

        if (existingConv.length > 0) {
            // Update product context if a new product is being discussed
            if (productId) {
                await db.promise().query(
                    "UPDATE conversations SET product_id = ? WHERE id = ?",
                    [productId, existingConv[0].id]
                );
            }
            return res.status(200).json({ success: true, conversationId: existingConv[0].id });
        }

        // Doesn't exist, create a new one
        const [result] = await db.promise().query(
            "INSERT INTO conversations (user1_id, user2_id, product_id) VALUES (?, ?, ?)",
            [userId1, userId2, productId || null]
        );

        res.status(201).json({ success: true, conversationId: result.insertId });
    } catch (err) {
        next(err);
    }
};

// Get all conversations for the logged-in user
exports.getUserConversations = async (req, res, next) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT c.id AS conversation_id, c.created_at,
                   u.id AS other_user_id, u.username AS other_user_name, u.profile_pic AS other_user_pic, u.is_verified AS other_user_verified,
                   p.id AS product_id, p.title AS product_name, p.type AS product_type, p.status AS product_status, p.seller_id AS product_seller_id
            FROM conversations c
            JOIN users u ON (u.id = IF(c.user1_id = ?, c.user2_id, c.user1_id))
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.created_at DESC
        `;

        const [conversations] = await db.promise().query(query, [userId, userId, userId]);
        res.status(200).json({ success: true, data: conversations });
    } catch (err) {
        next(err);
    }
};

// Get messages for a conversation
exports.getConversationMessages = async (req, res, next) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        // First verify the user is part of this conversation
        const [conv] = await db.promise().query(
            "SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
            [conversationId, userId, userId]
        );

        if (conv.length === 0) {
            return res.status(403).json({ success: false, message: "Forbidden: You are not part of this conversation." });
        }

        // Fetch messages
        const [messages] = await db.promise().query(
            "SELECT m.id, m.sender_id, m.content, m.created_at, u.username AS sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC",
            [conversationId]
        );

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        next(err);
    }
};

// Create a trade request (buyer sends)
exports.createTradeRequest = async (req, res, next) => {
    const buyerId = req.user.id;
    const { conversationId, productId, sellerId } = req.body;

    if (!conversationId || !productId || !sellerId) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (buyerId === parseInt(sellerId)) {
        return res.status(400).json({ success: false, message: "You cannot send a trade request for your own product." });
    }

    try {
        // Check product is available
        const [products] = await db.promise().query("SELECT id, status, type FROM products WHERE id = ?", [productId]);
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        if (products[0].status !== "available") {
            return res.status(400).json({ success: false, message: "This product is no longer available." });
        }

        // Check no pending request already exists for this product in this conversation
        const [existing] = await db.promise().query(
            "SELECT id FROM trade_requests WHERE conversation_id = ? AND product_id = ? AND status = 'pending'",
            [conversationId, productId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "A pending request already exists for this product." });
        }

        const [result] = await db.promise().query(
            "INSERT INTO trade_requests (conversation_id, product_id, buyer_id, seller_id) VALUES (?, ?, ?, ?)",
            [conversationId, productId, buyerId, sellerId]
        );

        // Fetch the created request with product info
        const [requests] = await db.promise().query(
            `SELECT tr.*, p.title AS product_title, p.type AS product_type, p.price AS product_price,
                    bu.username AS buyer_username, su.username AS seller_username
             FROM trade_requests tr
             JOIN products p ON tr.product_id = p.id
             JOIN users bu ON tr.buyer_id = bu.id
             JOIN users su ON tr.seller_id = su.id
             WHERE tr.id = ?`,
            [result.insertId]
        );

        res.status(201).json({ success: true, data: requests[0] });
    } catch (err) {
        next(err);
    }
};

// Seller responds to a trade request (accept/reject)
exports.respondToTradeRequest = async (req, res, next) => {
    const userId = req.user.id;
    const requestId = req.params.id;
    const { action } = req.body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'." });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Fetch and lock the trade request and the related product
        const [requests] = await connection.query(
            `SELECT tr.*, p.type AS product_type, p.status AS product_status 
             FROM trade_requests tr 
             JOIN products p ON tr.product_id = p.id 
             WHERE tr.id = ? FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Trade request not found." });
        }

        const tradeReq = requests[0];

        if (tradeReq.seller_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: "Only the seller can respond to this request." });
        }

        if (tradeReq.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "This request has already been responded to." });
        }

        const newStatus = action === 'accept' ? 'accepted' : 'rejected';

        // If accepted, update product status and reject other pending requests
        if (action === 'accept') {
            if (tradeReq.product_status !== 'available') {
                await connection.rollback();
                return res.status(400).json({ success: false, message: "This product is no longer available." });
            }

            const productStatus = tradeReq.product_type === 'sell' ? 'sold' : 'lent';
            await connection.query("UPDATE products SET status = ? WHERE id = ?", [productStatus, tradeReq.product_id]);

            // Also reject any other pending requests for this product
            await connection.query(
                "UPDATE trade_requests SET status = 'rejected' WHERE product_id = ? AND id != ? AND status = 'pending'",
                [tradeReq.product_id, requestId]
            );
        }

        // Update target trade request status
        await connection.query("UPDATE trade_requests SET status = ? WHERE id = ?", [newStatus, requestId]);

        // Commit transaction
        await connection.commit();

        // Fetch the updated request to return
        const [updated] = await connection.query(
            `SELECT tr.*, p.title AS product_title, p.type AS product_type, p.price AS product_price,
                    bu.username AS buyer_username, su.username AS seller_username
             FROM trade_requests tr
             JOIN products p ON tr.product_id = p.id
             JOIN users bu ON tr.buyer_id = bu.id
             JOIN users su ON tr.seller_id = su.id
             WHERE tr.id = ?`,
            [requestId]
        );

        res.status(200).json({ success: true, data: updated[0] });
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};

// Buyer cancels a trade request
exports.cancelTradeRequest = async (req, res, next) => {
    const userId = req.user.id;
    const requestId = req.params.id;

    try {
        const [requests] = await db.promise().query(
            "SELECT * FROM trade_requests WHERE id = ?",
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: "Trade request not found." });
        }

        const tradeReq = requests[0];

        if (tradeReq.buyer_id !== userId) {
            return res.status(403).json({ success: false, message: "Only the buyer can cancel this request." });
        }

        if (tradeReq.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Only pending requests can be cancelled." });
        }

        await db.promise().query("UPDATE trade_requests SET status = 'cancelled' WHERE id = ?", [requestId]);

        // Return updated request with joint info
        const [updated] = await db.promise().query(
            `SELECT tr.*, p.title AS product_title, p.type AS product_type, p.price AS product_price,
                    bu.username AS buyer_username, su.username AS seller_username
             FROM trade_requests tr
             JOIN products p ON tr.product_id = p.id
             JOIN users bu ON tr.buyer_id = bu.id
             JOIN users su ON tr.seller_id = su.id
             WHERE tr.id = ?`,
            [requestId]
        );

        res.status(200).json({ success: true, data: updated[0] });
    } catch (err) {
        next(err);
    }
};

// Get trade requests for a conversation
exports.getTradeRequests = async (req, res, next) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        // Verify user is part of conversation
        const [conv] = await db.promise().query(
            "SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
            [conversationId, userId, userId]
        );
        if (conv.length === 0) {
            return res.status(403).json({ success: false, message: "Forbidden." });
        }

        const [requests] = await db.promise().query(
            `SELECT tr.*, p.title AS product_title, p.type AS product_type, p.price AS product_price,
                    bu.username AS buyer_username, su.username AS seller_username
             FROM trade_requests tr
             JOIN products p ON tr.product_id = p.id
             JOIN users bu ON tr.buyer_id = bu.id
             JOIN users su ON tr.seller_id = su.id
             WHERE tr.conversation_id = ?
             ORDER BY tr.created_at ASC`,
            [conversationId]
        );

        res.status(200).json({ success: true, data: requests });
    } catch (err) {
        next(err);
    }
};
