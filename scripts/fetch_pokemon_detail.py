#!/usr/bin/env python3
"""
Pokemon HOME 詳細データ取得スクリプト
詳細データ（技、アイテム、特性、テラスタイプ）を取得
"""

import json
import requests
from datetime import datetime
import os
import shutil

class PokemonHomeDetailAPI:
    def __init__(self):
        self.headers = {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'user-agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36'
        }
        # 必要なマッピングファイルをコピー
        self.copy_asset_files()
        self.load_mapping_data()

    def copy_asset_files(self):
        """必要なアセットファイルをコピー"""
        asset_dir = 'data/assets'
        os.makedirs(asset_dir, exist_ok=True)

        # 参照リポジトリからアセットファイルをコピー
        source_dir = 'tmp/pokemon_home_sv/asset'
        if os.path.exists(source_dir):
            for filename in ['pokemon_names.json', 'move_names.json', 'ability_names.json',
                           'item_names.json', 'type_names.json']:
                source = f"{source_dir}/{filename}"
                dest = f"{asset_dir}/{filename}"
                if os.path.exists(source) and not os.path.exists(dest):
                    shutil.copy2(source, dest)
                    print(f"Copied {filename}")

    def load_mapping_data(self):
        """マッピングデータを読み込み"""
        asset_dir = 'data/assets'

        # ポケモン名
        with open(f'{asset_dir}/pokemon_names.json', 'r', encoding='utf-8') as f:
            self.pokemon_names = json.load(f)['JPN']

        # 技名
        with open(f'{asset_dir}/move_names.json', 'r', encoding='utf-8') as f:
            self.move_names = json.load(f)['JPN']

        # 特性名
        with open(f'{asset_dir}/ability_names.json', 'r', encoding='utf-8') as f:
            self.ability_names = json.load(f)['JPN']

        # アイテム名
        with open(f'{asset_dir}/item_names.json', 'r', encoding='utf-8') as f:
            self.item_names = json.load(f)['itemname']

        # タイプ名
        with open(f'{asset_dir}/type_names.json', 'r', encoding='utf-8') as f:
            self.type_names = json.load(f)['JPN']

    def get_season_list(self):
        """シーズン一覧を取得"""
        url = 'https://api.battle.pokemon-home.com/tt/cbd/competition/rankmatch/list'
        data = {
            'soft': 'Sc',  # Scarlet/Violet
            'lng': 'ja'
        }

        try:
            response = requests.post(url, headers=self.headers, data=json.dumps(data))
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching season list: {e}")
            return None

    def get_pokemon_detail(self, cid, rst, ts, page_num):
        """ポケモンの詳細データを取得（技、持ち物、性格、特性）

        Args:
            cid: Competition ID
            rst: ランキングタイプ
            ts: タイムスタンプ
            page_num: ページ番号（1-6）
        """
        url = f"https://resource.pokemon-home.com/battledata/ranking/scvi/{cid}/{rst}/{ts}/pdetail-{page_num}"

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching pokemon detail page {page_num}: {e}")
            return None

    def convert_id_to_name(self, id, mapping_data):
        """IDを名前に変換"""
        if isinstance(mapping_data, list):
            return mapping_data[int(id)] if int(id) < len(mapping_data) else f"Unknown_{id}"
        elif isinstance(mapping_data, dict):
            return mapping_data.get(str(id), f"Unknown_{id}")
        return str(id)

    def parse_pokemon_detail(self, detail_json):
        """詳細データをパース"""
        result = {
            'moves': [],
            'abilities': [],
            'items': [],
            'tera_types': []
        }

        for pokemon_id, forms in detail_json.items():
            pokemon_name = self.convert_id_to_name(int(pokemon_id) - 1, self.pokemon_names)

            for form_id, form_data in forms.items():
                if 'temoti' not in form_data:
                    continue

                pokemon_info = form_data['temoti']

                # 技データ
                if 'waza' in pokemon_info:
                    for rank, move_data in enumerate(pokemon_info['waza'], 1):
                        move_name = self.convert_id_to_name(move_data['id'], self.move_names)
                        result['moves'].append({
                            'pokemon_id': pokemon_id,
                            'pokemon_name': pokemon_name,
                            'form_id': form_id,
                            'rank': rank,
                            'move_name': move_name,
                            'usage_rate': move_data.get('val', 0)
                        })

                # 特性データ
                if 'tokusei' in pokemon_info:
                    for rank, ability_data in enumerate(pokemon_info['tokusei'], 1):
                        ability_name = self.convert_id_to_name(ability_data['id'], self.ability_names)
                        result['abilities'].append({
                            'pokemon_id': pokemon_id,
                            'pokemon_name': pokemon_name,
                            'form_id': form_id,
                            'rank': rank,
                            'ability_name': ability_name,
                            'usage_rate': ability_data.get('val', 0)
                        })

                # アイテムデータ
                if 'motimono' in pokemon_info:
                    for rank, item_data in enumerate(pokemon_info['motimono'], 1):
                        item_name = self.convert_id_to_name(item_data['id'], self.item_names)
                        result['items'].append({
                            'pokemon_id': pokemon_id,
                            'pokemon_name': pokemon_name,
                            'form_id': form_id,
                            'rank': rank,
                            'item_name': item_name,
                            'usage_rate': item_data.get('val', 0)
                        })

                # テラスタイプデータ
                if 'terastal' in pokemon_info:
                    for rank, tera_data in enumerate(pokemon_info['terastal'], 1):
                        tera_type = self.convert_id_to_name(tera_data['id'], self.type_names)
                        result['tera_types'].append({
                            'pokemon_id': pokemon_id,
                            'pokemon_name': pokemon_name,
                            'form_id': form_id,
                            'rank': rank,
                            'tera_type': tera_type,
                            'usage_rate': tera_data.get('val', 0)
                        })

        return result

    def fetch_all_details(self):
        """全ての詳細データを取得"""
        # シーズン一覧取得
        seasons = self.get_season_list()
        if not seasons or 'list' not in seasons:
            print("Failed to get season list")
            return None

        # シーズン情報を取得
        season_list = seasons.get('list', {})
        if not season_list:
            print("No seasons found")
            return None

        # 最新シーズンを取得
        first_season_key = list(season_list.keys())[0]
        season_data = season_list[first_season_key]

        # シングルバトルのデータを優先
        single_data = None
        for inner_key, data in season_data.items():
            if data.get('rule') == 0:  # シングル
                single_data = data
                break

        if not single_data:
            print("No single battle data found")
            return None

        cid = inner_key
        rst = single_data.get('rst', 0)
        ts = single_data.get('ts2', single_data.get('ts1'))
        season_name = single_data.get('name', 'Unknown Season')

        print(f"Fetching detailed data for season: {season_name}")

        # 全6ページの詳細データを取得
        all_details = {
            'season_name': season_name,
            'moves': [],
            'abilities': [],
            'items': [],
            'tera_types': []
        }

        for page in range(1, 7):
            print(f"Fetching detail page {page}/6...")
            detail_data = self.get_pokemon_detail(cid, rst, ts, page)

            if detail_data:
                parsed = self.parse_pokemon_detail(detail_data)
                all_details['moves'].extend(parsed['moves'])
                all_details['abilities'].extend(parsed['abilities'])
                all_details['items'].extend(parsed['items'])
                all_details['tera_types'].extend(parsed['tera_types'])
            else:
                print(f"Failed to fetch page {page}")

        return all_details

def main():
    api = PokemonHomeDetailAPI()

    # 詳細データ取得
    details = api.fetch_all_details()

    if details:
        # dataディレクトリを作成
        os.makedirs('data', exist_ok=True)

        # JSONファイルに保存
        output_file = 'data/pokemon_detail_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(details, f, ensure_ascii=False, indent=2)

        print(f"Detailed data saved to {output_file}")
        print(f"- Moves: {len(details['moves'])} entries")
        print(f"- Abilities: {len(details['abilities'])} entries")
        print(f"- Items: {len(details['items'])} entries")
        print(f"- Tera Types: {len(details['tera_types'])} entries")
    else:
        print("Failed to fetch detailed data")
        exit(1)

if __name__ == "__main__":
    main()