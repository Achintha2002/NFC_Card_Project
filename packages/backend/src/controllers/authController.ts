// ============================================================
//  NEXUS — Auth Controller
//  Handles: register, login, token refresh, me (profile fetch)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwtUtils';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { AppError } from '../middlewares/errorMiddleware';
import { verifyGoogleToken, verifyAppleToken, generateUniqueUsername } from '../services/oauthService';

// ── Validation Schemas ────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name cannot exceed 100 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Controllers ───────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Creates a new User + Profile in a single transaction.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, username, displayName } = registerSchema.parse(req.body);

    // Hash password with cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profiles: {
          create: [
            {
              username,
              displayName,
              isDefault: true,
            },
          ],
        },
      },
      include: {
        profiles: true,
      },
    });

    const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      profileId: primaryProfile.id,
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          createdAt: user.createdAt,
          authProvider: user.authProvider,
          profile: primaryProfile,
          profiles: user.profiles,
        },
      },
      'Account created successfully.',
      201,
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Verifies credentials and returns JWT tokens.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profiles: true },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.passwordHash) {
      throw new AppError('This account was created with Google or Apple Sign-In. Please use the social login buttons below.', 401);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      profileId: primaryProfile?.id ?? '',
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
        authProvider: user.authProvider,
        profile: primaryProfile ?? null,
        profiles: user.profiles,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Issues a new access token using a valid refresh token.
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      throw new AppError('Refresh token is required.', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profiles: { select: { id: true, isDefault: true } } },
    });

    if (!user || user.profiles.length === 0) {
      throw new AppError('User not found.', 404);
    }

    const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      profileId: primaryProfile.id,
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    });

    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's account and profile info.
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        authProvider: true,
        profiles: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            phone: true,
            email: true,
            company: true,
            jobTitle: true,
            website: true,
            profilePicture: true,
            companyLogo: true,
            status: true,
            tapCount: true,
            isDefault: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0] ?? null;

    sendSuccess(res, {
      ...user,
      profile: primaryProfile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/google
 * Verifies Google ID Token and logs user in (or creates account).
 */
export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { idToken } = z.object({ idToken: z.string().min(1, 'idToken is required') }).parse(req.body);

    const info = await verifyGoogleToken(idToken);

    // 1. Check if user exists by googleId OR email (account linking)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: info.googleId },
          { email: info.email },
        ],
      },
      include: {
        profiles: true,
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: info.googleId,
            authProvider: user.authProvider === 'EMAIL' ? 'EMAIL_GOOGLE' : user.authProvider,
          },
          include: { profiles: true },
        });
      }

      const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];
      if (primaryProfile && !primaryProfile.profilePicture && info.profilePicture) {
        await prisma.profile.update({
          where: { id: primaryProfile.id },
          data: { profilePicture: info.profilePicture },
        });
        primaryProfile.profilePicture = info.profilePicture;
      }
    } else {
      const username = await generateUniqueUsername(info.email, info.displayName);
      user = await prisma.user.create({
        data: {
          email: info.email,
          googleId: info.googleId,
          authProvider: 'GOOGLE',
          profiles: {
            create: [
              {
                username,
                displayName: info.displayName,
                profilePicture: info.profilePicture || null,
                isDefault: true,
              },
            ],
          },
        },
        include: { profiles: true },
      });
    }

    const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      profileId: primaryProfile?.id ?? '',
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
        authProvider: user.authProvider,
        profile: primaryProfile ?? null,
        profiles: user.profiles,
      },
    }, 'Signed in with Google successfully.', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/apple
 * Verifies Apple Identity Token and logs user in (or creates account).
 */
export async function appleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { identityToken, user: rawUser } = z.object({
      identityToken: z.string().min(1, 'identityToken is required'),
      user: z.any().optional(),
    }).parse(req.body);

    const info = await verifyAppleToken(identityToken, rawUser);

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId: info.appleId },
          { email: info.email },
        ],
      },
      include: {
        profiles: true,
      },
    });

    if (user) {
      if (!user.appleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            appleId: info.appleId,
            authProvider: user.authProvider === 'EMAIL' ? 'EMAIL_APPLE' : user.authProvider,
          },
          include: { profiles: true },
        });
      }
    } else {
      const username = await generateUniqueUsername(info.email, info.displayName);
      user = await prisma.user.create({
        data: {
          email: info.email,
          appleId: info.appleId,
          authProvider: 'APPLE',
          profiles: {
            create: [
              {
                username,
                displayName: info.displayName,
                isDefault: true,
              },
            ],
          },
        },
        include: { profiles: true },
      });
    }

    const primaryProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      profileId: primaryProfile?.id ?? '',
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
        authProvider: user.authProvider,
        profile: primaryProfile ?? null,
        profiles: user.profiles,
      },
    }, 'Signed in with Apple successfully.', 200);
  } catch (error) {
    next(error);
  }
}

