// ランキングデータ
let rankingData = null;
let pokedexData = null;
let pokemonNames = null;
let currentFilter = 'single';  // デフォルトをシングルに設定

// 初期化
window.addEventListener('DOMContentLoaded', async () => {
    await loadRankingData();
    displayRanking();
});

// データ読み込み
async function loadRankingData() {
    try {
        const [ranking, pokedex, names] = await Promise.all([
            fetch('data/pokemon_ranking.json').then(r => r.json()),
            fetch('data/pokedex.json').then(r => r.json()),
            fetch('data/assets/pokemon_names.json').then(r => r.json())
        ]);

        rankingData = ranking;
        pokedexData = pokedex;
        pokemonNames = names.JPN || [];
        console.log('Ranking data loaded:', rankingData);
    } catch (error) {
        console.error('Failed to load ranking data:', error);
    }
}

// ランキング表示
function displayRanking() {
    if (!rankingData || !pokedexData || !pokemonNames) {
        console.error('Data not loaded');
        return;
    }

    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;

    rankingList.innerHTML = '';

    // 現在のフィルターに応じてデータを選択
    let pokemonList = [];
    if (currentFilter === 'single') {
        pokemonList = rankingData.single_ranking || [];
    } else if (currentFilter === 'double') {
        pokemonList = rankingData.double_ranking || [];
    }

    // 最大30位まで表示
    const maxRank = Math.min(pokemonList.length, 30);
    for (let i = 0; i < maxRank; i++) {
        const rankingItem = createRankingItem(pokemonList[i], i + 1);
        if (rankingItem) {
            rankingList.appendChild(rankingItem);
        }
    }
}

// ランキングアイテム作成
function createRankingItem(pokemon, rank) {
    const item = document.createElement('div');
    item.className = 'ranking-item';

    // ポケモンIDから名前を取得
    const pokemonId = pokemon.id;
    const pokemonName = pokemonNames[pokemonId - 1] || `ポケモン${pokemonId}`;

    // ポケモン詳細情報を取得
    const pokemonDetail = pokedexData[pokemonName] || {};

    // タイプ情報を取得（タイプ名の変換が必要な場合は後で対応）
    const types = pokemonDetail.types || [];
    const typeHtml = types.length > 0 ?
        types.map(type => {
            const typeName = getJapaneseTypeName(type);
            return `<span class="type-badge type-${type.toLowerCase()}">${typeName}</span>`;
        }).join('') : '<span class="type-badge">不明</span>';

    // 使用率（仮のデータ）
    const usageRate = `${(30 - rank * 0.5).toFixed(1)}%`;

    // 前回比（仮のデータ）
    const change = rank <= 5 ? '↑' : rank <= 15 ? '→' : '↓';
    const changeClass = change === '↑' ? 'up' : change === '↓' ? 'down' : 'same';

    item.innerHTML = `
        <span class="rank-number">#${rank}</span>
        <span class="pokemon-name">${pokemonName}</span>
        <span class="pokemon-types">${typeHtml}</span>
        <span class="usage-rate">${usageRate}</span>
        <span class="rank-change ${changeClass}">${change}</span>
    `;

    item.addEventListener('click', () => showPokemonDetails(pokemonName));

    return item;
}

// タイプ名を日本語に変換
function getJapaneseTypeName(type) {
    const typeMap = {
        'normal': 'ノーマル',
        'fire': 'ほのお',
        'water': 'みず',
        'electric': 'でんき',
        'grass': 'くさ',
        'ice': 'こおり',
        'fighting': 'かくとう',
        'poison': 'どく',
        'ground': 'じめん',
        'flying': 'ひこう',
        'psychic': 'エスパー',
        'bug': 'むし',
        'rock': 'いわ',
        'ghost': 'ゴースト',
        'dragon': 'ドラゴン',
        'dark': 'あく',
        'steel': 'はがね',
        'fairy': 'フェアリー'
    };
    return typeMap[type.toLowerCase()] || type;
}

// ポケモン詳細表示
function showPokemonDetails(pokemonName) {
    const detailsDiv = document.getElementById('pokemon-details');
    if (!detailsDiv) return;

    const pokemon = pokedexData[pokemonName] || {};

    detailsDiv.innerHTML = `
        <h4>${pokemonName}</h4>
        <div class="detail-content">
            <p><strong>タイプ:</strong> ${(pokemon.types || []).join(' / ')}</p>
            <p><strong>特性:</strong> ${(pokemon.abilities || ['不明']).join(', ')}</p>
            <div class="common-moves">
                <strong>よく使われる技:</strong>
                <ul>
                    <li>10万ボルト</li>
                    <li>かみなり</li>
                    <li>アイアンテール</li>
                    <li>でんきショック</li>
                </ul>
            </div>
            <div class="common-items">
                <strong>よく持たせる道具:</strong>
                <ul>
                    <li>きあいのタスキ</li>
                    <li>いのちのたま</li>
                </ul>
            </div>
        </div>
    `;
}

// フィルタリング機能
window.filterRanking = function(filter) {
    currentFilter = filter;

    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.filter-options .btn-secondary').forEach(btn => {
        btn.classList.remove('active');
    });

    // クリックされたボタンにactiveクラスを追加
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // ランキングを再表示
    displayRanking();
};

// タブが切り替わったときにランキングを更新
document.addEventListener('DOMContentLoaded', () => {
    const rankingTab = document.querySelector('[data-tab="ranking"]');
    if (rankingTab) {
        rankingTab.addEventListener('click', async () => {
            if (!rankingData) {
                await loadRankingData();
            }
            // デフォルトでシングルランキングを表示
            currentFilter = 'single';
            // シングルボタンをアクティブに
            document.querySelectorAll('.filter-options .btn-secondary').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent === 'シングル') {
                    btn.classList.add('active');
                }
            });
            displayRanking();
        });
    }
});