/*
 * Google Keep Clone - JavaScript logic
 *
 * This script manages note creation, display, search, archive state,
 * editing, and persistence through localStorage.
 */

const STORAGE_KEY = 'keep-clone-notes';

// Application state
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentView = 'notes';
let activeEditNoteId = null;
let searchTerm = '';

const noteForm = document.getElementById('note-form');
const noteTitle = document.getElementById('note-title');
const noteText = document.getElementById('note-text');
const formActions = document.getElementById('form-actions');
const closeFormBtn = document.getElementById('close-form-btn');
const notesGrid = document.getElementById('notes-grid');
const searchBar = document.getElementById('search-bar');

const navNotes = document.getElementById('nav-notes');
const navArchive = document.getElementById('nav-archive');

const editModal = document.getElementById('edit-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const saveModalBtn = document.getElementById('save-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Persist current notes array in browser localStorage
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Escape user input to prevent HTML injection in note content
function escapeHtml(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Build the filtered note list based on current view and search input
function getFilteredNotes() {
    const query = searchTerm.trim().toLowerCase();

    return notes.filter(note => {
        const matchesView = currentView === 'archive' ? note.isArchived : !note.isArchived;
        const matchesSearch = !query || `${note.title} ${note.text}`.toLowerCase().includes(query);
        return matchesView && matchesSearch;
    });
}

// Render notes into the page and show an empty state when needed
function renderNotes() {
    notesGrid.innerHTML = '';

    const filteredNotes = getFilteredNotes();

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <h3>${currentView === 'archive' ? 'No archived notes yet' : 'No notes found'}</h3>
                <p>${searchTerm ? 'Try a different search term.' : 'Create your first note to get started.'}</p>
            </div>
        `;
        return;
    }

    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.dataset.id = note.id;
        noteCard.tabIndex = 0;
        noteCard.setAttribute('aria-label', `Open note titled ${note.title || 'Untitled'}`);

        if (note.isArchived) {
            noteCard.classList.add('archived');
        }

        noteCard.innerHTML = `
            <h4>${escapeHtml(note.title || 'Untitled')}</h4>
            <p>${escapeHtml(note.text)}</p>
            <div class="card-actions">
                <button class="archive-btn" type="button" title="${note.isArchived ? 'Move back to notes' : 'Archive note'}">
                    ${note.isArchived ? 'Unarchive' : 'Archive'}
                </button>
            </div>
        `;

        notesGrid.appendChild(noteCard);
    });
}

// Open the modal dialog to edit an existing note
function openEditModal(note) {
    activeEditNoteId = note.id;
    modalTitle.value = note.title;
    modalText.value = note.text;
    editModal.classList.remove('hidden');
    modalTitle.focus();
}

// Close the modal and reset the editing state
function closeModal() {
    editModal.classList.add('hidden');
    activeEditNoteId = null;
}

function closeForm() {
    noteForm.reset();
    noteTitle.classList.add('hidden');
    formActions.classList.add('hidden');
    noteText.rows = 1;
}

noteText.addEventListener('focus', () => {
    noteTitle.classList.remove('hidden');
    formActions.classList.remove('hidden');
    noteText.rows = 3;
});

closeFormBtn.addEventListener('click', closeForm);

noteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleValue = noteTitle.value.trim();
    const textValue = noteText.value.trim();

    if (!textValue) return;

    notes.push({
        id: Date.now(),
        title: titleValue,
        text: textValue,
        isArchived: false
    });

    saveToLocalStorage();
    renderNotes();
    closeForm();
});

notesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (!card) return;

    const noteId = Number(card.dataset.id);
    const targetNote = notes.find(note => note.id === noteId);

    if (!targetNote) return;

    if (e.target.closest('.archive-btn')) {
        e.stopPropagation();
        targetNote.isArchived = !targetNote.isArchived;
        saveToLocalStorage();
        renderNotes();
    } else {
        openEditModal(targetNote);
    }
});

notesGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const card = e.target.closest('.note-card');
    if (!card) return;

    const noteId = Number(card.dataset.id);
    const targetNote = notes.find(note => note.id === noteId);
    if (targetNote) {
        openEditModal(targetNote);
    }
});

saveModalBtn.addEventListener('click', () => {
    const noteToUpdate = notes.find(note => note.id === activeEditNoteId);

    if (noteToUpdate) {
        noteToUpdate.title = modalTitle.value.trim();
        noteToUpdate.text = modalText.value.trim();
        saveToLocalStorage();
        renderNotes();
    }

    closeModal();
});

closeModalBtn.addEventListener('click', closeModal);

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
        closeModal();
    }
});

searchBar.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderNotes();
});

navNotes.addEventListener('click', () => {
    currentView = 'notes';
    navNotes.classList.add('active');
    navArchive.classList.remove('active');
    renderNotes();
});

navArchive.addEventListener('click', () => {
    currentView = 'archive';
    navArchive.classList.add('active');
    navNotes.classList.remove('active');
    renderNotes();
});

renderNotes();