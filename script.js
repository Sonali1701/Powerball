document.addEventListener('DOMContentLoaded', function() {
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
                        const tooltip = document.createElement('span');
                        tooltip.className = 'tooltip';
                        tooltip.textContent = `${numberStats[n].count} times`;
                        ball.appendChild(tooltip);
                        // Removed count badge
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
                    const checkBtn = document.getElementById('check-combo-btn');
                    checkBtn.onclick = function() {
                        const resultsDiv = document.getElementById('combo-results');
                        resultsDiv.innerHTML = '';

                        if (selectedBalls.size < 1) {
                            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">Select at least 1 number to check combinations.</div>';
                            return;
                        }
                        // Efficient: For each draw, count how many selected numbers appear
                        let allResults = [];
                        drawRows.forEach(draw => {
                            // Main draw
                            const matchCount = draw.mainArr.filter(num => selectedBalls.has(Number(num))).length;
                            if (matchCount >= 1) {
                                allResults.push({
                                    date: draw.date,
                                    numbers: draw.mainArr,
                                    selected: draw.mainArr.map(num => selectedBalls.has(Number(num))),
                                    type: 'Main',
                                    powerball: draw.powerball
                                });
                            }
                            // Double Play draw
                            if (draw.doublePlayArr && draw.doublePlayArr.length > 0) {
                                const matchCountDP = draw.doublePlayArr.filter(num => selectedBalls.has(Number(num))).length;
                                if (matchCountDP >= 1) {
                                    allResults.push({
                                        date: draw.date, // Only the date, no (Double Play)
                                        numbers: draw.doublePlayArr,
                                        selected: draw.doublePlayArr.map(num => selectedBalls.has(Number(num))),
                                        type: 'Double Play',
                                        powerball: draw.doublePlayPowerball
                                    });
                                }
                            }
                        });
                        // Sort allResults by date descending (parse date, ignore (Double Play) for sorting)
                        allResults.sort((a, b) => {
                            // Extract date part for sorting
                            function parseDate(str) {
                                let d = str.replace(' (Double Play)', '');
                                return new Date(d);
                            }
                            return parseDate(b.date) - parseDate(a.date);
                        });
                        if (allResults.length === 0) {
                            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">No draws found with your selected number(s) in either draw.</div>';
                            return;
                        }
                        // Render all results in a single table
                        const section = document.createElement('div');
                        section.style.margin = '18px 0';
                        section.innerHTML = `<b style='font-size:1.15em;'>Draws with your number${selectedBalls.size > 1 ? 's' : ''}</b> <span style='color:#888'>(Total: ${allResults.length})</span>`;
                        const table = document.createElement('table');
                        table.style.marginTop = '8px';
                        table.style.width = '100%';
                        table.innerHTML = `<thead><tr><th>Date</th><th>Type</th><th>Numbers</th></tr></thead><tbody></tbody>`;
                        allResults.forEach(draw => {
                            const tr = document.createElement('tr');
                            // Render numbers: selected as red balls, others as black text, with dash between
                            const numbersHtml = draw.numbers.map((num, idx) => {
                                if (draw.selected[idx]) {
                                    return `<span class='red-ball'>${num}</span>`;
                                } else {
                                    return `<span class='plain-number'>${num}</span>`;
                                }
                            }).join('<br>'); // Show each number on a new line
                            tr.innerHTML = `<td>${draw.date}</td><td>${draw.type}</td><td><div class='draws-list aligned-numbers'>${numbersHtml}</div></td>`;
                            table.querySelector('tbody').appendChild(tr);
                        });
                        section.appendChild(table);
                        resultsDiv.appendChild(section);
                        // After rendering results, scroll to them for user focus
                        setTimeout(() => {
                            if (resultsDiv && resultsDiv.children.length > 0) {
                                resultsDiv.scrollIntoView({behavior: 'smooth', block: 'start'});
                            }
                        }, 100);
                    };
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