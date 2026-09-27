-- Optional: distinct sister / brother / guardian (001 already has sibling + relative).
-- Run after 001. ADD VALUE cannot sit inside a multi-statement transaction on some Postgres versions.

alter type public.creator_relationship add value if not exists 'guardian';
alter type public.creator_relationship add value if not exists 'brother';
alter type public.creator_relationship add value if not exists 'sister';
