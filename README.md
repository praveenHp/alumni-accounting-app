# Alumni Event Accounting Application

A web application for managing accounting records for alumni events, including credit and debit transactions, balance tracking, and statement generation.

## Features

- **Transaction Management**: Add credit and debit entries through web forms
- **Real-time Balance**: Always displays current balance
- **Statement Generation**: View complete transaction history
- **Filtering**: Filter transactions by type (credit/debit) and date ranges
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript with Bootstrap
- **Testing**: Jest and Supertest

## Project Structure

```
alumni-accounting-app/
├── server.js              # Main server file
├── database/
│   ├── db.js              # Database connection and setup
│   └── schema.sql         # Database schema
├── routes/
│   └── transactions.js    # API routes for transactions
├── public/
│   ├── index.html         # Main web interface
│   ├── css/
│   │   └── style.css      # Custom styles
│   └── js/
│       └── app.js         # Frontend JavaScript
└── tests/
    └── transactions.test.js # API tests
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions` - Get all transactions with optional filtering
- `GET /api/balance` - Get current balance

## Testing

Run tests with:
```bash
npm test
```
