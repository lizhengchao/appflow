var util = require("../../../utils/util");
var NG = require("../../../extra/NG")
Page({
    data: {
        ////////////////////////////页面绑定数据/////////////////////////////////////////
        tabselectordata: [],
        contanierdisplay: [ //三个tab页是否显示
            'block',
            'none',
            'none'
        ],
        taskdisplay: [ //几个可展开的模块是否显示，默认不显示
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

        formAttachment: [], //表单页附件绑定数据
        formData: [], //表单页绑定数据
        formDetailData: [], //表单页详细信息绑定数据

        ////////////////////////////逻辑数据/////////////////////////////////////////
        flowType: '', piid: '', nodeid: '', taskinstid: '', bizType: '',
        pageType: '',  //页面类型，Edit:代办任务；View: 已办、我发起的任务；View_OAWF:flowtype为oawf的代办任务，在onLoad中初始化
        needPeople: false, //是否需要指派办理人
        currentnodeids: [], //当前选择的nodeidid,用于指派办理人时的展示

        hasFieldEdit: false,   ExpMap: {}, calcExpDirs: [], bizDataHasChanged: false,//表单逻辑参数


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

                me.AFRequst('TaskInstance', parms, function (resp) {
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
            if (me.pageType == "Edit") {
                me.getExpMapFromBizData(bizData);
            }
            var mainItems = [], detailItems = [],
                mainBiz = bizData[0], detailBiz,
                d_Idx = 0, len = bizData.length;
            if (mainBiz && mainBiz.Type === 0) { // 有主表信息
                d_Idx = 1;
                for(var i in mainBiz.FieldSetings){
                    var item = mainBiz.FieldSetings[i];
                    if (item.ColtrolValue != 2) { //隐藏不需要显示
                        var defaultValue = mainBiz.DataRows.length > 0 ? 
                            mainBiz.DataRows[0].FieldValueList[i] : {FieldCode: item.FieldCode, Value: "", DisplayValue: "", OriginalValue: ""};
                        mainItems.push(me.getEditField(item, defaultValue, mainBiz.GroupCode + "-" + item.FieldCode + "-0", mainBiz.Type, mainBiz.GroupCode));
                    }
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
                    isScreenshot: true
                    // TODO: 单据截图事件
                    // listeners: {
                    //     initialize: function () {
                    //         this.element.on({
                    //             delegate: '.img',
                    //             tap: function (label, target) {
                    //                 if (!target.isLoadedImg) {
                    //                     me.openImage(target);
                    //                 } else if (target.imgSrc) {
                    //                     NG.showImage(target, target.imgSrc);
                    //                 }
                    //             }
                    //         });
                    //     }
                    // }
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
                    xtype: 'container',
                    name: detailBiz.GroupCode + "-" + row.RowNum,
                    spacing: 0,
                    padding: '6 0 6 10',
                    hidden: true,
                    cls: 'noAfter',
                    defaults: {
                        labelWidth: 80,
                        cls: 'edit-input',
                        clearIcon: false,
                        labelWrap: true
                    }
                },
            fields = [];
            for(var index in detailBiz.FieldSetings){
                    var item = detailBiz.FieldSetings[index];
                if (item.ColtrolValue != 2) { //隐藏不需要显示
                    fields.push(me.getEditField(item, row.FieldValueList[index], detailBiz.GroupCode + "-" + item.FieldCode + "-" + row.RowNum, detailBiz.Type, detailBiz.GroupCode));
                }
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
        me.ExpMap = {};

        for (var i = 0, len1 = bizData.length; i < len1; i++) {
            item = bizData[i];
            for (var j = 0, len2 = item.FieldSetings.length; j < len2; j++) {
                field = item.FieldSetings[j];
                if (field.ComputeExpr) {
                    var name = item.GroupCode + "-" + field.FieldCode;
                    matchArray = field.ComputeExpr.match(/\{([^\{\}]+)\}/g);
                    for (var k = 0, len = matchArray.length; k < len; k++) {
                        match = matchArray[k].substring(1, matchArray[k].length - 1).replace(/\./g, '-');
                        if (!me.ExpMap[match]) {
                            me.ExpMap[match] = [];
                        }
                        if (me.ExpMap[match].indexOf(name) < 0) {
                            me.ExpMap[match].push(name);
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
        field.value = values.DisplayValue;
        if (item.FieldType == "binary") { // 二进制数据，设置链接点击查看
            field.xtype = "ngviewtext";
            field.value = '<div class="btn-url" style="color: #3993db; text-decoration: underline; width: 100%;line-height: 30px;">查看</div>';
            if (item.FieldCode == "uploadimage" && Ext.isEmpty(values.DisplayValue)) {
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
        if (me.pageType == "Edit") {
            field.expr = item.ComputeExpr;
            field.table = table;
            field.fieldType = item.FieldType;
            field.tableType = tableType;
            field.inputCls = "x-input-view";
            field.dLen = item.DLen || -99;
            if (item.ColtrolValue != 0 && item.FieldType != "binary") { // 可编辑
                field.inputCls = "x-input-edit";
                field.readOnly = false;
                me.hasFieldEdit = true; //标识当前表单有可编辑字段
                field.required = item.ColtrolValue == 3;
                if (item.HelpString) { // 需要调用通用帮助
                    field.xtype = "ngcommonhelp";
                    field.readOnly = true;
                    field.cls = "edit-input edit-select";
                    field.helper = {title: item.FieldDesc, helpString: item.HelpString};
                    field.fromValues = values;
                } else {
                    field.xtype = xtypes[item.FieldType];
                }
                if (field.xtype == "datefieldux") { //时间控件
                    field.isNull = true;
                    field.dateFormat = item.FieldType == "datetime" ? 'Y-m-d H:i' : 'Y-m-d';
                    field.picker = {
                        xtype: 'timepickerux',
                        slotOrder: item.FieldType == "datetime" ? ['year', 'month', 'day', 'hour', 'minute'] : ['year', 'month', 'day']
                    };
                    if (values.DisplayValue && values.DisplayValue.length > 0) {
                        field.value = new Date(values.DisplayValue);
                        field.isNull = false;
                    }
                } else if (!field.readOnly && me.ExpMap[name.replace(/-\d+$/, '')]) {
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
                                        me.calcExpDirs = []; //清空计算路径
                                   //TODO:     me.onFieldKeyUp(e.delegatedTarget, fd.config.table, fd.config.fieldType);
                                    }
                                }
                            });
                        }
                    };
                }
                if(!hasKeyUp && me.ExpMap[name.replace(/-\d+$/, '')]) {
                    field.listeners = {
                        initialize: function (fd) {
                            fd.on({
                                change: function (c, nValue, oValue) {
                                    var el = c.element.down("input");
                                    if (el && el.dom) {
                                        me.calcExpDirs = []; //清空计算路径
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
        me.AFRequst('TaskInstance', parms, function (resp) {
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