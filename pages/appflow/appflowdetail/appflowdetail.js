var util = require("../../../utils/util");
var NG = require("../../../extra/NG")
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
                display: 'none',
                iconname: 2
            },
            {
                display: 'none',
                iconname: 2
            },
            {
                display: 'none',
                iconname: 2
            },
            {
                display: 'none',
                iconname: 2
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
        currentnodeids: [], //当前选择的nodeidid,用于指派办理人时的展示

        ////////////////////////////输入的交互数据/////////////////////////////////////////
        comments: '', //审批意见
        signid: '', //签章id，暂时未做签章
        nodeArray: [], //当前已选择的下级节点
        nodePerson: [] //当前已选择的下级节点办理人,多个节点，每个节点对应对个办理人
    },
    onLoad: function(obj){
        var me = this;

        wx.setNavigationBarTitle({
          title: obj.detailtitle
        })

        me.data.flowType = obj.flowtype;
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
            && taskdetaildisplay.iconname == 1){
                taskdetaildisplay.display = 'none';
                taskdetaildisplay.iconname = 2;
        } else if(taskdetaildisplay.display == 'none' 
            && taskdetaildisplay.iconname == 2){
                taskdetaildisplay.display = 'block';
                taskdetaildisplay.iconname = 1;
        }
        this.setData({
            taskdisplay: this.data.taskdisplay
        })
    },

    //审批意见输入
    commentsChange: function(e){
        this.data.comments = e.detail.value;
    },

    advicebtntap: function(e){
        var me = this,
            id = e.currentTarget.id,
            text = me.data.taskInfo.commonWord[id].text;
        me.data.comments += text;
        me.setData({
            comments: me.data.comments
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
        
        //如果当前节点需要选择下级办理人，则展示下级办理人页面
        if(currentnode.designate_actor && currentnode.checkbox == 2){
            me.data.currentnodeids.push(currentnode.nodeid);
            for(var i in taskInfo.nextNodeDesignateActor){
                if(taskInfo.nextNodeDesignateActor[i].nodeid == currentnode.nodeid){
                    taskInfo.nextNodeDesignateActor[i].checkbox = 0;
                }
            }
            me.setData({
                currentnodeids: me.data.currentnodeids,
                taskInfo: taskInfo
            })
            me.data.nodedisplay.nodecontanier = 'block';
        } else if (currentnode.designate_actor && currentnode.checkbox == 0){
            for(var i in me.data.currentnodeids){
                if(me.data.currentnodeids[i] == currentnode.nodeid) 
                    me.data.currentnodeids.splice(i, 1);
            }
            me.data.nodedisplay.nodecontanier = 'none';
        }
        me.setData({
            nodedisplay: me.data.nodedisplay,
            
        })

        //加入到交互数据
        if(currentnode.checkbox == 2){
            me.data.nodeArray.push({
                nodeid: currentnode.nodeid
            });
        } else {
            for(var i in me.data.nodeArray){
                var node = me.data.nodeArray[i];
                if(node.nodeid == currentnode.nodeid){
                    me.data.nodeArray.splice(i, 1);
                }
            }
        }

    },

    //下级节点办理人选择按钮
    handlenodetap: function(e){
        var me = this,
            taskInfo = me.data.taskInfo,
            id = e.currentTarget.id,
            currentactor = taskInfo.nextNodeDesignateActor[id],
            nodePerson = me.data.nodePerson;
        
        //更改checkbox显示
        if(currentactor.checkbox == 0){
            currentactor.checkbox = 2;
        } else {
            currentactor.checkbox = 0;
        }
        this.setData({
            taskInfo: me.data.taskInfo
        })

        //加入到交互数据
        if(currentactor.checkbox == 2){
            if(!nodePerson[currentactor.nodeid]){
                nodePerson[currentactor.nodeid] = [];
            }
            var item = {
                nodeid: currentactor.nodeid,
                elecode: currentactor.elecode,
                usercode: currentactor.usercode,
                username: currentactor.username
            };
            nodePerson[currentactor.nodeid].push(item);
        } else { //从交互数据中移除
            for(var i in nodePerson[currentactor.nodeid]){
                if(nodePerson[currentactor.nodeid][i].nodeid == currentactor.nodeid &&
                    nodePerson[currentactor.nodeid][i].usercode == currentactor.usercode){
                    nodePerson[currentactor.nodeid].splice(i, 1);
                }
            }
        }
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

    //“驳回”按钮
    rejectbtnTap: function(){
        var me =this,
            signid = me.data.signid,
            comments = me.data.comments,
            issigature = me.data.taskInfo.taskInstInfo[0].issigature,
            logid = getApp().GLOBAL_CONFIG.userId;
        
        if(comments.length<=0){
            NG.showToast({ title: "审批意见不能为空", icon: 'success' }); return;
        }
        if (issigature == 1 && !signid) {
            NG.showToast({ title: "需要签章，请选择签章", icon: 'success' }); return;
        }

        var params = {
                method: 'GetRollBackInfo',
                flowType: me.data.flowType,
                piid: me.data.piid,
                nodeid: me.data.nodeid,
                taskinstid: me.data.taskinstid,
                logid: getApp().GLOBAL_CONFIG.userId
            };

        me.AFRequst('TaskInstance', params, function (resp) {
            if (resp.status == 'succeed') {
                if (resp.rollBackNodes.length == 0) {
                    NG.showToast({ title: '该流程已过审批节点，不支持驳回操作', icon: 'success' });
                }
                else {
                    getApp().taskInfo = me.data.taskInfo; //对象没法通过url传递，只能通过全局
                    getApp().rollBackInfo = resp;
                    wx.navigateTo({
                      url: 'rejectpanel/rejectpanel?rollBackInfo='+resp+"&remark="+
                        (comments || '语音')+"&signcode="+signid+"&flowType="+me.data.flowType+
                        "&piid="+me.data.piid+"&nodeid="+me.data.nodeid+"&taskinstid="+me.data.taskinstid
                    })
                }
            }
            else {
                NG.showToast({ title: '无法驳回：' + resp.errmsg, icon: 'success' });
            }
        });

    },

    //“提交”按钮
    submitbtnTap: function(){
        var me = this,
            comments = me.data.comments,
            signid = me.data.signid,
            nodeArray = me.data.nodeArray,
            nodePerson = me.data.nodePerson,
            
            issigature = me.data.taskInfo.taskInstInfo[0].issigature,
            designate_node = me.data.taskInfo.taskInstInfo[0].designate_node,
            
            dealArray = [];//请求时办理人参数
        
        if(comments.length<=0){
            NG.showToast({ title: "审批意见不能为空", icon: 'success' }); return;
        }
        if (issigature == 1 && !signid) {
            NG.showToast({ title: "需要签章，请选择签章", icon: 'success' }); return;
        }
        if (designate_node == 1 && nodeArray.length == 0) {
            NG.showToast({ title: "需要指定下级节点", icon: 'success' }); return;
        }

        if (me.data.needPeople) { //需要指定下级节点办理人
            for(var i=0; i<nodeArray.length; i++){
                var node = nodeArray[i];
                if (nodePerson[node.nodeid].length == 0) {
                    NG.showToast({ title: "未指定办理人", icon: 'success' }); return;
                } else {
                    for(var j=0; j<nodePerson[node.nodeid]; j++){
                        var person = nodePerson[node.nodeid][j];
                        dealArray.push({nodeid: person.nodeid, elecode: person.elecode, usercode: person.usercode});
                    };
                }
            };
        }

        NG.showToast({title: "正在提交", icon: 'success' });

        var params = {
                method: 'Approve',
                flowType: me.data.flowType,
                piid: me.data.piid,
                nodeid: me.data.nodeid,
                taskinstid: me.data.taskinstid,
                logid: getApp().GLOBAL_CONFIG.userId,
                remark: comments || '语音',
                signcode: signid,
                bizdata: util.arrayToString([]),
                audioremark: '',
                // nextnodes: designate_node == 1 ? encodeURIComponent(nodeArray) : [],
                nexnodes: nodeArray,
                nextnodeactors: dealArray
            };

        me.AFRequst('TaskInstance', params, function(data){
            NG.showToast({ title: '提交成功', icon: 'success' });
            wx.navigateBack();
        })
    },

    //“终止”按钮
    stopbtnTap: function(){
        NG.showToast({
            title:'确定终止该流程',
            icon: 'success'
        })
    },

    ////////////////////////////自建方法/////////////////////////////////////////
    //获取列表详情
    getAppflowDetail: function(obj, successcallback){
        var me = this,
            loginid = '00022',
            params,
            cookie = wx.getStorageSync('Cookie');
        
        if(obj.curentseltype == 0){
            params = {
                method: 'GetTaskInstanceInfo',
                logid: loginid,
                flowtype: obj.flowtype,
                piid: obj.piid,
                nodeid: obj.nodeid,
                taskinstid: obj.taskinstid
            }
        } else {
            params = {
                method: 'GetFlowAllInfo',
                logid: loginid,
                flowtype: obj.flowtype,
                piid: obj.piid
            }
        }

        me.AFRequst('TaskInstance', params, successcallback)
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
                            me.data.currentnodeids.push(nextNodes[i].nodeid);
                            me.data.nodedisplay.nodecontanier = 'block';
                            var nextNodeDesignateActor = me.data.taskInfo.nextNodeDesignateActor;
                            //为下级节点办理人初始化图标属性
                            for(var i=0; i<nextNodeDesignateActor.length; i++){
                                nextNodeDesignateActor[i].checkbox = 0;
                            }
                            this.setData({
                                currentnodeids: me.data.currentnodeids,
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
    },

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
    }
})