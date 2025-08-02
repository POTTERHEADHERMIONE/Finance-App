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

## Brownie Points Content Achieved 
- Supports the Export and Upload of Transaction History 
<img width="211" height="48" alt="image" src="https://github.com/user-attachments/assets/ba212663-7432-4c38-8460-9cdc5fa6d4e7" />

The content can be exported as pdf or xslx files
The exported PDF looks like this 

[Uploading transactions.pdf…]()
<img width="948" height="298" alt="image" src="https://github.com/user-attachments/assets/d224b2be-6800-41d7-a71a-c2ecfd83dddc" />

- Supports Pagination of API 
Example of Pagination used in the ``` /flask-server/app.py```
```python
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    user_id = request.headers.get('user_id', '1')  # Default user_id for testing

    try:
        # Extract and parse filters from query params
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit

        query = {"user_id": user_id}  # Filter by user_id

        # Optional filters
        if request.args.get('type'):
            query['type'] = request.args.get('type')
        if request.args.get('category'):
            query['category'] = request.args.get('category')
        if request.args.get('startDate') and request.args.get('endDate'):
            query['date'] = {
                '$gte': datetime.fromisoformat(request.args.get('startDate')),
                '$lte': datetime.fromisoformat(request.args.get('endDate'))
            }
        if request.args.get('minAmount'):
            query['amount'] = query.get('amount', {})
            query['amount']['$gte'] = float(request.args.get('minAmount'))
        if request.args.get('maxAmount'):
            query['amount'] = query.get('amount', {})
            query['amount']['$lte'] = float(request.args.get('maxAmount'))
        if request.args.get('paymentMethod'):
            query['paymentMethod'] = request.args.get('paymentMethod')
        if request.args.get('tags'):
            tags = request.args.get('tags').split(',')
            query['tags'] = {'$in': tags}
        if request.args.get('search'):
            query['description'] = {
                '$regex': request.args.get('search'),
                '$options': 'i'
            }

        # Sorting
        sort_by = request.args.get('sortBy', 'date')
        sort_order = -1 if request.args.get('sortOrder', 'desc') == 'desc' else 1

        # Query DB
        total_items = transactions.count_documents(query)
        cursor = transactions.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
        transaction_list = list(cursor)

        # Serialize
        serialized_transactions = [serialize_transaction(tx) for tx in transaction_list]

        # Extracted options for filters
        options = {
            'page': page,
            'limit': limit,
            'type': request.args.get('type'),
            'category': request.args.get('category'),
            'startDate': request.args.get('startDate'),
            'endDate': request.args.get('endDate'),
            'minAmount': request.args.get('minAmount'),
            'maxAmount': request.args.get('maxAmount'),
            'paymentMethod': request.args.get('paymentMethod'),
            'tags': request.args.get('tags'),
            'search': request.args.get('search'),
            'sortBy': sort_by,
            'sortOrder': request.args.get('sortOrder', 'desc')
        }

        # Pagination info
        pagination = {
            "page": page,
            "limit": limit,
            "totalPages": (total_items + limit - 1) // limit,
            "totalItems": total_items,
            "filters": {
                "type": options.get("type"),
                "category": options.get("category"),
                "startDate": options.get("startDate"),
                "endDate": options.get("endDate"),
                "minAmount": options.get("minAmount"),
                "maxAmount": options.get("maxAmount"),
                "paymentMethod": options.get("paymentMethod"),
                "tags": options.get("tags"),
                "search": options.get("search"),
                "sortBy": options.get("sortBy"),
                "sortOrder": options.get("sortOrder")
            }
        }

        return jsonify({
            "success": True,
            "message": "Transactions retrieved successfully",
            "data": {
                "transactions": serialized_transactions,
                "pagination": pagination
            }
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
```
- Multiple Users Supported 
Login and Registration Pages have also been added for the secure and authentic validation of the users identity
LOGIN PAGE 

<img width="943" height="438" alt="image" src="https://github.com/user-attachments/assets/cd7bcc1e-f5d7-4621-9e7c-8ed05633f3dc" />

REGISTER PAGE 

<img width="880" height="464" alt="image" src="https://github.com/user-attachments/assets/fec6da61-344f-46ff-8597-dc16d64782e8" />

This is the response of GET : /api/users
```json
[
    {
        "__v": 0,
        "_id": "f4d4c2a7-f000-4326-9a84-08e6d544e083",
        "createdAt": "Sat, 02 Aug 2025 03:30:29 GMT",
        "currency": "INR",
        "email": "aarav.sharma@example.com",
        "emailVerified": false,
        "firstName": "Aarav",
        "isActive": true,
        "lastLogin": "Sat, 02 Aug 2025 03:30:29 GMT",
        "lastName": "Sharma",
        "monthlyBudget": 50000,
        "notifications": {
            "budgetAlerts": true,
            "email": true,
            "weeklyReports": true
        },
        "password": "arav",
        "profilePicture": "https://example.com/images/aarav.png",
        "updatedAt": "Sat, 02 Aug 2025 03:30:29 GMT"
    },
    {
        "__v": 0,
        "_id": "d97c85e9-1fcd-4c9a-b05c-8e33e01572cb",
        "createdAt": "Sat, 02 Aug 2025 04:10:45 GMT",
        "currency": "INR",
        "email": "isha.verma@example.com",
        "emailVerified": true,
        "firstName": "Isha",
        "isActive": true,
        "lastLogin": "Sat, 02 Aug 2025 04:10:45 GMT",
        "lastName": "Verma",
        "monthlyBudget": 60000,
        "notifications": {
            "budgetAlerts": true,
            "email": true,
            "weeklyReports": false
        },
        "password": "scrypt:32768:8:1$Jz9UoV7xlWcKNe9H$7f981d8266dddebc75821a0fddcc2cfbc96d37a5c80e2fa1cf30b6f6d110249a38ec6f47d7c0b37e252fb4154c5ddf18df030dc7014b5d314328351ee76e2d1c",
        "profilePicture": "https://example.com/images/isha.png",
        "updatedAt": "Sat, 02 Aug 2025 04:10:45 GMT"
    },
    {
        "__v": 0,
        "_id": "0e871172-b8a4-4b76-a711-44aa3d9f9b73",
        "createdAt": "Sat, 02 Aug 2025 04:20:10 GMT",
        "currency": "INR",
        "email": "vihaan.kumar@example.com",
        "emailVerified": false,
        "firstName": "Vihaan",
        "isActive": true,
        "lastLogin": "Sat, 02 Aug 2025 04:20:10 GMT",
        "lastName": "Kumar",
        "monthlyBudget": 45000,
        "notifications": {
            "budgetAlerts": true,
            "email": false,
            "weeklyReports": true
        },
        "password": "scrypt:32768:8:1$Hb34eLd9opUq2cFn$6dcb126ff62ff2c91888b3c2892f17234be6b2fd66c620fd5d7cfec924bfc7fd30cb6b441d5fbbef7f2c99c342b9e7fc18209d105fb7dc43eb4d29788521b78e",
        "profilePicture": "https://example.com/images/vihaan.png",
        "updatedAt": "Sat, 02 Aug 2025 04:20:10 GMT"
    },
    {
        "__v": 0,
        "_id": "3e646b26-d7ff-4a8c-85a7-9259e76b2efc",
        "createdAt": "Sat, 02 Aug 2025 04:35:52 GMT",
        "currency": "INR",
        "email": "meera.nair@example.com",
        "emailVerified": true,
        "firstName": "Meera",
        "isActive": true,
        "lastLogin": "Sat, 02 Aug 2025 04:35:52 GMT",
        "lastName": "Nair",
        "monthlyBudget": 70000,
        "notifications": {
            "budgetAlerts": false,
            "email": true,
            "weeklyReports": true
        },
        "password": "scrypt:32768:8:1$Rjd09Nm6KUpql09z$e3b8c274f0b13f38f60a5727b65e9a93584a379c7e98f801f7ce86b802fae1e3ed37f7f71d267897e83570dfb3dfe2f65962efb0e25b7b0d0f0f61db697f4f59",
        "profilePicture": "https://example.com/images/meera.png",
        "updatedAt": "Sat, 02 Aug 2025 04:35:52 GMT"
    },
    {
        "__v": 0,
        "_id": "688da585ed72af3a48b75aac",
        "createdAt": "Sat, 02 Aug 2025 05:43:33 GMT",
        "currency": "USD",
        "email": "aayasyasaakshi@gmail.com",
        "emailVerified": false,
        "firstName": "saakshi",
        "isActive": true,
        "lastLogin": "Sat, 02 Aug 2025 05:43:33 GMT",
        "lastName": "Aayasya",
        "monthlyBudget": 0,
        "notifications": {
            "budgetAlerts": true,
            "email": true,
            "weeklyReports": false
        },
        "password": "$2a$12$/bimAiuesf8.yJU0cXlEqeJN50bAcOT8fraNSQdXO3V/UEX5h4H0q",
        "profilePicture": "",
        "updatedAt": "Sat, 02 Aug 2025 05:43:33 GMT"
    }
]
```

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
<img width="944" height="495" alt="image" src="https://github.com/user-attachments/assets/0b3387c1-2b9f-45c1-9220-0429f711fad0" />


- **Users**: Authentication and profile data 
   - Schema Used 
```json
{
  "_id": "f4d4c2a7-f000-4326-9a84-08e6d544e083",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "email": "aarav.sharma@example.com",
  "password": "arav",
  "currency": "INR",
  "monthlyBudget": 50000,
  "isActive": true,
  "emailVerified": false,
  "notifications": {
    "budgetAlerts": true,
    "email": true,
    "weeklyReports": true
  },
  "profilePicture": "https://example.com/images/aarav.png",
  "createdAt": {
    "$date": "2025-08-02T03:30:29.790Z"
  },
  "updatedAt": {
    "$date": "2025-08-02T03:30:29.791Z"
  },
  "lastLogin": {
    "$date": "2025-08-02T03:30:29.791Z"
  },
  "__v": 0
}
``` 
- **Transactions**: Income/expense records with categories
   - Schema Used 
```json
{
  "_id": {
    "$oid": "688de019cce8dd03f2dab60b"
  },
  "type": "income",
  "amount": 1200,
  "category": "Bills",
  "date": "2025-08-01T10:30:00",
  "description": "Freelance project payment",
  "paymentMethod": "Bank Transfer",
  "tags": [
    "freelance",
    "client"
  ]
}
```
- **Categories**: Transaction categorization
    - Schema Used 
```json
{
  "_id": {
    "$oid": "688d9e03923c8d419c4069a3"
  },
  "name": "Groceries",
  "description": "Expenses for food and home supplies",
  "color": "#FF5733",
  "icon": "shopping-cart",
  "type": "expense",
  "userId": "2",
  "isActive": true,
  "isDefault": false,
  "usageCount": 0,
  "createdAt": {
    "$date": "2025-08-02T05:11:31.675Z"
  },
  "updatedAt": {
    "$date": "2025-08-02T05:11:31.676Z"
  }
}
```

