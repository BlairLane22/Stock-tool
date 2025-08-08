"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
class AuthService {
    constructor() {
        this.users = new Map();
        this.blacklistedTokens = new Set();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
        this.initializeDemoUser();
    }
    async initializeDemoUser() {
        const hashedPassword = await bcryptjs_1.default.hash('demo123', 10);
        const demoUser = {
            id: 'demo-user',
            email: 'demo@stocktrack.com',
            firstName: 'Demo',
            lastName: 'User',
            createdDate: new Date('2024-01-01').toISOString(),
            lastLogin: new Date().toISOString(),
            password: hashedPassword
        };
        this.users.set(demoUser.id, demoUser);
    }
    async register(userData) {
        const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        if (userData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
        const user = {
            id: (0, uuid_1.v4)(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            createdDate: new Date().toISOString(),
            password: hashedPassword
        };
        this.users.set(user.id, user);
        const tokens = this.generateTokens(user.id);
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens
        };
    }
    async login(email, password) {
        const user = Array.from(this.users.values()).find(u => u.email === email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        user.lastLogin = new Date().toISOString();
        this.users.set(user.id, user);
        const tokens = this.generateTokens(user.id);
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens
        };
    }
    async logout(token) {
        this.blacklistedTokens.add(token);
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, this.jwtRefreshSecret);
            const user = this.users.get(decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }
            return this.generateTokens(user.id);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async getProfile(userId) {
        const user = this.users.get(userId);
        if (!user)
            return null;
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(userId, updates) {
        const user = this.users.get(userId);
        if (!user)
            return null;
        const updatedUser = {
            ...user,
            ...updates,
            id: user.id,
            email: user.email,
            createdDate: user.createdDate
        };
        this.users.set(userId, updatedUser);
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedNewPassword;
        this.users.set(userId, user);
    }
    generateTokens(userId) {
        const accessToken = jsonwebtoken_1.default.sign({ userId }, this.jwtSecret, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId }, this.jwtRefreshSecret, { expiresIn: '7d' });
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60
        };
    }
    async verifyToken(token) {
        try {
            if (this.blacklistedTokens.has(token)) {
                return null;
            }
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            const user = this.users.get(decoded.userId);
            if (!user) {
                return null;
            }
            return { userId: decoded.userId };
        }
        catch (error) {
            return null;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map