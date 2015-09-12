///<reference path="bluebird.d.ts"/>
// Tests by: Bart van der Schoor <https://github.com/Bartvds>
// Note: replicate changes to all overloads in both definition and test file
// Note: keep both static and instance members inline (so similar)
// Note: try to maintain the ordering and separators, and keep to the pattern
var obj;
var bool;
var num;
var str;
var err;
var x;
var f;
var func;
var arr;
var exp;
var anyArr;
var strArr;
var numArr;
var voidVar;
// - - - - - - - - - - - - - - - - -
var value;
var reason;
var insanity;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var foo;
var bar;
var fooArr;
var barArr;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var numProm;
var strProm;
var anyProm;
var boolProm;
var objProm;
var voidProm;
var fooProm;
var barProm;
// - - - - - - - - - - - - - - - - -
var numThen;
var strThen;
var anyThen;
var boolThen;
var objThen;
var voidThen;
var fooThen;
var barThen;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var numArrProm;
var strArrProm;
var anyArrProm;
var fooArrProm;
var barArrProm;
// - - - - - - - - - - - - - - - - -
var numArrThen;
var strArrThen;
var anyArrThen;
var fooArrThen;
var barArrThen;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var numPromArr;
var strPromArr;
var anyPromArr;
var fooPromArr;
var barPromArr;
// - - - - - - - - - - - - - - - - -
var numThenArr;
var strThenArr;
var anyThenArr;
var fooThenArr;
var barThenArr;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// booya!
var fooThenArrThen;
var barThenArrThen;
var fooResolver;
var barResolver;
var fooInspection;
var barInspection;
var fooInspectionArrProm;
var barInspectionArrProm;
var BlueBird;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var nodeCallbackFunc = function (callback) { };
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooThen = fooProm;
barThen = barProm;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = new Promise(function (resolve, reject) {
    if (bool) {
        resolve(foo);
    }
    else {
        reject(new Error(str));
    }
});
fooProm = new Promise(function (resolve) {
    if (bool) {
        resolve(foo);
    }
});
// - - - - - - - - - - - - - - - - - - - - - - -
// needs a hint when used untyped?
fooProm = new Promise(function (resolve, reject) {
    if (bool) {
        resolve(fooThen);
    }
    else {
        reject(new Error(str));
    }
});
fooProm = new Promise(function (resolve) {
    resolve(fooThen);
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooResolver.resolve(foo);
fooResolver.reject(err);
fooResolver.progress(bar);
fooResolver.callback = function (err, value) {
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
bool = fooInspection.isFulfilled();
bool = fooInspection.isRejected();
bool = fooInspection.isPending();
foo = fooInspection.value();
x = fooInspection.reason();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.then(function (value) {
    return bar;
}, function (reason) {
    return bar;
}, function (note) {
    return bar;
});
barProm = fooProm.then(function (value) {
    return bar;
}, function (reason) {
    return bar;
});
barProm = fooProm.then(function (value) {
    return bar;
});
barProm = barProm.then(function (value) {
    if (value)
        return value;
    var b;
    return Promise.resolve(b);
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.catch(function (reason) {
    return bar;
});
barProm = fooProm.caught(function (reason) {
    return bar;
});
barProm = fooProm.catch(function (reason) {
    return bar;
}, function (reason) {
    return bar;
});
barProm = fooProm.caught(function (reason) {
    return bar;
}, function (reason) {
    return bar;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.catch(Error, function (reason) {
    return bar;
});
barProm = fooProm.catch(Promise.CancellationError, function (reason) {
    return bar;
});
barProm = fooProm.caught(Error, function (reason) {
    return bar;
});
barProm = fooProm.caught(Promise.CancellationError, function (reason) {
    return bar;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.error(function (reason) {
    return bar;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.finally(function () {
    // non-Thenable return is ignored
    return "foo";
});
fooProm = fooProm.finally(function () {
    return fooThen;
});
fooProm = fooProm.finally(function () {
    // non-Thenable return is ignored
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.lastly(function () {
    // non-Thenable return is ignored
    return "foo";
});
fooProm = fooProm.lastly(function () {
    return fooThen;
});
fooProm = fooProm.lastly(function () {
    // non-Thenable return is ignored
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.bind(obj);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
voidVar = fooProm.done(function (value) {
    return bar;
}, function (reason) {
    return bar;
}, function (note) {
});
voidVar = fooProm.done(function (value) {
    return bar;
}, function (reason) {
    return bar;
});
voidVar = fooProm.done(function (value) {
    return bar;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
voidVar = fooProm.done(function (value) {
    return barThen;
}, function (reason) {
    return barThen;
}, function (note) {
});
voidVar = fooProm.done(function (value) {
    return barThen;
}, function (reason) {
    return barThen;
});
voidVar = fooProm.done(function (value) {
    return barThen;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.tap(function (value) {
    // non-Thenable return is ignored
    return "foo";
});
fooProm = fooProm.tap(function (value) {
    return fooThen;
});
fooProm = fooProm.tap(function (value) {
    return voidThen;
});
fooProm = fooProm.tap(function () {
    // non-Thenable return is ignored
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.progressed(function (note) {
    return foo;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.delay(num);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.timeout(num);
fooProm = fooProm.timeout(num, str);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm.nodeify();
fooProm = fooProm.nodeify(function (err) { });
fooProm = fooProm.nodeify(function (err, foo) { });
fooProm.nodeify({ spread: true });
fooProm = fooProm.nodeify(function (err) { }, { spread: true });
fooProm = fooProm.nodeify(function (err, foo) { }, { spread: true });
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.fork(function (value) {
    return bar;
}, function (reason) {
    return bar;
}, function (note) {
});
barProm = fooProm.fork(function (value) {
    return bar;
}, function (reason) {
    return bar;
});
barProm = fooProm.fork(function (value) {
    return bar;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.fork(function (value) {
    return barThen;
}, function (reason) {
    return barThen;
}, function (note) {
});
barProm = fooProm.fork(function (value) {
    return barThen;
}, function (reason) {
    return barThen;
});
barProm = fooProm.fork(function (value) {
    return barThen;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.cancel();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = fooProm.cancellable();
fooProm = fooProm.uncancellable();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
bool = fooProm.isCancellable();
bool = fooProm.isFulfilled();
bool = fooProm.isRejected();
bool = fooProm.isPending();
bool = fooProm.isResolved();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooInspection = fooProm.inspect();
anyProm = fooProm.call(str);
anyProm = fooProm.call(str, 1, 2, 3);
//TODO enable get() test when implemented
// barProm = fooProm.get(str);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.return(bar);
barProm = fooProm.thenReturn(bar);
voidProm = fooProm.return();
voidProm = fooProm.thenReturn();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooProm
fooProm = fooProm.throw(err);
fooProm = fooProm.thenThrow(err);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
str = fooProm.toString();
obj = fooProm.toJSON();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooArrProm.spread(function (one, two) {
    return bar;
}, function (reason) {
    return bar;
});
barProm = fooArrProm.spread(function (one, two, twotwo) {
    return bar;
});
// - - - - - - - - - - - - - - - - -
barProm = fooArrProm.spread(function (one, two) {
    return barThen;
}, function (reason) {
    return barThen;
});
barProm = fooArrProm.spread(function (one, two, twotwo) {
    return barThen;
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO fix collection inference
barArrProm = fooProm.all();
objProm = fooProm.props();
barInspectionArrProm = fooProm.settle();
barProm = fooProm.any();
barArrProm = fooProm.some(num);
barProm = fooProm.race();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO fix collection inference
barArrProm = fooProm.map(function (item, index, arrayLength) {
    return bar;
});
barArrProm = fooProm.map(function (item) {
    return bar;
});
barArrProm = fooProm.map(function (item, index, arrayLength) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = fooProm.map(function (item) {
    return bar;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
barProm = fooProm.reduce(function (memo, item, index, arrayLength) {
    return memo;
});
barProm = fooProm.reduce(function (memo, item) {
    return memo;
}, bar);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooArrProm = fooArrProm.filter(function (item, index, arrayLength) {
    return bool;
});
fooArrProm = fooArrProm.filter(function (item) {
    return bool;
});
fooArrProm = fooArrProm.filter(function (item, index, arrayLength) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = fooArrProm.filter(function (item) {
    return bool;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = Promise.try(function () {
    return foo;
});
fooProm = Promise.try(function () {
    return foo;
}, arr);
fooProm = Promise.try(function () {
    return foo;
}, arr, x);
// - - - - - - - - - - - - - - - - -
fooProm = Promise.try(function () {
    return fooThen;
});
fooProm = Promise.try(function () {
    return fooThen;
}, arr);
fooProm = Promise.try(function () {
    return fooThen;
}, arr, x);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = Promise.attempt(function () {
    return foo;
});
fooProm = Promise.attempt(function () {
    return foo;
}, arr);
fooProm = Promise.attempt(function () {
    return foo;
}, arr, x);
// - - - - - - - - - - - - - - - - -
fooProm = Promise.attempt(function () {
    return fooThen;
});
fooProm = Promise.attempt(function () {
    return fooThen;
}, arr);
fooProm = Promise.attempt(function () {
    return fooThen;
}, arr, x);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
func = Promise.method(function () {
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = Promise.resolve(foo);
fooProm = Promise.resolve(fooThen);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
voidProm = Promise.reject(reason);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooResolver = Promise.defer();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooProm = Promise.cast(foo);
fooProm = Promise.cast(fooThen);
voidProm = Promise.bind(x);
bool = Promise.is(value);
Promise.longStackTraces();
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO enable delay
fooProm = Promise.delay(fooThen, num);
fooProm = Promise.delay(foo, num);
voidProm = Promise.delay(num);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
func = Promise.promisify(f);
func = Promise.promisify(f, obj);
obj = Promise.promisifyAll(obj);
anyProm = Promise.fromNode(function (callback) { return nodeCallbackFunc(callback); });
function defaultFilter(name, func) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        !util.isClass(func);
}
function DOMPromisifier(originalMethod) {
    // return a function
    return function promisified() {
        var args = [].slice.call(arguments);
        // Needed so that the original method can be called with the correct receiver
        var self = this;
        // which returns a promise
        return new Promise(function (resolve, reject) {
            args.push(resolve, reject);
            originalMethod.apply(self, args);
        });
    };
}
obj = Promise.promisifyAll(obj, {
    suffix: "",
    filter: defaultFilter,
    promisifier: DOMPromisifier
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO enable generator
/*
 func = Promise.coroutine(f);

 barProm = Promise.spawn<number>(f);
 */
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BlueBird = Promise.noConflict();
Promise.onPossiblyUnhandledRejection(function (reason) {
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO expand tests to overloads
fooArrProm = Promise.all(fooThenArrThen);
fooArrProm = Promise.all(fooArrProm);
fooArrProm = Promise.all(fooThenArr);
fooArrProm = Promise.all(fooArr);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
objProm = Promise.props(objProm);
objProm = Promise.props(obj);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO expand tests to overloads
fooInspectionArrProm = Promise.settle(fooThenArrThen);
fooInspectionArrProm = Promise.settle(fooArrProm);
fooInspectionArrProm = Promise.settle(fooThenArr);
fooInspectionArrProm = Promise.settle(fooArr);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO expand tests to overloads
fooProm = Promise.any(fooThenArrThen);
fooProm = Promise.any(fooArrProm);
fooProm = Promise.any(fooThenArr);
fooProm = Promise.any(fooArr);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO expand tests to overloads
fooProm = Promise.race(fooThenArrThen);
fooProm = Promise.race(fooArrProm);
fooProm = Promise.race(fooThenArr);
fooProm = Promise.race(fooArr);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//TODO expand tests to overloads
fooArrProm = Promise.some(fooThenArrThen, num);
fooArrProm = Promise.some(fooArrThen, num);
fooArrProm = Promise.some(fooThenArr, num);
fooArrProm = Promise.some(fooArr, num);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
fooArrProm = Promise.join(foo, foo, foo);
fooArrProm = Promise.join(fooThen, fooThen, fooThen);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// map()
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooThenArrThen
barArrProm = Promise.map(fooThenArrThen, function (item) {
    return bar;
});
barArrProm = Promise.map(fooThenArrThen, function (item) {
    return barThen;
});
barArrProm = Promise.map(fooThenArrThen, function (item, index, arrayLength) {
    return bar;
});
barArrProm = Promise.map(fooThenArrThen, function (item, index, arrayLength) {
    return barThen;
});
barArrProm = Promise.map(fooThenArrThen, function (item) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooThenArrThen, function (item) {
    return barThen;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooThenArrThen, function (item, index, arrayLength) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooThenArrThen, function (item, index, arrayLength) {
    return barThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooArrThen
barArrProm = Promise.map(fooArrThen, function (item) {
    return bar;
});
barArrProm = Promise.map(fooArrThen, function (item) {
    return barThen;
});
barArrProm = Promise.map(fooArrThen, function (item, index, arrayLength) {
    return bar;
});
barArrProm = Promise.map(fooArrThen, function (item, index, arrayLength) {
    return barThen;
});
barArrProm = Promise.map(fooArrThen, function (item) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooArrThen, function (item) {
    return barThen;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooArrThen, function (item, index, arrayLength) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooArrThen, function (item, index, arrayLength) {
    return barThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooThenArr
barArrProm = Promise.map(fooThenArr, function (item) {
    return bar;
});
barArrProm = Promise.map(fooThenArr, function (item) {
    return barThen;
});
barArrProm = Promise.map(fooThenArr, function (item, index, arrayLength) {
    return bar;
});
barArrProm = Promise.map(fooThenArr, function (item, index, arrayLength) {
    return barThen;
});
barArrProm = Promise.map(fooThenArr, function (item) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooThenArr, function (item) {
    return barThen;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooThenArr, function (item, index, arrayLength) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooThenArr, function (item, index, arrayLength) {
    return barThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooArr
barArrProm = Promise.map(fooArr, function (item) {
    return bar;
});
barArrProm = Promise.map(fooArr, function (item) {
    return barThen;
});
barArrProm = Promise.map(fooArr, function (item, index, arrayLength) {
    return bar;
});
barArrProm = Promise.map(fooArr, function (item, index, arrayLength) {
    return barThen;
});
barArrProm = Promise.map(fooArr, function (item) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooArr, function (item) {
    return barThen;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooArr, function (item, index, arrayLength) {
    return bar;
}, {
    concurrency: 1
});
barArrProm = Promise.map(fooArr, function (item, index, arrayLength) {
    return barThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// reduce()
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooThenArrThen
barProm = Promise.reduce(fooThenArrThen, function (memo, item) {
    return memo;
}, bar);
barProm = Promise.reduce(fooThenArrThen, function (memo, item) {
    return barThen;
}, bar);
barProm = Promise.reduce(fooThenArrThen, function (memo, item, index, arrayLength) {
    return memo;
}, bar);
barProm = Promise.reduce(fooThenArrThen, function (memo, item, index, arrayLength) {
    return barThen;
}, bar);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooArrThen
barProm = Promise.reduce(fooArrThen, function (memo, item) {
    return memo;
}, bar);
barProm = Promise.reduce(fooArrThen, function (memo, item) {
    return barThen;
}, bar);
barProm = Promise.reduce(fooArrThen, function (memo, item, index, arrayLength) {
    return memo;
}, bar);
barProm = Promise.reduce(fooArrThen, function (memo, item, index, arrayLength) {
    return barThen;
}, bar);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooThenArr
barProm = Promise.reduce(fooThenArr, function (memo, item) {
    return memo;
}, bar);
barProm = Promise.reduce(fooThenArr, function (memo, item) {
    return barThen;
}, bar);
barProm = Promise.reduce(fooThenArr, function (memo, item, index, arrayLength) {
    return memo;
}, bar);
barProm = Promise.reduce(fooThenArr, function (memo, item, index, arrayLength) {
    return barThen;
}, bar);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooArr
barProm = Promise.reduce(fooArr, function (memo, item) {
    return memo;
}, bar);
barProm = Promise.reduce(fooArr, function (memo, item) {
    return barThen;
}, bar);
barProm = Promise.reduce(fooArr, function (memo, item, index, arrayLength) {
    return memo;
}, bar);
barProm = Promise.reduce(fooArr, function (memo, item, index, arrayLength) {
    return barThen;
}, bar);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// filter()
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooThenArrThen
fooArrProm = Promise.filter(fooThenArrThen, function (item) {
    return bool;
});
fooArrProm = Promise.filter(fooThenArrThen, function (item) {
    return boolThen;
});
fooArrProm = Promise.filter(fooThenArrThen, function (item, index, arrayLength) {
    return bool;
});
fooArrProm = Promise.filter(fooThenArrThen, function (item, index, arrayLength) {
    return boolThen;
});
fooArrProm = Promise.filter(fooThenArrThen, function (item) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooThenArrThen, function (item) {
    return boolThen;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooThenArrThen, function (item, index, arrayLength) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooThenArrThen, function (item, index, arrayLength) {
    return boolThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooArrThen
fooArrProm = Promise.filter(fooArrThen, function (item) {
    return bool;
});
fooArrProm = Promise.filter(fooArrThen, function (item) {
    return boolThen;
});
fooArrProm = Promise.filter(fooArrThen, function (item, index, arrayLength) {
    return bool;
});
fooArrProm = Promise.filter(fooArrThen, function (item, index, arrayLength) {
    return boolThen;
});
fooArrProm = Promise.filter(fooArrThen, function (item) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooArrThen, function (item) {
    return boolThen;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooArrThen, function (item, index, arrayLength) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooArrThen, function (item, index, arrayLength) {
    return boolThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooThenArr
fooArrProm = Promise.filter(fooThenArr, function (item) {
    return bool;
});
fooArrProm = Promise.filter(fooThenArr, function (item) {
    return boolThen;
});
fooArrProm = Promise.filter(fooThenArr, function (item, index, arrayLength) {
    return bool;
});
fooArrProm = Promise.filter(fooThenArr, function (item, index, arrayLength) {
    return boolThen;
});
fooArrProm = Promise.filter(fooThenArr, function (item) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooThenArr, function (item) {
    return boolThen;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooThenArr, function (item, index, arrayLength) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooThenArr, function (item, index, arrayLength) {
    return boolThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// fooArr
fooArrProm = Promise.filter(fooArr, function (item) {
    return bool;
});
fooArrProm = Promise.filter(fooArr, function (item) {
    return boolThen;
});
fooArrProm = Promise.filter(fooArr, function (item, index, arrayLength) {
    return bool;
});
fooArrProm = Promise.filter(fooArr, function (item, index, arrayLength) {
    return boolThen;
});
fooArrProm = Promise.filter(fooArr, function (item) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooArr, function (item) {
    return boolThen;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooArr, function (item, index, arrayLength) {
    return bool;
}, {
    concurrency: 1
});
fooArrProm = Promise.filter(fooArr, function (item, index, arrayLength) {
    return boolThen;
}, {
    concurrency: 1
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//# sourceMappingURL=bluebird-tests.js.map