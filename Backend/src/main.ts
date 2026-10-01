import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend development
  app.enableCors();

  // All routes are prefixed with /api (e.g. /api/auth/login, /api/wallet)
  app.setGlobalPrefix('api', {
    exclude: [], // Add paths to exclude if needed
  });
  
  // Enable global validation for our DTOs (e.g. @IsEmail, @IsNotEmpty)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

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
bootstrap();
