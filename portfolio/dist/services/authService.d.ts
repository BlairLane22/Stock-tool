import { User, AuthTokens } from '../types/portfolio';
export declare class AuthService {
    private users;
    private blacklistedTokens;
    private jwtSecret;
    private jwtRefreshSecret;
    constructor();
    private initializeDemoUser;
    register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    login(email: string, password: string): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    logout(token: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    getProfile(userId: string): Promise<User | null>;
    updateProfile(userId: string, updates: Partial<User>): Promise<User | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    private generateTokens;
    verifyToken(token: string): Promise<{
        userId: string;
    } | null>;
}
//# sourceMappingURL=authService.d.ts.map