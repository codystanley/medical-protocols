const searchInput = document.getElementById('searchInput');
const protocolDropdown = document.getElementById('protocolDropdown');
let allQuestions = [];

async function fetchProtocols() {
    const response = await fetch('get_protocols.php');
    allProtocols = await response.json();
    populateDropdown(allProtocols);
}

function populateDropdown(protocols) {
    protocolDropdown.innerHTML = '';
    protocols.forEach(item => {
        const option = document.createElement('option');
        option.value = item.algorithmID;
        option.textContent = item.title;
        protocolDropdown.appendChild(option);
    });
}

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProtocols = allProtocols.filter(protocol => 
        protocol.title.toLowerCase().includes(searchTerm)
    );
    populateDropdown(filteredProtocols); 
});

fetchProtocols();


protocolDropdown.addEventListener('change', async () => {
    const algorithmID = protocolDropdown.value;

    const selectedProtocolName = protocolDropdown.options[protocolDropdown.selectedIndex].textContent;

    const confirmed = confirm(`Choose: ${selectedProtocolName}`);

    const response = await fetch(`get_questions.php?AlgorithmID=${algorithmID}`);
    const questionsByLevel = await response.json();

    console.log(`Fetching from: create_encounter.php?AlgorithmID=${algorithmID}`); // Log the URL

    const createEncounterResponse = await fetch(`create_encounter.php?AlgorithmID=${algorithmID}`);
    const encounterData = await createEncounterResponse.json();

    if (encounterData.encounterID) { // Check if encounterID was created
        currentEncounterID = encounterData.encounterID;
    } 

    displayQuestions(questionsByLevel);

    // Enable the End Encounter button here, after the questions are loaded
    document.getElementById('endEncounterBtn').disabled = false;
});

function displayQuestions(questionsByHeading) {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = ''; 

    const sortedLevels = Object.keys(questionsByHeading).sort((a, b) => b - a);

    sortedLevels.forEach(level => {
        // Create Bootstrap card container
        const card = document.createElement('div');
        card.classList.add('card', 'mb-3'); 

        // Create card header
        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');
        cardHeader.textContent = `${level}`;
        card.appendChild(cardHeader);

        // Create card body 
        const cardBody = document.createElement('div'); 
        cardBody.classList.add('card-body');

        const questionList = document.createElement('ul');
        questionList.classList.add('question-list');

        allQuestions = Object.values(questionsByHeading).flat();

        questionsByHeading[level].forEach(question => {
            const listItem = document.createElement('li');
            listItem.textContent = question.Question;
            listItem.classList.add('question-item');
            listItem.title = question.Information;
            listItem.setAttribute('data-bs-toggle', 'tooltip');
            let currentStatus = question.Status || 'normal';
            listItem.classList.add(`selected-${currentStatus}`);

            // Event Delegation for click events on list items
            listItem.addEventListener('click', async() => {
                let newStatus = currentStatus;

                if (listItem.classList.contains('selected-green')) {
                    const confirmed = confirm(`Choose: ${question.Question}`);
                    if (!confirmed) {
                        return;
                    }
                    listItem.classList.remove('selected-green');
                    listItem.classList.add('selected-red');
                    newStatus = 'red';          // Add red if it was green
                } else if (listItem.classList.contains('selected-red')) {
                    listItem.classList.remove('selected-red');
                    newStatus = 'normal'       // Remove red if it was red
                } else {
                    listItem.classList.add('selected-green');
                    newStatus = 'green';       // Add green if neither
                }

                const encounterID = sessionStorage.getItem('encounterID');
                const questionID = question.QuestionID; 
                const response = await fetch('update_question_status.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `encounterID=${encounterID}&questionID=${questionID}&status=${newStatus}` 
                });


                    if (newStatus === 'red') {
                        fetchCareAdvice(question.QuestionID, listItem);
                        } else {
                            // Remove care advice if status is not 'red'
                            const careAdviceSection = listItem.parentElement.querySelector('.care-advice');
                            if (careAdviceSection) {
                                careAdviceSection.remove();
                            }
                        };

                const result = await response.json();
                if (result.statusUpdated && newStatus === 'red' && result.adviceIDs.length > 0) {
                    // Display Care Advice 
                    displayCareAdvice(result.adviceIDs, listItem); // Function to be implemented later
                } else {
                    // Remove care advice if status is not 'red'
                    const careAdviceSection = listItem.parentElement.querySelector('.care-advice');
                    if (careAdviceSection) {
                        careAdviceSection.remove();
                    }
                }
                        
            });

            questionList.appendChild(listItem);
        });
            cardBody.appendChild(questionList);
            card.appendChild(cardBody);
            questionsContainer.appendChild(card);

    });
            // Initialize Bootstrap tooltips (AFTER appending all list items)
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl)); // Use forEach here
}

async function fetchCareAdvice(questionID, listItem) {
    const isRed = listItem.classList.contains('selected-red');

    if (isRed) {

        console.log("Fetching care advice for QuestionID:", questionID);
        const adviceResponse = await fetch(`get_care_advice.php?QuestionID=${questionID}`);
        if (adviceResponse.ok) {
            const adviceData = await adviceResponse.json();
            console.log("Care advice data:", adviceData);

            if (Array.isArray(adviceData) && adviceData.length > 0) {
                displayCareAdvice(adviceData, listItem); 
            } else {
                alert("No care advice found for this question.");
            }
        } else {
            alert("Error fetching care advice.");
        }
    } else {
        const careAdviceSection = listItem.parentElement.querySelector('.care-advice');
        if (careAdviceSection) {
            careAdviceSection.remove();
        }
    }
}

function displayCareAdvice(adviceData, listItem) {
    const currentCard = listItem.closest('.card');
    const cardBody = currentCard.querySelector('.card-body'); // Get the cardBody from the currentCard

    // Remove the existing question list (ul element)
    const questionList = cardBody.querySelector('ul');
    if (questionList) {
        questionList.remove(); 
    }

    const adviceSection = document.createElement('div');
    adviceSection.classList.add('mt-3', 'care-advice'); // Add care-advice class
    const adviceHeading = document.createElement('h4');
    adviceHeading.textContent = "Care Advice:";
    adviceSection.appendChild(adviceHeading);

    const adviceForm = document.createElement('form');

    if (adviceData && Array.isArray(adviceData) && adviceData.length > 0) {
        adviceData.forEach(advice => {
            // Create a div to wrap the checkbox and label
            const adviceItem = document.createElement('div');
            adviceItem.classList.add('form-check','mb-2');
            
            // Create a checkbox input
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('form-check-input');  // Add Bootstrap form-check-input class
            checkbox.id = `advice-${advice.AdviceID}`;  // Set ID for the checkbox
            checkbox.name = 'advice';                    // Set name attribute
            checkbox.value = advice.AdviceID;            // Set value to AdviceID
            
            // Create a label for the checkbox
            const label = document.createElement('label');
            label.classList.add('form-check-label');   // Add Bootstrap form-check-label class
            label.htmlFor = checkbox.id;                // Associate the label with the checkbox
            label.textContent = advice;      // Set the text of the label

            // Append the checkbox and label to the adviceItem div
            adviceItem.appendChild(checkbox);
            adviceItem.appendChild(label);

            // Append the adviceItem to the form
            adviceForm.appendChild(adviceItem);
        });
    } else {
        // Handle the case where there's no advice to display (e.g., show a message)
        const noAdviceItem = document.createElement('div');
        noAdviceItem.classList.add('form-check');
        noAdviceItem.textContent = "No care advice found.";
        adviceForm.appendChild(noAdviceItem);
    }

    adviceSection.appendChild(adviceForm);
    cardBody.appendChild(adviceSection); 
}

async function endEncounter() {
    if (!currentEncounterID) {
        alert("No active encounter.");
        return;
    }

    const selectedQuestions = [];
    const selectedAdvice = [];

    // Gather selected questions and advice
    document.querySelectorAll('.question-item.selected-green, .question-item.selected-red').forEach(item => {
        
        const questionID = item.textContent; // Extract question text
        const question = allQuestions.find(q => q.Question === questionID); // Find the original question object
        const adviceCheckboxes = item.closest('.card-body').querySelectorAll('.care-advice input[type="checkbox"]:checked');

        if (question) {
        selectedQuestions.push({
            questionID: question.QuestionID,
            status: item.classList.contains('selected-red') ? 'red' : 'green'
        });

        adviceCheckboxes.forEach(checkbox => {
            selectedAdvice.push({
                questionID: question.QuestionID,
                adviceID: checkbox.value
                });
            });
        }
        // Find associated care advice checkboxes if the question is red
        if (item.classList.contains('selected-red')) {
            const adviceCheckboxes = item.closest('.card-body').querySelectorAll('.care-advice input[type="checkbox"]:checked');
            adviceCheckboxes.forEach(checkbox => {
                selectedAdvice.push({
                    questionID: question.QuestionID,
                    adviceID: checkbox.value
                });
            });
        }
    });

    // Send data to server for saving
    const response = await fetch('save_encounter_details.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            encounterID: currentEncounterID,
            questions: selectedQuestions,
            advice: selectedAdvice
        })
    });

    if (response.ok) {
        alert("Encounter details saved successfully.");
        location.reload(true);
    } else {
        alert("Error saving encounter details.");
    }
}

document.getElementById('endEncounterBtn').addEventListener('click', endEncounter);
