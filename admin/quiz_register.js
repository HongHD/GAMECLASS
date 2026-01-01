// quiz_register.js
// Handles dynamic addition of quiz questions and form submission

let questionCount = 0;
const questionsContainer = document.getElementById('questionsContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');

addQuestionBtn.addEventListener('click', addQuestion);

function addQuestion() {
  questionCount++;
  const card = document.createElement('div');
  card.className = 'question-card';
  card.dataset.index = questionCount;

  card.innerHTML = `
    <button type="button" class="remove-btn" title="Remove Question">✖</button>
    <label>Group</label>
    <input type="text" name="group_${questionCount}" required />
    <label>Title</label>
    <input type="text" name="title_${questionCount}" required />
    <label>Contents</label>
    <textarea name="contents_${questionCount}" maxlength="3000" required></textarea>
    <label>Option Type</label>
    <select name="option_type_${questionCount}" class="option-type-select" required>
      <option value="short">Short Answer</option>
      <option value="multiple">Multiple Choice (4)</option>
      <option value="ox">O/X</option>
    </select>
    <div class="options-container" style="display:none;">
      <label>Option 1</label>
      <input type="text" name="option1_${questionCount}" />
      <label>Option 2</label>
      <input type="text" name="option2_${questionCount}" />
      <label>Option 3</label>
      <input type="text" name="option3_${questionCount}" />
      <label>Option 4</label>
      <input type="text" name="option4_${questionCount}" />
    </div>
    <label>Answer</label>
    <input type="text" name="answer_${questionCount}" required />
  `;

  // Remove button handler
  card.querySelector('.remove-btn').addEventListener('click', () => {
    card.remove();
  });

  // Option type change handler
  const optionSelect = card.querySelector('.option-type-select');
  const optionsDiv = card.querySelector('.options-container');
  optionSelect.addEventListener('change', () => {
    if (optionSelect.value === 'multiple') {
      optionsDiv.style.display = 'block';
    } else {
      optionsDiv.style.display = 'none';
    }
  });

  questionsContainer.appendChild(card);
}

// Form submission
const quizForm = document.getElementById('quizForm');
quizForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(quizForm);
  const payload = [];
  for (let i = 1; i <= questionCount; i++) {
    // If the card was removed, skip missing indices
    if (!formData.has(`group_${i}`)) continue;
    const entry = {
      group: formData.get(`group_${i}`),
      title: formData.get(`title_${i}`),
      contents: formData.get(`contents_${i}`),
      option_type: formData.get(`option_type_${i}`),
      answer: formData.get(`answer_${i}`),
    };
    if (entry.option_type === 'multiple') {
      entry.option1 = formData.get(`option1_${i}`);
      entry.option2 = formData.get(`option2_${i}`);
      entry.option3 = formData.get(`option3_${i}`);
      entry.option4 = formData.get(`option4_${i}`);
    }
    payload.push(entry);
  }

  try {
    const response = await fetch('/api/quiz/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: payload }),
    });
    if (response.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const result = await response.json();
    if (response.ok) {
      alert('Quiz(s) registered successfully!');
      quizForm.reset();
      questionsContainer.innerHTML = '';
      questionCount = 0;
    } else {
      alert('Error: ' + (result.message || 'Failed to register'));
    }
  } catch (err) {
    console.error(err);
    alert('Network error while registering quizzes');
  }
});
