import urllib.request
import re
import json

try:
    url = "https://api.tenor.com/v1/search?q=the-last-of-us-firefly&key=LIVDSRZULELA&limit=5"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req).read().decode('utf-8')
    data = json.loads(response)
    for result in data['results']:
        print(result['media'][0]['gif']['url'])
except Exception as e:
    print(e)
