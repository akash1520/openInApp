const { oauth2Client } = require('./auth');
const { listRecentUnreadEmails, replyToEmail } = require('./email');

const authRoute = (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    "https://www.googleapis.com/auth/gmail.modify",
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.redirect(url);
};

const oauthCallbackRoute = async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens) {
      return res.status(400).send('Error retrieving access token');
    }

    oauth2Client.setCredentials(tokens);

    const result = await listRecentUnreadEmails(oauth2Client);
    await replyToEmail(oauth2Client, result.messageId, result.from, "hey", "there");

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  authRoute,
  oauthCallbackRoute,
};
