/**
 * Aspect Oriented framework inspired by the Danne Lundqvist's article
 * 
 * http://www.dotvoid.com/2005/06/aspect-oriented-programming-and-javascript/
 */
(function(host) {

  var jsAspect = {
    pointcuts: {},
      advices: {}
    },
    adviceEnhancedFlagName = "__jsAspect_advice_enhanced",
    allAdvices = ["before", "after", "afterThrowing", "afterReturning", "around"],
    allPointcuts = ["methods", "prototypeMethods", "method"];

  allAdvices.forEach(function (advice) {
    jsAspect.advices[advice] = "__" + advice;
  });
  allPointcuts.forEach(function (pointcut) {
    jsAspect.pointcuts[pointcut] = pointcut;
  });

  jsAspect.introduce = function (target, pointcut, introduction) {
    target = (jsAspect.pointcuts.prototypeMethods == pointcut) ? target.prototype : target;
    for (var property in introduction) {
      if (introduction.hasOwnProperty(property)) {
        target[property] = introduction[property];
      }
    }
  };

  /**
   * 'methodName' makes sense only for the 'method' pointcut, optional parameter
   */
  jsAspect.inject = function (target, pointcut, adviceName, advice, methodName) {
    if (jsAspect.pointcuts.method == pointcut) {
      injectAdvice(target, methodName, advice, adviceName);
    } else {
      target = (jsAspect.pointcuts.prototypeMethods == pointcut) ? target.prototype : target;
      for (var method in target) {
        if (target.hasOwnProperty(method)) {
          injectAdvice(target, method, advice, adviceName);
        }
      }
    }
  };

  function injectAdvice(target, methodName, advice, adviceName) {
    if (isFunction(target[methodName])) {
      if (jsAspect.advices.around == adviceName) {
        advice = wrapAroundAdvice(advice);
      }
      if (!target[methodName][adviceEnhancedFlagName]) {
        enhanceWithAdvices(target, methodName);
        target[methodName][adviceEnhancedFlagName] = true;
      }
      target[methodName][adviceName].unshift(advice);
    }
  };

  function wrapAroundAdvice(advice) {
    var oldAdvice = advice,
      wrappedAdvice = function(leftAroundAdvices) {
        var oThis = this,
          nextWrappedAdvice = leftAroundAdvices.shift(),
          args = [].slice.call(arguments, 1);

        if (nextWrappedAdvice) {
          var nextUnwrappedAdvice = function() {
            var argsForWrapped = [].slice.call(arguments, 0);

            argsForWrapped.unshift(leftAroundAdvices);
            return nextWrappedAdvice.apply(oThis, argsForWrapped);
          };
          args.unshift(nextUnwrappedAdvice);
        };
        return oldAdvice.apply(this, args);
      };

    //Can be useful for debugging
    wrappedAdvice.__originalAdvice = oldAdvice;
    return wrappedAdvice;
  };

  function enhanceWithAdvices(target, methodName) {
    var originalMethod = target[methodName];

    target[methodName] = function() {
      var self = this,
        method = target[methodName],
        args = [].slice.call(arguments, 0),
        returnValue = undefined;

      applyBeforeAdvices(self, method, args);
      try {
        returnValue = applyAroundAdvices(self, method, args);
      } catch (exception) {
        applyAfterThrowingAdvices(self, method, exception);
        throw exception;
      }
      applyAfterAdvices(self, method, args);
        return applyAfterReturningAdvices(self, method, returnValue);
      };
      allAdvices.forEach(function (advice) {
        target[methodName][jsAspect.advices[advice]] = [];
      });
      target[methodName][jsAspect.advices.around].unshift(wrapAroundAdvice(originalMethod));
    };

    function applyBeforeAdvices(context, method, args) {
        var beforeAdvices = method[jsAspect.advices.before];
        
        beforeAdvices.forEach(function (advice) {
            advice.apply(context, args);
        });
    };

    function applyAroundAdvices(context, method, args) {
        var aroundAdvices = method[jsAspect.advices.around]
                .slice(0, method[jsAspect.advices.around].length),
            firstAroundAdvice = aroundAdvices.shift(),
            argsForAroundAdvicesChain = args.slice();
        
        argsForAroundAdvicesChain.unshift(aroundAdvices);
        return firstAroundAdvice.apply(context, argsForAroundAdvicesChain);
    };

    function applyAfterThrowingAdvices(context, method, exception) {
        var afterThrowingAdvices = method[jsAspect.advices.afterThrowing];
        
        afterThrowingAdvices.forEach(function (advice) {
            advice.call(context, exception);
        });
    };

    function applyAfterAdvices(context, method, args) {
        var afterAdvices = method[jsAspect.advices.after];
        
        afterAdvices.forEach(function (advice) {
            advice.apply(context, args);
        });
    };

    function applyAfterReturningAdvices(context, method, returnValue) {
        var afterReturningAdvices = method[jsAspect.advices.afterReturning];
        
        return afterReturningAdvices.reduce(function (acc, current) {
            return current(acc);
        }, returnValue);
    };

    function isFunction(obj) {
        return obj && Object.prototype.toString.call(obj) == '[object Function]';
    }
    
    host.jsAspect = jsAspect;
})(window);