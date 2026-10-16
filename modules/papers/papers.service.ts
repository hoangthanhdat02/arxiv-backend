import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Paper, PaginatedPapersResponse } from './paper.interface';
import { GetPapersDto } from './dto/get-papers.dto';

@Injectable()
export class PapersService {
  private papers: Paper[] = [];

  constructor() {
    this.loadSampleData();
  }

  private loadSampleData(): void {
    try {
      const dataPath = path.resolve(__dirname, '../../../../data/sample_papers.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf-8');
        this.papers = JSON.parse(raw);
      }
    } catch (error) {
      console.warn('[PapersService] Could not load sample_papers.json, initializing empty.');
      this.papers = [];
    }
  }

  async findAll(query: GetPapersDto): Promise<PaginatedPapersResponse> {
    const { category, page = 1, limit = 10 } = query;

    let filtered = this.papers;
    if (category && category !== 'ALL') {
      filtered = filtered.filter(
        (p) =>
          p.primary_category === category ||
          (p.categories && p.categories.includes(category)),
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      total: filtered.length,
      page,
      limit,
      data: paginated,
    };
  }

  async findOne(id: string): Promise<Paper> {
    const paper = this.papers.find((p) => p.id === id);
    if (!paper) {
      throw new NotFoundException(`Paper with ID "${id}" was not found.`);
    }
    return paper;
  }
}
