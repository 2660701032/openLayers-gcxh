/*
 * @Author       : Chen Zhen
 * @Date         : 2018-10-27 15:35:32
 * @LastEditors  : Han Jia Yi
 * @LastEditTime : 2022-06-07 14:27:16
 * @Description  : 基础地图底图图层类
 */

import _ from 'lodash'

import TiandituLayer from './TiandituLayer'

import GCXHLayer from './GCXHLayer'

const KNOW_LAYERS = [
  {
    name: 'TiandituLayerVecW',
    label: '天地图-全球矢量地图服务',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerVecW',
      type: '矢量底图',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerVcaW',
    label: '天地图-全球矢量中文注记服务',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerVcaW',
      type: '矢量标注',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerImgW',
    label: '天地图-全球影像地图服务',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerImgW',
      type: '影像底图',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerCiaW',
    label: '天地图-全球影像中文注记服务',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerCiaW',
      type: '影像标注',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerTerW',
    label: '天地图-全球地形晕渲地图服务',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerTerW',
      type: '地形底图',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerCtaW',
    label: '天地图-全球地形中文标记服务',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerCtaW',
      type: '地形标注',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerIboW',
    label: '天地图-全球行政边界服务（影像）',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerIboW',
      type: '边界-影像',
      token: tiandituToken,
    })),
  },
  {
    name: 'TiandituLayerTboW',
    label: '天地图-全球行政边界服务（地形）',
    layer: ({ tiandituToken }) => (new TiandituLayer({
      id: 'TiandituLayerTboW',
      type: '边界-地形',
      token: tiandituToken,
    })),
  },

  {
    name: 'InnerTiandituLayerVecC',
    label: '天地图-全球矢量地图服务（离线部署）',
    layer: ({ url, layer }) => (new GCXHLayer({
      id: 'InnerTiandituLayerVecC',

      url,
      layer: layer || 'vec_c',
    })),
  },
  {
    name: 'InnerTiandituLayerCiaC',
    label: '天地图-全球矢量中文注记服务（离线部署）',
    layer: ({ url, layer }) => (new GCXHLayer({
      id: 'InnerTiandituLayerCiaC',

      url,
      layer: layer || 'cia_c',
    })),
  },
  {
    name: 'InnerTiandituLayerTile',
    label: '天地图-全球影像地图服务（离线部署）',
    layer: ({ url, layer }) => (new GCXHLayer({
      id: 'InnerTiandituLayerTile',

      url,
      layer: layer || 'tile_c',
    })),
  },
]

// let mapListNameCache = null // 用于懒缓存地图的name属性

/**
 * 支持的地图底图的图层数据，可以进行全局获取，亦可以根据对应的编码进行获取
 */
class Layer {
  /**
   * 返回支持的地图图层的数据
   */
  static KNOW_LAYERS() {
    return _.cloneDeep(KNOW_LAYERS)
  }

  // /**
  //  * 返回支持的底图对应的名称（name属性）
  //  */
  // static MapListName() {
  //   if (_.isNull(mapListNameCache)) {
  //     mapListNameCache = MAP_LIST.map((i) => i.name)
  //   }

  //   return mapListNameCache
  // }

  /**
   * 获取某个基础地图底图
   *
   * @param {String|Object} baselayer 基础地图底图的名称
   *
   * @param {Object} defaultOption MapPlugins提供的默认配置
   *
   * @return {Layer | null} 返回的底图
   *
   */
  static parse(baselayer, defaultOption) {
    if (_.isArray(baselayer)) {
      const layers = baselayer.map((i) => Layer.parse(i, defaultOption))

      return layers.filter((i) => i)
    }

    if (_.isString(baselayer)) {
      const baseLayer = KNOW_LAYERS.find((i) => i.name === baselayer)

      if (baseLayer) return baseLayer.layer(defaultOption)
      return null
    }

    if (_.isObject(baselayer)) {
      if ([ 'Tianditu', 'InnerTiandituGCXH' ].includes(baselayer.type)) {
        const baseLayer = KNOW_LAYERS.find((i) => i.name === baselayer.layer.name)
        if (baseLayer) return baseLayer.layer({ ...defaultOption, ...baselayer.layer })
        return null
      }

      if (baselayer.type === 'WMTS') {
        // ...
        return null
      }

      if (baselayer.type === 'custom') {
        return baselayer.layer
      }

      throw new TypeError(`option: ${baselayer} id not object or not string`)
    }

    throw new TypeError(`option: ${baselayer} id not object or not string`)
  }
}

export default Layer
