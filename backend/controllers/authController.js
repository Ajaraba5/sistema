const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const authController = {
    // Login
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            // Find user
            const user = await User.findByUsername(username);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const isValidPassword = await User.comparePassword(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role 
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        nombre: user.nombre,
                        email: user.email
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Register (only for creating contador accounts by admin)
    async register(req, res, next) {
        try {
            const { username, password, nombre, email } = req.body;

            if (!username || !password || !nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, password, and nombre are required'
                });
            }

            // Check if user already exists
            const existingUser = await User.findByUsername(username);
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            // Create new user (contador role by default for registration)
            const newUser = await User.create({
                username,
                password,
                role: 'contador',
                nombre,
                email
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
