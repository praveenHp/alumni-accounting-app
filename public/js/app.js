// Alumni Accounting App - Frontend JavaScript

class AlumniAccountingApp {
    constructor() {
        this.apiBase = '/api';
        this.currentTransactions = [];

        // ✏️ EDIT BATCHMATE NAMES HERE - Add, remove, or modify names as needed
        this.batchmateNames = [
            'Asha P T',
'Asharani S R',
'Ashwath',
'Bhavya V T',
'Chandan A',
'Chaithra J',
'Gowtham N',
'Gowtham S B',
'Harini B S',
'Harish',          
'Irfan',
'Kiran G',
'Likith K V',
'Mamatharani',
'Manu K N',
'Manu L',
'Manu S',
'NaviKiran R K',
'Neeraja M D',
'Praveen H P',
'Ravi H L',
'Rahul B V',
'Sachin K Gowda',
'Sanju K H',
'Santhosh Yadav N U',
'Savitha B L',
'Savitha G',
'Siddartha K',
'Shivraj Odeyar',
'Shresta S ',
'Shruthi S D',
'Sowmyashree R V',
'Sowmya S G',
'Suma T S',
'Sunil B S',
'Sushmika S K',
'Triveni S V',
'Uma Maheshwari K R',
'Usha Rani',
'Varalakshmi',
'Vasanth Kumar S',
'Veena B P',
'Vishwas Bhat',
'Vishwas D N',
'Bank Interest'
        ];

        // Initialize with error handling
        try {
            this.init();
        } catch (error) {
            console.error('Error in constructor init:', error);
        }
    }

    init() {
        try {
            console.log('Initializing app...');
            this.populatePersonDropdowns();
            this.bindEvents();
            this.setDefaultDate();
            console.log('App initialized successfully');

            // Load data after a short delay to ensure DOM is ready
            setTimeout(() => {
                console.log('Loading initial data...');
                this.loadInitialData().catch(error => {
                    console.error('Error loading initial data:', error);
                    try {
                        this.showAlert('Error loading data. Please refresh the page.', 'danger');
                    } catch (alertError) {
                        console.error('Could not show alert:', alertError);
                    }
                });
            }, 100);
        } catch (error) {
            console.error('Error in init method:', error);
            throw error;
        }
    }

    bindEvents() {
        // Form submission
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                this.handleTransactionSubmit(e);
            });
        }

        // Export functionality
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTransactions();
            });
        }

        // Clear filters functionality
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Apply filters functionality
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Real-time filter changes (except dates - they need apply button)
        ['filterType', 'filterCategory', 'filterPerson', 'filterMode'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Date filters - don't auto-apply, wait for apply button
        ['startDate', 'endDate'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    // Just indicate that filters have changed, don't auto-apply
                    this.highlightApplyButton();
                });
            }
        });

        // Date preset buttons
        this.bindDatePresets();

        // Handle fromPerson dropdown change
        document.getElementById('fromPerson').addEventListener('change', (e) => {
            const otherContainer = document.getElementById('otherPersonContainer');
            if (e.target.value === 'Other') {
                otherContainer.style.display = 'block';
                document.getElementById('otherPerson').required = true;
            } else {
                otherContainer.style.display = 'none';
                document.getElementById('otherPerson').required = false;
                document.getElementById('otherPerson').value = '';
            }
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const transactionDate = document.getElementById('transactionDate');
        if (transactionDate) {
            transactionDate.value = today;
        }
    }

    // Populate person dropdowns with batchmate names
    populatePersonDropdowns() {
        // Populate transaction form dropdown
        const fromPersonSelect = document.getElementById('fromPerson');
        if (fromPersonSelect) {
            // Clear existing options except the first one and "Other"
            fromPersonSelect.innerHTML = '<option value="">Select Person</option>';

            // Add batchmate names
            this.batchmateNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                fromPersonSelect.appendChild(option);
            });

            // Add "Other" option at the end
            const otherOption = document.createElement('option');
            otherOption.value = 'Other';
            otherOption.textContent = 'Other';
            fromPersonSelect.appendChild(otherOption);
        }

        // Populate filter dropdown
        const filterPersonSelect = document.getElementById('filterPerson');
        if (filterPersonSelect) {
            filterPersonSelect.innerHTML = '<option value="">All Persons</option>';

            // Add batchmate names to filter
            this.batchmateNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                filterPersonSelect.appendChild(option);
            });
        }
    }

    async loadInitialData() {
        try {
            // Show loading state
            this.showLoadingState();

            await Promise.all([
                this.loadBalance(),
                this.loadTransactions(),
                this.loadStats()
            ]);

            // Hide loading state
            this.hideLoadingState();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showAlert('Error loading data. Please refresh the page.', 'danger');
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        // Update balance display
        const balanceElement = document.getElementById('currentBalance');
        if (balanceElement) {
            balanceElement.textContent = 'Loading...';
        }

        // Update stats
        const creditsElement = document.getElementById('totalCredits');
        const debitsElement = document.getElementById('totalDebits');
        if (creditsElement) creditsElement.textContent = 'Loading...';
        if (debitsElement) debitsElement.textContent = 'Loading...';
    }

    hideLoadingState() {
        // Loading states will be replaced by actual data
        // This method is here for future enhancements
    }

    async loadBalance() {
        try {
            const response = await fetch(`${this.apiBase}/transactions/balance`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success) {
                this.updateBalanceDisplay(data.balance);
            } else {
                throw new Error('Failed to load balance');
            }
        } catch (error) {
            console.error('Error loading balance:', error);
            // Set default balance on error
            this.updateBalanceDisplay(0);
        }
    }

    async loadTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const response = await fetch(`${this.apiBase}/transactions?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success) {
                this.currentTransactions = data.transactions;
                this.renderTransactions(data.transactions);
            } else {
                throw new Error('Failed to load transactions');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            // Show empty state on error
            this.currentTransactions = [];
            this.renderTransactions([]);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/transactions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success) {
                const credits = data.transactions
                    .filter(t => t.type === 'credit')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                const debits = data.transactions
                    .filter(t => t.type === 'debit')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                document.getElementById('totalCredits').textContent = this.formatIndianCurrency(credits);
                document.getElementById('totalDebits').textContent = this.formatIndianCurrency(debits);
            } else {
                throw new Error('Failed to load stats');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values on error
            document.getElementById('totalCredits').textContent = this.formatIndianCurrency(0);
            document.getElementById('totalDebits').textContent = this.formatIndianCurrency(0);
        }
    }

    async handleTransactionSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(form);

            // Determine the fromPerson value
            let fromPersonValue = document.getElementById('fromPerson').value;
            if (fromPersonValue === 'Other') {
                fromPersonValue = document.getElementById('otherPerson').value;
            }

            const transactionData = {
                type: document.getElementById('transactionType').value,
                amount: parseFloat(document.getElementById('amount').value),
                description: document.getElementById('description').value.trim() || 'No description',
                category: document.getElementById('category').value || null,
                fromPerson: fromPersonValue || null,
                mode: document.getElementById('mode').value || null,
                date: document.getElementById('transactionDate').value || null
            };

            const response = await fetch(`${this.apiBase}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Transaction added successfully!', 'success');
                form.reset();
                this.setDefaultDate();
                
                // Reload data
                await this.loadInitialData();
            } else {
                this.showAlert(data.error || 'Error adding transaction', 'danger');
            }
        } catch (error) {
            console.error('Error submitting transaction:', error);
            this.showAlert('Error submitting transaction', 'danger');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    applyFilters() {
        const filters = {};

        // Get filter values safely
        const typeElement = document.getElementById('filterType');
        const categoryElement = document.getElementById('filterCategory');
        const personElement = document.getElementById('filterPerson');
        const modeElement = document.getElementById('filterMode');
        const startDateElement = document.getElementById('startDate');
        const endDateElement = document.getElementById('endDate');

        if (typeElement && typeElement.value) filters.type = typeElement.value;
        if (categoryElement && categoryElement.value) filters.category = categoryElement.value;
        if (personElement && personElement.value) filters.fromPerson = personElement.value;
        if (modeElement && modeElement.value) filters.mode = modeElement.value;
        if (startDateElement && startDateElement.value) filters.startDate = startDateElement.value;
        if (endDateElement && endDateElement.value) filters.endDate = endDateElement.value;

        console.log('Applying filters:', filters);
        this.loadTransactions(filters);

        // Reset apply button highlight
        this.resetApplyButton();
    }

    clearFilters() {
        // Reset all filter dropdowns and date inputs
        const filterElements = ['filterType', 'filterCategory', 'filterPerson', 'filterMode', 'startDate', 'endDate'];
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Reload all transactions
        this.loadTransactions();

        // Reset apply button highlight
        this.resetApplyButton();
    }

    highlightApplyButton() {
        const applyBtn = document.getElementById('applyFiltersBtn');
        if (applyBtn) {
            applyBtn.classList.remove('btn-primary');
            applyBtn.classList.add('btn-warning');
            applyBtn.innerHTML = '<i class="fas fa-filter me-1"></i>Apply Filters *';
        }
    }

    resetApplyButton() {
        const applyBtn = document.getElementById('applyFiltersBtn');
        if (applyBtn) {
            applyBtn.classList.remove('btn-warning');
            applyBtn.classList.add('btn-primary');
            applyBtn.innerHTML = '<i class="fas fa-filter me-1"></i>Apply Filters';
        }
    }

    bindDatePresets() {
        // Today
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                const today = new Date().toISOString().split('T')[0];
                this.setDateRange(today, today);
            });
        }

        // This Week
        const thisWeekBtn = document.getElementById('thisWeekBtn');
        if (thisWeekBtn) {
            thisWeekBtn.addEventListener('click', () => {
                const today = new Date();
                const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                this.setDateRange(
                    startOfWeek.toISOString().split('T')[0],
                    endOfWeek.toISOString().split('T')[0]
                );
            });
        }

        // This Month
        const thisMonthBtn = document.getElementById('thisMonthBtn');
        if (thisMonthBtn) {
            thisMonthBtn.addEventListener('click', () => {
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                this.setDateRange(
                    startOfMonth.toISOString().split('T')[0],
                    endOfMonth.toISOString().split('T')[0]
                );
            });
        }

        // Last Month
        const lastMonthBtn = document.getElementById('lastMonthBtn');
        if (lastMonthBtn) {
            lastMonthBtn.addEventListener('click', () => {
                const today = new Date();
                const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                this.setDateRange(
                    startOfLastMonth.toISOString().split('T')[0],
                    endOfLastMonth.toISOString().split('T')[0]
                );
            });
        }
    }

    setDateRange(startDate, endDate) {
        const startDateElement = document.getElementById('startDate');
        const endDateElement = document.getElementById('endDate');

        if (startDateElement) startDateElement.value = startDate;
        if (endDateElement) endDateElement.value = endDate;

        // Auto-apply filters when using presets
        this.applyFilters();
    }

    updateBalanceDisplay(balance) {
        const balanceElement = document.getElementById('currentBalance');
        const formattedBalance = this.formatIndianCurrency(balance);
        balanceElement.textContent = formattedBalance;

        // Add color coding (but keep white for contrast)
        balanceElement.style.color = 'white';
    }

    renderTransactions(transactions) {
        const tbody = document.getElementById('transactionsTableBody');
        
        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        <i class="fas fa-inbox me-2"></i>
                        No transactions found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.map(transaction => `
            <tr class="new-transaction">
                <td>${this.formatDate(transaction.date)}</td>
                <td>
                    <span class="transaction-${transaction.type}">
                        <i class="fas fa-arrow-${transaction.type === 'credit' ? 'up' : 'down'} me-1"></i>
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td>${transaction.description}</td>
                <td>${transaction.category || '-'}</td>
                <td>${transaction.from_person || '-'}</td>
                <td>
                    ${transaction.mode ? `<span class="badge bg-${transaction.mode === 'Cash' ? 'success' : 'primary'}">${transaction.mode}</span>` : '-'}
                </td>
                <td class="text-end amount-${transaction.type}">
                    ${transaction.type === 'credit' ? '+' : '-'}${this.formatIndianCurrency(transaction.amount).replace('₹', '₹')}
                </td>
                <td class="text-center">
                    <button class="btn btn-outline-danger btn-sm delete-transaction"
                            data-id="${transaction.id}"
                            data-description="${transaction.description}"
                            data-amount="${this.formatIndianCurrency(transaction.amount)}"
                            title="Delete Transaction">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to delete buttons
        this.bindDeleteButtons();
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No recent transactions</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="recent-transaction ${transaction.type}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${transaction.category || 'Miscellaneous'}</strong>
                        <br>
                        <small class="text-muted">${this.formatDate(transaction.date)}</small>
                    </div>
                    <div class="amount-${transaction.type}">
                        ${transaction.type === 'credit' ? '+' : '-'}${this.formatIndianCurrency(transaction.amount)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format numbers in Indian numbering system
    formatIndianCurrency(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '₹0';

        // Convert to Indian numbering system
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return formatter.format(num);
    }

    // Format numbers without currency symbol (for internal calculations)
    formatIndianNumber(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0';

        const formatter = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return formatter.format(num);
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    exportTransactions() {
        if (this.currentTransactions.length === 0) {
            this.showAlert('No transactions to export', 'warning');
            return;
        }

        const csvContent = this.generateCSV(this.currentTransactions);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `alumni_transactions_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showAlert('Transactions exported successfully!', 'success');
        }
    }

    generateCSV(transactions) {
        const headers = ['Date', 'Type', 'Description', 'Category', 'From/To', 'Mode', 'Amount'];
        const csvRows = [headers.join(',')];

        transactions.forEach(transaction => {
            // Clean description for CSV (escape quotes and handle special characters)
            const cleanDescription = (transaction.description || '').replace(/"/g, '""');

            const row = [
                transaction.date,
                transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1), // Capitalize first letter
                `"${cleanDescription}"`,
                transaction.category || '',
                transaction.from_person || '',
                transaction.mode || '',
                parseFloat(transaction.amount).toFixed(2) // Plain number without commas for Excel calculations
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    // Bind delete button event listeners
    bindDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.delete-transaction');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const transactionId = e.currentTarget.getAttribute('data-id');
                const description = e.currentTarget.getAttribute('data-description');
                const amount = e.currentTarget.getAttribute('data-amount');
                this.confirmDeleteTransaction(transactionId, description, amount);
            });
        });
    }

    // Show confirmation dialog for delete
    confirmDeleteTransaction(transactionId, description, amount) {
        const confirmMessage = `Are you sure you want to delete this transaction?\n\n` +
                              `Description: ${description}\n` +
                              `Amount: ${amount}\n\n` +
                              `This action cannot be undone.`;

        if (confirm(confirmMessage)) {
            this.deleteTransaction(transactionId);
        }
    }

    // Delete transaction
    async deleteTransaction(transactionId) {
        try {
            const response = await fetch(`${this.apiBase}/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('Transaction deleted successfully!', 'success');

                // Reload data to refresh the display
                await this.loadInitialData();
            } else {
                this.showAlert(data.error || 'Error deleting transaction', 'danger');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showAlert('Error deleting transaction', 'danger');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    try {
        new AlumniAccountingApp();
        console.log('App initialization completed');
    } catch (error) {
        console.error('Failed to initialize Alumni Accounting App:', error);
        // Only show error if it's a critical failure
        setTimeout(() => {
            const alertContainer = document.getElementById('alertContainer');
            if (alertContainer) {
                alertContainer.innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Some features may not work properly. Please refresh the page if you encounter issues.
                    </div>
                `;
            }
        }, 1000);
    }
});
