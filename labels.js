const { google } = require('googleapis');

async function markAsReadAndAddLabel(auth, messageId, labelName) {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        // Get a list of all labels
        const { data } = await gmail.users.labels.list({
            userId: 'me',
        });

        // Check if the label already exists
        let label = data.labels.find(l => l.name === labelName);

        // If the label doesn't exist, create it
        if (!label) {
            const { data: newLabel } = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: labelName,
                },
            });

            label = newLabel;
        }

        // Add the label to the email and mark it as read
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                removeLabelIds: ['UNREAD'],  // Mark as read
                addLabelIds: [label.id],  // Add label
            },
        });

        console.log('Email marked as read and labeled successfully');
    } catch (error) {
        console.error('Failed to mark the email as read and label it: ' + error);
    }
}


module.exports = {
  markAsReadAndAddLabel,
};
