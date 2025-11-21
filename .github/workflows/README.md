# GitHub Actions Workflow

## update-pokemon-data.yml

Pokemon HOMEからデータを自動取得するワークフロー

### 実行タイミング
- **毎日午前3時（JST）** に自動実行
- 手動実行も可能（Actions タブから "Run workflow"）

### 取得データ
1. **pokemon_home_data.json** - ランキングデータ
   - シングル/ダブルバトルの使用率ランキング
   - 上位30体のポケモン情報

2. **pokemon_ranking.json** - 簡易ランキング
   - シングル/ダブルの上位30体リスト

3. **pokemon_detail_data.json** - 詳細データ
   - 技の使用率（6,000件以上）
   - 特性の使用率（1,000件以上）
   - アイテムの使用率（3,000件以上）
   - テラスタイプの使用率（2,000件以上）

### 手動実行方法
1. GitHubリポジトリの「Actions」タブを開く
2. 「Update Pokemon HOME Data」を選択
3. 「Run workflow」をクリック
4. ブランチを選択して「Run workflow」を実行

### 注意事項
- データ更新時は自動でコミット・プッシュされます
- コミットメッセージには実行日時が含まれます
- APIの負荷を考慮し、1日1回の実行を推奨