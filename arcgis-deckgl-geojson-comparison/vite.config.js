export default ({ mode }) => ({
  base:
    mode === 'production'
      ? '/playground/arcgis-deckgl-geojson-comparison/'
      : '/',
})
