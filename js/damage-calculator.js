// ポケモンダメージ計算とバトルシミュレーション

/**
 * ポケモンのダメージ計算
 * 第9世代（SV）の計算式を使用
 */
class DamageCalculator {
    /**
     * ダメージ計算のメイン関数
     * @param {Object} attacker - 攻撃側のポケモン
     * @param {Object} defender - 防御側のポケモン
     * @param {Object} move - 使用する技
     * @returns {Object} ダメージ計算結果
     */
    static calculate(attacker, defender, move) {
        // レベル（通常は50で計算）
        const level = attacker.level || 50;

        // 攻撃/特攻の実数値を取得
        const attack = move.category === 'physical'
            ? this.calculateStat(attacker.stats.attack, attacker.evs?.attack || 0, attacker.ivs?.attack || 31, level, attacker.nature?.attack || 1.0)
            : this.calculateStat(attacker.stats.specialAttack, attacker.evs?.specialAttack || 0, attacker.ivs?.specialAttack || 31, level, attacker.nature?.specialAttack || 1.0);

        // 防御/特防の実数値を取得
        const defense = move.category === 'physical'
            ? this.calculateStat(defender.stats.defense, defender.evs?.defense || 0, defender.ivs?.defense || 31, level, defender.nature?.defense || 1.0)
            : this.calculateStat(defender.stats.specialDefense, defender.evs?.specialDefense || 0, defender.ivs?.specialDefense || 31, level, defender.nature?.specialDefense || 1.0);

        // 技の威力
        const power = move.power || 0;

        // 基本ダメージ計算
        let damage = Math.floor(Math.floor(Math.floor(level * 2 / 5 + 2) * power * attack / defense) / 50) + 2;

        // 各種補正を適用

        // 乱数（0.85〜1.00）
        const randomFactors = [];
        for (let i = 85; i <= 100; i++) {
            randomFactors.push(i / 100);
        }

        // タイプ一致ボーナス（STAB）
        const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;

        // タイプ相性
        const effectiveness = this.calculateTypeEffectiveness(move.type, defender.types);

        // テラスタル補正（仮実装）
        const teraBonus = attacker.teraType === move.type ? 1.5 : 1.0;

        // 最小・最大ダメージを計算
        const minDamage = Math.floor(damage * stab * effectiveness * teraBonus * 0.85);
        const maxDamage = Math.floor(damage * stab * effectiveness * teraBonus * 1.00);

        // HPに対する割合
        const defenderHP = this.calculateHP(defender.stats.hp, defender.evs?.hp || 0, defender.ivs?.hp || 31, level);
        const minPercent = (minDamage / defenderHP * 100).toFixed(1);
        const maxPercent = (maxDamage / defenderHP * 100).toFixed(1);

        // 確定数を計算
        const minKO = Math.ceil(defenderHP / maxDamage);
        const maxKO = Math.ceil(defenderHP / minDamage);

        return {
            damage: {
                min: minDamage,
                max: maxDamage,
                average: Math.floor((minDamage + maxDamage) / 2)
            },
            percentage: {
                min: minPercent,
                max: maxPercent
            },
            ko: {
                min: minKO,
                max: maxKO,
                text: minKO === maxKO ? `確定${minKO}発` : `乱数${minKO}〜${maxKO}発`
            },
            effectiveness: effectiveness,
            stab: stab > 1.0
        };
    }

    /**
     * ステータスの実数値を計算
     */
    static calculateStat(base, ev, iv, level, natureModifier = 1.0) {
        const stat = Math.floor((Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureModifier);
        return stat;
    }

    /**
     * HPの実数値を計算
     */
    static calculateHP(base, ev, iv, level) {
        const hp = Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
        return hp;
    }

    /**
     * タイプ相性を計算
     */
    static calculateTypeEffectiveness(attackType, defenderTypes) {
        const typeChart = {
            'normal': {'rock': 0.5, 'ghost': 0, 'steel': 0.5},
            'fire': {'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 2, 'bug': 2, 'rock': 0.5, 'dragon': 0.5, 'steel': 2},
            'water': {'fire': 2, 'water': 0.5, 'grass': 0.5, 'ground': 2, 'rock': 2, 'dragon': 0.5},
            'electric': {'water': 2, 'electric': 0.5, 'grass': 0.5, 'ground': 0, 'flying': 2, 'dragon': 0.5},
            'grass': {'fire': 0.5, 'water': 2, 'grass': 0.5, 'poison': 0.5, 'ground': 2, 'flying': 0.5, 'bug': 0.5, 'rock': 2, 'dragon': 0.5, 'steel': 0.5},
            'ice': {'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 0.5, 'ground': 2, 'flying': 2, 'dragon': 2, 'steel': 0.5},
            'fighting': {'normal': 2, 'ice': 2, 'poison': 0.5, 'flying': 0.5, 'psychic': 0.5, 'bug': 0.5, 'rock': 2, 'ghost': 0, 'dark': 2, 'steel': 2, 'fairy': 0.5},
            'poison': {'grass': 2, 'poison': 0.5, 'ground': 0.5, 'rock': 0.5, 'ghost': 0.5, 'steel': 0, 'fairy': 2},
            'ground': {'fire': 2, 'electric': 2, 'grass': 0.5, 'poison': 2, 'flying': 0, 'bug': 0.5, 'rock': 2, 'steel': 2},
            'flying': {'electric': 0.5, 'grass': 2, 'fighting': 2, 'bug': 2, 'rock': 0.5, 'steel': 0.5},
            'psychic': {'fighting': 2, 'poison': 2, 'psychic': 0.5, 'dark': 0, 'steel': 0.5},
            'bug': {'fire': 0.5, 'grass': 2, 'fighting': 0.5, 'poison': 0.5, 'flying': 0.5, 'psychic': 2, 'ghost': 0.5, 'dark': 2, 'steel': 0.5, 'fairy': 0.5},
            'rock': {'fire': 2, 'ice': 2, 'fighting': 0.5, 'ground': 0.5, 'flying': 2, 'bug': 2, 'steel': 0.5},
            'ghost': {'normal': 0, 'psychic': 2, 'ghost': 2, 'dark': 0.5},
            'dragon': {'dragon': 2, 'steel': 0.5, 'fairy': 0},
            'dark': {'fighting': 0.5, 'psychic': 2, 'ghost': 2, 'dark': 0.5, 'fairy': 0.5},
            'steel': {'fire': 0.5, 'water': 0.5, 'electric': 0.5, 'ice': 2, 'rock': 2, 'steel': 0.5, 'fairy': 2},
            'fairy': {'fire': 0.5, 'fighting': 2, 'poison': 0.5, 'dragon': 2, 'dark': 2, 'steel': 0.5}
        };

        let effectiveness = 1.0;
        for (const defType of defenderTypes) {
            if (typeChart[attackType] && typeChart[attackType][defType] !== undefined) {
                effectiveness *= typeChart[attackType][defType];
            }
        }

        return effectiveness;
    }
}

/**
 * バトルシミュレーター
 */
class BattleSimulator {
    /**
     * 1対1の対面をシミュレート
     */
    static async simulate(pokemon1, pokemon2) {
        // PokeAPIからステータスを取得
        const [data1, data2] = await Promise.all([
            this.fetchPokemonData(pokemon1),
            this.fetchPokemonData(pokemon2)
        ]);

        if (!data1 || !data2) {
            return { error: 'ポケモンデータの取得に失敗しました' };
        }

        // 素早さ判定
        const speed1 = DamageCalculator.calculateStat(data1.stats.speed, 0, 31, 50);
        const speed2 = DamageCalculator.calculateStat(data2.stats.speed, 0, 31, 50);

        const faster = speed1 > speed2 ? pokemon1 : speed1 < speed2 ? pokemon2 : 'same';

        // 主要な技でのダメージ計算（仮の技データ）
        const moves1 = this.getCommonMoves(data1);
        const moves2 = this.getCommonMoves(data2);

        const damages1to2 = [];
        const damages2to1 = [];

        // 各技でのダメージを計算
        for (const move of moves1) {
            const result = DamageCalculator.calculate(data1, data2, move);
            damages1to2.push({
                move: move,
                result: result
            });
        }

        for (const move of moves2) {
            const result = DamageCalculator.calculate(data2, data1, move);
            damages2to1.push({
                move: move,
                result: result
            });
        }

        // 対面の有利不利を総合的に判定
        const advantage = this.judgeAdvantage(damages1to2, damages2to1, speed1, speed2);

        return {
            pokemon1: {
                name: pokemon1,
                stats: data1.stats,
                speed: speed1,
                types: data1.types,
                damages: damages1to2
            },
            pokemon2: {
                name: pokemon2,
                stats: data2.stats,
                speed: speed2,
                types: data2.types,
                damages: damages2to1
            },
            faster: faster,
            advantage: advantage
        };
    }

    /**
     * PokeAPIからポケモンデータを取得
     */
    static async fetchPokemonData(pokemonName) {
        try {
            // 日本語名から英語名に変換
            const enName = window.pokedexData?.[pokemonName]?.en;
            if (!enName) return null;

            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${enName.toLowerCase()}`);
            if (!response.ok) return null;

            const data = await response.json();

            return {
                name: pokemonName,
                types: data.types.map(t => t.type.name),
                stats: {
                    hp: data.stats[0].base_stat,
                    attack: data.stats[1].base_stat,
                    defense: data.stats[2].base_stat,
                    specialAttack: data.stats[3].base_stat,
                    specialDefense: data.stats[4].base_stat,
                    speed: data.stats[5].base_stat
                },
                evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
                ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
                level: 50
            };
        } catch (error) {
            console.error(`Failed to fetch data for ${pokemonName}:`, error);
            return null;
        }
    }

    /**
     * よく使われる技を推定（仮実装）
     */
    static getCommonMoves(pokemonData) {
        const moves = [];

        // 物理型か特殊型かを判定
        const isPhysical = pokemonData.stats.attack > pokemonData.stats.specialAttack;

        // タイプ一致技を追加（仮の威力）
        for (const type of pokemonData.types) {
            moves.push({
                name: `${type}技`,
                type: type,
                power: isPhysical ? 90 : 90,
                category: isPhysical ? 'physical' : 'special'
            });
        }

        // サブウェポンを追加（仮）
        if (isPhysical) {
            moves.push({ name: '地震', type: 'ground', power: 100, category: 'physical' });
            moves.push({ name: 'ストーンエッジ', type: 'rock', power: 100, category: 'physical' });
        } else {
            moves.push({ name: '10万ボルト', type: 'electric', power: 90, category: 'special' });
            moves.push({ name: 'れいとうビーム', type: 'ice', power: 90, category: 'special' });
        }

        return moves;
    }

    /**
     * 対面の有利不利を判定
     */
    static judgeAdvantage(damages1to2, damages2to1, speed1, speed2) {
        // 確定数の最小値を比較
        const minKO1 = Math.min(...damages1to2.map(d => d.result.ko.min));
        const minKO2 = Math.min(...damages2to1.map(d => d.result.ko.min));

        let score = 0;
        let reasons = [];

        // 確定数で判定
        if (minKO1 < minKO2) {
            score += 3;
            reasons.push(`${minKO1}発で倒せる（相手は${minKO2}発）`);
        } else if (minKO1 > minKO2) {
            score -= 3;
            reasons.push(`相手の方が早く倒せる（${minKO2}発 vs ${minKO1}発）`);
        }

        // 素早さで判定
        if (speed1 > speed2) {
            score += 2;
            reasons.push('素早さで勝っている');
        } else if (speed1 < speed2) {
            score -= 2;
            reasons.push('素早さで負けている');
        }

        // タイプ相性で判定
        const hasSuper1 = damages1to2.some(d => d.result.effectiveness > 1);
        const hasSuper2 = damages2to1.some(d => d.result.effectiveness > 1);

        if (hasSuper1 && !hasSuper2) {
            score += 2;
            reasons.push('効果抜群の技がある');
        } else if (!hasSuper1 && hasSuper2) {
            score -= 2;
            reasons.push('効果抜群を受ける');
        }

        return {
            score: score,
            judgment: score > 2 ? '有利' : score < -2 ? '不利' : '互角',
            reasons: reasons
        };
    }
}

// グローバルに公開
window.DamageCalculator = DamageCalculator;
window.BattleSimulator = BattleSimulator;