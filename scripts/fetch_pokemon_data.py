#!/usr/bin/env python3
"""
Pokemon HOME データ取得スクリプト
月次実行用（GitHub Actions）
"""

import json
import requests
from datetime import datetime
import os

class PokemonHomeAPI:
    def __init__(self):
        self.headers = {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'user-agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36'
        }

    def get_season_list(self):
        """シーズン一覧を取得"""
        # SV用のエンドポイント（ttが追加されている）
        url = 'https://api.battle.pokemon-home.com/tt/cbd/competition/rankmatch/list'
        data = {
            'soft': 'Sc',  # Sc = Scarlet/Violet
            'lng': 'ja'
        }

        try:
            response = requests.post(url, headers=self.headers, data=json.dumps(data))
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching season list: {e}")
            return None

    def get_pokemon_ranking(self, cid, rst, ts):
        """ポケモン使用率ランキングを取得

        Args:
            cid: Competition ID
            rst: ランキングタイプ
            ts: タイムスタンプ
        """
        # SV用のURLパターン（scviが含まれる）
        ranking_url = f"https://resource.pokemon-home.com/battledata/ranking/scvi/{cid}/{rst}/{ts}/pokemon"
        try:
            response = requests.get(ranking_url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching pokemon ranking: {e}")
            return None

    def get_pokemon_detail(self, cid, pokemon_id, rst, ts):
        """ポケモンの詳細データを取得（技、持ち物、性格、特性）"""
        # SV用のURLパターン
        detail_url = f"https://resource.pokemon-home.com/battledata/ranking/scvi/{cid}/{rst}/{ts}/pdetail-{pokemon_id}"

        try:
            response = requests.get(detail_url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching pokemon detail {pokemon_id}: {e}")
            return None

    def fetch_current_season_data(self):
        """最新シーズンのデータを取得"""
        # シーズン一覧取得
        seasons = self.get_season_list()
        if not seasons or 'list' not in seasons:
            print("Failed to get season list")
            return None

        # レスポンス構造を確認
        print(f"Season response: {json.dumps(seasons, indent=2, ensure_ascii=False)[:500]}")

        # シーズン情報を取得
        season_list = seasons.get('list', {})
        if not season_list:
            print("No seasons found")
            return None

        # 最新シーズンを取得（最初のものが最新）
        first_season_key = list(season_list.keys())[0]
        season_data = season_list[first_season_key]

        # シングルとダブルの情報を分離
        single_data = None
        double_data = None

        for inner_key, data in season_data.items():
            if data.get('rule') == 0:  # シングル
                single_data = {**data, 'cid': inner_key}
            elif data.get('rule') == 1:  # ダブル
                double_data = {**data, 'cid': inner_key}

        if not single_data and not double_data:
            print("No valid battle data found")
            return None

        # 最初のデータから基本情報を取得
        base_data = single_data if single_data else double_data
        season_name = base_data.get('name', 'Unknown Season')

        print(f"Fetching data for season: {season_name}")

        result = {
            'season_name': season_name,
            'updated_at': datetime.now().isoformat(),
            'single': {},
            'double': {}
        }

        # シングルバトルのデータを取得
        if single_data:
            print(f"Fetching single battle data...")
            cid = single_data['cid']
            rst = single_data.get('rst', 0)
            ts = single_data.get('ts2', single_data.get('ts1'))

            # ランキングデータ取得
            ranking_data = self.get_pokemon_ranking(cid, rst, ts)
            if ranking_data:
                # ranking_dataがlistの場合とdictの場合を処理
                if isinstance(ranking_data, list):
                    pokemon_list = ranking_data[:30]
                    result['single']['ranking'] = {'pokemon': pokemon_list}
                else:
                    result['single']['ranking'] = ranking_data
                    pokemon_list = ranking_data.get('pokemon', [])[:30]

                # 詳細データ取得は403エラーになるため、現在はスキップ
                # 将来的にAPIアクセスが可能になった場合に有効化
                result['single']['details'] = []

        # ダブルバトルのデータを取得
        if double_data:
            print(f"Fetching double battle data...")
            cid = double_data['cid']
            rst = double_data.get('rst', 0)
            ts = double_data.get('ts2', double_data.get('ts1'))

            # ランキングデータ取得
            ranking_data = self.get_pokemon_ranking(cid, rst, ts)
            if ranking_data:
                # ranking_dataがlistの場合とdictの場合を処理
                if isinstance(ranking_data, list):
                    pokemon_list = ranking_data[:30]
                    result['double']['ranking'] = {'pokemon': pokemon_list}
                else:
                    result['double']['ranking'] = ranking_data
                    pokemon_list = ranking_data.get('pokemon', [])[:30]

                # 詳細データ取得は403エラーになるため、現在はスキップ
                # 将来的にAPIアクセスが可能になった場合に有効化
                result['double']['details'] = []

        return result

def main():
    api = PokemonHomeAPI()

    # データ取得
    data = api.fetch_current_season_data()

    if data:
        # dataディレクトリを作成
        os.makedirs('data', exist_ok=True)

        # JSONファイルに保存
        output_file = 'data/pokemon_home_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Data saved to {output_file}")

        # 簡易版（ランキングのみ）も保存
        simple_data = {
            'season_name': data['season_name'],
            'updated_at': data['updated_at'],
            'single_ranking': data['single'].get('ranking', {}).get('pokemon', [])[:30],
            'double_ranking': data['double'].get('ranking', {}).get('pokemon', [])[:30]
        }

        simple_output = 'data/pokemon_ranking.json'
        with open(simple_output, 'w', encoding='utf-8') as f:
            json.dump(simple_data, f, ensure_ascii=False, indent=2)

        print(f"Simple ranking saved to {simple_output}")
    else:
        print("Failed to fetch data")
        exit(1)

if __name__ == "__main__":
    main()