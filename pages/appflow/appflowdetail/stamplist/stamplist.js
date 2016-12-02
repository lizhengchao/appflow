var NG = require("../../../../extra/NG");
Page({
    data: {
        stamplist: [], //签章列表
        callbackname: '', //回调方法名称
        currentstampid: -1, //当前选择的印象id
        resourceAdr: getApp().GLOBAL_CONFIG.resourceAdr,
    },

    onLoad: function(option){
        var me = this,
            callbackname = option.callbackname;
        me.setData({
            callbackname: callbackname
        })

        me.initlist();
    },

    //点击项目
    itemtap: function(e){
        var me = this,
            id = e.currentTarget.id,
            stamplist = me.data.stamplist,
            currentstamp = stamplist[id];
        
        for(var i in stamplist){
            stamplist[i].checkbox = 0;
        }
        currentstamp.checkbox = 1;
        
        me.setData({
            currentstampid: id,
            stamplist: stamplist
        })

    },

    //输入密码
    pwinput: function(e){
        var me = this,
            id = e.currentTarget.id,
            stamplist = me.data.stamplist,
            currentstamp = stamplist[id];
        
        currentstamp.inputpw = e.detail.value;

        me.setData({
            stamplist: stamplist
        });
    },

    //点击确定
    okbtn: function(){
        var me =this,
            currentstampid = me.data.currentstampid,
            stamplist = me.data.stamplist,
            currentstamp = stamplist[currentstampid],
            callbackname = me.data.callbackname;
        if(currentstampid == -1){
            NG.showToast({title: '您未选择任何印章', icon: 'success'}); return;
        }

        if(currentstamp.markpass != currentstamp.inputpw){
            NG.showToast({title: '密码错误', icon: 'success'}); return;
        }

        var pages = getCurrentPages(),
            prevpage = pages[pages.length-2];
        
        prevpage.callbackname(currentstamp.ccode, 'data:image/gif;base64,' + currentstamp.content);

    },

    ////////////////自建方法/////////////
    initlist: function(){
        var me = this,
            params = {
                logid: getApp().GLOBAL_CONFIG.userId,
                method: 'GetAllSignature',
                flowType: 'af'
            };
        
        NG.AFRequst('TaskInstance', params, function(data){
            if(data.status == "succeed"){
                if(data.data.length>0){
                    me.setData({
                        stamplist: data.data
                    })
                } else {
                    NG.showToast({title: '无签章数据', icon: 'success'});
                }
            } else {
                NG.showToast({title: '服务接口异常：'+JSON.stringify(data), icon: 'success'})
            }
        })
    }
})