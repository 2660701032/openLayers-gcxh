/*
 * @Author       : Chen Zhen
 * @Date         : 2018-10-27 15:34:49
 * @LastEditors  : Chen Zhen
 * @LastEditTime : 2021-12-14 15:33:31
 * @Description  : Openlayer MapPlus 入口
 */

import './MapPlugins.css'

// import Feature from 'ol/Feature'

// import { GeoJSON, TopoJSON } from 'ol/format'

// import {
//   Style,
//   Stroke,
//   Fill,
// } from 'ol/style'

// import { Image as ImageLayer } from 'ol/layer'
// import Static from 'ol/source/ImageStatic'
// import MousePosition from 'ol/control/MousePosition'

// import WMTSTileGrid from 'ol/tilegrid/WMTS'
// import WMTS from 'ol/source/WMTS'
// import TileLayer from 'ol/layer/Tile'

// import { createStringXY } from 'ol/coordinate'

// import {
//   getCenter as getExtentCenter,
//   getWidth as getExtentWidth,
//   getTopLeft as getExtentTopLeft,
// } from 'ol/extent'

// import {
//   transformExtent,
//   getTransform,
//   get as getProjection,
// } from 'ol/proj'

import MapPlugins from './MapPlugins'
import LayerPlugins from './Layer'

MapPlugins.Layer = LayerPlugins

export default {
  MapPlugins,
  // Feature,
  // GeoJSON,
  // TopoJSON,
  // Style,
  // Stroke,
  // Fill,
  // ImageLayer,
  // Static,
  // MousePosition,
  // WMTSTileGrid,
  // WMTS,
  // TileLayer,
  // createStringXY,
  // transformExtent,
  // getTransform,
  // getExtentCenter,
  // getExtentWidth,
  // getExtentTopLeft,
  // getProjection,
}
