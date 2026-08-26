import urllib.request
import re
try:
    req = urllib.request.Request('https://tudoradio.com/player/radio/77', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    match = re.search(r'(https?://[^\s\"\']+\.mp3|https?://[^\s\"\']+/stream[^\"\']*)', html)
    if match:
        print(match.group(1))
    else:
        print("not found")
except Exception as e:
    print(e)
