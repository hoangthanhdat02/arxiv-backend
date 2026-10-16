import { Injectable, NotFoundException } from '@nestjs/common';
import { PapersService } from '../papers/papers.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { Paper } from '../papers/paper.interface';

export interface BookmarkRecord {
  id: string;
  paperId: string;
  paper: Paper;
  note: string;
  tags: string[];
  savedAt: string;
}

@Injectable()
export class LibraryService {
  private bookmarks: Map<string, BookmarkRecord> = new Map();

  constructor(private readonly papersService: PapersService) {}

  async getLibrary(): Promise<BookmarkRecord[]> {
    return Array.from(this.bookmarks.values());
  }

  async addBookmark(dto: CreateBookmarkDto): Promise<BookmarkRecord> {
    const paper = await this.papersService.findOne(dto.paperId);
    const existing = this.bookmarks.get(dto.paperId);

    const record: BookmarkRecord = {
      id: existing ? existing.id : `bm_${Date.now()}`,
      paperId: dto.paperId,
      paper,
      note: dto.note ?? existing?.note ?? '',
      tags: dto.tags ?? existing?.tags ?? [],
      savedAt: new Date().toISOString(),
    };

    this.bookmarks.set(dto.paperId, record);
    return record;
  }

  async removeBookmark(paperId: string): Promise<{ success: boolean; paperId: string }> {
    if (!this.bookmarks.has(paperId)) {
      throw new NotFoundException(`Bookmark for paper "${paperId}" not found.`);
    }
    this.bookmarks.delete(paperId);
    return { success: true, paperId };
  }

  async getCitation(paperId: string): Promise<{ bibtex: string; apa: string }> {
    const paper = await this.papersService.findOne(paperId);
    const year = new Date(paper.published_date).getFullYear();
    const firstAuthor = paper.authors[0] || 'Unknown Author';
    const authorsFormatted = paper.authors.join(' and ');

    const bibtex = `@article{${paper.id},
  title = {${paper.title}},
  author = {${authorsFormatted}},
  journal = {arXiv preprint arXiv:${paper.id}},
  year = {${year}},
  url = {${paper.pdf_url}}
}`;

    const apa = `${firstAuthor} et al. (${year}). ${paper.title}. arXiv preprint arXiv:${paper.id}.`;

    return { bibtex, apa };
  }

  async exportBibtex(): Promise<string> {
    const list = await this.getLibrary();
    if (list.length === 0) {
      return '% Empty library';
    }

    const citations = await Promise.all(
      list.map(async (item) => (await this.getCitation(item.paperId)).bibtex),
    );

    return citations.join('\n\n');
  }
}
