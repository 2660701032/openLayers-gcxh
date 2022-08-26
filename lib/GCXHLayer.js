/*
 * @Author       : Chen Zhen
 * @Date         : 2020-12-16 19:54:10
 * @LastEditors  : Chen Zhen
 * @LastEditTime : 2020-12-16 20:01:32
 */

import TileLayer from 'ol/layer/Tile'

import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import Projection from 'ol/proj/Projection'

import {
  get as getProjection,
} from 'ol/proj'

import { getWidth } from 'ol/extent'

const DEFAULT_OPTION = {
  type: '影像底图',
  opacity: 1,
  source: undefined,
  visible: true,
  extent: undefined,
}

const map = new Map()

const getTileInfo = (projection) => {
  if (!map.has(projection)) {
    const matrixIds = []
    const resolutions = []

    const tileSizePixels = 256
    const tileSizeMtrs = getWidth(getProjection(projection).getExtent()) / tileSizePixels

    for (let i = 0; i <= 16; i += 1) {
      matrixIds[i] = i
      resolutions[i] = tileSizeMtrs / (2 ** (i + 1))
    }

    map.set(projection, {
      matrixIds,
      resolutions,
    })
  }
  return map.get(projection)
}

class GCXHLayer {
  constructor(option) {
    const {
      id,
      opacity,
      url,
      layer,
      // type,
      visible = true,
      extent = [ 0, 0.0, 180.0, 90.0 ],
      projection = 'EPSG:4326',
    } = Object.assign(DEFAULT_OPTION, option)

    const {
      matrixIds,
      resolutions,
    } = getTileInfo(projection)

    const source = new WMTS({
      // 服务地址
      url,
      // url: `http://10.36.93.240:7090/rest/wmts`,
      layer,
      // 切片集
      matrixSet: 'satImage',
      format: 'image/jpeg',
      projection: new Projection({
        code: 'EPSG:4326', // 投影编码
        units: 'degrees',
        axisOrientation: 'neu',
      }),

      tileGrid: new WMTSTileGrid({
        tileSize: [ 256, 256 ],
        extent, // 范围
        origin: [ -180.0, 90.0 ],
        resolutions,
        matrixIds,
      }),
      wrapX: true,
    })

    const tileLayer = new TileLayer({
      id,
      opacity, // 可见度
      source,
      visible,
    })

    return tileLayer
  }
}

export default GCXHLayer
