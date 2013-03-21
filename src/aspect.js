/*
//http://www.dotvoid.com/2005/06/aspect-oriented-programming-and-javascript/
*/

//TODO: Use Grunt to build the library

//TODO: Add a couple of demos of using the library:
//-logging
//-caching

//TODO: Add error handling
//TODO: Add an example of an aspect itself having an aspect injected to the tests

//TODO: Add documentation to the implemented methods

//TODO: Enable injecting aspects both to the prototype and to the function itself
//Two types of pointcuts are supported: "prototype" and "function", depending on that
//different behavior changes will be applied
(function(host) {
    
    var jsAspect = {
            pointcuts: {},
            advices: {}
        },
        aspectEnhancedFlagName = "__aspect_enhanced",
        allAdvices = ["before", "after", "afterThrowing", "afterReturning", "around"],
        allPointcuts = ["self", "prototype"];
    
    allAdvices.forEach(function (advice) {
        jsAspect.advices[advice] = "__" + advice;
    });
    allPointcuts.forEach(function (pointcut) {
        jsAspect.pointcuts[pointcut] = pointcut;
    });

    jsAspect.introduce = function (target, pointcut, introduction) {
        target = (jsAspect.pointcuts.self == pointcut) ? target : target.prototype;
        for (var property in introduction) {
            if (introduction.hasOwnProperty(property)) {
                target[property] = introduction[property];
            }
        }
    };

    jsAspect.inject = function (target, pointcut, advice, aspect) {
         var originalAdvice = advice;
        
         target = (jsAspect.pointcuts.prototype == pointcut) ? target.prototype : target;
         
         if (jsAspect.advices.around == advice) {
             aspect = wrapAroundAspect(aspect);
         };
         for (var method in target) {
             if (target.hasOwnProperty(method) && isFunction(target[method])) {
                 enhanceWithAspects(target, method);                 
                 target[method][advice].unshift(aspect);
             }
         };
    };
    
    function wrapAroundAspect(aspect) {
        var oldAspect = aspect;
        
        var wrappedAspect = function (leftAroundAspects) {
            var oThis = this,
                nextWrappedAspect = leftAroundAspects.shift(),
                args = [].slice.call(arguments, 1);

            if (nextWrappedAspect) {
                var nextUnwrappedAspect = function() {
                    var argsForWrapped = [].slice.call(arguments, 0);
                
                    argsForWrapped.unshift(leftAroundAspects);
                    return nextWrappedAspect.apply(oThis, argsForWrapped);
                };
                args.unshift(nextUnwrappedAspect);
            };
            return oldAspect.apply(this, args);
        };
        //Can be useful for debugging
        wrappedAspect.__originalAspect = oldAspect;
        return wrappedAspect;
    };
    
    function enhanceWithAspects(target, methodName) {
        var oldMethod = target[methodName];

        if (!target[methodName][aspectEnhancedFlagName]) {

           //TODO: Implement support for all the remaining advices  
           target[methodName] = function() {
               var self = this,
                   args = [].slice.call(arguments, 0);

               target[methodName][jsAspect.advices.before].forEach(function (asp) {                                    
                   asp.apply(self, args);
               });

               //TODO: Re-factor
               var aroundAspects = target[methodName][jsAspect.advices.around].slice(0, target[methodName][jsAspect.advices.around].length);
               args.unshift(aroundAspects);

               var firstAroundAspect = aroundAspects.shift();
               
               return firstAroundAspect.apply(this, args);
               
               //return oldMethod.apply(this, args);
           };
           allAdvices.forEach(function (advice) {           
               target[methodName][jsAspect.advices[advice]] = [];
           });
           target[methodName][jsAspect.advices.around].unshift(wrapAroundAspect(oldMethod));
           target[methodName][aspectEnhancedFlagName] = true;
        };
    };
    
    function isFunction(obj) {
        return obj && Object.prototype.toString.call(obj) == '[object Function]';
    }
    
    host.jsAspect = jsAspect;
})(window);