#!/usr/bin/env python3
"""API動作テスト"""

import requests
import json

# 動作確認済みのコードと同じヘッダー
headers = {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'user-agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36',
    'countrycode': '304',
    'authorization': 'Bearer',
    'langcode': '1',
    'content-type': 'application/json'
}

# シーズン一覧取得を試す
url = 'https://api.battle.pokemon-home.com/cbd/competition/rankmatch/list'

# 両方のsoftパラメータを試す
for soft in ['Sw', 'SV']:
    print(f"\nTrying with soft={soft}")
    data = {
        'soft': soft,
        'lng': 'ja'
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success! Keys: {result.keys()}")
            if 'list' in result:
                print(f"Number of seasons: {len(result['list'])}")
                # 最初のシーズンを表示
                first_key = list(result['list'].keys())[0]
                print(f"First season: {result['list'][first_key]}")
        else:
            print(f"Error: {response.text[:200]}")
    except Exception as e:
        print(f"Exception: {e}")