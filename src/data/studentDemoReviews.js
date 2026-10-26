export const studentReviews = [
  'The past papers folder saves me so much time before tests — I don’t have to scroll through WhatsApp groups anymore just to find last sem’s questions.',
  'Honestly love the exam countdown on the dashboard. Seeing the exact days left keeps me from procrastinating until study week.',
  'Could we get more worked step-by-step solutions for integration by parts? Sometimes I get stuck halfway and don’t know which u and dv to pick.',
  'Sending my tutorial work directly through the app is way cleaner than emailing PDFs, and I can see right away when my lecturer has reviewed it.',
  'The AI Study Buddy is super clutch late at night when I’m revising derivatives and need someone to explain why my chain rule step went wrong.',
  'I’ve been using the Tasks list to break down my calculus revision by topic. Ticking them off one by one actually makes studying feel manageable.',
  'Scan Solve helped me figure out a tricky limits question yesterday, though sometimes my phone camera takes a second to focus on my handwriting.',
  'Switching to the forest theme made reading notes at night way easier on my eyes.',
  'Having all my lecturer’s modules and past year papers in one place is honestly the best part of SKOR+. Everything is right there when I open the app.',
  'The daily streak and EXP counter lowkey keep me logging in every day even if it’s just to review one topic between lectures.',
  'Would be nice if the equation text in some of the practice questions was a little bigger on mobile screens.',
  'I like how the semester pulse bar shows which week we’re in — makes it much easier to pace my revision before Week 12.',
  'My friends and I compare our EXP on the leaderboard every week, which makes doing extra practice questions way more fun.',
  'When my campus Wi-Fi is slow, the PDF viewer takes a bit to load the past papers, but once it’s open it works great.',
  'Really helpful for short 15-minute study sessions while waiting for my next class to start.',
  'I wish there was a quick bookmark button so I could jump straight back to the exact topic I was reading yesterday.',
  'Getting a notification the moment my lecturer checks my submission is great — I can fix my mistakes while the topic is still fresh.',
  'The explanations in the modules are much easier to follow than my textbook, especially for differentiation rules.',
  'Setting up my class code and picking my lecturers took less than a minute, and all my subjects showed up right away.',
  'Overall a really solid study companion for the semester. It keeps my tasks, notes, and past papers organised without feeling cluttered.',
];

const FALLBACK_PROFILES = [
  { name: 'Aiman Hakimi', username: 'aimanhakimi', class_code: 'DCS 4B' },
  { name: 'Nurul Izzah', username: 'nurulizzah', class_code: 'DCS 4A' },
  { name: 'Danial Hakim', username: 'danialhakim', class_code: 'DCS 2B' },
  { name: 'Siti Aisyah', username: 'sitiaisyah', class_code: 'DCS 4B' },
  { name: 'Faris Irfan', username: 'farisirfan', class_code: 'DCS 3A' },
  { name: 'Amirah Sofea', username: 'amirahsofea', class_code: 'DCS 4A' },
  { name: 'Haziq Zikri', username: 'haziqzikri', class_code: 'DCS 2A' },
  { name: 'Nadia Natasya', username: 'nadianatasya', class_code: 'DCS 3B' },
  { name: 'Syafiq Azman', username: 'syafiqazman', class_code: 'DCS 4B' },
  { name: 'Putri Balqis', username: 'putribalqis', class_code: 'DCS 1A' },
  { name: 'Adam Harith', username: 'adamharith', class_code: 'DCS 3A' },
  { name: 'Hannah Yasmin', username: 'hannahyasmin', class_code: 'DCS 2B' },
  { name: 'Luqman Hakim', username: 'luqmanhakim', class_code: 'DCS 4A' },
  { name: 'Nur Aina', username: 'nuraina', class_code: 'DCS 1B' },
  { name: 'Irfan Danish', username: 'irfandanish', class_code: 'DCS 3B' },
  { name: 'Alya Maisarah', username: 'alyamaisarah', class_code: 'DCS 2A' },
  { name: 'Zulhilmi', username: 'zulhilmi', class_code: 'DCS 4B' },
  { name: 'Fatin Nabila', username: 'fatinnabila', class_code: 'DCS 3A' },
  { name: 'Khairul Anwar', username: 'khairulanwar', class_code: 'DCS 2B' },
  { name: 'Maisarah Huda', username: 'maisarahhuda', class_code: 'DCS 4A' },
];

// Exclude automated k6 load-test accounts when real student profiles exist.
const isLoadTestProfile = (profile) => {
  const name = (profile?.name || '').trim();
  const username = (profile?.username || '').trim();
  return /^Load Test \d+$/i.test(name) || /^loadtest\d+$/i.test(username);
};

export function attachUsersToReviews(reviews, profiles = []) {
  const validProfiles = (profiles || []).filter(
    (p) => p && (p.name?.trim() || p.username?.trim())
  );
  const realStudents = validProfiles.filter((p) => !isLoadTestProfile(p));
  const pool =
    realStudents.length > 0
      ? realStudents
      : validProfiles.length > 0
        ? validProfiles
        : FALLBACK_PROFILES;

  return reviews.map((message, index) => {
    const user = pool[index % pool.length];
    const name = user?.name?.trim() || user?.username?.trim() || 'Student';
    const username = user?.username?.trim() ? `@${user.username.trim()}` : '';
    const meta = user?.class_code?.trim() || user?.semester?.trim() || '';
    return {
      id: `review-${index + 1}`,
      name,
      username,
      meta,
      photoUrl: user?.photo_url || null,
      message,
    };
  });
}

// Parse submitted feedback rows from bug_reports (title: "Student feedback: N/5")
export function parseSubmittedReviewReports(reports = []) {
  return (reports || [])
    .filter((r) => typeof r?.title === 'string' && r.title.startsWith('Student feedback:'))
    .map((r) => {
      const lines = (r.details || '').split('\n');
      const commentLines = lines.slice(6).join('\n').trim();
      const usefulLine = lines.find((l) => l.startsWith('Most useful:')) || '';
      const useful = usefulLine.replace('Most useful:', '').trim();
      const ratingMatch = r.title.match(/(\d)\/5/);
      const rating = ratingMatch ? Number(ratingMatch[1]) : null;
      const message =
        commentLines && commentLines !== 'No additional comment.'
          ? commentLines
          : `${useful || 'SKOR+'} has been really helpful for my studies.${rating ? ` (${rating}/5)` : ''}`;
      const name = r.reporter?.name?.trim() || r.reporter?.username?.trim() || 'Student';
      const username = r.reporter?.username?.trim() ? `@${r.reporter.username.trim()}` : '';
      return {
        id: `report-${r.id}`,
        name,
        username,
        meta: r.created_at
          ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        photoUrl: r.reporter?.photo_url || null,
        message,
      };
    });
}

export const studentDemoReviews = attachUsersToReviews(studentReviews);
