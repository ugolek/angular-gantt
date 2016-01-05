(function () {
    'use strict';
    angular.module('gantt.associator', ['gantt']).directive('ganttAssociator', ['$compile', '$document', function ($compile, $document) {
        return {
            restrict: 'E',
            require: '^gantt',
            scope: {
                enabled: '=?',
                tasks: '=?'
            },
            link: function (scope, element, attrs, ganttCtrl) {
                var api = ganttCtrl.gantt.api;
                var x1, y1;
                scope.rows = [];

                // Load options from global options attribute.
                if (scope.options && typeof (scope.options.bounds) === 'object') {
                    for (var option in scope.options.bounds) {
                        scope[option] = scope.options[option];
                    }
                }

                if (scope.enabled === undefined) {
                    scope.enabled = true;
                }



                api.directives.on.new(scope, function (directiveName, bodyScope, bodyElement) {
                    if (directiveName === 'ganttRow') {
                        scope.rows.push(bodyScope);
                    }
                    if (directiveName === 'ganttBody') {
                        var boundsScope = bodyScope.$new();
                        boundsScope.pluginScope = scope;

                        var comp = $document[0].createElement('canvas');

                        var canvas = $compile(comp)(scope)[0];

                        canvas.style.position = 'absolute';
                        canvas.style.top = '0';
                        canvas.style.zIndex = '100';

                        bodyElement.prepend(canvas);
                        var ctx = canvas.getContext('2d');
                        
                        var drawAssociatorLines = function () {
                             if (scope.enabled) {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);

                                if (scope.tasks.length === 1 && scope.tasks[0].orderPosition === 'single') {
                                    return;
                                } else if (scope.tasks.length > 0) {
                                    canvas.style.width = '100%';
                                    canvas.style.height = '100%';

                                    canvas.width = canvas.offsetWidth;
                                    canvas.height = canvas.offsetHeight;

                                    var parentRect = bodyElement[0].getBoundingClientRect();
                                    var rows = scope.rows;


                                    scope.tasks.sort(function (a, b) {
                                        if (a.from < b.from) {
                                            return -1;
                                        } else if (a.from > b.from) {
                                            return 1;
                                        } else {
                                            return 0;
                                        }
                                    });

                                    for (var i = 0; i < scope.tasks.length; i++) {

                                        var childRect = scope.tasks[i].view[0].getBoundingClientRect();
                                        var nextMachineId = scope.tasks[i].orderPosition.nextMachineId;
                                        var prevMachineId = scope.tasks[i].orderPosition.previousMachineId;
                                        var nextMachineRect, prevMachineRect;
                                        var yPrev, yNext;


                                        for (var j = 0; j < rows.length; j++) {
                                            if (prevMachineId === rows[j].row.model.machineLink.toString()) {
                                                prevMachineRect = rows[j].row.$element[0].getBoundingClientRect();
                                                yPrev = prevMachineRect.top - parentRect.top + rows[j].row.$element[0].clientHeight / 2;
                                            }
                                            if (nextMachineId === rows[j].row.model.machineLink.toString()) {
                                                nextMachineRect = rows[j].row.$element[0].getBoundingClientRect();
                                                yNext = nextMachineRect.top - parentRect.top + rows[j].row.$element[0].clientHeight / 2;
                                            }
                                        }


                                        x1 = childRect.left - parentRect.left;
                                        y1 = childRect.top - parentRect.top;


                                        if (scope.tasks[i].orderPosition.positionType === 'start') {
                                            ctx.moveTo(x1, y1);
                                            if (scope.tasks.length === 1) {
                                                if (nextMachineId !== null) {
                                                    ctx.lineTo(parentRect.width, yNext);
                                                }
                                            }
                                        } else if (scope.tasks[i].orderPosition.positionType === 'end') {
                                            if (scope.tasks.length === 1) {
                                                if (prevMachineId !== null) {
                                                    ctx.moveTo(0, yPrev);
                                                }
                                            }
                                            ctx.lineTo(x1, y1);
                                        } else {
                                            if (scope.tasks.length === 1) {
                                                if (prevMachineId !== null) {
                                                    ctx.moveTo(0, yPrev);
                                                    ctx.lineTo(x1, y1);
                                                }
                                                if (nextMachineId !== null) {
                                                    ctx.moveTo(x1, y1);
                                                    ctx.lineTo(parentRect.width, yNext);
                                                }
                                            } else if (i === 0) {
                                                if (prevMachineId !== null) {
                                                    ctx.moveTo(0, yPrev);
                                                    ctx.lineTo(x1, y1);
                                                }
                                                //backup if failure base
                                                ctx.moveTo(x1, y1);
                                            } else if (i === scope.tasks.length - 1) {
                                                ctx.lineTo(x1, y1);
                                                if (nextMachineId !== null) {
                                                    ctx.lineTo(parentRect.width, yNext);
                                                }
                                            } else {
                                                ctx.lineTo(x1, y1);
                                            }
                                        }
                                    }

                                    ctx.strokeStyle = '#FFFF00';
                                    ctx.stroke();
                                }
                            }
                        };

                        api.registerMethod('associator', 'drawAssociatorLines', drawAssociatorLines, scope);
                        
                        scope.$watchCollection('tasks', drawAssociatorLines);
                        
                        
                    }
                });
            }
        };
    }]);
} ());