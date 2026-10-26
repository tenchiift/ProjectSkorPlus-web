export const CALCQUEST_REVIEW_ITEMS = [
  { rating: 5, topic: 'Quests', name: 'Aiman Hakimi', message: 'Misi baiki jambatan dekat Foundation Village buat latihan algebra rasa macam main game betul, tak bosan langsung.' },
  { rating: 4, topic: 'Diagnostic', name: 'Nurul Izzah', message: 'Placement check awal-awal tu memang membantu sebab terus tahu asas algebra mana yang kena kukuhkan dulu.' },
  { rating: 5, topic: 'Avatar', name: 'Danial Hakim', message: 'Best dapat tukar outfit dengan warna cloak character lepas penat selesaikan quest setiap region.' },
  { rating: 4, topic: 'Hints', name: 'Siti Aisyah', message: 'Hint untuk soalan chain rule sangat membantu bila tersangkut, cuma kalau ada satu contoh tambahan lagi cantik.' },
  { rating: 5, topic: 'Daily quiz', name: 'Faris Irfan', message: 'Kuiz harian 3 soalan tu ngam-ngam untuk warm up otak sementara tunggu lecturer masuk kelas.' },
  { rating: 4, topic: 'Study Party', name: 'Amirah Sofea', message: 'Buat mission dalam Study Party dengan kawan sekelas jauh lagi seronok daripada ulang kaji sorang-sorang dekat bilik.' },
  { rating: 4, topic: 'Derivatives', name: 'Haziq Zikri', message: 'Bila salah jawab, penerangan dia terus tunjuk yang saya terlupa darab derivative bahagian dalam.' },
  { rating: 5, topic: 'Progress', name: 'Nadia Natasya', message: 'Suka sebab semua progress world dengan koleksi outfit kekal tersimpan walaupun buka balik dekat device lain.' },
  { rating: 4, topic: 'Skill Ledger', name: 'Syafiq Azman', message: 'Skill Ledger senang nak tengok topik mana yang masih lemah sebelum dekat tarikh test.' },
  { rating: 4, topic: 'Limits', name: 'Putri Balqis', message: 'Lepas buat latihan dekat region Limits baru nampak jelas beza limit kiri dengan kanan.' },
  { rating: 5, topic: 'Integration', name: 'Adam Harith', message: 'Peringatan pasal pemalar +C lepas jawab soalan integration memang penyelamat, selalu sangat terlupa.' },
  { rating: 4, topic: 'Controls', name: 'Hannah Yasmin', message: 'Rekaan bentuk konsol handheld nampak kemas dan butang D-pad senang nak tekan dekat skrin telefon.' },
  { rating: 4, topic: 'Explanations', name: 'Luqman Hakim', message: 'Jalan kerja yang ditunjukkan lepas habis satu-satu soalan ringkas dan senang nak faham.' },
  { rating: 5, topic: 'Quests', name: 'Nur Aina', message: 'Bila pecahkan latihan ikut quest pendek macam ni rasa ringan sikit berbanding buat kertas tutorial panjang.' },
  { rating: 4, topic: 'Avatar', name: 'Irfan Danish', message: 'Harap nanti tambah lagi banyak aksesori topi dengan gaya rambut bila unlock world baru.' },
  { rating: 4, topic: 'Daily quiz', name: 'Alya Maisarah', message: 'Soalan harian bantu saya kekalkan momentum belajar calculus setiap hari tanpa rasa tertekan.' },
  { rating: 4, topic: 'Mobile', name: 'Zulhilmi', message: 'Paparan skrin melintang waktu pusing telefon rasa macam pegang konsol game sebenar.' },
  { rating: 5, topic: 'Study Party', name: 'Fatin Nabila', message: 'Pembahagian role Solver, Analyst dengan Verifier dalam Study Party buat semua ahli kumpulan kena bekerjasama.' },
  { rating: 4, topic: 'Feedback', name: 'Khairul Anwar', message: 'Bagus ada ruangan maklum balas terus dalam aplikasi supaya pelajar boleh kongsi topik mana yang susah.' },
  { rating: 5, topic: 'Overall', name: 'Maisarah Huda', message: 'Gabungan konsep RPG dengan latihan calculus ni buat subjek yang selama ni nampak berat jadi jauh lebih seronok.' },
];

export function attachUsersToCalcQuestReviews(items, profiles = []) {
  const validProfiles = (profiles || []).filter(
    (p) => p && (p.name?.trim() || p.username?.trim()) && !/^Load Test \d+$/i.test(p.name || '') && !/^loadtest\d+$/i.test(p.username || '')
  );
  return items.map((item, index) => {
    const user = validProfiles.length > 0 ? validProfiles[index % validProfiles.length] : null;
    const author = user?.name?.trim() || user?.username?.trim() || item.name;
    return {
      id: `review-${index + 1}`,
      author,
      rating: item.rating,
      topic: item.topic,
      message: item.message,
    };
  });
}

export const DEMO_REVIEWS = attachUsersToCalcQuestReviews(CALCQUEST_REVIEW_ITEMS);
