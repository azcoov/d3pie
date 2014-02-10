/**
 * --------- core.js -----------
 *
 * This contains the main control flow for the script, and all the core jQuery functionality - public + private.
 */
var _pluginName = "d3pie";
var _componentDimensions = {
	title:    { h: 0, w: 0 },
	subtitle: { h: 0, w: 0 },
	footer:   { h: 0, w: 0 }
};
var _hasTitle = false;
var _hasSubtitle = false;
var _hasFooter = false;
var _totalSize = null;
var _arc, _svg, _options, _innerRadius, _outerRadius;

function d3pie(element, options) {
	this.element = element;
	this.options = $.extend(true, {}, _defaultSettings, options);

	// confirm d3 is available [check minimum version]
	if (!window.d3 || !window.d3.hasOwnProperty("version")) {
		console.error("d3pie error: d3 is not available");
		return;
	}

	// validate here

	this._defaults = _defaultSettings;
	this._name = _pluginName;

	// now initialize the thing
	this.init();
}

// prevents multiple instantiations of the same plugin on the same element
$.fn[_pluginName] = function(options) {
	return this.each(function() {
		if (!$.data(this, _pluginName)) {
			$.data(this, _pluginName, new d3pie(this, options));
		}
	});
};


// ----- public functions -----

d3pie.prototype.destroy = function() {
	$(this.element).removeData(_pluginName); // remove the data attr
	$(this.element).html(""); // clear out the SVG
	//delete this.options;
};

d3pie.prototype.recreate = function() {
	$(this.element).html("");
	this.init();
};


// this let's the user dynamically update aspects of the pie chart without causing a complete redraw. It
// intelligently re-renders only the part of the pie that the user specifies. Some things cause a repaint, others
// just redraw the single element
d3pie.prototype.updateProp = function(propKey, value, optionalSettings) {
	switch (propKey) {
		case "header.title.text":
			var oldValue = d3pie.helpers.processObj(this.options, propKey);
			d3pie.helpers.processObj(this.options, propKey, value);
			$("#title").html(value);
			if ((oldValue === "" && value !== "") || (oldValue !== "" && value === "")) {
				this.recreate();
			}
			break;

		case "header.subtitle.text":
			var oldValue = d3pie.helpers.processObj(this.options, propKey);
			d3pie.helpers.processObj(this.options, propKey, value);
			$("#subtitle").html(value);
			if ((oldValue === "" && value !== "") || (oldValue !== "" && value === "")) {
				this.recreate();
			}
			break;

		case "callbacks.onload":
		case "callbacks.onMouseoverSegment":
		case "callbacks.onMouseoutSegment":
		case "callbacks.onClickSegment":
			d3pie.helpers.processObj(this.options, propKey, value);
			break;
	}
};



d3pie.prototype.init = function() {
	_options = this.options;

	// 1. Prep-work
	_options.data = d3pie.math.sortPieData(_options.data, _options.misc.dataSortOrder);
	_totalSize = d3pie.math.getTotalPieSize(_options.data);

	d3pie.helpers.addSVGSpace(this.element, _options.size.canvasWidth, _options.size.canvasHeight, _options.styles.backgroundColor);

	// these are used all over the place
	_hasTitle    = _options.header.title.text !== "";
	_hasSubtitle = _options.header.subtitle.text !== "";
	_hasFooter   = _options.footer.text !== "";

	// 2. add all text components offscreen. We need to know their widths/heights for later computation
	d3pie.text.addTextElementsOffscreen();
	d3pie.text.addFooter(); // the footer never moves - just put it in place now.

	// now
	var radii = d3pie.math.computePieRadius();
	_innerRadius = radii.inner;
	_outerRadius = radii.outer;


	// STEP 2: now create the pie chart and position everything accordingly
	var requiredElements = [];
	if (_hasTitle) { requiredElements.push("title"); }
	if (_hasSubtitle) { requiredElements.push("subtitle"); }
	if (_hasFooter) { requiredElements.push("footer"); }

	d3pie.helpers.whenElementsExist(requiredElements, function() {
		_storeDimensions();

		d3pie.text.positionTitle();
		d3pie.text.positionSubtitle();

		d3pie.segments.create();
		d3pie.labels.add();
		d3pie.segments.addSegmentEventHandlers();
	});
};


var _storeDimensions = function() {
	if (_hasTitle) {
		var d1 = d3pie.helpers.getDimensions("title");
		_componentDimensions.title.h = d1.h;
		_componentDimensions.title.w = d1.w;
	}
	if (_hasSubtitle) {
		var d2 = d3pie.helpers.getDimensions("subtitle");
		_componentDimensions.subtitle.h = d2.h;
		_componentDimensions.subtitle.w = d2.w;
	}
	if (_hasFooter) {
		var d3 = d3pie.helpers.getDimensions("footer");
		_componentDimensions.footer.h = d3.h;
		_componentDimensions.footer.w = d3.w;
	}
};


var _addFilter = function() {
	//_svg.append('<filter id="testBlur"><feDiffuseLighting in="SourceGraphic" result="light" lighting-color="white"><fePointLight x="150" y="60" z="20" /></feDiffuseLighting><feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/></filter>')
};