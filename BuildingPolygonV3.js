//for better visual, run under the BuildingPolygon.js

// ===== CONFIG ===== 
//this code can't export .shp file cuz 'Property longitude_latitude has type Geometry' it says. 

// Load your region (uploaded shapefile)
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08');

// Load the Open Buildings v3 polygons
var buildings = ee.FeatureCollection('GOOGLE/Research/open-buildings/v3/polygons')
                    .filterBounds(region);

// Check how many buildings exist
print('Number of building polygons in region:', buildings.size());

// Visualize on map
Map.centerObject(region, 13);
Map.addLayer(region.style({color: 'red', fillColor: '00000000'}), {}, 'Region Boundary');
Map.addLayer(buildings.limit(5000), {color: 'blue'}, 'Buildings sample');  // limit for display

// CLEANING STEP — remove invalid geometry-type property if yout REALLY NEED to export in .shp
// ================================================================

// Option 1: Keep all properties except the invalid one (recommended)
var buildings_clean = buildings.map(function(f) {
  return f.setGeometry(f.geometry())
          .select(f.propertyNames().remove('longitude_latitude'));
});

// Optional: Check first few features to confirm cleaning
print('Cleaned buildings sample:', buildings_clean.limit(3));

// ================================================================

// Export to Drive as Shapefile
Export.table.toDrive({
  collection: buildings,
  description: 'OpenBuildings_v3_IndonesiaRegion',
  fileFormat: 'SHP'
});

//export it in .shp alternative like .geojson
