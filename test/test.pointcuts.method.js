module("jsAspect.POINTCUT.method");

(function() {

  test("jsAspect.inject 'before' advice, 'method' pointcut then advice applied only to specified method", function() {
    var global = {};

    global.method0 = function() {
      return "method0value";
    };

    global.method1 = function() {
      return "method1value";
    };

    //Should not be enhanced with an aspect
    global.method0.prototype.method2 = function() {
      return "method2value";
    };

    var obj = new global.method0();

    //Should not be enhanced with an aspect
    obj.method3 = function() {
      return "method3value";
    };

    jsAspect.inject(global, jsAspect.POINTCUT.METHOD, jsAspect.JOIN_POINT.BEFORE,
      function() {
        var args = [].slice.call(arguments, 1);

        this.accumulated = this.accumulated || [];
        this.accumulated.push(args);
    }, "method0");

    equal(obj.method2("arg1", "arg2"), "method2value", "method2 was called as expected and returned the correct value");
    equal(obj.method3("arg3", "arg4", "arg5"), "method3value", "method3 was called as expected and returned the correct value");
    equal(global.method0("arg6", "arg7"), "method0value", "method0 was called as expected and returned the correct value");
    equal(global.method1("arg8", "arg9"), "method1value", "method1 was called as expected and returned the correct value");
    deepEqual(global.accumulated, [["arg6", "arg7"]], "Advice was applied only to the original function method0");
    deepEqual(global.method0.accumulated, undefined, "Advice was applied only to the original function method0");
    deepEqual(global.method0.prototype.accumulated, undefined, "Advice was applied only to the original function method0");
    deepEqual(obj.accumulated, undefined, "Advice was applied only to the original function method0");
  });

  test("jsAspect.inject 'before' advice, 'method' pointcut on not a function then advice is not applied", function() {
    var global = {};

    global.field1 = "field1value";

    jsAspect.inject(global, jsAspect.POINTCUT.METHOD, jsAspect.JOIN_POINT.BEFORE,
      function() {
        return "valuefromaspect";
      }, "field1");

    equal(global.field1, "field1value", "Advice was not applied to not a function");
  });
})();