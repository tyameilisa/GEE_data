// === FUNCTIONAL LEGEND FOR BUILDING HEIGHT & PRESENCE ===

// Function to create legend panels
function makeLegend(title, palette, min, max, unit) {
  var legend = ui.Panel({
    style: {
      padding: '8px',
      position: 'bottom-left'
    }
  });

  // Title
  legend.add(ui.Label({
    value: title,
    style: {fontWeight: 'bold', fontSize: '13px'}
  }));

  // Color bar (horizontal gradient)
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat()
             .select(0)
             .multiply((max - min) / 100.0)
             .add(min)
             .visualize({min: min, max: max, palette: palette}),
    params: {bbox: [0, 0, 100, 10], dimensions: '100x10'},
    style: {stretch: 'horizontal', margin: '4px 8px', maxHeight: '24px'}
  });
  legend.add(colorBar);

  // Min–max labels
  var legendLabels = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {justifyContent: 'space-between'}
  });
  legendLabels.add(ui.Label(min.toString()));
  legendLabels.add(ui.Label(max.toString() + ' ' + unit));
  legend.add(legendLabels);

  return legend;
}

// === ADD LEGENDS TO MAP ===

// Example 1 — Building Height (meters)
var heightLegend = makeLegend(
  'Building Height (m)',
  ['white','blue','green','yellow','red'],
  0, 30, 'm'
);
Map.add(heightLegend);

// Example 2 — Building Presence Confidence
var presenceLegend = makeLegend(
  'Building Presence Confidence',
  ['white','gray','blue','green','yellow','red'],
  0, 1, '' // confidence is 0–1
);
Map.add(presenceLegend);
