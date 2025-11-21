# プロジェクト構造

```
pokemon-selector/
├── .github/
│   └── workflows/
│       └── update-pokemon-data.yml    # 月次データ更新用GitHub Actions
├── data/                               # Pokemon HOMEから取得したデータ
│   ├── pokemon_home_data.json         # 詳細データ
│   └── pokemon_ranking.json           # ランキングデータ
├── public/                             # 静的ファイル
│   ├── index.html                     # メインHTML
│   └── style.css                      # スタイルシート
├── scripts/                            # Python スクリプト
│   ├── fetch_pokemon_data.py          # Pokemon HOMEデータ取得スクリプト
│   ├── main.py                        # Python版メインロジック
│   └── test_api.py                    # API動作確認用スクリプト
├── src/                                # JavaScript ソースコード
│   └── main.js                        # メインロジック
├── .gitignore                          # Git除外設定
├── .node-version                       # Node.jsバージョン指定
├── CLAUDE.md                           # Claude Code設定（シンボリックリンク）
├── README.md                           # プロジェクト説明
├── pokedex.json                        # ポケモンデータ（ローカル）
└── requirements.txt                    # Python依存関係

## ディレクトリ説明

- **data/**: GitHub Actionsで月次更新されるPokemon HOMEのデータ
- **public/**: Webアプリケーションの静的ファイル（HTML/CSS）
- **scripts/**: データ取得・処理用のPythonスクリプト
- **src/**: JavaScriptのソースコード
- **.github/**: GitHub Actionsの設定ファイル