var map, building_pop, terrainLayer, satLayer, cartodb, dragtype;
var zoomLayers = [];
if(!console || !console.log){
  console = { log: function(e){ } };
}
function init(){
  map = new L.Map('map');
  var toner = 'http://{s}.tile.stamen.com/terrain-lines/{z}/{x}/{y}.png';
  var tonerAttrib = 'Map data &copy; 2012 OpenStreetMap contributors, Tiles &copy; 2012 Stamen Design';
  terrainLayer = new L.TileLayer(toner, {maxZoom: 18, attribution: tonerAttrib});
  map.addLayer(terrainLayer);
  map.setView(new L.LatLng(32.831788, -83.648228), 17);
  
  satLayer = new L.BingLayer("Arc0Uekwc6xUCJJgDA6Kv__AL_rvEh4Hcpj4nkyUmGTIx-SxMd52PPmsqKbvI_ce");  
  map.addLayer(satLayer);
  satLayer.setOpacity(0);
  
  building_pop = new L.Popup();
  
  cartodb = new L.CartoDBLayer({
    map: map,
    user_name:'mapmeld',
    table_name: 'collegeplusintown',
    query: "SELECT * FROM collegeplusintown",
    tile_style: "collegeplusintown{polygon-fill:orange;polygon-opacity:0.3;} collegeplusintown[status='Demolished']{polygon-fill:red;} collegeplusintown[status='Renovated']{polygon-fill:green;} collegeplusintown[status='Moved']{polygon-fill:blue;}",
    interactivity: "cartodb_id, status",
    featureClick: function(ev, latlng, pos, data){
      building_pop.setLatLng(latlng).setContent("<label>Name</label><br/><input id='poly_name' class='x-large' value=''/><br/><label>Add Detail</label><br/><textarea id='poly_detail' rows='6' cols='25'></textarea><br/><input class='btn' onclick='saveDetail()' style='float:right;' value='Save'/>");
      // + addDropdown(data));
      map.openPopup(building_pop);
    },
    //featureOver: function(){},
    //featureOut: function(){},
    auto_bound: true
  });
  map.addLayer(cartodb);
  
  map.on('zoomend', function(e){
    for(var i=0;i<zoomLayers.length;i++){
      map.removeLayer(zoomLayers[i]);
    }
    zoomLayers = [];
  });
  
  // load new buildings from MongoDB
  $.getJSON('/storedbuildings', function(buildings){
    for(var b=0;b<buildings.length;b++){
      var pt = new L.Marker(new L.LatLng(buildings[b].ll[0], buildings[b].ll[1])).bindPopup(buildings[b].status);
      map.addLayer(pt);
    }
  });
}
function setMap(lyr){
  if(lyr == "street"){
    terrainLayer.setOpacity(1);
    satLayer.setOpacity(0);
    $("#streetlayer").addClass("active");
    $("#satlayer").removeClass("active");
  }
  else if(lyr == "sat"){
    terrainLayer.setOpacity(0);
    satLayer.setOpacity(1);
    $("#streetlayer").removeClass("active");
    $("#satlayer").addClass("active");
  }
}
function addDropdown(givendata){
  var full = '<select onchange="setStatus(\'' + givendata.cartodb_id + '\',this.value);"><option>Unchanged</option><option>Demolished</option><option>Renovated</option><option>Moved</option></select><br/>';
  full = full.replace('<option>' + givendata.status,'<option selected="selected">' + givendata.status);
  return full;
}
function setStatus(id, status){
  console.log(id + " set to " + status);
  $.getJSON("/changetable?id=" + id + "&status=" + status, function(data){ });
  $.getJSON("http://mapmeld.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT%20ST_AsGeoJSON(the_geom)%20FROM%20collegeplusintown%20WHERE%20cartodb_id=" + id).done(function(poly){
    // until zoom changes and tiles are refreshed, show polygon
    L.geoJson(JSON.parse(poly.rows[0].st_asgeojson), {
      style: function (feature) {
        if(status == "Demolished"){
          return {color: "#f00", opacity: 1};
        }
        else if(status == "Renovated"){
          return {color: "#0f0", opacity: 1};
        }
        else if(status == "Moved"){
          return {color: "#00f", opacity: 1};      
        }
        else{
          return {color: "orange", opacity: 1};
        }
      },
      onEachFeature: function(feature, layer){
        layer.bindPopup("You updated this.<br/>Zoom map to update.");
        zoomLayers.push(layer);
      }
    }).addTo(map);
  });
}
function dragstarted(e){
  dragtype = e.target.id;
}
function allowDrop(e){
  e.preventDefault();
}
function dragended(e){
  e.target.style.opacity = "1";
  allowDrop(e);
}
function dropped(e){
  if(dragtype == "marker_NewBuilding"){
    // find latitude / longitude of drop point
    var dropPoint = map.mouseEventToLatLng(e);
    // add a marker to the visible map
    var dropMarker = new L.Marker( dropPoint );
    map.addLayer(dropMarker);
    // add a marker to the CartoDB table
    $.getJSON("/changetable?marker=newpoint&ll=" + dropPoint.lng.toFixed(6) + "," + dropPoint.lat.toFixed(6), function(data){ console.log(data) });
  }
  else{
    // fake a click to change status of building at drop point
    cartodb.interaction.screen_feature({ x: e.clientX || e.pageX, y: e.clientY || e.pageY }, function(f){
      var id = f.cartodb_id;
      dragtype = dragtype.replace("marker_", "");
      setStatus(id, dragtype);
      dragtype = null;
    });
  }
  allowDrop(e);
}
function checkForEnter(e){
  if(e.keyCode == 13){
    searchAddress();
  }
}
function searchAddress(){
  var address = $("#placesearch").val();
  $.getJSON("/placesearch?address=" + address, function(data){
    map.setView(new L.LatLng(data.position.split(',')[0], data.position.split(',')[1]), 17);
  });
}
function saveDetail(){

}