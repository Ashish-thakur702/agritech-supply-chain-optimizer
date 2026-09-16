# 🌾 TransOrg AgentIQ Datathon — Track 3
## Presentation Guide & Speaker Talk Track: AgriTech Supply Chain Optimizer

**Deck Location:**
- [`c:/Datathon/AgriTech_Supply_Chain_Optimizer_TransOrg_Datathon.pptx`](file:///c:/Datathon/AgriTech_Supply_Chain_Optimizer_TransOrg_Datathon.pptx)
- [`c:/Users/hp/OneDrive/Desktop/krishiseva/agritech-supply-chain-optimizer/AgriTech_Supply_Chain_Optimizer_TransOrg_Datathon.pptx`](file:///c:/Users/hp/OneDrive/Desktop/krishiseva/agritech-supply-chain-optimizer/AgriTech_Supply_Chain_Optimizer_TransOrg_Datathon.pptx)

---

### Slide Breakdown & Speaker Script

#### **Slide 1: Title & Introduction**
- **Slide Title:** AgriTech Supply Chain Optimizer — Mandi-to-Market Intelligence • Price Discovery • Agentic AI
- **Speaker Track:**
  > *"Respected judges and organizers, welcome to our presentation for TransOrg's AgentIQ Datathon Track 3: Agricultural Supply Chain & Logistics Optimization. Our platform, AgriTech Supply Chain Optimizer, takes real-world chaotic agricultural data across Mandis, Warehouses, Weather sensors, and Prices, cleans and governs it into a unified star schema, and delivers executive dashboards paired with an agentic graph AI."*

#### **Slide 2: Problem Statement & Industry Context**
- **Focus:** The Broken Mandi-to-Market Journey.
- **Key Points:**
  - *Data Fragmentation:* Multilingual names, corrupt units, conflicting timezones.
  - *MSP Crash Crisis:* Extreme price erosion where farmers sell at severe discounts below official Minimum Support Prices.
  - *Logistics Friction:* Route delays exceeding 27%, causing perishable spoilage and truck idling.
  - *Weather Sensitivity:* Unanticipated rain spikes leading to harvest panic rushes and clogged Mandi gates.

#### **Slide 3: Executive Summary & Hero KPIs**
- **Focus:** Core Metrics from the 5.83 Million Qtl Dataset:
  - **5.83M Qtl:** Total crop arrivals analyzed across 50+ Mandis in 18 districts across Punjab, Haryana, and Uttar Pradesh.
  - **41.9%:** Systemic price crash rate where market trades undercut MSP (5,023 distressed transactions).
  - **13.1 Hours:** Average inter-district transit time with a 10.1% overall delay frequency.
  - **+0.566:** Statistically validated correlation between rainfall events and crop arrival rushes.

#### **Slide 4: The 4-Layer Solution Architecture**
- **Direct Alignment with Datathon Guidelines:**
  - **Layer 1 (Core):** Data Rescue Pipeline (Automated regex cleaning, unit conversion, sensor fixes).
  - **Layer 2 (Core):** Governed Analytics & Star Schema (Pre-aggregated JSON marts for sub-50ms queries).
  - **Layer 3 (Core):** Executive BI Dashboard (5 interactive views, real-time Chart.js visuals, responsive dark/light UI).
  - **Layer 4 (Bonus):** AgentIQ Graph-First AI Agent (Natural language to dynamic chart generation).

#### **Slide 5: Layer 1 Deep Dive — Data Rescue Pipeline**
- **Transformation Matrix:**
  - *Crop Names:* "गेहूं", "Kanak", "dhaan", "makka", "sarson" → Standard canonical names.
  - *Units:* Tonnes and KG normalized mathematically to Quintals (1T = 10Qtl, 1Qtl = 100KG).
  - *Prices:* Stripping currency symbols (`₹`, `Rs.`, `INR`) and commas into clean numeric floats.
  - *Sensors:* Converting Fahrenheit to Celsius, inches of rain to mm, and UTC to IST timezones.
  - *Logistics:* Removing negative transit times, converting miles to KM, and standardizing vehicle plates.
  - *Mandi Master:* Regularizing IDs (`M-001` → `MANDI001`) and imputing missing district/state coordinates.

#### **Slide 6: Layer 2 Deep Dive — Governed Data Modeling**
- **Data Model:**
  - Star schema linking `Fact_Mandi_Arrivals`, `Fact_Price_MSP`, `Fact_Transport`, and `Fact_Weather` via `mandi_id`, `district`, and `date`.
  - In-memory pre-computed data mart (`dashboard_data.json`) ensuring instant UI interactions with zero database bottlenecks.

#### **Slide 7: Mandi Arrivals & Spatial Concentration**
- **Embedded Chart:** Top 8 Mandis by Total Volume.
- **Key Findings:** Balanced arrival spread across 6 major staple crops (Wheat: 999.8k Qtl, Mustard: 991.3k Qtl, Sugarcane: 975.8k Qtl, Maize: 967.6k Qtl, Rice: 947.0k Qtl, Cotton: 946.3k Qtl).
- Key regional hubs: Tadipatri Mandi (Hisar), Gurgaon Grain Market (Fatehabad), Hyderabad Mandi (Ludhiana).

#### **Slide 8: Price Discovery — The 41.9% Market Crash Crisis**
- **Embedded Chart:** Crop Arrivals & Modal Price vs Official MSP Comparison.
- **Key Findings:**
  - 41.9% of transactions fell below MSP.
  - Cotton paradox: Despite average price ₹6,734.75 vs MSP ₹6,620 (+₹114), 42.7% of trades crashed below MSP with deficits down to -₹567.70 in Karnal.
  - Razor-thin margins in Wheat and Rice (+₹35 to +₹39) with >42% crash risk.

#### **Slide 9: Logistics Intelligence & Transit Friction**
- **Embedded Chart:** Warehouse Delay Rates & Critical Transit Corridors.
- **Key Findings:**
  - Baseline transit is 13.1 hours; WH-West (10.5%) and WH-Central (10.1%) have highest intake queuing.
  - Worst routes identified: Asansol → WH-South (27.6% delay), Chapra → WH-South (26.9% delay), Nangloi Jat → WH-North (26.7% delay).
  - Recommendation: Real-time dynamic rerouting and staggered intake scheduling.

#### **Slide 10: Weather Sensitivity & Disruption Dynamics**
- **Embedded Chart:** Dual-axis Rainfall vs Arrival Volume (r = +0.566).
- **Key Findings:**
  - Validates pre-rain harvesting surges where farmers rush to deliver produce before rainfall ruins standing crops, followed immediately by severe transport halts.
  - Allows 48-hour proactive warehouse intake staging.

#### **Slide 11: Layer 3 — Executive BI Dashboard Tour**
- **5 Integrated Views:**
  1. Executive Overview
  2. Mandi Arrivals
  3. MSP Price Discovery
  4. Logistics Intelligence
  5. Weather Correlation
- Instant multi-dimensional filtering across State, District, Crop, and Dates.

#### **Slide 12: Layer 4 — AgentIQ Graph-First AI Agent**
- **Embedded Architecture Diagram:** Natural Language Query → Intent Parsing → In-Memory Aggregation → Dynamic Chart Generation.
- **Autonomous Chart Selection:** Trend queries route to Line charts, entity comparisons to Bar charts, share queries to Doughnut charts, and risk queries to Scatter/Radar plots.
- Complete in-memory execution with zero external LLM API dependencies.

#### **Slide 13: Multi-Stakeholder Value Proposition & ROI**
- **Farmers:** Real-time price discovery, eliminating distressed middleman sales (+8-12% realization).
- **Logistics Fleets:** Avoiding bottleneck routes, cutting idle truck hours by 15-20%.
- **Warehouse Operators:** Weather-synchronized intake management preventing gate congestion.
- **APMC Regulators:** Automated monitoring of MSP enforcement and price support interventions.

#### **Slide 14: Engineering Rigor, DataOps & Reproducibility**
- 100% automated reproducibility (`python clean_data.py`).
- Automated test suite (`test_agent.py`) with zero syntax or schema regressions.
- Free-tier / open-source stack (Python, Pandas, JavaScript, Chart.js) with zero cloud dependency.

#### **Slide 15: Strategic Roadmap & Conclusion**
- **Phased Evolution:**
  - Phase 1 (Delivered): 4-Layer platform, Data Rescue, BI Dashboard, AgentIQ NLP.
  - Phase 2: Predictive ML forecasting (LSTM price modeling, XGBoost arrival predictions).
  - Phase 3: Real-time e-NAM and IMD Doppler Radar API integration.
  - Phase 4: Enterprise cloud SaaS and automated dispatch contracts.
- **Closing Statement:** Turning chaotic agricultural data into actionable supply-chain intelligence.
