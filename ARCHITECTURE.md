# Personal Finance Assistant - Architecture Documentation

## Overview

The Personal Finance Assistant is a comprehensive web application built using a microservices architecture with the following components:

- **Frontend**: React.js with Material-UI
- **Backend API**: Node.js with Express.js
- **Database**: MongoDB
- **OCR Service**: Flask with Tesseract OCR
- **Host Service**: Flask coordination server

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend│    │   MongoDB       │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 27017)  │
│   Material-UI    │    │   Express.js    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  Flask Host     │    │  Flask OCR      │
│  (Port 3000)    │    │  (Port 5001)    │
│  Coordinator    │    │  Tesseract      │
└─────────────────┘    └─────────────────┘
```

## Component Details

### 1. Frontend (React.js + Material-UI)

**Location**: `/frontend`

**Key Features**:
- Modern, responsive UI using Material-UI components
- User authentication with JWT tokens
- Real-time data visualization with Chart.js
- File upload for receipt processing
- PDF export functionality
- Multi-page application with React Router

**Structure**:
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── services/       # API service functions
│   ├── context/        # React context providers
│   ├── utils/          # Helper functions
│   └── App.js          # Main application component
└── public/             # Static assets
```

### 2. Backend API (Node.js + Express.js)

**Location**: `/backend`

**Key Features**:
- RESTful API with comprehensive CRUD operations
- JWT-based authentication and authorization
- Input validation using express-validator
- File upload handling with Multer
- PDF generation with PDFKit
- Comprehensive error handling
- Rate limiting and security middleware

**Structure**:
```
backend/
├── controllers/        # Request handlers
├── models/            # MongoDB schemas
├── routes/            # API route definitions
├── middleware/        # Custom middleware
├── utils/             # Helper functions
└── server.js          # Main server file
```

**API Endpoints**:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

#### Transactions
- `GET /api/transactions` - Get transactions (with pagination & filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats` - Get transaction statistics
- `GET /api/transactions/export` - Export transactions as PDF

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### OCR
- `POST /api/ocr/process` - Process receipt
- `GET /api/ocr/history` - Get OCR history

### 3. Database (MongoDB)

**Location**: MongoDB instance (local or cloud)

**Collections**:

#### Users
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  dateOfBirth: Date,
  phoneNumber: String,
  currency: String,
  monthlyBudget: Number,
  isActive: Boolean,
  emailVerified: Boolean,
  notifications: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### Categories
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  color: String,
  icon: String,
  type: String, // 'income', 'expense', 'both'
  userId: ObjectId, // null for default categories
  isActive: Boolean,
  isDefault: Boolean,
  usageCount: Number,
  parentCategory: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transactions
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  amount: Number,
  currency: String,
  type: String, // 'income' or 'expense'
  category: ObjectId,
  date: Date,
  userId: ObjectId,
  paymentMethod: String,
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  attachments: [AttachmentSchema],
  ocrData: {
    extractedText: String,
    extractedAmount: Number,
    extractedDate: Date,
    extractedMerchant: String,
    confidence: Number,
    processedAt: Date
  },
  tags: [String],
  recurring: {
    isRecurring: Boolean,
    frequency: String,
    nextDate: Date,
    endDate: Date
  },
  status: String,
  isVerified: Boolean,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. OCR Service (Flask + Tesseract)

**Location**: `/flask-server`

**Key Features**:
- Receipt image processing (PNG, JPG, PDF)
- Text extraction using Tesseract OCR
- Amount, date, and merchant name detection
- Image preprocessing for better OCR accuracy
- Confidence scoring for extracted data

**Structure**:
```
flask-server/
├── app.py              # Main Flask application
├── ocr_service.py      # OCR processing logic
├── requirements.txt    # Python dependencies
└── uploads/           # Temporary file storage
```

**Endpoints**:
- `POST /process-receipt` - Process uploaded receipt
- `POST /process-text` - Process plain text
- `GET /health` - Health check
- `GET /supported-formats` - Get supported file formats

### 5. Host Service (Flask Coordinator)

**Location**: `/flask-server/host_app.py`

**Key Features**:
- Serves the React frontend build
- Coordinates all backend services
- Health monitoring for all services
- Automatic service startup and management
- Graceful shutdown handling

## Data Flow

### 1. User Registration/Login
```
User → Frontend → Backend API → MongoDB
                ↓
           JWT Token ← Backend API ← Response
Frontend ← JWT Storage
```

### 2. Transaction Creation
```
User → Frontend → Backend API → Validation → MongoDB
                               ↓
                          Category Check
```

### 3. Receipt Processing
```
User → Frontend → Backend API → Flask OCR Service
                               ↓
                          Tesseract OCR → Text Extraction
                               ↓
                          Data Parsing → Structured Data
                               ↓
Backend API ← Suggested Transaction ← Flask OCR Service
```

### 4. Data Visualization
```
Frontend → Backend API → MongoDB Aggregation → Statistical Data
        ↓
   Chart.js Rendering → User Interface
```

## Security Features

### Authentication & Authorization
- JWT token-based authentication
- Password hashing using bcrypt
- Token refresh mechanism
- Protected route middleware

### Data Validation
- Input validation using express-validator
- MongoDB schema validation
- File type and size validation
- XSS and injection protection

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request size limits

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT tokens (no server-side sessions)
- Microservices architecture
- Database connection pooling

### Performance Optimization
- Database indexing on frequently queried fields
- Pagination for large datasets
- Image preprocessing for OCR efficiency
- Caching strategies for static data

### Monitoring & Health Checks
- Service health endpoints
- Error logging and tracking
- Performance monitoring
- Graceful degradation

## Development Guidelines

### Code Organization
- Separation of concerns
- Modular architecture
- Reusable components
- Clean code principles

### Error Handling
- Comprehensive error messages
- Graceful error recovery
- User-friendly error displays
- Logging for debugging

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for user workflows
- OCR accuracy testing

## Deployment Options

### Local Development
```bash
./start.sh    # Unix/Linux/macOS
start.bat     # Windows
```

### Production Deployment
- Docker containerization
- Cloud deployment (AWS, Azure, GCP)
- Database as a Service (MongoDB Atlas)
- CDN for static assets
- Load balancer for high availability

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Frontend | React.js | ^18.2.0 | User Interface |
| UI Library | Material-UI | ^5.14.3 | Component Library |
| State Management | React Context | Built-in | Global State |
| Charts | Chart.js + react-chartjs-2 | ^4.3.3 | Data Visualization |
| Backend | Node.js + Express.js | ^18.x + ^4.18.2 | API Server |
| Database | MongoDB | ^7.x | Data Storage |
| ODM | Mongoose | ^7.5.0 | Database Modeling |
| Authentication | JWT | ^9.0.2 | Token-based Auth |
| OCR | Python + Flask + Tesseract | ^3.8 + ^2.3.3 | Text Extraction |
| PDF Generation | PDFKit | ^0.13.0 | Report Generation |
| File Upload | Multer | ^1.4.5 | File Handling |
| Validation | express-validator | ^7.0.1 | Input Validation |
| Image Processing | OpenCV + PIL | ^4.8.1 + ^10.0.0 | Image Enhancement |

This architecture provides a robust, scalable, and maintainable foundation for the Personal Finance Assistant application, with clear separation of concerns and comprehensive feature coverage.