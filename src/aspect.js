/*
//http://www.dotvoid.com/2005/06/aspect-oriented-programming-and-javascript/
*/

//TODO: Use Grunt to build the library

//TODO: Add a couple of demos of using the library:
//-logging
//-caching

//TODO: Add error handling

//TODO: Add documentation to the implemented methods

//TODO: Enable injecting aspects both to the prototype and to the function itself
//Two types of pointcuts are supported: "prototype" and "function", depending on that
//different behavior changes will be applied
(function(host) {
    
    var jsAspect = {
        pointcuts: {},
        advices: {}
    };
    
    ["self", "prototype"].forEach(function (pointcut) {
        jsAspect.pointcuts[pointcut] = pointcut;
    });
    ["before", "after", "after-throwing", "after-returning", "around"].forEach(function (advice) {
        jsAspect.advices[advice] = advice;
    });
    
    jsAspect.introduce = function (target, pointcut, introduction) {
        target = (jsAspect.pointcuts.self == pointcut) ? target : target.prototype;
        for (var property in introduction) {
            if (introduction.hasOwnProperty(property)) {
                target[property] = introduction[property];
            }
        }
    };

    //TODO: Re-factor this to use chains of methods that are stored in local fields?
    //Defining a lot of closures can be time consuming and inefficient
    jsAspect.inject = function (target, pointcut, advice, aspect) {
        if (advice == jsAspect.advices.before) {
            advice = "__" + advice;
            
            for (var method in target.prototype) {
                if (target.prototype.hasOwnProperty(method) 
                        && isFunction(target.prototype[method])) {
                    
                    //Function is redefined only once, aspects are put into the list associated with the join point
                    if (undefined == target.prototype[method][advice]) {
                        (function(oldMethod) {
                            target.prototype[method] = function() {
                                var self = this,
                                    args = [].slice.call(arguments, 0);

                                target.prototype[method][advice].forEach(function (asp) {                                    
                                    asp.apply(self, args);
                                });
                                return oldMethod.apply(this, args);
                            };
                        })(target.prototype[method]);
                        
                        target.prototype[method][advice] = [];
                    };
                    target.prototype[method][advice].push(aspect);
                }
            };
        };
        //TODO: Implement support for all the pointcuts and advices        
    };
    
    function isFunction(obj) {
        return obj && Object.prototype.toString.call(obj) == '[object Function]';
    }
    
    host.jsAspect = jsAspect;
})(window);