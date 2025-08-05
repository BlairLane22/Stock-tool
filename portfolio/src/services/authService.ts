import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthTokens } from '../types/portfolio';

export class AuthService {
  private users: Map<string, User & { password: string }> = new Map();
  private blacklistedTokens: Set<string> = new Set();
  private jwtSecret: string;
  private jwtRefreshSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
    
    // Initialize with demo user
    this.initializeDemoUser();
  }

  private async initializeDemoUser() {
    const hashedPassword = await bcrypt.hash('demo123', 10);
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

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdDate: new Date().toISOString(),
      password: hashedPassword
    };

    this.users.set(user.id, user);

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.users.set(user.id, user);

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async logout(token: string): Promise<void> {
    // Add token to blacklist
    this.blacklistedTokens.add(token);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as { userId: string };
      
      // Check if user exists
      const user = this.users.get(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      return this.generateTokens(user.id);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getProfile(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    // Update user data (excluding sensitive fields)
    const updatedUser = {
      ...user,
      ...updates,
      id: user.id, // Ensure ID cannot be changed
      email: user.email, // Ensure email cannot be changed through this method
      createdDate: user.createdDate // Ensure creation date cannot be changed
    };

    this.users.set(userId, updatedUser);

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    this.users.set(userId, user);
  }

  private generateTokens(userId: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  async verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        return null;
      }

      // Verify token
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      
      // Check if user exists
      const user = this.users.get(decoded.userId);
      if (!user) {
        return null;
      }

      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }
}
