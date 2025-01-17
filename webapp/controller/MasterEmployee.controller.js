sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/GroupHeaderListItem",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "../model/formatter",
    "sap/ui/core/routing/History"
], function (BaseController, Filter, FilterOperator, Sorter, GroupHeaderListItem, Device, Fragment, formatter, History) {
    "use strict";

    // var sServiceUrl = ("/sap/opu/odata/sap/ZMAINT_RH_POINT_SRV/");
    // var oOData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
    var oOData;
    var pendingFilter;
    var that;

    return BaseController.extend("hr.manutencaodepontorh.controller.MasterEmployee", {

        onInit: function () {
            // Step adicional em todas as apps pra funcionar essa gambiarra de acesso ao oModel no Workzone
            oOData = this.getOwnerComponent().getModel();

            var oComponent = this.getOwnerComponent();
            this._router = oComponent.getRouter();

            var oList = this.byId("list"),
                iOriginalBusyDelay = oList.getBusyIndicatorDelay();
           
            this._router.getTarget("MasterEmployee").attachDisplay(function (oEvent) {
                this.utilLoadEntity(oEvent.getParameter("data").orgeh);
            }, this);           

            this._oGroupFunctions = {
                CategoryID: function (oContext) {
                    var iNumber = oContext.getProperty('pernr'),
                        key, text;
                    if (iNumber <= 20) {
                        key = "LE20";
                        text = this.getResourceBundle().getText("masterGroup1Header1");
                    } else {
                        key = "GT20";
                        text = this.getResourceBundle().getText("masterGroup1Header2");
                    }
                    return {
                        key: key,
                        text: text
                    };
                }.bind(this)
            };

            this._oList = oList;
            // keeps the filter and search state
            this._oListFilterState = {
                aFilter: [],
                aSearch: []
            };

            that = this;
            pendingFilter = false;
        },

        _onRoute: function (evt) {
            var sOrgeh = evt.getParameters().arguments.orgeh;
            this.utilLoadEntity(sOrgeh);
        },

        utilLoadEntity: function (sOrgeh) {
            var that = this;
            var sURL = "/employeesSet";
            var value = sURL;
            var oJson = new sap.ui.model.json.JSONModel();
            oOData.read(value, {
                urlParameters: {
                    "$filter": `orgeh eq '${sOrgeh}'`
                },
                success: function (oSuccess) {
                    if (oSuccess) {
                        oJson.setData(oSuccess);
                        that.getView().setModel(oJson, "Employees");
                    }

                },
                error: function (oError) {
                    console.log("Erro de odata");
                }
            });

        },

        onEmployeeItemPress: function (evt) {
            var oItem = evt.getSource();
            this._showDetails(oItem);
        },

        _showDetails: function (oItem) {
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            //var oEntry = oItem.getBindingContext().getObject();
            //var oEntry = oItem.getBindingContext("Employees").getModel().getData().results[0];
            var vPeriod = "";
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy"
            });
            var vDate = oDateFormat.format(new Date());
            // Exemplo: "202007";
            vPeriod = vDate.substr(6, 4) + vDate.substr(3, 2);
            var oEntry = oItem.getBindingContext("Employees").getProperty();
            this.getRouter().navTo("Detail", {
                pernr: oEntry.pernr,
                datum: vPeriod,
                orgeh: oEntry.orgeh
            });
        },

        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                this.onRefresh();
                return;
            }
            var sQuery = oEvent.getParameter("query");
            if (sQuery) {
                this._oListFilterState.aSearch = [new Filter("cname", FilterOperator.Contains, sQuery)];
            } else {
                this._oListFilterState.aSearch = [];
            }
            this._applyFilterSearch();
        },

        _applyFilterSearch: function () {
            var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
                oViewModel = this.getModel("masterView");
            this._oList.getBinding("items").filter(aFilters, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aFilters.length !== 0) {
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
            } else if (this._oListFilterState.aSearch.length > 0) {
                // only reset the no data text to default when no new search was triggered
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
            }
        },

        onOpenViewSettings: function (oEvent) {
            var sDialogTab = "filter";
            if (oEvent.getSource() instanceof sap.m.Button) {
                var sButtonId = oEvent.getSource().getId();
                if (sButtonId.match("sort")) {
                    sDialogTab = "sort";
                } else if (sButtonId.match("group")) {
                    sDialogTab = "group";
                }
            }
            // load asynchronous XML fragment
            if (!this.byId("viewSettingsDialogEmployee")) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "hr.manutencaodepontorh.view.ViewSettingsDialog",
                    controller: this
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    oDialog.open(sDialogTab);
                }.bind(this));
            } else {
                this.byId("viewSettingsDialogEmployee").open(sDialogTab);
            }
        },

        onConfirmViewSettingsDialog: function (oEvent) {

            var aFilterItems = oEvent.getParameters().filterItems,
                aFilters = [],
                aCaptions = [];
            if (!aFilterItems.length) {
                aFilters.push(new Filter("count", FilterOperator.NE, 0));
            } else {
                // update filter state:
                // combine the filter array and the filter string
                aFilterItems.forEach(function (oItem) {
                    switch (oItem.getKey()) {
                        case "Filter1":
                            //Não
                            aFilters.push(new Filter("count", FilterOperator.GE, 0));
                            break;
                        case "Filter2":
                            //Sim
                            aFilters.push(new Filter("count", FilterOperator.NE, 0));
                            break;
                        default:
                            aFilters.push(new Filter());
                            break;
                    }
                    aCaptions.push(oItem.getText());
                });
            }
            this._oListFilterState.aFilter = aFilters;
            this._applyFilterSearch();
        },

        _applyFilterSearch: function () {
            var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
                oViewModel = this.getModel("masterView");
            this._oList.getBinding("items").filter(aFilters, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aFilters.length !== 0) {
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
            } else if (this._oListFilterState.aSearch.length > 0) {
                // only reset the no data text to default when no new search was triggered
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
            }
        },

        onBackPress: function () {
            //this.getOwnerComponent().getRouter().navTo("MasterUnidOrg", {}, true);
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) 
                window.history.go(-1);
        },

        //onBeforeRendering: function() {
        //    alert("onBeforeRendering function called");
        //},

        //onAfterRendering: function() {
        //    alert("onAfterRendering function called");
        //},

        //	onExit: function() {
        //
        //	}

    });

});