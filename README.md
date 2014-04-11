jsAspect
========

Aspect-oriented framework for JavaScript



## Terminology

- `Advice`: Additional behaviour added into a join point of a method.
- `Join Point`: Places within the method invocation process, that can be joined with additional behaviour.
- `Pointcuts`: Works like a filter, to specify which methods need to be intercepted.
- `Intercept`: The technical overwritting of the method to attach the join points.

## API 
`jsAspect.JOIN_POINT`: Contains all available join points.

>Currently supported ***join points***:
- `BEFORE`: Will be executed before the adviced method.
- `AFTER_THROWING`: Will be executed after the adviced method thrown an error.
- `AFTER_RETURNING`: Will be executed after the adviced method returned a value.
- `AFTER`: Will be executed after the adviced method.
- `AROUND`: Will be executed instead of the adviced method, the original function and its arguments will be passed as arguments to the advice so that the original function can be executed inside the advice.

`jsAspect.POINTCUT`: Contains all available pointcuts.

>Currently supported ***pointcuts***:
- `PROTOTYPE_METHODS`: *Default* Intercepts all prototype methods (even inherited)
- `METHODS`: To advice object methods, instead of prototype methods
- `PROTOTYPE_OWN_METHODS`: Like `prototype_methods` without inherited methods.
- `METHOD` : To advice just one method of an object.


## Usage

### Define Advice
At first, we have to define an `Advice`:
``` javascript
var afterAdvice =  new jsAspect.Advice.After(function() {
  console.log("joinPoint", "after");
});
var beforeAdvice = new jsAspect.Advice.Before(function() {
  console.log("joinPoint", "before");
});
```
In this example we defined two advices, a `before` and an `after` advice.

By default the advices will be using the `pointcut` `PROTOTYPE_METHODS`.

### Define Aspect
Up next we need to define a `Aspect`.
``` javascript
var aspect = new jsAspect.Aspect(beforeAdvice,  afterAdvice);
```
The `Aspect` takes the `Advice`'s as parameters.

### Apply Aspect to an object
We can apply an `Aspect` to any constructor or object. Note that in the following example the advices or the aspect should use the pointcut `METHODS` otherwise they will be not applied to the direct properties on the object.

``` javascript
var obj = {
   method1: function() {
    return "doing Something";
   }
};

aspect.applyTo(obj);

obj.method1();
```
This method execution will log:
`joinPoint after`
`joinPoint before`

### Apply Aspect to a constructor/"class"
Once the `Aspect` is defined, we can apply it to several objects or constructors.

Let's take a look at constructors:

``` javascript
function Target(){}

Target.prototype.method1 = function() {
  return "method1value";
};

aspect.applyTo(Target); 

var target = new Target();
target.method1(); 

//logs: `joinPoint after`
//logs: `joinPoint before`
```
> HINT: Place methods on the prototype of a constructor. If you place them directly into the constructor we will not be able to override these methods. For example
__will not work as you might expect:__
``` javascript
function Target(){
    this.method1 = function() {
        return "method1value";
    };
}

aspect.applyTo(Target); 

var target = new Target();
target.method1();
```
This will not log anything since `aspect` will not be applied to `method1`. However `aspect.applyTo(target)` will work if we use the poincut `PROTOTYPE.OWN_METHODS`.

#### Advices to inherited methods
Works by default. To turn off, use the pointcut `PROTOTYPE_OWN_METHODS`.

If you still want to advice methods that are directly placed on the created object in a constructor, you can apply your `Aspect` to each object created with this constructor.

### Apply Aspect to methods set in constructor
To apply an `Aspect` to an object, you have to change the *pointcuts* at the advices, to advice the objects methods `METHODS`, instead of it's prototype methods `PROTOTYPE_OWN_METHODS` which is used by default.
``` javascript
//Define behaviour of the afterAdvice
var afterAdviceBehaviour = function() {
   console.log("joinPoint", "after");
};
var afterAdvice =  new jsAspect.Advice.After(afterAdviceBehaviour, jsAspect.POINTCUT.METHODS); //set the pointcut

//Define behaviour of the beforeAdvice
var beforeAdviceBehaviour = function() {
   console.log("joinPoint", "before");
};
var beforeAdvice = new jsAspect.Advice.Before(beforeAdviceBehaviour, jsAspect.POINTCUT.METHODS); //set the pointcut 

//create the aspect
var aspect = new jsAspect.Aspect(beforeAdvice, afterAdvice);

function Target() {
    this.method1 = function() {
        return "method1value";
    };
}
var target = new Target();
//Apply aspect on the object instead of the prototype
aspect.applyTo(target);

target.method1();

//logs: `joinPoint after`
//logs: `joinPoint before`
``` 
### The `context` parameter
The `context` parameter is currently passed to the `before` advices (in the next versions it will be passed to the other types of advices). It provides information about the adviced method itself and the object/constructor the aspect was applied to. Also it contains API to control the execution of the method to which the advice was applied. This is useful, for example, if you're building a logger aspect.

Usage:

``` javascript
//Define behaviour of the beforeAdvice
var beforeAdviceBehaviour = function(context) {
   console.log(context.target); //object/constructor, the aspect was applied to
   console.log(context.method.name); //the method's name, which is intercepted by this method.
   console.log(context.method.arguments); //the method were passed to the method
};
```

#### Constructor name
In some cases you want to log the constructor's name. To begin with the constructor function can have no name, so the responsibility for providing a name is of the client code of the library.

Currently the name is only provided in cases when the JavaScript execution environment natively supports `Function.name` (in future versions the name will be provided in case the constructor function has a name, for example like in this [example](http://stackoverflow.com/questions/2648293/javascript-get-function-name)).

A possible approach in the client code:

``` javascript
function Class(){}
Class.prototype.__name = "MyClass"; // The attribute
Class.prototype.method1 = function(param1) {
  return param1 + "-method1";
};

var beforeAdviceBehaviour = function(context) {
   console.log("Trace:", context.target.__name, "-->", context.method.name, " with parameter");
   console.log(context.method.arguments);
};
new jsAspect.Aspect(
  new jsAspect.Advice.Before(beforeAdviceBehaviour)
).applyTo(Class);

var class = new Class();
class.method1("ParamValue");

//this will log:
/**
Trace: MyClass --> method1 with parameter
["ParamValue"]
*/
```

And this gives you the ability to create a nice logger.