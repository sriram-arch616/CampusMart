-- CampusMarketPlace Database Schema
-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    username        VARCHAR(50)   NOT NULL UNIQUE,
    email           VARCHAR(100)  NOT NULL UNIQUE,
    password        VARCHAR(255)  NOT NULL,
    mobile_number   VARCHAR(20)   DEFAULT NULL,
    student_type    VARCHAR(50)   DEFAULT NULL,
    hostel          VARCHAR(100)  DEFAULT NULL,
    year_of_study   VARCHAR(20)   DEFAULT NULL,
    course          VARCHAR(100)  DEFAULT NULL,
    profile_pic     TEXT          DEFAULT NULL,
    role            VARCHAR(20)   DEFAULT 'user',
    is_verified     BOOLEAN       DEFAULT FALSE,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table: products
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT          DEFAULT NULL,
    price           DECIMAL(10,2) NOT NULL,
    category        VARCHAR(100)  DEFAULT NULL,
    type            VARCHAR(50)   DEFAULT NULL,
    image_url       TEXT          DEFAULT NULL,
    status          VARCHAR(20)   DEFAULT 'available',
    seller_id       INT           NOT NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: conversations
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user1_id        INT           NOT NULL,
    user2_id        INT           NOT NULL,
    product_id      INT           DEFAULT NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id)   REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (user2_id)   REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Table: messages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id     INT           NOT NULL,
    sender_id           INT           NOT NULL,
    content             TEXT          NOT NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE
);
-- --------------------------------------------------------
-- Table: support_messages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT           NOT NULL,
    message         TEXT          NOT NULL,
    status          VARCHAR(50)   DEFAULT 'pending',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: password_resets
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(100)  NOT NULL,
    otp             VARCHAR(10)   NOT NULL,
    expires_at      TIMESTAMP     NOT NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: email_verifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(100)  NOT NULL,
    otp             VARCHAR(10)   NOT NULL,
    expires_at      TIMESTAMP     NOT NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: trade_requests
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT           NOT NULL,
    product_id      INT           NOT NULL,
    buyer_id        INT           NOT NULL,
    seller_id       INT           NOT NULL,
    status          VARCHAR(20)   DEFAULT 'pending',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)      REFERENCES products(id)      ON DELETE CASCADE,
    FOREIGN KEY (buyer_id)        REFERENCES users(id)          ON DELETE CASCADE,
    FOREIGN KEY (seller_id)       REFERENCES users(id)          ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT           NOT NULL,
    message         TEXT          NOT NULL,
    type            VARCHAR(50)   DEFAULT 'info',
    link            VARCHAR(255)  DEFAULT NULL,
    is_read         BOOLEAN       DEFAULT FALSE,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
