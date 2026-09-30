import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
