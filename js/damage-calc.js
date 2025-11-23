// ダメージ計算ツール
let damageCalcRankingData = null;
let damageCalcPokemonNames = null;
let damageCalcPokedexData = null;
let damageCalcDetailData = null;

// 初期化は削除（タブクリック時に実行するため）
// window.addEventListener('DOMContentLoaded', async () => {
//     await loadDamageCalcData();
//     initializeDamageCalculator();
// });

// データ読み込み
async function loadDamageCalcData() {
    try {
        console.log('Loading damage calc data...');
        const [ranking, names, pokedex, detail] = await Promise.all([
            fetch('data/pokemon_ranking.json').then(r => r.json()),
            fetch('data/assets/pokemon_names.json').then(r => r.json()),
            fetch('data/pokedex.json').then(r => r.json()),
            fetch('data/pokemon_detail_data.json').then(r => r.json())
        ]);

        damageCalcRankingData = ranking;
        damageCalcPokemonNames = names.JPN || [];
        damageCalcPokedexData = pokedex;
        damageCalcDetailData = detail;

        console.log('Damage calc data loaded successfully');
        console.log('Pokemon count:', damageCalcPokemonNames.length);
        console.log('First 5 pokemon:', damageCalcPokemonNames.slice(0, 5));

        // データロード後すぐに初期化を試みる
        if (document.getElementById('calc-attacker-pokemon')) {
            initializeDamageCalculator();
        }
    } catch (error) {
        console.error('Failed to load damage calc data:', error);
        // エラーの詳細を表示
        console.error('Error details:', error.message, error.stack);
    }
}

// ダメージ計算ツールの初期化
function initializeDamageCalculator() {
    if (!damageCalcRankingData || !damageCalcPokemonNames || !damageCalcPokedexData) {
        console.error('Data not loaded');
        return;
    }

    // ポケモン選択ドロップダウンの初期化
    initializePokemonSelects();

    // ランキング1位と2位をデフォルト設定
    setDefaultPokemons();

    // イベントリスナーの設定
    setupEventListeners();
}

// ポケモン選択ドロップダウンの初期化
function initializePokemonSelects() {
    const attackerInput = document.getElementById('calc-attacker-pokemon');
    const defenderInput = document.getElementById('calc-defender-pokemon');
    const attackerList = document.getElementById('calc-attacker-list');
    const defenderList = document.getElementById('calc-defender-list');
    const simAttackerSelect = document.getElementById('sim-attacker-pokemon');
    const simDefenderSelect = document.getElementById('sim-defender-pokemon');

    console.log('Initializing pokemon selects...');
    console.log('Pokemon names loaded:', damageCalcPokemonNames ? damageCalcPokemonNames.length : 0);

    if (!damageCalcPokemonNames || damageCalcPokemonNames.length === 0) {
        console.error('Pokemon names not loaded');
        return;
    }

    // 使用率順のポケモンリストを作成
    const sortedPokemonList = createSortedPokemonList();

    // datalistのオプションを作成
    const datalistOptions = sortedPokemonList.map(item => {
        if (item.name) {
            return `<option value="${item.name}" data-id="${item.id}">`;
        }
        return '';
    }).filter(opt => opt !== '').join('');

    // selectボックス用のオプション
    const selectOptions = sortedPokemonList.map(item => {
        if (item.name) {
            return `<option value="${item.id}">${item.name}</option>`;
        }
        return '';
    }).filter(opt => opt !== '').join('');

    // datalistに追加
    if (attackerList) attackerList.innerHTML = datalistOptions;
    if (defenderList) defenderList.innerHTML = datalistOptions;

    // シミュレーター用のselectには従来通り
    [simAttackerSelect, simDefenderSelect].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">ポケモンを選択</option>' + selectOptions;
            console.log(`Populated ${select.id} with sorted pokemon list`);
        }
    });
}

// 使用率順のポケモンリストを作成
function createSortedPokemonList() {
    const pokemonList = [];

    // まずランキング上位のポケモンを追加
    if (damageCalcRankingData && damageCalcRankingData.single_ranking) {
        // シングルランキングのポケモン
        damageCalcRankingData.single_ranking.forEach((rankPokemon, index) => {
            const pokemonName = damageCalcPokemonNames[rankPokemon.id - 1];
            if (pokemonName) {
                pokemonList.push({
                    id: rankPokemon.id,
                    name: pokemonName,
                    rank: index + 1
                });
            }
        });
    }

    // 区切り線は追加しない（optionで無効にできないため）

    // ランキングに含まれていないポケモンを追加
    const rankedIds = new Set(pokemonList.map(p => p.id));
    damageCalcPokemonNames.forEach((name, index) => {
        const id = index + 1;
        if (name && !rankedIds.has(id)) {
            pokemonList.push({
                id: id,
                name: name,
                rank: 1000 + index  // ランキング外は後ろに
            });
        }
    });

    return pokemonList;
}

// デフォルトポケモンの設定（ランキング1位と2位）
function setDefaultPokemons() {
    if (!damageCalcRankingData.single_ranking || damageCalcRankingData.single_ranking.length < 2) {
        return;
    }

    // シングルランキングの1位と2位を取得
    const firstPokemon = damageCalcRankingData.single_ranking[0];
    const secondPokemon = damageCalcRankingData.single_ranking[1];

    // 攻撃側に1位、防御側に2位を設定
    const attackerInput = document.getElementById('calc-attacker-pokemon');
    const defenderInput = document.getElementById('calc-defender-pokemon');

    if (attackerInput && firstPokemon) {
        const firstName = damageCalcPokemonNames[firstPokemon.id - 1];
        if (firstName) {
            attackerInput.value = firstName;
            attackerInput.dataset.pokemonId = firstPokemon.id;
            updatePokemonMoves('calc-attacker', firstPokemon.id);
        }
    }

    if (defenderInput && secondPokemon) {
        const secondName = damageCalcPokemonNames[secondPokemon.id - 1];
        if (secondName) {
            defenderInput.value = secondName;
            defenderInput.dataset.pokemonId = secondPokemon.id;
        }
    }

    // 対面シミュレーションも同様に設定
    const simAttackerSelect = document.getElementById('sim-attacker-pokemon');
    const simDefenderSelect = document.getElementById('sim-defender-pokemon');

    if (simAttackerSelect && firstPokemon) {
        simAttackerSelect.value = firstPokemon.id;
        updatePokemonMoves('sim-attacker', firstPokemon.id);
    }

    if (simDefenderSelect && secondPokemon) {
        simDefenderSelect.value = secondPokemon.id;
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // ダメージ計算タブのポケモン選択
    const attackerInput = document.getElementById('calc-attacker-pokemon');
    if (attackerInput) {
        attackerInput.addEventListener('input', (e) => {
            handlePokemonInput('calc-attacker', e.target);
        });
    }

    const defenderInput = document.getElementById('calc-defender-pokemon');
    if (defenderInput) {
        defenderInput.addEventListener('input', (e) => {
            handlePokemonInput('calc-defender', e.target);
        });
    }

    // 対面シミュレーションタブのポケモン選択
    const simAttackerSelect = document.getElementById('sim-attacker-pokemon');
    if (simAttackerSelect) {
        simAttackerSelect.addEventListener('change', (e) => {
            updatePokemonMoves('sim-attacker', e.target.value);
            updatePokemonStats('sim-attacker', e.target.value);
        });
    }

    const simDefenderSelect = document.getElementById('sim-defender-pokemon');
    if (simDefenderSelect) {
        simDefenderSelect.addEventListener('change', (e) => {
            updatePokemonStats('sim-defender', e.target.value);
        });
    }
}

// ポケモン入力の処理
function handlePokemonInput(prefix, inputElement) {
    const inputValue = inputElement.value;

    // 入力値をそのまま使用
    const cleanName = inputValue.trim();

    if (!cleanName) {
        // 入力がクリアされた場合
        inputElement.dataset.pokemonId = '';
        updatePokemonMoves(prefix, null);
        updatePokemonStats(prefix, null);
        return;
    }

    // ポケモン名からIDを検索
    const pokemonIndex = damageCalcPokemonNames.findIndex(name => name === cleanName);

    if (pokemonIndex !== -1) {
        const pokemonId = pokemonIndex + 1;
        inputElement.dataset.pokemonId = pokemonId;

        if (prefix === 'calc-attacker') {
            updatePokemonMoves(prefix, pokemonId);
        }
        updatePokemonStats(prefix, pokemonId);
    } else {
        // 一致するポケモンが見つからない場合
        inputElement.dataset.pokemonId = '';
    }
}

// ポケモンの技リストを更新
function updatePokemonMoves(prefix, pokemonId) {
    if (!pokemonId || !damageCalcDetailData) return;

    const moveSelect = prefix === 'calc-attacker' ?
        document.getElementById('calc-move') :
        document.getElementById('sim-attacker-move');

    if (!moveSelect) return;

    // ポケモン名を取得
    const pokemonName = damageCalcPokemonNames[pokemonId - 1];
    if (!pokemonName) return;

    // ポケモンの詳細データを取得
    const pokemon = damageCalcDetailData[pokemonName];
    if (!pokemon || !pokemon.moves) {
        moveSelect.innerHTML = '<option value="">技データなし</option>';
        return;
    }

    // よく使われる技のリスト（仮のデータ）
    const commonMoves = getCommonMoves(pokemonName);

    // 技のオプションを作成
    const moveOptions = commonMoves.map(move => {
        return `<option value="${move}">${move}</option>`;
    }).join('');

    moveSelect.innerHTML = '<option value="">技を選択</option>' + moveOptions;
}

// よく使われる技を取得（仮のデータ）
function getCommonMoves(pokemonName) {
    // 実際はポケモンごとに使用率の高い技を返すべき
    const moveDatabase = {
        'ディンルー': ['じしん', 'ヘビーボンバー', 'がんせきふうじ', 'ステルスロック'],
        'パオジアン': ['つららおとし', 'かみくだく', 'せいなるつるぎ', 'こおりのつぶて'],
        'コライドン': ['ドラゴンクロー', 'フレアドライブ', 'とんぼがえり', 'かげうち'],
        'バドレックス': ['アストラルビット', 'サイコキネシス', 'ドレインキッス', 'トリックルーム'],
        'ミライドン': ['10まんボルト', 'りゅうせいぐん', 'パラボラチャージ', 'ボルトチェンジ'],
        'ハバタクカミ': ['ムーンフォース', 'シャドーボール', 'マジカルフレイム', 'でんじは']
    };

    return moveDatabase[pokemonName] || ['たいあたり', 'ひっかく', 'なきごえ', 'しっぽをふる'];
}

// ポケモンのステータスを更新
function updatePokemonStats(prefix, pokemonId) {
    if (!pokemonId || !damageCalcDetailData) return;

    const pokemonName = damageCalcPokemonNames[pokemonId - 1];
    if (!pokemonName) return;

    const pokemon = damageCalcDetailData[pokemonName];
    if (!pokemon || !pokemon.stats) return;

    // ステータスのデフォルト値を設定（レベル50固定）
    if (prefix === 'calc-attacker' || prefix === 'sim-attacker') {
        const atkInput = document.getElementById(`${prefix === 'calc-attacker' ? 'calc-attacker-atk-actual' : 'sim-attacker-atk'}`);
        const spatkInput = document.getElementById(`${prefix === 'calc-attacker' ? 'calc-attacker-spatk-actual' : 'sim-attacker-spatk'}`);

        if (atkInput) {
            // 攻撃の実数値を計算
            const atk = calculateStat(pokemon.stats.attack || 100, 31, 252, 1.1);
            if (prefix === 'calc-attacker') {
                atkInput.textContent = `実数値: ${atk}`;
            } else {
                atkInput.placeholder = atk;
            }
        }

        if (spatkInput) {
            const spatk = calculateStat(pokemon.stats.sp_attack || 100, 31, 252, 1.1);
            if (prefix === 'calc-attacker') {
                spatkInput.textContent = `実数値: ${spatk}`;
            } else {
                spatkInput.placeholder = spatk;
            }
        }
    } else {
        const hpInput = document.getElementById(`${prefix === 'calc-defender' ? 'calc-defender-hp-actual' : 'sim-defender-hp'}`);
        const defInput = document.getElementById(`${prefix === 'calc-defender' ? 'calc-defender-def-actual' : 'sim-defender-def'}`);
        const spdefInput = document.getElementById(`${prefix === 'calc-defender' ? 'calc-defender-spdef-actual' : 'sim-defender-spdef'}`);

        if (hpInput) {
            const hp = calculateStatHP(pokemon.stats.hp || 100, 31, 252);
            if (prefix === 'calc-defender') {
                hpInput.textContent = `実数値: ${hp}`;
            } else {
                hpInput.placeholder = hp;
            }
        }

        if (defInput) {
            const def = calculateStat(pokemon.stats.defense || 100, 31, 0, 1.1);
            if (prefix === 'calc-defender') {
                defInput.textContent = `実数値: ${def}`;
            } else {
                defInput.placeholder = def;
            }
        }

        if (spdefInput) {
            const spdef = calculateStat(pokemon.stats.sp_defense || 100, 31, 0, 1.0);
            if (prefix === 'calc-defender') {
                spdefInput.textContent = `実数値: ${spdef}`;
            } else {
                spdefInput.placeholder = spdef;
            }
        }
    }
}

// ステータス計算（HP以外）レベル50固定
function calculateStat(base, iv, ev, natureBoost = 1.0) {
    const level = 50;
    return Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level / 100 + 5) * natureBoost);
}

// HP計算 レベル50固定
function calculateStatHP(base, iv, ev) {
    const level = 50;
    return Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100 + level + 10);
}

// グローバル関数として定義（HTMLから呼び出し用）
window.calculateDamage = function() {
    const attackerInput = document.getElementById('calc-attacker-pokemon');
    const defenderInput = document.getElementById('calc-defender-pokemon');
    const attackerPokemon = attackerInput.dataset.pokemonId;
    const defenderPokemon = defenderInput.dataset.pokemonId;
    const move = document.getElementById('calc-move').value;

    if (!attackerPokemon || !defenderPokemon || !move) {
        alert('ポケモンと技を選択してください');
        return;
    }

    // ダメージ計算ロジック（仮の実装）
    const minDamage = Math.floor(Math.random() * 50) + 30;
    const maxDamage = minDamage + 15;

    const resultDiv = document.getElementById('calc-result');
    if (resultDiv) {
        document.getElementById('calc-damage-range').textContent = `ダメージ: ${minDamage} ~ ${maxDamage}`;
        document.getElementById('calc-percentage').textContent = `割合: ${minDamage}% ~ ${maxDamage}%`;
        document.getElementById('calc-ko-chance').textContent = maxDamage >= 100 ? '確定1発' : maxDamage >= 50 ? '確定2発' : '確定3発';
    }
};

// タブ切り替え時の初期化
document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み時に初期化を実行
    console.log('Damage calc script loaded');

    // 初回ロード時にデータを読み込んでおく
    setTimeout(async () => {
        if (!damageCalcRankingData || !damageCalcPokemonNames) {
            console.log('Pre-loading damage calc data...');
            await loadDamageCalcData();
        }
    }, 100);

    const damageCalcTab = document.querySelector('[data-tab="damage-calc"]');
    if (damageCalcTab) {
        damageCalcTab.addEventListener('click', async () => {
            console.log('Damage calc tab clicked');
            if (!damageCalcRankingData || !damageCalcPokemonNames) {
                await loadDamageCalcData();
            }
            // タブ切り替え後に初期化
            setTimeout(() => {
                initializeDamageCalculator();
            }, 100);
        });
    }

    const battleSimTab = document.querySelector('[data-tab="battle-simulator"]');
    if (battleSimTab) {
        battleSimTab.addEventListener('click', async () => {
            console.log('Battle sim tab clicked');
            if (!damageCalcRankingData || !damageCalcPokemonNames) {
                await loadDamageCalcData();
            }
            // タブ切り替え後に初期化
            setTimeout(() => {
                initializeDamageCalculator();
            }, 100);
        });
    }
});