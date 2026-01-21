import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

/**
 * Bootstrap function to start the NestJS application
 * Configures CORS, validation pipes, and starts the server on port 3001
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Next.js frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // Enable global validation pipe for request validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transform: true, // Transform payloads to DTO instances
  }));

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Start the server on port 3002 (temporary change to avoid conflict)
  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  console.log(`🚀 Video Downloader Backend is running on: http://localhost:${port}/api`);
}

bootstrap();