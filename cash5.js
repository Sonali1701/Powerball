// Cash 5 Analyzer & Generator Logic
// Assumes 'Cash5_results(Andrea) - SCEL_Results.csv' is the data file

// Performance optimization utilities
const perf = {
    // Debounce function to limit how often a function can be called
    debounce: (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    // Throttle function to limit how often a function can be called
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Optimized forEach for large arrays
    batchProcess: (array, process, batchSize = 100, timeout = 50) => {
        let index = 0;
        const total = array.length;
        
        const processBatch = () => {
            const batchEnd = Math.min(index + batchSize, total);
            for (; index < batchEnd; index++) {
                process(array[index], index, array);
            }
            
            if (index < total) {
                setTimeout(processBatch, timeout);
            }
        };
        
        processBatch();
    }
};

// Cache DOM elements for better performance
const domCache = {
    comboResults: null,
    newResults: null,
    comboBallPanel: null,
    newBallPanel: null,
    twoxBallPanel: null,
    randomBallPanel: null,
    
    init: function() {
        this.comboResults = document.getElementById('cash5-combo-tab-results');
        this.newResults = document.getElementById('cash5-new-tab-results');
        this.comboBallPanel = document.getElementById('cash5-combo-ball-panel');
        this.newBallPanel = document.getElementById('cash5-new-ball-panel');
        this.twoxBallPanel = document.getElementById('cash5-twox-ball-panel');
        this.randomBallPanel = document.getElementById('cash5-random-ball-panel');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM cache
    domCache.init();
    // --- Download Notes Buttons (Combo, 2x, New) ---
    [
        { btn: 'cash5-download-note-btn-combo', textarea: 'cash5-note-textarea-combo', filename: 'cash5_combo_notes.txt' },
        { btn: 'cash5-download-note-btn-2x', textarea: 'cash5-note-textarea-2x', filename: 'cash5_2x_notes.txt' },
        { btn: 'cash5-download-note-btn-new', textarea: 'cash5-note-textarea-new', filename: 'cash5_new_notes.txt' }
    ].forEach(cfg => {
        const btn = document.getElementById(cfg.btn);
        if (btn) {
            btn.onclick = function() {
                const ta = document.getElementById(cfg.textarea);
                if (!ta || ta.value.trim() === '') {
                    alert('Your note is empty!');
                    return;
                }
                const blob = new Blob([ta.value], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = cfg.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };
        }
    });
    // --- Download CSV for Combo Tab ---
    function generateComboCSV(comboType) {
        if (!window.cash5DrawRows) {
            alert('Data not loaded yet!');
            return;
        }
        
        const comboSize = comboType === 'pairs' ? 2 : 
                         comboType === 'trios' ? 3 :
                         comboType === 'quads' ? 4 : 5;
        
        const comboCounts = new Map();
        const comboDraws = new Map();
        
        // Helper to get all k-combos
        function getCombos(arr, k) {
            const results = [];
            function helper(start, combo) {
                if (combo.length === k) {
                    results.push(combo.slice().sort((a,b) => a - b));
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

        // Process all draws
        (window.cash5DrawRows || []).forEach(draw => {
            const arr = draw.mainArr;
            if (!arr || arr.length < comboSize) return;
            
            getCombos(arr, comboSize).forEach(combo => {
                const key = combo.join('-');
                comboCounts.set(key, (comboCounts.get(key) || 0) + 1);
                if (!comboDraws.has(key)) comboDraws.set(key, []);
                comboDraws.get(key).push(draw.date);
            });
        });

        // Filter for combinations that appear 2+ times
        const filteredCombos = Array.from(comboCounts.entries())
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

        // Build CSV
        const csvRows = [['Combo', 'Count', 'Dates']];
        filteredCombos.forEach(([combo, count]) => {
            const datesStr = (comboDraws.get(combo) || []).join('; ');
            csvRows.push([combo.replace(/-/g, '-'), count, datesStr]);
        });

        const csvContent = csvRows.map(row => 
            row.map(val => {
                const str = String(val);
                if (str.includes('"')) return '"' + str.replace(/"/g, '""') + '"';
                if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
                    return '"' + str + '"';
                }
                return str;
            }).join(',')
        ).join('\r\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cash5_${comboType}_2plus.csv`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Set up event listeners for download buttons
    const pairsTriosBtn = document.getElementById('cash5-download-pairs-trios-csv-btn');
    if (pairsTriosBtn) {
        pairsTriosBtn.onclick = function() {
            // Original pairs and trios CSV generation
            if (!window.cash5DrawRows) {
                alert('Data not loaded yet!');
                return;
            }
            const pairCounts = new Map();
            const trioCounts = new Map();
            const pairDraws = new Map();
            const trioDraws = new Map();
            
            // Helper to get all k-combos
            function getCombos(arr, k) {
                const results = [];
                function helper(start, combo) {
                    if (combo.length === k) {
                        results.push(combo.slice().sort((a,b) => a - b));
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

            // Process all draws
            (window.cash5DrawRows || []).forEach(draw => {
                const arr = draw.mainArr;
                if (!arr || arr.length < 2) return;
                
                // Pairs
                getCombos(arr, 2).forEach(combo => {
                    const key = combo.join('-');
                    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
                    if (!pairDraws.has(key)) pairDraws.set(key, []);
                    pairDraws.get(key).push(draw.date);
                });
                
                // Trios
                if (arr.length >= 3) {
                    getCombos(arr, 3).forEach(combo => {
                        const key = combo.join('-');
                        trioCounts.set(key, (trioCounts.get(key) || 0) + 1);
                        if (!trioDraws.has(key)) trioDraws.set(key, []);
                        trioDraws.get(key).push(draw.date);
                    });
                }
            });

            // Build CSV
            const csvRows = [['Type', 'Combo', 'Count', 'Dates']];
            
            // Add pairs to CSV
            Array.from(pairCounts.entries())
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .forEach(([combo, count]) => {
                    const datesStr = (pairDraws.get(combo) || []).join('; ');
                    csvRows.push(['Pair', combo.replace(/-/g, '-'), count, datesStr]);
                });
            
            // Add trios to CSV
            Array.from(trioCounts.entries())
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .forEach(([combo, count]) => {
                    const datesStr = (trioDraws.get(combo) || []).join('; ');
                    csvRows.push(['Trio', combo.replace(/-/g, '-'), count, datesStr]);
                });

            const csvContent = csvRows.map(row => 
                row.map(val => {
                    const str = String(val);
                    if (str.includes('"')) return '"' + str.replace(/"/g, '""') + '"';
                    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
                        return '"' + str + '"';
                    }
                    return str;
                }).join(',')
            ).join('\r\n');

            // Create and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cash5_pairs_trios.csv';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        };
    }

    // Set up event listeners for quads and fives download buttons
    const quadsBtn = document.getElementById('cash5-download-quads-csv-btn');
    if (quadsBtn) {
        quadsBtn.onclick = () => generateComboCSV('quads');
    }

    const fivesBtn = document.getElementById('cash5-download-fives-csv-btn');
    if (fivesBtn) {
        fivesBtn.onclick = () => generateComboCSV('fives');
    }

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
                    if (typeof window.initCash5RandomTab === 'function') window.initCash5RandomTab();
                }
            });
        });

    // --- Combo Tab: Ball Panel & Results ---
    window.cash5SelectedCombo = [];
    // Cache for ball panels to avoid unnecessary re-renders
    const ballPanelCache = {
        combo: { lastSelected: null, html: '' },
        new: { lastSelected: null, html: '' },
        twox: { lastSelected: null, html: '' },
        random: { lastSelected: null, html: '' }
    };

    function renderCash5ComboBallPanel() {
        if (!domCache.comboBallPanel) return;
        
        const selected = window.cash5SelectedCombo || [];
        const selectedKey = selected.sort((a, b) => a - b).join(',');
        
        // Return cached result if selection hasn't changed
        if (ballPanelCache.combo.lastSelected === selectedKey) {
            domCache.comboBallPanel.innerHTML = ballPanelCache.combo.html;
            return;
        }
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.className = 'powerball-selection';
        container.innerHTML = '<div class="powerball-label">Select numbers</div><div class="powerball-grid"></div>';
        
        const grid = container.querySelector('.powerball-grid');
        
        // Create balls in batches to prevent UI freeze
        const createBalls = () => {
            const batchSize = 21; // Process 21 balls at a time (half of 42)
            let i = 1;
            
            const processBatch = () => {
                const batchEnd = Math.min(i + batchSize, 43); // 1-42 inclusive
                
                for (; i < batchEnd; i++) {
                    const ball = document.createElement('span');
                    ball.className = `ball${selected.includes(i) ? ' selected' : ''}`;
                    ball.textContent = i;
                    ball.setAttribute('data-ball', i);
                    grid.appendChild(ball);
                }
                
                if (i < 43) {
                    // Use setTimeout to allow UI updates between batches
                    setTimeout(processBatch, 0);
                } else {
                    // All balls created, update the DOM
                    fragment.appendChild(container);
                    domCache.comboBallPanel.innerHTML = '';
                    domCache.comboBallPanel.appendChild(fragment);
                    
                    // Cache the result
                    ballPanelCache.combo.lastSelected = selectedKey;
                    ballPanelCache.combo.html = domCache.comboBallPanel.innerHTML;
                    
                    // Add click handler to the grid (event delegation)
                    grid.addEventListener('click', function(e) {
                        const ball = e.target.closest('.ball');
                        if (!ball) return;
                        
                        const num = parseInt(ball.getAttribute('data-ball'), 10);
                        if (isNaN(num)) return;
                        
                        // Toggle selection
                        const index = selected.indexOf(num);
                        if (index > -1) {
                            selected.splice(index, 1);
                        } else {
                            selected.push(num);
                        }
                        
                        // Update UI
                        renderCash5ComboBallPanel();
                        renderCash5ComboResults();
                    });
                }
            };
            
            processBatch();
        };
        
        createBalls();
    }
    // Cache for combo results to avoid recalculating
    const comboResultsCache = {
        lastSelected: null,
        html: '',
        hasMatches: false
    };

    function renderCash5ComboResults() {
        if (!domCache.comboResults) return;
        
        const selected = window.cash5SelectedCombo || [];
        const selectedKey = selected.sort((a, b) => a - b).join(',');
        
        // Return cached result if selection hasn't changed
        if (comboResultsCache.lastSelected === selectedKey) {
            domCache.comboResults.innerHTML = comboResultsCache.html;
            return;
        }
        
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            let html = `<div class='result-meta'>Showing results from 2015 to 2025</div>`;
            html += `<table class='results-table cash5-wide results-table-interactive'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Multiplier</th></tr></thead><tbody>`;
            
            // Filter draws to only include 2015-2025 and sort by date (newest first)
            const draws = (window.cash5DrawRows || [])
                .filter(draw => {
                    if (!draw.date) return false;
                    const year = new Date(draw.date).getFullYear();
                    return year >= 2015 && year <= 2025;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));
                
            let hasMatches = false;
            
            // Process all matching draws
            draws.forEach(draw => {
                const matches = selected.length > 0 ? selected.filter(n => draw.mainArr.includes(n)).length : 0;
                if (selected.length === 0 || matches > 0) {
                    if (matches > 0) hasMatches = true;
                    html += `
                        <tr tabindex='0'>
                            <td>${draw.date||''}</td>
                            <td>${draw.mainArr.map(n => 
                                selected.includes(n) 
                                    ? `<span class='ball selected' data-ball='${n}'>${n}</span>` 
                                    : `<span class='plain-number' data-ball='${n}'>${n}</span>`
                            ).join('')}</td>
                            <td>${draw.multiplier||''}</td>
                        </tr>`;
                }
            });
            
            html += '</tbody></table>';
            if (!hasMatches && selected.length > 0) {
                html = `<div class='result-message'>No draws contain any of the selected balls.</div>`;
            }
            
            // Cache the result
            comboResultsCache.lastSelected = selectedKey;
            comboResultsCache.html = html;
            comboResultsCache.hasMatches = hasMatches;
            
            // Update the DOM
            domCache.comboResults.innerHTML = html;
            
            // Add click handlers to plain numbers
            addNumberClickHandlers(domCache.comboResults, 'cash5SelectedCombo');
        });
    }

    // --- 2x Tab: Ball Panel & Results ---
    window.cash5SelectedTwox = [];
    function renderCash5TwoxBallPanel() {
        const panel = document.getElementById('cash5-twox-ball-panel');
        if (!panel) return;
        let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
        for (let i = 1; i <= 42; i++) {
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
// All event handlers for the Random tab are now set up ONLY inside window.initCash5RandomTab, which is called after CSV load.
// This avoids duplicate/conflicting event handlers and ensures all elements exist.

// Function to filter dropdown options based on search input
function filterDropdownOptions(searchInput, selectId) {
    const searchTerm = searchInput.value.toLowerCase();
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Store all options if not already stored
    if (!select._options) {
        select._options = Array.from(select.options);
    }
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = selectId.includes('duo') ? 'Select Duo...' : 'Select Trio...';
    select.appendChild(defaultOption);
    
    // Filter and add matching options - match exact numbers
    select._options.forEach(option => {
        if (option.value === '') return;
        // Split the option text into individual numbers
        const numbers = option.textContent.trim().split(/\s+/);
        // Check if any of the numbers exactly match the search term
        const hasExactMatch = numbers.some(num => num === searchTerm);
        if (hasExactMatch) {
            select.appendChild(option.cloneNode(true));
        }
    });
    
    // Reset selection
    select.selectedIndex = 0;
}

window.initCash5RandomTab = function() {
    // Store the original draw data for filtering
    const allDraws = (window.cash5DrawRows||[]).map(d=>d.mainArr);
    
    // Populate dropdowns
    populateCash5DuoTrioDropdowns(allDraws);
    
    // Set up search functionality for duo1
    const duo1Search = document.getElementById('cash5-duo1-search');
    if (duo1Search) {
        duo1Search.addEventListener('input', () => {
            filterDropdownOptions(duo1Search, 'cash5-duo1-select');
        });
    }
    
    // Set up search functionality for duo2
    const duo2Search = document.getElementById('cash5-duo2-search');
    if (duo2Search) {
        duo2Search.addEventListener('input', () => {
            filterDropdownOptions(duo2Search, 'cash5-duo2-select');
        });
    }
    
    // Set up search functionality for combo duo
    const comboDuoSearch = document.getElementById('cash5-combo-duo-search');
    if (comboDuoSearch) {
        comboDuoSearch.addEventListener('input', () => {
            filterDropdownOptions(comboDuoSearch, 'cash5-combo-duo-select');
        });
    }
    
    // Set up search functionality for combo trio
    const comboTrioSearch = document.getElementById('cash5-combo-trio-search');
    if (comboTrioSearch) {
        comboTrioSearch.addEventListener('input', () => {
            filterDropdownOptions(comboTrioSearch, 'cash5-combo-trio-select');
        });
    }

    // Quick Random Generator buttons (Generate 4, 8, 16)
    document.querySelectorAll('.cash5-multi-gen-btn').forEach(btn => {
        btn.onclick = function() {
            const count = parseInt(btn.getAttribute('data-count'), 10);
            renderCash5Combinations(count);
        };
    });

    // Two Duos Generator
    const duo1 = document.getElementById('cash5-duo1-select');
    const duo2 = document.getElementById('cash5-duo2-select');
    const buildDuoComboBtn = document.getElementById('cash5-build-duo-combo-btn');
    const duoComboResult = document.getElementById('cash5-built-duo-combo-result');
    const clearDuoSelectionBtn = document.getElementById('cash5-clear-duo-selection-btn');

    function updateDuoComboBtn() {
        buildDuoComboBtn.disabled = !(duo1 && duo2 && duo1.value && duo2.value && duo1.value !== duo2.value);
    }
    if (duo1 && duo2 && buildDuoComboBtn) {
        duo1.onchange = duo2.onchange = updateDuoComboBtn;
        buildDuoComboBtn.onclick = function() {
            if (!(duo1.value && duo2.value && duo1.value !== duo2.value)) return;
            // Merge duos, ensure unique numbers, must be 4 numbers
            let nums = duo1.value.split('-').concat(duo2.value.split('-')).map(Number);
            nums = Array.from(new Set(nums));
            if (nums.length !== 4) {
                duoComboResult.innerHTML = '<div style="color:#e74c3c;">Selected duos must have 4 unique numbers.</div>';
                return;
            }
            // Generate 5th number
            let extra = generateCash5UniqueNumbers(1, 1, 38, nums)[0];
            let combo = nums.concat([extra]).sort((a,b)=>a-b);
            duoComboResult.innerHTML = `<div class='result-card'><div class='result-title'>Generated Combo:</div><div>${combo.map(n=>`<span class='ball selected' style='margin:0 6px;font-size:1.3em;'>${n}</span>`).join('')}</div></div>`;
        };
        clearDuoSelectionBtn.onclick = function() {
            duo1.selectedIndex = 0;
            duo2.selectedIndex = 0;
            duoComboResult.innerHTML = '';
            updateDuoComboBtn();
        };
        updateDuoComboBtn();
    }

    // Duo + Trio Generator
    const comboDuo = document.getElementById('cash5-combo-duo-select');
    const comboTrio = document.getElementById('cash5-combo-trio-select');
    const buildComboBtn = document.getElementById('cash5-build-combo-btn');
    const comboResult = document.getElementById('cash5-built-combo-result');
    const clearComboSelectionBtn = document.getElementById('cash5-clear-combo-selection-btn');

    function updateComboBtn() {
        buildComboBtn.disabled = !(comboDuo && comboTrio && comboDuo.value && comboTrio.value && !comboTrio.value.split('-').some(n => comboDuo.value.split('-').includes(n)));
    }
    if (comboDuo && comboTrio && buildComboBtn) {
        comboDuo.onchange = comboTrio.onchange = updateComboBtn;
        buildComboBtn.onclick = function() {
            if (!(comboDuo.value && comboTrio.value)) return;
            // Merge duo and trio, ensure unique numbers, must be 5 numbers
            let nums = comboDuo.value.split('-').concat(comboTrio.value.split('-')).map(Number);
            nums = Array.from(new Set(nums));
            if (nums.length !== 5) {
                comboResult.innerHTML = '<div style="color:#e74c3c;">Duo and Trio must combine to 5 unique numbers.</div>';
                return;
            }
            comboResult.innerHTML = `<div class='result-card'><div class='result-title'>Generated Combo:</div><div>${nums.map(n=>`<span class='ball selected' style='margin:0 6px;font-size:1.3em;'>${n}</span>`).join('')}</div></div>`;
        };
        clearComboSelectionBtn.onclick = function() {
            comboDuo.selectedIndex = 0;
            comboTrio.selectedIndex = 0;
            comboResult.innerHTML = '';
            updateComboBtn();
        };
        updateComboBtn();
    }
}

function renderCash5ComboBallPanel() {
    const panel = document.getElementById('cash5-combo-ball-panel');
    if (!panel) return;
    let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
    for (let i = 1; i <= 42; i++) {
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

function renderCash5TwoxBallPanel() {
    const panel = document.getElementById('cash5-twox-ball-panel');
    if (!panel) return;
    let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
    for (let i = 1; i <= 42; i++) {
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

function renderCash5NewBallPanel() {
    const panel = document.getElementById('cash5-new-ball-panel');
    if (!panel) return;
    let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
    for (let i = 1; i <= 42; i++) {
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

function renderCash5RandomBallPanel() {
    const panel = document.getElementById('cash5-random-ball-panel');
    if (!panel) return;
    let html = '<div class="powerball-selection"><div class="powerball-label">Select numbers</div><div class="powerball-grid">';
    for (let i = 1; i <= 42; i++) {
        html += `<span class="ball${window.cash5SelectedRandom.includes(i)?' selected':''}" data-ball="${i}">${i}</span>`;
    }
    html += '</div></div>';
    panel.innerHTML = html;
    panel.querySelectorAll('.ball').forEach(ball => {
        ball.onclick = function() {
            const n = parseInt(ball.getAttribute('data-ball'));
            if (window.cash5SelectedRandom.includes(n)) {
                window.cash5SelectedRandom = window.cash5SelectedRandom.filter(x=>x!==n);
            } else {
                window.cash5SelectedRandom.push(n);
            } // No selection limit
            renderCash5RandomBallPanel();
            renderCash5RandomResults();
        };
    });
}

    // Cache for new results to avoid recalculating
    const newResultsCache = {
        lastSelected: null,
        html: '',
        hasMatches: false
    };

    // Helper function to add click handlers to number elements
    function addNumberClickHandlers(container, selectionArrayName) {
        if (!container) return;
        
        // Use event delegation instead of adding individual handlers
        container.addEventListener('click', function(event) {
            const target = event.target.closest('.ball, .plain-number');
            if (!target) return;
            
            const num = parseInt(target.getAttribute('data-ball'), 10);
            if (isNaN(num)) return;
            
            // Get the appropriate selection array
            const selectionArray = window[selectionArrayName] || [];
            const index = selectionArray.indexOf(num);
            
            // Toggle selection
            if (index > -1) {
                selectionArray.splice(index, 1);
            } else {
                selectionArray.push(num);
            }
            
            // Update the UI based on which tab we're in
            if (selectionArrayName === 'cash5SelectedNew') {
                renderCash5NewBallPanel();
                renderCash5NewResults();
            } else if (selectionArrayName === 'cash5SelectedCombo') {
                renderCash5ComboBallPanel();
                renderCash5ComboResults();
            }
        });
    }

    function renderCash5NewResults() {
        if (!domCache.newResults) return;
        
        const selected = window.cash5SelectedNew || [];
        const selectedKey = selected.sort((a, b) => a - b).join(',');
        
        // Return cached result if selection hasn't changed
        if (newResultsCache.lastSelected === selectedKey) {
            domCache.newResults.innerHTML = newResultsCache.html;
            return;
        }
        
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            // Filter draws to only include 2024-2025 and sort by date (newest first)
            const allDraws = (window.cash5DrawRows || [])
                .filter(draw => {
                    if (!draw.date) return false;
                    const year = new Date(draw.date).getFullYear();
                    return year >= 2024 && year <= 2025;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));
                
            let html = `<div class='result-meta'>Showing results from 2024 to 2025</div>`;
            html += `<table class='results-table'><thead><tr><th>Date</th><th>Winning Numbers</th><th>Matches</th></tr></thead><tbody>`;
            
            // Filter based on selection
            const filteredDraws = allDraws.filter(draw => {
                if (selected.length === 0) return true;
                return selected.some(n => draw.mainArr.includes(n));
            });
            
            // Process all matching draws
            filteredDraws.forEach(draw => {
                const matchCount = selected.length > 0 ? selected.filter(n => draw.mainArr.includes(n)).length : 0;
                const ballsHtml = draw.mainArr.map(num => {
                    const isSelected = selected.includes(num);
                    const className = isSelected ? 'ball selected' : 'ball';
                    return `<span class="${className}" data-ball="${num}">${num}</span>`;
                }).join(' ');
                
                html += `
                    <tr>
                        <td>${draw.date || ''}</td>
                        <td class="number-cells">${ballsHtml}</td>
                        <td>${matchCount > 0 ? matchCount : ''}</td>
                    </tr>`;
            });
            
            html += '</tbody></table>';
            
            if (filteredDraws.length === 0) {
                html = '<p class="result-message">No matching draws found.</p>';
            }
            
            // Cache the result
            newResultsCache.lastSelected = selectedKey;
            newResultsCache.html = html;
            newResultsCache.hasMatches = filteredDraws.length > 0;
            
            // Update the DOM
            domCache.newResults.innerHTML = html;
            
            // Add click handlers using event delegation
            addNumberClickHandlers(domCache.newResults, 'cash5SelectedNew');
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