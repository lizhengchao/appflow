Page({
    data: {
        ////////////////////////////页面绑定数据/////////////////////////////////////////
        tabselectordata: [{
            color: '#f39800',
            bindtap: 'tasktap',
            text: '任务'
        },{
            color: '#000000',
            bindtap: 'formtap',
            text: '表单'
        },{
            color: '#000000',
            bindtap: 'attachmenttap',
            text: '附件'
        }
        ],
        contanierdisplay: [ //三个tab页是否显示
            'block',
            'none',
            'none'
        ],
        taskdisplay: [ //几个可展开的模块是否显示
            {
                display: 'block',
                iconname: 'u156.png'
            },
            {
                display: 'block',
                iconname: 'u156.png'
            },
            {
                display: 'block',
                iconname: 'u156.png'
            },
            {
                display: 'block',
                iconname: 'u156.png'
            }
        ],
        nodedisplay: {  
            nextnode: 'block',  //“下一个节点”是否显示
            handlepeople: 'none', //“指派下级节点办理人”是否显示
            nodecontanier: 'none' //下级节点办理人是否显示
        },
        taskInfo: {

        },
        toolbars: [],
        moretoolbardisplay: 'none',

        ////////////////////////////逻辑数据/////////////////////////////////////////
        flowType: '',
        piid: '',
        nodeid: '',
        taskinstid: '',
        pageType: '',  //页面类型，Edit:代办任务；View: 已办、我发起的任务；View_OAWF:flowtype为oawf的代办任务，在onLoad中初始化
        needPeople: false, //是否需要指派办理人

        ////////////////////////////输入的交互数据/////////////////////////////////////////
        comments: '', //审批意见
        signid: '', //签章id，暂时未做签章
        currentnodes: [], //当前已选择的下级节点
        currentnodeactors: [] //当前已选择的下级节点办理人
    },
    onLoad: function(obj){
        var me = this;

        wx.setNavigationBarTitle({
          title: obj.detailtitle
        })

        me.data.flowType = obj.flowType;
        me.data.piid = obj.piid;
        me.data.nodeid = obj.nodeid;
        me.data.taskinstid = obj.taskinstid;
        
        if(obj.curentseltype == 0){
            me.data.pageType = 'Edit';
        } else {
            me.data.pageType = 'View';
        }
        //获取页面数据
        me.getAppflowDetail(obj, function(data){
            //在成功时设置特殊的页面类型和数据
            if (me.data.pageType == "Edit" && obj.flowtype == "oawf") {
                var action = data.taskInstInfo[0].action;
                if (action && action != "tocheck" && action != "check") {
                    me.data.pageType = "View_OAWF";
                }
            }
            me.setData({
                taskInfo: data,
                pageType: me.data.pageType
            });

            me.initTaskPanel();
            me.initToolbar();
            
        });

    },
    onReady: function(){

    },
    onShow: function(){

    },
    onHide: function(){

    },
    onUnload: function(){

    },
    ////////////////////////////页面事件/////////////////////////////////////////
    //tab页选择点击事件
    tabseltap: function(e){
        var id = e.currentTarget.id,
            me = this,
            tabselectordata = me.data.tabselectordata,
            contanierdisplay = me.data.contanierdisplay;
        //更改按钮颜色
        tabselectordata[id].color='#f39800';
        for(var i=0; i<tabselectordata.length; i++){
            if(i != id){
                tabselectordata[i].color='#000000';
            }
        }
        //更改页面块
        contanierdisplay[id] = 'block';
        for(var i=0; i<contanierdisplay.length; i++){
            if(i != id){
                contanierdisplay[i] = 'none';
            }
        }
        this.setData({
            tabselectordata: this.data.tabselectordata,
            contanierdisplay: this.data.contanierdisplay
        })
    },
    listtolower: function(e){
    },
    //下拉按钮点击
    tasktap: function(e){
        var id = e.currentTarget.id.substring(0,1),
            taskdetaildisplay = this.data.taskdisplay[id];
        if(taskdetaildisplay.display == 'block' 
            && taskdetaildisplay.iconname == 'u156.png'){
                taskdetaildisplay.display = 'none';
                taskdetaildisplay.iconname = 'u4.png';
        } else if(taskdetaildisplay.display == 'none' 
            && taskdetaildisplay.iconname == 'u4.png'){
                taskdetaildisplay.display = 'block';
                taskdetaildisplay.iconname = 'u156.png';
        }
        this.setData({
            taskdisplay: this.data.taskdisplay
        })
    },

    //下级节点选择按钮
    tasknodetap: function(e){
        var me = this,
            taskInfo = me.data.taskInfo,
            id = e.currentTarget.id,
            currentnode = taskInfo.nextNodes[id];

        // 不需要指定节点则直接跳出 
        if(!taskInfo.taskInstInfo[0].designate_node){
            return;
        }

        //更改checkbox显示
        if(currentnode.checkbox == 0){
            currentnode.checkbox = 2;
        } else {
            currentnode.checkbox = 0;
        }
        this.setData({
            taskInfo: me.data.taskInfo
        })
        
        //如果当前节点需要选择下级办理人
        if(currentnode.designate_actor && currentnode.checkbox == 2){
            me.data.nodedisplay.nodecontanier = 'block';
        } else if (currentnode.designate_actor && currentnode.checkbox == 0){
            me.data.nodedisplay.nodecontanier = 'none';
        }
        this.setData({
            nodedisplay: me.data.nodedisplay
        })

    },

    //下级节点办理人选择按钮
    handlenodetap: function(e){
        var me = this,
            taskInfo = me.data.taskInfo,
            id = e.currentTarget.id,
            currentactor = taskInfo.nextNodeDesignateActor[id];
        
        //更改checkbox显示
        if(currentactor.checkbox == 0){
            currentactor.checkbox = 2;
        } else {
            currentactor.checkbox = 0;
        }
        this.setData({
            taskInfo: me.data.taskInfo
        })
    },

    //“更多”按钮
    morebtnTap: function(){
        if(this.data.moretoolbardisplay == 'none'){
            this.setData({
                moretoolbardisplay: 'flex'
            })
        } else {
            this.setData({
                moretoolbardisplay: 'none'
            })
        }
    },

    //“提交”按钮
    submitbtnTap: function(){
        var a =1;
    },

    ////////////////////////////自建方法/////////////////////////////////////////
    //获取列表详情
    getAppflowDetail: function(obj, successcallback){
        var me = this,
            loginid = '00022',
            productAdr = getApp().GLOBAL_CONFIG.productAdr,
            getTask = getApp().GLOBAL_CONFIG.requestAdr.getTaskDetail,
            params,
            cookie = wx.getStorageSync('Cookie');
        
        if(obj.curentseltype == 0){
            params = 'method=GetTaskInstanceInfo'+'&logid='+loginid+'&flowtype='+
                obj.flowtype+'&piid='+obj.piid+'&nodeid='+obj.nodeid+'&taskinstid='+obj.taskinstid;
        } else {
            params = 'method=GetFlowAllInfo'+'&logid='+loginid+'&flowtype='+
                obj.flowtype+'&piid='+obj.piid;
        }

        wx.request({
          url: productAdr + getTask,
          data: params,
          method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
          header: {
              'Cookie': cookie,
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, // 设置请求的 header
          success: function(res){
            if(res.data.status != 'succeed'){
                wx.showToast({
                    title: res.data.errmsg,
                    icon: 'success'
                });
                return;
            }
            successcallback(res.data);
          },
          fail: function() {
            // fail
          },
          complete: function() {
            // complete
          }
        })
    },

    //初始化任务页面数据
    initTaskPanel: function () {
        var me = this,
            data = me.data.taskInfo;
        if (me.data.pageType == "Edit") {
            var nextNodes = data.nextNodes;
            // 下级节点页面、下级节点办理人页面数据初始化
            if (nextNodes.length > 0) {
                var signNode = data.taskInstInfo[0].designate_node,
                    checkbox = signNode == 0 ? 2 : 0; //是否需要选择下级节点
                for (var i = 0; i < nextNodes.length; i++) {
                    nextNodes[i].checkbox = checkbox;
                    if (nextNodes[i].designate_actor == 1) { //节点需要指定受理人
                        me.data.needPeople = true;
                        me.data.nodedisplay.handlepeople = 'block';
                        me.setData({
                            nodedisplay: me.data.nodedisplay
                        })
                        if(signNode == 0){ //无需选择下级节点，同时显示下级节点办理人
                            me.data.nodedisplay.nodecontanier = 'block';
                            var nextNodeDesignateActor = me.data.taskInfo.nextNodeDesignateActor;
                            //为下级节点办理人初始化图标属性
                            for(var i=0; i<nextNodeDesignateActor.length; i++){
                                nextNodeDesignateActor[i].checkbox = 0;
                            }
                            this.setData({
                                nodedisplay: me.data.nodedisplay,
                                taskInfo: me.data.taskInfo
                            })
                        }
                    }
                }

                me.data.taskInfo.nextNodes = nextNodes;
                me.setData({
                    taskInfo: data
                })
            } else {
                //隐藏下级节点页面、下级节点办理人页面
                me.data.nodedisplay.nextnode = 'none';
                me.data.nodedisplay.handlepeople = 'none';
                me.setData({
                    nodedisplay: nodeddisplay
                })
            }
        }
    },

    //初始化下方操作栏
    initToolbar: function(){
        var me = this,
            taskInfo = me.data.taskInfo.taskInstInfo[0];
            me.data.toolbars.push({
                name: '提交',
                tapfunction: 'submitbtnTap'
            });
            if (taskInfo.canUndo != 0) {
                me.data.toolbars.push({
                    name: '驳回',
                    tapfunction: 'rejectbtnTap'});
            }
            if (taskInfo.canTransmit && taskInfo.canTransmit == 1) {
                me.data.toolbars.push({
                    name: '转签',
                    tapfunction: 'changebtnTap'});
            }
            if (taskInfo.canTermi == 1) {
                 me.data.toolbars.push({
                    name: '终止',
                    tapfunction: 'stopbtnTap'});
            }
            if (taskInfo.canAddTis == 1) {
                me.data.toolbars.push({
                    name: '加签',
                    tapfunction: 'addbtnTap'});
            }
            if (me.data.toolbars.length > 3) {
                me.data.toolbars.splice(2, 0, {
                    name: '更多',
                    tapfunction: 'morebtnTap'
                });
            }
            me.setData({
                toolbars: me.data.toolbars
            });
    }
})