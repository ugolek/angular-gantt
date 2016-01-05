/*
Project: cti-angular-gantt v2.0.22 - Gantt chart component for AngularJS
Authors: Marco Schweighauser, Rémi Alvergnat
License: MIT
Homepage: http://www.angular-gantt.com
Github: https://github.com/angular-gantt/angular-gantt.git
*/
(function () {
    'use strict';
    angular.module('gantt.selector', ['gantt']).directive('ganttTaskSelector', ['$rootScope', '$document', '$compile', function ($rootScope, $document, $compile) {
        return {
            restrict: 'E',
            require: '^gantt',
            scope: {
                enabled: '='
            },
            link: function (scope, element, attrs, ganttCtrl) {
                scope.selectedTasks = [];
                scope.transitSelectedTasks = [];
                var api = ganttCtrl.gantt.api;
                scope.ganttCtrl = ganttCtrl;
                scope.newMoveStarted = false;
                scope.isMouseDown = false;
                scope.taskWritingOnClick = [];

                var x1 = 0, y1 = 0, y2 = 0;

                if (scope.enabled === undefined) {
                    scope.enabled = true;
                }

                scope.api = api;

                var getTasks = function () {
                    return scope.selectedTasks;
                };

                api.registerMethod('selector', 'getTasks', getTasks, scope);
                api.registerEvent('selector', 'selectedTasksChanged');
                
                api.directives.on.new(scope, function (directiveName, currentScope, element) {
                    if (directiveName === 'ganttBody') {
                        var bodyScope = currentScope.$new();
                        bodyScope.pluginScope = scope;

                        var ifElement = $document[0].createElement('div');
                        ifElement.setAttribute('class', 'selector-line');
                        ifElement.setAttribute('data-ng-if', 'enabled && isMouseDown');

                        var compiled = $compile(ifElement)(scope);
                        element.append(compiled);

                        scope.compiledElement = compiled;
                    }
                    
                     if (directiveName === 'ganttTask' && scope.enabled) {
                         element[0].addEventListener('click', taskClickHandler(currentScope.task));
                         scope.taskWritingOnClick.push(currentScope.task);
                     }
                });
                
                var bodyMouseDownHandler = function (event) {
                    if (scope.enabled) {
                        scope.newMoveStarted = true;
                        scope.isMouseDown = true;
                        var parentRect = this.getBoundingClientRect();
                        var childRect = event.target.getBoundingClientRect();
                        x1 = childRect.left - parentRect.left + event.offsetX;
                        y1 = childRect.top - parentRect.top + event.offsetY;
                        scope.dateLine = scope.api.core.getDateByPosition(x1);
                        scope.ganttCtrl.gantt.body.$element[0].addEventListener('touchmove', mouseMoveEventHandler);
                        scope.ganttCtrl.gantt.body.$element[0].addEventListener('mousemove', mouseMoveEventHandler);
                    }
                };

                var bodyMouseUpHandler = function () {
                    if (scope.enabled) {
                        scope.ganttCtrl.gantt.body.$element[0].removeEventListener('touchmove', mouseMoveEventHandler);
                        scope.ganttCtrl.gantt.body.$element[0].removeEventListener('mousemove', mouseMoveEventHandler);
                        scope.newMoveStarted = false;
                        scope.isMouseDown = false;
                        scope.$apply();
                    }
                };

                var rowMouseMoveHandler = function (row) {

                    return function () {
                        if (scope.newMoveStarted && scope.isMouseDown) {
                            scope.newMoveStarted = false;
                            scope.selectedTasks = [];
                            var parentRect = this.getBoundingClientRect();
                            var childRect = event.target.getBoundingClientRect();
                            var x1 = childRect.left - parentRect.left + event.offsetX;
                            var customDateLine = scope.api.core.getDateByPosition(x1);

                            var currentRowTasks = row.visibleTasks;
                            for (var i = 0; i < currentRowTasks.length; i++) {
                                if (customDateLine.isAfter(currentRowTasks[i].model.from) && scope.selectedTasks.indexOf(currentRowTasks[i].model) < 0) {
                                    scope.selectedTasks.push(currentRowTasks[i].model);
                                }
                            }
                            scope.$apply();
                        }
                    };
                };
                var rowMouseEnterHandler = function (row) {
                    return function () {
                        if (scope.isMouseDown) {
                            var currentRowTasks = row.visibleTasks;
                            for (var i = 0; i < currentRowTasks.length; i++) {
                                if (scope.dateLine.isAfter(currentRowTasks[i].model.from) && scope.selectedTasks.indexOf(currentRowTasks[i].model) < 0) {
                                    scope.selectedTasks.push(currentRowTasks[i].model);
                                }
                            }
                            scope.$apply();
                        }
                    };

                };
                var rowMouseLeaveHandler = function (row) {
                    return function () {
                        if (scope.isMouseDown) {
                            var currentRowTasks = row.visibleTasks;

                            if ((event.offsetY < 2 && y1 < y2) || (event.offsetY === event.currentTarget.scrollHeight && y1 > y2)) {
                                for (var i = 0; i < currentRowTasks.length; i++) {
                                    var index = scope.selectedTasks.indexOf(currentRowTasks[i].model);
                                    if (scope.dateLine.isAfter(currentRowTasks[i].model.from) && index > -1) {
                                        scope.selectedTasks.splice(index, 1);
                                    }
                                }
                            }

                            scope.$apply();
                        }
                    };
                };

                var mouseMoveEventHandler = function (event) {
                    y2 = event.target.getBoundingClientRect().top - this.getBoundingClientRect().top + event.offsetY;
                    reCalc();
                };


                var taskClickHandler = function (task) {
                   return function (){
                        if (scope.enabled) {
                        var index = scope.selectedTasks.indexOf(task.model);

                        if (index === -1) {
                            scope.selectedTasks.push(task.model);
                        } else {
                            scope.selectedTasks.splice(index, 1);
                        }
                    }
                    scope.$apply();
                   };
                   
                };

                var reCalc = function () {
                    var lineDiv = scope.compiledElement[0].nextSibling;

                    if (lineDiv) {
                        var y3 = Math.min(y1, y2);
                        var y4 = Math.max(y1, y2);

                        lineDiv.style.left = x1 + 'px';
                        lineDiv.style.top = y3 + 'px';
                        lineDiv.style.width = 2 + 'px';
                        lineDiv.style.backgroundColor = 'yellow';
                        lineDiv.style.height = y4 - y3 + 'px';
                        lineDiv.style.position = 'absolute';
                    }
                };


                scope.$watch('enabled', function (newValue, oldValue) {
                    if (newValue) {
                        scope.ganttCtrl.gantt.body.$element[0].addEventListener('mousedown', bodyMouseDownHandler);
                        scope.ganttCtrl.gantt.body.$element[0].addEventListener('mouseup', bodyMouseUpHandler);

                        scope.ganttCtrl.gantt.rowsManager.visibleRows.forEach(function (row) {
                            row.$element[0].addEventListener('mousemove', rowMouseMoveHandler(row));
                            row.$element[0].addEventListener('mouseenter', rowMouseEnterHandler(row));
                            row.$element[0].addEventListener('mouseleave', rowMouseLeaveHandler(row));

                            row.visibleTasks.forEach(function (task) {
                                task.$element[0].addEventListener('click', taskClickHandler(task));
                                scope.taskWritingOnClick.push(task);
                            });
                        });
                    }
                    else if (newValue === false && oldValue === true){
                        scope.ganttCtrl.gantt.body.$element[0].removeEventListener('mousedown', bodyMouseDownHandler);
                        scope.ganttCtrl.gantt.body.$element[0].removeEventListener('mouseup', bodyMouseUpHandler);

                        scope.ganttCtrl.gantt.rowsManager.visibleRows.forEach(function (row) {
                            row.$element[0].removeEventListener('mousemove', rowMouseMoveHandler(row));
                            row.$element[0].removeEventListener('mouseenter', rowMouseEnterHandler(row));
                            row.$element[0].removeEventListener('mouseleave', rowMouseLeaveHandler(row));

                            scope.taskWritingOnClick.forEach(function (task) {
                                task.$elelment[0].removeEventListener('click', taskClickHandler(task));
                                scope.taskWritingOnClick = [];
                            });
                        });
                    }
                });

                scope.$watchCollection('selectedTasks', function (newValue, oldValue) {
                    api.selector.raise.selectedTasksChanged(newValue, oldValue);
                }); 
            }
        };
    }]);
} ());
angular.module('gantt.selector.templates', []).run(['$templateCache', function($templateCache) {

}]);

//# sourceMappingURL=cti-angular-gantt-selector-plugin.js.map