module("jsAspect.applyAdvice");

(function ()
{

  test("jsAspect.applyAdvice: Apply advice oop", function ()
  {
    function TestObjectOOPAdvice(){
    }

    TestObjectOOPAdvice.prototype.testMethodAdviceOOP1 = function(){
        return "testMethodAdviceOOP1";
      };
    TestObjectOOPAdvice.prototype.testMethodAdviceOOP2 = function()
      {
        return "testMethodAdviceOOP2";
      };

    var calledMethodAndConstructor = [];

    var beforeAdvice = new jsAspect.BeforeAdvice(function (context)
      {
        calledMethodAndConstructor.push({method: context.methodName, constructor: context.targetConstructor.name});
      }
    );

    var objectAspect = new jsAspect.Aspect([beforeAdvice]);

    jsAspect.applyAspect(TestObjectOOPAdvice, objectAspect);

    var obj = new TestObjectOOPAdvice();

    equal(obj.testMethodAdviceOOP1(), "testMethodAdviceOOP1", "method1 successful");
    equal(obj.testMethodAdviceOOP2(), "testMethodAdviceOOP2", "method2 successful");

    deepEqual(calledMethodAndConstructor, [
      {method: "testMethodAdviceOOP1", constructor: "TestObjectOOPAdvice"},
      {method: "testMethodAdviceOOP2", constructor: "TestObjectOOPAdvice"}
    ], "Advice invoked");
  });



  test("jsAspect.applyAdvice: Apply multiple advices oop", function ()
  {
    function TestObjectMultipleAdvicesOOP(){}

    TestObjectMultipleAdvicesOOP.prototype.testMethodMultipleAdvicesOOP1 = function ()
    {
      return "testMethodMultipleAdvicesOOP1";
    };
    TestObjectMultipleAdvicesOOP.prototype.testMethodMultipleAdvicesOOP2 = function ()
    {
      return "testMethodMultipleAdvicesOOP2";
    };

    var calledMethodAndConstructor = [];

    var beforeAdvice = new jsAspect.BeforeAdvice(function (context)
      {
        calledMethodAndConstructor.push({method: context.methodName, constructor: context.targetConstructor.name, joinPoint:"before"});
      }
    );
    var afterAdvice = new jsAspect.AfterAdvice(function ()
      {
        calledMethodAndConstructor.push({joinPoint: "after"});
      }
    );

    var objectAspect = new jsAspect.Aspect([beforeAdvice, afterAdvice]);

    jsAspect.applyAspect(TestObjectMultipleAdvicesOOP, objectAspect);

    var obj = new TestObjectMultipleAdvicesOOP();

    equal(obj.testMethodMultipleAdvicesOOP1(), "testMethodMultipleAdvicesOOP1", "method1 successful");
    equal(obj.testMethodMultipleAdvicesOOP2(), "testMethodMultipleAdvicesOOP2", "method2 successful");

    deepEqual(calledMethodAndConstructor, [
      {method: "testMethodMultipleAdvicesOOP1", constructor: "TestObjectMultipleAdvicesOOP", joinPoint:"before"},
      {joinPoint:"after"},
      {method: "testMethodMultipleAdvicesOOP2", constructor: "TestObjectMultipleAdvicesOOP", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advice invoked");
  });

  test("jsAspect.applyAdvice: Apply aspect to multiple constructors oop", function ()
  {
    function TestObjectMultipleConstructorsOOP(){}
    TestObjectMultipleConstructorsOOP.prototype.testMethodMultipleAdvicesOOP1 = function ()
    {
      return "testMethodMultipleAdvicesOOP1";
    };
    TestObjectMultipleConstructorsOOP.prototype.testMethodMultipleAdvicesOOP2 = function ()
    {
      return "testMethodMultipleAdvicesOOP2";
    };

    function TestObjectMultipleConstructorsOOP1(){}
    TestObjectMultipleConstructorsOOP1.prototype.testMethodMultipleAdvicesOOP1 = function () {
      return "testMethodMultipleAdvicesOOP1";
    };
    TestObjectMultipleConstructorsOOP1.prototype.testMethodMultipleAdvicesOOP2 = function () {
      return "testMethodMultipleAdvicesOOP2";
    };

    var calledMethodAndConstructor = [];

    var beforeAdvice = new jsAspect.BeforeAdvice(function (context)
      {
        calledMethodAndConstructor.push({method: context.methodName, constructor: context.targetConstructor.name, joinPoint: "before"});
      }
    );
    var afterAdvice = new jsAspect.AfterAdvice(function ()
      {
        calledMethodAndConstructor.push({joinPoint: "after"});
      }
    );

    var objectAspect = new jsAspect.Aspect([beforeAdvice, afterAdvice]);

    jsAspect.applyAspect(TestObjectMultipleConstructorsOOP, objectAspect);
    jsAspect.applyAspect(TestObjectMultipleConstructorsOOP1, objectAspect);

    var obj = new TestObjectMultipleConstructorsOOP();

    equal(obj.testMethodMultipleAdvicesOOP1(), "testMethodMultipleAdvicesOOP1", "method1 successful");
    equal(obj.testMethodMultipleAdvicesOOP2(), "testMethodMultipleAdvicesOOP2", "method2 successful");
    deepEqual(calledMethodAndConstructor, [
      {method: "testMethodMultipleAdvicesOOP1", constructor: "TestObjectMultipleConstructorsOOP", joinPoint: "before"},
      {joinPoint: "after"},
      {method: "testMethodMultipleAdvicesOOP2", constructor: "TestObjectMultipleConstructorsOOP", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advice on first constructor invoked");


    calledMethodAndConstructor = [];
    var otherObj = new TestObjectMultipleConstructorsOOP1();

    equal(otherObj.testMethodMultipleAdvicesOOP1(), "testMethodMultipleAdvicesOOP1", "method1 successful");
    equal(otherObj.testMethodMultipleAdvicesOOP2(), "testMethodMultipleAdvicesOOP2", "method2 successful");
    deepEqual(calledMethodAndConstructor, [
      {method: "testMethodMultipleAdvicesOOP1", constructor: "TestObjectMultipleConstructorsOOP1", joinPoint: "before"},
      {joinPoint: "after"},
      {method: "testMethodMultipleAdvicesOOP2", constructor: "TestObjectMultipleConstructorsOOP1", joinPoint: "before"},
      {joinPoint: "after"}
    ], "Advice on second constructor invoked");
  });

})
();