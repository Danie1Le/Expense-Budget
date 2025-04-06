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
    
    // Set up time frame button listeners
    const timeButtons = document.querySelectorAll('.time-button');
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            timeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current time range
            currentTimeRange = this.dataset.timeframe;
            
            // Always use the global window.userExpenses which is updated in real-time
            if (window.userExpenses && window.userExpenses.length > 0) {
                updateCharts(window.userExpenses);
            } else {
                resetCharts();
                updateSpendingInsights([]);
            }
        });
    });
    
    // If we already have expense data available, update charts
    if (window.userExpenses && window.userExpenses.length > 0) {
        updateCharts(window.userExpenses);
    } else {
        resetCharts();
    }
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
                    labels: {
                        boxWidth: 15,
                        padding: 10
                    }
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
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
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
                legend: {
                        display: true,
                    onClick: null, // Disable clicking on legend
                    labels: {
                        boxWidth: 0, // Remove the colored box/circle
                        padding: 0,  // Remove padding
                        font: {
                            weight: 'bold'
                        },
                        generateLabels: function(chart) {
                            // Custom label generation to remove the color box
                            const datasets = chart.data.datasets;
                            return datasets.map(dataset => {
                                return {
                                    text: dataset.label,
                                    fillStyle: 'transparent',
                                    strokeStyle: 'transparent',
                                    lineWidth: 0,
                                    hidden: false,
                                    index: 0
                                };
                            });
                        }
                    }
                },
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
    // If there are no expenses, reset charts and return
    if (!expenses || expenses.length === 0) {
        resetCharts();
        updateSpendingInsights([]); // Update insights with empty data
        return;
    }
    
    // Filter expenses by the current time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    
    // If there are no expenses in the selected time range, reset charts
    if (filteredExpenses.length === 0) {
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
}

// Reset charts to show empty data state
function resetCharts() {
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
            // Use same order as updateTrendChart: Sunday to Saturday
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            labels.push(...days);
        } else if (currentTimeRange === 'month') {
            // Use same weeks as updateTrendChart
            labels.push('Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5');
        } else { // year
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            labels.push(...months);
        }
        
        // Update chart with empty data
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = Array(labels.length).fill(0);
        trendChart.update();
    }
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
}

// Update the trend chart with expense data
function updateTrendChart(expenses) {
    // Format to group expenses by day, week, or month
    let expensesByPeriod = {};
    let labels = [];
    
    // Determine labels and group expenses based on current time range
    if (currentTimeRange === 'week') {
        // Use days of the week as labels - in order from Sunday to Saturday
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels = [...days];
        
        // Initialize expense totals for each day
        days.forEach(day => {
            expensesByPeriod[day] = 0;
        });
        
        // Group expenses by day of the week
        expenses.forEach(expense => {
            // Handle both string date format and Date objects
            let expenseDate;
            if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // For YYYY-MM-DD format strings, create date using local time to avoid timezone issues
                const [year, month, day] = expense.date.split('-').map(Number);
                // Create date using local components (month is 0-indexed in JavaScript)
                expenseDate = new Date(year, month - 1, day);
            } else {
                // For other formats, use the standard Date constructor
                expenseDate = new Date(expense.date);
            }
            
            // Get the day of week index (0 = Sunday, 1 = Monday, etc.)
            const dayIndex = expenseDate.getDay();
            const dayOfWeek = days[dayIndex];
            
            // Add expense amount to corresponding day
            expensesByPeriod[dayOfWeek] += expense.amount;
        });
    } 
    else if (currentTimeRange === 'month') {
        // Use days of the month grouped into weeks as labels
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
        
        // Initialize expense totals for each week
        labels.forEach(week => {
            expensesByPeriod[week] = 0;
        });
        
        // Group expenses by week of the month
        expenses.forEach(expense => {
            // Handle both string date format and Date objects
            let expenseDate;
            if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = expense.date.split('-').map(Number);
                expenseDate = new Date(year, month - 1, day);
            } else {
                expenseDate = new Date(expense.date);
            }
            
            const dayOfMonth = expenseDate.getDate();
            
            // Assign to week based on day of month
            let week;
            if (dayOfMonth <= 7) week = 'Week 1';
            else if (dayOfMonth <= 14) week = 'Week 2';
            else if (dayOfMonth <= 21) week = 'Week 3';
            else if (dayOfMonth <= 28) week = 'Week 4';
            else week = 'Week 5';
            
            expensesByPeriod[week] += expense.amount;
        });
    } 
    else { // year
        // Use months as labels
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels = [...months];
        
        // Initialize expense totals for each month
        months.forEach(month => {
            expensesByPeriod[month] = 0;
        });
        
        // Group expenses by month
        expenses.forEach(expense => {
            // Handle both string date format and Date objects
            let expenseDate;
            if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = expense.date.split('-').map(Number);
                expenseDate = new Date(year, month - 1, day);
            } else {
                expenseDate = new Date(expense.date);
            }
            
            const monthIndex = expenseDate.getMonth();
            const month = months[monthIndex];
            expensesByPeriod[month] += expense.amount;
        });
    }
    
    // Prepare data for the chart
    const data = labels.map(label => expensesByPeriod[label] || 0);
    
    // Update chart data
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = data;
    trendChart.update();
}

// Filter expenses by the selected time range
function filterExpensesByTimeRange(expenses) {
    // Return empty array if no expenses
    if (!expenses || expenses.length === 0) return [];
    
    // No filtering needed for empty array
    if (expenses.length === 0) return [];
    
    const now = new Date();
    const today = formatDateToYYYYMMDD(now);
    
    return expenses.filter(expense => {
        // Parse the expense date consistently
        let expenseDate;
        if (typeof expense.date === 'string' && expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            expenseDate = expense.date; // Already in YYYY-MM-DD format
        } else if (typeof expense.date === 'string') {
            // Try to parse other string formats to YYYY-MM-DD
            const parsedDate = new Date(expense.date);
            expenseDate = formatDateToYYYYMMDD(parsedDate);
        } else {
            // Handle Date objects
            expenseDate = formatDateToYYYYMMDD(new Date(expense.date));
        }
        
        // For direct string comparison of dates
        if (currentTimeRange === 'week') {
            // Calculate the date 7 days ago
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            const weekAgoStr = formatDateToYYYYMMDD(weekAgo);
            
            // Include if date is between weekAgo and today
            return expenseDate >= weekAgoStr;
        } 
        else if (currentTimeRange === 'month') {
            // Calculate the date 30 days ago
            const monthAgo = new Date(now);
            monthAgo.setDate(now.getDate() - 30);
            const monthAgoStr = formatDateToYYYYMMDD(monthAgo);
            
            // Include if date is between monthAgo and today
            return expenseDate >= monthAgoStr;
        } 
        else { // year
            // Calculate the date 365 days ago
            const yearAgo = new Date(now);
            yearAgo.setDate(now.getDate() - 365);
            const yearAgoStr = formatDateToYYYYMMDD(yearAgo);
            
            // Include if date is between yearAgo and today
            return expenseDate >= yearAgoStr;
        }
    });
}

// Helper function to format a Date to YYYY-MM-DD string
function formatDateToYYYYMMDD(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Update the spending insights in the UI directly from the filtered expenses
function updateSpendingInsights(expenses = []) {
    const topCategoryEl = document.getElementById('top-category');
    const dailyAvgEl = document.getElementById('daily-average');
    const periodTotalEl = document.getElementById('period-total');
    
    if (!topCategoryEl || !dailyAvgEl || !periodTotalEl) {
        return;
    }
    
    // Filter expenses by selected time range
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    
    // Default values for no data
    let topCategory = 'No data yet';
    let dailyAvgText = '$0.00';
    let totalSpentText = '$0.00';
    
    // If we have expenses to analyze
    if (filteredExpenses && filteredExpenses.length > 0) {
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
        let topCategoryName = 'other';
        let topAmount = 0;
        
        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > topAmount) {
                topAmount = amount;
                topCategoryName = category;
            }
        }
        
        // Calculate daily average
        let daysInRange = currentTimeRange === 'week' ? 7 : (currentTimeRange === 'month' ? 30 : 365);
        const dailyAverage = totalSpent / daysInRange;
        
        // Format the values
        topCategory = topAmount > 0 ? 
            `${topCategoryName.charAt(0).toUpperCase() + topCategoryName.slice(1)} ($${topAmount.toFixed(2)})` : 
            'No data yet';
        dailyAvgText = `$${dailyAverage.toFixed(2)}`;
        totalSpentText = `$${totalSpent.toFixed(2)}`;
    }
    
    // Update the UI
    topCategoryEl.textContent = topCategory;
    dailyAvgEl.textContent = dailyAvgText;
    periodTotalEl.textContent = totalSpentText;
    
    // Show empty state message if no data
    const insightsContainer = document.getElementById('spending-insights');
    if (insightsContainer) {
        if (filteredExpenses.length === 0) {
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
} 