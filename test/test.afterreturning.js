module("jsAspect.afterReturning");

(function() {
    
    test("jsAspect.inject: 'afterReturning' advice, 'prototypeMethods' pointcut", function() {
        function Object() {
        };
        
        Object.prototype.wrapValue = function(value) {
            return {value: value};
        };
        
        jsAspect.inject(Object, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.afterReturning,
            function afterReturningCallback(retValue) {
                retValue.value = retValue.value + 1;
                return retValue;
            }
        );

        var obj = new Object();
        
        equal(obj.wrapValue(2).value, 3, "'afterReturning' advice is applied");     
    });

    test("jsAspect.inject: several 'afterReturning' advices", function() {
        function Object() {
        };
        
        Object.prototype.identity = function(value) {
            return value;
        };
        
        ["advice1", "advice2", "advice3"].forEach(function (adviceName) {
            jsAspect.inject(Object, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.afterReturning,
                function afterReturningCallback(retValue) {
                    return retValue + "_" + adviceName;
                }
            );
        });
        
        equal(new Object().identity("value"), "value_advice3_advice2_advice1", "'afterReturning' several advices re applied in the reverse order");     
    });    
})();