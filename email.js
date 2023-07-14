const { google } = require('googleapis');
const { markAsReadAndAddLabel } = require('./labels');

async function listRecentUnreadEmails(auth) {
    const gmail = google.gmail({version: 'v1', auth});
  
    try {
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 4,  // Change this to the number of emails you want to retrieve
        q: 'is:unread', // Query for unread emails
      });
  
      // Check if there are any unread emails
      if (!data.messages) {
        console.log('No unread emails found.');
        return null;
      }

      // Get more details for each message
      const messageDetails = await Promise.all(data.messages.map(async (message) => {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        // Get the thread of the message
        const threadData = await gmail.users.threads.get({
          userId: 'me',
          id: messageData.data.threadId,
        });

        // Check if the message has been replied to
        if (threadData.data.messages.length > 1) {
          // The message has been replied to, so skip this message
          return null;
        }

        const headers = messageData.data.payload.headers;
        const subjectHeader = headers.find(header => header.name === "Subject");
        const fromHeader = headers.find(header => header.name === "From");

        // If subject or from header is not found, return null
        if (!subjectHeader || !fromHeader) {
          return null;
        }

        const subject = subjectHeader.value;
        let from = fromHeader.value;

        // Extract the email address from the "From" field
        const match = from.match(/<(.+)>/);
        if (match) from = match[1];

        let body = '';
        if (messageData.data.payload.parts) {
          body = messageData.data.payload.parts.find(part => part.mimeType === 'text/plain').body.data;
        } else {
          body = messageData.data.payload.body.data;
        }

        // Decode the base64 encoded email body
        body = Buffer.from(body, 'base64').toString('utf-8');

        return {
          messageId: messageData.data.id,
          subject: subject,
          from: from,
          body: body
        };
      }));

      // Filter out messages that have been replied to or have missing subject/from header
      const validMessages = messageDetails.filter(message => message !== null);

      // If there are no valid messages, return null
      if (validMessages.length === 0) {
        console.log('No valid emails found.');
        return null;
      }

      return validMessages[0];
    } catch (error) {
      console.error('The API returned an error: ' + error);
    }
}


async function replyToEmail(auth, messageId, to, subject, body) {
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = makeBody(to, 'me', subject, body, messageId);
    const encodedMessage = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        console.log('Email sent successfully');
        markAsReadAndAddLabel(auth, messageId, "automatedreplies");
    } catch (error) {
        console.error('Failed to send the email: ' + error);
    }
}

function makeBody(to, from, subject, message, messageId) {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n",
        "In-Reply-To: ", messageId, "\n",
        "References: ", messageId, "\n",
        "\n",
        message
    ].join('');

    return str;
}

module.exports = {
  listRecentUnreadEmails,
  replyToEmail,
  markAsReadAndAddLabel,
};
