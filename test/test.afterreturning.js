module("jsAspect.afterReturning");

(function() {

  test("jsAspect.inject: 'afterReturning' advice, 'prototypeMethods' pointcut", function() {
    function Target() {
    }

    Target.prototype.wrapValue = function(value) {
      return {value: value};
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function afterReturningCallback(context, retValue) {
        retValue.value = retValue.value + 1;
        return retValue;
      }
    );

    var obj = new Target();

    equal(obj.wrapValue(2).value, 3, "'afterReturning' advice is applied");
  });

  test("jsAspect.inject: several 'afterReturning' aspects", function() {
    function Target() {
    }

    Target.prototype.identity = function(value) {
      return value;
    };

    ["aspect1", "aspect2", "aspect3"].forEach(function (aspectName) {
      jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
        function afterReturningCallback(context, retValue) {
          return retValue + "_" + aspectName;
        }
      );
    });

    equal(new Target().identity("value"), "value_aspect3_aspect2_aspect1", "'afterReturning' several aspects applied in the reverse order");
  });

  test("jsAspect.inject: 'afterReturning' has context", function() {
    function Target() {
    }

    Target.prototype.square = function(num) {
      return num * num;
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING, 
      function afterReturningCallback(context, retValue) {
        equal(context.method.name, "square", "method name is passed to 'context' properly");
        deepEqual(context.method.arguments, [3], "method arguments are passed to 'context' properly");
        deepEqual(retValue, 9, "return value is passed");
      }
    );

    var obj = new Target();
    obj.square(3);
  });
})();