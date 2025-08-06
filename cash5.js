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
        const div = document.getElementById('cash5-twox-tab-results');
        if (!div) return;
        const selected = window.cash5SelectedTwox || [];
        if (!selected.length) {
            div.innerHTML = '<div style="color:#888;font-size:1.1em;">Select balls to see all pairs, trios, quads, and fives found in historical draws.</div>';
            return;
        }
        // Helper to get all unique k-combinations from arr
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
        // Build frequency maps for each group size
        let groupSizes = [2, 3, 4, 5];
        let tables = [];
        for (let k of groupSizes) {
            if (selected.length < k) continue;
            let combos = getCombos(selected, k);
            let freqMap = new Map();
            // For each draw, increment count for matching combos
            (window.cash5DrawRows||[]).forEach(draw => {
                let mainSet = new Set(draw.mainArr);
                combos.forEach(combo => {
                    if (combo.every(n => mainSet.has(n))) {
                        let key = combo.join('-');
                        freqMap.set(key, (freqMap.get(key)||0)+1);
                    }
                });
            });
            // Only show combos that appear at least once
            let freqArr = Array.from(freqMap.entries()).filter(([combo,count])=>count>0);
            if (freqArr.length > 0) {
                // Sort by highest count, then numerically
                freqArr.sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],undefined,{numeric:true}));
                let table = `<h3 style='margin-top:18px;'>Combinations of ${k}</h3>`;
                table += `<table class='results-table'><thead><tr><th>Combo</th><th>Count</th></tr></thead><tbody>`;
                freqArr.forEach(([combo, count]) => {
                    table += `<tr><td>${combo.split('-').map(num=>`<span class='ball' style='background:#e74c3c;color:#fff;margin:0 2px;'>${num}</span>`).join('')}</td><td>${count}</td></tr>`;
                });
                table += '</tbody></table>';
                tables.push(table);
            }
        }
        if (tables.length === 0) {
            div.innerHTML = `<div style='color:#aaa; margin-bottom:12px;'>No combinations found in history for selected balls.</div>`;
        } else {
            div.innerHTML = tables.join('');
        }
    }

    // --- 2x Tab: Frequency Tables ---
    // ... (frequency tables code here, omitted for brevity, but can be copied if needed) ...

    // --- New Tab: Ball Panel & Results ---
    window.cash5SelectedNew = [];
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
        let html = `<table class='results-table'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Power-Up</th></tr></thead><tbody>`;
        (window.cash5DrawRows||[]).forEach(draw => {
            if (window.cash5SelectedNew.length === 0 || window.cash5SelectedNew.every(n => draw.mainArr.includes(n))) {
                html += `<tr><td>${draw.date||''}</td><td>${draw.mainArr.join('-')}</td><td>${draw.multiplier||''}</td></tr>`;
            }
        });
        html += '</tbody></table>';
        div.innerHTML = html;
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
        });
    }
});