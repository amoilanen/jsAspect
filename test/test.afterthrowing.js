module("jsAspect.afterThrowing");

(function() {

  test("jsAspect.inject: 'afterThrowing' advice, 'prototypeMethods' pointcut", function() {
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
})();