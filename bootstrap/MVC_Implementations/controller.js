function controller(){
	controllerBase.call(this);
}
controller.prototype = Object.create(controllerBase.prototype);
controller.prototype.constructor = controller;
controller.prototype.switchTab2 = function(){
		if(this.model.inputData.length > 3000){
			// alert("sample too large to analyse, use data with less rows");
			alert("sample very large, performance may be impacted");
			// return;
		}
		controllerBase.prototype.switchTab2.apply(this);
	}
var oneMeanButton;
var twoMeanButton;
var dataScreen = null;
var mainControl = null;
window.onload = function(){
	//loadMain();
	//loadData();
	mainControl = new controller();
};