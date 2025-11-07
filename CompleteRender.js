//BUILDING PRESENCE AND HEIGHT
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08');
var col = ee.ImageCollection('GOOGLE/Research/open-buildings-temporal/v1');

function addLayers(millis) {
  var mosaic = col.filter(ee.Filter.eq('system:time_start', millis)).mosaic();
  var clipped = mosaic.clip(region);
  var year = new Date(millis).getFullYear();
  
  Map.addLayer(
    clipped.select('building_presence'), 
    {max: 1}, 
    'building_presence_' + year
  );
  Map.addLayer(
    clipped.select('building_height'), 
    {max: 100}, 
    'building_height_' + year, false
  );
  Export.image.toDrive({
    image: clipped.select('building_height'),
    description: 'BuildingHeight_' + year,
    folder: 'GEE_Exports', // optional: name of the Drive folder
    scale: 10,              // Open Buildings is 10 m resolution
    region: region.geometry(),
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });
}

var ts = col.filterBounds(region)
             .aggregate_array('system:time_start')
             .distinct()
             .sort()
             .getInfo()
             .slice(-2);  // get last 2 timestamps

ts.forEach(addLayers);

Map.centerObject(region, 13);
Map.addLayer(region.style({color: 'red', fillColor: '00000000'}), {}, 'Region Boundary');

//BUILDING FOOTPRINT POLYGON
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08');

var buildings = ee.FeatureCollection('GOOGLE/Research/open-buildings/v3/polygons')
                    .filterBounds(region);

print('Number of building polygons in region:', buildings.size());

Map.centerObject(region, 13);
Map.addLayer(region.style({color: 'red', fillColor: '00000000'}), {}, 'Region Boundary');
Map.addLayer(buildings.limit(5000), {color: 'blue'}, 'Buildings sample');  // limit for display

Export.table.toDrive({
  collection: buildings,
  description: 'OpenBuildings_v3_08',
  fileFormat: 'SHP'
});
