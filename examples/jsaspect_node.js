var jsAspect = require("js-aspect");

var obj = {
  add: function(x, y) {
    return x + y;
  },
  sub: function(x, y) {
    return x - y;
  },
  mult: function(x, y) {
    return x * y;
  }
};

var calledOperations = [];

jsAspect.before(obj, function(context) {
  calledOperations.push(context.method.name);
}, jsAspect.SCOPE.METHODS);

console.log(obj.mult(obj.sub(obj.add(3, 2), 1), 2)); //8
console.log(calledOperations); //["add", "sub", "mult"]