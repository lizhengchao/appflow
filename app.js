//app.js
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function () {
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  GLOBAL_CONFIG:{
    'productAdr' :'http://218.108.53.100:8081',
    'requestAdr': {
      'kernel': '/rest/api/kernelsession',
       'getTaskList': '/rest/api/workflow/TaskInstanceList/Get',
       'getTaskDetail': '/rest/api/workflow/TaskInstance/Get'
    },
    'userId': '00022'
  }
})