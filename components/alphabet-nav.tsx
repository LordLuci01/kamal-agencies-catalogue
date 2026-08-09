'use client';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AlphabetNav({ letters }: { letters: string[] }) {
  const letterSet = new Set(letters);
  return (
    <nav className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Alphabetical navigation">
      {ALPHABET.map((letter) => {
        const enabled = letterSet.has(letter);
        return enabled ? (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {letter}
          </a>
        ) : (
          <span
            key={letter}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-medium text-muted-foreground/40"
          >
            {letter}
          </span>
        );
      })}
    </nav>
  );
}
