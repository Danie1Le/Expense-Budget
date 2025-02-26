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
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

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
    } else {
        // Create default budget
        await setDoc(budgetRef, { amount: 0 });
        updateBudgetDisplay(0);
    }
}

// Budget Modal Functions
function openBudgetModal() {
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace('$', '').replace(',', ''));
    budgetAmountInput.value = currentBudget;
    budgetModal.classList.add('show');
}

function closeBudgetModal() {
    budgetModal.classList.remove('show');
}

// Event Listeners for Budget Modal
editBudgetBtn.addEventListener('click', openBudgetModal);
closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
cancelBudgetBtn.addEventListener('click', closeBudgetModal);

// Handle Budget Form Submission
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newBudget = parseFloat(budgetAmountInput.value);

    try {
        const budgetRef = doc(db, 'budgets', currentUserId);
        await updateDoc(budgetRef, {
            amount: newBudget
        });
        updateBudgetDisplay(newBudget);
        closeBudgetModal();
    } catch (error) {
        console.error('Error updating budget:', error);
        alert('Error updating budget. Please try again.');
    }
});

// Update Budget Display
function updateBudgetDisplay(budgetAmount) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    currentBudgetSpan.textContent = formatter.format(budgetAmount);
    
    // Update total spent and remaining budget
    const totalSpent = parseFloat(totalSpentSpan.textContent.replace('$', '').replace(',', '')) || 0;
    const remaining = budgetAmount - totalSpent;
    
    remainingBudgetSpan.textContent = formatter.format(remaining);
    
    // Update percentages
    if (budgetAmount > 0) {
        const spentPercentage = (totalSpent / budgetAmount) * 100;
        const remainingPercentage = (remaining / budgetAmount) * 100;
        
        document.querySelector('.card:nth-child(2) .subtitle').textContent = 
            `${spentPercentage.toFixed(1)}% of budget`;
        document.querySelector('.card:nth-child(3) .subtitle').textContent = 
            `${remainingPercentage.toFixed(1)}% left`;
    }
}

// Subscribe to expenses
function subscribeToExpenses() {
    const q = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUserId),
        orderBy('date', 'desc')
    );

    unsubscribeExpenses = onSnapshot(q, (snapshot) => {
        let total = 0;
        expenseList.innerHTML = '';

        snapshot.forEach((doc) => {
            const expense = doc.data();
            total += expense.amount;
            
            const expenseElement = createExpenseElement(expense);
            expenseList.appendChild(expenseElement);
        });

        updateTotalSpent(total);
    });
}

// Create Expense Element
function createExpenseElement(expense) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    const expenseElement = document.createElement('div');
    expenseElement.className = 'expense-item';
    expenseElement.innerHTML = `
        <div class="expense-icon ${expense.category.toLowerCase()}"></div>
        <div class="expense-details">
            <h4>${expense.category}</h4>
            <p class="date">${formatDate(expense.date)}</p>
        </div>
        <p class="amount">${formatter.format(expense.amount)}</p>
    `;
    
    return expenseElement;
}

// Format Date
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

// Update total spent and check budget
function updateTotalSpent(total) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    
    totalSpentSpan.textContent = formatter.format(total);
    
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace('$', '').replace(',', ''));
    const remaining = currentBudget - total;
    
    remainingBudgetSpan.textContent = formatter.format(remaining);
    
    if (currentBudget > 0) {
        const spentPercentage = (total / currentBudget) * 100;
        const remainingPercentage = (remaining / currentBudget) * 100;
        
        document.querySelector('.card:nth-child(2) .subtitle').textContent = 
            `${spentPercentage.toFixed(1)}% of budget`;
        document.querySelector('.card:nth-child(3) .subtitle').textContent = 
            `${remainingPercentage.toFixed(1)}% left`;
    }

    // Check if over budget
    if (total > currentBudget) {
        checkBudgetAndNotify(total);
    }
}

// Check budget and notify
async function checkBudgetAndNotify(totalSpent) {
    const budgetRef = doc(db, 'budgets', currentUserId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (budgetDoc.exists()) {
        const budget = budgetDoc.data().amount;
        
        if (totalSpent > budget) {
            // Show notification
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification('Budget Alert', {
                        body: `You have exceeded your monthly budget of $${budget.toLocaleString()}!`,
                        icon: '/favicon.ico'
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('Budget Alert', {
                                body: `You have exceeded your monthly budget of $${budget.toLocaleString()}!`,
                                icon: '/favicon.ico'
                            });
                        }
                    });
                }
            }
        }
    }
}

// Function to calculate 50/30/20 rule breakdown
function calculateBudgetRule(monthlyBudget) {
    return {
        needs: monthlyBudget * 0.5,
        wants: monthlyBudget * 0.3,
        savings: monthlyBudget * 0.2
    };
}

// Function to calculate spending by category
function calculateCategorySpending(expenses) {
    const spending = {
        needs: 0,
        wants: 0,
        savings: 0
    };

    expenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        if (category.includes('bills') || category.includes('groceries') || category.includes('utilities')) {
            spending.needs += expense.amount;
        } else if (category.includes('savings') || category.includes('investment')) {
            spending.savings += expense.amount;
        } else {
            spending.wants += expense.amount;
        }
    });

    return spending;
}

// Function to update the 50/30/20 rule display
function updateBudgetRuleDisplay(monthlyBudget, expenses) {
    const budgetRule = calculateBudgetRule(monthlyBudget);
    const spending = calculateCategorySpending(expenses);

    // Update needs card
    const needsProgress = document.querySelector('.needs-card .progress');
    const needsAmount = document.querySelector('.needs-card .amount');
    const needsRemaining = document.querySelector('.needs-card .remaining');
    const needsPercentage = (spending.needs / budgetRule.needs) * 100;
    
    needsProgress.style.width = `${Math.min(needsPercentage, 100)}%`;
    needsAmount.textContent = formatCurrency(spending.needs);
    needsRemaining.textContent = formatCurrency(Math.max(budgetRule.needs - spending.needs, 0));

    // Update wants card
    const wantsProgress = document.querySelector('.wants-card .progress');
    const wantsAmount = document.querySelector('.wants-card .amount');
    const wantsRemaining = document.querySelector('.wants-card .remaining');
    const wantsPercentage = (spending.wants / budgetRule.wants) * 100;
    
    wantsProgress.style.width = `${Math.min(wantsPercentage, 100)}%`;
    wantsAmount.textContent = formatCurrency(spending.wants);
    wantsRemaining.textContent = formatCurrency(Math.max(budgetRule.wants - spending.wants, 0));

    // Update savings card
    const savingsProgress = document.querySelector('.savings-card .progress');
    const savingsAmount = document.querySelector('.savings-card .amount');
    const savingsRemaining = document.querySelector('.savings-card .remaining');
    const savingsPercentage = (spending.savings / budgetRule.savings) * 100;
    
    savingsProgress.style.width = `${Math.min(savingsPercentage, 100)}%`;
    savingsAmount.textContent = formatCurrency(spending.savings);
    savingsRemaining.textContent = formatCurrency(Math.max(budgetRule.savings - spending.savings, 0));
}

// Update the existing subscribeToExpenses function to include budget rule updates
function subscribeToExpenses(userId) {
    const expensesRef = collection(db, 'users', userId, 'expenses');
    const q = query(expensesRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const expenses = [];
        snapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() });
        });
        
        updateExpensesList(expenses);
        updateTotalSpent(expenses);
        
        // Get the current monthly budget and update the budget rule display
        const budgetRef = doc(db, 'users', userId, 'settings', 'budget');
        getDoc(budgetRef).then((budgetDoc) => {
            if (budgetDoc.exists()) {
                const monthlyBudget = budgetDoc.data().amount;
                updateBudgetRuleDisplay(monthlyBudget, expenses);
            }
        });
    });
}