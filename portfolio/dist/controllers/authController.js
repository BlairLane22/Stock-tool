"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    constructor() {
        this.register = async (req, res) => {
            try {
                const { email, password, firstName, lastName } = req.body;
                if (!email || !password || !firstName || !lastName) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email, password, first name, and last name are required'
                    });
                }
                const result = await this.authService.register({
                    email,
                    password,
                    firstName,
                    lastName
                });
                res.status(201).json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Registration failed'
                });
            }
        };
        this.login = async (req, res) => {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email and password are required'
                    });
                }
                const result = await this.authService.login(email, password);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                res.status(401).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Login failed'
                });
            }
        };
        this.logout = async (req, res) => {
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (token) {
                    await this.authService.logout(token);
                }
                res.json({
                    success: true,
                    message: 'Logged out successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Logout failed'
                });
            }
        };
        this.refreshToken = async (req, res) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return res.status(400).json({
                        success: false,
                        error: 'Refresh token is required'
                    });
                }
                const result = await this.authService.refreshToken(refreshToken);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                res.status(401).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Token refresh failed'
                });
            }
        };
        this.getProfile = async (req, res) => {
            try {
                const userId = req.headers['user-id'] || 'demo-user';
                const profile = await this.authService.getProfile(userId);
                if (!profile) {
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }
                res.json({
                    success: true,
                    data: profile
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get profile'
                });
            }
        };
        this.updateProfile = async (req, res) => {
            try {
                const userId = req.headers['user-id'] || 'demo-user';
                const updates = req.body;
                const profile = await this.authService.updateProfile(userId, updates);
                if (!profile) {
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }
                res.json({
                    success: true,
                    data: profile
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update profile'
                });
            }
        };
        this.changePassword = async (req, res) => {
            try {
                const userId = req.headers['user-id'] || 'demo-user';
                const { currentPassword, newPassword } = req.body;
                if (!currentPassword || !newPassword) {
                    return res.status(400).json({
                        success: false,
                        error: 'Current password and new password are required'
                    });
                }
                await this.authService.changePassword(userId, currentPassword, newPassword);
                res.json({
                    success: true,
                    message: 'Password changed successfully'
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to change password'
                });
            }
        };
        this.authService = new authService_1.AuthService();
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map