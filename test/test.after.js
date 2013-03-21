module("jsAspect.after");

(function() {
    
    test("jsAspect.inject: 'after' advice, 'prototype' pointcut", function() {
        function Object() {
        };
        
        Object.prototype.method1 = function() {
            return "method1value";
        };
        
        Object.prototype.method2 = function() {
            return "method2value";
        };
        
        jsAspect.inject(Object, jsAspect.pointcuts.prototype, jsAspect.advices.after,
            function afterCallback() {
                var args = [].slice.call(arguments, 0);

                this.afterCallbackArgs = this.afterCallbackArgs || [];
                this.afterCallbackArgs.push(args);
            }
        );

        var obj = new Object();
        
        equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
        equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
        deepEqual(obj.afterCallbackArgs, [["arg1", "arg2"], ["arg3", "arg4", "arg5"]], "'after' advice was called as expected with correct 'this'");
    });

    test("jsAspect.inject: 'after' advice, 'prototype' pointcut, object contains fields other than functions, they are left intact", function() {
        function Object() {
        };

        Object.prototype.field1 = "field1value";
        
        jsAspect.inject(Object, jsAspect.pointcuts.prototype, jsAspect.advices.after,
            function afterCallback() {
            }
        );
        
        var obj = new Object();

        equal(obj.field1, "field1value", "fields are not affected")
    });
    
    test("jsAspect.inject: multiple 'after' advices, 'prototype' pointcut", function() {
        var adviceNames = ["advice1", "advice2", "advice3", "advice4", "advice5"];
        
        function Object() {
        };
        
        Object.prototype.method1 = function() {
            return "method1value";
        };
        
        Object.prototype.method2 = function() {
            return "method2value";
        };
        
        adviceNames.forEach(function(adviceName) {
            (function (adviceName) {
                jsAspect.inject(Object, jsAspect.pointcuts.prototype, jsAspect.advices.after,
                    function() {
                        var args = [].slice.call(arguments, 0);

                        this[adviceName] = this[adviceName] || [];
                        this[adviceName].push(args);
                    }
                );
            })(adviceName);
        });

        var obj = new Object();
        
        equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
        equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
        
        adviceNames.forEach(function(adviceName) {            
            deepEqual(obj[adviceName], [["arg1", "arg2"], ["arg3", "arg4", "arg5"]],
                    "after advice " + adviceName + " was called as expected with correct 'this'");
        })
    });

    test("jsAspect.inject: 'after' advice is executed after method invocation", function() {
        function Object() {
        };
        
        Object.prototype.method1 = function() {
            this.accumulated && this.accumulated.splice(0, this.accumulated.length);
            return "method1value";
        };
        
        jsAspect.inject(Object, jsAspect.pointcuts.prototype, jsAspect.advices.after,
            function() {
                var args = [].slice.call(arguments, 0);
            
                this.accumulated = this.accumulated || [];
                this.accumulated.push(args);
            }
        );

        var obj = new Object();
        
        equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
        deepEqual(obj.accumulated, [["arg1", "arg2"]], "Pointcut was executed after the method: the array is empty");
    });
    
    test("jsAspect.inject 'after' advice, 'self' pointcut", function() {
        function Object() {
        };
        
        //Should not be enhanced with an aspect
        Object.prototype.method1 = function() {
            return "method1value";
        };
        
        var obj = new Object();
        
        //Will be enhanced with an aspect
        obj.method2 = function() {
            return "method2value";
        };

        jsAspect.inject(obj, jsAspect.pointcuts.self, jsAspect.advices.after,
            function() {
                var args = [].slice.call(arguments, 0);
            
                this.accumulated = this.accumulated || [];
                this.accumulated.push(args);
            }
        );
        
        equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
        equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
        deepEqual(obj.accumulated, [["arg3", "arg4", "arg5"]], "Pointcut was executed after the object method but not after the prototype method");
    });
})();