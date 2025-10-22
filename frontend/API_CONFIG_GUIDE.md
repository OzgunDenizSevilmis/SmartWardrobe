# API Configuration Guide

## Overview
All API endpoints are now centralized using environment variables and a configuration file to avoid manually changing IP addresses in multiple files.

## How to Update IP Address

### Method 1: Update .env file (Recommended)
1. Open `.env` file in the root directory
2. Change the `API_URL` value:
   ```
   API_URL=http://YOUR_NEW_IP:5001
   ```
3. Restart your Expo development server

### Method 2: For HTML files
Update the `API_BASE_URL` constant in `app/resetpassword.html`:
```javascript
const API_BASE_URL = 'http://YOUR_NEW_IP:5001';
```

## Files Updated

The following files now use the centralized configuration:

### JavaScript Files (using config/config.js):
- `app/login.js`
- `app/register.js`
- `app/passwordreset.js`
- `app/MyStyleScreen.js`
- `app/WardrobeScreen.js`
- `app/AddClothingScreen.js`

### HTML Files (using API_BASE_URL variable):
- `app/resetpassword.html`

## Configuration Structure

### Environment Variables (.env)
```
GEMINI_API_KEY=AIzaSyAlexYhUE5llajGjuZRjExR1jfqKpd8lZI
WEATHER_API_KEY=3cd35d9c64c94dcdb53111829252405
API_URL=http://192.168.40.37:5001
```

### Config File (config/config.js)
Provides centralized API configuration with:
- Base URL from environment variable
- Endpoint definitions
- Helper function `getApiUrl()` for building full URLs

## Usage Examples

### In JavaScript files:
```javascript
import { getApiUrl } from '../config/config';

// Instead of: 'http://192.168.40.37:5001/login'
const response = await axios.post(getApiUrl('/login'), data);
```

### In HTML files:
```javascript
// Instead of: 'http://192.168.40.37:5001/reset-password'
const response = await fetch(`${API_BASE_URL}/reset-password`, options);
```

## Benefits

1. **Single Point of Change**: Update IP address in one place (.env file)
2. **Environment-based Configuration**: Different IPs for different environments
3. **Consistent URL Management**: All endpoints defined in one place
4. **Fallback Support**: Default URL if environment variable is not set

## Troubleshooting

If you encounter connection issues:
1. Verify the IP address in `.env` is correct
2. Ensure your device is on the same network as the backend server
3. Check that the backend server is running on the specified port (5001)
4. Restart the Expo development server after changing `.env`