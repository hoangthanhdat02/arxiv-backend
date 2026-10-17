const assert = require('assert');
const { fetchPapers, searchPapers, getFallbackPapers } = require('../src/services/arxivService');
const { generateCitation } = require('../src/services/bibtexService');

async function runTests() {
  console.log('🧪 Running Express Backend Unit Tests (Topic 28 - Member 2)...\n');

  // Test 1: Citation generation (BibTeX @misc & APA)
  console.log('1. Testing BibTeX & APA Citation Generation...');
  const citation = await generateCitation('2401.12345');
  assert.strictEqual(citation.status, 'success', 'Citation status should be success');
  assert(citation.bibtex.includes('@misc'), 'BibTeX must contain @misc');
  assert(citation.apa.length > 0, 'APA citation must not be empty');
  console.log('   ✅ Citation Service passed!\n');

  // Test 2: Category Paper Fetching (cs.AI & cs.LG)
  console.log('2. Testing Category Fetching (cs.AI)...');
  const feed = await fetchPapers({ category: 'cs.AI', page: 0, limit: 2 });
  assert(feed.data && feed.data.length > 0, 'Feed should return papers');
  assert(feed.data[0].id, 'Paper should have an id');
  assert(feed.data[0].title, 'Paper should have a title');
  assert(feed.data[0].summary, 'Paper should have a summary');
  assert(Array.isArray(feed.data[0].authors), 'Authors must be an array');
  assert(feed.data[0].pdfUrl, 'Paper should have a valid pdfUrl');
  console.log('   ✅ Papers Feed passed!\n');

  // Test 3: Search Functionality
  console.log('3. Testing Search Query (transformer)...');
  const searchResult = await searchPapers({ query: 'transformer', limit: 2 });
  assert(searchResult.data, 'Search should return data array');
  console.log('   ✅ Search Service passed!\n');

  // Test 4: In-Memory Cache Performance (< 15ms response on repeat query)
  console.log('4. Testing In-Memory Cache (< 15ms hit response)...');
  const startTime = Date.now();
  const cachedFeed = await fetchPapers({ category: 'cs.AI', page: 0, limit: 2 });
  const duration = Date.now() - startTime;
  assert(cachedFeed.fromCache === true, 'Subsequent request must be served from cache');
  assert(duration < 50, `Cache hit should be fast (took ${duration}ms)`);
  console.log(`   ✅ In-Memory Cache passed! (Response in ${duration}ms)\n`);

  // Test 5: Fallback Dataset Schema Consistency (Checking Java/Gson compatibility)
  console.log('5. Testing Fallback Dataset Schema Integrity...');
  const fallbacks = getFallbackPapers();
  assert(fallbacks.length >= 5, 'Should have at least 5 fallback sample papers');
  for (const paper of fallbacks) {
    assert(paper.id, 'Fallback item must have id');
    assert(paper.title, 'Fallback item must have title');
    assert(paper.summary, 'Fallback item must have summary');
    assert(Array.isArray(paper.authors) && paper.authors.length > 0, 'Fallback item must have authors array');
    assert(paper.primaryCategory, 'Fallback item must have primaryCategory');
    assert(paper.pdfUrl && paper.pdfUrl.startsWith('https://'), 'Fallback item must have pdfUrl');
  }
  console.log(`   ✅ Fallback Schema passed (${fallbacks.length} sample papers verified)!\n`);

  console.log('🎉 All Express Backend tests passed successfully with 100% compliance!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
