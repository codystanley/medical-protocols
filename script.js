const searchInput = document.getElementById('searchInput');
const protocolDropdown = document.getElementById('protocolDropdown');
let allProtocols = []; // Array to store all protocols for filtering
let currentEncounterID = null;

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
    const encounterData = await createEncounterResponse.json();

    if (encounterData.encounterID) { // Check if encounterID was created
        currentEncounterID = encounterData.encounterID;
    } 

    displayQuestions(questionsByLevel);

    // Enable the End Encounter button here, after the questions are loaded
    document.getElementById('endEncounterBtn').disabled = false;
});


// Function to end the encounter
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
        
        selectedQuestions.push({
            questionID: question.QuestionID,
            status: item.classList.contains('selected-red') ? 'red' : 'green'
        });

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
        // Optionally, you can redirect to another page or clear the UI here
        questionsContainer.innerHTML = ''; // clear questions container
        protocolDropdown.selectedIndex = 0;  // reset dropdown
    } else {
        alert("Error saving encounter details.");
    }
}

// Add event listener to the end encounter button
document.getElementById('endEncounterBtn').addEventListener('click', endEncounter);


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

        questionsByHeading[level].forEach(question => {
            const listItem = document.createElement('li');
            listItem.textContent = question.Question;
            listItem.classList.add('question-item');
            listItem.title = question.Information;
            listItem.setAttribute('data-bs-toggle', 'tooltip');
            let newStatus = question.Status || 'normal';
            listItem.classList.add(`selected-${newStatus}`);

            // Event Delegation for click events on list items
            listItem.addEventListener('click', async() => {
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

                    if (newStatus === 'red') {
                        fetchCareAdvice(question.QuestionID, listItem);
                        } else {
                            // Remove care advice if status is not 'red'
                            const careAdviceSection = listItem.parentElement.querySelector('.care-advice');
                            if (careAdviceSection) {
                                careAdviceSection.remove();
                            }
                        };
                        
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
    console.log("Fetching care advice for QuestionID:", questionID);
    const adviceResponse = await fetch(`get_care_advice.php?QuestionID=${questionID}`);
    if (adviceResponse.ok) {
      const adviceData = await adviceResponse.json();
      console.log("Care advice data:", adviceData);
      if (Array.isArray(adviceData) && adviceData.length > 0) {
        displayCareAdvice(adviceData, listItem); 
      } else {
          // If no advice was found, display a message or handle it accordingly
          alert("No care advice found for this question.");
      }
    } else {
      alert("Error fetching care advice.");
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
