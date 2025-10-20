const User = require('../models/user')
const { UnauthorizedAccessError } = require('../helpers/exceptions');
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken');

const test = (req, res) => {
    res.json('tests is working')
}

const registerUser = async (req, res) => {
    try {
        const { email, password, username, number, address, type, specializations, credentials } = req.body;
        const hashedPassword = await hashPassword(password)
        
        // check empty value
        if (!email) {
            return res.json({
                err: 'Email is required!'
            })
        }

        if (!password || password.length < 6) {
            return res.json({
                err: 'Password of at least 6 characters long is required!'
            })
        }

        if (!username) {
            return res.json({
                err: 'username is required!'
            })
        } 
        if (!number) {
            return res.json({
                err: 'Number is required!'
            })
        }
        if (!address) {
            return res.json({
                err: 'Address is required!'
            })
        }

        if (!type || !['client', 'lawyer'].includes(type)) {
            return res.json({
                err: 'Valid user type (client or lawyer) is required!'
            })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                err: 'User with this email already exists!'
            });
        }

        // Create user object based on type
        const userData = {
            username, 
            email, 
            number, 
            address, 
            password: hashedPassword, 
            avatar_url: "", 
            type
        };

        // Add lawyer-specific fields if registering as lawyer
        if (type === 'lawyer') {
            if (!specializations || specializations.length === 0) {
                return res.status(400).json({
                    err: 'At least one specialization is required for lawyers!'
                });
            }
            userData.specializations = specializations;
            userData.credentials = credentials || {};
            userData.isVerified = false; // Lawyers need admin verification
        }

        const newUser = new User(userData);
            await newUser.save();
        
        res.status(201).json({ 
            message: type === 'lawyer' ? 'Lawyer registration submitted. Pending admin verification.' : 'User registered successfully',
            type: newUser.type,
            isVerified: newUser.isVerified
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: 'User registration failed' });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                error: 'No user found'
            })
        }

        const match = await comparePassword(password, user.password)
        if (match) {
            jwt.sign({
                email: user.email,
                userId: user._id,
                name: user.username,
                type: user.type
            }, process.env.JWT_SECRET, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token, {
                    secure: false, // set true if served over https
                    httpOnly: true,
                    sameSite: 'lax',
                    maxAge: 2 * 60 * 60 * 1000,
                })
                .json({ token, type: user.type, name: user.username})
            })
        }
        else{
            throw new UnauthorizedAccessError("Unauthorized Access")
        }
    } catch (error) {
        res.status(401).json({
            error: error.name,
            message: error.message
        })
    }
}

const readUser = (req, res) => {
}

// Return current user info (and a fresh token) based on the auth cookie
const me = async (req, res) => {
    try {
        const decoded = res.locals.decodedToken;
        if (!decoded) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Optionally issue a fresh token for client-side usages (e.g., sockets)
        jwt.sign({
            email: decoded.email,
            userId: decoded.userId,
            name: decoded.name,
            type: decoded.type
        }, process.env.JWT_SECRET, {}, (err, freshToken) => {
            if (err) throw err;
            res.status(200).json({
                user: {
                    email: decoded.email,
                    userId: decoded.userId,
                    name: decoded.name,
                    type: decoded.type
                },
                token: freshToken
            });
        });
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Logout by clearing the cookie
const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
}

module.exports = { test, registerUser, loginUser, readUser, me, logout }