import { Modifier } from '../types';

export const MODIFIERS: Modifier[] = [
  // 증폭어 (+1)
  { word: '너무', type: 'amplifier', delta: 1 },
  { word: '정말', type: 'amplifier', delta: 1 },
  { word: '진짜', type: 'amplifier', delta: 1 },
  { word: '완전', type: 'amplifier', delta: 1 },
  { word: '극도로', type: 'amplifier', delta: 1 },
  { word: '엄청', type: 'amplifier', delta: 1 },
  { word: '미칠 듯이', type: 'amplifier', delta: 1 },
  { word: '매우', type: 'amplifier', delta: 1 },
  { word: '아주', type: 'amplifier', delta: 1 },
  { word: '몹시', type: 'amplifier', delta: 1 },
  { word: '무척', type: 'amplifier', delta: 1 },
  { word: '대단히', type: 'amplifier', delta: 1 },
  { word: '심하게', type: 'amplifier', delta: 1 },
  { word: '죽을 만큼', type: 'amplifier', delta: 1 },
  { word: '미치도록', type: 'amplifier', delta: 1 },

  // 감쇄어 (-1)
  { word: '약간', type: 'dampener', delta: -1 },
  { word: '조금', type: 'dampener', delta: -1 },
  { word: '살짝', type: 'dampener', delta: -1 },
  { word: '좀', type: 'dampener', delta: -1 },
  { word: '그나마', type: 'dampener', delta: -1 },
  { word: '다소', type: 'dampener', delta: -1 },
  { word: '슬쩍', type: 'dampener', delta: -1 },
  { word: '미세하게', type: 'dampener', delta: -1 },
  { word: '살며시', type: 'dampener', delta: -1 },
];