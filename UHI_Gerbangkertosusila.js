//PRAKTIK MATA KULIAH SIPL - NOV 2024

// Fungsi untuk masking awan dan bayangan awan
function maskL8sr(col) { //Fungsi untuk memanggil penghapus awan
    var cloudShadowBitMask = (1 << 3); //mendeteksi bayangan awan bit 3 (8)
    var cloudsBitMask = (1 << 5); //mendeteksi bayangan awan bit 5 (32)
    var qa = col.select('QA_PIXEL'); //data band yang berisi kondisi pixel awan, bayangan awan, salju, dll
    var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0)); //memulai analisis kondisi pixel
    return col.updateMask(mask); //hanya menampilkan citra yang true
}

// Koleksi citra Landsat dengan filter tanggal, area, dan masking awan
var dataset = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') // memanggil landsat 8
    .filterDate('2023-01-01', '2023-12-31') //filter date
    .filterBounds(AOI) //filter sesuai AOI
    .map(maskL8sr) //masking awan
    .median(); //median dari setiap piksel di seluruh citra

// Fungsi untuk menerapkan skala faktor pada band optik
function applyScaleFactors(image) {
    var opticalBands = image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'])
                            .multiply(0.0000275).add(-0.2); //mengonversi data integer mentah menjadi nilai yang tepat
    var thermalBand = image.select('ST_B10'); // Menambahkan band termal tanpa skala faktor tambahan
    return image.addBands(opticalBands, null, true).addBands(thermalBand);
}

// Menerapkan skala faktor untuk persiapan analisis
dataset = applyScaleFactors(dataset);

// Visualisasi RGB
var visualization = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.3
};
Map.addLayer(dataset.clip(AOI), visualization, 'Citra GKS Plus',false);
Map.centerObject(AOI, 10);


var ndvi = dataset.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI'); //perhitungan NDVI (NIR RED)
Map.addLayer(ndvi.clip(AOI), {min: -0.1, max: 0.6, palette: ['blue', 'white', 'green']}, 'NDVI',false);

// Perhitungan Fraksi Vegetasi (FV)/seberapa banyak vegetasi di suatu kawasan
var ndvi_min = ee.Number(ndvi.reduceRegion({ //mencari nilai minimum NDVI
    reducer: ee.Reducer.min(),
    geometry: AOI,
    scale: 30,
    maxPixels: 1e9
}).values().get(0));

var ndvi_max = ee.Number(ndvi.reduceRegion({ //Mencari nilai maksimum NDVI
    reducer: ee.Reducer.max(),
    geometry: AOI,
    scale: 30,
    maxPixels: 1e9
}).values().get(0));

var fv = ndvi.subtract(ndvi_min).divide(ndvi_max.subtract(ndvi_min)).pow(ee.Number(2)).rename('FV'); //melakukan perhitungann fraksi dengan metode rentang min max

// Perhitungan Emisivitas sesuai rumus
var em = fv.multiply(ee.Number(0.004)).add(ee.Number(0.986)).rename('EM');

// Mengambil band termal
var thermal = dataset.select('ST_B10').rename('thermal');

// Perhitungan LST (Land Surface Temperature) sesuai rumus
var lst = thermal.expression(
    '(tb / (1 + (0.00115 * (tb / 1.4388)) * log(em))) - 273.15',
    {
        'tb': thermal.select('thermal'), //menggunakan data termal
        'em': em //menggunakan data emisi
    }
).rename('LST');

//Memunculkan dalam peta
Map.addLayer(lst.clip(AOI), imageVisParam, 'LST',false);

// Memusatkan tampilan peta ke AOI
Map.centerObject(AOI, 10);

// Urban Heat Island ***********************************************************************

// 1. Menghitung normalisasi UHI sesuai rumus

var lst_mean = ee.Number(lst.reduceRegion({ //menghitung rata-rata LST pada AOI
reducer: ee.Reducer.mean(),
geometry: AOI,
scale: 30,
maxPixels: 1e9
}).values().get(0))


var lst_std = ee.Number(lst.reduceRegion({ //menghitung standar deviasi LST pada AOI
reducer: ee.Reducer.stdDev(),
geometry: AOI,
scale: 30,
maxPixels: 1e9
}).values().get(0))

var uhi = lst.subtract(lst_mean).divide(lst_std).rename('UHI') //menghitunga UHI dengan mengurangi LST dengan mean lalu menormalkan dengan std

//visualisasi UHI
var uhi_vis = {
min: -4,
max: 4,
palette:['blue', 'green', 'yellow', 'orange', 'red']
}
Map.addLayer(uhi.clip(AOI), uhi_vis, 'UHI Gerbangkertasusila Plus')
Map.centerObject(AOI, 10);

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

//'blue', 'green', 'yellow', 'orange', 'red'

// Menambahkan item legenda
legend.add(makeLegendItem('blue', '<20 Derajat C'));
legend.add(makeLegendItem('green', '20-25 Derajat C'));
legend.add(makeLegendItem('yellow', '25-30 Derajat C'));
legend.add(makeLegendItem('orange', '30-35 Derajat C'));
legend.add(makeLegendItem('red', '>35 Derajat C'));

// Menambahkan panel legenda ke peta
Map.add(legend);

//Eksplorasi hubungan UHI dengan kawasan terbangun, bervegetasi, dan badan air
//Perhitungan NDBI
var ndbi = dataset.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI'); //perhitungan NDBI (SWIR NIR)
Map.addLayer(ndbi.clip(AOI), {min: -0.1, max: 0.3, palette: ['green', 'yellow', 'orange','red']}, 'NDBI',false); //Visualisasi pada peta

var bui = ndbi.subtract(ndvi).rename('BUI'); //perhitungan indeks keterbangunan (NDBI-NDVI)
Map.addLayer(bui.clip(AOI), {min: -1, max: 1, palette: ['white','green','yellow','red','brown','blue','orange']}, 'Build-up Index',false); //Visualisasi pada peta

//Korelasi UHI dan BUI
//Diagram scatterplot antara UHI dan BUI
// Gabungkan UHI dan BUI menjadi satu image
var combinedIndices = uhi.addBands(bui);

// Pengambilan sampel nilai dari berbagai indeks yang telah digabungkan yaitu UHI dan BUI
var points = combinedIndices.sample({
  region: AOI,
  scale: 30,
  numPixels: 2000, //jumlah sample 2000 titik secara acak
  seed: 0,
  geometries: true
});

// Transformasi data yang telah disampling menjadi FeatureCollection
var featureCollection = ee.FeatureCollection(points);

// Pembuatan diagram scatterplot antara UHI dan BUI
var chart = ui.Chart.feature.byFeature(points, 'BUI', 'UHI')
  .setOptions({
    title: 'Korelasi antara UHI dan BUI',
    hAxis: {title: 'BUI'},//Sumbu horizontal
    vAxis: {title: 'UHI'},//Sumbu vertikal
    pointSize: 3,
    trendlines: {0: {visible: true, color: 'CC0000'}}  // Penambahan garis tren pada data
  });

// Menampilkan diagram pada konsol
print(chart);

//Analisis korelasi pearson antara UHI dengan BUI
//Proses penggabungan data untuk analisis korelasi pearson
var combinedImage = uhi.addBands(bui);

// Melakukan pendefinisian area untuk melakukan korelasi
var region = points; // Korelasi menggunakan titik sample

// Perhitungan korelasi antara UHI dan BUI
var correlation = combinedImage.select(['UHI', 'BUI'])//Memasukkan data variabel yang akan digunakan
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),//Proses menghitung korelasi Pearson antara variabel yang dipilih
    geometry: region,//Korelasi akan menggunakan titik sample
    scale: 30, // Resolusi data citra
    maxPixels: 1e9
  });

// Print analisis korelasi Pearson antara UHI dan BUI
print('Pearson correlation UHI dan BUI', correlation);

//Korelasi UHI dan NDVI
//Diagram scatterplot antara UHI dan NDVI
// Gabungkan UHI dan NDVI menjadi satu image
var combinedIndices2 = uhi.addBands(ndvi);

// Pengambilan sampel nilai dari berbagai indeks yang telah digabungkan yaitu UHI dan NDVI
var points2 = combinedIndices2.sample({
  region: AOI,
  scale: 30,
  numPixels: 2000,//jumlah sample 2000 titik secara acak
  seed: 0,
  geometries: true
});

// Transformasi data yang telah disampling menjadi FeatureCollection
var featureCollection2 = ee.FeatureCollection(points2);

// Pembuatan diagram scatterplot antara UHI dan NDVI
var chart = ui.Chart.feature.byFeature(points2, 'NDVI', 'UHI')
  .setOptions({
    title: 'Korelasi antara UHI dan NDVI',
    hAxis: {title: 'NDVI'},//Sumbu horizontal
    vAxis: {title: 'UHI'},//Sumbu vertikal
    pointSize: 3,
    trendlines: {0: {visible: true, color: 'CC0000'}}  // Penambahan garis tren pada data
  });

// Menampilkan diagram pada konsol
print(chart);

//Analisis korelasi pearson antara UHI dengan NDVI
//Proses penggabungan data untuk analisis korelasi pearson
var combinedImage2 = uhi.addBands(ndvi);

// Melakukan pendefinisian area untuk melakukan korelasi
var region2 = points2; // Korelasi menggunakan titik sample

// Perhitungan korelasi antara UHI dan NDVI
var correlation2 = combinedImage2.select(['UHI', 'NDVI']) //Memasukkan data variabel yang akan digunakan
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),//Proses menghitung korelasi Pearson antara variabel yang dipilih
    geometry: region2,//Korelasi akan menggunakan titik sample
    scale: 30, 
    maxPixels: 1e9
  });

// Print analisis korelasi Pearson antara UHI dan NDVI
print('Pearson correlation UHI dan NDVI', correlation2);

//Perhitungan NDWI__________________________

var ndwi = dataset.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI'); //perhitungan NDBI (GREEN NIR)
Map.addLayer(ndwi.clip(AOI), {
    min: -0.1, max: 0.1, 
    palette: ['00FFFF', '0000FF']
}, 'NDWI',false);//Visualisasi pada peta


//Korelasi UHI dan NDWI
//Diagram scatterplot antara UHI dan NDWI
// Gabungkan UHI dan NDWI menjadi satu image
var combinedIndices3 = uhi.addBands(ndwi);

// Pengambilan sampel nilai dari berbagai indeks yang telah digabungkan yaitu UHI dan NDWI
var points3 = combinedIndices3.sample({
  region: AOI,
  scale: 30,
  numPixels: 2000,//jumlah sample 2000 titik secara acak
  seed: 0,
  geometries: true
});

// Transformasi data yang telah disampling menjadi FeatureCollection
var featureCollection3 = ee.FeatureCollection(points3);

// Pembuatan diagram scatterplot antara UHI dan NDWI
var chart = ui.Chart.feature.byFeature(points3, 'NDWI', 'UHI')
  .setOptions({
    title: 'Korelasi antara UHI and NDWI',
    hAxis: {title: 'NDWI'},//Sumbu horizontal
    vAxis: {title: 'UHI'},//Sumbu vertikal
    pointSize: 3,
    trendlines: {0: {visible: true, color: 'CC0000'}}  // Penambahan garis tren pada data
  });

// Menampilkan diagram pada konsol
print(chart);

//Analisis korelasi pearson antara UHI dengan NDWI
//Proses penggabungan data untuk analisis korelasi pearson
var combinedImage3 = uhi.addBands(ndwi);

// Melakukan pendefinisian area untuk melakukan korelasi
var region3 = points3; // Korelasi menggunakan titik sample

// Perhitungan korelasi antara UHI dan NDVI
var correlation3 = combinedImage3.select(['UHI', 'NDWI']) //Memasukkan data variabel yang akan digunakan
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),//Proses menghitung korelasi Pearson antara variabel yang dipilih
    geometry: region3,//Korelasi akan menggunakan titik sample
    scale: 30, 
    maxPixels: 1e9
  });

// Print analisis korelasi Pearson antara UHI dan NDWI
print('Pearson correlation UHI dan NDWI', correlation3);

//Eksplorasi hubungan BUI dengan NDWI-----------------------
//Korelasi BUI dan NDWI
//Diagram scatterplot antara BUI dan NDWI
// Gabungkan BUI dan NDWI menjadi satu image
var combinedIndices4 = bui.addBands(ndwi);

// Pengambilan sampel nilai dari berbagai indeks yang telah digabungkan yaitu BUI dan NDWI
var points4 = combinedIndices4.sample({
  region: AOI,
  scale: 30,
  numPixels: 2000,//jumlah sample 2000 titik secara acak
  seed: 0,
  geometries: true
});

// Transformasi data yang telah disampling menjadi FeatureCollection
var featureCollection4 = ee.FeatureCollection(points3);

// Pembuatan diagram scatterplot antara BUI dan NDWI
var chart = ui.Chart.feature.byFeature(points4, 'NDWI', 'BUI')
  .setOptions({
    title: 'Korelasi antara BUI dengan NDWI',
    hAxis: {title: 'NDWI'},//Sumbu horizontal
    vAxis: {title: 'BUI'},//Sumbu vertikal
    pointSize: 3,
    trendlines: {0: {visible: true, color: 'CC0000'}}  // Penambahan garis tren pada data
  });

// Menampilkan diagram pada konsol
print(chart);

//Analisis korelasi pearson antara BUI dengan NDWI
//Proses penggabungan data untuk analisis korelasi pearson
var combinedImage4 = bui.addBands(ndwi);

// Melakukan pendefinisian area untuk melakukan korelasi
var region4 = points4; // Korelasi menggunakan titik sample

// Perhitungan korelasi antara BUI dan NDVI
var correlation4 = combinedImage4.select(['BUI', 'NDWI']) //Memasukkan data variabel yang akan digunakan
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),//Proses menghitung korelasi Pearson antara variabel yang dipilih
    geometry: region4,//Korelasi akan menggunakan titik sample
    scale: 30, 
    maxPixels: 1e9
  });

// Print analisis korelasi Pearson antara BUI dan NDWI
print('Pearson correlation BUI dan NDWI', correlation4);
