
'use strict'

/** @constructor
    @struct */
var Milestone = function (obj, index, mMap) {
    // state
    /** @type {string} */ this.name;
    /** @type {Project|BusinessMs} */ this.project;

    // view
    /** @type {Element} */
    this.elem = Draw.svgElem("g", {
        "class": "milestone"
    });

    // view model
    /** @type {MilestoneMap} */ this.mMap = mMap;
    /** @type {number} */ this.index = index;
    /** @type {Array<MsAtReport>} */ this.atReports = [];

    /** @type {MsAtReport|undefined} */ this.currReport;
    /** @type {MsAtReport|undefined} */ this.cmpReport;

    this.restore (obj);
};

Milestone.prototype.restore = function (obj) {
    runTAssert (() => Number.isInteger(obj["project"]));
    runTAssert (() => this.mMap.projects[obj["project"]] || obj["project"] < 0);
    this.name = obj["name"];
    
    if (this.project) {
        this.project.removeMilestone (this);
    }

    if (obj["project"] >= 0) {
        this.project = this.mMap.projects[obj["project"]];
    }
    else {// business milestone
        this.project = this.mMap.businessMs;
    }
    this.project.addMilestone (this);
};
Milestone.prototype.save = function () {
    return {
        "name": this.name,
        "project": this.project.index
    };
};
Milestone.prototype.exportCSVRow = function () {    
    var msAtReport = this.currentReport();
    var currReport = msAtReport ? Util.getISODateOnly(msAtReport.date) : null;

    var programmeName = this.project.index === -1 ?
        this.project.name : this.project.programme.name;
    return [
        programmeName,
        this.project.name,
        this.name,
        currReport,
        msAtReport.resolveStatusClass(),
        msAtReport.comment
    ].map(el => JSON.stringify(el)).join(",");
};

Milestone.prototype.draw = function () {
    this.elem.innerHTML = "";

    var current = this.currentReport();
    var comparison = this.comparisonReport();

    if (current && comparison &&
        (this.mMap.currReport !== this.mMap.cmpReport)) {
        Draw.bowedLine ({x: comparison.x, y: 0}, {x: current.x, y: 0},
                        "thick evenDashed brightPink noFill", this.elem);
        
        // if (comparison.x < current.x) {
        //     Draw.svgElem ("path", {
        //         "class": "compareArrow",
        //         "d": "M -6 -6 L -6 6 L 0 0 Z",
        //         "transform": "translate("+
        //             (current.x - MsAtReport.DIAMONDSIZE) + ", 0)"
        //     }, this.elem);
        // }
        // else if (comparison.x > current.x) {
        //     Draw.svgElem ("path", {
        //         "class": "compareArrow",
        //         "d": "M 6 -6 L 6 6 L 0 0 Z",
        //         "transform": "translate("+
        //             (current.x + MsAtReport.DIAMONDSIZE) + ", 0)"
        //     }, this.elem);
        // }
    };

    if (comparison) {
        this.elem.appendChild (comparison.elem);
    }
    if (current) {
        this.elem.appendChild (current.elem);
    }
};

Milestone.prototype.reflowUp = function () {
    var project = this.project;
    project.draw();
    project.reflowUp();
};


// linking
Milestone.prototype.addReport = function (report) {
    assert (() => report instanceof MsAtReport);
    this.atReports.push(report);
};
Milestone.prototype.removeReport = function (msAtReport) {
    if (msAtReport.report === this.mMap.currReport) {
        this.currReport = null;
    }
    if (msAtReport.report === this.mMap.cmpReport) {
        this.cmpReport = null;
    }
    this.atReports = this.atReports.filter(elem => elem !== msAtReport);
};

// modifications
Milestone.prototype.deleteThis = function () {
    this.project.removeMilestone (this);
    this.atReports.forEach(atReport => atReport.deleteThis());
    this.mMap.removeMilestone (this);
};


// other methods
Milestone.prototype.hasReport = function (report) {
    return this.atReports.find(msAtReport => msAtReport.report === report);
};
Milestone.prototype.currentReport = function () {
    if (this.currReport &&
        this.currReport.report === this.mMap.currReport)
    {
        return this.currReport;
    }
    return this.currReport = this.hasReport (this.mMap.currReport);
};
Milestone.prototype.comparisonReport = function () {
    if (this.cmpReport &&
        this.cmpReport.report === this.mMap.cmpReport)
    {
        return this.cmpReport;
    }
    return this.cmpReport = this.hasReport (this.mMap.cmpReport);
};
