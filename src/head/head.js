export default class Head {
  constructor(canvasId, page, size) {
    this.canvasid = canvasId;
    this.ctx = wx.createCanvasContext(canvasId, page)
    this.w = size.w || size.width
    this.h = size.h || size.height
    this.default_w = 100
    this.icon_w = 20
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
  addWidget(obj) {
    let that = this
    if(typeof obj =='string')
    {
      let type='image',path=obj
      obj={type,path}
    }
    else{
      //暂时只支持文字了
      obj.type='text'
    }

    if(obj.type==='text')
    {
      if(!obj.text)
      {
        throw new Error('请传入文字')
      }
      let hpw=that.ctx.measureText('口').width/that.ctx.measureText(obj.text).width
      //obj  {text:'',style:{},}
      that.data.drawWidgetsArray.push({
        obj,
        hpw,
        //防止引用
        draw_widget: Object.assign({}, that.default_draw_widget)
      })
      that.data.drawWidgetsArrayIndex = that.data.drawWidgetsArray.length - 1
      that.draw()
    }
    else if(obj.type==='image')
    {
      wx.getImageInfo({
        src: obj.path,
        success(res) {
          let hpw = res.height / res.width
          that.data.drawWidgetsArray.push({
            obj,
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
  }
  drawHead() {
    this.ctx.drawImage(this.data.headimgpath, 0, 0, this.px_rpx_scale * this.w, this.px_rpx_scale * this.h)
  }
  drawWidgets() {
    //中心位置坐标
    let mid = this.px_rpx_scale * this.w / 2
    //如果有选择的 切换为最上层
    if(this.data.drawWidgetsArrayIndex!==-1)
    {
      let temp=this.data.drawWidgetsArray[this.data.drawWidgetsArrayIndex]
      this.data.drawWidgetsArray.splice(this.data.drawWidgetsArrayIndex, 1)
      this.data.drawWidgetsArray.push(temp)
      this.data.drawWidgetsArrayIndex=this.data.drawWidgetsArray.length-1
    }
    this.data.drawWidgetsArray.forEach((item, index) => {
      this.ctx.translate(mid + item.draw_widget.x, mid + item.draw_widget.y)
      //高宽
      let w = this.default_w * item.draw_widget.s,
        h = this.default_w * item.hpw * item.draw_widget.s
      // //旋转
      this.ctx.rotate(item.draw_widget.r * Math.PI / 180)
      if(item.obj.type==='image')
      {
        this.ctx.drawImage(item.obj.path, -w / 2, -h / 2, w, h)
      }
      else if(item.obj.type==='text')
      {
        let text_width=this.ctx.measureText(item.obj.text).width*1.5
        let scale=text_width/w
        this.ctx.scale(1/scale,1/scale)
        //0.7 0.2修正
        // 描边
        if(item.obj.stroke)
        {
          if(item.obj.stroke.color)
          {
            this.ctx.setStrokeStyle(item.obj.stroke.color)
          }
          else{
            this.ctx.setStrokeStyle("#000")//默认描边颜色
          }
          this.ctx.strokeText(item.obj.text,-w/2*scale*.7,h*scale*.2)
        }

        //画文字
        if(item.obj.style && item.obj.style.color)
        {
          this.ctx.setFillStyle(item.obj.style.color)
        }
        else{
          this.ctx.setFillStyle("#000")
        }
        // 阴影
        if(item.obj.shadow)
        {
          this.ctx.setShadow(item.obj.shadow.offsetX||1,
            item.obj.shadow.offsetY||1,
            item.obj.shadow.blur||1,
            item.obj.shadow.color||'#ccc')
        }
        this.ctx.fillText(item.obj.text,-w/2*scale*.7,h*scale*.2)
        this.ctx.setShadow(0,0,0,'black')
        this.ctx.scale(scale,scale)
        
      }
      if (index === this.data.drawWidgetsArrayIndex) {
        //当前操作的挂件
        //画出矩形
        this.ctx.beginPath()
        this.ctx.rect(-w / 2, -h / 2, w, h)
        this.ctx.setStrokeStyle('#fe579e')
        this.ctx.stroke()
        //用代码画操作图标
        this.drawCloseBtn(w,h)
        this.drawScaleBtn(w,h)
      }
      this.ctx.rotate(-item.draw_widget.r * Math.PI / 180)
      this.ctx.translate(-mid - item.draw_widget.x, -mid - item.draw_widget.y)
    })
  }
  //画出来
  draw(cb = false) {
    let is_save=typeof cb==='function'
    if (is_save) {
      wx.showLoading({
        title: '生成中...',
      })
      //去掉选择框
      this.data.drawWidgetsArrayIndex = -1
    }
    this.drawHead()
    this.drawWidgets()
    if (is_save) {
      let that=this
      this.ctx.draw(false, ()=>{
        wx.canvasToTempFilePath({
            x:0,
            y:0,
            width:that.w*that.px_rpx_scale,
            height:that.h*that.px_rpx_scale,
            canvasId:that.canvasid,
            complete(){
              wx.hideLoading()
            },
            success(res){
              cb(res)
            }
        })
      })
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
  //关闭操作图标
  drawCloseBtn(w,h)
  {
    let btn_width=this.icon_w
    //话个圆形
    this.ctx.beginPath()
    this.ctx.arc(-w / 2 , -h / 2,Math.sqrt(2)*btn_width/2,0,2 * Math.PI)
    this.ctx.setFillStyle('#fe579e')
    this.ctx.fill()    
    let offset=btn_width/2/Math.sqrt(2)
    this.ctx.beginPath()
    this.ctx.setStrokeStyle('#fff')
    this.ctx.setLineWidth(1.5)
    //画个叉叉1
    this.ctx.moveTo(-w / 2 -offset, -h / 2-offset)
    this.ctx.lineTo(-w / 2 +offset, -h / 2+offset)
    //画个叉叉2
    this.ctx.moveTo(-w / 2 +offset, -h / 2-offset)
    this.ctx.lineTo(-w / 2 -offset, -h / 2+offset)
    this.ctx.stroke()
  }
  drawScaleBtn(w,h)
  {
    let btn_width=this.icon_w*1.2
    //先画个圆剪切
    this.ctx.beginPath()
    this.ctx.arc(w / 2 , h / 2,Math.sqrt(2)*btn_width/2,0,2 * Math.PI)    
    this.ctx.save()
    this.ctx.clip()
    //里面画个正方形
    this.ctx.fillRect(+w / 2 - btn_width / 2, +h / 2 - btn_width / 2, btn_width, btn_width)
    this.ctx.restore()    
    let offset=btn_width/2/Math.sqrt(2)
    
    this.ctx.beginPath()
    this.ctx.setStrokeStyle('#fff')
    this.ctx.setLineWidth(1.5)

    this.ctx.moveTo(w / 2 -offset, h / 2-offset)
    this.ctx.lineTo(w / 2 -offset/4, h / 2-offset/4)

    this.ctx.moveTo(w / 2 -offset, h / 2-offset)
    this.ctx.lineTo(w / 2 -offset/4, h / 2-offset)

    this.ctx.moveTo(w / 2 -offset, h / 2-offset)
    this.ctx.lineTo(w / 2 -offset, h / 2-offset/4)


    
    this.ctx.moveTo(w / 2 +offset, h / 2+offset)
    this.ctx.lineTo(w / 2 +offset/4, h / 2+offset/4)

    this.ctx.moveTo(w / 2 +offset, h / 2+offset)
    this.ctx.lineTo(w / 2 +offset/4, h / 2+offset)

    this.ctx.moveTo(w / 2 +offset, h / 2+offset)
    this.ctx.lineTo(w / 2 +offset, h / 2+offset/4)

    this.ctx.stroke()
  }
}