// Parses Malaysian polytechnic-style class codes: PROGRAM + number + group.
// "DCS 4B" -> { program: 'DCS', semester: 4, group: 'B' }
// Accepts a missing space ("DCS4B") and any letter case. The digit doubles
// as the semester number, so "DIA 3A" means semester 3.
// Returns null for anything outside that shape.

export function parseClassCode(input) {
  if (typeof input !== 'string') return null;
  const clean = input.trim().toUpperCase().replace(/\s+/g, ' ');
  const m = /^([A-Z]{2,5}) ?(\d) ?([A-Z])$/.exec(clean);
  if (!m) return null;
  const semester = Number(m[2]);
  if (semester < 1 || semester > 9) return null;
  return {
    program: m[1],
    semester,
    group: m[3],
    canonical: `${m[1]} ${m[2]}${m[3]}`,
    semesterLabel: `Semester ${semester}`,
  };
}
