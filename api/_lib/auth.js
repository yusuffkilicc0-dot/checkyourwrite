import jwt from 'jsonwebtoken';

// Authorization: Bearer <token> header'ini dogrular.
// Basarili ise { userId, email } dondurur, degilse null.
export function verifyAuth(req) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}
