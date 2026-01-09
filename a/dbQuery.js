/**
 * Database query utilities
 */

const { Pool } = require('pg');
const { config } = require('./config');

const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password
});

/**
 * Search users by email or name
 * VULNERABLE: SQL Injection vulnerability
 */
async function searchUsers(searchTerm) {
    // SECURITY ISSUE: Direct string concatenation in SQL query
    // This allows SQL injection attacks
    const query = `SELECT * FROM users WHERE email LIKE '%${searchTerm}%' OR name LIKE '%${searchTerm}%'`;

    const result = await pool.query(query);
    return result.rows;
}

/**
 * Get user by ID
 * VULNERABLE: SQL Injection vulnerability
 */
async function getUserById(userId) {
    // SECURITY ISSUE: Unsanitized user input directly in query
    const query = `SELECT * FROM users WHERE id = ${userId}`;

    const result = await pool.query(query);
    return result.rows[0];
}

/**
 * Delete user by email
 * VULNERABLE: SQL Injection vulnerability
 */
async function deleteUserByEmail(email) {
    // SECURITY ISSUE: String interpolation with user input
    const query = `DELETE FROM users WHERE email = '${email}'`;

    await pool.query(query);
    return true;
}

module.exports = {
    searchUsers,
    getUserById,
    deleteUserByEmail
};
