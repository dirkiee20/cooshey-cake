const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Security fix: Enhanced file upload middleware with content-type validation, file scanning, and size limits

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename to prevent path traversal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Enhanced file type and security validation
const checkFileType = (file, cb) => {
  // Allowed file types with strict validation
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  };

  // Check if mimetype is allowed
  if (!allowedTypes[file.mimetype]) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }

  // Check if file extension matches mimetype
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes[file.mimetype].includes(ext)) {
    return cb(new Error('File extension does not match file type.'), false);
  }

  // Additional security checks
  const fileName = path.basename(file.originalname);

  // Prevent files with dangerous names
  if (fileName.includes('..') || fileName.startsWith('.') || fileName.includes('/')) {
    return cb(new Error('Invalid file name.'), false);
  }

  // Check for null bytes in filename
  if (fileName.includes('\0')) {
    return cb(new Error('Invalid file name.'), false);
  }

  cb(null, true);
};

// File scanning function (basic implementation - in production, use proper antivirus)
const scanFile = (filePath) => {
  return new Promise((resolve, reject) => {
    // Basic file scanning - check file header
    const fileStream = fs.createReadStream(filePath, { start: 0, end: 100 });
    let buffer = Buffer.alloc(0);

    fileStream.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    fileStream.on('end', () => {
      // Check for common image file signatures
      const signatures = {
        jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
        png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
        gif: Buffer.from([0x47, 0x49, 0x46]),
        webp: Buffer.from([0x52, 0x49, 0x46, 0x46]) // RIFF
      };

      const fileHeader = buffer.slice(0, 4);

      if (fileHeader.slice(0, 3).equals(signatures.jpeg) ||
          fileHeader.equals(signatures.png) ||
          fileHeader.slice(0, 3).equals(signatures.gif) ||
          fileHeader.slice(0, 4).equals(signatures.webp)) {
        resolve(true);
      } else {
        reject(new Error('File content does not match allowed image types.'));
      }
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
};

// Enhanced multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (increased but still reasonable)
    files: 1, // Only one file per request
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
});

// Middleware to scan uploaded files
const scanUploadedFile = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    await scanFile(req.file.path);
    next();
  } catch (error) {
    // Clean up the uploaded file if scanning fails
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: error.message });
  }
};

// Export both upload middleware and scanner
module.exports = {
  upload,
  scanUploadedFile
};