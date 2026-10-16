import { Module } from '@nestjs/common';
import { PapersModule } from './modules/papers/papers.module';
import { SearchModule } from './modules/search/search.module';
import { LibraryModule } from './modules/library/library.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    HealthModule,
    PapersModule,
    SearchModule,
    LibraryModule,
  ],
})
export class AppModule {}
