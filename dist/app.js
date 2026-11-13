const map=L.map('map',{zoomControl:false,minZoom:12}).setView([28.5598,-81.6045],14);
L.control.zoom({position:'bottomright'}).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);

const styles={approved:{color:'#1f8f5f',weight:8,opacity:.9},restricted:{color:'#d64a43',weight:8,opacity:.88},hoa:{color:'#1f8f5f',weight:7,opacity:.92,dashArray:'9 7'},crossing:{color:'#327cc7',weight:9,opacity:1}};
const line=(pts,style,title,body)=>L.polyline(pts,style).addTo(map).bindPopup(`<b>${title}</b><br>${body}`);

// Corridor geometry is represented at planning scale; posted signs control.
line([[28.5651,-81.5943],[28.5651,-81.5901],[28.5651,-81.5853],[28.5651,-81.5800],[28.5651,-81.5758]],styles.approved,'Winter Garden designated corridor','Shown from the City’s official downtown golf-cart district at planning scale. Confirm signs before driving.');
line([[28.5687,-81.5926],[28.5685,-81.5866],[28.5684,-81.5816]],styles.approved,'Winter Garden designated corridor','Official district corridor; street-level routing is not yet enabled.');
line([[28.5615,-81.5925],[28.5614,-81.5864],[28.5614,-81.5808]],styles.approved,'Winter Garden designated corridor','Official district corridor; verify the current municipal map and posted signs.');
line([[28.5701,-81.5900],[28.5651,-81.5901],[28.5615,-81.5901]],styles.approved,'Winter Garden designated corridor','Official district corridor at planning scale.');
line([[28.5700,-81.5854],[28.5651,-81.5853],[28.5614,-81.5853]],styles.approved,'Winter Garden designated corridor','Official district corridor at planning scale.');

line([[28.56140,-81.61558],[28.56138,-81.61449]],styles.hoa,'Oakland Park Community House connection','Public route start at the Community House, 1000 Civitas Way, continuing east on Civitas.');
L.circleMarker([28.56140,-81.61558],{radius:8,color:'#fff',weight:3,fillColor:'#1f8f5f',fillOpacity:1}).addTo(map).bindPopup('<b>Oakland Park Community House</b><br>Public route reference point: 1000 Civitas Way.');

line([[28.5547,-81.639],[28.5548,-81.615],[28.5550,-81.590]],styles.restricted,'Oakland Avenue / CR 438','No longitudinal golf-cart travel. Oakland identifies only specific authorized crossings.');
line([[28.548,-81.6302],[28.570,-81.6301]],styles.restricted,'Tubb Street','Restricted as through travel. Cross only where officially authorized and signed.');
line([[28.544,-81.642],[28.544,-81.575]],styles.restricted,'SR 50 / Colonial Drive','No standard golf-cart travel or crossing shown by this project.');
line([[28.5544,-81.6214],[28.5552,-81.6214]],styles.crossing,'Pollard crossing','Town-identified authorized crossing of Oakland Avenue; cross only as signed and permitted.');
line([[28.5544,-81.6302],[28.5552,-81.6302]],styles.crossing,'Tubb crossing','Town-identified authorized crossing of Oakland Avenue; this does not authorize travel along Tubb Street.');
line([[28.5544,-81.6151],[28.5552,-81.6151]],styles.crossing,'McKinnon Square crossing','Community-reported crossing across Oakland Avenue into McKinnon Square. Verify current signage; no travel along Oakland Avenue.');
line([[28.5544,-81.6097],[28.5552,-81.6097]],styles.crossing,"Winter’s Landing crossing",'Town-identified authorized crossing of Oakland Avenue. Exact alignment should be checked against signs.');

const preferredRoute=[
 [28.56140,-81.61558],[28.56138,-81.61449],
 [28.56138,-81.60894],[28.55740,-81.60894],[28.55837,-81.60401],[28.55925,-81.60160],[28.56040,-81.59900],
 [28.56170,-81.59620],[28.56310,-81.59310],[28.56462,-81.58954]
];
line(preferredRoute,styles.approved,'2026 designated connection','Civitas → Tildenville School → Brick → West Story → West Plant → downtown. This is a permitted mapped corridor, not a required route.');

function showOverview(){map.fitBounds([[28.5515,-81.637],[28.571,-81.574]],{padding:[30,30]})}
document.getElementById('overviewBtn').onclick=showOverview;
document.getElementById('routeInfoBtn').onclick=()=>document.getElementById('gapDialog').showModal();
document.getElementById('closeGap').onclick=()=>document.getElementById('gapDialog').close();
document.getElementById('infoBtn').onclick=()=>document.getElementById('infoDialog').showModal();
document.getElementById('closeInfo').onclick=()=>document.getElementById('infoDialog').close();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
document.getElementById('legendToggle').onclick=()=>{const b=document.getElementById('legendBody'),open=b.style.display!=='none';b.style.display=open?'none':'grid';document.getElementById('legendChevron').textContent=open?'⌄':'⌃';document.getElementById('legendToggle').setAttribute('aria-expanded',String(!open))};

const approvedNetworks=[
 [[28.5651,-81.5943],[28.5651,-81.5901],[28.5651,-81.5853],[28.5651,-81.5800],[28.5651,-81.5758]],
 [[28.5687,-81.5926],[28.5685,-81.5866],[28.5684,-81.5816]],
 [[28.5615,-81.5925],[28.5614,-81.5864],[28.5614,-81.5808]],
 [[28.5701,-81.5900],[28.5651,-81.5901],[28.5615,-81.5901]],
 [[28.5700,-81.5854],[28.5651,-81.5853],[28.5614,-81.5853]],
 [[28.56140,-81.61558],[28.56138,-81.61449]],
 preferredRoute
];
const restrictedNetworks=[
 [[28.5547,-81.639],[28.5548,-81.615],[28.5550,-81.590]],
 [[28.548,-81.6302],[28.570,-81.6301]],
 [[28.544,-81.642],[28.544,-81.575]]
];

const surveyMode=new URLSearchParams(location.search).get('survey')==='1';
if(surveyMode){
 document.body.classList.add('survey-mode');
 document.querySelector('.map-note').textContent='Road review — tap a highlighted street';
 const card=document.getElementById('surveyCard'),count=document.getElementById('surveyCount'),message=document.getElementById('surveyMessage'),selectedLabel=document.getElementById('selectedSurveyRoad'),noteInput=document.getElementById('surveyRoadNote');
 const roadLayer=L.layerGroup().addTo(map),colors={permitted:'#1f8f5f',restricted:'#d64a43',crossing:'#327cc7',uncertain:'#d89025'},labels={permitted:'Permitted',restricted:'Restricted',crossing:'Crossing only',uncertain:'Unsure'};
 const roadLayers=new Map(),history=[];
 let selectedRoad=null;
 let records=[];
 try{const parsed=JSON.parse(localStorage.getItem('cartpath-road-review-v2')||'[]');if(Array.isArray(parsed))records=parsed}catch(_){records=[]}
 card.hidden=false;
 function persist(){localStorage.setItem('cartpath-road-review-v2',JSON.stringify(records));count.textContent=`${records.length} classified`}
 function applyRoadStyle(id){
  const layers=roadLayers.get(String(id));if(!layers)return;
  const record=records.find(item=>String(item.osm_id)===String(id)),active=selectedRoad&&String(selectedRoad.id)===String(id);
  layers.visible.setStyle({color:active?'#111':record?colors[record.status]:'#7d8882',weight:active?8:record?7:4,opacity:(record||active)?0.95:0.55,dashArray:record?.status==='uncertain'?'7 6':null});
 }
 function selectRoad(road){
  const previous=selectedRoad;selectedRoad=road;if(previous)applyRoadStyle(previous.id);applyRoadStyle(road.id);
  const record=records.find(item=>String(item.osm_id)===String(road.id));
  selectedLabel.textContent=`${road.name} — segment ${road.id}`;noteInput.value=record?.note||'';
  document.querySelectorAll('.survey-type').forEach(button=>button.classList.toggle('active',button.dataset.surveyType===record?.status));
  message.textContent=record?`Currently marked ${labels[record.status]}. Choose another status to change it.`:'Choose the status for this highlighted segment.';
 }
 document.querySelectorAll('.survey-type').forEach(button=>button.onclick=()=>{
  if(!selectedRoad){message.textContent='Tap a highlighted street segment first.';return}
  const index=records.findIndex(item=>String(item.osm_id)===String(selectedRoad.id)),previous=index>=0?{...records[index]}:null;
  history.push({id:selectedRoad.id,previous});const record={osm_id:selectedRoad.id,status:button.dataset.surveyType,name:selectedRoad.name,note:noteInput.value.trim(),points:selectedRoad.points,updated_at:new Date().toISOString()};
  if(index>=0)records[index]=record;else records.push(record);persist();applyRoadStyle(selectedRoad.id);
  document.querySelectorAll('.survey-type').forEach(item=>item.classList.toggle('active',item===button));message.textContent=`${selectedRoad.name} saved as ${labels[record.status]}.`;
 });
 document.getElementById('undoSurveyRoad').onclick=()=>{
  const change=history.pop();if(!change){message.textContent='No recent choice to undo.';return}
  const index=records.findIndex(item=>String(item.osm_id)===String(change.id));if(index>=0)records.splice(index,1);if(change.previous)records.push(change.previous);persist();applyRoadStyle(change.id);message.textContent='Last classification undone.';
 };
 document.getElementById('clearSurvey').onclick=()=>{if(confirm('Remove every saved road classification from this device?')){records=[];history.length=0;persist();roadLayers.forEach((_,id)=>applyRoadStyle(id));message.textContent='Road review cleared.'}};
 document.getElementById('exportSurvey').onclick=async()=>{
  if(!records.length){message.textContent='Classify at least one road segment before exporting.';return}
  const geojson={type:'FeatureCollection',properties:{project:'CartPath road review',privacy:'Selected OpenStreetMap road segments only; no continuous GPS history'},features:records.map(record=>({type:'Feature',properties:{osm_id:record.osm_id,status:record.status,label:labels[record.status],name:record.name,note:record.note,updated_at:record.updated_at},geometry:{type:'LineString',coordinates:record.points.map(point=>[point[1],point[0]])}}))};
  const file=new File([JSON.stringify(geojson,null,2)],`cartpath-road-survey-${new Date().toISOString().slice(0,10)}.geojson`,{type:'application/geo+json'});
  try{
   if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'CartPath road survey',files:[file]});message.textContent='Survey shared.'}
   else{const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='Survey downloaded. Attach the GeoJSON file in this chat.'}
  }catch(error){if(error.name!=='AbortError')message.textContent='Could not export. Try again from Safari.'}
 };
 function renderSelectableRoads(roads){
  roadLayer.clearLayers();roadLayers.clear();
  roads.forEach(road=>{
   const visible=L.polyline(road.points,{color:'#7d8882',weight:4,opacity:.55}).addTo(roadLayer),hit=L.polyline(road.points,{color:'#000',weight:20,opacity:.001}).addTo(roadLayer);
   visible.on('click',()=>selectRoad(road));hit.on('click',()=>selectRoad(road));roadLayers.set(String(road.id),{visible,hit});applyRoadStyle(road.id);
  });
  persist();selectedLabel.textContent='Tap any highlighted street segment';message.textContent=`${roads.length} Oakland-area road segments loaded. Zoom in, tap a segment, then choose its status.`;
 }
 async function loadSelectableRoads(){
  count.textContent='Loading roads…';message.textContent='Loading Oakland-area street segments…';
  try{
   const response=await fetch('roads-oakland.json');if(!response.ok)throw new Error('Road data unavailable');
   const roads=await response.json();renderSelectableRoads(roads);
  }catch(_){count.textContent=`${records.length} classified`;selectedLabel.textContent='Street data could not load';message.textContent='Reload the page and try again.'}
 }
 document.getElementById('reloadSurveyRoads').onclick=loadSelectableRoads;
 loadSelectableRoads();
}

let watchId=null,userMarker=null,accuracyCircle=null,wakeLock=null;
const gpsBtn=document.getElementById('gpsBtn'),gpsLabel=document.getElementById('gpsLabel'),driveCard=document.getElementById('driveCard'),driveHeading=document.getElementById('driveHeading'),driveStatus=document.getElementById('driveStatus'),driveStatusText=document.getElementById('driveStatusText'),driveGuidance=document.getElementById('driveGuidance');
function lineDistance(point,network){
 const toXY=p=>({x:(p[1]-point[1])*111111*Math.cos(point[0]*Math.PI/180),y:(p[0]-point[0])*111111});
 let best=Infinity;
 for(let i=0;i<network.length-1;i++){
  const a=toXY(network[i]),b=toXY(network[i+1]),dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,-((a.x*dx)+(a.y*dy))/(dx*dx+dy*dy))),d=Math.hypot(a.x+t*dx,a.y+t*dy);
  if(d<best)best=d;
 }
 return best;
}
function nearestDistance(point,networks){return Math.min(...networks.map(network=>lineDistance(point,network)))}
function setDriveStatus(kind,title,message){
 const colors={safe:'#176e49',warning:'#a05319',danger:'#b8332d'};
 const fills={safe:'#1f8f5f',warning:'#d89025',danger:'#d64a43'};
 driveCard.dataset.status=kind;driveHeading.textContent=title;driveStatusText.textContent=title;driveGuidance.textContent=message;
 driveStatus.style.color=colors[kind];driveStatus.querySelector('span').style.background=fills[kind];
}
function updateDriveStatus(point,accuracy){
 const approved=nearestDistance(point,approvedNetworks),restricted=nearestDistance(point,restrictedNetworks);
 if(restricted<35){
  setDriveStatus('danger','Mapped restriction nearby','Do not continue unless an authorized crossing or posted sign clearly permits it.');
 }else if(approved<Math.max(45,accuracy)){
  setDriveStatus('safe','Within a mapped permitted corridor','Continue to follow posted signs. This status covers mapped roads only.');
 }else{
  setDriveStatus('warning','Road not classified','This map cannot confirm the current road. Slow down and check signs before continuing.');
 }
}
async function requestWakeLock(){
 if('wakeLock' in navigator){try{wakeLock=await navigator.wakeLock.request('screen')}catch(_){wakeLock=null}}
}
function stopDriveMode(){
 navigator.geolocation.clearWatch(watchId);watchId=null;if(wakeLock){wakeLock.release();wakeLock=null}
 gpsLabel.textContent='Start drive mode';driveHeading.textContent='Ready to follow your location';driveStatusText.textContent='Location not started';driveGuidance.textContent='Green means you are near a mapped permitted corridor. Amber means this map cannot classify the road. Red means you are near a mapped restriction.';
}
gpsBtn.onclick=()=>{
 if(!navigator.geolocation){gpsLabel.textContent='Location unavailable';return}
 if(watchId!==null){stopDriveMode();return}
 gpsLabel.textContent='Finding location…';
 requestWakeLock();
 watchId=navigator.geolocation.watchPosition(pos=>{
  const p=[pos.coords.latitude,pos.coords.longitude];
  if(!userMarker){userMarker=L.circleMarker(p,{radius:9,color:'#fff',weight:4,fillColor:'#1f78ff',fillOpacity:1}).addTo(map).bindPopup('<b>Your live location</b><br>GPS accuracy varies.');accuracyCircle=L.circle(p,{radius:pos.coords.accuracy,color:'#1f78ff',weight:1,fillOpacity:.08}).addTo(map)}else{userMarker.setLatLng(p);accuracyCircle.setLatLng(p).setRadius(pos.coords.accuracy)}
  map.setView(p,Math.max(map.getZoom(),17));gpsLabel.textContent='Stop drive mode';updateDriveStatus(p,pos.coords.accuracy);
 },err=>{gpsLabel.textContent=err.code===1?'Location permission needed':'Could not get location';watchId=null},{enableHighAccuracy:true,maximumAge:3000,timeout:12000});
};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&watchId!==null&&!wakeLock)requestWakeLock()});
