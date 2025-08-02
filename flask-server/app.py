"""
Flask OCR Service
Handles receipt processing using Tesseract OCR
"""

import os
import logging
from flask import Flask, request, jsonify
from datetime import datetime
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.security import generate_password_hash
import tempfile
import shutil
from bson import ObjectId
from ocr_service import OCRProcessor
from pymongo import MongoClient
import traceback
from io import BytesIO
from datetime import datetime
from flask import jsonify
import uuid


# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/finly')
client = MongoClient(mongo_uri)

# Define the database and collection
db = client['finly']
categories = db['categories']
users = db['users']
transactions = db['transactions']

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:3000', 'http://localhost:5000'])

# Configuration
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 10 * 1024 * 1024))  # 10MB
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OCR processor
ocr_processor = OCRProcessor()

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(error):
    """Handle file size too large error"""
    return jsonify({
        'success': False,
        'message': 'File size too large. Maximum size is 10MB.'
    }), 413

@app.errorhandler(500)
def handle_internal_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'message': 'Internal server error occurred'
    }), 500



def serialize_user(user):
    user['_id'] = str(user['_id'])  # Convert ObjectId to string
    return user

def serialize_category(category):
    category["_id"] = str(category["_id"])
    return category


def serialize_transaction(tx):
    return {
        "_id": str(tx.get("_id")),
        "type": tx.get("type"),
        "amount": tx.get("amount"),
        "category": tx.get("category"),
        "date": tx.get("date").isoformat() if isinstance(tx.get("date"), datetime) else tx.get("date"),
        "description": tx.get("description"),
        "paymentMethod": tx.get("paymentMethod"),
        "tags": tx.get("tags", [])
    }




# --------------------------------------------------------------- LOGIN ----------------------------------------------------------------

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if not check_password_hash(user['password'], password):
        return jsonify({'message': 'Incorrect password'}), 401

    # You can generate a token here if needed
    return jsonify({
        'message': 'Login successful',
        'data': {
            'token': 'dummy-access-token',
            'refreshToken': 'dummy-refresh-token'
        }
    }), 200



# ----------------------------------------------------- USERS ----------------------------------------------------------------


@app.route('/api/users', methods=['GET'])
def get_all_users():
    user_list = list(users.find())
    serialized_users = [serialize_user(user) for user in user_list]
    return jsonify(serialized_users), 200



@app.route('/api/newUser', methods=['POST'])
def create_user():
    data = request.get_json()

    # Basic required fields validation
    required_fields = ['firstName', 'lastName', 'email', 'password', 'currency']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if email already exists
    if users.find_one({"email": data['email']}):
        return jsonify({"error": "Email already exists"}), 409

    # Prepare user object
    new_user = {
        "_id": str(uuid.uuid4()),  # Or use ObjectId() if preferred
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "email": data["email"],
        "password": generate_password_hash(data["password"]),  # Hash the password
        "currency": data.get("currency", "USD"),
        "monthlyBudget": data.get("monthlyBudget", 0),
        "isActive": data.get("isActive", True),
        "emailVerified": data.get("emailVerified", False),
        "notifications": data.get("notifications", {
            "budgetAlerts": True,
            "email": True,
            "weeklyReports": False
        }),
        "profilePicture": data.get("profilePicture", ""),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "lastLogin": datetime.utcnow(),
        "__v": 0
    }

    # Insert into DB
    users.insert_one(new_user)

    return jsonify({"message": "User created successfully", "user": serialize_user(new_user)}), 201




# -----------------------------------CATEGORIES---------------------------------------
@app.route('/api/newCategory', methods=['POST'])
def create_category():
    data = request.get_json()
    user_id = data.get("userId", "2")  # Default fallback or use actual auth logic

    required_fields = ['name', 'type']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Check for duplicate category for the user or default
    existing = categories.find_one({
        "name": data["name"],
        "$or": [{"userId": user_id}, {"isDefault": True}]
    })
    if existing:
        return jsonify({"error": "Category already exists"}), 409

    # Validate parent category if provided
    parent_id = data.get("parentCategory")
    if parent_id:
        parent = categories.find_one({"_id": ObjectId(parent_id)})
        if not parent or (parent.get("userId") and parent["userId"] != user_id and not parent.get("isDefault", False)):
            return jsonify({"error": "Invalid parent category access"}), 403

    new_category = {
        "_id": ObjectId(),
        "name": data["name"],
        "description": data.get("description", ""),
        "color": data.get("color", "#000000"),
        "icon": data.get("icon", ""),
        "type": data["type"],  # e.g., "expense" or "income"
        "userId": user_id,
        "isActive": data.get("isActive", True),
        "isDefault": data.get("isDefault", False),
        "usageCount": 0,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    categories.insert_one(new_category)

    return jsonify({
        "message": "Category created successfully",
        "category": {
            **new_category,
            "_id": str(new_category["_id"])
        }
    }), 201



@app.route('/api/categories', methods=['GET'])
def get_all_categories():
    category_list = list(categories.find())
    serialized_categories = [serialize_category(cat) for cat in category_list]
    return jsonify(serialized_categories), 200






        

@app.route('/api/categories/<id>', methods=['GET'])
def get_category(id):
    user_id = request.headers.get('user_id','1')
    category = categories.find_one({
        "_id": ObjectId(id),
        "$or": [{"userId": user_id}, {"isDefault": True}]
    })

    if not category:
        return jsonify({"success": False, "message": "Category not found"}), 404

    category["_id"] = str(category["_id"])
    if category.get("parentCategory"):
        category["parentCategory"] = str(category["parentCategory"])
    if category.get("userId"):
        category["userId"] = str(category["userId"])
    return jsonify({"success": True, "data": category}), 200



@app.route('/api/categories/<id>', methods=['PUT'])
def update_category(id):
    user_id = request.user_id
    data = request.json

    category = categories.find_one({"_id": ObjectId(id), "userId": user_id})
    if not category:
        return jsonify({"success": False, "message": "Category not found or unauthorized"}), 404

    update_fields = {
        key: data[key] for key in data
    }
    update_fields["updatedAt"] = datetime.utcnow()

    categories.update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    return jsonify({"success": True, "message": "Category updated"}), 200

# 🔴 Delete Category
@app.route('/api/categories/<id>', methods=['DELETE'])
def delete_category(id):
    user_id = request.user_id
    result = categories.delete_one({"_id": ObjectId(id), "userId": user_id})
    if result.deleted_count == 0:
        return jsonify({"success": False, "message": "Category not found or unauthorized"}), 404
    return jsonify({"success": True, "message": "Category deleted"}), 200


# ------------------------------------------------TRANSACTIONS-----------------------------------------


# GET /api/transactions
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



@app.route('/api/newTransactions', methods=['POST'])
def create_transaction():
    print("Hi I was hit")
    try:
        user_id = request.headers.get('user_id', '1')  # Default user_id for testing
        data = request.json

        # Required fields
        required_fields = ['type', 'amount', 'category', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400

        # Prepare transaction document
        transaction = {
            "user_id": user_id,
            "type": data['type'],  # "income" or "expense"
            "amount": float(data['amount']),
            "category": data['category'],
            "date": datetime.fromisoformat(data['date']),
            "description": data.get('description', ''),
            "paymentMethod": data.get('paymentMethod', ''),
            "tags": data.get('tags', [])
        }

        # Insert into DB
        result = transactions.insert_one(transaction)
        new_transaction = transactions.find_one({"_id": result.inserted_id})

        return jsonify({
            "success": True,
            "message": "Transaction created successfully",
            "data": serialize_transaction(new_transaction)
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500





# PUT /api/transactions/<id>
@app.route('/api/transactions/<string:id>', methods=['PUT'])
def update_transaction(user_id, id):
    try:
        existing = Transaction.find_by_id_and_user(id, user_id.id)
        if not existing:
            return jsonify({'success': False, 'message': 'Transaction not found'}), 404

        data = request.get_json()
        if 'category' in data and not Category.is_valid_for_user(data['category'], user_id.id):
            return jsonify({'success': False, 'message': 'Invalid category'}), 403

        updated = Transaction.update(id, data)
        return jsonify({
            'success': True,
            'message': 'Transaction updated successfully',
            'data': {'transaction': updated}
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# DELETE /api/transactions/<id>
@app.route('/api/transactions/<string:id>', methods=['DELETE'])
def delete_transaction(user_id, id):
    deleted = Transaction.delete_by_id_and_user(id, user_id.id)
    if not deleted:
        return jsonify({'success': False, 'message': 'Transaction not found'}), 404
    return jsonify({'success': True, 'message': 'Transaction deleted successfully'})


# DELETE /api/transactions/bulk
@app.route('/api/transactions/bulk', methods=['DELETE'])
def bulk_delete_transactions(user_id):
    data = request.get_json()
    transaction_ids = data.get('transactionIds', [])

    if not transaction_ids or not isinstance(transaction_ids, list):
        return jsonify({'success': False, 'message': 'Invalid transaction ID list'}), 400

    count = Transaction.bulk_delete(transaction_ids, user_id.id)
    return jsonify({
        'success': True,
        'message': f'{count} transactions deleted successfully',
        'data': {'deletedCount': count}
    })


# GET /api/transactions/stats
@app.route('/api/transactions/stats', methods=['GET'])
def get_transaction_stats(user_id):
    try:
        stats = Transaction.get_stats(user_id.id, {
            'startDate': request.args.get('startDate'),
            'endDate': request.args.get('endDate'),
            'period': request.args.get('period', 'month')
        })
        return jsonify({
            'success': True,
            'message': 'Transaction statistics retrieved successfully',
            'data': {'stats': stats}
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# GET /api/transactions/export
@app.route('/api/transactions/export', methods=['GET'])
def export_transactions_pdf(user_id):
    try:
        from utils.pdf_generator import generate_pdf_report

        options = {
            'type': request.args.get('type'),
            'category': request.args.get('category'),
            'startDate': request.args.get('startDate'),
            'endDate': request.args.get('endDate'),
        }

        transactions = Transaction.get_user_transactions(user_id.id, {**options, 'limit': 1000})[0]
        if not transactions:
            return jsonify({'success': False, 'message': 'No transactions found'}), 404

        pdf_stream = generate_pdf_report(transactions, user_id)

        return send_file(
            pdf_stream,
            mimetype='application/pdf',
            download_name=f"transactions_{datetime.now().strftime('%Y%m%d')}.pdf",
            as_attachment=True
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500



# -------------------------------------------------OCR--------------------------------------------------
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'OCR service is running',
        'service': 'Flask OCR Service',
        'version': '1.0.0'
    })

@app.route('/process-receipt', methods=['POST'])
def process_receipt():
    """
    Process uploaded receipt file and extract information
    """
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'Invalid file type. Allowed types: PNG, JPG, JPEG, PDF'
            }), 400
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, 
                                       suffix=os.path.splitext(file.filename)[1]) as temp_file:
            file.save(temp_file.name)
            temp_filepath = temp_file.name
        
        try:
            # Process the file
            result = ocr_processor.process_receipt(temp_filepath)
            
            logger.info(f"Successfully processed receipt: {file.filename}")
            
            return jsonify({
                'success': True,
                'message': 'Receipt processed successfully',
                'data': result
            })
            
        except Exception as e:
            logger.error(f"Error processing receipt {file.filename}: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Error processing receipt: {str(e)}'
            }), 500
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_filepath):
                os.unlink(temp_filepath)
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'An unexpected error occurred'
        }), 500

@app.route('/process-text', methods=['POST'])
def process_text():
    """
    Process plain text and extract financial information
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'message': 'Text content is required'
            }), 400
        
        text = data['text']
        
        if not text.strip():
            return jsonify({
                'success': False,
                'message': 'Text content cannot be empty'
            }), 400
        
        # Extract information from text
        result = ocr_processor.extract_from_text(text)
        
        return jsonify({
            'success': True,
            'message': 'Text processed successfully',
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error processing text: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing text: {str(e)}'
        }), 500



@app.route('/supported-formats', methods=['GET'])
def get_supported_formats():
    """
    Get list of supported file formats and limits
    """
    return jsonify({
        'success': True,
        'data': {
            'supportedFormats': list(ALLOWED_EXTENSIONS),
            'maxFileSize': app.config['MAX_CONTENT_LENGTH'],
            'maxFileSizeMB': app.config['MAX_CONTENT_LENGTH'] / (1024 * 1024),
            'features': [
                'Text extraction from images (PNG, JPG, JPEG)',
                'PDF text extraction',
                'Amount detection',
                'Date recognition',
                'Merchant name identification',
                'Receipt structure analysis'
            ]
        }
    })

@app.route('/test-ocr', methods=['GET'])
def test_ocr():
    """
    Test OCR functionality
    """
    try:
        # Test basic OCR functionality
        test_result = ocr_processor.test_ocr_engine()
        
        return jsonify({
            'success': True,
            'message': 'OCR engine test completed',
            'data': test_result
        })
        
    except Exception as e:
        logger.error(f"OCR test failed: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'OCR test failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Flask OCR Service on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Upload folder: {app.config['UPLOAD_FOLDER']}")
    logger.info(f"Max file size: {app.config['MAX_CONTENT_LENGTH'] / (1024 * 1024):.1f}MB")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )