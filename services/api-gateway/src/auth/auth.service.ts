import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(profile: any): Promise<any> {
    // Here you would typically validate the user against your database
    // For now, we'll just return the profile
    return {
      id: profile.id,
      email: profile.email,
      name: profile.displayName || profile.name,
      provider: profile.provider,
    };
  }

  async handleOAuthSuccess(user: any, res: any) {
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    
    // Redirect to frontend with token
    const frontendUrl = this.configService.frontendUrl;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
