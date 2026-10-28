import { cuteEasyPuzzles } from './cute-easy';
import { createSuccessPuzzle } from './success-puzzle';
import { createPhrasePuzzle } from './phrase-puzzle';

export const cuteCourses = [
  { id:'easy', name:'쉬움', title:'작은 단어부터 구해요', description:'짧은 단어로 방향을 익혀요.', puzzles:cuteEasyPuzzles },
  { id:'normal', name:'보통', title:'순서를 살펴봐요', description:'여러 글자의 획을 차근차근 풀어요.', puzzles:[createSuccessPuzzle()] },
  { id:'hard', name:'어려움', title:'문장 속 친구들을 구해요', description:'두 줄 문장에서 빠져나갈 길을 찾아요.', puzzles:[createPhrasePuzzle()] }
] as const;
export type CuteDifficulty = typeof cuteCourses[number]['id'];
