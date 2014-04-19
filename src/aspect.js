/**
 * Aspect Oriented framework inspired by the Danne Lundqvist's article
 *
 * http://www.dotvoid.com/2005/06/aspect-oriented-programming-and-javascript/
 */
(function(host) {

  /**
   * The implementation to intercept constructor or objects with join points.
   * @class jsAspect
   * http://smthngsmwhr.wordpress.com/2013/06/23/aspect-oriented-programming-in-javascript/
   */
  var jsAspect = {
      /**
       * All supported pointcuts.
       * @enum {string}
       * @readonly
       */
      POINTCUT: {
        "METHODS": "methods",
        "PROTOTYPE_METHODS": "prototypeMethods",
        "PROTOTYPE_OWN_METHODS": "prototypeOwnMethods",
        "METHOD" : "method"
      },
      /**
       * All supported join points to join additional behavior.
       * @enum {string}
       * @readonly
       */
      JOIN_POINT: {
        "BEFORE": "__before",
        "AFTER": "__after",
        "AFTER_THROWING": "__afterThrowing",
        "AFTER_RETURNING":"__afterReturning",
        "AROUND": "__around"
      }
    },
    adviceEnhancedFlagName = "__jsAspect_advice_enhanced",
    originalMethodFlagName = "__jsAspect_original_method";

  var DEFAULT_POINTCUT = jsAspect.POINTCUT.PROTOTYPE_METHODS;

  /**
   * Extends/Introduces additional properties like fields or function to a passed constructor or object.
   * @param {Function|Object} target The object or constructor that want to be extended
   * @param {jsAspect.POINTCUT} pointcut Specifies if the properties are introduced to the function's prototype or the function directly (static fields).
   * @param {Object} introduction The properties that want to be extended.
   * @method introduce
   * @returns {Object} The target with extended properties.
   */
  jsAspect.introduce = function (target, pointcut, introduction) {
    target = ((jsAspect.POINTCUT.PROTOTYPE_OWN_METHODS === pointcut) || (jsAspect.POINTCUT.PROTOTYPE_METHODS === pointcut)) ? target.prototype : target;

    for (var property in introduction) {
      if (introduction.hasOwnProperty(property)) {
        target[property] = introduction[property];
      }
    }

    return target;
  };

  /**
   * Creates join points at the passed pointcut and advice name.
   * @param {Object|Function} target The target or namespace, which methods want to be intercepted.
   * @param {jsAspect.POINTCUT} pointcut The pointcut to specify or quantify the join points.
   * @param {jsAspect.JOIN_POINT} joinPoint The chosen join point to add the advice code.
   * @param {Function} advice The code, that needs to be executed at the join point.
   * @param {String} [methodName] The name of the method that need to be advised.
   * @method inject
   * @returns void
   */
  jsAspect.inject = function (target, pointcut, joinPoint, advice, methodName) {
    var isMethodPointcut = (jsAspect.POINTCUT.METHOD === pointcut),
      isPrototypeOwnMethodsPointcut = (jsAspect.POINTCUT.PROTOTYPE_OWN_METHODS === pointcut),
      isPrototypeMethodsPointcut = (jsAspect.POINTCUT.PROTOTYPE_METHODS === pointcut);

    if (isMethodPointcut) {
      injectAdvice(target, methodName, advice, joinPoint);
    } else {
      target = (isPrototypeOwnMethodsPointcut || isPrototypeMethodsPointcut) ? target.prototype : target;
      for (var method in target) {
        if (target.hasOwnProperty(method) || isPrototypeMethodsPointcut) {
          injectAdvice(target, method, advice, joinPoint);
        }
      }
    }
  };

  /**
   * Intercepts a single method with a join point and adds an advice.
   * @param target
   * @param methodName
   * @param advice
   * @param joinPoint
   * @private
   * @method injectAdvice
   */
  function injectAdvice(target, methodName, advice, joinPoint) {
    if (isFunction(target[methodName])) {
      if (jsAspect.JOIN_POINT.AROUND === joinPoint) {
        advice = wrapAroundAdvice(advice);
      }
      if (!target[methodName][adviceEnhancedFlagName]) {
        enhanceWithAdvices(target, methodName);
        target[methodName][adviceEnhancedFlagName] = true;
      }
      target[methodName][joinPoint].unshift(advice);
    }
  }

  /**
   * Wraps an existing advice, to add a additional advice at the same join point.
   * @param advice
   * @returns {wrappedAdvice}
   * @method wrapAroundAdvice
   * @private
   */
  function wrapAroundAdvice(advice) {

    var wrappedAdvice = function(executionContext, leftAroundAdvices) {
      var oThis = this,
        nextWrappedAdvice = leftAroundAdvices.shift(),
        args = toArray(arguments).slice(2);

      if (nextWrappedAdvice) {
        var nextUnwrappedAdvice = function() {
          var argsForWrapped = toArray(arguments);

          argsForWrapped.unshift(leftAroundAdvices);
          argsForWrapped.unshift(executionContext);
          return nextWrappedAdvice.apply(oThis, argsForWrapped);
        };
        args.unshift(nextUnwrappedAdvice);
      }
      if (!advice.originalMethodFlagName) {
        args.unshift(executionContext);
      }
      return advice.apply(this, args);
    };

    //Can be useful for debugging
    wrappedAdvice.__originalAdvice = advice;
    return wrappedAdvice;
  }

  /**
   * Intercepts the target's method with all supported join points
   * @param target
   * @param methodName
   * @method enhanceWithAdvices
   */
  function enhanceWithAdvices(target, methodName) {
    var originalMethod = target[methodName];

    originalMethod.originalMethodFlagName = true;
    target[methodName] = function() {
      var self = this,
        method = target[methodName],
        args = toArray(arguments),
        returnValue;
      var  executionContext = new ExecutionContext(target, methodName, args);

      applyBeforeAdvices(self, method, args, executionContext);
      if (executionContext.isStopped) return;
      try {
        returnValue = applyAroundAdvices(self, method, args, executionContext);
      } catch (exception) {
        applyAfterThrowingAdvices(self, method, exception, executionContext);
        throw exception;
      }
      applyAfterAdvices(self, method, args, executionContext);
      if (executionContext.isStopped) return;
      return applyAfterReturningAdvices(self, method, returnValue, executionContext);
    };
    for(var join_point in jsAspect.JOIN_POINT){
      target[methodName][jsAspect.JOIN_POINT[join_point]] = [];
    }
    target[methodName][jsAspect.JOIN_POINT.AROUND].unshift(wrapAroundAdvice(originalMethod));
  }

  /**
   * Adds the before-join point to add behaviour <i>before</i> the method is executed.
   * @param context
   * @param method
   * @param args
   * @param {ExecutionContext} executionContext
   * @method applyBeforeAdvices
   */
  function applyBeforeAdvices(context, method, args, executionContext) {
    applyIndependentAdvices(method[jsAspect.JOIN_POINT.BEFORE], context, method, args, executionContext);
  }

  /**
   * Adds the join point to control the method execution manually (executed before the <i>before</i> join point).
   * @param context
   * @param method
   * @param args
   * @param {ExecutionContext} executionContext
   * @method applyAroundAdvices
   * @private
   * @returns {Function|Object}
   */
  function applyAroundAdvices(context, method, args, executionContext) {
    var aroundAdvices = toArray(method[jsAspect.JOIN_POINT.AROUND]),
      firstAroundAdvice = aroundAdvices.shift(),
      argsForAroundAdvicesChain = args.slice();

    argsForAroundAdvicesChain.unshift(aroundAdvices);
    argsForAroundAdvicesChain.unshift(executionContext);
    return firstAroundAdvice.apply(context, argsForAroundAdvicesChain);
  }

  /**
   * Adds the join point to add behaviour <i>after</i> the method thrown an exception.
   * @param context
   * @param method
   * @param exception
   * @param executionContext
   * @method applyAfterThrowingAdvices
   * @private
   */
  function applyAfterThrowingAdvices(context, method, exception, executionContext) {
    applyIndependentAdvices(method[jsAspect.JOIN_POINT.AFTER_THROWING], context, method, [exception], executionContext);
  }

  /**
   * Adds the before-join point to add behaviour <i>before</i> the method is executed.
   * @param context
   * @param method
   * @param args
   * @param {ExecutionContext} executionContext
   * @method applyAfterAdvices
   */
  function applyAfterAdvices(context, method, args, executionContext) {
    applyIndependentAdvices(method[jsAspect.JOIN_POINT.AFTER], context, method, args, executionContext);
  }

  /**
   * Adds the join point to add behaviour <i>after</i> the method returned a value or the method stopped working (no return value).
   * @param context
   * @param method
   * @param returnValue
   * @method applyAfterReturningAdvices
   * @returns {Object}
   */
  function applyAfterReturningAdvices(context, method, returnValue, executionContext) {
    var afterReturningAdvices = method[jsAspect.JOIN_POINT.AFTER_RETURNING];

    return afterReturningAdvices.reduce(function(acc, current) {
      return !executionContext.isStopped ? current(executionContext, acc) : (void 0);
    }, returnValue);
  }

  /**
   * Applies advices which do not depend on results of each other if 'stop' was not called.
   * @param advices
   * @param context
   * @param method
   * @param args
   * @param {ExecutionContext} executionContext
   * @method applyAfterAdvices
   */
  function applyIndependentAdvices(advices, context, method, args, executionContext) {
    advices.forEach(function (advice) {
      var adviceArguments = args.slice();

      adviceArguments.unshift(executionContext);

      if (!executionContext.isStopped) {
        advice.apply(context, adviceArguments);
      }
    });
  }

  /**
   * Type of the parameter, that is passed to the joinPoints. It contains information about the method and constructor itself.
   * @param target - object for a method of which the advice is being executed
   * @param methodName - name of the method being executed
   * @param args - arguments with which the method is being executed
   * @constructor
   */
  function ExecutionContext(target, methodName, args) {
    this.target = target;
    this.method = {
      "name": methodName,
      "arguments": args
    };
    this.isStopped = false;
    //Fixing the name property if it is not supported, and leaving it like that in the function
    if (this.target.constructor.name === undefined) {
      this.target.constructor.name = functionName(this.target.constructor);
    }
  }



  /**
   * Can be used to stop the method execution. For example:
   * <ul>
   * <li>In <i>before</i> join point to prevent method from execution</li>
   * <li>In <i>afterThrowing</i> to prevent any applied <i>after</i> advices from execution </li>
   * <li>In <i>around</i> to prevent returning a value from a method and prevent
   * any other advices from execution</li>
   * </ul>
   * @method stop
   */
  ExecutionContext.prototype.stop = function() {
    this.isStopped = true;
  };

  /**
   * Generic advice class.
   * @param {POINTCUT} [pointcut]
   * @param {JOIN_POINT} joinPoint
   * @param {function(Object, ...)} func
   * @class Advice
   * @constructor
   */
  function Advice(pointcut, joinPoint, func) {
    if (pointcut === (void 0)) {
        pointcut = DEFAULT_POINTCUT;
    }
    this.pointcut = pointcut;
    this.joinPoint = joinPoint;
    this.func = func;
  }

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>before</i> join point.
   * @param {function(Object, ...)} func
   * @param {jsAspect.POINTCUT} [pointcut]
   *
   * @class Before
   * @extends Advice
   *
   * @constructor
   */
  function Before(func, pointcut) {
     Advice.call(this, pointcut, jsAspect.JOIN_POINT.BEFORE, func);
  }

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>after</i> join point.
   * @param {function(Object, ...)} func
   * @param {jsAspect.POINTCUT} [pointcut]
   *
   * @class After
   * @extends Advice
   *
   * @constructor
   */
  function After(func, pointcut) {
    Advice.call(this, pointcut, jsAspect.JOIN_POINT.AFTER, func);
  }

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>afterReturning</i> join point.
   * @param {function(Object, ...)} func
   * @param {jsAspect.POINTCUT} [pointcut]
   *
   * @class AfterReturning
   * @extends Advice
   *
   * @constructor
   */
  function AfterReturning(func, pointcut) {
    Advice.call(this, pointcut, jsAspect.JOIN_POINT.AFTER_RETURNING, func);
  }

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>afterThrowing</i> join point.
   * @param {function(Object, ...)} func
   * @param {jsAspect.POINTCUT} [pointcut]
   *
   * @class AfterThrowing
   * @extends Advice
   *
   * @constructor
   */
  function AfterThrowing(func, pointcut) {
    Advice.call(this, pointcut, jsAspect.JOIN_POINT.AFTER_THROWING, func);
  }

  /**
   * This advice is a child of the Around class. It defines the behaviour for a <i>around</i> join point.
   * @param {function(Object, ...)} func
   * @param {jsAspect.POINTCUT} [pointcut]
   *
   * @class Around
   * @extends Advice
   *
   * @constructor
   */
  function Around(func, pointcut) {
    Advice.call(this, pointcut, jsAspect.JOIN_POINT.AROUND, func);
  }

  /**
   * An aspect contains advices and the target to apply the advices to.
   * Advices can be passed both as an array and specified as arguments to the constructor.
   * @param {Advice|Advice[]} advices
   *
   * @class Aspect
   * @constructor
   */
  function Aspect(advices) {
    this.advices = (advices instanceof Array) ? advices : toArray(arguments);
  }

  /**
   * Applies this Aspect to the given target. If called with several arguments the Aspect
   * will be applied to each one of them
   * @param {...Advice}
   * @method applyTo
   */
  Aspect.prototype.applyTo = function() {
    var targets = toArray(arguments);
    this.advices.forEach(function(advice) {
      targets.forEach(function(target) {
        jsAspect.inject(target, advice.pointcut, advice.joinPoint, advice.func);
      });
    });
  };

  function isFunction(obj) {
    return obj && Object.prototype.toString.call(obj) === '[object Function]';
  }

  function functionName(func) {
    var match = func.toString().match(/function\s+([^(?:\()\s]*)/);
    return match ? match[1] : "";
  }

  function toArray(args) {
    return [].slice.call(args, 0);
  }

  jsAspect.Advice = {
    Before: Before,
    After: After,
    AfterReturning: AfterReturning,
    AfterThrowing: AfterThrowing,
    Around: Around
  };
  jsAspect.Aspect = Aspect;
  host.jsAspect = jsAspect;
})(this);