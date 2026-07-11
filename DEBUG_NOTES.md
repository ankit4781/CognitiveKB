# Debug Notes

This document describes three real technical issues encountered during the development of the **CognitiveKB** application, their investigations, root causes, and solutions.

---

## Issue 1: SPA Route Refreshes Returning 404 in Docker Container

### Problem
After building the production Docker container and booting the application with `docker-compose`, navigating between views (e.g., `/documents` or `/chat`) worked fine via React Router links. However, refreshing the browser page on any path other than `/` resulted in an Nginx `404 Not Found` error.

### Root Cause
Vite builds the React application as a Single Page Application (SPA) outputting a single `index.html` file. Nginx was configured to serve files based on URI paths directly (e.g., trying to find a physical file or directory named `/documents` inside `/usr/share/nginx/html`). Since that folder doesn't exist, Nginx threw a 404.

### Investigation
Inspected the default Nginx configurations. By default, Nginx lacks built-in redirection for client-side routing systems.

### Solution
Created a custom `nginx.conf` file for the frontend container and modified the Nginx default configuration to include a fallback check:
```nginx
location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html;
}
```
This forces Nginx to fall back to `index.html` for any paths it cannot resolve physically, allowing React Router to intercept the URL and render the correct view.

---

## Issue 2: PDF Extraction Encoding Issues on Encrypted or Image-Only Files

### Problem
When attempting to upload scanned documents or highly formatted PDF resumes, the `pdf-parse` module returned empty strings or corrupted text, saving empty fields to the database.

### Root Cause
`pdf-parse` extracts character map encodings from PDF pages. If the PDF consists of scanned raster images (lacking text layers) or has encrypted fonts, standard character map extractions fail, returning empty text.

### Investigation
Inspected the upload controllers. The application accepted files without checking if the parsed text content was blank, which subsequently caused empty prompt context payloads for the Gemini API.

### Solution
Added a validation check in `documentController.ts` after parsing the buffer:
```typescript
const trimmedText = extractedText.trim();
if (!trimmedText) {
  return res.status(422).json({ 
    message: 'The uploaded file appears to have no readable text content.' 
  });
}
```
This gracefully blocks empty file database inserts and sends a clean message back to the frontend informing the user that the PDF is empty or needs a selectable text layer.

---

## Issue 3: JWT Verification Crashes on Expired Session Tokens

### Problem
During testing, if a user stayed logged in beyond the JWT token expiration time (7 days), any subsequent page refresh or API request crashed the Express server with an unhandled exception or returned a generic 500 error, instead of forcing a redirect to the login screen.

### Root Cause
The `jwt.verify` method throws a `TokenExpiredError` if the expiration date has passed. In the auth middleware, this error was not being isolated and returned a generic verification exception. Furthermore, the frontend was not checking for specific 401 error states to clear local credentials.

### Investigation
Examined `middleware/auth.ts` and the frontend Axios request interceptors.

### Solution
1. Updated backend `auth.ts` to identify the `TokenExpiredError` specifically and send a clear warning message:
```typescript
if (err.name === 'TokenExpiredError') {
  return res.status(401).json({ message: 'Authentication session expired. Please log in again.' });
}
```
2. Implemented a global response interceptor in the frontend Axios helper (`frontend/src/utils/api.ts`) that listens for `401` statuses, clears local storage tokens automatically, and redirects the browser session to `/login`.
