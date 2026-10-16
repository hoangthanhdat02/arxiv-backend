import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPapersDto {
  @ApiPropertyOptional({
    description: 'arXiv subject category (e.g. cs.AI, cs.LG, cs.CV)',
    default: 'cs.AI',
  })
  @IsOptional()
  @IsString()
  category?: string = 'cs.AI';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
