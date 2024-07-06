const searchInput = document.getElementById('searchInput');
const protocolDropdown = document.getElementById('protocolDropdown');
let allProtocols = []; // Array to store all protocols for filtering

async function fetchProtocols() {
    const response = await fetch('get_protocols.php');
    allProtocols = await response.json(); // Store all protocols
    populateDropdown(allProtocols); // Populate initially
}

function populateDropdown(protocols) {
    protocolDropdown.innerHTML = ''; // Clear dropdown
    protocols.forEach(item => {
        const option = document.createElement('option');
        option.value = item.algorithmID; // Use algorithmID as value
        option.textContent = item.title;
        protocolDropdown.appendChild(option);
    });
}

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProtocols = allProtocols.filter(protocol => 
        protocol.title.toLowerCase().includes(searchTerm) // Filter on the title property
    );
    populateDropdown(filteredProtocols); 
});

// Initial fetch
fetchProtocols();


protocolDropdown.addEventListener('change', async () => {
    const algorithmID = protocolDropdown.value;

    const selectedProtocolName = protocolDropdown.options[protocolDropdown.selectedIndex].textContent;

    const confirmed = confirm(`Choose: ${selectedProtocolName}`);

    const response = await fetch(`get_questions.php?AlgorithmID=${algorithmID}`);
    const questionsByLevel = await response.json();

    console.log(`Fetching from: create_encounter.php?AlgorithmID=${algorithmID}`); // Log the URL

    const createEncounterResponse = await fetch(`create_encounter.php?AlgorithmID=${algorithmID}`);

    displayQuestions(questionsByLevel);
});