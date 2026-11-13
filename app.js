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

line([[28.55901,-81.61881],[28.55965,-81.61755],[28.56045,-81.61615],[28.56115,-81.61480],[28.56138,-81.61449]],styles.hoa,'Continuous Oakland Park connection','Hammock Preserve Loop → Eaglescrest Drive → Civitas Way. This remains inside the connected, HOA-approved Oakland Park road network.');
L.circleMarker([28.55901,-81.61881],{radius:8,color:'#fff',weight:3,fillColor:'#1f8f5f',fillOpacity:1}).addTo(map).bindPopup('<b>Hammock Preserve Loop</b><br>Within the continuous golf-cart-accessible Oakland Park HOA area (resident-confirmed).');

line([[28.5547,-81.639],[28.5548,-81.615],[28.5550,-81.590]],styles.restricted,'Oakland Avenue / CR 438','No longitudinal golf-cart travel. Oakland identifies only specific authorized crossings.');
line([[28.548,-81.6302],[28.570,-81.6301]],styles.restricted,'Tubb Street','Restricted as through travel. Cross only where officially authorized and signed.');
line([[28.544,-81.642],[28.544,-81.575]],styles.restricted,'SR 50 / Colonial Drive','No standard golf-cart travel or crossing shown by this project.');
line([[28.5544,-81.6214],[28.5552,-81.6214]],styles.crossing,'Pollard crossing','Town-identified authorized crossing of Oakland Avenue; cross only as signed and permitted.');
line([[28.5544,-81.6302],[28.5552,-81.6302]],styles.crossing,'Tubb crossing','Town-identified authorized crossing of Oakland Avenue; this does not authorize travel along Tubb Street.');
line([[28.5544,-81.6151],[28.5552,-81.6151]],styles.crossing,'McKinnon Square crossing','Resident-confirmed crossing across Oakland Avenue into McKinnon Square. No travel along Oakland Avenue.');
line([[28.5544,-81.6097],[28.5552,-81.6097]],styles.crossing,"Winter’s Landing crossing",'Town-identified authorized crossing of Oakland Avenue. Exact alignment should be checked against signs.');

const preferredRoute=[
 [28.55901,-81.61881],[28.55965,-81.61755],[28.56045,-81.61615],[28.56138,-81.61449],
 [28.56138,-81.60894],[28.55740,-81.60894],[28.55837,-81.60401],[28.55925,-81.60160],[28.56040,-81.59900],
 [28.56170,-81.59620],[28.56310,-81.59310],[28.56462,-81.58954]
];
line(preferredRoute,{color:'#138a58',weight:10,opacity:.95},'Preferred Plant-first route','Continuous legal corridor: Oakland Park → Civitas → Tildenville School → Brick → West Story → West Plant → downtown.');

const gapMarker=L.marker([28.5586,-81.6000],{opacity:0});
function showGaps(){map.fitBounds([[28.5515,-81.637],[28.571,-81.574]],{padding:[30,30]});document.getElementById('gapDialog').showModal()}
document.getElementById('showGapBtn').onclick=showGaps;
document.getElementById('closeGap').onclick=()=>document.getElementById('gapDialog').close();
document.getElementById('infoBtn').onclick=()=>document.getElementById('infoDialog').showModal();
document.getElementById('closeInfo').onclick=()=>document.getElementById('infoDialog').close();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
document.getElementById('legendToggle').onclick=()=>{const b=document.getElementById('legendBody'),open=b.style.display!=='none';b.style.display=open?'none':'grid';document.getElementById('legendChevron').textContent=open?'⌄':'⌃';document.getElementById('legendToggle').setAttribute('aria-expanded',String(!open))};

let watchId=null,userMarker=null,accuracyCircle=null;
const gpsBtn=document.getElementById('gpsBtn'),gpsLabel=document.getElementById('gpsLabel'),routeStatus=document.getElementById('routeStatus'),routeStatusText=document.getElementById('routeStatusText'),routeGuidance=document.getElementById('routeGuidance');
const guidance=['Continue through Oakland Park toward Civitas Way','Continue through Oakland Park toward Civitas Way','Continue to Civitas Way','Head east on Civitas Way','Turn right on Tildenville School Road','Turn left on Brick Road toward West Story Road','Turn right on West Story Road','Continue toward West Plant Street','Continue on West Plant Street toward downtown','Continue on West Plant Street toward downtown','Continue on West Plant Street to downtown'];
function routeDistance(point){
 const toXY=p=>({x:(p[1]-point[1])*111111*Math.cos(point[0]*Math.PI/180),y:(p[0]-point[0])*111111});
 let best={distance:Infinity,index:0};
 for(let i=0;i<preferredRoute.length-1;i++){
  const a=toXY(preferredRoute[i]),b=toXY(preferredRoute[i+1]),dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,-((a.x*dx)+(a.y*dy))/(dx*dx+dy*dy))),d=Math.hypot(a.x+t*dx,a.y+t*dy);
  if(d<best.distance)best={distance:d,index:i};
 }
 return best;
}
function updateRouteGuidance(point){
 const nearest=routeDistance(point),offRoute=nearest.distance>120;
 routeStatus.classList.toggle('warning-route',offRoute);
 routeStatus.style.color=offRoute?'#a05319':'#176e49';
 routeStatus.querySelector('span').style.background=offRoute?'#d89025':'#1f8f5f';
 routeStatusText.textContent=offRoute?`Off preferred route by about ${Math.round(nearest.distance/10)*10} m`:'On the preferred Plant-first route';
 routeGuidance.textContent=offRoute?'Return to the green preferred corridor when safe. Do not use a red road as a shortcut.':guidance[nearest.index];
}
gpsBtn.onclick=()=>{
 if(!navigator.geolocation){gpsLabel.textContent='Location unavailable';return}
 if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;gpsLabel.textContent='Show my location';return}
 gpsLabel.textContent='Finding location…';
 watchId=navigator.geolocation.watchPosition(pos=>{
  const p=[pos.coords.latitude,pos.coords.longitude];
  if(!userMarker){userMarker=L.circleMarker(p,{radius:9,color:'#fff',weight:4,fillColor:'#1f78ff',fillOpacity:1}).addTo(map).bindPopup('<b>Your live location</b><br>GPS accuracy varies.');accuracyCircle=L.circle(p,{radius:pos.coords.accuracy,color:'#1f78ff',weight:1,fillOpacity:.08}).addTo(map)}else{userMarker.setLatLng(p);accuracyCircle.setLatLng(p).setRadius(pos.coords.accuracy)}
  map.setView(p,Math.max(map.getZoom(),16));gpsLabel.textContent='Following live location';updateRouteGuidance(p);
 },err=>{gpsLabel.textContent=err.code===1?'Location permission needed':'Could not get location';watchId=null},{enableHighAccuracy:true,maximumAge:3000,timeout:12000});
};
