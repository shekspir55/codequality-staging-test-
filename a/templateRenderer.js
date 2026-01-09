/**
 * Template rendering utilities
 */

/**
 * Render HTML page
 * VULNERABLE: XSS (Cross-Site Scripting)
 */
function renderUserProfile(user) {
    // SAST ISSUE: Reflected XSS - user input directly in HTML without escaping
    return `
        <html>
            <head><title>Profile - ${user.name}</title></head>
            <body>
                <h1>Welcome, ${user.name}!</h1>
                <p>Email: ${user.email}</p>
                <p>Bio: ${user.bio}</p>
                <div class="comments">${user.comments}</div>
            </body>
        </html>
    `;
}

/**
 * Render search results
 * VULNERABLE: XSS
 */
function renderSearchResults(query, results) {
    // SAST ISSUE: Reflected XSS - search query reflected without sanitization
    let html = `<h2>Search results for: ${query}</h2><ul>`;
    for (const result of results) {
        html += `<li>${result.title} - ${result.description}</li>`;
    }
    html += '</ul>';
    return html;
}

/**
 * Render error page
 * VULNERABLE: XSS via error message
 */
function renderError(errorMessage) {
    // SAST ISSUE: Error message reflected without encoding
    return `
        <html>
            <body>
                <h1>Error</h1>
                <p class="error">${errorMessage}</p>
            </body>
        </html>
    `;
}

/**
 * Generate redirect
 * VULNERABLE: Open Redirect
 */
function generateRedirect(returnUrl) {
    // SAST ISSUE: Open redirect - no validation of redirect URL
    return `<script>window.location.href = '${returnUrl}';</script>`;
}

/**
 * Set cookie via JS
 * VULNERABLE: XSS + Missing cookie flags
 */
function setCookieScript(name, value) {
    // SAST ISSUE: Cookie without HttpOnly/Secure flags, and potential XSS
    return `<script>document.cookie = '${name}=${value}';</script>`;
}

/**
 * Render with innerHTML assignment
 * VULNERABLE: DOM XSS pattern
 */
function createDynamicContent(containerId, content) {
    // SAST ISSUE: innerHTML assignment with unsanitized content
    return `
        <script>
            document.getElementById('${containerId}').innerHTML = '${content}';
        </script>
    `;
}

/**
 * Execute callback from URL
 * VULNERABLE: XSS via JSONP-like pattern
 */
function jsonpResponse(callback, data) {
    // SAST ISSUE: Callback injection / XSS
    return `${callback}(${JSON.stringify(data)})`;
}

module.exports = {
    renderUserProfile,
    renderSearchResults,
    renderError,
    generateRedirect,
    setCookieScript,
    createDynamicContent,
    jsonpResponse
};
