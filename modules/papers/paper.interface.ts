export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published_date: string;
  updated_date?: string;
  primary_category: string;
  categories: string[];
  pdf_url: string;
  doi?: string;
}

export interface PaginatedPapersResponse {
  total: number;
  page: number;
  limit: number;
  data: Paper[];
}
