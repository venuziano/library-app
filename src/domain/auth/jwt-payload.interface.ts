export interface JwtPayload {
  sub: string; // user ID
  username: string; // unique username or email
  // roles?: string[];  // optional user roles or permissions
  iat?: number; // issued at (timestamp)
  exp?: number; // expiration time (timestamp)
}
