/** Pure server-side puzzle primitives. Do not import answer registries into client components. */
export function normalizeAnswer(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  return value.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ').trim().replace(/\s+/g, ' ');
}

export function verifyAnswer(input, accepted) {
  const answer = normalizeAnswer(input);
  return answer.length > 0 && accepted.some(value => normalizeAnswer(value) === answer);
}

export function caesar(text, shift) {
  if (!Number.isInteger(shift)) throw new TypeError('Deslocamento inteiro necessário.');
  return text.replace(/[a-z]/gi, char => {
    const base = char === char.toUpperCase() ? 65 : 97;
    return String.fromCharCode(base + ((char.charCodeAt(0) - base + shift) % 26 + 26) % 26);
  });
}

export function verifySequence(input, expected) {
  return Array.isArray(input) && input.length === expected.length &&
    input.every((value, index) => value === expected[index]);
}

/** A session unlock never substitutes for the master's narrative release. */
export function canAccessChapter({ chapter, released, solved, preview = false, isMaster = false }) {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 8) return false;
  if (preview && isMaster) return true;
  if (!released.includes(chapter)) return false;
  return chapter === 1 || solved.includes(chapter - 1);
}
