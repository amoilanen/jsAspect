module("jsAspect.after");

(function() {

  test("jsAspect.inject: 'after' advice, 'prototypeMethods' pointcut", function() {
    function Target() {
    }

    Target.prototype.method1 = function() {
      return "method1value";
    };

    Target.prototype.method2 = function() {
      return "method2value";
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function afterCallback() {
        var args = [].slice.call(arguments, 1);

        this.afterCallbackArgs = this.afterCallbackArgs || [];
        this.afterCallbackArgs.push(args);
      }
    );

    var obj = new Target();

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
    deepEqual(obj.afterCallbackArgs, [["arg1", "arg2"], ["arg3", "arg4", "arg5"]], "'after' advice was called as expected with correct 'this'");
  });

  test("jsAspect.inject: 'after' advice, 'prototypeMethods' pointcut, object contains fields other than functions, they are left intact", function() {
    function Target() {
    }

    Target.prototype.field1 = "field1value";

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function afterCallback() {
      }
    );

    var obj = new Target();

    equal(obj.field1, "field1value", "fields are not affected")
  });

  test("jsAspect.inject: multiple 'after' joinPoints, 'prototypeMethods' pointcut", function() {
    var adviceNames = ["advice1", "advice2", "advice3", "advice4", "advice5"];

    function Target() {
    }

    Target.prototype.method1 = function() {
      return "method1value";
    };

    Target.prototype.method2 = function() {
      return "method2value";
    };

    adviceNames.forEach(function(adviceName) {
      (function (adviceName) {
        jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
          function() {
            var args = [].slice.call(arguments, 1);

            this[adviceName] = this[adviceName] || [];
            this[adviceName].push(args);
          }
        );
      })(adviceName);
    });

    var obj = new Target();

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");

    adviceNames.forEach(function(adviceName) {
      deepEqual(obj[adviceName], [["arg1", "arg2"], ["arg3", "arg4", "arg5"]],
        "after advice " + adviceName + " was called as expected with correct 'this'");
    })
  });

  test("jsAspect.inject: 'after' advice is executed after method invocation", function() {
    function Target() {
    }

    Target.prototype.method1 = function() {
      this.accumulated && this.accumulated.splice(0, this.accumulated.length);
      return "method1value";
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function() {
        var args = [].slice.call(arguments, 1);

        this.accumulated = this.accumulated || [];
        this.accumulated.push(args);
      }
    );

    var obj = new Target();

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    deepEqual(obj.accumulated, [["arg1", "arg2"]], "Pointcut was executed after the method: the array is empty");
  });

  test("jsAspect.inject 'after' advice, 'methods' pointcut", function() {
    function Target() {
    }
    //Should not be enhanced with an aspect
    Target.prototype.method1 = function() {
      return "method1value";
    };

    var obj = new Target();

    //Will be enhanced with an aspect
    obj.method2 = function() {
      return "method2value";
    };

    jsAspect.inject(obj, jsAspect.POINTCUT.METHODS, jsAspect.JOIN_POINT.AFTER,
      function() {
        var args = [].slice.call(arguments, 1);

        this.accumulated = this.accumulated || [];
        this.accumulated.push(args);
      }
    );

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
    deepEqual(obj.accumulated, [["arg3", "arg4", "arg5"]], "Pointcut was executed after the object method but not after the prototype method");
  });

  test("jsAspect.inject 'after' advice, 'context' is passed as first argument", function() {
    var args = ["arg1", "arg2", "arg3"];

    function Target() {
    }
    Target.prototype.method1 = function() {
      return "method1value";
    };

    var obj = new Target();

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function(context) {
        equal(context.method.name, "method1", "method name is passed to 'context' properly");
        deepEqual(context.method.arguments, args, "method arguments are passed to 'context' properly");
        deepEqual([].slice.call(arguments, 1), args, "arguments are passed to advice after 'context'");
        deepEqual(context.target, obj, "target is passed to 'context' properly");
      }
    );
    obj.method1.apply(obj, args);
  });

  test("jsAspect.inject 'after' advice, 'context.stop' stops execution of remaining 'after' advices and 'afterReturning' advices", function() {
    function Target() {
    }
    Target.prototype.method1 = function() {
      return "method1value";
    };

    var obj = new Target();

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function(context) {
        throw Error("Another 'afterAdvice' should not be applied after 'stop'");
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function(context) {
        ok(true, "One 'after' advice is executed");
        context.stop();
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function afterReturningCallback(retValue) {
        throw Error("'afterReturningAdvice' should not be applied after 'stop'");
      }
    );
    obj.method1();
  });

  test("jsAspect.after: 'prototypeMethods' pointcut is used by default", function() {
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

    jsAspect.after(Target, function(context) {
      recordedValues.push(context.method.name);
    }).after(Target, function(context) {
      recordedValues.push(context.method.name);
    }, jsAspect.POINTCUT.METHODS);

    equal(obj.method1(), "method1value", "method1 returns correct value");
    equal(obj.method2(), "method2value", "method2 returns correct value");
    equal(Target.method1static(), "method1staticvalue", "method1static returns correct value");

    deepEqual(recordedValues, ["method1", "method2", "method1static"], "advices are applied");
  });
})();