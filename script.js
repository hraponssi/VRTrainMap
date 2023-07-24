// APIs
var vrlocAPI = "https://rata.digitraffic.fi/api/v1/train-locations.geojson/latest/";
var vrdaytrainsAPI = "https://rata.digitraffic.fi/api/v1/trains/2023-05-21";

// Get current date and update trains url with it. TODO sometimes there are trains from yesterday's list still on the map. Check yesterdays list too?
var today = new Date();
var todayString = today.getUTCFullYear() + "-" + (today.getUTCMonth()+1) + "-" + today.getUTCDate();
if (today.getUTCMonth()+1 < 10) todayString = today.getUTCFullYear() + "-0" + (today.getUTCMonth()+1) + "-" + today.getUTCDate();
console.log("Today is " + todayString);
vrdaytrainsAPI = "https://rata.digitraffic.fi/api/v1/trains/" + todayString;

// Buttons
const showFreightButton = document.querySelector(".buttonShowFreight");
showFreightButton.addEventListener("click", showFreightMarkers);

const showAllButton = document.querySelector(".buttonShowAll");
showAllButton.addEventListener("click", showAllMarkers);

// Default camera values
var lat = 64.279281;
var lon = 27.217242;
var zoom = 5;

// Map initialization
var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
var position       = new OpenLayers.LonLat(lon, lat).transform( fromProjection, toProjection);

map = new OpenLayers.Map("Map");
var mapnik = new OpenLayers.Layer.OSM();
map.addLayer(mapnik);

var markers = new OpenLayers.Layer.Markers( "Markers" );

var size = new OpenLayers.Size(21,25);
var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

map.addLayer(markers);

// Icons for each type of train
// Long-distance Passenger
var ldicon = new OpenLayers.Icon('http://kuvat.vaunut.org/cade9a3b263b588477615df975053c6b.jpg', size, offset);
// Cargo
var ficon = new OpenLayers.Icon("http://kuvat.vaunut.org/963c48eea2c3cc02ec49cab9f6793e34.jpg", size, offset);
// Locomotive
var licon = new OpenLayers.Icon("http://kuvat.vaunut.org/66b3adad62772ebddf15d7e898da553f.jpg", size, offset);
// Shunting
var sicon = new OpenLayers.Icon("http://kuvat.vaunut.org/06fb47debe34a6a106cabb86b50bf394.jpg", size, offset);
// Commuter
var cicon = new OpenLayers.Icon("http://kuvat.vaunut.org/4208b6e767dd53709eb615ab7cdc8948.jpg", size, offset);
// On-track machines
var otmicon = new OpenLayers.Icon("http://kuvat.vaunut.org/72f4b8c9daa749c80bfc901bcdc0bc2b.jpg", size, offset);
// Unknown
var unknownicon = new OpenLayers.Icon("https://www.downloadclipart.net/large/18082-error-button-design.png", size, offset);

var iconmap = {
  "Long-distance" : ldicon,
  "Cargo" : ficon,
  "Locomotive" : licon,
  "Shunting" : sicon,
  "Commuter" : cicon,
  "On-track machines" : otmicon
};

// Get the trains and map number : type
var trainTypes = {};

$.getJSON( vrdaytrainsAPI)
  .done(function( trains ) {
    $.each( trains, function( ti, titem ) {
      $('#trains').prepend(titem.trainCategory + ", ");
      if (titem.trainCategory === "Cargo"){
        console.log("CARGO");
      }
      trainTypes[titem.trainNumber] = titem.trainCategory;
    });
  });

loclist = [];

// Test marker on camera position. TODO remove
//markers.addMarker(new OpenLayers.Marker(position, ldicon));

map.setCenter(position, zoom);

// Functions for showing different markers
function showFreightMarkers() {
    showMarkers(false);
}

function showAllMarkers() {
    showMarkers(true);
}

function showMarkers(showAll) {
  console.log(loclist.length)
  $.getJSON( vrlocAPI)
  .done(function( data ) {
    $.each( data.features, function( i, item ) {
      tnumber = item.properties.trainNumber;
      let show = false;
      let ftrain = false;
      if (trainTypes[item.properties.trainNumber] === "Cargo") {
        ftrain = true;
      }
      if (ftrain) {
          console.log("that's freight");
          show = true;
          ftrain = true;
      } else if (showAll) {
          show = true;
      }
      if (show) {
          
        $('#locations').prepend(item.properties.trainNumber + " at " + item.geometry.coordinates + ", ");
        // TODO replace with dictionary of train locations
        loclist.push(item.geometry.coordinates);
        console.log(loclist.length)
        var strentry = item.geometry.coordinates + ""
        elon = strentry.split(",")[0];
        elat = strentry.split(",")[1];
        console.log("Adding marker " + tnumber + " " + elon + ", " + elat)
        let useicon = unknownicon;
        if (tnumber in trainTypes) {
          useicon = iconmap[trainTypes[tnumber]];
        } else {
          console.log("Train number " + tnumber + " did not have a registered type");
        }
        markers.addMarker(new OpenLayers.Marker( new OpenLayers.LonLat(parseFloat(elon), parseFloat(elat)).transform( fromProjection, toProjection), useicon.clone()))
      }
    });
  });
}