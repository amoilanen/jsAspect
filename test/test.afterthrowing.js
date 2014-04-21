module("jsAspect.afterThrowing");

(function() {

  test("jsAspect.inject: 'afterThrowing' advice, 'prototypeMethods' pointcut", function() {
    var recordedValues = [];

    function Target() {
    }

    Target.prototype.method1 = function() {
      throw new Error("method1exception");
    };

    Target.prototype.method2 = function() {
      throw new Error("method2exception");
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER,
      function(context) {
        recordedValues.push("after");
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_RETURNING,
      function(context) {
        recordedValues.push("afterReturning");
      }
    );

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function afterThrowingCallback(context, exception) {
        this.thrownExceptions = this.thrownExceptions || [];
        this.thrownExceptions.push(exception.message);
      }
    );

    var obj = new Target();
    var thrownExceptions = [];

    ["method1", "method2"].forEach(function (methodName) {
      try {
        obj[methodName]();
      } catch (exception) {
        thrownExceptions.push(exception.message);
      }
    });

    deepEqual(recordedValues, [], "'after' and 'afterReturning' advices are not applied after exception is thrown");
    deepEqual(thrownExceptions, ["method1exception", "method2exception"], "Exceptions are thrown from the methods");
    deepEqual(obj.thrownExceptions, ["method1exception", "method2exception"], "Aspects recieve the exceptions");
  });

  test("jsAspect.inject: 'afterThrowing' several aspects", function() {
    function Target() {
    }

    Target.prototype.method1 = function() {
      throw new Error("method1exception");
    };

    Target.prototype.method2 = function() {
      throw new Error("method2exception");
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function afterThrowingCallback(context, exception) {
        exception.message = exception.message + "_aspect1"
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function afterThrowingCallback(context, exception) {
        exception.message = exception.message + "_aspect2"
      }
    );

    var obj = new Target();
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
    function Target() {
    }

    Target.prototype.method = function() {
      throw new Error("method1exception");
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function afterThrowingCallback(context, exception) {
        throw new Error("callbackexception");
      }
    );

    var obj = new Target();

    try {
      obj.method();
      ok(false, "Exception should have been thrown at this point");
    } catch (e) {
      equal(e.message, "callbackexception", "Exception from advice");
    }
  });

  test("jsAspect.inject: 'afterThrowing' advice has context", function() {
    var args = ["arg1", "arg2", "arg3"];

    var exceptionMessagesInAdvice = [];

    function Target() {
    }

    Target.prototype.method = function() {
      throw new Error("method1exception");
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function afterThrowingCallback(context, exception) {
        equal(context.method.name, "method", "method name is passed to 'context' properly");
        deepEqual(context.method.arguments, args, "method arguments are passed to 'context' properly");
        exceptionMessagesInAdvice.push(exception.message);
      }
    );

    var obj = new Target();

    try {
      obj.method.apply(obj, args);
      ok(false, "Exception should have been thrown at this point");
    } catch (e) {
      equal(e.message, "method1exception", "Exception caught");
      deepEqual(exceptionMessagesInAdvice, ["method1exception"], "Advice is applied");
    }
  });

  test("jsAspect.inject: 'context.stop' prevents following 'afterThrowing' advices from execution", function() {
    function Target() {
    }

    Target.prototype.method = function() {
      throw new Error("method1exception");
    };

    var recordedValues = [];

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function(context, exception) {
        recordedValues.push("advice1");
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function(context, exception) {
        recordedValues.push("advice2");
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AFTER_THROWING,
      function(context, exception) {
        recordedValues.push("advice3");
        context.stop();
      }
    );

    var obj = new Target();

    try {
      obj.method();
      ok(false, "Exception should have been thrown at this point");
    } catch (e) {
      equal(e.message, "method1exception", "Exception caught");
      deepEqual(recordedValues, ["advice3"], "Only one advice is applied");
    }
  });

  test("jsAspect.afterThrowing 'prototypeMethods' pointcut is used by default", function() {
    var recordedValues = [];

    function Target() {
    }

    Target.method1static = function() {
      throw new Error("method1staticexception");
    };

    Target.prototype.method1 = function() {
      throw new Error("method1exception");
    };

    Target.prototype.method2 = function() {
      throw new Error("method2exception");
    };

    var obj = new Target();

    jsAspect.afterThrowing(Target, function(context) {
      recordedValues.push(context.method.name);
    }).afterThrowing(Target, function(context) {
      recordedValues.push(context.method.name);
    }, jsAspect.POINTCUT.METHODS);

    try {
      obj.method1();
      ok(false, "Exception should have been when calling method1");
    } catch (e) {
      equal(e.message, "method1exception", "Exception caught for method1");
    }
    try {
      obj.method2();
      ok(false, "Exception should have been when calling method2");
    } catch (e) {
      equal(e.message, "method2exception", "Exception caught for method2");
    }
    try {
      Target.method1static();
      ok(false, "Exception should have been when calling method1static");
    } catch (e) {
      equal(e.message, "method1staticexception", "Exception caught for method1static");
    }
    deepEqual(recordedValues, ["method1", "method2", "method1static"], "advices are applied");
  });
})();