sap.ui.define([
    "./BaseController",
    "../util/Formatter",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/m/MessagePopoverItem",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/message/Message",
    "sap/ui/core/UIComponent",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/ui/Device",
    'sap/m/TextArea',
    "sap/m/library"
], function (BaseController, Formatter, Controller, Fragment, Filter, FilterOperator, MessagePopover, MessageItem, MessagePopoverItem,
    JSONModel, Message, UIComponent, DateFormat, MessageToast, Dialog, Button, ButtonType, Device, TextArea) {
    "use strict";
    
    // var sServiceUrl = ("/sap/opu/odata/sap/ZMAINT_HR_POINT_SRV/");
    // var oOData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
    var oOData;
    var gvPeriodo = "";
    var gvAba = "";
    var sData = "";
    var sPernr = "";
    var sOrgeh = "";
    return BaseController.extend("hr.manutencaodepontorh.controller.Detail", {

        formatter: Formatter,

        onInit: function (evt) {

            // Step adicional em todas as apps pra funcionar essa gambiarra de acesso ao oModel no Workzone
            oOData = this.getOwnerComponent().getModel();

            this.Busy = new sap.m.BusyDialog({
                busyIndicatorDelay: 0
            });

            this.Busy.open();
            this.byId("idDpAll").setMaxDate(new Date());
            this.byId("idDpAll").setDateValue(new Date());
            this.byId("idDpError").setMaxDate(new Date());
            this.byId("idDpError").setDateValue(new Date());
            this.byId("idDpPendt").setMaxDate(new Date());
            this.byId("idDpPendt").setDateValue(new Date());
            this.byId("idDpHist").setMaxDate(new Date());
            this.byId("idDpHist").setDateValue(new Date());
            this.byId("idDpPendt").setMaxDate(new Date());
            this.byId("idDpPendt").setDateValue(new Date());
            
            this.loadPortalMsgs();
            //this.loadDatePicker();
            this.getRouter().getRoute("Detail").attachMatched(this._onRoute, this);
            //this.onValidaElegibilidade(this.onValidation, "");
            this.Busy.close();
        },

        onValidaElegibilidade: function (functionCallBack, periodo, matricula) {
            var that = this;
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy"
            });
            var vPeriod;
            var vDate = oDateFormat.format(new Date());
            if (periodo !== "") {
                vPeriod = periodo;
            } else {
                // Exemplo: "202007";
                vPeriod = vDate.substr(6, 4) + vDate.substr(3, 2);
            }

            var sURL = "/validaElegibilidadeSet";
            var value = sURL;
            var message = "";
            oOData.read(value, {
                urlParameters: {
                    "$filter": `period eq '${vPeriod}' and pernr eq '${matricula}'`
                },
                success: function (oSuccess) {
                    if (functionCallBack) {
                        functionCallBack(oSuccess, that, vPeriod, matricula);
                    }
                },
                error: function (Error) {
                    var message1 = "Funcionário não elegível ao ponto neste período.";
                    var message2 = "Sem cadastro/Cadastro incorreto do infotipo 0050.";
                    var obj = "";

                    try {
                        if (Error.responseText) {
                            obj = JSON.parse(Error.responseText);
                            message = obj.error.message.value;
                        } else if (Error.response.body) {
                            var errorModel = new sap.ui.model.xml.XMLModel();
                            errorModel.setXML(Error.response.body);
                            if (errorModel.getProperty("/0/message") !== "") {
                                Error = errorModel.getProperty("/0/message");
                            } else {
                                obj = JSON.parse(Error.response.body);
                                if (obj.error.message.value !== "") {
                                    message = obj.error.message.value;
                                } else {
                                    message = message1;
                                }
                            }
                        } else {
                            message = message1;
                        }
                    } catch (error) {
                        message = message1;
                    }
                    that.openDialogToError(message);

                    if (message === message1 || message === message2) {
                        var oJson = new sap.ui.model.json.JSONModel();
                        var aDataI = [];
                        oJson.setData(aDataI);
                        that.getView().setModel(oJson, "frequency");
                        that.byId("IconTabFilterAll").setCount(aDataI.length);
                        that.getView().setModel(oJson, "Error");
                        that.byId("IconTabFilterError").setCount(aDataI.length);
                        that.getView().setModel(oJson, "Pendt");
                        that.byId("IconTabFilterPendt").setCount(aDataI.length);
                        that.getView().setModel(oJson, "Hist");
                        that.byId("IconTabFilterHist").setCount(aDataI.length);
                    }
                }
            });
        },

        onValidation: function (oSuccess, control, periodo, matricula) {

            control.onDataLimite(control.onLoadUtilLoadEntity, periodo, matricula);
            control.loadHistory(periodo, matricula);
            control.createMessageManager();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(control);
            oRouter.getRoute("DetailBack").attachMatched(control._onRoute, control);
        },

        onLoadUtilLoadEntity: function (oSuccess, control, periodo, matricula) {

            var oJson = new sap.ui.model.json.JSONModel();
            if (oSuccess) {
                oJson.setData(oSuccess);
                control.getView().setModel(oJson, "datalimite");
                control.getView().byId("idTextDtLimiteAll").setText(oSuccess.dtlimit);
                control.getView().byId("idTextDtLimiteError").setText(oSuccess.dtlimit);
                control.getView().byId("idTextDtLimitePendt").setText(oSuccess.dtlimit);
            }
            control.utilLoadEntity(periodo, matricula);
        },

        onChange: function (evt) {
            var theEvent = evt || window.event;
            var key = "";
            if (theEvent.type === "paste") {
                key = event.clipboardData.getData("text/plain");
            } else {
                key = theEvent.keyCode || theEvent.which;
                key = String.fromCharCode(key);
            }
            var regex = /[0-9]|\./;
            if (!regex.test(key)) {
                theEvent.returnValue = false;
                if (theEvent.preventDefault) {
                    theEvent.preventDefault();
                }
            }
        },

        loadPortalMsgs: function () {
            var that = this;
            var valueMsg = "/portalMsgsSet";
            var oJsonMsgs = new sap.ui.model.json.JSONModel();
            oOData.read(valueMsg, {
                success: function (oSuccess) {
                    if (oSuccess) {
                        console.log("portalmsg", oSuccess);
                        oJsonMsgs.setData(oSuccess);
                        that.getView().setModel(oJsonMsgs, "portalMsgs");
                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });
        },

        loadHistory: function (periodo, matricula) {
            var that = this;
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy"
            });
            var vPeriod;
            var vDate = oDateFormat.format(new Date());
            if (periodo) {
                vPeriod = periodo;
            } else {
                // Exemplo: "202007";
                vPeriod = vDate.substr(6, 4) + vDate.substr(3, 2);
            }

            var sURL = "/historicosSet";
            var value = sURL;
            var oJson = new sap.ui.model.json.JSONModel();
            oOData.read(value, {
                urlParameters: {
                    "$filter": `period eq '${vPeriod}' and pernr eq '${matricula}'`
                },
                success: function (oSuccess) {
                    if (oSuccess) {
                        oJson.setData(oSuccess);
                        that.getView().setModel(oJson, "Hist");
                        that.byId("IconTabFilterHist").setCount(oSuccess.results.length);
                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });

        },

        utilLoadEntity: function (periodo, matricula) {

            var that = this;

            that.Busy = new sap.m.BusyDialog({
                busyIndicatorDelay: 0
            });
            that.Busy.open();

            var vPeriod;
            var vMatricula = matricula;
            var that = this;
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy"
            });
            var vDate = oDateFormat.format(new Date());

            if (periodo) {
                vPeriod = periodo;
            } else {
                //vPeriod = "202007";
                vPeriod = vDate.substr(6, 4) + vDate.substr(3, 2);
            }

            var sURL = "/frequencySet";
            var value = sURL;
            var oTable = this.byId("idTableAll");
            this._oTable = oTable;
            var oJson = new sap.ui.model.json.JSONModel();

            let dd = that.getView().getModel("frequency");
            if(dd)
            {
                dd.destroy();
                that.byId("IconTabFilterAll").setCount(0);
                that.byId("IconTabFilterPendt").setCount(0);
                that.byId("IconTabFilterError").setCount(0);
                that.getView().setModel(oJson, "frequency");
                that.getView().setModel(oJson, "Pendt");
                that.getView().setModel(oJson, "Error");
            }

            oOData.read(value, {
                urlParameters: {
                    "$expand": `FrequencyToMsgsNav`,
                    "$filter": `period eq '${vPeriod}' and pernr eq '${matricula}'`
                },
                success: function (oSuccess) {

                    if (oSuccess) {

                        var sDtAtual = that.formatToDate(new Date());

                        oSuccess.results = oSuccess.results.filter(function (oResult) {
                            return that.formatToDate(oResult.datum) <= sDtAtual;
                        });

                        oJson.setData(oSuccess);
                        that.byId("IconTabFilterAll").setCount(oSuccess.results.length);
                        that.getView().setModel(oJson, "frequency");
                        
                        that.loadModelOk(oSuccess);
                        that.loadModelPendt(oSuccess);
                        that.loadModelError(oSuccess);

                        that.Busy.close();

                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                    that.byId("IconTabFilterAll").setCount(0);
                    that.byId("IconTabFilterPendt").setCount(0);
                    that.byId("IconTabFilterError").setCount(0);
                    that.getView().setModel(oJson, "frequency");
                    that.getView().setModel(oJson, "Pendt");
                    that.getView().setModel(oJson, "Error");

                    that.Busy.close();
                }
            });

            that.Busy.close();
            
        },

        onDataLimite: function (functionCallBack, periodo, matricula) {
            var that = this;
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy"
            });
            var vDate = oDateFormat.format(new Date());

            if (periodo === "") {
                periodo = vDate.substr(6, 4) + vDate.substr(3, 2);
            }
            var sURL = "/dataLimiteSet(period='" + periodo + "')";
            var value = sURL;
            var oTable = this.byId("idTableAll");
            this._oTable = oTable;
            var oJson = new sap.ui.model.json.JSONModel();
            oOData.read(value, {
                success: function (oSuccess) {

                    if (functionCallBack) {
                        functionCallBack(oSuccess, that, periodo, matricula);
                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                    that.byId("IconTabFilterAll").setCount(0);
                    that.byId("IconTabFilterPendt").setCount(0);
                    that.byId("IconTabFilterError").setCount(0);
                    that.getView().setModel(oJson, "frequency");
                    that.getView().setModel(oJson, "Pendt");
                    that.getView().setModel(oJson, "Error");
                }
            });

        },

        _onRoute: function (evt) {
            sData = evt.getParameters().arguments.datum;
            sPernr = evt.getParameters().arguments.pernr;
            sOrgeh = evt.getParameters().arguments.orgeh;
            //this.utilLoadEntity(sData, sPernr);
            this.loadHeader(sPernr);
            this.onValidaElegibilidade(this.onValidation, sData ? sData : "", sPernr);
            //this.loadHistory(sData, sPernr);
            //this.loadHeader(sPernr);
        },

        loadHeader: function (matricula) {

            var that = this;
            var sURL = "/headerSet";
            var value = sURL;
            var oJson = new sap.ui.model.json.JSONModel();
            oOData.read(value, {
                urlParameters: {
                    "$filter": `pernr eq '${matricula}'`
                },
                success: function (oSuccess) {
                    if (oSuccess) {
                        oJson.setData(oSuccess);
                        that.getView().setModel(oJson, "header");
                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });
        },

        handleIconTabBarSelect: function (oEvent) {
            if (gvPeriodo) {
                this.getView().byId("idDpAll").setValue(gvPeriodo);
                //this.getView().byId("idDpOk").setValue(gvPeriodo);
                this.getView().byId("idDpPendt").setValue(gvPeriodo);
                this.getView().byId("idDpError").setValue(gvPeriodo);
                this.getView().byId("idDpHist").setValue(gvPeriodo);
            }

            var sDataLimite = "";
            var sDataAtual = "";

            var oPortalMsgs = this.getView().getModel("portalMsgs").getData();
            sDataLimite = new Date(this.getView().byId("idTextDtLimiteAll").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteAll").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteAll").getText().substr(37, 4));
            sDataAtual = new Date();

            var sDtLimite = this.formatToDate(sDataLimite);
            var sDtAtual = this.formatToDate(sDataAtual);

            var oJson = new sap.ui.model.json.JSONModel();
            var oBinding = this._oTable.getBinding("items"),
                sKey = oEvent.getParameter("key");
            //oFilters = [];
            var oDataI = {};
            var aDataI = [];
            var aErrorI = [];
            var oErrorI = [];
            var i = 0;
            var j = 0;
            var l = 0;
            var vCheck = "";

            if (sKey === "Ok") {
                for (i = 0; i < oBinding.oList.length; i++) {
                    if (oBinding.oList[i].abwgr !== "PEND") {
                        if (oBinding.oList[i].FrequencyToMsgsNav.results[0]) {
                            for (j = 0; j < oBinding.oList[i].FrequencyToMsgsNav.results.length; j++) {
                                for (l = 0; l < oPortalMsgs.results.length; l++) {
                                    if (oPortalMsgs.results[l].type === "A") {
                                        if (oBinding.oList[i].FrequencyToMsgsNav.results[j].error === oPortalMsgs.results[l].error) {
                                            oErrorI = {};
                                            oErrorI.error = oBinding.oList[i].FrequencyToMsgsNav.results[j].error;
                                            oErrorI.etext = oBinding.oList[i].FrequencyToMsgsNav.results[j].etext;
                                            aErrorI.push(oErrorI);
                                            vCheck = "X";
                                        }
                                    }
                                }
                            }
                            if (vCheck === "X") {
                                oDataI = {};
                                oDataI.datum = oBinding.oList[i].datum;
                                oDataI.hours = oBinding.oList[i].hours;
                                oDataI.marks = oBinding.oList[i].marks;
                                oDataI.justs = oBinding.oList[i].justs;
                                oDataI.joacc = oBinding.oList[i].joacc;
                                oDataI.FrequencyToMsgsNav = aErrorI;
                                aDataI.push(oDataI);
                                vCheck = "";
                                aErrorI = [];
                            }
                        }
                    }
                }

                oJson.setData(aDataI);
                this.getView().setModel(oJson, "Ok");
                this.byId("IconTabFilterOk").setCount(aDataI.length);
            }

            if (sKey === "Pendt") {
                
                var sStdaz;
                var sJoacc;
                for (i = 0; i < oBinding.oList.length; i++) {
                    sStdaz = parseFloat(oBinding.oList[i].stdaz.replace(":", "."));
                    sJoacc = parseFloat(oBinding.oList[i].joacc.replace(":", "."));
                    if (oBinding.oList[i].alldf === "X") {
                        sJoacc = sStdaz;
                    }
                    if (oBinding.oList[i].abwgr === "PEND") {
                        //if(oBinding.oList[i].abwgr === "PEND" && sStdaz <= sJoacc){

                        oDataI = {};
                        oDataI.datum = oBinding.oList[i].datum;
                        oDataI.hours = oBinding.oList[i].hours;
                        oDataI.marks = oBinding.oList[i].marks;
                        oDataI.justs = oBinding.oList[i].justs;
                        oDataI.prese = oBinding.oList[i].prese;
                        oDataI.joacc = oBinding.oList[i].joacc;
                        aDataI.push(oDataI);
                    }
                }
                oJson.setData(aDataI);
                this.getView().setModel(oJson, "Pendt");
                this.byId("IconTabFilterPendt").setCount(aDataI.length);
            }
            if (sKey === "Error") {

                /*
                if (sDtLimite >= sDtAtual) {
                    for (i = 0; i < oBinding.oList.length; i++) {
                        if (oBinding.oList[i].hours !== "Feriado" && oBinding.oList[i].hours !== "DSR" && oBinding.oList[i].hours !== "COMP" && oBinding
                            .oList[i].hours !== "FOLG") {
                            var sDateErro = this.formatToDate(oBinding.oList[i].datum);
                            if (sDateErro < sDtAtual) {
                                if (oBinding.oList[i].FrequencyToMsgsNav.results[0]) {
                                    for (j = 0; j < oBinding.oList[i].FrequencyToMsgsNav.results.length; j++) {
                                        for (l = 0; l < oPortalMsgs.results.length; l++) {
                                            if (oPortalMsgs.results[l].type === "E") {
                                                if (oBinding.oList[i].FrequencyToMsgsNav.results[j].error === oPortalMsgs.results[l].error) {
                                                    oErrorI = {};
                                                    oErrorI.error = oBinding.oList[i].FrequencyToMsgsNav.results[j].error;
                                                    oErrorI.etext = oBinding.oList[i].FrequencyToMsgsNav.results[j].etext;
                                                    aErrorI.push(oErrorI);
                                                    vCheck = "X";
                                                }
                                            }
                                        }
                                    }
                                    if (vCheck === "X") {
                                        oDataI = {};
                                        oDataI.datum = oBinding.oList[i].datum;
                                        oDataI.hours = oBinding.oList[i].hours;
                                        oDataI.marks = oBinding.oList[i].marks;
                                        oDataI.justs = oBinding.oList[i].justs;
                                        oDataI.prese = oBinding.oList[i].prese;
                                        oDataI.joacc = oBinding.oList[i].joacc;
                                        oDataI.FrequencyToMsgsNav = aErrorI;
                                        aDataI.push(oDataI);
                                        vCheck = "";
                                        aErrorI = [];
                                    }
                                }
                            }
                        }
                    }

                    oJson.setData(aDataI);
                    console.log("497");
                    this.getView().setModel(oJson, "Error");
                    this.byId("IconTabFilterError").setCount(aDataI.length);
                } else {

                    console.log("504");
                    oJson.setData(aDataI);
                    this.getView().setModel(oJson, "Error");
                    this.byId("IconTabFilterError").setCount(aDataI.length);
                }
                */
            }
        },

        formatToDate: function (date) {
            var newDate = DateFormat.getDateTimeInstance({
                pattern: "yyyy-MM-dd",
                //pattern: "PTHH'H'mm'M'ss'S'",
                UTC: true
            }).format(date);
            return newDate;
        },

        buttonTypeFormatterOk: function () {
            var sHighestSeverity;
            sHighestSeverity = "Default";
            return sHighestSeverity;
        },

        buttonTypeFormatterError: function () {
            var sHighestSeverity;
            sHighestSeverity = "Reject";
            return sHighestSeverity;
        },

        buttonIconFormatterOk: function () {
            var sIcon;
            sIcon = "sap-icon://message-information";
            return sIcon;
        },

        buttonIconFormatterError: function () {
            var sIcon;
            sIcon = "sap-icon://message-error";
            return sIcon;
        },

        MessagePopoverPressOk: function (evt) {

            var aMessages = this.getView().getModel("Ok").getData();

            //var index = evt.getSource().getId().substring(89, 90);
            var index = evt.getSource()._getPropertiesToPropagate().oBindingContexts.frequency.sPath.split("/")[2];
            sap.ui.getCore().getMessageManager().removeAllMessages();
            var sDataf = evt.getSource().getBindingContext("frequency").getModel().getData().results[index].datum;

            for (var i = 0; i < aMessages.length; i++) {

                if (aMessages[i].datum === sDataf) {

                    for (var j = 0; j < aMessages[i].FrequencyToMsgsNav.length; j++) {

                        var vMessage = aMessages[i].FrequencyToMsgsNav[j].etext;
                        var MessageType = sap.ui.core.MessageType;
                        sap.ui.getCore().getMessageManager().addMessages(new Message({
                            message: vMessage,
                            type: MessageType.Information
                        }));

                    }
                }
            }
            this._getMessagePopover().toggle(evt.getSource());
        },

        MessagePopoverPressError: function (evt) {
            var aMessages = this.getView().getModel("Error").getData();
            //var index = evt.getSource().getId().substring(96, 97);
            var index = evt.getSource()._getPropertiesToPropagate().oBindingContexts.Error.sPath.split("/")[1];
            sap.ui.getCore().getMessageManager().removeAllMessages();
            for (var i = 0; i < aMessages[index].FrequencyToMsgsNav.length; i++) {
                if (aMessages[index].FrequencyToMsgsNav[i]) {
                    var vMessage = aMessages[index].FrequencyToMsgsNav[i].etext;
                    var MessageType = sap.ui.core.MessageType;
                    sap.ui.getCore().getMessageManager().addMessages(new Message({
                        message: vMessage,
                        type: MessageType.Error
                    }));
                }
            }
            this._getMessagePopover().toggle(evt.getSource());
            //this._getMessagePopover().openBy(oEvent.getSource());
        },

        _getMessagePopover: function () {
            if (!this._oMessagePopover) {
                this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "hr.manutencaodepontorh.view.fragments.Mensagens", this);
                this.getView().addDependent(this._oMessagePopover);
            }
            return this._oMessagePopover;
        },

        createMessageManager: function () {
            var oMessageManager = sap.ui.getCore().getMessageManager();
            this.getView().setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(this.getView(), true);
        },

        onPressError: function (evt) {

            let sDataLimite = new Date(this.getView().byId("idTextDtLimiteAll").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteAll").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteAll").getText().substr(37, 4));
            let sDataAtual = new Date();

            var sDtLimite = this.formatToDate(sDataLimite);
            var sDtAtual = this.formatToDate(sDataAtual);

            if ( sDtAtual > sDtLimite )
            {
                MessageToast.show("Período fora da Data Limite para Atualização");
                return;
            }

            this.Busy = new sap.m.BusyDialog({
                busyIndicatorDelay: 0
            });
            this.Busy.open();

            var vJusts = "";
            var vJoacc = "";
            var vMarks = "";
            var vError1 = "";
            var vText1 = "";
            var vError2 = "";
            var vText2 = "";
            var vClass = "";

            var vData = evt.getSource().getBindingContext("Error").getProperty("datum");
            var vHours = evt.getSource().getBindingContext("Error").getProperty("hours");

            if (evt.getSource().getBindingContext("Error").getProperty("marks")) {
                vMarks = evt.getSource().getBindingContext("Error").getProperty("marks");
            } else {
                vMarks = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("justs")) {
                vJusts = evt.getSource().getBindingContext("Error").getProperty("justs");
            } else {
                vJusts = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("joacc")) {
                vJoacc = evt.getSource().getBindingContext("Error").getProperty("joacc");
            } else {
                vJoacc = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[0]) {
                vError1 = evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[0].error;
            } else {
                vError1 = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[0]) {
                vText1 = evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[0].etext;
            } else {
                vText1 = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[1]) {
                vError2 = evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[1].error;
            } else {
                vError2 = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[1]) {
                vText2 = evt.getSource().getBindingContext("Error").getProperty("FrequencyToMsgsNav")[1].etext;
            } else {
                vText2 = "0";
            }

            if (evt.getSource().getBindingContext("Error").getProperty("class")) {
                vClass = evt.getSource().getBindingContext("Error").getProperty("class");
            } else {
                vClass = "0";
            }

            //var oRouter = this.getOwnerComponent().getRouter();
            //var oRouter =  new UIComponent.getRouterFor(this);
            
            vJusts = vJusts.replace('/','-');
            var dt = this.byId("idDpError").getValue().substr(6, 4) + this.byId("idDpError").getValue().substr(3, 2);

            this.getRouter().navTo("Maintenance", {
                datum: vData.toISOString(),
                pernr: sPernr,
                orgeh: sOrgeh,
                hours: vHours,
                classe: vClass,
                marks: vMarks,
                justs: vJusts,
                joacc: vJoacc,
                error1: vError1,
                etext1: vText1,
                error2: vError2,
                etext2: vText2,
                screen: "Error",
                period: dt
            });

            this.Busy.close();
        },

        /*		loadDatePicker: function(){
                	
                    var vlDate = new Date();
                    var vDatum = vlDate.toISOString().substr(5,2) + "-" + vlDate.toISOString().substr(0,4);
                    this.getView().byId("idDpAll").setValue(vDatum);
                    //this.getView().byId("idDpOk").setValue(vDatum);
                    this.getView().byId("idDpPendt").setValue(vDatum);
                    this.getView().byId("idDpError").setValue(vDatum);
                    this.getView().byId("idDpHist").setValue(vDatum);
                },*/

        handleChange: function (evt) {
            /*			var vPeriodo = evt.getParameters().value.substr(6,4) + evt.getParameters().value.substr(3,2);
                        this.utilLoadEntity(vPeriodo, sPernr);
                        this.loadHistory(vPeriodo, sPernr);
                        gvPeriodo = vPeriodo.substr(4,2) + "-" +  vPeriodo.substr(0,4);*/

            //Essa bomba não funciona mais, o formato que está vindo é "9/1/24" (mes/dia/ano) e quebra a lógica
            //var vPeriodo = evt.getParameters().value.substr(6, 4) + evt.getParameters().value.substr(3, 2);

            let newSelectedDate = evt.getSource().getProperty("dateValue");
            var vPeriodo = `${newSelectedDate.getFullYear()}${("0" + (newSelectedDate.getMonth() + 1)).slice(-2)}`;

            this.onValidaElegibilidade(this.onValidation, vPeriodo, sPernr);

            //this.utilLoadEntity(vPeriodo);
            /*			this.onDataLimite(vPeriodo, this.onLoadUtilLoadEntity);
                        this.loadHistory(vPeriodo);*/
            gvPeriodo = vPeriodo.substr(4, 2) + "-" + vPeriodo.substr(0, 4);

            if (evt.getSource().getId() === "__xmlview0--idDpOk") {
                gvAba = "__xmlview0--idDpOk";
            }

            if (evt.getSource().getId() === "__xmlview0--idDpPendt") {
                gvAba = "__xmlview0--idDpPendt";
            }

            if (evt.getSource().getId() === "__xmlview0--idDpError") {
                gvAba = "__xmlview0--idDpError";
            }

            if (evt.getSource().getId() === "__xmlview0--idDpHist") {
                gvAba = "__xmlview0--idDpHist";
            }
        },

        loadModelOk: function (oSuccess) {

            /*
            var sDataAtual = new Date();
            var sDataLimite = new Date(this.getView().byId("idTextDtLimiteAll").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteAll").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteAll").getText().substr(37, 4));

            var sDtLimite = this.formatToDate(sDataLimite);
            var sDtAtual = this.formatToDate(sDataAtual);

            var oPortalMsgs = this.getView().getModel("portalMsgs").getData();
            var oJson = new sap.ui.model.json.JSONModel();
            var oDataI = {};
            var aDataI = [];
            var aErrorI = [];
            var oErrorI = [];
            var i = 0;
            var j = 0;
            var l = 0;
            var vCheck = "";
            for (i = 0; i < oSuccess.results.length; i++) {

                if (oSuccess.results[i].FrequencyToMsgsNav.results[0]) {
                    for (j = 0; j < oSuccess.results[i].FrequencyToMsgsNav.results.length; j++) {

                        for (l = 0; l < oPortalMsgs.results.length; l++) {
                            if (oPortalMsgs.results[l].type === "A") {
                                if (oSuccess.results[i].FrequencyToMsgsNav.results[j].error === oPortalMsgs.results[l].error) {
                                    oErrorI = {};
                                    oErrorI.error = oSuccess.results[i].FrequencyToMsgsNav.results[j].error;
                                    oErrorI.etext = oSuccess.results[i].FrequencyToMsgsNav.results[j].etext;
                                    aErrorI.push(oErrorI);
                                    vCheck = "X";
                                }
                            }
                        }
                    }
                    if (vCheck === "X") {
                        oDataI = {};
                        oDataI.datum = oSuccess.results[i].datum;
                        oDataI.hours = oSuccess.results[i].hours;
                        oDataI.class = oSuccess.results[i].class;
                        oDataI.marks = oSuccess.results[i].marks;
                        oDataI.justs = oSuccess.results[i].justs;
                        oDataI.joacc = oSuccess.results[i].joacc;
                        oDataI.justificativa = oSuccess.results[i].justificativa;
                        oDataI.FrequencyToMsgsNav = aErrorI;
                        aDataI.push(oDataI);
                        vCheck = "";
                        aErrorI = [];
                    }
                }
            }

            oJson.setData(aDataI);
            this.getView().setModel(oJson, "Ok");
            //this.byId("IconTabFilterOk").setCount(aDataI.length);
            var sVal = "";
            var oTable = this.getView().byId("idTableAll");
            var sDateAll = "";
            for (var a = 0; a < oSuccess.results.length; a++) {
                if (oSuccess.results[a].afast != "X") {
                    //if(oSuccess.results[a].zterf === "1"){
                    sDateAll = this.formatToDate(oSuccess.results[a].datum);
                    if (sDateAll < sDtAtual && sDtLimite >= sDtAtual) {

                        if (oSuccess.results[a].hours === "COMP" || oSuccess.results[a].hours === "DSR" || oSuccess.results[a].hours === "FOLG" ||
                            oSuccess.results[a].hours === "Feriado") {
                            oTable.getItems()[a].getCells()[7].setVisible(true);
                        } else {
                            oTable.getItems()[a].getCells()[7].setVisible(false);
                        }
                    } else {
                        oTable.getItems()[a].getCells()[7].setVisible(false);
                    }
                    /*						}
                                            else{
                                                oTable.getItems()[a].getCells()[7].setVisible(false);
                                            }

                } else {
                    oTable.getItems()[a].getCells()[7].setVisible(false);
                }

                if (oSuccess.results[a].FrequencyToMsgsNav.results[0]) {
                    for (var b = 0; b < oSuccess.results[a].FrequencyToMsgsNav.results.length; b++) {
                        for (l = 0; l < oPortalMsgs.results.length; l++) {
                            if (oPortalMsgs.results[l].type === "A") {
                                if (oSuccess.results[a].FrequencyToMsgsNav.results[b].error === oPortalMsgs.results[l].error) {
                                    sVal = "X";
                                }
                            }
                        }
                    }

                    if (sVal === "X") {
                        oTable.getItems()[a].getCells()[6].setVisible(true);
                        sVal = "";
                    } else {
                        oTable.getItems()[a].getCells()[6].setVisible(false);
                    }

                } else {
                    oTable.getItems()[a].getCells()[6].setVisible(false);
                }
            }

            */

            var sDataAtual = new Date();
            //var sDataLimite = new Date(this.getView().byId("idTextDtLimiteAll").getText().substr(34, 2) + "." + this.getView().byId(
            //	"idTextDtLimiteAll").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteAll").getText().substr(37, 4));

            var sDataLimite = new Date(this.getView().byId("idTextDtLimiteAll").getText().substr(37, 4) + "-" + this.getView().byId(
                "idTextDtLimiteAll").getText()
                .substr(34, 2) + "-" + this.getView().byId("idTextDtLimiteAll").getText().substr(31, 2));

            var sDtLimite = this.formatToDate(sDataLimite);
            var sDtAtual = this.formatToDate(sDataAtual);

            var oPortalMsgs = this.getView().getModel("portalMsgs").getData();
            var oJson = new sap.ui.model.json.JSONModel();
            var oDataI = {};
            var aDataI = [];
            var aErrorI = [];
            var oErrorI = [];
            var i = 0;
            var j = 0;
            var l = 0;
            var vCheck = "";
            for (i = 0; i < oSuccess.results.length; i++) {
                var sDateAll = this.formatToDate(oSuccess.results[i].datum);
                if (sDateAll <= sDtAtual) {
                    if (oSuccess.results[i].FrequencyToMsgsNav.results[0]) {
                        for (j = 0; j < oSuccess.results[i].FrequencyToMsgsNav.results.length; j++) {

                            for (l = 0; l < oPortalMsgs.results.length; l++) {
                                if (oPortalMsgs.results[l].type === "A" || oPortalMsgs.results[l].type === "E") {
                                    if (oSuccess.results[i].FrequencyToMsgsNav.results[j].error === oPortalMsgs.results[l].error) {

                                        oErrorI = {};
                                        oErrorI.error = oSuccess.results[i].FrequencyToMsgsNav.results[j].error;
                                        oErrorI.etext = oSuccess.results[i].FrequencyToMsgsNav.results[j].etext;
                                        aErrorI.push(oErrorI);
                                        vCheck = "X";
                                    }
                                }
                            }
                        }
                        if (vCheck === "X") {
                            oDataI = {};
                            oDataI.datum = oSuccess.results[i].datum;
                            oDataI.hours = oSuccess.results[i].hours;
                            oDataI.class = oSuccess.results[i].class;
                            oDataI.marks = oSuccess.results[i].marks;
                            oDataI.justs = oSuccess.results[i].justs;
                            oDataI.joacc = oSuccess.results[i].joacc;
                            oDataI.FrequencyToMsgsNav = aErrorI;
                            aDataI.push(oDataI);
                            vCheck = "";
                            aErrorI = [];
                        }
                    }
                }
            }

            oJson.setData(aDataI);
            this.getView().setModel(oJson, "Ok");
            //this.byId("IconTabFilterOk").setCount(aDataI.length);
            var sVal = "";
            var oTable = this.getView().byId("idTableAll");
            var sDateAll = "";

            for (var a = 0; a < oSuccess.results.length; a++) {
                if (oSuccess.results[a].afast != "X") {
                    //if(oSuccess.results[a].zterf === "1"){

                    sDateAll = this.formatToDate(oSuccess.results[a].datum);
                    if (sDateAll < sDtAtual && sDtLimite >= sDtAtual) {

                        if (oSuccess.results[a].hours === "COMP" || oSuccess.results[a].hours === "DSR" || oSuccess.results[a].hours === "FOLG" ||
                             oSuccess.results[a].hours === "Feriado") {
                             oTable.getItems()[a].getCells()[7].setVisible(true);
                        } else {
                            oTable.getItems()[a].getCells()[7].setVisible(false);
                        }
                    } else {
                        oTable.getItems()[a].getCells()[7].setVisible(false);
                    }
                    /*						}
                                            else{
                                                oTable.getItems()[a].getCells()[7].setVisible(false);
                                            }*/

                } else {
                    oTable.getItems()[a].getCells()[7].setVisible(false);
                }

                debugger;
                if (oSuccess.results[a].FrequencyToMsgsNav.results[0]) {
                    for (var b = 0; b < oSuccess.results[a].FrequencyToMsgsNav.results.length; b++) {
                        for (l = 0; l < oPortalMsgs.results.length; l++) {
                            if (oPortalMsgs.results[l].type === "A" || oPortalMsgs.results[l].type === "E") {
                                if (oSuccess.results[a].FrequencyToMsgsNav.results[b].error === oPortalMsgs.results[l].error) {
                                    sVal = "X";
                                }
                            }
                        }
                    }

                    if (sVal === "X") {
                        oTable.getItems()[a].getCells()[6].setVisible(true);
                        sVal = "";
                    } else {
                        oTable.getItems()[a].getCells()[6].setVisible(false);
                    }

                } else {
                    oTable.getItems()[a].getCells()[6].setVisible(false);
                }
            }
        },

        loadModelPendt: function (oSuccess) {
            var oJson = new sap.ui.model.json.JSONModel();
            var oDataI = {};
            var aDataI = [];
            //var aErrorI = [];
            //var oErrorI = [];
            var i = 0;
            //var j = 0;
            //var vCheck = "";
            var sStdaz;
            var sJoacc;
            for (i = 0; i < oSuccess.results.length; i++) {
                sStdaz = parseFloat(oSuccess.results[i].stdaz.replace(":", "."));
                sJoacc = parseFloat(oSuccess.results[i].joacc.replace(":", "."));

                if (oSuccess.results[i].alldf === "X") {
                    sJoacc = sStdaz;
                }

                //if(oSuccess.results[i].abwgr === "PEND" && sStdaz <= sJoacc){
                if (oSuccess.results[i].abwgr === "PEND") {
                    //if(oSuccess.results[i].FrequencyToMsgsNav.results[0]){
                    /*							for(j = 0; j < oSuccess.results[i].FrequencyToMsgsNav.results.length; j++){
                                                	
                                                    	
                                                        oErrorI = {};
                                                        oErrorI.error =  oSuccess.results[i].FrequencyToMsgsNav.results[j].error;
                                                        oErrorI.etext =  oSuccess.results[i].FrequencyToMsgsNav.results[j].etext;
                                                        aErrorI.push(oErrorI);
                                                        vCheck = "X";
                                                	
                                                }*/
                    //	if(vCheck === "X"){
                    oDataI = {};
                    oDataI.datum = oSuccess.results[i].datum;
                    oDataI.hours = oSuccess.results[i].hours;
                    oDataI.class = oSuccess.results[i].class;
                    oDataI.marks = oSuccess.results[i].marks;
                    oDataI.justs = oSuccess.results[i].justs;
                    oDataI.prese = oSuccess.results[i].prese;
                    oDataI.joacc = oSuccess.results[i].joacc;
                    oDataI.joacc = oSuccess.results[i].justificativa;
                    //		oDataI.FrequencyToMsgsNav = aErrorI;
                    aDataI.push(oDataI);
                    //		vCheck = "";
                    //		aErrorI = [];
                    //	}
                    //	}
                }
            }
            oJson.setData(aDataI);
            this.getView().setModel(oJson, "Pendt");
            this.byId("IconTabFilterPendt").setCount(aDataI.length);
        },

        loadModelError: function (oSuccess) {
            
            var sDataLimite = "";
            var sDataAtual = "";

            //var vDate = oDateFormat.format(new Date());

            var oPortalMsgs = this.getView().getModel("portalMsgs").getData();
            var oJson = new sap.ui.model.json.JSONModel();
            sDataLimite = new Date(this.getView().byId("idTextDtLimiteError").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteError").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteError").getText().substr(37, 4));
            sDataAtual = new Date();

            var sDtLimite = this.formatToDate(sDataLimite);
            var sDtAtual = this.formatToDate(sDataAtual);

            var oDataI = {};
            var aDataI = [];
            var aErrorI = [];
            var oErrorI = [];
            var i = 0;
            var j = 0;
            var l = 0;
            var vCheck = "";

            //if (sDtLimite >= sDtAtual) {
                for (i = 0; i < oSuccess.results.length; i++) {

                    if (oSuccess.results[i].hours !== "Feriado" && oSuccess.results[i].hours !== "DSR" && oSuccess.results[i].hours !== "COMP" &&
                        oSuccess.results[i].hours !== "FOLG") {
                                                
                        var sDateErro = this.formatToDate(oSuccess.results[i].datum);
                        
                        if (sDateErro < sDtAtual) {

                            if (oSuccess.results[i].FrequencyToMsgsNav.results[0]) {

                                
                                for (j = 0; j < oSuccess.results[i].FrequencyToMsgsNav.results.length; j++) {
                                    
                                    for (l = 0; l < oPortalMsgs.results.length; l++) {

                                        if (oPortalMsgs.results[l].type === "E") {
                                            if (oSuccess.results[i].FrequencyToMsgsNav.results[j].error === oPortalMsgs.results[l].error) {
                                                oErrorI = {};
                                                oErrorI.error = oSuccess.results[i].FrequencyToMsgsNav.results[j].error;
                                                oErrorI.etext = oSuccess.results[i].FrequencyToMsgsNav.results[j].etext;
                                                aErrorI.push(oErrorI);
                                                vCheck = "X";
                                            }
                                        }
                                    }
                                }

                                if (vCheck === "X") {
                                    oDataI = {};
                                    oDataI.datum = oSuccess.results[i].datum;
                                    oDataI.hours = oSuccess.results[i].hours;
                                    oDataI.class = oSuccess.results[i].class;
                                    oDataI.marks = oSuccess.results[i].marks;
                                    oDataI.justs = oSuccess.results[i].justs;
                                    oDataI.prese = oSuccess.results[i].prese;
                                    oDataI.joacc = oSuccess.results[i].joacc;
                                    oDataI.justificativa = oSuccess.results[i].justificativa;
                                    oDataI.FrequencyToMsgsNav = aErrorI;
                                    aDataI.push(oDataI);
                                    vCheck = "";
                                    aErrorI = [];
                                }
                            }
                        }
                    }
                }

                oJson.setData(aDataI);
                this.getView().setModel(oJson, "Error");
                this.byId("IconTabFilterError").setCount(aDataI.length);

            //} else {
            //    
              //  oJson.setData(aDataI);
                //this.getView().setModel(oJson, "Error");
                //this.byId("IconTabFilterError").setCount(aDataI.length);
            //}

        },

        onPressAction: function (evt) {
            this.Busy = new sap.m.BusyDialog({
                busyIndicatorDelay: 0
            });
            this.Busy.open();
            var vClass = "";
            var oPressedItem = this.getView().getModel("frequency").getProperty(evt.getSource().getBindingContext("frequency").getPath());

            var vData = oPressedItem.datum;
            var vHours = oPressedItem.hours;

            if (oPressedItem.class) {
                vClass = oPressedItem.class;
            } else {
                vClass = "0";
            }
            
            var dt = this.byId("idDpAll").getValue().substr(6, 4) + this.byId("idDpAll").getValue().substr(3, 2);
            var oRouter = new UIComponent.getRouterFor(this);
            oRouter.navTo("Maintenance", {
                datum: vData.toISOString(),
                pernr: sPernr,
                orgeh: sOrgeh,
                hours: vHours,
                classe: vClass,
                marks: 0,
                justs: 0,
                joacc: 0,
                error1: 0,
                etext1: 0,
                error2: 0,
                etext2: 0,
                screen: "All",
                period: dt
            });

            this.Busy.close();

        },

        onCloseMasterPress: function (evt) {
            var that = this;

            function sizeChanged(mParams) {
                switch (mParams.name) {
                    case "Phone":
                        that.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
                        that.getModel("appView").setProperty("/layout", "OneColumn");
                        break;
                    case "Tablet":
                        that.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
                        that.getModel("appView").setProperty("/layout", "OneColumn");
                        break;
                    case "Desktop":
                        var vFullSreen = that.getModel("appView").getData().layout;
                        if (vFullSreen === "TwoColumnsMidExpanded") {
                            that._setLayout("Full");
                        } else {
                            that._setLayout("Two");
                        }
                }
            }

            // Register an event handler to changes of the screen size
            // sap.ui.Device.media.attachHandler(sizeChanged, null, sap.ui.Device.media.RANGESETS.SAP_STANDARD);
            // Do some initialization work based on the current size
            sizeChanged(sap.ui.Device.media.getCurrentRange(sap.ui.Device.media.RANGESETS.SAP_STANDARD));
        },

        onPressJustificativa: function (evt) {

            let sDataLimite = new Date(this.getView().byId("idTextDtLimiteError").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteError").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteError").getText().substr(37, 4));
            let sDataAtual = new Date();

            let sDtLimite = this.formatToDate(sDataLimite);
            let sDtAtual = this.formatToDate(sDataAtual);
            
            if (sDtAtual > sDtLimite)
            {
                MessageToast.show("Período fora da Data Limite para Atualização");
                return;
            }

            var oPressedItem = this.getView().getModel("Pendt").getProperty(evt.getSource().getBindingContext("Pendt").getPath());
            var marcacoesModel = this.getView().getModel("Marcacoes");
            var oButton = evt.getSource(),
                oView = this.getView();

            var that = this;
            var vCheckMarks = "";
            var vTextError = "";

            var sdData = this.formatToDate(oPressedItem.datum) + 'T00:00:00';

            // Não funciona mais. Filters e Expand são enviados como parâmetro no urlParameters
            // var sURL = "/justifSet/?$filter=data eq datetime'" + sdData + "' and pernr eq '" + sPernr + "'";
            var sURL = "/justifSet";
            var value = sURL;
            var oJson = new sap.ui.model.json.JSONModel();
            oOData.read(value, {
                urlParameters: {
                    "$filter": `data eq datetime'${sdData}' and pernr eq '${sPernr}'`
                },
                success: function (oSuccess) {
                    if (oSuccess) {
                        oJson.setData(oSuccess);
                        that.getView().setModel(oJson, "Justifica");

                        if (!that._pDialog) {
                            that._pDialog = Fragment.load({
                                id: oView.getId(),
                                name: "hr.manutencaodepontorh.view.fragments.Dialog",
                                controller: that
                            }).then(function (oDialog) {
                                oView.addDependent(oDialog);
                                return oDialog;
                            });
                        }

                        that._pDialog.then(function (oDialog) {
                            oDialog.open();
                        }.bind(that));
                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });

        },

        onPressAprovar: function (evt) {

            let sDataLimite = new Date(this.getView().byId("idTextDtLimiteError").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteError").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteError").getText().substr(37, 4));
            let sDataAtual = new Date();

            let sDtLimite = this.formatToDate(sDataLimite);
            let sDtAtual = this.formatToDate(sDataAtual);
            
            if (sDtAtual > sDtLimite)
            {
                MessageToast.show("Período fora da Data Limite para Atualização");
                return;
            }

            var gvInterjornada = "";
            var sDtAprov = this.getView().getModel("Pendt").getProperty(evt.getSource().getBindingContext("Pendt").getPath()).datum;

            for (var i = 0; i < this.getView().getModel("frequency").getData().results.length; i++) {
                if (this.getView().getModel("frequency").getData().results[i].datum === sDtAprov) {
                    for (var l = 0; l < this.getView().getModel("frequency").getData().results[i].FrequencyToMsgsNav.results.length; l++) {
                        if (this.getView().getModel("frequency").getData().results[i].FrequencyToMsgsNav.results[l].error === "06") {
                            gvInterjornada = this.getView().getModel("frequency").getData().results[i].FrequencyToMsgsNav.results[l].error;
                        }
                    }
                }
            }

            var oEntry = this.getView().getModel("Pendt").getProperty(evt.getSource().getBindingContext("Pendt").getPath());
            oEntry.pernr = this.getView().getModel("frequency").getData().results[0].pernr;
            oEntry.acao = "Aprov";
            if (gvInterjornada === "06") {
                this.openDialogToConfirm("Período interjornada não respeitado. Deseja realmente aprovar?", oEntry);
            } else {
                this.openDialogToConfirm("Tem certeza que deseja Aprovar?", oEntry);
            }
        },

        onPressReprovar: function (evt) {

            let sDataLimite = new Date(this.getView().byId("idTextDtLimiteError").getText().substr(34, 2) + "." + this.getView().byId(
                "idTextDtLimiteError").getText().substr(31, 2) + "." + this.getView().byId("idTextDtLimiteError").getText().substr(37, 4));
            let sDataAtual = new Date();

            let sDtLimite = this.formatToDate(sDataLimite);
            let sDtAtual = this.formatToDate(sDataAtual);
            
            if (sDtAtual > sDtLimite)
            {
                MessageToast.show("Período fora da Data Limite para Atualização");
                return;
            }

            var oEntry = this.getView().getModel("Pendt").getProperty(evt.getSource().getBindingContext("Pendt").getPath());
            oEntry.pernr = this.getView().getModel("frequency").getData().results[0].pernr;
            oEntry.acao = "Reprov";
            this.openDialogToConfirmRep("Tem certeza que deseja Reprovar?", oEntry);
        },

        execAprovReprov: function (oEntry) {

            var that = this;
            var value = "/aprovReprovSet";
            var postData = {
                data: oEntry.datum,
                pernr: oEntry.pernr,
                hours: oEntry.hours,
                marks: oEntry.marks,
                justs: oEntry.justs,
                prese: oEntry.prese,
                acao: oEntry.acao,
                respjustificativa: oEntry.respjustificativa
            };

            var sSelectedPeriod = this.byId("idDpAll").getValue();
            var sPeriod;

            if (sSelectedPeriod.length === 7) {
                sPeriod = sSelectedPeriod.substr(3, 4) + sSelectedPeriod.substr(0, 2);
            } else {
                sPeriod = sSelectedPeriod.substr(6, 4) + sSelectedPeriod.substr(3, 2);
            }

            this.getView().getModel().create(value, postData, {
                success: function (Success) {

                    that.utilLoadEntity(sPeriod, sPernr);
                    that.loadHistory(sPeriod, sPernr);

                    if (Success.acao === "Aprov") {
                        MessageToast.show("Aprovação realizada com sucesso!");
                    } else if (Success.acao === "Reprov") {
                        MessageToast.show("Reprovação realizada com sucesso!");
                    }

                },
                error: function (Error) {
                    var message1 = "Erro ao inserir Abono!";
                    var obj = "";
                    var message = "";
                    try {
                        if (Error.responseText) {
                            obj = JSON.parse(Error.responseText);
                            message = obj.error.message.value;
                        } else if (Error.response.body) {
                            var errorModel = new sap.ui.model.xml.XMLModel();
                            errorModel.setXML(Error.response.body);
                            if (errorModel.getProperty("/0/message") !== "") {
                                Error = errorModel.getProperty("/0/message");
                            } else {
                                message = message1;
                            }
                        } else {
                            message = message1;
                        }
                    } catch (error) {
                        message = message1;
                    }
                    MessageToast.show(message, {
                        duration: 5000,
                        animationDuration: 1000
                    });
                }
            });
        },

        openDialogToConfirm: function (text, oEntry) {
            var that = this;
            new Dialog({
                id: "IdDialogToConfirm",
                title: "Confirmação",
                type: "Message",
                state: "Warning",
                content: new sap.m.Text({
                    text: text
                }),
                beginButton: new Button({
                    type: sap.m.ButtonType.Emphasized,
                    text: "Sim",
                    press: function (oEvent) {
                        that.execAprovReprov(oEntry);
                        oEvent.getSource().getParent().close();
                    }
                }),
                endButton: new Button({
                    text: "Não, voltar",
                    press: function (oEvent) {
                        oEvent.getSource().getParent().close();
                    }
                }),
                afterClose: function (oEvent) {
                    oEvent.getSource().destroy();
                }
            }).open();
        },

        openDialogToConfirmRep: function (text, oEntry) {
            var that = this;
            new Dialog({
                id: "IdDialogToConfirm",
                title: "Confirmação",
                type: "Message",
                state: "Warning",
                content: [new sap.m.Text({
                    text: text
                }), new TextArea('rejectDialogTextarea', {
                    width: '100%',
                    placeholder: 'Justificativa'
                })
                ],
                beginButton: new Button({
                    type: sap.m.ButtonType.Emphasized,
                    text: "Sim",
                    press: function (oEvent) {

                        oEntry.respjustificativa = sap.ui.getCore().byId('rejectDialogTextarea').getValue();
                        that.execAprovReprov(oEntry);
                        oEvent.getSource().getParent().close();
                    }
                }),
                endButton: new Button({
                    text: "Não, voltar",
                    press: function (oEvent) {
                        oEvent.getSource().getParent().close();
                    }
                }),
                afterClose: function (oEvent) {
                    oEvent.getSource().destroy();
                }
            }).open();
        },

        openDialogToError: function (text) {
            new Dialog({
                id: "IdDialogToError",
                title: "Erro",
                type: "Message",
                state: "Error",
                content: new sap.m.Text({
                    text: text
                }),
                endButton: new Button({
                    text: "OK",
                    press: function (oEvent) {
                        oEvent.getSource().getParent().close();
                    }
                }),
                afterClose: function (oEvent) {
                    oEvent.getSource().destroy();
                }
            }).open();
        },

        // onBeforeRendering: function () { },

        // onAfterRendering: function () { }

    });
});