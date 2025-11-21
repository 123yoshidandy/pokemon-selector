# Pokemon Battle Assistant

ポケモンバトルの勝率向上を支援する総合サポートツール

https://123yoshidandy.github.io/pokemon-selector/

## 🎯 プロジェクトの目的

ポケモンSVのランクマッチにおいて、プレイヤーの勝率を最大化するために、データドリブンな意思決定支援を提供します。

## 📊 主要機能

### 1. 構築サポート (Team Building)
- **メタ分析**: 現環境のトップメタポケモン・構築の分析
- **相性補完**: タイプ相性・役割の補完を考慮したポケモン提案
- **流行把握**: 人気の技構成・持ち物・テラスタイプの表示
- **バランス診断**: パーティの物理/特殊、速攻/耐久のバランスチェック

### 2. 選出サポート (Team Selection)
- **マッチアップ分析**: 相手パーティとの相性判定
- **選出提案**: 最適な3体の選出パターン提案
- **相手選出予測**: 相手が選出しやすいポケモンの予測
- **キーポケモン特定**: 対戦で重要になるポケモンのハイライト

### 3. 立ち回りサポート (Battle Strategy)
- **ダメージ計算**: リアルタイムダメージ計算
- **素早さ判定**: 素早さ関係の可視化
- **最適行動提案**: 各ターンの推奨行動
- **交代タイミング**: 有利な交代タイミングの提示

## 🔄 データ更新

Pokemon HOMEから以下のデータを毎日自動取得：

- **使用率ランキング**: シングル/ダブルバトルの上位ポケモン
- **技データ**: 6,000件以上の技使用率統計
- **特性データ**: 1,000件以上の特性使用率
- **持ち物データ**: 3,600件以上のアイテム使用率
- **テラスタイプ**: 2,800件以上のテラスタイプ分布

## 🚀 使用方法

### ローカル実行
```bash
# リポジトリのクローン
git clone https://github.com/yourusername/pokemon-selector.git
cd pokemon-selector

# ローカルサーバーの起動
python -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000/public/
```

### 開発環境
```bash
# Pokemon HOMEデータの手動更新
python scripts/fetch_pokemon_data.py
python scripts/fetch_pokemon_detail.py
```

## 📁 プロジェクト構造

```
pokemon-selector/
├── .github/
│   └── workflows/
│       └── update-pokemon-data.yml    # 毎日実行のデータ更新ワークフロー
├── data/                               # Pokemon HOMEから取得したデータ
│   ├── assets/                        # マッピングデータ
│   │   ├── pokemon_names.json         # ポケモン名
│   │   ├── move_names.json           # 技名
│   │   ├── ability_names.json        # 特性名
│   │   ├── item_names.json           # アイテム名
│   │   └── type_names.json           # タイプ名
│   ├── pokemon_home_data.json         # ランキング基本データ
│   ├── pokemon_ranking.json           # 簡易ランキング
│   └── pokemon_detail_data.json       # 詳細統計データ
├── public/                             # Webアプリケーション
│   ├── index.html                     # メインHTML
│   └── style.css                      # スタイルシート
├── scripts/                            # データ取得スクリプト
│   ├── fetch_pokemon_data.py          # ランキング取得
│   ├── fetch_pokemon_detail.py        # 詳細データ取得
│   ├── main.py                        # Python版メインロジック
│   └── test_api.py                    # API動作確認用
├── src/                                # JavaScriptソース
│   └── main.js                        # メインロジック
├── tmp/                                # 一時ファイル（gitignore）
├── .gitignore                          # Git除外設定
├── .node-version                       # Node.jsバージョン指定
├── CLAUDE.md                           # Claude Code設定（シンボリックリンク）
├── README.md                           # このファイル
├── pokedex.json                        # ポケモン基礎データ
└── requirements.txt                    # Python依存関係
```

## 🛠 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript (Vanilla)
- **データ取得**: Python (requests)
- **自動更新**: GitHub Actions (毎日3時JST)
- **データソース**: Pokemon HOME API (非公式)

## ⚙️ GitHub Actions 自動更新

### 実行タイミング
- **毎日午前3時（JST）** に自動実行
- 手動実行も可能（Actions タブから "Run workflow"）

### 取得データ詳細
1. **pokemon_home_data.json** - シングル/ダブルバトルの使用率ランキング
2. **pokemon_ranking.json** - 上位30体の簡易リスト
3. **pokemon_detail_data.json** - 全ポケモンの詳細統計（技・特性・アイテム・テラスタイプ）

### 手動実行方法
1. GitHubリポジトリの「Actions」タブを開く
2. 「Update Pokemon HOME Data」を選択
3. 「Run workflow」をクリック
4. ブランチを選択して実行

※データ更新時は自動でコミット・プッシュされます

## 📈 今後の開発予定

- [ ] UIの全面リニューアル
- [ ] ダメージ計算機の実装
- [ ] パーティ構築ウィザード
- [ ] 対戦履歴の記録・分析
- [ ] AIによる選出提案
- [ ] モバイル対応

## 🤝 貢献

Issue報告やPull Requestを歓迎します。

## 📝 ライセンス

本プロジェクトはポケモンバトルの研究・学習目的で作成されています。
ポケモン関連の著作権は株式会社ポケモン、任天堂株式会社に帰属します。

## 過去の方針（アーカイブ）

1. （事前に）自身のポケモン6体を入力する
2. 相手のポケモン6体を入力する
3. 相手のポケモンのタイプ・種族値・主な習得技を検索して表示する
4. さらには、それに対して選出すべきポケモンを示唆する

※主な習得技の検索には、[ポケモン対戦考察まとめWiki](https://latest.pokewiki.net/)を利用する予定でした