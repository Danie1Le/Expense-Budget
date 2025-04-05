// This file enhances the analytics functionality without changing the UI

// Reference to chart objects to update them later
let categoryChart = null;
let trendChart = null;

// Current time range view (week, month, year)
let currentTimeRange = 'week';

// Initialize the analytics functionality
export function initializeAnalytics() {
    console.log('Initializing analytics');
    
    // Initialize charts for the first time
    createCharts();
    
    // Add event listeners to tab buttons
    setupTabButtons();
    
    // If we already have expense data available, update charts
    if (window.userExpenses && window.userExpenses.length > 0) {
        console.log(`Initializing charts with ${window.userExpenses.length} existing expenses`);
        updateCharts(window.userExpenses);
    } else {
        console.log('No initial expense data, showing empty charts');
        resetCharts();
    }
    
    console.log('Analytics initialization complete');
}

// Set up event listeners for the tab buttons
function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.time-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update the time range
            const previousTimeRange = currentTimeRange;
            currentTimeRange = button.dataset.timeframe;
            
            console.log(`Time range changed from ${previousTimeRange} to ${currentTimeRange}`);
            
            // Immediately refresh charts with global userExpenses
            // This is defined in main.js and should be available
            if (window.userExpenses && window.userExpenses.length > 0) {
                updateCharts(window.userExpenses);
            } else {
                // If there's no global userExpenses, we'll need to reset charts
                resetCharts();
                updateSpendingInsights([]);
            }
        });
    });
}

// Create the initial charts
function createCharts() {
    // Define our standard category colors - exactly match CSS
    const categoryColors = [
        '#4CAF50', // Green for Groceries
        '#2196F3', // Blue for Utilities
        '#9C27B0', // Purple for Rent
        '#FF9800', // Orange for Transportation
        '#E91E63', // Pink for Entertainment
        '#607D8B'  // Blue Grey for Other
    ];

    // Category chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Groceries', 'Utilities', 'Rent', 'Transportation', 'Entertainment', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: categoryColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
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
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Update all charts with new data
export function updateCharts(expenses = []) {
    console.log(`Updating charts with ${expenses ? expenses.length : 0} expenses`);
    
    // If there are no expenses, reset charts and return
    if (!expenses || expenses.length === 0) {
        console.log('No expenses data, resetting charts');
        resetCharts();
        updateSpendingInsights([]); // Update insights with empty data
        return;
    }
    
    // Filter expenses by the current time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    console.log(`Filtered to ${filteredExpenses.length} expenses in ${currentTimeRange} time range`);
    
    // If there are no expenses in the selected time range, reset charts
    if (filteredExpenses.length === 0) {
        console.log('No expenses in current time range, resetting charts');
        resetCharts();
        updateSpendingInsights([]); // Update insights with empty data
        return;
    }
    
    // Update the category distribution chart
    updateCategoryChart(filteredExpenses);
    
    // Update the spending trend chart
    updateTrendChart(filteredExpenses);
    
    // Update spending insights
    updateSpendingInsights(filteredExpenses);
    
    console.log('Charts update completed');
}

// Reset charts to show empty data state
export function resetCharts() {
    console.log('Resetting charts to empty state');
    
    // Reset category chart
    if (categoryChart) {
        categoryChart.data.labels = ['No Data'];
        categoryChart.data.datasets[0].data = [0];
        categoryChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        categoryChart.update();
    }
    
    // Reset trend chart 
    if (trendChart) {
        const labels = [];
        
        // Generate appropriate empty labels based on current time range
        if (currentTimeRange === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            labels.push(...days);
        } else if (currentTimeRange === 'month') {
            // Generate labels for days 1-30
            for (let i = 1; i <= 30; i++) {
                labels.push(i.toString());
            }
        } else { // year
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            labels.push(...months);
        }
        
        // Update chart with empty data
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = Array(labels.length).fill(0);
        trendChart.update();
    }
    
    console.log('Charts reset completed');
}

// Update the category chart with expense data
function updateCategoryChart(expenses) {
    // Define consistent colors for each category - exactly match CSS
    const categoryColors = {
        'groceries': '#4CAF50',     // Green
        'utilities': '#2196F3',     // Blue
        'rent': '#9C27B0',          // Purple
        'transportation': '#FF9800', // Orange
        'entertainment': '#E91E63',  // Pink
        'other': '#607D8B'          // Blue Grey
    };
    
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
    expenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        if (categoryTotals.hasOwnProperty(category)) {
            categoryTotals[category] += expense.amount;
        } else {
            categoryTotals.other += expense.amount;
        }
    });
    
    // Filter out categories with zero amounts
    const nonZeroCategories = Object.entries(categoryTotals)
        .filter(([_, amount]) => amount > 0)
        .map(([category, amount]) => ({ category, amount }));
    
    // If no categories have data, show a placeholder
    if (nonZeroCategories.length === 0) {
        categoryChart.data.labels = ['No Data'];
        categoryChart.data.datasets[0].data = [1];
        categoryChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
    } else {
        // Prepare data for the chart
        const labels = nonZeroCategories.map(item => {
            // Capitalize first letter of category
            return item.category.charAt(0).toUpperCase() + item.category.slice(1);
        });
        
        const data = nonZeroCategories.map(item => item.amount);
        
        const backgroundColor = nonZeroCategories.map(item => 
            categoryColors[item.category]
        );
        
        // Update chart data
        categoryChart.data.labels = labels;
        categoryChart.data.datasets[0].data = data;
        categoryChart.data.datasets[0].backgroundColor = backgroundColor;
    }
    
    // Update chart
    categoryChart.update();
    
    console.log('Category chart updated with data:', categoryChart.data);
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
    console.log('Calculating spending insights for', expenses.length, 'expenses');
    
    if (!expenses || expenses.length === 0) {
        console.log('No expenses data for insights');
        return {
            topCategory: 'None',
            topCategoryAmount: 0,
            topCategoryPercentage: 0,
            dailyAverage: 0,
            totalSpent: 0
        };
    }
    
    // Filter expenses by selected time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    console.log('Filtered to', filteredExpenses.length, 'expenses in the', currentTimeRange, 'time range');
    
    // If no expenses in the current time range
    if (filteredExpenses.length === 0) {
        return {
            topCategory: 'None',
            topCategoryAmount: 0,
            topCategoryPercentage: 0,
            dailyAverage: 0,
            totalSpent: 0
        };
    }
    
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
    
    // If no spending in any category
    if (topAmount === 0) {
        topCategory = 'None';
    }
    
    // Calculate daily average (use exact number of days for accuracy)
    let daysInRange;
    
    if (currentTimeRange === 'week') {
        daysInRange = 7;
    } else if (currentTimeRange === 'month') {
        // For a more accurate calculation, we could determine the actual days in the time range
        // But for simplicity, using 30 days for a month
        daysInRange = 30;
    } else { // year
        // Using 365 days for simplicity
        daysInRange = 365;
    }
    
    const dailyAverage = totalSpent / daysInRange;
    
    const result = {
        topCategory: topCategory === 'None' ? 'None' : topCategory.charAt(0).toUpperCase() + topCategory.slice(1),
        topCategoryAmount: topAmount,
        topCategoryPercentage: totalSpent > 0 ? (topAmount / totalSpent) * 100 : 0,
        dailyAverage: dailyAverage,
        totalSpent: totalSpent
    };
    
    console.log('Spending insights:', result);
    return result;
}

// Update the spending insights in the UI
export function updateSpendingInsights(expenses = []) {
    const insights = getSpendingInsights(expenses);
    console.log('Updating spending insights UI with:', insights);
    
    const topCategoryEl = document.getElementById('top-category');
    const dailyAvgEl = document.getElementById('daily-average');
    const periodTotalEl = document.getElementById('period-total');
    
    if (!topCategoryEl || !dailyAvgEl || !periodTotalEl) {
        console.warn('Some spending insights elements not found in the DOM');
        return;
    }
    
    if (insights) {
        // Format the values
        const topCategoryText = insights.topCategory === 'None' ? 
            'No data yet' : 
            `${insights.topCategory} ($${insights.topCategoryAmount.toFixed(2)})`;
        const dailyAvgText = `$${insights.dailyAverage.toFixed(2)}`;
        const totalSpentText = `$${insights.totalSpent.toFixed(2)}`;
        
        // Update the UI
        topCategoryEl.textContent = topCategoryText;
        dailyAvgEl.textContent = dailyAvgText;
        periodTotalEl.textContent = totalSpentText;
        
        // Show empty state message if no data
        const insightsContainer = document.getElementById('spending-insights');
        if (insightsContainer) {
            if (insights.totalSpent === 0) {
                // Add empty state if it doesn't exist
                if (!document.querySelector('.insights-empty-state')) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'insights-empty-state';
                    emptyState.textContent = 'Add expenses to see spending insights';
                    emptyState.style.textAlign = 'center';
                    emptyState.style.padding = '20px 0';
                    emptyState.style.fontStyle = 'italic';
                    emptyState.style.color = '#888';
                    
                    // Add empty state before or after the insights content
                    insightsContainer.appendChild(emptyState);
                    
                    // Hide the individual insight items
                    const insightItems = insightsContainer.querySelectorAll('.insight-item');
                    insightItems.forEach(item => item.style.display = 'none');
                }
            } else {
                // Show the insights and remove empty state if it exists
                const emptyState = document.querySelector('.insights-empty-state');
                if (emptyState) {
                    emptyState.remove();
                }
                
                // Show the individual insight items
                const insightItems = insightsContainer.querySelectorAll('.insight-item');
                insightItems.forEach(item => item.style.display = 'block');
            }
        }
    } else {
        console.warn('No insights available to update UI');
    }
}

// Set up event listeners for timeframe selection
export function setupTimeframeListeners(initialExpenses = []) {
    console.log('Setting up timeframe listeners');
    
    // Store initial expenses in window.userExpenses if not already set
    if (!window.userExpenses) {
        window.userExpenses = initialExpenses;
    }
    
    const timeButtons = document.querySelectorAll('.time-button');
    
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            timeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current time range
            const newTimeRange = this.dataset.timeframe;
            console.log(`Changing time range from ${currentTimeRange} to ${newTimeRange}`);
            currentTimeRange = newTimeRange;
            
            // Always use the global window.userExpenses which is updated in real-time
            if (window.userExpenses && window.userExpenses.length > 0) {
                console.log(`Updating charts for new time range: ${newTimeRange} with ${window.userExpenses.length} expenses`);
                updateCharts(window.userExpenses);
            } else {
                console.log(`Resetting charts for new time range: ${newTimeRange} (no expenses)`);
                resetCharts();
                updateSpendingInsights([]);
            }
        });
    });
    
    console.log('Timeframe listeners setup completed');
} 