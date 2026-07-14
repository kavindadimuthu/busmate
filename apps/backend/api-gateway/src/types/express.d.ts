declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      email: string;
      userType: string;
      accountStatus: string;
    };
  }
}
