// 推奨選出機能（自分の6匹から最適な3匹を選ぶ）

async function showRecommendations() {
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = '';

    // 自分のポケモンと相手のポケモンを取得
    const myPokemon = [];
    const enemyPokemon = [];

    for (let i = 0; i < 6; i++) {
        const myName = document.getElementById('f' + i).value;
        const enemyName = document.getElementById('e' + i).value;

        if (myName) myPokemon.push({ name: myName, index: i });
        if (enemyName) enemyPokemon.push(enemyName);
    }

    if (myPokemon.length < 3) {
        recommendationsDiv.innerHTML = '<p>自分のポケモンを3匹以上入力してください。</p>';
        return;
    }

    if (enemyPokemon.length === 0) {
        recommendationsDiv.innerHTML = '<p>相手のポケモンを入力してください。</p>';
        return;
    }

    // 各ポケモンの相性スコアを計算
    const scores = await calculateSelectionScores(myPokemon, enemyPokemon);

    // 全ての3匹の組み合わせを生成
    const combinations = getCombinations(myPokemon, 3);

    // 各組み合わせのスコアを計算
    const combinationScores = combinations.map(combo => {
        const totalScore = combo.reduce((sum, pokemon) => sum + scores[pokemon.index], 0);
        return {
            combination: combo,
            score: totalScore
        };
    });

    // スコアで並び替え
    combinationScores.sort((a, b) => b.score - a.score);

    // 上位3つの組み合わせを表示
    const topCombinations = combinationScores.slice(0, 3);

    const title = document.createElement('h3');
    title.textContent = '推奨選出パターン（相性スコア順）';
    recommendationsDiv.appendChild(title);

    topCombinations.forEach((combo, index) => {
        const comboDiv = document.createElement('div');
        comboDiv.className = 'recommendation-combo';
        comboDiv.style.cssText = `
            margin: 15px 0;
            padding: 15px;
            background: ${index === 0 ? '#e8f5e9' : '#f5f5f5'};
            border-radius: 8px;
            border: ${index === 0 ? '2px solid #4CAF50' : '1px solid #ddd'};
        `;

        const rankDiv = document.createElement('div');
        rankDiv.style.cssText = 'font-weight: bold; margin-bottom: 10px;';
        rankDiv.textContent = `第${index + 1}位 (スコア: ${combo.score.toFixed(1)})`;

        const pokemonDiv = document.createElement('div');
        pokemonDiv.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

        combo.combination.forEach(pokemon => {
            const pokeDiv = document.createElement('div');
            pokeDiv.style.cssText = `
                padding: 8px 15px;
                background: white;
                border-radius: 5px;
                border: 1px solid #ccc;
            `;
            pokeDiv.textContent = `${pokemon.name} (${scores[pokemon.index].toFixed(1)})`;
            pokemonDiv.appendChild(pokeDiv);
        });

        comboDiv.appendChild(rankDiv);
        comboDiv.appendChild(pokemonDiv);
        recommendationsDiv.appendChild(comboDiv);
    });

    // 個別スコアも表示
    const individualTitle = document.createElement('h3');
    individualTitle.textContent = '個別相性スコア';
    individualTitle.style.marginTop = '30px';
    recommendationsDiv.appendChild(individualTitle);

    const sortedScores = myPokemon.map(p => ({
        ...p,
        score: scores[p.index]
    })).sort((a, b) => b.score - a.score);

    const scoreList = document.createElement('div');
    scoreList.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    sortedScores.forEach(pokemon => {
        const scoreDiv = document.createElement('div');
        scoreDiv.style.cssText = `
            padding: 8px 15px;
            background: ${pokemon.score > 0 ? '#e8f5e9' : pokemon.score < 0 ? '#ffebee' : '#f5f5f5'};
            border-radius: 5px;
            border: 1px solid ${pokemon.score > 0 ? '#4CAF50' : pokemon.score < 0 ? '#f44336' : '#ccc'};
        `;
        scoreDiv.textContent = `${pokemon.name}: ${pokemon.score.toFixed(1)}`;
        scoreList.appendChild(scoreDiv);
    });

    recommendationsDiv.appendChild(scoreList);
}

// 相性スコアを計算
async function calculateSelectionScores(myPokemon, enemyPokemon) {
    const scores = {};

    // pokedexデータを取得（まだ読み込まれていない場合）
    if (!window.pokedexData) {
        try {
            const response = await fetch('data/pokedex.json');
            window.pokedexData = await response.json();
        } catch (error) {
            console.error('Failed to load pokedex:', error);
            return scores;
        }
    }

    for (const myPoke of myPokemon) {
        let score = 0;

        // 英語名を取得
        const myEnName = window.pokedexData[myPoke.name]?.en;
        if (!myEnName) {
            scores[myPoke.index] = 0;
            continue;
        }

        try {
            // 自分のポケモンのタイプを取得
            const myResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${myEnName.toLowerCase()}`);
            const myData = await myResponse.json();
            const myTypes = myData.types.map(t => t.type.name);

            // 各相手ポケモンに対する相性を計算
            for (const enemyName of enemyPokemon) {
                const enemyEnName = window.pokedexData[enemyName]?.en;
                if (!enemyEnName) continue;

                try {
                    const enemyResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${enemyEnName.toLowerCase()}`);
                    const enemyData = await enemyResponse.json();
                    const enemyTypes = enemyData.types.map(t => t.type.name);

                    // タイプ相性を計算
                    score += calculateTypeAdvantageSimple(myTypes, enemyTypes);
                } catch (error) {
                    console.error(`Failed to get data for ${enemyName}:`, error);
                }
            }
        } catch (error) {
            console.error(`Failed to get data for ${myPoke.name}:`, error);
            scores[myPoke.index] = 0;
            continue;
        }

        scores[myPoke.index] = score;
    }

    return scores;
}

// シンプルなタイプ相性計算
function calculateTypeAdvantageSimple(myTypes, enemyTypes) {
    const typeChart = {
        'normal': { weak: ['fighting'], resist: [], immune: ['ghost'] },
        'fire': { weak: ['water', 'ground', 'rock'], resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immune: [] },
        'water': { weak: ['electric', 'grass'], resist: ['fire', 'water', 'ice', 'steel'], immune: [] },
        'electric': { weak: ['ground'], resist: ['electric', 'flying', 'steel'], immune: [] },
        'grass': { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], resist: ['water', 'electric', 'grass', 'ground'], immune: [] },
        'ice': { weak: ['fire', 'fighting', 'rock', 'steel'], resist: ['ice'], immune: [] },
        'fighting': { weak: ['flying', 'psychic', 'fairy'], resist: ['bug', 'rock', 'dark'], immune: [] },
        'poison': { weak: ['ground', 'psychic'], resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immune: [] },
        'ground': { weak: ['water', 'grass', 'ice'], resist: ['poison', 'rock'], immune: ['electric'] },
        'flying': { weak: ['electric', 'ice', 'rock'], resist: ['grass', 'fighting', 'bug'], immune: ['ground'] },
        'psychic': { weak: ['bug', 'ghost', 'dark'], resist: ['fighting', 'psychic'], immune: [] },
        'bug': { weak: ['fire', 'flying', 'rock'], resist: ['grass', 'fighting', 'ground'], immune: [] },
        'rock': { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'], immune: [] },
        'ghost': { weak: ['ghost', 'dark'], resist: ['poison', 'bug'], immune: ['normal', 'fighting'] },
        'dragon': { weak: ['ice', 'dragon', 'fairy'], resist: ['fire', 'water', 'electric', 'grass'], immune: [] },
        'dark': { weak: ['fighting', 'bug', 'fairy'], resist: ['ghost', 'dark'], immune: ['psychic'] },
        'steel': { weak: ['fire', 'fighting', 'ground'], resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
        'fairy': { weak: ['poison', 'steel'], resist: ['fighting', 'bug', 'dark'], immune: ['dragon'] }
    };

    let score = 0;

    // 防御面の計算
    for (const myType of myTypes) {
        const typeData = typeChart[myType];
        if (!typeData) continue;

        for (const enemyType of enemyTypes) {
            if (typeData.weak.includes(enemyType)) score -= 2;
            if (typeData.resist.includes(enemyType)) score += 1;
            if (typeData.immune.includes(enemyType)) score += 3;
        }
    }

    // 攻撃面の計算（簡易版）
    for (const enemyType of enemyTypes) {
        const typeData = typeChart[enemyType];
        if (!typeData) continue;

        for (const myType of myTypes) {
            if (typeData.weak.includes(myType)) score += 2;
            if (typeData.resist.includes(myType)) score -= 1;
            if (typeData.immune.includes(myType)) score -= 3;
        }
    }

    return score;
}

// 組み合わせを生成する関数
function getCombinations(arr, size) {
    const result = [];

    function combine(start, combo) {
        if (combo.length === size) {
            result.push([...combo]);
            return;
        }

        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }

    combine(0, []);
    return result;
}

// ランキング上位ポケモンを表示する関数（元の機能）
async function showRankingPokemons() {
    if (!window.rankingData || !window.nameData) {
        alert('データを読み込み中です。もう一度お試しください。');
        return;
    }

    const rankingDiv = document.getElementById('ranking-pokemons');
    if (!rankingDiv) {
        console.error('ranking-pokemons element not found');
        return;
    }

    rankingDiv.innerHTML = '';

    const top30Pokemon = window.rankingData.single_ranking.slice(0, 30);

    const gridDiv = document.createElement('div');
    gridDiv.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin: 20px 0;
    `;

    for (const pokemon of top30Pokemon) {
        const card = document.createElement('div');
        card.className = 'ranking-card';
        card.style.cssText = `
            background: #f8f8f8;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        `;

        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'font-weight: bold; margin-bottom: 5px;';
        nameDiv.textContent = getJapaneseName(pokemon.id, pokemon.form);

        const rankDiv = document.createElement('div');
        rankDiv.style.cssText = 'color: #777; font-size: 0.9em;';
        rankDiv.textContent = `${top30Pokemon.indexOf(pokemon) + 1}位`;

        card.appendChild(nameDiv);
        card.appendChild(rankDiv);

        card.onclick = () => selectPokemonToParty(getJapaneseName(pokemon.id, pokemon.form));

        card.onmouseover = () => {
            card.style.borderColor = '#4CAF50';
            card.style.transform = 'translateY(-2px)';
        };

        card.onmouseout = () => {
            card.style.borderColor = '#ddd';
            card.style.transform = 'translateY(0)';
        };

        gridDiv.appendChild(card);
    }

    rankingDiv.appendChild(gridDiv);
}

// ポケモン名から日本語名を取得
function getJapaneseName(id, form) {
    if (!window.nameData || !window.nameData[id]) return `ポケモン#${id}`;

    const names = window.nameData[id];
    if (form > 0 && names[form]) {
        return names[form];
    }
    return names[0] || `ポケモン#${id}`;
}

// ポケモンをパーティに追加
function selectPokemonToParty(pokemonName) {
    for (let i = 0; i < 6; i++) {
        const input = document.getElementById('f' + i);
        if (!input.value) {
            input.value = pokemonName;
            break;
        }
    }
}

// グローバルスコープに公開
window.showRecommendations = showRecommendations;
window.showRankingPokemons = showRankingPokemons;