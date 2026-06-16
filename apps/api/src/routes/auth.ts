import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();

// POST /api/auth/github
// Called by the frontend after GitHub redirects back with a code.
// We exchange it for an access token, fetch the user's profile,
// upsert them in the DB, and return a signed JWT.
router.post('/github', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Missing OAuth code' });
      return;
    }

    // Exchange the code for an access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method:  'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const { access_token: accessToken } = await tokenRes.json();

    if (!accessToken) {
      res.status(400).json({ error: 'GitHub OAuth failed — bad code or app credentials' });
      return;
    }

    // Fetch the user's profile and primary email
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'trace-app' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'trace-app' },
      }),
    ]);

    const profile = await profileRes.json();
    const emails  = await emailsRes.json();
    const primaryEmail =
      (Array.isArray(emails) ? emails.find((e: any) => e.primary)?.email : null) ??
      profile.email ??
      '';

    // Upsert user
    let user = await User.findOne({ githubId: String(profile.id) });
    if (!user) {
      user = await User.create({
        githubId:  String(profile.id),
        login:     profile.login,
        email:     primaryEmail,
        avatarUrl: profile.avatar_url ?? '',
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:        user._id,
        login:     user.login,
        email:     user.email,
        role:      user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[auth] github error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me — validate token and return current user profile
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(userId).select('-__v');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
