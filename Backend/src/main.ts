import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Production security checks
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'supersecretjwtkey_change_in_production' || jwtSecret.length < 32) {
      throw new Error(
        'CRITICAL SECURITY ERROR: Insecure or default JWT_SECRET configured in production. ' +
        'Please supply a cryptographically strong secret of at least 32 characters in .env.',
      );
    }
  }

  // Restrict CORS origins (support custom frontend domains via CORS_ORIGIN or default to local dev)
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow non-browser requests (supertest, mobile apps, curl, webhooks)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
  });

  // All routes are prefixed with /api (e.g. /api/auth/login, /api/wallet)
  app.setGlobalPrefix('api', {
    exclude: [], // Add paths to exclude if needed
  });
  
  // Enable global validation for our DTOs (e.g. @IsEmail, @IsNotEmpty)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Set up Swagger UI
  const config = new DocumentBuilder()
    .setTitle('VEDORA API')
    .setDescription('The Vedora Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth() // Gives us the 'Authorize' button for JWTs
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
