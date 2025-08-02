# Personal Finance Assistant

A comprehensive web application for tracking and managing personal finances with OCR receipt processing capabilities.

## Features

- **User Authentication**: Multi-user support with secure login/registration
- **Income & Expense Tracking**: Add, edit, and categorize financial transactions
- **Receipt OCR**: Extract transaction data from images (PNG, JPG) and PDFs
- **Data Visualization**: Interactive charts showing spending patterns and trends
- **Advanced Filtering**: Filter transactions by date range, category, and amount
- **PDF Export**: Export transaction history as formatted PDF reports
- **Responsive Design**: Mobile-friendly interface using Material-UI

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **OCR Service**: Flask server with Tesseract OCR
- **Authentication**: JWT tokens
- **Charts**: Chart.js with react-chartjs-2
- **PDF Generation**: jsPDF

## Project Structure

```
personal-finance-assistant/
├── backend/                 # Node.js Express API server
│   ├── controllers/         # API controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & validation middleware
│   └── utils/              # Utility functions
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Helper functions
│   │   └── context/        # React context providers
├── flask-server/           # Flask OCR service
│   ├── app.py             # Flask application
│   ├── ocr_service.py     # OCR processing logic
│   └── requirements.txt   # Python dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB (local or Atlas)
- Tesseract OCR

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-finance-assistant
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Install Tesseract OCR**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr
   
   # macOS
   brew install tesseract
   
   # Windows
   # Download from: https://github.com/UB-Mannheim/tesseract/wiki
   ```

4. **Setup Environment Variables**
   
   Create `.env` files in both backend and flask-server directories:
   
   **backend/.env**
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/finance-app
   JWT_SECRET=your-super-secret-jwt-key-here
   FLASK_OCR_URL=http://localhost:5001
   ```
   
   **flask-server/.env**
   ```
   FLASK_PORT=5001
   UPLOAD_FOLDER=uploads
   ```

5. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas connection string in .env
   ```

6. **Run the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on http://localhost:5000
   - Frontend React app on http://localhost:3000
   - Flask OCR service on http://localhost:5001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Transactions
- `GET /api/transactions` - Get all transactions (with pagination & filters)
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/export` - Export transactions as PDF

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category

### OCR
- `POST /api/ocr/process` - Process receipt image/PDF

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Add Transactions**: Manually add income and expenses with categories
3. **Upload Receipts**: Use OCR feature to extract data from receipt images
4. **View Analytics**: Check dashboard for spending patterns and charts
5. **Filter Data**: Use date range and category filters to analyze specific periods
6. **Export Reports**: Generate PDF reports of transaction history

## Development

### Running Individual Services

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Flask OCR service only
cd flask-server && python app.py
```

### Database Schema

- **Users**: Authentication and profile data
- **Transactions**: Income/expense records with categories
- **Categories**: Transaction categorization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 
