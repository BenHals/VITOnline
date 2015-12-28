function view(controller){

	this.dataScreen = null;
	this.controller = controller;

	this.visPreveiw = function(disp){
		d3.select("#visControls").remove();
		d3.select("#startButton").style("background-color","#094b85");
	}
	this.leaveVis = function(){
		d3.select("#visControls").remove();
	}
	this.setUpTab2 = function(){
		var tab2Top = d3.select("#tab2Top");
		tab2Top.selectAll("*").remove();
		tab2Top.append("input").attr("type","button").attr("value","< Back").attr("class","bluebutton").attr("id","backTab2").attr("disabled",null).attr("onClick","mainControl.switchTab1()")
			.style("height","15%");
		tab2Top.append("label").text("Sample Size");
		tab2Top.append("input").attr("type","text").attr("value","20").attr("id","sampsize");

		tab2Top.append("label").text("Statistic");
		tab2Top.append("select").attr("id","statSelect").append("option").text("Select variable");
		var SSize = document.getElementById("sampsize");
		SSize.onchange = function(e){
			controller.startVisPreveiw();
		}
		var SS = document.getElementById("statSelect");
		SS.onchange = function(e){
			controller.statChanged(e);
		}
		tab2Top.append("input").attr("type","button").attr("value","Calculate").attr("class","bluebutton").attr("id","Calculate").attr("disabled",null).attr("onClick","mainControl.startVisPressed()")
			.style("height","15%");
	}
	this.makeButtons = function(){


		var tab2 = d3.select("#tab2");
		var vs = tab2.select("#tab2Mid").append("div").attr("id","visControls1");
		vs.append("label").text("Sampling");
		vs.append("input").attr("type","radio").attr("name","Sampling").attr("value","1").attr("id","sampOne").attr("class","repSelect").attr("checked",true).text("1");
		vs.append("label").attr("for","sampOne").attr("class","repLabel").text("1");
		vs.append("input").attr("type","radio").attr("name","Sampling").attr("value","5").attr("id","sampFive").attr("class","repSelect").text("5");
		vs.append("label").attr("for","sampFive").attr("class","repLabel").text("5");
		vs.append("input").attr("type","radio").attr("name","Sampling").attr("value","20").attr("id","sampTwenty").attr("class","repSelect").text("20");
		vs.append("label").attr("for","sampTwenty").attr("class","repLabel").text("20");
		vs.append("input").attr("type","radio").attr("name","Sampling").attr("value","1000").attr("id","sampThousand").attr("class","repSelect").text("1000");
		vs.append("label").attr("for","sampThousand").attr("class","repLabel").text("1000");
		vs.append("input").attr("type","button").attr("value","Go").attr("class","bluebutton").attr("id","startSampling").attr("disabled",null).attr("onClick","mainControl.startSampling(false)")
			.style("height","15%");

		vs = tab2.select("#tab2Bot").append("div").attr("id","visControls2");
		vs.append("label").text("Sampling Distribution");
		vs.append("input").attr("type","radio").attr("name","Dist").attr("value","1").attr("id","distOne").attr("class","repSelect").attr("checked",true).text("1");
		vs.append("label").attr("for","distOne").attr("class","repLabel").text("1");
		vs.append("input").attr("type","radio").attr("name","Dist").attr("value","5").attr("id","distFive").attr("class","repSelect").text("5");
		vs.append("label").attr("for","distFive").attr("class","repLabel").text("5");
		vs.append("input").attr("type","radio").attr("name","Dist").attr("value","20").attr("id","distTwenty").attr("class","repSelect").text("20");
		vs.append("label").attr("for","distTwenty").attr("class","repLabel").text("20");
		vs.append("input").attr("type","radio").attr("name","Dist").attr("value","1000").attr("id","distThousand").attr("class","repSelect").text("1000");
		vs.append("label").attr("for","distThousand").attr("class","repLabel").text("1000");
		vs.append("input").attr("type","button").attr("value","Go").attr("class","bluebutton").attr("id","distSampling").attr("disabled",null).attr("onClick","mainControl.startSampling(true)")
			.style("height","15%");
		/*
		vs.append("input").attr("name", "do1").attr("type", "button").attr("value","1 sample").attr("onClick", "mainControl.startAnimation(1,true)");
		vs.append("input").attr("name", "do10").attr("type", "button").attr("value","10 samples").attr("onClick", "mainControl.startAnimation(10, false)");
		vs.append("input").attr("name", "do1000").attr("type", "button").attr("value","1000 samples").attr("onClick", "mainControl.startAnimation(1000, false)");
		vs.append("input").attr("name", "resetLines").attr("type", "button").attr("value","reset lines ").attr("onClick", "mainControl.resetScreen()");
		vs.append("input").attr("name", "stop").attr("type", "button").attr("value","stop ").attr("onClick", "mainControl.stopPressed()"); */
		//vs.append("input").attr("name", "back").attr("type", "button").attr("value","back ").attr("onClick", "mainControl.backPressed()");
	}
	/*this.twoMeanPressed = function(){
		this.dataScreen = startTwoMeans();
		this.makeButtons();
	}
	this.oneMeanPressed = function(){
		dataScreen = startOneMean();
		makeButtons();
		
	}
	this.oneProportionPressed = function(){
		dataScreen = startOneProportion();
		makeButtons();
		
	}
	this.slopePressed = function(){
		dataScreen = startSlope();
		makeButtons();
		
	}*/
	this.loadMain = function(dataHeadings){
		d3.select(".controls").selectAll("*").remove();
		var tab1 = d3.select(".controls").append("div").attr("id","tab1").attr("class","tab");
		var tab2 = d3.select(".controls").append("div").attr("id","tab2").attr("class","tab");
		tab1.style("display","block");
		tab2.append("div").attr("class","tab2Divider").attr("id","tab2Top");
		tab2.append("div").attr("class","tab2Divider").attr("id","tab2Mid");
		tab2.append("div").attr("class","tab2Divider").attr("id","tab2Bot");
		var importFileB = tab1.append("input").attr("name", "importfiles").attr("type", "file").attr("value","import files").attr("id","importButton");
		var label = tab1.append("label").attr("for", "importButton").text("Choose a file").attr("class","bluebutton");
		var usePreset = tab1.append("input").attr("name", "dataPreset").attr("type", "button").attr("value","Use test data").attr("id","dataPreset").attr("onClick","mainControl.loadTestData()");
		var container = tab1.append("div").attr("id","inputContainer").attr("class","selectContainer");
		var focusContainer = tab1.append("div").attr("id","focusContainer").attr("class","selectContainer");

		var IB = document.getElementById("importButton");
		IB.onchange = function(e){
			controller.impButPressed(e);
		}
		var selectMenu = d3.select("#inputContainer").append("select").attr("size",dataHeadings.length).attr("multiple","multiple").attr("id","selectMenu");
		var SM = document.getElementById("selectMenu");
		SM.onchange = function(e){
			controller.varSelected(e);
		}

	}
	this.varSelected = function(){
		d3.select("#startButton").attr("disabled", null);
	}
	this.focusSelector = function(headings, curCategory){
		var focusContainer = d3.select("#focusContainer");
		focusContainer.append("label").attr("for","focusController").text("Choose Category to focus on.")
		var focusController = focusContainer.append("select").attr("size",headings.length).attr("id","focusController");
			headings.forEach(function(e){
			focusController.append("option").attr("value",e).text(e);
		});
		var SM = document.getElementById("focusController");
		SM.onchange = function(e){
			controller.focusSelected(e);
		}
	}
	this.destroyFocus = function(){
		d3.select("#focusContainer").selectAll("*").remove();
	}

	this.finishSetUp = function(){
		//d3.select("#startButton").style("background-color","green");
		this.makeButtons();
		//var tab1 = d3.select("#tab1");
		//tab1.style("display","none");
	}
	this.setUpDataVeiw = function(dataHeadings){

		var selectMenu = d3.select("#inputContainer select").attr("size",dataHeadings.length).attr("multiple","multiple");
		selectMenu.selectAll("*").remove();
		dataHeadings.forEach(function(e){
			selectMenu.append("option").attr("value",e).text(e[0]+" ("+e[1]+")");
		});


		d3.select("#tab1").append("input").attr("type","button").attr("value","Analyse").attr("class","bluebutton").attr("id","startButton").attr("disabled","true").attr("onClick","mainControl.switchTab2()");
	}
	this.setUpStatSelection = function(category){
		var statSelection = d3.select("#statSelect");
		statSelection.selectAll("*").remove();
		var selectFirst = true;
		category.forEach(function(c){
			var nO = statSelection.append("option").attr("value",c).text(c);
			if(selectFirst){
				nO.attr("selected","selected");
				selectFirst=false;
			}
		});
	}
}