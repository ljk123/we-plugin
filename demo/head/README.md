### 代码事例
```
import Head from '../../src/head/head'
let head
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
    head = new Head('mycanvas', this, size)
    //设置头像
    head.setHead('../../images/head.jpg')
    //添加挂件 需要是本地
    head.addWidget('../../images/head.png')
  
    head.addWidget({
      text:'我有阴影',
      type:'text',
      style:{color:'#ef0000',font:'../xxxxfont'},
      shadow:{color:'#000',offsetX:4,offsetY:4,blur:10}
    })
    head.addWidget({
      text:'我有描边',
      type:'text',
      style:{color:'#000000',font:'../xxxxfont'},
      stroke:{color:'#ff0000',},
    })
    
    //渲染刷新 添加过挂件需要手动刷新
    head.draw()
  },
  addImg()
  {
    wx.chooseImage({
      success(res){
        res.tempFilePaths.forEach(path=>{
          head.addWidget(path)
        })
      },      
    })
  },
  getImg(){
    head.draw(function(res){
      wx.previewImage({
        urls: [res.tempFilePath],
      })
    })
  }
})



```
