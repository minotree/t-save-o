import { cuteEasyPuzzles } from './cute-easy';
import { createSuccessPuzzle } from './success-puzzle';
import { createPhrasePuzzle } from './phrase-puzzle';
import { composeCoursePuzzle } from './course-content';
import { normalLayouts, hardLayouts } from './course-layouts.generated';

export const cuteCourses = [
  { id:'easy', name:'쉬움', title:'작은 단어부터 구해요', description:'짧은 단어로 방향을 익혀요.', puzzles:cuteEasyPuzzles },
  { id:'normal', name:'보통', title:'순서를 살펴봐요', description:'최대 두 줄의 낱말을 차근차근 풀어요.', puzzles:[createSuccessPuzzle(),...normalLayouts.map(composeCoursePuzzle)] },
  { id:'hard', name:'어려움', title:'여러 줄의 친구들을 구해요', description:'최대 네 줄에서 빠져나갈 길을 찾아요.', puzzles:[createPhrasePuzzle('four-per-line-playable'),...hardLayouts.map(composeCoursePuzzle)] }
] as const;
export type CuteDifficulty = typeof cuteCourses[number]['id'];
