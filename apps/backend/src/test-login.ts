// apps/backend/src/test-login.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    console.log('🔐 Test login admin...');

    const result = await authService.login({
      email: 'admin@studio.it',
      password: 'admin123',
    });

    console.log('✅ Login successful!');
    console.log('Token:', result.access_token.substring(0, 20) + '...');
    console.log('User:', result.user);
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();
