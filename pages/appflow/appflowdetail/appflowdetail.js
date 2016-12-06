var util = require("../../../utils/util");
var NG = require("../../../extra/NG");
Page({
    data: {
        ////////////////////////////页面绑定数据/////////////////////////////////////////
        tabselectordata: [],
        contanierdisplay: [ //三个tab页是否显示
            'block',
            'none',
            'none'
        ],
        taskdisplay: [ //几个可展开的模块是否显示，1:展示， 0：不展示
            {
                display: 1
            },
            {
                display: 0
            },
            {
                display: 1
            },
            {
                display: 0
            }
        ],
        nodedisplay: {  
            nextnode: 'block',  //“下一个节点”是否显示
            handlepeople: 'none' //“指派下级节点办理人”是否显示
        },
        taskInfo: {

        },
        toolbars: [],
        moretoolbardisplay: 'none',

        formAttachment: [], //表单页附件绑定数据
        formData: [], //表单页绑定数据
        formDetailData: [], //表单页详细信息绑定数据

        resourceAdr: getApp().GLOBAL_CONFIG.resourceAdr,

        signimg: '',

        ////////////////////////////逻辑数据/////////////////////////////////////////
        flowType: '', piid: '', nodeid: '', taskinstid: '', bizType: '',
        pageType: '',  //页面类型，Edit:代办任务；View: 已办、我发起的任务；View_OAWF:flowtype为oawf的代办任务，在onLoad中初始化
        needPeople: false, //是否需要指派办理人
        currentnodeids: [], //当前选择的nodeidid,用于指派办理人时的展示

        hasFieldEdit: false,   ExpMap: {}, calcExpDirs: [], bizDataHasChanged: false,//表单逻辑参数


       ////////////////////////////输入的交互数据/////////////////////////////////////////
        comments: '', //审批意见
        signid: '', //签章id
        temprecordpath: '', //录音的临时路径
        recordid: '', //录音上传服务器后返回的id
        editBizData: '', //表单输入数据
        nodeArray: [], //当前已选择的下级节点
        nodePerson: [] //当前已选择的下级节点办理人,多个节点，每个节点对应对多个办理人
    },
    onLoad: function(obj){
        var me = this;

        wx.setNavigationBarTitle({
          title: obj.detailtitle
        })

        me.data.flowType = obj.flowtype;
        me.data.piid = obj.piid;
        me.data.nodeid = obj.nodeid;
        me.data.taskinstid = obj.taskinstid,
        me.data.bizType = obj.bizType;
        
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

            me.initTopTab();
            me.initTaskPanel();
            me.initFormPanel();
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

    ///////////////任务页面事件//////////
    //下拉按钮点击
    tasktap: function(e){
        var id = e.currentTarget.id.substring(0,1),
            taskdetaildisplay = this.data.taskdisplay[id];
        if(taskdetaildisplay.display == 1){
            taskdetaildisplay.display = 0;
        } else if(taskdetaildisplay.display == 0){
            taskdetaildisplay.display = 1;
        }
        this.setData({
            taskdisplay: this.data.taskdisplay
        })
    },

    //审批意见输入
    commentsChange: function(e){
        this.data.comments = e.detail.value;
    },

    //意见按钮点击
    advicebtntap: function(e){
        var me = this,
            id = e.currentTarget.id,
            text = me.data.taskInfo.commonWord[id].text;
        me.data.comments += text;
        me.setData({
            comments: me.data.comments
        })

    },

    //签章按钮
    signtap: function(e){
        var me = this,
            callbackname = "signcallback";
        
        var params = {
            logid: getApp().GLOBAL_CONFIG.userId,
            method: 'GetAllSignature',
            flowType: 'af'
        };
        NG.AFRequst('TaskInstance', params, function(data){
            if(data.status == "succeed"){
                if(data.data.length>0){
                    me.callbackname = function (ccode, signimg) {
                        wx.navigateBack({ delta: 1 });
                        me.setData({
                            signid: ccode,
                            signimg: signimg
                        });
                    }
                    wx.navigateTo({
                        url: '/pages/appflow/appflowdetail/stamplist/stamplist?callbackname'+callbackname
                    })
                } else {
                    NG.showToast({title: '无签章数据', icon: 'success'});
                }
            } else {
                NG.showToast({title: '服务接口异常：'+JSON.stringify(data), icon: 'success'})
            }
        })
    },

    //开始录音
    startrecord: function(){
        var me = this;
        wx.startRecord({
          success: function(res){
              me.setData({
                  temprecordpath: res
              })
              NG.showToast({title: '录音成功， res: ' + res, icon: 'success'});
          },
          fail: function() {
            NG.showToast({title: '开始录音失败', icon: 'success'});
          }
        })
    },

    //放下按钮，录音结束
    endrecord: function(){
        wx.stopRecord();
    },

    //播放录音
    playrecord: function(){
        var me = this;
        wx.playVoice({
          filePath: me.data.temprecordpath.tempFilePath,
          success: function(res){
            // success
          },
          fail: function() {
            // fail
          },
          complete: function() {
            // complete
          }
        })
    },

    //删除录音
    deleterecord: function(){
        var me = this;
        me.setData({temprecordpath: ''});
    },

    //上传语音
    uploadaudio: function(callback, params){
        var me =this,
            serverUrl = getApp().GLOBAL_CONFIG.productAdr + '/rest/api/workflow/TaskInstance/Get?' + params,
            temprecordpath = me.data.temprecordpath,
            reSendTime,
            options;
        
        if(temprecordpath == ''){ //没有语音直接返回
            callback && callback(); 
            return;
        }

        wx.uploadFile({
          url: serverUrl,
          filePath: temprecordpath.tempFilePath,
          name:'name',
          // header: {}, // 设置请求的 header
          // formData: {}, // HTTP 请求中其他额外的 form data
          success: function(res){
            // success
          },
          fail: function() {
            // fail
          },
          complete: function() {
            // complete
          }
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
                taskInfo: taskInfo
            })
        } else if (currentnode.designate_actor && currentnode.checkbox == 0){
            for(var i in me.data.currentnodeids){
                if(me.data.currentnodeids[i] == currentnode.nodeid) 
                    me.data.currentnodeids.splice(i, 1);
            }
        }
        me.setData({
            currentnodeids: me.data.currentnodeids
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

    //节点办理人"更多"按钮
    morebtntap: function(e){
        var me = this,
            id = e.currentTarget.id,
            hasOperator,
            hasRecentConatacts = false,
            hasProcess = true,
            currentTab = 2,
            flowType = me.data.flowType,
            piid = me.data.piid,
            nodeid = id,
            againstselectself = false,
            callbackname = 'morecallback';
        for(var i in me.data.taskInfo.nextNodes){
            if(id == me.data.taskInfo.nextNodes[i].nodeid){
                var designate_anyactor = me.data.taskInfo.nextNodes[i].designate_anyactor;
                if(designate_anyactor == 0){    //不可选择系统所有人员
                    hasOperator = false;
                } else {
                    hasOperator = true;
                    hasProcess = false; //可以选择系统所有人员则不需要选择当前节点可选办理人
                    currentTab = 0;
                }
                break;
            }
        }
        me.callbackname = function(selectlist){
            var me = this,
            selectlist = selectlist.slice();
        
            //从下级节点办理人页返回
            if(selectlist.length>0){
                var currentNode = selectlist[0].nodeid,
                    nodePerson = me.data.nodePerson;
                nodePerson[currentNode] = [];
                for(var i in selectlist){
                    nodePerson[currentNode].push(selectlist[i]);
                }
                //更改视图绑定数据
                var nextNodeDesignateActor = me.data.taskInfo.nextNodeDesignateActor;
                for(var i in nextNodeDesignateActor){
                    for(var j in selectlist){
                        if(nextNodeDesignateActor[i].nodeid == currentNode){
                            nextNodeDesignateActor[i].checkbox = 0;
                            if(nextNodeDesignateActor[i].usercode == selectlist[j].usercode){
                                    nextNodeDesignateActor[i].checkbox = 2;
                                    break;
                            }
                        }
                    }
                }
                me.setData({taskInfo: me.data.taskInfo});
                wx.navigateBack({ delta: 1 })
                getApp().selectlist = [];
            }
        }

        wx.navigateTo({
          url: '/pages/appflow/operatorhelp/operatorhelp?hasOperator='+hasOperator+'&hasRecentConatacts='+hasRecentConatacts+
            '&hasProcess='+hasProcess+'&flowType='+flowType+'&piid='+piid+'&nodeid='+nodeid+'&currentTab='+currentTab+
            "&againstselectself="+againstselectself+'&callbackname='+callbackname
        })
        
    },


    /////////////表单页面事件//////////
    //表单详细列表点击事件
    detailtap: function(e){
        var me = this,
            ids = e.currentTarget.id,
            id0 = ids.split(",")[0],
            id1 = ids.split(",")[1],
            currentData = me.data.formDetailData[id0].items[id1];
        
        if(!currentData.display || currentData.display==0){
            currentData.display = 1;
        } else {
            currentData.display = 0;
        }
        me.setData({
            formDetailData: me.data.formDetailData
        })

    },

    //单据截图点击事件
    screenshottap: function(e){
        var me  = this,
            id = e.currentTarget.id,
            currentData = me.data.formData[id];
        
        if(!currentData.isLoadedImg){
            (function openImage(currentData){
                var params = {
                    method: 'GetTaskBizContent',
                    logid: getApp().GLOBAL_CONFIG.userId,
                    flowType: me.data.flowType,
                    piid: me.data.piid
                };
                currentData.isLoadedImg = true;
                NG.AFRequst('TaskInstance', params, function (resp) {
                    if (resp.status == 'succeed') {
                        if (resp.type == 'bytes' && resp.data) {
                            currentData.imgSrc = 'data:image/gif;base64,' + resp.data;
                            wx.previewImage({ urls: [currentData.imgSrc] });
                        } else {
                            currentData.label = '无';
                        }
                        me.setData({formData: me.data.formData});
                    }
                    else {
                        currentData.isLoadedImg = false;
                        NG.showToast({title: '服务接口异常', icon: 'success'});
                    }
                });
            })(currentData);
        } else {
            wx.previewImage({ urls: [currentData.imgSrc] });
        }
    },

    //文本类型可编辑字段修改事件
    textfieldinput: function(e){
        var me = this,
            id = e.currentTarget.id,
            formDate = me.data.formData;

        formDate[id].value = e.detail.value;
        me.setData({
            formData: formDate
        })
    },

    //时间类型可编辑字段修改事件
    timefieldchange: function(e){
        var me = this,
            id = e.currentTarget.id,
            value =  e.detail.value,
            type = value.length == 10 ? 'date': 'time',
            formData = me.data.formData;

        if(type == 'date'){
            formData[id].datevalue = value;
        } else {
            formData[id].timevalue = value;
        }

        me.setData({
            formData: formData
        })

    },

    //详细页文本类型可编辑字段修改事件
    detailtextfieldinput: function(e){
        var me = this,
            id = e.currentTarget.id,
            ids = id.split(','),
            formDetailData = me.data.formDetailData[ids[0]].items[ids[1]].items;

        formDetailData[ids[2]].value = e.detail.value;
        me.setData({
            formDetailData: me.data.formDetailData
        })
    },

    //详细页时间类型可编辑字段修改事件
    detailtimefieldchange: function(e){
        var me = this,
            id = e.currentTarget.id,
            ids = id.split(','),
            value =  e.detail.value,
            type = value.length == 10 ? 'date': 'time',
            formDetailData = me.data.formDetailData[ids[0]].items[ids[1]].items;

        if(type == 'date'){
            formDetailData[ids[2]].datevalue = value;
        } else {
            formDetailData[ids[2]].timevalue = value;
        }

        me.setData({
            formDetailData: me.data.formDetailData
        })
    },

    ////////////通用事件//////////////
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

        if (!me.validFormData()) {
            return;
        }

        var params = {
                method: 'GetRollBackInfo',
                flowType: me.data.flowType,
                piid: me.data.piid,
                nodeid: me.data.nodeid,
                taskinstid: me.data.taskinstid,
                logid: getApp().GLOBAL_CONFIG.userId
            };

        NG.AFRequst('TaskInstance', params, function (resp) {
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

        if (!me.validFormData()) {
            return;
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

        NG.AFRequst('TaskInstance', params, function(data){
            NG.showToast({ title: '提交成功', icon: 'success' });
            wx.navigateBack();
        })
    },

    //“终止”按钮
    stopbtnTap: function(){
        var me = this;
        wx.showModal({
            title: '提示',
            content: '确定终止该流程',
            success: function(res){
                if(res.confirm){
                    NG.showToast({title: '正在终止', icon: 'success'});

                    var parms = {
                        method: 'Terminate',
                        logid: getApp().GLOBAL_CONFIG.userId,
                        flowType: me.data.flowType,
                        piid: me.data.piid,
                        nodeid: me.data.nodeid,
                        taskinstid: me.data.taskinstid,
                        remark: me.data.comments,
                        bizdata: '[]',
                        audioremark: ''
                    };

                    if (!me.validFormData()) {
                        return;
                    }

                    NG.AFRequst('TaskInstance', parms, function (resp) {
                        if (resp.status == 'succeed') {
                            wx.navigateBack({ delta: 1 });
                        }
                        else {
                            NG.showToast({title: '终止失败：' + resp.errmsg, icon: 'success'});
                        }
                    });
                }
            }
        })
    },

    //“加签”按钮
    addbtnTap: function(){
        var me = this,
            signid = me.data.signid,
            issigature = me.data.taskInfo.taskInstInfo[0].issigature,
            comments = me.data.comments,
            flowtype = me.data.flowType,
            piid = me.data.piid,
            nodeid = me.data.nodeid,
            taskinstid = me.data.taskinstid,
            hasOperator = true,
            hasRecentConatacts = false,
            hasProcess = false,
            currentTab = 0,
            againstselectself = false,
            callbackname = 'addcallback';
        
        if (issigature == 1 && !signid) {
            NG.showToast({ title: "需要签章，请选择签章", icon: 'success' }); return;
        }

        me.callbackname = function(selectlist){
            var pArr = [];
            for(var i in selectlist){
                pArr.push(selectlist[i].usercode);
            }
            NG.AFRequst('TaskInstance', {
                method: 'addtis',
                logid: getApp().GLOBAL_CONFIG.userId,
                flowType: flowtype,
                piid: piid,
                nodeid: nodeid,
                taskinstid: taskinstid,
                users: pArr.join(','),
                remark: comments,
                signcode: signid,
                //bizdata: '[]',
                audioremark: ''
            }, function (resp) {
                if (resp.status == 'succeed') {
                    NG.showToast({ title: "加签成功", icon: 'success' });
                    wx.navigateBack({ delta: 2 });
                }
                else {
                    NG.showToast({ title: '加签失败：' + resp.errmsg, icon: 'success' }); return;
                }
            });
        }

        wx.navigateTo({
          url: '/pages/appflow/operatorhelp/operatorhelp?hasOperator='+hasOperator+'&hasRecentConatacts='+hasRecentConatacts+
            '&hasProcess='+hasProcess+'&currentTab='+currentTab+"&againstselectself="+againstselectself+
            '&callbackname='+callbackname
        })
        
    },

    //“转签”按钮
    changebtnTap: function(){
        var me = this,
            signid = me.data.signid,
            issigature = me.data.taskInfo.taskInstInfo[0].issigature,
            comments = me.data.comments,
            flowtype = me.data.flowType,
            piid = me.data.piid,
            nodeid = me.data.nodeid,
            taskinstid = me.data.taskinstid,
            hasOperator = true,
            hasRecentConatacts = true,
            hasProcess = false,
            currentTab = 1,
            againstselectself = true,
            callbackname = 'changecallback';

        if (issigature == 1 && !signid) {
            NG.showToast({ title: "需要签章，请选择签章", icon: 'success' }); return;
        }

        me.callbackname = function(selectlist){
            if(selectlist.length != 1){
                NG.showToast({ title: "只能选择一位转签人", icon: 'success' });
                return;
            } 
             var params = {
                method: 'Transmit',
                flowType: flowtype,
                piid: piid,
                nodeid: nodeid,
                taskinstid: taskinstid,
                logid: getApp().GLOBAL_CONFIG.userId,
                remark: comments,
                signcode: signid,
                audioremark: '',
                transmituser: selectlist[0].usercode
            };
            NG.AFRequst('TaskInstance', params, function (resp) {
                if (resp.status == 'succeed') {
                    NG.showToast({ title: "转签成功", icon: 'success' });
                    //存入localStroge中
                    var recentcontacts = wx.getStorageSync('recentcontacts');
                    recentcontacts.push({
                        usercode: selectlist[0].usercode,
                        username: selectlist[0].username});
                    wx.setStorage({
                      key: 'recentcontacts',
                      data: recentcontacts
                    })

                    wx.navigateBack({ delta: 2 });
                }
                else {
                    NG.showToast({ title: '转签失败：' + resp.errms, icon: 'success' });
                }
            });
        }

        wx.navigateTo({
          url: '/pages/appflow/operatorhelp/operatorhelp?hasOperator='+hasOperator+'&hasRecentConatacts='+hasRecentConatacts+
            '&hasProcess='+hasProcess+'&currentTab='+currentTab+"&againstselectself="+againstselectself+
            '&callbackname='+callbackname
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

        NG.AFRequst('TaskInstance', params, successcallback)
    },

    //初始化上方选择按钮
    initTopTab: function(){
        var me = this,
            taskInfo = me.data.taskInfo,
            bizAttachment = taskInfo.bizAttachment;
        if(bizAttachment.length == 0){
            me.setData({
                tabselectordata: [{
                    color: '#f39800',
                    text: '任务'
                },{
                    color: '#000000',
                    text: '表单'
                }]
            })
        } else {
            me.setData({
                tabselectordata: [{
                    color: '#f39800',
                    text: '任务'
                },{
                    color: '#000000',
                    text: '表单'
                },{
                    color: '#000000',
                    text: '附件'
                }]
            })
        }
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

    //初始化表单页面数据
    initFormPanel: function(){
        var me = this,
            flowType = me.data.flowType,
            bizType = me.data.bizType,
            bizData,
            attachDatas = [],
            bizAttachment = me.data.taskInfo.bizAttachment;

            for(var i in bizAttachment){
                if(bizAttachment[i].isbizcontent == '1') me.data.formAttachment.push(bizAttachment[i]);
            }
            me.setData({formAttachment: me.data.formAttachment})
            {
                    //TODO: 附件选择事件
                    // container.element.down('div[name=contentattach]').addListener('touchend', function (view) {
                    //     //NG.openFile(wordInfo.data);
                    //     var parms = {
                    //         arctable: data.arctable,
                    //         arccode: data.arccode,
                    //         attachname: data.attachname
                    //     };
                    //     if (view.target.downloadurl) {
                    //         NG.downLoadFile(view.target.downloadurl, data.arctable + "_" + data.arccode, data.attachname, data.attachsize);
                    //         return;
                    //     }
                    //     NG.setWaiting(true, "正在获取附件地址");
                    //     Ext.Ajax.request({
                    //         url: NG.getProductLoginInfo().productAdr + "/rest/api/oa/ArchiveAttach/Get",
                    //         method: 'POST',
                    //         params: parms,
                    //         success: function (response, opts) {
                    //             var resp = Ext.JSON.decode(response.responseText);
                    //             NG.setWaiting(false);
                    //             if (resp.downloadurl) {
                    //                 view.target.downloadurl = resp.downloadurl;
                    //                 var logInfo = NG.getProductLoginInfo();
                    //                 NG.dbManager.deleteData("attach_temp", "eno=? and logid=? and asrcode=? and asrtable=? and attachname=?", [logInfo.eNo, logInfo.loginId, data.arccode, data.arctable, data.attachname], function () {
                    //                 	NG.dbManager.insert("attach_temp", [
	                //                         {
	                //                             eno: logInfo.eNo,
	                //                             logid: logInfo.loginId,
	                //                             updatetime: new Date().getTime(),
	                //                             attachname: data.attachname,
	                //                             asratttable: data.asrattachtable,
	                //                             asrtable: data.arctable,
	                //                             asrcode: data.arccode,
	                //                             downloadurl: resp.downloadurl
	                //                         }
	                //                     ]);
                    // 				});
                    //                 me.downloadurls.push({
                    //                     downloadurl: resp.downloadurl,
                    //                     asratttable: data.asrattachtable,
                    //                     asrtable: data.arctable,
                    //                     asrcode: data.arccode,
                    //                     attachname: data.attachname
                    //                 });
                    //                 NG.downLoadFile(resp.downloadurl, data.arctable + "_" + data.arccode, data.attachname, data.attachsize);
                    //             }
                    //             else {
                    //                 NG.alert("无法获取附件地址", 1500);
                    //             }
                    //         },
                    //         failure: function (response, opts) {
                    //             NG.setWaiting(false);
                    //             NG.alert(GLOBAL_CONFIG.NetWorkError, 1500);
                    //         }
                    //     });
                    // });
            }

        var bizData = me.data.taskInfo.bizData;
        if (bizData && bizType != "RW_ReportApply" && bizType != "AQ_CHK_M" && bizType != "AQ_CHK_M2") { //报表审批,现场检查单独处理
            if (me.data.pageType == "Edit") {
                me.getExpMapFromBizData(bizData);
            }
            var mainItems = [], detailItems = [],
                mainBiz = bizData[0], detailBiz,
                d_Idx = 0, len = bizData.length;
            if (mainBiz && mainBiz.Type === 0) { // 有主表信息
                d_Idx = 1;
                for(var i in mainBiz.FieldSetings){
                    var item = mainBiz.FieldSetings[i];
                        var defaultValue = mainBiz.DataRows.length > 0 ? 
                            mainBiz.DataRows[0].FieldValueList[i] : {FieldCode: item.FieldCode, Value: "", DisplayValue: "", OriginalValue: ""};
                        mainItems.push(me.getEditField(item, defaultValue, mainBiz.GroupCode + "-" + item.FieldCode + "-0", mainBiz.Type, mainBiz.GroupCode));
                };
            }
            if (flowType == "oawf") {
                me.getWordInfo(function (wordInfo) {
                    me.data.formAttachment.push({attachname: wordInfo.name})
                    //TODO: 附件点击事件
                    // container.element.down('div[name=myformurl]').addListener('touchend', function () {
                    //     NG.openFile(wordInfo.data);
                    // });
                });
            } else {
                mainItems.push({
                    label: '单据截图',
                    xtype: 'screenshot'
                });
            }
            
            me.setData({ formData: mainItems});

            //生成明细表单据信息
            for (var i = d_Idx; i < len; i++) {
                var fields = [];
                detailBiz = bizData[i];
                detailItems.push({
                    xtype: 'ngaccordion',
                    name: detailBiz.GroupCode,
                    displayname: detailBiz.GroupName,
                    cls: 'simple',
                    defaults: {
                        style: 'background-color: #FFFFFF;'
                    },
                    items: me.getDetailTable(detailBiz)
                });
            }
            me.setData({
                formDetailData: detailItems
            })

        } else {
            if (!bizData) { //兼容历史版本
                me.getVoiceBtn().setHidden(true);
            }
            me.getDetailMainView().on({
                activeitemchange: "OnActiveItemChange",
                scope: me
            });
        }
    },

       /* 获取明细表 */
    getDetailTable: function(detailBiz) {
        var me = this,
            items = [];
        for(var rowIndex in detailBiz.DataRows){
            var row = detailBiz.DataRows[rowIndex];
            var container = {
                    title: row.RowDesc,
                    name: detailBiz.GroupCode + "-" + row.RowNum
                },
            fields = [];
            for(var index in detailBiz.FieldSetings){
                var item = detailBiz.FieldSetings[index];
                fields.push(me.getEditField(item, row.FieldValueList[index], detailBiz.GroupCode + "-" + item.FieldCode + "-" + row.RowNum, detailBiz.Type, detailBiz.GroupCode));
            };
            container.items = fields;
            items.push(container);
        };
        return items;
    },

    //获取表达式字段之间的映射关系
    getExpMapFromBizData: function(bizData) {
        var me = this,
            matchArray, match, field, item;
        me.data.ExpMap = {};

        for (var i = 0, len1 = bizData.length; i < len1; i++) {
            item = bizData[i];
            for (var j = 0, len2 = item.FieldSetings.length; j < len2; j++) {
                field = item.FieldSetings[j];
                if (field.ComputeExpr) {
                    var name = item.GroupCode + "-" + field.FieldCode;
                    matchArray = field.ComputeExpr.match(/\{([^\{\}]+)\}/g);
                    for (var k = 0, len = matchArray.length; k < len; k++) {
                        match = matchArray[k].substring(1, matchArray[k].length - 1).replace(/\./g, '-');
                        if (!me.data.ExpMap[match]) {
                            me.data.ExpMap[match] = [];
                        }
                        if (me.data.ExpMap[match].indexOf(name) < 0) {
                            me.data.ExpMap[match].push(name);
                        }
                    }
                }
            }
        }
    },

    /*
     * 获取field
     */
    getEditField: function(item, values, name, tableType, table) {
        var me = this,
            hasKeyUp = false,
            xtypes = { 'string': 'textfield', 'datetime': 'datefieldux', 'date': 'datefieldux', 'int': 'textfield', 'float': 'textfield', 'binary': 'textfield' },
            field = { 'xtype': 'textfield', 'name': '', 'value': '', 'readOnly': true, 'label': '', 'required': false };
        field.name = name;
        field.id = name;
        field.label = item.FieldDesc;
        field.hidden = item.ColtrolValue == 2 ? true : false;
        field.value = values.DisplayValue;
        if (item.FieldType == "binary") { // 二进制数据，设置链接点击查看， TODO
            field.xtype = "ngviewtext";
            field.value = '<div class="btn-url" style="color: #3993db; text-decoration: underline; width: 100%;line-height: 30px;">查看</div>';
            if (item.FieldCode == "uploadimage" && util.isEmpty(values.DisplayValue)) {
                field.value = "";
            }
            field.fieldCode = item.FieldCode;
            field.fieldValue = values.DisplayValue;
            field.listeners = {
                initialize: function (fd) {
                    fd.element.on({
                        tap: function () {
                            me.downLoadUrl(fd, fd.config.fieldCode, fd.config.fieldValue);
                        },
                        delegate: '.btn-url',
                        scope: me
                    });
                }
            };
        }
        if (me.data.pageType == "Edit") {
            field.expr = item.ComputeExpr;
            field.table = table;
            field.fieldType = item.FieldType;
            field.tableType = tableType;
            field.dLen = item.DLen || -99;
            if (item.ColtrolValue != 0 && item.FieldType != "binary") { // 可编辑
                field.readOnly = false;
                me.data.hasFieldEdit = true; //标识当前表单有可编辑字段
                field.required = item.ColtrolValue == 3;
                if (item.HelpString) { // 需要调用通用帮助
                    field.xtype = "ngcommonhelp";
                    field.readOnly = true;
                    field.helper = {title: item.FieldDesc, helpString: item.HelpString};
                    field.fromValues = values;
                } else {
                    field.xtype = xtypes[item.FieldType];
                }
                if (field.xtype == "datefieldux") { //时间控件
                    if(item.FieldType == "datetime"){
                        field.datetype = "datetime";
                        if (values.DisplayValue && values.DisplayValue.length > 0) {
                            var date = new Date(values.DisplayValue);
                            field.datevalue =date .toLocaleDateString();
                            field.timevalue = (date.getHours() > 9 ? date.getHours() : "0" + date.getHours())
                                    + ":" + (date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes());
                        }
                    }
                    else {
                        field.datetype = "date";
                        field.datevalue = values.DisplayValue;
                    }
                } else if (!field.readOnly && me.data.ExpMap[name.replace(/-\d+$/, '')]) {
                    hasKeyUp = true;
                    field.listeners = {
                        initialize: function (fd) {
                            fd.on({
                                keyup: function (c, e) {
                                    var evt = e.browserEvent || e.event,
                                        currV = "",
                                        target = e.delegatedTarget || e.target,
                                        match;
                                    if (evt.keyCode == 37 || evt.keyCode == 39) { //光标左右移动
                                        return;
                                    }
                                    if (target.tagName == "INPUT") {
                                        if (fd.config.fieldType == "int") {
                                            currV = target.value.replace(/[^\d]/g, '');
                                        } else {
                                            match = target.value.match(/\d+[\.]?(\d+)?/);
                                            currV = match ? match[0] : '';
                                        }
                                        if (target.value != currV) {
                                            target.value = currV;
                                        }
                                        me.data.calcExpDirs = []; //清空计算路径
                                   //TODO:     me.onFieldKeyUp(e.delegatedTarget, fd.config.table, fd.config.fieldType);
                                    }
                                }
                            });
                        }
                    };
                }
                if(!hasKeyUp && me.data.ExpMap[name.replace(/-\d+$/, '')]) {
                    field.listeners = {
                        initialize: function (fd) {
                            fd.on({
                                change: function (c, nValue, oValue) {
                                    var el = c.element.down("input");
                                    if (el && el.dom) {
                                        me.data.calcExpDirs = []; //清空计算路径
                                 //TODO:       me.onFieldKeyUp(el.dom, fd.config.table, fd.config.fieldType);
                                    }
                                }
                            });
                        }
                    };
                }
            }
            if (field.readOnly && field.fieldType == "string" && field.xtype != "ngcommonhelp") {
                field.xtype = "ngviewtext";
            }
        } else {
            field.xtype = "ngviewtext";
        }
        return  field;
    },

    /*获取收发文正文地址*/
    getWordInfo: function(callback) {
        var me = this,
            logid = getApp().GLOBAL_CONFIG.userId,
            parms = {
                method: 'GetTaskBizContent',
                logid: logid,
                flowType: me.data.flowtype,
                piid: me.data.piid
            };
        NG.AFRequst('TaskInstance', parms, function (resp) {
            if (resp.status == 'succeed') {
                if (resp.type.toUpperCase() == 'URL' && resp.data) {
                    callback && callback(resp);
                }
            }
            else {
                NG.showToast({title: "获取收发文正文地址出错，piid=" + appFlowInfo.piid, icon: 'success'})
            }
        });
    },

    /* 验证表单数据信息 */
    validFormData: function() {
        var me = this,
            editBizData = [],
            bizData = me.data.taskInfo.bizData || [];
        if (me.data.hasFieldEdit) { //判断当前表单是否有可编辑字段
            for (var i = 0, bizLen = bizData.length; i < bizLen; i++) {
                var biz = bizData[i],
                    field, currValue, matchArr,
                    tmpBiz = {GroupCode: biz.GroupCode, GroupName: "", Type: biz.Type, FieldSetings: [], DataRows: []},
                    fields = biz.FieldSetings,
                    type = biz.Type;
                for (var k = 0, rowLen = biz.DataRows.length; k < rowLen; k++) {
                    var fValue = [], tf = false, row = {};
                    for (var j = 0, fdLen = fields.length; j < fdLen; j++) {
                        var obj = biz.DataRows[k].FieldValueList[j];
                        field = fields[j];
                        if (field.FieldType != "binary" && (field.ColtrolValue == 1 || field.ColtrolValue == 3 || field.ComputeExpr)) { //可编辑
                            var curritem;
                            if(type == 0){
                                curritem = me.data.formData[j];
                            } else {
                                curritem = me.data.formDetailData[i-1].items[k].items[j];
                            }
                            if(field.FieldType == "datetime"){
                                currValue = curritem.datevalue + ' '+ curritem.timevalue;
                            } else if(field.FieldType == "date") {
                                currValue = curritem.datevalue
                            } else {
                                currValue = curritem.value;
                            }

                            if (currValue === "" && obj.Value === null) {
                                currValue = null;
                            }
                            if (obj.Value != currValue) {
                                if (util.isEmpty(currValue) && (field.FieldType == "float" || field.FieldType == "int")) {
                                    currValue = 0;
                                }
                                fValue.push({FieldCode: obj.FieldCode, Value: currValue, DisplayValue: obj.DisplayValue, OriginalValue: obj.OriginalValue});
                                me.data.bizDataHasChanged = true;
                                tf = true;
                                if (!me.validDataFormat(currValue, field.FieldType)) {
                                    NG.alert(field.FieldDesc + " 数据格式错误");
                                    return false;
                                }
                            }

                            if (field.ColtrolValue == 3 && util.isEmpty(currValue)) { //必输判断
                                NG.alert(field.FieldDesc + " 不能为空");
                                return false;
                            }
                        } else if (field.IsPk) {
                            fValue.push({FieldCode: obj.FieldCode, Value: obj.Value, DisplayValue: obj.DisplayValue, OriginalValue: obj.OriginalValue});
                        }
                    }
                    if (tf) {
                        row.RowNum = biz.DataRows[k].RowNum;
                        row.RowDesc = "";
                        row.FieldValueList = fValue;
                        tmpBiz.DataRows.push(row);
                    }
                }
                editBizData.push(tmpBiz);
            }
            me.editBizData = editBizData;
        }
        return true;
    },

    //验证数据的格式是否正确
    validDataFormat: function(value, type) {
        var regExp = null;
        if (type == "int") {
            regExp = /^-?\d+$/;
        } else if (type == "float") {
            regExp = /^(-?\d+)(\.\d+)?$/;
        } else {
            return true;
        }
        return util.isEmpty(value) || regExp.test(value);
    },

    //当表单字段的值变化时发生
    onFieldKeyUp: function(node, table, fieldType) {
        if (node.name) {
            var me = this,
                key = node.name.replace(/-\d+$/, ''),
                map = me.ExpMap[key],
                expIndex,
                newNode,
                oldValue,
                newValue,
                dLen = null,
                tmpCmp;
            me.calcExpDirs.push(key);
            for (var i = 0, len = map ? map.length : 0; i < len; i++) {
                if (me.calcExpDirs.indexOf(map[i]) > -1) {
                    continue;
                }
                expIndex = node.name.match(/\d+$/)[0];
                tmpCmp = Ext.getCmp(map[i] + "-" + expIndex) || Ext.getCmp(map[i] + "-0");
                if (tmpCmp && tmpCmp.config.expr) {
                    if (tmpCmp.config.tableType == 1 && tmpCmp.config.table != table) { //更新明细表
                        expIndex = 0;
                        tmpCmp = Ext.getCmp(map[i] + "-" + expIndex);
                        while (tmpCmp && tmpCmp.config.expr) {
                            oldValue = tmpCmp.getValue();
                            if (tmpCmp.config.fieldType == "int") {
                                dLen = 0;
                            } else {
                                dLen = tmpCmp.config.dLen > 0 ? tmpCmp.config.dLen : null;
                            }
                            newValue = me.calcExp(tmpCmp.config.expr, expIndex, dLen, fieldType);
                            if (oldValue != newValue) { //防止不必要的更新
                                tmpCmp.setValue(newValue);
                                newNode = tmpCmp.element.query("input.x-input-el")[0];
                                newNode && me.onFieldKeyUp(newNode, tmpCmp.config.table, tmpCmp.config.fieldType);
                            }
                            expIndex++;
                            tmpCmp = Ext.getCmp(map[i] + "-" + expIndex);
                        }
                    } else {
                        oldValue = tmpCmp.getValue();
                        if (tmpCmp.config.fieldType == "int") {
                            dLen = 0;
                        } else {
                            dLen = tmpCmp.config.dLen > 0 ? tmpCmp.config.dLen : null;
                        }
                        newValue = me.calcExp(tmpCmp.config.expr, expIndex, dLen, fieldType);
                        if (oldValue != newValue) {
                            tmpCmp.setValue(newValue);
                            newNode = tmpCmp.element.query("input.x-input-el")[0];
                            newNode && me.onFieldKeyUp(newNode, tmpCmp.config.table, tmpCmp.config.fieldType);
                        }
                    }
                }
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