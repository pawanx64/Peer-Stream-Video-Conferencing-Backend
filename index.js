const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoute = require('./Route/Auth');

dotenv.config();
const app = express();
const port = process.env.PORT; // Use process.env.PORT for flexibility

// Middleware
app.use(cors({
    origin: "https://peerstream.vercel.app", // Frontend running on port 3000
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('', authRoute);

// Error handling middleware
app.use((err, req, res, next) => {
    const errorMessage = err.message || "Something went wrong";
    const errorStatus = err.status || 500;
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// Start server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://peerstream.vercel.app", // Frontend running on port 3000
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

// WebRTC setup using Socket.io
const rooms = {}; // Maps ID to an array of connected clients

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join-room', (ID) => {
        if (!rooms[ID]) {
            rooms[ID] = new Set();
        }
        rooms[ID].add(socket.id);
        socket.join(ID);
        socket.ID = ID;
        console.log(`Client ${socket.id} joined room ${ID}`);

        // Notify existing clients in the room about the new user
        socket.to(ID).emit('new-user', { userID: socket.id });

        // Notify the new user about existing clients in the room
        socket.emit('existing-users', Array.from(rooms[ID]).filter(id => id !== socket.id));
    });

    socket.on('offer', (data) => {
        const { ID, offer, to } = data;
        socket.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', (data) => {
        const { ID, answer, to } = data;
        socket.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', (data) => {
        const { ID, candidate, to } = data;
        socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('leave-call', (ID) => {
        socket.leave(ID);
        if (rooms[ID]) {
            rooms[ID].delete(socket.id);
            if (rooms[ID].size === 0) {
                delete rooms[ID];
            }
        }
    });

    socket.on('disconnect', () => {
        const { ID } = socket;
        if (rooms[ID]) {
            rooms[ID].delete(socket.id);
            if (rooms[ID].size === 0) {
                delete rooms[ID];
            }
        }
        console.log('Client disconnected');
    });
});

// Database connection function
const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
};

// Start the server
server.listen(port, () => {
    connectToDatabase();
    console.log(`Server is running on port ${port}`);
});

