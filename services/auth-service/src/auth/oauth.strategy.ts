import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../config/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, emails, name, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new Error('Email is required from Google OAuth');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name: `${name?.givenName} ${name?.familyName}`,
          avatar: photos?.[0]?.value,
          emailVerified: true, // OAuth users are considered verified
          emailVerifiedAt: new Date(),
        },
      });
    }

    // Find or create OAuth account
    const existingOAuthAccount = user.oauthAccounts.find(
      account => account.provider === 'google' && account.providerId === id,
    );

    if (!existingOAuthAccount) {
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerId: id,
          accessToken,
          refreshToken,
        },
      });
    } else {
      // Update tokens
      await this.prisma.oAuthAccount.update({
        where: { id: existingOAuthAccount.id },
        data: {
          accessToken,
          refreshToken,
        },
      });
    }

    return user;
  }
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:3001/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, emails, username, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new Error('Email is required from GitHub OAuth');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name: username,
          avatar: photos?.[0]?.value,
          emailVerified: true, // OAuth users are considered verified
          emailVerifiedAt: new Date(),
        },
      });
    }

    // Find or create OAuth account
    const existingOAuthAccount = user.oauthAccounts.find(
      account => account.provider === 'github' && account.providerId === id,
    );

    if (!existingOAuthAccount) {
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'github',
          providerId: id,
          accessToken,
          refreshToken,
        },
      });
    } else {
      // Update tokens
      await this.prisma.oAuthAccount.update({
        where: { id: existingOAuthAccount.id },
        data: {
          accessToken,
          refreshToken,
        },
      });
    }

    return user;
  }
}
