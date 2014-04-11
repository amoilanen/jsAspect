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

    var aspect = new jsAspect.Aspect([new jsAspect.Advice.Before(function (context) {
      called.push({method: context.method.name, constructor: context.targetConstructor.name});
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
      new jsAspect.Advice.Before(function(context) {
        called.push({
          method: context.method.name,
          constructor: context.targetConstructor.name, 
          joinPoint: "before"
        });
      }),
      new jsAspect.Advice.After(function() {
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
      new jsAspect.Advice.Before(function(context) {
        called.push({
          method: context.method.name,
          constructor: context.targetConstructor.name,
          joinPoint: "before"
        });
      }),
      new jsAspect.Advice.After(function() {
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
      new jsAspect.Advice.Before(function() {
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
      new jsAspect.Advice.Before(function() {
        called.push("advice1");
      }, jsAspect.POINTCUT.METHODS),
      new jsAspect.Advice.Before(function() {
        called.push("advice2");
      }, jsAspect.POINTCUT.METHODS),
      new jsAspect.Advice.Before(function() {
        called.push("advice3");
      }, jsAspect.POINTCUT.METHODS)
    );

    aspect.applyTo(obj);

    equal(obj.method("test"), "methodvalue", "method is called successfully");

    deepEqual(called, ["advice3", "advice2", "advice1"], "Advices were all applied");
  });

  test("jsAspect.applyAdvice: applying aspect with inheritance", function() {
    function Parent() {
    }

    Parent.prototype.method1 = function() {
      return "method1";
    };

    function Child() {
    }

    Child.prototype = new Parent();
    Child.prototype.constructor = Child;

    Child.prototype.method2 = function() {
      return "method2";
    };

    function AnotherChild() {
    }

    AnotherChild.prototype = new Parent();
    AnotherChild.prototype.constructor = AnotherChild;

    AnotherChild.prototype.method3 = function() {
      return "method3";
    };

    function beforeAdvice(context) {
      calledMethods.push({method: context.method.name, joinPoint: "before"});
    }

    function afterAdvice() {
      calledMethods.push({joinPoint: "after"});
    }

    /*
     * PROTOTYPE_METHODS pointcut
     */
    var calledMethods = [];

    new jsAspect.Aspect(
      new jsAspect.Advice.Before(beforeAdvice),
      new jsAspect.Advice.After(afterAdvice)
    ).applyTo(Child);

    var child = new Child();

    equal(child.method1(), "method1", "Child method1");
    equal(child.method2(), "method2", "Child method2");

    deepEqual(calledMethods, [
      {method: "method1", joinPoint: "before"},
      {joinPoint: "after"},
      {method: "method2", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advices applied for both the inherited and own methods");

    /*
     * PROTOTYPE_OWN_METHODS pointcut
     */
    calledMethods = [];

    new jsAspect.Aspect(
      new jsAspect.Advice.Before(beforeAdvice, jsAspect.POINTCUT.PROTOTYPE_OWN_METHODS),
      new jsAspect.Advice.After(afterAdvice, jsAspect.POINTCUT.PROTOTYPE_OWN_METHODS)
    ).applyTo(AnotherChild);

    var anotherChild = new AnotherChild();

    equal(anotherChild.method1(), "method1", "AnotherChild method1");
    equal(anotherChild.method3(), "method3", "AnotherChild method3");

    deepEqual(calledMethods, [
      {method: "method3", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advices applied only for own methods");
  });
})();