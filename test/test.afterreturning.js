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

  test("jsAspect.inject: 'stop' can be called in 'afterReturning', the rest of 'afterReturning' advices are not executed", function() {
    var recordedValues = [];

    function Target() {
    }

    Target.prototype.method = function() {
      return "value";
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function(context, retValue) {
        recordedValues.push("advice1_" + retValue);
        return retValue;
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function(context, retValue) {
        recordedValues.push("advice2_" + retValue);
        return retValue;
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function(context, retValue) {
        context.stop();
        recordedValues.push("advice3_" + retValue);
        return retValue;
      }
    );

    var obj = new Target();

    equal(obj.method(), (void 0), "'undefined' is returned if execution is stopped");
    deepEqual(recordedValues, ["advice3_value"], "only one advice is called");
  });

  test("jsAspect.afterReturning: 'prototypeMethods' pointcut is used by default", function() {
    var recordedValues = [];

    function Target() {
    }

    Target.method1static = function() {
      return "method1staticvalue";
    };

    Target.prototype.method1 = function() {
      return "method1value";
    };

    Target.prototype.method2 = function() {
      return "method2value";
    };

    var obj = new Target();

    jsAspect.afterReturning(Target, function(context, retValue) {
      recordedValues.push(context.method.name);
      return retValue;
    }).afterReturning(Target, function(context, retValue) {
      recordedValues.push(context.method.name);
      return retValue;
    }, jsAspect.POINTCUT.METHODS);

    equal(obj.method1(), "method1value", "method1 returns correct value");
    equal(obj.method2(), "method2value", "method2 returns correct value");
    equal(Target.method1static(), "method1staticvalue", "method1static returns correct value");

    deepEqual(recordedValues, ["method1", "method2", "method1static"], "advices are applied");
  });
})();