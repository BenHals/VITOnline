
class bootstrap_oneCat extends visBase {
	constructor(inputData, headingGroup, headingContinuous, statistic, focus) {
		super(inputData, headingGroup, headingContinuous, statistic, focus);
		this.windowHelper = setUpWindow3({'left':5, 'right':5, 'top':5, 'bottom':5}, true);
		this.sampleStatType = "stat";
		this.popDrawType = 1;
		// text labels for each section.
		this.sectionLabels = ['Data','Resampled','Resample Distribution'];
		//this.animationList = [this.populationDropDown,this.buildList, this.fadeIn, this.endNoDist, this.distDrop, this.endDist ];
		this.animationList = [this.populationDropDown.bind(this),
						this.buildList.bind(this), 
						this.fadeIn.bind(this), 
						this.endNoDist.bind(this), 
						this.distDrop.bind(this),
						this.endDist.bind(this)];
	}

	setUpPopCategory(items, scale, radius, top, bottom){
		// No real need to set anything up here, everything done when drawn.
	}

	getSampleSize(){
		return this.allPop.length < 51 ? this.allPop.length : null;
	}
	makeSample(populations, numSamples, sampleSize, statistic){
		this.samples = [];
		for(var i = 0; i<numSamples;i++){
			this.samples.push([]);
			for(var g = 0; g < this.groups.length; g++){
				this.samples[i].push([]);
			}
			var stats = [];
			for(var j = 0; j < sampleSize;j++){
					var group = Math.ceil(Math.random()*this.groups.length) - 1;
					var index =	Math.ceil(Math.random()*populations[this.groups[group]].length) - 1;
					var nI = new item (populations[this.groups[group]][index].value, j);
					nI.popId = populations[this.groups[group]][index].id;
					nI.popGroup = group;
					nI.group =	populations[this.groups[group]][index].group;
					nI.order = j;
					nI.groupIndex = group;
					this.samples[i][group].push(nI);
			}
		}
	}
	setUpSampleCategory(items, scale, radius, sample, top, bottom){
		// Sets the y value for all population circles in the category to make it look heaped. 
		heapYValues3(items, scale, radius, sample, top,bottom);
	}
	fillBaseSampleSection(placeInto){
		var self = this;
		placeInto.append("text").text(this.headingGroup).attr("x",self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width*(2/4)).attr("y",self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize).style("font-size",self.windowHelper.fontSize).style("font-weight", 700).style("margin",self.windowHelper.marginSample+"px").style("display","inline-block").attr("text-anchor","middle");
		var popTextG = placeInto.selectAll("g").data(this.allPop).enter().append("g");
		popTextG.append("text").text(function(d){return (d.value == 1 || self.groups.length == 2) ? d.group : "Other"}).attr("x",self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width*(2/4)).attr("y",function(d,i){return i < 58 ? (self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize + (self.windowHelper.fontSize+2)*(i+1)) : -10}).style("font-size",self.windowHelper.fontSize).style("display","inline-block").style("fill", function(d){return colorByIndex[1-d.value]}).attr("text-anchor","middle");

		placeInto.append("g").attr("id","redTContainer");
		placeInto.append("text").text("ReSample").attr("x",(self.windowHelper.sampleSection.S2.x + self.windowHelper.sampleSection.S2.width/2)).attr("y",self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize).style("font-size",self.windowHelper.fontSize).style("font-weight", 700).style("display","inline-block").attr("text-anchor","middle");

	}
	drawPopulationStatistic(placeInto){
		var middle = this.windowHelper.graphSection.S1.displayArea.getMiddleHeight();
		d3.select("#population").append("line").attr("id","popProp")
			.attr("x1", this.xScale(this.populationStatistic))
			.attr("x2", this.xScale(this.populationStatistic))
			.attr("y1", middle +this.windowHelper.graphSection.S1.displayArea.height*(3/8))
			.attr("y2", middle)
			.style("stroke-width", 3)
			.style("stroke", "black").style("opacity",1);

		d3.select("#population").append("text").attr("id","popPropText").text(Math.round(this.populationStatistic*100)/100)
			.attr("x", this.xScale(this.populationStatistic) + 5)
			.attr("y", middle +this.windowHelper.graphSection.S1.displayArea.height*(3/8))
			.style("fill", "black").style("opacity",1).style("font-size", this.windowHelper.fontSize);
	}

	cleanUpRepitition(){
		var self = this;
		d3.selectAll(".memLine").style("opacity",0.2).style("stroke","steelblue").attr("y2",function(){ return d3.select(this).attr("y1")-self.windowHelper.lineHeight*2});;
		d3.selectAll("#diffLine").remove();
		d3.selectAll("#samp").remove();
	}
	setUpCI(statList){
			var CISplit = Math.abs(this.populationStatistic - statList[this.numSamples*0.95]);
			for(var k = 0; k < this.numSamples;k++){
				if(Math.abs(this.populationStatistic - this.sampleStatistics[k].value) >= CISplit){
					this.sampleStatistics[k].inCI = false;
				}else{
					this.sampleStatistics[k].inCI = true;
				}
			}
			this.CISplit = CISplit;
	}
	showCI(num, large){
		var self = this;
		var CIVar = this.CISplit;
		var svg = d3.select(".svg");
		if(num == "10000"){
			CIVar = this.LargeCISplit;
		}
		var container = svg.append("svg").attr("id","CISplitContainer");
				var visibleCircles = d3.selectAll(".notInCI").filter(function(){
					return this.attributes["fill-opacity"].value == "1";
				});
				visibleCircles.style("opacity",0.2).transition().duration(500).each("end",function(d,i){
					if(i==0){
					drawArrowDown(self.windowHelper.graphSection.S3.displayArea.y2, self.windowHelper.graphSection.S3.displayArea.y2 - self.windowHelper.graphSection.S3.displayArea.height/2, self.sampleStatScale(self.populationStatistic-CIVar), container, "ciDownArrow", 1, "red",0.75);
					drawArrowDown(self.windowHelper.graphSection.S3.displayArea.y2, self.windowHelper.graphSection.S3.displayArea.y2 - self.windowHelper.graphSection.S3.displayArea.height/2, self.sampleStatScale(self.populationStatistic+CIVar), container, "ciDownArrow", 1, "red",0.75);
					//d3.select("#CISplit").append("line").attr("y1",self.windowHelper.section3.bottom - self.windowHelper.section3.height/4).attr("y2",self.windowHelper.section3.bottom + self.windowHelper.section3.height/10).attr("x1",self.xScale2(self.populationStatistic-self.CISplit)).attr("x2",self.xScale2(self.populationStatistic-self.CISplit)).style("stroke","red");
					//d3.select("#CISplit").append("line").attr("y1",self.windowHelper.section3.bottom - self.windowHelper.section3.height/4).attr("y2",self.windowHelper.section3.bottom + self.windowHelper.section3.height/10).attr("x1",self.xScale2(self.populationStatistic+self.CISplit)).attr("x2",self.xScale2(self.populationStatistic+self.CISplit)).style("stroke","red");
					container.append("text").attr("y",self.windowHelper.graphSection.S3.displayArea.y2).attr("x",self.sampleStatScale(self.populationStatistic+CIVar)).text(Math.round((self.populationStatistic+self.CISplit)*100)/100).style("stroke","black").style("fill", "red").style("font-size", 12);
					container.append("text").attr("y",self.windowHelper.graphSection.S3.displayArea.y2).attr("x",self.sampleStatScale(self.populationStatistic-CIVar)).text(Math.round((self.populationStatistic-self.CISplit)*100)/100).style("stroke","black").style("fill", "red").style("font-size", 12)
						.transition().duration(500).each("end",function(){
							container.append("line").attr("y1",self.windowHelper.graphSection.S3.displayArea.y1 + self.windowHelper.graphSection.S3.displayArea.height/2).attr("y2",self.windowHelper.graphSection.S3.displayArea.y1 + self.windowHelper.graphSection.S3.displayArea.height/2).attr("x1",self.sampleStatScale(self.populationStatistic-self.CISplit)).attr("x2",self.sampleStatScale(self.populationStatistic+self.CISplit)).style("stroke","red").style("stroke-width",5);

						});
					}
				});

	}
	showLargeCI() {
		var self = this;
		var tailText = d3.select("#tailCountText");
		if(tailText[0][0] != null){
			tailText.text(self.largeTailSize + " / 10000 = " + self.largeTailSize/10000)	
		}else{
			this.showCI("10", true);
		}
	}


	// *****************************ANIMATIONS********************************

	populationDropDown(settings, currentAnimation){
		var self = this;

		// Delete Old elements
		d3.select("#circleOverlay").selectAll("circle").data([]).exit().remove();
		var circleOverlay = settings.drawArea.select("#circleOverlay").selectAll("g").data([]);
		circleOverlay.exit().remove();


	    this.animationController(settings, currentAnimation);
	}
	buildUpSlow(settings, currentAnimation, upto, popText, max, self){
		d3.selectAll("#redHighlight").remove();
		if(upto >= max){
			this.animationController(settings, currentAnimation);
			return;
		}
		drawArrow(self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width*(2/8), self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width*(1/8), settings.sample[upto].popId < 58 ? (self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize/2 + (self.windowHelper.fontSize+2)*(settings.sample[upto].popId+1)) : -10, popText, "redHighlight", 1, "red" );
		d3.selectAll(".t"+settings.sample[upto].order).attr("stroke-opacity", 1).attr("fill-opacity", 1).transition().duration(500/settings.repititions).each('end', function(d, i){
			settings.buildListUpto = upto+1;
			self.buildUpSlow(settings, currentAnimation, upto+1, popText, max, self);
		});
		d3.selectAll(".t"+settings.sample[upto].order).style("opacity", 1);


	}
	buildList(settings, currentAnimation){
		var self = this;
		if(!settings.restarting){
			order(settings.sample);
			var goSlow = (settings.repititions == 1 || settings.repititions == 5) && !settings.incDist;
			var popText = d3.select("#sampleReRandomised").empty() ? d3.select("#dynamic").append("g").attr("id", "sampleReRandomised") : d3.select("#sampleReRandomised");
			popText = popText.selectAll("g").data([]);
			popText.exit().remove();
			var i = this.upTo;

			popText = d3.select("#sampleReRandomised").selectAll("g").data(settings.sample);

			var popTextG =popText.enter().append("g");
			popTextG.append("text").text(function(d){
				return d.group;
			}).attr("class",function(d){return "t"+d.order}).attr("x",self.windowHelper.sampleSection.S2.x + self.windowHelper.sampleSection.S2.width*(2/4)).attr("y",function(d,i){return i < 59 ? (self.windowHelper.sampleSection.S2.y + self.windowHelper.fontSize + (self.windowHelper.fontSize+2)*(i+1)) : -10}).style("font-size",self.windowHelper.fontSize).style("display","inline-block").style("fill", function(d){return colorByIndex[self.groups.indexOf(d.group)]}).attr("text-anchor","middle").style("opacity", goSlow ? 0 : 1);

			if(goSlow){
				this.buildUpSlow(settings, currentAnimation, 0, popText, self.allPop.length, self);
			}else{
				d3.select("#circleOverlay").selectAll("circle").attr("stroke-opacity", 1).attr("fill-opacity", 1);
				this.animationController(settings, currentAnimation);
			}
		}else{
			popText = d3.select("#sampleReRandomised").selectAll("g").data(settings.sample);
			this.buildUpSlow(settings, currentAnimation, settings.buildListUpto, popText, self.allPop.length, self);
		}


	}

	fadeIn(settings, currentAnimation){
		sharedProportionBarFadeIn.apply(this, [settings, currentAnimation]);
	}


	distDrop(settings, currentAnimation){
		sharedSingleStatDistDrop.apply(this, [settings, currentAnimation]);
	}	
}

