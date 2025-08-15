// Document click handler for debugging - modified to not interfere with ball clicks
document.addEventListener('click', function(e) {
    // Skip if the click is on a ball (ball has its own handler)
    if (e.target.closest('.ball')) {
        return;
    }
}, true);

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
                if (tabId === 'combo45') {
                    renderPowerballCombo45Results();
                }
                if (tabId === '2x') {
                    console.log('2x tab activated - START');
                    // Initialize selectedBalls if it doesn't exist
                    window.selectedBalls = window.selectedBalls || [];
                    console.log('Current selectedBalls:', window.selectedBalls);
                    
                    // Clear any existing results
                    let resultsDiv = document.getElementById('twox-results');
                    
                    // If results div doesn't exist, create it
                    if (!resultsDiv) {
                        console.log('Creating twox-results div...');
                        const centerCol = document.querySelector('#tab-2x .center-col');
                        if (centerCol) {
                            resultsDiv = document.createElement('div');
                            resultsDiv.id = 'twox-results';
                            resultsDiv.style.width = '100%';
                            centerCol.prepend(resultsDiv);
                            console.log('Created twox-results div');
                        } else {
                            console.error('Could not find center column to add results div');
                        }
                    } else {
                        resultsDiv.innerHTML = '';
                        console.log('Cleared existing results div');
                    }
                    
                    // Make sure we have draw data
                    if (!window.filteredDrawRows || window.filteredDrawRows.length === 0) {
                        console.error('No draw data available in filteredDrawRows');
                        if (resultsDiv) {
                            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:18px 0;">Loading draw data... Please wait.</div>';
                        }
                        // Try to re-render after a short delay in case data is still loading
                        setTimeout(() => {
                            if (window.filteredDrawRows && window.filteredDrawRows.length > 0) {
                                console.log('Draw data loaded, rendering ball panel');
                                renderTwoXBallPanel();
                                if (window.selectedBalls.length > 0) {
                                    render2xResultsForSelectedBalls(window.selectedBalls);
                                } else if (resultsDiv) {
                                    resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0; text-align: center;">Select numbers to see their frequencies and draw dates.</div>';
                                }
                            }
                        }, 1000);
                    } else {
                        // We have draw data, render the ball panel
                        console.log('Rendering 2x ball panel with', window.filteredDrawRows.length, 'draws');
                        renderTwoXBallPanel();
                        
                        // Show results if we have selected balls
                        if (window.selectedBalls.length > 0) {
                            render2xResultsForSelectedBalls(window.selectedBalls);
                        } else if (resultsDiv) {
                            resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0; text-align: center;">Select numbers to see their frequencies and draw dates.</div>';
                        }
                    }
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
                    // Store draw rows for highlighting and filtering
                    const drawRows = [];
                    window.filteredDrawRows = []; // Initialize the global filteredDrawRows array
                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        // Get the raw winning numbers without modifying the case
                        let winNumbers = (row['Winning Numbers'] || '').trim();
                        // Check if this is a valid draw row (has a date and looks like a draw)
                        if (row.Date && (winNumbers.toLowerCase().includes('powerball') || winNumbers.match(/^(\d+\s*-\s*)+\d+$/))) {
                            // --- Main Numbers ---
                            let mainNumbers;
                            if (winNumbers.toLowerCase().includes('powerball')) {
                                // Handle both 'Powerball® Numbers' and 'Powerball Numbers' formats
                                mainNumbers = (row['Winning Numbers'] || '').replace(/.*[nN]umbers\s*/i, '').replace(/®/g, '').trim();
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
                                // Check if the next row is a continuation (empty date) and contains Double Play
                                if ((!nextRow.Date || nextRow.Date.trim() === '') && nextRow['Winning Numbers'] && 
                                    (nextRow['Winning Numbers'].toLowerCase().includes('double play') || 
                                     nextRow['Winning Numbers'].match(/^(\d+\s*-\s*)+\d+$/))) {
                                    
                                    // Extract Double Play numbers, handling both formats
                                    let dpNums = (nextRow['Winning Numbers'] || '').trim();
                                    dpNums = dpNums.replace(/.*[nN]umbers\s*/i, '').replace(/®/g, '').trim();
                                    
                                    // Process the numbers
                                    doublePlayArr = dpNums.split(' - ').map(x => x.trim()).filter(Boolean);
                                    doublePlayArr.forEach(num => {
                                        if (numberStats[num]) {
                                            numberStats[num].count++;
                                            numberStats[num].dates.push(row.Date + ' (Double Play)');
                                        }
                                    });
                                    
                                    // Get the Powerball number from the Double Play row
                                    const numsArr = dpNums.split(' - ');
                                    if (numsArr.length > 0) {
                                        doublePlayPowerball = nextRow['Powerball'] || numsArr[numsArr.length - 1];
                                        doublePlayNumbers = numsArr.slice(0, Math.min(numsArr.length, 5)).join(' - ');
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
                            const drawObj = {
                                date: row.Date,
                                mainArr: mainArr.map(Number),
                                powerball: powerball,
                                doublePlayArr: doublePlayArr ? doublePlayArr.map(Number) : null,
                                doublePlayPowerball: doublePlayPowerball
                            };
                            
                            // Add to draw rows for highlighting
                            drawRows.push(drawObj);
                            // Also add to filteredDrawRows for the 2x tab
                            window.filteredDrawRows.push(drawObj);
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
                        console.log('[2x] Creating ball elements...');
                        for (let i = 1; i <= 69; i++) {
                            const ball = document.createElement('div');
                            ball.className = 'ball';
                            ball.textContent = i;
                            ball.dataset.number = i; // Add data attribute for easier debugging
                            
                            // Set initial selection state
                            const isSelected = window.selectedBalls && window.selectedBalls.includes(i);
                            if (isSelected) {
                                ball.classList.add('selected');
                            }
                            console.log(`[2x] Created ball ${i}, selected: ${isSelected}`);
                            
                            // Add click handler with event delegation check
                            ball.addEventListener('click', function ballClickHandler(e) {
                                console.log(`[2x] Ball ${i} clicked!`);
                                console.log('Event target:', e.target);
                                console.log('Current target:', e.currentTarget);
                                
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const ballNumber = parseInt(this.textContent);
                                console.log('[2x] Parsed ball number:', ballNumber);
                                
                                // Initialize selectedBalls if needed
                                window.selectedBalls = window.selectedBalls || [];
                                console.log('[2x] Current selectedBalls:', [...window.selectedBalls]);
                                
                                const index = window.selectedBalls.indexOf(ballNumber);
                                
                                if (index === -1) {
                                    window.selectedBalls.push(ballNumber);
                                    this.classList.add('selected');
                                    console.log('[2x] Added to selection');
                                } else {
                                    window.selectedBalls.splice(index, 1);
                                    this.classList.remove('selected');
                                    console.log('[2x] Removed from selection');
                                }
                                
                                console.log('[2x] Updated selectedBalls:', window.selectedBalls);
                                
                                // Force a re-render
                                try {
                                    console.log('[2x] Calling render2xResultsForSelectedBalls...');
                                    render2xResultsForSelectedBalls(window.selectedBalls);
                                    console.log('[2x] render2xResultsForSelectedBalls completed');
                                } catch (error) {
                                    console.error('[2x] Error in render2xResultsForSelectedBalls:', error);
                                }
                            });
                            
                            // Add mouseover/mouseout for visual feedback
                            ball.addEventListener('mouseover', function() {
                                this.style.transform = 'scale(1.1)';
                                this.style.transition = 'transform 0.2s';
                            });
                            
                            ball.addEventListener('mouseout', function() {
                                this.style.transform = 'scale(1)';
                            });
                            
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
                        
                        // Create a container for better organization
                        const ballContainer = document.createElement('div');
                        ballContainer.style.display = 'flex';
                        ballContainer.style.flexWrap = 'wrap';
                        ballContainer.style.gap = '8px';
                        ballContainer.style.padding = '10px';
                        ballContainer.style.justifyContent = 'center';
                        
                        for (let n = 1; n <= 69; n++) {
                            const ball = document.createElement('span');
                            ball.className = 'ball';
                            ball.textContent = n;
                            ball.setAttribute('data-ball-number', n);
                            
                            // Add hover effect
                            ball.style.transition = 'all 0.2s ease';
                            ball.style.cursor = 'pointer';
                            
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
                                renderComboResults(Array.from(selectedBalls), 'combo-tab-results');
                            };
                            
                            // Add hover effect
                            ball.addEventListener('mouseover', function() {
                                if (!ball.classList.contains('selected')) {
                                    ball.style.transform = 'scale(1.1)';
                                }
                            });
                            
                            ball.addEventListener('mouseout', function() {
                                if (!ball.classList.contains('selected')) {
                                    ball.style.transform = 'scale(1)';
                                }
                            });
                            
                            ballContainer.appendChild(ball);
                        }
                        
                        panel.appendChild(ballContainer);
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
                    const tabCombo = document.getElementById('tab-combo');
                    const tabHistory = document.getElementById('tab-history');
                    
                    if (tabCombo && tabCombo.style.display === 'block') {
                        renderComboBallPanel();
                        renderComboResults([]);
                    }
                    if (tabHistory && tabHistory.style.display === 'block') renderHistoryTab();

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
            
            // Initialize download buttons after CSV is loaded and processed
            initializeDownloadButtons();
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

// Function to generate combinations of numbers
function generateCombinations(numbers, size) {
    const result = [];
    
    function backtrack(start, current) {
        if (current.length === size) {
            result.push([...current]);
            return;
        }
        
        for (let i = start; i < numbers.length; i++) {
            current.push(numbers[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }
    
    backtrack(0, []);
    return result;
}

// Function to count occurrences of combinations in the draw history and track draw dates
function countPowerballCombinations(draws, comboSize) {
    const comboMap = new Map();
    
    draws.forEach(draw => {
        const numbers = [...draw.mainArr].sort((a, b) => a - b);
        const drawDate = draw.date || 'Unknown date';
        const combinations = generateCombinations(numbers, comboSize);
        
        combinations.forEach(combo => {
            const key = combo.join(',');
            const existing = comboMap.get(key) || { count: 0, dates: [] };
            comboMap.set(key, {
                count: existing.count + 1,
                dates: [...existing.dates, drawDate].sort().reverse()
            });
        });
    });
    
    return comboMap;
}

// Function to render the ball panel for Combo45 tab
function renderPowerballCombo45BallPanel() {
    const ballPanel = document.getElementById('combo45-ball-panel');
    if (!ballPanel) return;
    
    let html = '<div class="ball-panel-container" style="display: flex; flex-wrap: wrap; gap: 5px;">';
    for (let i = 1; i <= 69; i++) {
        html += `<span class="ball" data-number="${i}" style="cursor: pointer;" 
                  onclick="togglePowerballCombo45Selection(${i}, this)">${i}</span>`;
    }
    html += '</div>';
    
    ballPanel.innerHTML = html;
    
    // Add event listener for clear button
    const clearBtn = document.getElementById('combo45-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearPowerballCombo45Selection);
    }
    
    // Add event listeners for search
    const searchInput = document.getElementById('combo45-search');
    const searchBtn = document.getElementById('combo45-search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                filterPowerballCombo45Results();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', filterPowerballCombo45Results);
    }
}

// Toggle number selection in Combo45 tab
function togglePowerballCombo45Selection(number, element) {
    console.log('togglePowerballCombo45Selection called with:', number, element);
    
    // Initialize if not exists
    if (!window.powerballCombo45SelectedNumbers) {
        console.log('Initializing powerballCombo45SelectedNumbers array');
        window.powerballCombo45SelectedNumbers = [];
    }
    
    const index = window.powerballCombo45SelectedNumbers.indexOf(number);
    if (index === -1) {
        // Add number to selection
        console.log('Adding number to selection:', number);
        window.powerballCombo45SelectedNumbers.push(number);
        if (element) {
            console.log('Updating element visual state: selected');
            element.classList.add('selected');
            element.style.backgroundColor = '#e74c3c';
            element.style.color = 'white';
        }
    } else {
        // Remove number from selection
        console.log('Removing number from selection:', number);
        window.powerballCombo45SelectedNumbers.splice(index, 1);
        if (element) {
            console.log('Updating element visual state: deselected');
            element.classList.remove('selected');
            element.style.backgroundColor = '#f0f0f0';
            element.style.color = '#333';
        }
    }
    
    console.log('Current selected numbers:', window.powerballCombo45SelectedNumbers);
    
    // Update the display
    updatePowerballCombo45SelectedNumbers();
    
    // Only filter if we have the data loaded
    if (window.powerballCombo45Data) {
        console.log('Filtering results with current selection');
        filterPowerballCombo45Results();
    } else {
        console.log('No data loaded yet, triggering full render');
        // If no data yet, trigger a full render
        renderPowerballCombo45Results();
    }
}

// Clear all selected numbers in Combo45 tab
function clearPowerballCombo45Selection() {
    console.log('clearPowerballCombo45Selection called');
    
    // Clear the selected numbers array
    window.powerballCombo45SelectedNumbers = [];
    console.log('Cleared selected numbers array');
    
    // Clear selected state from all balls
    const balls = document.querySelectorAll('#combo45-ball-panel .ball, .combo-table-container .ball');
    console.log('Found', balls.length, 'balls to clear');
    
    balls.forEach((ball, index) => {
        console.log(`Clearing ball ${index + 1}/${balls.length}`);
        ball.classList.remove('selected');
        ball.style.backgroundColor = '#f0f0f0';
        ball.style.color = '#333';
        ball.style.transform = 'scale(1)';
        ball.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Clear search input
    const searchInput = document.getElementById('powerball-combo45-search');
    if (searchInput) {
        console.log('Clearing search input');
        searchInput.value = '';
        window.powerballCombo45SearchQuery = '';
    }
    
    console.log('Triggering full re-render of results');
    // Force re-render the results
    renderPowerballCombo45Results();
    
    // Double-check the selected numbers after render
    console.log('After clear - selected numbers:', window.powerballCombo45SelectedNumbers);
}

// Update the selected numbers display
function updatePowerballCombo45SelectedNumbers() {
    const container = document.getElementById('combo45-selected-numbers');
    if (!container) return;
    
    // Make sure we're using the correct variable name
    const selectedNumbers = window.powerballCombo45SelectedNumbers || [];
    
    container.innerHTML = selectedNumbers.length > 0
        ? selectedNumbers.map(num => 
            `<span class="ball" 
                  style="background: #e74c3c; margin: 0 2px; padding: 2px 8px; border-radius: 50%; color: white;
                         display: inline-flex; align-items: center; justify-content: center;
                         width: 24px; height: 24px; font-size: 14px;"
                  onclick="togglePowerballCombo45Selection(${num}, this)">${num}</span>`
          ).join('')
        : '<span style="color: #777;">No numbers selected</span>';
        
    console.log('Updated selected numbers display:', selectedNumbers);
}

// Filter results based on search and selected numbers
function filterPowerballCombo45Results() {
    console.log('=== filterPowerballCombo45Results called ===');
    const searchInput = document.getElementById('powerball-combo45-search');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const resultsContainer = document.getElementById('combo45-results');
    
    console.log('Search term:', searchTerm);
    console.log('Selected numbers:', window.powerballCombo45SelectedNumbers);
    
    if (!resultsContainer || !window.powerballCombo45Data) {
        console.log('Missing container or data:', { 
            hasContainer: !!resultsContainer, 
            hasData: !!window.powerballCombo45Data 
        });
        return;
    }
    
    const { fourNumberResults, fiveNumberResults } = window.powerballCombo45Data;
    console.log('Total combos before filtering:', {
        fourNumber: fourNumberResults.length,
        fiveNumber: fiveNumberResults.length
    });
    
    const filterFn = (combo) => {
        // Debug: Log the current combo being checked
        console.log('Checking combo:', combo);
        
        // If no numbers selected, show all combos
        if (!window.powerballCombo45SelectedNumbers || window.powerballCombo45SelectedNumbers.length === 0) {
            console.log('No numbers selected, showing all combos');
            return true;
        }
        
        console.log('Selected numbers to filter by:', window.powerballCombo45SelectedNumbers);
        
        // Convert combo numbers to numbers for comparison
        const comboNumbers = combo.numbers.map(n => Number(n));
        console.log('Combo numbers (as numbers):', comboNumbers);
        
        // Check if the combo includes ALL selected numbers
        const hasAllSelected = window.powerballCombo45SelectedNumbers.every(num => {
            const searchNum = Number(num);
            const included = comboNumbers.includes(searchNum);
            console.log(`  - Looking for ${searchNum} in [${comboNumbers.join(',')}]: ${included ? 'FOUND' : 'not found'}`);
            return included;
        });
        
        console.log(`Combo [${comboNumbers.join(',')}] ${hasAllSelected ? 'includes ALL' : 'does NOT include all'} selected numbers`);
        
        return hasAllSelected;
        
        // Filter by search term if provided
        if (searchTerm) {
            const searchNumbers = searchTerm.split(/\s+/).filter(n => n.length > 0);
            if (searchNumbers.length > 0) {
                const hasAllSearched = searchNumbers.every(term => 
                    combo.numbers.some(num => num.toString() === term)
                );
                if (!hasAllSearched) return false;
            }
        }
        
        return true;
    };
    
    const filteredFourNumber = fourNumberResults.filter(filterFn);
    const filteredFiveNumber = fiveNumberResults.filter(filterFn);
    
    // Update the display with filtered results
    updatePowerballCombo45Display(filteredFourNumber, filteredFiveNumber);
}

// Generate HTML for a combo table (moved to global scope)
function generateComboTable(combos, title) {
    if (combos.length === 0) {
        console.log(`No ${title.toLowerCase()} combinations to display`);
        return '';
    }
    
    console.log(`Rendering ${combos.length} ${title.toLowerCase()} combinations`);
    
    const rows = combos.map(combo => {
        const ballsHtml = combo.numbers.map(num => {
            const isSelected = window.powerballCombo45SelectedNumbers && 
                             window.powerballCombo45SelectedNumbers.includes(num);
            return `<span class="ball" 
                       style="margin: 2px; display: inline-flex; align-items: center; justify-content: center; 
                              width: 30px; height: 30px; font-size: 14px; 
                              background: ${isSelected ? '#e74c3c' : '#3498db'}; 
                              color: white; border-radius: 50%;
                              cursor: pointer;
                              box-shadow: ${isSelected ? '0 0 0 2px #000' : 'none'};"
                       onclick="togglePowerballCombo45Selection(${num}, this)">${num}</span>`;
        }).join('\n');
        
        // Format dates for display (show most recent 3 or all if <= 3)
        const maxDatesToShow = 3;
        const datesToShow = combo.dates.length > maxDatesToShow 
            ? [...combo.dates.slice(0, maxDatesToShow), `+${combo.dates.length - maxDatesToShow} more`]
            : combo.dates;
        
        const datesHtml = datesToShow.map((date, i) => {
            if (typeof date === 'string' && date.startsWith('+')) {
                return `<div style="color: #7f8c8d; font-style: italic;">${date}</div>`;
            }
            return `<div>${date}${i < datesToShow.length - 1 ? ',' : ''}</div>`;
        }).join('');
        
        return `
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px; vertical-align: middle;">
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px;">
                        ${ballsHtml}
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d; margin-top: 6px;">
                        <strong>Appeared on:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                            ${datesHtml}
                        </div>
                    </div>
                </td>
                <td style="padding: 12px; text-align: center; font-weight: bold; vertical-align: middle;">
                    ${combo.count}x
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="combo-table-container" style="margin-bottom: 40px;">
            <h3 style="color: #2c3e50; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
                ${title} (${combos.length} combinations)
            </h3>
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background-color: #f5f7fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e0e0e0;">
                                Numbers & Draw Dates
                            </th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e0e0e0; width: 80px;">
                                Frequency
                            </th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
}

// Update the display with filtered results
function updatePowerballCombo45Display(fourNumberResults, fiveNumberResults) {
    const resultsContainer = document.getElementById('combo45-results');
    if (!resultsContainer) return;
    
    // Generate the final HTML with both tables stacked vertically
    let html = `
        <div style="margin-top: 20px;">
            ${generateComboTable(fourNumberResults, '4-Number Combinations')}
            ${generateComboTable(fiveNumberResults, '5-Number Combinations')}
        </div>
    `;
    
    if (fourNumberResults.length === 0 && fiveNumberResults.length === 0) {
        const searchTerm = document.getElementById('combo45-search')?.value || '';
        const noResultsMsg = searchTerm 
            ? `No combinations found matching "${searchTerm}"${window.powerballCombo45Selected?.length ? ' with selected numbers' : ''}.`
            : 'No combinations found that match the selected criteria.';
        
        html = `<div style="text-align: center; padding: 30px; color: #666; font-size: 16px;">${noResultsMsg}</div>`;
    }
    
    resultsContainer.innerHTML = html;
}

// Function to render the 4&5 Combo tab results with enhanced features
function renderPowerballCombo45Results() {
    const resultsContainer = document.getElementById('combo45-results');
    if (!resultsContainer || !window.filteredDrawRows) return;
    
    // Filter valid draws (only main numbers, no Powerball) and filter by date range (2016-2025)
    const validDraws = window.filteredDrawRows.filter(draw => {
        if (!draw || !Array.isArray(draw.mainArr) || draw.mainArr.length !== 5) return false;
        
        // Check if the draw is within the date range (2016-2025)
        if (draw.date) {
            const year = new Date(draw.date).getFullYear();
            return year >= 2016 && year <= 2025;
        }
        return true; // Include if date is not available
    });
    
    // Count 4-number and 5-number combinations with dates
    const fourNumberCombos = countPowerballCombinations(validDraws, 4);
    const fiveNumberCombos = countPowerballCombinations(validDraws, 5);
    
    // Process and filter combinations
    const processCombos = (comboMap, comboSize) => {
        const combos = [];
        comboMap.forEach((comboData, comboStr) => {
            if (comboData.count >= 2) {
                combos.push({
                    numbers: comboStr.split(',').map(Number).sort((a, b) => a - b),
                    count: comboData.count,
                    dates: comboData.dates || [],
                    type: `${comboSize}-number`
                });
            }
        });
        
        // Sort by count (descending) and then by numbers
        return combos.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.numbers.join(',').localeCompare(b.numbers.join(','));
        });
    };
    
    const fourNumberResults = processCombos(fourNumberCombos, 4);
    const fiveNumberResults = processCombos(fiveNumberCombos, 5);
    
    // Generate HTML for a combo table with enhanced features
    const generateComboTable = (combos, title) => {
        if (combos.length === 0) return document.createElement('div');
        
        const container = document.createElement('div');
        container.className = 'combo-table-container';
        container.style.marginBottom = '40px';
        container.style.width = '100%';
        container.style.maxWidth = '1000px';
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = `${title} (${combos.length} combinations)`;
        titleEl.style.color = '#2c3e50';
        titleEl.style.margin = '0 0 20px 0';
        titleEl.style.padding = '0 0 10px 0';
        titleEl.style.borderBottom = '2px solid #dee2e6';
        titleEl.style.fontSize = '1.25rem';
        titleEl.style.fontWeight = '600';
        
        const tableContainer = document.createElement('div');
        tableContainer.style.width = '100%';
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.05)';
        tableContainer.style.borderRadius = '8px';
        tableContainer.style.border = '1px solid #e9ecef';
        
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'separate';
        table.style.borderSpacing = '0';
        table.style.tableLayout = 'fixed';
        table.style.backgroundColor = 'white';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const th1 = document.createElement('th');
        th1.textContent = 'Combination';
        th1.style.padding = '12px 16px';
        th1.style.textAlign = 'left';
        th1.style.backgroundColor = '#f8f9fa';
        th1.style.borderBottom = '2px solid #dee2e6';
        th1.style.fontWeight = '600';
        th1.style.color = '#495057';
        th1.style.position = 'sticky';
        th1.style.top = '0';
        th1.style.zIndex = '10';
        
        const th2 = document.createElement('th');
        th2.textContent = 'Frequency';
        th2.style.padding = '12px 16px';
        th2.style.textAlign = 'center';
        th2.style.backgroundColor = '#f8f9fa';
        th2.style.borderBottom = '2px solid #dee2e6';
        th2.style.width = '120px';
        th2.style.fontWeight = '600';
        th2.style.color = '#495057';
        th2.style.position = 'sticky';
        th2.style.top = '0';
        th2.style.zIndex = '10';
        
        const th3 = document.createElement('th');
        th3.textContent = 'Draw Dates';
        th3.style.padding = '12px 16px';
        th3.style.textAlign = 'left';
        th3.style.backgroundColor = '#f8f9fa';
        th3.style.borderBottom = '2px solid #dee2e6';
        th3.style.width = '300px';
        th3.style.fontWeight = '600';
        th3.style.color = '#495057';
        th3.style.position = 'sticky';
        th3.style.top = '0';
        th3.style.zIndex = '10';
        
        headerRow.appendChild(th1);
        headerRow.appendChild(th2);
        headerRow.appendChild(th3);
        thead.appendChild(headerRow);
        
        const tbody = document.createElement('tbody');
        
        combos.forEach(combo => {
            const row = document.createElement('tr');
            
            // Create balls cell
            const ballsCell = document.createElement('td');
            ballsCell.style.padding = '16px';
            ballsCell.style.borderBottom = '1px solid #e9ecef';
            ballsCell.style.verticalAlign = 'middle';
            ballsCell.style.transition = 'background-color 0.15s ease';
            
            // Add hover effect to row
            row.addEventListener('mouseenter', () => {
                ballsCell.style.backgroundColor = '#f8f9fa';
            });
            
            row.addEventListener('mouseleave', () => {
                ballsCell.style.backgroundColor = '';
            });
            
            const ballsContainer = document.createElement('div');
            ballsContainer.style.display = 'flex';
            ballsContainer.style.gap = '6px';
            ballsContainer.style.flexWrap = 'wrap';
            ballsContainer.style.alignItems = 'center';
            
            combo.numbers.forEach(num => {
                const isSelected = window.powerballCombo45SelectedNumbers && 
                                 window.powerballCombo45SelectedNumbers.includes(num);
                const isInSearch = window.powerballCombo45SearchQuery && 
                                 window.powerballCombo45SearchQuery.includes(num.toString());
                
                const ball = document.createElement('span');
                ball.className = 'ball';
                ball.textContent = num;
                ball.dataset.number = num;
                ball.style.cursor = 'pointer';
                ball.style.display = 'inline-flex';
                ball.style.alignItems = 'center';
                ball.style.justifyContent = 'center';
                ball.style.width = '32px';
                ball.style.height = '32px';
                ball.style.borderRadius = '50%';
                ball.style.fontSize = '14px';
                ball.style.fontWeight = 'bold';
                ball.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                ball.style.transition = 'all 0.2s ease';
                
                if (isSelected) {
                    ball.style.backgroundColor = '#e74c3c';
                    ball.style.color = 'white';
                    ball.style.transform = 'scale(1.1)';
                    ball.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                } else if (isInSearch) {
                    ball.style.backgroundColor = '#f39c12';
                    ball.style.color = 'white';
                    ball.style.boxShadow = '0 2px 6px rgba(243, 156, 18, 0.3)';
                } else {
                    ball.style.backgroundColor = '#f0f0f0';
                    ball.style.color = '#333';
                    ball.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
                
                ball.addEventListener('click', (e) => {
                    e.stopPropagation();
                    togglePowerballCombo45Selection(num, ball);
                });
                
                ballsContainer.appendChild(ball);
            });
            
            ballsCell.appendChild(ballsContainer);
            
            // Create count cell
            const countCell = document.createElement('td');
            countCell.textContent = combo.count + '×';
            countCell.style.padding = '16px';
            countCell.style.textAlign = 'center';
            countCell.style.borderBottom = '1px solid #e9ecef';
            countCell.style.fontWeight = 'bold';
            countCell.style.verticalAlign = 'middle';
            countCell.style.color = '#2c3e50';
            countCell.style.fontSize = '1.05em';
            countCell.style.transition = 'background-color 0.15s ease';
            
            // Create dates cell
            const datesCell = document.createElement('td');
            datesCell.style.padding = '16px';
            datesCell.style.borderBottom = '1px solid #e9ecef';
            datesCell.style.verticalAlign = 'middle';
            datesCell.style.transition = 'background-color 0.15s ease';
            
            // Create dates cell content
            const maxDatesToShow = 3;
            const datesToShow = combo.dates.length > maxDatesToShow 
                ? [...combo.dates.slice(0, maxDatesToShow), `+${combo.dates.length - maxDatesToShow} more`]
                : combo.dates;
            
            const datesContainer = document.createElement('div');
            datesContainer.style.display = 'flex';
            datesContainer.style.flexDirection = 'column';
            datesContainer.style.gap = '6px';
            datesContainer.style.fontSize = '0.9em';
            datesContainer.style.color = '#6c757d';
            
            datesToShow.forEach((date) => {
                const dateEl = document.createElement('div');
                dateEl.textContent = date;
                dateEl.style.whiteSpace = 'nowrap';
                dateEl.style.overflow = 'hidden';
                dateEl.style.textOverflow = 'ellipsis';
                dateEl.style.padding = '2px 0';
                dateEl.style.transition = 'color 0.2s ease';
                datesContainer.appendChild(dateEl);
            });
            
            datesCell.appendChild(datesContainer);
            
            // Append cells to row
            // Add click handler for 4-number combos to show 5th number and dates in the right panel
            if (combo.numbers.length === 4) {
                // Make the frequency count clickable
                countCell.style.cursor = 'pointer';
                countCell.style.color = '#3498db';
                countCell.style.textDecoration = 'underline';
                countCell.title = 'Click to see 5th number and draw dates';
                
                // Add hover effect for better UX
                const highlightRow = () => {
                    row.style.backgroundColor = '#f0f7ff';
                    countCell.style.color = '#1a73e8';
                };
                
                const unhighlightRow = () => {
                    row.style.backgroundColor = '';
                    countCell.style.color = '#3498db';
                };
                
                countCell.addEventListener('mouseenter', highlightRow);
                row.addEventListener('mouseenter', highlightRow);
                
                countCell.addEventListener('mouseleave', unhighlightRow);
                row.addEventListener('mouseleave', unhighlightRow);
                
                // Handle click on frequency count
                const handleFrequencyClick = () => {
                    // Find all 5-number combos that include this 4-number combo
                    const matchingCombos = fiveNumberResults.filter(fiveCombo => {
                        return combo.numbers.every(num => fiveCombo.numbers.includes(num));
                    });
                    
                    // Update the right panel with the details
                    const detailsPanel = document.getElementById('combo45-details-content');
                    if (!detailsPanel) return;
                    
                    detailsPanel.innerHTML = ''; // Clear previous content
                    
                    if (matchingCombos.length === 0) {
                        detailsPanel.innerHTML = `
                            <div style="text-align: center; color: #6c757d; font-style: italic;">
                                No matching 5-number combinations found for this set.
                            </div>
                        `;
                        return;
                    }
                    
                    // Create header
                    const header = document.createElement('div');
                    header.style.fontWeight = 'bold';
                    header.style.marginBottom = '12px';
                    header.style.color = '#2c3e50';
                    header.style.borderBottom = '1px solid #eee';
                    header.style.paddingBottom = '8px';
                    header.textContent = `5th Number Details for: ${combo.numbers.join(', ')}`;
                    
                    detailsPanel.appendChild(header);
                    
                    // Group by the 5th number
                    const combosByFifthNumber = {};
                    matchingCombos.forEach(match => {
                        const fifthNumber = match.numbers.find(n => !combo.numbers.includes(n));
                        if (!combosByFifthNumber[fifthNumber]) {
                            combosByFifthNumber[fifthNumber] = [];
                        }
                        combosByFifthNumber[fifthNumber].push(match);
                    });
                    
                    // Create a section for each 5th number
                    Object.entries(combosByFifthNumber).forEach(([fifthNumber, combos]) => {
                        const section = document.createElement('div');
                        section.style.marginBottom = '16px';
                        section.style.paddingBottom = '12px';
                        section.style.borderBottom = '1px solid #f0f0f0';
                        
                        // 5th number display
                        const fifthNumberDiv = document.createElement('div');
                        fifthNumberDiv.style.display = 'flex';
                        fifthNumberDiv.style.alignItems = 'center';
                        fifthNumberDiv.style.marginBottom = '10px';
                        
                        const label = document.createElement('span');
                        label.textContent = '5th Number: ';
                        label.style.marginRight = '8px';
                        label.style.fontWeight = '500';
                        
                        const ball = document.createElement('span');
                        ball.className = 'ball';
                        ball.textContent = fifthNumber;
                        ball.style.width = '32px';
                        ball.style.height = '32px';
                        ball.style.display = 'inline-flex';
                        ball.style.alignItems = 'center';
                        ball.style.justifyContent = 'center';
                        ball.style.borderRadius = '50%';
                        ball.style.fontWeight = 'bold';
                        ball.style.backgroundColor = '#e74c3c';
                        ball.style.color = 'white';
                        ball.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        
                        fifthNumberDiv.appendChild(label);
                        fifthNumberDiv.appendChild(ball);
                        
                        // Occurrences count
                        const totalOccurrences = combos.reduce((sum, c) => sum + c.dates.length, 0);
                        const occurrencesText = document.createElement('div');
                        occurrencesText.textContent = `Appears in ${totalOccurrences} draw${totalOccurrences !== 1 ? 's' : ''}`;
                        occurrencesText.style.fontSize = '0.9em';
                        occurrencesText.style.color = '#6c757d';
                        occurrencesText.style.marginBottom = '8px';
                        
                        // Draw dates
                        const datesTitle = document.createElement('div');
                        datesTitle.textContent = 'Draw Dates:';
                        datesTitle.style.fontWeight = '500';
                        datesTitle.style.marginBottom = '6px';
                        
                        const datesList = document.createElement('div');
                        datesList.style.maxHeight = '150px';
                        datesList.style.overflowY = 'auto';
                        datesList.style.padding = '6px';
                        datesList.style.background = '#f8f9fa';
                        datesList.style.borderRadius = '4px';
                        datesList.style.fontSize = '0.85em';
                        
                        // Get all unique dates and sort them
                        const allDates = [];
                        combos.forEach(c => {
                            c.dates.forEach(date => {
                                if (!allDates.includes(date)) allDates.push(date);
                            });
                        });
                        
                        allDates.sort((a, b) => new Date(b) - new Date(a)); // Newest first
                        
                        allDates.forEach(date => {
                            const dateItem = document.createElement('div');
                            dateItem.textContent = date;
                            dateItem.style.padding = '4px 0';
                            dateItem.style.borderBottom = '1px solid #eee';
                            dateItem.style.display = 'flex';
                            dateItem.style.justifyContent = 'space-between';
                            
                            // Add draw type indicator if available (Main/Double Play)
                            const drawType = combos.find(c => c.dates.includes(date))?.type || '';
                            if (drawType) {
                                const typeBadge = document.createElement('span');
                                typeBadge.textContent = drawType === 'Main' ? 'M' : 'DP';
                                typeBadge.style.fontSize = '0.8em';
                                typeBadge.style.padding = '1px 6px';
                                typeBadge.style.borderRadius = '10px';
                                typeBadge.style.background = drawType === 'Main' ? '#e3f2fd' : '#e8f5e9';
                                typeBadge.style.color = drawType === 'Main' ? '#1976d2' : '#2e7d32';
                                typeBadge.style.fontWeight = '500';
                                
                                dateItem.appendChild(typeBadge);
                            }
                            
                            datesList.appendChild(dateItem);
                        });
                        
                        section.appendChild(fifthNumberDiv);
                        section.appendChild(occurrencesText);
                        section.appendChild(datesTitle);
                        section.appendChild(datesList);
                        
                        detailsPanel.appendChild(section);
                    });
                    
                    // Scroll the details panel into view if it's not fully visible
                    detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                };
                
                // Add click handler to the frequency count with capture phase
                countCell.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    handleFrequencyClick();
                    return false;
                }, true); // Use capture phase to ensure we get the event first
                
                // Also allow clicking anywhere on the row (except the balls which have their own handlers)
                row.addEventListener('click', function(e) {
                    if (!e.target.closest('.ball') && e.target !== countCell) {
                        e.stopPropagation();
                        e.preventDefault();
                        handleFrequencyClick();
                        return false;
                    }
                }, true); // Use capture phase
            }
            
            row.appendChild(ballsCell);
            row.appendChild(countCell);
            row.appendChild(datesCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        container.appendChild(titleEl);
        container.appendChild(tableContainer);
        
        return container;
    };
    
    // Store the results for filtering
    window.powerballCombo45Data = { fourNumberResults, fiveNumberResults };
    
    // Initialize the ball panel if not already done
    const ballPanel = document.getElementById('combo45-ball-panel');
    if (ballPanel && !ballPanel.hasChildNodes()) {
        renderPowerballCombo45BallPanel();
    }
    
    // Clear previous content
    resultsContainer.innerHTML = '';
    
    // Add the ball panel
    if (ballPanel) {
        const ballPanelContainer = document.createElement('div');
        ballPanelContainer.style.marginBottom = '20px';
        ballPanelContainer.style.width = '100%';
        ballPanelContainer.appendChild(ballPanel);
        resultsContainer.appendChild(ballPanelContainer);
        
        // Add help text for the 4&5 combo feature
        const helpText = document.createElement('div');
        helpText.style.marginBottom = '20px';
        helpText.style.padding = '12px';
        helpText.style.backgroundColor = '#e9f7fe';
        helpText.style.borderLeft = '4px solid #3498db';
        helpText.style.borderRadius = '4px';
        helpText.style.fontSize = '0.9em';
        helpText.style.color = '#2c3e50';
        helpText.innerHTML = '💡 <strong>Tip:</strong> Click on any 4-number combination\'s frequency count to see the 5th number and draw dates in the right panel.';
        
        resultsContainer.appendChild(helpText);
    }
    
    // Add search container
    const searchContainer = document.createElement('div');
    searchContainer.style.marginBottom = '24px';
    searchContainer.style.width = '100%';
    searchContainer.style.maxWidth = '800px';
    searchContainer.style.margin = '0 auto 24px';
    
    const searchBoxContainer = document.createElement('div');
    searchBoxContainer.style.display = 'flex';
    searchBoxContainer.style.gap = '10px';
    searchBoxContainer.style.marginBottom = '15px';
    searchBoxContainer.style.alignItems = 'center';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'powerball-combo45-search';
    searchInput.placeholder = 'Search numbers (e.g., 5 10 15 or 5,10,15)';
    searchInput.style.padding = '10px 14px';
    searchInput.style.border = '1px solid #ced4da';
    searchInput.style.borderRadius = '6px';
    searchInput.style.flexGrow = '1';
    searchInput.style.fontSize = '14px';
    searchInput.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
    searchInput.style.transition = 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out';
    searchInput.value = window.powerballCombo45SearchQuery || '';
    
    // Add focus effect
    searchInput.addEventListener('focus', () => {
        searchInput.style.borderColor = '#80bdff';
        searchInput.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,0.25)';
        searchInput.style.outline = 'none';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.borderColor = '#ced4da';
        searchInput.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
    });
    
    const clearButton = document.createElement('button');
    clearButton.id = 'powerball-combo45-clear';
    clearButton.textContent = 'Clear All';
    clearButton.style.padding = '10px 20px';
    clearButton.style.backgroundColor = '#6c757d';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '6px';
    clearButton.style.cursor = 'pointer';
    clearButton.style.fontWeight = '500';
    clearButton.style.transition = 'all 0.2s ease';
    clearButton.style.whiteSpace = 'nowrap';
    
    // Add hover effect
    clearButton.addEventListener('mouseover', () => {
        clearButton.style.backgroundColor = '#5a6268';
        clearButton.style.transform = 'translateY(-1px)';
    });
    
    clearButton.addEventListener('mouseout', () => {
        clearButton.style.backgroundColor = '#6c757d';
        clearButton.style.transform = 'translateY(0)';
    });
    
    // Add active effect
    clearButton.addEventListener('mousedown', () => {
        clearButton.style.transform = 'translateY(1px)';
    });
    
    searchBoxContainer.appendChild(searchInput);
    searchBoxContainer.appendChild(clearButton);
    
    // Create selected numbers container
    const selectedNumbersContainer = document.createElement('div');
    selectedNumbersContainer.id = 'powerball-combo45-selected-numbers';
    selectedNumbersContainer.style.display = 'flex';
    selectedNumbersContainer.style.flexWrap = 'wrap';
    selectedNumbersContainer.style.gap = '6px';
    selectedNumbersContainer.style.marginBottom = '10px';
    selectedNumbersContainer.style.minHeight = '40px';
    selectedNumbersContainer.style.padding = '8px';
    selectedNumbersContainer.style.backgroundColor = '#f8f9fa';
    selectedNumbersContainer.style.borderRadius = '6px';
    selectedNumbersContainer.style.border = '1px solid #e9ecef';
    
    // Add help text
    const helpText = document.createElement('div');
    helpText.textContent = 'Tip: Click on numbers to select/deselect them. Use the search box to filter combinations.';
    helpText.style.fontSize = '0.85em';
    helpText.style.color = '#6c757d';
    helpText.style.marginTop = '8px';
    helpText.style.fontStyle = 'italic';
    
    searchContainer.appendChild(searchBoxContainer);
    searchContainer.appendChild(selectedNumbersContainer);
    searchContainer.appendChild(helpText);
    resultsContainer.appendChild(searchContainer);
    
    // Add the results container
    const resultsDiv = document.createElement('div');
    resultsDiv.style.width = '100%';
    
    // Add 4-number combos table
    if (fourNumberResults.length > 0) {
        const table1 = generateComboTable(fourNumberResults, '4-Number Combinations');
        table1.style.marginBottom = '30px';
        resultsDiv.appendChild(table1);
    } else {
        const noResults = document.createElement('div');
        noResults.textContent = 'No 4-number combinations found.';
        noResults.style.padding = '20px';
        noResults.style.textAlign = 'center';
        noResults.style.color = '#666';
        resultsDiv.appendChild(noResults);
    }
    
    // Add 5-number combos table
    if (fiveNumberResults.length > 0) {
        const table2 = generateComboTable(fiveNumberResults, '5-Number Combinations');
        resultsDiv.appendChild(table2);
    } else {
        const noResults = document.createElement('div');
        noResults.textContent = 'No 5-number combinations found.';
        noResults.style.padding = '20px';
        noResults.style.textAlign = 'center';
        noResults.style.color = '#666';
        resultsDiv.appendChild(noResults);
    }
    
    resultsContainer.appendChild(resultsDiv);
    
    // Initialize selected numbers array if not exists
    if (!window.powerballCombo45SelectedNumbers) {
        window.powerballCombo45SelectedNumbers = [];
    }
    
    // Initialize search query if not exists
    if (typeof window.powerballCombo45SearchQuery === 'undefined') {
        window.powerballCombo45SearchQuery = '';
    }
    
    // Set up event listeners for search and clear
    searchInput.addEventListener('input', (e) => {
        window.powerballCombo45SearchQuery = e.target.value.trim();
        filterPowerballCombo45Results();
    });
    
    // Add keyboard navigation for search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filterPowerballCombo45Results();
        } else if (e.key === 'Escape') {
            searchInput.blur();
        }
    });
    
    clearButton.addEventListener('click', () => {
        window.powerballCombo45SelectedNumbers = [];
        window.powerballCombo45SearchQuery = '';
        searchInput.value = '';
        searchInput.focus();
        filterPowerballCombo45Results();
    });
    
    // Add debounce to search input for better performance
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterPowerballCombo45Results();
        }, 300);
    });
    
    // Update the selected numbers display
    updatePowerballCombo45SelectedNumbers();
}

// Function to filter results based on search and selected numbers
function filterPowerballCombo45Results() {
    const { fourNumberResults, fiveNumberResults } = window.powerballCombo45Data || { fourNumberResults: [], fiveNumberResults: [] };
    
    // Filter based on search query and selected numbers
    const filterCombos = (combos) => {
        return combos.filter(combo => {
            // Filter by selected numbers
            if (window.powerballCombo45SelectedNumbers && window.powerballCombo45SelectedNumbers.length > 0) {
                const hasAllSelected = window.powerballCombo45SelectedNumbers.every(n => 
                    combo.numbers.includes(n)
                );
                if (!hasAllSelected) return false;
            }
            
            // Filter by search query
            if (window.powerballCombo45SearchQuery) {
                const searchNums = window.powerballCombo45SearchQuery
                    .split(/[\s,]+/)
                    .map(n => parseInt(n.trim(), 10))
                    .filter(n => !isNaN(n) && n >= 1 && n <= 69);
                
                if (searchNums.length > 0) {
                    const hasSearchNums = searchNums.every(n => 
                        combo.numbers.includes(n)
                    );
                    if (!hasSearchNums) return false;
                } else {
                    // Search by string match if no valid numbers
                    const searchLower = window.powerballCombo45SearchQuery.toLowerCase();
                    const comboStr = combo.numbers.join(',');
                    if (!comboStr.includes(searchLower)) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    };
    
    const filteredFourNumberResults = filterCombos(fourNumberResults);
    const filteredFiveNumberResults = filterCombos(fiveNumberResults);
    
    // Re-render with filtered results
    const resultsContainer = document.getElementById('combo45-results');
    if (resultsContainer) {
        // Clear previous results but keep the search and ball panel
        const searchContainer = resultsContainer.querySelector('div:first-child');
        const ballPanelContainer = resultsContainer.querySelector('div:first-child + div');
        
        resultsContainer.innerHTML = '';
        
        // Re-add the search container and ball panel
        if (searchContainer) resultsContainer.appendChild(searchContainer);
        if (ballPanelContainer) resultsContainer.appendChild(ballPanelContainer);
        
        // Add the results container
        const resultsDiv = document.createElement('div');
        resultsDiv.style.width = '100%';
        
        // Add 4-number combos table
        if (filteredFourNumberResults.length > 0) {
            const table1Html = generateComboTable(filteredFourNumberResults, '4-Number Combinations');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = table1Html;
            const table1 = tempDiv.firstElementChild;
            if (table1) {
                table1.style.marginBottom = '30px';
                resultsDiv.appendChild(table1);
            }
        } else if (fourNumberResults.length > 0) {
            const noResults = document.createElement('div');
            noResults.textContent = 'No 4-number combinations match the current filters.';
            noResults.style.padding = '20px';
            noResults.style.textAlign = 'center';
            noResults.style.color = '#666';
            resultsDiv.appendChild(noResults);
        }
        
        // Add 5-number combos table
        if (filteredFiveNumberResults.length > 0) {
            const table2Html = generateComboTable(filteredFiveNumberResults, '5-Number Combinations');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = table2Html;
            const table2 = tempDiv.firstElementChild;
            if (table2) {
                table2.style.marginBottom = '30px';
                resultsDiv.appendChild(table2);
            }
        } else if (fiveNumberResults.length > 0) {
            const noResults = document.createElement('div');
            noResults.textContent = 'No 5-number combinations match the current filters.';
            noResults.style.padding = '20px';
            noResults.style.textAlign = 'center';
            noResults.style.color = '#666';
            resultsDiv.appendChild(noResults);
        }
        
        resultsContainer.appendChild(resultsDiv);
        
        // Update the selected numbers display
        updatePowerballCombo45SelectedNumbers();
    }
}

// Function to update the selected numbers display
function updatePowerballCombo45SelectedNumbers() {
    const selectedNumbersContainer = document.getElementById('powerball-combo45-selected-numbers');
    if (!selectedNumbersContainer) return;
    
    selectedNumbersContainer.innerHTML = '';
    
    if (!window.powerballCombo45SelectedNumbers || window.powerballCombo45SelectedNumbers.length === 0) {
        const noSelection = document.createElement('div');
        noSelection.textContent = 'No numbers selected. Click on balls to select numbers.';
        noSelection.style.color = '#999';
        noSelection.style.fontStyle = 'italic';
        selectedNumbersContainer.appendChild(noSelection);
        return;
    }
    
    const selectedLabel = document.createElement('div');
    selectedLabel.textContent = 'Selected: ';
    selectedLabel.style.marginRight = '8px';
    selectedLabel.style.color = '#666';
    selectedNumbersContainer.appendChild(selectedLabel);
    
    window.powerballCombo45SelectedNumbers.forEach((num, index) => {
        const ball = document.createElement('span');
        ball.className = 'ball';
        ball.textContent = num;
        ball.style.display = 'inline-flex';
        ball.style.alignItems = 'center';
        ball.style.justifyContent = 'center';
        ball.style.width = '30px';
        ball.style.height = '30px';
        ball.style.borderRadius = '50%';
        ball.style.backgroundColor = '#e74c3c';
        ball.style.color = 'white';
        ball.style.fontWeight = 'bold';
        ball.style.cursor = 'pointer';
        ball.style.margin = '0 2px';
        
        ball.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = window.powerballCombo45SelectedNumbers.indexOf(num);
            if (index > -1) {
                window.powerballCombo45SelectedNumbers.splice(index, 1);
                updatePowerballCombo45SelectedNumbers();
                filterPowerballCombo45Results();
            }
        });
        
        selectedNumbersContainer.appendChild(ball);
        
        // Add comma separator if not the last element
        if (index < window.powerballCombo45SelectedNumbers.length - 1) {
            const comma = document.createElement('span');
            comma.textContent = ', ';
            selectedNumbersContainer.appendChild(comma);
        }
    });
    
    // Add clear all button
    const clearAll = document.createElement('button');
    clearAll.textContent = 'Clear All';
    clearAll.style.marginLeft = '10px';
    clearAll.style.padding = '2px 8px';
    clearAll.style.background = 'none';
    clearAll.style.border = '1px solid #e74c3c';
    clearAll.style.borderRadius = '4px';
    clearAll.style.color = '#e74c3c';
    clearAll.style.cursor = 'pointer';
    clearAll.style.fontSize = '0.8em';
    
    clearAll.addEventListener('click', () => {
        window.powerballCombo45SelectedNumbers = [];
        updatePowerballCombo45SelectedNumbers();
        filterPowerballCombo45Results();
    });
    
    selectedNumbersContainer.appendChild(clearAll);
}

// Function to toggle number selection
function togglePowerballCombo45Selection(number, element) {
    if (!window.powerballCombo45SelectedNumbers) {
        window.powerballCombo45SelectedNumbers = [];
    }
    
    const index = window.powerballCombo45SelectedNumbers.indexOf(number);
    if (index > -1) {
        window.powerballCombo45SelectedNumbers.splice(index, 1);
        element.style.backgroundColor = '#f0f0f0';
        element.style.color = '#333';
    } else {
        window.powerballCombo45SelectedNumbers.push(number);
        element.style.backgroundColor = '#e74c3c';
        element.style.color = 'white';
    }
    
    // Update the display and filter results
    updatePowerballCombo45SelectedNumbers();
    filterPowerballCombo45Results();
}

function renderTwoXBallPanel() {
    console.log('[2x] Rendering ball panel...');
    const panel = document.getElementById('twox-ball-panel');
    if (!panel) {
        console.error('[2x] Could not find twox-ball-panel element');
        return;
    }
    
    // Clear the panel first
    panel.innerHTML = '';
    
    // Initialize selectedBalls if it doesn't exist
    window.selectedBalls = window.selectedBalls || [];
    console.log('[2x] Current selectedBalls:', window.selectedBalls);
    
    // Debug: Log the current state of filteredDrawRows when panel is rendered
    console.log('[2x] filteredDrawRows on panel render:', 
        window.filteredDrawRows ? `Array(${window.filteredDrawRows.length})` : 'undefined');
    
    if (window.filteredDrawRows && window.filteredDrawRows.length > 0) {
        console.log('[2x] First draw row sample:', {
            date: window.filteredDrawRows[0].date,
            mainArr: window.filteredDrawRows[0].mainArr,
            hasDoublePlay: !!window.filteredDrawRows[0].doublePlayArr
        });
    }
    
    // Create container for the ball grid
    const container = document.createElement('div');
    container.style.maxWidth = '800px';
    container.style.margin = '0 auto';
    container.style.padding = '20px';
    
    // Add a title
    const title = document.createElement('div');
    title.textContent = 'Select Numbers';
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '15px';
    title.style.textAlign = 'center';
    container.appendChild(title);
    
    // Create the ball grid
    const ballGrid = document.createElement('div');
    ballGrid.id = 'ball-grid';
    ballGrid.style.display = 'grid';
    ballGrid.style.gridTemplateColumns = 'repeat(10, 1fr)';
    ballGrid.style.gap = '8px';
    ballGrid.style.marginBottom = '20px';
    
    // Generate ball elements
    for (let i = 1; i <= 69; i++) {
        const isSelected = window.selectedBalls.includes(i);
        const ball = document.createElement('div');
        // Set class and attributes
        ball.className = 'ball' + (isSelected ? ' selected' : '');
        ball.setAttribute('data-ball', i);
        ball.textContent = i;
        
        // Add robust click handler with better debugging
        const handleBallClick = (e) => {
            console.log('[2x] Ball click event triggered');
            console.log('[2x] Event target:', e.target);
            console.log('[2x] Current target:', e.currentTarget);
            
            // Prevent any default behavior and stop propagation
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Get the ball element (handle event delegation)
            const ball = e.target.closest('.ball');
            if (!ball) {
                console.error('[2x] No ball element found for click');
                return;
            }
            
            console.log('[2x] Ball element found:', ball);
            
            // Get the ball number
            const number = parseInt(ball.getAttribute('data-ball') || ball.textContent.trim());
            if (isNaN(number)) {
                console.error('[2x] Invalid ball number:', ball.getAttribute('data-ball'), 'Text content:', ball.textContent);
                return;
            }
            
            console.log(`[2x] Processing click for ball ${number}`);
            
            // Toggle selection
            const index = window.selectedBalls.indexOf(number);
            
            if (index === -1) {
                // Add to selection
                window.selectedBalls.push(number);
                ball.classList.add('selected');
                applyBallStyles(ball, true);
                console.log(`[2x] Added ball ${number} to selection`);
            } else {
                // Remove from selection
                window.selectedBalls.splice(index, 1);
                ball.classList.remove('selected');
                applyBallStyles(ball, false);
                console.log(`[2x] Removed ball ${number} from selection`);
            }
            
            console.log('[2x] Updated selectedBalls:', window.selectedBalls);
            
            // Update results
            const resultsDiv = document.getElementById('twox-results');
            if (!resultsDiv) {
                console.error('[2x] Could not find results div');
                return;
            }
            
            if (window.selectedBalls.length > 0) {
                console.log('[2x] Updating results with selected balls:', window.selectedBalls);
                
                // Check if we have draw data
                if (!window.filteredDrawRows || window.filteredDrawRows.length === 0) {
                    console.error('[2x] No draw data available');
                    resultsDiv.innerHTML = `
                        <div style="color:#e74c3c; margin:18px 0; padding:10px; background:#fde8e8; border-radius:4px;">
                            <strong>Error:</strong> No draw data available. Please try refreshing the page.
                            ${!window.filteredDrawRows ? '(filteredDrawRows is undefined)' : '(No draw records found)'}
                        </div>`;
                    return;
                }
                
                // Force a reflow to ensure the DOM is updated
                void resultsDiv.offsetHeight;
                
                render2xResultsForSelectedBalls(window.selectedBalls);
            } else {
                resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0; text-align: center;">Select balls to see their frequencies and draw dates.</div>';
            }
        };
        
        // Set initial ball styles
        const applyBallStyles = (element, selected) => {
            element.style.cssText = `
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                background: ${selected ? '#e74c3c' : '#f0f0f0'} !important;
                color: ${selected ? 'white' : '#333'} !important;
                border: ${selected ? '2px solid #c0392b' : '2px solid #ddd'} !important;
                cursor: pointer !important;
                font-weight: bold !important;
                transition: all 0.2s ease !important;
                user-select: none !important;
                margin: 0 auto !important;
                font-size: 16px !important;
                line-height: 1 !important;
                box-sizing: border-box !important;
            `;
        };
        
        // Apply initial styles
        applyBallStyles(ball, window.selectedBalls && window.selectedBalls.includes(parseInt(ball.textContent)));
        
        // Add click handler
        ball.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const number = parseInt(this.textContent.trim());
            const isSelected = this.classList.contains('selected');
            
            if (!isSelected) {
                // Add to selection
                window.selectedBalls = window.selectedBalls || [];
                window.selectedBalls.push(number);
                this.classList.add('selected');
                applyBallStyles(this, true);
            } else {
                // Remove from selection
                window.selectedBalls = window.selectedBalls || [];
                const index = window.selectedBalls.indexOf(number);
                if (index > -1) {
                    window.selectedBalls.splice(index, 1);
                }
                this.classList.remove('selected');
                applyBallStyles(this, false);
            }
            
            // Update results
            let resultsDiv = document.getElementById('twox-results');
            if (!resultsDiv) {
                const centerCol = document.querySelector('#tab-2x .center-col');
                if (centerCol) {
                    resultsDiv = document.createElement('div');
                    resultsDiv.id = 'twox-results';
                    resultsDiv.style.cssText = 'width: 100%; display: block; visibility: visible; opacity: 1; position: relative; z-index: 1000;';
                    centerCol.prepend(resultsDiv);
                }
            }
            
            // Show results or message
            if (window.selectedBalls.length > 0) {
                render2xResultsForSelectedBalls(window.selectedBalls);
            } else if (resultsDiv) {
                resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0; text-align: center;">Select numbers to see their frequencies and draw dates.</div>';
            }
        });
        
        // Prevent text selection on mousedown
        ball.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Apply initial styles
        applyBallStyles(ball, isSelected);
        
        // Add hover effect with better visibility
        ball.addEventListener('mouseover', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1.1) !important';
                this.style.boxShadow = '0 0 10px rgba(0,0,0,0.3) !important';
                this.style.zIndex = '10 !important';
            }
        });
        
        ball.addEventListener('mouseout', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1) !important';
                this.style.boxShadow = 'none !important';
                this.style.zIndex = '1 !important';
            }
        });
        
        ballGrid.appendChild(ball);
    }
    
    // Create clear button
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-selection';
    clearBtn.textContent = 'Clear Selection';
    Object.assign(clearBtn.style, {
        padding: '8px 16px',
        background: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        marginTop: '15px',
        transition: 'all 0.2s'
    });
    
    // Add hover effect to clear button
    clearBtn.addEventListener('mouseover', () => {
        clearBtn.style.background = '#c0392b';
    });
    
    clearBtn.addEventListener('mouseout', () => {
        clearBtn.style.background = '#e74c3c';
    });
    
    // Assemble the panel
    const label = document.createElement('div');
    label.className = 'powerball-label';
    label.textContent = 'Select numbers (1-69)';
    Object.assign(label.style, {
        fontSize: '1.1em',
        fontWeight: '500',
        marginBottom: '10px',
        color: '#2c3e50'
    });
    
    container.appendChild(label);
    container.appendChild(ballGrid);
    container.appendChild(clearBtn);
    
    // Add a clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Selection';
    clearButton.style.display = 'block';
    clearButton.style.margin = '0 auto 20px';
    clearButton.style.padding = '8px 16px';
    clearButton.style.background = '#e74c3c';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '4px';
    clearButton.style.cursor = 'pointer';
    clearButton.addEventListener('click', function() {
        window.selectedBalls = [];
        renderTwoXBallPanel();
        const resultsDiv = document.getElementById('twox-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0;">Select balls to see their frequencies and draw dates.</div>';
        }
    });
    
    // Assemble the panel
    container.appendChild(ballGrid);
    container.appendChild(clearButton);
    panel.appendChild(container);
    
    // Add click handler using event delegation
    ballGrid.addEventListener('click', function(e) {
        
        // Try multiple ways to find the ball element
        let ball = e.target.closest('.ball');
        if (!ball && e.target.classList.contains('ball')) {
            ball = e.target;
        }
        
        console.log('[2x] Found ball element:', ball);
        if (!ball) {
            console.log('[2x] Clicked element is not a ball. Element:', e.target);
            console.log('[2x] Element classList:', e.target.classList);
            console.log('[2x] Element HTML:', e.target.outerHTML);
            return;
        }
        
        const number = parseInt(ball.getAttribute('data-ball'));
        console.log(`[2x] Ball ${number} clicked`);
        
        const index = window.selectedBalls.indexOf(number);
        
        if (index === -1) {
            // Add to selection
            window.selectedBalls.push(number);
            ball.style.background = '#e74c3c';
            ball.style.color = 'white';
            ball.classList.add('selected');
            console.log(`[2x] Added ball ${number} to selection`);
        } else {
            // Remove from selection
            window.selectedBalls.splice(index, 1);
            ball.style.background = '#f0f0f0';
            ball.style.color = '#333';
            ball.classList.remove('selected');
            console.log(`[2x] Removed ball ${number} from selection`);
        }
        
        // Update results
        update2xResults();
    });
    
    // Clear selection handler
    clearBtn.addEventListener('click', function() {
        console.log('[2x] Clearing selection');
        window.selectedBalls = [];
        
        // Update UI
        const balls = ballGrid.querySelectorAll('.ball');
        balls.forEach(ball => {
            ball.style.background = '#f0f0f0';
            ball.style.color = '#333';
            ball.classList.remove('selected');
        });
        
        update2xResults();
    });
    
    console.log('[2x] Ball panel rendered with', window.selectedBalls.length, 'selected balls');
    
    // Helper function to update results
    function update2xResults() {
        const resultsDiv = document.getElementById('twox-results');
        if (!resultsDiv) {
            console.error('[2x] Results container not found');
            return;
        }
        
        if (window.selectedBalls.length > 0) {
            console.log('[2x] Updating results for selected balls:', window.selectedBalls);
            render2xResultsForSelectedBalls(window.selectedBalls);
        } else {
            resultsDiv.innerHTML = `
                <div style="
                    color: #888; 
                    margin: 18px 0; 
                    padding: 15px; 
                    background: #f9f9f9; 
                    border-radius: 4px; 
                    text-align: center;
                    font-size: 14px;
                ">
                    Select balls to see their frequencies and draw dates.
                </div>`;
        }
    }
    
    // Clear selection handler
    document.getElementById('clear-selection')?.addEventListener('click', function() {
        console.log('[2x] Clearing selection');
        window.selectedBalls = [];
        
        // Update UI
        const balls = document.querySelectorAll('#ball-grid .ball');
        balls.forEach(ball => {
            ball.style.background = '#f0f0f0';
            ball.style.color = '#333';
            ball.classList.remove('selected');
        });
        
        // Clear results
        const resultsDiv = document.getElementById('twox-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div style="
                    color: #888; 
                    margin: 18px 0; 
                    padding: 15px; 
                    background: #f9f9f9; 
                    border-radius: 4px; 
                    text-align: center;
                    font-size: 14px;
                ">
                    Select balls to see their frequencies and draw dates.
                </div>`;
        }
    });
}

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
    if (!window.filteredDrawRows) return;
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
        if (!tableDiv) return; // Exit if tableDiv doesn't exist
        
        let data = mode==='pair'?pairs:trios;
        let html = `<table class='freq-table'><thead><tr><th>${mode==='pair'?'Pair':'Trio'}</th><th>Count</th></tr></thead><tbody>`;
        data.forEach(([combo, count])=>{
            const nums = combo.split('-').map(num => `<span class='freq-number-pill' style='margin:0 3px;cursor:pointer;'>${num}</span>`).join(' ');
            html += `<tr class='combo-row' data-combo='${combo}'><td class='combo-cell'>${nums}</td><td>${count}</td></tr>`;
        });
        html += '</tbody></table>';
        tableDiv.innerHTML = html;
        
        if (datesDiv) {
            datesDiv.style.display = 'none';
        }
        
        // Add click handler
        const rows = tableDiv.querySelectorAll('.combo-row');
        if (rows && rows.length > 0) {
            rows.forEach(row => {
                row.onclick = function() {
                    selectedCombo = row.getAttribute('data-combo');
                    renderDrawsTable();
                };
            });
        }
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
    if (togglePairs) {
        togglePairs.onclick = ()=>{
            mode='pair';
            togglePairs.classList.add('active');
            if (toggleTrios) toggleTrios.classList.remove('active');
            selectedCombo = null;
            renderTable();
        };
    }
    if (toggleTrios) {
        toggleTrios.onclick = ()=>{
            mode='trio';
            toggleTrios.classList.add('active');
            if (togglePairs) togglePairs.classList.remove('active');
            selectedCombo = null;
            renderTable();
        };
    }
    renderTable();
}
// This is now handled in the CSV loading completion handler
// to ensure data is loaded before initializing download buttons

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

// Simplified 2x Check My Numbers logic
function render2xResultsForSelectedBalls(selected) {
    console.log('[2x] ===== SIMPLIFIED render2xResultsForSelectedBalls =====');
    console.log('[2x] Selected balls:', selected);
    console.log('[2x] filteredDrawRows exists:', !!window.filteredDrawRows);
    if (window.filteredDrawRows) {
        console.log('[2x] filteredDrawRows length:', window.filteredDrawRows.length);
        console.log('[2x] First draw row sample:', window.filteredDrawRows[0]);
    }
    
    // Get or create results div
    let resultsDiv = document.getElementById('twox-results');
    if (!resultsDiv) {
        console.log('[2x] Creating results div...');
        const centerCol = document.querySelector('#tab-2x .center-col');
        if (!centerCol) {
            console.error('[2x] Could not find center column');
            return;
        }
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'twox-results';
        resultsDiv.style.width = '100%';
        centerCol.prepend(resultsDiv);
        console.log('[2x] Created results div:', resultsDiv);
    }
    
    // Clear previous results
    resultsDiv.innerHTML = '';
    
    // Check if we have draw data
    if (!window.filteredDrawRows || window.filteredDrawRows.length === 0) {
        resultsDiv.innerHTML = '<div style="color:#e74c3c; padding:20px; text-align:center;">No draw data available. Please try again later.</div>';
        console.error('[2x] No draw data available');
        return;
    }
    
    // Show loading message
    resultsDiv.innerHTML = '<div style="padding:20px; text-align:center;">Loading results...</div>';
    
    // Process in the next tick to ensure UI updates
    setTimeout(() => {
        try {
            // Count frequencies for individual numbers
            const freq = {};
            selected.forEach(num => freq[num] = { count: 0, dates: [] });
            
            // Track combinations (pairs, trios, etc.)
            const combinations = {
                2: {},
                3: {},
                4: {},
                5: {}
            };
            
            // Count occurrences in draw data
            window.filteredDrawRows.forEach(draw => {
                const allNumbers = [...(draw.mainArr || []), ...(draw.doublePlayArr || [])];
                const drawType = draw.doublePlayArr ? 'DP' : 'Main';
                
                // Count individual numbers
                selected.forEach(num => {
                    if (allNumbers.includes(num)) {
                        freq[num].count++;
                        if (freq[num].dates.length < 5) {
                            freq[num].dates.push({
                                date: draw.date,
                                type: drawType
                            });
                        }
                    }
                });
                
                // Generate and count combinations
                for (let size = 2; size <= Math.min(5, selected.length); size++) {
                    const combos = generateCombinations(selected, size);
                    combos.forEach(combo => {
                        const key = combo.join(',');
                        if (combo.every(num => allNumbers.includes(num))) {
                            if (!combinations[size][key]) {
                                combinations[size][key] = { count: 0, dates: [] };
                            }
                            combinations[size][key].count++;
                            if (combinations[size][key].dates.length < 5) {
                                combinations[size][key].dates.push({
                                    date: draw.date,
                                    type: drawType
                                });
                            }
                        }
                    });
                }
            });
            
            // Generate results HTML
            let html = '<div style="margin:20px 0;">';
            
            // Show individual numbers
            if (selected.length > 0) {
                html += '<h3>Individual Number Frequencies</h3>';
                html += '<table style="width:100%; border-collapse:collapse; margin-top:10px; margin-bottom:30px;">';
                html += '<tr style="background:#f5f5f5;"><th>Number</th><th>Frequency</th><th>Last 5 Draws</th></tr>';
                
                // Sort by frequency (descending)
                const sorted = Object.entries(freq).sort((a, b) => b[1].count - a[1].count);
                
                sorted.forEach(([num, data]) => {
                    const datesHtml = data.dates.map(d => 
                        `${d.date} <span style="color:#e74c3c;">(${d.type})</span>`
                    ).join('<br>');
                    
                    html += `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:10px; text-align:center;">${num}</td>
                            <td style="padding:10px; text-align:center;">${data.count}</td>
                            <td style="padding:10px;">${datesHtml || 'N/A'}</td>
                        </tr>
                    `;
                });
                
                html += '</table>';
            }
            
            // Show combinations
            for (let size = 2; size <= Math.min(5, selected.length); size++) {
                const comboData = combinations[size];
                const comboKeys = Object.keys(comboData);
                
                if (comboKeys.length > 0) {
                    html += `<h3>${size}-Number Combinations</h3>`;
                    html += '<table style="width:100%; border-collapse:collapse; margin-top:10px; margin-bottom:30px;">';
                    html += `<tr style="background:#f5f5f5;"><th>Numbers</th><th>Frequency</th><th>Last 5 Draws</th></tr>`;
                    
                    // Sort combinations by frequency (descending)
                    const sortedCombos = comboKeys.sort((a, b) => comboData[b].count - comboData[a].count);
                    
                    sortedCombos.forEach(key => {
                        const data = comboData[key];
                        const datesHtml = data.dates.map(d => 
                            `${d.date} <span style="color:#e74c3c;">(${d.type})</span>`
                        ).join('<br>');
                        
                        html += `
                            <tr style="border-bottom:1px solid #eee;">
                                <td style="padding:10px; text-align:center;">${key.split(',').join(', ')}</td>
                                <td style="padding:10px; text-align:center;">${data.count}</td>
                                <td style="padding:10px;">${datesHtml || 'N/A'}</td>
                            </tr>
                        `;
                    });
                    
                    html += '</table>';
                }
            }
            
            html += '</div>';
            resultsDiv.innerHTML = html;
            
        } catch (error) {
            console.error('[2x] Error rendering results:', error);
            resultsDiv.innerHTML = `
                <div style="color:#e74c3c; padding:20px; text-align:center;">
                    Error loading results. Please try again.
                    <div style="color:#888; font-size:0.9em; margin-top:10px;">${error.message}</div>
                </div>
            `;
        }
    }, 0);
    
    if (!selected || selected.length === 0) {
        resultsDiv.innerHTML = '<div style="color:#888; margin:18px 0; font-size:14px;">Select balls to see their frequencies and draw dates.</div>';
        return;
    }
    
    // Ensure filteredDrawRows is available
    if (!window.filteredDrawRows || window.filteredDrawRows.length === 0) {
        console.error('[2x] Error: No draw data available. filteredDrawRows is empty or undefined');
        resultsDiv.innerHTML = `
            <div style="color:#e74c3c; margin:18px 0; padding:10px; background:#fde8e8; border-radius:4px;">
                <strong>Error:</strong> No draw data available. Please try refreshing the page.
                ${!window.filteredDrawRows ? '(filteredDrawRows is undefined)' : '(No draw records found)'}
            </div>`;
        return;
    }
    
    console.log(`[2x] Processing ${window.filteredDrawRows.length} draw records`);
    
    // Track all draw dates for each selected number
    const numberStats = new Map();
    
    // Convert all selected values to numbers and filter out any invalid ones
    const selectedNumbers = selected.map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 69);
    
    if (selectedNumbers.length === 0) {
        console.error('[2x] No valid numbers selected');
        resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:18px 0;">Please select valid numbers between 1 and 69.</div>';
        return;
    }
    
    console.log(`[2x] Processing ${selectedNumbers.length} valid numbers`);
    
    // Process each selected number
    selectedNumbers.forEach(num => {
        const draws = window.filteredDrawRows.filter(draw => {
            const inMain = Array.isArray(draw.mainArr) && draw.mainArr.includes(num);
            const inDoublePlay = Array.isArray(draw.doublePlayArr) && draw.doublePlayArr.includes(num);
            return inMain || inDoublePlay;
        });
        
        console.log(`[2x] Number ${num} appears in ${draws.length} draws`);
        
        numberStats.set(num, {
            count: draws.length,
            draws: draws.map(draw => ({
                date: draw.date || 'Unknown Date',
                type: (Array.isArray(draw.doublePlayArr) && draw.doublePlayArr.includes(num)) ? 'Double Play' : 'Main',
                timestamp: draw.date ? new Date(draw.date).getTime() : Date.now()
            })).sort((a, b) => b.timestamp - a.timestamp) // Sort by date descending
        });
    });
    
    // Create single number frequency table
    let html = `
        <div class="single-number-section" style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; padding: 0; font-size: 18px;">
                <i class="fas fa-chart-bar" style="margin-right: 8px;"></i>Single Number Frequencies
            </h3>
            <div style="overflow-x: auto;">
                <table class="results-table" style="width:100%; margin-bottom:20px; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; min-width: 80px;">Number</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6; min-width: 100px;">Frequency</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; min-width: 200px;">Last 5 Draws</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Sort numbers by frequency (descending), then by number (ascending)
    const sortedNumbers = Array.from(numberStats.entries())
        .sort((a, b) => {
            if (b[1].count !== a[1].count) return b[1].count - a[1].count;
            return a[0] - b[0];
        });
    
    if (sortedNumbers.length === 0) {
        html += `
            <tr>
                <td colspan="3" style="padding: 20px; text-align: center; color: #6c757d; font-style: italic;">
                    No draw history found for the selected numbers.
                </td>
            </tr>
        `;
    } else {
        sortedNumbers.forEach(([num, {count, draws}]) => {
            // Get the 5 most recent draws (already sorted by date descending)
            const recentDraws = draws.slice(0, 5);
            
            // Format the draw dates with type indicators
            const drawCells = recentDraws.length > 0 
                ? recentDraws.map(d => `
                    <div style="margin: 4px 0; padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px;">
                        <span style="font-weight: 500; color: #2c3e50;">${d.date}</span> 
                        <span style="color: ${d.type === 'Double Play' ? '#e67e22' : '#2ecc51'}; font-size: 12px; margin-left: 6px; padding: 2px 6px; background: ${d.type === 'Double Play' ? '#fef5eb' : '#f0faf4'}; border-radius: 3px;">
                            ${d.type}
                        </span>
                    </div>`
                ).join('')
                : '<div style="color: #95a5a6; font-style: italic;">No draw history</div>';
            
            // Determine ball color based on number range (like Powerball)
            const ballColor = num <= 35 ? '#ff6b6b' : 
                             num <= 50 ? '#4ecdc4' : 
                             num <= 65 ? '#45b7d1' : '#a55eea';
            
            html += `
                <tr style="border-bottom: 1px solid #f0f0f0;" data-number="${num}">
                    <td style="padding: 12px; vertical-align: middle;">
                        <div class="ball" style="
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            background: #e74c3c;
                            color: white;
                            font-weight: 500;
                        ">${num}</span>
                    </td>
                    <td style="padding: 12px; vertical-align: top; font-weight: 500;">
                        ${count} ${count === 1 ? 'time' : 'times'}
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                        ${drawCells}
                    </td>
                </tr>
            `;
        });
    }
    
    // Close the single number table
    html += `
                </tbody>
            </table>
        </div>
    </div>`;
    
    // Add combinations section if more than one number is selected
    if (selectedNumbers.length > 1) {
        // Helper to get all unique combinations of k from arr
        function getCombinations(arr, k) {
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
        
        // Gather all combinations of size 2 up to selected.length
        let allCombos = [];
        for (let k = 2; k <= selectedNumbers.length; k++) {
            allCombos = allCombos.concat(getCombinations(selectedNumbers, k));
        }
        
        // Sort allCombos lexicographically
        allCombos.sort((a, b) => {
            for (let i = 0; i < Math.min(a.length, b.length); i++) {
                if (a[i] !== b[i]) return a[i] - b[i];
            }
            return a.length - b.length;
        });
        
        // Add combinations section
        html += `
        <div class="combinations-section" style="margin-top: 30px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; padding: 0; font-size: 18px;">
                <i class="fas fa-project-diagram" style="margin-right: 8px;"></i>Number Combinations
            </h3>`;
            
        if (allCombos.length === 0) {
            html += `<div style='color:#aaa; margin-bottom:12px;'>No combinations found. Select at least 2 balls.</div>`;
        } else {
            html += `
            <div class='twox-combo-results-list' style="background: #f8f9fa; border-radius: 8px; padding: 15px; border: 1px solid #e9ecef;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
            
            allCombos.forEach((combo, idx) => {
                html += `
                <div class='twox-combo-row' style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 6px; font-size: 14px;">
                        Combination ${idx + 1}:
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${combo.map(num => `
                            <div class='twox-red-ball' style="
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 30px;
                                height: 30px;
                                border-radius: 50%;
                                background: #e74c3c;
                                color: white;
                                font-weight: 500;
                                font-size: 14px;
                            ">${num}</div>
                        `).join('')}
                    </div>
                </div>`;
            });
            
            html += `
                </div>
            </div>`;
        }
        
        html += `
        </div>`;
    }
    
    // Set the HTML content
    resultsDiv.innerHTML = html;
    console.log('[2x] Results HTML updated');
}

// Clean and simple initialization for the 2x tab

// --- Download Buttons Logic ---
function initializeDownloadButtons() {
    // Pairs & Trios Button
    const pairsTriosBtn = document.getElementById('download-pairs-trios-csv-btn');
    if (pairsTriosBtn) {
        pairsTriosBtn.addEventListener('click', function() {
            if (!window.filteredDrawRows) {
                alert('Please wait for the data to load.');
                return;
            }
            // Helper function to add to map with type info
            function addToMap(map, combo, date, type) {
                if (!map.has(combo)) map.set(combo, []);
                map.get(combo).push({date, type});
            }
            const pairCounts = new Map();
            const trioCounts = new Map();
            const pairDraws = new Map();
            const trioDraws = new Map();
            
            console.log('Processing', window.filteredDrawRows.length, 'draws for pairs and trios');
            
            window.filteredDrawRows.forEach(draw => {
                if (draw.mainArr && draw.mainArr.length === 5) {
                    // Process pairs
                    getAllCombos(draw.mainArr, 2).forEach(pair => {
                        // Ensure pair is an array before sorting
                        const sortedPair = Array.isArray(pair) ? [...pair].sort((a,b) => a-b) : pair.split('-').map(Number).sort((a,b) => a-b);
                        const pairKey = sortedPair.join('-');
                        pairCounts.set(pairKey, (pairCounts.get(pairKey)||0)+1);
                        addToMap(pairDraws, pairKey, draw.date, 'Main');
                    });
                    
                    // Process trios
                    getAllCombos(draw.mainArr, 3).forEach(trio => {
                        // Ensure trio is an array before sorting
                        const sortedTrio = Array.isArray(trio) ? [...trio].sort((a,b) => a-b) : trio.split('-').map(Number).sort((a,b) => a-b);
                        const trioKey = sortedTrio.join('-');
                        trioCounts.set(trioKey, (trioCounts.get(trioKey)||0)+1);
                        addToMap(trioDraws, trioKey, draw.date, 'Main');
                    });
                }
                if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
                    // Process pairs for double play
                    getAllCombos(draw.doublePlayArr, 2).forEach(pair => {
                        // Ensure pair is an array before sorting
                        const sortedPair = Array.isArray(pair) ? [...pair].sort((a,b) => a-b) : pair.split('-').map(Number).sort((a,b) => a-b);
                        const pairKey = sortedPair.join('-');
                        pairCounts.set(pairKey, (pairCounts.get(pairKey)||0)+1);
                        addToMap(pairDraws, pairKey, draw.date, 'Double');
                    });
                    
                    // Process trios for double play
                    getAllCombos(draw.doublePlayArr, 3).forEach(trio => {
                        // Ensure trio is an array before sorting
                        const sortedTrio = Array.isArray(trio) ? [...trio].sort((a,b) => a-b) : trio.split('-').map(Number).sort((a,b) => a-b);
                        const trioKey = sortedTrio.join('-');
                        trioCounts.set(trioKey, (trioCounts.get(trioKey)||0)+1);
                        addToMap(trioDraws, trioKey, draw.date, 'Double');
                    });
                }
            });
            const pairs = Array.from(pairCounts.entries())
                .filter(([_, count]) => count >= 2)
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
                
            const trios = Array.from(trioCounts.entries())
                .filter(([_, count]) => count >= 2)
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
            
            function csvEscape(val) {
                if (val === null || val === undefined) return '';
                const str = String(val);
                if (str.includes('"')) return '"' + str.replace(/"/g, '""') + '"';
                if (str.includes(',') || str.includes('\n') || str.includes('\r')) return '"' + str + '"';
                return str;
            }
            
            let csvRows = [];
            csvRows.push(['Type','Combo','Count','Dates+Types']);
            
            // Add pairs to CSV
            pairs.forEach(([combo, count]) => {
                const draws = pairDraws.get(combo) || [];
                const datesStr = draws.map(d => `${d.date} (${d.type})`).join('; ');
                csvRows.push(['Pair', combo, count, datesStr]);
            });
            
            // Add trios to CSV
            trios.forEach(([combo, count]) => {
                const draws = trioDraws.get(combo) || [];
                const datesStr = draws.map(d => `${d.date} (${d.type})`).join('; ');
                csvRows.push(['Trio', combo, count, datesStr]);
            });
            
            const csvContent = csvRows.map(row => 
                row.map(cell => csvEscape(cell)).join(',')
            ).join('\r\n');
            
            const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'powerball_pairs_trios.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        });
    }
    
    // Quads Button
    const quadsBtn = document.getElementById('download-quads-csv-btn');
    if (quadsBtn) {
        quadsBtn.addEventListener('click', function() {
            generateComboCSV('quads');
        });
    }
    
    // Fives Button
    const fivesBtn = document.getElementById('download-fives-csv-btn');
    if (fivesBtn) {
        fivesBtn.addEventListener('click', function() {
            generateComboCSV('fives');
        });
    }
}

function generateComboCSV(comboType) {
    if (!window.filteredDrawRows) {
        alert('Please wait for the data to load.');
        return;
    }
    const comboCounts = new Map();
    const comboDraws = new Map();
    const comboSize = comboType === 'quads' ? 4 : 5;
    window.filteredDrawRows.forEach(draw => {
        if (draw.mainArr && draw.mainArr.length === 5) {
            getAllCombos(draw.mainArr, comboSize).forEach(combo => {
                // Ensure combo is an array before sorting
                const sortedCombo = Array.isArray(combo) ? [...combo].sort((a,b) => a-b) : combo.split('-').map(Number).sort((a,b) => a-b);
                const comboKey = sortedCombo.join('-');
                comboCounts.set(comboKey, (comboCounts.get(comboKey)||0)+1);
                addToMap(comboDraws, comboKey, draw.date, 'Main');
            });
        }
        if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
            getAllCombos(draw.doublePlayArr, comboSize).forEach(combo => {
                // Ensure combo is an array before sorting
                const sortedCombo = Array.isArray(combo) ? [...combo].sort((a,b) => a-b) : combo.split('-').map(Number).sort((a,b) => a-b);
                const comboKey = sortedCombo.join('-');
                comboCounts.set(comboKey, (comboCounts.get(comboKey)||0)+1);
                addToMap(comboDraws, comboKey, draw.date, 'Double');
            });
        }
    });
    const combos = Array.from(comboCounts.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    
    function csvEscape(val) {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes('"')) return '"' + str.replace(/"/g, '""') + '"';
        if (str.includes(',') || str.includes('\n') || str.includes('\r')) return '"' + str + '"';
        return str;
    }
    
    let csvRows = [];
    csvRows.push(['Combo','Count','Dates+Types']);
    
    combos.forEach(([combo, count]) => {
        const draws = comboDraws.get(combo) || [];
        const datesStr = draws.map(d => `${d.date} (${d.type})`).join('; ');
        csvRows.push([combo, count, datesStr]);
    });
    
    const csvContent = csvRows.map(row => 
        row.map(cell => csvEscape(cell)).join(',')
    ).join('\r\n');
    
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `powerball_${comboType}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function addToMap(map, combo, date, type) {
    if (!map.has(combo)) map.set(combo, []);
    map.get(combo).push({date, type});
}