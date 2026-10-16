import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Full-text query string (searches title and abstract)' })
  @IsNotEmpty()
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: 'Filter by specific subject category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Sort order: relevance or date',
    enum: ['relevance', 'date'],
    default: 'relevance',
  })
  @IsOptional()
  @IsString()
  sort?: 'relevance' | 'date' = 'relevance';
}
