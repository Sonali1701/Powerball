// Cash 5 Analyzer & Generator Logic

// Global variable to store the latest results
let cash5Results = [];

// Function to load data from local CSV
async function loadCash5Data() {
    const loadingIndicator = document.getElementById('cash5-loading-indicator');
    
    try {
        // Load from local CSV
        const response = await fetch('cash5.csv');
        if (!response.ok) throw new Error('Failed to load local CSV');
        
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true }).data;
        
        // Filter out any empty rows and ensure we have valid data
        cash5Results = results.filter(row => row['Draw Date'] && row['Ball 1']);
        
        // Sort by date (newest first)
        cash5Results.sort((a, b) => new Date(b['Draw Date']) - new Date(a['Draw Date']));
        
        // Update the UI with the loaded data
        processAndUpdateUI();
        
        // Store in localStorage for offline use
        localStorage.setItem('cachedCash5Results', JSON.stringify(cash5Results));
        localStorage.setItem('cash5LastUpdated', new Date().toISOString());
        
        return true;
        
    } catch (error) {
        console.error('Error loading from CSV:', error);
        
        // Try to load from localStorage if available
        try {
            const cachedResults = localStorage.getItem('cachedCash5Results');
            
            if (cachedResults) {
                cash5Results = JSON.parse(cachedResults);
                processAndUpdateUI();
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
    if (!cash5Results || cash5Results.length === 0) {
        console.error('No data available to process');
        return;
    }
    
    console.log('Updating UI with Cash 5 results');
    
    // Sort results by date (newest first)
    const sortedResults = [...cash5Results].sort((a, b) => 
        new Date(b['Draw Date']) - new Date(a['Draw Date'])
    );
    
    // Update the results table
    const tbody = document.querySelector('#cash5-results-table tbody');
    if (tbody) {
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
            
            tbody.appendChild(row);
        });
    }
    
    // Initialize the Random tab if it exists
    if (typeof window.initCash5RandomTab === 'function') {
        window.initCash5RandomTab();
    }
}

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

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize DOM cache
    domCache.init();
    
    // Add event listener for refresh button
    const refreshBtn = document.getElementById('cash5-refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadCash5Data();
        });
    }
    
    // Load initial data
    await loadCash5Data();
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
            if (tabContent) {
                tabContent.style.display = 'block';
                
                // If switching to combo45 tab, check for URL parameters
                if (tabId === 'combo45') {
                    checkUrlForPreselectedNumbers();
                    renderCash5Combo45Results();
                }
            }
            if (tabId === 'combo') {
                // Check for pre-selected numbers from 4&5 Combo tab
                const storedData = sessionStorage.getItem('cash5ComboPreselectedNumbers');
                if (storedData) {
                    try {
                        const { numbers, frequency } = JSON.parse(storedData);
                        if (Array.isArray(numbers) && numbers.length > 0) {
                            // Set the selected numbers
                            window.cash5SelectedCombo = [...numbers];
                            
                            // Clear the stored data to prevent re-selection on page refresh
                            sessionStorage.removeItem('cash5ComboPreselectedNumbers');
                            
                            // Update the UI
                            updateCash5ComboSelectedNumbersDisplay();
                            
                            // Render the ball panel and results
                            renderCash5ComboBallPanel();
                            renderCash5ComboResults();
                            

                            
                            return; // Skip the default render below
                        }
                    } catch (e) {
                        console.error('Error parsing stored combo data:', e);
                        sessionStorage.removeItem('cash5ComboPreselectedNumbers');
                    }
                }
                
                // Default render if no pre-selected numbers
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
            if (tabId === 'combo45') {
                initCash5Combo45Tab();
            }
            if (tabId === 'random' && typeof window.initCash5RandomTab === 'function') {
                window.initCash5RandomTab();
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
                    
                    // Analyze frequent trios for the random generator after all data is loaded
                    window.sortedTriplets = analyzeFrequentTrios(window.cash5DrawRows);
                    console.log('Frequent trios analysis complete. Found', window.sortedTriplets.length, 'unique trios that appear 2+ times');
                    
                    // Debug: Log first few draws to verify data
                    console.log('First 3 draws from CSV:');
                    window.cash5DrawRows.slice(0, 3).forEach((draw, i) => {
                        console.log(`Draw ${i + 1} (${draw.date}):`, draw.mainArr.join(','));
                    });
                    console.log('Total draws loaded:', window.cash5DrawRows.length);
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
            html += `<table class='results-table cash5-wide results-table-interactive'><thead><tr><th>Date</th><th>Winning Numbers</th></tr></thead><tbody>`;
            
            // Filter draws to only include 2015-2025 and sort by date (newest first)
            const draws = (window.cash5DrawRows || [])
                .filter(draw => {
                    if (!draw.date) return false;
                    const year = new Date(draw.date).getFullYear();
                    return year >= 2015 && year <= 2025;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));
                
            // Always show all draws, just highlight matches
            let hasMatches = selected.length > 0 && draws.some(draw => 
                selected.some(n => draw.mainArr.includes(n))
            );
            
            // Process all draws
            draws.forEach(draw => {
                const matches = selected.length > 0 ? selected.filter(n => draw.mainArr.includes(n)) : [];
                
                html += `
                    <tr tabindex='0'>
                        <td>${draw.date||''}</td>
                        <td>${draw.mainArr.map((n, index) => {
                            const numElement = selected.includes(n) 
                                ? `<span class='ball selected' style='margin:0 2px;'>${n}</span>` 
                                : `<span class='plain-number'>${n}</span>`;
                            // Add a dash after the number if it's not the last one
                            return index < draw.mainArr.length - 1 ? numElement + ' - ' : numElement;
                        }).join('')}</td>
                    </tr>`;
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
        
        // --- Single Number Frequencies ---
        if (selected.length > 0) {
            html += '<h3 style="margin-top:18px;">Single Number Frequencies</h3>';
            
            // Sort numbers by frequency (descending)
            const numbersWithFreq = selected.map(num => {
                const draws = (window.cash5DrawRows || []).filter(draw => draw.mainArr.includes(num));
                return { num, count: draws.length, draws };
            }).sort((a, b) => b.count - a.count);
            
            // Create a table for single number frequencies
            html += `
                <table class='results-table' style='margin-bottom: 20px;'>
                    <thead>
                        <tr>
                            <th>Number</th>
                            <th>Frequency</th>
                            <th>Last 5 Draw Dates</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            numbersWithFreq.forEach(({num, count, draws}) => {
                // Sort draws by date (newest first)
                const sortedDraws = [...draws].sort((a, b) => {
                    const da = a.date ? a.date.split('/').reverse().join('') : '';
                    const db = b.date ? b.date.split('/').reverse().join('') : '';
                    return db.localeCompare(da);
                });
                
                const recentDraws = sortedDraws.slice(0, 5);
                const drawDates = recentDraws.map(d => d.date || 'N/A').join('<br>');
                
                html += `
                    <tr>
                        <td><span class='ball' style='background:#e74c3c;color:#fff;'>${num}</span></td>
                        <td>${count} ${count === 1 ? 'time' : 'times'}</td>
                        <td>${drawDates}</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
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
        // Add some spacing after single number frequencies
        if (selected.length > 0) {
            html += '<div style="margin: 20px 0; border-top: 1px solid #eee;"></div>';
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

// --- 4&5 Combo Tab: Functions ---
function generateCombinations(numbers, size) {
    const result = [];
    
    function backtrack(start, current) {
        if (current.length === size) {
            result.push([...current].sort((a, b) => a - b));
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

function countCombinations(draws, comboSize) {
    const comboMap = new Map();
    
    draws.forEach(draw => {
        const numbers = [...draw.mainArr].sort((a, b) => a - b);
        const drawDate = draw.date || 'Unknown date';
        
        // Generate all possible combinations of comboSize numbers
        const combinations = generateCombinations(numbers, comboSize);
        
        // Count each combination and track dates
        combinations.forEach(combo => {
            const key = combo.join(',');
            const existing = comboMap.get(key) || { count: 0, dates: [] };
            
            comboMap.set(key, {
                count: existing.count + 1,
                dates: [...existing.dates, drawDate].sort().reverse() // Most recent first
            });
        });
    });
    
    return comboMap;
}

// Global variables for Cash 5 combo tab
window.cash5Combo45SelectedNumbers = [];
window.cash5Combo45SearchQuery = '';

// Check URL for pre-selected numbers
function checkUrlForPreselectedNumbers() {
    const urlParams = new URLSearchParams(window.location.search);
    const numbersParam = urlParams.get('numbers');
    
    if (numbersParam) {
        window.cash5Combo45SelectedNumbers = numbersParam.split(',').map(Number);
        updateCash5Combo45SelectedNumbersDisplay();
        renderCash5Combo45BallPanel();
    }
}

// Removed frequency filter functionality

// Helper function to redirect to combo page with selected numbers
function redirectToComboWithNumbers(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) return;
    
    const numbersParam = numbers.join(',');
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('numbers', numbersParam);
    
    // If already on the combo page, just update the URL and refresh the view
    if (window.location.pathname.endsWith('cash5.html') && 
        document.querySelector('#tab-combo45.tab-content[style*="display: block"]')) {
        window.history.pushState({}, '', currentUrl);
        window.cash5Combo45SelectedNumbers = [...numbers];
        updateCash5Combo45SelectedNumbersDisplay();
        renderCash5Combo45BallPanel();
        renderCash5Combo45Results();
    } else {
        // Otherwise, navigate to the combo tab with the numbers
        const tabUrl = new URL('cash5.html', window.location.href);
        tabUrl.searchParams.set('numbers', numbersParam);
        tabUrl.hash = 'tab-combo45';
        window.location.href = tabUrl.toString();
    }
}

// Initialize the Cash 5 4&5 Combo tab
function initCash5Combo45Tab() {
    // Initialize the ball panel
    renderCash5Combo45BallPanel();
    
    // Set up event listeners
    const searchInput = document.getElementById('cash5-combo45-search');
    const searchButton = document.getElementById('cash5-combo45-search-btn');
    const clearButton = document.getElementById('cash5-combo45-clear-btn');
    

    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.cash5Combo45SearchQuery = e.target.value.trim();
            renderCash5Combo45Results();
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchInput = document.getElementById('cash5-combo45-search');
            if (searchInput) {
                window.cash5Combo45SearchQuery = searchInput.value.trim();
                renderCash5Combo45Results();
            }
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            window.cash5Combo45SelectedNumbers = [];
            window.cash5Combo45SearchQuery = '';
            const searchInput = document.getElementById('cash5-combo45-search');
            if (searchInput) searchInput.value = '';
            
            // Clear and hide the 5th numbers panel
            const fifthNumbersList = document.getElementById('cash5-combo45-fifth-numbers-list');
            const fifthNumbersContainer = document.getElementById('cash5-combo45-fifth-numbers');
            if (fifthNumbersList && fifthNumbersContainer) {
                fifthNumbersList.innerHTML = '';
                fifthNumbersContainer.style.display = 'none';
            }
            
            updateCash5Combo45SelectedNumbersDisplay();
            renderCash5Combo45BallPanel();
            renderCash5Combo45Results();
        });
    }
    
    // Check for pre-selected numbers in URL
    checkUrlForPreselectedNumbers();
    
    // Initial render
    renderCash5Combo45Results();
    
    // Add click handlers for frequency indicators using event delegation
    document.addEventListener('click', (e) => {
        console.log('Click event triggered');
        
        // Try to find the frequency indicator element
        let freqIndicator = e.target.closest('.frequency-indicator');
        
        // If not found, check if we clicked on the '×' character inside the indicator
        if (!freqIndicator) {
            // Check if we clicked on a text node inside the frequency indicator
            if (e.target.parentNode && e.target.parentNode.classList && 
                e.target.parentNode.classList.contains('frequency-indicator')) {
                freqIndicator = e.target.parentNode;
            }
            // Check if we clicked on the '×' character
            else if (e.target.nodeName === 'DIV' && e.target.textContent && 
                    e.target.textContent.toString().includes('×')) {
                freqIndicator = e.target;
            }
            // Check if we clicked on a span inside the frequency indicator
            else if (e.target.parentNode && e.target.parentNode.classList && 
                    e.target.parentNode.classList.contains('frequency-indicator')) {
                freqIndicator = e.target.parentNode;
            }
        }
        
        console.log('Frequency indicator element:', freqIndicator);
        
        // Verify we have a valid frequency indicator with required attributes
        if (!freqIndicator || !freqIndicator.getAttribute('data-count') || !freqIndicator.getAttribute('data-numbers')) {
            console.log('No valid frequency indicator found');
            console.log('Element has data-count:', freqIndicator && freqIndicator.getAttribute('data-count'));
            console.log('Element has data-numbers:', freqIndicator && freqIndicator.getAttribute('data-numbers'));
            return;
        }
        
        const numbers = freqIndicator.getAttribute('data-numbers').split(',').map(Number);
        const comboSize = numbers.length;
        console.log('Clicked on combo size:', comboSize, 'Numbers:', numbers);
        
        // For 4-number combos, show the 5th numbers in the left panel
        if (comboSize === 4) {
            console.log('Processing 4-number combo');
            const fifthNumbers = [];
            const fifthNumbersList = document.getElementById('cash5-combo45-fifth-numbers-list');
            const fifthNumbersContainer = document.getElementById('cash5-combo45-fifth-numbers');
            
            console.log('Fifth numbers container:', fifthNumbersContainer);
            console.log('Fifth numbers list:', fifthNumbersList);
            
            if (!fifthNumbersList || !fifthNumbersContainer) {
                console.error('Could not find fifth numbers container or list');
                return;
            }
            
            // Clear previous results and hide the container
            fifthNumbersList.innerHTML = '';
            fifthNumbersContainer.style.display = 'none';
            
            // Find all draws that contain these 4 numbers and get the 5th number
            console.log('Searching for draws containing numbers:', numbers, 'Type of numbers:', numbers.map(n => typeof n));
            console.log('First draw numbers:', [
                window.cash5DrawRows[0]['Number 1'],
                window.cash5DrawRows[0]['Number 2'],
                window.cash5DrawRows[0]['Number 3'],
                window.cash5DrawRows[0]['Number 4'],
                window.cash5DrawRows[0]['Number 5']
            ], 'Type of first draw numbers:', [
                typeof window.cash5DrawRows[0]['Number 1'],
                typeof window.cash5DrawRows[0]['Number 2'],
                typeof window.cash5DrawRows[0]['Number 3'],
                typeof window.cash5DrawRows[0]['Number 4'],
                typeof window.cash5DrawRows[0]['Number 5']
            ]);
            
            // Object to track fifth numbers with their counts and dates
            const fifthNumberStats = {};
            
            window.cash5DrawRows.forEach((draw, index) => {
                try {
                    // Try to get numbers from mainArr first
                    let drawNumbers = [];
                    if (draw.mainArr && Array.isArray(draw.mainArr)) {
                        drawNumbers = draw.mainArr.map(Number).filter(n => !isNaN(n));
                    } 
                    
                    // If mainArr doesn't have valid numbers, try to get from Number 1-5 properties
                    if (drawNumbers.length !== 5) {
                        drawNumbers = [];
                        for (let i = 1; i <= 5; i++) {
                            const num = parseInt(draw[`Number ${i}`] || (draw[i-1] && draw[i-1].toString()), 10);
                            if (!isNaN(num)) drawNumbers.push(num);
                        }
                    }
                    
                    console.log(`Draw ${index + 1} numbers:`, drawNumbers, 'Full draw object:', draw);
                    
                    // Check if this draw contains all 4 numbers
                    const hasAllNumbers = numbers.every(num => {
                        // Convert both to strings for comparison to handle type mismatches
                        const numStr = String(num);
                        const includes = drawNumbers.some(drawNum => String(drawNum) === numStr);
                        
                        if (!includes) {
                            console.log(`Draw ${index + 1} is missing number:`, num, 'Draw numbers:', drawNumbers);
                        } else {
                            console.log(`Draw ${index + 1} has number ${num} at position ${drawNumbers.findIndex(n => String(n) === numStr)}`);
                        }
                        return includes;
                    });
                    
                    console.log(`Draw ${index + 1} has all numbers:`, hasAllNumbers);
                    
                    if (hasAllNumbers) {
                        // Find the 5th number (the one not in the selected 4)
                        const fifthNumber = drawNumbers.find(num => !numbers.includes(num));
                        console.log(`Found 5th number ${fifthNumber} in draw`, drawNumbers);
                        
                        if (fifthNumber !== undefined) {
                            // Initialize the stats for this fifth number if it doesn't exist
                            if (!fifthNumberStats[fifthNumber]) {
                                fifthNumberStats[fifthNumber] = {
                                    count: 0,
                                    dates: []
                                };
                            }
                            
                            // Update the stats
                            fifthNumberStats[fifthNumber].count++;
                            fifthNumberStats[fifthNumber].dates.push(draw.date || 'Unknown date');
                            
                            // Keep track of unique fifth numbers
                            if (!fifthNumbers.includes(fifthNumber)) {
                                fifthNumbers.push(fifthNumber);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error processing draw:', draw, error);
                }
            });
            
            // Display the 5th numbers with counts and dates
            console.log('Found fifth numbers with stats:', fifthNumberStats);
            if (fifthNumbers.length > 0) {
                // Sort by frequency (descending) then by number (ascending)
                fifthNumbers.sort((a, b) => {
                    const countDiff = fifthNumberStats[b].count - fifthNumberStats[a].count;
                    return countDiff !== 0 ? countDiff : a - b;
                });

                // Add a title above the 5th numbers list
                const title = document.createElement('h3');
                title.textContent = `5th Numbers for ${numbers.join(', ')}`;
                title.style.margin = '0 0 10px 0';
                title.style.padding = '0 0 5px 0';
                title.style.borderBottom = '1px solid #eee';
                title.style.color = '#333';
                title.style.fontSize = '1.1em';
                
                // Insert the title at the beginning of the container
                fifthNumbersContainer.insertBefore(title, fifthNumbersList);
                
                fifthNumbers.forEach(num => {
                    const stats = fifthNumberStats[num];
                    const container = document.createElement('div');
                    container.style.margin = '10px 0';
                    container.style.padding = '12px';
                    container.style.border = '1px solid #e0e0e0';
                    container.style.borderRadius = '8px';
                    container.style.backgroundColor = '#f9f9f9';
                    container.style.transition = 'all 0.2s';
                    
                    // Create header with ball and count
                    const header = document.createElement('div');
                    header.style.display = 'flex';
                    header.style.alignItems = 'center';
                    header.style.marginBottom = '8px';
                    header.style.cursor = 'pointer';
                    
                    // Create the ball
                    const ball = document.createElement('div');
                    ball.className = 'ball';
                    ball.textContent = num;
                    ball.style.margin = '0 10px 0 0';
                    ball.style.display = 'inline-flex';
                    ball.style.alignItems = 'center';
                    ball.style.justifyContent = 'center';
                    ball.style.width = '32px';
                    ball.style.height = '32px';
                    ball.style.borderRadius = '50%';
                    ball.style.backgroundColor = '#3498db';
                    ball.style.color = 'white';
                    ball.style.fontWeight = 'bold';
                    ball.style.cursor = 'pointer';
                    ball.style.transition = 'all 0.2s';
                    ball.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    
                    // Add count badge
                    const countBadge = document.createElement('span');
                    countBadge.textContent = `${stats.count}×`;
                    countBadge.style.marginLeft = '12px';
                    countBadge.style.padding = '4px 10px';
                    countBadge.style.backgroundColor = '#2ecc71';
                    countBadge.style.color = 'white';
                    countBadge.style.borderRadius = '12px';
                    countBadge.style.fontSize = '0.9em';
                    countBadge.style.fontWeight = 'bold';
                    countBadge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                    
                    // Add dates list
                    const datesList = document.createElement('div');
                    datesList.style.marginTop = '10px';
                    datesList.style.padding = '8px';
                    datesList.style.fontSize = '0.85em';
                    datesList.style.color = '#555';
                    datesList.style.backgroundColor = '#fff';
                    datesList.style.borderRadius = '4px';
                    datesList.style.border = '1px solid #e0e0e0';
                    datesList.style.display = 'block'; // Show by default
                    
                    // Show first 3 dates by default, with option to show more
                    const maxVisibleDates = 3;
                    const visibleDates = stats.dates.slice(0, maxVisibleDates);
                    const hasMoreDates = stats.dates.length > maxVisibleDates;
                    
                    const datesText = document.createElement('div');
                    datesText.textContent = `Appeared on: ${visibleDates.join(', ')}`;
                    
                    // Add show more/less toggle if there are more dates
                    if (hasMoreDates) {
                        const toggleLink = document.createElement('a');
                        toggleLink.textContent = ' (show more)';
                        toggleLink.style.cursor = 'pointer';
                        toggleLink.style.color = '#3498db';
                        toggleLink.style.marginLeft = '5px';
                        toggleLink.style.fontWeight = '500';
                        
                        toggleLink.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (toggleLink.textContent.includes('show more')) {
                                datesText.textContent = `Appeared on: ${stats.dates.join(', ')}`;
                                toggleLink.textContent = ' (show less)';
                            } else {
                                datesText.textContent = `Appeared on: ${visibleDates.join(', ')}`;
                                toggleLink.textContent = ' (show more)';
                            }
                        });
                        
                        datesText.appendChild(toggleLink);
                    }
                    
                    // Toggle dates visibility when clicking the header
                    header.addEventListener('click', (e) => {
                        // Don't toggle if clicking on the ball or count badge
                        if (e.target === ball || e.target === countBadge) {
                            return;
                        }
                        
                        if (datesList.style.display === 'none') {
                            datesList.style.display = 'block';
                            container.style.backgroundColor = '#f0f8ff';
                        } else {
                            datesList.style.display = 'none';
                            container.style.backgroundColor = '#f9f9f9';
                        }
                    });
                    
                    // Add click handler to select this number (when clicking the ball)
                    ball.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.cash5Combo45SelectedNumbers = [...numbers, num];
                        renderCash5Combo45BallPanel();
                        updateCash5Combo45SelectedNumbersDisplay();
                        renderCash5Combo45Results();
                        
                        // Highlight the selected container
                        document.querySelectorAll('#cash5-combo45-fifth-numbers-list > div').forEach(el => {
                            el.style.backgroundColor = el === container ? '#e6f3ff' : '#f9f9f9';
                        });
                    });
                    
                    // Add elements to the DOM
                    header.appendChild(ball);
                    header.appendChild(countBadge);
                    datesList.appendChild(datesText);
                    container.appendChild(header);
                    container.appendChild(datesList);
                    fifthNumbersList.appendChild(container);
                });
                
                fifthNumbersContainer.style.display = 'block';
            } else {
                fifthNumbersContainer.style.display = 'none';
            }
            
            // Highlight the selected 4-number combo
            window.cash5Combo45SelectedNumbers = [...numbers];
            renderCash5Combo45BallPanel();
            updateCash5Combo45SelectedNumbersDisplay();
            renderCash5Combo45Results();
        } else {
            // For other combo sizes, use the original behavior
            sessionStorage.setItem('cash5ComboPreselectedNumbers', JSON.stringify({
                numbers: numbers
            }));
            
            // Switch to the Combo tab
            const comboBtn = document.querySelector('[data-tab="combo"]');
            if (comboBtn) {
                comboBtn.click();
            }
        }
    });
    

}

// Render the ball panel for the 4&5 Combo tab
function renderCash5Combo45BallPanel() {
    const ballPanel = document.getElementById('cash5-combo45-ball-panel');
    if (!ballPanel) return;
    
    ballPanel.innerHTML = '';
    
    // Create balls for numbers 1-38 (Cash 5 uses numbers 1-38)
    for (let i = 1; i <= 42; i++) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.textContent = i;
        ball.style.margin = '2px';
        ball.style.display = 'inline-flex';
        ball.style.alignItems = 'center';
        ball.style.justifyContent = 'center';
        ball.style.width = '30px';
        ball.style.height = '30px';
        ball.style.borderRadius = '50%';
        ball.style.backgroundColor = '#27ae60'; // Cash 5 green
        ball.style.color = 'white';
        ball.style.cursor = 'pointer';
        ball.style.transition = 'all 0.2s';
        
        // Check if this number is selected
        if (window.cash5Combo45SelectedNumbers.includes(i)) {
            ball.style.backgroundColor = '#e74c3c';
            ball.style.transform = 'scale(1.1)';
            ball.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        }
        
        // Add click handler
        ball.addEventListener('click', () => {
            const index = window.cash5Combo45SelectedNumbers.indexOf(i);
            if (index === -1) {
                // Add to selected numbers if not already selected
                window.cash5Combo45SelectedNumbers.push(i);
            } else {
                // Remove from selected numbers if already selected
                window.cash5Combo45SelectedNumbers.splice(index, 1);
            }
            
            // Update the display and re-render results
            updateCash5Combo45SelectedNumbersDisplay();
            renderCash5Combo45Results();
        });
        
        // Add hover effect
        ball.addEventListener('mouseover', () => {
            ball.style.transform = 'scale(1.1)';
            ball.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        });
        
        ball.addEventListener('mouseout', () => {
            if (!window.cash5Combo45SelectedNumbers.includes(i)) {
                ball.style.transform = 'scale(1)';
                ball.style.boxShadow = 'none';
            }
        });
        
        ballPanel.appendChild(ball);
    }
}

// Update the selected numbers display
function updateCash5Combo45SelectedNumbersDisplay() {
    const selectedNumbersContainer = document.getElementById('cash5-combo45-selected-numbers');
    if (!selectedNumbersContainer) return;
    
    if (window.cash5Combo45SelectedNumbers.length === 0) {
        selectedNumbersContainer.innerHTML = '<span style="color: #777; font-style: italic;">No numbers selected</span>';
        return;
    }
    
    selectedNumbersContainer.innerHTML = '';
    
    // Sort the selected numbers
    const sortedNumbers = [...window.cash5Combo45SelectedNumbers].sort((a, b) => a - b);
    
    // Create balls for selected numbers
    sortedNumbers.forEach(num => {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.textContent = num;
        ball.style.margin = '2px';
        ball.style.display = 'inline-flex';
        ball.style.alignItems = 'center';
        ball.style.justifyContent = 'center';
        ball.style.width = '30px';
        ball.style.height = '30px';
        ball.style.borderRadius = '50%';
        ball.style.backgroundColor = '#e74c3c';
        ball.style.color = 'white';
        ball.style.cursor = 'pointer';
        
        // Add click handler to remove the number
        ball.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = window.cash5Combo45SelectedNumbers.indexOf(num);
            if (index !== -1) {
                window.cash5Combo45SelectedNumbers.splice(index, 1);
                updateCash5Combo45SelectedNumbersDisplay();
                renderCash5Combo45Results();
                renderCash5Combo45BallPanel();
            }
        });
        
        selectedNumbersContainer.appendChild(ball);
    });
}

// Render the 4&5 Combo results
function renderCash5Combo45Results() {
    const resultsContainer = document.getElementById('cash5-combo45-results');
    if (!resultsContainer || !window.cash5DrawRows) return;
    
    // Filter draws to only include valid ones with mainArr
    const draws = (window.cash5DrawRows || []).filter(draw => 
        draw && Array.isArray(draw.mainArr) && draw.mainArr.length === 5
    );
    
    // Count 4-number and 5-number combinations
    const fourNumberCombos = countCombinations(draws, 4);
    const fiveNumberCombos = countCombinations(draws, 5);
    
    // Process and filter combinations
    const processCombos = (comboMap, comboSize) => {
        const combos = [];
        comboMap.forEach((comboData, comboStr) => {
            const count = comboData.count;
            if (count >= 2) {
                const numbers = comboStr.split(',').map(Number).sort((a, b) => a - b);
                
                // Filter by selected numbers
                if (window.cash5Combo45SelectedNumbers.length > 0) {
                    const hasAllSelected = window.cash5Combo45SelectedNumbers.every(num => 
                        numbers.includes(num)
                    );
                    if (!hasAllSelected) return;
                }
                
                // Filter by search query
                if (window.cash5Combo45SearchQuery) {
                    const searchNumbers = window.cash5Combo45SearchQuery.split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 42);
                    if (searchNumbers.length > 0) {
                        const hasAllSearched = searchNumbers.every(num => 
                            numbers.includes(num)
                        );
                        if (!hasAllSearched) return;
                    }
                }
                
                combos.push({
                    numbers: numbers,
                    count: count,
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
    
    // Generate HTML for a combo table
    const generateComboTable = (combos, title) => {
        if (combos.length === 0) return document.createElement('div'); // Return empty div instead of empty string
        
        const rows = combos.map(combo => {
            const ballsHtml = `
                <div style="display: flex; align-items: center; gap: 4px; flex-wrap: nowrap;">
                    ${combo.numbers.map(num => {
                        const isSelected = window.cash5Combo45SelectedNumbers && 
                                         window.cash5Combo45SelectedNumbers.includes(parseInt(num));
                        const isSearched = window.cash5Combo45SearchQuery && 
                                         window.cash5Combo45SearchQuery.split(/\s+/).map(Number).includes(parseInt(num));
                        
                        let ballClass = 'ball';
                        let ballStyle = 'display: flex; align-items: center; justify-content: center;';
                        ballStyle += ' width: 30px; height: 30px; border-radius: 50%; font-weight: bold;';
                        ballStyle += ' transition: all 0.2s ease; flex-shrink: 0;';
                        
                        if (isSelected) {
                            // Highlight selected numbers in red without changing size
                            ballClass += ' selected';
                            ballStyle += ' background: #e74c3c !important; color: white !important;';
                        } else if (isSearched) {
                            ballClass += ' searched';
                            ballStyle += ' background: #f39c12; color: white;';
                        } else {
                            ballStyle += ' background: #27ae60; color: white;';
                        }
                        
                        return `<span class="${ballClass}" style="${ballStyle}" data-number="${num}">${num}</span>`;
                    }).join('\n                    ')}
                </div>
            `;
            
            // Format dates for display (most recent 3 or all if <= 3)
            const maxDatesToShow = 3;
            const datesToShow = combo.dates.length > maxDatesToShow 
                ? [...combo.dates.slice(0, maxDatesToShow), `+${combo.dates.length - maxDatesToShow} more`]
                : combo.dates;
                
            const datesHtml = datesToShow.map(date => 
                `<div style="font-size: 0.85em; color: #666; margin: 2px 0; white-space: nowrap;">${date}</div>`
            ).join('');
            
            return `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; vertical-align: middle;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            ${ballsHtml}
                            <div style="font-size: 14px; color: #2c3e50; font-weight: 600; margin-left: 15px; white-space: nowrap;
                                      padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;"
                                 data-count="${combo.count}"
                                 data-numbers="${combo.numbers.join(',')}"
                                 onmouseover="this.style.backgroundColor='#f0f0f0'"
                                 onmouseout="this.style.backgroundColor='transparent'"
                                 class="frequency-indicator">
                                ${combo.count}×
                            </div>
                        </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; max-width: 200px; overflow: hidden; vertical-align: middle;">
                        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #7f8c8d;">
                            ${datesHtml}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        const container = document.createElement('div');
        container.className = 'combo-table-container';
        container.style.marginBottom = '30px';
        container.style.width = '100%';
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = `${title} (${combos.length} combinations)`;
        titleEl.style.color = '#2c3e50';
        titleEl.style.margin = '0 0 15px 0';
        titleEl.style.padding = '0 0 8px 0';
        titleEl.style.borderBottom = '2px solid #e0e0e0';
        
        const tableContainer = document.createElement('div');
        tableContainer.style.width = '100%';
        tableContainer.style.overflowX = 'auto';
        
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.tableLayout = 'fixed';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const th1 = document.createElement('th');
        th1.textContent = 'Combination';
        th1.style.padding = '10px';
        th1.style.textAlign = 'left';
        th1.style.backgroundColor = '#f5f7fa';
        th1.style.borderBottom = '2px solid #e0e0e0';
        
        const th2 = document.createElement('th');
        th2.textContent = 'Draw Dates';
        th2.style.padding = '10px';
        th2.style.textAlign = 'left';
        th2.style.backgroundColor = '#f5f7fa';
        th2.style.borderBottom = '2px solid #e0e0e0';
        th2.style.width = '200px';
        
        headerRow.appendChild(th1);
        headerRow.appendChild(th2);
        thead.appendChild(headerRow);
        
        const tbody = document.createElement('tbody');
        tbody.innerHTML = rows;
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        container.appendChild(titleEl);
        container.appendChild(tableContainer);
        
        return container;
    };
    
    // Generate the final HTML with both tables side by side
    let html = '';
    
    // Show filter info if any filters are active
    if (window.cash5Combo45SelectedNumbers.length > 0 || window.cash5Combo45SearchQuery) {
        let filterText = 'Filtering by: ';
        const filters = [];
        
        if (window.cash5Combo45SelectedNumbers.length > 0) {
            filters.push(`selected numbers: ${window.cash5Combo45SelectedNumbers.sort((a, b) => a - b).join(', ')}`);
        }
        
        if (window.cash5Combo45SearchQuery) {
            filters.push(`search: "${window.cash5Combo45SearchQuery}"`);
        }
        
        filterText += filters.join(' and ');
        
        html += `<div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 0.95em; color: #555;">
                    ${filterText}
                </div>`;
    }
    
    // Generate HTML for the results
    const generateResultsHtml = () => {
        // Create a container for the tables
        const container = document.createElement('div');
        container.style.marginTop = '20px';
        container.style.width = '100%';
        container.style.maxWidth = '100%';
        container.style.overflowX = 'auto';
        
        // Add the 4-number combos table
        if (fourNumberResults.length > 0) {
            const table1 = generateComboTable(fourNumberResults, '4-Number Combinations');
            table1.style.marginBottom = '30px';
            table1.style.width = '100%';
            container.appendChild(table1);
        }
        
        // Add the 5-number combos table
        if (fiveNumberResults.length > 0) {
            const table2 = generateComboTable(fiveNumberResults, '5-Number Combinations');
            table2.style.width = '100%';
            container.appendChild(table2);
        }
        
        return container;
    };
    
    if (fourNumberResults.length === 0 && fiveNumberResults.length === 0) {
        html = '<div style="text-align: center; padding: 30px; color: #666; font-size: 16px;">No combinations found matching the current filters.</div>';
    }
    
    // Clear previous content and add the new tables
    resultsContainer.innerHTML = '';
    
    // Add the ball panel
    const ballPanelContainer = document.createElement('div');
    ballPanelContainer.style.marginBottom = '20px';
    ballPanelContainer.style.width = '100%';
    renderCash5Combo45BallPanel(ballPanelContainer);
    resultsContainer.appendChild(ballPanelContainer);
    
    // Add the search container
    const searchContainer = document.createElement('div');
    searchContainer.style.marginBottom = '20px';
    searchContainer.style.width = '100%';
    searchContainer.innerHTML = `
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <input type="text" id="cash5-combo45-search" 
                   placeholder="Search numbers..." 
                   style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; flex-grow: 1;"
                   value="${window.cash5Combo45SearchQuery || ''}">
            <button id="cash5-combo45-clear" 
                    style="padding: 8px 16px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Clear
            </button>
        </div>
        <div id="cash5-combo45-selected-numbers" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;"></div>
    `;
    resultsContainer.appendChild(searchContainer);
    
    // Add the results container
    resultsContainer.appendChild(generateResultsHtml());
    
    // Set up event listeners
    const searchInput = document.getElementById('cash5-combo45-search');
    const clearButton = document.getElementById('cash5-combo45-clear');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.cash5Combo45SearchQuery = e.target.value.trim();
            renderCash5Combo45Results();
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            window.cash5Combo45SelectedNumbers = [];
            window.cash5Combo45SearchQuery = '';
            if (searchInput) searchInput.value = '';
            renderCash5Combo45Results();
        });
    }
}

// Function to analyze and sort frequent trios from historical draws
function analyzeFrequentTrios(draws) {
    const trioCounts = new Map();
    
    // Count occurrences of each trio
    for (const draw of draws) {
        const numbers = draw.mainArr || [];
        if (!Array.isArray(numbers) || numbers.length < 5) continue;
        
        // Sort the numbers to ensure consistent trio generation
        const sortedNumbers = [...numbers].sort((a, b) => a - b);
        
        // Generate all possible trios from this draw
        for (let i = 0; i < sortedNumbers.length - 2; i++) {
            for (let j = i + 1; j < sortedNumbers.length - 1; j++) {
                for (let k = j + 1; k < sortedNumbers.length; k++) {
                    const trio = [sortedNumbers[i], sortedNumbers[j], sortedNumbers[k]];
                    const trioKey = trio.join('-');
                    trioCounts.set(trioKey, (trioCounts.get(trioKey) || 0) + 1);
                }
            }
        }
    }
    
    // Convert to array of [trioKey, count] and sort by count (descending)
    const sortedTriplets = Array.from(trioCounts.entries())
        .filter(([_, count]) => count >= 2) // Only include trios that appear at least twice
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); // Sort by count, then by numbers
    
    console.log(`Analyzed ${draws.length} draws, found ${sortedTriplets.length} unique trios appearing 2+ times`);
    if (sortedTriplets.length > 0) {
        console.log('Top 5 most frequent trios:', sortedTriplets.slice(0, 5));
    }
    
    return sortedTriplets;
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

// Function to generate random unique numbers
function generateCash5UniqueNumbers(count, min, max, exclude = []) {
    const nums = new Set();
    const excludeSet = new Set(exclude);
    
    while (nums.size < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!excludeSet.has(num) && !nums.has(num)) {
            nums.add(num);
        }
    }
    return Array.from(nums).sort((a, b) => a - b);
}

// Function to generate all possible subsets of a given size from an array
function getSubsets(numbers, size) {
    const result = [];
    const generate = (start, current) => {
        if (current.length === size) {
            result.push([...current].sort((a, b) => a - b));
            return;
        }
        for (let i = start; i < numbers.length; i++) {
            current.push(numbers[i]);
            generate(i + 1, current);
            current.pop();
        }
    };
    generate(0, []);
    return result;
}

// Function to count how many times a subset appears in the historical data
function countSubsetOccurrences(subset, historicalData) {
    if (!historicalData || !Array.isArray(historicalData) || !subset || !Array.isArray(subset)) {
        console.error('Invalid input to countSubsetOccurrences', {subset, historicalData});
        return 0;
    }
    
    const count = historicalData.reduce((total, draw) => {
        if (!draw || !draw.mainArr || !Array.isArray(draw.mainArr)) return total;
        return total + (subset.every(num => draw.mainArr.includes(num)) ? 1 : 0);
    }, 0);
    
    return count;
}

// Function to generate a combination from frequent trios
function generateFromFrequentTrios() {
    if (!window.sortedTriplets || window.sortedTriplets.length === 0) {
        console.error('No sortedTriplets data available');
        // Fallback to random generation if no trios available
        const nums = generateCash5UniqueNumbers(5, 1, 42);
        return {
            combination: nums.sort((a, b) => a - b),
            basedOnTrio: ''
        };
    }
    
    try {
        // Get top 10 most frequent trios (or all if less than 10)
        const topTrios = window.sortedTriplets.slice(0, Math.min(10, window.sortedTriplets.length));
        if (topTrios.length === 0) {
            console.log('No frequent trios found, falling back to random generation');
            const nums = generateCash5UniqueNumbers(5, 1, 42);
            return {
                combination: nums.sort((a, b) => a - b),
                basedOnTrio: ''
            };
        }
        
        // Select a random trio from top frequent trios
        const selectedTrio = topTrios[Math.floor(Math.random() * topTrios.length)];
        const [n1, n2, n3] = selectedTrio[0].split('-').map(Number);
        
        // Generate 2 more unique numbers not in the trio
        const exclude = [n1, n2, n3];
        const additionalNumbers = generateCash5UniqueNumbers(2, 1, 42, exclude);
        
        const combination = [...[n1, n2, n3], ...additionalNumbers].sort((a, b) => a - b);
        return {
            combination: combination,
            basedOnTrio: `${n1}-${n2}-${n3}`,
            frequency: selectedTrio[1] // Include the frequency count
        };
    } catch (error) {
        console.error('Error in generateFromFrequentTrios:', error);
        // Fallback to random generation on error
        const nums = generateCash5UniqueNumbers(5, 1, 42);
        return {
            combination: nums.sort((a, b) => a - b),
            basedOnTrio: ''
        };
    }
}

// Get trio occurrence information for Cash5 patterned trio generation
function getCash5TrioOccurrenceInfo(trio) {
    if (!window.cash5DrawRows || !Array.isArray(window.cash5DrawRows)) {
        return { count: 0, duoCount: 0, dates: [] };
    }
    
    const trioKey = trio.sort((a, b) => a - b).join('-');
    let count = 0;
    let dates = [];
    
    // Count trio occurrences
    for (const draw of window.cash5DrawRows) {
        if (!draw.mainArr || !Array.isArray(draw.mainArr)) continue;
        
        // Check if all three numbers are in this draw
        if (trio.every(num => draw.mainArr.includes(num))) {
            count++;
            if (draw.date) dates.push(draw.date);
        }
    }
    
    // Count duo occurrences (any pair from the trio)
    let duoCount = 0;
    const duos = [
        [trio[0], trio[1]],
        [trio[0], trio[2]], 
        [trio[1], trio[2]]
    ];
    
    for (const duo of duos) {
        for (const draw of window.cash5DrawRows) {
            if (!draw.mainArr || !Array.isArray(draw.mainArr)) continue;
            if (duo.every(num => draw.mainArr.includes(num))) {
                duoCount++;
                break; // Only count once per draw for this duo
            }
        }
    }
    
    return { count, duoCount, dates };
}

// Generate combinations from overlapping trios for Cash5
function generateFromCash5OverlappingTrios() {
    if (!window.sortedTriplets || window.sortedTriplets.length === 0) {
        return null;
    }
    
    try {
        // Get a random trio from frequent trios
        const randomIndex = Math.floor(Math.random() * Math.min(20, window.sortedTriplets.length));
        const selectedTrio = window.sortedTriplets[randomIndex];
        const trioNumbers = selectedTrio[0].split('-').map(Number);
        
        // Generate 2 additional numbers
        const exclude = [...trioNumbers];
        const additionalNumbers = generateCash5UniqueNumbers(2, 1, 42, exclude);
        
        const combination = [...trioNumbers, ...additionalNumbers].sort((a, b) => a - b);
        
        return {
            combination: combination,
            basedOnTrio: selectedTrio[0],
            frequency: selectedTrio[1]
        };
    } catch (error) {
        console.error('Error in generateFromCash5OverlappingTrios:', error);
        return null;
    }
}

// Cash5 Patterned Trio Generator - adapted from Powerball version
function generateCash5PatternedTrioCombinations() {
    // Round robin high ending logic adapted for Cash5 (1-42 range)
    const fixedHighRanges = [35, 30, 25, 20]; // Adjusted for Cash5 range
    let rrIndex = 0;
    
    function getNextHighEndingRange() {
        const range = fixedHighRanges[rrIndex % fixedHighRanges.length];
        rrIndex++;
        return range;
    }
    
    const combinations = [];
    const maxAttempts = 200;
    let attempts = 0;
    
    // Define occurrence patterns adapted for Cash5
    const occurrencePatterns = [
        // Trio-Trio patterns
        { name: '1x-1x', type: 'trio-trio', minOccurrences: 1, maxOccurrences: 1 },
        { name: '1x-2x', type: 'trio-trio', minOccurrences: 1, maxOccurrences: 2 },
        { name: '1x-3x', type: 'trio-trio', minOccurrences: 1, maxOccurrences: 3 },
        { name: '2x-2x', type: 'trio-trio', minOccurrences: 2, maxOccurrences: 2 },
        { name: '2x-3x', type: 'trio-trio', minOccurrences: 2, maxOccurrences: 3 },
        { name: '3x-3x', type: 'trio-trio', minOccurrences: 3, maxOccurrences: 3 },
        
        // Trio-Duo patterns
        { name: 'trio(1x)-duo(2x)', type: 'trio-duo', trioOccurrences: 1, duoOccurrences: 2 },
        { name: 'trio(1x)-duo(3x)', type: 'trio-duo', trioOccurrences: 1, duoOccurrences: 3 },
        { name: 'trio(2x)-duo(2x)', type: 'trio-duo', trioOccurrences: 2, duoOccurrences: 2 },
        { name: 'trio(2x)-duo(3x)', type: 'trio-duo', trioOccurrences: 2, duoOccurrences: 3 },
        { name: 'trio(3x)-duo(3x)', type: 'trio-duo', trioOccurrences: 3, duoOccurrences: 3 }
    ];
    
    // Initialize tracking variables
    if (!window.cash5UsedTrioPatterns) {
        window.cash5UsedTrioPatterns = new Map();
        window.cash5AllUsedTrios = new Set();
        window.cash5UsedTrioCombinations = new Set();
        occurrencePatterns.forEach(pattern => {
            window.cash5UsedTrioPatterns.set(pattern.name, new Set());
        });
    }
    
    // Reset tracking if starting new generation
    if (window.cash5CurrentPatternIndex === undefined || window.cash5CurrentPatternIndex >= occurrencePatterns.length) {
        window.cash5CurrentPatternIndex = 0;
        window.cash5AllUsedTrios.clear();
        window.cash5UsedTrioCombinations.clear();
        for (const pattern of occurrencePatterns) {
            const usedTrios = window.cash5UsedTrioPatterns.get(pattern.name);
            if (usedTrios) usedTrios.clear();
        }
    }
    
    if (window.cash5HighNumberCounter === undefined) {
        window.cash5HighNumberCounter = 0;
    }
    
    // Generate combinations for each pattern
    while (combinations.length < 5 && attempts < maxAttempts) {
        attempts++;
        
        const pattern = occurrencePatterns[window.cash5CurrentPatternIndex % occurrencePatterns.length];
        window.cash5CurrentPatternIndex++;
        
        const usedTrios = window.cash5UsedTrioPatterns.get(pattern.name);
        
        let trio1 = null, trio2 = null;
        let trio1Info = null, trio2Info = null;
        
        const targetHighRange = getNextHighEndingRange();
        function isTrioInTargetRange(trio, requireHigh = false) {
            const max = Math.max(...trio);
            if (requireHigh && targetHighRange === 35) {
                return max >= 35 && max <= 42; // Cash5 high range
            }
            return max >= targetHighRange && max < targetHighRange + 7; // Adjusted for Cash5
        }
        
        // Try to find matching pair of trios
        for (let i = 0; i < 30; i++) {
            const result1 = generateFromCash5OverlappingTrios();
            if (!result1 || !result1.combination) continue;
            
            const t1 = result1.combination.slice(0, 3).sort((a, b) => a - b);
            const t1Key = t1.join(',');
            const t1Info = getCash5TrioOccurrenceInfo(t1);
            
            if (!isTrioInTargetRange(t1, targetHighRange === 35)) continue;
            if (window.cash5AllUsedTrios.has(t1Key)) continue;
            if (t1Info.count === 0 || t1Info.count > 3) continue;
            
            if (pattern.type === 'trio-trio' && (t1Info.count < pattern.minOccurrences || t1Info.count === 0)) {
                continue;
            } else if (pattern.type === 'trio-duo' && (t1Info.count !== pattern.trioOccurrences || t1Info.duoCount === 0)) {
                continue;
            }
            
            // Find second trio
            for (let j = 0; j < 15; j++) {
                const result2 = generateFromCash5OverlappingTrios();
                if (!result2 || !result2.combination) continue;
                
                const t2 = result2.combination.slice(0, 3).sort((a, b) => a - b);
                const t2Key = t2.join(',');
                const t2Info = getCash5TrioOccurrenceInfo(t2);
                
                if (!isTrioInTargetRange(t2, targetHighRange === 35)) continue;
                if (t2Info.count === 0 || t2Info.count > 3) continue;
                if (t1Key === t2Key || window.cash5AllUsedTrios.has(t2Key)) continue;
                
                // Check pattern requirements
                if (pattern.type === 'trio-trio') {
                    if (t2Info.count > pattern.maxOccurrences || t2Info.count === 0) continue;
                } else if (pattern.type === 'trio-duo') {
                    const isTrioMatch = (t1Info.count === pattern.trioOccurrences && t2Info.duoCount === pattern.duoOccurrences) ||
                                     (t2Info.count === pattern.trioOccurrences && t1Info.duoCount === pattern.duoOccurrences);
                    if (!isTrioMatch) continue;
                }
                
                // Check if trios share at least one number
                const sharedNumbers = t1.filter(num => t2.includes(num));
                if (sharedNumbers.length === 0) continue;
                
                const pairKey = `${t1Key}|${t2Key}`;
                if (usedTrios.has(pairKey)) continue;
                
                trio1 = t1;
                trio2 = t2;
                trio1Info = t1Info;
                trio2Info = t2Info;
                usedTrios.add(pairKey);
                break;
            }
            
            if (trio1 && trio2) break;
        }
        
        if (!trio1 || !trio2) continue;
        
        // Create combination from both trios
        const allNumbers = [...new Set([...trio1, ...trio2])];
        let combination = [];
        
        // Weighted selection favoring higher numbers for Cash5
        const pool = [...allNumbers];
        while (combination.length < 5 && pool.length > 0) {
            const weights = pool.map(n => {
                if (n >= 30) return 3; // Higher weight for numbers 30-42
                return 1;
            });
            
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let random = Math.random() * totalWeight;
            let selectedIndex = 0;
            
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    selectedIndex = i;
                    break;
                }
            }
            
            combination.push(pool[selectedIndex]);
            pool.splice(selectedIndex, 1);
        }
        
        // Ensure balanced high/low numbers for Cash5
        const hasHighNumber = combination.some(n => n >= 25);
        const hasLowNumber = combination.some(n => n <= 24);
        
        if (!hasHighNumber || !hasLowNumber) {
            const allAvailable = [...new Set([...trio1, ...trio2])];
            const neededType = !hasHighNumber ? n => n >= 25 : n => n <= 24;
            const candidates = allAvailable.filter(neededType);
            
            if (candidates.length > 0) {
                const replaceIndex = Math.floor(Math.random() * combination.length);
                const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
                combination[replaceIndex] = randomCandidate;
            }
        }
        
        // Fill remaining spots if needed
        if (combination.length < 5) {
            const allAvailable = [...new Set([...trio1, ...trio2])];
            const remainingNumbers = allAvailable.filter(n => !combination.includes(n));
            
            const spotsToFill = 5 - combination.length;
            if (remainingNumbers.length > 0) {
                const toAdd = Math.min(spotsToFill, remainingNumbers.length);
                combination.push(...remainingNumbers.slice(0, toAdd));
            }
            
            while (combination.length < 5) {
                const generateHigh = Math.random() < 0.6; // 60% chance for high numbers
                let randomNum;
                
                if (generateHigh) {
                    randomNum = Math.floor(Math.random() * 18) + 25; // 25-42
                } else {
                    randomNum = Math.floor(Math.random() * 24) + 1; // 1-24
                }
                
                if (!combination.includes(randomNum)) {
                    combination.push(randomNum);
                }
            }
        }
        
        // Ensure exactly 5 unique numbers
        combination = [...new Set(combination)];
        if (combination.length < 5) {
            const allNumbers = new Set([...trio1, ...trio2]);
            while (combination.length < 5) {
                const randomNum = Math.floor(Math.random() * 42) + 1;
                if (!allNumbers.has(randomNum)) {
                    combination.push(randomNum);
                    allNumbers.add(randomNum);
                }
            }
        }
        
        combination = combination.sort((a, b) => a - b);
        
        // Mark trios as used
        window.cash5AllUsedTrios.add(trio1.join(','));
        window.cash5AllUsedTrios.add(trio2.join(','));
        window.cash5HighNumberCounter++;
        
        combinations.push({
            numbers: combination,
            pattern: pattern.name,
            trio1: trio1.join('-'),
            trio2: trio2.join('-'),
            trio1Info: trio1Info,
            trio2Info: trio2Info
        });
    }
    
    return combinations;
}

// Function to render patterned trio combinations with detailed information
function renderCash5PatternedCombinations() {
    const container = document.getElementById('cash5-generated-table');
    if (!container || !window.cash5DrawRows) return;
    
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #e67e22, #f39c12); color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);">
            <div style="margin-right: 15px;">
                <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <div style="font-weight: bold; font-size: 16px;">Generating Patterned Trio Combinations...</div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    
    // Generate patterned combinations
    const patternedCombos = generateCash5PatternedTrioCombinations();
    
    if (!patternedCombos || patternedCombos.length === 0) {
        container.innerHTML = `
            <div style="color: #e74c3c; padding: 30px; text-align: center; background: #fff5f5; border: 2px dashed #e74c3c; border-radius: 10px;">
                <h3 style="margin: 0 0 10px 0; color: #e74c3c;">Unable to Generate Combinations</h3>
                <p style="margin: 0; color: #666;">Please ensure historical data is loaded and try again.</p>
            </div>
        `;
        return;
    }
    
    // Create modern card-based layout
    let cardsHtml = `<div style="display: grid; gap: 20px; margin-bottom: 30px;">`;
    
    patternedCombos.forEach((combo, index) => {
        const nums = combo.numbers.sort((a, b) => a - b);
        
        // Count occurrences for each subset size
        const subsets = {
            pairs: getSubsets(nums, 2),
            trios: getSubsets(nums, 3),
            quads: getSubsets(nums, 4),
            full: [nums]
        };
        
        // Count pairs, trios, quads
        const pairCounts = subsets.pairs.map(pair => ({
            subset: pair,
            count: countSubsetOccurrences(pair, window.cash5DrawRows)
        })).filter(item => item.count > 0);
        
        const trioCounts = subsets.trios.map(trio => ({
            subset: trio,
            count: countSubsetOccurrences(trio, window.cash5DrawRows)
        })).filter(item => item.count > 1);
        
        const quadCounts = subsets.quads.map(quad => ({
            subset: quad,
            count: countSubsetOccurrences(quad, window.cash5DrawRows)
        })).filter(item => item.count > 0);
        
        const fullCount = countSubsetOccurrences(nums, window.cash5DrawRows);
        
        // Format subset strings with better styling
        const formatSubsets = (items, color) => {
            return items.map(item => 
                `<span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; font-weight: bold; margin: 1px;">${item.subset.join('-')} (${item.count}×)</span>`
            ).join(' ');
        };
        
        // Create enhanced balls display
        const ballsHtml = nums.map((n, i) => {
            const isHigh = n >= 25;
            const bgColor = isHigh ? '#e67e22' : '#3498db';
            const delay = i * 0.1;
            return `<span style='
                margin: 0 2px; 
                padding: 6px 8px; 
                background: linear-gradient(135deg, ${bgColor}, ${isHigh ? '#f39c12' : '#5dade2'}); 
                color: white; 
                border-radius: 50%; 
                font-weight: bold; 
                display: inline-block; 
                min-width: 20px; 
                text-align: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                animation: bounceIn 0.6s ease-out ${delay}s both;
                font-size: 12px;
            '>${n}</span>`;
        }).join('');
        
        // Pattern info
        const patternColor = combo.pattern.includes('trio-trio') ? '#9b59b6' : '#e67e22';
        
        cardsHtml += `
            <div style="
                background: white; 
                border-radius: 12px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                padding: 16px; 
                border: 1px solid #f0f0f0;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 18px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'">
                
                <!-- Card Header -->
                <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 12px;">
                    <div style="
                        background: ${patternColor}; 
                        color: white; 
                        padding: 4px 8px; 
                        border-radius: 16px; 
                        font-size: 10px; 
                        font-weight: bold;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    ">${combo.pattern}</div>
                </div>
                
                <!-- Numbers Display -->
                <div style="text-align: center; margin: 16px 0;">
                    <div style="margin-bottom: 8px; color: #7f8c8d; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Numbers</div>
                    <div>${ballsHtml}</div>
                </div>
                
                <!-- Pattern Details -->
                <div style="
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef); 
                    padding: 10px; 
                    border-radius: 8px; 
                    margin: 12px 0;
                    border-left: 3px solid ${patternColor};
                ">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                        <div>
                            <div style="color: #495057; font-weight: 600; margin-bottom: 3px;">Base Trio 1</div>
                            <div style="color: #6c757d;">${combo.trio1} <span style="background: #28a745; color: white; padding: 1px 4px; border-radius: 8px; font-size: 9px;">${combo.trio1Info.count}× hits</span></div>
                        </div>
                        <div>
                            <div style="color: #495057; font-weight: 600; margin-bottom: 3px;">Base Trio 2</div>
                            <div style="color: #6c757d;">${combo.trio2} <span style="background: #28a745; color: white; padding: 1px 4px; border-radius: 8px; font-size: 9px;">${combo.trio2Info.count}× hits</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Historical Analysis -->
                <div style="margin-top: 12px;">
                    <div style="color: #495057; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; font-size: 12px;">
                        Historical Subset Analysis
                    </div>
                    
                    ${fullCount > 0 ? `
                        <div style="margin-bottom: 6px; padding: 6px 8px; background: #d4edda; border-radius: 6px; border-left: 2px solid #28a745; font-size: 11px;">
                            <strong style="color: #155724;">EXACT MATCH:</strong> <span style="color: #155724;">This exact combination appeared ${fullCount} time${fullCount > 1 ? 's' : ''} in history!</span>
                        </div>
                    ` : ''}
                    
                    ${quadCounts.length > 0 ? `
                        <div style="margin-bottom: 4px;">
                            <span style="color: #6c757d; font-size: 11px; font-weight: 600;">4-Number Matches:</span><br>
                            ${formatSubsets(quadCounts.sort((a, b) => b.count - a.count), '#17a2b8')}
                        </div>
                    ` : ''}
                    
                    ${trioCounts.length > 0 ? `
                        <div style="margin-bottom: 4px;">
                            <span style="color: #6c757d; font-size: 11px; font-weight: 600;">3-Number Matches:</span><br>
                            ${formatSubsets(trioCounts.sort((a, b) => b.count - a.count), '#28a745')}
                        </div>
                    ` : ''}
                    
                    ${pairCounts.length > 0 ? `
                        <div style="margin-bottom: 4px;">
                            <span style="color: #6c757d; font-size: 11px; font-weight: 600;">2-Number Matches:</span><br>
                            ${formatSubsets(pairCounts.sort((a, b) => b.count - a.count).slice(0, 6), '#6f42c1')}
                            ${pairCounts.length > 6 ? `<span style="color: #6c757d; font-size: 10px;">... and ${pairCounts.length - 6} more</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${pairCounts.length === 0 && trioCounts.length === 0 && quadCounts.length === 0 && fullCount === 0 ? `
                        <div style="color: #6c757d; font-style: italic; text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 11px;">
                            This is a completely new combination pattern!
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    cardsHtml += `</div>
        <style>
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
        </style>`;
    
    container.innerHTML = cardsHtml;
}

// Function to render the generated combinations with subset occurrences
function renderCash5Combinations(count, useFrequentTrios = false) {
    const container = document.getElementById('cash5-generated-table');
    if (!container || !window.cash5DrawRows) return;
    
    const loadingText = useFrequentTrios 
        ? 'Generating combinations from frequent trios...' 
        : 'Generating ' + count + ' combinations...';
    container.innerHTML = '<div style="margin-bottom: 10px; font-weight: bold;">' + loadingText + '</div>';
    
    // Generate combinations
    const combinations = [];
    for (let i = 0; i < count; i++) {
        let nums, basedOnTrio = '';
        
        if (useFrequentTrios) {
            const result = generateFromFrequentTrios();
            if (result) {
                nums = result.combination;
                basedOnTrio = result.basedOnTrio;
            } else {
                // Fallback to random generation if frequent trios fails
                nums = generateCash5UniqueNumbers(5, 1, 42);
            }
        } else {
            nums = generateCash5UniqueNumbers(5, 1, 42);
        }
        
        combinations.push({
            numbers: nums,
            basedOnTrio: basedOnTrio,
            subsets: {
                pairs: getSubsets(nums, 2),
                trios: getSubsets(nums, 3),
                quads: getSubsets(nums, 4),
                full: [nums]
            }
        });
    }
    
    // Create table
    let table = '<table class="results-table" style="width:100%; border-collapse: collapse; font-size: 14px;">';
    table += '<tr><th style="width:50px; text-align:left;">#</th><th style="text-align:left;">Numbers</th><th style="text-align:left;">Subset Occurrences</th></tr>';
    
    combinations.forEach((combo, index) => {
        const nums = combo.numbers.sort((a, b) => a - b);
        
        // Count occurrences for each subset size
        const subsetCounts = {};
        
        // Count pairs (2-number combinations)
        const pairCounts = combo.subsets.pairs.map(pair => ({
            subset: pair,
            count: countSubsetOccurrences(pair, window.cash5DrawRows)
        })).filter(item => item.count > 0);
        
        // Count trios (3-number combinations)
        const trioCounts = combo.subsets.trios.map(trio => ({
            subset: trio,
            count: countSubsetOccurrences(trio, window.cash5DrawRows)
        })).filter(item => item.count > 1); // Only show if occurred more than once
        
        // Count quads (4-number combinations)
        const quadCounts = combo.subsets.quads.map(quad => ({
            subset: quad,
            count: countSubsetOccurrences(quad, window.cash5DrawRows)
        })).filter(item => item.count > 0);
        
        // Count full set (5-number combination)
        const fullCount = countSubsetOccurrences(nums, window.cash5DrawRows);
        
        // Format subset strings
        const formatSubsets = (items) => {
            return items.map(item => ({
                text: item.subset.join('-'),
                count: item.count
            })).sort((a, b) => b.count - a.count);
        };
        
        const pairStrings = formatSubsets(pairCounts);
        const trioStrings = formatSubsets(trioCounts);
        const quadStrings = formatSubsets(quadCounts);
        
        // Build the subsets display
        let subsetsHtml = '<div style="line-height: 1.6;">';
        
        if (fullCount > 0) {
            subsetsHtml += `<div><strong>Full Set (5):</strong> ${nums.join('-')} (${fullCount}x)</div>`;
        }
        
        if (quadStrings.length > 0) {
            subsetsHtml += `<div><strong>4-number:</strong> ${quadStrings.map(s => `${s.text}(${s.count}x)`).join(', ')}</div>`;
        }
        
        if (trioStrings.length > 0) {
            subsetsHtml += `<div><strong>3-number:</strong> ${trioStrings.map(s => `${s.text}(${s.count}x)`).join(', ')}</div>`;
        }
        
        if (pairStrings.length > 0) {
            subsetsHtml += `<div><strong>2-number:</strong> ${pairStrings.map(s => `${s.text}(${s.count}x)`).join(', ')}</div>`;
        }
        
        subsetsHtml += '</div>';
        
        // Highlight the trio in the combination if it was based on a frequent trio
        const renderNumber = (num) => {
            const isInTrio = combo.basedOnTrio && combo.basedOnTrio.split('-').includes(num.toString());
            return `<span class="ball" style="
                display:inline-block; 
                width:28px; 
                height:28px; 
                line-height:28px; 
                text-align:center; 
                border-radius:50%; 
                background:${isInTrio ? '#9b59b6' : '#27ae60'}; 
                color:white; 
                margin:2px;
                font-size: 0.9em;
                ${isInTrio ? 'border: 2px solid #8e44ad;' : ''}
                ${isInTrio ? 'font-weight: bold;' : ''}
            ">${num}</span>`;
        };

        table += `
        <tr>
            <td style="text-align:left; padding:8px; border:1px solid #ddd; vertical-align:top;">${index + 1}</td>
            <td style="padding:8px; border:1px solid #ddd; vertical-align:top;">
                <div style="margin-bottom: 5px;">${nums.map(n => renderNumber(n)).join(' ')}</div>
                ${combo.basedOnTrio ? 
                    `<div style="font-size: 0.85em; color: #9b59b6; margin-top: 5px;">
                        Based on trio: ${combo.basedOnTrio}
                    </div>` 
                    : ''
                }
            </td>
            <td style="padding:8px; border:1px solid #ddd; vertical-align:top;">
                ${subsetsHtml}
            </td>
        </tr>`;
    });
    
    table += '</table>';
    container.innerHTML = table;
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
    document.querySelectorAll('.cash5-multi-gen-btn:not(#cash5-generate-from-trios)').forEach(btn => {
        btn.onclick = function() {
            const count = parseInt(btn.getAttribute('data-count'), 10);
            renderCash5Combinations(count);
        };
    });
    
    // From Frequent Trios button
    const generateFromTriosBtn = document.getElementById('cash5-generate-from-trios');
    if (generateFromTriosBtn) {
        generateFromTriosBtn.onclick = function() {
            if (!window.sortedTriplets || window.sortedTriplets.length === 0) {
                alert('Loading frequent trios data... Please try again in a moment.');
                return;
            }
            renderCash5Combinations(5, true);
        };
    }
    
    // Patterned Trio Generator button
    const generatePatternedTriosBtn = document.getElementById('cash5-generate-patterned-trios');
    if (generatePatternedTriosBtn) {
        generatePatternedTriosBtn.onclick = function() {
            if (!window.sortedTriplets || window.sortedTriplets.length === 0) {
                alert('Loading frequent trios data... Please try again in a moment.');
                return;
            }
            renderCash5PatternedCombinations();
        };
    }

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
            let extra = generateCash5UniqueNumbers(1, 1, 42, nums)[0];
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
    const container = document.getElementById('cash5-new-ball-panel');
    if (!container) return;
    
    // Initialize if not exists - using consistent name cash5SelectedNew
    window.cash5SelectedNew = window.cash5SelectedNew || [];
    
    let html = '';
    for (let i = 1; i <= 42; i++) {
        const isSelected = window.cash5SelectedNew.includes(i);
        html += `<div class="ball ${isSelected ? 'selected' : ''}" data-number="${i}">${i}</div>`;
    }
    container.innerHTML = html;
    
    // Add click handlers
    container.querySelectorAll('.ball').forEach(ball => {
        ball.addEventListener('click', function() {
            const number = parseInt(this.getAttribute('data-number'));
            const index = window.cash5SelectedNew.indexOf(number);
            if (index === -1) {
                window.cash5SelectedNew.push(number);
            } else {
                window.cash5SelectedNew.splice(index, 1);
            }
            renderCash5NewBallPanel();
            renderCash5NewResults();
        });
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