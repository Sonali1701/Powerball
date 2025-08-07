// Cash 5 Analyzer & Generator Logic
// Assumes 'Cash5_results(Andrea) - SCEL_Results.csv' is the data file

document.addEventListener('DOMContentLoaded', function() {
    // --- Notes auto-save logic ---
    const noteConfigs = [
        { textarea: 'cash5-note-textarea-combo', key: 'cash5_notes_combo' },
        { textarea: 'cash5-note-textarea-2x', key: 'cash5_notes_2x' },
        { textarea: 'cash5-note-textarea-new', key: 'cash5_notes_new' }
    ];
    noteConfigs.forEach(cfg => {
        const ta = document.getElementById(cfg.textarea);
        if (ta && localStorage.getItem(cfg.key)) ta.value = localStorage.getItem(cfg.key);
        if (ta) ta.addEventListener('input', () => localStorage.setItem(cfg.key, ta.value));
    });
    function saveAllNotes() { 
        noteConfigs.forEach(cfg => {
            const ta = document.getElementById(cfg.textarea);
            if (ta) localStorage.setItem(cfg.key, ta.value);
        });
    }
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', saveAllNotes);
    });

    // --- Tab switching logic ---
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            const tabId = btn.getAttribute('data-tab');
            const tabContent = document.getElementById('tab-' + tabId);
            if (tabContent) tabContent.style.display = 'block';
            if (tabId === 'combo') {
                renderCash5ComboBallPanel();
                renderCash5ComboResults();
            }
            if (tabId === '2x') {
                renderCash5TwoxBallPanel();
                renderCash5TwoxResults();
            }
            if (tabId === 'new') {
                renderCash5NewBallPanel();
                renderCash5NewResults();
            }
        });
    });

    // --- Load and parse CSV data ---
    fetch('Cash5.csv')
        .then(response => response.text())
        .then(csv => {
            Papa.parse(csv, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    // --- Robustly trim all header fields and values ---
                    const trimObj = obj => {
                        const out = {};
                        Object.keys(obj).forEach(k => {
                            out[k.trim()] = (typeof obj[k] === 'string') ? obj[k].trim() : obj[k];
                        });
                        return out;
                    };
                    const trimmedData = results.data.map(trimObj);
                    window.cash5Results = trimmedData;
                    window.cash5DrawRows = trimmedData.map(row => {
                        let arr = (row["Winning Numbers"]||"").split(/[-,\s]+/).map(x=>parseInt(x,10)).filter(x=>!isNaN(x));
                        return {
                            date: row["Date"],
                            mainArr: arr,
                            multiplier: row["Multiplier"],
                            row: row
                        };
                    });
                    renderCash5ComboBallPanel();
                    renderCash5TwoxBallPanel();
                    renderCash5NewBallPanel();
                }
            });
        });

    // --- Combo Tab: Ball Panel & Results ---
    window.cash5SelectedCombo = [];
    function renderCash5ComboBallPanel() {
        const panel = document.getElementById('cash5-combo-ball-panel');
        if (!panel) return;
        let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
        for (let i = 1; i <= 38; i++) {
            html += `<span class="ball${window.cash5SelectedCombo.includes(i)?' selected':''}" data-ball="${i}">${i}</span>`;
        }
        html += '</div></div>';
        panel.innerHTML = html;
        panel.querySelectorAll('.ball').forEach(ball => {
            ball.onclick = function() {
                const n = parseInt(ball.getAttribute('data-ball'));
                if (window.cash5SelectedCombo.includes(n)) {
                    window.cash5SelectedCombo = window.cash5SelectedCombo.filter(x=>x!==n);
                } else {
                    window.cash5SelectedCombo.push(n);
                } // No selection limit
                renderCash5ComboBallPanel();
                renderCash5ComboResults();
            };
        });
    }
    function renderCash5ComboResults() {
        const div = document.getElementById('cash5-combo-tab-results');
        if (!div) return;
        let html = `<table class='results-table'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Multiplier</th><th>Matches</th></tr></thead><tbody>`;
        const selected = window.cash5SelectedCombo || [];
        let hasMatches = false;
        (window.cash5DrawRows||[]).forEach(draw => {
            let matches = selected.filter(n => draw.mainArr.includes(n)).length;
            if (matches > 0) hasMatches = true;
            html += `<tr><td>${draw.date||''}</td><td>${draw.mainArr.map(n => selected.includes(n) ? `<span class='ball selected'>${n}</span>` : n).join('-')}</td><td>${draw.multiplier||''}</td><td>${matches}</td></tr>`;
        });
        html += '</tbody></table>';
        if (!hasMatches && selected.length > 0) {
            html = `<div style='color:#aaa; margin-bottom:12px;'>No draws contain any of the selected balls.</div>`;
        }
        div.innerHTML = html;
    }

    // --- 2x Tab: Ball Panel & Results ---
    window.cash5SelectedTwox = [];
    function renderCash5TwoxBallPanel() {
        const panel = document.getElementById('cash5-twox-ball-panel');
        if (!panel) return;
        let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
        for (let i = 1; i <= 38; i++) {
            html += `<span class="ball${window.cash5SelectedTwox.includes(i)?' selected':''}" data-ball="${i}">${i}</span>`;
        }
        html += '</div></div>';
        panel.innerHTML = html;
        panel.querySelectorAll('.ball').forEach(ball => {
            ball.onclick = function() {
                const n = parseInt(ball.getAttribute('data-ball'));
                if (window.cash5SelectedTwox.includes(n)) {
                    window.cash5SelectedTwox = window.cash5SelectedTwox.filter(x=>x!==n);
                } else {
                    window.cash5SelectedTwox.push(n);
                } // No selection limit
                renderCash5TwoxBallPanel();
                renderCash5TwoxResults();
            };
        });
    }
    function renderCash5TwoxResults() {
        const div = document.getElementById('cash5-twox-results');
        if (!div) return;
        const selected = window.cash5SelectedTwox || [];
        let html = '';
        if (selected.length === 0) {
            html = '<div style="color:#888; margin:18px 0;">Select balls to see all combinations and their draw dates.</div>';
            div.innerHTML = html;
            return;
        }
        // Helper to get all unique k-combinations from arr
        function getCombinations(arr, k) {
            const results = [];
            function helper(start, combo) {
                if (combo.length === k) {
                    results.push(combo.slice().sort((a,b)=>a-b));
                    return;
                }
                for (let i = start; i < arr.length; i++) {
                    combo.push(arr[i]);
                    helper(i+1, combo);
                    combo.pop();
                }
            }
            helper(0, []);
            return results;
        }
        let groupSizes = [2, 3, 4, 5];
        let foundAny = false;
        for (let k of groupSizes) {
            if (selected.length < k) continue;
            const combos = getCombinations(selected, k);
            let combosWithDates = [];
            combos.forEach(combo => {
                // Find all draws where this combo appeared
                const draws = (window.cash5DrawRows||[]).filter(draw => combo.every(n => draw.mainArr.includes(n)));
                if (draws.length > 0) {
                    combosWithDates.push({combo, draws});
                }
            });
            if (combosWithDates.length > 0) {
                foundAny = true;
                html += `<h3 style='margin-top:18px;'>Combinations of ${k}</h3>`;
                combosWithDates.forEach(({combo, draws}, idx) => {
                    // Sort draws descending by date (most recent first)
                    const drawsSorted = draws.slice().sort((a, b) => {
                        // Assume date is MM/DD/YYYY
                        const da = a.date ? a.date.split('/').reverse().join('') : '';
                        const db = b.date ? b.date.split('/').reverse().join('') : '';
                        return db.localeCompare(da);
                    });
                    const recentDraws = drawsSorted.slice(0, 5);
                    const count = draws.length;
                    const comboId = `combo-${k}-${combo.join('-')}`;
                    html += `<div class='twox-combo-row'><span class='twox-combo-label'>${combo.map(num => `<span class='ball' style='background:#e74c3c;color:#fff;margin:0 2px;'>${num}</span>`).join(' ')} <span style='font-weight:normal; color:#555;'>(Count: ${count})</span></span></div>`;
                    html += `<table class='results-table' id='${comboId}-table'><thead><tr><th>Date</th><th>Combination</th></tr></thead><tbody>`;
                    recentDraws.forEach(draw => {
                        let ballsHtml = combo.map(num => `<span class='ball' style='background:#e74c3c;color:#fff;margin:0 2px;'>${num}</span>`).join(' ');
                        html += `<tr><td>${draw.date||''}</td><td>${ballsHtml}</td></tr>`;
                    });
                    html += '</tbody></table>';
                    if (count > 5) {
                        html += `<button class='show-more-btn' id='${comboId}-showmore' style='margin-bottom:16px;'>Show More</button>`;
                    }
                    // Store drawsSorted for this combo in a global object for event handler access
                    window.cash5TwoxAllDraws = window.cash5TwoxAllDraws || {};
                    window.cash5TwoxAllDraws[comboId] = drawsSorted;
                });
            }
        }
        if (!foundAny) {
            html += `<div style='color:#aaa; margin-bottom:12px;'>No combinations of 2, 3, 4, or 5 from your selection were found in history.</div>`;
        }
        div.innerHTML = html;

        // [C5TWX_SHOWMORE] Attach Show More/Less button logic for each combo
// Store expanded/collapsed state for each combo at module scope
window.cash5TwoxExpandState = window.cash5TwoxExpandState || {};
setTimeout(() => {
    const allBtns = div.querySelectorAll('.show-more-btn');
    allBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const comboId = btn.id.replace('-showmore', '');
            const table = document.getElementById(comboId+'-table');
            const draws = (window.cash5TwoxAllDraws && window.cash5TwoxAllDraws[comboId]) || [];
            // Extract combo from comboId
            let combo = comboId.split('-').slice(2).map(Number);
            // Always use the correct ballsHtml for the combo
            let ballsHtml = combo.map(num => `<span class='ball' style='background:#e74c3c;color:#fff;margin:0 2px;'>${num}</span>`).join(' ');
            // Toggle state
            window.cash5TwoxExpandState[comboId] = !window.cash5TwoxExpandState[comboId];
            // Re-render tbody
            let rowsHtml = '';
            let showAll = window.cash5TwoxExpandState[comboId];
            let count = showAll ? draws.length : Math.min(5, draws.length);
            for (let i = 0; i < count; i++) {
                rowsHtml += `<tr><td>${draws[i].date||''}</td><td>${ballsHtml}</td></tr>`;
            }
            table.querySelector('tbody').innerHTML = rowsHtml;
            btn.textContent = showAll ? 'Show Less' : 'Show More';
        });
    });
}, 0);
}

// --- New Tab: Ball Panel & Results ---
window.cash5SelectedNew = [];

// --- Cash 5 Random Tab: Generator Features ---
function generateCash5UniqueNumbers(count, min, max, exclude=[]) {
    const nums = [];
    while (nums.length < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!nums.includes(num) && !exclude.includes(num)) {
            nums.push(num);
        }
    }
    return nums.sort((a, b) => a - b);
}

function renderCash5Combinations(n) {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '12px';
    table.innerHTML = `
        <tr>
            <th style="text-align:left; padding:8px 0; border-bottom:1px solid #eee;">#</th>
            <th style="text-align:left; padding:8px 0; border-bottom:1px solid #eee;">Numbers</th>
        </tr>
    `;
    for (let i = 0; i < n; i++) {
        const mainNumbers = generateCash5UniqueNumbers(5, 1, 38);
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f5f5f5';
        tr.innerHTML = `
            <td style="padding:10px 0; color:#666;">${i + 1}.</td>
            <td style="padding:10px 0; font-weight:bold; color:#27ae60;">
                ${mainNumbers.map(num => `<span class='ball selected' style='margin:0 6px;font-size:1.3em;'>${num}</span>`).join('')}
            </td>
        `;
        table.appendChild(tr);
    }
    const container = document.getElementById('cash5-generated-table');
    if (container) {
        container.innerHTML = '';
        container.appendChild(table);
    }
}

// --- Utility: Get all pairs and trios from historical draws ---
function getCash5PairsAndTrios(draws) {
    const pairCounts = new Map();
    const trioCounts = new Map();
    draws.forEach(drawArr => {
        const sorted = [...drawArr].sort((a,b)=>a-b);
        // Pairs
        for (let i=0; i<sorted.length; i++) {
            for (let j=i+1; j<sorted.length; j++) {
                const key = [sorted[i], sorted[j]].join('-');
                pairCounts.set(key, (pairCounts.get(key)||0)+1);
            }
        }
        // Trios
        for (let i=0; i<sorted.length; i++) {
            for (let j=i+1; j<sorted.length; j++) {
                for (let k=j+1; k<sorted.length; k++) {
                    const key = [sorted[i], sorted[j], sorted[k]].join('-');
                    trioCounts.set(key, (trioCounts.get(key)||0)+1);
                }
            }
        }
    });
    return {pairs: pairCounts, trios: trioCounts};
}

function populateCash5DuoTrioDropdowns(draws) {
    const {pairs, trios} = getCash5PairsAndTrios(draws);
    // Sort by frequency descending, show all
    const sortedPairs = Array.from(pairs.entries()).sort((a,b)=>b[1]-a[1]);
    const sortedTrios = Array.from(trios.entries()).sort((a,b)=>b[1]-a[1]);
    // Populate duos
    const duo1 = document.getElementById('cash5-duo1-select');
    const duo2 = document.getElementById('cash5-duo2-select');
    const comboDuo = document.getElementById('cash5-combo-duo-select');
    const comboTrio = document.getElementById('cash5-combo-trio-select');
    if (duo1 && duo2) {
        duo1.innerHTML = '<option value="">Select First Duo</option>';
        duo2.innerHTML = '<option value="">Select Second Duo</option>';
        sortedPairs.forEach(([pair, count]) => {
            const opt = document.createElement('option');
            opt.value = pair;
            opt.textContent = `${pair.replace(/-/g,' - ')} (${count}×)`;
            duo1.appendChild(opt.cloneNode(true));
            duo2.appendChild(opt);
        });
        duo1.selectedIndex = -1;
        duo2.selectedIndex = -1;
    }
    if (comboDuo && comboTrio) {
        comboDuo.innerHTML = '<option value="">Select Duo</option>';
        comboTrio.innerHTML = '<option value="">Select Trio</option>';
        sortedPairs.forEach(([pair, count]) => {
            const opt = document.createElement('option');
            opt.value = pair;
            opt.textContent = `${pair.replace(/-/g,' - ')} (${count}×)`;
            comboDuo.appendChild(opt);
        });
        sortedTrios.forEach(([trio, count]) => {
            const opt = document.createElement('option');
            opt.value = trio;
            opt.textContent = `${trio.replace(/-/g,' - ')} (${count}×)`;
            comboTrio.appendChild(opt);
        });
        comboDuo.selectedIndex = -1;
        comboTrio.selectedIndex = -1;
    }
}

// --- Cash 5 Random Tab Event Handlers ---
document.addEventListener('DOMContentLoaded', function() {
    // Multi-gen
    document.querySelectorAll('.cash5-multi-gen-btn').forEach(btn => {
        btn.onclick = function() {
            renderCash5Combinations(parseInt(btn.getAttribute('data-count')));
        };
    });
    // Clear duos
    const clearDuoBtn = document.getElementById('cash5-clear-duo-selection-btn');
    if (clearDuoBtn) {
        clearDuoBtn.onclick = function() {
            const duo1 = document.getElementById('cash5-duo1-select');
            const duo2 = document.getElementById('cash5-duo2-select');
            duo1.selectedIndex = -1;
            duo2.selectedIndex = -1;
            document.getElementById('cash5-built-duo-combo-result').innerHTML = '';
            document.getElementById('cash5-build-duo-combo-btn').disabled = true;
        };
    }
    // Clear combo
    const clearComboBtn = document.getElementById('cash5-clear-combo-selection-btn');
    if (clearComboBtn) {
        clearComboBtn.onclick = function() {
            const duo = document.getElementById('cash5-combo-duo-select');
            const trio = document.getElementById('cash5-combo-trio-select');
            duo.selectedIndex = -1;
            trio.selectedIndex = -1;
            document.getElementById('cash5-built-combo-result').innerHTML = '';
            document.getElementById('cash5-build-combo-btn').disabled = true;
        };
    }
    // Enable/disable build buttons
    const buildDuoBtn = document.getElementById('cash5-build-duo-combo-btn');
    const duo1 = document.getElementById('cash5-duo1-select');
    const duo2 = document.getElementById('cash5-duo2-select');
    if (buildDuoBtn && duo1 && duo2) {
        [duo1, duo2].forEach(sel => sel.addEventListener('change', function() {
            buildDuoBtn.disabled = !(duo1.value && duo2.value);
        }));
        buildDuoBtn.onclick = function() {
            const d1 = duo1.value.split('-').map(Number);
            const d2 = duo2.value.split('-').map(Number);
            if (d1.length===2 && d2.length===2) {
                const combined = [...new Set([...d1, ...d2])];
                if (combined.length === 4) {
                    document.getElementById('cash5-built-duo-combo-result').innerHTML =
                        `<div class="result-card fade-in"><div class="result-title">Generated Combination</div><div class="result-balls">${combined.sort((a,b)=>a-b).map(n=>`<span class='ball selected'>${n}</span>`).join(' ')}</div></div>`;
                    return;
                }
            }
            alert('Please select two valid duos to combine');
        };
    }
    // Enable/disable build combo
    const buildComboBtn = document.getElementById('cash5-build-combo-btn');
    const comboDuo = document.getElementById('cash5-combo-duo-select');
    const comboTrio = document.getElementById('cash5-combo-trio-select');
    if (buildComboBtn && comboDuo && comboTrio) {
        [comboDuo, comboTrio].forEach(sel => sel.addEventListener('change', function() {
            buildComboBtn.disabled = !(comboDuo.value && comboTrio.value);
        }));
        buildComboBtn.onclick = function() {
            const d = comboDuo.value.split('-').map(Number);
            const t = comboTrio.value.split('-').map(Number);
            if (d.length===2 && t.length===3) {
                const combined = [...new Set([...d, ...t])];
                if (combined.length === 5) {
                    document.getElementById('cash5-built-combo-result').innerHTML =
                        `<div class="result-card fade-in"><div class="result-title">Generated Combination</div><div class="result-balls">${combined.sort((a,b)=>a-b).map(n=>`<span class='ball selected'>${n}</span>`).join(' ')}</div></div>`;
                    return;
                }
            }
            alert('Please select a valid duo and trio to combine');
        };
    }
    // Populate dropdowns from historical draws if available
    if (window.cash5DrawRows && Array.isArray(window.cash5DrawRows)) {
        const draws = window.cash5DrawRows.map(d=>d.mainArr);
        populateCash5DuoTrioDropdowns(draws);
    }
});

function renderCash5NewBallPanel() {
    const panel = document.getElementById('cash5-new-ball-panel');
    if (!panel) return;
    let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
    for (let i = 1; i <= 38; i++) {
        html += `<span class="ball${window.cash5SelectedNew.includes(i)?' selected':''}" data-ball="${i}">${i}</span>`;
    }
    html += '</div></div>';
    panel.innerHTML = html;
    panel.querySelectorAll('.ball').forEach(ball => {
        ball.onclick = function() {
            const n = parseInt(ball.getAttribute('data-ball'));
            if (window.cash5SelectedNew.includes(n)) {
                window.cash5SelectedNew = window.cash5SelectedNew.filter(x=>x!==n);
            } else {
                window.cash5SelectedNew.push(n);
            } // No selection limit
            renderCash5NewBallPanel();
            renderCash5NewResults();
        };
    });
}
function renderCash5NewResults() {
    const div = document.getElementById('cash5-new-tab-results');
    if (!div) return;
    const selected = window.cash5SelectedNew || [];
    let html = `<table class='results-table'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Matches</th></tr></thead><tbody>`;
    (window.cash5DrawRows||[]).forEach(draw => {
            ball.onclick = function() {
                const n = parseInt(ball.getAttribute('data-ball'));
                if (window.cash5SelectedNew.includes(n)) {
                    window.cash5SelectedNew = window.cash5SelectedNew.filter(x=>x!==n);
                } else {
                    window.cash5SelectedNew.push(n);
                } // No selection limit
                renderCash5NewBallPanel();
                renderCash5NewResults();
            };
        });
    }
    function renderCash5NewResults() {
        const div = document.getElementById('cash5-new-tab-results');
        if (!div) return;
        const selected = window.cash5SelectedNew || [];
        let html = `<table class='results-table'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Matches</th></tr></thead><tbody>`;
        (window.cash5DrawRows||[]).forEach(draw => {
            // Only show draws with at least one match if any balls are selected
            const matchCount = selected.filter(n => draw.mainArr.includes(n)).length;
            if (selected.length === 0 || matchCount > 0) {
                let ballsHtml = draw.mainArr.map(num =>
                    selected.includes(num)
                        ? `<span class="ball selected">${num}</span>`
                        : `<span class="plain-number">${num}</span>`
                ).join(' ');
                html += `<tr><td>${draw.date||''}</td><td>${ballsHtml}</td><td>${matchCount}</td></tr>`;
            }
        });
        html += '</tbody></table>';
        div.innerHTML = html;
        // Attach click handler to all .plain-number spans
        div.querySelectorAll('.plain-number').forEach(el => {
            el.style.cursor = 'pointer';
            el.addEventListener('click', function() {
                const num = parseInt(el.textContent, 10);
                if (!isNaN(num) && !selected.includes(num)) {
                    window.cash5SelectedNew.push(num);
                    renderCash5NewBallPanel();
                    renderCash5NewResults();
                }
            });
        });
    }

    // Search functionality for New tab
    const searchBox = document.getElementById('cash5-search-box');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            const query = searchBox.value.trim().toLowerCase();
            const filtered = (window.cash5DrawRows || []).filter(draw => {
                return (
                    (draw.date && draw.date.toLowerCase().includes(query)) ||
                    (draw.mainArr && draw.mainArr.join('-').includes(query)) ||
                    (draw.multiplier && draw.multiplier.toLowerCase().includes(query))
                );
            });
            // Render filtered results in the New tab
            const div = document.getElementById('cash5-new-tab-results');
            if (!div) return;
            let html = `<table class='results-table'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Power-Up</th></tr></thead><tbody>`;
            filtered.forEach(draw => {
                html += `<tr><td>${draw.date||''}</td><td>${draw.mainArr.join('-')}</td><td>${draw.multiplier||''}</td></tr>`;
            });
            html += '</tbody></table>';
            div.innerHTML = html;
        // Only attach handler if the frequency table (pairs/trios) is rendered
        if (html.includes('Pair/Trio') && html.includes('Count')) {
            (function attachTwoxDateHandlers() {
                const tableRows = div.querySelectorAll('.results-table tbody tr');
                if (tableRows.length > 0) {
                    let datesDiv = document.getElementById('cash5-twox-dates');
                    if (!datesDiv) {
                        datesDiv = document.createElement('div');
                        datesDiv.id = 'cash5-twox-dates';
                        datesDiv.style.marginTop = '18px';
                        div.parentNode.insertBefore(datesDiv, div.nextSibling);
                    }
                    datesDiv.style.display = 'none';
                    tableRows.forEach(row => {
                        row.style.cursor = 'pointer';
                        row.onclick = function() {
                            // --- Powerball-style Cash5 2x click handler ---
// Build combo->draws map once
if (!window.cash5TwoxComboDraws) {
    window.cash5TwoxComboDraws = {};
    function getCombos(arr, k) {
        const results = [];
        function helper(start, combo) {
            if (combo.length === k) {
                results.push(combo.slice().sort((a,b)=>a-b));
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                helper(i + 1, combo);
                combo.pop();
            }
        }
        helper(0, []);
        return results;
    }
    (window.cash5DrawRows||[]).forEach(draw => {
        [2,3].forEach(k => {
            const combos = getCombos(draw.mainArr, k);
            combos.forEach(combo => {
                const key = combo.slice().sort((a,b)=>a-b).join('-');
                if (!window.cash5TwoxComboDraws[key]) window.cash5TwoxComboDraws[key] = [];
                window.cash5TwoxComboDraws[key].push(draw);
            });
        });
    });
}
// Extract numbers from the combo cell
const comboCell = row.querySelector('td');
const comboNums = Array.from(comboCell.querySelectorAll('.ball')).map(el => Number(el.textContent)).sort((a,b)=>a-b);
const comboKey = comboNums.join('-');
const draws = window.cash5TwoxComboDraws[comboKey] || [];
let comboString = comboNums.join(' ');
let dateHtml = `<div style='margin-bottom:8px;'><b>${comboString}</b> appeared in these draws:</div>`;
dateHtml += `<table class='results-table'><thead><tr><th>Date</th><th>Combination</th></tr></thead><tbody>`;
draws.forEach(draw => {
    let ballsHtml = comboNums.map(num => `<span class='ball' style='background:#e74c3c;color:#fff;margin:0 2px;'>${num}</span>`).join(' ');
    dateHtml += `<tr><td>${draw.date||''}</td><td>${ballsHtml}</td></tr>`;
});
dateHtml += '</tbody></table>';
dateHtml += `<button id='cash5-twox-hide-dates-btn' style='margin-top:8px;'>Hide</button>`;
datesDiv.innerHTML = dateHtml;
datesDiv.style.display = 'block';
document.getElementById('cash5-twox-hide-dates-btn').onclick = ()=>{datesDiv.style.display='none';};
                        };
                    });
                }
            })();
        }

        });
    }
});