module("jsAspect.introduce");

(function() {

  test("jsAspect.introduce: 'methods' pointcut", function() {
    function Object() {
      this.field1 = "field1value";
    }

    Object.prototype.method1 = function() {
      return "valuefrommethod1";
    };

    equal(Object.field3, undefined, "Object.field3");
    equal(Object.prototype.field3, undefined, "Object.prototype.field3");
    equal(Object.staticmethod1, undefined, "Object.staticmethod1");
    equal(Object.prototype.staticmethod1, undefined, "Object.prototype.staticmethod1");

    jsAspect.introduce(Object, jsAspect.SCOPE.METHODS, {
      field3: "field3value",
      staticmethod1: function() {
        return "valuefromstaticmethod1";
      }
    });

    equal(Object.field3, "field3value", "Object.field3");
    equal(Object.prototype.field3, undefined, "Object.prototype.field3");
    equal(Object.staticmethod1 ? Object.staticmethod1() : "", "valuefromstaticmethod1", "Object.staticmethod1");
    equal(Object.prototype.staticmethod1, undefined, "Object.prototype.staticmethod1");
  });

  test("jsAspect.introduce: 'prototype own methods' pointcut", function() {
    function Object() {
      this.field1 = "field1value";
    }

    Object.prototype.method1 = function() {
      return "valuefrommethod1";
    };

    equal(Object.field3, undefined, "Object.field3");
    equal(Object.prototype.field3, undefined, "Object.prototype.field3");
    equal(Object.method2, undefined, "Object.method2");
    equal(Object.prototype.method2, undefined, "Object.prototype.method2");

    jsAspect.introduce(Object, jsAspect.SCOPE.PROTOTYPE_METHODS, {
      field3: "field3value",
      method2: function() {
        return "valuefrommethod2";
      }
    });

    var obj = new Object();

    equal(Object.field3, undefined, "Object.field3");
    equal(Object.prototype.field3, "field3value", "Object.prototype.field3");
    equal(Object.method2, undefined, "Object.method2");
    equal(obj.method2 ? obj.method2() : "", "valuefrommethod2", "Object.prototype.method2");
  });

  test("jsAspect.introduce: 'prototype' pointcut with prototypal inheritance", function() {
    function Parent() {
    }

    Parent.prototype.field1 = "field1value";

    function Child() {
    }

    Child.prototype = new Parent();

    Child.prototype.field2 = "field2value";

    jsAspect.introduce(Child, jsAspect.SCOPE.PROTOTYPE_METHODS, {
      field1: "field1newvalue",
      field2: "field2newvalue",
      field3: "field3newvalue"
    });

    equal(Parent.field1, undefined, "Parent.field1");
    equal(Parent.prototype.field1, "field1value", "Parent.prototype.field1");
    equal(Parent.field2, undefined, "Parent.field2");
    equal(Parent.prototype.field2, undefined, "Parent.prototype.field2");
    equal(Parent.field3, undefined, "Parent.field3");
    equal(Parent.prototype.field3, undefined, "Parent.prototype.field3");

    equal(Child.field1, undefined, "Child.field1");
    equal(Child.prototype.field1, "field1newvalue", "Child.prototype.field1");
    equal(Child.field2, undefined, "Child.field2");
    equal(Child.prototype.field2, "field2newvalue", "Child.prototype.field2");
    equal(Child.field3, undefined, "Child.field3");
    equal(Child.prototype.field3, "field3newvalue", "Child.prototype.field3");
  });
})();