// utils/websocket.js

const rooms = {}; // Maps roomID to an array of connected WebSocket clients

// Function to broadcast a message to all peers in a room except the sender
const broadcastToRoom = (roomID, senderSocket, message) => {
    const peers = rooms[roomID];
    if (peers) {
        for (const peerSocket of peers) {
            if (peerSocket !== senderSocket) {
                peerSocket.send(message);
            }
        }
    }
};

module.exports = { broadcastToRoom };

