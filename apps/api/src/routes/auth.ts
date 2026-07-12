import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();

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
    const { access_token: accessToken } = await tokenRes.json() as any;

    if (!accessToken) {
      res.status(400).json({ error: 'GitHub OAuth failed — bad code or app credentials' });
      return;
    }

    // Fetch the user's profile and primary email
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`,
          'User-Agent': 'trace-app',
          Accept: 'application/vnd.github.v3+json',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`,
          'User-Agent': 'trace-app',
          Accept: 'application/vnd.github.v3+json',
        },
      }),
    ]);

    const profile: any = await profileRes.json();
    const emails: any = await emailsRes.json();
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

router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Missing OAuth code' });
      return;
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${process.env.FRONTEND_URL}/auth/google`,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData: any = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      res.status(400).json({ error: 'Google OAuth failed — bad code or app credentials' });
      return;
    }

    // Fetch Google user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile: any = await profileRes.json();

    const email: string   = profile.email ?? '';
    const googleId: string = String(profile.id);
    const login: string   = profile.name ?? email.split('@')[0];
    const avatarUrl: string = profile.picture ?? '';

    if (!email) {
      res.status(400).json({ error: 'Could not retrieve email from Google account' });
      return;
    }

    // Try to find existing user — first by googleId, then by email (links accounts)
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if a GitHub-created account exists with the same email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link Google ID to existing account
        user.googleId  = googleId;
        user.avatarUrl = user.avatarUrl || avatarUrl;
        await user.save();
      } else {
        // Brand new user — create account
        user = await User.create({
          googleId,
          login,
          email:     email.toLowerCase(),
          avatarUrl,
        });
      }
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
    console.error('[auth] google error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
