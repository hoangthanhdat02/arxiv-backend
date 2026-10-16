import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({ description: 'arXiv paper ID to bookmark', example: '2401.00001' })
  @IsNotEmpty()
  @IsString()
  paperId: string;

  @ApiPropertyOptional({ description: 'Personal note for this paper', example: 'Key paper for section 2' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Tags associated with this bookmark', example: ['AI', 'Transformers'] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
