import { auth, db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

let categoryChart = null;
let trendChart = null;

// Initialize charts when user signs in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await updateCharts(user.uid);
    } else {
        if (categoryChart) categoryChart.destroy();
        if (trendChart) trendChart.destroy();
    }
});

async function updateCharts(userId) {
    const expenses = await fetchUserExpenses(userId);
    updateCategoryChart(expenses);
    updateTrendChart(expenses);
}

async function fetchUserExpenses(userId) {
    const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
}

function updateCategoryChart(expenses) {
    const categoryData = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#4299E1',
                    '#48BB78',
                    '#ED8936',
                    '#9F7AEA',
                    '#F56565',
                    '#38B2AC'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Expenses by Category',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateTrendChart(expenses) {
    const monthlyData = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
    }, {});

    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) trendChart.destroy();
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthlyData),
            datasets: [{
                label: 'Monthly Expenses',
                data: Object.values(monthlyData),
                borderColor: '#4299E1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Expense Trend',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    }
                }
            }
        }
    });
}

// Export function to update charts
export function refreshCharts() {
    if (auth.currentUser) {
        updateCharts(auth.currentUser.uid);
    }
} 