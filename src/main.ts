import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

/**
 * Bootstrap function to start the NestJS application
 * Configures CORS, validation pipes, and starts the server
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get environment variables
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Enable CORS for frontend communication
  const corsOrigins = isProduction 
    ? [frontendUrl, frontendUrl.replace('http://', 'https://')]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.use(cors({
    origin: corsOrigins,
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

  // Start the server
  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for deployment
  
  console.log(`🚀 Video Downloader Backend is running on: http://localhost:${port}/api`);
  console.log(`📊 Health check available at: http://localhost:${port}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: ${corsOrigins.join(', ')}`);
}

bootstrap();