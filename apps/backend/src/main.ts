import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  // Validazione globale con trasformazione automatica dei tipi
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // rimuove campi non definiti nei DTO
      transform: true, // trasforma i payload nei tipi definiti nei DTO
      transformOptions: {
        enableImplicitConversion: true, // converte tipi primitivi automaticamente
      },
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(
    `📦 Environment: ${configService.get<string>('NODE_ENV', 'development')}`,
  );
}
bootstrap();
