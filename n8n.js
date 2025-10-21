// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // Get references to the HTML elements
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');

    // --- PASTE YOUR N8N WEBHOOK URL HERE ---
    // This is the 'Test URL' you copied from your n8n Webhook node
    const n8nWebhookUrl = 'https://n8n.malluseller.shop/webhook/6158eeaf-82fc-4ffd-b35c-6629e4c77fc1';

    // Add an event listener for when the user submits the form
    chatForm.addEventListener('submit', (event) => {
        // Prevent the form from refreshing the page
        event.preventDefault(); 
        
        // Get the user's message and trim whitespace
        const userMessage = messageInput.value.trim();

        // If the message isn't empty
        if (userMessage) {
            // 1. Display the user's message in the chat window
            displayMessage(userMessage, 'user');

            // 2. Send the message to n8n
            sendMessageToN8n(userMessage);

            // 3. Clear the input field
            messageInput.value = '';
        }
    });

    /**
     * Appends a new message to the chat window.
     * @param {string} message - The text content of the message.
     * @param {string} sender - 'user' or 'bot'.
     */
    function displayMessage(message, sender) {
        // Create a new div element for the message
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender); // 'message user' or 'message bot'
        if (sender === 'bot') {
            // If the message is from the bot, parse it as Markdown
            // This safely converts **text** to bold, *text* to italics,
            // and numbered lines into an ordered list.
            messageElement.innerHTML = marked.parse(message);
        } else {
            // If the message is from the user, just display it as plain text
            // This prevents security issues (XSS)
            messageElement.textContent = message;
        }
        
        // Add the new message to the chat window
        chatWindow.appendChild(messageElement);
        
        // Automatically scroll to the bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    /**
     * Sends the user's message to the n8n webhook.
     * @param {string} userMessage - The message to send.
     */
    async function sendMessageToN8n(userMessage) {
        // Display a temporary "typing" message
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot');
        typingIndicator.textContent = '...';
        chatWindow.appendChild(typingIndicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
            // Send a POST request to the n8n webhook
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the message in the format n8n expects
                body: JSON.stringify({
                    prompt: userMessage 
                }),
            });

            // Wait for the response from n8n and parse it as JSON
            const data = await response.json();

            // Remove the "typing" indicator
            chatWindow.removeChild(typingIndicator);

            // Display the bot's reply
            // We expect the data to have a 'reply' field, based on our 'Set' node
            if (data.output) {
                console.log(data.output);
                
                displayMessage(data.output, 'bot');
            } else {
                displayMessage('Sorry, I had trouble getting a response.', 'bot');
            }

        } catch (error) {
            // Handle any errors that occurred during the fetch
            console.error('Error sending message to n8n:', error);
            chatWindow.removeChild(typingIndicator); // Also remove typing on error
            displayMessage('Sorry, I couldn\'t connect to the server.', 'bot');
        }
    }
});