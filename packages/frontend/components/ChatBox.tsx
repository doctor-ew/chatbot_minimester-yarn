// ChatBox.tsx
import React, { useState } from 'react';

const ChatBox = ({ onSend }) => {
    const [chatInput, setChatInput] = useState('');

    const handleChatSubmit = () => {
        if (!chatInput.trim()) return;
        onSend(chatInput);
        setChatInput(''); // Clear the input field after sending
    };

    return (
        <div className="chatbox">
            <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about Morties..."
            />
            <button onClick={handleChatSubmit}>Send</button>
        </div>
    );
};

export default ChatBox;
