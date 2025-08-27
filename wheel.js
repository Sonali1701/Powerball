// Game patterns for the wheel
const GAME_PATTERNS = [
    ["A*", "B", "C", "D", "H", "J"],
    ["A*", "B", "C", "E", "G", "I"],
    ["A*", "B", "C", "F", "G", "I"],
    ["A*", "B", "D", "E", "I", "J"],
    ["A*", "B", "D", "F", "G", "J"],
    ["A*", "B", "E", "F", "H", "I"],
    ["A*", "B", "C", "H", "I", "J"],
    ["A*", "B", "D", "E", "G", "J"],
    ["A*", "C", "D", "F", "I", "J"],
    ["A*", "C", "D", "G", "H", "I"],
    ["A*", "C", "E", "F", "H", "J"],
    ["A*", "D", "E", "F", "C", "H"]
];

// Letters for the input fields (A* is the power number)
const LETTERS = ['A*', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Store the current number mappings
let numberMap = {};

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeInputs();
    setupEventListeners();
    generateDefaultValues();
});

// Set up input fields for numbers 1-10
function initializeInputs() {
    const container = document.querySelector('.number-inputs');
    
    LETTERS.forEach((letter, index) => {
        const isPowerNumber = letter === 'A*';
        const inputId = `num-${letter.replace('*', '')}`;
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'number-input';
        
        const label = document.createElement('label');
        label.htmlFor = inputId;
        label.innerHTML = isPowerNumber ? '<span class="power-number">A*</span>' : letter;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = inputId;
        input.min = '1';
        input.max = '69';
        input.placeholder = isPowerNumber ? 'Power #' : `#${index}`;
        input.dataset.letter = letter;
        
        // Add validation
        input.addEventListener('input', function() {
            validateNumberInput(this);
        });
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        container.appendChild(inputGroup);
    });
}

// Set up event listeners for buttons
function setupEventListeners() {
    document.getElementById('generate-btn').addEventListener('click', generateWheel);
    document.getElementById('download-btn').addEventListener('click', downloadTickets);
}

// Generate default values for testing
function generateDefaultValues() {
    const testNumbers = [7, 10, 15, 22, 28, 33, 40, 44, 52, 61];
    
    LETTERS.forEach((letter, index) => {
        const input = document.querySelector(`#num-${letter.replace('*', '')}`);
        if (input && testNumbers[index] !== undefined) {
            input.value = testNumbers[index];
        }
    });
    
    // Auto-generate the wheel with test numbers
    generateWheel();
}

// Validate number input
function validateNumberInput(input) {
    let value = parseInt(input.value);
    
    // Ensure value is between 1 and 69
    if (value < 1) input.value = 1;
    if (value > 69) input.value = 69;
    
    // Ensure no duplicates (except empty)
    if (input.value) {
        const inputs = document.querySelectorAll('.number-inputs input');
        inputs.forEach(otherInput => {
            if (otherInput !== input && otherInput.value === input.value) {
                input.value = '';
                alert('Please enter unique numbers between 1 and 69');
            }
        });
    }
}

// Generate the wheel based on user input
function generateWheel() {
    // Clear previous results
    document.getElementById('games-1-6').innerHTML = '';
    document.getElementById('games-7-12').innerHTML = '';
    document.getElementById('ticket-list').innerHTML = '';
    
    // Get all number inputs
    const inputs = document.querySelectorAll('.number-inputs input');
    let isValid = true;
    
    // Reset number map
    numberMap = {};
    
    // Validate all inputs and build number map
    inputs.forEach(input => {
        const letter = input.dataset.letter;
        const value = parseInt(input.value);
        
        if (isNaN(value)) {
            isValid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '';
            numberMap[letter] = value;
        }
    });
    
    if (!isValid) {
        alert('Please fill in all number fields with unique numbers between 1 and 69');
        return;
    }
    
    // Generate the wheel games
    GAME_PATTERNS.forEach((pattern, index) => {
        const gameNumber = index + 1;
        const gameElement = createGameElement(gameNumber, pattern);
        
        // Add to appropriate column
        const column = gameNumber <= 6 ? 'games-1-6' : 'games-7-12';
        document.getElementById(column).appendChild(gameElement);
        
        // Add to ticket list
        addToTicketList(gameNumber, pattern);
    });
}

// Create a game element for the wheel
function createGameElement(gameNumber, pattern) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game';
    
    const gameNumberSpan = document.createElement('div');
    gameNumberSpan.className = 'game-number';
    gameNumberSpan.textContent = `Game ${gameNumber}:`;
    
    const numbersDiv = document.createElement('div');
    numbersDiv.className = 'game-numbers';
    
    pattern.forEach(letter => {
        const number = numberMap[letter];
        const isPowerNumber = letter === 'A*';
        
        const numberBall = document.createElement('div');
        numberBall.className = `number-ball ${isPowerNumber ? 'power' : ''}`;
        numberBall.textContent = number;
        numberBall.title = isPowerNumber ? 'Power Number' : `Number ${letter}`;
        
        numbersDiv.appendChild(numberBall);
    });
    
    gameDiv.appendChild(gameNumberSpan);
    gameDiv.appendChild(numbersDiv);
    
    return gameDiv;
}

// Add game to the ticket list with improved formatting
function addToTicketList(gameNumber, pattern) {
    const ticketList = document.getElementById('ticket-list');
    
    // Create main ticket container
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket';
    ticketDiv.style.margin = '15px 0';
    ticketDiv.style.padding = '15px';
    ticketDiv.style.border = '1px solid #e0e0e0';
    ticketDiv.style.borderRadius = '8px';
    ticketDiv.style.backgroundColor = '#f9f9f9';
    
    // Create game number header
    const gameHeader = document.createElement('div');
    gameHeader.style.display = 'flex';
    gameHeader.style.justifyContent = 'space-between';
    gameHeader.style.marginBottom = '10px';
    gameHeader.style.paddingBottom = '8px';
    gameHeader.style.borderBottom = '1px solid #e0e0e0';
    
    const ticketTitle = document.createElement('div');
    ticketTitle.textContent = `Game ${gameNumber}`;
    ticketTitle.style.fontWeight = 'bold';
    ticketTitle.style.fontSize = '1.1em';
    ticketTitle.style.color = '#2c3e50';
    
    // Add pattern letters
    const patternLetters = document.createElement('div');
    patternLetters.textContent = pattern.join(' ');
    patternLetters.style.fontFamily = 'monospace';
    patternLetters.style.color = '#7f8c8d';
    
    gameHeader.appendChild(ticketTitle);
    gameHeader.appendChild(patternLetters);
    
    // Create numbers container
    const numbersContainer = document.createElement('div');
    numbersContainer.style.display = 'flex';
    numbersContainer.style.flexWrap = 'wrap';
    numbersContainer.style.gap = '8px';
    numbersContainer.style.alignItems = 'center';
    
    // Add regular numbers
    const displayPattern = [...pattern];
    const powerballIndex = displayPattern.indexOf('A*');
    let powerballNumber = '';
    
    if (powerballIndex !== -1) {
        powerballNumber = numberMap['A*'];
        displayPattern.splice(powerballIndex, 1);
    }
    
    // Add regular number balls
    displayPattern.forEach(letter => {
        const numberBall = document.createElement('div');
        numberBall.textContent = numberMap[letter];
        numberBall.style.width = '36px';
        numberBall.style.height = '36px';
        numberBall.style.borderRadius = '50%';
        numberBall.style.backgroundColor = '#3498db';
        numberBall.style.color = 'white';
        numberBall.style.display = 'flex';
        numberBall.style.alignItems = 'center';
        numberBall.style.justifyContent = 'center';
        numberBall.style.fontWeight = 'bold';
        numberBall.style.fontSize = '0.9em';
        
        // Add letter as a tooltip
        numberBall.title = `Letter: ${letter}`;
        
        numbersContainer.appendChild(numberBall);
    });
    
    // Add powerball if exists
    if (powerballNumber) {
        const powerball = document.createElement('div');
        powerball.textContent = powerballNumber;
        powerball.style.width = '36px';
        powerball.style.height = '36px';
        powerball.style.borderRadius = '50%';
        powerball.style.backgroundColor = '#e74c3c';
        powerball.style.color = 'white';
        powerball.style.display = 'flex';
        powerball.style.alignItems = 'center';
        powerball.style.justifyContent = 'center';
        powerball.style.fontWeight = 'bold';
        powerball.style.fontSize = '0.9em';
        powerball.title = 'Powerball (A*)';
        powerball.style.marginLeft = '10px';
        powerball.style.border = '2px solid #c0392b';
        
        numbersContainer.appendChild(powerball);
    }
    
    // Add hover effect
    ticketDiv.addEventListener('mouseenter', () => {
        ticketDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        ticketDiv.style.transform = 'translateY(-2px)';
    });
    
    ticketDiv.addEventListener('mouseleave', () => {
        ticketDiv.style.boxShadow = 'none';
        ticketDiv.style.transform = 'translateY(0)';
    });
    
    // Add transition for smooth effects
    ticketDiv.style.transition = 'all 0.2s ease-in-out';
    
    // Assemble the ticket
    ticketDiv.appendChild(gameHeader);
    ticketDiv.appendChild(numbersContainer);
    ticketList.appendChild(ticketDiv);
}

// Download tickets as CSV
function downloadTickets() {
    if (Object.keys(numberMap).length === 0) {
        alert('Please generate the wheel first');
        return;
    }
    
    let csvContent = 'Game,Numbers,Letter Mappings\n';
    
    // Add letter mappings at the top of the file
    const letterMappings = [];
    LETTERS.forEach(letter => {
        const cleanLetter = letter.replace('*', '');
        letterMappings.push(`${cleanLetter}=${numberMap[letter]}`);
    });
    
    GAME_PATTERNS.forEach((pattern, index) => {
        const gameNumber = index + 1;
        
        // Create a copy of the pattern to avoid modifying the original
        const sortedPattern = [...pattern];
        
        // Find and remove the Powerball (A*) from the pattern
        const powerballIndex = sortedPattern.indexOf('A*');
        let powerballNumber = '';
        
        if (powerballIndex !== -1) {
            powerballNumber = numberMap['A*'];
            sortedPattern.splice(powerballIndex, 1);
        }
        
        // Get the regular numbers
        const regularNumbers = sortedPattern.map(letter => numberMap[letter]);
        
        // Combine regular numbers with powerball at the end
        const allNumbers = [...regularNumbers];
        if (powerballNumber !== '') {
            allNumbers.push(powerballNumber);
        }
        
        // Get letter codes for this game
        const letterCodes = pattern.map(letter => {
            const cleanLetter = letter.replace('*', '');
            return `${cleanLetter}${letter.includes('*') ? '*' : ''}`;
        });
        
        // Add to CSV with both numbers and letter codes
        csvContent += `Game ${gameNumber},"${allNumbers.join(', ')}","${letterCodes.join(' ')}`;
        
        // Add letter mappings for the first game only
        if (index === 0) {
            csvContent += `\n\nLetter Mappings: ${letterMappings.join(', ')}`;
        }
        
        csvContent += '"\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `powerball-wheel-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
}
