function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function parseParam(param, key, encode){ 
 
  if(param==null) return '';
  var paramStr = '';
  var t = typeof (param);
  if (t == 'string' || t == 'number' || t == 'boolean') {
    paramStr += key + '=' + ((encode==null||encode) ? encodeURIComponent(param) : param) + '&';
  } else {
    for (var i in param) {
      var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i);
      paramStr += parseParam(param[i], k, encode);
    }
  }
  return paramStr;
 
};

function arrayToString(arr){
  if(toString.apply(arr) === '[object Array]'){
    return '['+arr.toString()+']';
  } else {
    throw new error('参数必须为数组');
  }
}

module.exports = {
  formatTime: formatTime,
  parseParam: parseParam,
  arrayToString: arrayToString
}