import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

// Простая реализация EmailService
class EmailService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || 're_demo_key';
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      // Для демонстрации - просто логируем код
      console.log(`📧 Verification code for ${email}: ${code}`);
      console.log(`📧 In production, this would be sent via Resend API`);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

const emailService = new EmailService();
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Простая база данных пользователей для демонстрации
const users = new Map<string, { email: string; password: string; name: string; createdAt: string }>();

// Добавим тестового пользователя
users.set('test@example.com', {
  email: 'test@example.com',
  password: 'Test123!@',
  name: 'Test User',
  createdAt: new Date().toISOString()
});

users.set('admin@example.com', {
  email: 'admin@example.com',
  password: 'Admin123!@',
  name: 'Admin User',
  createdAt: new Date().toISOString()
});

async function bootstrap() {
  const server = express();

  // Middleware для JSON
  server.use(express.json());

  // Simple CORS
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health check
  server.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Отправка кода верификации
  server.post('/api/auth/send-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const code = emailService.generateVerificationCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 минут

    verificationCodes.set(email, { code, expires });

    const sent = await emailService.sendVerificationCode(email, code);

    if (sent) {
      res.json({ message: 'Verification code sent', expiresAt: new Date(expires) });
    } else {
      res.status(500).json({ message: 'Failed to send verification code' });
    }
  });

  // Проверка кода верификации
  server.post('/api/auth/verify-code', (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code required' });
    }

    const stored = verificationCodes.get(email);

    if (!stored) {
      return res.status(400).json({ message: 'Verification code not found or expired' });
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Код верный - удаляем его
    verificationCodes.delete(email);

    res.json({ message: 'Email verified successfully' });
  });

  // Auth endpoints с email верификацией
  server.post('/api/auth/signin', (req, res) => {
    const { email, password, name, mode } = req.body;

    // Проверяем пользователя для sign in
    const user = users.get(email);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Пользователь найден и пароль верный
    console.log(`✅ User signed in: ${email}`);

    res.json({
      token: 'demo-jwt-token-' + Date.now(),
      user: {
        email: user.email,
        name: user.name
      }
    });
  });

  server.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, verificationCode } = req.body;

    // Проверяем верификационный код
    const stored = verificationCodes.get(email);
    if (!stored || Date.now() > stored.expires || stored.code !== verificationCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Удаляем код после использования
    verificationCodes.delete(email);

    // Проверяем что пользователя еще нет
    if (users.has(email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Добавляем нового пользователя
    const newUser = {
      email,
      password,
      name,
      createdAt: new Date().toISOString()
    };

    users.set(email, newUser);

    console.log(`✅ New user registered: ${email}`);

    res.json({
      token: 'demo-jwt-token-' + Date.now(),
      user: {
        email,
        name
      }
    });
  });

  // OAuth endpoints
  server.get('/auth/google', (req, res) => {
    res.redirect('https://accounts.google.com/oauth/authorize?' +
      'client_id=your-google-client-id&' +
      'redirect_uri=http://localhost:3001/auth/google/callback&' +
      'response_type=code&' +
      'scope=email profile&' +
      'access_type=offline'
    );
  });

  server.get('/auth/github', (req, res) => {
    res.redirect('https://github.com/login/oauth/authorize?' +
      'client_id=your-github-client-id&' +
      'redirect_uri=http://localhost:3001/auth/github/callback&' +
      'scope=user:email'
    );
  });

  // Simple API routes
  server.get('/api/workflows', (req, res) => {
    res.json([]);
  });

  server.post('/api/workflows', (req, res) => {
    res.json({ id: '1', name: 'New workflow', triggerType: 'webhook', isActive: false, createdAt: new Date().toISOString() });
  });

  server.get('/api/executions', (req, res) => {
    res.json([]);
  });

  // Catch all
  server.use('*', (req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  const port = parseInt(process.env.PORT || '3000');
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Simple API Gateway listening on port ${port}`);
    console.log(`📧 Email verification enabled (demo mode)`);
  });
}

bootstrap();
