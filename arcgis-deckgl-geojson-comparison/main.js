const LINESTRING_COLOR = [53, 206, 255]
const POINT_COLOR = [255, 165, 0]
const POLYGON_COLOR = [148, 232, 165]
const STROKE_LINE_COLOR = [255, 255, 255]

const POINT_URL = 'data/point.geojson'
const LINESTRING_URL = 'data/linestring.geojson'
const POLYGON_URL = 'data/polygon.geojson'

let deckgl_point_layer = null
let deckgl_linestring_layer = null
let deckgl_polygon_layer = null

window.onload = async () => {
  setFeatureCountAndDownloadLink(
    POINT_URL,
    'point_information',
    'point.geojson',
  )
  setFeatureCountAndDownloadLink(
    LINESTRING_URL,
    'linestring_information',
    'linestring.geojson',
  )
  setFeatureCountAndDownloadLink(
    POLYGON_URL,
    'polygon_information',
    'polygon.geojson',
  )

  require([
    'esri/Map',
    'esri/views/MapView',
    'esri/core/reactiveUtils',
    'esri/layers/GeoJSONLayer',
  ], (Map, MapView, reactiveUtils, GeoJSONLayer) => {
    const points_renderer = {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        color: POINT_COLOR,
        size: 5,
        outline: {
          color: 'white',
        },
      },
    }

    const linestring_renderer = {
      type: 'simple',
      symbol: {
        type: 'simple-line',
        color: LINESTRING_COLOR,
        width: 1,
      },
    }

    const polygon_renderer = {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: POLYGON_COLOR,
        outline: {
          color: STROKE_LINE_COLOR,
          width: 1,
        },
      },
    }

    const arcgis_point_layer = new GeoJSONLayer({
      url: POINT_URL,
      renderer: points_renderer,
    })

    const arcgis_linestring_layer = new GeoJSONLayer({
      url: LINESTRING_URL,
      renderer: linestring_renderer,
    })

    const arcgis_polygon_layer = new GeoJSONLayer({
      url: POLYGON_URL,
      renderer: polygon_renderer,
    })

    // Use native solution
    const map1 = new Map({
      basemap: 'gray-vector',
      layers: [
        arcgis_polygon_layer,
        arcgis_linestring_layer,
        arcgis_point_layer,
      ],
    })

    // Use deckgl solution
    const map2 = new Map({
      basemap: 'gray-vector',
    })

    const zoom = 11
    const center = [121.56, 25.05]

    const view1 = new MapView({
      container: 'view1Div',
      map: map1,
      center: center,
      zoom: zoom,
    })

    // Move the zoom control to the bottom right corner
    view1.ui.move(['zoom'], 'bottom-right')

    view1.when(async () => {
      console.log(`view1 is ready`)

      arcgis_point_layer.visible = true
      arcgis_linestring_layer.visible = false
      arcgis_polygon_layer.visible = false
    })

    const view2 = new MapView({
      container: 'view2Div',
      map: map2,
      center: center,
      zoom: zoom,
    })

    // Move the zoom control to the bottom right corner
    view2.ui.move(['zoom'], 'bottom-right')

    view2.when(async () => {
      console.log(`view2 is ready`)

      let layers = await createDeckglLayers()
      deckgl_point_layer = layers.point
      deckgl_linestring_layer = layers.linestring
      deckgl_polygon_layer = layers.polygon

      view2.map.add(deckgl_polygon_layer)
      view2.map.add(deckgl_linestring_layer)
      view2.map.add(deckgl_point_layer)

      deckgl_point_layer.visible = true
      deckgl_linestring_layer.visible = false
      deckgl_polygon_layer.visible = false
    })

    // Create a variable referencing the checkbox node
    const point_layer_toggle = document.getElementById('pointsLayer')
    const linestring_layer_toggle = document.getElementById('linestringsLayer')
    const polygon_layer_toggle = document.getElementById('polygonsLayer')

    point_layer_toggle.addEventListener('change', () => {
      arcgis_point_layer.visible = point_layer_toggle.checked
      deckgl_point_layer.visible = point_layer_toggle.checked
    })
    linestring_layer_toggle.addEventListener('change', () => {
      arcgis_linestring_layer.visible = linestring_layer_toggle.checked
      deckgl_linestring_layer.visible = linestring_layer_toggle.checked
    })
    polygon_layer_toggle.addEventListener('change', () => {
      arcgis_polygon_layer.visible = polygon_layer_toggle.checked
      deckgl_polygon_layer.visible = polygon_layer_toggle.checked
    })

    const views = [view1, view2]
    let active

    const sync = (source) => {
      if (!active || !active.viewpoint || active !== source) {
        return
      }

      for (const view of views) {
        if (view !== active) {
          view.viewpoint = active.viewpoint
        }
      }
    }

    for (const view of views) {
      const handle = reactiveUtils.watch(
        () => [view.interacting, view.viewpoint],
        ([interacting, viewpoint]) => {
          // Only print the new zoom value when the view is stationary
          if (interacting) {
            active = view
            sync(active)
          }
          if (viewpoint) {
            sync(view)
          }
        },
      )
    }
  })
}

const getFeatureCount = async (url) => {
  const response = await fetch(url)
  const data = await response.json()
  const count = data.features.length
  return count
}

const setFeatureCountAndDownloadLink = async (url, elementId, filename) => {
  getFeatureCount(url).then((count) => {
    // Create a href element for file name and allow download
    const a = document.createElement('a')
    a.href = url
    a.textContent = filename
    a.download = filename

    const numberOfFeatures = document.createElement('a')
    numberOfFeatures.textContent = ` (Count: ${count})`

    // Put file link and features count into the information div
    const information = document.getElementById(elementId)
    information.appendChild(a)
    information.appendChild(numberOfFeatures)
  })
}

const createDeckglLayers = async () => {
  let arcGIS = await deck.loadArcGISModules()
  const point_deck_layer = new arcGIS.DeckLayer()
  const linestring_deck_layer = new arcGIS.DeckLayer()
  const polygon_deck_layer = new arcGIS.DeckLayer()

  let point_layer = new deck.GeoJsonLayer({
    id: 'points',
    data: POINT_URL,
    getFillColor: POINT_COLOR,
    getRadius: 3,
    pointRadiusMinPixels: 2,
    stroked: true,
    getLineColor: STROKE_LINE_COLOR,
    getLineWidth: 1,
    onDataLoad: () => {
      console.log('points loaded')
    },
    onAfterRender: () => {
      console.log('points rendered')
    },
  })

  let linestring_layer = new deck.GeoJsonLayer({
    id: 'linestrings',
    data: LINESTRING_URL,
    getLineColor: LINESTRING_COLOR,
    getLineWidth: 3,
    lineWidthMinPixels: 2,
    onDataLoad: () => {
      console.log('linestrings loaded')
    },
    onAfterRender: () => {
      console.log('linestrings rendered')
    },
  })

  let polygon_layer = new deck.GeoJsonLayer({
    id: 'polygons',
    data: POLYGON_URL,
    getLineColor: STROKE_LINE_COLOR,
    getFillColor: POLYGON_COLOR,
    onDataLoad: () => {
      console.log('polygons loaded')
    },
    onAfterRender: () => {
      console.log('polygons rendered')
    },
  })

  // To ensure the layer is ready before adding it to the map
  let point_interval_id = setInterval(() => {
    if (point_layer.lifecycle === 'Awaiting state') {
      point_deck_layer.deck.layers = [point_layer]
    } else {
      clearInterval(point_interval_id)
    }
  }, 100)

  let linestring_interval_id = setInterval(() => {
    if (linestring_layer.lifecycle === 'Awaiting state') {
      linestring_deck_layer.deck.layers = [linestring_layer]
    } else {
      clearInterval(linestring_interval_id)
    }
  }, 100)

  let polygon_interval_id = setInterval(() => {
    if (polygon_layer.lifecycle === 'Awaiting state') {
      polygon_deck_layer.deck.layers = [polygon_layer]
    } else {
      clearInterval(polygon_interval_id)
    }
  }, 100)

  return new Promise((resolve) => {
    resolve({
      point: point_deck_layer,
      linestring: linestring_deck_layer,
      polygon: polygon_deck_layer,
    })
  })
}
