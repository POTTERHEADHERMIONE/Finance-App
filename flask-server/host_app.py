"""
Flask Host Application
Serves the React frontend and coordinates backend services
"""

import os
import subprocess
import threading
import time
import signal
import sys
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import requests
from werkzeug.exceptions import NotFound

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

# Configuration
BACKEND_URL = 'http://localhost:5000'
OCR_SERVICE_URL = 'http://localhost:5001'
FRONTEND_BUILD_PATH = '../frontend/build'

class ServiceManager:
    """Manages backend services"""
    
    def __init__(self):
        self.processes = {}
        self.running = False
    
    def start_backend(self):
        """Start Node.js backend server"""
        try:
            print("🚀 Starting Node.js backend server...")
            backend_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd='../backend',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid if os.name != 'nt' else None
            )
            self.processes['backend'] = backend_process
            print("✅ Backend server started on port 5000")
            return True
        except Exception as e:
            print(f"❌ Failed to start backend server: {e}")
            return False
    
    def start_ocr_service(self):
        """Start Flask OCR service"""
        try:
            print("🔍 Starting OCR service...")
            ocr_process = subprocess.Popen(
                ['python', 'app.py'],
                cwd='../flask-server',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid if os.name != 'nt' else None
            )
            self.processes['ocr'] = ocr_process
            print("✅ OCR service started on port 5001")
            return True
        except Exception as e:
            print(f"❌ Failed to start OCR service: {e}")
            return False
    
    def check_service_health(self, url, service_name):
        """Check if a service is healthy"""
        try:
            response = requests.get(f"{url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def wait_for_services(self):
        """Wait for all services to be healthy"""
        services = [
            (BACKEND_URL, "Backend API"),
            (OCR_SERVICE_URL, "OCR Service")
        ]
        
        for url, name in services:
            print(f"⏳ Waiting for {name} to be ready...")
            max_attempts = 30
            for attempt in range(max_attempts):
                if self.check_service_health(url, name):
                    print(f"✅ {name} is ready!")
                    break
                time.sleep(2)
                if attempt == max_attempts - 1:
                    print(f"❌ {name} failed to start within timeout")
    
    def start_all_services(self):
        """Start all backend services"""
        self.running = True
        
        # Start services in separate threads
        backend_thread = threading.Thread(target=self.start_backend)
        ocr_thread = threading.Thread(target=self.start_ocr_service)
        
        backend_thread.daemon = True
        ocr_thread.daemon = True
        
        backend_thread.start()
        ocr_thread.start()
        
        # Wait for services to be ready
        self.wait_for_services()
    
    def stop_all_services(self):
        """Stop all running services"""
        self.running = False
        print("\n🛑 Stopping all services...")
        
        for name, process in self.processes.items():
            try:
                if os.name == 'nt':  # Windows
                    process.terminate()
                else:  # Unix/Linux/macOS
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                print(f"✅ Stopped {name} service")
            except Exception as e:
                print(f"❌ Error stopping {name} service: {e}")

# Global service manager
service_manager = ServiceManager()

@app.route('/api/system/health')
def system_health():
    """Check health of all services"""
    health_status = {
        'host': True,
        'backend': service_manager.check_service_health(BACKEND_URL, 'backend'),
        'ocr': service_manager.check_service_health(OCR_SERVICE_URL, 'ocr'),
        'timestamp': time.time()
    }
    
    status_code = 200 if all(health_status.values()) else 503
    return jsonify(health_status), status_code

@app.route('/api/system/status')
def system_status():
    """Get system status and information"""
    return jsonify({
        'status': 'running' if service_manager.running else 'stopped',
        'services': {
            'backend': {
                'url': BACKEND_URL,
                'healthy': service_manager.check_service_health(BACKEND_URL, 'backend')
            },
            'ocr': {
                'url': OCR_SERVICE_URL,
                'healthy': service_manager.check_service_health(OCR_SERVICE_URL, 'ocr')
            }
        },
        'version': '1.0.0',
        'environment': 'development'
    })

# Serve React app
@app.route('/')
def serve_react_app():
    """Serve the React application"""
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except NotFound:
        return jsonify({
            'error': 'Frontend build not found',
            'message': 'Please run "npm run build" in the frontend directory first'
        }), 404

@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files or React app"""
    try:
        # Try to serve static file first
        return send_from_directory(app.static_folder, path)
    except NotFound:
        # If file not found, serve React app (for client-side routing)
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except NotFound:
            return jsonify({
                'error': 'Frontend build not found',
                'message': 'Please run "npm run build" in the frontend directory first'
            }), 404

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print(f"\n🔄 Received signal {signum}, shutting down gracefully...")
    service_manager.stop_all_services()
    sys.exit(0)

def check_prerequisites():
    """Check if required tools are installed"""
    print("🔍 Checking prerequisites...")
    
    # Check if Node.js is installed
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
        else:
            print("❌ Node.js is not installed")
            return False
    except FileNotFoundError:
        print("❌ Node.js is not installed")
        return False
    
    # Check if Python is installed
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Python: {result.stdout.strip()}")
        else:
            print("❌ Python is not installed")
            return False
    except FileNotFoundError:
        try:
            result = subprocess.run(['python3', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Python: {result.stdout.strip()}")
            else:
                print("❌ Python is not installed")
                return False
        except FileNotFoundError:
            print("❌ Python is not installed")
            return False
    
    # Check if frontend build exists
    if not os.path.exists(FRONTEND_BUILD_PATH):
        print("⚠️  Frontend build not found. Please run 'npm run build' in the frontend directory.")
        print("   The application will still work, but you'll need to build the frontend first.")
    else:
        print("✅ Frontend build found")
    
    return True

def print_startup_info():
    """Print startup information"""
    print("\n" + "="*60)
    print("🎯 PERSONAL FINANCE ASSISTANT")
    print("="*60)
    print("🌐 Application URL: http://localhost:3000")
    print("🔧 Backend API: http://localhost:5000")
    print("🔍 OCR Service: http://localhost:5001")
    print("📊 System Health: http://localhost:3000/api/system/health")
    print("="*60)
    print("Press Ctrl+C to stop all services")
    print("="*60 + "\n")

if __name__ == '__main__':
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🚀 Starting Personal Finance Assistant...")
    
    # Check prerequisites
    if not check_prerequisites():
        print("❌ Prerequisites check failed. Please install missing dependencies.")
        sys.exit(1)
    
    try:
        # Start all backend services
        service_manager.start_all_services()
        
        # Print startup information
        print_startup_info()
        
        # Start the Flask host server
        app.run(
            host='0.0.0.0',
            port=3000,
            debug=False,
            use_reloader=False,  # Disable reloader to prevent double service startup
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n🔄 Shutting down...")
        service_manager.stop_all_services()
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        service_manager.stop_all_services()
        sys.exit(1)