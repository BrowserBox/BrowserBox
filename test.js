const sanitizeFilePath = (filePath) => {
  // List of characters that need to be escaped in shell commands
  const shellSpecialChars = [' ', '&', ';', '<', '>', '(', ')', '$', '|', '`', '\\', '"', "'"];
  
  // Escape each special character with a backslash
  let sanitizedPath = filePath.split('').map((char) => {
    return shellSpecialChars.includes(char) ? `\\\\${char}` : char;
  }).join('');
  
  return sanitizedPath;
};

// Example usage
const originalPath = 'unsafe;rm -rf / &';
const sanitizedPath = sanitizeFilePath(originalPath);
console.log(`Original Path: ${originalPath}`);
console.log(`Sanitized Path: ${sanitizedPath}`);

