/*
 * @Author       : Chen Zhen
 * @Date         : 2018-10-27 16:58:10
 * @LastEditors  : Chen Zhen
 * @LastEditTime : 2021-12-14 14:57:45
 * @Description  : 用来开始提供 点 - 位置 / 线 - 长度 / 面 - 面积的测量功能
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
import SourceVehicle from 'ol/source/Vector'
import { Draw, Snap } from 'ol/interaction'
import { unByKey } from 'ol/Observable'
import {
  Point,
  LineString,
  Polygon,
} from 'ol/geom'
import { transform } from 'ol/proj'
import { getLength, getArea } from 'ol/sphere'
import Overlay from 'ol/Overlay'

const DEFAULT_SOURCE_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 2,
  }),
  image: new Circle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
})

const TYPE_POINT = 'Point'
const TYPE_LINESTRING = 'LineString'
const TYPE_POLYGON = 'Polygon'
// const TYPE_BOX = 'box'

class Measure {
  /**
   * 构造函数，需要传入对应的map
   * TOOD 查看是否需要修改为对应的MapPlus库
   */
  constructor(map) {
    if (map instanceof Map) {
      this._map = map

      this.projectionCode = null // 地图的坐标系编号

      this.source = null
      this.layer = null

      this.draw = null
      this.snap = null
      this.listen = null

      this.measureTooltip = null // 测量工具显示内容
      this.measureTooltipElement = null // 测量工具系那是的Dom对象

      this.measureTooltipList = [] // 用户缓存工具提示的地方

      this.type = TYPE_POINT // 'Point' 'LineString' 'Polygon'

      this.isMeasure = false // 是否正在进行测量

      this.init() // 自动初始化

      return this
    }

    throw new TypeError(`map: ${map} is not Map`)
  }

  /**
   * 初始化
   */
  init() {
    this.source = new SourceVehicle()
    this.layer = new LayerVector({
      source: this.source,
      style: this.sourceStyle || DEFAULT_SOURCE_STYLE,
    })

    this._map.addLayer(this.layer)
  }

  /**
   * 销毁
   */
  destory() {
    // 如果未停止测量需要进行停止工作
    this.stop()
    // 移除对应的图层
    this._map.removeLayer(this.layer)
  }

  /**
   * 开始测量功能
   * @param {String} type 测量类型
   * @param {Style} style
   */
  start(type = TYPE_POINT) { // , style = null
    if (!this.isMeasure) {
      this.isMeasure = true
      this.type = type

      // 重新获取当前地图的坐标系
      this.projectionCode = this._map.getView().getProjection().getCode()
      // TODO 需要进行设定this.layer.style效果

      this.draw = this._getDraw()

      this._map.addInteraction(this.draw)

      // 必须在最后进行添加
      this.snap = new Snap({ source: this.source })
      this._map.addInteraction(this.snap)
    } else {
      // null
    }
  }

  /**
   * 停止测量功能
   */
  stop() {
    if (this.isMeasure) {
      this.isMeasure = false
      this._map.removeInteraction(this.draw)
      this._map.removeInteraction(this.snap)

      // TODO 移除对应的历史标识之中
      this.source.clear()

      this.measureTooltipList.forEach((_tooltip) => {
        // 将所有的提示进行清空
        this._map.removeOverlay(_tooltip)
      })

      if (!_.isNull(this.measureTooltip)) {
        this._map.removeOverlay(this.measureTooltip)
        this.measureTooltip = null
        this.measureTooltipElement = null
      }
    }
  }

  /**
   * 更换绘制的类型
   * @param {String} type 测量类型
   */
  changeType(type) {
    // 开始绘制的时候有效果
    if (this.isMeasure) {
      this.type = type
      // 移除之前的绘制对象
      this._map.removeInteraction(this.draw)
      this._map.removeInteraction(this.snap)

      // 添加新的绘制工具
      this.draw = this._getDraw()
      this._map.addInteraction(this.draw)
      // 必须在最后进行添加
      this.snap = new Snap({ source: this.source })
      this._map.addInteraction(this.snap)
    }
  }

  /**
   * 统一获取绘制对象
   * @param {*} geomtry
   */
  _getDraw() {
    const obj = {
      source: this.source,
      type: this.type,
    }

    const draw = new Draw(obj)

    draw.on('drawstart', (evt) => {
      const geometry = evt.feature.getGeometry()
      this._drawstartHandle(geometry)
      switch (this.type) {
        case TYPE_POINT:
          break
        case TYPE_LINESTRING:
          this._createLinePolygonMeasure(geometry)
          break
        case TYPE_POLYGON:
          this._createLinePolygonMeasure(geometry)
          break
        default:
          break
      }
    })

    draw.on('drawend', (evt) => {
      const geometry = evt.feature.getGeometry()

      if (!_.isNull(this.listen)) unByKey()
      this._drawendHandle(geometry)
    })

    return draw
  }

  /**
   * 开始绑定 画圆 画线的绑定函数
   * @param {Geometry} geomtry 绘制过程中的要素对象
   */
  _createLinePolygonMeasure(geomtry) {
    // 绑定 过程中的事件
    this.listen = geomtry.on('change', (evt) => {
      const geom = evt.target
      this._drawingHandle(geom)
    })
  }

  /**
   * 根据传入的地理信息，生成对应的信息
   * 内置自定义转换的内容
   * @param {geom} geom
   * @return {Object} { type: (TYPE_POINT | TYPE_LINESTRING | TYPE_POLYGON), info: 位置信息}
   */
  _toInfoFromGeom(geom) {
    // TODO 需要支持自定义格式的生成，用户tooltip显示内容的改写
    if (geom instanceof Point) {
      // 生成点的数据信息
      const coord = transform(geom.getCoordinates(), 'EPSG:3857', 'EPSG:4326')
      return {
        type: TYPE_POINT,
        info: {
          projection: this.projectionCode,
          coordinate: geom.getCoordinates(),
        },
        message: `经度：${coord[0].toFixed(6)}<br> 纬度：${coord[1].toFixed(6)}`,
      }
    }
    if (geom instanceof LineString) {
      // 生成线的数据信息
      const length = getLength(geom)
      let message = null
      if (length > 100) {
        message = `${Math.round((length / 1000) * 100) / 100} km`
      } else {
        message = `${Math.round(length * 100) / 100} m`
      }
      return {
        type: TYPE_LINESTRING,
        info: {
          projection: this.projectionCode,
          unit: 'm',
          length,
        },
        message,
      }
    }
    if (geom instanceof Polygon) {
      // 生成面的数据信息
      const area = getArea(geom)
      let message = null

      if (area > 10000) {
        message = `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`
      } else {
        message = `${(Math.round(area * 100) / 100)} m<sup>2</sup>`
      }
      return {
        type: TYPE_POLYGON,
        info: {
          projection: this.projectionCode,
          unit: 'm2',
          length: getArea(geom),
        },
        message,
      }
    }

    return null
  }

  /**
   * 绘制开始的内部使用钩子
   * 信息的输出都从此类方法走
   * @param {geom} geom
   */
  _drawstartHandle(geom) {
    const info = this._toInfoFromGeom(geom)
    // 创建tooltip
    this._createTooltip(this._getTooltipPosition(geom), info.message)

    // 设置位置
    this._refreshTooltip(this._getTooltipPosition(geom), info.message)
    // 执行向外冒泡的事件
    if (_.isFunction(this.drawingCallback)) this.drawstartCallback(info)
  }

  /**
   * 绘制过程中的内部使用钩子
   * @param {ol.geom} geom
   */
  _drawingHandle(geom) {
    const info = this._toInfoFromGeom(geom)
    // 更新tootip
    this._refreshTooltip(this._getTooltipPosition(geom), info.message)
    // 执行向外冒泡的事件
    if (_.isFunction(this.drawingCallback)) this.drawingCallback(info)
  }

  /**
   * 绘制结束的内部使用钩子
   * @param {ol.geom} geom
   */
  _drawendHandle(geom) {
    const info = this._toInfoFromGeom(geom)

    // 固定tooltip
    this._saveTooltip(geom)

    // 执行向外冒泡的回调
    if (_.isFunction(this.drawingCallback)) this.drawendCallback(info)
  }

  /**
   *
   * 开始创建工具提示
   * (负责维护辨识的样式)
   * TODO 后期支持自定义提示的样式
   *
   * @param {Point} point
   * @param {String} message 显示的信息
   */
  _createTooltip() { // point, message
    this.measureTooltipElement = document.createElement('div')
    this.measureTooltipElement.className = 'ol__tooltip ol__tooltip-measure'
    this.measureTooltipElement.innerHTML = ''
    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [ 0, -15 ],
      positioning: 'bottom-center',
    })
    this._map.addOverlay(this.measureTooltip)
  }

  /**
   * 刷新标记的位置
  * @param {Array} coordinate
   * @param {String} message 显示的信息
   */
  _refreshTooltip(coordinate, message) {
    this.measureTooltipElement.innerHTML = message
    this.measureTooltip.setPosition(coordinate)
  }

  /**
   * 获取对应位置的点
   * @param {geom} geom
   */
  // eslint-disable-next-line class-methods-use-this
  _getTooltipPosition(geom) {
    if (geom instanceof Point) return geom.getCoordinates()
    if (geom instanceof LineString) return geom.getFlatMidpoint()
    if (geom instanceof Polygon) return geom.getInteriorPoint().getCoordinates()

    return null
  }

  /**
   * 将当前的工具提示移动到 缓存列表内部
   * @param {Point} point
   */
  _saveTooltip(point) {
    this.measureTooltip.setPosition(this._getTooltipPosition(point))
    const _measureTooltip = this.measureTooltip
    this.measureTooltipElement.className = 'ol__tooltip ol__tooltip-static'
    this.measureTooltipElement = null
    this.measureTooltip = null
    this.measureTooltipList.push(_measureTooltip)
  }
}

Measure.TYPE_POINT = TYPE_POINT
Measure.TYPE_LINESTRING = TYPE_LINESTRING
Measure.TYPE_POLYGON = TYPE_POLYGON

export default Measure
