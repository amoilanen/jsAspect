module("jsAspect.Aspect.applyTo");

(function() {

  test("jsAspect.Aspect.applyTo: applying advice", function() {
    function Target(){
    }

    Target.prototype.method1 = function() {
      return "method1value";
    };
    Target.prototype.method2 = function() {
      return "method2value";
    };

    var called = [];

    var objectAspect = new jsAspect.Aspect([new jsAspect.BeforeAdvice(function (context) {
      called.push({method: context.methodName, constructor: context.targetConstructor.name});
    })]);

    objectAspect.applyTo(Target);

    var obj = new Target();

    equal(obj.method1(), "method1value", "method1 successful");
    equal(obj.method2(), "method2value", "method2 successful");

    deepEqual(called, [
      {method: "method1", constructor: "Target"},
      {method: "method2", constructor: "Target"}
    ], "Advice invoked");
  });

  test("jsAspect.Aspect.applyTo: applying multiple advices", function() {
    function Target(){}

    Target.prototype.method1 = function() {
      return "method1value";
    };
    Target.prototype.method2 = function() {
      return "method2value";
    };

    var called = [];

    var objectAspect = new jsAspect.Aspect([
      new jsAspect.BeforeAdvice(function(context) {
        called.push({
          method: context.methodName,
          constructor: context.targetConstructor.name, 
          joinPoint: "before"
        });
      }),
      new jsAspect.AfterAdvice(function() {
        called.push({joinPoint: "after"});
      })
    ]);

    objectAspect.applyTo(Target);

    var obj = new Target();

    equal(obj.method1(), "method1value", "method1 successful");
    equal(obj.method2(), "method2value", "method2 successful");

    deepEqual(called, [
      {method: "method1", constructor: "Target", joinPoint:"before"},
      {joinPoint:"after"},
      {method: "method2", constructor: "Target", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advice invoked");
  });

  test("jsAspect.Aspect.applyTo: multiple objects", function() {
    function Target1(){}

    Target1.prototype.method1 = function() {
      return "target1method1value";
    };
    Target1.prototype.method2 = function() {
      return "target1method2value";
    };

    function Target2(){}

    Target2.prototype.method1 = function() {
      return "target2method1value";
    };
    Target2.prototype.method2 = function() {
      return "target2method2value";
    };

    var called = [];

    var objectAspect = new jsAspect.Aspect([
      new jsAspect.BeforeAdvice(function(context) {
        called.push({
          method: context.methodName,
          constructor: context.targetConstructor.name,
          joinPoint: "before"
        });
      }),
      new jsAspect.AfterAdvice(function() {
        called.push({joinPoint: "after"});
      })
    ]);

    objectAspect.applyTo(Target1);
    objectAspect.applyTo(Target2);

    var obj1 = new Target1();

    equal(obj1.method1(), "target1method1value", "obj1 method1 successful");
    equal(obj1.method2(), "target1method2value", "obj1 method2 successful");
    deepEqual(called, [
      {method: "method1", constructor: "Target1", joinPoint: "before"},
      {joinPoint: "after"},
      {method: "method2", constructor: "Target1", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advice on first constructor invoked");


    called = [];
    var obj2 = new Target2();

    equal(obj2.method1(), "target2method1value", "obj2 method1 successful");
    equal(obj2.method2(), "target2method2value", "obj2 method2 successful");
    deepEqual(called, [
      {method: "method1", constructor: "Target2", joinPoint: "before"},
      {joinPoint: "after"},
      {method: "method2", constructor: "Target2", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advice on second constructor invoked");
  });
})();