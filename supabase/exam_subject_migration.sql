-- Normalize legacy exam subjects to Discrete Mathematics.
update public.exams
set subject = 'Discrete Mathematics'
where subject in ('Mathematics', 'mathematics', 'MATHEMATICS')
   or subject is null;
