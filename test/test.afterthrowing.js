module("jsAspect.afterThrowing");

(function() {
    
    test("jsAspect.inject: 'afterThrowing' advice, 'prototypeMethods' pointcut", function() {
        function Object() {
        }
        Object.prototype.method1 = function() {
            throw new Error("method1exception");
        };
        
        Object.prototype.method2 = function() {
            throw new Error("method2exception");
        };
        
        jsAspect.inject(Object, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
            function afterThrowingCallback(exception) {
                this.thrownExceptions = this.thrownExceptions || [];
                this.thrownExceptions.push(exception.message);
            }
        );

        var obj = new Object();
        var thrownExceptions = [];
        
        ["method1", "method2"].forEach(function (methodName) {
            try {
                obj[methodName]();
            } catch (exception) {
                thrownExceptions.push(exception.message);
            }
        });
        
        deepEqual(thrownExceptions, ["method1exception", "method2exception"], "Exceptions are thrown from the methods");
        deepEqual(obj.thrownExceptions, ["method1exception", "method2exception"], "Aspects recieve the exceptions");
    });
    
    test("jsAspect.inject: 'afterThrowing' several aspects", function() {
        function Object() {
        }

        Object.prototype.method1 = function() {
            throw new Error("method1exception");
        };
        
        Object.prototype.method2 = function() {
            throw new Error("method2exception");
        };
        
        jsAspect.inject(Object, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
            function afterThrowingCallback(exception) {
                exception.message = exception.message + "_aspect1"
            }
        );
        jsAspect.inject(Object, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
            function afterThrowingCallback(exception) {
                exception.message = exception.message + "_aspect2"
            }
        );

        var obj = new Object();
        var thrownExceptions = [];
        
        ["method1", "method2"].forEach(function (methodName) {
            try {
                obj[methodName]();
            } catch (exception) {
                thrownExceptions.push(exception.message);
            }
        });
        
        deepEqual(thrownExceptions, ["method1exception_aspect2_aspect1", "method2exception_aspect2_aspect1"], "Multiple aspects are applied");
    });

    test("jsAspect.inject: 'afterThrowing' advice throws an exception", function() {
        function Object() {
        }
        
        Object.prototype.method = function() {
            throw new Error("method1exception");
        };
        
        jsAspect.inject(Object, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
            function afterThrowingCallback(exception) {
                throw new Error("callbackexception");
            }
        );

        var obj = new Object();
        
        try {
            obj.method();
            ok(false, "Exception should have been thrown at this point");
        } catch (e) {
            equal(e.message, "callbackexception", "Exception from advice");
        }
    });
})();