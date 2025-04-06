// Import Firebase modules
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initializeAnalytics, updateCharts } from './analytics.js';
import { auth, db } from './firebase-config.js';

// Global variables for current user and data
let currentUser = null;
window.userExpenses = []; // Make accessible to other scripts
let userBudget = 2500; // Default budget amount

// DOM Elements
const budgetModal = document.getElementById('budget-modal');
const editBudgetBtn = document.getElementById('edit-budget');
const closeBudgetModalBtn = document.getElementById('close-budget-modal');
const cancelBudgetBtn = document.getElementById('cancel-budget');
const budgetForm = document.getElementById('budget-form');
const budgetAmountInput = document.getElementById('budget-amount');
const currentBudgetSpan = document.getElementById('current-budget');
const totalSpentSpan = document.getElementById('total-spent');
const remainingBudgetSpan = document.getElementById('remaining-budget');
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const resetExpensesBtn = document.getElementById('reset-expenses');
const loadingEl = document.getElementById('loading');

// Check if the user is logged in
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Store the current user
    currentUser = user;
    
    // Load user data from Firestore
    await loadUserData();
});

// Load user data from Firestore
async function loadUserData() {
    try {
        // Get user's budget document
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            // User document exists, get budget
            const userData = userDoc.data();
            if (userData.budget) {
                userBudget = userData.budget;
                updateBudgetDisplay(userData.budget);
            }
        } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
                email: currentUser.email,
                budget: userBudget,
                createdAt: new Date()
            });
        }
        
        // Set up listener for user's expenses
        const expensesRef = collection(db, "users", currentUser.uid, "expenses");
        const q = query(expensesRef, orderBy("date", "desc"));
        
        onSnapshot(q, (snapshot) => {
            window.userExpenses = [];
            expenseList.innerHTML = '';
            
            if (snapshot.empty) {
                showEmptyState();
            } else {
                hideEmptyState();
                
                let totalSpent = 0;
                
                snapshot.forEach(doc => {
                    const expense = { id: doc.id, ...doc.data() };
                    window.userExpenses.push(expense);
                    
                    // Add to total
                    totalSpent += expense.amount;
                    
                    // Create expense element
                    const expenseElement = createExpenseElement(expense);
                    expenseList.appendChild(expenseElement);
                });
                
                // Update totals
                updateTotalSpent(totalSpent);
                
                // Update charts with current expense data
                updateCharts(window.userExpenses);
            }
        });
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Firestore operations
async function addExpenseToFirestore(expense) {
    try {
        const expensesRef = collection(db, "users", currentUser.uid, "expenses");
        await addDoc(expensesRef, expense);
        return true;
    } catch (error) {
        console.error("Error adding expense:", error);
        alert("Error saving expense: " + error.message);
        return false;
    }
}

async function updateBudgetInFirestore(budget) {
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { budget: budget });
        return true;
    } catch (error) {
        console.error("Error updating budget:", error);
        alert("Error saving budget: " + error.message);
        return false;
    }
}

async function clearExpensesFromFirestore() {
    try {
        const batch = writeBatch(db);
        const expensesRef = collection(db, "users", currentUser.uid, "expenses");
        const snapshot = await getDocs(expensesRef);
        
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error clearing expenses:", error);
        alert("Error clearing expenses: " + error.message);
        return false;
    }
}

// UI Helper Functions
function showEmptyState() {
    const emptyMessage = document.createElement('div');
    emptyMessage.id = 'empty-expense-message';
    emptyMessage.className = 'empty-state';
    emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
    expenseList.appendChild(emptyMessage);
}

function hideEmptyState() {
    const emptyMessage = document.getElementById('empty-expense-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
}

// Budget Modal Functions
function openBudgetModal() {
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    budgetAmountInput.value = currentBudget;
    budgetModal.style.display = 'flex';
}

function closeBudgetModal() {
    budgetModal.style.display = 'none';
}

function updateBudgetDisplay(budgetAmount) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    currentBudgetSpan.textContent = formatter.format(budgetAmount);
    
    const totalSpent = parseFloat(totalSpentSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const remaining = budgetAmount - totalSpent;
    
    remainingBudgetSpan.textContent = formatter.format(remaining);
    
    if (budgetAmount > 0) {
        const spentPercentage = (totalSpent / budgetAmount) * 100;
        const remainingPercentage = (remaining / budgetAmount) * 100;
        
        document.querySelector('.card:nth-child(2) .subtitle').textContent = 
            `${spentPercentage.toFixed(1)}% of budget`;
        document.querySelector('.card:nth-child(3) .subtitle').textContent = 
            `${remainingPercentage.toFixed(1)}% left`;
    } else {
        document.querySelector('.card:nth-child(2) .subtitle').textContent = '0% of budget';
        document.querySelector('.card:nth-child(3) .subtitle').textContent = '0% left';
    }

    // Update 50/30/20 rule
    updateBudgetRuleDisplay(budgetAmount, totalSpent);
    
    // When budget changes, refresh the analytics
    if (window.userExpenses.length > 0) {
        updateCharts(window.userExpenses);
    }
}

function updateTotalSpent(total) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    
    // Update the displayed total
    totalSpentSpan.textContent = formatter.format(total);
    
    // Get current budget and calculate remaining
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const remaining = Math.max(currentBudget - total, 0);
    
    // Update remaining budget display
    remainingBudgetSpan.textContent = formatter.format(remaining);
    
    // Calculate and update percentages
    if (currentBudget > 0) {
        const spentPercentage = Math.min((total / currentBudget) * 100, 100).toFixed(1);
        const remainingPercentage = Math.max(100 - spentPercentage, 0).toFixed(1);
        
        // Update percentage displays
        document.querySelector('.card:nth-child(2) .subtitle').textContent = 
            `${spentPercentage}% of budget`;
        document.querySelector('.card:nth-child(3) .subtitle').textContent = 
            `${remainingPercentage}% left`;
    } else {
        document.querySelector('.card:nth-child(2) .subtitle').textContent = '0% of budget';
        document.querySelector('.card:nth-child(3) .subtitle').textContent = '0% left';
    }

    // Visual indicator for negative budget - remove if total is 0
    if (total === 0) {
        remainingBudgetSpan.classList.remove('negative');
    } else if (total > currentBudget && currentBudget > 0) {
        remainingBudgetSpan.classList.add('negative');
    } else {
        remainingBudgetSpan.classList.remove('negative');
    }

    // Update 50/30/20 rule
    updateBudgetRuleDisplay(currentBudget, total);
}

// Helper function to categorize expenses by type
function categorizeExpenses(expenses) {
    const categorized = {
        needs: 0,
        wants: 0,
        savings: 0
    };
    
    if (!expenses || expenses.length === 0) {
        return categorized;
    }
    
    expenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        
        // Categorize expenses
        if (['groceries', 'utilities', 'rent', 'transportation'].includes(category)) {
            // These are needs
            categorized.needs += expense.amount;
        } else if (category === 'savings') {
            // Directly to savings
            categorized.savings += expense.amount;
        } else {
            // Everything else (entertainment, other) is wants
            categorized.wants += expense.amount;
        }
    });
    
    return categorized;
}

// Replace the current updateBudgetRuleDisplay function with this one
function updateBudgetRuleDisplay(budgetAmount, totalSpent) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    // Calculate 50/30/20 rule for budget allocation
    const needsAllocation = budgetAmount * 0.5;  // 50% for needs
    const wantsAllocation = budgetAmount * 0.3;  // 30% for wants
    const savingsAllocation = budgetAmount * 0.2; // 20% for savings

    // Update the allocated amounts in the UI
    document.getElementById('needs-amount').textContent = formatter.format(needsAllocation);
    document.getElementById('wants-amount').textContent = formatter.format(wantsAllocation);
    document.getElementById('savings-amount').textContent = formatter.format(savingsAllocation);

    // If total spent is 0, reset all progress bars to 0
    if (totalSpent === 0) {
        document.getElementById('needs-progress').style.width = '0%';
        document.getElementById('wants-progress').style.width = '0%';
        document.getElementById('savings-progress').style.width = '0%';
        
        // Update remaining amounts to show full budget
        document.getElementById('needs-remaining').textContent = 
            `${formatter.format(needsAllocation)} left to spend`;
        document.getElementById('wants-remaining').textContent = 
            `${formatter.format(wantsAllocation)} left to spend`;
        document.getElementById('savings-remaining').textContent = 
            `${formatter.format(savingsAllocation)} left to save`;
        
        return;
    }

    // Get actual categorized expenses
    const categorizedExpenses = categorizeExpenses(window.userExpenses);
    
    // Calculate how much has been spent in each category
    const needsSpent = categorizedExpenses.needs;
    const wantsSpent = categorizedExpenses.wants;
    const savingsSpent = categorizedExpenses.savings;
    
    // Calculate percentages for progress bars (only if allocated amounts > 0)
    let needsPercentage = needsAllocation > 0 ? Math.min((needsSpent / needsAllocation) * 100, 100) : 0;
    let wantsPercentage = wantsAllocation > 0 ? Math.min((wantsSpent / wantsAllocation) * 100, 100) : 0;
    let savingsPercentage = savingsAllocation > 0 ? Math.min((savingsSpent / savingsAllocation) * 100, 100) : 0;

    // Update progress bars
    document.getElementById('needs-progress').style.width = `${needsPercentage}%`;
    document.getElementById('wants-progress').style.width = `${wantsPercentage}%`;
    document.getElementById('savings-progress').style.width = `${savingsPercentage}%`;

    // Calculate remaining amounts
    const needsRemaining = Math.max(needsAllocation - needsSpent, 0);
    const wantsRemaining = Math.max(wantsAllocation - wantsSpent, 0);
    const savingsRemaining = Math.max(savingsAllocation - savingsSpent, 0);

    // Update remaining amounts text
    document.getElementById('needs-remaining').textContent = 
        `${formatter.format(needsRemaining)} left to spend`;
    document.getElementById('wants-remaining').textContent = 
        `${formatter.format(wantsRemaining)} left to spend`;
    document.getElementById('savings-remaining').textContent = 
        `${formatter.format(savingsRemaining)} left to save`;
}

// Date formatting
function formatDate(date) {
    // handle ISO date strings (YYYY-MM-DD) without creating a Date object
    if (date && typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Yesterday is 1 day before
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        
        if (date === today) {
            return 'Today';
        } else if (date === yesterdayStr) {
            return 'Yesterday';
        } else {
            // Format the date as "Mon DD" without creating a Date object
            const [year, month, day] = date.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            // Month is 0-indexed in JavaScript
            return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
        }
    }
    
    // Fall back to the existing method for non-standard date formats
    const now = new Date();
    const expenseDate = new Date(date);
    
    // Reset time parts to ensure we compare only dates
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
    
    // Calculate the difference in days
    const diffTime = todayDate.getTime() - compareDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) {
        return 'Today';
    } 
    else if (diffDays === 1) {
        return 'Yesterday';
    } 
    else {
        return expenseDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
}

// Create expense UI element
function createExpenseElement(expense) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    // Format category
    let displayCategory = expense.category;
    if (typeof displayCategory === 'string') {
        displayCategory = expense.category.charAt(0).toUpperCase() + 
                        expense.category.slice(1).toLowerCase();
    }

    const expenseElement = document.createElement('div');
    expenseElement.className = 'expense-item';
    
    // Use a default category icon if the category doesn't match predefined ones
    const categoryClass = ['groceries', 'utilities', 'rent', 'transportation', 'entertainment', 'savings']
                        .includes(expense.category.toLowerCase()) 
                        ? expense.category.toLowerCase() 
                        : 'other';
    
    expenseElement.innerHTML = `
        <div class="expense-icon ${categoryClass}"></div>
        <div class="expense-details">
            <h4>${displayCategory}</h4>
            <p class="date">${formatDate(expense.date)}</p>
        </div>
        <div class="expense-amount-container">
        <p class="amount">${formatter.format(expense.amount)}</p>
            <div class="expense-actions">
                <button class="icon-button edit-expense" title="Edit expense">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button delete-expense" title="Delete expense">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Store the expense ID if it exists
    if (expense.id) {
        expenseElement.dataset.id = expense.id;
    }
    
    // Add event listeners to the buttons
    const editButton = expenseElement.querySelector('.edit-expense');
    const deleteButton = expenseElement.querySelector('.delete-expense');
    
    editButton.addEventListener('click', () => editExpense(expense, expenseElement));
    deleteButton.addEventListener('click', () => deleteExpense(expense, expenseElement));
    
    return expenseElement;
}

// Edit expense function
async function editExpense(expense, expenseElement) {
    // Prompt for new amount
    const newAmount = prompt('Enter new amount:', expense.amount);
    
    // Validate input
    if (newAmount === null) return; // User cancelled
    
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        // Get current total spent
        const currentTotal = parseFloat(totalSpentSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        
        // Simple calculation: subtract the old amount and add the new amount
        const updatedTotal = currentTotal - expense.amount + parsedAmount;
        
        // Update the expense in Firestore
        const expenseRef = doc(db, "users", currentUser.uid, "expenses", expense.id);
        
        // Update the expense amount in Firestore
        await updateDoc(expenseRef, {
            amount: parsedAmount
        });
        
        // Update the total spent immediately
        updateTotalSpent(updatedTotal);
    } catch (error) {
        console.error("Error updating expense:", error);
        alert("Error updating expense: " + error.message);
    }
}

// Delete expense function
async function deleteExpense(expense, expenseElement) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        // Get current total spent
        const currentTotal = parseFloat(totalSpentSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        
        // Simple calculation: subtract the expense amount from total
        const updatedTotal = Math.max(currentTotal - expense.amount, 0);
        
        // Delete the expense from Firestore
        const expenseRef = doc(db, "users", currentUser.uid, "expenses", expense.id);
        await deleteDoc(expenseRef);
        
        // Update the total spent immediately
        updateTotalSpent(updatedTotal);
    } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Error deleting expense: " + error.message);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Initialize logout button
    setupLogoutButton();
    
    // Set up event listeners for UI elements
    setupEventListeners();
    
    // Set today's date as default for expense form - using a standardized local date
    const expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput) {
        // Create date without time portion to avoid timezone issues
        const today = new Date();
        const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        expenseDateInput.valueAsDate = localDate;
    }
    
    // Initialize analytics
    initializeAnalytics();
}

function setupLogoutButton() {
    const header = document.querySelector('header');
    if (!header) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'secondary-button';
    logoutBtn.textContent = 'Logout';
    header.appendChild(logoutBtn);
    
    logoutBtn.addEventListener('click', async function() {
        try {
            await signOut(auth);
            // Redirect handled by auth state change listener
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    });
}

function setupEventListeners() {
    // Budget modal events
    if (editBudgetBtn) editBudgetBtn.addEventListener('click', openBudgetModal);
    if (closeBudgetModalBtn) closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
    if (cancelBudgetBtn) cancelBudgetBtn.addEventListener('click', closeBudgetModal);
    
    // Budget form submission
    if (budgetForm) {
        budgetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const newBudget = parseFloat(budgetAmountInput.value) || 0;
            
            // Update displays
            updateBudgetDisplay(newBudget);
            
            // Save to Firestore if user is logged in
            if (currentUser) {
                await updateBudgetInFirestore(newBudget);
            }
            
            closeBudgetModal();
        });
    }
    
    // Expense form submission
    if (expenseForm) {
        expenseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
            const category = document.getElementById('expense-category').value;
            const dateInputValue = document.getElementById('expense-date').value;
            
            // Always use YYYY-MM-DD format directly from the input
            let date = dateInputValue;
            
            // If no date provided, use today's date in YYYY-MM-DD format
            if (!date) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                date = `${year}-${month}-${day}`;
            }
            
            if (!amount || !category) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create expense object
            const expense = { 
                amount, 
                category, 
                date, 
                createdAt: new Date() 
            };
            
            // Add to Firestore - the expense will be displayed via the Firestore listener
            await addExpenseToFirestore(expense);
            
            // Clear form
            expenseForm.reset();
            
            // Set date input to today, avoiding timezone issues
            try {
                const dateInput = document.getElementById('expense-date');
                // Get today's date, but create a date that represents midnight in the local timezone
                const today = new Date();
                // Use local date components without time to avoid timezone issues
                const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                dateInput.valueAsDate = localDate;
            } catch (error) {
                console.error('Error setting date input:', error);
            }
        });
    }
    
    // Reset expenses
    if (resetExpensesBtn) {
        resetExpensesBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to reset all expenses?')) {
                try {
                    // Show loading state on button
                    const originalText = resetExpensesBtn.textContent;
                    resetExpensesBtn.textContent = 'Resetting...';
                    resetExpensesBtn.disabled = true;
                    
                    // Clear expenses from Firestore
                    await clearExpensesFromFirestore();
                    
                    // But also update UI immediately for better UX
                    expenseList.innerHTML = '';
                    showEmptyState();
                    
                    // Reset all displayed numbers
                    updateTotalSpent(0);
                    
                    // Update budget rule display with zero spent
                    updateBudgetRuleDisplay(userBudget, 0);
                    
                    // Clear the userExpenses array
                    window.userExpenses = [];
                    
                    // Update analytics charts with empty data
                    updateCharts([]);
                    
                    // Reset the date input to today, using local date to avoid timezone issues
                    try {
                        const dateInput = document.getElementById('expense-date');
                        if (dateInput) {
                            // Create date without time portion
                            const today = new Date();
                            const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            dateInput.valueAsDate = localDate;
                        }
                    } catch (error) {
                        console.error('Error setting date input after reset:', error);
                    }
                    
                    // Show success message temporarily
                    resetExpensesBtn.textContent = 'Reset Complete!';
                    resetExpensesBtn.classList.add('success-button');
                    
                    // Restore button after a moment
                    setTimeout(() => {
                        resetExpensesBtn.textContent = originalText;
                        resetExpensesBtn.disabled = false;
                        resetExpensesBtn.classList.remove('success-button');
                    }, 2000);
                } catch (error) {
                    console.error("Error resetting expenses:", error);
                    resetExpensesBtn.textContent = 'Reset Failed';
                    resetExpensesBtn.classList.add('error-button');
                    
                    // Restore button after a moment
                    setTimeout(() => {
                        resetExpensesBtn.textContent = originalText;
                        resetExpensesBtn.disabled = false;
                        resetExpensesBtn.classList.remove('error-button');
                    }, 2000);
                }
            }
        });
    }
} 