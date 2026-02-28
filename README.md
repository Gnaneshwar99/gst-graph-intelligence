# ⚡ GST Graph Intelligence Engine
A next-generation Knowledge Graph platform explicitly engineered to detect, analyze, and visualize complex multi-hop GST (Goods and Services Tax) fraud networks. 

Built for auditors, tax juries, and compliance teams, the system replaces traditional flat-table spreadsheets with a **Live Neo4j Graph Database** coupled with an AI-driven, interactive React dashboard.

## 🚀 Key "Gamechanger" Features

### 1. The Neo4j Knowledge Graph Model
India's GST reconciliation is fundamentally a **graph traversal problem**, not a flat-file matching exercise. By migrating ERP events into graph entities, we instantly map the infinite multi-hop supply chain.
- ⭐ **Taxpayers** (Root Nodes)
- ◆ **Vendors** & **GSTR-1 Filings**
- ▲ **Anomalous Invoices** (Risk Nodes)
- 🟢 **Compliant Invoices** (Safe Nodes)

### 2. Live ERP Sync Engine
Data is not parsed through standard CSV ingestors. Instead, we developed a simulated Enterprise ERP Sync Engine that pipes bulk simulated invoice and filing events directly into the Knowledge Graph in real-time, executing continuous deep-traversals to flag non-compliance as data breathes into the model.

### 3. AI Graph Storyteller
To break down complex graph physics for non-technical juries, the platform features a dynamic **AI Storyteller panel**. By clicking any floating node on the canvas, the system instantly generates a human-readable, plain-English narrative explaining exactly what that entity is, its supply-chain role, and precisely why it may be legally non-compliant.

### 4. Advanced Graph Fraud Anomalies
The graph engine actively sweeps the network for 25+ specific fraud rings and compliance breaches, including:
- **FAKE_VENDOR_SHELL:** Detects massive taxable invoices from vendors with zero historical GSTR-1 filings (Shell Companies).
- **DUPLICATE_INVOICE:** Identifies the precise moment an Invoice ID is cloned recursively to claim illegal Input Tax Credit (ITC).
- **MICRO_INVOICE_BURST:** Flags rapid bursts of sub-threshold invoices (< ₹5,000) generated mathematically to evade e-way bill generation triggers.
- **COMPOSITION_CLAIM:** Alerts when legally restricted Composition Scheme suppliers illegally attempt to pass ITC.

### 5. Global AI Audit Tracker
A centralized, highly optimized chronological ledger that captures and summarizes every single macro-anomaly detected across the entire active network.

---

## 🛠️ Technology Stack

- **Backend AI Engine:** Python 3, FastAPI 
- **Graph Database:** Neo4j (Cypher query language)
- **Frontend Dashboard:** React, Vite, TailwindCSS
- **Visualization:** react-force-graph-2d, D3 Physics (Custom Radial/DAG Topology Engine)

---

## ⚙️ Installation & Setup

You will need two terminal tabs to run this locally: one for the Python Graph API, and one for the React Dashboard.

### Prerequisites
- Python 3.9+
- Node.js (v18+)
- Local or Cloud Neo4j instance running on default ports `bolt://localhost:7687`

### 1. Booting the Backend (API & Sync Engine)
Navigate to the backend folder, install dependencies, and run the FastAPI Uvicorn server:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*The server will boot on `http://localhost:8000`.*

### 2. Booting the Frontend (React Dashboard)
In a new terminal window, navigate to the frontend folder, install NPM packages, and boot the Vite server:
```bash
cd frontend
npm install
npm run dev
```
*The stunning glass-morphic dashboard will load dynamically on Localhost.*

---

## 📊 How to Present to the Jury

1. **Dashboard Start:** Open the app and navigate to the **Live Sync Dashboard**.
2. **Ignite the Graph:** Click the "Force Execute Graph Sync" button to blast the ERP data straight into Neo4j. Watch the metrics instantly light up.
3. **The Visual 'Wow' Factor:** Navigate to **Taxpayer Map**. The powerful D3 Physics engine will magnetically pull the data into beautiful Star clusters based on real data flows.
4. **The Storyteller:** Click a red "Danger" triangle node, and let the AI Storyteller panel on the right explain the exact nature of the detected fraud.
5. **The Hard Analytics:** Go to the **Risk Analysis** tab to show the Vendor Compliance Leaderboard—mathematically calculating total risk based on entire subgraph histories.
6. **The Audit:** End by showing the global **Audit Logs** ledger, capturing all network failures chronologically.
