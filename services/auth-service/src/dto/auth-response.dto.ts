import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user_123' },
      email: { type: 'string', example: 'user@example.com' },
      name: { type: 'string', example: 'John Doe' },
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
      emailVerified: { type: 'boolean', example: true },
    },
  })
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    emailVerified: boolean;
  };
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  verified: boolean;
}

export class OAuthCallbackDto {
  @ApiProperty({
    description: 'OAuth authorization code',
    example: 'auth_code_here',
  })
  code: string;

  @ApiProperty({
    description: 'OAuth state parameter',
    example: 'random_state_string',
  })
  state?: string;
}
