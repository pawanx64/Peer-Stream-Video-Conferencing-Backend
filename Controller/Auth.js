const User=require('../Model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('../Utilis/Error');

exports.register = async (req, res,next) => {
    const { username, password, email } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, password: hashedpassword, email });
        await newUser.save();
        res.status(200).send("User registered successfully");
    } catch (err) {
        next(err); // Pass error to Express error handling middleware
    }
}



exports.login = async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return next(createError(404, "User not found"));
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return next(createError(400, "Invalid credentials"));
        
        const token = jwt.sign({ id: user._id },
            process.env.JWT_SECRET, { expiresIn: "1h" });
        
        // Sending user data without password in response
        const { password: pass, ...data } = user._doc;
        
        // Set JWT token as a cookie
        res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json(data);
    } catch (err) {
        next(err); // Pass error to Express error handling middleware
    }
}



exports.getUser = async (req, res, next) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.status(200).send("Username already exists, please Login to continue, or choose a different username");
        } else {
            res.status(200).send("Username is available");
        }
    } catch (err) {
        next(err); // Pass error to Express error handling middleware
    }
}
