/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"hr/manutencao_de_ponto_gestor/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
