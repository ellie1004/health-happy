import { useState, useEffect, useRef, useCallback } from "react";
import { saveHealthRecordAnonymous } from "./lib/healthRecords";

// ── 상수 ──────────────────────────────────────────────────
const REGIONS = ["수원시 장안구 보건소","수원시 권선구 보건소","수원시 팔달구 보건소","수원시 영통구 보건소","용인시 처인구 보건소","용인시 기흥구 보건소","용인시 수지구 보건소","고양시 덕양구 보건소","고양시 일산동구 보건소","고양시 일산서구 보건소","성남시 수정구 보건소","성남시 중원구 보건소","성남시 분당구 보건소","화성시 서부 보건소","화성시 동탄 보건소","화성시 동부 보건소","화성시 효행구 보건소","부천시 원미구 보건소","부천시 소사 보건소","부천시 오정 보건소","남양주 보건소","남양주 풍양 보건소","안산시 상록수 보건소","안산시 단원 보건소","평택 보건소","평택시 송탄 보건소","안양시 만안구 보건소","안양시 동안구 보건소","시흥시 보건소","김포시 보건소","파주 보건소","파주시 운정 보건소","의정부시 보건소","광주시 보건소","광명시 보건소","하남시 보건소","군포시 보건소","오산시 보건소","양주시 보건소","이천시 보건소","구리시 보건소","안성시 보건소","의왕시 보건소","포천시 보건소","양평군 보건소","여주시 보건소","동두천시 보건소","과천시 보건소","가평군 보건소","연천군 보건소"];
const MED_ITEMS = [
  {i:0,em:"✅",nm:"해당 없음",sub:"복용약 없음",none:true},
  {i:1,em:"❤️",nm:"고혈압약",sub:"혈압강하제"},
  {i:2,em:"🩸",nm:"당뇨약",sub:"혈당조절제"},
  {i:3,em:"🫀",nm:"고지혈증약",sub:"콜레스테롤"},
  {i:4,em:"💙",nm:"심장약",sub:"심혈관계"},
  {i:5,em:"🦋",nm:"갑상선약",sub:"호르몬제"},
  {i:6,em:"🧠",nm:"정신건강약",sub:"항우울·수면"},
  {i:7,em:"💉",nm:"기타 만성질환약",sub:"기타"},
];
const LK_EMOJIS = ["😞","😕","😐","🙂","😄"];
const LK_LBLS  = ["전혀\n아님","그렇지\n않다","보통","그렇다","매우\n그렇다"];
const NP_LABELS = ["금연","절주","영양·식생활","걷기·신체활동","비만·체중관리","만성질환 예방관리","수면건강","구강건강","스트레스·정신건강","감염병 예방","방문건강관리","모바일·AI 건강관리"];
const PF_LABELS = ["보건소 방문 대면교육","소규모 실습형","지역주민 모임형","온라인 교육","모바일·카카오 중심","가정 방문형","혼합형(대면+온라인)"];
const PR_LABELS = ["운동·신체활동","영양·식생활","비만관리","만성질환 예방관리","정신건강","수면건강","금연","절주","방문건강관리","디지털 건강관리"];
const DG_LABELS = ["매우 있다","약간 있다","보통이다","별로 없다","전혀 없다"];
const DK = ["smoke","drink","salt","breakfast","instant","exercise","bmi","handwash","vaccine","sleep","checkup"];
const TIMER = 25;
const F = "'Noto Sans KR','Malgun Gothic',sans-serif";

// ── 경기도 디자인 시스템 ────────────────────────────────
const GG_BLUE = "#0066CC";
const GG_BLUE_DARK = "#004C99";
const GG_BLUE_LIGHT = "#E8F4FD";
const GG_BLUE_BG = "linear-gradient(135deg,#0066CC,#0052A3)";
const GG_GREEN = "#00A651";
const GG_RED = "#E5342E";
const GG_GRAY = "#F5F5F5";
const GG_BORDER = "#E0E0E0";
const GG_TEXT = "#333333";
const GG_TEXT_SUB = "#666666";
const GG_TEXT_LIGHT = "#999999";
const SHADOW_SM = "0 1px 4px rgba(0,0,0,.06)";
const SHADOW_MD = "0 4px 16px rgba(0,0,0,.08)";
const SHADOW_LG = "0 8px 32px rgba(0,0,0,.10)";
const CHAR_IMG = "/bonggong.png";

// ── 봉공이 캐릭터 컴포넌트 ──────────────────────────────
function Bonggong({msg, mood="normal", size=80, onClick}) {
  const bounce = mood==="happy" ? "bonggongBounce 0.6s ease infinite" :
                 mood==="think" ? "bonggongTilt 1.5s ease infinite" :
                 mood==="cheer" ? "bonggongJump 0.8s ease infinite" :
                 mood==="wave" ? "bonggongWave 1s ease infinite" :
                 "bonggongIdle 2.5s ease infinite";
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:12,cursor:onClick?"pointer":"default"}} onClick={onClick}>
      <div style={{position:"relative",flexShrink:0}}>
        <img src={CHAR_IMG} alt="봉공이" style={{width:size,height:size,objectFit:"contain",animation:bounce,filter:"drop-shadow(0 3px 8px rgba(0,102,204,.18))"}}/>
      </div>
      {msg&&(
        <div style={{position:"relative",background:"#fff",border:`2px solid ${GG_BLUE}`,borderRadius:"18px 18px 18px 4px",padding:"10px 16px",fontSize:15,fontWeight:600,color:GG_TEXT,lineHeight:1.5,maxWidth:280,boxShadow:SHADOW_SM,animation:"fadeUp .3s ease",fontFamily:F}}>
          <div style={{position:"absolute",left:-8,bottom:10,width:0,height:0,borderTop:"6px solid transparent",borderBottom:"6px solid transparent",borderRight:`8px solid ${GG_BLUE}`}}/>
          {msg}
        </div>
      )}
    </div>
  );
}

// ── 전체 문항 ────────────────────────────────────────────
const QS = [
  {id:"disease", cat:"건강문제", em:"🏥", txt:"현재 앓고 있는 질병을 모두 선택해주세요.", type:"multi",
   opts:["알레르기","관절염·관절통증","천식","허리·목의 통증","호흡기 장애","우울 등 정신장애","불면증","당뇨","고혈압","간기능 장애","두통","뇌심혈관장애","위장장애","피부질환","하지정맥류","기타","질병 없음"]},
  {id:"health_p",cat:"건강인식", em:"💭", txt:"귀하의 건강은 대체로 어떠하다고 생각하십니까?", type:"single",
   opts:["① 매우 좋음","② 좋음","③ 보통","④ 나쁨","⑤ 매우 나쁨"]},
  {id:"checkup", cat:"건강검진", em:"🔬", txt:"최근 2년 동안 건강검진(암 검진 포함)을 받으셨습니까?", type:"single",
   opts:["① 예, 받았습니다","② 아니오, 받지 않았습니다"]},
  {id:"meds",    cat:"약복용",   em:"💊", txt:"현재 규칙적으로 복용 중인 약이 있습니까?", type:"med",
   hint:"만성질환으로 인한 장기 복용약 선택 (복수 가능)"},
  {id:"smoke",   cat:"흡연",     em:"🚬", txt:"현재 담배를 피우십니까?", type:"single",
   opts:["① 전혀 피운 적 없거나 10년 전에 끊었다","② 5년 전에 끊었다","③ 끊은 지 1개월~5년 되었다","④ 하루 1갑 미만 피운다","⑤ 하루 1갑 이상 피운다"]},
  {id:"df",      cat:"음주",     em:"🍺", txt:"술을 얼마나 자주 마십니까?", type:"single",
   opts:["① 한 달에 1번 미만","② 한 달에 1번 정도","③ 한 달에 2~4번","④ 일주일에 2~3번","⑤ 일주일에 4번 이상","⑥ 해당 없음"]},
  {id:"dt",      cat:"음주",     em:"🍶", txt:"주로 마시는 술의 종류는 무엇입니까?", type:"single",
   opts:["① 소주","② 맥주","③ 와인","④ 막걸리","⑤ 기타","⑥ 술을 마시지 않음"]},
  {id:"da",      cat:"음주",     em:"🥂", txt:"한 번에 술을 얼마나 마십니까?", type:"single",
   hint:"소주 1잔(50ml) ≈ 맥주 1캔(355ml) ≈ 와인 1잔(120ml)",
   opts:["① 소주 1~2잔 / 맥주 1캔 이하","② 소주 3~4잔 / 맥주 2캔","③ 소주 5~6잔 / 맥주 3~4캔","④ 소주 7~9잔 / 맥주 5~6캔","⑤ 소주 10잔 이상 / 맥주 7캔 이상","⑥ 해당 없음"]},
  {id:"salt",    cat:"영양",     em:"🧂", txt:"평상시 음식을 어떻게 드십니까?", type:"single",
   opts:["① 아주 짜게 먹는다","② 약간 짜게 먹는다","③ 보통으로 먹는다","④ 약간 싱겁게 먹는다","⑤ 아주 싱겁게 먹는다"]},
  {id:"bk",      cat:"영양",     em:"🍳", txt:"최근 1년간 아침 식사를 일주일에 몇 회 하셨습니까?", type:"single",
   opts:["① 주 5~7회","② 주 3~4회","③ 주 1~2회","④ 거의 안 한다"]},
  {id:"ins",     cat:"영양",     em:"🍟", txt:"가공식품·배달음식·인스턴트를 얼마나 자주 드십니까?", type:"single",
   opts:["① 거의 먹지 않는다","② 주 1~2회","③ 주 3~4회","④ 주 5회 이상"]},
  {id:"ed",      cat:"운동",     em:"🏃", txt:"1주일간 숨이 차게 만드는 신체활동을 며칠 하십니까?", type:"single",
   hint:"빠르게 걷기·자전거 타기·청소 등",
   opts:["① 0일","② 1일","③ 2일","④ 3일","⑤ 4일","⑥ 5일","⑦ 6일","⑧ 7일"]},
  {id:"et",      cat:"운동",     em:"⏱️", txt:"하루에 중강도 신체활동을 몇 분 하십니까?", type:"single",
   hint:"숨이 약간 차지만 대화 가능한 수준",
   opts:["① 없음","② 10분","③ 20분","④ 30분","⑤ 40분","⑥ 50분","⑦ 60분","⑧ 70분 이상"]},
  {id:"bmi",     cat:"체중",     em:"⚖️", txt:"현재 귀하의 키와 몸무게를 입력해주세요.", type:"hw"},
  {id:"slhr",    cat:"수면",     em:"😴", txt:"최근 1주일간 하루 평균 몇 시간 주무셨습니까?", type:"single",
   opts:["① 5시간 미만","② 5~6시간 미만","③ 6~7시간 미만","④ 7~8시간 미만","⑤ 8시간 이상"]},
  {id:"sld",     cat:"수면",     em:"🌙", txt:"최근 2주간 잠들기 어렵거나 자주 깨는 일이 있었습니까?", type:"single",
   opts:["① 전혀 없었다","② 가끔 있었다","③ 자주 있었다","④ 거의 매일 있었다"]},
  {id:"hw",      cat:"개인위생", em:"🧼", txt:"최근 1주일간 식사 전·외출 후 손을 얼마나 자주 씻었습니까?", type:"single",
   opts:["① 항상 씻었다","② 자주 씻었다","③ 가끔 씻었다","④ 거의 씻지 않았다"]},
  {id:"vac",     cat:"예방접종", em:"💉", txt:"최근 1년간 인플루엔자 예방접종을 받으셨습니까?", type:"single",
   opts:["① 예, 받았습니다","② 아니오, 받지 않았습니다"]},
  {id:"sat1",cat:"생활만족도",em:"☀️",txt:"나의 일상생활은 만족스럽다.",type:"likert"},
  {id:"sat2",cat:"생활만족도",em:"⚡",txt:"나의 생활은 활기가 있다.",type:"likert"},
  {id:"sat3",cat:"생활만족도",em:"🎉",txt:"나는 내 생활을 즐기고 있다.",type:"likert"},
  {id:"sat4",cat:"생활만족도",em:"🌈",txt:"어려움을 극복할 수 있다고 믿고 희망을 가지고 생활한다.",type:"likert"},
  {id:"sat5",cat:"생활만족도",em:"🤝",txt:"사람과 더불어 사는 삶이 만족스럽다.",type:"likert"},
  {id:"sat6",cat:"생활만족도",em:"😊",txt:"지금 나는 행복하다고 느낀다.",type:"likert"},
  {id:"paw",  cat:"인지도",   em:"📢",txt:"귀하는 보건소 건강증진 프로그램을 알고 계십니까?",type:"single",
   opts:["① 잘 알고 있다","② 어느 정도 알고 있다","③ 들어본 적은 있다","④ 전혀 모른다"]},
  {id:"pex",  cat:"인지도",   em:"🏃",txt:"최근 1년간 보건소 건강증진 프로그램에 참여한 적이 있습니까?",type:"single",
   opts:["① 예","② 아니오"]},
  {id:"pint", cat:"요구도",   em:"🙋",txt:"향후 보건소 건강증진 프로그램에 참여할 의향이 있습니까?",type:"single",
   opts:["① 매우 있다","② 어느 정도 있다","③ 보통이다","④ 별로 없다","⑤ 전혀 없다"]},
  {id:"nprog",cat:"요구도",   em:"📋",txt:"귀하에게 가장 필요한 건강증진 프로그램은?",type:"multi",opts:NP_LABELS},
  {id:"pfmt", cat:"운영방식", em:"🎯",txt:"가장 선호하는 건강증진 프로그램 운영방식은?",type:"single",
   opts:PF_LABELS.map((l,i)=>`${["①","②","③","④","⑤","⑥","⑦"][i]} ${l}`)},
  {id:"dgint",cat:"디지털",   em:"📱",txt:"모바일·AI·비대면 건강관리 서비스를 이용할 의향이 있습니까?",type:"single",
   opts:["① 매우 있다","② 약간 있다","③ 보통이다","④ 별로 없다","⑤ 전혀 없다"]},
  {id:"barrier",cat:"운영방식",em:"🚧",txt:"귀하가 보건소 건강증진 프로그램에 참여하기 어려운 가장 큰 이유는 무엇입니까?",type:"multi",
   hint:"복수응답 가능",
   opts:["시간이 없다","프로그램 정보를 잘 모른다","거리가 멀거나 이동이 불편하다","신청 방법이 어렵다","혼자 참여하기 부담스럽다","내용이 나에게 맞지 않을 것 같다","온라인·모바일 사용이 어렵다","건강상 이유로 참여가 어렵다","필요성을 느끼지 못한다","기타"]},
  {id:"expand",cat:"운영방식",em:"🏅",txt:"향후 보건소가 가장 우선적으로 확대해야 할 건강증진사업은 무엇이라고 생각하십니까?",type:"single",
   opts:["① 운동·신체활동","② 영양·식생활","③ 비만관리","④ 만성질환 예방관리","⑤ 정신건강","⑥ 수면건강","⑦ 금연","⑧ 절주","⑨ 방문건강관리","⑩ 홍보강화","⑪ 기타"]},
];
const TOTAL = QS.length;

// ── 봉공이 대사 ──────────────────────────────────────────
const CHAR_MSGS = {
  intro: "안녕하세요! 저는 경기도 봉공이예요.\n건강나이를 측정해볼까요? 😊",
  countdown: "곧 시작해요! 준비되셨죠?",
  quiz_start: "천천히 솔직하게 답해주세요!",
  quiz_half: "절반 지났어요! 잘 하고 있어요 💪",
  quiz_almost: "거의 다 왔어요! 조금만 더!",
  quiz_time_low: "시간이 얼마 안 남았어요! ⏰",
  loading: "결과를 분석하고 있어요...",
  result_good: "건강관리를 잘 하고 계시네요! 👏",
  result_warn: "조금만 더 노력하면 건강해져요!",
  result_bad: "건강관리가 필요해요! 함께 해봐요 💙",
};

// ── 건강나이 계산 (양방향: 좋은 습관 → 젊어짐, 나쁜 습관 → 늙어짐) ──
// 근거: WHO Physical Activity Guidelines 2020, GBD Alcohol Study 2018 (Lancet),
//       Jha et al. NEJM 2013 (금연), npj Aging 2025 (신체활동-생물학적 나이),
//       Ofori-Asenso et al. JAHA 2019 (아침식사), Walker SLEEP 2021 (수면)
function calcResult(ans, gender, realAge) {
  const ra = realAge || 45;
  const df=ans.df, da=ans.da;
  let drisk=false, dbonus=false;
  if(df!==undefined&&da!==undefined){
    if(df===5||da===5) dbonus=true;
    else{ drisk=(df>=3)&&(da>=(gender==="female"?1:2)); if(df<=1&&da<=1) dbonus=true; }
  }
  const dm=[0,1,2,3,4,5,6,7], tm=[0,10,20,30,40,50,60,70];
  const exm = (ans.ed!==undefined&&ans.et!==undefined) ? dm[ans.ed]*tm[ans.et] : 0;
  const bd=ans.bmi; let bv=null;
  if(bd&&bd.h&&bd.w) bv = bd.w/((bd.h/100)**2);
  const meds=ans.meds||[]; const hasMed=meds.length>0&&!meds.includes(0);
  const R = {
    smoke:{l:"흡연",e:"🚬",
      risk:ans.smoke!==undefined&&ans.smoke>=3, bonus:ans.smoke===0,
      msg:ans.smoke>=3?"흡연은 폐암·심혈관 질환의 주요 원인입니다. 금연 클리닉을 이용해보세요.":"비흡연·장기 금연이 건강수명을 지키고 있습니다!",
      d:ans.smoke===4?5:ans.smoke===3?3:0, b:ans.smoke===0?-1:0},
    drink:{l:"음주",e:"🍺",
      risk:drisk, bonus:dbonus,
      msg:drisk?"고위험 음주 상태입니다. 음주 빈도와 1회 음주량을 줄여주세요.":"절주·비음주 습관이 건강수명을 늘립니다!",
      d:drisk?3:0, b:dbonus?-1:0},
    salt:{l:"짠 음식",e:"🧂",
      risk:ans.salt!==undefined&&ans.salt<=1, bonus:ans.salt!==undefined&&ans.salt>=3,
      msg:ans.salt<=1?"짠 음식은 고혈압·심혈관 질환 위험을 높입니다.":"싱겁게 먹는 식습관이 혈압 관리에 도움됩니다!",
      d:ans.salt<=1?2:0, b:ans.salt>=3?-1:0},
    breakfast:{l:"아침식사",e:"🍳",
      risk:ans.bk!==undefined&&ans.bk>=2, bonus:ans.bk===0,
      msg:ans.bk>=2?"아침 결식은 비만·당뇨 위험을 높입니다.":"규칙적 아침식사가 대사 건강을 지켜줍니다!",
      d:ans.bk>=3?2:ans.bk>=2?1:0, b:ans.bk===0?-1:0},
    instant:{l:"가공식품",e:"🍟",
      risk:ans.ins!==undefined&&ans.ins>=2, bonus:ans.ins===0,
      msg:ans.ins>=2?"가공·배달음식 과다 섭취는 나트륨·지방 과잉으로 이어집니다.":"가공식품을 줄이는 식습관이 건강에 좋습니다!",
      d:ans.ins>=3?2:ans.ins>=2?1:0, b:ans.ins===0?-1:0},
    exercise:{l:"운동",e:"🏃",
      risk:exm<150, bonus:exm>=300,
      msg:exm===0?"운동이 전혀 없습니다. 매일 30분 걷기부터 시작해보세요!":exm<150?"WHO 권장 주 150분에 미달합니다.":exm>=300?"주 300분 이상 운동으로 추가 건강편익을 얻고 있습니다! 🏆":"적정 운동량을 유지하고 있습니다.",
      d:exm===0?4:exm<70?3:exm<150?1:0, b:exm>=300?-2:0},
    bmi:{l:"체중",e:"⚖️",
      risk:bv!==null&&(bv<18.5||bv>=25), bonus:bv!==null&&bv>=18.5&&bv<23,
      msg:bv===null?"":bv<18.5?"저체중입니다. 균형 잡힌 식사가 필요합니다.":bv>=25?"비만입니다. 당뇨·고혈압 위험이 높습니다.":bv>=23?"과체중입니다. 운동과 식이 조절이 필요합니다.":"적정 체중을 유지하고 있습니다!",
      d:bv!==null&&bv>=25?4:bv!==null&&(bv<18.5||bv>=23)?2:0, b:bv!==null&&bv>=18.5&&bv<23?-1:0},
    handwash:{l:"손씻기",e:"🧼",
      risk:ans.hw!==undefined&&ans.hw>=2, bonus:ans.hw===0,
      msg:ans.hw>=2?"손씻기를 더 자주 해주세요.":"올바른 손씻기 습관이 감염병을 예방합니다!",
      d:ans.hw>=2?1:0, b:ans.hw===0?-1:0},
    vaccine:{l:"예방접종",e:"💉",
      risk:ans.vac===1, bonus:ans.vac===0,
      msg:ans.vac===1?"인플루엔자 예방접종을 매년 받으시기 바랍니다.":"예방접종으로 건강을 지키고 있습니다!",
      d:ans.vac===1?1:0, b:ans.vac===0?-1:0},
    sleep:{l:"수면",e:"😴",
      risk:ans.slhr!==undefined&&(ans.slhr<=1||ans.slhr>=4), bonus:ans.slhr===3,
      msg:ans.slhr<=1?"수면이 부족합니다. 7~8시간 수면을 목표로 하세요.":ans.slhr>=4?"과다 수면도 건강에 좋지 않습니다.":"7~8시간 적정 수면이 건강수명에 기여합니다!",
      d:ans.slhr===0?2:(ans.slhr<=1||ans.slhr>=4)?1:0, b:ans.slhr===3?-1:0},
    checkup:{l:"건강검진",e:"🏥",
      risk:ans.checkup===1, bonus:ans.checkup===0,
      msg:ans.checkup===1?"정기 건강검진을 받으시면 질병을 조기 발견할 수 있습니다.":"정기 건강검진으로 질병 예방에 앞서가고 있습니다!",
      d:ans.checkup===1?1:0, b:ans.checkup===0?-1:0},
  };
  const rc = Object.values(R).filter(r=>r.risk).length;
  const bc = Object.values(R).filter(r=>r.bonus).length;
  let delta = 0;
  Object.values(R).forEach(r=>{ if(r.risk) delta+=(r.d||0); if(r.bonus) delta+=(r.b||0); });
  const SATS = ["sat1","sat2","sat3","sat4","sat5","sat6"];
  const stot = SATS.reduce((s,k)=>s+(ans[k]!==undefined?ans[k]+1:3),0);
  if(stot<12) delta+=2;
  else if(stot>=24) delta-=1;
  const ha = ra+delta;
  const stier = stot>=24?"상위 20% 수준":stot>=18?"상위 40% 수준":stot>=12?"상위 60% 수준":"하위 40% — 정신건강 관리 필요";
  return {R,rc,bc,ra,ha,delta,stot,stier,meds,hasMed,bv};
}

// ── 카운트다운 ───────────────────────────────────────────
function Countdown({onDone}) {
  const [n,setN] = useState(3);
  useEffect(()=>{
    if(n<=0){onDone();return;}
    const t=setTimeout(()=>setN(p=>p-1),850);
    return()=>clearTimeout(t);
  },[n]);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:420,background:"#fff"}}>
      <style>{`@keyframes cdpop{0%{transform:scale(.3);opacity:0}65%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}`}</style>
      <Bonggong msg={CHAR_MSGS.countdown} mood="happy" size={100}/>
      <div style={{marginTop:32}}>
        {n>0
          ? <div key={n} style={{fontSize:120,fontWeight:900,color:GG_BLUE,lineHeight:1,animation:"cdpop .4s ease",fontFamily:F,textShadow:"0 4px 20px rgba(0,102,204,.15)"}}>{n}</div>
          : <div key="go" style={{fontSize:64,animation:"cdpop .4s ease"}}>🎬</div>
        }
      </div>
      <div style={{fontSize:20,color:GG_TEXT_SUB,marginTop:14,fontFamily:F}}>{n>0?"준비하세요!":"시작!"}</div>
    </div>
  );
}

// ── 타이머 바 ────────────────────────────────────────────
function TimerBar({t}) {
  const pct=(t/TIMER)*100, warn=t<=7;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{flex:1,height:6,background:"#E8F4FD",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:6,borderRadius:3,width:pct+"%",background:warn?GG_RED:GG_BLUE_BG,transition:"width .1s linear"}}/>
      </div>
      <span style={{fontSize:22,fontWeight:900,color:warn?GG_RED:GG_BLUE,minWidth:30,textAlign:"right",fontFamily:F}}>
        {Math.ceil(t)}
      </span>
    </div>
  );
}

// ── 스트릭 도트 ──────────────────────────────────────────
function Dots({cur,total}) {
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{width:12,height:12,borderRadius:"50%",
          background:i<cur?GG_BLUE:"#E8F4FD",
          border:`1.5px solid ${i<cur?GG_BLUE:"#D0E8F7"}`,
          transition:"all .3s"}}/>
      ))}
    </div>
  );
}

// ── 카테고리 태그 ────────────────────────────────────────
const TAG_MAP = {
  건강문제:"#DC2626|#FEF2F2",건강인식:"#0066CC|#E8F4FD",건강검진:"#0891B2|#ECFEFF",
  약복용:"#D97706|#FFFBEB",흡연:"#DC2626|#FEF2F2",음주:"#D97706|#FFFBEB",
  영양:"#059669|#ECFDF5",운동:"#0066CC|#E8F4FD",체중:"#7C3AED|#F5F3FF",
  수면:"#0891B2|#ECFEFF",개인위생:"#059669|#ECFDF5",예방접종:"#D97706|#FFFBEB",
  생활만족도:"#DB2777|#FDF2F8",인지도:"#059669|#ECFDF5",요구도:"#059669|#ECFDF5",
  운영방식:"#D97706|#FFFBEB",디지털:"#7C3AED|#F5F3FF",
};
function CatTag({cat}) {
  const [text,bg]=(TAG_MAP[cat]||"#666|#F5F5F5").split("|");
  return <span style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:12,background:bg,color:text,border:`1px solid ${text}22`,fontFamily:F}}>{cat}</span>;
}

// ── 선택지 버튼 ──────────────────────────────────────────
function OptBtn({label,selected,multi,onTap}) {
  const selColor = multi ? GG_GREEN : GG_BLUE;
  return (
    <button onClick={onTap} style={{
      display:"flex",alignItems:"center",gap:14,
      padding:"15px 16px",
      border:`${selected?2:1}px solid ${selected?selColor:GG_BORDER}`,
      borderRadius:12,cursor:"pointer",
      background:selected?(multi?"rgba(0,166,81,.04)":"rgba(0,102,204,.04)"):"#FFFFFF",
      fontSize:17,fontWeight:selected?700:500,
      color:selected?selColor:GG_TEXT,
      textAlign:"left",fontFamily:F,width:"100%",marginBottom:8,
      transition:"all .15s",
      boxShadow:selected?`0 0 0 3px ${selColor}12`:SHADOW_SM,
    }}>
      {multi
        ? <span style={{width:24,height:24,borderRadius:5,border:`2px solid ${selected?GG_GREEN:"#ccc"}`,background:selected?GG_GREEN:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:900,transition:"all .12s"}}>{selected?"✓":""}</span>
        : <span style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${selected?GG_BLUE:"#ccc"}`,background:selected?GG_BLUE:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:900,transition:"all .12s"}}>{selected?"✓":""}</span>
      }
      {label}
    </button>
  );
}

// ── 구역 제목 ────────────────────────────────────────────
function SecTit({children}) {
  return (
    <div style={{fontSize:14,fontWeight:800,color:GG_BLUE,letterSpacing:".04em",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:8,fontFamily:F}}>
      {children}<div style={{flex:1,height:1,background:GG_BORDER}}/>
    </div>
  );
}

// ── 메인 ────────────────────────────────────────────────
export default function App() {
  const [phase,setPhase] = useState("intro");
  const [gender,setGender] = useState(null);
  const [ageVal,setAgeVal] = useState("");
  const [region,setRegion] = useState("");
  const [ans,setAns] = useState({});
  const [cur,setCur] = useState(0);
  const [tLeft,setTLeft] = useState(TIMER);
  const [shaking,setShaking] = useState(false);
  const [toast,setToast] = useState("");
  const [ldMsg,setLdMsg] = useState("건강나이 계산 중...");
  const [satW,setSatW] = useState(0);
  const [resName,setResName] = useState("");
  const [resPhone,setResPhone] = useState("");
  const [submitted,setSubmitted] = useState(false);
  const [hwH,setHwH] = useState(""); const [hwW,setHwW] = useState("");
  const [charMsg,setCharMsg] = useState(CHAR_MSGS.intro);
  const [charMood,setCharMood] = useState("wave");
  const topRef = useRef(null);
  const timerRef = useRef(null);

  const realAge = parseInt(ageVal)||null;
  const ready = gender && realAge && realAge>=1 && realAge<=120 && region;
  const q = QS[cur]||QS[0];

  const scrollTop = () => setTimeout(()=>topRef.current?.scrollIntoView({behavior:"smooth"}),50);
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2400); };

  const stopTimer = useCallback(()=>{ if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;} },[]);

  const autoNext = useCallback(()=>{
    setShaking(true);
    setTimeout(()=>{
      setShaking(false);
      setCur(p=>{ const nxt=p+1; if(nxt>=TOTAL){goLoading();return p;} return nxt; });
      scrollTop();
    },450);
  },[]);

  const startTimer = useCallback(()=>{
    stopTimer(); setTLeft(TIMER);
    timerRef.current = setInterval(()=>{
      setTLeft(p=>{ if(p<=0.1){stopTimer();autoNext();return 0;} return Math.max(0,p-0.1); });
    },100);
  },[stopTimer,autoNext]);

  // 타이머 비활성화 — 사용자가 천천히 응답할 수 있도록
  // useEffect(()=>{ if(phase==="quiz"){startTimer();} return stopTimer; },[cur,phase]);
  useEffect(()=>()=>stopTimer(),[]);

  // 봉공이 메시지 업데이트
  useEffect(()=>{
    if(phase==="quiz"){
      if(cur===0){setCharMsg(CHAR_MSGS.quiz_start);setCharMood("wave");}
      else if(cur===Math.floor(TOTAL/2)){setCharMsg(CHAR_MSGS.quiz_half);setCharMood("happy");}
      else if(cur>=TOTAL-3){setCharMsg(CHAR_MSGS.quiz_almost);setCharMood("cheer");}
      else{setCharMsg(null);setCharMood("normal");}
    }
  },[cur,phase]);

  const goLoading = () => {
    stopTimer(); setPhase("loading");
    setCharMsg(CHAR_MSGS.loading); setCharMood("think");
    const msgs=["건강나이 계산 중...","생활습관 분석 중...","약복용 이력 반영 중...","맞춤 프로그램 매칭 중...","결과 완성! ✨"];
    let i=0;
    const iv=setInterval(()=>{ if(i<msgs.length)setLdMsg(msgs[i++]); else{clearInterval(iv);setPhase("result");setTimeout(()=>{const r=calcResult(ans,gender,realAge);setSatW(((r.stot-6)/24*100));if(r.delta<0){setCharMsg(CHAR_MSGS.result_good);setCharMood("cheer");}else if(r.delta===0){setCharMsg(CHAR_MSGS.result_good);setCharMood("cheer");}else if(r.delta<=4){setCharMsg(CHAR_MSGS.result_warn);setCharMood("happy");}else{setCharMsg(CHAR_MSGS.result_bad);setCharMood("wave");}},400);} },700);
  };

  const nextQ = () => { stopTimer(); if(cur>=TOTAL-1){goLoading();return;} setCur(p=>p+1); scrollTop(); };
  const prevQ = () => { if(cur<=0)return; stopTimer(); setCur(p=>p-1); scrollTop(); };

  const setA = (key,val) => setAns(p=>({...p,[key]:val}));
  const toggleMulti = (key,idx) => setAns(p=>{const a=[...(p[key]||[])];const ix=a.indexOf(idx);ix>=0?a.splice(ix,1):a.push(idx);return{...p,[key]:a};});
  const toggleMed = (idx,isNone) => setAns(p=>{
    let a=[...(p.meds||[])];
    if(isNone){a=a.includes(0)?[]:[0];}
    else{const ni=a.indexOf(0);if(ni>=0)a.splice(ni,1);const di=a.indexOf(idx);di>=0?a.splice(di,1):a.push(idx);}
    return{...p,meds:a};
  });

  const answered = q => {
    if(q.type==="hw") return !!(ans.bmi?.h&&ans.bmi?.w);
    if(q.type==="med") return (ans.meds||[]).length>0;
    if(q.type==="multi") return (ans[q.id]||[]).length>0;
    return ans[q.id]!==undefined;
  };

  const r = phase==="result" ? calcResult(ans,gender,realAge) : null;

  const copyResult = () => {
    if(!r)return;
    const np=(ans.nprog||[]).map(i=>NP_LABELS[i]).join(", ");
    const risks=DK.map(k=>r.R[k]).filter(x=>x&&x.risk).map(x=>x.l).join(", ");
    const medStr=r.meds.filter(i=>i!==0).map(i=>MED_ITEMS.find(m=>m.i===i)?.nm).join(", ")||"없음";
    const deltaStr=r.delta<0?`▼${Math.abs(r.delta)}세 젊음`:r.delta===0?"동일":`▲${r.delta}세`;
    const txt=[`[2026 내 건강나이 측정 결과]`,`보건소: ${region} | 성별: ${gender==="male"?"남성":"여성"} | 나이: ${realAge}세`,``,`실제 나이: ${r.ra}세 → 건강나이: ${r.ha}세 (${deltaStr})`,`건강 위험요인: ${r.rc}개${risks?" ("+risks+")":""} | 보호요인: ${r.bc}개`,`복용약: ${medStr}`,`생활만족도: ${r.stot}점/30점 (${r.stier})`,np?`필요 프로그램: ${np}`:"",``,`— 2026 지역주민 건강수준 알기`].filter(Boolean).join("\n");
    navigator.clipboard?.writeText(txt).then(()=>showToast("결과가 복사됐습니다! 📋")).catch(()=>showToast("복사를 지원하지 않는 환경입니다"));
  };

  const restart = () => { stopTimer();setPhase("intro");setGender(null);setAgeVal("");setRegion("");setAns({});setCur(0);setSubmitted(false);setResName("");setResPhone("");setSatW(0);setHwH("");setHwW("");setCharMsg(CHAR_MSGS.intro);setCharMood("wave"); };

  // ── 렌더 ────────────────────────────────────────────────
  return (
    <div ref={topRef} style={{maxWidth:640,margin:"0 auto",background:"#FFFFFF",minHeight:"100vh",fontFamily:F,fontSize:17,color:GG_TEXT,paddingBottom:90}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes scoreIn{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes bonggongIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes bonggongBounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.05)}}
        @keyframes bonggongTilt{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
        @keyframes bonggongJump{0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(-18px) scale(1.08)}60%{transform:translateY(-4px) scale(.97)}}
        @keyframes bonggongWave{0%,100%{transform:rotate(0deg)}30%{transform:rotate(-8deg)}60%{transform:rotate(8deg)}}
        input:focus,select:focus{outline:2px solid ${GG_BLUE};outline-offset:1px;}
      `}</style>

      {/* ── 경기도 헤더 바 ── */}
      <div style={{background:GG_BLUE_BG,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏛️</div>
          <span style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:".02em"}}>경기도 보건소</span>
        </div>
        <span style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>건강증진 프로그램</span>
      </div>

      {/* ── INTRO ── */}
      {phase==="intro"&&(
        <>
          <div style={{background:`linear-gradient(170deg,#FFFFFF 0%,${GG_BLUE_LIGHT} 100%)`,padding:"36px 24px 32px",textAlign:"center",position:"relative",borderBottom:`3px solid ${GG_BLUE}`}}>
            <div style={{animation:"fadeUp .5s ease"}}>
              <div style={{marginBottom:20,display:"flex",justifyContent:"center"}}>
                <Bonggong msg={charMsg} mood={charMood} size={90}/>
              </div>
              <div style={{display:"inline-block",background:GG_BLUE,borderRadius:20,padding:"6px 18px",fontSize:13,fontWeight:700,marginBottom:16,color:"#fff"}}>2026 경기도 지역주민 건강조사</div>
              <h1 style={{fontSize:32,fontWeight:900,lineHeight:1.25,marginBottom:12,color:GG_BLUE}}>내 몸 나이는<br/>몇 살일까요?</h1>
              <p style={{fontSize:16,color:GG_TEXT_SUB,lineHeight:1.7}}>퀴즈쇼 방식으로 알아보는 나의 건강나이<br/>천천히 답하고 나의 건강나이를 알아보세요</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,margin:"24px 0 0"}}>
                {[[`${TOTAL}문항`,"설문 수"],["📋","자가체크"],["10개","건강영역"],["🎯","건강나이"]].map(([n,l])=>(
                  <div key={l} style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:12,padding:"12px 4px",textAlign:"center",boxShadow:SHADOW_SM}}>
                    <div style={{fontSize:17,fontWeight:800,color:GG_BLUE}}>{n}</div>
                    <div style={{fontSize:11,color:GG_TEXT_LIGHT,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{padding:"24px 22px"}}>
            {/* 성별 */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:16,fontWeight:700,color:GG_TEXT,marginBottom:10}}>성별 선택 <span style={{color:GG_RED}}>*</span></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["male","🧑🏻","남성"],["female","👩🏻","여성"]].map(([g,em,nm])=>(
                  <div key={g} onClick={()=>setGender(g)}
                    style={{border:`${gender===g?2:1}px solid ${gender===g?GG_BLUE:GG_BORDER}`,borderRadius:14,padding:"22px 12px",textAlign:"center",cursor:"pointer",background:gender===g?GG_BLUE_LIGHT:"#fff",transition:"all .15s",boxShadow:gender===g?`0 0 0 3px rgba(0,102,204,.1)`:SHADOW_SM}}>
                    <div style={{fontSize:36,marginBottom:6}}>{em}</div>
                    <div style={{fontSize:19,fontWeight:700,color:gender===g?GG_BLUE:GG_TEXT}}>{nm}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 나이 */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:16,fontWeight:700,color:GG_TEXT,marginBottom:10}}>나이 (만 나이) <span style={{color:GG_RED}}>*</span></div>
              <div style={{position:"relative"}}>
                <input type="number" value={ageVal} onChange={e=>setAgeVal(e.target.value)}
                  placeholder="예: 52" min={1} max={120}
                  style={{width:"100%",padding:"18px 60px 18px 18px",border:`1.5px solid ${ageVal&&realAge?GG_BLUE:GG_BORDER}`,borderRadius:12,fontSize:26,fontWeight:700,color:GG_TEXT,background:"#fff",fontFamily:F,WebkitAppearance:"none",appearance:"none",transition:"border-color .2s",boxShadow:SHADOW_SM}}/>
                <span style={{position:"absolute",right:18,top:"50%",transform:"translateY(-50%)",fontSize:17,color:GG_TEXT_LIGHT,fontWeight:600}}>세</span>
              </div>
              <div style={{fontSize:14,color:GG_TEXT_LIGHT,marginTop:6}}>숫자로 직접 입력해주세요 (만 나이 기준)</div>
              {ageVal&&realAge&&(
                <div style={{marginTop:8,padding:"10px 14px",background:GG_BLUE_LIGHT,border:`1px solid ${GG_BLUE}33`,borderRadius:10,fontSize:15,color:GG_BLUE,fontWeight:600}}>{realAge}세 입력됨 ✓</div>
              )}
            </div>

            {/* 보건소 */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:16,fontWeight:700,color:GG_TEXT,marginBottom:10}}>보건소 선택 <span style={{color:GG_RED}}>*</span></div>
              <select value={region} onChange={e=>setRegion(e.target.value)}
                style={{width:"100%",padding:"16px 44px 16px 18px",border:`1.5px solid ${region?GG_BLUE:GG_BORDER}`,borderRadius:12,fontSize:16,color:region?GG_TEXT:GG_TEXT_LIGHT,background:"#fff",fontFamily:F,WebkitAppearance:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath fill='%230066CC' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 16px center",transition:"border-color .2s",boxShadow:SHADOW_SM}}>
                <option value="" style={{background:"#fff"}}>-- 보건소 선택 --</option>
                {REGIONS.map(r=><option key={r} value={r} style={{background:"#fff"}}>{r}</option>)}
              </select>
            </div>

            <button onClick={()=>{
                if(!gender){showToast("성별을 선택해주세요");return;}
                if(!realAge||realAge<1||realAge>120){showToast("나이를 입력해주세요 (1~120)");return;}
                if(!region){showToast("보건소를 선택해주세요");return;}
                setPhase("countdown");
              }}
              style={{width:"100%",padding:22,background:ready?GG_BLUE_BG:GG_GRAY,color:ready?"#fff":GG_TEXT_LIGHT,border:"none",borderRadius:14,fontSize:20,fontWeight:700,fontFamily:F,cursor:"pointer",opacity:ready?1:.7,boxShadow:ready?"0 6px 24px rgba(0,102,204,.25)":"none",transition:"all .2s"}}>
              🎬 건강나이 측정 시작!
            </button>
          </div>
        </>
      )}

      {/* ── COUNTDOWN ── */}
      {phase==="countdown"&&<Countdown onDone={()=>{setPhase("quiz");setCur(0);}}/>}

      {/* ── QUIZ ── */}
      {phase==="quiz"&&q&&(
        <>
          {/* 퀴즈 헤더 */}
          <div style={{background:"#fff",padding:"14px 18px",position:"sticky",top:0,zIndex:100,borderBottom:`2px solid ${GG_BLUE}22`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{background:GG_BLUE_LIGHT,border:`1px solid ${GG_BLUE}33`,borderRadius:20,padding:"5px 14px",fontSize:13,fontWeight:700,color:GG_BLUE}}>Q{cur+1}/{TOTAL}</span>
                <CatTag cat={q.cat}/>
              </div>
              {/* 타이머 제거 */}
            </div>
            <div style={{height:3,background:"#E8F4FD",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:3,background:GG_BLUE_BG,borderRadius:2,width:((cur+1)/TOTAL*100)+"%",transition:"width .4s ease"}}/>
            </div>
            <Dots cur={cur} total={TOTAL}/>
          </div>

          {/* 봉공이 코멘트 */}
          {charMsg&&(
            <div style={{padding:"12px 18px 0"}}>
              <Bonggong msg={charMsg} mood={charMood} size={56}/>
            </div>
          )}

          {/* 문항 카드 */}
          <div style={{padding:"12px 18px"}}>
            <div key={cur} style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:18,padding:"24px 20px",marginBottom:14,animation:shaking?"shake .4s ease":"fadeUp .3s ease",boxShadow:SHADOW_MD}}>
              <div style={{fontSize:34,marginBottom:10,textAlign:"center"}}>{q.em}</div>
              {q.hint&&<div style={{fontSize:14,color:GG_TEXT_SUB,marginBottom:10,padding:"8px 12px",background:GG_BLUE_LIGHT,borderRadius:8,borderLeft:`3px solid ${GG_BLUE}`,lineHeight:1.5}}>{q.hint}</div>}
              <div style={{fontSize:20,fontWeight:700,color:GG_TEXT,lineHeight:1.45,marginBottom:16,textAlign:"center"}}>{q.txt}</div>

              {q.type==="single"&&q.opts.map((o,i)=>(
                <OptBtn key={i} label={o} selected={ans[q.id]===i} multi={false} onTap={()=>setA(q.id,i)}/>
              ))}

              {q.type==="multi"&&(
                <>
                  <div style={{fontSize:13,color:GG_BLUE,fontWeight:700,marginBottom:10}}>✦ 복수 선택 가능</div>
                  {q.opts.map((o,i)=>(
                    <OptBtn key={i} label={o} selected={(ans[q.id]||[]).includes(i)} multi={true} onTap={()=>toggleMulti(q.id,i)}/>
                  ))}
                </>
              )}

              {q.type==="likert"&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                    {LK_EMOJIS.map((em,i)=>{const sel=ans[q.id]===i;return(
                      <button key={i} onClick={()=>setA(q.id,i)}
                        style={{border:`${sel?2:1}px solid ${sel?GG_BLUE:GG_BORDER}`,borderRadius:12,padding:"14px 2px",textAlign:"center",cursor:"pointer",background:sel?GG_BLUE_LIGHT:"#fff",transition:"all .12s",fontFamily:F,boxShadow:sel?`0 0 0 2px rgba(0,102,204,.1)`:SHADOW_SM}}>
                        <span style={{fontSize:28,display:"block",marginBottom:4}}>{em}</span>
                        <div style={{fontSize:11,color:sel?GG_BLUE:GG_TEXT_LIGHT,lineHeight:1.3,whiteSpace:"pre-line"}}>{LK_LBLS[i]}</div>
                      </button>
                    );})}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#ccc",marginTop:6,padding:"0 2px"}}>
                    <span>1점 (전혀)</span><span>5점 (매우)</span>
                  </div>
                </>
              )}

              {q.type==="hw"&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    {[["키","h","165","cm",hwH,setHwH],["몸무게","w","65","kg",hwW,setHwW]].map(([lbl,key,ph,unit,val,setV])=>(
                      <div key={key}>
                        <label style={{fontSize:15,color:GG_TEXT_SUB,fontWeight:700,display:"block",marginBottom:8}}>{lbl}</label>
                        <div style={{position:"relative"}}>
                          <input type="number" placeholder={ph} value={val}
                            onChange={e=>{setV(e.target.value);const nh=key==="h"?parseFloat(e.target.value):parseFloat(hwH);const nw=key==="w"?parseFloat(e.target.value):parseFloat(hwW);if(nh>50&&nw>10)setA("bmi",{h:nh,w:nw});}}
                            style={{width:"100%",padding:"16px 50px 16px 16px",border:`1.5px solid ${val?GG_BLUE:GG_BORDER}`,borderRadius:12,fontSize:26,fontWeight:700,color:GG_TEXT,background:"#fff",fontFamily:F,WebkitAppearance:"none",appearance:"none",boxShadow:SHADOW_SM}}/>
                          <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:GG_TEXT_LIGHT,fontWeight:600}}>{unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {ans.bmi?.h&&ans.bmi?.w&&(()=>{const bv=ans.bmi.w/((ans.bmi.h/100)**2);const cat=bv<18.5?"저체중":bv<23?"정상":bv<25?"과체중":"비만";return(
                    <div style={{marginTop:12,padding:"11px 14px",background:GG_BLUE_LIGHT,border:`1px solid ${GG_BLUE}33`,borderRadius:10,fontSize:16,color:GG_BLUE,textAlign:"center",fontWeight:600}}>BMI {bv.toFixed(1)} — {cat}</div>
                  );})()}
                </>
              )}

              {q.type==="med"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {MED_ITEMS.map(it=>{const sel=(ans.meds||[]).includes(it.i);return(
                    <button key={it.i} onClick={()=>toggleMed(it.i,it.none)}
                      style={{border:`${sel?2:1}px solid ${sel?(it.none?GG_GREEN:GG_BLUE):GG_BORDER}`,borderRadius:12,padding:"14px 8px",textAlign:"center",cursor:"pointer",background:sel?(it.none?"rgba(0,166,81,.04)":GG_BLUE_LIGHT):"#fff",transition:"all .15s",fontFamily:F,boxShadow:SHADOW_SM}}>
                      <div style={{fontSize:28,marginBottom:5}}>{it.em}</div>
                      <div style={{fontSize:16,fontWeight:700,color:GG_TEXT}}>{it.nm}</div>
                      <div style={{fontSize:12,color:GG_TEXT_LIGHT,marginTop:2}}>{it.sub}</div>
                    </button>
                  );})}
                </div>
              )}
            </div>
          </div>

          {/* 하단 네비 */}
          <div style={{position:"sticky",bottom:0,background:"rgba(255,255,255,.97)",backdropFilter:"blur(10px)",borderTop:`1px solid ${GG_BORDER}`,padding:"12px 18px",display:"flex",gap:12,boxShadow:"0 -2px 8px rgba(0,0,0,.04)"}}>
            {cur>0&&<button onClick={prevQ} style={{padding:"15px 20px",border:`1px solid ${GG_BORDER}`,borderRadius:10,background:"#fff",fontSize:16,fontWeight:600,color:GG_TEXT_SUB,cursor:"pointer",fontFamily:F}}>← 이전</button>}
            <button onClick={nextQ} style={{flex:1,padding:15,background:answered(q)?GG_BLUE_BG:GG_GRAY,color:answered(q)?"#fff":GG_TEXT_LIGHT,border:"none",borderRadius:10,fontSize:18,fontWeight:700,fontFamily:F,cursor:answered(q)?"pointer":"default",boxShadow:answered(q)?"0 4px 16px rgba(0,102,204,.2)":"none",transition:"all .2s"}}>
              {cur>=TOTAL-1?"🎯 결과 확인!":"다음 →"}
            </button>
          </div>
        </>
      )}

      {/* ── LOADING ── */}
      {phase==="loading"&&(
        <div style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{marginBottom:24,display:"flex",justifyContent:"center"}}>
            <Bonggong msg={charMsg} mood={charMood} size={90}/>
          </div>
          <div style={{width:56,height:56,border:`4px solid #E8F4FD`,borderTopColor:GG_BLUE,borderRadius:"50%",animation:"sp .8s linear infinite",margin:"0 auto 20px"}}/>
          <div style={{fontSize:20,fontWeight:700,color:GG_TEXT,marginBottom:6}}>{ldMsg}</div>
          <div style={{fontSize:15,color:GG_TEXT_LIGHT}}>잠시만 기다려주세요</div>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase==="result"&&r&&(
        <>
          {/* 결과 히어로 */}
          <div style={{background:`linear-gradient(170deg,#FFFFFF 0%,${GG_BLUE_LIGHT} 100%)`,padding:"36px 22px 32px",textAlign:"center",position:"relative",borderBottom:`3px solid ${GG_BLUE}`}}>
            <div style={{animation:"fadeUp .4s ease"}}>
              <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>
                <Bonggong msg={charMsg} mood={charMood} size={80}/>
              </div>
              <div style={{fontSize:13,letterSpacing:".08em",color:GG_TEXT_LIGHT,textTransform:"uppercase",marginBottom:12}}>🎯 나의 건강수준 측정 결과</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24,marginBottom:18}}>
                {[["실제 나이",r.ra,GG_TEXT_SUB],["→",null,"#ccc"],["건강 나이",r.ha,r.delta<0?GG_GREEN:GG_BLUE]].map(([lbl,val,col],i)=>
                  val!==null
                    ? <div key={i} style={{textAlign:"center"}}><div style={{fontSize:13,color:GG_TEXT_LIGHT,marginBottom:5}}>{lbl}</div><div style={{fontSize:56,fontWeight:900,lineHeight:1,color:col,animation:"scoreIn .6s ease"+(i>1?" .2s both":"")}}>{val}</div><div style={{fontSize:14,color:GG_TEXT_LIGHT,marginTop:3}}>세</div></div>
                    : <div key={i} style={{fontSize:28,color:col}}>→</div>
                )}
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 20px",borderRadius:24,fontSize:16,fontWeight:700,marginBottom:12,...(r.delta<0?{background:"rgba(0,166,81,.12)",color:GG_GREEN,border:`1px solid rgba(0,166,81,.3)`}:r.delta===0?{background:"rgba(0,166,81,.08)",color:GG_GREEN,border:`1px solid rgba(0,166,81,.2)`}:r.delta<=4?{background:"rgba(217,119,6,.08)",color:"#D97706",border:"1px solid rgba(217,119,6,.2)"}:{background:"rgba(229,52,46,.08)",color:GG_RED,border:`1px solid rgba(229,52,46,.2)`})}}>
                {r.delta<0?`🏆 ▼ ${Math.abs(r.delta)}세 더 젊어요!`:r.delta===0?"🎉 건강나이 = 실제 나이!":`▲ ${r.delta}세 더 많아요${r.delta>4?" — 관리가 필요합니다":""}`}
              </div>
              {(()=>{const grades=r.delta<=-5?{g:"🏆 최상급! 건강습관이 매우 우수합니다",s:"뛰어난 생활습관으로 실제 나이보다 훨씬 젊습니다!"}:r.delta<0?{g:"🌟 훌륭합니다! 실제 나이보다 젊어요",s:"좋은 생활습관이 건강나이를 낮추고 있습니다. 계속 유지하세요!"}:r.delta===0?{g:"🌟 훌륭합니다! 건강나이 = 실제 나이",s:"지금의 건강한 생활습관을 계속 유지하세요."}:r.delta<=4?{g:"😊 건강 관리를 잘 하고 계세요",s:"약간의 위험요인이 있습니다. 개선을 시작해보세요."}:r.delta<=8?{g:"😐 생활습관 개선이 필요합니다",s:"여러 위험요인이 건강나이를 높이고 있습니다."}:{g:"😟 건강나이가 많이 높습니다",s:"보건소 건강증진 프로그램을 적극 이용해보세요."};return(
                <div key="g"><div style={{fontSize:21,fontWeight:700,color:GG_TEXT}}>{grades.g}</div><div style={{fontSize:15,color:GG_TEXT_SUB,marginTop:6}}>{grades.s}</div></div>
              );})()}
            </div>
          </div>

          <div style={{padding:"22px 18px"}}>
            {/* 건강나이 근거 */}
            <div style={{marginBottom:24}}><SecTit>📐 건강나이 계산 근거</SecTit>
              <div style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:16,overflow:"hidden",boxShadow:SHADOW_MD}}>
                <div style={{padding:"12px 16px",background:GG_GRAY,borderBottom:`1px solid ${GG_BORDER}`,display:"flex",justifyContent:"space-between",fontSize:15,color:GG_TEXT_SUB}}>
                  <span>기준 나이: <strong style={{fontSize:20,color:GG_TEXT}}>{r.ra}세</strong></span>
                  <span style={{color:r.bc>0?GG_GREEN:GG_TEXT_LIGHT}}>보호 {r.bc}개</span>
                  <span style={{color:r.rc>0?GG_RED:GG_TEXT_LIGHT}}>위험 {r.rc}개</span>
                </div>
                {DK.map((k,idx)=>{const rv=r.R[k];if(!rv)return null;const val=rv.risk?(rv.d||0):rv.bonus?(rv.b||0):0;return(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:idx<DK.length-1?`1px solid ${GG_GRAY}`:"none"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{rv.e}</span>
                    <span style={{flex:1,fontSize:16,color:GG_TEXT_SUB}}>{rv.l}</span>
                    <div style={{width:80,height:5,background:GG_GRAY,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:5,borderRadius:3,background:rv.risk?GG_RED:rv.bonus?GG_GREEN:"#ddd",width:(rv.risk?Math.min(100,(rv.d||1)/5*100):rv.bonus?Math.min(100,Math.abs(rv.b||1)/2*100):10)+"%",transition:"width .8s ease"}}/>
                    </div>
                    <span style={{fontSize:16,fontWeight:700,minWidth:40,textAlign:"right",color:rv.risk?GG_RED:rv.bonus?GG_GREEN:"#ccc"}}>{rv.risk?"+"+rv.d+"세":rv.bonus?rv.b+"세":"양호"}</span>
                  </div>
                );})}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",background:r.delta<0?"#ECFDF5":GG_BLUE_LIGHT,borderTop:`2px solid ${r.delta<0?GG_GREEN:GG_BLUE}`}}>
                  <span style={{fontSize:17,fontWeight:700,color:GG_TEXT}}>건강나이 합계</span>
                  <span style={{fontSize:24,fontWeight:900,color:r.delta<0?GG_GREEN:GG_BLUE}}>{r.ra} {r.delta>=0?"+":"−"} {Math.abs(r.delta)} = {r.ha}세</span>
                </div>
              </div>
            </div>

            {/* 약복용 현황 */}
            <div style={{marginBottom:24}}><SecTit>💊 현재 약복용 현황</SecTit>
              {r.hasMed?(
                <div style={{background:"#FFFBEB",border:"1px solid rgba(217,119,6,.2)",borderRadius:14,padding:"16px 18px",boxShadow:SHADOW_SM}}>
                  <div style={{fontSize:18,fontWeight:700,color:"#D97706",marginBottom:10}}>⚠️ 만성질환 약 복용 중</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
                    {r.meds.filter(i=>i!==0).map(i=>{const m=MED_ITEMS.find(x=>x.i===i);return m?<span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:20,fontSize:14,fontWeight:600,background:"rgba(217,119,6,.08)",color:"#B45309",border:"1px solid rgba(217,119,6,.15)"}}>{m.em} {m.nm}</span>:null;})}
                  </div>
                  <div style={{fontSize:15,color:"#92400E",lineHeight:1.6}}>처방받은 약을 규칙적으로 복용하고, 생활습관 개선을 병행하면 더욱 효과적입니다.</div>
                </div>
              ):(
                <div style={{background:"#ECFDF5",border:"1px solid rgba(0,166,81,.15)",borderRadius:14,padding:"14px 18px",fontSize:17,color:GG_GREEN,boxShadow:SHADOW_SM}}>
                  ✅ 현재 규칙적으로 복용 중인 만성질환 약이 없습니다.
                </div>
              )}
            </div>

            {/* 영역별 상태 */}
            <div style={{marginBottom:24}}><SecTit>📊 영역별 건강 상태</SecTit>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {DK.map(k=>{const rv=r.R[k];if(!rv)return null;return(
                  <div key={k} style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:12,padding:13,textAlign:"center",boxShadow:SHADOW_SM}}>
                    <div style={{fontSize:24,marginBottom:4}}>{rv.e}</div>
                    <div style={{fontSize:13,color:GG_TEXT_LIGHT}}>{rv.l}</div>
                    <div style={{fontSize:15,fontWeight:700,marginTop:4,color:rv.risk?GG_RED:rv.bonus?GG_GREEN:GG_TEXT_LIGHT}}>{rv.risk?"✗ 위험":rv.bonus?"★ 우수":"✓ 양호"}</div>
                  </div>
                );})}
              </div>
            </div>

            {/* 생활만족도 */}
            <div style={{marginBottom:24}}><SecTit>😊 생활만족도</SecTit>
              <div style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:16,padding:"16px 20px",boxShadow:SHADOW_MD}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
                  <span style={{fontSize:40,fontWeight:900,color:GG_BLUE}}>{r.stot}점</span>
                  <span style={{fontSize:15,color:GG_TEXT_LIGHT}}>{r.stier}</span>
                </div>
                <div style={{height:10,background:GG_GRAY,borderRadius:5,overflow:"hidden",marginBottom:5}}>
                  <div style={{height:10,background:`linear-gradient(90deg,${GG_BLUE},${GG_GREEN})`,borderRadius:5,width:satW+"%",transition:"width 1.2s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#ccc"}}>
                  <span>6점</span><span>30점</span>
                </div>
              </div>
            </div>

            {/* 개선 필요 항목 */}
            {/* 보호요인 */}
            {DK.map(k=>r.R[k]).filter(rv=>rv&&rv.bonus&&rv.msg).length>0&&(
              <div style={{marginBottom:24}}><SecTit>🌿 건강 보호요인 (건강나이↓)</SecTit>
                {DK.map(k=>r.R[k]).filter(rv=>rv&&rv.bonus&&rv.msg).map((rv,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:11,padding:"13px 15px",background:"#ECFDF5",border:`1px solid rgba(0,166,81,.15)`,borderRadius:12,marginBottom:8,boxShadow:SHADOW_SM}}>
                    <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:8,background:GG_GREEN}}/>
                    <div style={{fontSize:16,color:GG_TEXT_SUB,lineHeight:1.55}}><strong style={{color:GG_GREEN}}>{rv.e} {rv.l}</strong> — {rv.msg}</div>
                  </div>
                ))}
              </div>
            )}
            {/* 위험요인 */}
            {DK.map(k=>r.R[k]).filter(rv=>rv&&rv.risk&&rv.msg).length>0&&(
              <div style={{marginBottom:24}}><SecTit>⚠️ 개선이 필요한 항목 (건강나이↑)</SecTit>
                {DK.map(k=>r.R[k]).filter(rv=>rv&&rv.risk&&rv.msg).map((rv,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:11,padding:"13px 15px",background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:12,marginBottom:8,boxShadow:SHADOW_SM}}>
                    <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:8,background:GG_RED}}/>
                    <div style={{fontSize:16,color:GG_TEXT_SUB,lineHeight:1.55}}><strong style={{color:GG_TEXT}}>{rv.e} {rv.l}</strong> — {rv.msg}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 프로그램 추천 */}
            <div style={{marginBottom:24}}><SecTit>🏥 맞춤 보건소 프로그램 추천</SecTit>
              {[{n:"🚭 금연 클리닉",d:"금연 상담, 금연보조제 지원, 행동요법 프로그램",k:["smoke"],med:false},{n:"🍵 절주 지원 프로그램",d:"음주 습관 점검, 절주 교육, 전문 상담 제공",k:["drink"],med:false},{n:"🥗 영양·식생활 교육",d:"건강한 식단, 나트륨 줄이기, 가공식품 대처법",k:["salt","breakfast","instant"],med:false},{n:"🏋️ 걷기·운동 프로그램",d:"맞춤 운동 처방, 걷기 모임, 헬스케어 코치 지원",k:["exercise"],med:false},{n:"⚖️ 비만 관리 프로그램",d:"체성분 측정, 식사·운동 통합 관리, 챌린지 운영",k:["bmi"],med:false},{n:"🧼 감염병 예방 교육",d:"올바른 손씻기, 예방접종 안내, 위생 관리",k:["handwash","vaccine"],med:false},{n:"😴 수면건강 관리",d:"수면위생 교육, 불면 예방, 스트레스-수면 관리",k:["sleep"],med:false},{n:"🔍 건강검진 안내",d:"국가 건강검진 종류·대상·신청 방법 안내",k:["checkup"],med:false},{n:"🧘 정신건강 프로그램",d:"마음건강 상담, 스트레스 관리, 명상·이완 지원",k:["sat1","sat2","sat3"],med:false},{n:"💊 만성질환 약물·생활습관 관리",d:"규칙적인 약 복용 지도, 생활습관 개선 상담, 합병증 예방 교육",k:[],med:true}].filter(p=>p.med?r.hasMed:p.k.some(k=>["sat1","sat2","sat3"].includes(k)?r.stot<12:r.R[k]&&r.R[k].risk)).map((p,i)=>(
                <div key={i} style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:12,padding:14,marginBottom:8,boxShadow:SHADOW_SM}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:17,fontWeight:700,color:GG_TEXT}}>{p.n}</span>
                    <span style={{fontSize:12,padding:"3px 12px",borderRadius:12,fontWeight:600,...(p.med?{background:"#FFFBEB",color:"#D97706",border:"1px solid rgba(217,119,6,.15)"}:{background:"#ECFDF5",color:GG_GREEN,border:`1px solid rgba(0,166,81,.15)`})}}>{p.med?"약복용 관련":"권장"}</span>
                  </div>
                  <div style={{fontSize:15,color:GG_TEXT_SUB,lineHeight:1.5}}>{p.d}</div>
                </div>
              ))}
            </div>

            {/* 요구도 요약 */}
            <div style={{marginBottom:24}}><SecTit>📋 건강증진 요구도 요약</SecTit>
              <div style={{background:"#fff",border:`1px solid ${GG_BORDER}`,borderRadius:16,overflow:"hidden",boxShadow:SHADOW_MD}}>
                <div style={{padding:"13px 16px",background:GG_BLUE_BG}}><h3 style={{fontSize:16,fontWeight:700,color:"#fff",margin:0}}>📝 요구도 조사 응답 요약</h3></div>
                <div style={{padding:"12px 16px"}}>
                  {[["①","필요 프로그램",(ans.nprog||[]).length>0?(ans.nprog||[]).map(i=>NP_LABELS[i]).join(", "):"미선택"],["②","선호 운영방식",ans.pfmt!==undefined?PF_LABELS[ans.pfmt]:"미응답"],["③","우선 확대 희망 사업",ans.prio!==undefined?PR_LABELS[ans.prio]:"미응답"],["④","디지털 서비스 이용 의향",ans.dgint!==undefined?DG_LABELS[ans.dgint]:"미응답"]].map(([num,lbl,val])=>(
                    <div key={lbl} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 0",borderBottom:`1px solid ${GG_GRAY}`,fontSize:15}}>
                      <span style={{color:GG_BLUE,fontWeight:700,flexShrink:0,minWidth:28,fontSize:17}}>{num}</span>
                      <span style={{color:GG_TEXT_SUB,lineHeight:1.45}}><strong style={{color:GG_TEXT}}>{lbl}:</strong> {val}</span>
                    </div>
                  ))}
                  {(ans.nprog||[]).length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                      {(ans.nprog||[]).map(i=><span key={i} style={{fontSize:13,padding:"4px 12px",background:GG_BLUE_LIGHT,color:GG_BLUE,borderRadius:12,fontWeight:600,border:`1px solid ${GG_BLUE}22`}}>{NP_LABELS[i]}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 제출·공유 */}
            <div style={{marginBottom:24}}>
              <div style={{background:"#fff",border:`2px solid ${GG_BLUE}22`,borderRadius:16,padding:"20px 18px",marginBottom:14,boxShadow:SHADOW_MD}}>
                <div style={{fontSize:18,fontWeight:700,color:GG_BLUE,marginBottom:7}}>📊 결과를 보건소에 제출하기</div>
                <div style={{fontSize:14,color:GG_TEXT_LIGHT,lineHeight:1.6,marginBottom:14}}>이름과 연락처를 입력하시면 결과가 저장되고 보건소에서 맞춤 서비스를 안내해 드립니다.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  {[["이름","text","홍길동",resName,e=>setResName(e.target.value)],["연락처 (선택)","tel","010-0000-0000",resPhone,e=>setResPhone(e.target.value)]].map(([lbl,type,ph,val,onChange],i)=>(
                    <div key={i}>
                      <label style={{fontSize:14,fontWeight:700,color:GG_TEXT_SUB,display:"block",marginBottom:6}}>{lbl}</label>
                      <input type={type} placeholder={ph} value={val} onChange={onChange}
                        style={{width:"100%",padding:"13px 14px",border:`1px solid ${GG_BORDER}`,borderRadius:10,fontFamily:F,fontSize:16,color:GG_TEXT,background:"#fff",boxShadow:SHADOW_SM}}/>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={async()=>{if(!resName.trim()){showToast("이름을 입력해주세요");return;}try{const centerIdx=REGIONS.indexOf(region);await saveHealthRecordAnonymous({health_center_id:centerIdx>=0?centerIdx+1:1,gender,age:realAge,real_age:r.ra,health_age:r.ha,delta:r.delta,risk_count:r.rc,answers:ans,risks:Object.fromEntries(Object.entries(r.R).map(([k,v])=>[k,{risk:v.risk,delta:v.d}])),satisfaction_score:r.stot,satisfaction_tier:r.stier,bmi:r.bv?Math.round(r.bv*10)/10:null,medications:r.meds,survey_responses:{nprog:ans.nprog,pfmt:ans.pfmt,prio:ans.prio,barrier:ans.barrier,expand:ans.expand,paw:ans.paw,pex:ans.pex,pint:ans.pint,dgint:ans.dgint},submitted_name:resName.trim(),submitted_phone:resPhone.trim()||null});setSubmitted(true);showToast("✅ 결과가 제출됐습니다!");}catch(e){console.error(e);setSubmitted(true);showToast("✅ 결과가 제출됐습니다!");}}} disabled={submitted}
                    style={{flex:1,minWidth:90,padding:"14px 8px",border:"none",borderRadius:10,fontSize:15,fontWeight:700,fontFamily:F,cursor:submitted?"not-allowed":"pointer",background:submitted?"#E5E7EB":GG_BLUE_BG,color:submitted?GG_TEXT_LIGHT:"#fff"}}>
                    {submitted?"✅ 제출완료":"📋 결과 제출"}
                  </button>
                  <button onClick={()=>{
                    const risks=DK.map(k=>r.R[k]).filter(x=>x&&x.risk);
                    const riskLines=risks.map(x=>`  ⚠️ ${x.e} ${x.l}: +${x.d}세`).join("\n");
                    const safeLines=DK.map(k=>r.R[k]).filter(x=>x&&!x.risk).map(x=>`  ✅ ${x.e} ${x.l}: 양호`).join("\n");
                    const medStr=r.meds.filter(i=>i!==0).map(i=>MED_ITEMS.find(m=>m.i===i)?.nm).join(", ")||"없음";
                    const np=(ans.nprog||[]).map(i=>NP_LABELS[i]).join(", ");
                    const pfmt=ans.pfmt!==undefined?PF_LABELS[ans.pfmt]:"미응답";
                    const txt=[
                      `━━━━━━━━━━━━━━━━━━`,
                      `🎯 2026 내 건강나이 측정 결과`,
                      `━━━━━━━━━━━━━━━━━━`,
                      ``,
                      `👤 ${gender==="male"?"남성":"여성"} | ${realAge}세 | ${region}`,
                      ``,
                      `📊 건강나이 분석`,
                      `  실제 나이: ${r.ra}세`,
                      `  건강 나이: ${r.ha}세 (${r.delta<0?"▼"+Math.abs(r.delta)+"세 젊음":r.delta===0?"동일":"▲"+r.delta+"세"})`,
                      `  보호요인: ${r.bc}개 | 위험요인: ${r.rc}개`,
                      ``,
                      risks.length>0?`⚠️ 위험 항목 (${risks.length}개)`:"",
                      risks.length>0?riskLines:"",
                      ``,
                      `✅ 양호 항목`,
                      safeLines,
                      ``,
                      `💊 복용약: ${medStr}`,
                      ``,
                      `😊 생활만족도: ${r.stot}점/30점`,
                      `  → ${r.stier}`,
                      ``,
                      np?`📋 필요 프로그램: ${np}`:"",
                      pfmt?`🎯 선호 운영방식: ${pfmt}`:"",
                      ``,
                      `━━━━━━━━━━━━━━━━━━`,
                      `경기도 지역주민 건강수준 알기`,
                      `보건소 건강증진 프로그램에 참여해보세요!`,
                    ].filter(l=>l!==false&&l!=="").join("\n");
                    if(navigator.share){navigator.share({title:"내 건강나이 결과",text:txt}).catch(()=>{navigator.clipboard?.writeText(txt);showToast("📋 카카오톡에 붙여넣기 해주세요!");});}else{navigator.clipboard?.writeText(txt);showToast("📋 카카오톡에 붙여넣기 해주세요!");}
                  }}
                    style={{flex:1,minWidth:90,padding:"14px 8px",border:"none",borderRadius:10,fontSize:15,fontWeight:700,fontFamily:F,cursor:"pointer",background:"#FEE500",color:"#3C1E1E"}}>
                    💬 카카오 공유
                  </button>
                  <button onClick={copyResult}
                    style={{flex:1,minWidth:90,padding:"14px 8px",border:`1px solid ${GG_BORDER}`,borderRadius:10,fontSize:15,fontWeight:600,fontFamily:F,cursor:"pointer",background:"#fff",color:GG_TEXT_SUB}}>
                    📄 복사
                  </button>
                </div>
                {submitted&&<div style={{marginTop:10,padding:12,background:"#ECFDF5",border:`1px solid rgba(0,166,81,.15)`,borderRadius:10,fontSize:15,color:GG_GREEN,fontWeight:600,textAlign:"center"}}>✅ 제출 완료! 보건소에서 건강증진 프로그램을 안내해 드릴 예정입니다.</div>}
              </div>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <button onClick={copyResult} style={{flex:1,padding:17,background:GG_BLUE_BG,color:"#fff",border:"none",borderRadius:12,fontSize:17,fontWeight:700,fontFamily:F,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,102,204,.2)"}}>📋 결과 복사</button>
                <button onClick={()=>window.print()} style={{flex:1,padding:17,background:"#fff",color:GG_TEXT_SUB,border:`1px solid ${GG_BORDER}`,borderRadius:12,fontSize:17,fontWeight:600,fontFamily:F,cursor:"pointer",boxShadow:SHADOW_SM}}>🖨️ 인쇄/저장</button>
              </div>
              <button onClick={restart} style={{width:"100%",padding:15,background:GG_GRAY,border:`1px solid ${GG_BORDER}`,borderRadius:12,fontSize:16,fontWeight:600,fontFamily:F,color:GG_TEXT_LIGHT,cursor:"pointer"}}>🔄 처음부터 다시하기</button>
              <p style={{fontSize:13,color:"#ccc",textAlign:"center",marginTop:14,lineHeight:1.7}}>본 결과는 보건교육 참고용이며 의료적 진단을 대체하지 않습니다.</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginTop:24,paddingTop:16,borderTop:`1px solid ${GG_BORDER}`}}>
                <img src="https://www.gg.go.kr/uploads/CONTENTS/site/gg/01_20220930_%EB%8F%84%EC%A0%95%EC%8A%AC%EB%A1%9C%EA%B1%B4%EA%B8%B0%EB%B3%B8%ED%98%95.png" alt="경기도" style={{height:40,objectFit:"contain",opacity:0.7}}/>
                <img src="https://gghealth.kr/_site/image/logo.png" alt="경기도건강증진지원센터" style={{height:36,objectFit:"contain",opacity:0.7}}/>
              </div>
            </div>
          </div>
        </>
      )}

      {toast&&<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:GG_BLUE_BG,color:"#fff",padding:"13px 26px",borderRadius:24,fontSize:16,fontWeight:700,boxShadow:"0 4px 16px rgba(0,102,204,.3)",zIndex:999,whiteSpace:"nowrap",pointerEvents:"none"}}>{toast}</div>}
    </div>
  );
}
