import Head from '../../src/head/head'
Page({
  //事件处理函数
  onLoad: function() {
    let size = {
      w: 700,
      h: 700
    }
    // 传入用户画的画布id 隐藏起来的
    //当前page对象
    //要生产的图片宽高  单位rpx
    let head = new Head('mycanvas', this, size)
    head.setHead('../../images/head.jpg')
    head.addWidget('../../images/head.png')
    head.addWidget('../../images/head.png')
    head.addWidget('../../images/head.png')
    setTimeout(() => {
      head.draw()
    }, 100)
  }
})
