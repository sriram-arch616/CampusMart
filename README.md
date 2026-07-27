# 🎓 CampusMarketPlace

A professional, feature-rich marketplace designed for university students to buy, sell, and trade items safely within their campus community.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Build Status](https://img.shields.io/badge/status-active-brightgreen.svg)

---

## 🌟 Key Features

- **🔐 Secure Authentication & Middleware**: JWT-based authentication stored in secure HttpOnly cookies, encrypted password storage using Bcrypt, API request rate limiting (`express-rate-limit`), and HTTP headers security (`helmet`).
- **🛒 Product Management**: Full CRUD operations for listing items, with cloud-hosted image uploads via Multer and Cloudinary.
- **💬 Scalable Real-time Chat**: Integrated messaging system using Socket.io, with a **Redis adapter** for horizontal scaling and multi-instance compatibility.
- **🔍 Advanced Filtering**: Search items by title, category, price range, and type (buy/rent).
- **🛡️ Admin Dashboard**: Administration portal to manage users, listings, and support tickets.
- **📞 Support Ticket System**: Built-in support portal for raising issues and tracking resolutions.
- **🐳 Containerized Deployment**: Ready-to-deploy multi-container environment orchestrated via Docker Compose.
- **📱 Responsive UI**: A premium, modern interface served via Nginx and styled with responsive CSS.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript, Nginx (production server)
- **Database**: MySQL (compatible with TiDB Cloud / local server)
- **Real-time Engine & Caching**: Socket.io, Redis (Pub/Sub Adapter)
- **Image Storage**: Cloudinary (via Multer middleware)
- **Security**: JSON Web Tokens (JWT), Bcrypt, Helmet.js, Express Rate Limit
- **Containerization**: Docker, Docker Compose

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v18+)
- A MySQL database (local or cloud)
- [Cloudinary](https://cloudinary.com/) account for image uploads

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/sriram-arch616/CampusMart.git
cd CampusMart
npm install
```

### 3. Environment Setup
Copy the `.env.example` file to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
Ensure you provide the correct database and Cloudinary details.

### 4. Database Setup
Import the provided `schema.sql` into your MySQL database to create the necessary tables.

### 5. Running the Application
**Development mode (using nodemon):**
```bash
npm run dev
```
**Production mode:**
```bash
npm start
```
The server will start on `http://localhost:5000`.

### 6. Running with Docker 🐳
This project is fully containerized using Docker and Docker Compose, which automatically provisions MySQL, Redis, the Node.js backend, and the Nginx-based frontend.

1. Make sure you have **Docker** and **Docker Compose** installed.
2. Build and start all services in the background or active terminal:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - **Frontend client**: [http://localhost](http://localhost) (mapped to port 80)
   - **Backend API server**: [http://localhost:5000](http://localhost:5000)

---

## 📁 Project Structure

- **`backend/`**: Node.js & Express.js server application.
  - `src/app.js`: Main API entry point.
  - `src/controllers/`: Route controller handlers.
  - `src/services/`: Database interaction logic and services.
  - `src/routes/`: Express router endpoint definitions.
  - `src/config/`: DB connection, Cloudinary, and Socket.io configuration.
  - `schema.sql`: Database initialization schema.
- **`frontend/`**: Static SPA client application (served via Nginx in Docker).
  - HTML pages (`index.html`, `dashboard.html`, `chat.html`, `support.html`, etc.).
  - `js/`: Client-side logic, API fetch functions, and Socket.io client listeners.
  - `css/`: Clean, responsive stylesheets.
- **`docker-compose.yml`**: Multi-container Docker deployment configuration orchestrating the frontend, backend, database, and Redis.

---

## 👨‍💻 Author

**Sri Ram Kumar V**
**A.S. Manoj**
---

## 📜 License
This project is licensed under the ISC License.
