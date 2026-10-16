import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PapersModule } from '../papers/papers.module';

@Module({
  imports: [PapersModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
