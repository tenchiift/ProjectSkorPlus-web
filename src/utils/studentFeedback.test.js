import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFeedbackReport } from './studentFeedback.js';
import { attachUsersToReviews, studentReviews } from '../data/studentDemoReviews.js';

const answers = { rating: 4, ease: 3, useful: 'Past Papers', improvement: 'Explanations', comment: '  More worked examples please.  ' };

test('feedback reaches the private report pipeline with all survey answers', () => {
  const report = buildFeedbackReport(answers);
  assert.equal(report.category, 'other');
  assert.equal(report.severity, 'low');
  assert.match(report.title, /Student feedback/);
  assert.match(report.details, /Overall experience: 4\/5/);
  assert.match(report.details, /Ease of use: 3\/5/);
  assert.match(report.details, /Most useful: Past Papers/);
  assert.match(report.details, /Improve first: Explanations/);
  assert.ok(report.details.endsWith('More worked examples please.'));
});

test('incomplete or invalid answers cannot be submitted', () => {
  for (const invalid of [{ rating: 0 }, { rating: 6 }, { ease: 2.5 }, { useful: '' }, { improvement: 'invalid' }, { comment: 'x'.repeat(2001) }]) {
    assert.throws(() => buildFeedbackReport({ ...answers, ...invalid }));
  }
});

test('comments are optional and no identity or game data is included', () => {
  const report = buildFeedbackReport({ ...answers, comment: '' });
  assert.match(report.details, /No additional comment/);
  assert.equal(report.user_id, undefined);
  assert.doesNotMatch(report.details, /CalcQuest/);
});

test('student reviews attach real database user profiles and never display demo labels', () => {
  const dbProfiles = [
    { id: 'u1', name: 'Load Test 01', username: 'loadtest01', role: 'student' },
    { id: 'u2', name: 'Amirah Sofea', username: 'amirahsofea', class_code: 'DCS 4A', photo_url: 'https://example.com/a.png' },
    { id: 'u3', name: 'Faris Irfan', username: 'farisirfan', semester: 'Semester 3' },
  ];
  const mapped = attachUsersToReviews(studentReviews, dbProfiles);
  assert.equal(mapped.length, 20);
  assert.equal(mapped[0].name, 'Amirah Sofea');
  assert.equal(mapped[0].username, '@amirahsofea');
  assert.equal(mapped[0].meta, 'DCS 4A');
  assert.equal(mapped[1].name, 'Faris Irfan');
  assert.equal(mapped[1].username, '@farisirfan');
  assert.equal(mapped[1].meta, 'Semester 3');
  for (const r of mapped) {
    assert.doesNotMatch(r.name, /demo/i);
    assert.doesNotMatch(r.message, /demo/i);
  }
});
