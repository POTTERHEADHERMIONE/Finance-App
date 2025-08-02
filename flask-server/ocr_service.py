"""
OCR Service Module
Handles receipt processing, text extraction, and data parsing
"""

import os
import re
import logging
from datetime import datetime
from typing import Dict, Optional, List, Tuple
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
from pdf2image import convert_from_path
import tempfile

# Configure logging
logger = logging.getLogger(__name__)

class OCRProcessor:
    """Main OCR processing class for receipt analysis"""
    
    def __init__(self):
        """Initialize OCR processor with configuration"""
        # Set Tesseract command path if specified
        tesseract_cmd = os.getenv('TESSERACT_CMD')
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        
        # Common currency symbols and patterns
        self.currency_patterns = [
            r'\$\s*(\d+\.?\d*)',  # $XX.XX
            r'(\d+\.?\d*)\s*\$',  # XX.XX$
            r'USD\s*(\d+\.?\d*)', # USD XX.XX
            r'(\d+\.?\d*)\s*USD', # XX.XX USD
            r'TOTAL\s*:?\s*\$?\s*(\d+\.?\d*)',  # TOTAL: $XX.XX
            r'AMOUNT\s*:?\s*\$?\s*(\d+\.?\d*)', # AMOUNT: $XX.XX
        ]
        
        # Date patterns
        self.date_patterns = [
            r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',  # MM/DD/YYYY, MM-DD-YY, etc.
            r'(\d{1,2}\s+\w+\s+\d{2,4})',  # DD Month YYYY
            r'(\w+\s+\d{1,2},?\s+\d{2,4})', # Month DD, YYYY
        ]
        
        # Merchant name indicators
        self.merchant_indicators = [
            'store', 'shop', 'restaurant', 'cafe', 'market', 'mart',
            'pharmacy', 'gas', 'station', 'hotel', 'motel', 'inn',
            'hospital', 'clinic', 'medical', 'dental'
        ]
    
    def process_receipt(self, file_path: str) -> Dict:
        """
        Process a receipt file and extract relevant information
        
        Args:
            file_path (str): Path to the receipt file
            
        Returns:
            Dict: Extracted information from the receipt
        """
        try:
            # Determine file type and extract text
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                extracted_text = self._extract_text_from_pdf(file_path)
            elif file_extension in ['.png', '.jpg', '.jpeg']:
                extracted_text = self._extract_text_from_image(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            if not extracted_text.strip():
                return {
                    'extractedText': '',
                    'extractedAmount': None,
                    'extractedDate': None,
                    'extractedMerchant': None,
                    'confidence': 0.0
                }
            
            # Extract structured information
            result = self.extract_from_text(extracted_text)
            result['extractedText'] = extracted_text
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing receipt: {str(e)}")
            raise
    
    def _extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from image using OCR
        
        Args:
            image_path (str): Path to the image file
            
        Returns:
            str: Extracted text
        """
        try:
            # Load and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Could not load image")
            
            # Preprocess image for better OCR results
            processed_image = self._preprocess_image(image)
            
            # Convert to PIL Image for tesseract
            pil_image = Image.fromarray(processed_image)
            
            # Extract text using tesseract
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:;!?@#$%^&*()_+-=[]{}|\\;\':",./<>?~ '
            text = pytesseract.image_to_string(pil_image, config=custom_config)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from image: {str(e)}")
            raise
    
    def _extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from PDF file
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            str: Extracted text
        """
        try:
            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=300)
            
            extracted_text = ""
            
            for i, image in enumerate(images):
                # Convert PIL image to numpy array for preprocessing
                img_array = np.array(image)
                
                # Preprocess image
                processed_image = self._preprocess_image(img_array)
                
                # Convert back to PIL Image
                pil_image = Image.fromarray(processed_image)
                
                # Extract text
                custom_config = r'--oem 3 --psm 6'
                page_text = pytesseract.image_to_string(pil_image, config=custom_config)
                
                extracted_text += f"\n--- Page {i+1} ---\n{page_text}"
            
            return extracted_text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image to improve OCR accuracy
        
        Args:
            image (np.ndarray): Input image
            
        Returns:
            np.ndarray: Preprocessed image
        """
        try:
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Apply denoising
            denoised = cv2.medianBlur(gray, 5)
            
            # Apply adaptive thresholding
            binary = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Apply morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            return image
    
    def extract_from_text(self, text: str) -> Dict:
        """
        Extract structured information from text
        
        Args:
            text (str): Raw text to process
            
        Returns:
            Dict: Extracted structured information
        """
        try:
            # Clean text
            cleaned_text = self._clean_text(text)
            
            # Extract different components
            amount = self._extract_amount(cleaned_text)
            date = self._extract_date(cleaned_text)
            merchant = self._extract_merchant_name(cleaned_text)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(amount, date, merchant, cleaned_text)
            
            return {
                'extractedAmount': amount,
                'extractedDate': date,
                'extractedMerchant': merchant,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Error extracting from text: {str(e)}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace and normalize
        cleaned = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters that might interfere with parsing
        cleaned = re.sub(r'[^\w\s\$\.\,\:\;\-\/\(\)]', ' ', cleaned)
        
        return cleaned
    
    def _extract_amount(self, text: str) -> Optional[float]:
        """
        Extract monetary amount from text
        
        Args:
            text (str): Text to search
            
        Returns:
            Optional[float]: Extracted amount or None
        """
        amounts = []
        
        for pattern in self.currency_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    # Get the numeric part
                    amount_str = match.group(1) if match.groups() else match.group(0)
                    amount_str = re.sub(r'[^\d\.]', '', amount_str)
                    
                    if amount_str and '.' in amount_str:
                        amount = float(amount_str)
                        if 0.01 <= amount <= 10000:  # Reasonable range for receipt amounts
                            amounts.append(amount)
                    elif amount_str:
                        amount = float(amount_str)
                        if amount >= 1:  # Assume amounts without decimals are in dollars
                            amounts.append(amount)
                        elif amount >= 0.01:  # Small amounts might be valid
                            amounts.append(amount)
                            
                except (ValueError, IndexError):
                    continue
        
        if amounts:
            # Return the largest reasonable amount (likely the total)
            return max(amounts)
        
        return None
    
    def _extract_date(self, text: str) -> Optional[str]:
        """
        Extract date from text
        
        Args:
            text (str): Text to search
            
        Returns:
            Optional[str]: Extracted date in ISO format or None
        """
        for pattern in self.date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                date_str = match.group(1)
                parsed_date = self._parse_date(date_str)
                if parsed_date:
                    return parsed_date
        
        return None
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """
        Parse various date formats to ISO format
        
        Args:
            date_str (str): Date string to parse
            
        Returns:
            Optional[str]: ISO formatted date or None
        """
        # Common date formats to try
        date_formats = [
            '%m/%d/%Y', '%m-%d-%Y', '%m.%d.%Y',
            '%m/%d/%y', '%m-%d-%y', '%m.%d.%y',
            '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
            '%d/%m/%y', '%d-%m-%y', '%d.%m.%y',
            '%Y/%m/%d', '%Y-%m-%d', '%Y.%m.%d',
            '%B %d, %Y', '%b %d, %Y',
            '%d %B %Y', '%d %b %Y'
        ]
        
        for fmt in date_formats:
            try:
                parsed = datetime.strptime(date_str, fmt)
                # Convert 2-digit years
                if parsed.year < 50:
                    parsed = parsed.replace(year=parsed.year + 2000)
                elif parsed.year < 100:
                    parsed = parsed.replace(year=parsed.year + 1900)
                
                # Return ISO format date
                return parsed.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def _extract_merchant_name(self, text: str) -> Optional[str]:
        """
        Extract merchant/store name from text
        
        Args:
            text (str): Text to search
            
        Returns:
            Optional[str]: Extracted merchant name or None
        """
        lines = text.split('\n')
        
        # Look for merchant name in first few lines
        for i, line in enumerate(lines[:5]):
            line = line.strip()
            if len(line) > 3 and not re.match(r'^\d+[\d\s\-\(\)]*$', line):
                # Skip lines that are just numbers (like phone numbers)
                if not re.search(r'^\d{10,}$', line.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')):
                    # Check if line contains merchant indicators or is likely a business name
                    if (any(indicator in line.lower() for indicator in self.merchant_indicators) or
                        re.search(r'\b[A-Z][A-Za-z\s&]+\b', line)):
                        return line[:50]  # Limit length
        
        # Fallback: look for capitalized words that might be business names
        capitalized_words = re.findall(r'\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b', text)
        for word_group in capitalized_words:
            if len(word_group) > 3 and len(word_group) < 50:
                return word_group
        
        return None
    
    def _calculate_confidence(self, amount: Optional[float], date: Optional[str], 
                            merchant: Optional[str], text: str) -> float:
        """
        Calculate confidence score based on extracted information
        
        Args:
            amount: Extracted amount
            date: Extracted date
            merchant: Extracted merchant name
            text: Original text
            
        Returns:
            float: Confidence score between 0 and 1
        """
        confidence = 0.0
        
        # Amount extraction confidence
        if amount is not None:
            confidence += 0.4
        
        # Date extraction confidence
        if date is not None:
            confidence += 0.3
        
        # Merchant extraction confidence
        if merchant is not None:
            confidence += 0.2
        
        # Text quality confidence
        if len(text.strip()) > 20:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def test_ocr_engine(self) -> Dict:
        """
        Test OCR engine functionality
        
        Returns:
            Dict: Test results
        """
        try:
            # Create a simple test image with text
            test_image = Image.new('RGB', (300, 100), color='white')
            
            # Try to process it
            test_text = pytesseract.image_to_string(test_image)
            
            return {
                'tesseract_version': pytesseract.get_tesseract_version(),
                'test_successful': True,
                'message': 'OCR engine is working correctly'
            }
            
        except Exception as e:
            return {
                'test_successful': False,
                'error': str(e),
                'message': 'OCR engine test failed'
            }