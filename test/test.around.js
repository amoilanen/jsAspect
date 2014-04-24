module("jsAspect.around");

(function() {

  test("jsAspect.inject: 'around' advice, 'prototypeMethods' pointcut", function() {
    function Target() {
    }

    Target.prototype.identity = function(x) {
      return x;
    };

    Target.prototype.minusOne = function(x) {
      return x - 1;
    };

    jsAspect.inject(Target, jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(context, func, x) {
        return 2 * func(x);
      }
    );

    var obj = new Target();

    equal(obj.identity(3), 6, "'around' advice has been applied to 'identity'");
    equal(obj.minusOne(3), 4, "'around' advice has been applied to 'minusOne'");
  });

  test("jsAspect.inject: 'around' advice, 'prototypeMethods' pointcut, multiple arguments in the method", function() {
    function Target() {
    }

    Target.prototype.sum = function() {
      var args = [].slice.call(arguments, 0);

      return args.reduce(function(accumulated, current){
        return accumulated + current;
      });
    };

    jsAspect.inject(Target, jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(context, func) {
        var args = [].slice.call(arguments, 2),
          sum = func.apply(this, args);

        return (sum > 10) ? sum : 0;
      }
    );

    var obj = new Target();

    equal(obj.sum(1, 2, 3), 0, "'around' advice has been applied to 'sum'");
    equal(obj.sum(1, 2, 3, 4, 5), 15, "'around' advice has been applied to 'sum'");
  });

  test("jsAspect.inject: 'around' advice, 'prototypeMethods' pointcut: 'this' has the correct value", function() {
    var obj = new Target();

    function Target() {
    }

    Target.prototype.identity = function(x) {
      equal(obj, this, "'this' is correct in 'identity'");
      return x;
    };

    Target.prototype.minusOne = function(x) {
      equal(obj, this, "'this' is correct in 'minusOne'");
      return x - 1;
    };

    jsAspect.inject(Target, jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(context, func, x) {
        equal(obj, this, "'this' is correct in advice 1");
        return 2 * func(x);
      }
    );
    jsAspect.inject(Target, jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(context, func, x) {
        equal(obj, this, "'this' is correct in advice 2");
        return 3 * func(x);
      }
    );
    jsAspect.inject(Target, jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(context, func, x) {
        equal(obj, this, "'this' is correct in advice 3");
        return 4 * func(x);
      }
    );

    equal(obj.identity(3), 72, "'around' advice has been applied to 'identity'");
    equal(obj.minusOne(3), 48, "'around' advice has been applied to 'minusOne'");
  });

  test("jsAspect.inject: 'around' advice, 'methods' pointcut", function() {
    function Target() {
    }

    Target.prototype.identity = function(x) {
      return x;
    };

    var obj = new Target();

    obj.multiplyByTwo = function(x) {
      return 2 * x;
    };

    jsAspect.inject(obj, jsAspect.SCOPE.METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(context, func, x) {
        return func(x) - 1;
      }
    );

    equal(obj.identity(5), 5, "'around' advice has not been applied to 'identity'");
    equal(obj.multiplyByTwo(3), 5, "'around' advice has been applied to 'multiplyByTwo'");
  });

  test("jsAspect.inject: 'around' has context", function() {
    var args = [1, 2, 3];
    var retValue = args.reduce(function(acc, cur) {
      return acc + cur;
    }, 0) + 1;

    function Target() {
    }

    Target.prototype.sum = function(x, y, z) {
      return x + y + z;
    };

    jsAspect.inject(Target, jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function(context, method, x, y, z) {
        equal(context.method.name, "sum", "method name is passed to 'context' properly");
        deepEqual(context.method.arguments, args, "method arguments are passed to 'context' properly");
        equal(method(1, 2, 3), 6, "invoked method is passed correctly");
        deepEqual([x, y, z], args, "arguments are passed correctly");
        return retValue;
      }
    );

    var obj = new Target();
    equal(obj.sum.apply(obj, args), retValue, "Advice is applied");
  });

  test("jsAspect.inject: 'around' advice, 'context.stop' prevents rest of 'around' advices from execution, as well as 'after' and 'afterReturning' advices", function() {
    var recordedValues = [];

    var obj = new Target();

    function Target() {
    }

    Target.prototype.identity = function(x) {
      return x;
    };

    jsAspect.inject(Target,
      jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function(context, x) {
        recordedValues.push("after");
      }
    );
    jsAspect.inject(Target,
      jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function(context, retValue) {
        recordedValues.push("afterReturning");
      }
    );
    jsAspect.inject(Target,
      jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function(context, func, x) {
        recordedValues.push("around1");
        return 2 * func(x);
      }
    );
    jsAspect.inject(Target,
      jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function(context, func, x) {
        recordedValues.push("around2");
        return 3 * func(x);
      }
    );
    jsAspect.inject(Target,
      jsAspect.SCOPE.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function(context, func, x) {
        recordedValues.push("around3");
        context.stop();
        equal(func(x), undefined);
        return 4 * func(x);
      }
    );

    equal(obj.identity(3), undefined, "after stopping returned value is 'undefined'");
    deepEqual(recordedValues, ["around3"], "only one around advice has been applied");
  });

  test("jsAspect.around: 'prototypeMethods' pointcut is used by default", function() {
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

    jsAspect.around(Target, function(context, func) {
      recordedValues.push(context.method.name);
      return func() + "_advised";
    }).around(Target, function(context, func) {
      recordedValues.push(context.method.name);
      return func() + "_advised";
    }, jsAspect.SCOPE.METHODS);

    equal(obj.method1(), "method1value_advised", "method1 returns correct value");
    equal(obj.method2(), "method2value_advised", "method2 returns correct value");
    equal(Target.method1static(), "method1staticvalue_advised", "method1static returns correct value");

    deepEqual(recordedValues, ["method1", "method2", "method1static"], "advices are applied");
  });

  //TODO: 'around' advice has an 'around' advice applied to it itself, the context should be passed properly still
})();