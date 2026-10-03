import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, please log in'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      return next(new Error('User no longer exists'));
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(new Error('Not authorized, invalid token'));
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    return next(new Error('Admin access only'));
  }
  next();
};