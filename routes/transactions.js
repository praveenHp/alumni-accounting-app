const express = require('express');
const router = express.Router();

// Middleware to validate transaction data
const validateTransaction = (req, res, next) => {
    const { type, amount } = req.body;

    // Check required fields
    if (!type || !amount) {
        return res.status(400).json({
            error: 'Missing required fields: type and amount are required'
        });
    }
    
    // Validate transaction type
    if (!['credit', 'debit'].includes(type)) {
        return res.status(400).json({
            error: 'Invalid transaction type. Must be either "credit" or "debit"'
        });
    }
    
    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
            error: 'Amount must be a positive number'
        });
    }
    
    // Validate description if provided
    if (req.body.description && typeof req.body.description !== 'string') {
        return res.status(400).json({
            error: 'Description must be a string'
        });
    }
    
    // Validate date if provided
    if (req.body.date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(req.body.date)) {
            return res.status(400).json({
                error: 'Date must be in YYYY-MM-DD format'
            });
        }
    }

    // Validate fromPerson if provided
    if (req.body.fromPerson && typeof req.body.fromPerson !== 'string') {
        return res.status(400).json({
            error: 'fromPerson must be a string'
        });
    }

    // Validate mode if provided
    if (req.body.mode && !['Cash', 'Online'].includes(req.body.mode)) {
        return res.status(400).json({
            error: 'mode must be either "Cash" or "Online"'
        });
    }

    next();
};

// POST /api/transactions - Create a new transaction
router.post('/', validateTransaction, async (req, res) => {
    try {
        const { type, amount, description, category, fromPerson, mode, date } = req.body;
        const db = req.app.get('database');

        const result = await db.addTransaction(
            type,
            parseFloat(amount),
            description ? description.trim() : 'No description',
            category ? category.trim() : null,
            fromPerson ? fromPerson.trim() : null,
            mode || null,
            date || null
        );
        
        // Get the created transaction
        const transaction = await db.getTransactionById(result.id);
        
        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction: transaction
        });
        
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            error: 'Internal server error while creating transaction'
        });
    }
});

// GET /api/transactions - Get all transactions with optional filtering
router.get('/', async (req, res) => {
    try {
        const db = req.app.get('database');
        const filters = {};
        
        // Extract query parameters for filtering
        if (req.query.type) {
            if (!['credit', 'debit'].includes(req.query.type)) {
                return res.status(400).json({
                    error: 'Invalid type filter. Must be either "credit" or "debit"'
                });
            }
            filters.type = req.query.type;
        }
        
        if (req.query.startDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(req.query.startDate)) {
                return res.status(400).json({
                    error: 'startDate must be in YYYY-MM-DD format'
                });
            }
            filters.startDate = req.query.startDate;
        }
        
        if (req.query.endDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(req.query.endDate)) {
                return res.status(400).json({
                    error: 'endDate must be in YYYY-MM-DD format'
                });
            }
            filters.endDate = req.query.endDate;
        }
        
        if (req.query.category) {
            filters.category = req.query.category;
        }

        if (req.query.fromPerson) {
            filters.fromPerson = req.query.fromPerson;
        }

        if (req.query.mode) {
            if (!['Cash', 'Online'].includes(req.query.mode)) {
                return res.status(400).json({
                    error: 'mode filter must be either "Cash" or "Online"'
                });
            }
            filters.mode = req.query.mode;
        }

        const transactions = await db.getTransactions(filters);
        
        res.json({
            success: true,
            count: transactions.length,
            transactions: transactions
        });
        
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            error: 'Internal server error while fetching transactions'
        });
    }
});

// GET /api/balance - Get current balance
router.get('/balance', async (req, res) => {
    try {
        const db = req.app.get('database');
        const balance = await db.getCurrentBalance();
        
        res.json({
            success: true,
            balance: parseFloat(balance) || 0
        });
        
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({
            error: 'Internal server error while fetching balance'
        });
    }
});

// GET /api/transactions/:id - Get a specific transaction
router.get('/:id', async (req, res) => {
    try {
        const db = req.app.get('database');
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid transaction ID'
            });
        }
        
        const transaction = await db.getTransactionById(id);
        
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found'
            });
        }
        
        res.json({
            success: true,
            transaction: transaction
        });
        
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({
            error: 'Internal server error while fetching transaction'
        });
    }
});

// DELETE /api/transactions/:id - Delete a specific transaction
router.delete('/:id', async (req, res) => {
    try {
        const db = req.app.get('database');
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid transaction ID'
            });
        }

        // First check if transaction exists
        const transaction = await db.getTransactionById(id);
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found'
            });
        }

        // Delete the transaction
        const result = await db.deleteTransaction(id);

        res.json({
            success: true,
            message: 'Transaction deleted successfully',
            deletedTransaction: transaction
        });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            error: 'Internal server error while deleting transaction'
        });
    }
});

module.exports = router;
