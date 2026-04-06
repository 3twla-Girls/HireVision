import urllib.request
import json
import urllib.parse
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/job/69d3b915d973e7de30cb5e4f/trigger-pipeline?force=true', method='POST', headers={'Content-Type': 'application/json'}, data=b'{"sync": true}')
try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    print(json.dumps(data, indent=2))
except Exception as e:
    print(e)
