import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search arXiv papers by text, author, and category' })
  @ApiResponse({ status: 200, description: 'Matched search results.' })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
