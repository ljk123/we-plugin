export default class Head {
  constructor(canvasId, page, size) {
    this.canvasid = canvasId;
    this.ctx = wx.createCanvasContext(canvasId, page)
    this.w = size.w || size.width
    this.h = size.h || size.height
    this.default_w = 100
    this.icon_w = 28
    //默认挂件属性
    this.default_draw_widget = {
      x: 0, //相对中心偏移
      y: 0,
      r: 0, //旋转角度
      s: 1 //缩放
    }
    if (!this.w || !this.h) {
      throw new Error('请传入大小')
    }
    //自己的数据对象
    this.data = {
      headimgpath: null, //背景的路劲
      hide_choose_img: true, //
      //挂件相关
      widgets: [],
      widgets_index: 0,
      drawWidgetsArray: [],
      drawWidgetsArrayIndex: -1,
    }
    let that = this
    //计算出像素rpx比例
    wx.getSystemInfo({
      success(res) {
        that.px_rpx_scale = res.windowWidth / 750
      },
      fail(res) {
        console.error(res)
      }
    })
    //防止穿透
    page.touchstart = e=>{this.touchstart(e)}
    page.touchmove = e=>{this.touchmove(e)}
    page.touchend = e=>{this.touchend(e)}
    page.touchcancel = e=>{this.touchcancel(e)}
  }
  setHead(path) {
    this.data.headimgpath = path
  }
  addWidget(path) {
    let that = this
    wx.getImageInfo({
      src: path,
      success(res) {
        let hpw = res.height / res.width
        that.data.drawWidgetsArray.push({
          path,
          hpw,
          //防止引用
          draw_widget: Object.assign({}, that.default_draw_widget)
        })
        //选中当前添加的挂件
        that.data.drawWidgetsArrayIndex = that.data.drawWidgetsArray.length - 1
        that.draw()
      },
      fail(res) {
        console.error(res)
      }
    })
  }
  drawHead() {
    this.ctx.drawImage(this.data.headimgpath, 0, 0, this.px_rpx_scale * this.w, this.px_rpx_scale * this.h)
  }
  drawWidgets() {
    //中心位置坐标
    let mid = this.px_rpx_scale * this.w / 2
    this.data.drawWidgetsArray.forEach((item, index) => {
      this.ctx.translate(mid + item.draw_widget.x, mid + item.draw_widget.y)
      //高宽
      let w = this.default_w * item.draw_widget.s,
        h = this.default_w * item.hpw * item.draw_widget.s
      // //旋转
      this.ctx.rotate(item.draw_widget.r * Math.PI / 180)

      this.ctx.drawImage(item.path, -w / 2, -h / 2, w, h)
      if (index === this.data.drawWidgetsArrayIndex) {
        //当前操作的挂件
        //画出矩形
        this.ctx.beginPath()
        this.ctx.rect(-w / 2, -h / 2, w, h)
        this.ctx.setStrokeStyle('#fe579e')
        this.ctx.stroke()
        //操作图标
        this.ctx.drawImage('/src/head/images/c.png', -w / 2 - this.icon_w / 2, -h / 2 - this.icon_w / 2, this.icon_w, this.icon_w)
        this.ctx.drawImage('/src/head/images/s.png', +w / 2 - this.icon_w / 2, +h / 2 - this.icon_w / 2, this.icon_w, this.icon_w)
      }
      this.ctx.rotate(-item.draw_widget.r * Math.PI / 180)
      this.ctx.translate(-mid - item.draw_widget.x, -mid - item.draw_widget.y)
    })
  }
  //画出来
  draw(is_save = false) {
    if (is_save) {
      wx.showLoading({
        title: '生成中...',
      })
      this.data.drawWidgetsArrayIndex = -1
    }
    this.drawHead()
    this.drawWidgets()
    if (is_save) {
      this.ctx.draw(false, that.saveCmplete)
    } else {
      this.ctx.draw()
    }
  }
  //以下是touch部分
  touchstart(e) {
    //中心位置坐标
    let mid = this.px_rpx_scale * this.w / 2
    //微信的catch的坐标是相对屏幕原点的  这里需要转换下
    let touch = {}
    if (typeof e.touches[0].clientY !== "undefined") {
      touch = {
        x: e.touches[0].clientX - e.currentTarget.offsetLeft - mid,
        y: e.touches[0].clientY - e.currentTarget.offsetTop - mid
      }
    } else {
      touch = {
        x: e.touches[0].x - mid,
        y: e.touches[0].y - mid
      }
    }

    if (-1 !== this.data.drawWidgetsArrayIndex) {
      let curr_item = this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex]
      let w = this.default_w * curr_item.draw_widget.s,
        h = this.default_w * curr_item.hpw * curr_item.draw_widget.s
      //按钮到中心的距离
      let d = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2))

      //判断是不是点击到关闭按钮 左上角 -135
      let r = (curr_item.draw_widget.r - 180 + Math.atan(curr_item.hpw) / Math.PI * 180) * Math.PI / 180
      let spos = {
        x: Math.cos(r) * d + curr_item.draw_widget.x,
        y: Math.sin(r) * d + curr_item.draw_widget.y,
      }
      //点击位置是否小于icon半径
      if (Math.sqrt(Math.pow((touch.x - spos.x), 2) + Math.pow((touch.y - spos.y), 2)) < this. icon_w / 2) {
        this.data.drawWidgetsArray.splice(this.data.drawWidgetsArrayIndex, 1)
        this.data.drawWidgetsArrayIndex = this.data.drawWidgetsArray.length - 1
        return this.draw()
      }
      //判断是点到放大旋转按钮

      //旋转角度弧度制  右下角 加 
      r = (curr_item.draw_widget.r + Math.atan(curr_item.hpw) / Math.PI * 180) * Math.PI / 180
      spos = {
        x: Math.cos(r) * d + curr_item.draw_widget.x,
        y: Math.sin(r) * d + curr_item.draw_widget.y,
      }
      //点击位置是否小于icon半径
      if (Math.sqrt(Math.pow((touch.x - spos.x), 2) + Math.pow((touch.y - spos.y), 2)) < this. icon_w / 2) {
        this.touchWidgetsSRHandle = {
          touch: {
            x: touch.x - curr_item.draw_widget.x,
            y: touch.y - curr_item.draw_widget.y
          }
        }
        return
      }
    }
    //判断是否点击到已有挂件
    let index = false
    for (let i = this.data.drawWidgetsArray.length - 1; i > -1; --i) {
      let item = this.data.drawWidgetsArray[i]
      let w = this.default_w * item.draw_widget.s,
        h = this.default_w * item.hpw * item.draw_widget.s
      //简易判断 点击与中心距离小于(w+h) / 2 / 2 
      let r = Math.sqrt(Math.pow((touch.x - item.draw_widget.x), 2) + Math.pow((touch.y - item.draw_widget.y), 2))
      if (r < (w + h) / 2 / 2) {
        index = i
        break
      }
    }
    if (index !== false) {
      let same = false
      if (this.data.drawWidgetsArrayIndex === index) {
        same = true
      }
      this.data.drawWidgetsArrayIndex = index
      this.touchWidgetsMoveHandle = {
        touch: {
          x: touch.x - this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].draw_widget.x,
          y: touch.y - this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].draw_widget.y
        },
        same: same
      }
    } else {
      this.data.drawWidgetsArrayIndex = -1
    }
    return this.draw()
  }
  touchmove(e) {
    //中心位置坐标
    let mid = this.px_rpx_scale * this.w / 2
    //微信的catch的坐标是相对屏幕原点的  这里需要转换下
    let touch = {}
    if (typeof e.touches[0].clientX !== "undefined") {
      touch = {
        x: e.touches[0].clientX - e.currentTarget.offsetLeft - mid,
        y: e.touches[0].clientY - e.currentTarget.offsetTop - mid
      }
    } else {
      touch = {
        x: e.touches[0].x - mid,
        y: e.touches[0].y - mid
      }
    }
    if (this.touchWidgetsMoveHandle) {
      this.touchWidgetsMoveHandle.same = false //移动过就不认为是重复点击
      this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].draw_widget.x = touch.x - this.touchWidgetsMoveHandle.touch.x
      this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].draw_widget.y = touch.y - this.touchWidgetsMoveHandle.touch.y
    } else if (this.touchWidgetsSRHandle) {
      let curr = this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex]
      //放大缩小
      let sr = Math.sqrt(Math.pow((touch.x - curr.draw_widget.x), 2) + Math.pow((touch.y - curr.draw_widget.y), 2))
      let default_r = Math.sqrt(Math.pow(this.default_w / 2, 2) + Math.pow(this.default_w * curr.hpw / 2, 2))
      this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].draw_widget.s = sr / default_r
      //旋转弧度
      let tan = (touch.y - curr.draw_widget.y) / (touch.x - curr.draw_widget.x)
      let rad = Math.atan(tan) * 180 / Math.PI
      if (rad > 0) {
        if (touch.x > curr.draw_widget.x) //第一象限
        {
          //不变
        } else { //第三象限
          rad += 180
        }
      } else {
        if (touch.x > curr.draw_widget.x) //第四象限
        {
          //不变
        } else { //第二象限
          rad += 180
        }
      }
      this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].draw_widget.r = rad - Math.atan(this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex].hpw) / Math.PI * 180
    } else if (this.touchNameHeightHandle) {
      let offset = touch.y - this.touchNameHeightHandle.touch.y + this.touchNameHeightHandle.old_offset
      if (offset < -this.w * this.px_rpx_scale / 3 / 2 + this.touchNameHeightHandle.small_word_height) {
        offset = -this.w * this.px_rpx_scale / 3 / 2 + this.touchNameHeightHandle.small_word_height
      } else if (offset > this.w * this.px_rpx_scale / 3 / 2) {
        offset = this.w * this.px_rpx_scale / 3 / 2
      }
      this.data.small_y_offset = offset
    }
    this.draw()
  }
  touchend(e) {
    if (this.touchWidgetsMoveHandle) {
      if (this.touchWidgetsMoveHandle.same) //如果是重复点击 则取消选中
      {
        this.data.drawWidgetsArrayIndex = -1
      }
      this.touchWidgetsMoveHandle = null
    }
    if (this.touchWidgetsSRHandle) {
      this.touchWidgetsSRHandle = null
    }
    if (this.touchNameHeightHandle) {
      this.touchNameHeightHandle = null
    }
    this.draw()
  }
  touchcancel(e) {
    //todo
  }
}