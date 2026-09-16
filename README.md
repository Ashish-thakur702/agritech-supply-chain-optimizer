# 🌾 AgriTech Supply Chain Optimizer

<div align="center">

### Mandi-to-Market Intelligence • Price Discovery • Logistics Optimization

An interactive agricultural intelligence platform built for **TransOrg Datathon — Track 3**, designed to analyze the complete journey from **Mandi → Warehouse → Market**.

[![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Pandas](https://img.shields.io/badge/Pandas-Data%20Analytics-150458?logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Datathon](https://img.shields.io/badge/TransOrg-Datathon-orange)](https://www.transorg.com/)

</div>

---

## 📌 Overview

Agricultural supply chains generate large amounts of data across **Mandis, warehouses, logistics networks, prices, crop arrivals, and weather conditions**.

However, these datasets are often difficult to interpret together.

**AgriTech Supply Chain Optimizer** brings these signals into a single interactive dashboard to help users understand:

- 🌾 Crop arrivals across Mandis
- 💰 Wholesale prices and MSP comparison
- 📈 Price discovery opportunities
- 🚚 Logistics and transit delays
- 🏭 Warehouse performance
- 🌧️ Rainfall and weather impact
- ⚠️ Supply-chain bottlenecks
- 🤖 Natural-language analytics through AgentIQ

The goal is to transform raw agricultural data into **actionable supply-chain intelligence**.

---

# ✨ Key Features

## 📊 1. Executive Overview

A centralized dashboard providing a quick view of the agricultural supply chain.

**Includes:**

- Total crop arrivals
- Average market prices
- MSP comparison
- Logistics performance
- Warehouse delays
- Weather indicators
- State and crop-level filtering

---

## 🌾 2. Mandi Arrival Analytics

Analyze agricultural arrivals across different markets.

Users can explore:

- Crop-wise arrivals
- State-wise arrivals
- District-level patterns
- Mandi performance
- Arrival trends
- Market concentration

This helps identify where agricultural supply is concentrated and where bottlenecks may occur.

---

## 💰 3. MSP & Price Discovery

Compare actual wholesale market prices against the **Minimum Support Price (MSP)**.

The system helps identify:

- MSP gaps
- Price opportunities
- Crop-wise price differences
- Mandi-level price variations
- Markets offering relatively better prices

### Example

```text
Market Price > MSP
        ↓
Potentially favorable market

Market Price < MSP
        ↓
Potential price pressure
```

---

## 🚚 4. Logistics Intelligence

Analyze the movement of agricultural commodities through the supply chain.

The dashboard examines:

- Transit delays
- Warehouse delays
- Mandi-to-market movement
- Logistics bottlenecks
- Warehouse performance
- Delay distribution

This allows users to identify areas where transportation or storage may be affecting market efficiency.

---

## 🌧️ 5. Weather Impact Analysis

Weather conditions can directly affect agricultural supply chains.

The platform analyzes rainfall alongside:

- Crop arrivals
- Prices
- Logistics delays
- Market activity

This provides an additional layer of context for understanding supply-chain disruptions.

---

# 🤖 AgentIQ — Natural Language Analytics

One of the key features of the platform is **AgentIQ**, a natural-language analytics interface.

Instead of manually navigating multiple charts, users can ask analytical questions directly.

### Example queries

```text
Which mandi has the highest average transit delay?
```

```text
Which crop has the largest MSP gap?
```

```text
What are the total wheat arrivals in Punjab?
```

```text
Which warehouse has the longest transit delay?
```

```text
How does rainfall affect crop arrivals?
```

AgentIQ interprets the query, performs the relevant analysis on the dataset, and returns:

- 📌 Analytical summary
- 📊 KPI values
- 📈 Visualization
- 🔎 Relevant data insights

---

# 🏗️ System Architecture

```text
                   RAW AGRICULTURAL DATA
                            │
                            ▼
                  ┌───────────────────┐
                  │   Data Cleaning   │
                  │   clean_data.py   │
                  └─────────┬─────────┘
                            │
                            ▼
                   PROCESSED DATASETS
                            │
                            ▼
                  ┌───────────────────┐
                  │   Python Backend  │
                  │     server.py     │
                  └─────────┬─────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          REST API / Logic       AgentIQ Engine
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Interactive Web App │
                 │ HTML + CSS + JS     │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Charts            Filters          AI Agent
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                            ▼
                   ACTIONABLE INSIGHTS
```

---

# 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Data Processing | Python |
| Data Analysis | Pandas |
| Backend | Python HTTP/API Server |
| Frontend | HTML5, CSS3, JavaScript |
| Visualization | Chart.js |
| Data Storage | CSV |
| Analytics | Pandas / Statistical Aggregation |
| AI Interface | AgentIQ |
| Version Control | Git & GitHub |

---

# 📂 Project Structure

```text
agritech-supply-chain-optimizer/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── src/
│   ├── clean_data.py
│   ├── server.py
│   └── test_agent.py
│
├── screenshots/
│   ├── overview.png
│   ├── mandi-arrivals.png
│   ├── msp-prices.png
│   ├── logistics.png
│   ├── weather.png
│   └── agentiq.png
│
├── requirements.txt
├── .gitignore
├── LICENSE
└── README.md
```

> Adjust the folder names above if your actual project structure is different.

---

# ⚙️ Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/Ashish-thakur702/agritech-supply-chain-optimizer.git
cd agritech-supply-chain-optimizer
```

## 2. Create a virtual environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

## 4. Process the dataset

```bash
python clean_data.py
```

## 5. Start the application

```bash
python server.py
```

## 6. Open the dashboard

```text
http://localhost:8000
```

---

# 🔍 Example Analytical Questions

AgentIQ can be used for questions such as:

| Question | Analysis |
|---|---|
| Which mandi has the highest average transit delay? | Logistics |
| Which crop has the largest MSP gap? | Price Discovery |
| What are the total wheat arrivals in Punjab? | Mandi Arrivals |
| Which warehouse has the longest delay? | Logistics |
| How does rainfall affect crop arrivals? | Weather |
| Which state has the highest arrivals? | Supply Analysis |
| Which crop has the highest average market price? | Price Analysis |


# 🎯 Problem Statement

The agricultural supply chain involves multiple interconnected stages:

```text
Farmer
   ↓
Mandi
   ↓
Warehouse
   ↓
Transportation
   ↓
Market
   ↓
Consumer
```

Delays, price fluctuations, weather conditions and inefficient logistics can affect the overall efficiency of this chain.

This project attempts to provide a **data-driven view of these interconnected factors** through a unified analytical dashboard.

---

# 💡 Key Insights the Platform Enables

The platform can help answer questions around:

### Supply

Where are crop arrivals increasing or decreasing?

### Price

Where are market prices significantly different from MSP?

### Logistics

Which Mandis, warehouses or routes experience the largest delays?

### Weather

Are rainfall events associated with changes in arrivals or logistics?

### Decision Making

Which part of the supply chain requires attention?

---

# 🚀 Future Roadmap

The current platform can be extended into a production-grade agricultural intelligence system.

### Phase 1 — Analytics

- [x] Mandi arrival analysis
- [x] MSP comparison
- [x] Logistics analysis
- [x] Weather analysis
- [x] Interactive dashboard
- [x] Natural-language analytics

### Phase 2 — Intelligence

- [ ] ML-based crop price forecasting
- [ ] Demand forecasting
- [ ] Arrival forecasting
- [ ] Anomaly detection
- [ ] Logistics risk prediction

### Phase 3 — Real-Time Platform

- [ ] Live Mandi price APIs
- [ ] Live weather APIs
- [ ] Real-time alerts
- [ ] Route optimization
- [ ] Automated supply-chain recommendations

### Phase 4 — Production

- [ ] Cloud deployment
- [ ] Authentication
- [ ] Role-based dashboards
- [ ] Database integration
- [ ] Scalable API architecture

---

# 👥 Team

This is a **group project** developed for the TransOrg Datathon.

| Team Member | Contribution |
|---|---|
| **Ashish Thakur** | Dashboard, Backend & Integration |
| **Nikhil Prajapati** | Data Processing & Analysis |
| **Chinu yadav** | Frontend & Visualization |
| **Sujal Mankotia** | AgentIQ & Testing |

> Update the names and contributions according to your actual team.

---

# 🏆 Competition

**TransOrg Datathon — Track 3**

### Track

**Mandi-to-Market Agricultural Supply Chain, Price Discovery & Logistics Optimization**

---

# 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

### 🌾 Turning Agricultural Data into Supply-Chain Intelligence

**Built with Python • Pandas • JavaScript • Chart.js • Data Analytics**

</div>