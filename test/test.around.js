module("jsAspect.around");

(function() {

  test("jsAspect.inject: 'around' advice, 'prototypeMethods' pointcut", function() {
    function Target() {
    }

    Target.prototype.identity = function(x) {
      return x;
    };

    Target.prototype.minusOne = function(x) {
      return x - 1;
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(func, x) {
        return 2 * func(x);
      }
    );

    var obj = new Target();

    equal(obj.identity(3), 6, "'around' advice has been applied to 'identity'");
    equal(obj.minusOne(3), 4, "'around' advice has been applied to 'minusOne'");
  });

  test("jsAspect.inject: 'around' advice, 'prototypeMethods' pointcut, multiple arguments in the method", function() {
    function Target() {
    }

    Target.prototype.sum = function() {
      var args = [].slice.call(arguments, 0);

      return args.reduce(function(accumulated, current){
        return accumulated + current;
      });
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(func) {
        var args = [].slice.call(arguments, 1),
          sum = func.apply(this, args);

        return (sum > 10) ? sum : 0;
      }
    );

    var obj = new Target();

    equal(obj.sum(1, 2, 3), 0, "'around' advice has been applied to 'sum'");
    equal(obj.sum(1, 2, 3, 4, 5), 15, "'around' advice has been applied to 'sum'");
  });

  test("jsAspect.inject: 'around' advice, 'prototypeMethods' pointcut: 'this' has the correct value", function() {
    var obj = new Target();

    function Target() {
    }

    Target.prototype.identity = function(x) {
      equal(obj, this, "'this' is correct in 'identity'");
      return x;
    };

    Target.prototype.minusOne = function(x) {
      equal(obj, this, "'this' is correct in 'minusOne'");
      return x - 1;
    };

    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(func, x) {
        equal(obj, this, "'this' is correct in advice 1");
        return 2 * func(x);
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(func, x) {
        equal(obj, this, "'this' is correct in advice 2");
        return 3 * func(x);
      }
    );
    jsAspect.inject(Target, jsAspect.POINTCUT.PROTOTYPE_METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(func, x) {
        equal(obj, this, "'this' is correct in advice 3");
        return 4 * func(x);
      }
    );

    equal(obj.identity(3), 72, "'around' advice has been applied to 'identity'");
    equal(obj.minusOne(3), 48, "'around' advice has been applied to 'minusOne'");
  });

  test("jsAspect.inject: 'around' advice, 'self' pointcut", function() {
    function Target() {
    }

    Target.prototype.identity = function(x) {
      return x;
    };

    var obj = new Target();

    obj.multiplyByTwo = function(x) {
      return 2 * x;
    };

    jsAspect.inject(obj, jsAspect.POINTCUT.METHODS, jsAspect.JOIN_POINT.AROUND,
      function aroundCallback(func, x) {
        return func(x) - 1;
      }
    );

    equal(obj.identity(5), 5, "'around' advice has not been applied to 'identity'");
    equal(obj.multiplyByTwo(3), 5, "'around' advice has been applied to 'multiplyByTwo'");
  });
})();