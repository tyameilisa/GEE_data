var imageCollection = ee.ImageCollection("MODIS/061/MOD11A1");
var AOI = ee.FeatureCollection("projects/ee-siplmeilisa/assets/Jatim1");

// 1. FILTERING 2023
var modis23 = ee.ImageCollection('MODIS/061/MOD11A1')
                .filterDate('2023-10-01', '2023-10-31') // filter tanggal
                .filterBounds(AOI)  // Memastikan data hanya diambil dari AOI
                .select('LST_Day_1km') // filter band
                .mean()
                .clip(AOI);

//2. ANALISIS 2023
var celcius23 = modis23.multiply(0.02).subtract(273.15); // Konversi Kelvin di MODIS untuk ke Celsius

var suhuparam = {min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'orange', 'red']}; // Pengaturan untuk visualisasi

//3. KE PETA 2023
Map.addLayer(celcius23, suhuparam, 'Suhu Oktober 2023'); // Menambahkan layer ke peta

Map.centerObject(AOI, 10);// Inisialisasi Map dan menetapkan pusat peta

print ("Suhu Rata-Rata Jawa Timur Bulan Oktober 2023")

///////////////////////////////////////////////////////////

// 1. FILTERING 2024
var modis24 = ee.ImageCollection('MODIS/061/MOD11A1')
                .filterDate('2024-10-01', '2024-10-31') // filter tanggal
                .filterBounds(AOI)  // Memastikan data hanya diambil dari AOI
                .select('LST_Day_1km') // filter band
                .mean()
                .clip(AOI);

//2. ANALISIS 2024
// Konversi hasil ke Celsius
var celcius24 = modis24.multiply(0.02).subtract(273.15);

// Pengaturan untuk visualisasi
var suhuparam = {min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'orange', 'red']};

//3. KE PETA
// Menambahkan layer ke peta
Map.addLayer(celcius24, suhuparam, 'Suhu Oktober 2024');

// Inisialisasi Map dan menetapkan pusat peta
Map.centerObject(AOI, 10);

print ("Suhu Rata-Rata Jawa Timur Bulan Oktober 2024")

////////////////////////////////////////////////////////////

// Fungsi untuk membuat item legenda
function makeLegendItem(color, label) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      padding: '10px',
      margin: '0 0 4px 0'
    }
  });
  
  var description = ui.Label({
    value: label,
    style: {margin: '0 0 4px 6px'}
  });
  
  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}

// Membuat panel untuk legenda
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Menambahkan judul ke legenda
var legendTitle = ui.Label({
  value: 'My Legend',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 6px 0',
    padding: '0'
  }
});
legend.add(legendTitle);

// Menambahkan item legenda
legend.add(makeLegendItem('blue', '<20 Derajat C'));
legend.add(makeLegendItem('green', '20-25 Derajat C'));
legend.add(makeLegendItem('yellow', '25-30 Derajat C'));
legend.add(makeLegendItem('orange', '30-35 Derajat C'));
legend.add(makeLegendItem('red', '>35 Derajat C'));

// Menambahkan panel legenda ke peta
Map.add(legend);
