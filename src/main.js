window.addEventListener('load', init);

let homeData = null;
let detailData = null;

console.log('[main.js] Script loaded successfully');


async function init() {
    try {
        const [home, detail, ranking] = await Promise.all([
            fetch('/data/pokemon_home_data.json').then(r => r.json()),
            fetch('/data/pokemon_detail_data.json').then(r => r.json()),
            fetch('/data/pokemon_ranking.json').then(r => r.json())
        ]);
        homeData = home;
        detailData = detail;

        // 選出率トップ6を相手パーティのデフォルトに設定
        const topPokemon = [
            "ディンルー",    // ID:1003
            "パオジアン",    // ID:1002
            "コライドン",    // ID:1007
            "バドレックス",  // ID:898 form:2
            "ミライドン",    // ID:1008
            "ハバタクカミ"   // ID:987
        ];

        // 相手パーティをトップ6に設定
        topPokemon.forEach((name, i) => {
            document.getElementById("e" + i).value = name;
        });

    } catch (error) {
        console.error('Failed to load additional data:', error);
    }

    // 自分のパーティのデフォルト値を設定
    const myDefaultParty = [
        "マスカーニャ",
        "ラウドボーン",
        "ウェーニバル",
        "フシギバナ",
        "リザードン",
        "カメックス"
    ];

    myDefaultParty.forEach((name, i) => {
        document.getElementById("f" + i).value = name;
    });
}

async function buttonClick() {
    const pokedex = await fetch("/pokedex.json", {
    }).then(response => {
        return response.json();
    });

    // フォームの入力情報を取得
    let friends = [];
    let enemies = [];
    for (let i = 0; i < 6; i++) {
        friends.push(pokedex[document.getElementById("f" + String(i)).value]["en"]);
        enemies.push(pokedex[document.getElementById("e" + String(i)).value]["en"]);
    }

    console.log("friends");
    console.log(friends);
    console.log("enemies");
    console.log(enemies);


    // 入力されたポケモンのタイプを取得
    let types = {};
    for (const name of friends.concat(enemies)) {
        types[name] = await getType(name);
    }

    console.log("types");
    console.log(types);

    // 手持ちの各ポケモンに対して、タイプ相性により選出スコアを算出
    let scores_f = getScores(friends, enemies, types);
    console.log("scores_f");
    console.log(scores_f);

    // 同様に相手ポケモンのスコアも算出
    let scores_e = getScores(enemies, friends, types);
    console.log("scores_e");
    console.log(scores_e);

    // 結果表示
    for (let i = 0; i < scores_f.length; i++) {
        const scoreF = document.getElementById("score_f" + String(i));
        const scoreE = document.getElementById("score_e" + String(i));

        scoreF.textContent = scores_f[i];
        scoreE.textContent = scores_e[i];

        // スコアに応じて色分け
        if (scores_f[i] > 3) {
            scoreF.className = 'score-positive';
        } else if (scores_f[i] < -3) {
            scoreF.className = 'score-negative';
        } else {
            scoreF.className = 'score-neutral';
        }

        if (scores_e[i] > 3) {
            scoreE.className = 'score-positive';
        } else if (scores_e[i] < -3) {
            scoreE.className = 'score-negative';
        } else {
            scoreE.className = 'score-neutral';
        }
    }

    // 分析サマリーを表示
    displayAnalysisSummary(friends, enemies, scores_f, scores_e);

    // 相手のポケモンたちの情報取得のためのリンク
    var links = document.getElementById('links');
    while (links.rows.length > 0) {
        links.deleteRow(-1);
    }

    var tr = links.insertRow(-1);
    var td = tr.insertCell(-1);
    var td = tr.insertCell(-1);
    td.textContent = "H";
    var td = tr.insertCell(-1);
    td.textContent = "A";
    var td = tr.insertCell(-1);
    td.textContent = "B";
    var td = tr.insertCell(-1);
    td.textContent = "C";
    var td = tr.insertCell(-1);
    td.textContent = "D";
    var td = tr.insertCell(-1);
    td.textContent = "S";

    for (let i = 0; i < enemies.length; i++) {
        var tr = links.insertRow(-1);

        var td = tr.insertCell(-1);
        td.textContent = document.getElementById("e" + String(i)).value;

        var stats = await getStats(enemies[i]);
        for (const stat of stats) {
            var td = tr.insertCell(-1);
            td.textContent = String(stat);
            if (stat >= 120) {
                td.style.backgroundColor = "#ff4444";
            } else if (stat >= 100) {
                td.style.backgroundColor = "#ff6666";
            } else if (stat >= 80) {
                td.style.backgroundColor = "#ff8888";
            } else if (stat >= 60) {
                td.style.backgroundColor = "#ffaaaa";
            }
        }

        var td = tr.insertCell(-1);
        var a = document.createElement('a');
        td.appendChild(a);
        var linkText = document.createTextNode("DB");
        a.appendChild(linkText);
        a.href = "https://sv.pokedb.tokyo/pokemon/show/" + String(pokedex[document.getElementById("e" + String(i)).value]["id"]).padStart(4, "0") + "-00";

        var td = tr.insertCell(-1);
        var a = document.createElement('a');
        td.appendChild(a);
        var linkText = document.createTextNode("Wiki");
        a.appendChild(linkText);
        a.href = "https://latest.pokewiki.net/" + document.getElementById("e" + String(i)).value;
    }
}

function getType(name) {
    return fetch("https://pokeapi.co/api/v2/pokemon/" + name, {
    }).then(response => {
        return response.json();
    }).then(response => {
        console.log(name);
        console.log(response);
        const types = []
        for (const type of response.types) {
            types.push(type.type.name)
        }
        return types;
    })
}

function getStats(name) {
    return fetch("https://pokeapi.co/api/v2/pokemon/" + name, {
    }).then(response => {
        return response.json();
    }).then(response => {
        console.log(name);
        console.log(response);
        const stats = []
        for (const stat of response.stats) {
            stats.push(stat.base_stat)
        }
        return stats;
    })
}

function getScores(teamA, teamB, types) {
    let scores = [];
    for (const memberA of teamA) {

        // 相手の各ポケモンに対する有利度を計上する
        let sum = 0;
        for (const memberB of teamB) {
            sum = sum + getEffective(types[memberA], types[memberB]) - getEffective(types[memberB], types[memberA]);
        }

        scores.push(sum);
    }

    return scores;
}

function getEffective(types_atk, types_def) {
    let effective = 0;

    const typeEffective = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1], // ノーマル
        [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1], // ほのお
        [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1], // みず
        [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1], // でんき
        [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1], // くさ
        [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1], // こおり
        [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5], // かくとう
        [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2], // どく
        [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1], // じめん
        [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1], // ひこう
        [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1], // エスパー
        [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5], // むし
        [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1], // いわ
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1], // ゴースト
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0], // ドラゴン
        [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5], // あく
        [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2], // はがね
        [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1], // フェアリー
    ];

    // 攻撃側のタイプのダメージの倍率を算出
    for (const atk of types_atk) {
        let effective_tmp = 1;
        for (const def of types_def) {
            effective_tmp = effective_tmp * typeEffective[type2id(atk)][type2id(def)];
        }
        effective = effective + effective_tmp;
    }

    return effective;
}

function type2id(type) {
    return ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"].indexOf(type);
}

function onReset1() {
    // 自分のパーティをデフォルト値にリセット
    const myDefaultParty = [
        "マスカーニャ",
        "ラウドボーン",
        "ウェーニバル",
        "フシギバナ",
        "リザードン",
        "カメックス"
    ];

    for (let i = 0; i < 6; i++) {
        document.getElementById("f" + String(i)).value = myDefaultParty[i];
        document.getElementById("score_f" + String(i)).textContent = "";
        document.getElementById("score_e" + String(i)).textContent = "";
    }
}

function onReset2() {
    // 相手パーティを選出率トップ6にリセット
    const topPokemon = [
        "ディンルー",
        "パオジアン",
        "コライドン",
        "バドレックス",
        "ミライドン",
        "ハバタクカミ"
    ];

    for (let i = 0; i < 6; i++) {
        document.getElementById("e" + String(i)).value = topPokemon[i];
        document.getElementById("score_f" + String(i)).textContent = "";
        document.getElementById("score_e" + String(i)).textContent = "";
    }
}

function displayAnalysisSummary(friends, enemies, scoresF, scoresE) {
    const summaryDiv = document.getElementById('analysis-summary');
    if (!summaryDiv) return;

    summaryDiv.innerHTML = '';

    const totalF = scoresF.reduce((a, b) => a + b, 0);
    const totalE = scoresE.reduce((a, b) => a + b, 0);

    const summaryHTML = `
        <div class="analysis-item">
            <strong>総合スコア:</strong>
            自分: <span class="${totalF > 0 ? 'score-positive' : totalF < 0 ? 'score-negative' : 'score-neutral'}">${totalF}</span>
            / 相手: <span class="${totalE > 0 ? 'score-positive' : totalE < 0 ? 'score-negative' : 'score-neutral'}">${totalE}</span>
        </div>
        <div class="analysis-item">
            <strong>推奨選出（自分）:</strong>
            ${getTopPokemon(friends, scoresF, 3).join(', ')}
        </div>
        <div class="analysis-item">
            <strong>警戒すべきポケモン（相手）:</strong>
            ${getTopPokemon(enemies, scoresE, 3).join(', ')}
        </div>
    `;

    summaryDiv.innerHTML = summaryHTML;
}

function getTopPokemon(pokemon, scores, count) {
    const indexed = pokemon.map((p, i) => ({ name: p, score: scores[i], index: i }));
    indexed.sort((a, b) => b.score - a.score);

    const japaneseNames = indexed.slice(0, count).map((item) => {
        const fieldId = pokemon === friends ? 'f' : 'e';
        const name = document.getElementById(fieldId + item.index).value;
        return name || item.name;
    });

    return japaneseNames;
}

let friends = [];
let enemies = [];

// グローバルスコープに関数を公開
window.buttonClick = buttonClick;
window.onReset1 = onReset1;
window.onReset2 = onReset2;