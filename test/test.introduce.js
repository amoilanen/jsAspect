module("jsAspect.introduce");

(function() {

    test("jsAspect.introduce: 'methods' pointcut", function() {
        function Object() {
            this.field1 = "field1value";
        }
      Object.prototype.method1 = function () {
            return "valuefrommethod1";
        };

        equal(Object.field3, undefined, "Object.field3");
        equal(Object.prototype.field3, undefined, "Object.prototype.field3");
        equal(Object.staticmethod1, undefined, "Object.staticmethod1");
        equal(Object.prototype.staticmethod1, undefined, "Object.prototype.staticmethod1");

        jsAspect.introduce(Object, jsAspect.POINTCUT.METHODS, {
            field3: "field3value",
            staticmethod1: function () {
                return "valuefromstaticmethod1";
            }
        });

        equal(Object.field3, "field3value", "Object.prototype.field3");
        equal(Object.prototype.field3, undefined, "Object.prototype.field3");
        equal(Object.staticmethod1 ? Object.staticmethod1() : "", "valuefromstaticmethod1", "Object.staticmethod1");
        equal(Object.prototype.staticmethod1, undefined, "Object.prototype.staticmethod1");
    });

    test("jsAspect.introduce: 'prototype' pointcut", function() {
        function Object() {
            this.field1 = "field1value";
        }

        Object.prototype.method1 = function () {
            return "valuefrommethod1";
        };

        equal(Object.field3, undefined, "Object.field3");
        equal(Object.prototype.field3, undefined, "Object.prototype.field3");
        equal(Object.method2, undefined, "Object.method2");
        equal(Object.prototype.method2, undefined, "Object.prototype.method2");

        jsAspect.introduce(Object, jsAspect.POINTCUT.PROTOTYPE_OWN_METHODS, {
            field3: "field3value",
            method2: function () {
                return "valuefrommethod2";
            }
        });

        var obj = new Object();

        equal(Object.field3, undefined, "Object.field3");
        equal(Object.prototype.field3, "field3value", "Object.prototype.field3");
        equal(Object.method2, undefined, "Object.method2");
        equal(obj.method2 ? obj.method2() : "", "valuefrommethod2", "Object.prototype.method2");
    });
})();