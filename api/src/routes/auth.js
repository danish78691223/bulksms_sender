import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const schema = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(128), displayName: z.string().max(80).optional() });

router.post('/register', async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const email = input.email.toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ error: 'Account already exists' });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({ email, passwordHash, displayName: input.displayName || 'Shop Owner' });
    const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '12h' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, displayName: user.displayName } });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const input = schema.pick({ email: true, password: true }).parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '12h' });
    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName } });
  } catch (e) { next(e); }
});
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('email displayName');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) { next(e); }
});
export default router;
