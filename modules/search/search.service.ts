import { Injectable } from '@nestjs/common';
import { PapersService } from '../papers/papers.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Paper } from '../papers/paper.interface';

@Injectable()
export class SearchService {
  constructor(private readonly papersService: PapersService) {}

  async search(dto: SearchQueryDto): Promise<{ total: number; query: string; data: Paper[] }> {
    const all = await this.papersService.findAll({ limit: 1000 });
    const queryLower = dto.q.toLowerCase().trim();

    let matched = all.data.filter((paper) => {
      const matchTitle = paper.title.toLowerCase().includes(queryLower);
      const matchAbstract = paper.abstract.toLowerCase().includes(queryLower);
      const matchAuthor = paper.authors.some((a) => a.toLowerCase().includes(queryLower));
      return matchTitle || matchAbstract || matchAuthor;
    });

    if (dto.category && dto.category !== 'ALL') {
      matched = matched.filter((p) => p.primary_category === dto.category);
    }

    if (dto.sort === 'date') {
      matched.sort(
        (a, b) =>
          new Date(b.published_date).getTime() - new Date(a.published_date).getTime(),
      );
    }

    return {
      total: matched.length,
      query: dto.q,
      data: matched,
    };
  }
}
