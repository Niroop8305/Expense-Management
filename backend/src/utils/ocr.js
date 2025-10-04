const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from image using Tesseract OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m) // Optional: log OCR progress
    });
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from PDF
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from uploaded file (image or PDF)
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(filePath, mimeType) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  if (mimeType === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  } else if (mimeType.startsWith('image/')) {
    return await extractTextFromImage(filePath);
  } else {
    throw new Error('Unsupported file type for OCR');
  }
}

/**
 * Parse extracted text to find expense details
 * @param {string} text - Extracted text from OCR
 * @returns {Object} - Parsed expense data
 */
function parseExpenseData(text) {
  const result = {
    amount: null,
    date: null,
    category: null,
    description: null,
    confidence: 0
  };

  try {
    // Clean up the text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Extract amount - look for currency symbols and numbers
    const amountPatterns = [
      /(?:₹|INR|Rs\.?)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:\$|USD)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:€|EUR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:£|GBP)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:total|amount|sum)[\s:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s*(?:₹|INR|Rs\.?|\$|USD|€|EUR|£|GBP))/gi
    ];

    for (const pattern of amountPatterns) {
      const match = pattern.exec(cleanText);
      if (match) {
        result.amount = parseFloat(match[1].replace(/,/g, ''));
        result.confidence += 0.3;
        break;
      }
    }

    // Extract date - various date formats
    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g,
      /(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})/g,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/gi,
      /(?:date|dated)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(cleanText);
      if (match) {
        const dateStr = match[1];
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          result.date = parsedDate.toISOString().split('T')[0];
          result.confidence += 0.2;
          break;
        }
      }
    }

    // Determine category based on keywords
    const categoryKeywords = {
      'Travel': ['taxi', 'uber', 'cab', 'flight', 'hotel', 'accommodation', 'train', 'bus', 'travel', 'petrol', 'fuel', 'gas'],
      'Food': ['restaurant', 'cafe', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'coffee', 'snack', 'catering'],
      'Office Supplies': ['office', 'supplies', 'stationery', 'paper', 'pen', 'printer', 'computer', 'software'],
      'Entertainment': ['entertainment', 'movie', 'cinema', 'theater', 'show', 'concert', 'event'],
      'Healthcare': ['medical', 'doctor', 'hospital', 'pharmacy', 'health', 'medicine', 'clinic'],
      'Utilities': ['electricity', 'water', 'internet', 'phone', 'mobile', 'utility', 'bill'],
      'Other': []
    };

    const lowerText = cleanText.toLowerCase();
    let bestCategory = 'Other';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    if (maxMatches > 0) {
      result.category = bestCategory;
      result.confidence += 0.2;
    }

    // Extract description - try to find merchant name or business name
    const merchantPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:restaurant|cafe|hotel|store|shop|mart|ltd|inc|corp)/gi,
      /^([A-Z][A-Z\s&]+)$/gm,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g
    ];

    for (const pattern of merchantPatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        // Get the first reasonable match
        const potentialName = matches[0][1].trim();
        if (potentialName.length >= 3 && potentialName.length <= 50) {
          result.description = potentialName;
          result.confidence += 0.3;
          break;
        }
      }
    }

    // If no good description found, use a truncated version of the text
    if (!result.description && cleanText.length > 0) {
      result.description = cleanText.substring(0, 100).trim();
      if (result.description.length === 100) {
        result.description += '...';
      }
    }

    return result;
  } catch (error) {
    console.error('Error parsing expense data:', error);
    return result;
  }
}

/**
 * Process uploaded receipt file and extract expense data
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} - Extracted and parsed expense data
 */
async function processReceiptFile(filePath, mimeType) {
  try {
    console.log(`Processing receipt file: ${filePath} (${mimeType})`);
    
    // Extract text using OCR
    const extractedText = await extractTextFromFile(filePath, mimeType);
    console.log('Extracted text:', extractedText);
    
    // Parse the extracted text
    const expenseData = parseExpenseData(extractedText);
    console.log('Parsed expense data:', expenseData);
    
    return {
      success: true,
      extractedText,
      expenseData,
      message: 'Receipt processed successfully'
    };
  } catch (error) {
    console.error('Error processing receipt file:', error);
    return {
      success: false,
      error: error.message,
      expenseData: {
        amount: null,
        date: null,
        category: null,
        description: null,
        confidence: 0
      },
      message: 'Failed to process receipt'
    };
  }
}

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  extractTextFromFile,
  parseExpenseData,
  processReceiptFile
};