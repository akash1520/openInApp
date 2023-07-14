const express = require('express');
const dotenv = require('dotenv');
const { oauth2Client } = require('./auth');
const { authRoute, oauthCallbackRoute } = require('./routes');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Endpoint to start the OAuth process
app.get('/auth', authRoute);

// OAuth callback url
app.get('/oauth2callback', oauthCallbackRoute);

app.listen(8000, () => console.log('Server running on http://localhost:8000'));
