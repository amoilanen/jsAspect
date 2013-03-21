module("jsAspect.around");

(function() {
    
    test("jsAspect.inject: 'around' advice, 'prototype' pointcut", function() {
        function Object() {
        };
        
        Object.prototype.identity = function(x) {
            return x;
        };
        
        Object.prototype.minusOne = function(x) {
            return x - 1;
        };
        
        jsAspect.inject(Object, jsAspect.pointcuts.prototype, jsAspect.advices.around,
            function aroundCallback(func, x) {
                return 2 * func(x);
            }
        );

        var obj = new Object();
        
        equal(obj.identity(3), 6, "'around' pointcut has been applied to 'identity'");
        equal(obj.minusOne(3), 4, "'around' pointcut has been applied to 'minusOne'");
    });
    
    //TODO: Multiple arguments in the function to which the advice is applied
    //TODO: Multiple around advices for the same pointcut
    //TODO: 'self' pointcut
})();