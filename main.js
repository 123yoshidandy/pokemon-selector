window.addEventListener('load', init);


async function init() {
    document.getElementById("f0").value = "カイリュー";
    document.getElementById("f1").value = "セグレイブ";
    document.getElementById("f2").value = "ドドゲザン";
    document.getElementById("f3").value = "サーフゴー";
    document.getElementById("f4").value = "ハバタクカミ";
    document.getElementById("f5").value = "テツノツツミ";

    document.getElementById("e0").value = "カイリュー";
    document.getElementById("e1").value = "セグレイブ";
    document.getElementById("e2").value = "ドドゲザン";
    document.getElementById("e3").value = "サーフゴー";
    document.getElementById("e4").value = "ハバタクカミ";
    document.getElementById("e5").value = "テツノツツミ";
}

async function buttonClick() {
    pokedex = await fetch("pokedex.json", {
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
    for (name of friends.concat(enemies)) {
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
        document.getElementById("score_f" + String(i)).textContent = scores_f[i];
        document.getElementById("score_e" + String(i)).textContent = scores_e[i];
    }

    // 相手のポケモンたちの情報取得のためのリンク
    var links = document.getElementById('links');
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
        types = []
        for (type of response.types) {
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
        stats = []
        for (stat of response.stats) {
            stats.push(stat.base_stat)
        }
        return stats;
    })
}

function getScores(teamA, teamB, types) {
    let scores = [];
    for (memberA of teamA) {

        // 相手の各ポケモンに対する有利度を計上する
        let sum = 0;
        for (memberB of teamB) {
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
    for (atk of types_atk) {
        effective_tmp = 1;
        for (def of types_def) {
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
    for (let i = 0; i < 6; i++) {
        document.getElementById("f" + String(i)).value = "";
        document.getElementById("score_f" + String(i)).textContent = "";
        document.getElementById("score_e" + String(i)).textContent = "";
    }
}

function onReset2() {
    for (let i = 0; i < 6; i++) {
        document.getElementById("e" + String(i)).value = "";
        document.getElementById("score_f" + String(i)).textContent = "";
        document.getElementById("score_e" + String(i)).textContent = "";
    }
}