import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@ApiTags('Library & Citations')
@Controller('api')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('library')
  @ApiOperation({ summary: 'Get all saved bookmarks in personal library' })
  @ApiResponse({ status: 200, description: 'List of bookmarks retrieved.' })
  async getLibrary() {
    return this.libraryService.getLibrary();
  }

  @Post('library')
  @ApiOperation({ summary: 'Save paper to personal library' })
  @ApiResponse({ status: 201, description: 'Paper successfully bookmarked.' })
  async addBookmark(@Body() dto: CreateBookmarkDto) {
    return this.libraryService.addBookmark(dto);
  }

  @Delete('library/:paperId')
  @ApiOperation({ summary: 'Remove paper from personal library' })
  @ApiResponse({ status: 200, description: 'Bookmark removed.' })
  async removeBookmark(@Param('paperId') paperId: string) {
    return this.libraryService.removeBookmark(paperId);
  }

  @Get('papers/:id/cite')
  @ApiOperation({ summary: 'Generate BibTeX and APA citations for a paper' })
  @ApiResponse({ status: 200, description: 'Formatted citation strings.' })
  async getCitation(@Param('id') id: string) {
    return this.libraryService.getCitation(id);
  }

  @Get('library/export')
  @ApiOperation({ summary: 'Export all saved papers as a .bib BibTeX file' })
  @ApiResponse({ status: 200, description: 'BibTeX file content string.' })
  async exportBib() {
    return { bibtex: await this.libraryService.exportBibtex() };
  }
}
