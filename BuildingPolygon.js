// ===== CONFIG =====
var region = ee.FeatureCollection('projects/ee-meilisa1146/assets/08');
var col = ee.ImageCollection('GOOGLE/Research/open-buildings-temporal/v1');
var threshold = 0.3;     // adjust 0.3-0.5 as needed
var pixelScale = 10;     // 10 m pixel (adjust if your export used different)
var minArea_m2 = 20;     // remove polygons smaller than this (m^2)

// ===== PREP IMAGE =====
var image = col.filterBounds(region)
               .select(['building_presence', 'building_height'])
               .median()
               .clip(region);

// binary building mask (1 = building)
var buildings = image.select('building_presence').gt(threshold);

// optional smoothing to remove tiny gaps
var smooth = buildings.selfMask()
                      .focal_max(1)   // dilate
                      .focal_min(1);  // erode

// ===== VECTORIZE =====
var vectors = smooth.reduceToVectors({
  geometry: region.geometry(),
  scale: pixelScale,
  geometryType: 'polygon',
  eightConnected: true,
  labelProperty: 'building',
  reducer: ee.Reducer.countEvery()
});

// attach mean height (if band exists)
var buildingHeight = image.select('building_height');
var withHeight = buildingHeight.reduceRegions({
  collection: vectors,
  reducer: ee.Reducer.mean(),
  scale: pixelScale
});

// ===== CLEAN GEOMETRIES & SAFE AREA CALC =====
// 1) buffer(0) to attempt fixing invalid/dangling geometries
// 2) compute area with a non-zero error margin using geometry(maxError).area()
var cleaned = withHeight.map(function(f) {
  var geom = f.geometry().buffer(0);           // try to fix invalid geometry
  // compute area using 1 meter error margin
  var area_m2 = geom.area(1);
  return f.set({'area_m2': area_m2});
});

// 3) filter small areas (noise)
var cleanBuildings = cleaned.filter(ee.Filter.gt('area_m2', minArea_m2));

// ===== EXPORT =====
Export.table.toDrive({
  collection: cleanBuildings,
  description: 'Building_Polygons_OpenBuildings_fixed',
  fileFormat: 'GeoJSON'
});
