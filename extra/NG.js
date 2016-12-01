var util = require("../utils/util");

function showToast(option){
    var title = option.title,
        icon = option.icon,
        success = option.success;
    wx.showToast({
        title: title,
        icon: icon,
        success:success
    })
}

function AFRequst(funcname, params, callback) {
    // wx.request({
    //     url: getApp().GLOBAL_CONFIG.productAdr + "/rest/api/workflow/" + funcname + "/Get",
    //     data: util.parseParam(params),
    //     method: 'POST', 
    //     header: {
    //     'Cookie': wx.getStorageSync('Cookie'),
    //     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    //     },
    //     success: function(res){
    //     if(res.data.status){
    //         callback(res.data);
    //     } else {
    //         NG.showToast({title:'服务器接口异常', icon: 'success'});
    //     }
    //     },
    //     fail: function(res) {
    //     NG.showToast({title:'连接服务器失败', icon: 'success'});
    //     }
    // })
    params.requestType = 'post';
    params.requestAds = getApp().GLOBAL_CONFIG.productAdr + "/rest/api/workflow/" + funcname + "/Get";
    wx.request({
        url:  getApp().GLOBAL_CONFIG.redirectAdr,
        data: util.parseParam(params),
        method: 'POST', 
        header: {
        'Cookie': wx.getStorageSync('Cookie'),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        success: function(res){
        if(res.data.status){
            callback(res.data);
        } else {
            NG.showToast({title:'服务器接口异常', icon: 'success'});
        }
        },
        fail: function(res) {
        NG.showToast({title:'连接服务器失败', icon: 'success'});
        }
    })
}

module.exports = {
  showToast: showToast,
  AFRequst: AFRequst
}