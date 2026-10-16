import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS) for Next.js frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global boundary contract validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // OpenAPI / Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('arXiv Paper Discovery API')
    .setDescription(
      'Enterprise NestJS REST API for searching, exploring, and citing arXiv scientific papers.',
    )
    .setVersion('1.0.0')
    .addTag('Papers', 'Retrieve arXiv paper feeds and metadata')
    .addTag('Search', 'Full-text search and multi-category filtering')
    .addTag('Library & Citations', 'Personal library bookmarks and BibTeX/APA export')
    .addTag('Health', 'Server liveness probe')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`[NestJS Server] Running on: http://localhost:${port}`);
  console.log(`[Swagger Docs] Available on: http://localhost:${port}/api/docs`);
}

bootstrap();
