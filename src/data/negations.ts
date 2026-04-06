import { Negation } from '../types';

export const NEGATIONS: Negation[] = [
  { word: '않', scanDirection: 'after', scanRange: 2 },
  { word: '못', scanDirection: 'after', scanRange: 2 },
  { word: '아니', scanDirection: 'after', scanRange: 2 },
  { word: '없', scanDirection: 'after', scanRange: 2 },
  { word: '안 ', scanDirection: 'before', scanRange: 1 },
  { word: '말', scanDirection: 'after', scanRange: 2 },
  { word: '것보다', scanDirection: 'after', scanRange: 3 },
  { word: '줄 알았', scanDirection: 'after', scanRange: 3 },
];