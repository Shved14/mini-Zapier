import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
} from '../dto/register.dto';
import {
  AuthResponseDto,
  VerifyEmailResponseDto,
  OAuthCallbackDto,
} from '../dto/auth-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @Throttle(5, 60) // 5 requests per minute
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @Throttle(10, 60) // 10 requests per minute
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @Throttle(20, 60) // 20 requests per minute
  @UsePipes(new ValidationPipe({ transform: true }))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  @Throttle(10, 60) // 10 requests per minute
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Req() req: Request) {
    const user = req['user'];
    return this.authService.validateUser(user.sub);
  }

  // OAuth endpoints
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth',
  })
  @Throttle(5, 60) // 5 requests per minute
  async googleAuth(@Req() req: Request) {
    // This will be handled by Passport
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with tokens',
  })
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: OAuthCallbackDto,
  ) {
    // This will be handled by Passport strategy
    // After successful OAuth, redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';
    res.redirect(`${frontendUrl}/auth/callback?provider=google&code=${query.code}`);
  }

  @Get('github')
  @ApiOperation({ summary: 'Initiate GitHub OAuth' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to GitHub OAuth',
  })
  @Throttle(5, 60) // 5 requests per minute
  async githubAuth(@Req() req: Request) {
    // This will be handled by Passport
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with tokens',
  })
  async githubAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: OAuthCallbackDto,
  ) {
    // This will be handled by Passport strategy
    // After successful OAuth, redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';
    res.redirect(`${frontendUrl}/auth/callback?provider=github&code=${query.code}`);
  }

  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async verifyToken(@Req() req: Request) {
    return { valid: true, user: req['user'] };
  }
}
