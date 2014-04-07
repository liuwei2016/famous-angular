'use strict';

angular.module('integrationApp')
  .directive('faAnimation', function (famous) {
    return {
      restrict: 'EA',
      scope: true,
      compile: function(tElement, tAttrs, transclude){
        var Transform = famous['famous/core/Transform'];
        var Easing = famous['famous/transitions/Easing'];
        console.log(Easing)
        return {
          pre: function(scope, element, attrs){
            var timeline = scope.$eval(attrs.timeline)
            if(!timeline instanceof Function)
              throw 'timeline must be a reference to a function';

            var animates = element.find('animate');
            for(var i = 0; i < animates.length; i++){
              (function(){
                var animate = animates[i];

                //DOM selector string that points to our mod of interest
                if(animate.attributes['targetmodselector']){
                  //dig out the reference to our modifier
                  var modElement = element.parent().find(animate.attributes['targetmodselector'].value);
                  var modScope = angular.element(modElement).scope();
                  var modifier = modScope.isolate[modScope.$id].modifier;

                  window.m = modifier;

                  var curve = animate.attributes['curve'] && animate.attributes['curve'].value !== 'linear' 
                    ? Easing[animate.attributes['curve'].value]
                    : function(j) {return j;}; //linear

                  //assign the modifier functions
                  //TODO:  support multiple fields on a given modifier
                  if(animate.attributes['field']){
                    var field = animate.attributes['field'].value;
                    var lowerBound = animate.attributes['timelinelowerbound']
                      ? parseFloat(animate.attributes['timelinelowerbound'].value)
                      : 0;
                    var upperBound = animate.attributes['timelineupperbound']
                      ? parseFloat(animate.attributes['timelineupperbound'].value)
                      : 1;

                    if(!animate.attributes['startvalue'])
                      throw 'you must provide a start value for the animation'
                    var startValue = scope.$eval(animate.attributes['startvalue'].value);

                    if(!animate.attributes['endvalue'])
                      throw 'you must provide an end value for the animation'
                    var endValue = scope.$eval(animate.attributes['endValue'].value);

                    //TODO:  in order to support nested fa-animation directives,
                    //       this function needs to be exposed somehow.
                    var transformFunction = function(){
                      var x = timeline();
                      if(x <= lowerBound)
                        return startValue;
                      if(x >= upperBound)
                        return endValue; 
                      //normalize our domain to [0, 1]
                      var subDomain = (upperBound - lowerBound)
                      var normalizedX = (x - lowerBound) / subDomain;

                      return startValue + curve(normalizedX) * (endValue - startValue);
                    };

                    if(field === 'opacity'){
                      modifier.opacityFrom(function(){
                        return transformFunction();
                      });
                    }else if (field === 'origin'){
                      modifier.originFrom(function(){
                        return transformFunction();
                      });
                    }else if (field === 'size'){
                      modifier.sizeFrom(function(){
                        return transformFunction();
                      });
                    }else{ //transform field
                      //TODO:  support multiple transform fields
                      modifier.transformFrom(function(){
                        return Transform[field](transformFunction());
                      });
                    }
                  }
                }
              })();
            }
          },
          post: function(scope, element, attrs){

          }
        }
      }
    };
  });