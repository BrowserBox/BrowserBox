"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function () {
  'use strict';

  function createCommonjsModule(fn, module) {
    return module = {
      exports: {}
    }, fn(module, module.exports), module.exports;
  }

  var runtime_1 = createCommonjsModule(function (module) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    var runtime = function (exports) {
      var Op = Object.prototype;
      var hasOwn = Op.hasOwnProperty;
      var undefined$1; // More compressible than void 0.

      var $Symbol = typeof Symbol === "function" ? Symbol : {};
      var iteratorSymbol = $Symbol.iterator || "@@iterator";
      var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
      var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

      function wrap(innerFn, outerFn, self, tryLocsList) {
        // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
        var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
        var generator = Object.create(protoGenerator.prototype);
        var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
        // .throw, and .return methods.

        generator._invoke = makeInvokeMethod(innerFn, self, context);
        return generator;
      }

      exports.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
      // record like context.tryEntries[i].completion. This interface could
      // have been (and was previously) designed to take a closure to be
      // invoked without arguments, but in all the cases we care about we
      // already have an existing method we want to call, so there's no need
      // to create a new function object. We can even get away with assuming
      // the method takes exactly one argument, since that happens to be true
      // in every case, so we don't have to touch the arguments object. The
      // only additional allocation required is the completion record, which
      // has a stable shape and so hopefully should be cheap to allocate.

      function tryCatch(fn, obj, arg) {
        try {
          return {
            type: "normal",
            arg: fn.call(obj, arg)
          };
        } catch (err) {
          return {
            type: "throw",
            arg: err
          };
        }
      }

      var GenStateSuspendedStart = "suspendedStart";
      var GenStateSuspendedYield = "suspendedYield";
      var GenStateExecuting = "executing";
      var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
      // breaking out of the dispatch switch statement.

      var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
      // .constructor.prototype properties for functions that return Generator
      // objects. For full spec compliance, you may wish to configure your
      // minifier not to mangle the names of these two functions.

      function Generator() {}

      function GeneratorFunction() {}

      function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
      // don't natively support it.


      var IteratorPrototype = {};

      IteratorPrototype[iteratorSymbol] = function () {
        return this;
      };

      var getProto = Object.getPrototypeOf;
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

      if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
        // This environment has a native %IteratorPrototype%; use it instead
        // of the polyfill.
        IteratorPrototype = NativeIteratorPrototype;
      }

      var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
      GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
      GeneratorFunctionPrototype.constructor = GeneratorFunction;
      GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction"; // Helper for defining the .next, .throw, and .return methods of the
      // Iterator interface in terms of a single ._invoke method.

      function defineIteratorMethods(prototype) {
        ["next", "throw", "return"].forEach(function (method) {
          prototype[method] = function (arg) {
            return this._invoke(method, arg);
          };
        });
      }

      exports.isGeneratorFunction = function (genFun) {
        var ctor = typeof genFun === "function" && genFun.constructor;
        return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
      };

      exports.mark = function (genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype;

          if (!(toStringTagSymbol in genFun)) {
            genFun[toStringTagSymbol] = "GeneratorFunction";
          }
        }

        genFun.prototype = Object.create(Gp);
        return genFun;
      }; // Within the body of any async function, `await x` is transformed to
      // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
      // `hasOwn.call(value, "__await")` to determine if the yielded value is
      // meant to be awaited.


      exports.awrap = function (arg) {
        return {
          __await: arg
        };
      };

      function AsyncIterator(generator) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg);

          if (record.type === "throw") {
            reject(record.arg);
          } else {
            var result = record.arg;
            var value = result.value;

            if (value && _typeof(value) === "object" && hasOwn.call(value, "__await")) {
              return Promise.resolve(value.__await).then(function (value) {
                invoke("next", value, resolve, reject);
              }, function (err) {
                invoke("throw", err, resolve, reject);
              });
            }

            return Promise.resolve(value).then(function (unwrapped) {
              // When a yielded Promise is resolved, its final value becomes
              // the .value of the Promise<{value,done}> result for the
              // current iteration.
              result.value = unwrapped;
              resolve(result);
            }, function (error) {
              // If a rejected Promise was yielded, throw the rejection back
              // into the async generator function so it can be handled there.
              return invoke("throw", error, resolve, reject);
            });
          }
        }

        var previousPromise;

        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new Promise(function (resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }

          return previousPromise = // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        } // Define the unified helper method that is used to implement .next,
        // .throw, and .return (see defineIteratorMethods).


        this._invoke = enqueue;
      }

      defineIteratorMethods(AsyncIterator.prototype);

      AsyncIterator.prototype[asyncIteratorSymbol] = function () {
        return this;
      };

      exports.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
      // AsyncIterator objects; they just return a Promise for the value of
      // the final result produced by the iterator.

      exports.async = function (innerFn, outerFn, self, tryLocsList) {
        var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));
        return exports.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function (result) {
          return result.done ? result.value : iter.next();
        });
      };

      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart;
        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error("Generator is already running");
          }

          if (state === GenStateCompleted) {
            if (method === "throw") {
              throw arg;
            } // Be forgiving, per 25.3.3.3.3 of the spec:
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


            return doneResult();
          }

          context.method = method;
          context.arg = arg;

          while (true) {
            var delegate = context.delegate;

            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context);

              if (delegateResult) {
                if (delegateResult === ContinueSentinel) continue;
                return delegateResult;
              }
            }

            if (context.method === "next") {
              // Setting context._sent for legacy support of Babel's
              // function.sent implementation.
              context.sent = context._sent = context.arg;
            } else if (context.method === "throw") {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted;
                throw context.arg;
              }

              context.dispatchException(context.arg);
            } else if (context.method === "return") {
              context.abrupt("return", context.arg);
            }

            state = GenStateExecuting;
            var record = tryCatch(innerFn, self, context);

            if (record.type === "normal") {
              // If an exception is thrown from innerFn, we leave state ===
              // GenStateExecuting and loop back for another invocation.
              state = context.done ? GenStateCompleted : GenStateSuspendedYield;

              if (record.arg === ContinueSentinel) {
                continue;
              }

              return {
                value: record.arg,
                done: context.done
              };
            } else if (record.type === "throw") {
              state = GenStateCompleted; // Dispatch the exception by looping back around to the
              // context.dispatchException(context.arg) call above.

              context.method = "throw";
              context.arg = record.arg;
            }
          }
        };
      } // Call delegate.iterator[context.method](context.arg) and handle the
      // result, either by returning a { value, done } result from the
      // delegate iterator, or by modifying context.method and context.arg,
      // setting context.delegate to null, and returning the ContinueSentinel.


      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method];

        if (method === undefined$1) {
          // A .throw or .return when the delegate iterator has no .throw
          // method always terminates the yield* loop.
          context.delegate = null;

          if (context.method === "throw") {
            // Note: ["return"] must be used for ES3 parsing compatibility.
            if (delegate.iterator["return"]) {
              // If the delegate iterator has a return method, give it a
              // chance to clean up.
              context.method = "return";
              context.arg = undefined$1;
              maybeInvokeDelegate(delegate, context);

              if (context.method === "throw") {
                // If maybeInvokeDelegate(context) changed context.method from
                // "return" to "throw", let that override the TypeError below.
                return ContinueSentinel;
              }
            }

            context.method = "throw";
            context.arg = new TypeError("The iterator does not provide a 'throw' method");
          }

          return ContinueSentinel;
        }

        var record = tryCatch(method, delegate.iterator, context.arg);

        if (record.type === "throw") {
          context.method = "throw";
          context.arg = record.arg;
          context.delegate = null;
          return ContinueSentinel;
        }

        var info = record.arg;

        if (!info) {
          context.method = "throw";
          context.arg = new TypeError("iterator result is not an object");
          context.delegate = null;
          return ContinueSentinel;
        }

        if (info.done) {
          // Assign the result of the finished delegate to the temporary
          // variable specified by delegate.resultName (see delegateYield).
          context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

          context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
          // exception, let the outer generator proceed normally. If
          // context.method was "next", forget context.arg since it has been
          // "consumed" by the delegate iterator. If context.method was
          // "return", allow the original .return call to continue in the
          // outer generator.

          if (context.method !== "return") {
            context.method = "next";
            context.arg = undefined$1;
          }
        } else {
          // Re-yield the result returned by the delegate method.
          return info;
        } // The delegate iterator is finished, so forget it and continue with
        // the outer generator.


        context.delegate = null;
        return ContinueSentinel;
      } // Define Generator.prototype.{next,throw,return} in terms of the
      // unified ._invoke helper method.


      defineIteratorMethods(Gp);
      Gp[toStringTagSymbol] = "Generator"; // A Generator should always return itself as the iterator object when the
      // @@iterator function is called on it. Some browsers' implementations of the
      // iterator prototype chain incorrectly implement this, causing the Generator
      // object to not be returned from this call. This ensures that doesn't happen.
      // See https://github.com/facebook/regenerator/issues/274 for more details.

      Gp[iteratorSymbol] = function () {
        return this;
      };

      Gp.toString = function () {
        return "[object Generator]";
      };

      function pushTryEntry(locs) {
        var entry = {
          tryLoc: locs[0]
        };

        if (1 in locs) {
          entry.catchLoc = locs[1];
        }

        if (2 in locs) {
          entry.finallyLoc = locs[2];
          entry.afterLoc = locs[3];
        }

        this.tryEntries.push(entry);
      }

      function resetTryEntry(entry) {
        var record = entry.completion || {};
        record.type = "normal";
        delete record.arg;
        entry.completion = record;
      }

      function Context(tryLocsList) {
        // The root entry object (effectively a try statement without a catch
        // or a finally block) gives us a place to store values thrown from
        // locations where there is no enclosing try statement.
        this.tryEntries = [{
          tryLoc: "root"
        }];
        tryLocsList.forEach(pushTryEntry, this);
        this.reset(true);
      }

      exports.keys = function (object) {
        var keys = [];

        for (var key in object) {
          keys.push(key);
        }

        keys.reverse(); // Rather than returning an object with a next method, we keep
        // things simple and return the next function itself.

        return function next() {
          while (keys.length) {
            var key = keys.pop();

            if (key in object) {
              next.value = key;
              next.done = false;
              return next;
            }
          } // To avoid creating an additional object, we just hang the .value
          // and .done properties off the next function object itself. This
          // also ensures that the minifier will not anonymize the function.


          next.done = true;
          return next;
        };
      };

      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol];

          if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }

          if (typeof iterable.next === "function") {
            return iterable;
          }

          if (!isNaN(iterable.length)) {
            var i = -1,
                next = function next() {
              while (++i < iterable.length) {
                if (hasOwn.call(iterable, i)) {
                  next.value = iterable[i];
                  next.done = false;
                  return next;
                }
              }

              next.value = undefined$1;
              next.done = true;
              return next;
            };

            return next.next = next;
          }
        } // Return an iterator with no values.


        return {
          next: doneResult
        };
      }

      exports.values = values;

      function doneResult() {
        return {
          value: undefined$1,
          done: true
        };
      }

      Context.prototype = {
        constructor: Context,
        reset: function reset(skipTempReset) {
          this.prev = 0;
          this.next = 0; // Resetting context._sent for legacy support of Babel's
          // function.sent implementation.

          this.sent = this._sent = undefined$1;
          this.done = false;
          this.delegate = null;
          this.method = "next";
          this.arg = undefined$1;
          this.tryEntries.forEach(resetTryEntry);

          if (!skipTempReset) {
            for (var name in this) {
              // Not sure about the optimal order of these conditions:
              if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
                this[name] = undefined$1;
              }
            }
          }
        },
        stop: function stop() {
          this.done = true;
          var rootEntry = this.tryEntries[0];
          var rootRecord = rootEntry.completion;

          if (rootRecord.type === "throw") {
            throw rootRecord.arg;
          }

          return this.rval;
        },
        dispatchException: function dispatchException(exception) {
          if (this.done) {
            throw exception;
          }

          var context = this;

          function handle(loc, caught) {
            record.type = "throw";
            record.arg = exception;
            context.next = loc;

            if (caught) {
              // If the dispatched exception was caught by a catch block,
              // then let that catch block handle the exception normally.
              context.method = "next";
              context.arg = undefined$1;
            }

            return !!caught;
          }

          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            var record = entry.completion;

            if (entry.tryLoc === "root") {
              // Exception thrown outside of any try block that could handle
              // it, so set the completion value of the entire function to
              // throw the exception.
              return handle("end");
            }

            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, "catchLoc");
              var hasFinally = hasOwn.call(entry, "finallyLoc");

              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                }
              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else {
                throw new Error("try statement without catch or finally");
              }
            }
          }
        },
        abrupt: function abrupt(type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
              var finallyEntry = entry;
              break;
            }
          }

          if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
            // Ignore the finally entry if control is not jumping to a
            // location outside the try/catch block.
            finallyEntry = null;
          }

          var record = finallyEntry ? finallyEntry.completion : {};
          record.type = type;
          record.arg = arg;

          if (finallyEntry) {
            this.method = "next";
            this.next = finallyEntry.finallyLoc;
            return ContinueSentinel;
          }

          return this.complete(record);
        },
        complete: function complete(record, afterLoc) {
          if (record.type === "throw") {
            throw record.arg;
          }

          if (record.type === "break" || record.type === "continue") {
            this.next = record.arg;
          } else if (record.type === "return") {
            this.rval = this.arg = record.arg;
            this.method = "return";
            this.next = "end";
          } else if (record.type === "normal" && afterLoc) {
            this.next = afterLoc;
          }

          return ContinueSentinel;
        },
        finish: function finish(finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc);
              resetTryEntry(entry);
              return ContinueSentinel;
            }
          }
        },
        "catch": function _catch(tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.tryLoc === tryLoc) {
              var record = entry.completion;

              if (record.type === "throw") {
                var thrown = record.arg;
                resetTryEntry(entry);
              }

              return thrown;
            }
          } // The context.catch method must only be called with a location
          // argument that corresponds to a known catch block.


          throw new Error("illegal catch attempt");
        },
        delegateYield: function delegateYield(iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc
          };

          if (this.method === "next") {
            // Deliberately forget the last sent value so that we don't
            // accidentally pass it on to the delegate.
            this.arg = undefined$1;
          }

          return ContinueSentinel;
        }
      }; // Regardless of whether this script is executing as a CommonJS module
      // or not, return the runtime object so that we can declare the variable
      // regeneratorRuntime in the outer scope, which allows this module to be
      // injected easily by `bin/regenerator --include-runtime script.js`.

      return exports;
    }( // If this script is executing as a CommonJS module, use module.exports
    // as the regeneratorRuntime namespace. Otherwise create a new empty
    // object. Either way, the resulting object will be used to initialize
    // the regeneratorRuntime variable at the top of this file.
    module.exports);

    try {
      regeneratorRuntime = runtime;
    } catch (accidentalStrictMode) {
      // This module should not be running in strict mode, so the above
      // assignment should always work unless something is misconfigured. Just
      // in case runtime.js accidentally runs in strict mode, we can escape
      // strict mode using a global Function call. This could conceivably fail
      // if a Content Security Policy forbids using Function, but in that case
      // the proper solution is to fix the accidental strict mode problem. If
      // you've misconfigured your bundler to force strict mode and applied a
      // CSP to forbid Function, and you're not willing to fix either of those
      // problems, please detail your unique predicament in a GitHub issue.
      Function("r", "regeneratorRuntime = r")(runtime);
    }
  });
  var KEYINPUT = "input, [contenteditable], textarea";

  function anchorException(e) {
    if (!e.target) return;
    var link = e.target.closest && e.target.closest('a');
    if (!link) return;

    if (link.matches('a[download]')) {
      return true;
    } else if (link.href && link.href.match(/^(mailto|tel)/)) {
      return true;
    } else if (link.id && link.id.startsWith('dosy-litewait')) {
      return true;
    }
  }

  function selectException(e) {
    if (!e.target) return;
    var select = e.target.closest && e.target.closest('select');
    if (!select) return;
    return true;
  }

  function radioException(e) {
    if (!e.target) return;
    var radio = e.target.matches && e.target.matches('input[type="radio"]');
    if (!radio) return;
    return true;
  }

  function checkboxException(e) {
    if (!e.target) return;
    var checkbox = e.target.matches && e.target.matches('input[type="checkbox"]');
    if (!checkbox) return;
    return true;
  }

  function detailsSummaryException(e) {
    if (!e.target) return;
    var summaryDetails = e.target.matches && e.target.matches('summary, details');
    if (!summaryDetails) return;
    return true;
  }

  function keyInputException(e) {
    if (!e.target) return;
    return e.target.matches(KEYINPUT);
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  var arrayWithHoles = _arrayWithHoles;

  function _iterableToArrayLimit(arr, i) {
    if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
      return;
    }

    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  var iterableToArrayLimit = _iterableToArrayLimit;

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  var nonIterableRest = _nonIterableRest;

  function _slicedToArray(arr, i) {
    return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
  }

  var slicedToArray = _slicedToArray;
  var TOP_ORIGIN = '*';

  function se(e) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var event;

    if (!e.custom) {
      var raw = !e.type.startsWith('key');
      var target = e.target;
      var type = e.type,
          vRetargeted = e.vRetargeted,
          inputType = e.inputType,
          clientX = e.clientX,
          clientY = e.clientY,
          pageX = e.pageX,
          pageY = e.pageY,
          key = e.key,
          keyCode = e.keyCode,
          code = e.code,
          deltaMode = e.deltaMode,
          deltaX = e.deltaX,
          deltaY = e.deltaY,
          button = e.button;
      var x = e.x,
          y = e.y,
          width = e.width,
          height = e.height;
      var modifiers = encodeModifiers(e);
      var dataId, generation, value;
      if (target == document.documentElement || target == document.body) return;

      if (target.nodeType == Node.ELEMENT_NODE) {
        if (!target.hasAttribute('zig')) {
          target = target.closest('[zig]');
        }

        if (!!target) {
          var _target$getAttribute$ = target.getAttribute('zig').split(' ');

          var _target$getAttribute$2 = slicedToArray(_target$getAttribute$, 2);

          dataId = _target$getAttribute$2[0];
          generation = _target$getAttribute$2[1];

          if (!(target.value instanceof HTMLElement)) {
            value = target.value;
          }
        } else {
          console.warn("Target element has no Data Id so event cannot be projected.");
          return;
        }

        if (target.getBoundingClientRect) {
          var _target$getBoundingCl = target.getBoundingClientRect();

          width = _target$getBoundingCl.width;
          height = _target$getBoundingCl.height;
          x = _target$getBoundingCl.left;
          y = _target$getBoundingCl.top;
        }
      }

      event = {
        raw: raw,
        type: type,
        vRetargeted: vRetargeted,
        inputType: inputType,
        clientX: clientX,
        clientY: clientY,
        pageX: pageX,
        pageY: pageY,
        dataId: dataId,
        generation: generation,
        key: key,
        keyCode: keyCode,
        code: code,
        modifiers: modifiers,
        width: width,
        height: height,
        x: x,
        y: y,
        deltaMode: deltaMode,
        deltaX: deltaX,
        deltaY: deltaY,
        value: value,
        button: button
      };
      Object.assign(event, data);
      event.originalEvent = event;
    } else {
      event = e;
      var _event$originalEvent = event.originalEvent,
          _type = _event$originalEvent.type,
          _clientX = _event$originalEvent.clientX,
          _clientY = _event$originalEvent.clientY,
          _pageX = _event$originalEvent.pageX,
          _pageY = _event$originalEvent.pageY,
          _key = _event$originalEvent.key,
          _keyCode = _event$originalEvent.keyCode,
          _code = _event$originalEvent.code,
          _deltaMode = _event$originalEvent.deltaMode,
          _deltaX = _event$originalEvent.deltaX,
          _deltaY = _event$originalEvent.deltaY;
      var _self = self,
          _self$document$docume = _self.document.documentElement,
          innerWidth = _self$document$docume.clientWidth,
          innerHeight = _self$document$docume.clientHeight;

      var _x = _clientX || randomInside({
        LOR: 1 / 30,
        HIR: 1 / 3,
        SPAN: innerWidth
      });

      var _y = _clientY || randomInside({
        LOR: 1 / 30,
        HIR: 1 / 3,
        SPAN: innerHeight
      });

      event.originalEvent = {
        type: _type,
        clientX: _clientX,
        clientY: _clientY,
        pageX: _pageX,
        pageY: _pageY,
        key: _key,
        keyCode: _keyCode,
        code: _code,
        deltaMode: _deltaMode,
        deltaX: _deltaX,
        deltaY: _deltaY,
        x: _x,
        y: _y,
        X: _x,
        Y: _y
      };
    }

    top.postMessage({
      event: event
    }, TOP_ORIGIN);
  }

  function randomInside(_ref) {
    var LOR = _ref.LOR,
        HIR = _ref.HIR,
        SPAN = _ref.SPAN;
    var ran = Math.random();
    var HI = SPAN * HIR;
    var LO = SPAN * LOR;
    var P = (HI - LO) * ran + LO;
    return P;
  }

  var LastMouse = {
    x: 0,
    y: 0,
    target: document.documentElement,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0
  };
  var LastInput = {
    target: null,
    value: ''
  };

  function getViewWindow() {
    return window;
  }

  function throttle(callback, limit) {
    var wait = false;
    return function () {
      if (!wait) {
        try {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          callback.call.apply(callback, [this].concat(args));
        } catch (e) {
          console.warn(e);
        }

        wait = true;
        setTimeout(function () {
          wait = false;
        }, limit);
      }
    };
  }

  function encodeModifiers(originalEvent) {
    var modifiers = 0;

    if (originalEvent.altKey) {
      modifiers += 1;
    }

    if (originalEvent.ctrlKey || originalEvent.metaKey) {
      modifiers += 2;
    }

    if (originalEvent.metaKey) {
      modifiers += 4;
    }

    if (originalEvent.shiftKey) {
      modifiers += 8;
    }

    return modifiers;
  }

  function installScrollWatcher() {
    getViewWindow().addEventListener('scroll', throttle(function (e) {
      var _self = self,
          scrollX = _self.pageXOffset,
          scrollY = _self.pageYOffset;
      var clientX = LastMouse.clientX,
          clientY = LastMouse.clientY;
      var pageX = clientX + scrollX;
      var pageY = clientY + scrollY;
      Object.assign(LastMouse, {
        pageX: pageX,
        pageY: pageY
      });
      var X = clientX;
      var Y = clientY;
      var target = document.elementFromPoint(X, Y);

      if (!!target) {
        var _target$getBoundingCl = target.getBoundingClientRect(),
            x = _target$getBoundingCl.left,
            y = _target$getBoundingCl.top,
            width = _target$getBoundingCl.width,
            height = _target$getBoundingCl.height;

        var packet = {
          type: 'scrollToZig',
          clientX: clientX,
          clientY: clientY,
          pageX: pageX,
          pageY: pageY,
          x: x,
          y: y,
          width: width,
          height: height,
          zig: target.getAttribute('zig') || document.activeElement.getAttribute('zig'),
          custom: true,
          originalEvent: e
        };

        if (!!packet.zig) {
          se(packet);
        } else {
          console.log("No zig on ", target);
        }
      }
    }, 500), {
      passive: true
    });
  }

  function installHashFragmentController() {
    getViewWindow().addEventListener('click', function (e) {
      var link = e.target.closest('a');

      if (!!link) {
        try {
          var href = new URL(link.href);

          if (href.hash) {
            se(e, {
              href: href + ''
            });
          }
        } catch (e) {
          console.info(e);
        }
      }
    });
  }

  function installSyntheticHashChanger() {
    // this is more complex since we are in a constant location
    // and the documents locaiton is a synthetic location
    // we need to push an event from the remote for that
    // (we already do), we need to hook it
    getViewWindow().addEventListener('hashchange', function (e) {
      var hash = location.hash;

      if (!!hash) {
        var id = hash.slice(1);
        var idEl = document.getElementById(id);

        if (!!idEl) {
          idEl.scrollIntoView();
        }
      }
    });
  }

  var ACCEPTS_LOCAL_FOCUS = "input, select, textarea, [contenteditable]";

  function installSyntheticFocus() {
    var synthFocus = function synthFocus(e) {
      if (e.target.matches(ACCEPTS_LOCAL_FOCUS)) {
        e.target.focus();
        LastInput.target = e.target;
        LastInput.value = e.value;
      } else {
        e.target.ownerDocument.activeElement.blur();
        LastInput.target = null;
        LastInput.value = '';
      }
    };

    getViewWindow().addEventListener('mousedown', synthFocus);
    getViewWindow().addEventListener('pointerdown', synthFocus);
  }

  var KEYINPUT$1 = new Set(['keydown', 'keypress', 'keyup', 'input', 'compositionstart', 'compositionupdate', 'compositionend']);
  var Exceptions = new Map();
  var capture = ['mousedown', 'mouseup', 'pointerdown', 'pointerup'];
  var allow = ['keydown', 'keypress', 'keyup', 'input', 'compositionstart', 'compositionupdate', 'compositionend'];
  var passive = ['touchstart', 'touchmove', 'mousemove', 'pointermove'];
  var cancel = ['click', 'submit'];
  var exceptions = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'];
  installListeners();

  function installListeners() {
    top.addEventListener('touchstart', function doNothingWith(event) {});
    document.addEventListener('touchstart', function doNothingWith(event) {});
    capture.forEach(function (event) {
      return listen(event, true);
    });
    allow.forEach(function (event) {
      return listen(event, false);
    });
    passive.forEach(function (event) {
      return listen(event, false, true);
    });
    cancel.forEach(function (e) {
      return getViewWindow().addEventListener(e, function (ev) {
        if (allowException(ev)) return;
        ev.preventDefault() && ev.stopPropagation();
      });
    });
    exceptions.forEach(function (name) {
      return registerException(name, anchorException);
    });
    exceptions.forEach(function (name) {
      return registerException(name, selectException);
    });
    exceptions.forEach(function (name) {
      return registerException(name, radioException);
    });
    exceptions.forEach(function (name) {
      return registerException(name, checkboxException);
    });
    exceptions.forEach(function (name) {
      return registerException(name, keyInputException);
    });
    exceptions.forEach(function (name) {
      return registerException(name, detailsSummaryException);
    });
    installScrollWatcher();
    installHashFragmentController();
    installSyntheticHashChanger();
    installSyntheticFocus();
  }

  function listen(type) {
    var cancel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var passive = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    getViewWindow().addEventListener(type, function (e) {
      try {
        if (cancel && !allowException(e)) {
          e.preventDefault && e.preventDefault();
        }

        if (e.type.endsWith('move')) {
          var _ref = e.touches ? e.touches[0] : e,
              target = _ref.target,
              clientX = _ref.clientX,
              clientY = _ref.clientY,
              pageX = _ref.pageX,
              pageY = _ref.pageY;

          Object.assign(LastMouse, {
            clientX: clientX,
            clientY: clientY,
            pageX: pageX,
            pageY: pageY,
            target: target
          });
        } else if (e.type == 'touchstart') {
          var _e$touches$ = e.touches[0],
              _target = _e$touches$.target,
              _clientX = _e$touches$.clientX,
              _clientY = _e$touches$.clientY,
              _pageX = _e$touches$.pageX,
              _pageY = _e$touches$.pageY;
          Object.assign(LastMouse, {
            clientX: _clientX,
            clientY: _clientY,
            pageX: _pageX,
            pageY: _pageY,
            target: _target
          });
        } else if (KEYINPUT$1.has(e.type)) {
          // this causes a problem because we are canceling some type of key events effectively 
          // by not sending them to top if they are not controls and if they do not change the value
          //if ( ! inputValueDiffers(e, LastInput) && ! controlChars.has(e.key) ) return;
          e.vRetargeted = e.key == "Tab";
          LastInput.target = e.target;
          LastInput.value = e.target.value;
        }

        var data = {};

        if (e.target.matches && e.target.matches('[contenteditable]')) {
          data = {
            contenteditableTarget: true
          };
        } else if (e.target.matches && e.target.matches('select')) {
          data = {
            selectInput: true,
            target: {
              value: e.target.value
            }
          };
        }

        se(e, data);
      } catch (e) {
        console.warn(e);
      }
    }, {
      passive: passive
    });
  }

  function registerException(name, func) {
    var exceptions = Exceptions.get(name);

    if (!exceptions) {
      exceptions = [];
      Exceptions.set(name, exceptions);
    }

    exceptions.push(func);
  }

  function allowException(e) {
    var type = e.type;
    var exceptions = Exceptions.get(type);

    if (exceptions) {
      return exceptions.some(function (except) {
        return except(e);
      });
    }

    return false;
  }

  var docEl = document.documentElement;
})();

