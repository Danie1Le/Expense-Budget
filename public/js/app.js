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
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

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

// For debugging
console.log('DOM Elements:');
console.log('budgetModal:', budgetModal);
console.log('editBudgetBtn:', editBudgetBtn);
console.log('closeBudgetModalBtn:', closeBudgetModalBtn);
console.log('cancelBudgetBtn:', cancelBudgetBtn);
console.log('budgetForm:', budgetForm);

let currentUserId = null;
let unsubscribeExpenses = null;

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

// Event Listeners for Budget Modal
editBudgetBtn.addEventListener('click', function(e) {
    console.log('Edit budget button clicked');
    openBudgetModal();
});

closeBudgetModalBtn.addEventListener('click', function(e) {
    console.log('Close budget modal button clicked');
    closeBudgetModal();
});

cancelBudgetBtn.addEventListener('click', function(e) {
    console.log('Cancel budget button clicked');
    closeBudgetModal();
});

// Initialize app when user signs in
auth.onAuthStateChanged(function(user) {
    if (user) {
        console.log('User signed in:', user.uid);
        currentUserId = user.uid;
        
        // Clear example expenses from the list
        expenseList.innerHTML = '';
        
        initializeUserData();
        subscribeToExpenses();
        
        // Set today's date as default for expense form
        const expenseDateInput = document.getElementById('expense-date');
        if (expenseDateInput) {
            expenseDateInput.valueAsDate = new Date();
        }
    } else {
        console.log('User signed out');
        currentUserId = null;
        if (unsubscribeExpenses) {
            unsubscribeExpenses();
        }
    }
});

// Initialize user data
async function initializeUserData() {
    try {
        // Get user's budget data
        const budgetRef = doc(db, 'budgets', currentUserId);
        const budgetDoc = await getDoc(budgetRef);
        
        let budgetAmount = 0;
        
        if (budgetDoc.exists()) {
            budgetAmount = budgetDoc.data().amount || 0;
        } else {
            // Create default budget document if it doesn't exist
            await setDoc(budgetRef, { 
                amount: 0,
                updatedAt: new Date().toISOString()
            });
        }
        
        // Set initial values to zero
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        });
        
        // Update budget displays
        updateBudgetDisplay(budgetAmount);
        
        // Reset total spent and remaining to zero until expenses are loaded
        totalSpentSpan.textContent = formatter.format(0);
        remainingBudgetSpan.textContent = formatter.format(budgetAmount);
        
        document.querySelector('.card:nth-child(2) .subtitle').textContent = '0% of budget';
        document.querySelector('.card:nth-child(3) .subtitle').textContent = '100% left';
        
        console.log('Budget initialized:', budgetAmount);
        
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

// Handle Budget Form Submission
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newBudget = parseFloat(budgetAmountInput.value) || 0;

    try {
        const budgetRef = doc(db, 'budgets', currentUserId);
        await setDoc(budgetRef, {
            amount: newBudget,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        updateBudgetDisplay(newBudget);
        closeBudgetModal();
    } catch (error) {
        console.error('Error updating budget:', error);
        alert('Error updating budget. Please try again.');
    }
});

// Handle Expense Form Submission
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
    
    if (!amount || !category) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        // Create expense object
        const expense = {
            userId: currentUserId,
            amount: amount,
            category: category,
            date: date,
            createdAt: new Date().toISOString()
        };
        
        // Add to Firestore
        await addDoc(collection(db, 'expenses'), expense);
        
        // Manually update UI instead of waiting for the snapshot
        const expenseElement = createExpenseElement(expense);
        
        // Clear the list if it has example items
        if (expenseList.querySelector('.expense-item')) {
            const firstItem = expenseList.querySelector('.expense-item');
            if (firstItem.querySelector('.expense-details h4').textContent === 'Groceries' &&
                firstItem.querySelector('.date').textContent === 'Today') {
                expenseList.innerHTML = '';
            }
        }
        
        // Add the new expense at the top
        expenseList.insertBefore(expenseElement, expenseList.firstChild);
        
        // Update the total spent immediately
        const currentTotal = parseFloat(totalSpentSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const newTotal = currentTotal + amount;
        
        console.log('Current total:', currentTotal);
        console.log('Amount to add:', amount);
        console.log('New total:', newTotal);
        
        updateTotalSpent(newTotal);
        
        // Clear the form
        expenseForm.reset();
        
        // Set today's date as default
        document.getElementById('expense-date').valueAsDate = new Date();
        
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Error adding expense. Please try again.');
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
    const totalSpent = parseFloat(totalSpentSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
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
    } else {
        document.querySelector('.card:nth-child(2) .subtitle').textContent = '0% of budget';
        document.querySelector('.card:nth-child(3) .subtitle').textContent = '0% left';
    }
    
    // Update the 50/30/20 rule breakdown
    updateBudgetRuleDisplay(totalSpent);
}

// Function to update the 50/30/20 rule display 
function updateBudgetRuleDisplay(totalSpent) {
    console.log('Updating budget rule display with total:', totalSpent);
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    console.log('Current budget for rule calculation:', currentBudget);
    
    const budgetRule = calculateBudgetRule(currentBudget);
    
    // Calculate percentages for progress bars
    const percentageSpent = currentBudget > 0 ? (totalSpent / currentBudget) * 100 : 0;
    const needsPercentage = Math.min(percentageSpent, 100);
    const wantsPercentage = Math.min(percentageSpent, 100);
    const savingsPercentage = Math.min(percentageSpent, 100);
    
    // Update needs card
    const needsAmount = document.getElementById('needs-amount');
    const needsProgress = document.getElementById('needs-progress');
    const needsRemaining = document.getElementById('needs-remaining');
    
    needsAmount.textContent = formatter.format(budgetRule.needs);
    needsProgress.style.width = `${needsPercentage}%`;
    const needsLeft = Math.max(budgetRule.needs - (totalSpent * 0.5), 0);
    needsRemaining.textContent = `${formatter.format(needsLeft)} left to spend`;
    
    // Update wants card
    const wantsAmount = document.getElementById('wants-amount');
    const wantsProgress = document.getElementById('wants-progress');
    const wantsRemaining = document.getElementById('wants-remaining');
    
    wantsAmount.textContent = formatter.format(budgetRule.wants);
    wantsProgress.style.width = `${wantsPercentage}%`;
    const wantsLeft = Math.max(budgetRule.wants - (totalSpent * 0.3), 0);
    wantsRemaining.textContent = `${formatter.format(wantsLeft)} left to spend`;
    
    // Update savings card
    const savingsAmount = document.getElementById('savings-amount');
    const savingsProgress = document.getElementById('savings-progress');
    const savingsRemaining = document.getElementById('savings-remaining');
    
    savingsAmount.textContent = formatter.format(budgetRule.savings);
    savingsProgress.style.width = `${savingsPercentage}%`;
    const savingsLeft = Math.max(budgetRule.savings - (totalSpent * 0.2), 0);
    savingsRemaining.textContent = `${formatter.format(savingsLeft)} left to save`;
}

// Subscribe to expenses
function subscribeToExpenses() {
    console.log('Subscribing to expenses...');
    
    const q = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUserId),
        orderBy('date', 'desc')
    );

    unsubscribeExpenses = onSnapshot(q, (snapshot) => {
        let total = 0;
        expenseList.innerHTML = '';
        
        console.log('Got expense snapshot with', snapshot.size, 'documents');

        snapshot.forEach((doc) => {
            const expense = doc.data();
            total += parseFloat(expense.amount) || 0;
            
            const expenseElement = createExpenseElement(expense);
            expenseList.appendChild(expenseElement);
        });
        
        console.log('Total from all expenses:', total);

        updateTotalSpent(total);
    }, error => {
        console.error('Error fetching expenses:', error);
    });
}

// Create Expense Element
function createExpenseElement(expense) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    // Format category to capitalize first letter and handle special cases
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
    console.log('Updating total spent to:', total);
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    
    // Update the total spent display
    totalSpentSpan.textContent = formatter.format(total);
    
    // Get current budget and calculate remaining
    const currentBudget = parseFloat(currentBudgetSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    console.log('Current budget:', currentBudget);
    
    const remaining = currentBudget - total;
    console.log('Remaining budget:', remaining);
    
    // Update remaining budget display
    remainingBudgetSpan.textContent = formatter.format(remaining);
    
    // Update percentages
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

    // Check if over budget and apply visual indicator
    if (total > currentBudget && currentBudget > 0) {
        remainingBudgetSpan.classList.add('negative');
    } else {
        remainingBudgetSpan.classList.remove('negative');
    }
    
    // Update the 50/30/20 rule breakdown
    updateBudgetRuleDisplay(total);
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

// Add reset expenses functionality
resetExpensesBtn.addEventListener('click', async () => {
    if (!currentUserId) return;
    
    if (confirm('Are you sure you want to reset all expenses? This cannot be undone.')) {
        try {
            const q = query(
                collection(db, 'expenses'),
                where('userId', '==', currentUserId)
            );
            
            const querySnapshot = await getDocs(q);
            
            // Delete all expenses
            const batch = db.batch ? db.batch() : writeBatch(db);
            
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            // Clear the UI
            expenseList.innerHTML = '';
            updateTotalSpent(0);
            updateBudgetRuleDisplay(0);
            
            alert('All expenses have been reset!');
        } catch (error) {
            console.error('Error resetting expenses:', error);
            alert('Error resetting expenses. Please try again.');
        }
    }
});