// Simple English to Tamil transliteration mapping
// Based on phonetic mapping of Tamil characters

const consonants: Record<string, string> = {
  k: 'க', kh: 'க', g: 'க', gh: 'க',
  ch: 'ச', chh: 'ச', j: 'ஜ', jh: 'ஜ',
  t: 'த', th: 'த', d: 'ட', dh: 'ட',
  n: 'ந', nn: 'ண',
  p: 'ப', ph: 'ப', b: 'ப', bh: 'ப',
  m: 'ம',
  y: 'ய', r: 'ர', l: 'ல', v: 'வ', w: 'வ',
  sh: 'ஷ', s: 'ஸ', h: 'ஹ',
  f: 'ஃப', z: 'ஸ',
  x: 'க்ஸ', q: 'க',
};

const vowels: Record<string, string> = {
  a: 'அ', aa: 'ஆ', ah: 'ஆ',
  i: 'இ', ee: 'ஈ', ii: 'ஈ',
  u: 'உ', oo: 'ஊ', uu: 'ஊ',
  e: 'எ', ae: 'ஏ',
  ai: 'ஐ',
  o: 'ஒ', oa: 'ஓ',
  au: 'ஔ', ou: 'ஔ',
};

const vowelSigns: Record<string, string> = {
  a: '', aa: 'ா', ah: 'ா',
  i: 'ி', ee: 'ீ', ii: 'ீ',
  u: 'ு', oo: 'ூ', uu: 'ூ',
  e: 'ெ', ae: 'ே',
  ai: 'ை',
  o: 'ொ', oa: 'ோ',
  au: 'ௌ', ou: 'ௌ',
};

const virama = '்';

/**
 * Transliterates an English string to Tamil script using phonetic mapping.
 * This is an approximate transliteration - not a translation.
 */
export function transliterateToTamil(input: string): string {
  if (!input) return '';
  
  const words = input.split(/\s+/);
  return words.map(word => transliterateWord(word)).join(' ');
}

function transliterateWord(word: string): string {
  const lower = word.toLowerCase();
  let result = '';
  let i = 0;

  while (i < lower.length) {
    // Skip non-alpha
    if (!/[a-z]/.test(lower[i])) {
      result += lower[i];
      i++;
      continue;
    }

    // Try to match a consonant (2-char first, then 1-char)
    let consonant = '';
    let consLen = 0;

    for (const len of [2, 1]) {
      const sub = lower.substring(i, i + len);
      if (consonants[sub]) {
        consonant = consonants[sub];
        consLen = len;
        break;
      }
    }

    if (consonant) {
      i += consLen;

      // Check for following vowel sign
      let foundVowel = false;
      for (const len of [2, 1]) {
        const sub = lower.substring(i, i + len);
        if (vowelSigns[sub] !== undefined) {
          result += consonant + vowelSigns[sub];
          i += len;
          foundVowel = true;
          break;
        }
      }

      if (!foundVowel) {
        // Consonant with virama (no vowel follows) unless end of word
        const nextIsConsonant = i < lower.length && /[a-z]/.test(lower[i]) && !vowels[lower[i]];
        const isEnd = i >= lower.length;
        if (nextIsConsonant || isEnd) {
          result += consonant + virama;
        } else if (i < lower.length && vowels[lower[i]]) {
          // standalone vowel after consonant - use vowel sign
          for (const len of [2, 1]) {
            const sub = lower.substring(i, i + len);
            if (vowelSigns[sub] !== undefined) {
              result += consonant + vowelSigns[sub];
              i += len;
              foundVowel = true;
              break;
            }
          }
          if (!foundVowel) {
            result += consonant;
          }
        } else {
          result += consonant;
        }
      }
    } else {
      // Try vowel (standalone, beginning of word or after vowel)
      let foundVowel = false;
      for (const len of [2, 1]) {
        const sub = lower.substring(i, i + len);
        if (vowels[sub]) {
          result += vowels[sub];
          i += len;
          foundVowel = true;
          break;
        }
      }
      if (!foundVowel) {
        result += lower[i];
        i++;
      }
    }
  }

  return result;
}
