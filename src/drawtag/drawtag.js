export default class DrawTag {
  constructor(canvasId, page, size,colorArr=[]) {
    this.canvasid = canvasId;
    this.ctx = wx.createCanvasContext(canvasId, page);
    this.w = size.w || size.width;
    this.h = size.h || size.height;
    if(!this.w || !this.h)
    {
      throw new Error('请传入大小')
    }
    this.finImgData = null
    if(typeof colorArr==='object' && colorArr.length>0)
    {
      this.colorArr = colorArr
    }
    else{
      this.colorArr = [
       //默认颜色
      '#FF0000',
      '#FF7F00',
      '#00FF00',
      '#00FFFF',
      '#0000FF',
      '#8B00FF',
      '#000000',
    ]
  }
  }
  //画出标签
  //[{word:'帅',sort:5},{word:'帅',sort:5}]
  draw(words, cb) {
    if (typeof cb != 'function') {
      throw Error('回调函数错误')
    }
    this.cb = cb
    this.words = this.cavulateData(words)
    this.finImgMsg = []
    this.finImgData = createImageData(this.w, this.h)
    for (let i = 0; i < this.w; ++i) {
      this.finImgMsg[i] = [];
      for (let j = 0; j < this.h; ++j) {
        this.finImgMsg[i][j] = 0;
      }
    }

    this.drawWord(0);
  }
  drawWord(index) {
    let word = this.words[index].name, size = this.words[index].count
    let fillStyle = this.colorArr[random(this.colorArr.length - 1)];
    this.ctx.fillStyle = fillStyle;
    this.ctx.font = "900 " + size + "px  微软雅黑";
    let w = this.ctx.measureText(word).width;
    let h = size;
    this.ctx.textBaseline = "top";
    this.ctx.fillText(word, 0, 0);
    this.ctx.draw()
    let _this = this
    setTimeout(() => {
      wx.canvasGetImageData({
        canvasId: this.canvasid,
        x: 0,
        y: 0,
        width: w,
        height: h + 10,
        success(res) {
          let wordImgData = _this.randomRotateImgeData(res)
          _this.ctx.clearRect(0, 0, w, h + 10);
          _this.ctx.draw()
          let centerPoint = _this.getCenterPoint();
          let i = 0;
          while (i < 1000) {
            if (centerPoint.isFullRound()) {
              centerPoint.clearRound();
            }
            let pos = centerPoint.getCenterPos(wordImgData.width, wordImgData.height);
            pos.x = _this.w / 2 + pos.x;
            pos.y = _this.h / 2 + pos.y;

            if (_this.isAbleDraw(wordImgData, pos.x, pos.y)) {
              for (let i = 0; i < wordImgData.width; i++) {
                for (let j = 0; j < wordImgData.height; j++) {
                  let point = getXY(wordImgData, i, j);
                  if (point[3] != 0) {
                    setXY(_this.finImgData, pos.x + i, pos.y + j, point);
                    _this.finImgMsg[pos.x + i - 1][pos.y + j - 1] = 1
                  }
                }
              }
              break;
            }
            i++;
            centerPoint = _this.getCenterPoint(centerPoint);
          }
          if(i===1000)
          {
            console.error('"'+word+'"没找到合适的位置可以画，可能太长了、太大、太多 被跳过了')
          }
          index++
          if (index < _this.words.length) {
            _this.drawWord(index)
          }
          else {
            let data = _this.finImgData.data
            wx.canvasPutImageData({
              canvasId: _this.canvasid,
              x: 0,
              y: 0,
              width: _this.w,
              height: _this.h,
              data,
              success(res) {
                setTimeout(() => {
                  wx.canvasToTempFilePath({
                    x: 0,
                    y: 0,
                    width: _this.w,
                    height: _this.h,
                    canvasId: _this.canvasid,
                    success(res) {
                      _this.cb(res.tempFilePath)
                    }
                  })
                }, 0)

              },
            })
          }
        }
      })
    }, 0)


    return
  }





  /**
   * 随机旋转
   */
  randomRotateImgeData(imgData) {
    let newImageData = createImageData(imgData.height, imgData.width);
    if (random(9) > 6) {
      for (let i = 0; i < imgData.height; i++) {
        for (let j = 0; j < imgData.width; j++) {
          let point = getXY(imgData, j, i);
          setXY(newImageData, imgData.height - i - 1, j, point);
        }
      }
      imgData = newImageData;
    }

    return imgData;
  }

  /**
   * 用于标签的位置选择
   */
  getCenterPoint(centerPoint) {

    //没有传入centerPoint,默认初始化
    if (typeof centerPoint != 'object') {
      //centerPoint对象，用于存储以往已经选择的点的信息
      var centerPoint = {
        round: 1, //第几圈
        choose: [], //已选择的点
        nowChoose: null,
        revert: 0,
        /**
         * 随机选择点
         */
        randPoint: function () {
          let chooseCount = this.round == 1 ? 1 : this.round * 2 + (this.round - 2) * 2; //总共可以选择的点
          //所有情况已经遍历了，增加一环 ,重置
          if (this.choose.length == chooseCount) {
            this.round++;
            this.choose = [];
            this.revert = 0;
            return this.randPoint();
          }

          while (true) {
            this.nowChoose = random(chooseCount - 1);
            if (!inArray(this.nowChoose, this.choose)) {
              this.choose.push(this.nowChoose);

              break;
            }
          }

          return this.nowChoose;
        },
        getCenterPos: function (w, h) {

          let shift = 0.5; //偏移率
          let shiftw = random(1) ? random(w * shift) : -random(w * shift);
          let shifth = random(1) ? random(h * shift) : -random(h * shift);

          let pos = {
            x: 0,
            y: 0
          }

          if (this.nowChoose === null) {
            return false;
          }
          if (this.round != 1) {
            let quadrant = Math.floor((this.nowChoose) / (this.round - 1)); //第几象限
            let distance = (this.nowChoose + 1) % this.round; //象限的偏移
            switch (quadrant) {
              case 0:
                pos.x = w / 2 * distance;
                pos.y = h / 2 * (this.round - distance);
                break;
              case 1:
                pos.x = w / 2 * (this.round - distance);
                pos.y = h / 2 * (-distance);
                break;
              case 2:
                pos.x = w / 2 * (-distance);
                pos.y = h / 2 * -(this.round - distance);
                break;
              case 3:
                pos.x = w / 2 * -(this.round - distance);
                pos.y = h / 2 * distance;;
                break;
            }
          }


          pos.x += shiftw;
          pos.y += shifth;

          pos.x = Math.floor(pos.x - w / 2)
          pos.y = Math.floor(pos.y - h / 2)
          return pos;

        },
        isFullRound: function () {
          if (this.revert) return false;
          let chooseCount = this.round == 1 ? 1 : this.round * 2 + (this.round - 2) * 2; //总共可以选择的点
          return this.choose.length == chooseCount;
        },
        clearRound: function () {
          this.choose = [];
          this.revert = 1;
        }
      };

    }

    centerPoint.randPoint();
    return centerPoint;
  }
  /**
   * 是否可以画
   */
  isAbleDraw(wordImg, x, y) {
    let w = wordImg.width;
    let h = wordImg.height;

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        let wordPoint = getXY(wordImg, i, j);
        //检测文字图片上该点是否有痕迹，不全为白为有痕迹
        if (wordPoint[3] != 0) {
          let finx = x + i - 1;
          let finy = y + j - 1;
          if (finx < 0 || finx >= this.w || finy < 0 || finy >= this.h) {
            return false;
          }
          if (this.finImgMsg[finx][finy] == 1) {
            return false;
          }
        }
      }
    }
    return true;
  }



  //计算标签大小
  cavulateData(words) {
    let dataArr = [];
    let obj;
    for (let i in words) {
      dataArr.push({
        name: words[i].word,
        count: words[i].sort,
      })
    }
    dataArr.sort(function (x, y) {
      if (Math.floor(x.count) == Math.floor(y.count)) {
        return 0;
      }
      if (Math.floor(x.count) > Math.floor(y.count)) {
        return -1;
      } else {
        return 1;
      }
    })
    let shift = -6;
    for (let i = 0; i < dataArr.length; i++) {
      if (i == 0) {
        dataArr[0].count = 50;
        continue;
      }
      if (shift < 0) {
        shift++
      }
      dataArr[i].count = Math.floor(dataArr[i - 1].count * 99 / 100) + shift;
      if (dataArr[i].count < 10) {
        dataArr[i].count = 10;
      }
    }
    words = dataArr;
    return words;

  }
}

function random(num) {
  return Math.floor(Math.random() * (num + 1));
}
/**
 *将重心坐标改成边缘坐标
 * 适用于x和y轴
 */
function center2abs(center, w, pos) {
  return center - Math.floor(w / 2) + pos;
}

function inArray(son, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == son) {
      return true;
    }
  }
  return false;
}
/**
 * imgData根据坐标获取
 */
function getXY(imgData, x, y) {
  let res = [];
  let w = imgData.width;
  let h = imgData.height;

  let pos = (y * w + x) * 4;

  res[0] = imgData.data[pos];
  res[1] = imgData.data[pos + 1];
  res[2] = imgData.data[pos + 2];
  res[3] = imgData.data[pos + 3];
  return res;
}
/**
 * imgData根据坐标修改
 */
function setXY(imgData, x, y, res) {
  let w = imgData.width;
  let h = imgData.height;

  let pos = (y * w + x) * 4;

  imgData.data[pos] = res[0];
  imgData.data[pos + 1] = res[1];
  imgData.data[pos + 2] = res[2];
  imgData.data[pos + 3] = res[3];
}
//兼容没有的api
function createImageData(width, height) {
  let res = { width: width, height: height }
  let tmp_arr = []
  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
      tmp_arr.push(0, 0, 0, 0)
    }
  }
  res.data = new Uint8ClampedArray(tmp_arr)
  tmp_arr = null
  return res
}