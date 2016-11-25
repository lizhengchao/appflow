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

module.exports = {
  showToast: showToast
}