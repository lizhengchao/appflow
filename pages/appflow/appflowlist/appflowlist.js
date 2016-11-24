var util = require("../../../utils/util")
Page({
    data:{
      tabselectordata: [{
        text: '代办任务',
        seltype: 0
      },{
        text: '已办任务',
        seltype: 2
      },{
        text: '我发起的流程',
        seltype: 1
      }],
      curentseltype: 0,
      appflows: {
        appflowlist: [],
        rowcount: 0,
        pageindex: 1,
        pagesize: 20
      }
    },

    //加载审批列表
    onLoad: function(){
      var me = this, 
        loginid='00022';
      //模拟登陆
      me.kernelsession(loginid, 1,me.getappflowlist);
    },

    onShow: function(){
      var me = this;
      this.setData({
        appflows: {
          appflowlist: [],
          rowcount: 0,
          pageindex: 1,
          pagesize: 20
        }
      })
      this.getappflowlist({
        loginid: getApp().GLOBAL_CONFIG.userId,
        pageindex: 1,
        pagesize: 20,
        myflowtype:  me.data.curentseltype})
    },

    onPullDownRefresh: function(){
      var me = this;
      this.setData({
        appflows: {
          appflowlist: [],
          rowcount: 0,
          pageindex: 1,
          pagesize: 20
        }
      })
      this.getappflowlist({
        loginid: getApp().GLOBAL_CONFIG.userId,
        pageindex: 1,
        pagesize: 20,
        myflowtype:  me.data.curentseltype}, function(){
          wx.stopPullDownRefresh();
        })
    },

    //拉到页面最下方
    listtolower: function(){
      var me = this,
        appflows = me.data.appflows,
        rowcount = appflows.rowcount,
        pageindex = appflows.pageindex,
        pagesize = appflows.pagesize,
        currentseltype = me.data.curentseltype,
        loginid = "00022";
      
      if(pageindex*pagesize<=rowcount){
        me.getappflowlist({
          loginid: loginid,
          pageindex: pageindex+1,
          pagesize: pagesize,
          myflowtype: currentseltype
        })
      }
    },

    ////////////////////////////页面事件/////////////////////////////////////////
    //点击任务类型tab
    tabtap: function(e){
      var me =this,
        id = e.currentTarget.id,
        seltype = me.data.tabselectordata[id].seltype,
        loginid = '00022';
      this.setData({
        curentseltype: seltype,
        appflows: {
          appflowlist: [],
          rowcount: 0,
          pageindex: 1,
          pagesize: 20
        }
      })
      me.getappflowlist({
          loginid: loginid,
          pageindex: 1,
          myflowtype: seltype
        });
    },
    //点击项目跳转至详情页
    itemtap: function(e){
      var me = this,
        id = e.currentTarget.id,
        currentappflow = me.data.appflows.appflowlist[id],
        piid = currentappflow.piid, //详细页数据的请求参数
        nodeid = currentappflow.nodeid, //详细页数据的请求参数
        taskinstid = currentappflow.taskinstid, //详细页数据的请求参数
        flowtype = currentappflow.flowtype, //详细页数据的请求参数
        curentseltype = me.data.curentseltype, //当前选择的任务类型，详细页中需用来做判断
        detailtitle = curentseltype==0 ? 
          currentappflow.taskdesc : currentappflow.keyword; //详细页面标题

        wx.navigateTo({
          url: '/pages/appflow/appflowdetail/appflowdetail?piid='+piid+'&nodeid='+
            nodeid+'&taskinstid='+taskinstid+'&flowtype='+flowtype+
            '&curentseltype='+curentseltype+'&detailtitle='+detailtitle
        })
    },


    ////////////////////////////自建方法/////////////////////////////////////////
    //模拟登陆
    kernelsession: function(loginid, isapp, successcallback){
      var productAdr = getApp().GLOBAL_CONFIG.productAdr,
        kernel = getApp().GLOBAL_CONFIG.requestAdr.kernel,
        me = this;
      wx.request({
        url: productAdr+kernel,
        data: {
          'loginid': loginid,
          'isapp': isapp
        },
        method: 'GET',
        success: function(res){
          if(res.data.status != 'Success'){
            wx.showToast({
                title: res.data.errmsg,
                icon: 'success'
            });
            return;
          } else {
            //将获取到的cookie塞到localstorge
            //TODO
            var cookie = 'ASP.NET_SessionId=vzve5555xnmwgd25rvhvhe45';
            wx.setStorageSync('Cookie', cookie);
            successcallback({
              loginid: loginid,
              pageindex: 1
            });
          }
        },
        fail: function() {
        },
        complete: function() {
        }
      })
    },

    //获取审批列表 need: loginid: 用户id； pageindex:当前页 
    getappflowlist: function(option, successcallback){
      var loginid = option.loginid,
        pageindex = option.pageindex,
        pagesize = option.pagesize,
        myflowtype = option.myflowtype;

      var me = this,
        productAdr = getApp().GLOBAL_CONFIG.productAdr,
        getTaskList = getApp().GLOBAL_CONFIG.requestAdr.getTaskList,
        pagesize = (typeof(pagesize) == 'undefined'? 20 : pagesize), //pagesize默认20
        start = (pageindex-1) * pagesize,
        method,
        cookie = wx.getStorageSync('Cookie');
        
      if(typeof(myflowtype) == 'undefined' || myflowtype == 0){
        method = 'GetPendingTaskInstances';
      } else {
        method = 'GetMyAppFlowInstance4MobileApp';
      }

      wx.request({
        url: productAdr+getTaskList,
        data: {
          'method': method,
          'logid': loginid,
          'pageindex': pageindex,
          'start': start,
          'pagesize': pagesize,
          'myflowtype': myflowtype
        },
        method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        header: {'Cookie': cookie},
        success: function(res){
          if(res.data.status == "succeed"){
            me.data.appflows.appflowlist = me.data.appflows.appflowlist.concat(res.data.data);
            me.data.appflows.rowcount = res.data.rowcount;
            me.data.appflows.pageindex = pageindex;
            me.data.appflows.pagesize = pagesize;
            me.setData({
                appflows: me.data.appflows
            })
            if(typeof successcallback == 'function') successcallback(res);
          } else {
            wx.showToast({
                title: res.data.errmsg,
                icon: 'success'
            });
          }
        },
        fail: function() {
          // fail
        },
        complete: function() {
          // complete
        }
      })
    }
})