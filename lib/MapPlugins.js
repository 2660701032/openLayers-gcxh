/*
 * @Author       : Chen Zhen
 * @Date         : 2018-10-27 14:01:47
 * @LastEditors  : Chen Zhen
 * @LastEditTime : 2022-03-16 10:00:12
 * @Description  : 地图主类
 */

import _ from 'lodash'

import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
// import Layer from 'ol/layer/Layer'

import {
  transform,
  transformExtent,
  // get as getProjection,
} from 'ol/proj'

// import { getWidth, getTopLeft } from 'ol/extent'

import Point from 'ol/geom/Point'

import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import { defaults as defaultInteractions } from 'ol/interaction'

// import Projection from 'ol/proj/Projection'
// import TileWMS from 'ol/source/TileWMS'
import ImageWMSSource from 'ol/source/ImageWMS'
import ImageLayer from 'ol/layer/Image'

import TileLayer from 'ol/layer/Tile'
// import WMTS from 'ol/source/WMTS'
// import WMTSTileGrid from 'ol/tilegrid/WMTS'
import XYZ from 'ol/source/XYZ'

import { defaults as defaultControls } from 'ol/control'

import LayerPlugins from './Layer'
import DrawTool from './DrawTool'
import Measure from './Measure'

export const DEFAULT_CENTER = [ 104.29482679000004, 38.11539371468646 ]
export const DEFAULT_ZOOM = 4

// if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
//   DEFAULT_ZOOM = 3.8
// } else if (/(Android)/i.test(navigator.userAgent)) {
//   DEFAULT_ZOOM = 3.8
// }

// // eslint-disable-next-line max-len
// const gridNames = [ 'EPSG:4326:0', 'EPSG:4326:1', 'EPSG:4326:2', 'EPSG:4326:3', 'EPSG:4326:4', 'EPSG:4326:5', 'EPSG:4326:6', 'EPSG:4326:7', 'EPSG:4326:8', 'EPSG:4326:9', 'EPSG:4326:10', 'EPSG:4326:11', 'EPSG:4326:12', 'EPSG:4326:13', 'EPSG:4326:14', 'EPSG:4326:15', 'EPSG:4326:16', 'EPSG:4326:17', 'EPSG:4326:18', 'EPSG:4326:19', 'EPSG:4326:20', 'EPSG:4326:21' ]

// // 切片大小
// // eslint-disable-next-line max-len
// const resolutions = [ 0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 6.866455078125E-4, 3.4332275390625E-4, 1.71661376953125E-4, 8.58306884765625E-5, 4.291534423828125E-5, 2.1457672119140625E-5, 1.0728836059570312E-5, 5.364418029785156E-6, 2.682209014892578E-6, 1.341104507446289E-6, 6.705522537231445E-7, 3.3527612686157227E-7 ]

// const DEFAULT_EPSG = 'EPSG:3857'

/**
 * 解析地图容器
 * @param {HTMLElement | String} container 地图的容器
 */
const getContainer = (container) => {
  if (_.isElement(container)) return container
  if (_.isString(container)) {
    const dom = document.getElementById(container)
    if (_.isElement(dom)) return dom
    throw new ReferenceError(`container: ${container} is String, but not HTMLElement Id`)
  } else {
    throw new TypeError(`container: ${container} is not HTMLElement or String(HTMLElement Id)`)
  }
}

/**
 *
 * TODOLIST
 * 1. 增加 点 线 面 选中功能
 * 2. 增加 灵活替换底图的机制
 * 3. 增加 添加各项地图的方式 着重 wms wfs 服务 并将服务发布的方式快捷发布
 */

class MapPlus {
  /**
   *
   * 初始化地图容器的构造函数
   *
   * @param {HTMLElement | String} container 地图的容器
   * @param {Object} option 配置项
   * @param {String | Array<String | Layer>} baseLayers 底图的名称，可以支持多个图层的加载,加载顺序为，排列在前的优先进行加载，排在最下侧
   */
  constructor(container, {
    interactions = null,
    view,
    baseLayers = null, // 默认底图
    defaultExtent,
    defaultCenter = DEFAULT_CENTER,
    defaultZoom = DEFAULT_ZOOM,
    maxZoom = 18,
    defaultPluginControls = [],
    tiandituToken,

    // epsg = DEFAULT_EPSG
  } = {}) {
    this.version = '0.0.1' // 版本号

    this.tiandituToken = tiandituToken

    this.container = getContainer(container) // 地图的容器

    this.baseLayers = this.getBaselayers(baseLayers) // 地图需要进行加载的底图

    this._map = null // 对应的Map

    this._measure = null // 用来保存测量功能对象的属性

    this._drawTool = null // 用来保存绘制功能对象的属性

    this._view = view // 之前继续你功能赋值的view

    this.defaultExtent = defaultExtent ? transformExtent(defaultExtent, 'EPSG:4326', 'EPSG:3857') : null

    this.defaultCenter = transform(defaultCenter, 'EPSG:4326', 'EPSG:3857')

    this.defaultZoom = defaultZoom

    this.interactions = interactions

    this._maxZoom = maxZoom

    this.defaultPluginControls = defaultPluginControls

    this.init() // 初始化

    return this
  }

  /**
   * ------------------------------------------------
   * -------------------内部方法----------------------
   * ------------------------------------------------
   */

  /**
   * ------------------------------------------------
   * --------------------基础------------------------
   * ------------------------------------------------
   */

  getMap() {
    return this._map
  }

  /**
   * 初始化方法，不允许重复调用
   */
  init() {
    // 默认使用 EPSG:3857 坐标系
    // 如果在外部穿参 进来 则直接替换view
    const view = this._view || new View({
      // projection: new Projection(this.epsg),
      // extent: this.defaultExtent,
      center: this.defaultCenter, // 中心点设定为天安门
      zoom: this.defaultZoom,
      maxZoom: this._maxZoom || 18,
      minZoom: 1,
    })
    this._map = new Map({
      view,
      controls: defaultControls({ zoom: false }).extend(this.defaultPluginControls),

      interactions: this.interactions || defaultInteractions({
        pinchRotate: false,
        doubleClickZoom: false,
      }),

      layers: this.baseLayers, // 默认值为 null
      target: this.container,
    })

    // defaultExtent 优先级更高一点
    if (_.isArray(this.defaultExtent) && this.defaultExtent.length === 4) view.fit(this.defaultExtent, { duration: 0 })
  }

  getCenter() {
    return transform(this.getMap().getView().getCenter(), 'EPSG:3857', 'EPSG:4326')
  }

  getExtent() {
    return transformExtent(this.getMap().getView().calculateExtent(), 'EPSG:3857', 'EPSG:4326')
  }

  getZoom() {
    return this.getMap().getView().getZoom()
  }

  /**
   * 销毁方法
   */
  destory() {
    // 需要进行销毁测量功能
    if (this._measure instanceof Measure) this._measure.destory()
  }

  /**
   * resize事件需要进行调用的事件
   */
  // eslint-disable-next-line class-methods-use-this
  resizeHandle() {
    this._map.setSize([ this.container.offsetWidth, this.container.offsetHeight ])
    this._map.setSize([ this.container.offsetWidth, this.container.offsetHeight ])
  }

  /**
   * 执行ol,map的render钩子函数
   */
  // eslint-disable-next-line class-methods-use-this
  renderHandle() {}

  /**
   * 恢复初始化默认位置
   */
  moveHome() {
    const _view = this._map.getView()

    if (_.isArray(this.defaultExtent) && this.defaultExtent.length === 4) {
      _view.fit(this.defaultExtent, { duration: 0 })
    } else {
      // this._map.view.
      _view.setCenter(this.defaultCenter)
      _view.setZoom(this.defaultZoom)
    }
  }

  moveHomeFit({
    duration = 1000,
    maxZoom = this.defaultZoom,
    callback = null,
  } = {}) {
    this._map.getView().fit(new Point(this.defaultCenter), {
      duration,
      maxZoom,
      callback: () => {
        // this.spotLayer.setVisible(true)
        if (callback) callback()
      },
    })
  }

  /**
   * 增加图层
   */
  addLayer(layer, opt = {}) {
    if (_.isNil(opt.index)) {
      this._map.addLayer(layer)
    } else {
      layer.setZIndex(opt.index)
      this._map.getLayers().insertAt(opt.index, layer)
    }
  }

  /**
   * 移除对应的图层
   */
  removeLayer(layer) {
    this._map.removeLayer(layer)
  }

  getBaselayers(layers) {
    if (_.isString(layers) || _.isObject(layers)) {
      return LayerPlugins.parse(layers, { tiandituToken: this.tiandituToken })
    }

    if (_.isArray(layers)) {
      const layerList = LayerPlugins.parse(layers, { tiandituToken: this.tiandituToken })

      layerList.forEach((i, index) => {
        i.setZIndex(index)
      })

      return layerList
    }

    if (_.isNil(layers)) return null

    throw new TypeError(`option.baselayers: ${layers} is not MapPlus.BaseLayer.MapList[?].Name 、 Array<MapPlus.BaseLayer.MapList[?].Name | Layer> or null`)
  }

  /**
   * 增加对应的基础的图层
   * @param {String} baseLayer 已经设置好的地图底图的名称
   */
  addBaseLayer(baseLayer, index) {
    let layer = null
    if (_.isString(baseLayer) || _.isObject(baseLayer)) {
      // TODO 应该添加哪里的图层是否存在的判断

      layer = LayerPlugins.parse(baseLayer, { tiandituToken: this.tiandituToken })
    } else {
      // 补充其他类型 ！！！
    }

    if (layer !== null) {
      this.baseLayers[index] = layer
      layer.setZIndex(index)
      this._map.getLayers().insertAt(index, layer)
    } else {
      // console.error('添加地图异常')
    }
  }

  /**
   * 移除对应的基础图层
   * @param {String} baseLayerName 已经设置好的地图底图的名称
   */
  removeBaseLayer(baseLayerName) {
    const layer = this._map.getLayers().getArray().find((_layer) => _layer.values_.id === baseLayerName)
    if (layer) this._map.removeLayer(layer)
  }

  /**
   * `addWMSLayer` 函数没想好怎么进行封装，先使用 `addGeoServerWMS3857Layer`
   */
  addGeoServerWMS3857Layer({
    serverURL,
    layers,
    visible = true,
    account,
    passwd,
    cqlFilter = null,
    styles = null,
    index = null,
  }, opt = {}) {
    if (_.isNumber(index)) opt.index = index

    const sourceOptions = {
      crossOrigin: 'anonymous',
      // 服务地址
      url: serverURL,
      // projection: new Projection(srs),
      params: {
        // 以下属性固定为大写，不允许进行修改
        'FORMAT': 'image/png', // eslint-disable-line quote-props
        'VERSION': '1.1.1', // eslint-disable-line quote-props
        'SRS': 'EPSG:3857', // eslint-disable-line quote-props
        layers,
        exceptions: 'application/vnd.ogc.se_inimage',
        // ratio,
      },
      // serverType,
      // projection,
    }

    if (cqlFilter) sourceOptions.params['CQL_FILTER'] = cqlFilter // eslint-disable-line dot-notation
    if (styles) sourceOptions.params['STYLES'] = styles // eslint-disable-line dot-notation

    if (_.isString(account)) sourceOptions.params.ACCOUNT = account
    if (_.isString(passwd)) sourceOptions.params.PASSWD = passwd

    const source = new ImageWMSSource(sourceOptions)

    const layer = new ImageLayer({
      visible,
      source,
    })

    this.addLayer(layer, opt)
    return layer
  }

  /**
   * 添加WMS服务
   */
  // addWMSlayer({
  //   serverURL,
  //   layers,
  //   projection = 'EPSG:3857',
  //   format = 'image/png',
  //   version = '1.1.1',
  //   visible = true,
  //   // ratio = 1,
  //   account,
  //   passwd,
  //   cqlFilter = null,
  //   styles = null,
  // }, opt = {}) {
  //   const params = {
  //     // 服务地址
  //     url: serverURL,
  //     // projection: new Projection(srs),
  //     params: {
  //       // 以下属性固定为大写，不允许进行修改
  //       'FORMAT': format, // eslint-disable-line quote-props
  //       'VERSION': version, // eslint-disable-line quote-props
  //       'SRS': projection, // eslint-disable-line quote-props
  //       layers,
  //       exceptions: 'application/vnd.ogc.se_inimage',
  //       // ratio,
  //     },
  //     // serverType,
  //     // projection,
  //   }

  //   if (cqlFilter) params.params['CQL_FILTER'] = cqlFilter // eslint-disable-line dot-notation
  //   if (styles) params.params['STYLES'] = styles // eslint-disable-line dot-notation

  //   if (!_.isNil(account)) params.params.ACCOUNT = account
  //   if (!_.isNil(passwd)) params.params.PASSWD = passwd

  //   const source = new ImageWMS(params)

  //   const layer = new ImageLayer({
  //     visible,
  //     source,
  //   })

  //   this.addLayer(layer, opt)

  //   return layer
  // }

  /**
   * 添加WMS Tile服务
   */
  // addWMSTilelayer({
  //   serverURL,
  //   layers,
  //   projection = 'EPSG:3857',
  //   format = 'image/png',
  //   version = '1.1.1',
  //   visible = true,
  //   // ratio = 1,
  //   account,
  //   passwd,
  //   cqlFilter = null,
  //   styles = null,
  // }, opt = {}) {
  //   const params = {
  //     // 服务地址
  //     url: serverURL,
  //     // projection: new Projection(srs),
  //     params: {
  //       // 以下属性固定为大写，不允许进行修改
  //       'FORMAT': format, // eslint-disable-line quote-props
  //       'VERSION': version, // eslint-disable-line quote-props
  //       'SRS': projection, // eslint-disable-line quote-props
  //       layers,
  //       exceptions: 'application/vnd.ogc.se_inimage',
  //     },
  //   }

  //   if (cqlFilter) params.params['CQL_FILTER'] = cqlFilter // eslint-disable-line dot-notation
  //   if (styles) params.params['STYLES'] = styles // eslint-disable-line dot-notation

  //   if (!_.isNil(account)) params.params.ACCOUNT = account
  //   if (!_.isNil(passwd)) params.params.PASSWD = passwd

  //   const source = new TileWMS(params)
  //   const layer = new TileLayer({
  //     visible,
  //     source,
  //   })

  //   this.addLayer(layer, opt)

  //   return layer
  // }

  addVectorLayer({
    index = null,
    style = null,
    visible = true,
  }) {
    const source = new VectorSource()
    const layer = new VectorLayer({
      zIndex: index,
      source,
      style,
      visible,
    })

    this.addLayer(layer, { index })

    return layer
  }

  /**
   * 添加WMTS服务
   */
  // addWMTSlayer({
  //   serverURL,
  //   layers,
  //   projection,
  //   format,
  //   visible,
  //   extent = [ -180.0, -90.0, 180.0, 90.0 ],
  // }, opt = {}) {
  //   const source = new WMTS({
  //     // 服务地址
  //     url: serverURL,
  //     layer: layers,
  //     // 切片集
  //     matrixSet: projection || 'EPSG:4326',
  //     format,
  //     projection: new Projection({
  //       code: 'EPSG:4326', // 投影编码
  //       units: 'degrees',
  //       axisOrientation: 'neu',
  //     }),
  //     // 切片信息
  //     tileGrid: new WMTSTileGrid({
  //       tileSize: [ 256, 256 ],
  //       extent, // 范围
  //       origin: [ -180.0, 90.0 ],
  //       resolutions,
  //       matrixIds: gridNames,
  //     }),
  //     wrapX: true,
  //   })

  //   // TODO 添加测试切片服务，增加加载相应时间，提高加载速度
  //   const layer = new TileLayer({
  //     source,
  //     visible,
  //   })

  //   // const source = new TileWMS(params)
  //   // const layer = new TileLayer({
  //   //   visible,
  //   //   source,
  //   // })

  //   this.addLayer(layer, opt)

  //   return layer
  // }

  /**
   * 添加WMTS服务
   */
  // addWMTS3857layer({
  //   serverURL,
  //   layers,
  //   projection,
  //   format = 'tiles',
  //   visible,
  //   extent = transformExtent([ -180.0, -90.0, 180.0, 90.0 ], 'EPSG:4326', 'EPSG:3857'),
  // }, opt = {}) {
  //   projection = getProjection('EPSG:3857') // eslint-disable-line
  //   const tileSizePixels = 256
  //   const tileSizeMtrs = getWidth(projection.getExtent()) / tileSizePixels
  //   const matrixIdsFor3857 = []
  //   const resolutionsFor3857 = []
  //   for (let i = 0; i <= 18; i += 1) {
  //     matrixIdsFor3857[i] = `EPSG:3857:${i}`
  //     resolutionsFor3857[i] = tileSizeMtrs / (2 ** i)
  //   }
  //   const tileGrid = new WMTSTileGrid({
  //     origin: getTopLeft(projection.getExtent()),
  //     resolutions: resolutionsFor3857,
  //     extent,
  //     matrixIds: matrixIdsFor3857,
  //   })

  //   const source = new WMTS({
  //     // 服务地址
  //     url: serverURL,
  //     layer: layers,
  //     // 切片集
  //     matrixSet: 'EPSG:3857',
  //     format,
  //     // matrixSet: 'w', // w 对应的为Web墨卡托投影
  //     // projection: new Projection({
  //     //   code: 'EPSG:3857', // 投影编码
  //     //   units: 'degrees',
  //     //   axisOrientation: 'neu',
  //     // }),
  //     // 切片信息
  //     tileGrid,
  //     // tileGrid: new WMTSTileGrid({
  //     //   tileSize: [ 256, 256 ],
  //     //   extent, // 范围
  //     //   // origin: transform([ -180.0, 90.0 ], 'EPSG:4326', 'EPSG:3857'),
  //     //   resolutions: resolutionsFor3857,
  //     //   matrixIds: gridNamesFor3857,
  //     // }),
  //     // wrapX: true,
  //   })

  //   // TODO 添加测试切片服务，增加加载相应时间，提高加载速度
  //   const layer = new TileLayer({
  //     source,
  //     visible,
  //   })

  //   // const source = new TileWMS(params)
  //   // const layer = new TileLayer({
  //   //   visible,
  //   //   source,
  //   // })

  //   this.addLayer(layer, opt)

  //   return layer
  // }

  /**
   * ------------------------------------------------
   * -------------------绘制模块----------------------
   * ------------------------------------------------
   */
  /**
   * 开始绘制
   * @param {String | null} style 绘制类型
   * @param { ol.style.Style } style 绘制的样式
   */
  startDrawTool(type = null, style = null) {
    if (_.isNull(this._drawTool)) this._drawTool = new DrawTool(this._map)
    this._drawTool.start(type, style)
  }

  startDrawToolOne(type = null, style = null, callback = null) {
    if (_.isNull(this._drawTool)) this._drawTool = new DrawTool(this._map)
    this._drawTool.startOne(type, style, callback)
  }

  destoryDrawTool() {
    this._drawTool.destory()

    this._drawTool = null
  }

  /**
   * 停止绘制
   * @param {Function} callback 回调函数
   */
  stopDrawTool(callback) {
    if (this._drawTool !== null) this._drawTool.stop(_.isFunction(callback) ? callback : () => { })
  }

  /**
   * 切换当前的绘制类型
   */
  changeDrawToolType(newType) {
    // TODO 在对外暴露地方增加格式验证功能
    this._drawTool.changeType(newType)
  }

  /**
   * 切换当前的绘制类型
   */
  drawTool4BackStep() {
    if (!_.isNull(this._drawTool)) this._drawTool.back()
  }

  /**
   * 清空当前绘制的features
   */
  cleanDrawToolFeatures() {
    if (!_.isNull(this._drawTool)) this._drawTool.clearFeaures()
  }

  /**
   * ------------------------------------------------
   * -------------------测量模块----------------------
   * ------------------------------------------------
   */

  /**
   * 开始测量
   */
  startMeasure(type = null, style = null) {
    if (_.isNull(this._measure)) this._measure = new Measure(this._map)
    this._measure.start(type, style)
  }

  /**
   * 停止测量功能
   */
  stopMeasure() {
    this._measure.stop()
  }

  /**
   * 切换当前的测量类型
   * @param {String} newType 新的测量类型
   */
  changeMeasureType(newType) {
    // TODO 在对外暴露地方增加格式验证功能
    this._measure.changeType(newType)
  }

  /**
   * ------------------------------------------------
   * -------------------事件绑定----------------------
   * ------------------------------------------------
   */
  bindClick(e) {
    this._map.on('singleclick', e)
  }

  // 双击事件
  bindDoubleClick(e) {
    this._map.on('dblclick', e)
  }

  bindMoveStart(e) {
    this._map.on('movestart', e)
  }

  bindMoveEnd(e) {
    this._map.on('moveend', e)
  }

  bindPointermove(e) {
    this._map.on('pointermove', e)
  }

  addArcGISLayer({
    url,
    projection = 'EPSG:4326',
    maxZoom = 18,
    wrapX = true,
    index = null,
  }) {
    const layer = new TileLayer({
      source: new XYZ({
        url,
        maxZoom,
        projection,
        wrapX,
      }),
    })

    this.addLayer(layer, { index })

    return layer
  }
}

export default MapPlus
