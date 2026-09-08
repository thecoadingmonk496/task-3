// Categories configuration
const categories = {
    expense: ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
};

// DOM Elements
const balanceAmount = document.getElementById('balance-amount');
const incomeAmount = document.getElementById('income-amount');
const expenseAmount = document.getElementById('expense-amount');

const transactionForm = document.getElementById('transaction-form');
const typeRadios = document.getElementsByName('type');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const editIdInput = document.getElementById('edit-id');

const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const filterCategory = document.getElementById('filter-category');
const filterIncomeGroup = document.getElementById('filter-income-group');
const filterExpenseGroup = document.getElementById('filter-expense-group');
const transactionList = document.getElementById('transaction-list');

// State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';

// Initialize Application
function init() {
    // Set default date to today
    dateInput.valueAsDate = new Date();
    
    // Populate categories based on initial type selection
    updateCategoryDropdown();
    
    // Populate filter dropdowns
    populateFilterDropdown();
    
    // Add event listeners
    typeRadios.forEach(radio => {
        radio.addEventListener('change', updateCategoryDropdown);
    });
    
    transactionForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    filterCategory.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderTransactions();
    });
    
    // Initial Render
    renderTransactions();
    updateSummary();
}

// Utility functions
function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// UI Updates
function updateCategoryDropdown() {
    const selectedType = document.querySelector('input[name="type"]:checked').value;
    const options = categories[selectedType];
    
    categorySelect.innerHTML = '';
    options.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

function populateFilterDropdown() {
    categories.income.forEach(cat => {
        const option = document.createElement('option');
        option.value = `income-${cat}`;
        option.textContent = cat;
        filterIncomeGroup.appendChild(option);
    });
    
    categories.expense.forEach(cat => {
        const option = document.createElement('option');
        option.value = `expense-${cat}`;
        option.textContent = cat;
        filterExpenseGroup.appendChild(option);
    });
}

function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const balance = income - expense;
    
    balanceAmount.textContent = formatCurrency(balance);
    incomeAmount.textContent = formatCurrency(income);
    expenseAmount.textContent = formatCurrency(expense);
}

function renderTransactions() {
    transactionList.innerHTML = '';
    
    let filteredTransactions = transactions;
    
    if (currentFilter !== 'all') {
        const [filterType, filterCat] = currentFilter.split('-');
        filteredTransactions = transactions.filter(t => 
            t.type === filterType && t.category === filterCat
        );
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <p>No transactions found.</p>
            </div>
        `;
        return;
    }
    
    filteredTransactions.forEach(t => {
        const item = document.createElement('div');
        item.classList.add('transaction-item', t.type);
        
        const amountPrefix = t.type === 'income' ? '+' : '-';
        
        item.innerHTML = `
            <div class="t-info">
                <span class="t-category">${t.category}</span>
                ${t.note ? `<span class="t-note">${t.note}</span>` : ''}
                <span class="t-date">${formatDate(t.date)}</span>
            </div>
            <div class="t-amount-actions">
                <span class="t-amount">${amountPrefix}${formatCurrency(t.amount)}</span>
                <div class="t-actions">
                    <button class="action-btn edit-btn" onclick="editTransaction('${t.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTransaction('${t.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </div>
        `;
        
        transactionList.appendChild(item);
    });
}

// Logic
function handleFormSubmit(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const note = noteInput.value.trim();
    const editId = editIdInput.value;
    
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }
    
    if (editId) {
        // Update existing
        const index = transactions.findIndex(t => t.id === editId);
        if (index !== -1) {
            transactions[index] = { id: editId, type, amount, category, date, note };
        }
    } else {
        // Add new
        const newTransaction = {
            id: generateId(),
            type,
            amount,
            category,
            date,
            note
        };
        transactions.push(newTransaction);
    }
    
    saveToLocalStorage();
    renderTransactions();
    updateSummary();
    resetForm();
}

function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        renderTransactions();
        updateSummary();
        
        // If deleting the item currently being edited, reset the form
        if (editIdInput.value === id) {
            resetForm();
        }
    }
}

window.editTransaction = function(id) {
    const t = transactions.find(t => t.id === id);
    if (!t) return;
    
    // Update form mode
    document.querySelector('h2').textContent = 'Edit Transaction';
    submitBtn.textContent = 'Save Changes';
    cancelBtn.classList.remove('hidden');
    
    // Populate fields
    editIdInput.value = t.id;
    
    // Radio buttons
    if (t.type === 'expense') {
        document.getElementById('type-expense').checked = true;
    } else {
        document.getElementById('type-income').checked = true;
    }
    
    // Trigger category update before setting category
    updateCategoryDropdown();
    
    amountInput.value = t.amount;
    categorySelect.value = t.category;
    dateInput.value = t.date;
    noteInput.value = t.note;
    
    // Scroll to form smoothly
    document.querySelector('.transaction-form-section').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    transactionForm.reset();
    editIdInput.value = '';
    
    // Reset back to Expense and default date
    document.getElementById('type-expense').checked = true;
    updateCategoryDropdown();
    dateInput.valueAsDate = new Date();
    
    // Reset UI state
    document.querySelector('h2').textContent = 'Add New Transaction';
    submitBtn.textContent = 'Add Transaction';
    cancelBtn.classList.add('hidden');
}

function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Run app
init();
