// quiz_list.js – admin list page logic with inline editing and modal

const API_BASE = '/api/quiz';
const tableBody = document.querySelector('#quizTable tbody');
const addQuizBtn = document.getElementById('addQuizBtn');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const showingInfo = document.getElementById('showingInfo');
const paginationControls = document.getElementById('paginationControls');
const selectAllCheckbox = document.getElementById('selectAll');
const selectedCountSpan = document.getElementById('selectedCount');

// Modal Elements
const contentsModal = document.getElementById('contentsModal');
const modalTextarea = document.getElementById('modalTextarea');
const modalImageInput = document.getElementById('modalImageInput');
const modalImagePreview = document.getElementById('modalImagePreview');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCloseBtn = document.querySelector('.modal-close');

let allQuizzes = [];
let currentPage = 1;
let pageSize = 10;
let selectedIds = new Set();
let currentEditingCell = null; // Track which cell opened the modal
let currentEditingRow = null; // Track which row object is being edited

const resetProgressBtn = document.getElementById('resetProgressBtn');
const gameStartBtn = document.getElementById('gameStartBtn');
const monitoringBtn = document.getElementById('monitoringBtn');

// Event Listeners
if (monitoringBtn) {
    monitoringBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = 'login.html';
        } catch (e) {
            console.error(e);
            alert('Logout failed');
        }
    });
}
addQuizBtn.addEventListener('click', addNewRow);

gameStartBtn.addEventListener('click', async () => {
    if (confirm('Start the game? All waiting users will be redirected to the main page.')) {
        try {
            const res = await fetch('/api/game/start', { method: 'POST' });
            const result = await res.json();
            if (res.ok) {
                alert(result.message);
            } else {
                alert('Error: ' + result.message);
            }
        } catch (e) {
            console.error(e);
            alert('Network error.');
        }
    }
});

resetProgressBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset ALL user progress? This cannot be undone.')) {
        try {
            const res = await fetch(`${API_BASE}/history`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (res.ok) {
                alert(result.message);
            } else {
                alert('Error: ' + result.message);
            }
        } catch (e) {
            console.error(e);
            alert('Network error.');
        }
    }
});

pageSizeSelect.addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
});

selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const id = parseInt(cb.dataset.id);
        if (!isNaN(id)) { // Skip new rows which might not have ID yet
            if (e.target.checked) selectedIds.add(id);
            else selectedIds.delete(id);
        }
    });
    updateSelectedCount();
});

// Modal Events
function closeModal() {
    contentsModal.classList.remove('active');
    currentEditingCell = null;
    currentEditingRow = null;
    modalImageInput.value = ''; // Clear file input
    modalImagePreview.innerHTML = ''; // Clear preview
}

modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);

modalImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            modalImagePreview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        modalImagePreview.innerHTML = '';
    }
});

modalSaveBtn.addEventListener('click', () => {
    if (currentEditingCell && currentEditingRow) {
        currentEditingCell.textContent = modalTextarea.value;

        // Store the selected file in the row object temporarily
        if (modalImageInput.files.length > 0) {
            currentEditingRow.pendingImage = modalImageInput.files[0];
            // Show a marker that image is attached (optional)
            currentEditingCell.dataset.hasImage = 'true';
        }

        // If there was an existing image, we might want to show it or keep it.
        // For now, we rely on the user clicking "Save" on the row to upload.
    }
    closeModal();
});

// Load Data
async function loadQuizzes() {
    try {
        // Fetch Admin Info
        const adminRes = await fetch('/api/admin/me');
        if (adminRes.ok) {
            const adminData = await adminRes.json();
            const adminNameDisplay = document.getElementById('adminNameDisplay');
            if (adminNameDisplay && adminData.admin) {
                adminNameDisplay.textContent = `ID: ${adminData.admin.id}`;
            }
        }

        // Fetch Game Code
        const codeRes = await fetch('/api/admin/code');
        if (codeRes.ok) {
            const codeData = await codeRes.json();
            const gameCodeDisplay = document.getElementById('gameCodeDisplay');
            if (gameCodeDisplay && codeData.code) {
                gameCodeDisplay.textContent = codeData.code;
            }
        }

        const res = await fetch(`${API_BASE}/list`);
        if (res.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        allQuizzes = await res.json();
        renderTable();
    } catch (e) {
        console.error(e);
        alert('Failed to load quizzes.');
    }
}

// Add New Row
function addNewRow() {
    // Create a temporary object for the new row
    // We insert it at the beginning of the current view or list
    const newRow = {
        NO: 'NEW',
        GROUP: '',
        TITLE: '',
        CONTENTS: '',
        OPTION_DISTINC: 'short',
        OPTION1: '',
        OPTION2: '',
        OPTION3: '',
        OPTION4: '',
        ANSWER: '',
        isNew: true
    };

    // Prepend to allQuizzes so it shows up first
    allQuizzes.unshift(newRow);
    renderTable();
}

// Render Table
function renderTable() {
    // Pagination logic
    const totalItems = allQuizzes.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const currentData = allQuizzes.slice(startIdx, endIdx);

    // Update Info Text
    showingInfo.textContent = `Showing ${totalItems === 0 ? 0 : startIdx + 1} to ${endIdx} of ${totalItems} entries`;

    // Clear Table
    tableBody.innerHTML = '';

    currentData.forEach((q, index) => {
        const tr = document.createElement('tr');
        const isSelected = selectedIds.has(q.NO);
        const isNew = q.isNew === true;

        let contentsDisplay = q.CONTENTS || '(empty)';
        if (q.IMAGE_URL) {
            contentsDisplay += ' <span style="font-size: 0.8em; color: #3498db;">[Image]</span>';
        }

        tr.innerHTML = `
      <td class="col-checkbox"><input type="checkbox" class="row-checkbox" data-id="${q.NO}" ${isSelected ? 'checked' : ''} ${isNew ? 'disabled' : ''}></td>
      <td>${q.NO}</td>
      ${editableCell(q.GROUP)}
      ${editableCell(q.TITLE)}
      <td class="contents-cell" title="Click to edit">${contentsDisplay}</td>
      <td>
        <select class="table-select">
          <option value="short" ${q.OPTION_DISTINC === 'short' ? 'selected' : ''}>Short</option>
          <option value="multiple" ${q.OPTION_DISTINC === 'multiple' ? 'selected' : ''}>Multiple</option>
          <option value="ox" ${q.OPTION_DISTINC === 'ox' ? 'selected' : ''}>OX</option>
        </select>
      </td>
      ${editableCell(q.OPTION1)}
      ${editableCell(q.OPTION2)}
      ${editableCell(q.OPTION3)}
      ${editableCell(q.OPTION4)}
      ${editableCell(q.ANSWER)}
      <td>
        <button class="btn saveBtn">${isNew ? 'Add' : 'Save'}</button>
        ${!isNew ? '<button class="btn deleteBtn" style="color: #e74c3c; border-color: #e74c3c; margin-left: 5px;">Delete</button>' : ''}
      </td>
    `;

        // Contents Click Handler
        const contentsCell = tr.querySelector('.contents-cell');
        contentsCell.addEventListener('click', () => {
            currentEditingCell = contentsCell;
            currentEditingRow = q;
            modalTextarea.value = q.CONTENTS || '';

            // Show existing image if any
            if (q.IMAGE_URL) {
                modalImagePreview.innerHTML = `<img src="${q.IMAGE_URL}" style="max-width: 100%; max-height: 200px;">`;
            } else {
                modalImagePreview.innerHTML = '';
            }

            contentsModal.classList.add('active');
        });

        // Row Selection
        const checkbox = tr.querySelector('.row-checkbox');
        if (!isNew) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) selectedIds.add(q.NO);
                else selectedIds.delete(q.NO);
                updateSelectedCount();
            });
        }

        // Save Handler
        tr.querySelector('.saveBtn').addEventListener('click', async () => {
            // Prepare FormData for file upload
            const formData = new FormData();
            formData.append('group', tr.children[2].innerText.trim());
            formData.append('title', tr.children[3].innerText.trim());

            // Use the value from the object/modal, not just the cell text which might have [Image] tag
            // But if user edited text in modal, q.CONTENTS should have been updated? 
            // Wait, modalSaveBtn updates cell text content. We need to be careful.
            // Let's use the current text in cell, stripping the [Image] tag if present?
            // Better: rely on what was in modalTextarea if currently editing, or the cell text.
            // Actually, modalSaveBtn updates cell text. So cell text is source of truth for text.
            // But we need to handle the [Image] span.

            let contentText = tr.children[4].innerText.trim();
            if (contentText.includes('[Image]')) {
                contentText = contentText.replace('[Image]', '').trim();
            }
            if (contentText === '(empty)') contentText = '';

            formData.append('contents', contentText);
            formData.append('option_type', tr.querySelector('.table-select').value);
            formData.append('option1', tr.children[6].innerText.trim());
            formData.append('option2', tr.children[7].innerText.trim());
            formData.append('option3', tr.children[8].innerText.trim());
            formData.append('option4', tr.children[9].innerText.trim());
            formData.append('answer', tr.children[10].innerText.trim());

            if (q.pendingImage) {
                formData.append('image', q.pendingImage);
            }

            if (isNew) {
                await registerNewQuiz(formData);
            } else {
                await updateQuiz(q.NO, formData);
            }
        });

        // Delete Handler
        if (!isNew) {
            const deleteBtn = tr.querySelector('.deleteBtn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete Quiz ${q.NO}?`)) {
                        await deleteQuiz(q.NO);
                    }
                });
            }
        }

        tableBody.appendChild(tr);
    });



    renderPagination(totalPages);
    updateSelectedCount();
}

// Render Pagination Buttons
function renderPagination(totalPages) {
    paginationControls.innerHTML = '';

    // Previous
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&lt;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    paginationControls.appendChild(prevBtn);

    // Page Numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        paginationControls.appendChild(btn);
    }

    // Next
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&gt;';
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    paginationControls.appendChild(nextBtn);
}

// API Calls
async function updateQuiz(id, formData) {
    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            body: formData, // Fetch automatically sets Content-Type to multipart/form-data
        });
        const result = await res.json();
        if (res.ok) {
            alert('Saved successfully.');
            loadQuizzes(); // Reload to see updated image/data
        } else {
            alert('Error: ' + (result.message || 'Save failed'));
        }
    } catch (e) {
        console.error(e);
        alert('Network error.');
    }
}

async function registerNewQuiz(formData) {
    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            body: formData,
        });
        const result = await res.json();
        if (res.ok) {
            alert('Registered successfully.');
            // Reload list to get the real ID and remove "NEW" row
            loadQuizzes();
        } else {
            alert('Error: ' + (result.message || 'Registration failed'));
        }
    } catch (e) {
        console.error(e);
        alert('Network error.');
    }
}

function updateSelectedCount() {
    selectedCountSpan.textContent = selectedIds.size;
    const checkboxes = document.querySelectorAll('.row-checkbox:not(:disabled)');
    if (checkboxes.length > 0) {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    } else {
        selectAllCheckbox.checked = false;
    }
}

function editableCell(value) {
    return `<td><div class="editable" contenteditable="true">${value || ''}</div></td>`;
}

// Initial Load
loadQuizzes();

const gameStopBtn = document.getElementById('gameStopBtn');
if (gameStopBtn) {
    gameStopBtn.addEventListener('click', async () => {
        if (confirm('Stop the game? All users will be redirected to the waiting page.')) {
            try {
                const res = await fetch('/api/game/stop', { method: 'POST' });
                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (e) {
                console.error(e);
                alert('Network error.');
            }
        }
    });
}

async function deleteQuiz(id) {
    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        if (res.ok) {
            alert('Deleted successfully.');
            loadQuizzes();
        } else {
            alert('Error: ' + (result.message || 'Delete failed'));
        }
    } catch (e) {
        console.error(e);
        alert('Network error.');
    }
}
