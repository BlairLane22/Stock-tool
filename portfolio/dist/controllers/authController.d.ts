import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    constructor();
    register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    logout: (req: Request, res: Response) => Promise<void>;
    refreshToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    changePassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=authController.d.ts.map