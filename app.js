const defaultStudents = [[1,'강우진'],[2,'고윤아'],[3,'곽도영'],[4,'권수연'],[5,'김나현'],[6,'김도윤'],[8,'김시우'],[9,'김지안'],[10,'노하은'],[11,'류시온'],[12,'박건우'],[13,'박민서'],[14,'박서준'],[15,'배수민'],[16,'백지우'],[17,'서예진'],[18,'송하민'],[19,'신지호'],[20,'안도현'],[21,'오은재'],[22,'윤서아'],[23,'이도현'],[24,'이수아'],[25,'장민재'],[26,'정시아'],[27,'조이한'],[28,'최유진']];
const $=id=>document.getElementById(id);
const ROSTER_KEY='classroom-roster-v1';
function validateRoster(rows){
 if(!Array.isArray(rows)||rows.length>200)throw Error('명단은 200행 이내로 입력해 주세요.');
 const used=new Set(),clean=[];
 for(let i=0;i<rows.length;i++){
  if(!Array.isArray(rows[i])||rows[i].length!==2)throw Error('번호와 이름을 확인해 주세요.');
  const num=String(rows[i][0]).trim(),name=String(rows[i][1]).trim();
  if(!num&&!name)continue;
  if(!/^\d+$/.test(num)||Number(num)<1||!Number.isSafeInteger(Number(num)))throw Error(`${i+1}행: 번호는 1 이상의 정수로 입력해 주세요.`);
  if(used.has(Number(num)))throw Error(`${num}번이 중복되어 있어요. 번호를 확인해 주세요.`);
  if(name.length>40)throw Error(`${num}번: 이름은 40자 이내로 입력해 주세요.`);
  used.add(Number(num));clean.push([Number(num),name]);
 }
 if(clean.filter(r=>r[1]).length>30)throw Error('이름이 있는 학생은 최대 30명까지 등록할 수 있어요.');
 return clean;
}
let roster=Array.from({length:28},(_,i)=>[i+1,defaultStudents.find(s=>s[0]===i+1)?.[1]||'']);
try{const saved=localStorage.getItem(ROSTER_KEY);if(saved!==null)roster=validateRoster(JSON.parse(saved));}catch{}
let students=roster.filter(s=>s[1]);
let seats=Array(30).fill(null), timer=null, audio=null, running=false;
function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeLayout(roster){
 if(roster.length>30)throw new Error('최대 30명까지 배치할 수 있습니다.');
 const people=shuffle(roster),result=Array(30).fill(null);
 const pairs=Math.floor(people.length/2);
 // 화면 아래에서부터 완전한 짝을 채운다. 홀수 학생용 책상은 맨 뒷줄에 확보한다.
 const back=shuffle([0,1,2]);
 const deskOrder=[];
 for(let row=4;row>=1;row--)deskOrder.push(...shuffle([0,1,2]).map(col=>row*3+col));
 deskOrder.push(...back);
 for(let p=0;p<pairs;p++){const d=deskOrder[p];result[d*2]=people[p*2];result[d*2+1]=people[p*2+1];}
 if(people.length%2){const d=back.find(d=>result[d*2]===null);result[d*2+Math.floor(Math.random()*2)]=people[people.length-1];}
 return result;
}
function render(){
 $('desks').replaceChildren();
 for(let d=0;d<15;d++){
  const desk=document.createElement('div');desk.className='desk';
  for(let side=0;side<2;side++){
   const s=seats[d*2+side],cell=document.createElement('div');cell.className='seat '+(s?'occupied':'empty');
   cell.setAttribute('aria-label',`${d%3+1}분단 앞에서 ${5-Math.floor(d/3)}번째 줄 ${side?'오른쪽':'왼쪽'}: ${s?s[0]+'번 '+s[1]:'빈자리'}`);
   if(s){const n=document.createElement('span');n.className='number';n.textContent=s[0]+'번';const name=document.createElement('span');name.className='name';name.textContent=s[1];cell.append(n,name);}else cell.textContent='빈자리';desk.append(cell);
  }$('desks').append(desk);
 }
 $('student-count').textContent=students.length;$('roster-summary').textContent=`명단 ${students.length}명 반영 · 이름이 없는 번호 제외`;$('shuffle').disabled=running||students.length===0;
 const count=seats.filter(Boolean).length;$('capture').disabled=!count||running;$('badge').textContent=count?'배치 완료':'배치 준비';$('seat-summary').textContent=count?`${count}명 배치 · 빈자리 ${30-count}개`:'30좌석 · 모두 빈자리';
}
function beep(final=false){if(!$('sound').checked||!audio)return;try{const t=audio.currentTime;const notes=final?[523.25,659.25,783.99]:[440];notes.forEach((freq,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;o.connect(g);g.connect(audio.destination);const start=t+i*.12;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.12,start+.012);g.gain.exponentialRampToValueAtTime(.001,start+(final?.4:.14));o.start(start);o.stop(start+(final?.45:.18));});}catch{}}
function stopCountdown(){clearTimeout(timer);timer=null;running=false;$('countdown').hidden=true;document.querySelector('main').inert=false;$('shuffle').disabled=false;$('shuffle').focus();}
function start(){
 if(running||!students.length)return;
 if($('sound').checked){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{}}
 running=true;$('shuffle').disabled=true;$('capture').disabled=true;$('countdown').hidden=false;document.querySelector('main').inert=true;$('cancel').focus();
 let remaining=10;$('count-number').textContent=remaining;beep();
 const tick=()=>{remaining--;if(remaining>0){$('count-number').textContent=remaining;beep();timer=setTimeout(tick,1000);}else{stopCountdown();seats=makeLayout(students);render();beep(true);$('status').textContent='새로운 자리 완성! 새 짝꿍에게 반갑게 인사해 보세요.';}};
 timer=setTimeout(tick,1000);
}
$('shuffle').addEventListener('click',start);
$('reset').addEventListener('click',()=>{stopCountdown();seats=Array(30).fill(null);render();$('status').textContent='모든 자리를 비웠어요. 랜덤 셔플로 다시 시작해 보세요.';});
function cancel(){stopCountdown();render();$('status').textContent='카운트다운을 취소했어요. 다시 셔플할 수 있어요.';}
$('cancel').addEventListener('click',cancel);document.addEventListener('keydown',e=>{if(running&&e.key==='Escape')cancel();});
async function capture(){
 if(running||!seats.some(Boolean))return;
 $('capture').disabled=true;
 try{
 await document.fonts.ready;
 const c=document.createElement('canvas');c.width=1800;c.height=1720;const x=c.getContext('2d');x.scale(2,2);
 const rect=(a,b,w,h,color,r=8)=>{x.fillStyle=color;x.beginPath();x.roundRect(a,b,w,h,r);x.fill();};
 const txt=(s,a,b,size,color='#233d35',weight=400)=>{x.fillStyle=color;x.font=`${weight} ${size}px sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(s,a,b,size===21?98:800);};
 rect(0,0,900,860,'#f5f5ed',0);txt('우리 반 자리배치',450,57,30,'#233d35',700);txt(`${students.length}명 · 30좌석 · 3분단`,450,94,13,'#7b857b');
 rect(30,126,840,685,'#fffefa',14);txt('교실 뒤쪽 ↑',450,158,12,'#899580');
 for(let d=0;d<15;d++){
  const col=d%3,row=Math.floor(d/3),a=100+col*242,b=191+row*88;
  rect(a,b,216,74,'#c5cfbb');rect(a,b,216,70,'#f0f4e7');x.fillStyle='#d5ddce';x.fillRect(a+107,b,1,70);
  for(let j=0;j<2;j++){const s=seats[d*2+j],cx=a+54+j*108;if(s){txt(s[0]+'번',cx,b+20,10,'#81916f');txt(s[1],cx,b+46,21,'#233d35',650);}else txt('빈자리',cx,b+36,13,'#a4ad9a');}
 }
 txt('복',64,375,16,'#8a9788');txt('도',64,405,16,'#8a9788');txt('창',837,375,16,'#729994');txt('문',837,405,16,'#729994');
 for(let i=0;i<3;i++)txt((i+1)+'분단',208+i*242,643,12,'#819076');
 rect(372,678,156,49,'#e9eee0');txt('교탁',450,703,19,'#5f7350',650);txt('교실 앞쪽',450,746,12,'#9aa18f');txt(`2인 짝꿍 책상 · ${students.length}명 배치 · 빈자리 ${30-students.length}개`,450,787,11,'#929b88');
 txt('새로운 자리, 새로운 시작',450,836,11,'#929b88');
 const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('이미지 생성 실패')),'image/png'));
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='우리반_자리배치표_'+new Date().toLocaleDateString('sv-SE')+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$('status').textContent='완성된 자리배치표를 PNG로 저장했어요.';
 }catch(e){$('status').textContent='PNG 저장에 실패했어요. 다시 시도해 주세요.';}finally{$('capture').disabled=false;}
}
$('capture').addEventListener('click',capture);render();

function readDraft(){return Array.from($('roster-rows').children,row=>Array.from(row.querySelectorAll('input'),input=>input.value));}
function updateDraftCount(){const n=readDraft().filter(r=>r[1].trim()).length;$('draft-count').textContent=`배치 대상 ${n}명 / 30명`;}
function appendRosterRow(num='',name=''){
 const row=document.createElement('tr');
 for(const [index,value] of [num,name].entries()){
  const td=document.createElement('td'),input=document.createElement('input');input.type='text';input.value=value;
  input.setAttribute('aria-label',index?'학생 이름':'학생 번호');if(!index)input.inputMode='numeric';
  input.addEventListener('input',updateDraftCount);td.append(input);row.append(td);
 }
 const td=document.createElement('td'),del=document.createElement('button');del.type='button';del.textContent='삭제';del.setAttribute('aria-label',`${num||'새'}번 학생 행 삭제`);del.addEventListener('click',()=>{row.remove();updateDraftCount();});td.append(del);row.append(td);$('roster-rows').append(row);
}
function fillDraft(rows){$('roster-rows').replaceChildren();rows.forEach(r=>appendRosterRow(...r));updateDraftCount();}
function closeRoster(){$('roster-dialog').close();$('edit-roster').focus();}
$('edit-roster').addEventListener('click',()=>{fillDraft(roster);$('roster-error').textContent='';$('bulk-roster').value='';$('roster-dialog').showModal();});
$('close-roster').addEventListener('click',closeRoster);$('cancel-roster').addEventListener('click',closeRoster);
$('clear-roster').addEventListener('click',()=>{fillDraft([]);$('roster-error').textContent='명단을 비웠어요. 취소하면 기존 명단이 유지됩니다.';});
$('add-row').addEventListener('click',()=>{const max=Math.max(0,...readDraft().map(r=>Number(r[0])||0));appendRosterRow(max+1,'');updateDraftCount();$('roster-rows').lastElementChild.querySelectorAll('input')[1].focus();});
function parsePastedRoster(text){
 const lines=text.replace(/\r/g,'').split('\n').filter(l=>l.trim());
 if(!lines.length)throw Error('복사한 번호와 이름을 먼저 붙여넣어 주세요.');
 const rows=lines.map((line,i)=>{
  let parts=line.includes('\t')?line.split('\t'):line.includes(',')?line.split(','):line.trim().split(/\s+/);
  if(i===0&&parts[0].trim()==='번호'&&['이름','성명'].includes((parts[1]||'').trim()))return null;
  if(parts.length>2&&parts.slice(2).some(p=>p.trim()))throw Error(`${i+1}행: 번호와 이름 두 열만 붙여넣어 주세요.`);
  return [parts[0].trim(),(parts[1]||'').trim()];
 }).filter(Boolean);
 return validateRoster(rows);
}
$('apply-paste').addEventListener('click',()=>{try{const rows=parsePastedRoster($('bulk-roster').value);fillDraft(rows);$('roster-error').textContent='목록에 반영했어요. 확인 후 명단 저장을 눌러 주세요.';}catch(e){$('roster-error').textContent=e.message;}});
$('roster-form').addEventListener('submit',e=>{
 e.preventDefault();try{
  const next=validateRoster(readDraft());let persisted=true;
  try{localStorage.setItem(ROSTER_KEY,JSON.stringify(next));}catch{persisted=false;}
  roster=next;students=roster.filter(s=>s[1]);seats=Array(30).fill(null);render();closeRoster();
  $('status').textContent=persisted?`명단 ${students.length}명을 저장했어요. ${students.length?'랜덤 셔플로 자리를 배치해 주세요.':'명단 수정에서 학생을 추가해 주세요.'}`:'명단을 적용했어요. 브라우저 저장을 사용할 수 없어 새로고침하면 유지되지 않습니다.';
 }catch(err){$('roster-error').textContent=err.message;}
});
