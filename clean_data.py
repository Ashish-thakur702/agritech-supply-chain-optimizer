import os
import re
import json
import numpy as np
import pandas as pd

os.makedirs('data/processed', exist_ok=True)

print("Starting Fast Optimized AgriTech Track 3 Cleaning Pipeline...", flush=True)

# 1. CANONICAL LOOKUPS
CROP_MAP = {
    'wheat': 'Wheat', 'gehun': 'Wheat', 'kanak': 'Wheat', 'गेहूं': 'Wheat',
    'rice': 'Rice', 'paddy': 'Rice', 'chawal': 'Rice', 'dhaan': 'Rice', 'basmati': 'Rice', 'धान': 'Rice', 'चावल': 'Rice',
    'cotton': 'Cotton', 'kapas': 'Cotton', 'narma': 'Cotton', 'कपास': 'Cotton',
    'mustard': 'Mustard', 'sarso': 'Mustard', 'sarson': 'Mustard', 'सरसों': 'Mustard',
    'maize': 'Maize', 'corn': 'Maize', 'makka': 'Maize', 'makki': 'Maize', 'मक्का': 'Maize',
    'sugarcane': 'Sugarcane', 'ganna': 'Sugarcane', 'ganne': 'Sugarcane', 'गन्ना': 'Sugarcane'
}

CANONICAL_MSP = {
    'Wheat': 2275.0,
    'Rice': 2183.0,
    'Cotton': 6620.0,
    'Mustard': 5650.0,
    'Maize': 2090.0,
    'Sugarcane': 3500.0
}

DISTRICT_STATE_MAP = {
    'Ludhiana': 'Punjab', 'Amritsar': 'Punjab', 'Patiala': 'Punjab',
    'Bathinda': 'Punjab', 'Moga': 'Punjab', 'Jalandhar': 'Punjab', 'Ferozepur': 'Punjab',
    'Ambala': 'Haryana', 'Kurukshetra': 'Haryana', 'Fatehabad': 'Haryana',
    'Hisar': 'Haryana', 'Sirsa': 'Haryana', 'Karnal': 'Haryana',
    'Bareilly': 'Uttar Pradesh', 'Muzaffarnagar': 'Uttar Pradesh',
    'Saharanpur': 'Uttar Pradesh', 'Agra': 'Uttar Pradesh', 'Meerut': 'Uttar Pradesh'
}

DISTRICT_COORDS = {
    'Ludhiana': {'lat': 30.9010, 'lng': 75.8573},
    'Amritsar': {'lat': 31.6340, 'lng': 74.8723},
    'Patiala': {'lat': 30.3398, 'lng': 76.3869},
    'Bathinda': {'lat': 30.2110, 'lng': 74.9455},
    'Moga': {'lat': 30.8165, 'lng': 75.1717},
    'Jalandhar': {'lat': 31.3260, 'lng': 75.5762},
    'Ferozepur': {'lat': 30.9237, 'lng': 74.6122},
    'Ambala': {'lat': 30.3782, 'lng': 76.7767},
    'Kurukshetra': {'lat': 29.9695, 'lng': 76.8783},
    'Fatehabad': {'lat': 29.5140, 'lng': 75.4540},
    'Hisar': {'lat': 29.1492, 'lng': 75.7217},
    'Sirsa': {'lat': 29.5349, 'lng': 75.0298},
    'Karnal': {'lat': 29.6857, 'lng': 76.9905},
    'Bareilly': {'lat': 28.3670, 'lng': 79.4304},
    'Muzaffarnagar': {'lat': 29.4727, 'lng': 77.7085},
    'Saharanpur': {'lat': 29.9640, 'lng': 77.5460},
    'Agra': {'lat': 27.1767, 'lng': 78.0081},
    'Meerut': {'lat': 28.9845, 'lng': 77.7064}
}

def norm_mandi(series):
    nums = series.astype(str).str.extract(r'(\d+)', expand=False)
    return nums.fillna('1').astype(int).apply(lambda n: f"MANDI{n:03d}")

def norm_crop(series):
    lowered = series.astype(str).str.strip().str.lower()
    return lowered.map(CROP_MAP).fillna('Wheat')

# ==============================================================================
# 2. MANDI MASTER
# ==============================================================================
print("[1/5] Processing Mandi Master...", flush=True)
df_m = pd.read_csv('data/raw/track3_mandi_master.csv')
df_m['mandi_id'] = norm_mandi(df_m['mandi_id'])
df_m = df_m.drop_duplicates(subset=['mandi_id']).copy()

df_m['district'] = df_m['district'].str.strip().str.title()
df_m['state'] = df_m['state'].str.strip()
df_m['mandi_type'] = df_m['mandi_type'].str.strip().str.upper().fillna('APMC')

# Impute missing state and district
for idx, row in df_m.iterrows():
    if pd.isna(row['state']) and not pd.isna(row['district']):
        df_m.at[idx, 'state'] = DISTRICT_STATE_MAP.get(row['district'], 'Punjab')

df_m.loc[df_m['mandi_id'] == 'MANDI046', ['district', 'state']] = ['Muzaffarnagar', 'Uttar Pradesh']
df_m.loc[df_m['mandi_id'] == 'MANDI032', ['district', 'state']] = ['Ambala', 'Haryana']
df_m.loc[df_m['mandi_id'] == 'MANDI017', ['district', 'state']] = ['Patiala', 'Punjab']
df_m.loc[df_m['mandi_id'] == 'MANDI039', ['district', 'state']] = ['Kurukshetra', 'Haryana']

df_m['total_area_acres'] = df_m['total_area_acres'].fillna(df_m['total_area_acres'].median())
df_m['lat'] = df_m['district'].map(lambda d: DISTRICT_COORDS.get(d, {}).get('lat', 30.0))
df_m['lng'] = df_m['district'].map(lambda d: DISTRICT_COORDS.get(d, {}).get('lng', 76.0))
print(f"Master clean: {len(df_m)} mandis across {df_m['district'].nunique()} districts.", flush=True)

# ==============================================================================
# 3. MANDI ARRIVALS
# ==============================================================================
print("[2/5] Processing Mandi Arrivals...", flush=True)
df_a = pd.read_csv('data/raw/track3_mandi_arrivals.csv')
df_a['mandi_id'] = norm_mandi(df_a['mandi_id'])
df_a['crop_name'] = norm_crop(df_a['crop_name'])

# Parse quantities & units vectorized
qty_num = df_a['arrival_quantity'].astype(str).str.extract(r'([-+]?\d*\.?\d+)', expand=False).astype(float).abs().fillna(100.0)
unit_comb = (df_a['unit'].astype(str) + ' ' + df_a['arrival_quantity'].astype(str)).str.upper()

is_tonne = unit_comb.str.contains('TONNE|MT|\\bT\\b', regex=True)
is_kg = unit_comb.str.contains('KG|KILO|KGS', regex=True)
df_a['arrival_qtl'] = np.where(is_tonne, qty_num * 10.0, np.where(is_kg, qty_num / 100.0, qty_num)).round(2)

# Fast vectorized date parsing
df_a['date_dt'] = pd.to_datetime(df_a['date'], format='mixed', errors='coerce')
df_a = df_a.dropna(subset=['date_dt']).sort_values('date_dt').copy()
df_a['date_str'] = df_a['date_dt'].dt.strftime('%Y-%m-%d')
df_a['farmer_count'] = pd.to_numeric(df_a['farmer_count'], errors='coerce').abs().fillna(50).astype(int)

df_a = df_a.merge(df_m[['mandi_id', 'mandi_name', 'district', 'state']], on='mandi_id', how='left')
print(f"Arrivals clean: {len(df_a)} rows. Total arrivals: {df_a['arrival_qtl'].sum():,.1f} Qtl.", flush=True)

# ==============================================================================
# 4. PRICE AND MSP
# ==============================================================================
print("[3/5] Processing Wholesale Prices & MSP...", flush=True)
with open('data/raw/track3_price_and_msp.json', encoding='utf-8') as f:
    df_p = pd.DataFrame(json.load(f))

df_p['mandi_id'] = norm_mandi(df_p['mandi_id'])
df_p['crop_name'] = norm_crop(df_p['crop_name'])
df_p['date_dt'] = pd.to_datetime(df_p['date'], format='mixed', errors='coerce')
df_p = df_p.dropna(subset=['date_dt']).sort_values('date_dt').copy()
df_p['date_str'] = df_p['date_dt'].dt.strftime('%Y-%m-%d')

def clean_price_series(s):
    clean_str = s.astype(str).str.replace(r'₹', '', regex=False)
    clean_str = clean_str.str.replace(r'Rs\.?', '', case=False, regex=True)
    clean_str = clean_str.str.replace(r'INR', '', case=False, regex=True)
    clean_str = clean_str.str.replace(r'/-', '', regex=False)
    clean_str = clean_str.str.replace(',', '', regex=False).str.strip()
    return pd.to_numeric(clean_str, errors='coerce').round(2)

for col in ['min_price', 'max_price', 'modal_price', 'msp']:
    df_p[col] = clean_price_series(df_p[col])

# Fill missing modal_price with median of available prices, or canonical MSP
crop_msp_series = df_p['crop_name'].map(CANONICAL_MSP)
df_p['msp'] = df_p['msp'].fillna(crop_msp_series)
df_p['modal_price'] = df_p['modal_price'].fillna(df_p['min_price']).fillna(df_p['max_price']).fillna(df_p['msp'])
df_p['min_price'] = df_p['min_price'].fillna(df_p['modal_price'] * 0.95)
df_p['max_price'] = df_p['max_price'].fillna(df_p['modal_price'] * 1.05)

df_p['is_price_crash'] = df_p['modal_price'] < df_p['msp']
df_p['price_gap_vs_msp'] = (df_p['modal_price'] - df_p['msp']).round(2)
df_p['price_ratio'] = (df_p['modal_price'] / df_p['msp']).round(3)

for col in ['district', 'state', 'mandi_name']:
    if col in df_p.columns:
        df_p = df_p.drop(columns=[col])

df_p = df_p.merge(df_m[['mandi_id', 'mandi_name', 'district', 'state']], on='mandi_id', how='left')
print(f"Prices clean: {len(df_p)} rows. Price crash count: {df_p['is_price_crash'].sum()} ({df_p['is_price_crash'].mean()*100:.1f}%).", flush=True)

# ==============================================================================
# 5. TRANSPORT LOGISTICS
# ==============================================================================
print("[4/5] Processing Transport Logistics...", flush=True)
df_t = pd.read_csv('data/raw/track3_transport_logistics.csv')
df_t['mandi_id'] = norm_mandi(df_t['mandi_id'])

# Vehicle clean
def fast_veh_clean(s):
    s = s.astype(str).str.upper().str.replace(r'[^A-Z0-9]', ' ', regex=True).str.strip()
    return s.str.replace(r'\s+', ' ', regex=True)

df_t['vehicle_no'] = fast_veh_clean(df_t['vehicle_no'])

# Distance in KM
raw_dist = pd.to_numeric(df_t['distance'].astype(str).str.replace(',', ''), errors='coerce').fillna(250.0)
unit_d = df_t['distance_unit'].astype(str).str.lower()
df_t['distance_km'] = np.where(unit_d.str.contains('mile', na=False), raw_dist * 1.60934, raw_dist).round(1)

# Timestamps & transit hours
df_t['dep_dt'] = pd.to_datetime(df_t['departure_time'], format='mixed', errors='coerce')
df_t['arr_dt'] = pd.to_datetime(df_t['arrival_time'], format='mixed', errors='coerce')

th_raw = pd.to_numeric(df_t['transit_hours'].astype(str).str.replace(',', ''), errors='coerce').abs()
ts_diff = ((df_t['arr_dt'] - df_t['dep_dt']).dt.total_seconds() / 3600.0).round(1)

df_t['transit_hours'] = np.where(
    th_raw.notna() & (th_raw > 0),
    th_raw,
    np.where(
        ts_diff.notna() & (ts_diff >= 0.5) & (ts_diff <= 120),
        ts_diff,
        ((df_t['distance_km'] / 42.0) + 1.5).round(1)
    )
).round(1)

df_t['expected_transit_hours'] = ((df_t['distance_km'] / 45.0) + 1.0).round(1)
df_t['delay_hours'] = (df_t['transit_hours'] - df_t['expected_transit_hours']).clip(lower=0.0).round(1)
df_t['is_delayed'] = df_t['delay_hours'] > 1.0

df_t = df_t.merge(df_m[['mandi_id', 'mandi_name', 'district', 'state']], on='mandi_id', how='left')
print(f"Transport clean: {len(df_t)} trips. Delayed trips: {df_t['is_delayed'].sum()} ({df_t['is_delayed'].mean()*100:.1f}%).", flush=True)

# ==============================================================================
# 6. WEATHER SENSORS
# ==============================================================================
print("[5/5] Processing Weather Sensors...", flush=True)
df_w = pd.read_excel('data/raw/track3_weather_sensors.xlsx')

is_utc = df_w['timestamp'].astype(str).str.contains('UTC', na=False)
ts_str = df_w['timestamp'].astype(str).str.replace('UTC', '', regex=False).str.replace('IST', '', regex=False).str.strip()
dt_series = pd.to_datetime(ts_str, format='mixed', errors='coerce')
df_w['timestamp_ist'] = np.where(is_utc, dt_series + pd.Timedelta(hours=5, minutes=30), dt_series)
df_w['date_str'] = pd.to_datetime(df_w['timestamp_ist']).dt.strftime('%Y-%m-%d')

# Temperature Celsius
t_raw = pd.to_numeric(df_w['temperature'], errors='coerce').fillna(32.0)
is_f = df_w['temp_unit'].astype(str).str.lower().str.contains('f', na=False)
df_w['temperature_c'] = np.where(is_f, (t_raw - 32.0) * 5.0 / 9.0, t_raw).round(1)

# Rainfall mm
r_raw = pd.to_numeric(df_w['rainfall'], errors='coerce').fillna(0.0)
is_in = df_w['rain_unit'].astype(str).str.lower().str.contains('in', na=False)
df_w['rainfall_mm'] = np.where(is_in, r_raw * 25.4, r_raw).round(1)
df_w['humidity_percent'] = pd.to_numeric(df_w['humidity_percent'], errors='coerce').fillna(60.0).clip(10, 100).round(1)

# Map SEN001 -> MANDI001
s_nums = df_w['sensor_id'].astype(str).str.extract(r'(\d+)', expand=False).fillna('1').astype(int)
df_w['mandi_id'] = s_nums.apply(lambda n: f"MANDI{n:03d}")
df_w = df_w.merge(df_m[['mandi_id', 'mandi_name', 'district', 'state']], on='mandi_id', how='left')
print(f"Weather clean: {len(df_w)} readings. Avg Temp: {df_w['temperature_c'].mean():.1f}°C, Total Rain: {df_w['rainfall_mm'].sum():,.1f} mm.", flush=True)

# ==============================================================================
# 7. EXPORT DATASETS & METRICS
# ==============================================================================
print("Saving clean CSVs to data/processed/...", flush=True)
df_m.to_csv('data/processed/clean_mandi_master.csv', index=False)
df_a.to_csv('data/processed/clean_mandi_arrivals.csv', index=False)
df_p.to_csv('data/processed/clean_price_and_msp.csv', index=False)
df_t.to_csv('data/processed/clean_transport_logistics.csv', index=False)
df_w.to_csv('data/processed/clean_weather_sensors.csv', index=False)

print("Aggregating dashboard metrics...", flush=True)
total_arrivals = float(df_a['arrival_qtl'].sum())
avg_modal_price = float(df_p['modal_price'].mean())
avg_msp = float(df_p['msp'].mean())
price_crash_count = int(df_p['is_price_crash'].sum())
price_crash_rate = float(df_p['is_price_crash'].mean() * 100)
avg_transit_hours = float(df_t['transit_hours'].mean())
transit_delay_rate = float(df_t['is_delayed'].mean() * 100)
avg_temp = float(df_w['temperature_c'].mean())
total_rainfall = float(df_w['rainfall_mm'].sum())

# Crops summary
crop_summary = []
for crop in ['Wheat', 'Rice', 'Cotton', 'Mustard', 'Maize', 'Sugarcane']:
    a_sub = df_a[df_a['crop_name'] == crop]
    p_sub = df_p[df_p['crop_name'] == crop]
    c_arr = float(a_sub['arrival_qtl'].sum())
    c_modal = float(p_sub['modal_price'].mean()) if len(p_sub) > 0 else 0.0
    c_msp = float(CANONICAL_MSP.get(crop, 0.0))
    c_crashes = int(p_sub['is_price_crash'].sum()) if len(p_sub) > 0 else 0
    crop_summary.append({
        'crop': crop,
        'arrival_qtl': round(c_arr, 1),
        'arrival_share': round((c_arr / total_arrivals) * 100, 1),
        'modal_price': round(c_modal, 2),
        'msp': c_msp,
        'price_diff': round(c_modal - c_msp, 2),
        'crashes': c_crashes,
        'crash_rate': round((c_crashes / len(p_sub) * 100) if len(p_sub) > 0 else 0.0, 1)
    })

# Top 10 mandis
top_mandis = df_a.groupby(['mandi_id', 'mandi_name', 'district', 'state'])['arrival_qtl'].sum().reset_index()
top_mandis = top_mandis.sort_values('arrival_qtl', ascending=False).head(10)
top_mandis_list = [
    {
        'mandi_id': r['mandi_id'],
        'mandi_name': r['mandi_name'],
        'district': r['district'],
        'state': r['state'],
        'arrival_qtl': round(float(r['arrival_qtl']), 1)
    }
    for _, r in top_mandis.iterrows()
]

# Daily trend (top 6 crops)
daily_arrivals = df_a.groupby(['date_str', 'crop_name'])['arrival_qtl'].sum().unstack(fill_value=0).reset_index()
daily_arrivals = daily_arrivals.sort_values('date_str')
daily_trend_records = daily_arrivals.to_dict(orient='records')

# Price crash distressed mandis
crash_mandis = df_p[df_p['is_price_crash']].groupby(['mandi_id', 'mandi_name', 'district', 'crop_name']).agg(
    crash_count=('is_price_crash', 'count'),
    avg_modal=('modal_price', 'mean'),
    msp=('msp', 'first'),
    avg_deficit=('price_gap_vs_msp', 'mean')
).reset_index().sort_values('avg_deficit', ascending=True).head(15)
crash_mandis_list = [
    {
        'mandi_id': r['mandi_id'],
        'mandi_name': r['mandi_name'],
        'district': r['district'],
        'crop': r['crop_name'],
        'crash_count': int(r['crash_count']),
        'avg_modal': round(float(r['avg_modal']), 1),
        'msp': round(float(r['msp']), 1),
        'avg_deficit': round(float(r['avg_deficit']), 1)
    }
    for _, r in crash_mandis.iterrows()
]

# Warehouse logistics
wh_perf = df_t.groupby('destination_warehouse').agg(
    total_trips=('trip_id', 'count'),
    avg_transit=('transit_hours', 'mean'),
    delayed_trips=('is_delayed', 'sum'),
    avg_distance=('distance_km', 'mean')
).reset_index()
wh_perf['delay_rate'] = (wh_perf['delayed_trips'] / wh_perf['total_trips'] * 100).round(1)
wh_perf = wh_perf.sort_values('avg_transit', ascending=False)
wh_perf_list = [
    {
        'warehouse': r['destination_warehouse'],
        'total_trips': int(r['total_trips']),
        'avg_transit_hours': round(float(r['avg_transit']), 1),
        'delay_rate': float(r['delay_rate']),
        'avg_distance_km': round(float(r['avg_distance']), 1)
    }
    for _, r in wh_perf.iterrows()
]

# Route delays
route_delays = df_t.groupby(['mandi_id', 'mandi_name', 'destination_warehouse']).agg(
    total_trips=('trip_id', 'count'),
    delayed_trips=('is_delayed', 'sum'),
    avg_delay=('delay_hours', 'mean'),
    avg_transit=('transit_hours', 'mean')
).reset_index()
route_delays = route_delays[route_delays['total_trips'] >= 5].copy()
route_delays['delay_rate'] = (route_delays['delayed_trips'] / route_delays['total_trips'] * 100).round(1)
route_delays = route_delays.sort_values('delay_rate', ascending=False).head(10)
route_delays_list = [
    {
        'mandi': f"{r['mandi_name']} ({r['mandi_id']})",
        'warehouse': r['destination_warehouse'],
        'total_trips': int(r['total_trips']),
        'delay_rate': float(r['delay_rate']),
        'avg_delay_hours': round(float(r['avg_delay']), 1),
        'avg_transit_hours': round(float(r['avg_transit']), 1)
    }
    for _, r in route_delays.iterrows()
]

# Weather vs arrival correlation
w_daily = df_w.dropna(subset=['date_str']).groupby('date_str').agg(
    avg_temp=('temperature_c', 'mean'),
    total_rain=('rainfall_mm', 'sum')
).reset_index()
a_daily = df_a.groupby('date_str')['arrival_qtl'].sum().reset_index()
merged_wa = pd.merge(w_daily, a_daily, on='date_str', how='inner').sort_values('date_str')
corr_val = float(merged_wa['total_rain'].corr(merged_wa['arrival_qtl'])) if len(merged_wa) > 0 else 0.0

weather_arrival_list = [
    {
        'date': r['date_str'],
        'rainfall_mm': round(float(r['total_rain']), 1),
        'arrival_qtl': round(float(r['arrival_qtl']), 1),
        'avg_temp': round(float(r['avg_temp']), 1)
    }
    for _, r in merged_wa.iterrows()
]

dashboard_data = {
    'kpis': {
        'total_arrivals_qtl': round(total_arrivals, 1),
        'avg_modal_price': round(avg_modal_price, 2),
        'avg_msp': round(avg_msp, 2),
        'price_crash_count': price_crash_count,
        'price_crash_rate': round(price_crash_rate, 1),
        'avg_transit_hours': round(avg_transit_hours, 1),
        'transit_delay_rate': round(transit_delay_rate, 1),
        'avg_temp_c': round(avg_temp, 1),
        'total_rainfall_mm': round(total_rainfall, 1),
        'rain_arrival_corr': round(corr_val, 3)
    },
    'crops': crop_summary,
    'top_mandis': top_mandis_list,
    'daily_trend': daily_trend_records,
    'crash_mandis': crash_mandis_list,
    'warehouses': wh_perf_list,
    'route_delays': route_delays_list,
    'weather_arrivals': weather_arrival_list,
    'mandis': df_m[['mandi_id', 'mandi_name', 'district', 'state', 'lat', 'lng']].to_dict(orient='records'),
    'districts': sorted(list(df_m['district'].dropna().unique())),
    'states': sorted(list(df_m['state'].dropna().unique()))
}

with open('data/processed/dashboard_data.json', 'w', encoding='utf-8') as f:
    json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

print(f"PIPELINE COMPLETED SUCCESSFULLY! Total arrivals: {total_arrivals:,.1f} Qtl, Rain-Arrival correlation: {corr_val:.3f}", flush=True)
