// バトルシミュレーションUI

/**
 * 対面シミュレーション画面を表示
 */
async function showBattleSimulation() {
    const modal = document.createElement('div');
    modal.id = 'battle-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    content.innerHTML = `
        <h2>対面シミュレーション</h2>
        <p>2匹のポケモンを選んで、1対1の対面をシミュレートします。</p>

        <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1;">
                <label>ポケモン1</label>
                <input type="text" id="sim-pokemon1" list="pokemon-list" style="width: 100%; padding: 8px; font-size: 16px;">
                <select id="sim-preset1" onchange="setPresetPokemon(1, this.value)" style="width: 100%; margin-top: 5px; padding: 5px;">
                    <option value="">自分のパーティから選択</option>
                    ${generatePartyOptions('f')}
                </select>
            </div>
            <div style="text-align: center; padding-top: 40px;">VS</div>
            <div style="flex: 1;">
                <label>ポケモン2</label>
                <input type="text" id="sim-pokemon2" list="pokemon-list" style="width: 100%; padding: 8px; font-size: 16px;">
                <select id="sim-preset2" onchange="setPresetPokemon(2, this.value)" style="width: 100%; margin-top: 5px; padding: 5px;">
                    <option value="">相手のパーティから選択</option>
                    ${generatePartyOptions('e')}
                </select>
            </div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <button onclick="runBattleSimulation()" style="padding: 10px 30px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                シミュレート実行
            </button>
            <button onclick="closeBattleModal()" style="padding: 10px 30px; font-size: 16px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                閉じる
            </button>
        </div>

        <div id="simulation-result"></div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // モーダル外クリックで閉じる
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeBattleModal();
        }
    };
}

/**
 * パーティからポケモンを選択するオプションを生成
 */
function generatePartyOptions(prefix) {
    let options = '';
    for (let i = 0; i < 6; i++) {
        const value = document.getElementById(`${prefix}${i}`).value;
        if (value) {
            options += `<option value="${value}">${value}</option>`;
        }
    }
    return options;
}

/**
 * プリセットからポケモンを設定
 */
window.setPresetPokemon = function(num, value) {
    if (value) {
        document.getElementById(`sim-pokemon${num}`).value = value;
    }
};

/**
 * バトルシミュレーションを実行
 */
window.runBattleSimulation = async function() {
    const pokemon1 = document.getElementById('sim-pokemon1').value;
    const pokemon2 = document.getElementById('sim-pokemon2').value;

    if (!pokemon1 || !pokemon2) {
        alert('両方のポケモンを入力してください');
        return;
    }

    const resultDiv = document.getElementById('simulation-result');
    resultDiv.innerHTML = '<p>計算中...</p>';

    try {
        const result = await BattleSimulator.simulate(pokemon1, pokemon2);

        if (result.error) {
            resultDiv.innerHTML = `<p style="color: red;">${result.error}</p>`;
            return;
        }

        // 結果を表示
        let html = '<h3>シミュレーション結果</h3>';

        // 素早さ判定
        html += '<div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">';
        html += '<h4>素早さ判定</h4>';
        html += `<p>${result.pokemon1.name}: S${result.pokemon1.speed}</p>`;
        html += `<p>${result.pokemon2.name}: S${result.pokemon2.speed}</p>`;
        if (result.faster !== 'same') {
            html += `<p style="font-weight: bold; color: #4CAF50;">→ ${result.faster}の方が速い</p>`;
        } else {
            html += '<p style="font-weight: bold;">→ 同速</p>';
        }
        html += '</div>';

        // ダメージ計算結果
        html += '<div style="display: flex; gap: 20px;">';

        // ポケモン1→2のダメージ
        html += '<div style="flex: 1; background: #e3f2fd; padding: 15px; border-radius: 5px;">';
        html += `<h4>${result.pokemon1.name} → ${result.pokemon2.name}</h4>`;
        html += displayDamageResults(result.pokemon1.damages);
        html += '</div>';

        // ポケモン2→1のダメージ
        html += '<div style="flex: 1; background: #fce4ec; padding: 15px; border-radius: 5px;">';
        html += `<h4>${result.pokemon2.name} → ${result.pokemon1.name}</h4>`;
        html += displayDamageResults(result.pokemon2.damages);
        html += '</div>';

        html += '</div>';

        // 総合判定
        html += '<div style="background: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">';
        html += '<h3>総合判定</h3>';
        const judgment = result.advantage.judgment;
        const color = judgment === '有利' ? '#4CAF50' : judgment === '不利' ? '#f44336' : '#ff9800';
        html += `<p style="font-size: 24px; font-weight: bold; color: ${color};">${result.pokemon1.name}が${judgment}</p>`;

        if (result.advantage.reasons.length > 0) {
            html += '<ul style="text-align: left; display: inline-block;">';
            for (const reason of result.advantage.reasons) {
                html += `<li>${reason}</li>`;
            }
            html += '</ul>';
        }
        html += '</div>';

        resultDiv.innerHTML = html;

    } catch (error) {
        console.error('Simulation error:', error);
        resultDiv.innerHTML = '<p style="color: red;">シミュレーション中にエラーが発生しました</p>';
    }
};

/**
 * ダメージ計算結果を表示
 */
function displayDamageResults(damages) {
    let html = '<div>';

    for (const damage of damages) {
        const effectiveness = damage.result.effectiveness;
        let effectText = '';
        let effectColor = '#666';

        if (effectiveness > 1) {
            effectText = '効果抜群';
            effectColor = '#4CAF50';
        } else if (effectiveness < 1) {
            effectText = effectiveness === 0 ? '効果なし' : '効果いまひとつ';
            effectColor = '#f44336';
        }

        html += `
            <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 3px;">
                <div style="font-weight: bold;">
                    ${damage.move.name} (威力${damage.move.power})
                    ${damage.result.stab ? '<span style="color: #2196F3;">[タイプ一致]</span>' : ''}
                    ${effectText ? `<span style="color: ${effectColor};">[${effectText}]</span>` : ''}
                </div>
                <div style="margin-top: 5px;">
                    ダメージ: ${damage.result.damage.min}〜${damage.result.damage.max}
                    (${damage.result.percentage.min}%〜${damage.result.percentage.max}%)
                </div>
                <div style="color: #666;">
                    ${damage.result.ko.text}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

/**
 * モーダルを閉じる
 */
window.closeBattleModal = function() {
    const modal = document.getElementById('battle-modal');
    if (modal) {
        modal.remove();
    }
};

// グローバルに公開
window.showBattleSimulation = showBattleSimulation;