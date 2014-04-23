module("jsAspect.POINTCUT regex");

(function() {

  test("jsAspect.Aspect allows specifying a regex which will match some of the methods", function() {
    var obj = {
      aabc: function() {
        return "aabc";
      },
      bcd: function() {
        return "bcd";
      },
      abc: function() {
        return "abc";
      },
      bc: function() {
        return "bc";
      }
    };
    var calledMethodNames = [];

    var aspect = new jsAspect.Aspect([
      new jsAspect.Advice.Before(function(context) {
        calledMethodNames.push(context.method.name);
      })
    ]);

    aspect.withPointcut(jsAspect.POINTCUT.METHODS, "a+bc").applyTo(obj);

    equal(obj.aabc(), "aabc", "method 'aabc' executed");
    equal(obj.bcd(), "bcd", "method 'bcd' executed");
    equal(obj.abc(), "abc", "method 'abc' executed");
    equal(obj.bc(), "bc", "method 'bc' executed");

    deepEqual(calledMethodNames, ["aabc", "abc"], "Advice was applied only for the methods that match a regex");
  });

  test("jsAspect.Aspect if no regex is specified then all the methods will be matches by default", function() {
    var obj = {
      aabc: function() {
        return "aabc";
      },
      bcd: function() {
        return "bcd";
      },
      abc: function() {
        return "abc";
      },
      bc: function() {
        return "bc";
      }
    };
    var calledMethodNames = [];

    var aspect = new jsAspect.Aspect([
      new jsAspect.Advice.Before(function(context) {
        calledMethodNames.push(context.method.name);
      })
    ]);

    aspect.withPointcut(jsAspect.POINTCUT.METHODS).applyTo(obj);

    equal(obj.aabc(), "aabc", "method 'aabc' executed");
    equal(obj.bcd(), "bcd", "method 'bcd' executed");
    equal(obj.abc(), "abc", "method 'abc' executed");
    equal(obj.bc(), "bc", "method 'bc' executed");

    deepEqual(calledMethodNames, ["aabc", "bcd", "abc", "bc"], "Advice was applied to all methods");
  });

  test("jsAspect.Aspect regex, PROTOTYPE_METHODS pointcut, 'after' advice", function() {
    function Target() {
      this.field1 = "";
      this.field2 = "";
    }

    Target.prototype.setField1 = function(value) {
      this.field1 = value;
    }

    Target.prototype.setField2 = function(value) {
      this.field2 = value;
    }

    Target.prototype.getField1 = function() {
      return this.field1;
    }

    Target.prototype.getField2 = function() {
      return this.field2;
    }

    var calledMethodNames = [];

    var aspect = new jsAspect.Aspect([
      new jsAspect.Advice.After(function(context) {
        calledMethodNames.push(context.method.name);
      })
    ]);

    aspect.withPointcut(jsAspect.POINTCUT.PROTOTYPE_METHODS, "get.*").applyTo(Target);

    var obj = new Target();

    equal(obj.setField1("field1value"), (void 0), "'setField1' executed");
    equal(obj.getField1(), "field1value", "'getField1' executed");
    equal(obj.setField2("field2value"), (void 0), "'setField2' executed");
    equal(obj.getField2(), "field2value", "'getField2' executed");

    deepEqual(calledMethodNames, ["getField1", "getField2"], "Advice was applied only to methods matches by regex");
  });
})();