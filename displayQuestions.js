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
    const adviceResponse = await fetch(`get_care_advice.php?QuestionID=${questionID}`);
    if (adviceResponse.ok) {
      const adviceData = await adviceResponse.json();
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
            adviceItem.classList.add('form-check');
            
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
            label.textContent = advice.CareAdvice;      // Set the text of the label

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
