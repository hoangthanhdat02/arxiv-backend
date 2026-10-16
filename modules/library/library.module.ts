import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { PapersModule } from '../papers/papers.module';

@Module({
  imports: [PapersModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
