# A Comparison of ArcGIS GeoJSONLayer and Deck.gl GeoJsonLayer

## Setup

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
```

## Issues

- Anti-aliasing: The `@deck.gl/arcgis` package doesn't implement anti-aliasing issue
- Map Synchronization: To solve this issue, I've used `setInterval` to check the
  layer's lifecycle and ensure the layer is ready to be added to the map.

## References

- [ArcGIS Maps SDK for JavaScript - Build a custom layer view using deck.gl](https://developers.arcgis.com/javascript/latest/sample-code/custom-lv-deckgl/)
