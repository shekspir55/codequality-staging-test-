/**
 * File and system utilities
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// SAST ISSUE: Hardcoded credentials
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const DATABASE_PASSWORD = 'super_secret_password_123';
const API_KEY = 'sk-1234567890abcdef1234567890abcdef';

/**
 * Execute system command with filename
 * VULNERABLE: Command Injection
 */
function processFile(filename) {
    // SAST ISSUE: Command injection - user input directly in exec
    exec(`cat ${filename} | wc -l`, (error, stdout) => {
        if (error) {
            console.error('Error:', error);
            return;
        }
        console.log('Line count:', stdout);
    });
}

/**
 * Compress a file
 * VULNERABLE: Command Injection
 */
function compressFile(inputPath, outputPath) {
    // SAST ISSUE: Command injection via string concatenation
    const command = `gzip -c ${inputPath} > ${outputPath}`;
    execSync(command);
}

/**
 * Search in files using grep
 * VULNERABLE: Command Injection
 */
function searchInFiles(pattern, directory) {
    // SAST ISSUE: Unsanitized user input in shell command
    return execSync(`grep -r "${pattern}" ${directory}`).toString();
}

/**
 * Read user file
 * VULNERABLE: Path Traversal
 */
function readUserFile(userId, filename) {
    // SAST ISSUE: Path traversal - no sanitization of filename
    const filePath = `/var/data/users/${userId}/${filename}`;
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Download file to user directory
 * VULNERABLE: Path Traversal
 */
function saveUploadedFile(userId, filename, content) {
    // SAST ISSUE: Path traversal vulnerability
    const savePath = path.join('/uploads', userId, filename);
    fs.writeFileSync(savePath, content);
    return savePath;
}

/**
 * Get file from any path
 * VULNERABLE: Path Traversal (LFI)
 */
function getFile(requestedPath) {
    // SAST ISSUE: Local File Inclusion - allows reading arbitrary files
    const baseDir = '/var/www/public';
    const fullPath = baseDir + '/' + requestedPath;
    return fs.readFileSync(fullPath);
}

/**
 * Deserialize user data
 * VULNERABLE: Insecure Deserialization
 */
function loadUserSession(serializedData) {
    // SAST ISSUE: Insecure deserialization using eval
    const session = eval('(' + serializedData + ')');
    return session;
}

/**
 * Parse configuration
 * VULNERABLE: Code Injection via Function constructor
 */
function parseConfig(configString) {
    // SAST ISSUE: Code injection via Function constructor
    const parser = new Function('return ' + configString);
    return parser();
}

/**
 * Render template
 * VULNERABLE: Server-Side Template Injection / eval
 */
function renderTemplate(template, data) {
    // SAST ISSUE: eval with user-controlled input
    const rendered = eval('`' + template + '`');
    return rendered;
}

module.exports = {
    processFile,
    compressFile,
    searchInFiles,
    readUserFile,
    saveUploadedFile,
    getFile,
    loadUserSession,
    parseConfig,
    renderTemplate,
    // Exporting secrets (also a bad practice)
    AWS_ACCESS_KEY,
    AWS_SECRET_KEY,
    DATABASE_PASSWORD,
    API_KEY
};
