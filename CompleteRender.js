//AREA BUFFER
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08'); // perhatikan kode kawasan
var col = ee.ImageCollection('GOOGLE/Research/open-buildings-temporal/v1'); //V1 is for building presence
function addLayers(millis) {
  var mosaic = col.filter(ee.Filter.eq('system:time_start', millis)).mosaic();
  var clipped = mosaic.clip(region);
  var year = new Date(millis).getFullYear();
  Map.addLayer(
      clipped.select('building_presence'),
      {max: 1},
      'building_presence_conf_' + year
  );
 Export.image.toDrive({
    image: clipped.select('building_height'),
    description: 'BuildingHeight_' + year,
    folder: 'GEE_Exports', // optional: name of the Drive folder, ubah sesuai proyek 
    scale: 10,              // Open Buildings is 10 m resolution by default, gausah diubah
    region: region.geometry(),
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });
  Map.addLayer(
      clipped.select('building_height'),
      {max: 100},
      'building_height_m_' + year,
      false
  );
}
var ts = col.filterBounds(region)
             .aggregate_array('system:time_start')
             .distinct()
             .sort()
             .getInfo()
             .slice(-5);  // get last 5 timestamps (tahun) 
ts.forEach(addLayers);
Map.centerObject(region, 13);
Map.addLayer(region.style({color: 'white', fillColor: '00000000'}), {}, 'Region Boundary');

//BUILDING POLYGON
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08');
var buildings = ee.FeatureCollection('GOOGLE/Research/open-buildings/v3/polygons')
                    .filterBounds(region); //V3 is for building polygon
print('Number of building polygons in region:', buildings.size());
Map.centerObject(region, 13);
Map.addLayer(region.style({color: 'white', fillColor: '00000000'}), {}, 'Region Boundary');
Map.addLayer(buildings.limit(5000), {color: 'grey'}, 'Buildings sample');  // limit for DISPLAY only
Export.table.toDrive({
  collection: buildings,
  folder: 'GEE_Exports', // optional: name of the Drive folder, ubah sesuai proyek 
  description: 'OpenBuildings_v3_08',
  fileFormat: 'SHP'
});
