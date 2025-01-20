sap.ui.define([
    "./BaseController",
    "../util/Formatter",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageBox"
], function (BaseController, Formatter, Dialog, Button, ButtonType, Fragment, JSONModel, MessageToast, UIComponent, History, DateFormat,
    MessageBox) {
    "use strict";

    // var sServiceUrl = ("/sap/opu/odata/sap/ZMAINT_HR_POINT_SRV/");
    // var oOData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
    var oOData;
    var sIndexEstorn = "";
    var sIndexEstornAbono = "";
    var gData = "";
    var gPernr = "";
    var gOrgeh = "";
    var gClass = "";
    var that;
    var period;

    return BaseController.extend("hr.manutencaodepontorh.controller.Maintenance", {

        onInit: function () {
            // Step adicional em todas as apps pra funcionar essa gambiarra de acesso ao oModel no Workzone
            oOData = this.getOwnerComponent().getModel();

            //this.getView().byId("idBtnConcluir").setEnabled(false);
            var oRouter = this.getRouter();
            oRouter.getRoute("Maintenance").attachMatched(this._onRoute, this);

            that = this;
        },

        onValueHelpRequest: function (oEvent) {
            var aFilter = [];
            var sEntitySet, sView;
            switch (oEvent.getSource().getId().split("--")[2]) {
                case "listInput":
                    sEntitySet = "/listAbonosSet";
                    sView = "ValueHelpDialog";
                    break;
                default:
            }
            this._readSh(sEntitySet, sView, aFilter);
        },

        _readSh: function (sEntitySet, sView, aFilter) {
            //this.getOwnerComponent().getModel().read(sEntitySet, {
            this.getView().getModel().read(sEntitySet, {
                success: function (oData, response) {
                    if (typeof this._oDialog === "undefined") {
                        this._oDialog = sap.ui.xmlfragment("hr.manutencaodepontorh.view.fragments." + sView, this);
                    } else {
                        this._oDialog.destroy();
                        this._oDialog = sap.ui.xmlfragment("hr.manutencaodepontorh.view.fragments." + sView, this);
                    }
                    switch (sView) {
                        case "ValueHelpDialog":
                            var oListModel = this.getView().getModel("list");
                            oListModel.getData().Lista = [];
                            oListModel.getData().Lista = oData.results.map(function (oObject) {
                                return oObject;
                            });
                            break;
                        default:
                    }
                    this._oDialog.setRememberSelections(false);
                    this.getView().addDependent(this._oDialog);
                    this._oDialog.open();
                }.bind(this),
                error: function (Error) { }
            });
        },

        onConfirm: function (oEvent) {
            var line;
            var aSelectedItems = oEvent.getParameter("selectedContexts");
            switch (oEvent.getSource().getId()) {
                case "idTableSelectDialogList":
                    line = this.getView().getModel("list").getData().Lista[aSelectedItems[0].sPath.split("/")[2]];
                    this.getView().getModel("data").setProperty("/awart", line.awart);
                    this.getView().getModel("data").setProperty("/atext", line.atext);
                    this.getView().getModel("data").setProperty("/art01", line.art01);
                    break;
                default:
            }

            if (line.mintg !== "1") {
                this.getView().byId("idTpAbonoDe").setEnabled(true);
                this.getView().byId("idTpAbonoAte").setEnabled(true);
                this.getView().byId("idCbAbono").setEnabled(true);
                this.getView().byId("idCbAbono").setSelected(false);

            } else {
                this.getView().byId("idTpAbonoDe").setEnabled(false);
                this.getView().byId("idTpAbonoAte").setEnabled(false);
                this.getView().byId("idCbAbono").setEnabled(false);
                this.getView().byId("idCbAbono").setSelected(true);
            }

        },

        onSearch: function (oEvent) {
            var sField;
            switch (oEvent.getSource().getId()) {
                case "idTableSelectDialogList":
                    sField = "atext";
                    break;
                default:
            }
            var sValue = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter(sField, sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter(oFilter, "Application");
        },

        _onRoute: function (evt) {
            this._setLayout("Full");
            if (evt.getParameters().arguments.screen === "All") {
                this.getView().byId("idPanelAbono").setVisible(false);
            } else {
                this.getView().byId("idPanelAbono").setVisible(true);
            }
            this.getView().byId("idTpMarcacoes").setValue("");
            this.getView().byId("idJustificativa").setValue("");
            this.getView().byId("idTpAbonoDe").setValue("");
            this.getView().byId("idTpAbonoAte").setValue("");
            var sData = evt.getParameters().arguments.datum;
            gOrgeh = evt.getParameters().arguments.orgeh;
            gPernr = evt.getParameters().arguments.pernr;
            gClass = evt.getParameters().arguments.classe;
            this.getView().byId("idObjStatDt").setText(sData.substr(8, 2) + "." + sData.substr(5, 2) + "." + sData.substr(0, 4));
            this.getView().byId("idObjStatHd").setText(evt.getParameters().arguments.hours);
            this.utilLoadEntity(sData, gPernr);
            var oListModel = new JSONModel({
                Lista: []
            });
            this.getView().setModel(oListModel, "list");

            that.period = evt.getParameters().arguments.period;

        },

        utilLoadEntity: function (data, matricula) {
            var that = this;
            var vCheckMarks = "";
            var vTextError = "";

            // Não funciona mais. Filters e Expand são enviados como parâmetro no urlParameters
            // var sURL = "/marcacoesSet/?$filter=data eq datetime'" + data.substr(0, 19) + "' and pernr eq '" + matricula + "'";
            var sURL = "/marcacoesSet";
            var value = sURL;
            var oJson = new sap.ui.model.json.JSONModel();
            oOData.read(value, {
                urlParameters: {
                    "$filter": `data eq datetime'${data.substr(0, 19)}' and pernr eq '${matricula}'`
                },
                success: function (oSuccess) {
                    if (oSuccess) {
                        oJson.setData(oSuccess);
                        that.getView().setModel(oJson, "Marcacoes");

                        console.log(oSuccess);

                        if (oSuccess.results[0].jornadaCumprir !== "0" && oSuccess.results[0].jornadaCumprir !== "0:00") {
                            that.getView().byId("idObjStatJoCumprir").setText(oSuccess.results[0].jornadaCumprir);
                        } else {
                            that.getView().byId("idObjStatJoCumprir").setText("0:00");
                        }

                        if (oSuccess.results[0].jornada !== "0" && oSuccess.results[0].jornada !== "0:00") {
                            that.getView().byId("idObjStatJo").setText(oSuccess.results[0].jornada);
                        } else {
                            that.getView().byId("idObjStatJo").setText("0:00");
                        }

                        if (oSuccess.results[0].msg2 !== "") {
                            vTextError = "'" + oSuccess.results[0].msg1 + "', '" + oSuccess.results[0].msg2 + "'";
                            that.getView().byId("idObjStatError").setText(vTextError);
                            if (oSuccess.results[0].msg1 === "Saída antecipada" || oSuccess.results[0].msg1 === "Atraso na entrada" || oSuccess.results[
                                0].msg1 === "Ausência intrajornada") {
                                vCheckMarks = "X";
                            }

                            if (oSuccess.results[0].msg2 === "Saída antecipada" || oSuccess.results[0].msg2 === "Atraso na entrada" || oSuccess.results[
                                0].msg1 === "Ausência intrajornada") {
                                vCheckMarks = "X";
                            } else {
                                vCheckMarks = "";
                            }
                        } else {
                            if (oSuccess.results[0].msg1 !== "") {
                                vTextError = "'" + oSuccess.results[0].msg1 + "'";
                                that.getView().byId("idObjStatError").setText(vTextError);
                            } else {
                                that.getView().byId("idObjStatError").setText("");
                            }
                            if (oSuccess.results[0].msg1 === "Saída antecipada" || oSuccess.results[0].msg1 === "Atraso na entrada" || oSuccess.results[
                                0].msg1 === "Ausência intrajornada") {
                                vCheckMarks = "X";
                            }
                        }

                        if (vCheckMarks === "X") {
                            if (gClass !== "4" && gClass !== "6") {
                                that.getView().byId("idTpMarcacoes").setEnabled(false);
                                that.getView().byId("idJustificativa").setEnabled(false);
                                that.getView().byId("idBtnMarcacoes").setEnabled(false);
                                that.getView().byId("idBtnEstornoM").setVisible(false);
                            } else {
                                that.getView().byId("idTpMarcacoes").setEnabled(true);
                                that.getView().byId("idJustificativa").setEnabled(true);
                                that.getView().byId("idBtnMarcacoes").setEnabled(true);
                                that.getView().byId("idBtnEstornoM").setEnabled(true);
                            }
                        } else {
                            that.getView().byId("idTpMarcacoes").setEnabled(true);
                            that.getView().byId("idJustificativa").setEnabled(true);
                            that.getView().byId("idBtnMarcacoes").setEnabled(true);
                            that.getView().byId("idBtnEstornoM").setEnabled(true);
                        }

                        that.getView().byId("idBtnConcluir").setEnabled(false);

                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });

            // Não funciona mais. Filters e Expand são enviados como parâmetro no urlParameters
            // var sURLAbono = "/abonoSet/?$filter=data eq datetime'" + data.substr(0, 19) + "' and pernr eq '" + matricula + "'";
            var sURLAbono = "/abonoSet";
            var valueAbono = sURLAbono;
            var oJsonAbono = new sap.ui.model.json.JSONModel();
            oOData.read(valueAbono, {
                urlParameters: {
                    "$filter": `data eq datetime'${data.substr(0, 19)}' and pernr eq '${matricula}'`
                },
                success: function (oSuccess) {
                    if (oSuccess) {
                        oJsonAbono.setData(oSuccess);
                        that.getView().setModel(oJsonAbono, "Abono");
                    }
                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });
        },

        formatToDate: function (date) {
            var newDate = DateFormat.getDateTimeInstance({
                pattern: "yyyy-MM-dd",
                //pattern: "PTHH'H'mm'M'ss'S'",
                UTC: true
            }).format(date);
            return newDate;
        },

        onCriarMarcacoes: function (evt) {
            this.getView().byId("idTpMarcacoes").getValue();
            this.getView().byId("idJustificativa").getValue();
            this.openDialogToConfirm("Tem certeza que deseja inserir as marcações?", "I"); //("Tem certeza que deseja salvar as marcações?", "I");
        },

        onCriarMarcacoesConcl: function (evt) {

            var that = this;

            new Dialog({
                id: "IdDialogToConfirm",
                title: "Confirmação",
                type: "Message",
                state: "Warning",
                content: new sap.m.Text({
                    text: "Tem certeza que deseja salvar as marcações?"
                }),
                beginButton: new Button({
                    type: sap.m.ButtonType.Emphasized,
                    text: "Sim",
                    press: function (oEvent) {
                        oEvent.getSource().getParent().close();

                        var value = that._sPath;
                        var oTpMarks = that.getView().byId("idTpMarcacoes").getValue();
                        var oJust = that.getView().byId("idJustificativa").getValue();
                        var sData = that.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" + that.getView().byId("idObjStatDt").getText().substr(
                            3,
                            2) + "-" + that.getView().byId("idObjStatDt").getText().substr(0, 2) + "T00:00:00";

                        var postData = {
                            data: sData,
                            pernr: gPernr,
                            marcacoesSet: [],
                            NAVRESULT: []
                        };

                        var lv_srvRequest = {};

                        var marcacoesModel = that.getView().getModel("Marcacoes");

                        var vLength = marcacoesModel.oData.results.length;

                        var resto = vLength % 2;

                        var postData2 = {};

                        var sdData,
                            sdData2,
                            sdData3;

                        for (var i = 0; i < marcacoesModel.oData.results.length; i++) {

                            sdData3 = marcacoesModel.oData.results[i].data;

                            try {
                                sdData = that.formatToDate(marcacoesModel.oData.results[i].data);
                            } catch (err) {
                                sdData3 = marcacoesModel.oData.results[i].data;
                            }

                            if (sdData === "") {
                                sdData2 = sdData3;
                            } else if (sdData === undefined) {
                                sdData2 = sdData3;
                            } else {
                                sdData2 = sdData + "T00:00:00";
                            }

                            postData2 = {
                                data: sdData2,
                                pernr: marcacoesModel.oData.results[i].pernr,
                                marks: marcacoesModel.oData.results[i].marks,
                                motiv: marcacoesModel.oData.results[i].motiv,
                                origem: marcacoesModel.oData.results[i].origem,
                                justificativa: marcacoesModel.oData.results[i].justificativa
                            };

                            postData.marcacoesSet.push(postData2);
                            postData2 = {};

                        }

                        //if (resto != 0) {
                        //    MessageBox.error("Apontamento tem que ser par");
                        //} else {

                            oOData.create("/MarcaSet", postData, {

                                success: function (oData, oResponse) {
                                    var sdData5 = that.formatToDate(oData.data);
                                    sdData5 = sdData5 + "T00:00:00";
                                    that.utilLoadEntity(sdData5, gPernr);
                                    that.getView().byId("idTpMarcacoes").setValue("");
                                    that.getView().byId("idJustificativa").setValue("");

                                    MessageToast.show("Marcação feita com sucesso!");
                                },
                                error: function (Error) {
                                    
                                    var message1 = "Erro ao inserir Marcação!";
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
                        //}
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

        onPressEstorno: function (evt) {
            //sIndexEstorn = evt.getParameters().id;
            sIndexEstorn = evt.getSource()._getPropertiesToPropagate().oBindingContexts.Marcacoes.getPath().split("/")[2];
            this.openDialogToConfirm("Tem certeza que deseja estornar a marcação?", "E");
        },

        onValidation: function (sValidConflito, control) {
            if (sValidConflito.reaction === "W") {
                control.openDialogToConfirm("Já existe lançamento no mesmo período. Deseja inserir mesmo assim?", "IA");
            } else {
                control.openDialogToConfirm("Tem certeza que deseja salvar?", "IA");
            }
        },

        onCriarAbono: function (evt) {
            this._validConflito(this.onValidation);
        },

        onPressEstornoAbono: function (evt) {
            //sIndexEstornAbono = evt.getParameters().id;
            sIndexEstornAbono = evt.getSource()._getPropertiesToPropagate().oBindingContexts.Abono.getPath().split("/")[2];
            this.openDialogToConfirm("Tem certeza que deseja estornar o Abono?", "EA");
        },

        openDialogToConfirm: function (text, sPath, index) {
            var that = this;
            if (sPath === "I") {
                this._sPath = "/marcacoesSet";
            }

            if (sPath === "E") {
                this._sPath = "/estornoMarcacoesSet";
            }

            if (sPath === "IA") {
                this._sPath = "/abonoSet";
            }

            if (sPath === "EA") {
                this._sPath = "/estornoAbonoSet";
            }

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

                        if (sPath === "I") {
                            that.execSalvaMarcacoes();
                        }

                        if (sPath === "E") {

                            that.execEstornoMarcacoes(index);
                        }

                        if (sPath === "IA") {
                            that.execSalvaAbono();
                        }

                        if (sPath === "EA") {
                            that.execEstornoAbono();
                        }

                        oEvent.getSource().getParent().close();
                    }
                    /*					press: [
                                            this.execSalvaMarcacoes,
                                            this
                                        ]*/
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
                title: "Mensagem de erro",
                type: "Message",
                state: "Error",
                content: new sap.m.Text({
                    text: text
                }),
                endButton: new Button({
                    text: "Cancelar",
                    press: function (oEvent) {
                        oEvent.getSource().getParent().close();
                    }
                }),
                afterClose: function (oEvent) {
                    oEvent.getSource().destroy();
                }
            }).open();
        },

        execSalvaMarcacoes: function () {

            this.getView().byId("idBtnConcluir").setEnabled(false);

            var that = this;
            var value = this._sPath;
            var oJson = new sap.ui.model.json.JSONModel();
            var oTpMarks = this.getView().byId("idTpMarcacoes").getValue();
            var oJust = this.getView().byId("idJustificativa").getValue();
            var sData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" + this.getView().byId("idObjStatDt").getText().substr(3,
                2) + "-" + this.getView().byId("idObjStatDt").getText().substr(0, 2) + "T00:00:00";

            var aDataI = {
                results: []
            };
            var oDataI = {};
            var oDataI2 = {};

            var marcacoes = this.getView().getModel("Marcacoes");

            var postData = {
                data: sData,
                pernr: gPernr,
                marks: oTpMarks,
                motiv: "0002",
                origem: "Manual",
                justificativa: oJust
            };

            if (!marcacoes) {

                oDataI2.data = postData.data;
                oDataI2.pernr = postData.pernr;
                oDataI2.marks = postData.marks;
                oDataI2.motiv = postData.motiv;
                oDataI2.origem = postData.origem;
                oDataI2.justificativa = postData.justificativa;

                aDataI.results.push(oDataI2);

                oJson.setData(aDataI);
                this.getView().setModel(oJson, "Marcacoes");

                this.getView().byId("idBtnConcluir").setEnabled(true);
                this.getView().byId("idTpMarcacoes").setValue("");
                this.getView().byId("idJustificativa").setValue("");

            } else {
                var aDataE = marcacoes.getData();

                for (var i = 0; i < aDataE.results.length; i++) {

                    if (aDataE.results[i].marks != "") {

                        oDataI.data = aDataE.results[i].data;
                        oDataI.pernr = aDataE.results[i].pernr;
                        oDataI.marks = aDataE.results[i].marks;
                        oDataI.motiv = aDataE.results[i].motiv;
                        oDataI.origem = aDataE.results[i].origem;
                        oDataI.justificativa = aDataE.results[i].justificativa;

                        aDataI.results.push(oDataI);
                        oDataI = {};

                    }

                }

                oDataI2.data = postData.data;
                oDataI2.pernr = postData.pernr;
                oDataI2.marks = postData.marks;
                oDataI2.motiv = postData.motiv;
                oDataI2.origem = postData.origem;
                oDataI2.justificativa = postData.justificativa;

                aDataI.results.push(oDataI2);

                oJson.setData(aDataI);
                this.getView().setModel(oJson, "Marcacoes");

                this.getView().byId("idBtnConcluir").setEnabled(true);
                this.getView().byId("idTpMarcacoes").setValue("");
                this.getView().byId("idJustificativa").setValue("");

            }

            /*
            var that = this;
            var value = this._sPath;
            var oTpMarks = this.getView().byId("idTpMarcacoes").getValue();
            var oJust = this.getView().byId("idJustificativa").getValue();
            var sData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" + this.getView().byId("idObjStatDt").getText().substr(3,
                2) + "-" + this.getView().byId("idObjStatDt").getText().substr(0, 2) + "T00:00:00";

            var postData = {
                data: sData,
                pernr: gPernr,
                marks: oTpMarks,
                motiv: "0002",
                origem: "Manual",
                justificativa: oJust
            };

            if (oTpMarks === "") {
                this.openDialogToError("Não existe marcação selecionada, Por favor verificar!");
                return;
            }

            this.getView().getModel().create(value, postData, {
                success: function (Success) {
                    var sdData = that.formatToDate(Success.data);
                    sdData = sdData + "T00:00:00";
                    that.utilLoadEntity(sdData, gPernr);
                    that.getView().byId("idTpMarcacoes").setValue("");
                    that.getView().byId("idJustificativa").setValue("");
                    MessageToast.show("Marcação feita com sucesso!");
                },
                error: function (Error) {
                    var message1 = "Erro ao inserir Marcação!";
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
            });*/

        },

        execEstornoMarcacoes: function (evt) {
            var that = this;
            var value = this._sPath;
            var oTable = this.getView().byId("idTableMarks");
            var oItems = oTable.getItems();
            var index = sIndexEstorn;
            var sMarks = oItems[index].getCells()[0].getNumber().substr(0, 2) + oItems[index].getCells()[0].getNumber().substr(3, 2) + "00";
            var sMotiv = oItems[index].getCells()[1].getNumber();
            var sOrigem = oItems[index].getCells()[2].getNumber();
            var sData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + this.getView().byId("idObjStatDt").getText().substr(3, 2) +
                this.getView().byId("idObjStatDt").getText().substr(0, 2);
            gData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" + this.getView().byId("idObjStatDt").getText().substr(3, 2) +
                "-" + this.getView().byId("idObjStatDt").getText().substr(0, 2) + "T00:00:00";
            var oData = {
                data: sData,
                pernr: gPernr,
                marks: sMarks,
                motiv: sMotiv,
                origem: sOrigem,
                estorn: "X"
            };

            oOData.create(value, oData, {
                success: function (Success) {
                    that.utilLoadEntity(gData, gPernr);
                    sap.m.MessageToast.show("Estorno realizado com Sucesso!", {
                        duration: 3000,
                        animationDuration: 1000
                    });
                },
                error: function (Error) {
                    var message1 = "Erro ao estornar Marcação!";
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

        
        _validConflito: function (functionCallBack) {
			var that = this;

			var sData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" +
				this.getView().byId("idObjStatDt").getText().substr(3, 2) + "-" + this.getView().byId("idObjStatDt").getText().substr(0, 2) +
				"T00:00:00";
            
            

			var sCodAbono = this.getView().getModel("data").getData().awart;
			if (typeof (sCodAbono) === "undefined" || sCodAbono === null) {
				this.openDialogToError("Não existe justificativa selecionada, Por favor verificar!");
				return;
			}
			var sPeriodoDe = this.getView().byId("idTpAbonoDe").getValue();
			var sPeriodoAte = this.getView().byId("idTpAbonoAte").getValue();
			var sTpPreAus = this.getView().getModel("data").getData().art01;

            /*
			var value = "/AbonoValidarConflitoSet(data=datetime'" + sData + "'," + "codAbono='" + sCodAbono + "'," + "tpPreAus='" + sTpPreAus +
				"'," + "periodoDe='" + sPeriodoDe + "'," + "periodoAte='" + sPeriodoAte + "')";
			
            value = value.replace(/:/g, '%3A');
            */

            var value = this.getModel().createKey("/AbonoValidarConflitoSet", {
                data: sData,
                codAbono: sCodAbono,
                tpPreAus: sTpPreAus,
                periodoDe: sPeriodoDe,
                periodoAte: sPeriodoAte,
                pernr: gPernr
            });

			oOData.read(value, {
				success: function (Success) {
					if (functionCallBack) {
						functionCallBack(Success, that);
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
        
        execSalvaAbono: function () {

            
            var that = this;
            var value = this._sPath;

            console.log("data1", this.getView().byId("idObjStatDt").getText());

            var sData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" + this.getView().byId("idObjStatDt").getText().substr(3,
                2) + "-" + this.getView().byId("idObjStatDt").getText().substr(0, 2) + "T00:00:00";
            var sCodAbono = this.getView().getModel("data").getData().awart;
            var sTpPreAus = this.getView().getModel("data").getData().art01;
            var sPeriodoDe = this.getView().byId("idTpAbonoDe").getValue();
            var sPeriodoAte = this.getView().byId("idTpAbonoAte").getValue();
            var sJustificativa = this.getView().byId("idJustificativa2").getValue();

            var postData = {
                data: sData,
                pernr: gPernr,
                codAbono: sCodAbono,
                tpPreAus: sTpPreAus,
                periodoDe: sPeriodoDe,
                periodoAte: sPeriodoAte,
                origem: "M",
                justificativa: sJustificativa
            };

            if (typeof (sCodAbono) === "undefined" || sCodAbono === null) {
                this.openDialogToError("Não existe justificativa selecionada, Por favor verificar!");
                return;
            }

            this.getView().getModel().create(value, postData, {
                success: function (Success) {

                    that.utilLoadEntity(Success.data.toISOString(), gPernr);
                    that.getView().byId("listInput").setValue("");
                    that.getView().byId("idCbAbono").setSelected(false);
                    that.getView().byId("idTpAbonoDe").setValue("");
                    that.getView().byId("idTpAbonoAte").setValue("");
                    that.getView().byId("idJustificativa2").setValue("");
                    MessageToast.show("Abono realizado com sucesso!");
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

        execEstornoAbono: function () {
            var sPeriodode = "";
            var sPeriodoate = "";
            var that = this;
            var value = this._sPath;
            var oTable = this.getView().byId("idTableAbono");
            var oItems = oTable.getItems();
            var index = sIndexEstornAbono;

            var sData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + "-" + this.getView().byId("idObjStatDt").getText().substr(3,
                2) + "-" + this.getView().byId("idObjStatDt").getText().substr(0, 2) + "T00:00:00";
            gData = sData;
            //var sCodAbono = this.getView().getModel("data").getData().awart;
            //var sCodAbono = oItems[index].getCells()[0].getNumber();
            var sCodAbono = this.getView().getModel("Abono").getData().results[index].codAbono;
            var sTpPreAus = oItems[index].getCells()[1].getNumber();

            if (oItems[index].getCells()[2].getNumber().substr(0, 8) !== "Integral") {
                sPeriodode = oItems[index].getCells()[2].getNumber().substr(0, 5);
                sPeriodoate = oItems[index].getCells()[2].getNumber().substr(6, 5);
            }

            var sOrigem = oItems[index].getCells()[3].getNumber();

            //value = "/estornoAbonoSet(data=datetime'" + sData + "')";

            var postData = {
                data: sData,
                pernr: gPernr,
                codAbono: sCodAbono,
                tpPreAus: sTpPreAus,
                periodode: sPeriodode,
                periodoate: sPeriodoate,
                origem: sOrigem,
                estorno: "X"
            };

            oOData.create(value, postData, {
                success: function (Success, response) {
                    that.utilLoadEntity(gData, gPernr);
                    sap.m.MessageToast.show("Estorno realizado com Sucesso!", {
                        duration: 3000,
                        animationDuration: 1000
                    });
                },
                error: function (Error) {
                    var message1 = "Erro ao estornar Abono!";
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
                    MessageToast.show(message, {
                        duration: 5000,
                        animationDuration: 1000
                    });
                }
            });
        },

        onCbFlag: function (evt) {
            if (evt.getSource().getSelected() === true) {
                this.getView().byId("idTpAbonoDe").setEnabled(false);
                this.getView().byId("idTpAbonoAte").setEnabled(false);
            } else {
                this.getView().byId("idTpAbonoDe").setEnabled(true);
                this.getView().byId("idTpAbonoAte").setEnabled(true);
            }
        },

        onNavBack: function (evt) {

            //history.go(-1);
            if(!that.period)
                var vData = this.getView().byId("idObjStatDt").getText().substr(6, 4) + this.getView().byId("idObjStatDt").getText().substr(3, 2);
            else
                vData = that.period;
            //var oRouter = this.getRouter();
            
            this._setLayout("Full");
            this.getRouter().navTo("Detail", {
                pernr: gPernr,
                datum: vData,
                orgeh: gOrgeh
            });
        }

    });

});