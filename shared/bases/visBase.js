class visBase {
	constructor(inputData, headingGroup, headingContinuous, statistic, focus){

		// This is the raw input data
		this.inputData = inputData;

		// This is the group to split on, I.E gender
		this.headingGroup = headingGroup;

		// This is the data to use for each data point, I.E height
		// For proportions, this is also the values of the primary group, E.G 0:male 1:female
		this.headingContinuous = headingContinuous;

		// This is the statistic to use for showing differences between groups, I.E mean or median.
		this.statistic = statistic;

		// This is the named prroportion to display on proportion visualisations, I.E for Ethnicity is
		// chosen and European is chosen as the focus, it will show European vs Other. 
		// Basically used to pick which category should be value 0.
		this.focus = focus;

		// whether or not to calculate the large CI numbers
		this.calcLargeCI = true;

		// what the type of value the last section shows, straight statistic for 1 category or difference for 2.
		this.sampleStatType = 'diff';

		// max number of samples to take
		this.numSamples = 1100;

		// include the boxes for samples
		this.includeSampleSection = true;

		// Allows the value to be categorical for comparing proportions between groups. E.G comparing gender for each 
		// travel type in [bus, walk, bike]. Travel style would be the value, group would be gender. For now keep
		// and display the cat values as either 1 for the focus or 0 for other.
		this.valueAllowCategorical = false;

		// Holds the names of categories splitting value.
		this.valueCategories = new Set();

		this.popSetup = false;
		this.sampSetup = false;
		this.animationIndex = 0;
		this.animationState = 0;

		// Type of visualisation for the population.
		// Continuous  = 0;
		// Proportional = 1;
		this.popDrawType = 0;
	}

	changeStat(newStatistic){
		this.statistic = newStatistic;
		this.destroy();
	}
	setUpPopCategory(items, scale, radius, top, bottom){
		// Sets the y value for all population circles in the category to make it look heaped. 
		heapYValues3(items, scale, radius, 0, top,bottom);
	}
	setUpPopulation(){
		var self = this;
		var max = null;
		var min = null;
		var populationSize = this.inputData.length;
		// This is the input data filtered to just the continuous and group data selected.
		// It is split by the group values. 
		this.populations = [];
		this.allPop = [];

		// List of the categories for grouping on. E.g ['male', 'female'] for grouping on gender. 
		// Is ordered, so changing the order changes the order show in the vis.
		this.groups = [];
		if(this.headingGroup == null) {
			this.groups = [""];
			this.populations[""] = [];
		}
		// The statistic for each of the groups, ordered in the same way.
		this.groupStats = [];

		// Value categories real names.
		var allValueCategories = new Set();
		this.valueCategories = new Set();

		// For visualisations where the data is categorical, I.E proportions, we want the focus to be
		// the first value in the list of categories.
		if(this.focus != null){
			this.valueCategories.add(this.focus);
			allValueCategories.add(this.focus);
		}

		// For loop to go through every data point and extract the relevant info.
		// Here this is the category and value for every item.
		// Items also store their x and y values for drawing on the screen at every sample.
		// These item stubs are stored in this.population.

		
		// Min and Max for the population is also calculated here.
		for(var i = 0; i < populationSize;i++){
			var thisItem = new Object();
			var inputItem = this.inputData[i];

			if(this.headingGroup != null){
				// If we havent already encountered a value for this group, make a new one in this.populations.
				if(!(inputItem[this.headingGroup] in this.populations)) {
					this.populations[inputItem[this.headingGroup]] = [];
					this.groups.push(inputItem[this.headingGroup]);
				}
			}
			thisItem.group = this.headingGroup != null ? inputItem[this.headingGroup] : "";
			if(!this.valueAllowCategorical){
				thisItem.value = this.headingContinuous != null ? +inputItem[this.headingContinuous] : +(thisItem.group == this.focus);
			}else{
				var itemValueCategory = inputItem[this.headingContinuous];

				// If focus is set, we only want to compare the focus against all other values,
				// E.g comapre male to female but bike to school against all other transport options.
				allValueCategories.add(itemValueCategory);
				if(this.focus != null){
					itemValueCategory = itemValueCategory == this.focus ? itemValueCategory : "Other";
				}

				if(itemValueCategory != null){
					this.valueCategories.add(itemValueCategory);
				}
				thisItem.value =  [...this.valueCategories].indexOf(itemValueCategory);
			}
			if(isNaN(thisItem.value)) continue;
			if(max == null | thisItem.value > max) max = thisItem.value;
			if(min == null | thisItem.value < min) min = thisItem.value;
			thisItem.xPerSample = {};
			thisItem.yPerSample = {};
			thisItem.id = i;
			this.populations[thisItem.group].push(thisItem)
			this.allPop.push(thisItem);

		}

		//If there are only 2 categories for the value, call the second by its name instead of other
		if([...allValueCategories].length == 2) {
			this.valueCategories.delete("Other");
			this.valueCategories.add([...allValueCategories][1]);
		}

		// Make a scale that converts values between [min, max] to values to draw on the screen.
		this.xScale = d3.scale.linear().range([this.windowHelper.graphSection.x1,this.windowHelper.graphSection.x2]);
		this.xScale.domain([min,max]);
		var s = [];

		// we want the groups in order of lowest to highest statistic, (unless a focus is set, in which case it is first)
		// mainly so the arrow always points right (i think)
		this.groups.sort(function(a,b){
			return getStatistic(self.statistic,self.valueAllowCategorical ? self.populations[a].filter(function(i){return i.value==0}) : self.populations[a], self.valueAllowCategorical ? self.populations[a].length : populationSize) - getStatistic(self.statistic,self.valueAllowCategorical ? self.populations[b].filter(function(i){return i.value==0}) : self.populations[b], self.valueAllowCategorical ? self.populations[b].length : populationSize);
		})

		// Sets up a section for each of the categorical variable possibilities. (If visualising proportion, split on second categorical, *NOT IMPLEMENTED YET*)
		var numDivisions = this.groups.length;
		var divisions = this.windowHelper.graphSection.S1.displayArea.getDivisions(numDivisions, 'height');
		var divSections = divisions[0];
		var divHeight = divisions[1];
		for(var j =0; j <numDivisions; j++){
			var top = divSections[j] - divHeight;
			var bottom = divSections[j] - this.windowHelper.radius*2 - divHeight/2;

			// setUp the items in each category.
			this.setUpPopCategory(this.populations[this.groups[j]], this.xScale, this.windowHelper.radius, top, bottom);

			// gets the selected statistic for category.
			var stat = getStatistic(this.statistic, this.valueAllowCategorical ? this.populations[this.groups[j]].filter(function(i){return i.value==0}) : this.populations[this.groups[j]], this.valueAllowCategorical ? this.populations[this.groups[j]].length : populationSize);
			this.groupStats[this.groups[j]] = stat;
			s.push(stat);
		}

		// NOTE: THIS BIT IS HARDCODED FOR 2 CATEGORIES!!! PROBABLY SHOULD CHANGE AT SOME POINT.
		// Addes the difference in group means to preCalculatedTStat list.
		if(numDivisions >= 2){
			var newItem = new item(s[1]-s[0], i);
			newItem.s0 = s[0];
			newItem.s1 = s[1];
			

			if(this.groups.length != 2){
				this.implemented = false;
			}

			this.populationDiff = newItem.value;
		}

		this.populationStatistic = this.sampleStatType == 'diff' ? this.populationDiff : this.groupStats[this.groups[0]];
		this.popSetup = true;
	}

	getSampleSize(){

	}

	setUpSampleCategory(items, scale, radius, sample, top, bottom){
		// Sets the y value for all population circles in the category to make it look heaped. 
		heapYValues3(items, scale, radius, sample, top,bottom);
	}

	setUpLargeCI(sSize){
		// Get the tail proportion info for 10,000 samples.
		this.makeSample(this.populations, 10000, sSize, this.statistic);
		this.setUpSampleStatistics();
		this.largeTailSize = 0;
		for(var k = 0; k < this.sampleStatistics.length; k++){
			if(this.sampleStatistics[k].diff >= this.populationDiff){
				this.largeTailSize++;
			}
		}
	}

	setUpCI(statList){
		this.tailCount = 0;
		this.CISplit = this.populationStatistic;
		for(var k = 0; k < this.numSamples;k++){
			var sampleStat = this.sampleStatistics[k].value;
			if(sampleStat < this.CISplit){
				this.sampleStatistics[k].inCI = false;
			}else{
				this.sampleStatistics[k].inCI = true;
				this.tailCount++;
			}
		}
	}

	getStatisticEachSample(i, g){
		var populationSize = this.inputData.length;
		return getStatistic(this.statistic, this.samples[i][g], populationSize);
	}
	// goes through samples and calculates the statistics, adding them to this.sampleStatistics.
	// each entry in sampleStatistics is a difference as well as a list of individual statistic for each sample.
	// returns the largest and smallest difference as well as largest and smallest individual statistic.
	setUpSampleStatistics(){
		this.sampleStatistics = [];
		this.largestDiff = null;
		this.smallestDiff = null;
		

		for(var i = 0; i < this.samples.length; i++){
			var catagoryStatistics = [];
			this.largestStat = null;
			this.smallestStat = null;
			for(var g = 0; g < this.samples[i].length; g++){

				// statistic for sample i, catagory g;
				var stat = this.getStatisticEachSample(i, g)
				catagoryStatistics.push(stat);

				if(this.largestStat == null || stat > this.largestStat){
					this.largestStat = stat;
				}

				if(this.smallestStat == null || stat < this.smallestStat){
					this.smallestStat = stat;
				}
			}
			var diff = null;

			// if there are more than 2 categories, we calculate the difference and put that in. otherwise null;
			// only supports difference between 2 groups.
			if(catagoryStatistics.length >= 2){
				diff = catagoryStatistics[1] - catagoryStatistics[0];
			}
			if(this.largestDiff == null || diff > this.largestDiff){
				this.largestDiff = diff;
			}

			if(this.smallestDiff == null || diff < this.smallestDiff){
				this.smallestDiff = diff;
			}

			var sampleStats = new Object();
			sampleStats.diff = diff;
			sampleStats.stats = catagoryStatistics;
			sampleStats.value = this.sampleStatType == 'diff' ? diff : catagoryStatistics[0];
			sampleStats.xPerSample = {};
			sampleStats.yPerSample = {};
			this.sampleStatistics.push(sampleStats);
		}
	}
	setUpSamples(){
		var self = this;

		var sSize = this.getSampleSize();
		if(sSize == null){
			return;
		}
		var statList = [];

		if(this.calcLargeCI){
			this.setUpLargeCI(sSize);
		}

		this.makeSample(this.populations, this.numSamples, sSize,this.statistic);
		this.setUpSampleStatistics();
		var sampleStatRange = this.sampleStatType == 'diff' ? [this.smallestDiff, this.largestDiff] : [this.smallestStat, this.largestStat];
		this.sampleStatScale = d3.scale.linear().range([this.windowHelper.graphSection.x,this.windowHelper.graphSection.x + this.windowHelper.graphSection.width]);
		var populationRange = this.xScale.domain();
		var halfDiff = (populationRange[1]-populationRange[0])/2;

		// For Differences
		// has the same range as the population scale, but centered around 0.
		if(this.sampleStatType == "diff") {
			this.sampleStatScale.domain([0-halfDiff, 0+halfDiff]);
		}else{
			this.sampleStatScale.domain(populationRange);
		}

		// setup the sample displays in section 2.
		var divisions = this.windowHelper.graphSection.S2.displayArea.getDivisions(this.samples[0].length, 'height');
		var divSections = divisions[0];
		var divHeight = divisions[1];
		for(var j =0; j <this.samples[0].length;j++){
			var top = divSections[j] - divHeight;
			var bottom = divSections[j] - this.windowHelper.radius*2 - divHeight/2;		
			for(var k = 0;k<this.numSamples;k++){
				this.setUpSampleCategory(this.samples[k][j], this.xScale, this.windowHelper.radius,k+1,top,bottom);
			}
		}

		var statlist = this.sampleStatType == 'diff' ? this.sampleStatistics.map(function(statObj){ return statObj.diff}) : this.sampleStatistics.map(function(statObj){ return statObj.stats[0]});
		statlist.sort(function(a,b){
			if(Math.abs(self.populationStatistic - a ) < Math.abs(self.populationStatistic - b)) return -1;
			if(Math.abs(self.populationStatistic - a ) > Math.abs(self.populationStatistic - b)) return 1;
			return 0;
		});
		this.setUpCI(statlist);

		heapYValues3(this.sampleStatistics,this.sampleStatScale,this.windowHelper.radius,0,this.windowHelper.graphSection.S3.displayArea.y1,this.windowHelper.graphSection.S3.displayArea.y2 - this.windowHelper.radius*2);
		
		this.statsDone = true;
		this.sampSetup = true;
	}


	// This should just fill this.samples.
	// Each entry should be a sample split by group category.
	// I.E 2 samples with 2 categories: [[[1,2,3],[4,5,6]], [[1,3,5],[2,4,6]]]
	// 	   2 samples with no categories: [[[1,2,3,4,5,6]], [[1,2,3,4,5,6]]] (counts as 1 category so consistant)
	// Implementation will likely be different for each visualisation.
	makeSample(populations, numSamples, sampleSize, statistic){

	}

	draw(){
		var self = this;
		if(!this.statsDone) return;
		this.drawPop();
		this.drawSample();
	}

	drawContinuous(placeInto){
		var self = this;
		var divisions = this.windowHelper.graphSection.S1.displayArea.getDivisions(this.groups.length, 'height');
		var divSections = divisions[0];
		var divHeight = divisions[1];
		for(var i = 0;i<this.groups.length;i++){
			var pos = divSections[i] - divHeight/2 - this.windowHelper.radius*2;
			var catSVG = placeInto.append("g").attr("id","pop"+i);
			catSVG.selectAll("circle").data(this.populations[this.groups[i]]).enter().append("circle")
			    .attr("cx", function(d, i) { 
			    	return d.xPerSample[0]; })
			    .attr("cy", function(d) {
			    	return d.yPerSample[0];
			    })
			    .attr("r", function(d) { return self.windowHelper.radius; })
			    .attr("fill-opacity", 0.5)
			    .attr("stroke","#556270")
			    .attr("stroke-opacity",1).attr("class",function(d){return "c"+d.id})
			    .style("fill", function(){return colorByIndex[i]});
			catSVG.append("line").attr("x1", this.xScale(this.groupStats[this.groups[i]])).attr("x2", this.xScale(this.groupStats[this.groups[i]])).attr("y1", pos+this.windowHelper.lineHeight).attr("y2", pos-this.windowHelper.lineHeight).style("stroke-width", 2).style("stroke", "black").style("stroke-width",3);
			catSVG.append("text").attr("y", pos - divHeight/4).attr("x", this.windowHelper.graphSection.x2).text(this.groups[i]).attr("fill",colorByIndex[i]).attr("text-anchor","end").style("opacity",1).style("font-size",this.windowHelper.fontSize).attr("alignment-baseline","middle");
			catSVG.append("text").attr("y", pos - divHeight/4 + this.windowHelper.graphSection.S1.height).attr("x", this.windowHelper.graphSection.x2).text(this.groups[i]).attr("fill",colorByIndex[i]).attr("text-anchor","end").style("opacity",1).style("font-size",this.windowHelper.fontSize).attr("alignment-baseline","middle");
		}
	}

	drawProportional(placeInto){
		var self = this;

		// Should make a division for each group.
		var numDivisions = this.groups.length;
		var divisions = this.windowHelper.graphSection.S1.displayArea.getDivisions(numDivisions, 'height');
		var divSections = divisions[0];
		var divHeight = divisions[1];
		for(var i = 0;i<numDivisions;i++){
			var pos = divSections[i] - divHeight/2 - this.windowHelper.radius*2;
			var catSVG = placeInto.append("g").attr("id","pop"+i);

			var groupName = this.groups[i];
			// Now split on main categories. We want a category for the focus and one for other.
			var focusGroup = self.populations[groupName].filter(function(x){return x.value == 0});
			var otherGroup = self.populations[groupName].filter(function(x){return x.value != 0});

			this.drawProportionBars(catSVG, divHeight, pos, self.xScale, focusGroup, otherGroup, groupName, i, [...this.valueCategories]);
		}
	}

	drawProportionBars(svg, divHeight, pos, xScale, fG, oG, name, i, barTitles){
		var self = this;
		// Each bar has its start in units, its end in units, the total amouint of units and its name.
		var bars = [[0, fG.length, fG.length + oG.length, barTitles[0]], [fG.length, oG.length, fG.length + oG.length, barTitles[1]]];

		// Bar Name (group)
		svg.append("text").text(name)
		.attr("x", xScale(1))
		.attr("y", pos - divHeight/4 - 2)
		.attr("text-anchor", "end")
		.attr("fill",colorByIndex[i+[...self.valueCategories].length])
		.style("font-size", divHeight*0.4).style("opacity", 0.6);

		svg = svg.selectAll("g").data(bars);

		var barsSVG = svg.enter().append("g").attr("id", function(d){return name + i + d[3]});
		barsSVG.append("rect")
			.attr("height", divHeight/2)
			.attr("y", pos - divHeight/4)
			.attr("width", function(d){ return xScale((d[1]+ d[0])/d[2]) - xScale((d[0])/d[2]) })
			.attr("x", function(d){return xScale(d[0]/d[2])})
			.attr("fill",function(d,i){return colorByIndex[i]})
			.attr("fill-opacity","0.8");

		barsSVG.append("text").text(function(d){return d[1] > 0 ? d[1] : ""})
		.attr("x", function(d){return xScale(d[0]/d[2]) + (xScale((d[1]+ d[0])/d[2]) - xScale((d[0])/d[2])) /2 })
		.attr("y", pos)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "central")
		.attr("fill","white")
		.style("font-size", divHeight*0.6).style("opacity", 0.6);

		// barsSVG.append("line")
		// .attr("x1", function(d){return xScale(d[0]/d[2]) })
		// .attr("x2", function(d){return xScale(d[0]/d[2]) + (xScale((d[1]+ d[0])/d[2]) - xScale((d[0])/d[2])) })
		// .attr("y1", pos)
		// .attr("y2", pos);	

		barsSVG.append("text").text(function(d){return d[1] > 0 ? d[3] : ""})
		.attr("x", function(d){return xScale(d[0]/d[2])})
		.attr("y", pos - divHeight/4 - 2)
		.attr("text-anchor", "start")
		.attr("fill",function(d,i){return colorByIndex[i]})
		.style("font-size", this.windowHelper.fontSize);	
	}

	drawPopulationCategories(placeInto){
		var popDrawFunctions = [this.drawContinuous.bind(this), this.drawProportional.bind(this)];
		var popDrawFunction = popDrawFunctions[this.popDrawType];
		popDrawFunction(placeInto);
	}

	labelSections(placeInto){
		placeInto.append("text").attr("class","sectionLabel").attr("x", this.windowHelper.graphSection.x).attr("y",this.windowHelper.graphSection.S1.titleArea.y2+2).text(this.sectionLabels[0]).style("opacity", 1).style("font-size",this.windowHelper.fontSize).style("fill","black").style("font-weight","bold");
		placeInto.append("text").attr("class","sectionLabel").attr("x", this.windowHelper.graphSection.x).attr("y",this.windowHelper.graphSection.S2.titleArea.y2+2).text(this.sectionLabels[1]).style("opacity", 1).style("font-size",this.windowHelper.fontSize).style("fill","black").style("font-weight","bold");
		placeInto.append("text").attr("class","sectionLabel").attr("x", this.windowHelper.graphSection.x).attr("y",this.windowHelper.graphSection.S3.titleArea.y2+2).text(this.sectionLabels[2]).style("opacity", 1).style("font-size",this.windowHelper.fontSize).style("fill","black").style("font-weight","bold");
	}

	drawPopAxis(placeInto){
		var xAxis = d3.svg.axis();
		xAxis.scale(this.xScale).tickSize(2);
		placeInto.append("g").attr("class","axis").attr("transform", "translate(0," + (this.windowHelper.graphSection.S1.axisArea.y) + ")").call(xAxis);
		placeInto.append("g").attr("class","axis").attr("transform", "translate(0," + (this.windowHelper.graphSection.S2.axisArea.y) + ")").call(xAxis);
	}

	fillBaseSampleSection(placeInto){
		var self = this;
		placeInto.append("text").text(this.headingContinuous).attr("x",self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width/4).attr("y",self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize).style("font-size",self.windowHelper.fontSize).style("font-weight", 700).style("margin",self.windowHelper.marginSample+"px").style("display","inline-block").attr("text-anchor","middle");
		placeInto.append("text").text(this.headingGroup).attr("x",self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width*(3/4)).attr("y",self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize).style("font-size",self.windowHelper.fontSize).style("font-weight", 700).style("margin",self.windowHelper.marginSample+"px").style("display","inline-block").attr("text-anchor","middle");
		var popTextG = placeInto.selectAll("g").data(this.allPop).enter().append("g");
		popTextG.append("text").text(function(d){return d.value}).attr("x",self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width/4).attr("y",function(d,i){return i < 59 ? (self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize + (self.windowHelper.fontSize+2)*(i+1)) : -10}).style("font-size",self.windowHelper.fontSize).style("display","inline-block").attr("text-anchor","middle");
		popTextG.append("text").text(function(d){return d.group}).attr("x",self.windowHelper.sampleSection.S1.x + self.windowHelper.sampleSection.S1.width*(3/4)).attr("y",function(d,i){return i < 59 ? (self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize + (self.windowHelper.fontSize+2)*(i+1)) : -10}).style("font-size",self.windowHelper.fontSize).style("display","inline-block").style("stroke", function(d){return colorByIndex[self.groups.indexOf(d.group)]}).attr("text-anchor","middle");

		placeInto.append("g").attr("id","redTContainer");
		placeInto.append("text").text("Re-randomised").attr("x",(self.windowHelper.sampleSection.S2.x + self.windowHelper.sampleSection.S2.width/2)).attr("y",self.windowHelper.sampleSection.S1.y + self.windowHelper.fontSize).style("font-size",self.windowHelper.fontSize).style("font-weight", 700).style("display","inline-block").attr("text-anchor","middle");

	}

	drawSampleSection(placeInto){
		var self = this;
		var sampleSection = placeInto.append("g").attr("id","sampleSection");
		sampleSection.append("rect").attr("width",self.windowHelper.sampleSection.S1.width).attr("x", self.windowHelper.sampleSection.S1.x).attr("height",self.windowHelper.sampleSection.S1.height).attr("y", self.windowHelper.sampleSection.S1.y).attr("rx", "20").attr("ry","20").style("fill","#D0D0D0").style("stroke","black");
		sampleSection.append("rect").attr("width",self.windowHelper.sampleSection.S2.width).attr("x", self.windowHelper.sampleSection.S2.x).attr("height",self.windowHelper.sampleSection.S2.height).attr("y", self.windowHelper.sampleSection.S2.y).attr("rx", "20").attr("ry","20").style("fill","#D0D0D0").style("stroke","black");
		this.fillBaseSampleSection(sampleSection);
	}

	drawPop(){
		// Cancel if setup has not run.
		if(!this.popSetup) return;
		var self = this;

		// add a group to place all population elements into.
		var popDraw = d3.select(".svg").append("g").attr("id", "population");

		// draw axis for first 2 sections.
		this.drawPopAxis(popDraw);

		// add a group to place population elements into.
		var popCategories = popDraw.append("g").attr("class","pop");
 		this.drawPopulationCategories(popCategories);
		
		this.labelSections(popDraw);

		if(this.includeSampleSection){
			this.drawSampleSection(popDraw);
		}
	}

	drawSampleAxis(placeInto){
		var xAxis2 = d3.svg.axis();
		xAxis2.scale(this.sampleStatScale).tickSize(2);
		placeInto.append("g").attr("class","axis").attr("transform", "translate(0," + (this.windowHelper.graphSection.S3.axisArea.y) + ")").call(xAxis2);	

		// we want 0 to be bolded
		d3.selectAll(".axis text").filter(function(d){
			return d == 0;
		}).style("font-weight",700);
	}

	drawPopulationStatistic(placeInto){
		var middle = this.windowHelper.graphSection.S1.displayArea.getMiddleHeight();
		drawArrow(this.xScale(this.groupStats[this.groups[1]]), this.xScale(this.groupStats[this.groups[0]]), middle, placeInto, "popDiff", 1, "blue");
			placeInto.append("text").attr("x", this.xScale(this.groupStats[this.groups[1]])).attr("y", middle).text(Math.round((this.populationStatistic)*100)/100).style("stroke","blue").style("opacity",1);

	}

	drawSampleDisplay(placeInto){
		var middle = this.windowHelper.graphSection.S2.displayArea.getMiddleHeight();
		placeInto.append("g").attr("class","sampleDiffs");
		placeInto.append("g").attr("class","sampleLines2");
		var meanCircles = placeInto.append('g').attr("id", "sampleDisplay").selectAll("circle").data(this.sampleStatistics)
			.enter().append("circle")
		    .attr("cx", function(d, i) { 
		    	return d.xPerSample[0]; })
		    .attr("cy", function(d) {
		    	return d.yPerSample[0];
		    })
		    .attr("r", this.windowHelper.radius)
		    .attr("fill-opacity", 0)
		    .attr("stroke","#556270")
		    .attr("stroke-opacity",0)
		    .attr("class",function(d){
				    	if(d.inCI){
				    		return "inCI";
				    	}else{
				    		return "notInCI";
				    	}
				    });
	}

	drawSample(){
		// cancel if setup has not run.
		if(!this.sampSetup) return;
		var self = this;

		var sampleDraw = d3.select(".svg").append("g").attr("id", "samples");

		// does not handle more than 2 categories right now.
		//if(this.groups.length > 2) return;

		// draw axis for section 3
		this.drawSampleAxis(sampleDraw);

		this.drawPopulationStatistic(sampleDraw);
		
		this.drawSampleDisplay(sampleDraw);		

		var overlayContainer = d3.select(".svg").append("g").attr("id", "dynamic").append("g").attr("id","circleOverlay");
		overlayContainer.append("g").attr("id","circleOverlayStill");
		overlayContainer.append("g").attr("id","circleOverlayDrop");
		d3.select("#fadeButton").remove();
	}

	// Sets up all initial conditions for animations.
	// I.E sets the current sample index to use.
	startAnim(repititions, goSlow, incDist){
		this.drawnMeans = [];
		d3.select(".sampleLines").selectAll("*").remove();
		this.cleanUpRepitition();
		if(repititions >900) this.resetLines();
		if(this.animationState == 0){
			if(repititions == 1) this.transitionSpeed = 1000;
			if(repititions == 5) this.transitionSpeed = 500;
			if(repititions == 20) this.transitionSpeed = 100;
			if(repititions == 1000) this.transitionSpeed = 0;
			if(this.animationIndex > this.numSamples*0.9){
				this.animationIndex = this.animationIndex % this.numSamples;
				this.resetLines();
			}
			var start = this.animationIndex;
			var end = start + repititions;
			if(repititions > 100) this.transitionSpeed = 0;
			var jumps = 1;
			if(repititions > 20) 
			{
				jumps = 2;
				if(incDist) jumps = 10;
			}


			this.showSteps = false;

			var settings = new Object();
			settings.goSlow = goSlow;
			settings.indexUpTo = start;
			settings.incDist = incDist;
			settings.end = end;
			settings.jumps = jumps;
			settings.delay = 1000;
			settings.pauseDelay = this.transitionSpeed;
			settings.fadeIn = 200;
			settings.repititions = repititions;
			settings.sample = [].concat.apply([],this.samples[settings.indexUpTo]);
			settings.drawArea = d3.select("#dynamic");
			order(settings.sample);

			this.settings = settings;
			this.animationController(settings, -1);
		} 
	}

	// End of the animation list for animations not ending in showing the distribution.
	endNoDist(settings, currentAnimation){
		if(settings.incDist){
			this.animationController(settings, currentAnimation);
		}else{
			this.animStepper(settings);
		}
	}

	// End of the animation list for animations ending in showing the distribution.
	endDist(settings, currentAnimation){
		this.animStepper(settings);
	}

	// controls starting the next animation in the list.
	animationController(settings, currentAnimation){
		this.animationState = currentAnimation + 1;
		this.animationList[currentAnimation+1](settings, currentAnimation + 1);
	}

	cleanUpRepitition(){

	}
	// controls what happens at the end of an animation. Usually starts the next one,
	animStepper(settings){

		settings.indexUpTo += settings.jumps;

		this.animationIndex += settings.jumps; 
		this.settings = settings;

		// If all repitiontions have been played, or repititions have gone over the number of samples availiable, end.
		// Otherwise start a new repitition.
		if(settings.indexUpTo >= settings.end || settings.indexUpTo >= this.numSamples-10){
			mainControl.doneVis();
			if(settings.repititions == 1000 && settings.incDist){
				var svg = d3.select(".svg").append("g").attr("id","meanBox");
				d3.selectAll(".CIButton").attr("disabled",null);
			}
			this.animationState = 0;
			return;
		}else{
			// clean up last repitition
			this.cleanUpRepitition();
			settings.sample = [].concat.apply([],this.samples[settings.indexUpTo]);
			this.settings = settings;
			this.animationController(settings, -1);
		}
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

	destroy(){
		d3.select(".svg").selectAll("*").remove();
		d3.select("#CISplit").remove();
		d3.select(".svg").append("svg").attr("class","sampleLines");
		d3.select(".svg").append("svg").attr("class","meanOfSamples");
		this.resetData();
	}

	stop(){
		this.animationState = 0;
		this.resetLines();
	}

	resetData(){

		// whether or not to calculate the large CI numbers
		this.calcLargeCI = true;

		// max number of samples to take
		this.numSamples = 1100;

		// include the boxes for samples
		this.includeSampleSection = true;

		this.animationIndex = 0;

		this.animationState = 0;
	}

	resetLines(){
		this.animationState = 0;
		this.animationIndex = 1;
		d3.select("#sampText").selectAll("*").remove();
		d3.select("#redTContainer").selectAll("*").remove();
		
		d3.select("#meanBox").remove();
		d3.selectAll("#CISplit").remove();
		d3.selectAll(".CIButton").attr("disabled",true);
		d3.selectAll(".notInCI").style("opacity",1);
		this.drawnMeans = [];
		d3.select(".svg").selectAll("*").transition().duration(20).attr("stop","true");
		var self = this;
		var svg = d3.select(".svg");
		svg.select(".sampleLines").selectAll("*").remove();
		svg.select("#circleOverlay").selectAll("g").remove();
		svg.select("#circleOverlay").selectAll("circle").remove();
		svg.select(".sampleLines2").selectAll("line").style("opacity",0);

		svg.select(".sampleDiffs").selectAll("line").style("opacity",0);

		svg.select("#sampleDisplay").selectAll("circle").attr("fill-opacity", 0).attr("stroke-opacity", 0);
		svg.select("#CISplitContainer").remove();
		this.animationState = 0;
	}

	pause(){
		if(this.waiting){
			this.pauseCalled = true;
			return;
		}
		this.pauseCalled = false;
		var rL = d3.select("#redLine");
		if(rL[0][0] != null) {
			this.settings.redLine = [rL.attr("y1"), rL.attr("y2"), rL.attr("x1")]; 
		}
		d3.select(".svg").selectAll("*").transition().duration(20).attr("stop","true");
		this.pauseState = this.animationState;
		this.animationState = 0;
		d3.selectAll(".goButton").attr("disabled",true);
		this.settings.restarting = false;
	}

	unPause(){
		if(this.pauseCalled){
			return;
		}
		this.settings.restarting = true;
		this.animationController(this.settings, this.pauseState-1);
	}

}