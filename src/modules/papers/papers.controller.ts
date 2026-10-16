import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PapersService } from './papers.service';
import { GetPapersDto } from './dto/get-papers.dto';
import { Paper, PaginatedPapersResponse } from './paper.interface';

@ApiTags('Papers')
@Controller('api/papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of arXiv papers with pagination and category filter' })
  @ApiResponse({ status: 200, description: 'Paginated list of papers retrieved successfully.' })
  async getPapers(@Query() query: GetPapersDto): Promise<PaginatedPapersResponse> {
    return this.papersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single paper details by arXiv identifier' })
  @ApiResponse({ status: 200, description: 'Paper details retrieved.' })
  @ApiResponse({ status: 404, description: 'Paper not found.' })
  async getPaperById(@Param('id') id: string): Promise<Paper> {
    return this.papersService.findOne(id);
  }
}
