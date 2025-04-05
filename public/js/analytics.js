// This file enhances the analytics functionality without changing the UI

// Reference to chart objects to update them later
let categoryChart = null;
let trendChart = null;

// Current time range view (week, month, year)
let currentTimeRange = 'week';

// Initialize the analytics functionality
export function initializeAnalytics() {
    // Initialize charts for the first time
    createCharts();
    
    // Add event listeners to tab buttons
    setupTabButtons();
}

// Set up event listeners for the tab buttons
 function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.chart-controls .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update the time range and refresh charts
            currentTimeRange = button.textContent.toLowerCase();
            updateCharts();
        });
    });
}

// Create the initial charts
function createCharts() {
    // Category chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels:['Groceries', 'Utilities', 'Rent', 'Transportation', 'Entertainment', 'Other'],
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
    trendChart = new Chart(trendCtx, {
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

// Update charts with expense data
export function updateCharts(expenses = []) {
    if (expenses.length === 0) return;
    
    updateCategoryChart(expenses);
    updateTrendChart(expenses);
    updateSpendingInsights(expenses);
}

//Update the category chart with expense data
function updateCategoryChart(expenses) {
    // Filter expenses by selected time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    
    // Calculate totals by category
    const categoryTotals = {
        'groceries': 0,
        'utilities': 0,
        'rent': 0,
        'transportation': 0,
        'entertainment': 0,
        'other': 0
    };
    
    // Sum expenses by category
    filteredExpenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        if (categoryTotals.hasOwnProperty(category)) {
            categoryTotals[category] += expense.amount;
        } else {
            categoryTotals.other += expense.amount;
        }
    });
    
    // Update chart data
    categoryChart.data.datasets[0].data = [
        categoryTotals.groceries,
        categoryTotals.utilities,
        categoryTotals.rent,
        categoryTotals.transportation,
        categoryTotals.entertainment,
        categoryTotals.other
    ];
    
    // Update chart
    categoryChart.update();
}

// Update the trend chart with expense data
function updateTrendChart(expenses) {
    // Filter expenses by selected time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    
    let labels = [];
    let data = [];
    
    // Set up labels and data structure based on time range
    if(currentTimeRange === 'week') {
        // Use proper day names
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        labels = [...dayNames];
        data = [0, 0, 0, 0, 0, 0, 0];
        
        // Group expenses by day of week
        filteredExpenses.forEach(expense => {
            // Create a date object from the expense date
            // Handle direct ISO strings
            let expenseDate;
            if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Split YYYY-MM-DD into parts
                const [year, month, day] = expense.date.split('-').map(Number);
                // Create date with correct components (month is 0-indexed)
                expenseDate = new Date(year, month - 1, day, 12, 0, 0);
            } else {
                expenseDate = new Date(expense.date);
            }
            
            // Get day of week (0 = Sunday, 1 = Monday, etc.)
            const dayOfWeek = expenseDate.getDay();
            // Convert to our array index (0 = Monday, 6 = Sunday)
           const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            
            data[adjustedIndex] += expense.amount;
        });
    } 
    else if (currentTimeRange === 'month') {
        // Use last 30 days, grouped by week
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = [0, 0, 0, 0];
        
        // Get current date
        const today = new Date();
        const todayFormatted = formatDateToYYYYMMDD(today);
        
        // Group expenses by week
        filteredExpenses.forEach(expense => {
            // Get the date difference in days
            let daysSince;
            
             if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // For ISO date strings, calculate days between dates
                const expenseDateParts = expense.date.split('-').map(Number);
                const expenseDate = new Date(expenseDateParts[0], expenseDateParts[1] - 1, expenseDateParts[2]);
                
                // Calculate days between dates
                const diffTime = today.getTime() - expenseDate.getTime();
                daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            } 
            else {
                // For other formats, use provided date object
                const expenseDate = new Date(expense.date);
                const diffTime = today.getTime() - expenseDate.getTime();
                daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            
            // Assign to appropriate week
            const weekIndex = Math.min(Math.floor(daysSince / 7), 3);
            data[weekIndex] += expense.amount;
        });
        
        // Reverse the data to show oldest to newest
        data.reverse();
    }
    else if (currentTimeRange === 'year') {
        // Use last 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels = [];
        data = Array(12).fill(0);
        
        // Get current month and year
        const today = new Date();
        const currentMonth = today.getMonth();
        
        // Set up labels for last 12 months
        for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth - 11 + i + 12) % 12; // Go back 11 months and loop
            labels.push(months[monthIndex]);
        }
        
        // Group expenses by month
        filteredExpenses.forEach(expense => {
            // Get the month from the expense date
            let expenseMonth;
            
            if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Extract month from YYYY-MM-DD format (1-indexed)
                expenseMonth = parseInt(expense.date.split('-')[1], 10) - 1;
            } 
             else {
                // For other formats, use provided date object
                expenseMonth = new Date(expense.date).getMonth();
            }
            
           // Calculate position in the data array (0-11)
            const monthsAgo = (currentMonth - expenseMonth + 12) % 12;
            const position = 11 - monthsAgo;
            
            if (position >= 0 && position < 12) {
                data[position] += expense.amount;
            }
        });
    }
    
    // Update chart data
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = data;
    
    // Update chart
    trendChart.update();
}

// Filter expenses based on selected time range
function filterExpensesByTimeRange(expenses) {
    // Get today's date in YYYY-MM-DD format
    const now = new Date();
    const todayFormatted = formatDateToYYYYMMDD(now);
    
    // Calculate start date for filtering
    let startDate;
    
    switch (currentTimeRange) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6); // 7 days including today
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
    }
    
    // Format start date as YYYY-MM-DD
    const startDateFormatted = formatDateToYYYYMMDD(startDate);
    
    // Filter expenses that fall within the date range
    return expenses.filter(expense => {
        // Handle ISO date strings directly
        if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return expense.date >= startDateFormatted && expense.date <= todayFormatted;
        }
        
        // Fallback for other date formats
        const expenseDate = new Date(expense.date);
        const expenseDateFormatted = formatDateToYYYYMMDD(expenseDate);
        return expenseDateFormatted >= startDateFormatted && expenseDateFormatted <= todayFormatted;
    });
}

// Helper function to format a date to YYYY-MM-DD string
function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get insights about spending patterns
export function getSpendingInsights(expenses = []) {
    if (expenses.length === 0) return null;
    
    // Filter expenses by selected time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    
    // Calculate totals by category
    const categoryTotals = {
        'groceries': 0,
        'utilities': 0,
        'rent': 0,
        'transportation': 0,
        'entertainment': 0,
        'other': 0
    };
    
    // Sum expenses by category
    filteredExpenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        if (categoryTotals.hasOwnProperty(category)) {
            categoryTotals[category] += expense.amount;
        } 
        else {
            categoryTotals.other += expense.amount;
        }
    });
    
    // Calculate total spent
    const totalSpent = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    // Find top spending category
    let topCategory = 'other';
    let topAmount = 0;
    
    for (const [category, amount] of Object.entries(categoryTotals)) {
        if (amount > topAmount) {
            topAmount = amount;
            topCategory = category;
        }
    }
    
    // Calculate daily average (use exact number of days for accuracy)
    let daysInRange;
    
    if (currentTimeRange === 'week') {
        daysInRange = 7;
    }
     else if (currentTimeRange === 'month') {
        // For a more accurate calculation, we could determine the actual days in the time range
        // But for simplicity, using 30 days for a month
        daysInRange = 30;
    }
    else { // year
        // Using 365 days for simplicity
        daysInRange = 365;
    }
    
    const dailyAverage = totalSpent / daysInRange;
    
    return {
        topCategory: topCategory.charAt(0).toUpperCase() + topCategory.slice(1),
        topCategoryAmount: topAmount,
        topCategoryPercentage: totalSpent > 0 ? (topAmount / totalSpent) * 100 : 0,
        dailyAverage: dailyAverage,
        totalSpent: totalSpent
    };
}

// Update the spending insights section with data
function updateSpendingInsights(expenses) {
    // Get insights data
    const insights = getSpendingInsights(expenses);
    if (!insights) return;
    
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    
    // Update DOM elements
    document.getElementById('top-category').textContent = 
        `${insights.topCategory} (${formatter.format(insights.topCategoryAmount)})`;
    
    document.getElementById('daily-average').textContent = 
        formatter.format(insights.dailyAverage);
    
    document.getElementById('period-total').textContent = 
        formatter.format(insights.totalSpent);
} 