import DrawTag from '../../src/drawtag/drawtag'
Page({
  //事件处理函数
  drawtag: function() {
    wx.showLoading({
      title: '努力生成中',
    })
    let size = {
      w: 450,
      h: 320
    }
    // 传入用户画的画布id 隐藏起来的
    //当前page对象
    //要生产的图片宽高  单位像素
    //颜色数组
    let d = new DrawTag('mycanvas', this, size,[
      '#FF0000',
      '#FF7F00',
      '#00FFFF',
      '#0000FF',
      '#8B00FF',
      '#000000',
    ]);
    let that=this
    d.draw([
      //标签文本  优先度
      { word: '大标签', sort: 5 },
      { word: '中等的', sort: 4 },
      { word: '偏小一点的', sort: 3 },
      { word: '再小一点', sort: 2 },
      { word: '我是一个可能画不出的标签', sort: 1 },
      { word: '最小的2', sort: 1 },
      { word: '最小的3', sort: 1 },
      { word: '最小的4', sort: 1 },
      { word: '最小的5', sort: 1 },
      { word: '最小的6', sort: 1 },
      { word: '更多会越来越小', sort: 1 },
      { word: '更多会越来越小', sort: 1 },
      { word: '更多会越来越小', sort: 1 },
      { word: '更多会越来越小', sort: 1 },
      { word: '更多会越来越小', sort: 1 },
      { word: '更多会越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      { word: '越来越小', sort: 1 },
      ], (path) => {
        
        wx.hideLoading()
        console.log(path)

        that.setData({path})
    })
  },
})
