sap.ui.define([], function () {
    "use strict";

    return {
        _statusStateMap: {
            "P": "Success",
            "N": "Warning"
        },

        statusText: function (value) {
            var bundle = this.getModel("i18n").getResourceBundle();
            return bundle.getText("StatusText" + value, "?");
        },

        statusState: function (value) {
            var map = util.Formatter._statusStateMap;
            return (value && map[value]) ? map[value] : "None";
        },

        date: function (value) {
            if (value) {
                //var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "dd.MM.yyyy"});
                //return oDateFormat.format(new Date(value.toISOString()));
                return value.toISOString().substr(8, 2) + "." + value.toISOString().substr(5, 2) + "." + value.toISOString().substr(0, 4);
            } else {
                return "";
            }
        },

        quantity: function (value) {
            try {
                return (value) ? parseFloat(value).toFixed(0) : value;
            } catch (err) {
                return "Not-A-Number";
            }
        }

    };

});

// jQuery.sap.declare("hr.manutencaodepontorh.webapp.util.Formatter");

// jQuery.sap.require("sap.ui.core.format.DateFormat");

// hr.manutencaodepontorh.webapp.util.Formatter = {

//     _statusStateMap: {
//         "P": "Success",
//         "N": "Warning"
//     },

//     statusText: function (value) {
//         var bundle = this.getModel("i18n").getResourceBundle();
//         return bundle.getText("StatusText" + value, "?");
//     },

//     statusState: function (value) {
//         var map = util.Formatter._statusStateMap;
//         return (value && map[value]) ? map[value] : "None";
//     },

//     date: function (value) {
//         if (value) {
//             //var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "dd.MM.yyyy"});
//             //return oDateFormat.format(new Date(value.toISOString()));
//             return value.toISOString().substr(8, 2) + "." + value.toISOString().substr(5, 2) + "." + value.toISOString().substr(0, 4);
//         } else {
//             return "";
//         }
//     },

//     quantity: function (value) {
//         try {
//             return (value) ? parseFloat(value).toFixed(0) : value;
//         } catch (err) {
//             return "Not-A-Number";
//         }
//     }
// };