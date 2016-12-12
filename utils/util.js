var Expression = require("Evaluator").Expression;
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
};

 function isEmpty(value, allowEmptyString) {
    return (value === null) || (value === undefined) || (!allowEmptyString ? value === '' : false) || (isArray(value) && value.length === 0);
};

function isArray(value) {
    return toString.call(value) === '[object Array]';
};

function isInteger(obj) {
    return typeof obj === 'number' && obj%1 === 0;
}

function clone(obj){
    var o;
    switch(typeof obj){
        case 'undefined': break;
        case 'string'   : o = obj + '';break;
        case 'number'   : o = obj - 0;break;
        case 'boolean'  : o = obj;break;
        case 'object'   :
            if(obj === null){
                o = null;
            }else{
                if(obj instanceof Array){
                    o = [];
                    for(var i = 0, len = obj.length; i < len; i++){
                        o.push(clone(obj[i]));
                    }
                }else{
                    o = {};
                    for(var k in obj){
                        o[k] = clone(obj[k]);
                    }
                }
            }
            break;
        default:
            o = obj;break;
    }
    return o;
}

module.exports = {
    formatTime: formatTime,
    parseParam: parseParam,
    arrayToString: arrayToString,
    isEmpty: isEmpty,
    isArray: isArray,
    isInteger: isInteger,
    clone: clone,
    Expression: Expression
}