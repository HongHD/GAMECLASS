// quiz_play.js - Quiz game logic
const urlParams = new URLSearchParams(window.location.search);
const groupName = urlParams.get('group');

const quizCard = document.getElementById('quizCard');
const completionCard = document.getElementById('completionCard');
const groupNameDisplay = document.getElementById('groupNameDisplay');
const progressDisplay = document.getElementById('progressDisplay');
const quizTitle = document.getElementById('quizTitle');
const quizContent = document.getElementById('quizContent');
const optionsGrid = document.getElementById('optionsGrid');
const shortAnswerArea = document.getElementById('shortAnswerArea');
const shortAnswerInput = document.getElementById('shortAnswerInput');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');

// Feedback Elements
const feedbackOverlay = document.getElementById('feedbackOverlay');
const feedbackText = document.getElementById('feedbackText');

let quizzes = [];
let currentIndex = 0;
let isProcessing = false; // Prevent double clicks

if (!groupName) {
    alert('No group specified.');
    window.location.href = 'main.html';
} else {
    groupNameDisplay.textContent = groupName;
    loadQuizzes();
}

async function loadQuizzes() {
    console.log(`Loading quizzes for group: ${groupName}`);
    try {
        const res = await fetch(`/api/quiz/group/${encodeURIComponent(groupName)}`);
        console.log(`Fetch status: ${res.status}`);

        if (!res.ok) throw new Error('Failed to load quizzes');
        quizzes = await res.json();
        console.log('Quizzes loaded:', quizzes);

        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            console.warn('No quizzes found or invalid format');
            alert('No quizzes in this group.');
            window.location.href = 'main.html';
            return;
        }

        renderQuestion();
    } catch (err) {
        console.error('Error in loadQuizzes:', err);
        alert('Error loading quizzes.');
    }
}

function renderQuestion() {
    console.log(`Rendering question index: ${currentIndex}`);
    if (!quizzes[currentIndex]) {
        console.error('Quiz index out of bounds:', currentIndex);
        return;
    }
    const q = quizzes[currentIndex];
    isProcessing = false;

    // Update UI
    progressDisplay.textContent = `Question ${currentIndex + 1} / ${quizzes.length}`;
    quizTitle.textContent = q.TITLE;
    quizContent.textContent = q.CONTENTS;

    // Image Handling
    const quizImageArea = document.getElementById('quizImageArea');
    const quizImage = document.getElementById('quizImage');
    if (q.IMAGE_URL) {
        quizImage.src = q.IMAGE_URL;
        quizImageArea.style.display = 'block';
    } else {
        quizImageArea.style.display = 'none';
        quizImage.src = '';
    }

    // Reset areas
    optionsGrid.innerHTML = '';
    optionsGrid.style.display = 'none';
    shortAnswerArea.style.display = 'none';
    shortAnswerInput.value = '';
    shortAnswerInput.disabled = false;
    submitAnswerBtn.disabled = false;

    if (q.OPTION_DISTINC === 'multiple' || q.OPTION_DISTINC === 'ox') {
        optionsGrid.style.display = 'flex';
        let options = [];

        if (q.OPTION_DISTINC === 'multiple') {
            options = [q.OPTION1, q.OPTION2, q.OPTION3, q.OPTION4];
        } else {
            options = ['O', 'X'];
        }

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => checkAnswer(btn, opt, q.ANSWER);
            optionsGrid.appendChild(btn);
        });
    } else {
        // Short answer
        shortAnswerArea.style.display = 'block';
        submitAnswerBtn.onclick = () => checkShortAnswer(q.ANSWER);
    }
}

function showFeedback(isCorrect, callback) {
    feedbackText.textContent = isCorrect ? '정답' : '오답';
    feedbackText.className = 'feedback-text ' + (isCorrect ? 'feedback-correct' : 'feedback-wrong');
    feedbackOverlay.classList.add('show');

    setTimeout(() => {
        feedbackOverlay.classList.remove('show');
        if (callback) callback();
    }, 1500); // Show for 1.5 seconds
}

async function recordSolved(quizNo) {
    try {
        await fetch('/api/quiz/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizNo })
        });
    } catch (err) {
        console.error('Failed to record progress:', err);
    }
}

function checkAnswer(btn, selected, correct) {
    if (isProcessing) return;
    isProcessing = true;

    if (selected === correct) {
        // Correct
        const q = quizzes[currentIndex];
        recordSolved(q.NO); // Record progress

        btn.classList.add('correct');
        showFeedback(true, () => {
            currentIndex++;
            if (currentIndex < quizzes.length) {
                renderQuestion();
            } else {
                showCompletion();
            }
        });
    } else {
        // Wrong
        btn.classList.add('wrong');
        showFeedback(false, () => {
            // Allow retry
            isProcessing = false;
            // Optionally remove 'wrong' class or keep it to show what was tried
            // Keeping it lets user know what they already clicked
        });
    }
}

function checkShortAnswer(correct) {
    if (isProcessing) return;

    const val = shortAnswerInput.value.trim();
    if (!val) {
        alert('Please enter an answer.');
        return;
    }

    isProcessing = true;
    shortAnswerInput.disabled = true;
    submitAnswerBtn.disabled = true;

    if (val === correct) {
        const q = quizzes[currentIndex];
        recordSolved(q.NO); // Record progress

        shortAnswerInput.style.borderColor = 'var(--success-color)';
        shortAnswerInput.style.color = 'var(--success-color)';
        showFeedback(true, () => {
            currentIndex++;
            if (currentIndex < quizzes.length) {
                renderQuestion();
            } else {
                showCompletion();
            }
        });
    } else {
        shortAnswerInput.style.borderColor = 'var(--error-color)';
        shortAnswerInput.style.color = 'var(--error-color)';
        showFeedback(false, () => {
            // Allow retry
            isProcessing = false;
            shortAnswerInput.disabled = false;
            submitAnswerBtn.disabled = false;
            shortAnswerInput.focus();
        });
    }
}

function showCompletion() {
    quizCard.style.display = 'none';
    completionCard.style.display = 'block';
}
