document.addEventListener('DOMContentLoaded', function() {
    // --- Auto-save notes logic ---
    const noteConfigs = [
        { textarea: 'note-textarea', key: 'notes_main' },
        { textarea: 'note-textarea-combo', key: 'notes_combo' },
        { textarea: 'note-textarea-new', key: 'notes_new' },
        { textarea: 'note-textarea-2x', key: 'notes_2x' },
    ];
    // Restore notes from localStorage on load
    noteConfigs.forEach(cfg => {
        const ta = document.getElementById(cfg.textarea);
        if (ta && localStorage.getItem(cfg.key)) {
            ta.value = localStorage.getItem(cfg.key);
        }
        if (ta) {
            ta.addEventListener('input', () => {
                localStorage.setItem(cfg.key, ta.value);
            });
        }
    });
    // Save all notes to localStorage
    function saveAllNotes() { 
        noteConfigs.forEach(cfg => {
            const ta = document.getElementById(cfg.textarea);
            if (ta) {
                localStorage.setItem(cfg.key, ta.value);
            }
        });
    }
    // On tab switch, auto-save notes
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', saveAllNotes);
    });

    // Tab switching logic for new tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            const tabId = btn.getAttribute('data-tab');
            const tabContent = document.getElementById('tab-' + tabId);
            if (tabContent) {
                tabContent.style.display = 'block';
                if (tabId === 'combo') renderComboBallPanel();
                if (tabId === 'new') {
                    renderNewBallPanel();
                    // Clear results
                    const resultsDiv = document.getElementById('new-tab-results');
                    if (resultsDiv) resultsDiv.innerHTML = '';
                }
            }
        });
    });
    fetch('powerball.csv')
        .then(response => response.text())
        .then(rawCsv => {
            // Clean the CSV: remove all quotes, trim spaces, standardize header
            let lines = rawCsv.split('\n').map(line => line.replace(/"/g, '').trim());
            // Fix header
            if (lines[0].toLowerCase().includes('date') && lines[0].toLowerCase().includes('winning numbers')) {
                lines[0] = 'Date,Winning Numbers,Powerball,PowerPlay';
            }
            // Trim spaces from each field
            lines = lines.map(line => line.split(',').map(f => f.trim()).join(','));
            const cleanedCsv = lines.join('\n');
            Papa.parse(cleanedCsv, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    const data = results.data;
                    // Remove reference to the removed results table
                    // const tbody = document.querySelector('#results-table tbody');
                    // if (tbody) tbody.innerHTML = '';
                    // --- Collect stats for each number (1-69) ---
                    const numberStats = {};
                    for (let n = 1; n <= 69; n++) {
                        numberStats[n] = { count: 0, dates: [] };
                    }
                    // Store draw rows for highlighting
                    const drawRows = [];
                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        let winNumbers = (row['Winning Numbers'] || '').replace(/®/g, '').toLowerCase().trim();
                        if (row.Date && (winNumbers.includes('powerball numbers') || winNumbers.match(/^(\d+\s*-\s*)+\d+$/))) {
                            // --- Main Numbers ---
                            let mainNumbers;
                            if (winNumbers.includes('powerball numbers')) {
                                mainNumbers = (row['Winning Numbers'] || '').replace(/.*Numbers\s*/i, '').replace(/®/g, '').trim();
                            } else {
                                mainNumbers = (row['Winning Numbers'] || '').replace(/®/g, '').trim();
                            }
                            const mainArr = mainNumbers.split(' - ').map(x => x.trim()).filter(Boolean);
                            mainArr.forEach(num => {
                                if (numberStats[num]) {
                                    numberStats[num].count++;
                                    numberStats[num].dates.push(row.Date);
                                }
                            });
                            const powerball = row['Powerball'] || '';
                            const powerplay = row['PowerPlay'] || '';
                            // --- Double Play ---
                            let doublePlayNumbers = '';
                            let doublePlayPowerball = '';
                            let doublePlayArr = [];
                            if (i + 1 < data.length) {
                                const nextRow = data[i + 1];
                                let nextWinNumbers = (nextRow['Winning Numbers'] || '').replace(/®/g, '').toLowerCase().trim();
                                if (nextWinNumbers.includes('double play numbers')) {
                                    // Labeled Double Play
                                    const dpNums = (nextRow['Winning Numbers'] || '').replace(/.*Numbers\s*/i, '').replace(/®/g, '').trim();
                                    doublePlayArr = dpNums.split(' - ').map(x => x.trim()).filter(Boolean);
                                    doublePlayArr.forEach(num => {
                                        if (numberStats[num]) {
                                            numberStats[num].count++;
                                            numberStats[num].dates.push(row.Date + ' (Double Play)');
                                        }
                                    });
                                    const numsArr = dpNums.split(' - ');
                                    if (numsArr.length > 0) {
                                        doublePlayPowerball = nextRow['Powerball'] || numsArr[numsArr.length - 1];
                                        doublePlayNumbers = numsArr.slice(0, numsArr.length - 1).join(' - ');
                                    }
                                    i++; // Skip the Double Play row in the next iteration
                                } else if (nextWinNumbers.match(/^(\d+\s*-\s*)+\d+$/)) {
                                    // Unlabeled Double Play (just numbers)
                                    const dpNums = (nextRow['Winning Numbers'] || '').replace(/®/g, '').trim();
                                    doublePlayArr = dpNums.split(' - ').map(x => x.trim()).filter(Boolean);
                                    doublePlayArr.forEach(num => {
                                        if (numberStats[num]) {
                                            numberStats[num].count++;
                                            numberStats[num].dates.push(row.Date + ' (Double Play)');
                                        }
                                    });
                                    const numsArr = dpNums.split(' - ');
                                    if (numsArr.length > 0) {
                                        doublePlayPowerball = nextRow['Powerball'] || numsArr[numsArr.length - 1];
                                        doublePlayNumbers = numsArr.slice(0, numsArr.length - 1).join(' - ');
                                    }
                                    i++; // Skip the Double Play row in the next iteration
                                }
                            }
                            // --- Render table row and store for highlighting ---
                            const tr = document.createElement('tr');
                            // Highlight cells if selected number is present (will be updated on click)
                            tr.innerHTML = `
                                <td>${row.Date}</td>
                                <td class="main-numbers">${mainNumbers}</td>
                                <td>${powerball}</td>
                                <td>${powerplay}</td>
                                <td class="dp-numbers">${doublePlayNumbers}</td>
                                <td>${doublePlayPowerball}</td>
                            `;
                            // tbody.appendChild(tr); // This line is removed
                            drawRows.push({
                                tr,
                                mainArr,
                                doublePlayArr,
                                date: row.Date,
                                mainNumbers,
                                doublePlayNumbers,
                                powerball,
                                doublePlayPowerball,
                                powerplay
                            });
                        }
                    }
                    // 1. Filter out draws before 2024 (fix: extract year from MM/DD/YYYY format)
                    // [MODIFIED] Show draws from 2016 through 2025 (inclusive) for 2x tab and others using filteredDrawRows
                    window.filteredDrawRows = drawRows.filter(draw => {
                        const dateStr = (draw.date || '').trim();
                        const parts = dateStr.split('/');
                        const year = parts.length === 3 ? parseInt(parts[2], 10) : 0;
                        return year >= 2016 && year <= 2025;
                    }); // <-- Now includes full history from 2016
                    console.log('[DEBUG] window.filteredDrawRows length:', window.filteredDrawRows.length);
                    if (window.filteredDrawRows.length > 0) console.log('[DEBUG] Sample window.filteredDrawRows:', window.filteredDrawRows.slice(0, 2));
                    // After filteredDrawRows is ready, render the combo table if present
                    if (document.getElementById('combo-results')) {
                        renderComboResultsHome([]);
                    }
                    // --- Render balls with color, tooltip, and count badge ---
                    const panel = document.getElementById('ball-panel');
                    panel.innerHTML = '';
                    // Make the panel taller and allow only vertical scroll
                    panel.style.height = 'calc(100vh - 60px)';
                    panel.style.overflowY = 'auto';
                    panel.style.overflowX = 'hidden';
                    panel.style.display = 'flex';
                    panel.style.flexWrap = 'wrap';
                    panel.style.alignContent = 'flex-start';
                    panel.style.maxWidth = 'none';

                    function getBallColor(n) {
                        // Gradient from blue (#3498db) to red (#e74c3c)
                        const percent = (n - 1) / 68;
                        const r = Math.round(52 + (231 - 52) * percent);
                        const g = Math.round(152 + (76 - 152) * percent);
                        const b = Math.round(219 + (60 - 219) * percent);
                        return `rgb(${r},${g},${b})`;
                    }
                    const selectedBalls = new Set();
                    // Update ball rendering for multi-select
                    for (let n = 1; n <= 69; n++) {
                        const ball = document.createElement('span');
                        ball.className = 'ball';
                        ball.textContent = n;
                        ball.style.background = '#fff';
                        ball.style.color = '#222';
                        ball.style.border = '2px solid #888';
                        // Tooltip
                        ball.onclick = function(e) {
                            // Multi-select: toggle selection
                            if (selectedBalls.has(n)) {
                                selectedBalls.delete(n);
                                ball.classList.remove('selected');
                                // No stats panel to update
                            } else {
                                selectedBalls.add(n);
                                ball.classList.add('selected');
                                ball.style.animation = 'popin 0.3s';
                                setTimeout(() => { ball.style.animation = ''; }, 300);
                                // No stats panel to update
                            }
                        };
                        panel.appendChild(ball);
                    }
                    // Add event for the new button
                    // const checkBtn = document.getElementById('check-combo-btn');
                    // checkBtn.onclick = function() {
                    //     const resultsDiv = document.getElementById('combo-results');
                    //     resultsDiv.innerHTML = '';

                    //     if (selectedBalls.size < 1) {
                    //         resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">Select at least 1 number to check combinations.</div>';
                    //         return;
                    //     }
                    //     // Efficient: For each draw, count how many selected numbers appear
                    //     let allResults = [];
                    //     window.filteredDrawRows.forEach(draw => {
                    //         // Main draw
                    //         const matchCount = draw.mainArr.filter(num => selectedBalls.has(Number(num))).length;
                    //         if (matchCount >= 1) {
                    //             allResults.push({
                    //                 date: draw.date,
                    //                 numbers: draw.mainArr,
                    //                 selected: draw.mainArr.map(num => selectedBalls.has(Number(num))),
                    //                 type: 'Main',
                    //                 powerball: draw.powerball
                    //             });
                    //         }
                    //         // Double Play draw
                    //         if (draw.doublePlayArr && draw.doublePlayArr.length > 0) {
                    //             const matchCountDP = draw.doublePlayArr.filter(num => selectedBalls.has(Number(num))).length;
                    //             if (matchCountDP >= 1) {
                    //                 allResults.push({
                    //                     date: draw.date, // Only the date, no (Double Play)
                    //                     numbers: draw.doublePlayArr,
                    //                     selected: draw.doublePlayArr.map(num => selectedBalls.has(Number(num))),
                    //                     type: 'Double Play',
                    //                     powerball: draw.doublePlayPowerball
                    //                 });
                    //             }
                    //         }
                    //     });
                    //     // Sort allResults by date descending (parse date, ignore (Double Play) for sorting)
                    //     allResults.sort((a, b) => {
                    //         // Extract date part for sorting
                    //         function parseDate(str) {
                    //             let d = str.replace(' (Double Play)', '');
                    //             return new Date(d);
                    //         }
                    //         return parseDate(b.date) - parseDate(a.date);
                    //     });
                    //     if (allResults.length === 0) {
                    //         resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">No draws found with your selected number(s) in either draw.</div>';
                    //         return;
                    //     }
                    //     // Render all results in a single table
                    //     const section = document.createElement('div');
                    //     section.style.margin = '18px 0';
                    //     section.innerHTML = `<b style='font-size:1.15em;'>Draws with your number${selectedBalls.size > 1 ? 's' : ''}</b> <span style='color:#888'>(Total: ${allResults.length})</span>`;
                    //     const table = document.createElement('table');
                    //     table.style.marginTop = '8px';
                    //     table.style.width = '100%';
                    //     table.innerHTML = `<thead><tr><th>Date</th><th>Type</th><th>Numbers</th><th>Powerball</th></tr></thead><tbody></tbody>`;
                    //     allResults.forEach(draw => {
                    //         const tr = document.createElement('tr');
                    //         // Render numbers: selected as red balls, others as black text, with dash between
                    //         const numbersHtml = draw.numbers.map((num, idx) => {
                    //             if (draw.selected[idx]) {
                    //                 return `<span class='red-ball'>${num}</span>`;
                    //             } else {
                    //                 return `<span class='plain-number'>${num}</span>`;
                    //             }
                    //         }).join('<br>'); // Show each number on a new line
                    //         tr.innerHTML = `<td>${draw.date}</td><td>${draw.type}</td><td><div class='draws-list aligned-numbers'>${numbersHtml}</div></td><td><span class='yellow-ball'>${draw.powerball || ''}</span></td>`;
                    //         table.querySelector('tbody').appendChild(tr);
                    //     });
                    //     section.appendChild(table);
                    //     resultsDiv.appendChild(section);
                    //     // After rendering results, scroll to them for user focus
                    //     setTimeout(() => {
                    //         if (resultsDiv && resultsDiv.children.length > 0) {
                    //             resultsDiv.scrollIntoView({behavior: 'smooth', block: 'start'});
                    //         }
                    //     }, 100);
                    // };
                    // --- Show info for a number ---
                    // Remove old single-ball info panel logic
                    // --- Add new always-visible number frequency panel ---
                    // --- Always render number frequency panel after parsing CSV ---
                    const freqPanel = document.getElementById('number-freq-panel');
                    if (freqPanel) {
                        freqPanel.innerHTML = `<div style='font-weight:bold; font-size:1.1em; margin-bottom:8px;'>Number Frequency</div><div id='freq-list'></div>`;
                        const freqList = freqPanel.querySelector('#freq-list');
                        freqList.innerHTML = '<table style="width:100%; font-size:1em; border-collapse:collapse;">' +
                            '<thead><tr><th style="text-align:left;">#</th><th style="text-align:right;">Count</th></tr></thead><tbody>' +
                            Array.from({length: 69}, (_, i) => `<tr><td>${i+1}</td><td style="text-align:right;">${numberStats[i+1].count}</td></tr>`).join('') +
                            '</tbody></table>';
                    }
                    // --- Highlight draws in table ---
                    // Remove any logic that renders the main results table or highlights draws in the table.
                    // --- Search/filter functionality ---
                    const searchBox = document.getElementById('search-box');
                    searchBox.addEventListener('input', function() {
                        const query = searchBox.value.trim().toLowerCase();
                        const resultsDiv = document.getElementById('combo-results');
                        const tables = resultsDiv.querySelectorAll('table');
                        let anyVisible = false;
                        tables.forEach(table => {
                            const rows = table.querySelectorAll('tbody tr');
                            rows.forEach(row => {
                                const rowText = row.textContent.toLowerCase();
                                if (rowText.includes(query)) {
                                    row.style.display = '';
                                    anyVisible = true;
                                } else {
                                    row.style.display = 'none';
                                }
                            });
                        });
                        if (!anyVisible) {
                            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">No draws found matching your search.</div>';
                        }
                    });
                    // --- Compute duos, trios, quads, fives ---
                    function getCombos(arr, k) {
                        const results = [];
                        function helper(start, combo) {
                            if (combo.length === k) {
                                results.push(combo.slice().sort((a,b)=>a-b).join('-'));
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
                    const duoCounts = new Map();
                    const trioCounts = new Map();
                    const quadCounts = new Map();
                    const fiveCounts = new Map();
                    const allMainDraws = [];
                    window.filteredDrawRows.forEach(draw => {
                        const nums = draw.mainArr.map(Number).filter(n => n >= 1 && n <= 69);
                        if (nums.length === 5) {
                            allMainDraws.push(nums);
                            // Duos
                            getCombos(nums, 2).forEach(set => duoCounts.set(set, (duoCounts.get(set)||0)+1));
                            // Trios
                            getCombos(nums, 3).forEach(set => trioCounts.set(set, (trioCounts.get(set)||0)+1));
                            // Quads
                            getCombos(nums, 4).forEach(set => quadCounts.set(set, (quadCounts.get(set)||0)+1));
                            // Fives
                            const fiveSet = nums.slice().sort((a,b)=>a-b).join('-');
                            fiveCounts.set(fiveSet, (fiveCounts.get(fiveSet)||0)+1);
                        }
                    });
                    // --- Render 2x tab ---
                    function render2xTab() {
                        // Duos
                        let duosHtml = '<h3>Top 20 Duos</h3><table class="freq-table"><thead><tr><th>Duo</th><th>Count</th></tr></thead><tbody>';
                        Array.from(duoCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([set, count]) => {
                            duosHtml += `<tr><td>${set}</td><td>${count}</td></tr>`;
                        });
                        duosHtml += '</tbody></table>';
                        document.getElementById('duos-table').innerHTML = duosHtml;
                        // Trios
                        let triosHtml = '<h3>Top 20 Trios</h3><table class="freq-table"><thead><tr><th>Trio</th><th>Count</th></tr></thead><tbody>';
                        Array.from(trioCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([set, count]) => {
                            triosHtml += `<tr><td>${set}</td><td>${count}</td></tr>`;
                        });
                        triosHtml += '</tbody></table>';
                        document.getElementById('trios-table').innerHTML = triosHtml;
                        // Quads
                        let quadsHtml = '<h3>Top 20 Quadruples</h3><table class="freq-table"><thead><tr><th>Quadruple</th><th>Count</th></tr></thead><tbody>';
                        Array.from(quadCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([set, count]) => {
                            quadsHtml += `<tr><td>${set}</td><td>${count}</td></tr>`;
                        });
                        quadsHtml += '</tbody></table>';
                        document.getElementById('quads-table').innerHTML = quadsHtml;
                        // Fives
                        let fivesHtml = '<h3>Top 20 Sets of 5</h3><table class="freq-table"><thead><tr><th>Set of 5</th><th>Count</th></tr></thead><tbody>';
                        Array.from(fiveCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([set, count]) => {
                            fivesHtml += `<tr><td>${set}</td><td>${count}</td></tr>`;
                        });
                        fivesHtml += '</tbody></table>';
                        document.getElementById('fives-table').innerHTML = fivesHtml;
                    }
                    // --- 2x Tab Interactive Ball Panel and Results ---
                    function render2xBallPanel() {
                        const panel = document.getElementById('twox-ball-panel');
                        if (!panel) return;
                        panel.innerHTML = '';
                        const selectedBalls = new Set();
                        for (let n = 1; n <= 69; n++) {
                            const ball = document.createElement('span');
                            ball.className = 'ball';
                            ball.textContent = n;
                            ball.style.background = '#fff';
                            ball.style.color = '#222';
                            ball.style.border = '2px solid #888';
                            // Tooltip
                            ball.onclick = function() {
                                if (selectedBalls.has(n)) {
                                    selectedBalls.delete(n);
                                    ball.classList.remove('selected');
                                } else {
                                    selectedBalls.add(n);
                                    ball.classList.add('selected');
                                    ball.style.animation = 'popin 0.3s';
                                    setTimeout(() => { ball.style.animation = ''; }, 300);
                                }
                                render2xCombinations(Array.from(selectedBalls).sort((a,b)=>a-b));
                            };
                            panel.appendChild(ball);
                        }
                        // Attach event to Check My Numbers button (now in left-col)
                        // setTimeout(() => {
                        //     const checkBtn = document.getElementById('twox-check-btn');
                        //     if (checkBtn) {
                        //         checkBtn.onclick = function() {
                        //             render2xCombinations(Array.from(selectedBalls).sort((a,b)=>a-b));
                        //         };
                        //     }
                        // }, 0);
                    }
                    // --- Render all combinations of 2, 3, 4, 5 from selected balls ---
                    function render2xCombinations(selected) {
                        const resultsDiv = document.getElementById('twox-results');
                        if (!resultsDiv) return;
                        if (!selected || selected.length < 2) {
                            resultsDiv.innerHTML = '';
                            return;
                        }
                        function getCombos(arr, k) {
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
                        let html = '';
                        for (let k = 2; k <= Math.min(selected.length, 5); k++) {
                            const combos = getCombos(selected, k);
                            if (combos.length === 0) continue;
                            html += `<div style='margin-bottom:18px;'><span style='font-weight:600;color:#217dbb;min-width:170px;display:inline-block;'>Combination of ${k}:</span>`;
                            html += `<table class='freq-table' style='margin-bottom:8px;'><thead><tr><th>Date</th><th>Type</th><th>Combination</th></tr></thead><tbody>`;
                            // For each combination, find all draws (main/double play) where it appears
                            combos.forEach(comboArr => {
                                const comboSet = new Set(comboArr);
                                // Search window.filteredDrawRows for mainArr and doublePlayArr
                                window.filteredDrawRows.forEach(draw => {
                                    // Main draw
                                    if (draw.mainArr && draw.mainArr.length >= k) {
                                        const mainSet = new Set(draw.mainArr.map(Number));
                                        if (comboArr.every(n => mainSet.has(n))) {
                                            html += `<tr><td>${draw.date}</td><td>Main</td><td>` +
                                                comboArr.map((num, idx) => `<span style='display:inline-block;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;font-size:1.08em;font-weight:bold;margin:0 2px;'>${num}</span>${idx < comboArr.length-1 ? '<b style=\"color:#000;font-size:1.2em;\">-</b>' : ''}`).join('') +
                                                `</td></tr>`;
                                        }
                                    }
                                    // Double Play draw
                                    if (draw.doublePlayArr && draw.doublePlayArr.length >= k) {
                                        const dpSet = new Set(draw.doublePlayArr.map(Number));
                                        if (comboArr.every(n => dpSet.has(n))) {
                                            html += `<tr><td>${draw.date}</td><td>Double Play</td><td>` +
                                                comboArr.map((num, idx) => `<span style='display:inline-block;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;font-size:1.08em;font-weight:bold;margin:0 2px;'>${num}</span>${idx < comboArr.length-1 ? '<b style=\"color:#000;font-size:1.2em;\">-</b>' : ''}`).join('') +
                                                `</td></tr>`;
                                        }
                                    }
                                });
                            });
                            html += '</tbody></table>';
                        }
                        resultsDiv.innerHTML = html;
                    }
                    function renderAll2xCombinations() {
                        const resultsDiv = document.getElementById('twox-results');
                        if (!resultsDiv) return;
                        let html = '';
                        // Helper to render a table
                        function renderComboTable(title, combos) {
                            let table = `<h3 style='margin-top:18px;'>${title}</h3>`;
                            table += `<table class='freq-table' style='margin-bottom:24px;'><thead><tr><th>Combination</th><th>Count</th></tr></thead><tbody>`;
                            combos.forEach(([set, count]) => {
                                table += `<tr><td>${set}</td><td>${count}</td></tr>`;
                            });
                            table += '</tbody></table>';
                            return table;
                        }
                        // Get and sort all duos, trios, quads, fives
                        const duos = Array.from(duoCounts.entries()).sort((a, b) => {
                            const aNums = a[0].split('-').map(Number);
                            const bNums = b[0].split('-').map(Number);
                            for (let i = 0; i < aNums.length; i++) {
                                if (aNums[i] !== bNums[i]) return aNums[i] - bNums[i];
                            }
                            return 0;
                        });
                        const trios = Array.from(trioCounts.entries()).sort((a, b) => {
                            const aNums = a[0].split('-').map(Number);
                            const bNums = b[0].split('-').map(Number);
                            for (let i = 0; i < aNums.length; i++) {
                                if (aNums[i] !== bNums[i]) return aNums[i] - bNums[i];
                            }
                            return 0;
                        });
                        const quads = Array.from(quadCounts.entries()).sort((a, b) => {
                            const aNums = a[0].split('-').map(Number);
                            const bNums = b[0].split('-').map(Number);
                            for (let i = 0; i < aNums.length; i++) {
                                if (aNums[i] !== bNums[i]) return aNums[i] - bNums[i];
                            }
                            return 0;
                        });
                        const fives = Array.from(fiveCounts.entries()).sort((a, b) => {
                            const aNums = a[0].split('-').map(Number);
                            const bNums = b[0].split('-').map(Number);
                            for (let i = 0; i < aNums.length; i++) {
                                if (aNums[i] !== bNums[i]) return aNums[i] - bNums[i];
                            }
                            return 0;
                        });
                        html += renderComboTable('Combinations of 2', duos);
                        html += renderComboTable('Combinations of 3', trios);
                        html += renderComboTable('Combinations of 4', quads);
                        html += renderComboTable('Combinations of 5', fives);
                        resultsDiv.innerHTML = html;
                    }
                    function render2xResultsFast(selected, groupSize) {
                        const resultsDiv = document.getElementById('twox-results');
                        if (!resultsDiv) return;
                        if (!selected || selected.length === 0) {
                            resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0;">Select balls and click "Check My Numbers" to see draws containing your numbers.</div>';
                            return;
                        }
                        const k = groupSize;
                        const selectedSet = new Set(selected.map(Number));
                        let matches = [];
                        window.filteredDrawRows.forEach(draw => {
                            // Main
                            if (draw.mainArr && draw.mainArr.length === 5) {
                                const matchArr = draw.mainArr.filter(num => selectedSet.has(Number(num)));
                                if (matchArr.length >= k) {
                                    matches.push({
                                        date: draw.date,
                                        type: 'Main',
                                        numbers: draw.mainArr,
                                        powerball: draw.powerball,
                                        matchArr,
                                        matchCount: matchArr.length
                                    });
                                }
                            }
                            // Double Play
                            if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
                                const matchArr = draw.doublePlayArr.filter(num => selectedSet.has(Number(num)));
                                if (matchArr.length >= k) {
                                    matches.push({
                                        date: draw.date,
                                        type: 'Double Play',
                                        numbers: draw.doublePlayArr,
                                        powerball: draw.doublePlayPowerball,
                                        matchArr,
                                        matchCount: matchArr.length
                                    });
                                }
                            }
                        });
                        let html = `<div><h3>Draws with at least ${k} of your numbers</h3>`;
                        if (matches.length === 0) {
                            html += `<div style='color:#aaa; margin-bottom:12px;'>No draws found with at least ${k} of your selected numbers.</div>`;
                        } else {
                            html += `<table class='freq-table'><thead><tr><th>Date</th><th>Type</th><th>Numbers</th><th>Powerball</th><th>Match Count</th></tr></thead><tbody>`;
                            matches.slice(0, 50).forEach(m => {
                                const balls = m.numbers.map(num => m.matchArr.includes(num)
                                    ? `<span class='red-ball'>${num}</span>`
                                    : `<span class='plain-number'>${num}</span>`
                                ).join("");
                                html += `<tr><td>${m.date}</td><td>${m.type}</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${m.powerball || ''}</span></td><td>${m.matchCount}</td></tr>`;
                            });
                            html += '</tbody></table>';
                        }
                        html += '</div>';
                        resultsDiv.innerHTML = html;
                    }
                    // Listen for group size selector changes
                    const groupSizeSelect = document.getElementById('group-size-select');
                    if (groupSizeSelect) {
                        groupSizeSelect.value = '2';
                        groupSizeSelect.onchange = function() {
                            // No need to re-render results here, as they are rendered on button click
                        };
                    }
                    // --- Render Combo tab ---
                    function renderComboBallPanel() {
                        const panel = document.getElementById('combo-ball-panel');
                        if (!panel) return;
                        panel.innerHTML = '';
                        const selectedBalls = new Set();
                        for (let n = 1; n <= 69; n++) {
                            const ball = document.createElement('span');
                            ball.className = 'ball';
                            ball.textContent = n;
                            ball.style.background = selectedBalls.has(n) ? '#e74c3c' : '#fff';
                            ball.style.color = selectedBalls.has(n) ? '#fff' : '#222';
                            ball.style.border = selectedBalls.has(n) ? '2px solid #c0392b' : '2px solid #888';
                            // Tooltip
                            ball.onclick = function() {
                                if (selectedBalls.has(n)) {
                                    selectedBalls.delete(n);
                                    ball.classList.remove('selected');
                                    ball.style.background = '#fff';
                                    ball.style.color = '#222';
                                    ball.style.border = '2px solid #888';
                                } else {
                                    selectedBalls.add(n);
                                    ball.classList.add('selected');
                                    ball.style.background = '#e74c3c';
                                    ball.style.color = '#fff';
                                    ball.style.border = '2px solid #c0392b';
                                    ball.style.animation = 'popin 0.3s';
                                    setTimeout(() => { ball.style.animation = ''; }, 300);
                                }
                                renderComboResults(Array.from(selectedBalls), 'combo-tab-results');
                            };
                            panel.appendChild(ball);
                        }
                    }
                    
                    // --- Combo tab: update result rendering for dash-separated bold balls ---
                    function renderComboResults(selected, targetId = 'combo-tab-results') {
    // Attach click handler for numbers in results
    setTimeout(() => {
        const resultsDiv = document.getElementById(targetId);
        if (resultsDiv) {
            resultsDiv.removeEventListener('click', comboNumberClickHandler);
            resultsDiv.addEventListener('click', comboNumberClickHandler);
        }
    }, 0);

                        const resultsDiv = document.getElementById(targetId);
                        if (!resultsDiv) return;
                        // Always show all draws, highlight selected numbers
                        const selectedSet = new Set((selected || []).map(Number));
                        let html = `<table class='freq-table combo-results-table' style='margin-bottom:24px;'><thead><tr><th>Date</th><th>Type</th><th>Numbers</th><th>Powerball</th></tr></thead><tbody>`;
                        window.filteredDrawRows.forEach(draw => {
                            // Main draw
                            if (draw.mainArr && draw.mainArr.length === 5) {
                                const balls = draw.mainArr.map((num, idx) => selectedSet.has(Number(num))
                                    ? `<span style='display:inline-block;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;font-size:1.08em;font-weight:bold;margin:0 2px;'>${num}</span>${idx < draw.mainArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                    : `<span class='plain-number'>${num}</span>${idx < draw.mainArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                ).join("");
                                html += `<tr><td>${draw.date}</td><td>Main</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${draw.powerball || ''}</span></td></tr>`;
                            }
                            // Double Play draw
                            if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
                                const balls = draw.doublePlayArr.map((num, idx) => selectedSet.has(Number(num))
                                    ? `<span style='display:inline-block;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;font-size:1.08em;font-weight:bold;margin:0 2px;'>${num}</span>${idx < draw.doublePlayArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                    : `<span class='plain-number'>${num}</span>${idx < draw.doublePlayArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                ).join("");
                                html += `<tr><td>${draw.date}</td><td>Double Play</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${draw.doublePlayPowerball || ''}</span></td></tr>`;
                            }
                        });
                        html += '</tbody></table>';
                        resultsDiv.innerHTML = html;
                    }

                    // Handler: clicking a number in combo results selects the ball and updates panel/results
                    function comboNumberClickHandler(e) {
                        if (e.target && e.target.classList.contains('plain-number')) {
                            const num = parseInt(e.target.textContent, 10);
                            if (!isNaN(num)) {
                                // Find the top panel and select the ball
                                const panel = document.getElementById('combo-ball-panel');
                                if (panel) {
                                    const ballEls = panel.querySelectorAll('.ball');
                                    ballEls.forEach(ball => {
                                        if (parseInt(ball.textContent, 10) === num) {
                                            if (!ball.classList.contains('selected')) ball.click();
                                        }
                                    });
                                }
                            }
                        }
                    }
                    // --- Render History tab with both main and double play as columns ---
                    function renderHistoryTab() {
                        let html = '<table class="freq-table"><thead><tr><th>#</th><th>Date</th><th>Main Numbers</th><th>Double Play Numbers</th></tr></thead><tbody>';
                        let rowNum = 1;
                        window.filteredDrawRows.forEach(draw => {
                            html += `<tr><td>${rowNum++}</td><td>${draw.date}</td><td>${draw.mainArr.join('-')}</td><td>${draw.doublePlayArr && draw.doublePlayArr.length === 5 ? draw.doublePlayArr.join('-') : ''}</td></tr>`;
                        });
                        html += '</tbody></table>';
                        document.getElementById('history-table').innerHTML = html;
                    }
                    // --- New tab functions ---
                    function renderNewBallPanel() {
                        const panel = document.getElementById('new-ball-panel');
                        if (!panel) return;
                        panel.innerHTML = '';
                        const selectedBalls = new Set();
                        for (let n = 1; n <= 69; n++) {
                            const ball = document.createElement('span');
                            ball.className = 'ball';
                            ball.textContent = n;
                            ball.setAttribute('data-ball-number', n);
                            ball.onclick = function() {
                                if (selectedBalls.has(n)) {
                                    selectedBalls.delete(n);
                                    ball.classList.remove('selected');
                                    ball.classList.add('deselected');
                                    // Animation for deselection
                                    ball.style.animation = 'popout 0.3s';
                                    setTimeout(() => { ball.style.animation = ''; }, 300);
                                } else {
                                    selectedBalls.add(n);
                                    ball.classList.remove('deselected');
                                    ball.classList.add('selected');
                                    // Animation for selection
                                    ball.style.animation = 'popin 0.3s';
                                    setTimeout(() => { ball.style.animation = ''; }, 300);
                                }
                                renderNewResults(Array.from(selectedBalls));
                            };
                            panel.appendChild(ball);
                        }
                    }
                    
                    function renderNewResults(selected) {
    // Attach click handler to numbers in results after rendering
    function newNumberClickHandler(e) {
        if (e.target && e.target.classList.contains('plain-number')) {
            const num = parseInt(e.target.textContent, 10);
            if (!isNaN(num)) {
                // Find the top panel and select the ball
                const panel = document.getElementById('new-ball-panel');
                if (panel) {
                    const ballEls = panel.querySelectorAll('.ball');
                    ballEls.forEach(ballEl => {
                        if (parseInt(ballEl.textContent, 10) === num) {
                            ballEl.click();
                        }
                    });
                }
            }
        }
    }
                        const resultsDiv = document.getElementById('new-tab-results');
                        if (!resultsDiv) return;
                        if (!selected || selected.length === 0) {
                            resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0;">Select white balls above to see both main and double play draws containing your numbers.</div>';
                            return;
                        }
                        
                        const selectedSet = new Set(selected.map(Number));
                        let html = '<h3>Draws with your selected numbers</h3>';
                        
                        // Create a table to display both main and double play draws
                        html += `<table class='freq-table' style='margin-bottom:24px;'><thead><tr><th>Date</th><th>Type</th><th>Numbers</th><th>Powerball</th></tr></thead><tbody>`;
                        
                        // Filter and display draws that contain at least one of the selected numbers
                        window.filteredDrawRows.forEach(draw => {
                            // Main draw
                            if (draw.mainArr && draw.mainArr.length === 5) {
                                const matchArr = draw.mainArr.filter(num => selectedSet.has(Number(num)));
                                if (matchArr.length > 0) {
                                    const balls = draw.mainArr.map((num, idx) => selectedSet.has(Number(num))
                                        ? `<span style='display:inline-block;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;font-size:1.08em;font-weight:bold;margin:0 2px;'>${num}</span>${idx < draw.mainArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                        : `<span class='plain-number'>${num}</span>${idx < draw.mainArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                    ).join("");
                                    html += `<tr><td>${draw.date}</td><td>Main</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${draw.powerball || ''}</span></td></tr>`;
                                }
                            }
                            
                            // Double Play draw
                            if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
                                const matchArr = draw.doublePlayArr.filter(num => selectedSet.has(Number(num)));
                                if (matchArr.length > 0) {
                                    const balls = draw.doublePlayArr.map((num, idx) => selectedSet.has(Number(num))
                                        ? `<span style='display:inline-block;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;font-size:1.08em;font-weight:bold;margin:0 2px;'>${num}</span>${idx < draw.doublePlayArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                        : `<span class='plain-number'>${num}</span>${idx < draw.doublePlayArr.length-1 ? '<b style="color:#000;font-size:1.2em;">-</b>' : ''}`
                                    ).join("");
                                    html += `<tr><td>${draw.date}</td><td>Double Play</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${draw.doublePlayPowerball || ''}</span></td></tr>`;
                                }
                            }
                        });
                        
                        html += '</tbody></table>';
                        resultsDiv.innerHTML = html;
                        // Attach click handler to numbers in the results
                        resultsDiv.querySelectorAll('.plain-number').forEach(el => {
                            el.style.cursor = 'pointer';
                            el.addEventListener('click', newNumberClickHandler);
                        });
                    }
                    
                    // --- Tab event listeners ---
                    document.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
                            const tabId = btn.getAttribute('data-tab');
                            document.getElementById('tab-' + tabId).style.display = 'block';
                            if (tabId === 'main') {
                                if (typeof renderMainBallPanel === 'function') {
                                    renderMainBallPanel();
                                }
                            } else if (tabId === 'combo') {
                                if (typeof renderComboBallPanel === 'function') {
                                    renderComboBallPanel();
                                    renderComboResults([], 'combo-tab-results');
                                }
                            } else if (tabId === '2x') {
                                if (typeof render2xBallPanel === 'function') {
                                    render2xBallPanel();
                                    renderAll2xCombinations();
                                }
                            } else if (tabId === 'new') {
                                if (typeof renderNewBallPanel === 'function') {
                                    renderNewBallPanel();
                                    renderNewResults([]);
                                }
                            }
                        });
                    });
                    // Optionally, render 2x, combo, and history if user reloads on those tabs
                    if (document.getElementById('tab-2x').style.display === 'block') {
                        render2xBallPanel();
                        renderAll2xCombinations();
                    }
                    if (document.getElementById('tab-combo').style.display === 'block') {
                        renderComboBallPanel();
                        renderComboResults([]);
                    }
                    if (document.getElementById('tab-history').style.display === 'block') renderHistoryTab();

                    // --- Download Notes ---
                    // Main tab notes
                    const downloadBtn = document.getElementById('download-note-btn');
                    if (downloadBtn) {
                        downloadBtn.onclick = function() {
                            const noteText = document.getElementById('note-textarea').value;
                            if (noteText.trim() === '') {
                                alert('Your note is empty!');
                                return;
                            }
                            const blob = new Blob([noteText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'powerball_notes.txt';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        };
                    }
                    
                    // Combo tab notes
                    const downloadBtnCombo = document.getElementById('download-note-btn-combo');
                    if (downloadBtnCombo) {
                        downloadBtnCombo.onclick = function() {
                            const noteText = document.getElementById('note-textarea-combo').value;
                            if (noteText.trim() === '') {
                                alert('Your note is empty!');
                                return;
                            }
                            const blob = new Blob([noteText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'powerball_combo_notes.txt';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        };
                    }
                    
                    // 2x tab notes
                    const downloadBtn2x = document.getElementById('download-note-btn-2x');
                    if (downloadBtn2x) {
                        downloadBtn2x.onclick = function() {
                            const noteText = document.getElementById('note-textarea-2x').value;
                            if (noteText.trim() === '') {
                                alert('Your note is empty!');
                                return;
                            }
                            const blob = new Blob([noteText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'powerball_2x_notes.txt';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        };
                    }
                    
                    // New tab notes
                    const downloadBtnNew = document.getElementById('download-note-btn-new');
                    if (downloadBtnNew) {
                        downloadBtnNew.onclick = function() {
                            const noteText = document.getElementById('note-textarea-new').value;
                            if (noteText.trim() === '') {
                                alert('Your note is empty!');
                                return;
                            }
                            const blob = new Blob([noteText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'powerball_new_notes.txt';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        };
                    }
                }
            });
        });
});

// --- RANDOM GENERATOR LOGIC ---
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateUniqueNumbers(count, min, max) {
    const nums = new Set();
    while (nums.size < count) {
        nums.add(getRandomInt(min, max));
    }
    return Array.from(nums).sort((a, b) => a - b);
}
const genComboBtn = document.getElementById('generate-combo-btn');
const genSingleBtn = document.getElementById('generate-single-btn');
const genResult = document.getElementById('generated-result');
if (genComboBtn && genSingleBtn && genResult) {
    genComboBtn.onclick = function() {
        const whiteBalls = generateUniqueNumbers(5, 1, 69);
        const redBall = getRandomInt(1, 26);
        genResult.innerHTML =
            whiteBalls.map(n => `<span class='generated-ball'>${n}</span>`).join('') +
            `<span class='generated-ball red'>${redBall}</span>`;
    };
    genSingleBtn.onclick = function() {
        const n = getRandomInt(1, 69);
        genResult.innerHTML = `<span class='generated-ball'>${n}</span>`;
    };
}

// --- Copy Tab Functionality ---
let currentHitsFilter = 0;
let selectedBalls = [];
const MAX_SELECTIONS = 5;

function renderCopyResults() {
    const resultsContainer = document.getElementById('copy-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    // Get date range
    const dateFrom = document.getElementById('copy-date-from')?.value;
    const dateTo = document.getElementById('copy-date-to')?.value;
    
    // Filter draws by date range
    const filteredDraws = window.filteredDrawRows.filter(draw => {
        const drawDate = new Date(draw.date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && drawDate < fromDate) return false;
        if (toDate && drawDate > toDate) return false;
        return true;
    });
    
    // Process each draw
    filteredDraws.forEach(draw => {
        const drawElement = document.createElement('div');
        drawElement.className = 'draw-row';
        
        // Create date element
        const dateElement = document.createElement('span');
        dateElement.className = 'draw-date';
        dateElement.textContent = draw.date;
        
        // Create numbers container
        const numbersContainer = document.createElement('div');
        numbersContainer.className = 'draw-numbers';
        
        // Add main numbers
        if (draw.mainArr) {
            draw.mainArr.forEach(num => {
                const numElement = document.createElement('span');
                numElement.className = 'ball';
                numElement.textContent = num;
                numElement.setAttribute('data-ball-number', num);
                numbersContainer.appendChild(numElement);
            });
        }
        
        // Add Powerball if exists
        if (draw.powerball) {
            const powerballElement = document.createElement('span');
            powerballElement.className = 'ball powerball';
            powerballElement.textContent = draw.powerball;
            powerballElement.setAttribute('data-ball-number', draw.powerball);
            numbersContainer.appendChild(document.createTextNode(' '));
            numbersContainer.appendChild(powerballElement);
        }
        
        // Add hit count badge
        const hitCount = calculateHitCount(draw);
        if (hitCount > 1) {
            const hitBadge = document.createElement('span');
            hitBadge.className = `hit-badge hit-${Math.min(hitCount, 6)}`;
            hitBadge.textContent = `${hitCount} hits`;
            hitBadge.style.marginLeft = '10px';
            hitBadge.style.verticalAlign = 'middle';
            numbersContainer.appendChild(hitBadge);
        }
        
        // Only show if it meets the hit count filter
        if (currentHitsFilter === 0 || hitCount >= currentHitsFilter) {
            drawElement.appendChild(dateElement);
            drawElement.appendChild(numbersContainer);
            resultsContainer.appendChild(drawElement);
        }
    });
}
let userSelectedNumbers = new Set();
let userPowerball = null;

// Initialize Copy Tab
document.addEventListener('DOMContentLoaded', function() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('copy-date-from').valueAsDate = thirtyDaysAgo;
    document.getElementById('copy-date-to').valueAsDate = today;
    
    // Initialize ball grid
    initBallGrid();
    
    // Add event listeners for filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentHitsFilter = parseInt(this.dataset.hits) || 0;
            renderCopyResults();
        });
    });
    
    // Add event listeners for date inputs
    document.getElementById('copy-date-from').addEventListener('change', renderCopyResults);
    document.getElementById('copy-date-to').addEventListener('change', renderCopyResults);
});

// Initialize ball grid (1-69)
function initBallGrid() {
    const grid = document.querySelector('.ball-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 1; i <= 69; i++) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.textContent = i;
        ball.dataset.number = i;
        
        // Check if this ball is selected
        if (selectedBalls.includes(i)) {
            ball.classList.add('selected');
        }
        
        ball.addEventListener('click', () => toggleBall(i, ball));
        grid.appendChild(ball);
    }
}

// Toggle ball selection
function toggleBall(number, element) {
    const index = selectedBalls.indexOf(number);
    
    if (index > -1) {
        // Deselect
        selectedBalls.splice(index, 1);
        element.classList.remove('selected');
    } else if (selectedBalls.length < MAX_SELECTIONS) {
        // Select (if under limit)
        selectedBalls.push(number);
        element.classList.add('selected');
    }
    
    // Update the display
    updateSelectedBallsDisplay();
    renderCopyResults();
}

// Update the display of selected balls
function updateSelectedBallsDisplay() {
    const legend = document.querySelector('.legend');
    if (legend) {
        if (selectedBalls.length > 0) {
            legend.textContent = `Selected: ${selectedBalls.sort((a, b) => a - b).join(', ')}`;
        } else {
            legend.textContent = 'Select up to 5 numbers';
        }
    }
}

// Initialize ball selection
let currentFilter = '0';

// Render ball selection grid
function renderBallGrid() {
    const ballGrid = document.querySelector('.ball-grid');
    const powerballGrid = document.querySelector('.powerball-grid');
    
    if (!ballGrid || !powerballGrid) return;
    
    // Clear existing balls
    ballGrid.innerHTML = '';
    powerballGrid.innerHTML = '';
    
    // Create main balls (1-35)
    for (let i = 1; i <= 35; i++) {
        const ball = document.createElement('div');
        ball.className = 'ball' + (selectedBalls.includes(i) ? ' selected' : '');
        ball.textContent = i;
        ball.setAttribute('data-ball-number', i);
        
        ball.addEventListener('click', () => toggleBall(i));
        ballGrid.appendChild(ball);
    }
    
    // Create powerballs (1-20)
    for (let i = 1; i <= 20; i++) {
        const powerball = document.createElement('div');
        powerball.className = 'ball' + (selectedPowerball === i ? ' selected' : '');
        powerball.textContent = i;
        powerball.setAttribute('data-ball-number', i);
        
        powerball.addEventListener('click', () => togglePowerball(i));
        powerballGrid.appendChild(powerball);
    }
}

// Toggle ball selection
function toggleBall(number) {
    const index = selectedBalls.indexOf(number);
    if (index === -1) {
        if (selectedBalls.length < 5) {
            selectedBalls.push(number);
            selectedBalls.sort((a, b) => a - b);
        }
    } else {
        selectedBalls.splice(index, 1);
    }
    renderBallGrid();
    renderCopyResults();
}

// Toggle powerball selection
function togglePowerball(number) {
    selectedPowerball = selectedPowerball === number ? null : number;
    renderBallGrid();
    renderCopyResults();
}

// Calculate hits for a draw
function calculateHits(draw) {
    if (!draw || !draw.mainArr || selectedBalls.length === 0) return 0;
    
    let hits = 0;
    const mainNumbers = draw.mainArr.map(Number);
    
    // Count matching main numbers
    hits += selectedBalls.filter(num => mainNumbers.includes(num)).length;
    
    // Check powerball match
    if (selectedPowerball !== null && draw.powerball && 
        parseInt(draw.powerball) === selectedPowerball) {
        hits++;
    }
    
    return hits;
}

// Filter and render results
function renderCopyResults() {
    const resultsContainer = document.getElementById('copy-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    // Get filtered draws based on date range
    const fromDate = document.getElementById('copy-date-from').value;
    const toDate = document.getElementById('copy-date-to').value;
    
    const filteredDraws = window.filteredDrawRows.filter(draw => {
        if (!draw || !draw.date) return false;
        
        const drawDate = new Date(draw.date);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && drawDate < from) return false;
        if (to) {
            const nextDay = new Date(to);
            nextDay.setDate(nextDay.getDate() + 1);
            if (drawDate >= nextDay) return false;
        }
        
        return true;
    });
    
    // Sort by date (newest first)
    filteredDraws.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render each draw
    filteredDraws.forEach(draw => {
        const hits = calculateHits(draw);
        
        // Skip if no hits or doesn't match filter
        if (hits === 0 || (currentFilter !== '0' && hits < parseInt(currentFilter))) {
            return;
        }
        
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(draw.date);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        
        // Create balls display
        const ballsContainer = document.createElement('div');
        ballsContainer.className = 'draw-balls';
        
        draw.mainArr.forEach(num => {
            const ball = document.createElement('span');
            ball.className = 'ball' + (selectedBalls.includes(parseInt(num)) ? ' selected' : '');
            ball.textContent = num;
            ball.setAttribute('data-ball-number', num);
            ballsContainer.appendChild(ball);
        });
        
        // Add powerball
        if (draw.powerball) {
            const powerball = document.createElement('span');
            powerball.className = 'ball powerball' + 
                (selectedPowerball === parseInt(draw.powerball) ? ' selected' : '');
            powerball.textContent = draw.powerball;
            powerball.setAttribute('data-ball-number', draw.powerball);
            ballsContainer.appendChild(powerball);
        }
        
        // Create hit badge
        const hitBadge = document.createElement('span');
        hitBadge.className = `hit-badge hit-${hits}`;
        hitBadge.textContent = `${hits} hit${hits > 1 ? 's' : ''}`;
        
        // Create table cells
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${draw.numbers}</td>
            <td>${hits > 0 ? hitBadge.outerHTML : ''}</td>
        `;
        
        resultsContainer.appendChild(row);
    });
}

// Initialize Copy tab
document.addEventListener('DOMContentLoaded', function() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Set date inputs
    const dateFromInput = document.getElementById('copy-date-from');
    const dateToInput = document.getElementById('copy-date-to');
    
    if (dateFromInput && dateToInput) {
        dateFromInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        dateToInput.value = today.toISOString().split('T')[0];
        
        // Add event listeners for date changes
        dateFromInput.addEventListener('change', renderCopyResults);
        dateToInput.addEventListener('change', renderCopyResults);
    }
    
    // Add event listeners for filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-hits');
            renderCopyResults();
        });
    });
    
    // Initial render
    renderBallGrid();
    renderCopyResults();
});

// --- Download Notes for All Tabs ---
[
    { btn: 'download-note-btn', textarea: 'note-textarea', filename: 'powerball_notes.txt' },
    { btn: 'download-note-btn-combo', textarea: 'note-textarea-combo', filename: 'powerball_combo_notes.txt' },
    { btn: 'download-note-btn-2x', textarea: 'note-textarea-2x', filename: 'powerball_2x_notes.txt' },
    { btn: 'download-note-btn-new', textarea: 'note-textarea-new', filename: 'powerball_new_notes.txt' }
].forEach(cfg => {
    const btn = document.getElementById(cfg.btn);
    if (btn) {
        btn.onclick = function() {
            const noteText = document.getElementById(cfg.textarea).value;
            if (noteText.trim() === '') {
                alert('Your note is empty!');
                return;
            }
            const blob = new Blob([noteText], { type: 'text/plain' });
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

// After CSV and window.filteredDrawRows are ready, render the full combo table on the home page


// --- FREQUENT PAIRS & TRIOS (ALWAYS VISIBLE TABLES) ---
function getAllCombos(arr, k) {
    const results = [];
    function helper(start, combo) {
        if (combo.length === k) {
            results.push(combo.slice().sort((a,b)=>a-b).join('-'));
            return;
        }
        for (let i = start; i < arr.length; i++) {
            helper(i+1, combo.concat(arr[i]));
        }
    }
    helper(0, []);
    return results;
}
function renderFrequentPairsTriosTables() {
    // Analyze all pairs/trios for main and double play
    if (!window.window.filteredDrawRows) return;
    const pairCounts = new Map();
    const trioCounts = new Map();
    const pairDraws = new Map();
    const trioDraws = new Map();
    // Helper to add to map
    function addToMap(map, combo, date, type) {
        if (!map.has(combo)) map.set(combo, []);
        map.get(combo).push({date, type});
    }
    window.window.filteredDrawRows.forEach(draw => {
        if (draw.mainArr && draw.mainArr.length === 5) {
            getAllCombos(draw.mainArr, 2).forEach(pair => {
                pairCounts.set(pair, (pairCounts.get(pair)||0)+1);
                addToMap(pairDraws, pair, draw.date, 'Main');
            });
            getAllCombos(draw.mainArr, 3).forEach(trio => {
                trioCounts.set(trio, (trioCounts.get(trio)||0)+1);
                addToMap(trioDraws, trio, draw.date, 'Main');
            });
        }
        if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
            getAllCombos(draw.doublePlayArr, 2).forEach(pair => {
                pairCounts.set(pair, (pairCounts.get(pair)||0)+1);
                addToMap(pairDraws, pair, draw.date, 'Double');
            });
            getAllCombos(draw.doublePlayArr, 3).forEach(trio => {
                trioCounts.set(trio, (trioCounts.get(trio)||0)+1);
                addToMap(trioDraws, trio, draw.date, 'Double');
            });
        }
    });
    const pairs = Array.from(pairCounts.entries()).filter(([_,c])=>c>=2).sort((a,b)=>b[1]-a[1]);
    const trios = Array.from(trioCounts.entries()).filter(([_,c])=>c>=2).sort((a,b)=>b[1]-a[1]);
    // UI state
    let mode = 'pair';
    let selectedCombo = null;
    const panel = document.getElementById('freq-pairtrio-panel');
    const tableDiv = document.getElementById('freq-pairtrio-table');
    const datesDiv = document.getElementById('freq-pairtrio-dates');
    const togglePairs = document.getElementById('freq-toggle-pairs');
    const toggleTrios = document.getElementById('freq-toggle-trios');
    function renderTable() {
        let data = mode==='pair'?pairs:trios;
        let html = `<table class='freq-table'><thead><tr><th>${mode==='pair'?'Pair':'Trio'}</th><th>Count</th></tr></thead><tbody>`;
        data.forEach(([combo, count])=>{
            const nums = combo.split('-').map(num => `<span class='freq-number-pill' style='margin:0 3px;cursor:pointer;'>${num}</span>`).join(' ');
            html += `<tr class='combo-row' data-combo='${combo}'><td class='combo-cell'>${nums}</td><td>${count}</td></tr>`;
        });
        html += '</tbody></table>';
        tableDiv.innerHTML = html;
        datesDiv.style.display = 'none';
        // Add click handler
        tableDiv.querySelectorAll('.combo-row').forEach(row => {
            row.onclick = function() {
                selectedCombo = row.getAttribute('data-combo');
                renderDrawsTable();
            };
        });
    }
    function renderDrawsTable() {
        if (!selectedCombo) return;
        let draws = mode==='pair'?pairDraws.get(selectedCombo):trioDraws.get(selectedCombo);
        if (!draws) return;
        let html = `<div style='margin-bottom:8px;'><b>${selectedCombo}</b> appeared in these draws:</div>`;
        html += `<table class='freq-table'><thead><tr><th>Date</th><th>Type</th></tr></thead><tbody>`;
        draws.forEach(d=>{
            html += `<tr><td>${d.date}</td><td>${d.type}</td></tr>`;
        });
        html += '</tbody></table>';
        html += `<button id='freq-hide-dates-btn' style='margin-top:8px;'>Hide</button>`;
        datesDiv.innerHTML = html;
        datesDiv.style.display = 'block';
        document.getElementById('freq-hide-dates-btn').onclick = ()=>{datesDiv.style.display='none';};
    }
    togglePairs.onclick = ()=>{
        mode='pair';
        togglePairs.classList.add('active');
        toggleTrios.classList.remove('active');
        selectedCombo = null;
        renderTable();
    };
    toggleTrios.onclick = ()=>{
        mode='trio';
        toggleTrios.classList.add('active');
        togglePairs.classList.remove('active');
        selectedCombo = null;
        renderTable();
    };
    renderTable();
}
// Ensure this runs after window.filteredDrawRows is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderFrequentPairsTriosTables, 1200);
});




// Ensure this runs after window.filteredDrawRows is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderFrequentPairsTriosTables, 1200);
});

// Add a new function to render the combo table in the home tab (uses #combo-results)
function renderComboResultsHome(selected) {
    const resultsDiv = document.getElementById('combo-results');
    if (!resultsDiv) return;
    const selectedSet = new Set((selected || []).map(Number));
    let html = `<table class='freq-table combo-results-table' style='margin-bottom:24px;'><thead><tr><th>Date</th><th>Type</th><th>Numbers</th><th>Powerball</th></tr></thead><tbody>`;
    window.filteredDrawRows.forEach(draw => {
        // Main draw
        if (draw.mainArr && draw.mainArr.length === 5) {
            const balls = draw.mainArr.map(num => selectedSet.has(Number(num))
                ? `<span class='red-ball'>${num}</span>`
                : `<span class='plain-number'>${num}</span>`
            ).join("");
            html += `<tr><td>${draw.date}</td><td>Main</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${draw.powerball || ''}</span></td></tr>`;
        }
        // Double Play draw
        if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
            const balls = draw.doublePlayArr.map(num => selectedSet.has(Number(num))
                ? `<span class='red-ball'>${num}</span>`
                : `<span class='plain-number'>${num}</span>`
            ).join("");
            html += `<tr><td>${draw.date}</td><td>Double Play</td><td><div class='aligned-numbers' style='display:flex;gap:8px;align-items:center;flex-wrap:wrap;'>${balls}</div></td><td><span class='yellow-ball'>${draw.doublePlayPowerball || ''}</span></td></tr>`;
        }
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

// Update search box logic to work for home tab as well
const searchBox = document.getElementById('search-box');
if (searchBox) {
    searchBox.addEventListener('input', function() {
        const query = searchBox.value.trim().toLowerCase();
        const resultsDiv = document.getElementById('combo-results');
        if (!resultsDiv) return;
        const tables = resultsDiv.querySelectorAll('table');
        let anyVisible = false;
        tables.forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();
                if (rowText.includes(query)) {
                    row.style.display = '';
                    anyVisible = true;
                } else {
                    row.style.display = 'none';
                }
            });
        });
        if (!anyVisible) {
            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">No draws found matching your search.</div>';
        }
    });
} 

// Update 2x Check My Numbers logic: show all draws (main and double play) where any selected ball appears, with date and type. Remove group size logic.
function render2xResultsForSelectedBalls(selected) {
    const resultsDiv = document.getElementById('twox-results');
    if (!resultsDiv) return;
    if (!selected || selected.length === 0) {
        resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0;">Select balls and click "Check My Numbers" to see combinations.</div>';
        return;
    }
    // Helper to get all unique combinations of k from arr
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
    // Gather all combinations of size 2 up to selected.length
    let allCombos = [];
    for (let k = 2; k <= selected.length; k++) {
        allCombos = allCombos.concat(getCombinations(selected, k));
    }
    // Sort allCombos lexicographically
    allCombos.sort((a, b) => {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] !== b[i]) return a[i] - b[i];
        }
        return a.length - b.length;
    });
    let html = `<div><h3>Combinations from your selected balls</h3>`;
    if (allCombos.length === 0) {
        html += `<div style='color:#aaa; margin-bottom:12px;'>No combinations found. Select at least 2 balls.</div>`;
    } else {
        html += `<div class='twox-combo-results-list'>`;
        allCombos.forEach((combo, idx) => {
            html += `<div class='twox-combo-row'><span class='twox-combo-label'>Combination ${idx+1}:</span> ` +
                combo.map(num => `<span class='twox-red-ball'>${num}</span>`).join(' ') +
                `</div>`;
        });
        html += `</div>`;
    }
    html += '</div>';
    resultsDiv.innerHTML = html;
}

// --- Download Pairs & Trios CSV Button Logic ---
window.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('download-combo-csv-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            // Debugging logs
            console.log("Download button clicked");
            console.log(window.window.filteredDrawRows);
            console.log(typeof getAllCombos);
            if (!window.window.filteredDrawRows) {
                alert('Data not loaded yet!');
                return;
            }
            const pairCounts = new Map();
            const trioCounts = new Map();
            const pairDraws = new Map();
            const trioDraws = new Map();
            function addToMap(map, combo, date, type) {
                if (!map.has(combo)) map.set(combo, []);
                map.get(combo).push({date, type});
            }
            window.window.filteredDrawRows.forEach(draw => {
                if (draw.mainArr && draw.mainArr.length === 5) {
                    getAllCombos(draw.mainArr, 2).forEach(pair => {
                        pairCounts.set(pair, (pairCounts.get(pair)||0)+1);
                        addToMap(pairDraws, pair, draw.date, 'Main');
                    });
                    getAllCombos(draw.mainArr, 3).forEach(trio => {
                        trioCounts.set(trio, (trioCounts.get(trio)||0)+1);
                        addToMap(trioDraws, trio, draw.date, 'Main');
                    });
                }
                if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
                    getAllCombos(draw.doublePlayArr, 2).forEach(pair => {
                        pairCounts.set(pair, (pairCounts.get(pair)||0)+1);
                        addToMap(pairDraws, pair, draw.date, 'Double');
                    });
                    getAllCombos(draw.doublePlayArr, 3).forEach(trio => {
                        trioCounts.set(trio, (trioCounts.get(trio)||0)+1);
                        addToMap(trioDraws, trio, draw.date, 'Double');
                    });
                }
            });
            const pairs = Array.from(pairCounts.entries()).filter(([_,c])=>c>=2).sort((a,b)=>b[1]-a[1]);
            const trios = Array.from(trioCounts.entries()).filter(([_,c])=>c>=2).sort((a,b)=>b[1]-a[1]);
            function csvEscape(val) {
                const str = String(val);
                if (str.includes('"')) return '"' + str.replace(/"/g, '""') + '"';
                if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes(';')) return '"' + str + '"';
                return str;
            }
            let csvRows = [];
            csvRows.push(['Type','Combo','Count','Dates+Types']);
            pairs.forEach(([combo, count]) => {
                const draws = pairDraws.get(combo) || [];
                const datesStr = draws.map(d=>`${d.date} (${d.type})`).join('; ');
                csvRows.push(['Pair', combo.split(',').join('-'), count, csvEscape(datesStr)]);
            });
            trios.forEach(([combo, count]) => {
                const draws = trioDraws.get(combo) || [];
                const datesStr = draws.map(d=>`${d.date} (${d.type})`).join('; ');
                csvRows.push(['Trio', combo.split(',').join('-'), count, csvEscape(datesStr)]);
            });
            const csvContent = csvRows.map(row => row.map(csvEscape).join(',')).join('\r\n');
            const blob = new Blob([csvContent], {type: 'text/csv'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'powerball_pairs_trios.csv';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        });
    }
});