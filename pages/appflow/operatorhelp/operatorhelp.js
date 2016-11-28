var util = require("../../../utils/util");
var NG = require("../../../extra/NG")
Page({
    data: {
        ////////////////////////////页面绑定数据/////////////////////////////
        operatorlist: [],   //操作员列表
        contactslist: [],   //最近联系人列表,从localstorge中取
        processlist: [],    //流程人员列表
        

        ////////////////////////////逻辑数据////////////////////////////////
        operatorconfig: {
            hasOperator: true,
            rowcount: 0,
            pageindex: 1,
            pagesize: 20
        },
        contactsconfig: {
            hasRecentConatacts: true
        },
        processconfig: {
            hasProcess: true,
            flowType: 'af',
            piid: '0000010676',
            nodeid: '0000000004',
            rowcount: 0,
            pageindex: 1,
            pagesize: 20
        },      


        ////////////////////////////输入的交互数据/////////////////////////
        currentTab: 0, //当前选择的tab页 0:操作员页  1:最近联系人页
        selectlist: [], //已选择的操作员
        searchtext: ''  //搜索条件

    },
    onLoad: function(option){
         var me = this,
            hasOperator = option.hasOperator,
            hasRecentConatacts = option.hasRecentConatacts,
            hasProcess = option.hasProcess,
            currentTab = option.currentTab;
        
        me.data.operatorconfig.hasOperator = hasOperator === 'true'? true:false;
        me.data.contactsconfig.hasRecentConatacts = hasRecentConatacts === 'true'? true:false;
        me.data.processconfig.hasProcess = hasProcess === 'true'? true:false;
        
        if(hasProcess){
            me.data.processconfig.flowType = option.flowType;
            me.data.processconfig.piid = option.piid;
            me.data.processconfig.nodeid = option.nodeid;
        }
        

        me.setData({
            operatorconfig: me.data.operatorconfig,
            contactsconfig: me.data.contactsconfig,
            processconfig: me.data.processconfig,
            currentTab: currentTab
        })

        me.initListData();
    },

    ////////////////////////////页面事件/////////////////////////////////////////
    //查找框输入内容
    searchinput: function(value){
        var me = this;
        me.setData({
            searchtext: value.detail.value
        })
        if(me.data.currentTab == 0){
             me.AFRequst('TaskInstance', {
                'method': 'GetAllUser',
                'filter': me.data.searchtext,
                'pageindex': 1,
                'start': 0,
                'pagesize': 20
            }, function(data){
                me.data.operatorconfig.rowcount = data.rowcount;
                me.data.operatorconfig.pageindex = 1;
                me.data.operatorlist = data.data;
                me.setData({
                    operatorconfig: me.data.operatorconfig,
                    operatorlist: me.data.operatorlist
                });
            });
        }
    },

    //列表点击事件
    itemtap: function(e){
        var me = this,
            id = e.currentTarget.id,
            currentTab = me.data.currentTab,
            selectlist = me.data.selectlist,
            currentOperator;

        if(currentTab == 0){
            currentOperator = me.data.operatorlist[id];
        } else if( currentTab == 1){
            currentOperator = me.data.contactslist[id];
        } else {
            currentOperator = me.data.processlist[id];
        }

        if(!currentOperator.check || currentOperator.check == 0){
            if(currentOperator.usercode == getApp().GLOBAL_CONFIG.userId){
                NG.showToast({title: '无法选择自己', icon: 'success'});
                return;
            }
            currentOperator.check = 1;
            selectlist.push(currentOperator);
        } else {
            currentOperator.check = 0;
            selectlist.splice(id, 1);
        }

        if(currentTab == 0){
            me.setData({
                operatorlist: me.data.operatorlist
            })
        } else if( currentTab == 1){
            me.setData({
                contactslist: me.data.contactslist
            })
        } else {
            me.setData({
                processlist: me.data.processlist
            })
        }
    },

    //页面到最底层
    listtolower: function(){
        var me = this;
        if(me.data.currentTab == 0){
            var pageindex = me.data.operatorconfig.pageindex+1,
                pagesize = me.data.operatorconfig.pagesize,
                searchtext = me.data.searchtext,
                start = (pageindex-1)*pagesize;
            me.AFRequst('TaskInstance', {
                'method': 'GetAllUser',
                'filter': searchtext,
                'pageindex': pageindex,
                'start': start,
                'pagesize': pagesize
            }, function(data){
                me.data.operatorlist = me.data.operatorlist.concat(data.data);
                me.setData({
                    operatorlist: me.data.operatorlist,
                    operatorconfig: me.data.operatorconfig
                });
            })
        } else if(me.data.currentTab == 2){
            var pageindex = me.data.processconfig.pageindex+1,
                pagesize = me.data.processconfig.pagesize,
                searchtext = me.data.searchtext,
                start = (pageindex-1)*pagesize;
            me.AFRequst('TaskInstance', {
                'method': 'GetNodeUsers',
                'logid': getApp().GLOBAL_CONFIG.userId,
                'flowType': me.data.processconfig.flowType,
                'piid': me.data.processconfig.piid,
                'nodeid': me.data.processconfig.nodeid,
                'page': pageindex,
                'start': (pageindex-1) * pagesize,
                'limit': pagesize
            }, function(data){
                me.data.processlist = me.data.processlist.concat(data.data);
                me.setData({
                    processlist: me.data.processlist,
                    processconfig: me.data.processconfig
                });
            })
        }
    },

    //点击确定事件
    okbtn: function(){
        var me = this,
            selectlist = me.data.selectlist;
        if(selectlist.length == 0){
            NG.showToast({title:'请选择操作员', icon: 'success'});
        }

        //去除所有重复的项
        for(var i in selectlist){
            for(var j in selectlist){
                if(i!=j && selectlist[i].usercode == selectlist[j].usercode){
                    selectlist.splice(j, 1);
                    j = j - 1;
                }
            }
        }

        getApp().selectlist = selectlist;

        wx.navigateBack({ delta: 1 });


    },

    operatortap: function(){
        this.setData({currentTab: 0});
    },

    contactstap: function(){
        this.setData({currentTab: 1});
    },

    processtap: function(){
        this.setData({currentTab: 2});
    },

    /////////////////////////////自建方法//////////////////////////////////////
    //审批流请求
    AFRequst: function (funcname, params, callback) {
        var me = this;
        wx.request({
          url: getApp().GLOBAL_CONFIG.productAdr + "/rest/api/workflow/" + funcname + "/Get",
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
    },

    initListData: function(){
        var me = this,
            // data = option.data,
            operatorlist = [],
            contactslist = [],
            processlist = [],
            hasOperator = me.data.operatorconfig.hasOperator,
            hasRecentConatacts = me.data.contactsconfig.hasRecentConatacts,
            hasProcess = me.data.processconfig.hasProcess;
        
        
        
        //获取操作员数据
        if(hasOperator){
            me.AFRequst('TaskInstance', {
                'method': 'GetAllUser',
                'filter': '',
                'pageindex': 1,
                'start': 0,
                'pagesize': 20
            }, function(data){
                me.data.operatorconfig.rowcount = data.rowcount;
                operatorlist = data.data;
                me.setData({
                    operatorconfig: me.data.operatorconfig,
                    operatorlist: operatorlist
                });
            });
        }

        //获取最近联系人数据 
        if(hasRecentConatacts) contactslist = wx.getStorageSync('recentcontacts');
        me.setData({ contactslist: contactslist });

        //获取流程人员
        if(hasProcess){
            (function(){
                var pageindex = me.data.processconfig.pageindex,
                    pagesize = me.data.processconfig.pagesize;
                me.AFRequst('TaskInstance', {
                    'method': 'GetNodeUsers',
                    'logid': getApp().GLOBAL_CONFIG.userId,
                    'flowType': me.data.processconfig.flowType,
                    'piid': me.data.processconfig.piid,
                    'nodeid': me.data.processconfig.nodeid,
                    'page': me.data.processconfig.pageindex,
                    'start': (pageindex-1) * pagesize,
                    'limit': pagesize,
                    'filter': 'i'
                }, function(data){
                    me.data.processconfig.rowcount = data.rowcount;
                    processlist = data.data;
                    me.setData({
                        processconfig: me.data.processconfig,
                        processlist: processlist
                    })
                })
            }());
        }
    }

})