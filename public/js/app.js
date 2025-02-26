import { auth, db } from './firebase-config.js';
import { refreshCharts } from './analytics.js';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

// DOM Elements
const budgetForm = document.getElementById('budget-form');
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const currentBudgetSpan = document.getElementById('current-budget');
const totalSpentSpan = document.getElementById('total-spent');
const remainingBudgetSpan = document.getElementById('remaining-budget');

let currentUserId = null;
let unsubscribeExpenses = null;

// Initialize app when user signs in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUserId = user.uid;
        await initializeUserData();
        subscribeToExpenses();
    } else {
        currentUserId = null;
        if (unsubscribeExpenses) {
            unsubscribeExpenses();
        }
    }
});

// Initialize user data
async function initializeUserData() {
    const budgetRef = doc(db, 'budgets', currentUserId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (budgetDoc.exists()) {
        updateBudgetDisplay(budgetDoc.data().amount);
    }
}

// Set Budget
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const budgetAmount = parseFloat(document.getElementById('budget-amount').value);

    try {
        await setDoc(doc(db, 'budgets', currentUserId), {
            amount: budgetAmount
        });
        updateBudgetDisplay(budgetAmount);
        budgetForm.reset();
    } catch (error) {
        alert('Error setting budget: ' + error.message);
    }
});

// Add Expense
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;

    try {
        await addDoc(collection(db, 'expenses'), {
            userId: currentUserId,
            amount: amount,
            category: category,
            date: date,
            timestamp: new Date()
        });
        expenseForm.reset();
        refreshCharts();
        checkBudgetAndNotify(amount);
    } catch (error) {
        alert('Error adding expense: ' + error.message);
    }
});

// Subscribe to expenses
function subscribeToExpenses() {
    const q = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUserId),
        orderBy('timestamp', 'desc')
    );

    unsubscribeExpenses = onSnapshot(q, (snapshot) => {
        let total = 0;
        expenseList.innerHTML = '';

        snapshot.forEach((doc) => {
            const expense = doc.data();
            total += expense.amount;
            
            const expenseElement = document.createElement('div');
            expenseElement.className = 'expense-item';
            expenseElement.innerHTML = `
                <span>${new Date(expense.date).toLocaleDateString()}</span>
                <span>${expense.category}</span>
                <span>$${expense.amount.toFixed(2)}</span>
            `;
            
            expenseList.appendChild(expenseElement);
        });

        updateTotalSpent(total);
    });
}

// Update Budget Display
function updateBudgetDisplay(budget) {
    currentBudgetSpan.textContent = `$${budget.toFixed(2)}`;
    updateRemainingBudget();
}

// Update Total Spent
function updateTotalSpent(total) {
    totalSpentSpan.textContent = `$${total.toFixed(2)}`;
    updateRemainingBudget();
}

// Update Remaining Budget
function updateRemainingBudget() {
    const budget = parseFloat(currentBudgetSpan.textContent.replace('$', ''));
    const spent = parseFloat(totalSpentSpan.textContent.replace('$', ''));
    const remaining = budget - spent;
    
    remainingBudgetSpan.textContent = `$${remaining.toFixed(2)}`;
    remainingBudgetSpan.style.color = remaining < 0 ? '#e53e3e' : '#2d3748';
}

// Check budget and notify
async function checkBudgetAndNotify(newExpenseAmount) {
    const budgetRef = doc(db, 'budgets', currentUserId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (budgetDoc.exists()) {
        const budget = budgetDoc.data().amount;
        const currentTotal = parseFloat(totalSpentSpan.textContent.replace('$', ''));
        
        if (currentTotal > budget) {
            // Show notification
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification('Budget Alert', {
                        body: `You have exceeded your monthly budget of $${budget}!`,
                        icon: '/favicon.ico'
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('Budget Alert', {
                                body: `You have exceeded your monthly budget of $${budget}!`,
                                icon: '/favicon.ico'
                            });
                        }
                    });
                }
            }
        }
    }
} 