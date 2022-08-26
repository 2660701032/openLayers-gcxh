/*
 * @Author       : Chen Zhen
 * @Date         : 2018-11-03 17:35:47
 * @LastEditors  : Chen Zhen
 * @LastEditTime : 2021-12-14 14:56:49
 * @Description  : 绘制库用来进行各种效果的绘制工作
 */

import _ from 'lodash'

import { Map } from 'ol'

import {
  Style,
  Fill,
  Stroke,
  Circle,
} from 'ol/style'

import LayerVector from 'ol/layer/Vector'
import SourceVector from 'ol/source/Vector'
import { Draw, Snap } from 'ol/interaction'

import { GeoJSON } from 'ol/format'
import GeometryCollection from 'ol/geom/GeometryCollection'

import { getTransform } from 'ol/proj'
import { createRegularPolygon, createBox } from 'ol/interaction/Draw'

const TYPE_POINT = 'Point'

const DEFAULT_SOURCE_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.4)',
  }),
  stroke: new Stroke({
    color: '#ff0000',
    width: 2,
  }),
  image: new Circle({
    radius: 7,
    fill: new Fill({
      color: '#ff0000',
    }),
  }),
})

class DrawTool {
  /**
   * 构造函数，传入对应的Map
   */
  constructor(map, {
    sourceStyle = null, // 资源的绘制样式
  } = {}) {
    if (map instanceof Map) {
      this._map = map

      this._sourceStyle = sourceStyle || DEFAULT_SOURCE_STYLE// 资源的绘制样式

      // 为了防止变动，在每次开始绘制的时候进行获取
      this._projectionCode = null // 地图的坐标系编号

      this._source = null
      this._layer = null

      this._draw = null
      this._snap = null
      this._listen = null
      this.callback = null

      this._type = TYPE_POINT // 默认为 绘制点
      this._geometryFunction = null // 用于绘制的辅助函数

      this._isDraw = false
      this.init()

      this._oneEndCallback = null
    } else {
      throw new TypeError(`map: ${map} is not Map`)
    }
  }

  get type() {
    return this._type
  }

  set type(_type) {
    switch (_type) {
      case 'Square':
        this._type = 'Circle'
        this._geometryFunction = createRegularPolygon(4)
        break
      case 'Box':
        this._type = 'Circle'
        this._geometryFunction = createBox()
        break
      default:
        this._type = _type

        this._geometryFunction = null
        break
    }
  }

  /**
   * 初始化绘制
   */
  init() {
    this._source = new SourceVector()
    this._layer = new LayerVector({
      source: this._source,
      style: this._sourceStyle,
    })

    this._map.addLayer(this._layer)
  }

  /**
   * 销毁
   */
  destory() {
    // 如果未停止测量需要进行停止工作
    this.stop()
    // 移除对应的图层
    this._map.removeLayer(this._layer)
  }

  /**
   * 开始进行绘制
   * @param {String} type 测量类型
   * @param {Style} style
   */
  start(type = TYPE_POINT) { // , style = null
    if (!this._isDraw) {
      this._isDraw = true
      this.type = type

      // 重新获取当前地图的坐标系
      this.projectionCode = this._map.getView().getProjection().getCode()

      // TODO 需要进行设定this.layer.style效果

      this._draw = this._getDraw()

      this._map.addInteraction(this._draw)

      // 必须在最后进行添加
      this._snap = new Snap({ source: this._source })
      this._map.addInteraction(this._snap)
    } else {
      throw new TypeError('The draw operation has started')
    }
  }

  startOne(type = TYPE_POINT, style, callback) {
    this._oneEndCallback = callback

    this.start(type, style)
  }

  /**
   * 停止进行绘制
   */
  stop(callback) {
    try {
      if (this._isDraw) {
        this._isDraw = false
        this._map.removeInteraction(this._draw)
        this._map.removeInteraction(this._snap)

        const geometryCollection = new GeometryCollection()
        const geometries = []
        this._source.getFeatures().forEach((i) => {
          const g = i.getGeometry()

          const errNum = g.getExtent().find((num) => !_.isFinite(num))

          // 判断类型
          if (!_.isNil(errNum) && !_.isFinite(errNum)) throw new Error('绘制异常，请重新绘制')
          geometries.push(g)
        })

        geometryCollection.setGeometries(geometries)

        geometryCollection.applyTransform(getTransform('EPSG:3857', 'EPSG:4326'))

        const geoJSON = new GeoJSON()
        const geometryList = geometryCollection.getGeometries().map((i) => geoJSON.writeGeometryObject(i))

        this._source.clear()
        setTimeout(() => {
          callback(null, geometryList)
        }, 100)
        // 将source内部的数据信息全部进行保存回调
      } else {
        // throw new TypeError('The draw operation has not started')
      }
    } catch (error) {
      this._source.clear()

      callback(error)
    }
  }

  /**
   * 更换绘制的类型
   * @param {String} type 绘制类型
   */
  changeType(type) {
    if (this._isDraw) {
      this.type = type

      // 移除之前的绘制对象
      this._map.removeInteraction(this._draw)
      this._map.removeInteraction(this._snap)

      // 添加新的绘制工具
      this._draw = this._getDraw()
      this._map.addInteraction(this._draw)
      // 必须在最后进行添加
      this.snap = new Snap({ source: this._source })
      this._map.addInteraction(this._snap)
    } else {
      throw new TypeError('The draw operation has not started')
    }
  }

  /**
   * 清空当前绘制defeatures
   */
  clearFeaures() {
    this._source.clear()
  }

  /**
   * 统一获取绘制对象
   * @param {*} geomtry
   */
  _getDraw() {
    const obj = {
      source: this._source,
      type: this.type,
    }

    if (this._geometryFunction) obj.geometryFunction = this._geometryFunction

    const draw = new Draw(obj)

    draw.on('drawstart', () => {
      // let geometry = evt.feature.getGeometry()
      // this._drawstartHandle(geometry)
      // switch (this._type) {
      //   case TYPE_POINT:
      //     break
      //   case TYPE_LINESTRING:
      //     this._createLinePolygonMeasure(geometry)
      //     break
      //   case TYPE_POLYGON:
      //     this._createLinePolygonMeasure(geometry)
      //     break
      //   default:
      //     break
      // }
    })

    draw.on('drawend', () => {
      setTimeout(() => {
        if (this._oneEndCallback) {
          this.stop(this._oneEndCallback)
        }
      }, 0)
    })

    return draw
  }

  back() {
    const features = this._source.getFeatures()

    if (features.length) {
      this._source.removeFeature(features[features.length - 1])
    }
  }
}

export default DrawTool
