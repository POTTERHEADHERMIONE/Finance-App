# FINLY
A comprehensive web application for tracking and managing personal finances with OCR receipt processing capabilities.
## Web Application Images 
1. Dashboard
<img width="853" height="472" alt="Screenshot 2025-08-02 154345" src="https://github.com/user-attachments/assets/391cf160-4b91-4dc8-bd44-0f8d08ea4f28" />
<img width="850" height="471" alt="Screenshot 2025-08-02 154420" src="https://github.com/user-attachments/assets/38a0df15-674b-49cb-bdfc-e788cf47f9e0" />

2. Transactions
<img width="859" height="472" alt="Screenshot 2025-08-02 154451" src="https://github.com/user-attachments/assets/2a24a67c-e401-4311-a94c-41c204443ab4" />
<img width="861" height="468" alt="Screenshot 2025-08-02 154512" src="https://github.com/user-attachments/assets/365f0a01-15cd-4600-b7ea-1485a07e4465" />
<img width="855" height="470" alt="Screenshot 2025-08-02 154630" src="https://github.com/user-attachments/assets/5feab09f-1f33-47aa-bc2e-fcaee923d683" />
<img width="859" height="470" alt="Screenshot 2025-08-02 154723" src="https://github.com/user-attachments/assets/9fb77370-90dd-4887-af40-f05c1eb7d67f" />

3.Categories

<img width="848" height="471" alt="Screenshot 2025-08-02 154743" src="https://github.com/user-attachments/assets/30dd1a48-90fc-4eed-9686-8be9f52e7cf4" />
<img width="703" height="354" alt="Screenshot 2025-08-02 154803" src="https://github.com/user-attachments/assets/f5c42d59-f4c4-4402-a5d3-176b5197ae2e" />
<img width="854" height="473" alt="Screenshot 2025-08-02 154824" src="https://github.com/user-attachments/assets/296221ad-acf2-43d6-b284-78213f6dc0c2" />

4. Receipts Upload  
<img width="858" height="469" alt="Screenshot 2025-08-02 154846" src="https://github.com/user-attachments/assets/780c45a9-7816-4543-8ad1-e59b669796f7" />
<img width="856" height="470" alt="Screenshot 2025-08-02 155128" src="https://github.com/user-attachments/assets/418387e9-5027-4e89-99af-a2139c1192f7" />
<img width="856" height="470" alt="Screenshot 2025-08-02 155153" src="https://github.com/user-attachments/assets/3f6eff89-1f1f-436b-974f-c6980d244b4b" />

5. Profile
<img width="850" height="473" alt="Screenshot 2025-08-02 155210" src="https://github.com/user-attachments/assets/4fda70b8-41bd-4fb1-a22a-04a078e09973" />
<img width="854" height="468" alt="Screenshot 2025-08-02 155226" src="https://github.com/user-attachments/assets/58e226f9-efcf-49fb-af19-c43d0d5f8813" />

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
If we want to run it separately
```bash
npm run server
```
<img width="360" height="123" alt="image" src="https://github.com/user-attachments/assets/ead83689-2787-49bb-ac3b-9ebbe309ba8e" />

   - Frontend React app on http://localhost:3000
If we want to run it separately
```bash
npm run client
```
<img width="578" height="195" alt="image" src="https://github.com/user-attachments/assets/cd92bf64-f8b2-4349-adb1-3168e914184e" />

   - Flask OCR service on http://localhost:5001
If we want to run it separately
```bash
npm run flask
```
<img width="572" height="173" alt="image" src="https://github.com/user-attachments/assets/9c4efa08-d74c-45c1-9873-3f158851eb9e" />

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
