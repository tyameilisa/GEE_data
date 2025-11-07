// Load your region, number of asset is the kode for townsite (uploaded shapefile as FeatureCollection)
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08');

// Load the Open Buildings temporal dataset, keep in mind that this data stops at 2023
var col = ee.ImageCollection('GOOGLE/Research/open-buildings-temporal/v1');

/**
 * Adds building presence and height layers for a given timestamp.
 * @param {number} millis Timestamp in milliseconds.
 */
function addLayers(millis) {
  // Create a mosaic of tiles with the same timestamp.
  var mosaic = col.filter(ee.Filter.eq('system:time_start', millis)).mosaic();

  // Clip the mosaic to your region
  var clipped = mosaic.clip(region);

  // Extract year for labeling
  var year = new Date(millis).getFullYear();

  // Add building presence layer
  Map.addLayer(
      clipped.select('building_presence'),
      {max: 1},
      'building_presence_conf_' + year
  );

  // Export the building height image for this year, preferably .tif that can be processed in GIS
 Export.image.toDrive({
    image: clipped.select('building_height'),
    description: 'BuildingHeight_' + year,
    folder: 'GEE_Exports', // optional: name of the Drive folder
    scale: 10,              // Open Buildings is 10 m resolution
    region: region.geometry(),
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });

  // Add building height layer (hidden by default)
  Map.addLayer(
      clipped.select('building_height'),
      {max: 100},
      'building_height_m_' + year,
      false
  );
}

// Get timestamps for available images over your region
var ts = col.filterBounds(region)
             .aggregate_array('system:time_start')
             .distinct()
             .sort()
             .getInfo()
             .slice(-2);  // get last 2 timestamps

// Loop through and add layers for each timestamp
ts.forEach(addLayers);

// Center the map on your region
Map.centerObject(region, 13);

// Optional: visualize your region outline
Map.addLayer(region.style({color: 'red', fillColor: '00000000'}), {}, 'Region Boundary');
