module("jsAspect.issues", {
  setup: function() {
    this.logged = [];
  }
});

(function() {

  function getAspectWithAfterBeforeMethodsAdvices(self) {
    var afterAdviceBehaviour = function() {
      self.logged.push("joinPoint", "after");
    };
    var beforeAdviceBehaviour = function() {
      self.logged.push("joinPoint", "before");
    };
    var afterAdvice =  new jsAspect.Advice.After(afterAdviceBehaviour, jsAspect.SCOPE.METHODS);
    var beforeAdvice = new jsAspect.Advice.Before(beforeAdviceBehaviour, jsAspect.SCOPE.METHODS);

    return new jsAspect.Aspect(beforeAdvice, afterAdvice);
  }

  test("Setting pointcut to SCOPE.METHODS does not work, method defined inside constructor", function() {
    var aspect = getAspectWithAfterBeforeMethodsAdvices(this);

    function Target() {
      this.method1 = function() {
        return "method1value";
      };
    }

    var target = new Target();

    aspect.applyTo(target);

    target.method1();

    deepEqual(this.logged, ["joinPoint", "before", "joinPoint", "after"], "advices were invoked");
  });

  test("Setting pointcut to SCOPE.METHODS does not work, method defined as object property", function() {
    var aspect = getAspectWithAfterBeforeMethodsAdvices(this);

    var foo = {
      method1: function () {
        return "foobar.";
      }
    };

    aspect.applyTo(foo);

    foo.method1();

    deepEqual(this.logged, ["joinPoint", "before", "joinPoint", "after"], "advices were invoked");
  });
})();