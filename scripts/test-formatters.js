const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require(path.join(__dirname, '..', 'backend', 'node_modules', 'typescript'));

// Transpile formatters.ts on the fly
const tsCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'utils', 'formatters.ts'), 'utf8');
const jsCode = ts.transpileModule(tsCode, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

const mod = { exports: {} };
const fn = new Function('module', 'exports', 'require', jsCode);
fn(mod, mod.exports, require);

const {
  formatEnquirySource,
  formatCanadianDate,
  formatCanadianDateTime,
  formatEnquiryReceivedHeader,
  formatNoteAuthor,
  formatNoteContent,
  formatServiceParamLabel,
  formatServiceParamValue,
} = mod.exports;

async function testFormatters() {
  console.log('--- TESTING LAURREL FORMATTERS ---');

  // Test source formatting
  assert.strictEqual(formatEnquirySource('web_services_sidebar'), 'Services Page Enquiry');
  assert.strictEqual(formatEnquirySource('web_contact_page'), 'Contact Page');
  assert.strictEqual(formatEnquirySource('web_contact'), 'Contact Page');
  assert.strictEqual(formatEnquirySource('web_quote_modal'), 'Quote Request');
  assert.strictEqual(formatEnquirySource('quote_modal'), 'Quote Request');
  assert.strictEqual(formatEnquirySource('web_direct'), 'Website Enquiry');
  assert.strictEqual(formatEnquirySource('ai_assistant'), 'Website Chat');
  console.log('✅ PASS: Enquiry source formatting verified.');

  // Test Canadian date formatting
  const testDate = new Date('2026-10-22T14:30:00Z');
  const dateFormatted = formatCanadianDate(testDate);
  assert(dateFormatted.includes('Oct 2026') || dateFormatted.includes('22'));
  console.log(`✅ PASS: formatCanadianDate produced: "${dateFormatted}"`);

  // Test Received Header specification
  const header = formatEnquiryReceivedHeader(testDate, 'web_services_sidebar');
  assert.strictEqual(header, `Received ${dateFormatted} · Services Page Enquiry`);
  console.log(`✅ PASS: formatEnquiryReceivedHeader produced exact target: "${header}"`);

  // Test Note Author transformation
  assert.strictEqual(formatNoteAuthor('system'), 'Website');
  assert.strictEqual(formatNoteAuthor('automated'), 'Website');
  assert.strictEqual(formatNoteAuthor('John Dispatcher'), 'John Dispatcher');
  console.log('✅ PASS: formatNoteAuthor transformed "system" to "Website" and preserved staff names.');

  // Test Note Content transformation
  const rawNote = 'Enquiry created via web_services_sidebar';
  const transformedNote = formatNoteContent(rawNote);
  assert.strictEqual(transformedNote, 'Enquiry received through the Services page');
  console.log(`✅ PASS: formatNoteContent transformed: "${rawNote}" → "${transformedNote}"`);

  // Test Service Param Labels
  assert.strictEqual(formatServiceParamLabel('propertyType'), 'Property Type');
  assert.strictEqual(formatServiceParamLabel('movingFrom'), 'Origin Address');
  assert.strictEqual(formatServiceParamLabel('storageDuration'), 'Estimated Storage Duration');
  assert.strictEqual(formatServiceParamValue(1800), '1800');
  assert.strictEqual(formatServiceParamValue(true), 'Yes');
  console.log('✅ PASS: Service parameters formatted human-readably.');

  console.log('\n🎉 ALL FORMATTER UNIT TESTS PASSED (100%)\n');
}

testFormatters().catch((err) => {
  console.error('Formatter test failed:', err);
  process.exit(1);
});
