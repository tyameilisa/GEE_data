//PRAKTIKUM MATA KULIAH SIPL - NOV 2024

// 1. Definisikan Area of Interest (Pulau Jawa)
var jawa = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'Indonesia'))
  .filter(ee.Filter.inList('ADM1_NAME', ['Banten', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur']));

//2. panggil satelit
var sentinel = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .filterBounds(jawa)
  .filterDate('2020-01-01', '2020-01-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median();

// 3. Tampilkan di peta (band 4,3,2 = true color)
Map.centerObject(jawa, 7);
Map.addLayer(sentinel.clip(jawa), {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Sentinel-2 Januari 2024');

// 4. Tambahkan batas provinsi
Map.addLayer(jawa.style({color: 'black', fillColor: '00000000', width: 1}), {}, 'Batas Pulau Jawa');

//tambahkan viirs
var viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .filterDate('2024-01-01', '2024-01-31')
  .select('avg_rad') // nilai rata-rata cahaya malam
  .first();
  
// Visualisasi
var visParams = {
  min: 0,
  max: 10,
  palette: ['000000', '0c0c3f', '2a33ff', 'ffffff']
};

// Tampilkan di peta
Map.centerObject(jawa, 7);
Map.addLayer(viirs.clip(jawa), visParams, 'Cahaya Malam - Jan 2024');
Map.addLayer(jawa.style({color: 'white', fillColor: '00000000', width: 1}), {}, 'Batas Provinsi');

// 5. Buat LEGEND UI (Seperti sebelumnya)

// Fungsi buat kotak warna legend
function makeColorBox(color) {
  return ui.Label({
    style: {
      backgroundColor: color,
      padding: '8px',
      margin: '0 8px 0 0',
      width: '24px',
      height: '16px',
      border: '1px solid #000'
    }
  });
}

// Fungsi buat label teks legend
function makeLabel(text) {
  return ui.Label({
    value: text,
    style: {margin: '0 0 0 0', fontWeight: 'normal'}
  });
}

// Daftar warna dan nilai legenda
var palette = visParams.palette;
var labels = ['0 (gelap)', '10', '20', '30', '40+ (terang)'];

// Buat panel legend
var legendPanel = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
    fontSize: '12px'
  }
});

// Tambah judul legend
legendPanel.add(ui.Label('Cahaya Malam (avg_rad)'));

// Loop untuk tambahkan warna + label ke legend
for (var i = 0; i < palette.length; i++) {
  var row = ui.Panel({
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '4px 0'}
  });
  row.add(makeColorBox(palette[i]));
  row.add(makeLabel(labels[i]));
  legendPanel.add(row);
}

// Tampilkan legend di peta
Map.add(legendPanel);

//mengatasi DKJ dan DIY nggak muncul
print('Nilai Jakarta', viirs.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: jawa.filter(ee.Filter.eq('ADM1_NAME', 'DKI Jakarta')).geometry(),
  scale: 500,
  maxPixels: 1e9
}));

print('Nilai DIY', viirs.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: jawa.filter(ee.Filter.eq('ADM1_NAME', 'DI Yogyakarta')).geometry(),
  scale: 500,
  maxPixels: 1e9
}));

