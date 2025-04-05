// Import Firebase modules
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    addDoc,
    collection,
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
import { auth, db } from './firebase-config.js';

// Global variables for current user and data
let currentUser = null;
let userExpenses = [];
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
            userExpenses = [];
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
                    userExpenses.push(expense);
                    
                    // Add to total
                    totalSpent += expense.amount;
                    
                    // Create expense element
                    const expenseElement = createExpenseElement(expense);
                    expenseList.appendChild(expenseElement);
                });
                
                // Update totals
                updateTotalSpent(totalSpent);
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
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
    
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
    }
    
    // Clear form
    expenseForm.reset();
    document.getElementById('expense-date').valueAsDate = new Date();
});

// Reset Expenses
resetExpensesBtn.addEventListener('click', async function() {
    console.log('Reset expenses clicked');
    if (confirm('Are you sure you want to reset all expenses?')) {
        if (currentUser) {
            // Clear expenses from Firestore
            await clearExpensesFromFirestore();
            // UI will be updated via Firestore listener
        } else {
            // For offline demo
            expenseList.innerHTML = '';
            
            // Re-add the empty state message
            const emptyMessage = document.createElement('div');
            emptyMessage.id = 'empty-expense-message';
            emptyMessage.className = 'empty-state';
            emptyMessage.innerHTML = '<p>No expenses yet. Add your first expense to get started!</p>';
            expenseList.appendChild(emptyMessage);
            
            updateTotalSpent(0);
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
}

function updateTotalSpent(total) {
    console.log('Updating total spent to', total);
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    
    totalSpentSpan.textContent = formatter.format(total);
    
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const remaining = currentBudget - total;
    
    remainingBudgetSpan.textContent = formatter.format(remaining);
    
    if (currentBudget > 0) {
        const spentPercentage = (total / currentBudget) * 100;
        const remainingPercentage = (remaining / currentBudget) * 100;
        
        document.querySelector('.card:nth-child(2) .subtitle').textContent = 
            `${spentPercentage.toFixed(1)}% of budget`;
        document.querySelector('.card:nth-child(3) .subtitle').textContent = 
            `${remainingPercentage.toFixed(1)}% left`;
    } else {
        document.querySelector('.card:nth-child(2) .subtitle').textContent = '0% of budget';
        document.querySelector('.card:nth-child(3) .subtitle').textContent = '0% left';
    }

    // Visual indicator for negative budget
    if (total > currentBudget && currentBudget > 0) {
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

    // Calculate percentages for progress bars (only if budget > 0)
    let needsPercentage = 0;
    let wantsPercentage = 0;
    let savingsPercentage = 0;

    if (budgetAmount > 0) {
        // Simplified for demo - just showing overall percentage
        const percentageSpent = Math.min((totalSpent / budgetAmount) * 100, 100);
        needsPercentage = percentageSpent;
        wantsPercentage = percentageSpent;
        savingsPercentage = percentageSpent;
    }

    // Update progress bars
    document.getElementById('needs-progress').style.width = `${needsPercentage}%`;
    document.getElementById('wants-progress').style.width = `${wantsPercentage}%`;
    document.getElementById('savings-progress').style.width = `${savingsPercentage}%`;

    // Update remaining amounts
    const needsSpent = totalSpent * 0.5;
    const wantsSpent = totalSpent * 0.3;
    const savingsSpent = totalSpent * 0.2;

    document.getElementById('needs-remaining').textContent = 
        `${formatter.format(Math.max(needsAmount - needsSpent, 0))} left to spend`;
    document.getElementById('wants-remaining').textContent = 
        `${formatter.format(Math.max(wantsAmount - wantsSpent, 0))} left to spend`;
    document.getElementById('savings-remaining').textContent = 
        `${formatter.format(Math.max(savingsAmount - savingsSpent, 0))} left to save`;
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
        <p class="amount">${formatter.format(expense.amount)}</p>
    `;
    
    return expenseElement;
}

function formatDate(date) {
    const now = new Date();
    const expenseDate = new Date(date);
    
    if (isSameDay(now, expenseDate)) {
        return 'Today';
    } else if (isSameDay(new Date(now - 86400000), expenseDate)) {
        return 'Yesterday';
    } else {
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
    
    // Initialize charts
    initializeCharts();
});

// Chart initialization
function initializeCharts() {
    // Category chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Groceries', 'Utilities', 'Rent', 'Transportation', 'Entertainment', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#e3f2fd', '#f3e5f5', '#e8f5e9', 
                    '#fff3e0', '#fce4ec', '#f5f5f5'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });

    // Trend chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Spending',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#000',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
} 