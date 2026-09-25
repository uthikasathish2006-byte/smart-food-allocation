# Smart Food Allocation Optimization System

> **Hackathon Theme:** UN Sustainable Development Goal 2 (SDG 2) – Zero Hunger  
> **Mission:** Minimize food waste and optimize the allocation and distribution of surplus food from donors (restaurants, supermarkets, farms) to food-insecure communities, shelters, and food banks.

---

## 📁 Project Structure

```text
smart-food-allocation/
├── frontend/          # React + Vite client application
├── backend/           # Node.js + Express REST API
├── database/          # PostgreSQL schema and Docker configuration
└── README.md          # Project overview and setup instructions
```

---

## 🛠️ Technology Stack

- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)

---

## ⚙️ Project Configuration & Setup

### 1. Database (PostgreSQL)
Navigate to the `database` folder:
```bash
cd database
```
- **Option A (Docker):** Start a local PostgreSQL instance with schema auto-initialized:
  ```bash
  docker compose up -d
  ```
- **Option B (Local PostgreSQL):** Run `schema.sql` against your existing PostgreSQL instance:
  ```bash
  psql -U postgres -d smart_food_db -f schema.sql
  ```

### 2. Backend (Node.js + Express)
Navigate to the `backend` folder:
```bash
cd backend
```
- Copy the environment variables:
  ```bash
  cp .env.example .env
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Run the development server:
  ```bash
  npm run dev
  ```
  API endpoint: `http://localhost:5000`

### 3. Frontend (React + Vite)
Navigate to the `frontend` folder:
```bash
cd frontend
```
- Copy the environment variables:
  ```bash
  cp .env.example .env
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Run the Vite development server:
  ```bash
  npm run dev
  ```
  Web client: `http://localhost:5173`

---

## 🎯 Target Capabilities (SDG 2 Alignment)
- **Surplus Food Intake:** Real-time logging of perishable and non-perishable surplus food items.
- **Demand Forecasting & Requests:** Hunger relief shelters register need levels, capacity, and urgent requirements.
- **Intelligent Allocation Engine:** Matching surplus with demand based on proximity, urgency, shelf life, and dietary categories.
- **Traceability & Metrics:** Tracking meals saved and CO2 footprint mitigated.
