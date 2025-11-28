const request = require('supertest');
const express = require('express');
const Database = require('../database/db');
const transactionRoutes = require('../routes/transactions');

// Create test app
const app = express();
app.use(express.json());

// Create test database instance
let testDb;

beforeAll(async () => {
    testDb = new Database();
    testDb.dbPath = ':memory:'; // Use in-memory database for testing
    await testDb.initialize();
    app.set('database', testDb);
    app.use('/api/transactions', transactionRoutes);
});

afterAll(async () => {
    if (testDb) {
        await new Promise((resolve) => {
            testDb.db.close((err) => {
                if (err) console.error('Error closing database:', err.message);
                resolve();
            });
        });
    }
});

beforeEach(async () => {
    // Clear all transactions before each test
    await new Promise((resolve, reject) => {
        testDb.db.run('DELETE FROM transactions', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
});

describe('Transaction API Tests', () => {
    describe('POST /api/transactions', () => {
        test('should create a credit transaction successfully', async () => {
            const transactionData = {
                type: 'credit',
                amount: 1000.50,
                description: 'Registration fees from John Doe',
                category: 'Registration',
                fromPerson: 'Rahul Sharma',
                mode: 'Online',
                date: '2024-01-15'
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(transactionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.transaction).toMatchObject({
                type: 'credit',
                amount: 1000.50,
                description: 'Registration fees from John Doe',
                category: 'Registration',
                from_person: 'Rahul Sharma',
                mode: 'Online',
                date: '2024-01-15'
            });
            expect(response.body.transaction.id).toBeDefined();
        });

        test('should create a debit transaction successfully', async () => {
            const transactionData = {
                type: 'debit',
                amount: 500.25,
                description: 'Venue booking payment',
                category: 'Venue',
                fromPerson: 'Venue Manager',
                mode: 'Cash'
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(transactionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.transaction.type).toBe('debit');
            expect(response.body.transaction.amount).toBe(500.25);
        });

        test('should reject transaction with missing required fields', async () => {
            const incompleteData = {
                type: 'credit'
                // missing amount
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(incompleteData)
                .expect(400);

            expect(response.body.error).toContain('required fields');
        });

        test('should reject transaction with invalid type', async () => {
            const invalidData = {
                type: 'invalid',
                amount: 100,
                description: 'Test transaction'
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toContain('Invalid transaction type');
        });

        test('should reject transaction with negative amount', async () => {
            const invalidData = {
                type: 'credit',
                amount: -100,
                description: 'Test transaction'
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toContain('positive number');
        });

        test('should reject transaction with invalid date format', async () => {
            const invalidData = {
                type: 'credit',
                amount: 100,
                description: 'Test transaction',
                date: '2024/01/15' // Invalid format
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toContain('YYYY-MM-DD format');
        });

        test('should create transaction without description', async () => {
            const transactionData = {
                type: 'credit',
                amount: 250.00,
                category: 'Registration'
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(transactionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.transaction.description).toBe('No description');
            expect(response.body.transaction.amount).toBe(250.00);
        });

        test('should reject transaction with invalid mode', async () => {
            const invalidData = {
                type: 'credit',
                amount: 100,
                description: 'Test transaction',
                mode: 'Invalid'
            };

            const response = await request(app)
                .post('/api/transactions')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toContain('mode must be either "Cash" or "Online"');
        });
    });

    describe('GET /api/transactions', () => {
        beforeEach(async () => {
            // Add test transactions
            await testDb.addTransaction('credit', 1000, 'Registration fee', 'Registration', 'Rahul Sharma', 'Online', '2024-01-15');
            await testDb.addTransaction('debit', 500, 'Venue cost', 'Venue', 'Venue Manager', 'Cash', '2024-01-16');
            await testDb.addTransaction('credit', 750, 'Sponsorship', 'Miscellaneous', 'Priya Patel', 'Online', '2024-01-17');
        });

        test('should get all transactions', async () => {
            const response = await request(app)
                .get('/api/transactions')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(3);
            expect(response.body.transactions).toHaveLength(3);
        });

        test('should filter transactions by type', async () => {
            const response = await request(app)
                .get('/api/transactions?type=credit')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.transactions.every(t => t.type === 'credit')).toBe(true);
        });

        test('should filter transactions by date range', async () => {
            const response = await request(app)
                .get('/api/transactions?startDate=2024-01-16&endDate=2024-01-17')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
        });

        test('should filter transactions by category', async () => {
            const response = await request(app)
                .get('/api/transactions?category=Venue')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.transactions[0].category).toBe('Venue');
        });

        test('should create transactions with new category names', async () => {
            // Test the new "Events" category
            const eventsTransaction = await request(app)
                .post('/api/transactions')
                .send({
                    type: 'debit',
                    amount: 2000,
                    description: 'Event planning expenses',
                    category: 'Events'
                })
                .expect(201);

            expect(eventsTransaction.body.success).toBe(true);
            expect(eventsTransaction.body.transaction.category).toBe('Events');

            // Test the renamed "Accommodation & Transport" category
            const transportTransaction = await request(app)
                .post('/api/transactions')
                .send({
                    type: 'debit',
                    amount: 1500,
                    description: 'Hotel and travel expenses',
                    category: 'Accommodation & Transport'
                })
                .expect(201);

            expect(transportTransaction.body.success).toBe(true);
            expect(transportTransaction.body.transaction.category).toBe('Accommodation & Transport');

            // Verify filtering works with new categories
            const eventsFilter = await request(app)
                .get('/api/transactions?category=Events')
                .expect(200);

            expect(eventsFilter.body.transactions).toHaveLength(1);
            expect(eventsFilter.body.transactions[0].category).toBe('Events');

            const transportFilter = await request(app)
                .get('/api/transactions?category=' + encodeURIComponent('Accommodation & Transport'))
                .expect(200);

            expect(transportFilter.body.transactions).toHaveLength(1);
            expect(transportFilter.body.transactions[0].category).toBe('Accommodation & Transport');
        });

        test('should filter transactions by fromPerson', async () => {
            const response = await request(app)
                .get('/api/transactions?fromPerson=Rahul Sharma')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.transactions[0].from_person).toBe('Rahul Sharma');
        });

        test('should filter transactions by mode', async () => {
            const response = await request(app)
                .get('/api/transactions?mode=Cash')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.transactions[0].mode).toBe('Cash');
        });

        test('should reject invalid type filter', async () => {
            const response = await request(app)
                .get('/api/transactions?type=invalid')
                .expect(400);

            expect(response.body.error).toContain('Invalid type filter');
        });
    });

    describe('GET /api/transactions/balance', () => {
        test('should return zero balance when no transactions', async () => {
            const response = await request(app)
                .get('/api/transactions/balance')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.balance).toBe(0);
        });

        test('should calculate correct balance with mixed transactions', async () => {
            // Add test transactions: +1000 -500 +750 = 1250
            await testDb.addTransaction('credit', 1000, 'Registration fee', null, 'Rahul Sharma', 'Online');
            await testDb.addTransaction('debit', 500, 'Venue cost', null, 'Venue Manager', 'Cash');
            await testDb.addTransaction('credit', 750, 'Sponsorship', null, 'Priya Patel', 'Online');

            const response = await request(app)
                .get('/api/transactions/balance')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.balance).toBe(1250);
        });

        test('should handle negative balance correctly', async () => {
            // Add transactions: +500 -1000 = -500
            await testDb.addTransaction('credit', 500, 'Small donation', null, 'Amit Kumar', 'Cash');
            await testDb.addTransaction('debit', 1000, 'Large expense', null, 'Vendor', 'Online');

            const response = await request(app)
                .get('/api/transactions/balance')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.balance).toBe(-500);
        });
    });

    describe('GET /api/transactions/:id', () => {
        test('should get specific transaction by ID', async () => {
            const result = await testDb.addTransaction('credit', 1000, 'Test transaction', null, 'Test Person', 'Cash');
            const transactionId = result.id;

            const response = await request(app)
                .get(`/api/transactions/${transactionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.transaction.id).toBe(transactionId);
            expect(response.body.transaction.description).toBe('Test transaction');
        });

        test('should return 404 for non-existent transaction', async () => {
            const response = await request(app)
                .get('/api/transactions/99999')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });

        test('should return 400 for invalid transaction ID', async () => {
            const response = await request(app)
                .get('/api/transactions/invalid')
                .expect(400);

            expect(response.body.error).toContain('Invalid transaction ID');
        });
    });

    describe('DELETE /api/transactions/:id', () => {
        test('should delete a transaction successfully', async () => {
            // First create a transaction
            const result = await testDb.addTransaction('credit', 500, 'Test transaction', null, 'Test Person', 'Cash');
            const transactionId = result.id;

            const response = await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');
            expect(response.body.deletedTransaction).toBeDefined();

            // Verify transaction is actually deleted
            const getResponse = await request(app)
                .get(`/api/transactions/${transactionId}`)
                .expect(404);
        });

        test('should return 404 for non-existent transaction', async () => {
            const response = await request(app)
                .delete('/api/transactions/99999')
                .expect(404);

            expect(response.body.error).toContain('not found');
        });

        test('should return 400 for invalid transaction ID', async () => {
            const response = await request(app)
                .delete('/api/transactions/invalid')
                .expect(400);

            expect(response.body.error).toContain('Invalid transaction ID');
        });

        test('should update balance after deletion', async () => {
            // Create two transactions
            const result1 = await testDb.addTransaction('credit', 1000, 'Credit transaction', null, 'Person 1', 'Cash');
            const result2 = await testDb.addTransaction('debit', 300, 'Debit transaction', null, 'Person 2', 'Online');

            // Check initial balance: 1000 - 300 = 700
            let balanceResponse = await request(app)
                .get('/api/transactions/balance')
                .expect(200);
            expect(balanceResponse.body.balance).toBe(700);

            // Delete the debit transaction
            await request(app)
                .delete(`/api/transactions/${result2.id}`)
                .expect(200);

            // Check updated balance: should be 1000
            balanceResponse = await request(app)
                .get('/api/transactions/balance')
                .expect(200);
            expect(balanceResponse.body.balance).toBe(1000);
        });
    });
});

describe('Database Integration Tests', () => {
    beforeEach(async () => {
        // Clear transactions for integration tests too
        await new Promise((resolve, reject) => {
            testDb.db.run('DELETE FROM transactions', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    test('should maintain data integrity with sequential transactions', async () => {
        // Create multiple sequential transactions
        for (let i = 0; i < 10; i++) {
            await testDb.addTransaction('credit', 100, `Transaction ${i}`, null, `Person ${i}`, i % 2 === 0 ? 'Cash' : 'Online');
        }

        const balance = await testDb.getCurrentBalance();
        expect(balance).toBe(1000); // 10 * 100

        const transactions = await testDb.getTransactions();
        expect(transactions).toHaveLength(10);
    });

    test('should handle decimal amounts correctly', async () => {
        await testDb.addTransaction('credit', 123.45, 'Decimal test', null, 'Test Person 1', 'Cash');
        await testDb.addTransaction('debit', 23.45, 'Decimal test 2', null, 'Test Person 2', 'Online');
        
        const balance = await testDb.getCurrentBalance();
        expect(balance).toBe(100); // 123.45 - 23.45
    });
});
