import requests
import json

headers = {
    'Accept-Encoding': 'gzip',
    'User-Agent': 'Mozilla/5.0'
}

# シーズン一覧を取得
season_url = 'https://resource.pokemon-home.com/battledata/ranking/scvi/list'
response = requests.get(season_url, headers=headers)
data = response.json()

print("=== Season List Response ===")
print(json.dumps(data, indent=2, ensure_ascii=False)[:1000])

# 最初のシーズンのランキングを取得
if data and 'list' in data:
    for key, value in data['list'].items():
        if value and '1' in value:
            cid = value['1']['cid']
            rst = value['1'].get('rst', 0) 
            ts = value['1'].get('ts2', 0)
            
            ranking_url = f"https://resource.pokemon-home.com/battledata/ranking/scvi/{cid}/{rst}/{ts}/pokemon"
            response = requests.get(ranking_url, headers=headers)
            ranking_data = response.json()
            
            print("\n=== Pokemon Ranking Response (first few fields) ===")
            # レスポンスの最初の部分だけ表示
            if isinstance(ranking_data, list) and len(ranking_data) > 0:
                print(json.dumps(ranking_data[0], indent=2, ensure_ascii=False))
            else:
                print(json.dumps(ranking_data, indent=2, ensure_ascii=False)[:500])
            break
