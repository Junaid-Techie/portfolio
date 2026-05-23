import urllib.request
import re

url = 'https://commons.wikimedia.org/wiki/File:The_Last_of_Us_Fireflies_Logo.svg'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
match = re.search(r'href="(https://upload.wikimedia.org/wikipedia/commons/[^"]+\.svg)"', html)
if match:
    svg_url = match.group(1)
    print("Found URL:", svg_url)
    svg_req = urllib.request.Request(svg_url, headers={'User-Agent': 'Mozilla/5.0'})
    svg_content = urllib.request.urlopen(svg_req).read().decode('utf-8')
    with open('firefly.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("Downloaded successfully.")
else:
    print("URL not found in HTML.")
