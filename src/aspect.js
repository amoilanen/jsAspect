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
       * All supported scopes. Scope can be used to define a pointcut.
       * @enum {string}
       * @readonly
       */
      SCOPE: {
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

  var DEFAULT_POINTCUT = new Pointcut(jsAspect.SCOPE.PROTOTYPE_METHODS);

  function joinPointName(joinPointId) {
    return joinPointId.toLowerCase().replace(/_[a-z]/, function(match) {
      return match[1].toUpperCase();
    });
  }

  /**
   * Extends/Introduces additional properties like fields or function to a passed constructor or object.
   * @param {Function|Object} target The object or constructor that want to be extended
   * @param {jsAspect.SCOPE|Pointcut} pointcut Specifies where the properties are introduced on a target,
   * as a shortcut jsAspect.SCOPE value can be provided
   * @param {Object} introduction The properties that want to be extended.
   * @method introduce
   * @returns {Object} jsAspect to allow chaining calls
   */
  jsAspect.introduce = function (target, pointcut, introduction) {
    target = ((jsAspect.SCOPE.PROTOTYPE_OWN_METHODS === pointcut) || (jsAspect.SCOPE.PROTOTYPE_METHODS === pointcut)) ? target.prototype : target;

    for (var property in introduction) {
      if (introduction.hasOwnProperty(property)) {
        target[property] = introduction[property];
      }
    }

    return jsAspect;
  };

  /**
   * Creates join points at the passed pointcut and advice name.
   * @param {Object|Function} target The target or namespace, which methods want to be intercepted.
   * @param {jsAspect.SCOPE|Pointcut} pointcut Specifies where the properties are introduced on a target,
   * as a shortcut jsAspect.SCOPE value can be provided
   * @param {jsAspect.JOIN_POINT} joinPoint The chosen join point to add the advice code.
   * @param {Function} advice The code, that needs to be executed at the join point.
   * @param {String} [methodName] The name of the method that need to be advised.
   * @method inject
   * @returns {Object} jsAspect to allow chaining calls
   */
  jsAspect.inject = function(target, pointcut, joinPoint, advice, methodName) {
    var scope = pointcut.scope || pointcut;
    var methodRegex = pointcut.methodRegex;

    var isMethodPointcut = (jsAspect.SCOPE.METHOD === scope);
    var isPrototypeOwnMethodsPointcut = (jsAspect.SCOPE.PROTOTYPE_OWN_METHODS === scope);
    var isPrototypeMethodsPointcut = (jsAspect.SCOPE.PROTOTYPE_METHODS === scope);

    if (isMethodPointcut) {
      injectAdvice(target, methodName, advice, joinPoint);
    } else {
      target = (isPrototypeOwnMethodsPointcut || isPrototypeMethodsPointcut) ? target.prototype : target;
      for (var method in target) {
        var shouldInjectToMethod = (target.hasOwnProperty(method) || isPrototypeMethodsPointcut);
        var matchesMethodRegex = (methodRegex === (void 0)) || method.match(methodRegex);

        if (shouldInjectToMethod && matchesMethodRegex) {
          injectAdvice(target, method, advice, joinPoint);
        }
      }
    }
    return jsAspect;
  };

  keys(jsAspect.JOIN_POINT).forEach(function(joinPoint) {
    jsAspect[joinPointName(joinPoint)] = function(target, advice, pointcut) {
      jsAspect.inject(target,
        pointcut || jsAspect.SCOPE.PROTOTYPE_METHODS,
        jsAspect.JOIN_POINT[joinPoint],
        advice
      );
      return jsAspect;
    };
  });

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

      if (executionContext.isStopped) {
        return;
      }

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
        returnValue,
        executionContext = new ExecutionContext(target, methodName, args);

      applyBeforeAdvices(self, method, args, executionContext);
      try {
        returnValue = applyAroundAdvices(self, method, args, executionContext);
      } catch (exception) {
        applyAfterThrowingAdvices(self, method, exception, executionContext);
        throw exception;
      }
      applyAfterAdvices(self, method, args, executionContext);
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
   * @param {JOIN_POINT} joinPoint
   * @param {function(Object, ...)} func
   * @class Advice
   * @constructor
   */
  function Advice(joinPoint, func) {
    this.joinPoint = joinPoint;
    this.func = func;
    this.pointcut = null;
  }

  /*
   * Specifies the default pointcut for an <b>Advice</b>. It will override the pointcut defined
   * in an <b>Aspect</b> as part of which this <b>Advice</b> has been defined.
   * @param {jsAspect.SCOPE} scope
   * @param {String} methodRegex regular expression that specifies which methods the pointcut should match
   * @method withPointcut
   */
  Advice.prototype.withPointcut = function(scope, methodRegex) {
    this.pointcut = new Pointcut(scope, new RegExp(methodRegex));
    return this;
  };

  /*
   * Specifies the regex for the specified pointcut.
   * @param {String} methodRegex regular expression that specifies which methods the pointcut should match
   * @method withRegex
   */
  Advice.prototype.withRegex = function(methodRegex) {
    return this.withPointcut((this.pointcut || DEFAULT_POINTCUT).scope, methodRegex);
  };

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>before</i> join point.
   * @param {function(Object, ...)} func
   *
   * @class Before
   * @extends Advice
   *
   * @constructor
   */
  function Before(func) {
     Advice.call(this, jsAspect.JOIN_POINT.BEFORE, func);
  }

  Before.prototype = new Advice();

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>after</i> join point.
   * @param {function(Object, ...)} func
   *
   * @class After
   * @extends Advice
   *
   * @constructor
   */
  function After(func) {
    Advice.call(this, jsAspect.JOIN_POINT.AFTER, func);
  }

  After.prototype = new Advice();

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>afterReturning</i> join point.
   * @param {function(Object, ...)} func
   *
   * @class AfterReturning
   * @extends Advice
   *
   * @constructor
   */
  function AfterReturning(func) {
    Advice.call(this, jsAspect.JOIN_POINT.AFTER_RETURNING, func);
  }

  AfterReturning.prototype = new Advice();

  /**
   * This advice is a child of the Advice class. It defines the behaviour for a <i>afterThrowing</i> join point.
   * @param {function(Object, ...)} func
   *
   * @class AfterThrowing
   * @extends Advice
   *
   * @constructor
   */
  function AfterThrowing(func) {
    Advice.call(this, jsAspect.JOIN_POINT.AFTER_THROWING, func);
  }

  AfterThrowing.prototype = new Advice();

  /**
   * This advice is a child of the Around class. It defines the behaviour for a <i>around</i> join point.
   * @param {function(Object, ...)} func
   *
   * @class Around
   * @extends Advice
   *
   * @constructor
   */
  function Around(func) {
    Advice.call(this, jsAspect.JOIN_POINT.AROUND, func);
  }

  Around.prototype = new Advice();

  /**
   * An aspect contains advices and the target to apply the advices to.
   * Advices can be passed both as an array and specified as arguments to the constructor.
   * @param {Advice|Advice[]} advices
   *
   * @class Aspect
   * @constructor
   */
  function Pointcut(scope, methodRegex) {
    this.scope = scope;
    this.methodRegex = methodRegex;
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
    this.pointcut = DEFAULT_POINTCUT;
  }

  /*
   * Specifies the pointcut to which this aspect will be applied. Once set this pointcut
   * will be reused for subsequent invokations of <b>applyTo()</b> until a new pointcut
   * has been set.
   * @param {jsAspect.SCOPE} scope
   * @param {String} methodRegex regular expression that specifies which methods the pointcut should match
   * @method withPointcut
   */
  Aspect.prototype.withPointcut = function(scope, methodRegex) {
    this.pointcut = new Pointcut(scope, new RegExp(methodRegex));
    return this;
  };

  /*
   * Specifies the regex for the specified pointcut.
   * @param {String} methodRegex regular expression that specifies which methods the pointcut should match
   * @method withRegex
   */
  Aspect.prototype.withRegex = function(methodRegex) {
    return this.withPointcut(this.pointcut.scope, methodRegex);
  };

  /**
   * Applies this Aspect to the given target. If called with several arguments the Aspect
   * will be applied to each one of them
   * @param {...Advice}
   * @method applyTo
   */
  Aspect.prototype.applyTo = function() {
    var self = this;
    var targets = toArray(arguments);

    this.advices.forEach(function(advice) {
      targets.forEach(function(target) {
        jsAspect.inject(target, advice.pointcut || self.pointcut, advice.joinPoint, advice.func);
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

  function properties(obj) {
    var result = [];
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        result.push([property, obj[property]]);
      }
    }
    return result;
  }

  function keys(obj) {
    return properties(obj).map(function(property) {
      return property[0];
    });
  }

  function values(obj) {
    return properties(obj).map(function(property) {
      return property[1];
    });
  }

  jsAspect.Advice = {
    Before: Before,
    After: After,
    AfterReturning: AfterReturning,
    AfterThrowing: AfterThrowing,
    Around: Around
  };
  jsAspect.Pointcut = Pointcut;
  jsAspect.Aspect = Aspect;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = jsAspect;
  } else {
    host.jsAspect = jsAspect;
  }
})(this);