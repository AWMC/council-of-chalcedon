//HTML for splash info & legend
const infoHTML = `
<h2>The Acts of the Council of Chalcedon</h2>
<p>This interactive map depicts the attendance of the Council of Chalcedon, summoned by Emperor Marcian in 451 AD. The Council of Chalcedon is one of the best-documented events in the history of the early church.</p>
<p><strong>User Guide:</strong>
<ul>
<li>Attendees are shown individually; where they cluster, a numbered circle indicates the count.</li>
<li>Metropolitan and patriarchal sees are represented by points crowned with Latin crosses and patriarchal crosses respectively.</li>
<li>Hollow circles represent bishops representing unlocated sees.</li>
<li>Click on a point to learn the name of the bishop that attended, the see's Diocese and Province, and a link to the Pleiades place.</li>
<li>Use the layers button in the top right corner to filter sees by Diocese and Province. Press “Sees (by Diocese and Province)” to unselect all.</li>
<li>Use the search bar in the top left corner to search points by bishop or see.</li>
</ul>
<p>&copy; Ancient World Mapping Center 2026</p>
<p><a href="https://creativecommons.org/licenses/by-nc/4.0/deed.en" target="_blank">CC-BY-NC 4.0</a><br>
<a href="https://www.gnu.org/licenses/gpl-3.0.en.html" target="_blank">GPL-3.0</a></p>
`;
const legendHTML = `
<h2>Legend</h2><br>
Chalcedon: <img src="./Icons/starIcon.png" style="vertical-align: middle; width: auto; height: auto;"><br><br>
Sees: <img src="./Icons/seeIcon.png" style="vertical-align: middle; width: auto; height: auto;"><br><br>
Metropolitan Sees: <img src="./Icons/metropolisIcon.png" style="vertical-align: -4.5px; width: auto; height: auto;"><br><br>
Patriarchal Sees: <img src="./Icons/patriarchalIcon.png" style="vertical-align: -4.5px; width: auto; height: auto;"><br><br>
Unlocated Sees: <img src="./Icons/unlocatedIcon.png" style="vertical-align: middle; width: auto; height: auto;">
`;

// get data from geoJSON file
fetch('chalcedondata.geojson')
  .then(response => {
    //check for errors and return data
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  })
  //proceed with data
  .then(data => {

//assign data to variable    
const geojsonFeature = data;

// create map
const map = L.map('map', {
  // give it inertia so it feels good
  inertia: true,
  // disable default zoom control so that we can change where it is
  zoomControl: false,
  // set max zoom because of CAWM limitations
  maxZoom: 11
// set view and zoom to correct area so (most of) the points are in frame when the map loads
}).setView([37, 28], 6);

// splash page
L.popup([37, 28],{
  //text  
  content: infoHTML,
  //declare class for css
  className: "infoPopup",
  //keep in view and pan
  keepInView: true,
  autoPan: true,
  //adjust width
  maxWidth: 500,
  //padding and offset to keep popup in view
  autoPanPadding: [50, 50],
  offset: [0, 200]
//add to map
}).openOn(map);

// place zoom control in the bottom right corner of the screen
var zoomcontrol = L.control.zoom({position: "bottomright"}).addTo(map);

//create legend and place it in the bottom left corner of the screen
var mapLegend = L.control({position: "bottomleft"});

//customize Legend
mapLegend.onAdd = function (map) {
  //create html div
  var div = L.DomUtil.create('div', 'legend');
  //content
  div.innerHTML += legendHTML;
  return div;
};

//add legend to map
mapLegend.addTo(map);

// create Open Street Map Layer from url
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  // proper attribution
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// add OSM layer to the map layer
}).addTo(map);

// create Consortium of Ancient World Mappers layer (better for a map of the ancient world)
const overlay = L.tileLayer('https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png', {
  // proper attribution
  attribution: '&copy; <a href="https://cawm.lib.uiowa.edu/index.html">Consortium of Ancient World Mappers</a>'
// add CAWM layer to the map layer (after adding OSM layer so CAWM is on top)
}).addTo(map);

// create icon for episcopal sees
const seeIcon = L.icon({
  // pull icon source  
  iconUrl: './Icons/seeIcon.png',
  // make symbol centered
  iconAnchor: [9,9]
});

// create icon for metropolitan see
const metropolitanIcon = L.icon({
  // pull icon source
  iconUrl: './Icons/metropolisIcon.png',
  // make symbol centered
  iconAnchor: [9,18]
});

// create icon for patriarchal see
const patriarchalIcon = L.icon({
  // pull icon source
  iconUrl: './Icons/patriarchalIcon.png',
  // make symbol centered
  iconAnchor: [9,18]
});

// create icon for unlocated see
const unlocatedIcon = L.icon({
  // pull icon source
  iconUrl: './Icons/unlocatedIcon.png',
  // make symbol centered
  iconAnchor: [9,18]
});

// create icon for Chalcedon
const starIcon = L.icon({
  // pull icon source
  iconUrl: './Icons/starIcon.png',
  // make symbol centered
  iconAnchor: [12, 11.5]
})

// html for Chalcedon Marker
const chalcedonMarkerText = `
<p class="see_title">Eleutherius of <a href="https://pleiades.stoa.org/places/520988" target="_blank">Chalcedon</a> (Bithynia)</p>`

// create marker for Chalcedon
const chalcedon = L.marker([40.98349941, 29.02592996], {
  // give the point the star icon
  icon: starIcon,
  // bring star to the top
  zIndexOffset: 1000,
  // give title for compatibility with search bar
  title: "Eleutherius of Chalcedon (Bithynia)"
// give the point a popup and add it to the map
}).bindPopup(chalcedonMarkerText).addTo(map);

// create empty map for dioceses & provinces
let provinces = {};

// get geojson data
geojsonFeature.features.forEach(feature => {
  // assign diocese & province to variables
  const { diocese, province } = feature.properties;
  // If we haven't seen this diocese yet, create an empty array
  if (!provinces[diocese]) {
    provinces[diocese] = [];
  }
  // Add the province if it isn't already in the diocese's array
  if (!provinces[diocese].includes(province)) {
    provinces[diocese].push(province);
  }
});

// create cluster group from markercluster plugin to help deal with collision detection
const allSeesCluster = L.markerClusterGroup({
  // disable polygon
  showCoverageOnHover: false,
  // decrease cluster radius so more points show up on load
  maxClusterRadius: 35,
  // function for icons
  iconCreateFunction: function(cluster) {
    // find cluster num
    var childCount = cluster.getChildCount();
    // beginning of class string
    var c = ' marker-cluster-';
    // bound for small class
    if (childCount < 6) {c += 'small';
    // ... for med class
    } else if (childCount < 12) {c += 'medium';
    // ... for large class
    } else {c += 'large';}
    // return icon
    return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', 
      className: 'marker-cluster' + c, 
      iconSize: new L.Point(40, 40) });
  } 
}).addTo(map);

// create empty map for layer objects that will eventually hold all datapoints within one province
let provinceLayers = [];
// create an iterator to run through each diocese
Object.entries(provinces).forEach(([dioceseName, provinceArray]) => {
  // create Diocese group for Province groups to fall under
  let dioceseGroup = {
    label: dioceseName, 
    selectAllCheckbox: true,
    collapsed: true,
    children: []
  }; 
  // another iterator to run through each province
  for (let i = 0; i < provinceArray.length; i++) {
    // current province
    const currentProvince = provinceArray[i];
    // create subgroup for sees in this province. 
    // This allows for compatability with layer trees while also clustering independednt from province
    const provinceSubGroup = L.featureGroup.subGroup(allSeesCluster);
    // create layer object from geoJSON data
    const provinceSees = L.geoJSON(geojsonFeature, {
      // filter data using a function: if province matches and see isn't chalcedon
      filter: (f) => f.properties.province === currentProvince && f.properties.see !== "Chalcedon" && f.properties.Ch,
      /*  pointToLayer determines how points in a geoJSON feature show up on the map. 
          it wants a function that returns a marker object
      */      
      pointToLayer: (feature, latlng) => {
        // get icon: metropolitan or regular
        let icon;
        if (feature.properties.patriarchal) {
          icon = patriarchalIcon;
        } else if (feature.properties.metropolis) {
          icon = metropolitanIcon;
        } else if (feature.properties.unlocated) {
          icon = unlocatedIcon;
        } else {
          icon = seeIcon;
        }
        // create marker with icon and title (for search bar)
        const marker = L.marker(latlng, {
            icon: icon,
            title: feature.properties.Ch + " of " + feature.properties.see + " (" + feature.properties.province + ")"
        });        
        // add point to the subgroup
        provinceSubGroup.addLayer(marker);        
        // return the marker
        return marker;
      },
      // use onEachFeature to give markers popups
      onEachFeature: (feature, layer) => {
        let popupTxt;
        if (feature.properties.pleiades === null) {
          popupTxt = `<p class="see_title">${feature.properties.Ch} of ${feature.properties.see} (${feature.properties.province})</p>`
        } else {
          popupTxt = `<p class="see_title">${feature.properties.Ch} of <a href="${feature.properties.pleiades}" target="_blank">${feature.properties.see}</a> (${feature.properties.province})</p>`
        }
        // apply popup to marker
        layer.bindPopup(popupTxt);
      }});
    //add the layer to clustering layer
    provinceSubGroup.addTo(map);
    // format layer into object for compatability with tree plugin
    dioceseGroup.children.push({
      label: currentProvince,
      layer: provinceSubGroup
    });
  }
  // add object to layers array
  provinceLayers.push(dioceseGroup);
} );

// create overlays object
let overlaysTree = [
  {
    // Chalcedon
    label:"Chalcedon",
    layer: chalcedon,
    /*  added empty children array to change the way the plugin renders Chalcedon selection. 
        otherwise, it looks like eparchies live under Chalcedon */
    children: []
  }, {
    // all of the Dioceses
    label: "Sees (By Diocese and Province)",
    // unselect all button (main goal of the plugin)
    selectAllCheckbox: true,
    // array of layer objects we created earlier
    children: provinceLayers,
  }
];

// add overlays to control. baselayers left null for personal preference since toggling is not needed
L.control.layers.tree(null, overlaysTree).addTo(map);

// create searchbar with pinSearch plugin
var searchBar = L.control.pinSearch({
  // set searchbar in the top left, set filler text
  position: 'topleft',
  placeholder: 'Search...',
  buttonText: 'Search',
  // which function to run when a search happens
  onSearch: function(query) {    
    // if Chalcedon was searched for
    if (chalcedon.options.title === query && map.hasLayer(chalcedon)) {
      // zoom to Chalcedon and open its popup  
      map.setView(chalcedon.getLatLng());
      chalcedon.openPopup();
      return;
    }
    // go through each parent group
    provinceLayers.forEach(diocese => {
      // and through each province
      diocese.children.forEach(provinceObj => {
        const subGroup = provinceObj.layer;      
        // Check if the subgroup is actually on the map
        if (map.hasLayer(subGroup)) {
          // go through each marker in the layer
          subGroup.eachLayer(marker => {
            // Check if the marker title matches the search query
            if (marker.options.title === query) {   
              // zoom to the point and ope its popup
              allSeesCluster.zoomToShowLayer(marker, function() {
                  marker.openPopup();
              });
            }
          });
        }
      });
    });
    },
  // set searchbar size and max search results
  searchBarWidth: '250px',
  searchBarHeight: '30px',
  maxSearchResults: 10
// add to the map
}).addTo(map);

// close then
});