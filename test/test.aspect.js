module("jsAspect.Aspect");

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

    var aspect = new jsAspect.Aspect([new jsAspect.Before(function (context) {
      called.push({method: context.methodName, constructor: context.targetConstructor.name});
    })]);

    aspect.applyTo(Target);

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

    var aspect = new jsAspect.Aspect([
      new jsAspect.Before(function(context) {
        called.push({
          method: context.methodName,
          constructor: context.targetConstructor.name, 
          joinPoint: "before"
        });
      }),
      new jsAspect.After(function() {
        called.push({joinPoint: "after"});
      })
    ]);

    aspect.applyTo(Target);

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

    var aspect = new jsAspect.Aspect([
      new jsAspect.Before(function(context) {
        called.push({
          method: context.methodName,
          constructor: context.targetConstructor.name,
          joinPoint: "before"
        });
      }),
      new jsAspect.After(function() {
        called.push({joinPoint: "after"});
      })
    ]);

    aspect.applyTo(Target1);
    aspect.applyTo(Target2);

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

  test("jsAspect.Aspect.applyTo: can take multiple arguments", function() {
    function Target() {
      this.method = function() {
        return "methodvalue";
      };
    }

    var objects = [new Target(), new Target(), new Target()];

    var called = [];

    var aspect = new jsAspect.Aspect([
      new jsAspect.Before(function() {
        called.push(this);
      }, jsAspect.POINTCUT.METHODS)
    ]);

    //Same as aspect.applyTo.apply(aspect, objects);
    aspect.applyTo(objects[0], objects[1], objects[2]);

    objects.forEach(function(obj, idx) {
      equal(obj.method(), "methodvalue", "object " + idx + " method successful");
    });

    deepEqual(called, objects, "Aspect was applied for all objects");
  });

  test("jsAspect.Aspect: constructor can take multiple arguments", function() {
    var obj = {
      method: function() {
        return "methodvalue";
      }
    };

    var called = [];

    var aspect = new jsAspect.Aspect(
      new jsAspect.Before(function() {
        called.push("advice1");
      }, jsAspect.POINTCUT.METHODS),
      new jsAspect.Before(function() {
        called.push("advice2");
      }, jsAspect.POINTCUT.METHODS),
      new jsAspect.Before(function() {
        called.push("advice3");
      }, jsAspect.POINTCUT.METHODS)
    );

    aspect.applyTo(obj);

    equal(obj.method(), "methodvalue", "method is called successfully");

    deepEqual(called, ["advice3", "advice2", "advice1"], "Advices were all applied");
  });

  test("jsAspect.applyAdvice: applying aspect with inheritance", function() {
    function Parent() {
    }

    Parent.prototype.method1 = function() {
      return "method1";
    };

    function Child(gender) {
    }

    Child.prototype = new Parent(); // make Student inherit from a Person object
    Child.prototype.constructor = Child; // fix constructor property

    Child.prototype.method2 = function() {
      return "method2";
    };

    var calledMethods = [];
    var beforeAdvice = new jsAspect.Before(function(context) {
      calledMethods.push({method: context.methodName, joinPoint: "before"});
    });
    var afterAdvice = new jsAspect.After(function() {
      calledMethods.push({joinPoint: "after"});
    });

    var loggerAspect = new jsAspect.Aspect(beforeAdvice, afterAdvice);
    loggerAspect.applyTo(Child);

    var dude = new Child();

    equal(dude.method1(), "method1", "Starting method1");
    equal(dude.method2(), "method2", "Starting method2");

    deepEqual(calledMethods, [
      {method: "method1", joinPoint: "before"},
      {joinPoint: "after"},
      {method: "method2", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advices applied for both the inherited and own methods");
  });
})();