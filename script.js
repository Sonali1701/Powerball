// Local data storage for Powerball and Double Play results

// Global variables to store the latest results
let powerballResults = [];
let doublePlayResults = [];

// --- Global helper functions ---

// Function to get last digits for a draw
function getLastDigitCounts(mainArr) {
    return mainArr.map(num => num % 10);
}

// Render History tab with both main and double play as columns
function renderHistoryTab() {
    console.log('Rendering History tab...');
    const resultsDiv = document.getElementById('new-tab-results');
    
    if (!resultsDiv) {
        console.error('Results container not found');
        return;
    }
    
    // Show loading state
    resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading history data...</div>';
    
    // Check if data is available
    if (!window.filteredDrawRows || !Array.isArray(window.filteredDrawRows) || window.filteredDrawRows.length === 0) {
        console.error('No valid draw data available for History tab');
        resultsDiv.innerHTML = `
            <div style="color:#e74c3c; margin:18px 0; padding: 15px; background: #fff5f5; border: 1px solid #ffd6d6; border-radius: 4px;">
                <p>No draw data available. This could be because:</p>
                <ul style="text-align: left; margin: 10px 0 0 20px;">
                    <li>Data is still loading. Please wait a moment and try again.</li>
                    <li>The data file may be missing or corrupted.</li>
                    <li>There was an error processing the data.</li>
                </ul>
                <p style="margin-top: 10px;">Please refresh the page to try again.</p>
            </div>`;
        return;
    }
    
    console.log('Draw data available, rows:', window.filteredDrawRows.length);
    
    // Create a more structured table with proper column widths
    let html = `
    <div style="width: 100%; overflow-x: auto;">
        <table class="freq-table" style="table-layout: fixed; width: 100%; border-collapse: collapse;">
            <colgroup>
                <col style="width: 15%;">
                <col style="width: 50%;">
                <col style="width: 25%;">
                <col style="width: 10%;">
            </colgroup>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Numbers</th>
                    <th>Last Digits</th>
                    <th>Sum | O/E</th>
                </tr>
            </thead>
            <tbody>`;
    
    window.filteredDrawRows.forEach((draw, index) => {
        if (!draw.mainArr || !Array.isArray(draw.mainArr) || draw.mainArr.length === 0) {
            console.warn(`Draw at index ${index} has invalid mainArr:`, draw);
            return;
        }
        
        // Main Draw Row
        const mainNumbers = draw.mainArr || [];
        const powerball = draw.powerball || 0;
        
        // Calculate sums for main draw
        const sumMain = mainNumbers.reduce((a, b) => a + b, 0);
        // Convert powerball to number before adding
        const powerballNum = parseInt(powerball, 10) || 0;
        const sumWithPowerball = sumMain + powerballNum;
        
        // Calculate odd/even counts for main draw
        const oddCount = mainNumbers.filter(n => n % 2 !== 0).length;
        const evenCount = mainNumbers.length - oddCount;
        const oddEvenStr = `${oddCount}/${evenCount}`;
        
        // Format last digits for main draw
        const lastDigits = getLastDigitCounts(mainNumbers);
        const digitCountsStr = lastDigits.map(digit => 
            `<span class="digit-count" title="Last digit: ${digit}">${digit}</span>`
        ).join('');
        
        // Format main numbers with circles
        const mainNumbersHtml = mainNumbers.map(num => 
            `<span class="number-badge main-number">${num}</span>`
        ).join('');
        
        // Format powerball if available
        const powerballHtml = powerball ? 
            `<span class="number-badge powerball">${powerball}</span>` : '';
        
        // Main Draw Row
        html += `
            <tr class="main-draw-row">
                <td rowspan="2" style="vertical-align: middle; white-space: nowrap;">${draw.date || 'N/A'}</td>
                <td style="white-space: nowrap;">
                    <strong>Main:</strong> ${mainNumbersHtml}${powerballHtml}
                </td>
                <td style="text-align: center;">${digitCountsStr || 'N/A'}</td>
                <td style="text-align: center; font-weight: 500; white-space: nowrap;">
                    <div>${sumMain} | ${sumWithPowerball}</div>
                    <div style="font-size: 0.9em; color: #666;">${oddEvenStr}</div>
                </td>
            </tr>`;
            
        // Double Play Row (if available)
        if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
            const doublePlayNumbers = draw.doublePlayArr;
            const doublePlaySum = doublePlayNumbers.reduce((a, b) => a + b, 0);
            const dpOddCount = doublePlayNumbers.filter(n => n % 2 !== 0).length;
            const dpEvenCount = doublePlayNumbers.length - dpOddCount;
            const dpOddEvenStr = `${dpOddCount}/${dpEvenCount}`;
            
            const dpLastDigits = getLastDigitCounts(doublePlayNumbers);
            const dpDigitCountsStr = dpLastDigits.map(digit => 
                `<span class="digit-count" title="Last digit: ${digit}">${digit}</span>`
            ).join('');
            
            const doublePlayHtml = doublePlayNumbers.map(num => 
                `<span class="number-badge double-play">${num}</span>`
            ).join('');
            
            html += `
            <tr class="double-play-row">
                <td style="white-space: nowrap;">
                    <strong>Double Play:</strong> ${doublePlayHtml}
                </td>
                <td style="text-align: center;">${dpDigitCountsStr || 'N/A'}</td>
                <td style="text-align: center; font-weight: 500; white-space: nowrap;">
                    <div>${doublePlaySum}</div>
                    <div style="font-size: 0.9em; color: #666;">${dpOddEvenStr}</div>
                </td>
            </tr>`;
        } else {
            html += `
            <tr class="double-play-row">
                <td colspan="3" style="text-align: center; color: #999;">No Double Play data available</td>
            </tr>`;
        }
    });
    
    html += `
            </tbody>
        </table>
    </div>`;
    
    if (resultsDiv) {
        resultsDiv.innerHTML = html;
    } else {
        console.error('Could not find history container with ID: new-tab-results');
    }
}

// Function to render the new ball panel
function renderNewBallPanel() {
    const panel = document.getElementById('new-ball-panel');
    if (!panel) return;
    panel.innerHTML = '';
    const selectedBalls = new Set();
    for (let n = 1; n <= 69; n++) {
        const ball = document.createElement('span');
        ball.className = 'ball';
        ball.textContent = n;
        ball.onclick = function() {
            if (selectedBalls.has(n)) {
                selectedBalls.delete(n);
                ball.classList.remove('selected');
            } else if (selectedBalls.size < 5) {
                selectedBalls.add(n);
                ball.classList.add('selected');
            }
            if (selectedBalls.size === 5) {
                // Enable powerball selection
                document.querySelectorAll('.powerball').forEach(pb => {
                    pb.style.opacity = '1';
                    pb.style.pointerEvents = 'auto';
                });
            } else {
                // Disable powerball selection
                document.querySelectorAll('.powerball').forEach(pb => {
                    pb.style.opacity = '0.5';
                    pb.style.pointerEvents = 'none';
                });
            }
        };
        panel.appendChild(ball);
    }
    
    // Add powerball selection
    const powerballContainer = document.createElement('div');
    powerballContainer.className = 'powerball-container';
    powerballContainer.style.marginTop = '15px';
    powerballContainer.innerHTML = '<div style="margin-bottom: 8px; font-weight: bold;">Powerball:</div>';
    
    for (let pb = 1; pb <= 26; pb++) {
        const powerball = document.createElement('span');
        powerball.className = 'powerball';
        powerball.textContent = pb;
        powerball.style.opacity = '0.5';
        powerball.style.pointerEvents = 'none';
        powerball.onclick = function() {
            document.querySelectorAll('.powerball').forEach(pb => pb.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('generate-btn').disabled = false;
        };
        powerballContainer.appendChild(powerball);
    }
    
    panel.appendChild(powerballContainer);
    
    // Add generate button
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generate-btn';
    generateBtn.textContent = 'Generate Numbers';
    generateBtn.disabled = true;
    generateBtn.style.marginTop = '15px';
    generateBtn.onclick = function() {
        const selectedPowerball = document.querySelector('.powerball.selected');
        if (selectedBalls.size === 5 && selectedPowerball) {
            const numbers = Array.from(selectedBalls).sort((a, b) => a - b);
            const powerball = parseInt(selectedPowerball.textContent);
            alert(`Your numbers: ${numbers.join(', ')} Powerball: ${powerball}`);
        }
    };
    
    panel.appendChild(generateBtn);
}

// Function to load data from local CSV
async function loadLotteryData() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const lastUpdatedEl = document.getElementById('last-updated');
    
    if (loadingIndicator) loadingIndicator.style.display = 'inline-block';
    
    try {
        // Load from local CSV
        const csvResponse = await fetch('powerball.csv');
        if (!csvResponse.ok) throw new Error('Failed to load local CSV');
        
        const csvText = await csvResponse.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        let currentDate = '';
        const localPowerballResults = [];
        const localDoublePlayResults = [];
        
        // Process each line in the CSV
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check if line is a date
            const dateMatch = trimmedLine.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch) {
                currentDate = dateMatch[1];
                continue;
            }
            
            // Process Powerball line
            const pbMatch = trimmedLine.match(/Powerball® Numbers\s+([\d\s\-]+),"\s*(\d+)\s*,\s*(\d+)/);
            if (pbMatch && currentDate) {
                const balls = pbMatch[1].trim().split(/\s*\-\s*/).map(Number);
                const powerball = parseInt(pbMatch[2].trim(), 10);
                const powerplay = pbMatch[3].trim();
                
                localPowerballResults.push({
                    'Draw Date': currentDate,
                    'Ball 1': balls[0],
                    'Ball 2': balls[1],
                    'Ball 3': balls[2],
                    'Ball 4': balls[3],
                    'Ball 5': balls[4],
                    'Powerball': powerball,
                    'Power Play': powerplay
                });
                continue;
            }
            
            // Process Double Play line
            const dpMatch = trimmedLine.match(/Double Play® Numbers\s+([\d\s\-]+),"\s*(\d+)/);
            if (dpMatch && currentDate) {
                const balls = dpMatch[1].trim().split(/\s*\-\s*/).map(Number);
                const powerball = parseInt(dpMatch[2].trim(), 10);
                
                localDoublePlayResults.push({
                    'Draw Date': currentDate,
                    'Double Play 1': balls[0],
                    'Double Play 2': balls[1],
                    'Double Play 3': balls[2],
                    'Double Play 4': balls[3],
                    'Double Play 5': balls[4],
                    'Double Play PB': powerball
                });
            }
        }
        
        // Sort results by date (newest first)
        powerballResults = localPowerballResults.sort((a, b) => 
            new Date(b['Draw Date']) - new Date(a['Draw Date'])
        );
        
        doublePlayResults = localDoublePlayResults.sort((a, b) => 
            new Date(b['Draw Date']) - new Date(a['Draw Date'])
        );
        
        // Update the UI with the loaded data
        processAndUpdateUI();
        
        // Update last updated timestamp
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
        }
        
        // Store in localStorage for offline use
        localStorage.setItem('cachedPowerballResults', JSON.stringify(powerballResults));
        localStorage.setItem('cachedDoublePlayResults', JSON.stringify(doublePlayResults));
        localStorage.setItem('lastUpdated', new Date().toISOString());
        
        return true;
        
    } catch (error) {
        console.error('Error loading local CSV:', error);
        
        // Try to load from localStorage if available
        try {
            const cachedPowerball = localStorage.getItem('cachedPowerballResults');
            const cachedDoublePlay = localStorage.getItem('cachedDoublePlayResults');
            
            if (cachedPowerball && cachedDoublePlay) {
                powerballResults = JSON.parse(cachedPowerball);
                doublePlayResults = JSON.parse(cachedDoublePlay);
                processAndUpdateUI();
                
                if (lastUpdatedEl) {
                    const lastUpdated = localStorage.getItem('lastUpdated');
                    lastUpdatedEl.textContent = `Last updated: ${new Date(lastUpdated).toLocaleString()} (cached)`;
                }
                
                return true;
            }
            
            throw new Error('No data available');
            
        } catch (cacheError) {
            console.error('Error loading from cache:', cacheError);
            return false;
        }
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// Process the data and update the UI
function processAndUpdateUI() {
    if ((!powerballResults || powerballResults.length === 0) && 
        (!doublePlayResults || doublePlayResults.length === 0)) {
        console.error('No data available to process');
        return;
    }
    
    console.log('Updating UI with Powerball and Double Play results');
    
    // Function to update a results table
    const updateTable = (results, tableId, isDoublePlay = false) => {
        if (!results || results.length === 0) return;
        
        // Sort results by date (newest first)
        const sortedResults = [...results].sort((a, b) => 
            new Date(b['Draw Date']) - new Date(a['Draw Date'])
        );
        
        // Update the results table
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) {
            console.error(`Table body not found for #${tableId}`);
            return;
        }
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add new rows
        sortedResults.forEach(draw => {
            const row = document.createElement('tr');
            
            // Format the date
            const drawDate = new Date(draw['Draw Date']);
            const formattedDate = drawDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            });
            
            // Create cells for each ball
            const balls = [
                draw['Ball 1'],
                draw['Ball 2'],
                draw['Ball 3'],
                draw['Ball 4'],
                draw['Ball 5']
            ];
            
            // Add date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = formattedDate;
            row.appendChild(dateCell);
            
            // Add ball cells
            balls.forEach(ball => {
                const cell = document.createElement('td');
                cell.className = 'ball';
                cell.textContent = ball;
                row.appendChild(cell);
            });
            
            // Add Powerball cell
            const powerballCell = document.createElement('td');
            powerballCell.className = 'powerball';
            powerballCell.textContent = draw['Powerball'] || '';
            row.appendChild(powerballCell);
            
            // Add Power Play cell if available (only for Powerball, not Double Play)
            if (!isDoublePlay && draw['Power Play']) {
                const powerPlayCell = document.createElement('td');
                powerPlayCell.className = 'powerplay';
                powerPlayCell.textContent = draw['Power Play'];
                row.appendChild(powerPlayCell);
            }
            
            tbody.appendChild(row);
        });
    };
    
    // Update Powerball table
    updateTable(powerballResults, 'powerball-results');
    
    // Update Double Play table if results exist
    if (doublePlayResults && doublePlayResults.length > 0) {
        const doublePlaySection = document.querySelector('.double-play-section');
        if (doublePlaySection) {
            doublePlaySection.style.display = 'block';
        }
        updateTable(doublePlayResults, 'doubleplay-results', true);
    }
    
    // Update last updated timestamp
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleString();
    }
    
    console.log('UI update complete');
}
document.addEventListener('click', function(e) {
    // Skip if the click is on a ball (ball has its own handler)
    if (e.target.closest('.ball')) {
        return;
    }
}, true);

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API data loading
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            try {
                await loadLotteryData();
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        });
    }
    
    // Load initial data
    try {
        await loadLotteryData();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
    
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

    // Tab switching logic for all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = btn.getAttribute('data-tab');
            console.log('Tab clicked:', tabId);
            
            // Update active state for all tabs
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Show the selected tab content
            const tabContent = document.getElementById('tab-' + tabId);
            if (!tabContent) {
                console.error('Tab content not found for:', tabId);
                return;
            }
            
            // Special display style for trio tab
            tabContent.style.display = tabId === 'trio' ? 'flex' : 'block';
            console.log('Displaying tab content for:', tabId);
            console.log('Tab content element:', tabContent);
            console.log('Tab content final display:', tabContent.style.display);
            
            // Initialize tab-specific content
            if (tabId === 'combo') {
                renderComboBallPanel();
            } else if (tabId === 'new') {
                console.log('History tab activated');
                renderNewBallPanel();
                const resultsDiv = document.getElementById('new-tab-results');
                if (resultsDiv) {
                    // Clear previous content
                    resultsDiv.innerHTML = '<div style="text-align: center; padding: 10px; color: #666;">Loading history data...</div>';
                    
                    // Small delay to allow UI to update before rendering
                    setTimeout(() => {
                        try {
                            renderHistoryTab();
                            console.log('History tab rendered successfully');
                        } catch (error) {
                            console.error('Error rendering history tab:', error);
                            resultsDiv.innerHTML = `
                                <div style="color:#e74c3c; margin:18px 0; padding: 15px; background: #fff5f5; border: 1px solid #ffd6d6; border-radius: 4px;">
                                    <p>Error loading history data:</p>
                                    <pre style="white-space: pre-wrap; background: #fff; padding: 10px; border: 1px solid #eee; margin: 10px 0; overflow: auto;">${error.message || 'Unknown error'}</pre>
                                    <p>Please check the console for more details and refresh the page to try again.</p>
                                </div>`;
                        }
                    }, 50);
                }
            } else if (tabId === 'trio') {
                renderTrioTab();
            } else if (tabId === 'trio2') {
                renderTrio2Tab();
            } else if (tabId === 'combo45') {
                renderPowerballCombo45Results();
            } else if (tabId === 'powerball') {
                console.log('Powerball tab clicked');
                
                // Ensure the tab is visible first
                const powerballTab = document.getElementById('tab-powerball');
                console.log('Powerball tab element:', powerballTab);
                console.log('Powerball tab display style:', powerballTab ? powerballTab.style.display : 'not found');
                
                // Check if we have draw data
                if (!window.filteredDrawRows || window.filteredDrawRows.length === 0) {
                    console.error('No draw data available for Powerball tab');
                    const resultsDiv = document.getElementById('powerball-results');
                    if (resultsDiv) {
                        resultsDiv.innerHTML = '<div style="color:#e74c3c; margin:18px 0; text-align: center;">Loading draw data... Please wait.</div>';
                    }
                    // Try to re-render after a short delay in case data is still loading
                    setTimeout(() => {
                        if (window.filteredDrawRows && window.filteredDrawRows.length > 0) {
                            console.log('Draw data loaded, rendering Powerball panel');
                            renderPowerballBallPanel();
                        }
                    }, 1000);
                } else {
                    // We have draw data, render the ball panel
                    console.log('Rendering Powerball panel with', window.filteredDrawRows.length, 'draws');
                    renderPowerballBallPanel();
                }
            } else if (tabId === '2x') {
                console.log('2x tab activated');
                // Initialize selectedBalls if it doesn't exist
                window.selectedBalls = window.selectedBalls || [];
                console.log('Current selectedBalls:', window.selectedBalls);
                
                // Clear any existing results or create results div if it doesn't exist
                let resultsDiv = document.getElementById('twox-results');
                
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
                        return; // Exit if we can't find where to add the results
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
        });
    });
    // Helper: Generate all k-combos from array
    function getCombos(arr, k) {
        const results = [];
        function helper(start, combo) {
            if (combo.length === k) {
                results.push(combo.slice().sort((a, b) => a - b));
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

    // Helper: Generate random unique numbers from 1-69, excluding arr
    function generateUniqueNumbers(count, min, max, excludeArr) {
        const pool = [];
        for (let i = min; i <= max; i++) {
            if (!excludeArr.includes(i)) pool.push(i);
        }
        const selected = [];
        while (selected.length < count && pool.length > 0) {
            const idx = Math.floor(Math.random() * pool.length);
            selected.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return selected;
    }

    // Helper function to find all pairs that include a specific number
    function findPairsWithNumber(draws, targetNumber) {
        const pairMap = new Map(); // pairStr -> Set of dates
        draws.forEach(draw => {
            if (draw.mainArr && draw.mainArr.length === 5 && draw.mainArr.includes(targetNumber)) {
                // Get all pairs that include the target number
                const otherNumbers = draw.mainArr.filter(n => n !== targetNumber);
                otherNumbers.forEach(num => {
                    const pair = [targetNumber, num].sort((a, b) => a - b);
                    const key = pair.join('-');
                    if (!pairMap.has(key)) pairMap.set(key, new Set());
                    pairMap.get(key).add(draw.date);
                });
            }
        });
        return Array.from(pairMap.entries())
            .filter(([_, dates]) => dates.size >= 1) // Include pairs that appeared at least once
            .map(([pairStr, dates]) => ({
                numbers: pairStr.split('-').map(Number),
                dates: dates
            }));
    }

    // Render the Trio tab results
    function renderTrioTab() {
        const resultsDiv = document.getElementById('trio-results');
        const random2Div = document.getElementById('random2-results');
        if (!resultsDiv || !random2Div) return;
        // Filter draws from 2015 to 2025
        const draws = (window.filteredDrawRows || []).filter(draw => {
            const dateStr = (draw.date || '').trim();
            const parts = dateStr.split('/');
            const year = parts.length === 3 ? parseInt(parts[2], 10) : 0;
            return year >= 2015 && year <= 2025;
        });
        // --- Collect all trios and their dates ---
        const trioMap = new Map(); // trioStr -> Set of dates
        draws.forEach(draw => {
            if (draw.mainArr && draw.mainArr.length === 5) {
                getCombos(draw.mainArr, 3).forEach(trio => {
                    const key = trio.join('-');
                    if (!trioMap.has(key)) trioMap.set(key, new Set());
                    trioMap.get(key).add(draw.date);
                });
            }
        });
        // Only use trios that appeared at least 2x
        const eligibleTrios = Array.from(trioMap.entries()).filter(([_, dates]) => dates.size >= 2);
        if (eligibleTrios.length === 0) {
            resultsDiv.innerHTML = '<div style="color:#e74c3c;">No trios found (with 2+ appearances) in draws from 2015-2025.</div>';
            random2Div.innerHTML = '';
            return;
        }
        // Find all pairs that include 17
        const pairsWith17 = findPairsWithNumber(draws, 17);
        
        // UI header and buttons
        resultsDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:15px;gap:12px;">
                    <h2 style="margin:0;color:#3498db;font-size:1.3em;font-weight:700;letter-spacing:1px;">Powerball Trio Generator (2015-2025)</h2>
                    <div style="display:flex;gap:10px;">
                        <button id="trio-generate-btn" style="padding:10px 20px;font-size:1.1em;border-radius:8px;border:1.5px solid #3498db;background:#fff;color:#3498db;cursor:pointer;font-weight:600;transition:all 0.18s;white-space:nowrap;">
                            Generate Trios
                        </button>
                        <button id="trio-17-generate-btn" style="padding:10px 20px;font-size:1.1em;border-radius:8px;border:1.5px solid #e67e22;background:#fff;color:#e67e22;cursor:pointer;font-weight:600;transition:all 0.18s;white-space:nowrap;">
                            Generate 17-Based Trios
                        </button>
                    </div>
                </div>
                <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;">
                    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px;">
                        <input type="text" id="trio-input-numbers" placeholder="Enter up to 3 numbers (e.g., 5, 12, 23)" style="flex:1;min-width:200px;padding:10px;border:1px solid #ddd;border-radius:4px;">
                        <button id="trio-generate-from-input" style="padding:10px 20px;font-size:1em;border-radius:8px;border:none;background:#27ae60;color:white;cursor:pointer;font-weight:600;white-space:nowrap;">
                            Generate from Input
                        </button>
                    </div>
                    <div style="font-size:0.9em;color:#666;">Enter 1-3 numbers to generate combinations using duos that share one number with your input.</div>
                </div>
            </div>
            <div id="trio-cards-container"></div>
        `;
        random2Div.innerHTML = '';
        function generateOutputs() {
            // Shuffle eligible trios
            const shuffled = eligibleTrios.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            // Pick top 20
            const chosen = shuffled.slice(0, 20);
            let cardsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;">`;
            chosen.forEach(([trio, dates]) => {
                const trioNums = trio.split('-').map(Number);
                const random2 = generateUniqueNumbers(2, 1, 69, trioNums);
                const combo = [...trioNums, ...random2].sort((a, b) => a - b);
                cardsHtml += `
                    <div style="background:#f8faff;border-radius:13px;box-shadow:0 2px 12px rgb(44 62 80 / 10%);padding:22px 18px 18px 18px;display:flex;flex-direction:column;align-items:center;">
                        <div style="font-size:1.15em;font-weight:600;color:#234;letter-spacing:0.5px;margin-bottom:6px;">Trio: <span style='color:#e67e22;'>${trioNums.join('-')}</span></div>
                        <div style="margin-bottom:8px;font-size:1.08em;color:#555;">Dates: <br><span style='color:#3498db;font-size:0.98em;'>${Array.from(dates).join('<br>')}</span></div>
                        <div style="margin:10px 0 0 0;font-size:1.18em;font-weight:700;letter-spacing:1.2px;background:#27ae60;color:#fff;padding:8px 18px;border-radius:7px;">${combo.join('-')}</div>
                    </div>
                `;
            });
            cardsHtml += `</div>`;
            document.getElementById('trio-cards-container').innerHTML = cardsHtml;
        }
        // Generate combinations from input numbers
        document.getElementById('trio-generate-from-input').addEventListener('click', function() {
            const inputText = document.getElementById('trio-input-numbers').value.trim();
            if (!inputText) {
                alert('Please enter at least one number');
                return;
            }
            
            // Parse input numbers (1-69, max 3 numbers)
            const inputNumbers = inputText.split(',')
                .map(num => parseInt(num.trim(), 10))
                .filter(num => !isNaN(num) && num >= 1 && num <= 69)
                .slice(0, 3);
                
            if (inputNumbers.length === 0) {
                alert('Please enter valid numbers between 1 and 69');
                return;
            }
            
            console.log('Generating combinations for input numbers:', inputNumbers);
            
            // Find all duos that share at least one number with input
            const validDuos = [];
            const duoMap = new Map(); // duo string -> Set of dates
            
            // First pass: collect all valid duos that share a number with input
            draws.forEach(draw => {
                if (draw.mainArr && draw.mainArr.length === 5) {
                    const numbers = draw.mainArr;
                    
                    // Generate all possible duos from this draw
                    for (let i = 0; i < numbers.length; i++) {
                        for (let j = i + 1; j < numbers.length; j++) {
                            const duo = [numbers[i], numbers[j]].sort((a, b) => a - b);
                            const duoKey = duo.join(':');
                            
                            // Check if this duo shares at least one number with input
                            const sharesNumber = duo.some(num => inputNumbers.includes(num));
                            
                            if (sharesNumber) {
                                if (!duoMap.has(duoKey)) {
                                    duoMap.set(duoKey, new Set());
                                }
                                duoMap.get(duoKey).add(draw.date);
                            }
                        }
                    }
                }
            });
            
            // Convert to array of {numbers, dates} objects
            const duos = Array.from(duoMap.entries()).map(([duoKey, dates]) => ({
                numbers: duoKey.split(':').map(Number),
                dates: Array.from(dates)
            }));
            
            if (duos.length < 2) {
                document.getElementById('trio-cards-container').innerHTML = 
                    '<div style="color:#e74c3c;padding:20px;text-align:center;">Not enough matching duos found for the input numbers.</div>';
                return;
            }
            
            // Generate combinations by combining duos that don't share numbers (except the input)
            const results = [];
            const usedPairs = new Set();
            
            for (let i = 0; i < Math.min(20, duos.length); i++) {
                const duo1 = duos[i];
                
                // Find a second duo that doesn't share non-input numbers with duo1
                for (let j = 0; j < duos.length; j++) {
                    if (i === j) continue;
                    
                    const duo2 = duos[j];
                    const key = `${duo1.numbers.join(':')}|${duo2.numbers.join(':')}`;
                    
                    if (usedPairs.has(key)) continue;
                    
                    // Check if duos can be combined (no number conflicts except possibly input numbers)
                    const allNumbers = [...new Set([...duo1.numbers, ...duo2.numbers])];
                    
                    // If combined numbers are 3-5 unique numbers, it's a valid combination
                    if (allNumbers.length >= 3 && allNumbers.length <= 5) {
                        // Fill remaining numbers randomly if needed
                        while (allNumbers.length < 5) {
                            const randomNum = Math.floor(Math.random() * 69) + 1;
                            if (!allNumbers.includes(randomNum)) {
                                allNumbers.push(randomNum);
                            }
                        }
                        
                        const combo = allNumbers.sort((a, b) => a - b);
                        const comboKey = combo.join(':');
                        
                        if (!usedPairs.has(comboKey)) {
                            usedPairs.add(comboKey);
                            results.push({
                                combo: combo,
                                sourceDuos: [duo1, duo2],
                                dates: [...new Set([...duo1.dates, ...duo2.dates])]
                            });
                            
                            if (results.length >= 20) break;
                        }
                    }
                }
                
                if (results.length >= 20) break;
            }
            
            // Display results
            if (results.length > 0) {
                let cardsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;">`;
                
                results.forEach((result, index) => {
                    const combo = result.combo;
                    const sourceNumbers = [...new Set([...result.sourceDuos[0].numbers, ...result.sourceDuos[1].numbers])];
                    const sourceDates = result.dates;
                    
                    cardsHtml += `
                        <div style="background:#f8faff;border-radius:13px;box-shadow:0 2px 12px rgb(44 62 80 / 10%);padding:22px 18px 18px 18px;display:flex;flex-direction:column;align-items:center;">
                            <div style="font-size:1.15em;font-weight:600;color:#234;letter-spacing:0.5px;margin-bottom:6px;">
                                From Input: <span style='color:#e67e22;'>${inputNumbers.join(', ')}</span>
                            </div>
                            <div style="margin-bottom:8px;font-size:1.08em;color:#555;width:100%;">
                                <div style="margin-bottom:5px;">Source Numbers: <span style='color:#3498db;'>${sourceNumbers.join(', ')}</span></div>
                                <div style="font-size:0.9em;color:#666;margin-top:5px;">
                                    <div>Draw Dates:</div>
                                    <div style="max-height:80px;overflow-y:auto;background:#f0f4f8;padding:8px;border-radius:4px;margin-top:4px;border:1px solid #e0e6ed;">
                                        ${sourceDates.slice(0, 10).map(date => `<div>${date}</div>`).join('')}
                                        ${sourceDates.length > 10 ? `<div>...and ${sourceDates.length - 10} more</div>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div style="margin:10px 0 0 0;font-size:1.18em;font-weight:700;letter-spacing:1.2px;background:#27ae60;color:#fff;padding:8px 18px;border-radius:7px;">
                                ${combo.join('-')}
                            </div>
                        </div>
                    `;
                });
                
                cardsHtml += `</div>`;
                document.getElementById('trio-cards-container').innerHTML = cardsHtml;
            } else {
                document.getElementById('trio-cards-container').innerHTML = 
                    '<div style="color:#e74c3c;padding:20px;text-align:center;">No valid combinations found for the input numbers.</div>';
            }
        });
        
        // Generate 17-based trios function
        function generate17BasedTrios() {
            if (pairsWith17.length < 2) {
                document.getElementById('trio-cards-container').innerHTML = 
                    '<div style="color:#e74c3c;padding:20px;text-align:center;">Not enough pairs containing 17 found to generate combinations.</div>';
                return;
            }

            // Create a map to track all unique trios containing 17
            const trioMap = new Map();
            
            // First, find all trios containing 17
            draws.forEach(draw => {
                if (draw.mainArr && draw.mainArr.includes(17)) {
                    const otherNumbers = draw.mainArr.filter(n => n !== 17);
                    for (let i = 0; i < otherNumbers.length; i++) {
                        for (let j = i + 1; j < otherNumbers.length; j++) {
                            const num1 = otherNumbers[i];
                            const num2 = otherNumbers[j];
                            const trio = [17, num1, num2].sort((a, b) => a - b);
                            const trioKey = trio.join(':');
                            
                            if (!trioMap.has(trioKey)) {
                                trioMap.set(trioKey, {
                                    numbers: trio,
                                    dates: new Set([draw.date])
                                });
                            } else {
                                trioMap.get(trioKey).dates.add(draw.date);
                            }
                        }
                    }
                }
            });
            
            const allTrios = Array.from(trioMap.values());
            if (allTrios.length < 2) {
                document.getElementById('trio-cards-container').innerHTML = 
                    '<div style="color:#e74c3c;padding:20px;text-align:center;">Not enough unique trios containing 17 found.</div>';
                return;
            }
            
            // Now find combinations of 2-3 trios that share 17 and together form 5 unique numbers
            const results = [];
            const usedCombinations = new Set();
            
            // Try combinations of 2 trios first (sharing 17 and one other number)
            for (let i = 0; i < allTrios.length; i++) {
                const trio1 = allTrios[i];
                const nums1 = new Set(trio1.numbers);
                
                for (let j = i + 1; j < allTrios.length; j++) {
                    const trio2 = allTrios[j];
                    const combo = new Set([...trio1.numbers, ...trio2.numbers]);
                    
                    // Check if combination has exactly 5 unique numbers (including 17)
                    if (combo.size === 5 && combo.has(17)) {
                        const comboKey = Array.from(combo).sort((a, b) => a - b).join(':');
                        
                        if (!usedCombinations.has(comboKey)) {
                            usedCombinations.add(comboKey);
                            results.push({
                                numbers: Array.from(combo).sort((a, b) => a - b),
                                trios: [trio1, trio2],
                                sharedNumber: 17,
                                dates: new Set([...trio1.dates, ...trio2.dates])
                            });
                            
                            // Limit to 20 combinations
                            if (results.length >= 20) break;
                        }
                    }
                }
                if (results.length >= 20) break;
            }
            
            // If we don't have enough combinations with 2 trios, try combinations of 3 trios
            if (results.length < 20) {
                for (let i = 0; i < allTrios.length; i++) {
                    const trio1 = allTrios[i];
                    
                    for (let j = i + 1; j < allTrios.length; j++) {
                        const trio2 = allTrios[j];
                        
                        for (let k = j + 1; k < allTrios.length; k++) {
                            const trio3 = allTrios[k];
                            const combo = new Set([...trio1.numbers, ...trio2.numbers, ...trio3.numbers]);
                            
                            // Check if combination has exactly 5 unique numbers (including 17)
                            if (combo.size === 5 && combo.has(17)) {
                                const comboKey = Array.from(combo).sort((a, b) => a - b).join(':');
                                
                                if (!usedCombinations.has(comboKey)) {
                                    usedCombinations.add(comboKey);
                                    results.push({
                                        numbers: Array.from(combo).sort((a, b) => a - b),
                                        trios: [trio1, trio2, trio3],
                                        sharedNumber: 17,
                                        dates: new Set([...trio1.dates, ...trio2.dates, ...trio3.dates])
                                    });
                                    
                                    // Limit to 20 combinations total
                                    if (results.length >= 20) break;
                                }
                            }
                        }
                        if (results.length >= 20) break;
                    }
                    if (results.length >= 20) break;
                }
            }
            
            if (results.length === 0) {
                document.getElementById('trio-cards-container').innerHTML = 
                    '<div style="color:#e74c3c;padding:20px;text-align:center;">Could not generate any valid 17-based trios from the available pairs.</div>';
                return;
            }
            
            // Display the results
            let cardsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px;">`;
            
            results.forEach((result, index) => {
                const { numbers, trios, dates } = result;
                const powerball = Math.floor(Math.random() * 26) + 1; // Random powerball 1-26
                
                cardsHtml += `
                    <div style="background:#f8faff;border-radius:13px;box-shadow:0 2px 12px rgb(44 62 80 / 10%);padding:20px;display:flex;flex-direction:column;">
                        <div style="text-align:center;margin-bottom:12px;">
                            <div style="font-size:1.2em;font-weight:700;color:#e67e22;margin-bottom:10px;">
                                Combination #${index + 1}
                            </div>
                            
                            <div style="display:flex;justify-content:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                                ${numbers.map(num => 
                                    `<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${num === 17 ? '#e74c3c' : '#3498db'};color:white;font-weight:bold;">
                                        ${num}
                                    </span>`
                                ).join('')}
                                <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#e67e22;color:white;font-weight:bold;">
                                    ${powerball}
                                </span>
                            </div>
                            
                            <div style="margin:10px 0;font-size:0.9em;color:#555;">
                                <div style="margin-bottom:6px;font-weight:600;">Composition:</div>
                                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:8px;margin-bottom:8px;">
                                    ${trios.map((trio, i) => {
                                        const trioNums = trio.numbers.sort((a, b) => a - b);
                                        return `
                                            <div style="background:#f0f7ff;padding:6px;border-radius:6px;text-align:center;">
                                                <div style="font-size:0.8em;color:#3498db;margin-bottom:4px;">Trio ${i+1}</div>
                                                <div style="display:flex;justify-content:center;gap:4px;">
                                                    ${trioNums.map(n => 
                                                        `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${n === 17 ? '#e74c3c' : '#3498db'};color:white;font-size:0.8em;font-weight:bold;">
                                                            ${n}
                                                        </span>`
                                                    ).join('')}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top:auto;font-size:0.85em;color:#666;max-height:120px;overflow-y:auto;border-top:1px solid #eee;padding-top:10px;">
                            <div style="font-weight:600;margin-bottom:5px;color:#444;">Appeared in draws:</div>
                            <div style="max-height:80px;overflow-y:auto;font-size:0.9em;">
                                ${Array.from(dates).slice(0, 5).map(date => 
                                    `<div style="padding:2px 0;border-bottom:1px solid #f0f0f0;">${date}</div>`
                                ).join('')}
                                ${dates.size > 5 ? 
                                    `<div style="color:#7f8c8d;font-style:italic;margin-top:4px;">+ ${dates.size - 5} more...</div>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                `;
            });
            
            cardsHtml += `</div>`;
            document.getElementById('trio-cards-container').innerHTML = cardsHtml;
        }

        // Initial output
        generateOutputs();
        
        // Button handlers
        setTimeout(() => {
            const btn = document.getElementById('trio-generate-btn');
            const btn17 = document.getElementById('trio-17-generate-btn');
            const customTrioBtn = document.getElementById('custom-trio-generate-btn');
            
            if (btn) btn.onclick = generateOutputs;
            if (btn17) btn17.onclick = generate17BasedTrios;
            if (customTrioBtn) customTrioBtn.onclick = generateCustomBasedTrios;
        }, 0);
    }
    // Add a function to initialize the Trio tab after data is loaded
    function initializeTrioTab() {
        console.log('Initializing Trio tab with', window.filteredDrawRows ? window.filteredDrawRows.length : 0, 'draws');
        if (window.filteredDrawRows && window.filteredDrawRows.length > 0) {
            renderTrioTab();
        }
    }
    
    // Function to generate trios based on a custom number
    function generateCustomBasedTrios() {
        const customNumber = parseInt(document.getElementById('custom-trio-number').value);
        
        if (isNaN(customNumber) || customNumber < 1 || customNumber > 69) {
            alert('Please enter a valid number between 1 and 69');
            return;
        }
        
        // Find all pairs that include the custom number
        const pairsWithNumber = findPairsWithNumber(window.filteredDrawRows, customNumber);
        
        if (pairsWithNumber.length < 2) {
            document.getElementById('trio-cards-container').innerHTML = 
                `<div style="color:#e74c3c;padding:20px;text-align:center;">Not enough pairs containing ${customNumber} found to generate trios.</div>`;
            return;
        }

        // Shuffle the pairs
        const shuffledPairs = [...pairsWithNumber].sort(() => Math.random() - 0.5);
        
        // Create a set to track used pairs to ensure we don't reuse the same pair
        const usedIndices = new Set();
        const results = [];
        
        // Try to create up to 20 unique trios
        for (let i = 0; i < Math.min(20, Math.floor(pairsWithNumber.length / 2)); i++) {
            // Find two different pairs that haven't been used yet
            let pair1Index, pair2Index;
            
            // Try to find a valid pair combination
            for (let j = 0; j < shuffledPairs.length && !pair1Index; j++) {
                if (!usedIndices.has(j)) {
                    for (let k = j + 1; k < shuffledPairs.length; k++) {
                        if (!usedIndices.has(k)) {
                            // Check if these pairs can form a valid trio (all numbers must be unique except the custom number)
                            const num1 = shuffledPairs[j].numbers.find(n => n !== customNumber);
                            const num2 = shuffledPairs[k].numbers.find(n => n !== customNumber);
                            if (num1 !== num2) {
                                pair1Index = j;
                                pair2Index = k;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (pair1Index !== undefined && pair2Index !== undefined) {
                const pair1 = shuffledPairs[pair1Index];
                const pair2 = shuffledPairs[pair2Index];
                
                // Extract the other number from each pair (the one that's not the custom number)
                const num1 = pair1.numbers.find(n => n !== customNumber);
                const num2 = pair2.numbers.find(n => n !== customNumber);
                
                // Create the trio (customNumber, num1, num2)
                const trio = [customNumber, num1, num2].sort((a, b) => a - b);
                
                // Combine dates from both pairs
                const combinedDates = new Set([...pair1.dates, ...pair2.dates]);
                
                results.push({
                    trio: trio,
                    dates: combinedDates,
                    sourcePairs: [
                        { numbers: [customNumber, num1], dates: pair1.dates },
                        { numbers: [customNumber, num2], dates: pair2.dates }
                    ]
                });
                
                // Mark these pairs as used
                usedIndices.add(pair1Index);
                usedIndices.add(pair2Index);
            }
        }
        
        const cardsContainer = document.getElementById('trio-results') || document.createElement('div');
        
        if (results.length === 0) {
            cardsContainer.innerHTML = 
                `<div style="color:#e74c3c;padding:20px;text-align:center;">Could not generate any valid ${customNumber}-based trios from the available pairs.</div>`;
            return;
        }
        
        // Generate HTML for the results
        let cardsHtml = `
            <div style="margin: 24px 0;">
                <h3 style="color:#2c3e50;margin-bottom:16px;font-size:1.3em;">Generated ${customNumber}-Based Trios</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
        `;
        
        results.forEach((result, index) => {
            const datesList = Array.from(result.dates).slice(0, 5).map(date => 
                `<div style="font-size:0.85em;color:#7f8c8d;margin-top:4px;">${date}</div>`
            ).join('');
            
            cardsHtml += `
                <div style="background:white;border-radius:10px;padding:16px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
                    <div style="display:flex;justify-content:center;gap:8px;margin-bottom:12px;">
                        ${result.trio.map(num => 
                            `<div style="width:36px;height:36px;border-radius:50%;background:#9b59b6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">
                                ${num}
                            </div>`
                        ).join('')}
                    </div>
                    <div style="font-size:0.9em;color:#7f8c8d;margin-bottom:8px;">
                        Based on pairs: ${result.sourcePairs[0].numbers.join(', ')} and ${result.sourcePairs[1].numbers.join(', ')}
                    </div>
                    <div style="max-height:120px;overflow-y:auto;border-top:1px solid #eee;padding-top:8px;">
                        ${datesList}
                        ${result.dates.size > 5 ? '<div style="font-size:0.8em;color:#7f8c8d;margin-top:4px;">...and ' + (result.dates.size - 5) + ' more</div>' : ''}
                    </div>
                </div>
            `;
        });
        
        cardsHtml += `
                </div>
            </div>
        `;
        
        cardsContainer.innerHTML = cardsHtml;
    }

    // Format date for display (moved up for reuse)
    function formatDate(date) {
        if (!(date instanceof Date)) date = new Date(date);
        return (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
    }
    
    // Helper function to parse date string into Date object at noon to avoid timezone issues
    function parseDrawDate(dateStr) {
        const [month, day, year] = dateStr.split('/').map(Number);
        // Handle both 2-digit and 4-digit years
        const fullYear = year > 1900 ? year : (year < 100 ? 2000 + year : year);
        // Create date at noon to avoid timezone/DST issues
        return new Date(Date.UTC(fullYear, month - 1, day, 12, 0, 0));
    }

    // Render the Trio 2 tab results (shows numbers from a specific month with statistics)
    function renderTrio2Tab() {
        console.log('Rendering Trio 2 tab...');
        const resultsDiv = document.getElementById('trio2-results');
        const comboDiv = document.getElementById('trio2-combo-results');
        if (!resultsDiv) {
            console.error('Missing required DOM elements');
            return;
        }

        // Get all available draws for Trio 2 tab
        const allDraws = window.allDraws || window.filteredDrawRows || [];
        console.log('Total draws available:', allDraws.length);

        // Filter draws with valid numbers and dates
        const validDraws = allDraws
            .filter(draw => {
                try {
                    if (!draw || !draw.mainArr || !Array.isArray(draw.mainArr) || draw.mainArr.length !== 5) {
                        return false;
                    }
                    
                    // Ensure all main numbers are valid
                    const hasInvalidNumbers = draw.mainArr.some(num => {
                        const n = parseInt(num, 10);
                        return isNaN(n) || n < 1 || n > 69;
                    });
                    
                    if (hasInvalidNumbers) {
                        return false;
                    }
                    
                    const dateStr = (draw.date || '').trim();
                    if (!dateStr) return false;
                    
                    const parts = dateStr.split('/');
                    if (parts.length !== 3) return false;
                    
                    const month = parseInt(parts[0], 10);
                    const day = parseInt(parts[1], 10);
                    let year = parseInt(parts[2], 10);
                    
                    if (isNaN(month) || isNaN(day) || isNaN(year)) {
                        return false;
                    }
                    
                    // Handle 2-digit years (assume 20xx for years < 100)
                    if (year < 100) {
                        year += 2000;
                    }
                    
                    return year >= 2015 && year <= 2025;
                } catch (error) {
                    console.error('Error processing draw:', draw, error);
                    return false;
                }
            });
            
        console.log(`Found ${validDraws.length} valid draws`);
        
        // Group draws by year and month
        const drawsByMonth = {};
        validDraws.forEach(draw => {
            try {
                const dateParts = draw.date.split('/');
                const month = parseInt(dateParts[0], 10);
                const year = parseInt(dateParts[2], 10) + (parseInt(dateParts[2], 10) < 100 ? 2000 : 0);
                const key = `${year}-${month.toString().padStart(2, '0')}`;
                
                if (!drawsByMonth[key]) {
                    drawsByMonth[key] = [];
                }
                drawsByMonth[key].push(draw);
            } catch (e) {
                console.error('Error processing draw date:', draw.date, e);
            }
        });
        
        // Get unique months for the dropdown
        const months = Object.keys(drawsByMonth).sort().reverse();
        
        // Create month selector UI
        resultsDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="margin:0 0 10px 0;color:#3498db;font-size:1.3em;font-weight:700;letter-spacing:1px;">
                    Monthly Number Analysis
                </h2>
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
                    <label for="month-select" style="font-weight: 600;">Select Month:</label>
                    <select id="month-select" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                        ${months.map(month => {
                            const [year, mon] = month.split('-');
                            const monthName = new Date(parseInt(year), parseInt(mon) - 1, 1).toLocaleString('default', { month: 'long' });
                            return `<option value="${month}">${monthName} ${year}</option>`;
                        }).join('')}
                    </select>
                    <button id="analyze-btn" style="padding:8px 16px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">
                        Analyze
                    </button>
                </div>
                <div id="monthly-stats" style="margin-top: 20px;"></div>
            </div>
            <div id="trio2-cards-container"></div>
        `;
        
        // Function to analyze and display monthly stats
        function analyzeMonth(monthKey) {
            const monthlyDraws = drawsByMonth[monthKey] || [];
            if (monthlyDraws.length === 0) {
                document.getElementById('monthly-stats').innerHTML = '<p>No draw data available for the selected month.</p>';
                return;
            }
            
            // Collect all numbers from the month
            const allNumbers = [];
            monthlyDraws.forEach(draw => {
                allNumbers.push(...draw.mainArr.map(n => parseInt(n, 10)));
            });
            
            // Calculate statistics
            const uniqueNumbers = [...new Set(allNumbers)];
            const sum = allNumbers.reduce((a, b) => a + b, 0);
            const avg = sum / allNumbers.length;
            
            // Count high/low (high = 35-69, low = 1-34)
            const highCount = allNumbers.filter(n => n >= 35).length;
            const lowCount = allNumbers.length - highCount;
            
            // Count odd/even
            const oddCount = allNumbers.filter(n => n % 2 !== 0).length;
            const evenCount = allNumbers.length - oddCount;
            
            // Get top 10 most frequent numbers
            const frequencyMap = allNumbers.reduce((acc, num) => {
                acc[num] = (acc[num] || 0) + 1;
                return acc;
            }, {});
            
            const sortedNumbers = Object.entries(frequencyMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            
            // Display the statistics
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
            
            document.getElementById('monthly-stats').innerHTML = `
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
                    <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.1em;">${monthName} ${year} Statistics</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                        <div style="background: white; padding: 6px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                            <div style="font-size: 0.75em; color: #7f8c8d; margin-bottom: 2px;">Total Draws</div>
                            <div style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${monthlyDraws.length * 2}</div>
                        </div>
                        <div style="background: white; padding: 6px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                            <div style="font-size: 0.75em; color: #7f8c8d; margin-bottom: 2px;">Unique Numbers</div>
                            <div style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${uniqueNumbers.length}</div>
                        </div>
                        <div style="background: white; padding: 6px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                            <div style="font-size: 0.75em; color: #7f8c8d; margin-bottom: 2px;">High/Low</div>
                            <div style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${highCount}/${lowCount}</div>
                        </div>
                        <div style="background: white; padding: 6px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                            <div style="font-size: 0.75em; color: #7f8c8d; margin-bottom: 2px;">Odd/Even</div>
                            <div style="font-size: 1.1em; font-weight: bold; color: #2c3e50;">${oddCount}/${evenCount}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px;">
                        <h4 style="margin: 0 0 6px 0; color: #2c3e50; font-size: 1em;">Top 10 Most Frequent Numbers</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${sortedNumbers.map(([num, count]) => `
                                <div style="background: #e74c3c; color: white; padding: 3px 6px; border-radius: 3px; display: flex; align-items: center; font-size: 0.85em;">
                                    <span style="font-weight: bold; margin-right: 3px;">${num}</span>
                                    <span style="font-size: 0.75em; opacity: 0.9;">${count}×</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            // Generate random combinations using numbers from this month
            generateRandomCombinations(uniqueNumbers, monthKey);
        }
        
        // Function to check if and when a combination has appeared before
        function getCombinationHistory(combo, allDraws) {
            // Convert combo to a sorted array of numbers for consistent comparison
            const comboNumbers = [...new Set(combo)].map(n => parseInt(n, 10)).sort((a, b) => a - b);
            const powerballHistory = [];
            const doublePlayHistory = [];
            
            allDraws.forEach(draw => {
                if (!draw.mainArr || draw.mainArr.length !== 5) return;
                
                // Convert draw numbers to sorted array of numbers
                const drawNumbers = draw.mainArr.map(n => parseInt(n, 10)).sort((a, b) => a - b);
                
                // Check if the sorted arrays match exactly
                const isMatch = comboNumbers.length === drawNumbers.length &&
                              comboNumbers.every((num, index) => num === drawNumbers[index]);
                
                if (isMatch) {
                    const drawInfo = {
                        date: draw.date,
                        numbers: [...drawNumbers],
                        fullDraw: draw.mainArr.join('-') + (draw.powerball ? ' PB:' + draw.powerball : '')
                    };
                    
                    // Separate Powerball and Double Play draws
                    if (draw.isDoublePlay) {
                        doublePlayHistory.push(drawInfo);
                    } else {
                        powerballHistory.push(drawInfo);
                    }
                }
            });
            
            const powerballCount = powerballHistory.length;
            const doublePlayCount = doublePlayHistory.length;
            const totalCount = powerballCount + doublePlayCount;
            const allHistory = [...powerballHistory, ...doublePlayHistory];
            
            return {
                appeared: totalCount > 0,
                count: totalCount * 2,  // Double the count for display purposes
                actualCount: totalCount,  // Keep the actual count for internal use
                history: allHistory,
                powerballCount: powerballCount,
                doublePlayCount: doublePlayCount
            };
        }

        // Function to generate random combinations
        function generateRandomCombinations(numbers, monthKey) {
            const container = document.getElementById('trio2-cards-container');
            if (!container) return;
            
            // Get all historical draws for checking
            const allDraws = window.allDraws || window.filteredDrawRows || [];
            
            // Generate 3 random combinations
            let html = '<h3 style="margin: 20px 0 10px 0; color: #2c3e50;">Random Combinations for Selected Month</h3>';
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
            
            // Track all generated combinations to ensure uniqueness
            const generatedCombos = new Set();
            const maxAttempts = 100; // Prevent infinite loops
            let attempts = 0;
            
            while (generatedCombos.size < 3 && attempts < maxAttempts) {
                attempts++;
                
                // Ensure we have enough unique numbers to generate a combination
                if (numbers.length < 5) {
                    console.warn('Not enough unique numbers to generate combinations');
                    break;
                }
                
                // Create a copy of the numbers array and shuffle it
                const shuffled = [...numbers].sort(() => 0.5 - Math.random());
                
                // Pick first 5 unique numbers
                const combo = [];
                const usedNumbers = new Set();
                
                for (const num of shuffled) {
                    if (!usedNumbers.has(num)) {
                        combo.push(num);
                        usedNumbers.add(num);
                        if (combo.length === 5) break;
                    }
                }
                
                // Sort and create a string key for the combination
                const comboKey = combo.sort((a, b) => a - b).join(':');
                
                // Skip if we've already generated this combination
                if (generatedCombos.has(comboKey)) {
                    continue;
                }
                
                // Add to our set of generated combinations
                generatedCombos.add(comboKey);
                
                // Sort the combination
                combo.sort((a, b) => a - b);
                const comboSet = new Set(combo);
                
                // Check if this combination has appeared before
                const comboHistory = getCombinationHistory(combo, allDraws);
                
                // Format history for display
                let historyText = '';
                if (comboHistory.appeared) {
                    const history = comboHistory.history[0];
                    const powerballText = comboHistory.powerballCount > 0 ? 
                        `${comboHistory.powerballCount} Powerball` : '';
                    const doublePlayText = comboHistory.doublePlayCount > 0 ? 
                        `${comboHistory.doublePlayCount} Double Play` : '';
                    // Show all occurrences with their dates
                    const occurrences = [];
                    
                    // Add Powerball occurrences
                    if (comboHistory.powerballCount > 0) {
                        const pbOccurrences = comboHistory.history
                            .filter(h => !h.isDoublePlay)
                            .map(h => `${h.date} (${h.fullDraw || 'no PB data'})`);
                        if (pbOccurrences.length > 0) {
                            occurrences.push(`${pbOccurrences.length} Powerball: ${pbOccurrences.join('; ')}`);
                        }
                    }
                    
                    // Add Double Play occurrences
                    if (comboHistory.doublePlayCount > 0) {
                        const dpOccurrences = comboHistory.history
                            .filter(h => h.isDoublePlay)
                            .map(h => `${h.date} (${h.fullDraw || 'no PB data'})`);
                        if (dpOccurrences.length > 0) {
                            occurrences.push(`${dpOccurrences.length} Double Play: ${dpOccurrences.join('; ')}`);
                        }
                    }
                    
                    const totalOccurrences = comboHistory.powerballCount + comboHistory.doublePlayCount;
                    const occurrenceText = totalOccurrences === 1 ? 'time' : 'times';
                    historyText = `Appeared ${totalOccurrences} ${occurrenceText} (${occurrences.join('; ')})`;
                }
                
                // Calculate stats for this combination
                const sum = combo.reduce((a, b) => a + b, 0);
                const highCount = combo.filter(n => n >= 35).length;
                const lowCount = 5 - highCount;
                const oddCount = combo.filter(n => n % 2 !== 0).length;
                const evenCount = 5 - oddCount;
                
                html += `
                    <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <div style="font-size: 1.2em; font-weight: bold; color: #2c3e50;">
                                ${combo.join('-')}
                            </div>
                            <div style="font-size: 0.9em; color: #7f8c8d;">
                                Sum: <strong>${sum}</strong>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #555;">
                            <div>High/Low: <strong>${highCount}/${lowCount}</strong></div>
                            <div>Odd/Even: <strong>${oddCount}/${evenCount}</strong></div>
                        </div>
                        <div style="font-size: 0.9em; padding: 8px; border-radius: 4px; 
                            background-color: ${comboHistory.appeared ? '#f8f3d4' : '#d4edda'}; 
                            color: ${comboHistory.appeared ? '#856404' : '#155724'}; 
                            margin-top: 8px; border-left: 3px solid ${comboHistory.appeared ? '#ffc107' : '#28a745'};">
                            ${comboHistory.appeared ? 
                                `⚠️ ${historyText}` : 
                                '✅ New combination (never appeared before)'}
                            ${comboHistory.appeared ? 
                                `<div style="margin-top: 5px; font-size: 0.85em;">
                                    <strong>Numbers:</strong> ${comboHistory.history[0].numbers.join('-')}
                                </div>` : ''}
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
            
            // Add a message if we couldn't generate enough unique combinations
            if (generatedCombos.size < 3) {
                html += `<div style="margin-top: 15px; color: #e74c3c; font-weight: bold;">
                    Note: Only ${generatedCombos.size} unique combinations could be generated from the available numbers.
                </div>`;
            }
            
            container.innerHTML = html;
        }
        
        // Initial analysis with the most recent month
        if (months.length > 0) {
            analyzeMonth(months[0]);
        }
        
        // Add event listeners
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                const monthSelect = document.getElementById('month-select');
                if (monthSelect) {
                    analyzeMonth(monthSelect.value);
                }
            });
        }
        
        // Add regenerate button handler
        const regenerateBtn = document.createElement('button');
        regenerateBtn.textContent = 'Generate New Combinations';
        regenerateBtn.style.margin = '15px 0';
        regenerateBtn.style.padding = '8px 16px';
        regenerateBtn.style.background = '#27ae60';
        regenerateBtn.style.color = 'white';
        regenerateBtn.style.border = 'none';
        regenerateBtn.style.borderRadius = '4px';
        regenerateBtn.style.cursor = 'pointer';
        regenerateBtn.onclick = () => {
            const monthSelect = document.getElementById('month-select');
            const monthKey = monthSelect.value;
            const monthlyDraws = drawsByMonth[monthKey] || [];
            const allNumbers = [];
            monthlyDraws.forEach(draw => {
                allNumbers.push(...draw.mainArr.map(n => parseInt(n, 10)));
            });
            const uniqueNumbers = [...new Set(allNumbers)];
            
            // Show loading state
            const container = document.getElementById('trio2-cards-container');
            if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 20px;">Generating new combinations...</div>';
                // Small delay to allow UI to update before heavy computation
                setTimeout(() => {
                    generateRandomCombinations(uniqueNumbers, monthKey);
                }, 50);
            } else {
                generateRandomCombinations(uniqueNumbers, monthKey);
            }
        };
        
        const monthlyStats = document.getElementById('monthly-stats');
        if (monthlyStats) {
            monthlyStats.after(regenerateBtn);
        }
    }

    // Add a function to initialize the Trio 2 tab after data is loaded
    function initializeTrio2Tab() {
        console.log('Initializing Trio 2 tab with', window.filteredDrawRows ? window.filteredDrawRows.length : 0, 'draws');
        if (window.filteredDrawRows && window.filteredDrawRows.length > 0) {
            renderTrio2Tab();
        }
    }

    // Load the data
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
                    // Store all draws for the Trio 2 tab
                    const allDraws = [];
                    // Store recent draws for other tabs
                    const recentDraws = [];
                    // Store draw rows for highlighting and filtering
                    const drawRows = [];
                    
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
                            // Add to all draws
                            allDraws.push(drawObj);
                            // Filter draws from 2016 to 2025
                            const dateStr = drawObj.date || '';
                            const parts = dateStr.split('/');
                            const year = parts.length === 3 ? parseInt(parts[2], 10) : 0;
                            if (year >= 2016 && year <= 2025) {
                                recentDraws.push(drawObj);
                            }
                        }
                    }
                    // Store all draws and recent draws
                    window.allDraws = allDraws;
                    window.filteredDrawRows = recentDraws; // Keep recent draws for other tabs
                    console.log('Loaded draws - All:', allDraws.length, 'Recent:', recentDraws.length);
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
                        
                        // Create balls from 1 to 69
                        for (let n = 1; n <= 69; n++) {
                            const ball = document.createElement('div');
                            ball.className = 'ball';
                            ball.textContent = n;
                            
                            // Add click handler
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
                    // Function to calculate last digit counts for a draw
                    function getLastDigitCounts(mainArr) {
                        const digitCounts = Array(10).fill(0);
                        // Count last digits of the 5 main numbers
                        mainArr.forEach(num => {
                            const lastDigit = num % 10;
                            digitCounts[lastDigit]++;
                        });
                        return digitCounts;
                    }

                    // Moved to global scope
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
                                        ? `<span style='display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:30px;height:30px;line-height:1;text-align:center;font-size:1em;font-weight:bold;margin:0 1px;padding:0;flex-shrink:0;'>${num}</span>${idx < draw.mainArr.length-1 ? '<span style="color:#000;margin:0 2px;flex-shrink:0;">-</span>' : ''}`
                                        : `<span class='plain-number' style='display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;margin:0 1px;padding:0;flex-shrink:0;'>${num}</span>${idx < draw.mainArr.length-1 ? '<span style="color:#000;margin:0 2px;flex-shrink:0;">-</span>' : ''}`
                                    ).join("");
                                    html += `<tr><td style="white-space:nowrap;">${draw.date}</td><td>Main</td><td style="white-space:nowrap;overflow-x:auto;"><div style="display:flex;align-items:center;white-space:nowrap;">${balls}</div></td><td style="white-space:nowrap;"><span class='yellow-ball'>${draw.powerball || ''}</span></td></tr>`;
                                }
                            }
                            
                            // Double Play draw
                            if (draw.doublePlayArr && draw.doublePlayArr.length === 5) {
                                const matchArr = draw.doublePlayArr.filter(num => selectedSet.has(Number(num)));
                                if (matchArr.length > 0) {
                                    const balls = draw.doublePlayArr.map((num, idx) => selectedSet.has(Number(num))
                                        ? `<span style='display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(120deg,#e74c3c 60%,#ffb3b3 100%);color:#fff;border-radius:50%;width:30px;height:30px;line-height:1;text-align:center;font-size:1em;font-weight:bold;margin:0 1px;padding:0;flex-shrink:0;'>${num}</span>${idx < draw.doublePlayArr.length-1 ? '<span style="color:#000;margin:0 2px;flex-shrink:0;">-</span>' : ''}`
                                        : `<span class='plain-number' style='display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;margin:0 1px;padding:0;flex-shrink:0;'>${num}</span>${idx < draw.doublePlayArr.length-1 ? '<span style="color:#000;margin:0 2px;flex-shrink:0;">-</span>' : ''}`
                                    ).join("");
                                    html += `<tr><td style="white-space:nowrap;">${draw.date}</td><td>Double Play</td><td style="white-space:nowrap;overflow-x:auto;"><div style="display:flex;align-items:center;white-space:nowrap;">${balls}</div></td><td style="white-space:nowrap;"><span class='yellow-ball'>${draw.doublePlayPowerball || ''}</span></td></tr>`;
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
                            
                            // Initialize specific tabs when selected
                            if (tabId === 'ending-digits') {
                                renderEndingDigitsBallPanel();
                            }
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
            
            // Initialize the Trio tab after all data is loaded
            initializeTrioTab();
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
            whiteBalls.map(n => `<span class='generated-ball' style='font-weight: bold;'>${n}</span>`).join('') +
            `<span class='generated-ball red' style='font-weight: bold;'>${redBall}</span>`;
    };
    genSingleBtn.onclick = function() {
        const n = getRandomInt(1, 69);
        genResult.innerHTML = `<span class='generated-ball' style='font-weight: bold;'>${n}</span>`;
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
    
    function processNumberSet(numbers, drawDate, isDoublePlay = false) {
        if (!numbers || numbers.length < comboSize) return;
        
        const combinations = generateCombinations([...numbers].sort((a, b) => a - b), comboSize);
        const dateSuffix = isDoublePlay ? ' (Double Play)' : '';
        
        combinations.forEach(combo => {
            const key = combo.join(',');
            const existing = comboMap.get(key) || { count: 0, dates: [] };
            comboMap.set(key, {
                count: existing.count + 1,
                dates: [...existing.dates, drawDate + dateSuffix].sort().reverse()
            });
            
            // Debug: Log specific combination we're looking for
            if (key === '40,41,64,65' || key === '40,41,64,65,66' || key === '40,41,64,65,67') {
                console.log(`[DEBUG] Found combination ${key} in ${isDoublePlay ? 'Double Play ' : ''}draw on ${drawDate}:`, numbers);
            }
        });
    }
    
    draws.forEach(draw => {
        // Process main numbers
        processNumberSet(draw.mainArr, draw.date, false);
        
        // Process Double Play numbers if available
        if (draw.doublePlayArr && draw.doublePlayArr.length >= comboSize) {
            processNumberSet(draw.doublePlayArr, draw.date, true);
        }
    });
    
    // Debug: Log all combinations that include 40,41,64,65
    comboMap.forEach((value, key) => {
        if (key.includes('40,41,64,65') || key === '40,41,64,65') {
            console.log(`[DEBUG] Combo ${key} appears ${value.count} times on dates:`, value.dates);
        }
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
    // For the main tables, show only combos that appear at least twice
    const filteredFiveNumberResults = fiveNumberResults.filter(combo => combo.count >= 2);
    
    let html = `
        <div style="margin-top: 20px;">
            ${generateComboTable(fourNumberResults, '4-Number Combinations')}
            ${generateComboTable(filteredFiveNumberResults, '5-Number Combinations')}
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
    
    // Filter valid draws (only main numbers, no Powerball)
    const validDraws = window.filteredDrawRows.filter(draw => {
        return draw && Array.isArray(draw.mainArr) && draw.mainArr.length === 5;
    });
    
    // Count 4-number and 5-number combinations with dates
    const fourNumberCombos = countPowerballCombinations(validDraws, 4);
    const fiveNumberCombos = countPowerballCombinations(validDraws, 5);
    
    // Process and filter combinations
    const processCombos = (comboMap, comboSize, minCount = 1) => {
        const combos = [];
        comboMap.forEach((comboData, comboStr) => {
            // Include all combinations that meet the minimum count
            if (comboData.count >= minCount) {
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
    
    // Only show combos that appear at least twice in both tables
    const fourNumberResults = processCombos(fourNumberCombos, 4, 2);
    const fiveNumberResults = processCombos(fiveNumberCombos, 5, 2);
    
    // Store fiveNumberCombos in a variable accessible to the click handler
    const fiveNumberCombosLocal = fiveNumberCombos;
    
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
            
            // Add hover effect to row
            const highlightRow = () => {
                row.style.backgroundColor = '#f0f7ff';
                countCell.style.color = '#1a73e8';
            };
            
            const unhighlightRow = () => {
                row.style.backgroundColor = '';
                countCell.style.color = '#3498db';
            };
            
            // Add click event listeners
            countCell.addEventListener('mouseenter', highlightRow);
            row.addEventListener('mouseenter', highlightRow);
            
            countCell.addEventListener('mouseleave', unhighlightRow);
            row.addEventListener('mouseleave', unhighlightRow);
            
            // Add click event listener to show details
            countCell.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFrequencyClick();
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
            
            // Count cell properties are already set above
            
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
                
                // Handle click on frequency count
                const handleFrequencyClick = () => {
                    if (!fiveNumberCombosLocal || fiveNumberCombosLocal.size === 0) {
                        console.error('No five-number combinations available');
                        return;
                    }
                    
                    // Process the combinations - include all 5-number combos, even if they only appear once
                    const fiveNumberResults = processCombos(fiveNumberCombosLocal, 5, 1);
                    
                    // Debug: Log available 5-number combinations
                    console.log('[DEBUG] Available 5-number combinations:', fiveNumberResults.map(c => ({
                        numbers: c.numbers.join(','),
                        count: c.count,
                        dates: c.dates.length
                    })));
                    
                    // Find all 5-number combos that include this 4-number combo
                    const matchingCombos = fiveNumberResults.filter(fiveCombo => {
                        const allIncluded = combo.numbers.every(num => fiveCombo.numbers.includes(num));
                        if (allIncluded) {
                            console.log('[DEBUG] Found match:', {
                                fourNumbers: combo.numbers.join(','),
                                fiveNumbers: fiveCombo.numbers.join(','),
                                count: fiveCombo.count,
                                dates: fiveCombo.dates
                            });
                        }
                        return allIncluded;
                    });
                    
                    console.log(`[DEBUG] Found ${matchingCombos.length} matching 5-number combos for ${combo.numbers.join(', ')}`);
                    
                    // Update the right panel with the details
                    const detailsPanel = document.getElementById('combo45-details-content');
                    if (!detailsPanel) {
                        console.error('Could not find combo45-details-content element');
                        return;
                    }
                    
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
            
            // Process combinations for both Main and DP separately
            const processDraw = (draw, numbers, type, powerball) => {
                if (!numbers || numbers.length < 2) return;
                
                const drawInfo = {
                    date: draw.date,
                    type: type,
                    numbers: [...numbers],
                    powerball: powerball
                };
                
                // Process all combination sizes (2-5)
                for (let size = 2; size <= Math.min(5, numbers.length); size++) {
                    const combos = generateCombinations(selected, size);
                    combos.forEach(combo => {
                        if (combo.every(num => numbers.includes(num))) {
                            const key = combo.sort((a, b) => a - b).join(',');
                            if (!combinations[size][key]) {
                                combinations[size][key] = { count: 0, dates: [] };
                            }
                            combinations[size][key].count++;
                            if (combinations[size][key].dates.length < 5) {
                                combinations[size][key].dates.push(drawInfo);
                            }
                        }
                    });
                }
            };
            
            // Count occurrences in draw data
            window.filteredDrawRows.forEach(draw => {
                // Process Main draw
                if (draw.mainArr && draw.mainArr.length >= 2) {
                    processDraw(draw, draw.mainArr, 'Main', draw.powerball);
                    
                    // Count individual numbers in Main draw
                    selected.forEach(num => {
                        if (draw.mainArr.includes(num)) {
                            freq[num].count++;
                            if (freq[num].dates.length < 5) {
                                freq[num].dates.push({
                                    date: draw.date,
                                    type: 'Main',
                                    drawType: 'main',
                                    numbers: [...draw.mainArr],
                                    powerball: draw.powerball
                                });
                            }
                        }
                    });
                }
                
                // Process Double Play draw if it exists
                if (draw.doublePlayArr && draw.doublePlayArr.length >= 2) {
                    processDraw(draw, draw.doublePlayArr, 'DP', draw.doublePlayPowerball);
                    
                    // Count individual numbers in Double Play draw
                    selected.forEach(num => {
                        if (draw.doublePlayArr.includes(num)) {
                            freq[num].count++;
                            if (freq[num].dates.length < 5) {
                                freq[num].dates.push({
                                    date: draw.date,
                                    type: 'DP',
                                    drawType: 'dp',
                                    numbers: [...draw.doublePlayArr],
                                    powerball: draw.doublePlayPowerball
                                });
                            }
                        }
                    });
                }
            });
            
            // Generate results HTML with improved styling
            let html = `
                <div style="margin: 20px 0; font-family: Arial, sans-serif;">
                    <style>
                        /* Ball styling for all result tables */
                        #combo-results .ball, #combo2-results .ball, #combo3-results .ball, #combo4-results .ball, #combo5-results .ball,
                        #combo-results .ball span, #combo2-results .ball span, #combo3-results .ball span, #combo4-results .ball span, #combo5-results .ball span,
                        #results-container .ball, #results-container .ball span,
                        #twox-results .ball, #twox-results .ball span, .ball.number-cell {
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            width: 36px !important;
                            height: 36px !important;
                            min-width: 36px !important;
                            min-height: 36px !important;
                            border-radius: 50% !important;
                            background: #e74c3c !important;
                            color: white !important;
                            font-weight: bold !important;
                            margin: 2px !important;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                            border: none !important;
                            padding: 0 !important;
                            font-size: 16px !important;
                            line-height: 1 !important;
                        }
                        .badge {
                            display: inline-block;
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            margin-left: 6px;
                        }
                        .badge-main {
                            background: #e3f2fd;
                            color: #1565c0;
                        }
                        .badge-dp {
                            background: #fff3e0;
                            color: #e65100;
                        }
                        .results-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0 30px;
                            background: #fff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                        .results-table th {
                            background: #f8f9fa;
                            padding: 12px;
                            text-align: left;
                            font-weight: 600;
                            color: #2c3e50;
                            border-bottom: 2px solid #e9ecef;
                        }
                        .results-table td {
                            padding: 12px;
                            border-bottom: 1px solid #f0f0f0;
                            vertical-align: middle;
                        }
                        .results-table tr:last-child td {
                            border-bottom: none;
                        }
                        .draw-entry {
                            display: flex;
                            align-items: center;
                            margin: 4px 0;
                            padding: 6px 0;
                            border-bottom: 1px solid #f5f5f5;
                        }
                        .draw-entry:last-child {
                            border-bottom: none;
                        }
                    </style>
            `;
            
            // Show individual numbers
            if (selected.length > 0) {
                html += `
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">
                        <i class="fas fa-chart-bar" style="margin-right: 8px;"></i>Individual Number Frequencies
                    </h3>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th style="width: 100px; text-align: center;">Number</th>
                                <th style="width: 120px; text-align: center;">Frequency</th>
                                <th>Last 5 Draws</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                // Sort by frequency (descending)
                const sorted = Object.entries(freq).sort((a, b) => b[1].count - a[1].count);
                
                if (sorted.length === 0) {
                    html += `
                        <tr>
                            <td colspan="3" style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
                                No draw history found for the selected numbers.
                            </td>
                        </tr>
                    `;
                } else {
                    sorted.forEach(([num, data]) => {
                        const datesHtml = data.dates.length > 0 
                            ? data.dates.map(d => `
                                <div class="draw-entry">
                                    <span style="font-weight: 500; color: #2c3e50;">${d.date}</span>
                                    <span class="badge ${d.type === 'Main' ? 'badge-main' : 'badge-dp'}">
                                        ${d.type}
                                    </span>
                                </div>
                            `).join('')
                            : '<div style="color: #95a5a6; font-style: italic;">No draw history</div>';
                        
                        html += `
                            <tr>
                                <td style="text-align: center;">
                                    <div class="ball">${num}</div>
                                </td>
                                <td style="text-align: center; font-weight: 600; color: #2c3e50;">
                                    ${data.count} ${data.count === 1 ? 'time' : 'times'}
                                </td>
                                <td style="padding: 8px 12px;">
                                    ${datesHtml}
                                </td>
                            </tr>
                        `;
                    });
                }
                
                html += `
                        </tbody>
                    </table>
                `;
            }
            
            // Show combinations
            for (let size = 2; size <= Math.min(5, selected.length); size++) {
                const comboData = combinations[size];
                const comboKeys = Object.keys(comboData);
                
                if (comboKeys.length > 0) {
                    html += `
                        <h3 style="color: #2c3e50; margin: 25px 0 15px 0; font-size: 18px;">
                            <i class="fas fa-link" style="margin-right: 8px;"></i>${size}-Number Combinations
                        </h3>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th style="width: 150px; text-align: center;">Numbers</th>
                                    <th style="width: 120px; text-align: center;">Frequency</th>
                                    <th>Last 5 Draws</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    // Sort combinations by frequency (descending)
                    const sortedCombos = comboKeys.sort((a, b) => comboData[b].count - comboData[a].count);
                    
                    sortedCombos.forEach(key => {
                        const data = comboData[key];
                        const numbers = key.split(',');
                        const datesHtml = data.dates.length > 0 
                            ? data.dates.map(d => `
                                <div class="draw-entry">
                                    <span style="font-weight: 500; color: #2c3e50;">${d.date}</span>
                                    <span class="badge ${d.type === 'Main' ? 'badge-main' : 'badge-dp'}">
                                        ${d.type}
                                    </span>
                                </div>
                            `).join('')
                            : '<div style="color: #95a5a6; font-style: italic;">No draw history</div>';
                        
                        html += `
                            <tr>
                                <td style="text-align: center;">
                                    <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 4px;">
                                        ${numbers.map(n => 
                                            `<div class="ball" style="width: 36px; height: 36px; font-size: 16px; background: #e74c3c !important; color: white !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; margin: 2px !important; line-height: 1 !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; border: none !important;">${n}</div>`
                                        ).join('')}
                                    </div>
                                </td>
                                <td style="text-align: center; font-weight: 600; color: #2c3e50;">
                                    ${data.count} ${data.count === 1 ? 'time' : 'times'}
                                </td>
                                <td style="padding: 8px 12px;">
                                    ${datesHtml}
                                </td>
                            </tr>
                        `;
                    });
                    
                    html += `
                            </tbody>
                        </table>
                    `;
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

// --- ENDING DIGITS TAB FUNCTIONALITY ---

// Track selected ending digits
let selectedEndingDigits = [];

// Render the ball panel for the Ending Digits tab
function renderEndingDigitsBallPanel() {
    console.log('Rendering ending digits ball panel...');
    const ballPanel = document.getElementById('ending-digits-ball-panel');
    if (!ballPanel) {
        console.error('Could not find ending-digits-ball-panel element');
        return;
    }
    
    // Clear existing balls
    ballPanel.innerHTML = '';
    
    // Create balls for digits 0-9
    for (let i = 0; i <= 9; i++) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.textContent = i;
        ball.dataset.digit = i;
        
        // Check if this digit is already selected and set the initial state
        if (selectedEndingDigits.includes(i)) {
            ball.classList.add('selected');
        }
        
        console.log(`Creating ball for digit ${i}`, { isSelected: ball.classList.contains('selected') });
        
        ball.addEventListener('click', function(e) {
            const clickedDigit = parseInt(this.dataset.digit, 10);
            console.log('Ball clicked:', clickedDigit, e);
            toggleEndingDigitSelection(clickedDigit, ball);
        });
        
        ballPanel.appendChild(ball);
    }
    
    // Add event listeners for clear and search buttons
    const clearBtn = document.getElementById('ending-digits-clear-btn');
    const searchBtn = document.getElementById('ending-digits-search-btn');
    const searchInput = document.getElementById('ending-digits-search');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearEndingDigitsSelection);
    }
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', searchEndingDigits);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchEndingDigits();
        });
    }
}
    
function toggleEndingDigitSelection(digit, element) {
    console.log('toggleEndingDigitSelection called with:', {digit, element});
    
    // Create a copy of the current selection to avoid reference issues
    const newSelectedDigits = [...selectedEndingDigits];
    const index = newSelectedDigits.indexOf(digit);
    
    // Toggle the digit in the array
    if (index === -1) {
        // Add the digit if not already selected
        newSelectedDigits.push(digit);
        console.log('Selection state toggled: selected');
    } else {
        // Remove the digit if already selected
        newSelectedDigits.splice(index, 1);
        console.log('Selection state toggled: unselected');
    }
    
    // Update the global array
    selectedEndingDigits = newSelectedDigits;
    console.log('Updated selectedEndingDigits:', selectedEndingDigits);
    
    // Update the display of selected digits
    updateEndingDigitsSelectedDisplay();
    
    // Trigger results update if we have selections
    if (selectedEndingDigits.length > 0) {
        renderEndingDigitsResults();
    } else {
        // Clear results if no digits are selected
        const resultsDiv = document.getElementById('ending-digits-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    <p>Select ending digits (0-9) to see matching number combinations and their frequencies.</p>
                </div>`;
        }
    }
}

// Clear all selected ending digits
function clearEndingDigitsSelection() {
    selectedEndingDigits = [];
    
    document.querySelectorAll('#ending-digits-ball-panel .ball').forEach(ball => {
        ball.classList.remove('selected');
    });
    
    updateEndingDigitsSelectedDisplay();
    
    const resultsDiv = document.getElementById('ending-digits-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <p>Select ending digits (0-9) to see matching number combinations and their frequencies.</p>
            </div>`;
    }
}

// Update the selected digits display
function updateEndingDigitsSelectedDisplay() {
    const selectedDiv = document.getElementById('ending-digits-selected');
    if (!selectedDiv) {
        console.error('Could not find ending-digits-selected element');
        return;
    }
    
    console.log('Updating selected digits display. Current selection:', selectedEndingDigits);
    
    if (selectedEndingDigits.length === 0) {
        selectedDiv.innerHTML = '<span style="color: #777; font-style: italic;">No digits selected</span>';
        return;
    }
    
    // Group digits by value and count occurrences
    const digitCounts = {};
    selectedEndingDigits.forEach(digit => {
        digitCounts[digit] = (digitCounts[digit] || 0) + 1;
    });
    
    // Create badge elements with count if more than one
    selectedDiv.innerHTML = Object.entries(digitCounts)
        .sort(([a], [b]) => a - b)
        .map(([digit, count]) => {
            const countBadge = count > 1 ? `<span class="digit-count">×${count}</span>` : '';
            return `
                <div class="selected-digit-container">
                    <span class="ending-digit-badge">${digit}${countBadge}</span>
                </div>`;
        })
        .join('');
    
    // Update the visual state of the balls to match the selection
    document.querySelectorAll('#ending-digits-ball-panel .ball').forEach(ball => {
        const digit = parseInt(ball.dataset.digit, 10);
        const isSelected = selectedEndingDigits.includes(digit);
        ball.classList.toggle('selected', isSelected);
    });
}

// Search for specific digit combinations
function searchEndingDigits() {
    const searchInput = document.getElementById('ending-digits-search');
    if (!searchInput) return;
    
    // Only clear if there's search input
    if (searchInput.value.trim() !== '') {
        // Clear current selection if we're doing a search
        clearEndingDigitsSelection();
    } else {
        // If search is empty, just update the display with current selection
        updateEndingDigitsSelectedDisplay();
        return;
    }
    
    // Parse search input (e.g., "1 3 5" -> [1, 3, 5])
    const searchDigits = searchInput.value
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter(n => !isNaN(n) && n >= 0 && n <= 9)
        .slice(0, 5); // Limit to 5 digits
    
    if (searchDigits.length === 0) {
        alert('Please enter valid digits (0-9) separated by spaces.');
        return;
    }
    
    // Select the digits in the UI
    searchDigits.forEach(digit => {
        const ball = document.querySelector(`#ending-digits-ball-panel .ball[data-digit="${digit}"]`);
        if (ball) {
            selectedEndingDigits.push(digit);
            ball.classList.add('selected');
        }
    });
    
    updateEndingDigitsSelectedDisplay();
    
    if (selectedEndingDigits.length > 0) {
        renderEndingDigitsResults();
    }
}

// Render the results for selected ending digits
function renderEndingDigitsResults() {
    const resultsDiv = document.getElementById('ending-digits-results');
    
    // Validate inputs and show appropriate messages
    if (!resultsDiv) {
        console.error('Results container not found');
        return;
    }
    
    if (!window.filteredDrawRows || !Array.isArray(window.filteredDrawRows)) {
        resultsDiv.innerHTML = `
            <div style="color:#e74c3c; margin:18px 0; padding: 15px; background: #fff5f5; border: 1px solid #ffd6d6; border-radius: 4px;">
                <p>No draw data available. Please try refreshing the page or check your data source.</p>
            </div>`;
        return;
    }
    
    // Check if we have any digits selected
    if (selectedEndingDigits.length === 0) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <p>Select ending digits (0-9) to see matching number combinations and their frequencies.</p>
            </div>`;
        return;
    }
    
    if (window.filteredDrawRows.length === 0) {
        resultsDiv.innerHTML = `
            <div style="color:#666; margin:18px 0; padding: 15px; text-align: center;">
                <p>No draw data found. Please check your filters or data source.</p>
            </div>`;
        return;
    }
    
    // Show loading state with animation
    const loadingHtml = `
        <div style="text-align: center; padding: 30px 20px;">
            <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 15px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: #666; margin: 10px 0 0;">Analyzing draw data...</p>
            <p style="color: #999; font-size: 0.9em; margin: 5px 0 0;">Processing ${window.filteredDrawRows.length} draws</p>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>`;
    resultsDiv.innerHTML = loadingHtml;
    
    // Process the data in chunks to prevent UI freeze
    const CHUNK_SIZE = 1000; // Process 1000 records at a time
    const totalDraws = window.filteredDrawRows.length;
    let processed = 0;
    const digitPatterns = new Map();
    
    // Convert selected digits to numbers for comparison
    const selectedDigits = selectedEndingDigits.map(Number);
    
    function processChunk(startIndex) {
        const endIndex = Math.min(startIndex + CHUNK_SIZE, totalDraws);
        
        // Process a chunk of data
        for (let i = startIndex; i < endIndex; i++) {
            const draw = window.filteredDrawRows[i];
            
            // Skip invalid draws quickly
            if (!draw || !draw.mainArr || !Array.isArray(draw.mainArr) || draw.mainArr.length !== 5) {
                continue;
            }
            
            // Get last digits of the current draw
            const lastDigits = [];
            for (let j = 0; j < 5; j++) {
                lastDigits.push(draw.mainArr[j] % 10);
            }
            lastDigits.sort((a, b) => a - b);
            
            // Check if any of the selected digits are in this draw's last digits
            const hasSelectedDigit = selectedDigits.some(digit => 
                lastDigits.includes(digit)
            );
            
            // Skip this draw if it doesn't contain any of the selected digits
            if (!hasSelectedDigit) {
                continue; // Continue to next draw
            }
            
            // Create a pattern key that only includes the selected digits that appear in this draw
            const patternDigits = lastDigits.filter(digit => 
                selectedDigits.includes(digit)
            );
            
            if (patternDigits.length === 0) continue; // Skip if no matching digits (shouldn't happen due to hasSelectedDigit check)
            
            const patternKey = patternDigits.join(',');
            
            // Update pattern data
            let pattern = digitPatterns.get(patternKey);
            if (!pattern) {
                pattern = {
                    digits: lastDigits,
                    count: 0,
                    dates: []
                };
                digitPatterns.set(patternKey, pattern);
            }
            
            pattern.count++;
            
            // Only store dates for the first 50 occurrences to prevent memory issues
            if (pattern.dates.length < 50) {
                // Debug: Log the draw object to inspect its structure
                if (pattern.dates.length === 0) { // Only log for the first item to avoid console spam
                    console.log('Draw object structure:', draw);
                    console.log('Available properties:', Object.keys(draw));
                    console.log('Draw object content:', JSON.stringify(draw, null, 2));
                }
                
                // Get the date from the draw object
                const dateValue = draw.date || 'Unknown Date';
                
                pattern.dates.push({
                    date: dateValue,
                    numbers: draw.mainArr.slice(),
                    powerball: draw.powerball
                });
            }
        }
        
        processed = endIndex;
        
        // Update progress
        if (startIndex === 0) {
            const progressDiv = document.createElement('div');
            progressDiv.id = 'ending-digits-progress';
            progressDiv.style.textAlign = 'center';
            progressDiv.style.padding = '10px';
            progressDiv.style.fontSize = '0.9em';
            progressDiv.style.color = '#666';
            resultsDiv.appendChild(progressDiv);
        }
        
        const progressDiv = document.getElementById('ending-digits-progress');
        if (progressDiv) {
            const percent = Math.round((processed / totalDraws) * 100);
            progressDiv.textContent = `Processing... ${percent}% (${processed} of ${totalDraws} draws)`;
        }
        
        // Process the next chunk or finish
        if (processed < totalDraws) {
            // Use setTimeout to allow the UI to update between chunks
            setTimeout(() => processChunk(processed), 0);
        } else {
            // Processing complete, display results
            displayResults();
        }
    }
    
    function displayResults() {
        // Convert the patterns map to an array and sort by frequency (descending)
        const patternsArray = Array.from(digitPatterns.entries())
            .map(([key, value]) => ({
                pattern: key,
                digits: value.digits,
                count: value.count,
                dates: value.dates
            }))
            .sort((a, b) => b.count - a.count);
        
        if (patternsArray.length === 0) {
            resultsDiv.innerHTML = `
                <div style="color:#666; margin:18px 0; padding: 15px; text-align: center;">
                    <p>No matching patterns found for the selected digits.</p>
                </div>`;
            return;
        }
        
        // Generate HTML for each pattern
        const patternsHtml = patternsArray.map((pattern, index) => {
            const lastDraw = pattern.dates.length > 0 ? pattern.dates[0] : null;
            const lastDrawHtml = lastDraw 
                ? `Last seen: ${lastDraw.date} (${lastDraw.numbers.join(', ')} - ${lastDraw.powerball})`
                : 'No recent draws found';
                
            return `
                <div class="pattern-result" style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 6px; border-left: 4px solid #3498db;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; color: #2c3e50;">
                            Pattern: ${pattern.pattern.split(',').map(d => 
                                `<span class="digit-badge" style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background: #3498db; color: white; border-radius: 50%; margin-right: 5px;">${d}</span>`
                            ).join('')}
                        </h3>
                        <span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.9em;">
                            ${pattern.count} ${pattern.count === 1 ? 'time' : 'times'}
                        </span>
                    </div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">
                        ${lastDrawHtml}
                    </div>
                </div>`;
        }).join('');
        
        // Update the results container
        resultsDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                    Results for digits: ${selectedDigits.join(', ')}
                </h2>
                <div style="color: #7f8c8d; margin-bottom: 20px;">
                    Found ${patternsArray.length} unique pattern(s) across ${totalDraws} draws
                </div>
                <div id="patterns-container">
                    ${patternsHtml}
                </div>
            </div>`;
    }
    
    // Start processing
    processChunk(0);
}

// Toggle pattern details visibility
function togglePatternDetails(index) {
    const content = document.getElementById(`pattern-${index}-content`);
    const icon = document.getElementById(`pattern-${index}-icon`);
    const item = document.getElementById(`pattern-${index}`);
    
    if (content && icon && item) {
        const isExpanded = item.classList.toggle('expanded');
        content.style.display = isExpanded ? 'block' : 'none';
        icon.className = isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
}

// --- DRAW DIFFERENCES FUNCTIONALITY ---

// Function to analyze differences between consecutive Double Play draws
function analyzeDoublePlayDifferences() {
    const resultsDiv = document.getElementById('double-play-differences-results');
    const loadingDiv = document.getElementById('double-play-differences-loading');
    const statsDiv = document.getElementById('double-play-differences-stats');
    const statsContent = document.getElementById('double-play-differences-stats-content');
    
    // Show loading state
    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    statsDiv.style.display = 'none';
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            // Get all draws from the global draws array
            const allDraws = window.allDraws || [];
            const doublePlayDraws = [];
            
            // Process the draws array to extract Double Play data
            for (let i = 0; i < allDraws.length; i++) {
                const draw = allDraws[i];
                
                // Check if this draw has Double Play data
                if (draw && draw.doublePlayArr && Array.isArray(draw.doublePlayArr) && draw.doublePlayArr.length === 5) {
                    const numbers = draw.doublePlayArr.map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 69);
                    
                    if (numbers.length === 5) {
                        doublePlayDraws.push({
                            date: draw.date || '',
                            numbers: numbers,
                            powerball: draw.doublePlayPowerball ? parseInt(draw.doublePlayPowerball, 10) : null,
                            type: 'double',
                            displayDate: draw.date ? `${draw.date} (DP)` : 'Unknown Date (DP)',
                            displayNums: [...numbers].sort((a, b) => a - b)
                        });
                    }
                }
            }
            
            // Sort draws by date (newest first)
            const sortedDraws = [...doublePlayDraws].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            console.log(`Analyzing ${sortedDraws.length} Double Play draws`);
            if (sortedDraws.length < 2) {
                resultsDiv.innerHTML = `
                    <div class="error-message" style="color: #e74c3c; padding: 15px; background-color: #fde8e8; border-radius: 4px; text-align: center;">
                        <i class="fas fa-exclamation-triangle"></i> Not enough valid Double Play draw data available for analysis.
                        <p>Found ${sortedDraws.length} valid draws. At least 2 are needed.</p>
                        <p>Double Play data found: ${JSON.stringify(sortedDraws)}</p>
                    </div>
                `;
                loadingDiv.style.display = 'none';
                return;
            }
            
            // Use the sortedDraws variable that we already created
            console.log(`Analyzing ${sortedDraws.length} Double Play draws`);
            if (sortedDraws.length < 2) {
                resultsDiv.innerHTML = `
                    <div class="error-message" style="color: #e74c3c; padding: 15px; background-color: #fde8e8; border-radius: 4px; text-align: center;">
                        <i class="fas fa-exclamation-triangle"></i> Not enough valid Double Play draw data available for analysis.
                        <p>Found ${sortedDraws.length} valid draws. At least 2 are needed.</p>
                    </div>
                `;
                loadingDiv.style.display = 'none';
                return;
            }
            
            // Process draws to extract numbers and calculate differences
            const processedDraws = [];
            const allDifferences = [];
            const differenceStats = {
                totalComparisons: 0,
                maxDifference: 0,
                minDifference: 69, // Max possible difference between 1 and 69
                averageDifference: 0,
                differenceCounts: {},
                positionStats: Array(5).fill().map(() => ({
                    max: 0,
                    min: 69,
                    sum: 0,
                    count: 0,
                    differences: []
                }))
            };
            
            // Process each pair of consecutive draws
            for (let i = 0; i < sortedDraws.length - 1; i++) {
                const currentDraw = sortedDraws[i];
                const nextDraw = sortedDraws[i + 1];
                
                const currentNums = currentDraw.numbers || [];
                const nextNums = nextDraw.numbers || [];
                
                // Skip if either draw doesn't have exactly 5 numbers
                if (currentNums.length !== 5 || nextNums.length !== 5) {
                    console.log(`Skipping draw pair ${currentDraw.date} - ${nextDraw.date}: Invalid number count`);
                    continue;
                }
                
                // Calculate differences for each position
                const differences = [];
                let hasValidDifference = false;
                
                for (let j = 0; j < 5; j++) {
                    const diff = Math.abs(currentNums[j] - nextNums[j]);
                    differences.push(diff);
                    allDifferences.push(diff);
                    
                    // Update position stats
                    if (j < differenceStats.positionStats.length) {
                        const posStat = differenceStats.positionStats[j];
                        posStat.max = Math.max(posStat.max, diff);
                        posStat.min = Math.min(posStat.min, diff);
                        posStat.sum += diff;
                        posStat.count++;
                        posStat.differences.push(diff);
                    }
                    
                    // Update global stats
                    differenceStats.maxDifference = Math.max(differenceStats.maxDifference, diff);
                    differenceStats.minDifference = Math.min(differenceStats.minDifference, diff);
                    
                    // Update difference counts
                    differenceStats.differenceCounts[diff] = (differenceStats.differenceCounts[diff] || 0) + 1;
                    
                    hasValidDifference = true;
                }
                
                if (hasValidDifference) {
                    differenceStats.totalComparisons++;
                    
                    processedDraws.push({
                        currentDate: currentDraw.displayDate,
                        nextDate: nextDraw.displayDate,
                        currentNums: [...currentNums],
                        nextNums: [...nextNums],
                        differences: differences,
                        type: 'double'
                    });
                }
            }
            
            // Calculate average difference
            if (allDifferences.length > 0) {
                differenceStats.averageDifference = 
                    Math.round((allDifferences.reduce((a, b) => a + b, 0) / allDifferences.length) * 100) / 100;
                
                // Calculate average difference per position
                differenceStats.positionStats.forEach(posStat => {
                    if (posStat.count > 0) {
                        posStat.avg = Math.round((posStat.sum / posStat.count) * 100) / 100;
                    }
                });
            }
            
            console.log('Difference stats:', differenceStats);
            
            // Render results
            renderDoublePlayDifferencesResults(processedDraws, differenceStats);
            
        } catch (error) {
            console.error('Error analyzing draw differences:', error);
            const resultsDiv = document.getElementById('double-play-differences-results');
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div class="error-message" style="color: #e74c3c; padding: 15px; background-color: #fde8e8; border-radius: 4px;">
                        <i class="fas fa-exclamation-circle"></i> An error occurred while analyzing draw differences:
                        <pre style="white-space: pre-wrap; margin: 5px 0 0 0; font-family: monospace;">${error.message || 'Unknown error'}</pre>
                    </div>
                `;
            }
        } finally {
            loadingDiv.style.display = 'none';
        }
    }, 50);
}

// Function to render Double Play differences results
function renderDoublePlayDifferencesResults(processedDraws, stats) {
    const resultsDiv = document.getElementById('double-play-differences-results');
    const loadingDiv = document.getElementById('double-play-differences-loading');
    const statsDiv = document.getElementById('double-play-differences-stats');
    const statsContent = document.getElementById('double-play-differences-stats-content');
    
    if (!resultsDiv) return;
    
    // Clear previous results
    resultsDiv.innerHTML = '';
    
    if (processedDraws.length === 0) {
        resultsDiv.innerHTML = `
            <div style="color: #666; text-align: center; padding: 20px;">
                <p>No Double Play draw differences found for the selected criteria.</p>
            </div>
        `;
        loadingDiv.style.display = 'none';
        return;
    }
    
    // Generate HTML for the results
    let html = `
        <div class="results-summary" style="margin-bottom: 20px;">
            <p>Analyzed <strong>${processedDraws.length}</strong> consecutive Double Play draw pairs.</p>
        </div>
        <div style="overflow-x: auto;">
            <table class="difference-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Draw Date</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Numbers</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Next Draw</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Next Numbers</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Differences</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add rows for each draw pair
    processedDraws.forEach((draw, index) => {
        const isEven = index % 2 === 0;
        const rowStyle = isEven ? 'background-color: #f9f9f9;' : '';
        
        // Calculate signed differences and even/odd indicators
        const signedDiffs = [];
        const evenOddIndicators = [];
        
        for (let i = 0; i < 5; i++) {
            const currentNum = draw.currentNums[i];
            const nextNum = draw.nextNums[i];
            // Calculate as draw date - next draw (current - next)
            const diff = currentNum - nextNum;
            const absDiff = Math.abs(diff);
            const sign = diff > 0 ? '+' : ''; // Single + for positive, empty string for negative
            const isEven = absDiff % 2 === 0;
            
            signedDiffs.push({
                value: diff,
                display: sign + diff, // Keep the sign for display
                absValue: absDiff,
                isEven: isEven,
                currentNum: currentNum,
                nextNum: nextNum
            });
            
            evenOddIndicators.push(isEven ? 'E' : 'O');
        }
        
        // Create pattern keys for both number differences and sign patterns
        const numberPatternKey = signedDiffs.map(d => d.display).join(',');
        const signPattern = signedDiffs.map(d => d.value > 0 ? '+' : (d.value < 0 ? '-' : '0')).join('');
        
        // Track both number and sign patterns and collect matching dates
        const matchingDraws = [];
        const matchingDates = [];
        
        processedDraws.forEach(d => {
            // Check if number patterns match
            const dNumberPattern = d.currentNums.map((n, i) => {
                const dDiff = n - d.nextNums[i];
                return (dDiff > 0 ? '+' : '') + dDiff;
            }).join(',');
            
            // Check if sign patterns match
            const dSignPattern = d.currentNums.map((n, i) => {
                const dDiff = n - d.nextNums[i];
                return dDiff > 0 ? '+' : (dDiff < 0 ? '-' : '0');
            }).join('');
            
            if (dNumberPattern === numberPatternKey || dSignPattern === signPattern) {
                matchingDraws.push({
                    date: d.currentDate,
                    nextDate: d.nextDate,
                    signPattern: dSignPattern,
                    numberPattern: dNumberPattern
                });
                matchingDates.push(d.currentDate);
            }
        });
        
        const patternCount = matchingDraws.length;
        
        // Store pattern information for display
        draw.signPattern = signPattern;
        draw.matchingDates = matchingDates;
        draw.patternId = `pattern-${signPattern}-${index}`; // Unique ID for each pattern instance
        
        const patternHighlight = patternCount > 1 ? 'border-left: 4px solid #f39c12;' : '';
        
        html += `
            <tr style="${rowStyle} ${patternHighlight}">
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${draw.currentDate}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${draw.currentNums.map(n => 
                        `<span class="number-badge" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #9b59b6; color: white; border-radius: 50%; font-size: 14px; font-weight: bold; margin: 2px;">${n}</span>`
                    ).join(' ')}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${draw.nextDate}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${draw.nextNums.map(n => 
                        `<span class="number-badge" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #9b59b6; color: white; border-radius: 50%; font-size: 14px; font-weight: bold; margin: 2px;">${n}</span>`
                    ).join(' ')}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="margin-bottom: 4px; font-size: 15px; white-space: nowrap;">
                        ${signedDiffs.map(diff => {
                            const color = diff.value > 0 ? '#27ae60' : diff.value < 0 ? '#e74c3c' : '#7f8c8d';
                            return `<span class="difference-value" style="color: ${color}; font-weight: bold; margin-right: 12px;">${diff.display}</span>`;
                        }).join('')}
                    </div>
                    <div style="font-size: 0.9em; color: #7f8c8d; margin-top: 4px;">
                        ${evenOddIndicators.map(eo => 
                            `<span style="margin-right: 8px;">${eo}</span>`
                        ).join('')}
                    </div>
                    <div style="font-size: 0.85em; margin-top: 4px;">
                        <div style="color: #7f8c8d; font-family: monospace; margin-bottom: 2px;">
                            ${draw.signPattern}
                        </div>
                        ${patternCount > 1 ? `
                            <div id="${draw.patternId}" style="color: #f39c12; font-weight: bold; cursor: pointer; display: inline-block;">
                                Pattern appeared ${patternCount}x ▼
                            </div>
                            <div id="${draw.patternId}-dates" style="display: none; margin-top: 5px; padding: 5px; background: #f8f9fa; border-radius: 4px; font-size: 0.8em; color: #2c3e50;">
                                <div style="font-weight: bold; margin-bottom: 3px;">Appeared on dates:</div>
                                ${matchingDraws.map(d => 
                                    `<div>${d.date} → ${d.nextDate} (${d.signPattern})</div>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    // Add statistics section
    if (stats) {
        html += `
            <div id="double-play-differences-stats" style="margin-top: 30px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Difference Statistics</h3>
                <div id="double-play-differences-stats-content" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div class="stat-box" style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Overall Statistics</h4>
                        <p style="margin: 5px 0;"><strong>Total Comparisons:</strong> ${stats.totalComparisons || 0}</p>
                        <p style="margin: 5px 0;"><strong>Max Difference:</strong> ${stats.maxDifference || 0}</p>
                        <p style="margin: 5px 0;"><strong>Min Difference:</strong> ${stats.minDifference || 0}</p>
                        <p style="margin: 5px 0;"><strong>Avg Difference:</strong> ${stats.averageDifference ? stats.averageDifference.toFixed(2) : 0}</p>
                    </div>
        `;
        
        // Add position-specific statistics if available
        if (stats.positionStats && stats.positionStats.length > 0) {
            stats.positionStats.forEach((posStat, index) => {
                html += `
                    <div class="stat-box" style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Position ${index + 1}</h4>
                        <p style="margin: 5px 0;"><strong>Max:</strong> ${posStat.max || 0}</p>
                        <p style="margin: 5px 0;"><strong>Min:</strong> ${posStat.min || 0}</p>
                        <p style="margin: 5px 0;"><strong>Avg:</strong> ${posStat.avg ? posStat.avg.toFixed(2) : 0}</p>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Close the main container div
    html += `
            </div>
        </div>
    `;
    
    // Update the DOM
    resultsDiv.innerHTML = html;
    
    // Add click handlers for pattern toggles
    processedDraws.forEach((draw, index) => {
        if (draw.patternId) {
            const patternElement = document.getElementById(draw.patternId);
            if (patternElement) {
                patternElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const datesElement = document.getElementById(`${draw.patternId}-dates`);
                    if (datesElement) {
                        const isVisible = datesElement.style.display === 'block';
                        datesElement.style.display = isVisible ? 'none' : 'block';
                        patternElement.innerHTML = `Pattern appeared ${draw.matchingDates.length}x ${isVisible ? '▼' : '▲'}`;
                    }
                });
            }
        }
    });
    
    // Hide loading indicator
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
    
    // Show stats div if it exists
    if (statsDiv) {
        statsDiv.style.display = 'block';
    }
}

// Function to render Double Play differences statistics
function renderDoublePlayDifferencesStats(stats) {
    const statsDiv = document.getElementById('double-play-differences-stats');
    const statsContent = document.getElementById('double-play-differences-stats-content');
    
    if (!statsDiv || !statsContent) return;
    
    statsContent.innerHTML = '';
    
    // Overall statistics
    let html = `
        <div style="flex: 1; min-width: 300px; background: #f8f9fa; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Overall Statistics</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                <div>Total Comparisons:</div>
                <div><strong>${stats.totalComparisons}</strong></div>
                
                <div>Max Difference:</div>
                <div><strong>${stats.maxDifference}</strong></div>
                
                <div>Min Difference:</div>
                <div><strong>${stats.minDifference}</strong></div>
                
                <div>Avg Difference:</div>
                <div><strong>${stats.averageDifference.toFixed(2)}</strong></div>
            </div>
        </div>
        
        <div style="flex: 1; min-width: 300px; background: #f8f9fa; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Most Common Differences</h4>
            <div style="margin-top: 10px;">
    `;
    
    // Sort differences by frequency
    const sortedDifferences = Object.entries(stats.differenceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 most common differences
    
    if (sortedDifferences.length > 0) {
        sortedDifferences.forEach(([diff, count]) => {
            const percentage = ((count / (stats.totalComparisons * 5)) * 100).toFixed(1);
            html += `
                <div style="margin-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Difference of ${diff}:</span>
                        <span><strong>${count}</strong> (${percentage}%)</span>
                    </div>
                    <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: #3498db;"></div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p>No difference data available.</p>';
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Position statistics
    html += `
        <div style="flex: 1 100%; min-width: 300px; background: #f8f9fa; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 15px;">
            <h4 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Position Statistics</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e0e0e0;">Position</th>
                            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #e0e0e0;">Avg Diff</th>
                            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #e0e0e0;">Max</th>
                            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #e0e0e0;">Min</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    stats.positionStats.forEach((posStat, index) => {
        html += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">Position ${index + 1}</td>
                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #f0f0f0;">${posStat.avg ? posStat.avg.toFixed(2) : 'N/A'}</td>
                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #f0f0f0;">${posStat.max}</td>
                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #f0f0f0;">${posStat.min}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    statsContent.innerHTML = html;
    statsDiv.style.display = 'block';
}

// Function to export Double Play differences to CSV
function exportDoublePlayDifferencesToCSV() {
    try {
        // Get all draws from the global draws array
        const allDraws = window.allDraws || [];
        const doublePlayDraws = [];
        
        // Process the draws array to extract Double Play data
        for (let i = 0; i < allDraws.length; i++) {
            const draw = allDraws[i];
            
            // Skip if this is a Double Play row (it will be processed with the previous row)
            if (draw && draw['Winning Numbers '] && draw['Winning Numbers '].includes('Double Play® Numbers')) {
                continue;
            }
            
            // Check if the next row is a Double Play row
            if (i < allDraws.length - 1) {
                const nextDraw = allDraws[i + 1];
                if (nextDraw && nextDraw['Winning Numbers '] && nextDraw['Winning Numbers '].includes('Double Play® Numbers')) {
                    // Extract Double Play numbers from the next row
                    const dpNumbersMatch = nextDraw['Winning Numbers '].match(/Double Play® Numbers\s+([\d\s-]+)/);
                    
                    if (dpNumbersMatch && dpNumbersMatch[1]) {
                        const numbers = dpNumbersMatch[1].trim().split(/\s*-\s*/).map(num => parseInt(num, 10));
                        
                        if (numbers.length === 5 && numbers.every(n => !isNaN(n))) {
                            doublePlayDraws.push({
                                date: draw['Date '] ? draw['Date '].trim() : '',
                                numbers: [...numbers].sort((a, b) => a - b)
                            });
                        }
                    }
                }
            }
        }
        
        // Sort draws by date (newest first)
        doublePlayDraws.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (doublePlayDraws.length < 2) {
            alert('Not enough Double Play draw data available to export.');
            return;
        }
        
        // Prepare CSV content
        let csvContent = 'Draw Date,Number 1,Number 2,Number 3,Number 4,Number 5,Next Draw Date,Next Number 1,Next Number 2,Next Number 3,Next Number 4,Next Number 5,Diff 1,Diff 2,Diff 3,Diff 4,Diff 5\r\n';
        
        // Process each pair of consecutive draws
        for (let i = 0; i < doublePlayDraws.length - 1; i++) {
            const current = doublePlayDraws[i];
            const next = doublePlayDraws[i + 1];
            
            // Calculate differences
            const diffs = [];
            for (let j = 0; j < 5; j++) {
                diffs.push(Math.abs(current.numbers[j] - next.numbers[j]));
            }
            
            // Add row to CSV
            csvContent += `"${current.date}",`;
            csvContent += `${current.numbers.join(',')},`;
            csvContent += `"${next.date}",`;
            csvContent += `${next.numbers.join(',')},`;
            csvContent += `${diffs.join(',')}\r\n`;
        }
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `powerball_double_play_draw_differences_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error exporting Double Play differences to CSV:', error);
        alert('An error occurred while exporting the data. Please try again.');
    }
}

// Initialize the Double Play Differences tab
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for the Analyze Double Play Differences button
    const analyzeBtn = document.getElementById('analyze-double-play-differences-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeDoublePlayDifferences);
    }
    
    // Add event listener for the Export to CSV button
    const exportBtn = document.getElementById('export-double-play-differences-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDoublePlayDifferencesToCSV);
    }
    
    // Add tab click handler for the Double Play Differences tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === 'double-play-differences') {
            btn.addEventListener('click', function() {
                // This ensures the tab content is shown before analyzing
                setTimeout(analyzeDoublePlayDifferences, 100);
            });
        }
    });
});

// Function to analyze differences between consecutive draws
function analyzeDrawDifferences() {
    const resultsDiv = document.getElementById('differences-results');
    const loadingDiv = document.getElementById('differences-loading');
    const statsDiv = document.getElementById('differences-stats');
    const statsContent = document.getElementById('differences-stats-content');
    
    // Show loading state
    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    statsDiv.style.display = 'none';
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            // Get all main draws and double play draws
            const allMainDraws = [...(window.allDraws || []), ...(window.filteredDrawRows || [])];
            const allDoublePlayDraws = [...(window.doublePlayDraws || [])];
            
            // Process main draws
            const mainDraws = [];
            const mainDates = new Set();
            
            allMainDraws.forEach(draw => {
                if (draw && draw.date && !mainDates.has(draw.date) && draw.mainArr && draw.mainArr.length === 5) {
                    mainDates.add(draw.date);
                    mainDraws.push({
                        ...draw,
                        type: 'main',
                        displayDate: draw.date,
                        displayNums: [...draw.mainArr].sort((a, b) => a - b)
                    });
                }
            });
            
            // Process double play draws
            const doublePlayDraws = [];
            const doublePlayDates = new Set();
            
            allDoublePlayDraws.forEach(draw => {
                if (draw && draw.date && !doublePlayDates.has(draw.date) && draw.mainArr && draw.mainArr.length === 5) {
                    doublePlayDates.add(draw.date);
                    doublePlayDraws.push({
                        ...draw,
                        type: 'double',
                        displayDate: `${draw.date} (DP)`,
                        displayNums: [...draw.mainArr].sort((a, b) => a - b)
                    });
                }
            });
            
            // Combine and sort all draws by date (newest first)
            const allDraws = [...mainDraws, ...doublePlayDraws].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            console.log(`Analyzing ${allDraws.length} draws (${mainDraws.length} main + ${doublePlayDraws.length} double play)`);
            if (allDraws.length < 2) {
                resultsDiv.innerHTML = `
                    <div class="error-message" style="color: #e74c3c; padding: 15px; background-color: #fde8e8; border-radius: 4px; text-align: center;">
                        <i class="fas fa-exclamation-triangle"></i> Not enough valid draw data available for analysis.
                        <p>Found ${allDraws.length} valid draws. At least 2 are needed.</p>
                    </div>
                `;
                loadingDiv.style.display = 'none';
                return;
            }
            
            console.log(`Analyzing ${allDraws.length} draws`);
            
            // Process draws to extract numbers and calculate differences
            const processedDraws = [];
            const allDifferences = [];
            const differenceStats = {
                totalComparisons: 0,
                maxDifference: 0,
                minDifference: 69, // Max possible difference between 1 and 69
                averageDifference: 0,
                differenceCounts: {},
                positionStats: Array(5).fill().map(() => ({
                    max: 0,
                    min: 69,
                    sum: 0,
                    count: 0
                }))
            };
            
            // Track combination frequencies
            const combinationFrequency = new Map();
            // Track sign patterns
            const signPatternFrequency = new Map();
            
            // Process each draw and compare with the next one
            for (let i = 0; i < allDraws.length - 1; i++) {
                const currentDraw = allDraws[i];
                const nextDraw = allDraws[i + 1];
                
                // Get numbers from current and next draw
                const currentNums = currentDraw.mainArr || [];
                const nextNums = nextDraw.mainArr || [];
                
                // Skip if either draw doesn't have exactly 5 numbers
                if (currentNums.length !== 5 || nextNums.length !== 5) {
                    console.log(`Skipping draw pair ${currentDraw.date} - ${nextDraw.date}: Invalid number count`);
                    continue;
                }
                
                // Skip if both are double play draws (we only want main-to-main, main-to-double, and double-to-main)
                if (currentDraw.type === 'double' && nextDraw.type === 'double') {
                    continue;
                }
                
                // Calculate differences between corresponding positions with signs (current - next)
                const differences = [];
                const signedDifferences = [];
                const evenOddIndicators = [];
                let hasInvalidDiff = false;
                
                for (let j = 0; j < 5; j++) {
                    const diff = currentNums[j] - nextNums[j]; // Changed to current - next
                    const absDiff = Math.abs(diff);
                    const sign = diff > 0 ? '+' : ''; // Single + for positive, empty string for negative (which will show -)
                    const isEven = absDiff % 2 === 0;
                    
                    differences.push(absDiff);
                    signedDifferences.push(sign + diff); // This will show as +5 or -3
                    evenOddIndicators.push(isEven ? 'E' : 'O');
                    
                    // Update position stats (using absolute values for stats)
                    const posStat = differenceStats.positionStats[j];
                    posStat.max = Math.max(posStat.max, absDiff);
                    posStat.min = Math.min(posStat.min, absDiff);
                    posStat.sum += absDiff;
                    posStat.count++;
                    
                    // Update global stats (using absolute values)
                    differenceStats.maxDifference = Math.max(differenceStats.maxDifference, absDiff);
                    differenceStats.minDifference = Math.min(differenceStats.minDifference, absDiff);
                    
                    // Update difference counts (using absolute values)
                    differenceStats.differenceCounts[absDiff] = (differenceStats.differenceCounts[absDiff] || 0) + 1;
                }
                
                // Track this combination
                const comboKey = signedDifferences.join(',');
                combinationFrequency.set(comboKey, (combinationFrequency.get(comboKey) || 0) + 1);
                
                // Track sign pattern (just + and - signs)
                const signPattern = signedDifferences.map(d => d.startsWith('-') ? '-' : '+').join('');
                const patternCount = (signPatternFrequency.get(signPattern) || 0) + 1;
                signPatternFrequency.set(signPattern, patternCount);
                
                if (hasInvalidDiff) continue;
                
                // Add to processed draws with combination info
                const comboCount = combinationFrequency.get(comboKey);
                
                processedDraws.push({
                    date: currentDraw.date || 'Unknown date',
                    currentNums: [...currentNums].sort((a, b) => a - b),
                    nextDate: nextDraw.date || 'Unknown date',
                    nextNums: [...nextNums].sort((a, b) => a - b),
                    differences,
                    signedDifferences,
                    evenOddIndicators,
                    comboKey,
                    comboCount: comboCount + 1 // Increment count for this combo
                });
                
                // Update the frequency map with the incremented count
                combinationFrequency.set(comboKey, comboCount + 1);
                
                differenceStats.totalComparisons++;
            }
            
            // Calculate average difference for each position
            differenceStats.positionStats.forEach(stat => {
                stat.avg = stat.count > 0 ? (stat.sum / stat.count).toFixed(2) : 0;
            });
            
            // Calculate overall average difference
            const totalDiffs = Object.values(differenceStats.differenceCounts).reduce((sum, count) => sum + count, 0);
            const totalDiffSum = Object.entries(differenceStats.differenceCounts)
                .reduce((sum, [diff, count]) => sum + (parseInt(diff, 10) * count), 0);
            differenceStats.averageDifference = totalDiffs > 0 ? (totalDiffSum / totalDiffs).toFixed(2) : 0;
            
            // Generate HTML for the results
            let html = `
                <div class="results-summary" style="margin-bottom: 20px;">
                    <p>Analyzed <strong>${processedDraws.length}</strong> consecutive draw pairs.</p>
                </div>
                <div style="overflow-x: auto;">
                    <table class="difference-table">
                        <thead>
                            <tr>
                                <th>Draw Date</th>
                                <th>Numbers</th>
                                <th>Next Draw</th>
                                <th>Next Numbers</th>
                                <th>Differences</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Track all occurrences of each sign pattern with their dates
            const patternOccurrences = new Map();
            
            // First pass: collect all occurrences of each pattern
            processedDraws.forEach(draw => {
                const signPattern = draw.signedDifferences.map(d => d.startsWith('-') ? '-' : '+').join('');
                draw.signPattern = signPattern;
                draw.patternCount = signPatternFrequency.get(signPattern) || 0;
                
                // Initialize pattern in the map if it doesn't exist
                if (!patternOccurrences.has(signPattern)) {
                    patternOccurrences.set(signPattern, []);
                }
                
                // Add this occurrence to the pattern's list
                patternOccurrences.get(signPattern).push({
                    date: draw.date,
                    nextDate: draw.nextDate,
                    numbers: draw.currentNums,
                    nextNumbers: draw.nextNums,
                    differences: draw.signedDifferences
                });
            });
            
            // Add rows for each draw comparison
            processedDraws.forEach((draw, index) => {
                const isEven = index % 2 === 0;
                const rowStyle = isEven ? 'background-color: #f9f9f9;' : '';
                const patternHighlight = draw.patternCount > 1 ? 'border-left: 4px solid #f39c12;' : '';
                
                html += `
                    <tr style="${rowStyle} ${patternHighlight}">
                        <td>
                            ${draw.date || ''}
                            ${draw.drawType ? `<div style="font-size: 0.8em; color: #7f8c8d;">${draw.drawType}</div>` : ''}
                        </td>
                        <td>${draw.currentNums.map(n => `<span class="difference-number" style="background-color: ${draw.date.includes('DP') ? '#9b59b6' : '#e74c3c'};">${n}</span>`).join(' ')}</td>
                        <td>${draw.nextDate}</td>
                        <td>${draw.nextNums.map(n => `<span class="difference-number" style="background-color: ${draw.nextDate.includes('DP') ? '#9b59b6' : '#3498db'};">${n}</span>`).join(' ')}</td>
                        <td>
                            <div style="margin-bottom: 4px;">
                                ${draw.signedDifferences.map((d, idx) => {
                                    const diff = parseInt(d);
                                    const color = diff > 0 ? '#27ae60' : diff < 0 ? '#e74c3c' : '#7f8c8d';
                                    // Show single + for positive numbers (no double ++)
                                    const displayNum = diff > 0 ? `+${diff}` : diff;
                                    return `<span class="difference-value" style="color: ${color}; font-weight: bold; margin-right: 4px;">${displayNum}</span>`;
                                }).join('')}
                            </div>
                            <div style="font-size: 0.9em; color: #7f8c8d; margin-top: 4px;">
                                ${draw.evenOddIndicators.map(eo => 
                                    `<span style="margin-right: 4px;">${eo}</span>`
                                ).join('')}
                            </div>
                            ${draw.patternCount > 1 ? `
                                <div id="pattern-${index}" style="font-size: 0.85em; color: #f39c12; margin-top: 4px; font-weight: bold; cursor: pointer; display: inline-block;">
                                    Pattern appeared ${draw.patternCount}x ▼
                                </div>
                                <div id="pattern-${index}-dates" style="display: none; margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 0.8em; color: #2c3e50;">
                                    <div style="font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 3px;">Pattern appeared on:</div>
                                    ${patternOccurrences.get(draw.signPattern).map(occurrence => 
                                        `<div style="margin-bottom: 4px; padding: 3px 0; border-bottom: 1px dashed #eee;">
                                            <div>${occurrence.date} → ${occurrence.nextDate}</div>
                                            <div style="font-family: monospace; font-size: 0.9em; color: #7f8c8d;">
                                                ${occurrence.differences.map(d => 
                                                    `<span style="color: ${d > 0 ? '#27ae60' : d < 0 ? '#e74c3c' : '#7f8c8d'}; margin-right: 8px; font-weight: bold;">
                                                        ${d > 0 ? '+' : ''}${d}
                                                    </span>`
                                                ).join('')}
                                            </div>
                                        </div>`
                                    ).join('')}
                                </div>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            // Add statistics
            let statsHtml = `
                <div class="stat-box">
                    <h4>Overall Statistics</h4>
                    <p><strong>Total Comparisons:</strong> ${differenceStats.totalComparisons}</p>
                    <p><strong>Max Difference:</strong> ${differenceStats.maxDifference}</p>
                    <p><strong>Min Difference:</strong> ${differenceStats.minDifference}</p>
                    <p><strong>Avg Difference:</strong> ${differenceStats.averageDifference}</p>
                </div>
            `;
            
            // Add position-specific statistics
            differenceStats.positionStats.forEach((stat, index) => {
                statsHtml += `
                    <div class="stat-box">
                        <h4>Position ${index + 1} Stats</h4>
                        <p><strong>Max:</strong> ${stat.max}</p>
                        <p><strong>Min:</strong> ${stat.min}</p>
                        <p><strong>Avg:</strong> ${stat.avg}</p>
                    </div>
                `;
            });
            
            // Add difference frequency distribution
            const sortedDiffs = Object.entries(differenceStats.differenceCounts)
                .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));
                
            let freqHtml = `
                <div class="stat-box" style="min-width: 100%; margin-top: 15px;">
                    <h4>Difference Frequency</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
            `;
            
            sortedDiffs.forEach(([diff, count]) => {
                const percentage = ((count / totalDiffs) * 100).toFixed(1);
                freqHtml += `
                    <div style="margin-right: 15px; margin-bottom: 10px;">
                        <div style="font-weight: bold; margin-bottom: 3px;">${diff}</div>
                        <div style="background-color: #e74c3c; height: 5px; width: 100%; border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; width: 100%; background-color: #2ecc71; width: ${percentage}%;"></div>
                        </div>
                        <div style="font-size: 12px; color: #666; text-align: center;">${percentage}% (${count})</div>
                    </div>
                `;
            });
            
            freqHtml += `
                    </div>
                </div>
            `;
            
            // Update the DOM
            resultsDiv.innerHTML = html;
            statsContent.innerHTML = statsHtml + freqHtml;
            statsDiv.style.display = 'block';
            loadingDiv.style.display = 'none';
            
            // Add click handlers for pattern toggles
            processedDraws.forEach((draw, index) => {
                if (draw.patternCount > 1) {
                    const patternElement = document.getElementById(`pattern-${index}`);
                    if (patternElement) {
                        patternElement.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const datesElement = document.getElementById(`pattern-${index}-dates`);
                            if (datesElement) {
                                const isVisible = datesElement.style.display === 'block';
                                datesElement.style.display = isVisible ? 'none' : 'block';
                                patternElement.innerHTML = `Pattern appeared ${draw.patternCount}x ${isVisible ? '▼' : '▲'}`;
                            }
                        });
                    }
                }
            });
            
            // Scroll to results
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error analyzing draw differences:', error);
            resultsDiv.innerHTML = `
                <div class="error-message" style="color: #e74c3c; padding: 15px; background-color: #fde8e8; border-radius: 4px; text-align: center;">
                    <i class="fas fa-exclamation-triangle"></i> An error occurred while analyzing draw differences. Please try again.
                </div>
            `;
            loadingDiv.style.display = 'none';
        }
    }, 100);
}

// Function to export differences to CSV
function exportDifferencesToCSV() {
    try {
        // Get all draws from both allDraws and filteredDrawRows
        const allDraws = [...(window.allDraws || []), ...(window.filteredDrawRows || [])];
        // Remove duplicates by date
        const uniqueDraws = [];
        const seenDates = new Set();
        
        allDraws.forEach(draw => {
            if (draw && draw.date && !seenDates.has(draw.date)) {
                seenDates.add(draw.date);
                uniqueDraws.push(draw);
            }
        });
        
        // Sort draws by date (newest first)
        uniqueDraws.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        if (uniqueDraws.length < 2) {
            alert('Not enough valid draw data available for export.');
            return;
        }
        
        // Prepare CSV content
        let csvContent = 'Draw Date,Numbers,Next Draw Date,Next Numbers,Difference 1,Difference 2,Difference 3,Difference 4,Difference 5\n';
        
        // Process each draw and compare with the next one
        for (let i = 0; i < uniqueDraws.length - 1; i++) {
            const currentDraw = uniqueDraws[i];
            const nextDraw = uniqueDraws[i + 1];
            
            // Get numbers from current draw
            const currentNums = currentDraw.mainArr || [];
            const nextNums = nextDraw.mainArr || [];
            
            // Skip if either draw doesn't have exactly 5 numbers
            if (currentNums.length !== 5 || nextNums.length !== 5) continue;
            
            // Calculate differences between corresponding positions
            const differences = [];
            let hasInvalidDiff = false;
            
            for (let j = 0; j < 5; j++) {
                const diff = Math.abs(nextNums[j] - currentNums[j]);
                differences.push(diff);
            }
            
            if (hasInvalidDiff) continue;
            
            // Add to CSV with signed differences
            csvContent += `"${currentDraw.date || 'Unknown date'}",`;
            csvContent += `"${currentNums.join(', ')}",`;
            csvContent += `"${nextDraw.date || 'Unknown date'}",`;
            csvContent += `"${nextNums.join(', ')}",`;
            csvContent += `"${signedDifferences.join(', ')}\n`;
        }
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `powerball_draw_differences_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error exporting differences to CSV:', error);
        alert('An error occurred while exporting the data. Please try again.');
    }
}

// Initialize the Draw Differences tab
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for the Analyze Differences button
    const analyzeBtn = document.getElementById('analyze-differences-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeDrawDifferences);
    }
    
    // Add event listener for the Export to CSV button
    const exportBtn = document.getElementById('export-differences-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDifferencesToCSV);
    }
    
    // Add tab click handler for the Draw Differences tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === 'draw-differences') {
            btn.addEventListener('click', function() {
                // This ensures the tab content is shown before analyzing
                setTimeout(analyzeDrawDifferences, 100);
            });
        }
    });
});

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

// --- POWERBALL TAB FUNCTIONALITY ---

// Function to render the Powerball ball panel with frequency data
function renderPowerballBallPanel() {
    const container = document.getElementById('powerball-ball-panel');
    console.log('[DEBUG] renderPowerballBallPanel: container at render time:', container);
    if (!container) {
        console.error('[ERROR] powerball-ball-panel container not found at render time!');
        return;
    }
    console.log('renderPowerballBallPanel function called');
    
    // Calculate Powerball frequencies from the data
    const powerballFrequencies = calculatePowerballFrequencies();
    
    // Create simple HTML string instead of DOM manipulation
    let ballsHTML = '';
    for (let i = 1; i <= 26; i++) {
        const frequency = powerballFrequencies[i] || 0;
        ballsHTML += `
            <div class="powerball-ball" data-number="${i}" onclick="handlePowerballClick(${i}, this)" 
                 style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; 
                        width: 60px; height: 60px; border-radius: 50%; background: #e53e3e; color: white; 
                        font-weight: bold; cursor: pointer; margin: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <div style="font-size: 1.1em;">${i}</div>
                <div style="font-size: 0.7em; opacity: 0.9;">${frequency}×</div>
            </div>
        `;
    }
    
    container.innerHTML = ballsHTML;
    console.log('Powerball balls HTML set, container children:', container.children.length);
}

// Function to calculate Powerball frequencies
function calculatePowerballFrequencies() {
    const frequencies = {};
    
    console.log('calculatePowerballFrequencies called');
    console.log('window.filteredDrawRows:', window.filteredDrawRows);
    
    if (!window.filteredDrawRows) {
        console.error('window.filteredDrawRows is not available!');
        return frequencies;
    }
    
    window.filteredDrawRows.forEach(draw => {
        // Count main draw Powerball
        if (draw.powerball) {
            const pb = parseInt(draw.powerball);
            if (pb >= 1 && pb <= 26) {
                frequencies[pb] = (frequencies[pb] || 0) + 1;
            }
        }
        
        // Count Double Play Powerball
        if (draw.doublePlayPowerball) {
            const dpb = parseInt(draw.doublePlayPowerball);
            if (dpb >= 1 && dpb <= 26) {
                frequencies[dpb] = (frequencies[dpb] || 0) + 1;
            }
        }
    });
    
    return frequencies;
}

// Function to handle Powerball number click
function handlePowerballClick(number, element) {
    if (!window.filteredDrawRows) return;
    
    // Remove selected class from all balls
    document.querySelectorAll('.ball.powerball').forEach(ball => {
        ball.classList.remove('selected');
        ball.style.backgroundColor = '#e53e3e';
    });
    
    // Add selected class to clicked ball
    element.classList.add('selected');
    element.style.backgroundColor = '#2ecc71';
    
    // Show detailed data for this Powerball number
    showPowerballDetails(number);
}

// Function to show detailed Powerball data
// Helper to get all k-combos from an array
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
// Helper to render combo tables with dates
function comboTableHtml(title, map) {
    const entries = Array.from(map.entries());
    if (entries.length === 0) return '';
    
    // Sort entries by count (descending)
    entries.sort((a, b) => b[1].count - a[1].count);
    
    return `
    <div style="margin-bottom:24px;">
        <h4 style='margin:0 0 12px 0;color:#333;font-size:1.1em;'>${title}</h4>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px;">
            ${entries.map(([set, data]) => {
                const datesHtml = data.dates
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort dates newest first
                    .map(d => `
                        <div style="display: flex; justify-content: space-between; padding: 6px 8px; border-bottom: 1px solid #f0f0f0;">
                            <span>${d.date}</span>
                            <span style="color: #666; font-size: 0.9em;">${d.type}</span>
                        </div>
                    `).join('');
                
                return `
                <div style="margin-bottom: 12px; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="background: #f5f5f5; padding: 8px 12px; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>${set}</span>
                        <span style="color: #e53e3e;">${data.count} ${data.count === 1 ? 'time' : 'times'}</span>
                    </div>
                    <div style="max-height: 120px; overflow-y: auto;">
                        ${datesHtml}
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}
function showPowerballDetails(number) {
    if (!window.filteredDrawRows) return;
    const resultsDiv = document.getElementById('powerball-results');
    if (!resultsDiv) return;
    // --- Collect all occurrences and co-occurring numbers ---
    const occurrences = [];
    const coOccurringNumbers = {};
    window.filteredDrawRows.forEach(draw => {
        // Main draw
        if (draw.powerball && parseInt(draw.powerball) === number) {
            occurrences.push({
                date: draw.date,
                type: 'Main Draw',
                numbers: draw.mainArr,
                powerball: draw.powerball
            });
            if (draw.mainArr) {
                draw.mainArr.forEach(num => {
                    const n = parseInt(num);
                    coOccurringNumbers[n] = (coOccurringNumbers[n] || 0) + 1;
                });
            }
        }
        // Double Play draw
        if (draw.doublePlayPowerball && parseInt(draw.doublePlayPowerball) === number) {
            occurrences.push({
                date: draw.date,
                type: 'Double Play',
                numbers: draw.doublePlayArr,
                powerball: draw.doublePlayPowerball
            });
            if (draw.doublePlayArr) {
                draw.doublePlayArr.forEach(num => {
                    const n = parseInt(num);
                    coOccurringNumbers[n] = (coOccurringNumbers[n] || 0) + 1;
                });
            }
        }
    });
    // --- Compute duos, trios, quads, fives with dates ---
    const duoCounts = new Map();
    const trioCounts = new Map();
    const quadCounts = new Map();
    const fiveCounts = new Map();
    
    occurrences.forEach(occ => {
        const nums = (occ.numbers||[]).map(Number).filter(n => n>=1 && n<=69);
        const drawDate = occ.date;
        const drawType = occ.type;
        
        // Track duos with dates
        if (nums.length >= 2) {
            getCombos(nums, 2).forEach(set => {
                if (!duoCounts.has(set)) duoCounts.set(set, {count: 0, dates: []});
                duoCounts.get(set).count++;
                duoCounts.get(set).dates.push({date: drawDate, type: drawType});
            });
        }
        
        // Track trios with dates
        if (nums.length >= 3) {
            getCombos(nums, 3).forEach(set => {
                if (!trioCounts.has(set)) trioCounts.set(set, {count: 0, dates: []});
                trioCounts.get(set).count++;
                trioCounts.get(set).dates.push({date: drawDate, type: drawType});
            });
        }
        
        // Track quads with dates
        if (nums.length >= 4) {
            getCombos(nums, 4).forEach(set => {
                if (!quadCounts.has(set)) quadCounts.set(set, {count: 0, dates: []});
                quadCounts.get(set).count++;
                quadCounts.get(set).dates.push({date: drawDate, type: drawType});
            });
        }
        
        // Track full combinations (5 numbers) with dates
        if (nums.length === 5) {
            const fiveSet = nums.slice().sort((a,b) => a-b).join('-');
            if (!fiveCounts.has(fiveSet)) fiveCounts.set(fiveSet, {count: 0, dates: []});
            fiveCounts.get(fiveSet).count++;
            fiveCounts.get(fiveSet).dates.push({date: drawDate, type: drawType});
        }
    });
    // --- Sort co-occurring numbers ---
    const sortedCoOccurring = Object.entries(coOccurringNumbers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10
    // --- Render HTML ---
    let html = `
        <div style="background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="
                    width: 50px; height: 50px; border-radius: 50%; background: #e53e3e; 
                    color: white; display: flex; align-items: center; justify-content: center; 
                    font-weight: bold; font-size: 1.3em; margin-right: 15px;
                ">${number}</div>
                <div>
                    <h3 style="margin: 0; color: #333;">Powerball ${number}</h3>
                    <p style="margin: 5px 0 0 0; color: #666;">Appeared ${occurrences.length} times</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #333;">Most Common Partners</h4>
                    <ul style="padding-left: 18px; margin: 0; color: #444;">
                        ${sortedCoOccurring.length > 0 ? sortedCoOccurring.map(([num, count]) => `<li>${num}: ${count} times</li>`).join('') : '<li>No co-occurring numbers</li>'}
                    </ul>
                </div>
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #333;">Draw History</h4>
                    <div style="max-height: 220px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px; background: #fafbfc; padding: 8px 10px;">
                        ${occurrences.length > 0 ? occurrences.map(occ => `
                            <div style="padding: 6px 0; border-bottom: 1px solid #f1f1f1; display: flex; flex-direction: column;">
                                <div style="font-size: 0.96em; color: #444; margin-bottom: 2px;">
                                    <strong>${occ.date}</strong> - ${occ.type}
                                </div>
                                <div style="display: flex; gap: 4px;">
                                    ${occ.numbers ? occ.numbers.map(num => `
                                        <span style="
                                            display: inline-block; width: 24px; height: 24px; 
                                            border-radius: 50%; background: #3498db; color: white; 
                                            text-align: center; line-height: 24px; font-size: 0.8em;
                                        ">${num}</span>
                                    `).join('') : ''}
                                    <span style="
                                        display: inline-block; width: 24px; height: 24px; 
                                        border-radius: 50%; background: #e53e3e; color: white; 
                                        text-align: center; line-height: 24px; font-size: 0.8em; margin-left: 8px;
                                    ">${occ.powerball}</span>
                                </div>
                            </div>
                        `).join('')
                        : '<div style="color: #999; text-align: center; padding: 20px;">No occurrences found</div>'}
                    </div>
                </div>
            </div>
            <div style="margin-top:24px;">
                <h3 style="color: #333; border-bottom: 2px solid #e53e3e; padding-bottom: 8px; margin-bottom: 16px;">Combination History with Powerball ${number}</h3>
                
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2c3e50; margin: 0 0 12px 0; font-size: 1.1em;">Number Pairs (2 numbers)</h4>
                    ${comboTableHtml('', duoCounts)}
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2c3e50; margin: 0 0 12px 0; font-size: 1.1em;">Number Trios (3 numbers)</h4>
                    ${comboTableHtml('', trioCounts)}
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #2c3e50; margin: 0 0 12px 0; font-size: 1.1em;">Number Quads (4 numbers)</h4>
                    ${comboTableHtml('', quadCounts)}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin: 0 0 12px 0; font-size: 1.1em;">Full Combinations (5 numbers)</h4>
                    ${comboTableHtml('', fiveCounts)}
                </div>
            </div>
        </div>
    `;
    resultsDiv.innerHTML = html;
}