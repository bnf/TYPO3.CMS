define(['../../FormEngine', '../../../../../../core/Resources/Public/JavaScript/Contrib/d3', '../../SvgTree'], function (FormEngine, d3, SvgTree) { 'use strict';

  var SelectTree = function () {
    SvgTree.call(this);
    this.settings.showCheckboxes = true;
  };
  SelectTree.prototype = Object.create(SvgTree.prototype);
  var _super_ = SvgTree.prototype;
  SelectTree.prototype.initialize = function (selector, settings) {
    if (!_super_.initialize.call(this, selector, settings)) {
      return false;
    }
    this.addIcons();
    this.dispatch.on("updateNodes.selectTree", this.updateNodes);
    this.dispatch.on("loadDataAfter.selectTree", this.loadDataAfter);
    this.dispatch.on("updateSvg.selectTree", this.renderCheckbox);
    this.dispatch.on("nodeSelectedAfter.selectTree", this.nodeSelectedAfter);
    return true;
  };
  SelectTree.prototype.updateNodes = function (nodeSelection) {
    if (this.settings.showCheckboxes) {
      nodeSelection.selectAll(".tree-check use").attr("visibility", function (node) {
        var checked = Boolean(node.checked);
        if (d3.select(this).classed("icon-checked") && checked) {
          return "visible";
        } else if (d3.select(this).classed("icon-indeterminate") && node.indeterminate && !checked) {
          return "visible";
        } else if (d3.select(this).classed("icon-check") && !node.indeterminate && !checked) {
          return "visible";
        } else {
          return "hidden";
        }
      });
    }
  };
  SelectTree.prototype.renderCheckbox = function (nodeSelection) {
    var _this = this;
    if (this.settings.showCheckboxes) {
      this.textPosition = 50;
      var g = nodeSelection.filter(function (node) {
        return _this.isNodeSelectable(node) || Boolean(node.checked);
      }).append("g").attr("class", "tree-check").on("click", function (d) {
        _this.selectNode(d);
      });
      g.append("use").attr("x", 28).attr("y", -8).attr("visibility", "hidden").attr("class", "icon-check").attr("xlink:href", "#icon-check");
      g.append("use").attr("x", 28).attr("y", -8).attr("visibility", "hidden").attr("class", "icon-checked").attr("xlink:href", "#icon-checked");
      g.append("use").attr("x", 28).attr("y", -8).attr("visibility", "hidden").attr("class", "icon-indeterminate").attr("xlink:href", "#icon-indeterminate");
    }
  };
  SelectTree.prototype.updateAncestorsIndeterminateState = function (node) {
    var _this = this;
    var indeterminate = false;
    node.parents.forEach(function (index) {
      var n = _this.nodes[index];
      n.indeterminate = node.checked || node.indeterminate || indeterminate;
      indeterminate = node.checked || node.indeterminate || n.checked || n.indeterminate;
    });
  };
  SelectTree.prototype.loadDataAfter = function () {
    this.nodes.forEach(function (node) {
      node.indeterminate = false;
    });
    this.calculateIndeterminate(this.nodes);
    this.saveCheckboxes(this.nodes);
    if (typeof TYPO3.FormEngine.Validation !== "undefined" && typeof TYPO3.FormEngine.Validation.validate === "function") {
      TYPO3.FormEngine.Validation.validate();
    }
  };
  SelectTree.prototype.calculateIndeterminate = function (nodes) {
    nodes.forEach(function (node) {
      if ((node.checked || node.indeterminate) && node.parents && node.parents.length > 0) {
        node.parents.forEach(function (parentNodeIndex) {
          nodes[parentNodeIndex].indeterminate = true;
        });
      }
    });
  };
  SelectTree.prototype.nodeSelectedAfter = function (node) {
    this.updateAncestorsIndeterminateState(node);
    this.calculateIndeterminate(this.nodes);
    this.saveCheckboxes();
  };
  SelectTree.prototype.saveCheckboxes = function () {
    if (typeof this.settings.input !== "undefined") {
      var selectedNodes = this.getSelectedNodes();
      this.settings.input.value = selectedNodes.map(function (d) {
        return d.identifier;
      });
    }
  };
  SelectTree.prototype.addIcons = function () {
    this.data.icons = {
      check: {
        identifier: "check",
        icon: "<g width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" xmlns=\"http://www.w3.org/2000/svg\">" + "<rect height=\"16\" width=\"16\" fill=\"transparent\"></rect><path transform=\"scale(0.01)\" d=\"M1312 256h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113v-832q0-66-47-113t-113-47zm288 160v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z\"></path></g>"
      },
      checked: {
        identifier: "checked",
        icon: "<g width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" xmlns=\"http://www.w3.org/2000/svg\"><rect height=\"16\" width=\"16\" fill=\"transparent\"></rect><path transform=\"scale(0.01)\" d=\"M813 1299l614-614q19-19 19-45t-19-45l-102-102q-19-19-45-19t-45 19l-467 467-211-211q-19-19-45-19t-45 19l-102 102q-19 19-19 45t19 45l358 358q19 19 45 19t45-19zm851-883v960q0 119-84.5 203.5t-203.5 84.5h-960q-119 0-203.5-84.5t-84.5-203.5v-960q0-119 84.5-203.5t203.5-84.5h960q119 0 203.5 84.5t84.5 203.5z\"></path></g>"
      },
      indeterminate: {
        identifier: "indeterminate",
        icon: "<g width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" xmlns=\"http://www.w3.org/2000/svg\"><rect height=\"16\" width=\"16\" fill=\"transparent\"></rect><path transform=\"scale(0.01)\" d=\"M1344 800v64q0 14-9 23t-23 9h-832q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h832q14 0 23 9t9 23zm128 448v-832q0-66-47-113t-113-47h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113zm128-832v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z\"></path></g>"
      }
    };
  };

  return SelectTree;

});