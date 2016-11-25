var util = require("../../../../utils/util");
Page({
    data: {
        ////////////////////////////页面绑定数据/////////////////////////////////////////
        rollBackInfo: {},
        handlepeopledisplay: 'none', 

        ////////////////////////////逻辑数据/////////////////////////////////////////
        taskInfo: {
            
        },
        logid: '',
        remark: '',
        signcode: '',
        flowType: '',
        piid: '',
        nodeid: '',
        taskinstid: '',
        needSelectNode: true,
        needPeople: true,
        ////////////////////////////输入的交互数据/////////////////////////////////////////
        currentNode: {}, //当前已选择的回退节点
        nodePerson: [] //当前已选择的回退节点办理人,多个节点，每个节点对应对个办理人
    },
    onLoad: function(option){
        var me = this;
        me.data.logid = getApp().GLOBAL_CONFIG.userId;
        me.data.taskInfo = getApp().taskInfo;
        me.data.rollBackInfo = getApp().rollBackInfo;
        me.data.remark = option.remark;
        me.data.signcode = option.signcode;
        me.data.flowType = option.flowType;
        me.data.piid = option.piid;
        me.data.nodeid = option.nodeid;
        me.data.taskinstid = option.taskinstid;

        me.initRejectPanel();
    },

    //页面事件
    //回退节点点击事件
    tasknodetap: function(e){
        var me = this,
            id = e.currentTarget.id,
            rollBackInfo = me.data.rollBackInfo,
            rollBackNodes = rollBackInfo.rollBackNodes,
            nextNodeDesignateActor = rollBackInfo.nextNodeDesignateActor,
            currentNode = rollBackNodes[id];
        
        if(!me.data.needSelectNode) return; //不需要指定节点则直接跳出

        //更改checkbox显示
        if(currentNode.checkbox == 0){
            currentNode.checkbox = 2;
            for(var i in rollBackNodes){
                if(i != id){ rollBackNodes[i].checkbox = 0};
            }
        } else {
            currentNode.checkbox = 0;
        }

        //如果需要选择回退办理人则展示回退办理人页面
        if(currentNode.designate_actor && currentNode.checkbox == 2){
            me.data.handlepeopledisplay = 'block';
            for(var i in nextNodeDesignateActor){
                if(nextNodeDesignateActor[i].nodeid == currentNode.nodeid){
                    nextNodeDesignateActor[i].checkbox = 0;
                }
            }
        } else if(currentNode.designate_actor && currentNode.checkbox == 0){
            me.data.handlepeopledisplay = 'none';
        }

        me.setData({
            rollBackInfo: rollBackInfo,
            handlepeopledisplay: me.data.handlepeopledisplay
        });

        //加入到交互数据
        if(currentNode.checkbox == 2){
            me.data.currentNode = currentNode;
        } else {
            me.data.currentNode = {};
        }
    },

     //回退节点办理人选择按钮
    handlenodetap: function(e){
        var me = this,
            rollBackInfo = me.data.rollBackInfo,
            id = e.currentTarget.id,
            currentactor = rollBackInfo.nextNodeDesignateActor[id],
            nodePerson = me.data.nodePerson;
        
        //更改checkbox显示
        if(currentactor.checkbox == 0){
            currentactor.checkbox = 2;
        } else {
            currentactor.checkbox = 0;
        }
        this.setData({
            rollBackInfo: me.data.rollBackInfo
        })

        //加入到交互数据
        if(currentactor.checkbox == 2){
            var item = {
                nodeid: currentactor.nodeid,
                elecode: currentactor.elecode,
                usercode: currentactor.usercode,
                username: currentactor.username
            };
            nodePerson.push(item);
        } else { //从交互数据中移除
            for(var i in nodePerson){
                if(nodePerson[i].nodeid == currentactor.nodeid &&
                    nodePerson[i].usercode == currentactor.usercode){
                    nodePerson.splice(i, 1);
                }
            }
        }
    },

    //完成驳回
    rollbackComplate: function(){
        var me = this,
            currentNode = me.data.currentNode,
            nodePerson = me.data.nodePerson,
            dealArray = [],
            rollbacknode;
        if (!currentNode) {
            wx.showToast({ title: "未指定驳回节点", icon: 'success' }); return;
        } else {
            rollbacknode = currentNode.nodeid;
        }
        if (rollbacknode) {
            //判断办理人是否为空
            if (currentNode.designate_actor == "1") {
                if (nodePerson.length == 0) {
                    wx.showToast({ title: "未指定办理人", icon: 'success' }); return;
                } else {
                    for(var i in nodePerson){
                        dealArray.push({
                            nodeid: nodePerson[i].nodeid, 
                            elecode: nodePerson[i].elecode, 
                            usercode: nodePerson[i].usercode
                        });
                    }
                }
            }
        }

        wx.showToast({ title: "正在驳回", icon: 'success' });

        var params = {
                method: 'RollBack',
                flowtype: me.data.flowType,
                piid: me.data.piid,
                nodeid: me.data.nodeid,
                taskinstid: me.data.taskinstid,
                logid: me.data.logid,
                remark: me.data.remark,
                signcode: me.data.signcode,
                rollbacknode: rollbacknode,
                bizdata: util.arrayToString([]), //TODO
                audioremark: '', //TODO
                nextnodeactors: dealArray
            };
        
        me.AFRequst("TaskInstance", params, function(data){
            if(data.status=="succeed") wx.navigateBack({ delta: 2 });
            else wx.showToast({ title: data.errmsg, icon: 'success' });;
        })
    },

    //自建方法
    //初始化驳回页面
    initRejectPanel: function(){
        var me = this,
            rollBackInfo = me.data.rollBackInfo,
            nextNodeDesignateActor = rollBackInfo.nextNodeDesignateActor,
            rollBackNodes = rollBackInfo.rollBackNodes,
            checkbox; //是否需要选择回退节点

        if(rollBackNodes.length == 1){
            checkbox = 2;
            me.data.currentNode = rollBackNodes[0].nodeid;
            me.data.needSelectNode = false;
        } else {
            checkbox = 0;
            me.data.needSelectNode = true;
        }

        for(var i in rollBackNodes){
            rollBackNodes[i].checkbox = checkbox;
            if(rollBackNodes[i].designate_actor == 1){//节点需要指定受理人
                me.data.needPeople = true;
                if(checkbox == 2){ //需要指定受理人而不用指定回退节点直接将受理人页面显示
                    me.data.handlepeopledisplay = "block";
                    for(var j in nextNodeDesignateActor){
                        nextNodeDesignateActor[j].checkbox = 0;
                    }
                }
            }
        }
        me.setData({
            rollBackInfo: me.data.rollBackInfo,
            handlepeopledisplay: me.data.handlepeopledisplay
        })
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
                wx.showToast({title:'服务器接口异常', icon: 'success'});
            }
          },
          fail: function(res) {
            wx.showToast({title:'连接服务器失败', icon: 'success'});
          }
        })
    }
})