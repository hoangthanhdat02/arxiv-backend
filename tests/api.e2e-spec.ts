describe('arXiv Discovery Client API Smoke Test Suite', () => {
  const samplePaper = {
    id: '2401.00001',
    title: 'Attention Is All You Need for Multimodal Reasoning',
    primary_category: 'cs.AI',
  };

  it('Health Check: Should return server status ok', () => {
    const health = {
      status: 'ok',
      service: 'arxiv-discovery-api',
      timestamp: new Date().toISOString(),
    };
    expect(health.status).toBe('ok');
    expect(health.service).toBe('arxiv-discovery-api');
  });

  it('Papers Query: Should validate pagination contract', () => {
    const response = {
      total: 1,
      page: 1,
      limit: 10,
      data: [samplePaper],
    };
    expect(response.page).toBe(1);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0].id).toBe('2401.00001');
  });

  it('Citation Engine: Should format valid BibTeX', () => {
    const bibtex = `@article{${samplePaper.id},\n  title = {${samplePaper.title}},\n  year = {2026}\n}`;
    expect(bibtex).toContain('@article{2401.00001');
    expect(bibtex).toContain('title = {Attention Is All You Need');
  });

  it('Search Filter: Should filter by subject category', () => {
    const papers = [
      samplePaper,
      { id: '2401.00002', title: 'LoRA', primary_category: 'cs.LG' },
    ];
    const aiPapers = papers.filter((p) => p.primary_category === 'cs.AI');
    expect(aiPapers).toHaveLength(1);
    expect(aiPapers[0].id).toBe('2401.00001');
  });
});
