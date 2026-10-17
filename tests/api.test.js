const assert = require('assert');
const { fetchPapers, searchPapers } = require('../src/services/arxivService');
const { generateCitation } = require('../src/services/bibtexService');

async function runTests() {
  console.log('🧪 Running Express Backend Unit Tests...\n');

  // Test 1: Citation generation
  console.log('1. Testing BibTeX & APA Citation Generation...');
  const citation = await generateCitation('2401.12345');
  assert.strictEqual(citation.status, 'success', 'Citation status should be success');
  assert(citation.bibtex.includes('@misc'), 'BibTeX must contain @misc');
  assert(citation.apa.length > 0, 'APA citation must not be empty');
  console.log('   ✅ Citation Service passed!\n');

  // Test 2: Category Paper Fetching
  console.log('2. Testing Category Fetching (cs.AI)...');
  const feed = await fetchPapers({ category: 'cs.AI', page: 0, limit: 2 });
  assert(feed.data && feed.data.length > 0, 'Feed should return papers');
  assert(feed.data[0].id, 'Paper should have an id');
  assert(feed.data[0].title, 'Paper should have a title');
  console.log('   ✅ Papers Feed passed!\n');

  // Test 3: Search
  console.log('3. Testing Search Query (transformer)...');
  const searchResult = await searchPapers({ query: 'transformer', limit: 2 });
  assert(searchResult.data, 'Search should return data array');
  console.log('   ✅ Search Service passed!\n');

  console.log('🎉 All Express Backend tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
