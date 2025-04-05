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
import { initializeAnalytics, setupTimeframeListeners, updateCharts } from './analytics.js';
import { auth, db } from './firebase-config.js';

// Global variables for current user and data
let currentUser = null;
window.userExpenses = []; // Make accessible to other scripts
let userBudget = 2500; // Default budget amount

// Check if the user is logged in
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Store the current user
    currentUser = user;
    console.log('Logged in as:', user.email);
    
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
                // Show empty state
                const emptyMessage = document.createElement('div');
                emptyMessage.id = 'empty-expense-message';
                emptyMessage.className = 'empty-state';
                emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
                expenseList.appendChild(emptyMessage);
            } else {
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

// Add an expense to Firestore
async function addExpenseToFirestore(expense) {
    try {
        const expensesRef = collection(db, "users", currentUser.uid, "expenses");
        await addDoc(expensesRef, expense);
        console.log("Expense added to Firestore");
    } catch (error) {
        console.error("Error adding expense:", error);
        alert("Error saving expense: " + error.message);
    }
}

// Update budget in Firestore
async function updateBudgetInFirestore(budget) {
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { budget: budget });
        console.log("Budget updated in Firestore");
    } catch (error) {
        console.error("Error updating budget:", error);
        alert("Error saving budget: " + error.message);
    }
}

// Clear all expenses from Firestore
async function clearExpensesFromFirestore() {
    try {
        const batch = writeBatch(db);
        const expensesRef = collection(db, "users", currentUser.uid, "expenses");
        const snapshot = await getDocs(expensesRef);
        
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log("All expenses cleared from Firestore");
    } catch (error) {
        console.error("Error clearing expenses:", error);
        alert("Error clearing expenses: " + error.message);
    }
}

// Add logout functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create the logout button in the header
    const header = document.querySelector('header');
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'secondary-button';
    logoutBtn.textContent = 'Logout';
    header.appendChild(logoutBtn);
    
    // Add event listener to logout button
    logoutBtn.addEventListener('click', async function() {
        try {
            await signOut(auth);
            // Redirect handled by auth state change listener
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    });
});

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

console.log('Elements loaded:', {
    budgetModal,
    editBudgetBtn,
    closeBudgetModalBtn,
    cancelBudgetBtn
});

// Budget Modal Functions
function openBudgetModal() {
    console.log('Opening budget modal');
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    budgetAmountInput.value = currentBudget;
    budgetModal.style.display = 'flex';
}

function closeBudgetModal() {
    console.log('Closing budget modal');
    budgetModal.style.display = 'none';
}

// Event Listeners
editBudgetBtn.addEventListener('click', function() {
    console.log('Edit budget button clicked');
    openBudgetModal();
});

closeBudgetModalBtn.addEventListener('click', function() {
    console.log('Close modal button clicked');
    closeBudgetModal();
});

cancelBudgetBtn.addEventListener('click', function() {
    console.log('Cancel button clicked');
    closeBudgetModal();
});

// Handle Budget Form Submission
budgetForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Budget form submitted');
    const newBudget = parseFloat(budgetAmountInput.value) || 0;
    
    // Update displays
    updateBudgetDisplay(newBudget);
    
    // Save to Firestore if user is logged in
    if (currentUser) {
        await updateBudgetInFirestore(newBudget);
    }
    
    closeBudgetModal();
});

// Handle Expense Form Submission
expenseForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Expense form submitted');
    
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const category = document.getElementById('expense-category').value;
    const dateInputValue = document.getElementById('expense-date').value;
    
    console.log('Date input value:', dateInputValue);
    
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
    
    console.log('Formatted date for storage:', date);
    
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
    
    console.log('Creating expense with date:', expense.date);
    
    // Add to Firestore if user is logged in
    if (currentUser) {
        await addExpenseToFirestore(expense);
        // The expense will be displayed via the Firestore listener
    } else {
        // For offline demo, still show in UI
        const expenseElement = createExpenseElement(expense);
        
        // Hide empty state message if it's visible
        const emptyMessage = document.getElementById('empty-expense-message');
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        expenseList.insertBefore(expenseElement, expenseList.firstChild);
        
        // Update totals
        const currentTotal = parseFloat(totalSpentSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const newTotal = currentTotal + amount;
        updateTotalSpent(newTotal);
        
        // Add to userExpenses array for offline mode
        // Generate a temporary ID for the expense
        expense.id = 'temp_' + Date.now();
        window.userExpenses.push(expense);
        
        // Update analytics charts with new expense data
        updateCharts(window.userExpenses);
    }
    
    // Clear form
    expenseForm.reset();
    
    // Set date input to today
    try {
        const today = new Date();
        const dateInput = document.getElementById('expense-date');
        dateInput.valueAsDate = today;
        console.log('Reset date input to:', dateInput.value);
    } catch (error) {
        console.error('Error setting date input:', error);
    }
});

// Reset Expenses
resetExpensesBtn.addEventListener('click', async function() {
    console.log('Reset expenses clicked');
    if (confirm('Are you sure you want to reset all expenses?')) {
        try {
            // Show loading state on button
            const originalText = resetExpensesBtn.textContent;
            resetExpensesBtn.textContent = 'Resetting...';
            resetExpensesBtn.disabled = true;
            
            if (currentUser) {
                // Clear expenses from Firestore
                await clearExpensesFromFirestore();
                
                // But also update UI immediately for better UX
                expenseList.innerHTML = '';
                
                // Re-add the empty state message
                const emptyMessage = document.createElement('div');
                emptyMessage.id = 'empty-expense-message';
                emptyMessage.className = 'empty-state';
                emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
                expenseList.appendChild(emptyMessage);
                
                // Reset all displayed numbers
                updateTotalSpent(0);
                
                // Update budget rule display with zero spent
                updateBudgetRuleDisplay(userBudget, 0);
                
                // Clear the userExpenses array
                window.userExpenses = [];
                
                // Update analytics charts with empty data
                updateCharts([]);
            } else {
                // For offline demo
                expenseList.innerHTML = '';
                
                // Re-add the empty state message
                const emptyMessage = document.createElement('div');
                emptyMessage.id = 'empty-expense-message';
                emptyMessage.className = 'empty-state';
                emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
                expenseList.appendChild(emptyMessage);
                
                // Reset all displayed numbers
                updateTotalSpent(0);
                
                // Update budget rule display with zero spent
                updateBudgetRuleDisplay(userBudget, 0);
                
                // Clear the userExpenses array
                window.userExpenses = [];
                
                // Update analytics charts with empty data
                updateCharts([]);
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

// Helper Functions
function updateBudgetDisplay(budgetAmount) {
    console.log('Updating budget display to', budgetAmount);
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
    
    // When budget changes, it's good to refresh the analytics as well
    // (some visualizations might be affected by budget changes)
    if (window.userExpenses.length > 0) {
        updateCharts(window.userExpenses);
    }
}

function updateTotalSpent(total) {
    console.log('Updating total spent to', total);
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

function updateBudgetRuleDisplay(budgetAmount, totalSpent) {
    console.log('Updating budget rule with budget:', budgetAmount, 'spent:', totalSpent);
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    // Calculate 50/30/20 amounts
    const needsAmount = budgetAmount * 0.5;
    const wantsAmount = budgetAmount * 0.3;
    const savingsAmount = budgetAmount * 0.2;

    // Update the amounts in the UI
    document.getElementById('needs-amount').textContent = formatter.format(needsAmount);
    document.getElementById('wants-amount').textContent = formatter.format(wantsAmount);
    document.getElementById('savings-amount').textContent = formatter.format(savingsAmount);

    // If total spent is 0, reset all progress bars to 0
    if (totalSpent === 0) {
        document.getElementById('needs-progress').style.width = '0%';
        document.getElementById('wants-progress').style.width = '0%';
        document.getElementById('savings-progress').style.width = '0%';
        
        // Update remaining amounts to show full budget
        document.getElementById('needs-remaining').textContent = 
            `${formatter.format(needsAmount)} left to spend`;
        document.getElementById('wants-remaining').textContent = 
            `${formatter.format(wantsAmount)} left to spend`;
        document.getElementById('savings-remaining').textContent = 
            `${formatter.format(savingsAmount)} left to save`;
        
        return;
    }

    // Calculate spent amounts based on the 50/30/20 rule
    const needsSpent = totalSpent * 0.5;
    const wantsSpent = totalSpent * 0.3;
    const savingsSpent = totalSpent * 0.2;

    // Calculate percentages for progress bars (only if allocated amounts > 0)
    let needsPercentage = needsAmount > 0 ? Math.min((needsSpent / needsAmount) * 100, 100) : 0;
    let wantsPercentage = wantsAmount > 0 ? Math.min((wantsSpent / wantsAmount) * 100, 100) : 0;
    let savingsPercentage = savingsAmount > 0 ? Math.min((savingsSpent / savingsAmount) * 100, 100) : 0;

    // Update progress bars
    document.getElementById('needs-progress').style.width = `${needsPercentage}%`;
    document.getElementById('wants-progress').style.width = `${wantsPercentage}%`;
    document.getElementById('savings-progress').style.width = `${savingsPercentage}%`;

    // Calculate remaining amounts
    const needsRemaining = Math.max(needsAmount - needsSpent, 0);
    const wantsRemaining = Math.max(wantsAmount - wantsSpent, 0);
    const savingsRemaining = Math.max(savingsAmount - savingsSpent, 0);

    // Update remaining amounts text
    document.getElementById('needs-remaining').textContent = 
        `${formatter.format(needsRemaining)} left to spend`;
    document.getElementById('wants-remaining').textContent = 
        `${formatter.format(wantsRemaining)} left to spend`;
    document.getElementById('savings-remaining').textContent = 
        `${formatter.format(savingsRemaining)} left to save`;
}

function createExpenseElement(expense) {
    console.log('Creating expense element for', expense);
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
    const categoryClass = ['groceries', 'utilities', 'rent', 'transportation', 'entertainment']
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
        
        // If we have a Firebase user and expense ID
        if (currentUser && expense.id) {
            // Get reference to the expense document
            const expenseRef = doc(db, "users", currentUser.uid, "expenses", expense.id);
            
            // Update the expense amount in Firestore
            await updateDoc(expenseRef, {
                amount: parsedAmount
            });
            
            // Update the total spent immediately
            updateTotalSpent(updatedTotal);
            
            console.log("Expense updated successfully");
        } else {
            // For offline demo or if no ID is available
            // Update the displayed amount
            const amountElem = expenseElement.querySelector('.amount');
            
            // Update the amount display
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            });
            amountElem.textContent = formatter.format(parsedAmount);
            
            // Update the expense object
            expense.amount = parsedAmount;
            
            // Update the total spent
            updateTotalSpent(updatedTotal);
            
            // Also update the expense in the userExpenses array
            const index = window.userExpenses.findIndex(e => 
                e.id === expense.id || 
                (e.date === expense.date && e.category === expense.category)
            );
            
            if (index !== -1) {
                window.userExpenses[index].amount = parsedAmount;
                // Update analytics charts with modified expense data
                updateCharts(window.userExpenses);
            }
        }
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
        
        // If we have a Firebase user and expense ID
        if (currentUser && expense.id) {
            // Get reference to the expense document
            const expenseRef = doc(db, "users", currentUser.uid, "expenses", expense.id);
            
            // Delete the expense from Firestore
            await deleteDoc(expenseRef);
            
            // Update the total spent immediately
            updateTotalSpent(updatedTotal);
            
            console.log("Expense deleted successfully");
        } else {
            // For offline demo or if no ID is available
            // Remove the element from DOM
            expenseElement.remove();
            
            // Update the total spent
            updateTotalSpent(updatedTotal);
            
            // Remove expense from userExpenses array
            const index = window.userExpenses.findIndex(e => 
                e.id === expense.id || 
                (e.date === expense.date && e.category === expense.category)
            );
            
            if (index !== -1) {
                window.userExpenses.splice(index, 1);
                // Update analytics charts with updated expense data
                updateCharts(window.userExpenses);
            }
            
            // Show empty state if no expenses left
            if (expenseList.children.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.id = 'empty-expense-message';
                emptyMessage.className = 'empty-state';
                emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
                expenseList.appendChild(emptyMessage);
            }
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Error deleting expense: " + error.message);
    }
}

function formatDate(date) {
    console.log('Original date string:', date);
    console.log('Current date/time:', new Date().toString());
    
    // handle ISO date strings (YYYY-MM-DD) without creating a Date object
    if (date && typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Yesterday is 1 day before
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        
        console.log('Comparing with today:', today);
        console.log('Comparing with yesterday:', yesterdayStr);
        
        if (date === today) {
            console.log('Exact match with today string');
            return 'Today';
        } else if (date === yesterdayStr) {
            console.log('Exact match with yesterday string');
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
    
    console.log('Parsed expense date:', expenseDate.toString());
    
     // Reset time parts to ensure we compare only dates
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
    
    console.log('Today date (no time):', todayDate.toString());
    console.log('Compare date (no time):', compareDate.toString());
    
    // Calculate the difference in days
    const diffTime = todayDate.getTime() - compareDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log('Difference in days:', diffDays);
    
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

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Reset example values
    updateTotalSpent(0);
    updateBudgetDisplay(2500);
    
    // Set today's date as default for expense form
    const expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput) {
        expenseDateInput.valueAsDate = new Date();
    }
    
    // Make sure empty state is showing
    expenseList.innerHTML = '';
    const emptyMessage = document.createElement('div');
    emptyMessage.id = 'empty-expense-message';
    emptyMessage.className = 'empty-state';
    emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
    expenseList.appendChild(emptyMessage);
    
    // Initialize analytics instead of charts
    initializeAnalytics();
    
    // Initialize time frame selection listeners with empty expense array initially
    setupTimeframeListeners([]);
});

// Function to update user expenses from Firestore
async function updateUserExpenses() {
    try {
        loadingEl.style.display = 'block';
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in, showing demo data');
            updateOfflineDemoUI();
            return;
        }
        
        // Get expenses from Firestore
        const expensesRef = collection(db, 'users', user.uid, 'expenses');
        const querySnapshot = await getDocs(expensesRef);
        
        // Clear existing expenses
        window.userExpenses = [];
        expenseListEl.innerHTML = '';
        
        // Process expenses
        if (querySnapshot.empty) {
            console.log('No expenses found');
            showEmptyState();
        } else {
            hideEmptyState();
            
            querySnapshot.forEach((doc) => {
                const expense = {
                    id: doc.id,
                    ...doc.data()
                };
                window.userExpenses.push(expense);
                addExpenseToUI(expense);
            });
            
            console.log(`Loaded ${window.userExpenses.length} expenses`);
        }
        
        // Update the charts with the expenses data
        updateCharts(window.userExpenses);
        
        // Update timeframe listeners with the current expenses
        setupTimeframeListeners(window.userExpenses);
        
        // Update the total spent
        updateTotalSpent();
        
    } catch (error) {
        console.error('Error fetching expenses:', error);
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Function to update the UI for offline demo mode
function updateOfflineDemoUI() {
    console.log('Setting up offline demo UI');
    
    // Hide loading indicator if it exists
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Clear any existing expenses in the UI
    const expenseListEl = document.getElementById('expense-list');
    if (expenseListEl) {
        expenseListEl.innerHTML = '';
        
        // Add empty state message
        const emptyMessage = document.createElement('div');
        emptyMessage.id = 'empty-expense-message';
        emptyMessage.className = 'empty-state';
        emptyMessage.innerHTML = '<p>This is offline demo mode. Add expenses to see how the app works!</p>';
        expenseListEl.appendChild(emptyMessage);
    }
    
    // Reset expenses array
    window.userExpenses = [];
    
    // Set default budget for demo
    userBudget = 2500;
    updateBudgetDisplay(userBudget);
    
    // Update total spent to zero
    updateTotalSpent(0);
    
    // Reset charts for demo mode
    updateCharts([]);
    
    // Setup timeframe listeners with empty expense array
    setupTimeframeListeners([]);
    
    // Show a demo notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = 'Demo Mode: Your data will not be saved';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#ff9800';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    // Remove the notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    console.log('Offline demo UI setup complete');
} 