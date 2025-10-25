-- Alumni Event Accounting Database Schema

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    category TEXT,
    from_person TEXT,
    mode TEXT CHECK (mode IN ('Cash', 'Online')),
    date DATE NOT NULL DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_from_person ON transactions(from_person);
CREATE INDEX IF NOT EXISTS idx_transactions_mode ON transactions(mode);

-- Create a view for balance calculation
CREATE VIEW IF NOT EXISTS current_balance AS
SELECT 
    COALESCE(
        (SELECT SUM(amount) FROM transactions WHERE type = 'credit') - 
        (SELECT SUM(amount) FROM transactions WHERE type = 'debit'), 
        0
    ) AS balance;

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
    AFTER UPDATE ON transactions
BEGIN
    UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
