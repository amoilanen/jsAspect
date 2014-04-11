jsAspect
========

Aspect-oriented framework for JavaScript

[toc]

## Terminology

- `Advice`: Additional behaviour added into a join point of a method.
- `Join Point`: Places within the method invokation process, that can be join with additional Behaviourr.
- `Pointcuts`: Works like a filter, to specify which methods need to be intercepted
- `Intercept`: The technical overwritting of the method to attach the join points.

## API 

Existing ***join points*** yet:
- `before`: Will be executed before the adviced method
- `afterThrowing`: Will be executed after the adviced method thrown an error.
- `afterReturning`: Will be executed after the adviced method returned a value
- `after`: Will be executed after the adviced method
- `around`: Will be executed instead of the adviced method, passed the function and the arguments to execute the function by yourself.

Existing ***pointcuts*** yet: 
- `prototype_methods`: *Default* Intercepts all prototype methods (even inherited)
- `methods`: To advice object methods, instead of prototype methods
- `prototype_own_methods`: Like `prototype_methods` without inherited methods.

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
In this example we defined two advices, an `before` and a `after` advice. 
### Define Aspect
Up next we need to define a `Aspect`.
``` javascript
var aspect = new jsAspect.Aspect([
     beforeAdvice,  afterAdvice
]);
```
The `Aspect` takes the `Advice`'s as parameter. 
### Apply Aspect to an object
Now we can apply this `Aspect` to any constructor or object.

``` javascript
var obj = new Object();
obj.method1 = function(){
    return "doing Something";
});

aspect.applyTo(obj);

obj.method1();
```
This method execution will log:
`joinPoint after`
`joinPoint before`
### Apply Aspect to an constructor/class
Once the `Aspect` is defined, we can apply it so several objects or constructors.

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
> Hint: Place methods on the prototype of a constructor. If you place them directly into the constructor, the whole constructor will be copied, since we can't override these methods.

__DON'T to it like this:__
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
#### Advices to inherited methods
Works by default. To turn of, re-set the pointcut to `PROTOTYPE.OWN_METHODS`.

If your want to advice methods that are embedded like this in a constructor, place apply to `Aspect` to the object of this constructor.
### Apply Aspect to objects
To apply an `Aspect` to an object, you have to change the *pointcuts* at the advices, to advice the objects methods, instead of it's prototype methods. 
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
var aspect = new jsAspect.Aspect([beforeAdvice, afterAdvice]);

function Target(){
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


