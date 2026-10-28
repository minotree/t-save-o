export type MoodId='cute'|'modern'|'calm';
export type Mood={id:MoodId;name:string;description:string;invitation:string;colors:{body:string;head:string;blocked:string;hover:string}};
export const moods:readonly Mood[]=[
  {id:'cute',name:'아기자기',description:'따뜻한 색과 동그란 친구들',invitation:'톡톡! 한 획씩, 동그란 친구를 구해요.',
    colors:{body:'#258C78',head:'#FFFF00',blocked:'#FF727E',hover:'#177A67'}},
  {id:'modern',name:'모던',description:'간결한 화면, 가볍게 몰입하는 시간',invitation:'복잡한 생각은 내려놓고, 한 획에 집중해 보세요.',
    colors:{body:'#385A70',head:'#F4D576',blocked:'#FF727E',hover:'#213D53'}},
  {id:'calm',name:'여유',description:'크고 선명하게, 나만의 속도로',invitation:'서두르지 않아도 괜찮아요. 편안하게 한 획씩.',
    colors:{body:'#315B4B',head:'#FFF17A',blocked:'#D94A58',hover:'#193D30'}}
];
