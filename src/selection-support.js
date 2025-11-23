let rankingData = null;
let homeData = null;
let pokedexData = null;
let nameData = null;
let typeNames = null;

console.log('[selection-support.js] Script loaded successfully');

window.addEventListener('load', initSelectionSupport);

async function initSelectionSupport() {
    await loadData();
    setupAutoComplete();
    showRecommendations();
}

async function loadData() {
    try {
        const [ranking, home, pokedex, names, types] = await Promise.all([
            fetch('/data/pokemon_ranking.json').then(r => r.json()),
            fetch('/data/pokemon_home_data.json').then(r => r.json()),
            fetch('/data/pokedex.json').then(r => r.json()),
            fetch('/data/assets/pokemon_names.json').then(r => r.json()),
            fetch('/data/assets/type_names.json').then(r => r.json())
        ]);

        rankingData = ranking;
        homeData = home;
        pokedexData = pokedex;
        nameData = names;
        typeNames = types;

        // グローバルに公開（他のモジュールから使用可能にする）
        window.rankingData = rankingData;
        window.nameData = nameData;
        window.pokedexData = pokedexData;

        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

function setupAutoComplete() {
    const datalist = document.getElementById('pokemon-list');

    if (!pokedexData) return;

    Object.keys(pokedexData).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
}

// showRecommendations関数はrecommendation.jsに移動しました

function createRecommendationCard(pokemon, rank) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';

    const pokemonName = getJapaneseName(pokemon.id, pokemon.form);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'pokemon-name';
    nameDiv.textContent = pokemonName;

    const rankDiv = document.createElement('div');
    rankDiv.className = 'pokemon-rank';
    rankDiv.textContent = `ランク: ${rank}位`;

    const typesDiv = document.createElement('div');
    typesDiv.className = 'pokemon-types';

    // ポケモン名からタイプ情報を取得（pokedexから英語名を取得してAPIで取得）
    const jpName = Object.keys(pokedexData).find(key => pokedexData[key].id === pokemon.id);
    if (jpName && pokedexData[jpName]) {
        const enName = pokedexData[jpName].en;
        // タイプ情報を非同期で取得して表示
        fetchAndDisplayTypes(enName, typesDiv);
    }

    card.appendChild(nameDiv);
    card.appendChild(rankDiv);
    card.appendChild(typesDiv);

    card.onclick = () => selectPokemon(pokemonName);

    card.dataset.pokemonId = pokemon.id;
    card.dataset.pokemonForm = pokemon.form;
    card.dataset.pokemonName = pokemonName;

    return card;
}

function getJapaneseName(id, form) {
    if (!nameData || !nameData[id]) return `ポケモン#${id}`;

    const names = nameData[id];
    if (form > 0 && names[form]) {
        return names[form];
    }
    return names[0] || `ポケモン#${id}`;
}

function getTypeName(typeId) {
    if (!typeNames || !typeNames[typeId]) return `タイプ${typeId}`;
    return typeNames[typeId];
}

function getTypeColor(typeId) {
    const typeColors = {
        1: '#A8A878',  // ノーマル
        2: '#F08030',  // ほのお
        3: '#6890F0',  // みず
        4: '#F8D030',  // でんき
        5: '#78C850',  // くさ
        6: '#98D8D8',  // こおり
        7: '#C03028',  // かくとう
        8: '#A040A0',  // どく
        9: '#E0C068',  // じめん
        10: '#A890F0', // ひこう
        11: '#F85888', // エスパー
        12: '#A8B820', // むし
        13: '#B8A038', // いわ
        14: '#705898', // ゴースト
        15: '#7038F8', // ドラゴン
        16: '#705848', // あく
        17: '#B8B8D0', // はがね
        18: '#EE99AC'  // フェアリー
    };
    return typeColors[typeId] || '#68A090';
}

function selectPokemon(pokemonName) {
    for (let i = 0; i < 6; i++) {
        const input = document.getElementById('f' + i);
        if (!input.value) {
            input.value = pokemonName;
            break;
        }
    }
}

async function analyzeAndHighlight(enemyPokemon) {
    const cards = document.querySelectorAll('.recommendation-card');

    for (const card of cards) {
        const pokemonName = card.dataset.pokemonName;
        if (!pokemonName || !pokedexData[pokemonName]) continue;

        const myPokemonEn = pokedexData[pokemonName].en;
        let score = 0;

        try {
            const myData = await getTypeFromAPI(myPokemonEn);
            if (!myData || !myData.types) continue;

            const myTypes = myData.types.map(t => getTypeIdFromName(t.type.name));

            for (const enemy of enemyPokemon) {
                if (pokedexData[enemy]) {
                    const enemyEn = pokedexData[enemy].en;
                    try {
                        const enemyData = await getTypeFromAPI(enemyEn);
                        if (enemyData && enemyData.types) {
                            const enemyTypes = enemyData.types.map(t => getTypeIdFromName(t.type.name));
                            score += calculateTypeAdvantage(myTypes, enemyTypes);
                        }
                    } catch (error) {
                        console.error(`Failed to get type for ${enemy}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to get type for ${pokemonName}:`, error);
        }

        if (score > 3) {
            card.style.borderColor = '#4CAF50';
            card.style.backgroundColor = '#e8f5e9';
        } else if (score < -3) {
            card.style.borderColor = '#f44336';
            card.style.backgroundColor = '#ffebee';
        }
    }
}

async function getTypeFromAPI(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch data for ${pokemonName}:`, error);
        return null;
    }
}

function getTypeIdFromName(typeName) {
    const typeMap = {
        'normal': 1, 'fire': 2, 'water': 3, 'electric': 4,
        'grass': 5, 'ice': 6, 'fighting': 7, 'poison': 8,
        'ground': 9, 'flying': 10, 'psychic': 11, 'bug': 12,
        'rock': 13, 'ghost': 14, 'dragon': 15, 'dark': 16,
        'steel': 17, 'fairy': 18
    };
    return typeMap[typeName] || 1;
}

function calculateTypeAdvantage(myTypes, enemyTypes) {
    const typeChart = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1],
        [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1],
        [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1],
        [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1],
        [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1],
        [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1],
        [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5],
        [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2],
        [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1],
        [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1],
        [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1],
        [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5],
        [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0],
        [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5],
        [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2],
        [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1]
    ];

    let totalAdvantage = 0;

    for (const myType of myTypes) {
        for (const enemyType of enemyTypes) {
            const effectiveness = typeChart[myType - 1][enemyType - 1];
            if (effectiveness > 1) totalAdvantage += 2;
            else if (effectiveness < 1) totalAdvantage -= 2;
        }
    }

    for (const enemyType of enemyTypes) {
        for (const myType of myTypes) {
            const effectiveness = typeChart[enemyType - 1][myType - 1];
            if (effectiveness > 1) totalAdvantage -= 2;
            else if (effectiveness < 1) totalAdvantage += 2;
        }
    }

    return totalAdvantage;
}

async function fetchAndDisplayTypes(enName, typesDiv) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${enName.toLowerCase()}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data && data.types) {
            data.types.forEach(t => {
                const typeId = getTypeIdFromName(t.type.name);
                const typeBadge = document.createElement('span');
                typeBadge.className = 'type-badge';
                typeBadge.textContent = getTypeName(typeId);
                typeBadge.style.backgroundColor = getTypeColor(typeId);
                typesDiv.appendChild(typeBadge);
            });
        }
    } catch (error) {
        console.error(`Failed to fetch types for ${enName}:`, error);
    }
}

// showRecommendations関数はrecommendation.jsで公開