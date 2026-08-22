// Notification content library — Gen Z + Malay style, no AI-slop.

export const QUOTES = [
  { title: 'Lock in 🔒', body: 'No cap, malam ni grind sikit. Future you cakap terima kasih nanti.' },
  { title: 'Stay hungry 🍚', body: 'Jangan jadi "aku malas". Jadi "aku nak menang". Different vibe tu bro.' },
  { title: 'Small wins ✨', body: 'Satu soalan je hari ni pun okay. Konsisten > perfect.' },
  { title: 'Bet on yourself 🎯', body: 'Orang lain boleh doubt kau, tapi kau jangan doubt diri sendiri.' },
  { title: 'Main character energy 🎬', body: 'Exam tu bukan final boss yang mustahil. Kau dah level up, tinggal lawan je.' },
  { title: 'Delulu is the solulu 💭', body: 'Berangan boleh, tapi pastikan tangan gerak sama-sama buat kerja.' },
  { title: 'Trust the process 📈', body: 'Kadang slow, kadang laju. Yang penting jangan berhenti.' },
  { title: 'Rest is part of it 😴', body: 'Burnout tak cool. Rehat jap, pastu sambung lagi kuat.' },
  { title: 'We move 🚀', body: 'Gagal sekali bukan game over. Reset, respawn, repeat.' },
  { title: 'Your pace ⏳', body: 'Jangan banding journey kau dengan orang. Kau punya timing sendiri.' },
  { title: 'Do it scared 😤', body: 'Takut tu normal. Yang penting buat je walaupun takut.' },
  { title: 'Glow up akademik 🌟', body: 'Setiap page buku kau baca, kau lagi dekat dengan versi terbaik kau.' },
];

export const STUDY_REMINDERS = [
  { title: 'Focus mode ON 🎧', body: 'Phone senyap, minda tajam. 25 minit deep work, 5 minit rest. Jom!' },
  { title: 'Recap time 🔁', body: 'Baca balik nota minggu ni. 10 minit je, janji masuk.' },
  { title: 'Past year drill 📄', body: 'Buat satu past year question hari ni. Pattern exam kau akan nampak.' },
  { title: 'Teach someone 🗣️', body: 'Cuba explain topic tu kat kawan. Kalau boleh ajar, maksudnya dah faham.' },
  { title: 'Hydrate first 💧', body: 'Minum air, regang sikit, baru sambung. Otak pun nak recharge.' },
];

export const pickDaily = (seedStr) => {
  // Deterministic pick based on day string so it's stable per day.
  let hash = 0;
  const s = String(seedStr);
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  const quote = QUOTES[hash % QUOTES.length];
  const tip = STUDY_REMINDERS[(hash >> 3) % STUDY_REMINDERS.length];
  return { quote, tip };
};
