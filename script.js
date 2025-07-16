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
                        ball.style.background = getBallColor(n);
                        ball.style.color = '#fff';
                        // Tooltip
                        const tooltip = document.createElement('span');
                        tooltip.className = 'tooltip';
                        tooltip.textContent = `${numberStats[n].count} times`;
                        ball.appendChild(tooltip);
                        // Count badge
                        const badge = document.createElement('span');
                        badge.className = 'count-badge';
                        badge.textContent = numberStats[n].count;
                        ball.appendChild(badge);
                        ball.onclick = function(e) {
                            // Multi-select: toggle selection
                            if (selectedBalls.has(n)) {
                                selectedBalls.delete(n);
                                ball.classList.remove('selected');
                                // If none selected, clear right panel
                                if (selectedBalls.size === 0) {
                                    document.getElementById('number-info').innerHTML = '';
                                    document.getElementById('number-info').classList.remove('active');
                                } else if (selectedBalls.size === 1) {
                                    const only = Array.from(selectedBalls)[0];
                                    showNumberInfo(only, numberStats[only]);
                                } else {
                                    document.getElementById('number-info').innerHTML = '';
                                    document.getElementById('number-info').classList.remove('active');
                                }
                            } else {
                                selectedBalls.add(n);
                                ball.classList.add('selected');
                                ball.style.animation = 'popin 0.3s';
                                setTimeout(() => { ball.style.animation = ''; }, 300);
                                if (selectedBalls.size === 1) {
                                    showNumberInfo(n, numberStats[n]);
                                } else {
                                    document.getElementById('number-info').innerHTML = '';
                                    document.getElementById('number-info').classList.remove('active');
                                }
                            }
                        };
                        panel.appendChild(ball);
                    }
                    // Add event for the new button
                    const checkBtn = document.getElementById('check-combo-btn');
                    checkBtn.onclick = function() {
                        const resultsDiv = document.getElementById('combo-results');
                        resultsDiv.innerHTML = '';
                        if (selectedBalls.size < 2) {
                            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">Select at least 2 numbers to check combinations.</div>';
                            return;
                        }
                        // Efficient: For each draw, count how many selected numbers appear
                        const groups = {};
                        drawRows.forEach(draw => {
                            const matchCount = draw.mainArr.filter(num => selectedBalls.has(Number(num))).length;
                            if (matchCount >= 2) {
                                if (!groups[matchCount]) groups[matchCount] = [];
                                // Prepare highlighted main numbers
                                const highlighted = draw.mainArr.map(num => {
                                    if (selectedBalls.has(Number(num))) {
                                        return `<span class='highlight-cell'>${num}</span>`;
                                    } else {
                                        return num;
                                    }
                                }).join(' ');
                                groups[matchCount].push({date: draw.date, numbers: highlighted, powerball: draw.powerball});
                            }
                        });
                        // Sort groups by match count descending
                        const sortedCounts = Object.keys(groups).map(Number).sort((a,b) => b-a);
                        if (sortedCounts.length === 0) {
                            resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:12px 0;">No draws found with 2 or more of your numbers.</div>';
                            return;
                        }
                        sortedCounts.forEach(count => {
                            const section = document.createElement('div');
                            section.style.margin = '18px 0';
                            section.innerHTML = `<b style='font-size:1.15em;'>Draws with ${count} of your numbers</b> <span style='color:#888'>(Total: ${groups[count].length})</span>`;
                            const table = document.createElement('table');
                            table.style.marginTop = '8px';
                            table.innerHTML = `<thead><tr><th>Date</th><th>Main Numbers</th></tr></thead><tbody></tbody>`;
                            // Show only first 20 draws by default
                            const drawsToShow = groups[count].slice(0, 20);
                            drawsToShow.forEach(draw => {
                                const tr = document.createElement('tr');
                                tr.innerHTML = `<td>${draw.date}</td><td><div class='draws-list'><div>${draw.numbers}</div></div></td>`;
                                table.querySelector('tbody').appendChild(tr);
                            });
                            // If more than 20, add Show all/Show less button
                            if (groups[count].length > 20) {
                                const tr = document.createElement('tr');
                                const td = document.createElement('td');
                                td.colSpan = 2;
                                td.style.textAlign = 'center';
                                td.style.padding = '12px 0';
                                const showMore = document.createElement('span');
                                showMore.textContent = `Show all (${groups[count].length})`;
                                showMore.style.color = '#3498db';
                                showMore.style.cursor = 'pointer';
                                showMore.style.fontWeight = 'bold';
                                showMore.onclick = function() {
                                    // Show all draws
                                    table.querySelector('tbody').innerHTML = '';
                                    groups[count].forEach(draw => {
                                        const tr2 = document.createElement('tr');
                                        tr2.innerHTML = `<td>${draw.date}</td><td><div class='draws-list'><div>${draw.numbers}</div></div></td>`;
                                        table.querySelector('tbody').appendChild(tr2);
                                    });
                                    // Add Show less button
                                    const trLess = document.createElement('tr');
                                    const tdLess = document.createElement('td');
                                    tdLess.colSpan = 2;
                                    tdLess.style.textAlign = 'center';
                                    tdLess.style.padding = '12px 0';
                                    const showLess = document.createElement('span');
                                    showLess.textContent = 'Show less';
                                    showLess.style.color = '#3498db';
                                    showLess.style.cursor = 'pointer';
                                    showLess.style.fontWeight = 'bold';
                                    showLess.onclick = function() {
                                        // Collapse back to first 20
                                        table.querySelector('tbody').innerHTML = '';
                                        drawsToShow.forEach(draw => {
                                            const tr3 = document.createElement('tr');
                                            tr3.innerHTML = `<td>${draw.date}</td><td><div class='draws-list'><div>${draw.numbers}</div></div></td>`;
                                            table.querySelector('tbody').appendChild(tr3);
                                        });
                                        table.querySelector('tbody').appendChild(tr);
                                    };
                                    tdLess.appendChild(showLess);
                                    trLess.appendChild(tdLess);
                                    table.querySelector('tbody').appendChild(trLess);
                                };
                                td.appendChild(showMore);
                                tr.appendChild(td);
                                table.querySelector('tbody').appendChild(tr);
                            }
                            section.appendChild(table);
                            resultsDiv.appendChild(section);
                        });
                        // After rendering results, scroll to them for user focus
                        setTimeout(() => {
                            if (resultsDiv && resultsDiv.children.length > 0) {
                                resultsDiv.scrollIntoView({behavior: 'smooth', block: 'start'});
                            }
                        }, 100);
                    };
                    // --- Show info for a number ---
                    function showNumberInfo(num, stat) {
                        const info = document.getElementById('number-info');
                        info.classList.add('active');
                        info.style.animation = 'fadein 0.4s';
                        setTimeout(() => { info.style.animation = ''; }, 400);
                        // Hot/Cold logic: hot if appeared in last 5 draws, cold if not in last 20
                        let hotStatus = '';
                        if (stat.dates.length > 0) {
                            const lastDraw = stat.dates[stat.dates.length - 1];
                            const recent = stat.dates.slice(-5);
                            if (recent.length > 0 && recent.some(d => d.indexOf('(Double Play)') === -1)) {
                                hotStatus = '<span class="hot">Hot</span>';
                            } else if (stat.dates.length > 0 && stat.dates.length < 3) {
                                hotStatus = '<span class="cold">Cold</span>';
                            }
                        }
                        // First/last appearance
                        let first = stat.dates[0] || '-';
                        let last = stat.dates[stat.dates.length - 1] || '-';
                        // Collapsible date list
                        let showAll = false;
                        function renderDates() {
                            let datesToShow = showAll ? stat.dates : stat.dates.slice(0, 10);
                            let html = `<div class="date-list"><ul>${datesToShow.map(d => `<li>${d}</li>`).join('')}</ul></div>`;
                            if (stat.dates.length > 10) {
                                html += `<span class="toggle-dates" id="toggle-dates">${showAll ? 'Show less' : 'Show all (' + stat.dates.length + ')'} dates</span>`;
                            }
                            return html;
                        }
                        info.innerHTML = `
                            <div class="big-count">${stat.count}</div>
                            <div>Times appeared ${hotStatus}</div>
                            <div style="margin:8px 0 4px 0;">
                                <span style="font-size:1.1em;">First:</span> <b>${first}</b> &nbsp;|&nbsp; <span style="font-size:1.1em;">Last:</span> <b>${last}</b>
                            </div>
                            ${renderDates()}
                        `;
                        if (stat.dates.length > 10) {
                            document.getElementById('toggle-dates').onclick = function() {
                                showAll = !showAll;
                                showNumberInfo(num, stat);
                            };
                        }
                    }
                    // --- Highlight draws in table ---
                    // Remove any logic that renders the main results table or highlights draws in the table.
                    // --- Search/filter functionality ---
                    const searchBox = document.getElementById('search-box');
                    searchBox.addEventListener('input', function() {
                        const query = searchBox.value.trim().toLowerCase();
                        drawRows.forEach(({tr, mainNumbers, doublePlayNumbers, powerball, doublePlayPowerball, powerplay, date}) => {
                            // Search in date, main numbers, double play numbers, powerball, double play powerball, powerplay
                            const rowText = [date, mainNumbers, doublePlayNumbers, powerball, doublePlayPowerball, powerplay].join(' ').toLowerCase();
                            if (rowText.includes(query)) {
                                tr.style.display = '';
                            } else {
                                tr.style.display = 'none';
                            }
                        });
                    });
                }
            });
        });
}); 