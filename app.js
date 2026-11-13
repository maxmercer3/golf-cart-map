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
