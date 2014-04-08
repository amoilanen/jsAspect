module("jsAspect.before");

(function() {

  test("jsAspect.inject: 'before' advice, 'prototypeMethods' pointcut", function() {
    function Object() {
    };

    Object.prototype.method1 = function() {
      return "method1value";
    };

    Object.prototype.method2 = function() {
      return "method2value";
    };

    jsAspect.inject(Object, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.before,
      function beforeCallback() {
        var args = [].slice.call(arguments, 1);

        this.beforeCallbackArgs = this.beforeCallbackArgs || [];
        this.beforeCallbackArgs.push(args);
      }
    );

    var obj = new Object();

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
    deepEqual(obj.beforeCallbackArgs, [["arg1", "arg2"], ["arg3", "arg4", "arg5"]], "before callback was called as expected with correct 'this'");
  });

  test("jsAspect.inject: 'before' advice, 'prototypeMethods' pointcut, object contains fields other than functions, they are left intact", function() {
    function Object() {
    };

    Object.prototype.field1 = "field1value";

    jsAspect.inject(Object, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.before,
      function beforeCallback() {
      }
    );

    var obj = new Object();

    equal(obj.field1, "field1value", "fields are not affected")
  });

  test("jsAspect.inject: multiple 'before' advice, 'prototypeMethods' pointcut", function() {
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
        jsAspect.inject(Object, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.before,
          function() {
            var args = [].slice.call(arguments, 1);

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
        "before callback " + adviceName + " was called as expected with correct 'this'");
      });
  });

  test("jsAspect.inject: 'before' advice is executed before method invocation", function() {
    function Object() {
    };

    Object.prototype.method1 = function() {
      this.accumulated && this.accumulated.splice(0, this.accumulated.length);
      return "method1value";
    };

    jsAspect.inject(Object, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.before,
      function() {
        var args = [].slice.call(arguments, 1);

        this.accumulated = this.accumulated || [];
        this.accumulated.push(args);
      }
    );

    var obj = new Object();

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    deepEqual(obj.accumulated, [], "Pointcut was executed before the method: the array is empty");
  });

  test("jsAspect.inject 'before' advice, 'methods' pointcut", function() {
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

    jsAspect.inject(obj, jsAspect.pointcuts.methods, jsAspect.advices.before,
      function() {
        var args = [].slice.call(arguments, 1);

        this.accumulated = this.accumulated || [];
        this.accumulated.push(args);
      }
    );

    equal(obj.method1("arg1", "arg2"), "method1value", "method1 was called as expected and returned the correct value");
    equal(obj.method2("arg3", "arg4", "arg5"), "method2value", "method2 was called as expected and returned the correct value");
    deepEqual(obj.accumulated, [["arg3", "arg4", "arg5"]], "Pointcut was executed before the object method but not before the prototype method");
  });

  test("jsAspect.inject 'before' advice, last `context` argument contains method name", function() {
    var obj = {
      method1: function() {
        return "method1value";
      },
      method2: function() {
        return "method2value";
      }
    };
    var calledMethodNames = [];

    jsAspect.inject(obj, jsAspect.pointcuts.methods, jsAspect.advices.before,
      function(context) {
        calledMethodNames.push(context.methodName);
      }
    );

    equal(obj.method1(), "method1value", "method1 executed");
    equal(obj.method2(), "method2value", "method2 executed");
    deepEqual(calledMethodNames, ["method1", "method2"], "Method name is available in context");
  });

  test("jsAspect.inject 'before' advice, stopping execution", function() {
    var calledMethodNames = [];
    var calledAdviceNames = [];
    var obj = {
      method1: function() {
        calledMethodNames.push("method1value");
        return "method1value";
      },
      method2: function() {
        calledMethodNames.push("method2value");
        return "method2value";
      }
    };

    jsAspect.inject(obj, jsAspect.pointcuts.methods, jsAspect.advices.before,
      function() {
        calledAdviceNames.push("beforeAdvice1");
      }
    );

    jsAspect.inject(obj, jsAspect.pointcuts.methods, jsAspect.advices.before,
      function() {
        calledAdviceNames.push("beforeAdvice2");
      }
    );
    jsAspect.inject(obj, jsAspect.pointcuts.methods, jsAspect.advices.before,
      function(context) {
        context.stop();
        calledAdviceNames.push("beforeAdvice3");
      }
    );

    equal(obj.method1(), undefined, "Stopped execution of method1");
    equal(obj.method2(), undefined, "Stopped execution of method2");
    deepEqual(calledMethodNames, [], "Original methods have been stopped");
    deepEqual(calledAdviceNames, ["beforeAdvice3", "beforeAdvice3"], "Remaining advices have not been called");
  });

  test("jsAspect.inject 'before' advice, last `context` argument contains target constructor name", function() {
    var obj = {
      method1: function() {
        return "method1value";
      },
      method2: function() {
        return "method2value";
      }
    };

    function Account(){
      this.amount = 1000;
    }

    Account.prototype.withDraw = function(nAmount) {
      if (this.amount < nAmount) {
        return false;
      }
      this.amount -= nAmount;
      return true;
    };

    var calledClassNames = [];

    jsAspect.inject(obj, jsAspect.pointcuts.methods, jsAspect.advices.before, function(context) {
      calledClassNames.push(context.targetConstructor.name);
    });

    //An example for a own data type.
    jsAspect.inject(Account, jsAspect.pointcuts.prototypeMethods, jsAspect.advices.before, function(context) {
      calledClassNames.push(context.targetConstructor.name);
    });

    var acc = new Account();

    equal(obj.method1(), "method1value", "method1 executed");
    equal(obj.method2(), "method2value", "method2 executed");
    equal(acc.withDraw(500), true, "withDrawn 500 dollars");
    deepEqual(calledClassNames, ["Object", "Object", "Account"], "Constructor name is available in context");
  });
})();