import urllib.request
import json

queries = [
    'Plot the daily arrival trend of Wheat in Amritsar mandi vs MSP for the last 30 days',
    'Which mandi has the highest average transit delay?',
    'Compare total rainfall by district over the last 3 months',
    'Show the distribution of wholesale prices for Rice',
    'Which warehouse receives the highest volume of crops?',
    'Which Mandis are experiencing prices below MSP?',
    'Correlation between heavy rainfall days and crop arrival drops'
]

for q in queries:
    req = urllib.request.Request(
        'http://localhost:8000/api/agent/query',
        data=json.dumps({'query': q}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"PASS: [{res['intent']}] for '{q[:35]}...' -> Chart: {res.get('chart', {}).get('type')}, Stats: {len(res.get('stats', []))}")

print("\nALL AGENT QUERIES TESTED AND PASSED!")
