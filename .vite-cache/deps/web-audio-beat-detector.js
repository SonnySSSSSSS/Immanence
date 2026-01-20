import { t as __commonJS } from "./chunk-DUEDWNxO.js";

//#region node_modules/fast-unique-numbers/build/es5/bundle.js
var require_bundle$1 = /* @__PURE__ */ __commonJS({ "node_modules/fast-unique-numbers/build/es5/bundle.js": ((exports, module) => {
	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.fastUniqueNumbers = {}));
	})(exports, (function(exports$1) {
		var createAddUniqueNumber = function createAddUniqueNumber$1(generateUniqueNumber$2) {
			return function(set) {
				var number = generateUniqueNumber$2(set);
				set.add(number);
				return number;
			};
		};
		var createCache = function createCache$1(lastNumberWeakMap) {
			return function(collection, nextNumber) {
				lastNumberWeakMap.set(collection, nextNumber);
				return nextNumber;
			};
		};
		var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER === void 0 ? 9007199254740991 : Number.MAX_SAFE_INTEGER;
		var TWO_TO_THE_POWER_OF_TWENTY_NINE = 536870912;
		var TWO_TO_THE_POWER_OF_THIRTY = TWO_TO_THE_POWER_OF_TWENTY_NINE * 2;
		var createGenerateUniqueNumber = function createGenerateUniqueNumber$1(cache, lastNumberWeakMap) {
			return function(collection) {
				var lastNumber = lastNumberWeakMap.get(collection);
				var nextNumber = lastNumber === void 0 ? collection.size : lastNumber < TWO_TO_THE_POWER_OF_THIRTY ? lastNumber + 1 : 0;
				if (!collection.has(nextNumber)) return cache(collection, nextNumber);
				if (collection.size < TWO_TO_THE_POWER_OF_TWENTY_NINE) {
					while (collection.has(nextNumber)) nextNumber = Math.floor(Math.random() * TWO_TO_THE_POWER_OF_THIRTY);
					return cache(collection, nextNumber);
				}
				if (collection.size > MAX_SAFE_INTEGER) throw new Error("Congratulations, you created a collection of unique numbers which uses all available integers!");
				while (collection.has(nextNumber)) nextNumber = Math.floor(Math.random() * MAX_SAFE_INTEGER);
				return cache(collection, nextNumber);
			};
		};
		var LAST_NUMBER_WEAK_MAP = /* @__PURE__ */ new WeakMap();
		var generateUniqueNumber$1 = createGenerateUniqueNumber(createCache(LAST_NUMBER_WEAK_MAP), LAST_NUMBER_WEAK_MAP);
		exports$1.addUniqueNumber = createAddUniqueNumber(generateUniqueNumber$1);
		exports$1.generateUniqueNumber = generateUniqueNumber$1;
	}));
}) });

//#endregion
//#region node_modules/broker-factory/build/es2019/factories/create-broker.js
var import_bundle$2 = require_bundle$1();
const createBrokerFactory = (createOrGetOngoingRequests, extendBrokerImplementation, generateUniqueNumber$1, isMessagePort$1) => (brokerImplementation) => {
	const fullBrokerImplementation = extendBrokerImplementation(brokerImplementation);
	return (sender) => {
		const ongoingRequests = createOrGetOngoingRequests(sender);
		sender.addEventListener("message", (({ data: message }) => {
			const { id } = message;
			if (id !== null && ongoingRequests.has(id)) {
				const { reject, resolve } = ongoingRequests.get(id);
				ongoingRequests.delete(id);
				if (message.error === void 0) resolve(message.result);
				else reject(new Error(message.error.message));
			}
		}));
		if (isMessagePort$1(sender)) sender.start();
		const call = (method, params = null, transferables = []) => {
			return new Promise((resolve, reject) => {
				const id = generateUniqueNumber$1(ongoingRequests);
				ongoingRequests.set(id, {
					reject,
					resolve
				});
				if (params === null) sender.postMessage({
					id,
					method
				}, transferables);
				else sender.postMessage({
					id,
					method,
					params
				}, transferables);
			});
		};
		const notify = (method, params, transferables = []) => {
			sender.postMessage({
				id: null,
				method,
				params
			}, transferables);
		};
		let functions = {};
		for (const [key, handler$1] of Object.entries(fullBrokerImplementation)) functions = {
			...functions,
			[key]: handler$1({
				call,
				notify
			})
		};
		return { ...functions };
	};
};

//#endregion
//#region node_modules/broker-factory/build/es2019/factories/create-or-get-ongoing-requests.js
const createCreateOrGetOngoingRequests = (ongoingRequestsMap) => (sender) => {
	if (ongoingRequestsMap.has(sender)) return ongoingRequestsMap.get(sender);
	const ongoingRequests = /* @__PURE__ */ new Map();
	ongoingRequestsMap.set(sender, ongoingRequests);
	return ongoingRequests;
};

//#endregion
//#region node_modules/broker-factory/build/es2019/factories/extend-broker-implementation.js
const createExtendBrokerImplementation = (portMap) => (partialBrokerImplementation) => ({
	...partialBrokerImplementation,
	connect: ({ call }) => {
		return async () => {
			const { port1, port2 } = new MessageChannel();
			const portId = await call("connect", { port: port1 }, [port1]);
			portMap.set(port2, portId);
			return port2;
		};
	},
	disconnect: ({ call }) => {
		return async (port) => {
			const portId = portMap.get(port);
			if (portId === void 0) throw new Error("The given port is not connected.");
			await call("disconnect", { portId });
		};
	},
	isSupported: ({ call }) => {
		return () => call("isSupported");
	}
});

//#endregion
//#region node_modules/broker-factory/build/es2019/guards/message-port.js
const isMessagePort = (sender) => {
	return typeof sender.start === "function";
};

//#endregion
//#region node_modules/broker-factory/build/es2019/module.js
const createBroker = createBrokerFactory(createCreateOrGetOngoingRequests(/* @__PURE__ */ new WeakMap()), createExtendBrokerImplementation(/* @__PURE__ */ new WeakMap()), import_bundle$2.generateUniqueNumber, isMessagePort);

//#endregion
//#region node_modules/@babel/runtime/helpers/arrayWithHoles.js
var require_arrayWithHoles = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/arrayWithHoles.js": ((exports, module) => {
	function _arrayWithHoles(r) {
		if (Array.isArray(r)) return r;
	}
	module.exports = _arrayWithHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/iterableToArrayLimit.js
var require_iterableToArrayLimit = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/iterableToArrayLimit.js": ((exports, module) => {
	function _iterableToArrayLimit(r, l) {
		var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (null != t) {
			var e, n, i, u, a = [], f = !0, o = !1;
			try {
				if (i = (t = t.call(r)).next, 0 === l) {
					if (Object(t) !== t) return;
					f = !1;
				} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
			} catch (r$1) {
				o = !0, n = r$1;
			} finally {
				try {
					if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
				} finally {
					if (o) throw n;
				}
			}
			return a;
		}
	}
	module.exports = _iterableToArrayLimit, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/arrayLikeToArray.js
var require_arrayLikeToArray = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/arrayLikeToArray.js": ((exports, module) => {
	function _arrayLikeToArray(r, a) {
		(null == a || a > r.length) && (a = r.length);
		for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
		return n;
	}
	module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js
var require_unsupportedIterableToArray = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js": ((exports, module) => {
	var arrayLikeToArray = require_arrayLikeToArray();
	function _unsupportedIterableToArray(r, a) {
		if (r) {
			if ("string" == typeof r) return arrayLikeToArray(r, a);
			var t = {}.toString.call(r).slice(8, -1);
			return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
		}
	}
	module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/nonIterableRest.js
var require_nonIterableRest = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/nonIterableRest.js": ((exports, module) => {
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	module.exports = _nonIterableRest, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/slicedToArray.js
var require_slicedToArray = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/slicedToArray.js": ((exports, module) => {
	var arrayWithHoles = require_arrayWithHoles();
	var iterableToArrayLimit = require_iterableToArrayLimit();
	var unsupportedIterableToArray = require_unsupportedIterableToArray();
	var nonIterableRest = require_nonIterableRest();
	function _slicedToArray(r, e) {
		return arrayWithHoles(r) || iterableToArrayLimit(r, e) || unsupportedIterableToArray(r, e) || nonIterableRest();
	}
	module.exports = _slicedToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/classCallCheck.js
var require_classCallCheck = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/classCallCheck.js": ((exports, module) => {
	function _classCallCheck(a, n) {
		if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/typeof.js
var require_typeof = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/typeof.js": ((exports, module) => {
	function _typeof$2(o) {
		"@babel/helpers - typeof";
		return module.exports = _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
			return typeof o$1;
		} : function(o$1) {
			return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
		}, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof$2(o);
	}
	module.exports = _typeof$2, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/toPrimitive.js
var require_toPrimitive = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/toPrimitive.js": ((exports, module) => {
	var _typeof$1 = require_typeof()["default"];
	function toPrimitive$1(t, r) {
		if ("object" != _typeof$1(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof$1(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	module.exports = toPrimitive$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/toPropertyKey.js
var require_toPropertyKey = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/toPropertyKey.js": ((exports, module) => {
	var _typeof = require_typeof()["default"];
	var toPrimitive = require_toPrimitive();
	function toPropertyKey$1(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	module.exports = toPropertyKey$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/@babel/runtime/helpers/createClass.js
var require_createClass = /* @__PURE__ */ __commonJS({ "node_modules/@babel/runtime/helpers/createClass.js": ((exports, module) => {
	var toPropertyKey = require_toPropertyKey();
	function _defineProperties(e, r) {
		for (var t = 0; t < r.length; t++) {
			var o = r[t];
			o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
		}
	}
	function _createClass(e, r, t) {
		return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/automation-events/build/es5/bundle.js
var require_bundle = /* @__PURE__ */ __commonJS({ "node_modules/automation-events/build/es5/bundle.js": ((exports, module) => {
	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require_slicedToArray(), require_classCallCheck(), require_createClass()) : typeof define === "function" && define.amd ? define([
			"exports",
			"@babel/runtime/helpers/slicedToArray",
			"@babel/runtime/helpers/classCallCheck",
			"@babel/runtime/helpers/createClass"
		], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.automationEvents = {}, global._slicedToArray, global._classCallCheck, global._createClass));
	})(exports, (function(exports$1, _slicedToArray$1, _classCallCheck$1, _createClass$1) {
		var createExtendedExponentialRampToValueAutomationEvent = function createExtendedExponentialRampToValueAutomationEvent$1(value, endTime, insertTime) {
			return {
				endTime,
				insertTime,
				type: "exponentialRampToValue",
				value
			};
		};
		var createExtendedLinearRampToValueAutomationEvent = function createExtendedLinearRampToValueAutomationEvent$1(value, endTime, insertTime) {
			return {
				endTime,
				insertTime,
				type: "linearRampToValue",
				value
			};
		};
		var createSetValueAutomationEvent$1 = function createSetValueAutomationEvent$2(value, startTime) {
			return {
				startTime,
				type: "setValue",
				value
			};
		};
		var createSetValueCurveAutomationEvent$1 = function createSetValueCurveAutomationEvent$2(values, startTime, duration) {
			return {
				duration,
				startTime,
				type: "setValueCurve",
				values
			};
		};
		var getTargetValueAtTime = function getTargetValueAtTime$1(time, valueAtStartTime, _ref) {
			var startTime = _ref.startTime, target = _ref.target, timeConstant = _ref.timeConstant;
			return target + (valueAtStartTime - target) * Math.exp((startTime - time) / timeConstant);
		};
		var isExponentialRampToValueAutomationEvent = function isExponentialRampToValueAutomationEvent$1(automationEvent) {
			return automationEvent.type === "exponentialRampToValue";
		};
		var isLinearRampToValueAutomationEvent = function isLinearRampToValueAutomationEvent$1(automationEvent) {
			return automationEvent.type === "linearRampToValue";
		};
		var isAnyRampToValueAutomationEvent = function isAnyRampToValueAutomationEvent$1(automationEvent) {
			return isExponentialRampToValueAutomationEvent(automationEvent) || isLinearRampToValueAutomationEvent(automationEvent);
		};
		var isSetValueAutomationEvent = function isSetValueAutomationEvent$1(automationEvent) {
			return automationEvent.type === "setValue";
		};
		var isSetValueCurveAutomationEvent = function isSetValueCurveAutomationEvent$1(automationEvent) {
			return automationEvent.type === "setValueCurve";
		};
		var _getValueOfAutomationEventAtIndexAtTime = function getValueOfAutomationEventAtIndexAtTime(automationEvents, index, time, defaultValue) {
			var automationEvent = automationEvents[index];
			return automationEvent === void 0 ? defaultValue : isAnyRampToValueAutomationEvent(automationEvent) || isSetValueAutomationEvent(automationEvent) ? automationEvent.value : isSetValueCurveAutomationEvent(automationEvent) ? automationEvent.values[automationEvent.values.length - 1] : getTargetValueAtTime(time, _getValueOfAutomationEventAtIndexAtTime(automationEvents, index - 1, automationEvent.startTime, defaultValue), automationEvent);
		};
		var getEndTimeAndValueOfPreviousAutomationEvent = function getEndTimeAndValueOfPreviousAutomationEvent$1(automationEvents, index, currentAutomationEvent, nextAutomationEvent, defaultValue) {
			return currentAutomationEvent === void 0 ? [nextAutomationEvent.insertTime, defaultValue] : isAnyRampToValueAutomationEvent(currentAutomationEvent) ? [currentAutomationEvent.endTime, currentAutomationEvent.value] : isSetValueAutomationEvent(currentAutomationEvent) ? [currentAutomationEvent.startTime, currentAutomationEvent.value] : isSetValueCurveAutomationEvent(currentAutomationEvent) ? [currentAutomationEvent.startTime + currentAutomationEvent.duration, currentAutomationEvent.values[currentAutomationEvent.values.length - 1]] : [currentAutomationEvent.startTime, _getValueOfAutomationEventAtIndexAtTime(automationEvents, index - 1, currentAutomationEvent.startTime, defaultValue)];
		};
		var isCancelAndHoldAutomationEvent = function isCancelAndHoldAutomationEvent$1(automationEvent) {
			return automationEvent.type === "cancelAndHold";
		};
		var isCancelScheduledValuesAutomationEvent = function isCancelScheduledValuesAutomationEvent$1(automationEvent) {
			return automationEvent.type === "cancelScheduledValues";
		};
		var getEventTime = function getEventTime$1(automationEvent) {
			if (isCancelAndHoldAutomationEvent(automationEvent) || isCancelScheduledValuesAutomationEvent(automationEvent)) return automationEvent.cancelTime;
			if (isExponentialRampToValueAutomationEvent(automationEvent) || isLinearRampToValueAutomationEvent(automationEvent)) return automationEvent.endTime;
			return automationEvent.startTime;
		};
		var getExponentialRampValueAtTime = function getExponentialRampValueAtTime$1(time, startTime, valueAtStartTime, _ref) {
			var endTime = _ref.endTime, value = _ref.value;
			if (valueAtStartTime === value) return value;
			if (0 < valueAtStartTime && 0 < value || valueAtStartTime < 0 && value < 0) return valueAtStartTime * Math.pow(value / valueAtStartTime, (time - startTime) / (endTime - startTime));
			return 0;
		};
		var getLinearRampValueAtTime = function getLinearRampValueAtTime$1(time, startTime, valueAtStartTime, _ref) {
			var endTime = _ref.endTime, value = _ref.value;
			return valueAtStartTime + (time - startTime) / (endTime - startTime) * (value - valueAtStartTime);
		};
		var interpolateValue = function interpolateValue$1(values, theoreticIndex) {
			var lowerIndex = Math.floor(theoreticIndex);
			var upperIndex = Math.ceil(theoreticIndex);
			if (lowerIndex === upperIndex) return values[lowerIndex];
			return (1 - (theoreticIndex - lowerIndex)) * values[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * values[upperIndex];
		};
		var getValueCurveValueAtTime = function getValueCurveValueAtTime$1(time, _ref) {
			var duration = _ref.duration, startTime = _ref.startTime, values = _ref.values;
			return interpolateValue(values, (time - startTime) / duration * (values.length - 1));
		};
		var isSetTargetAutomationEvent = function isSetTargetAutomationEvent$1(automationEvent) {
			return automationEvent.type === "setTarget";
		};
		var AutomationEventList$1 = /* @__PURE__ */ function() {
			function AutomationEventList$2(defaultValue) {
				_classCallCheck$1(this, AutomationEventList$2);
				this._automationEvents = [];
				this._currenTime = 0;
				this._defaultValue = defaultValue;
			}
			return _createClass$1(AutomationEventList$2, [
				{
					key: Symbol.iterator,
					value: function value() {
						return this._automationEvents[Symbol.iterator]();
					}
				},
				{
					key: "add",
					value: function add(automationEvent) {
						var eventTime = getEventTime(automationEvent);
						if (isCancelAndHoldAutomationEvent(automationEvent) || isCancelScheduledValuesAutomationEvent(automationEvent)) {
							var index = this._automationEvents.findIndex(function(currentAutomationEvent) {
								if (isCancelScheduledValuesAutomationEvent(automationEvent) && isSetValueCurveAutomationEvent(currentAutomationEvent)) return currentAutomationEvent.startTime + currentAutomationEvent.duration >= eventTime;
								return getEventTime(currentAutomationEvent) >= eventTime;
							});
							var removedAutomationEvent = this._automationEvents[index];
							if (index !== -1) this._automationEvents = this._automationEvents.slice(0, index);
							if (isCancelAndHoldAutomationEvent(automationEvent)) {
								var lastAutomationEvent = this._automationEvents[this._automationEvents.length - 1];
								if (removedAutomationEvent !== void 0 && isAnyRampToValueAutomationEvent(removedAutomationEvent)) {
									if (lastAutomationEvent !== void 0 && isSetTargetAutomationEvent(lastAutomationEvent)) throw new Error("The internal list is malformed.");
									var startTime = lastAutomationEvent === void 0 ? removedAutomationEvent.insertTime : isSetValueCurveAutomationEvent(lastAutomationEvent) ? lastAutomationEvent.startTime + lastAutomationEvent.duration : getEventTime(lastAutomationEvent);
									var startValue = lastAutomationEvent === void 0 ? this._defaultValue : isSetValueCurveAutomationEvent(lastAutomationEvent) ? lastAutomationEvent.values[lastAutomationEvent.values.length - 1] : lastAutomationEvent.value;
									var value = isExponentialRampToValueAutomationEvent(removedAutomationEvent) ? getExponentialRampValueAtTime(eventTime, startTime, startValue, removedAutomationEvent) : getLinearRampValueAtTime(eventTime, startTime, startValue, removedAutomationEvent);
									var truncatedAutomationEvent = isExponentialRampToValueAutomationEvent(removedAutomationEvent) ? createExtendedExponentialRampToValueAutomationEvent(value, eventTime, this._currenTime) : createExtendedLinearRampToValueAutomationEvent(value, eventTime, this._currenTime);
									this._automationEvents.push(truncatedAutomationEvent);
								}
								if (lastAutomationEvent !== void 0 && isSetTargetAutomationEvent(lastAutomationEvent)) this._automationEvents.push(createSetValueAutomationEvent$1(this.getValue(eventTime), eventTime));
								if (lastAutomationEvent !== void 0 && isSetValueCurveAutomationEvent(lastAutomationEvent) && lastAutomationEvent.startTime + lastAutomationEvent.duration > eventTime) {
									var duration = eventTime - lastAutomationEvent.startTime;
									var ratio = (lastAutomationEvent.values.length - 1) / lastAutomationEvent.duration;
									var length = Math.max(2, 1 + Math.ceil(duration * ratio));
									var fraction = duration / (length - 1) * ratio;
									var values = lastAutomationEvent.values.slice(0, length);
									if (fraction < 1) for (var i = 1; i < length; i += 1) {
										var factor = fraction * i % 1;
										values[i] = lastAutomationEvent.values[i - 1] * (1 - factor) + lastAutomationEvent.values[i] * factor;
									}
									this._automationEvents[this._automationEvents.length - 1] = createSetValueCurveAutomationEvent$1(values, lastAutomationEvent.startTime, duration);
								}
							}
						} else {
							var _index = this._automationEvents.findIndex(function(currentAutomationEvent) {
								return getEventTime(currentAutomationEvent) > eventTime;
							});
							var previousAutomationEvent = _index === -1 ? this._automationEvents[this._automationEvents.length - 1] : this._automationEvents[_index - 1];
							if (previousAutomationEvent !== void 0 && isSetValueCurveAutomationEvent(previousAutomationEvent) && getEventTime(previousAutomationEvent) + previousAutomationEvent.duration > eventTime) return false;
							var persistentAutomationEvent = isExponentialRampToValueAutomationEvent(automationEvent) ? createExtendedExponentialRampToValueAutomationEvent(automationEvent.value, automationEvent.endTime, this._currenTime) : isLinearRampToValueAutomationEvent(automationEvent) ? createExtendedLinearRampToValueAutomationEvent(automationEvent.value, eventTime, this._currenTime) : automationEvent;
							if (_index === -1) this._automationEvents.push(persistentAutomationEvent);
							else {
								if (isSetValueCurveAutomationEvent(automationEvent) && eventTime + automationEvent.duration > getEventTime(this._automationEvents[_index])) return false;
								this._automationEvents.splice(_index, 0, persistentAutomationEvent);
							}
						}
						return true;
					}
				},
				{
					key: "flush",
					value: function flush(time) {
						var index = this._automationEvents.findIndex(function(currentAutomationEvent) {
							return getEventTime(currentAutomationEvent) > time;
						});
						if (index > 1) {
							var remainingAutomationEvents = this._automationEvents.slice(index - 1);
							var firstRemainingAutomationEvent = remainingAutomationEvents[0];
							if (isSetTargetAutomationEvent(firstRemainingAutomationEvent)) remainingAutomationEvents.unshift(createSetValueAutomationEvent$1(_getValueOfAutomationEventAtIndexAtTime(this._automationEvents, index - 2, firstRemainingAutomationEvent.startTime, this._defaultValue), firstRemainingAutomationEvent.startTime));
							this._automationEvents = remainingAutomationEvents;
						}
					}
				},
				{
					key: "getValue",
					value: function getValue(time) {
						if (this._automationEvents.length === 0) return this._defaultValue;
						var indexOfNextEvent = this._automationEvents.findIndex(function(automationEvent) {
							return getEventTime(automationEvent) > time;
						});
						var nextAutomationEvent = this._automationEvents[indexOfNextEvent];
						var indexOfCurrentEvent = (indexOfNextEvent === -1 ? this._automationEvents.length : indexOfNextEvent) - 1;
						var currentAutomationEvent = this._automationEvents[indexOfCurrentEvent];
						if (currentAutomationEvent !== void 0 && isSetTargetAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent) || nextAutomationEvent.insertTime > time)) return getTargetValueAtTime(time, _getValueOfAutomationEventAtIndexAtTime(this._automationEvents, indexOfCurrentEvent - 1, currentAutomationEvent.startTime, this._defaultValue), currentAutomationEvent);
						if (currentAutomationEvent !== void 0 && isSetValueAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent))) return currentAutomationEvent.value;
						if (currentAutomationEvent !== void 0 && isSetValueCurveAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent) || currentAutomationEvent.startTime + currentAutomationEvent.duration > time)) {
							if (time < currentAutomationEvent.startTime + currentAutomationEvent.duration) return getValueCurveValueAtTime(time, currentAutomationEvent);
							return currentAutomationEvent.values[currentAutomationEvent.values.length - 1];
						}
						if (currentAutomationEvent !== void 0 && isAnyRampToValueAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent))) return currentAutomationEvent.value;
						if (nextAutomationEvent !== void 0 && isExponentialRampToValueAutomationEvent(nextAutomationEvent)) {
							var _getEndTimeAndValueOf2 = _slicedToArray$1(getEndTimeAndValueOfPreviousAutomationEvent(this._automationEvents, indexOfCurrentEvent, currentAutomationEvent, nextAutomationEvent, this._defaultValue), 2), startTime = _getEndTimeAndValueOf2[0], value = _getEndTimeAndValueOf2[1];
							return getExponentialRampValueAtTime(time, startTime, value, nextAutomationEvent);
						}
						if (nextAutomationEvent !== void 0 && isLinearRampToValueAutomationEvent(nextAutomationEvent)) {
							var _getEndTimeAndValueOf4 = _slicedToArray$1(getEndTimeAndValueOfPreviousAutomationEvent(this._automationEvents, indexOfCurrentEvent, currentAutomationEvent, nextAutomationEvent, this._defaultValue), 2), _startTime = _getEndTimeAndValueOf4[0], _value = _getEndTimeAndValueOf4[1];
							return getLinearRampValueAtTime(time, _startTime, _value, nextAutomationEvent);
						}
						return this._defaultValue;
					}
				}
			]);
		}();
		var createCancelAndHoldAutomationEvent$1 = function createCancelAndHoldAutomationEvent$2(cancelTime) {
			return {
				cancelTime,
				type: "cancelAndHold"
			};
		};
		var createCancelScheduledValuesAutomationEvent$1 = function createCancelScheduledValuesAutomationEvent$2(cancelTime) {
			return {
				cancelTime,
				type: "cancelScheduledValues"
			};
		};
		var createExponentialRampToValueAutomationEvent$1 = function createExponentialRampToValueAutomationEvent$2(value, endTime) {
			return {
				endTime,
				type: "exponentialRampToValue",
				value
			};
		};
		var createLinearRampToValueAutomationEvent$1 = function createLinearRampToValueAutomationEvent$2(value, endTime) {
			return {
				endTime,
				type: "linearRampToValue",
				value
			};
		};
		var createSetTargetAutomationEvent$1 = function createSetTargetAutomationEvent$2(target, startTime, timeConstant) {
			return {
				startTime,
				target,
				timeConstant,
				type: "setTarget"
			};
		};
		exports$1.AutomationEventList = AutomationEventList$1;
		exports$1.createCancelAndHoldAutomationEvent = createCancelAndHoldAutomationEvent$1;
		exports$1.createCancelScheduledValuesAutomationEvent = createCancelScheduledValuesAutomationEvent$1;
		exports$1.createExponentialRampToValueAutomationEvent = createExponentialRampToValueAutomationEvent$1;
		exports$1.createLinearRampToValueAutomationEvent = createLinearRampToValueAutomationEvent$1;
		exports$1.createSetTargetAutomationEvent = createSetTargetAutomationEvent$1;
		exports$1.createSetValueAutomationEvent = createSetValueAutomationEvent$1;
		exports$1.createSetValueCurveAutomationEvent = createSetValueCurveAutomationEvent$1;
	}));
}) });

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/abort-error.js
var import_bundle$1 = require_bundle();
const createAbortError = () => new DOMException("", "AbortError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-active-input-connection-to-audio-node.js
const createAddActiveInputConnectionToAudioNode = (insertElementInSet$1) => {
	return (activeInputs, source, [output, input, eventListener], ignoreDuplicates) => {
		insertElementInSet$1(activeInputs[input], [
			source,
			output,
			eventListener
		], (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output, ignoreDuplicates);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-audio-node-connections.js
const createAddAudioNodeConnections = (audioNodeConnectionsStore) => {
	return (audioNode, audioNodeRenderer, nativeAudioNode) => {
		const activeInputs = [];
		for (let i = 0; i < nativeAudioNode.numberOfInputs; i += 1) activeInputs.push(/* @__PURE__ */ new Set());
		audioNodeConnectionsStore.set(audioNode, {
			activeInputs,
			outputs: /* @__PURE__ */ new Set(),
			passiveInputs: /* @__PURE__ */ new WeakMap(),
			renderer: audioNodeRenderer
		});
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-audio-param-connections.js
const createAddAudioParamConnections = (audioParamConnectionsStore) => {
	return (audioParam, audioParamRenderer) => {
		audioParamConnectionsStore.set(audioParam, {
			activeInputs: /* @__PURE__ */ new Set(),
			passiveInputs: /* @__PURE__ */ new WeakMap(),
			renderer: audioParamRenderer
		});
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/globals.js
const ACTIVE_AUDIO_NODE_STORE = /* @__PURE__ */ new WeakSet();
const AUDIO_NODE_CONNECTIONS_STORE = /* @__PURE__ */ new WeakMap();
const AUDIO_NODE_STORE = /* @__PURE__ */ new WeakMap();
const AUDIO_PARAM_CONNECTIONS_STORE = /* @__PURE__ */ new WeakMap();
const AUDIO_PARAM_STORE = /* @__PURE__ */ new WeakMap();
const CONTEXT_STORE = /* @__PURE__ */ new WeakMap();
const EVENT_LISTENERS = /* @__PURE__ */ new WeakMap();
const CYCLE_COUNTERS = /* @__PURE__ */ new WeakMap();
const NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS = /* @__PURE__ */ new WeakMap();
const NODE_TO_PROCESSOR_MAPS = /* @__PURE__ */ new WeakMap();

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-constructible.js
var handler = { construct() {
	return handler;
} };
const isConstructible = (constructible) => {
	try {
		new new Proxy(constructible, handler)();
	} catch {
		return false;
	}
	return true;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/split-import-statements.js
var IMPORT_STATEMENT_REGEX = /^import(?:(?:[\s]+[\w]+|(?:[\s]+[\w]+[\s]*,)?[\s]*\{[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?(?:[\s]*,[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?)*[\s]*}|(?:[\s]+[\w]+[\s]*,)?[\s]*\*[\s]+as[\s]+[\w]+)[\s]+from)?(?:[\s]*)("([^"\\]|\\.)+"|'([^'\\]|\\.)+')(?:[\s]*);?/;
const splitImportStatements = (source, url) => {
	const importStatements = [];
	let sourceWithoutImportStatements = source.replace(/^[\s]+/, "");
	let result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);
	while (result !== null) {
		const unresolvedUrl = result[1].slice(1, -1);
		const importStatementWithResolvedUrl = result[0].replace(/([\s]+)?;?$/, "").replace(unresolvedUrl, new URL(unresolvedUrl, url).toString());
		importStatements.push(importStatementWithResolvedUrl);
		sourceWithoutImportStatements = sourceWithoutImportStatements.slice(result[0].length).replace(/^[\s]+/, "");
		result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);
	}
	return [importStatements.join(";"), sourceWithoutImportStatements];
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-audio-worklet-module.js
var verifyParameterDescriptors = (parameterDescriptors) => {
	if (parameterDescriptors !== void 0 && !Array.isArray(parameterDescriptors)) throw new TypeError("The parameterDescriptors property of given value for processorCtor is not an array.");
};
var verifyProcessorCtor = (processorCtor) => {
	if (!isConstructible(processorCtor)) throw new TypeError("The given value for processorCtor should be a constructor.");
	if (processorCtor.prototype === null || typeof processorCtor.prototype !== "object") throw new TypeError("The given value for processorCtor should have a prototype.");
};
const createAddAudioWorkletModule = (cacheTestResult$1, createNotSupportedError$1, evaluateSource, exposeCurrentFrameAndCurrentTime$1, fetchSource, getNativeContext$1, getOrCreateBackupOfflineAudioContext$1, isNativeOfflineAudioContext$1, nativeAudioWorkletNodeConstructor$1, ongoingRequests, resolvedRequests, testAudioWorkletProcessorPostMessageSupport, window$2) => {
	let index = 0;
	return (context, moduleURL, options = { credentials: "omit" }) => {
		const resolvedRequestsOfContext = resolvedRequests.get(context);
		if (resolvedRequestsOfContext !== void 0 && resolvedRequestsOfContext.has(moduleURL)) return Promise.resolve();
		const ongoingRequestsOfContext = ongoingRequests.get(context);
		if (ongoingRequestsOfContext !== void 0) {
			const promiseOfOngoingRequest = ongoingRequestsOfContext.get(moduleURL);
			if (promiseOfOngoingRequest !== void 0) return promiseOfOngoingRequest;
		}
		const nativeContext = getNativeContext$1(context);
		const promise = nativeContext.audioWorklet === void 0 ? fetchSource(moduleURL).then(([source, absoluteUrl]) => {
			const [importStatements, sourceWithoutImportStatements] = splitImportStatements(source, absoluteUrl);
			return evaluateSource(`${importStatements};((a,b)=>{(a[b]=a[b]||[]).push((AudioWorkletProcessor,global,registerProcessor,sampleRate,self,window)=>{${sourceWithoutImportStatements}
})})(window,'_AWGS')`);
		}).then(() => {
			const evaluateAudioWorkletGlobalScope = window$2._AWGS.pop();
			if (evaluateAudioWorkletGlobalScope === void 0) throw new SyntaxError();
			exposeCurrentFrameAndCurrentTime$1(nativeContext.currentTime, nativeContext.sampleRate, () => evaluateAudioWorkletGlobalScope(class AudioWorkletProcessor {}, void 0, (name, processorCtor) => {
				if (name.trim() === "") throw createNotSupportedError$1();
				const nodeNameToProcessorConstructorMap = NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.get(nativeContext);
				if (nodeNameToProcessorConstructorMap !== void 0) {
					if (nodeNameToProcessorConstructorMap.has(name)) throw createNotSupportedError$1();
					verifyProcessorCtor(processorCtor);
					verifyParameterDescriptors(processorCtor.parameterDescriptors);
					nodeNameToProcessorConstructorMap.set(name, processorCtor);
				} else {
					verifyProcessorCtor(processorCtor);
					verifyParameterDescriptors(processorCtor.parameterDescriptors);
					NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.set(nativeContext, new Map([[name, processorCtor]]));
				}
			}, nativeContext.sampleRate, void 0, void 0));
		}) : Promise.all([fetchSource(moduleURL), Promise.resolve(cacheTestResult$1(testAudioWorkletProcessorPostMessageSupport, testAudioWorkletProcessorPostMessageSupport))]).then(([[source, absoluteUrl], isSupportingPostMessage]) => {
			const currentIndex = index + 1;
			index = currentIndex;
			const [importStatements, sourceWithoutImportStatements] = splitImportStatements(source, absoluteUrl);
			const wrappedSource = `${importStatements};((AudioWorkletProcessor,registerProcessor)=>{${sourceWithoutImportStatements}
})(${isSupportingPostMessage ? "AudioWorkletProcessor" : "class extends AudioWorkletProcessor {__b=new WeakSet();constructor(){super();(p=>p.postMessage=(q=>(m,t)=>q.call(p,m,t?t.filter(u=>!this.__b.has(u)):t))(p.postMessage))(this.port)}}"},(n,p)=>registerProcessor(n,class extends p{${isSupportingPostMessage ? "" : "__c = (a) => a.forEach(e=>this.__b.add(e.buffer));"}process(i,o,p){${isSupportingPostMessage ? "" : "i.forEach(this.__c);o.forEach(this.__c);this.__c(Object.values(p));"}return super.process(i.map(j=>j.some(k=>k.length===0)?[]:j),o,p)}}));registerProcessor('__sac${currentIndex}',class extends AudioWorkletProcessor{process(){return !1}})`;
			const blob = new Blob([wrappedSource], { type: "application/javascript; charset=utf-8" });
			const url = URL.createObjectURL(blob);
			return nativeContext.audioWorklet.addModule(url, options).then(() => {
				if (isNativeOfflineAudioContext$1(nativeContext)) return nativeContext;
				const backupOfflineAudioContext = getOrCreateBackupOfflineAudioContext$1(nativeContext);
				return backupOfflineAudioContext.audioWorklet.addModule(url, options).then(() => backupOfflineAudioContext);
			}).then((nativeContextOrBackupOfflineAudioContext) => {
				if (nativeAudioWorkletNodeConstructor$1 === null) throw new SyntaxError();
				try {
					new nativeAudioWorkletNodeConstructor$1(nativeContextOrBackupOfflineAudioContext, `__sac${currentIndex}`);
				} catch {
					throw new SyntaxError();
				}
			}).finally(() => URL.revokeObjectURL(url));
		});
		if (ongoingRequestsOfContext === void 0) ongoingRequests.set(context, new Map([[moduleURL, promise]]));
		else ongoingRequestsOfContext.set(moduleURL, promise);
		promise.then(() => {
			const updatedResolvedRequestsOfContext = resolvedRequests.get(context);
			if (updatedResolvedRequestsOfContext === void 0) resolvedRequests.set(context, new Set([moduleURL]));
			else updatedResolvedRequestsOfContext.add(moduleURL);
		}).finally(() => {
			const updatedOngoingRequestsOfContext = ongoingRequests.get(context);
			if (updatedOngoingRequestsOfContext !== void 0) updatedOngoingRequestsOfContext.delete(moduleURL);
		});
		return promise;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-value-for-key.js
const getValueForKey = (map, key) => {
	const value = map.get(key);
	if (value === void 0) throw new Error("A value with the given key could not be found.");
	return value;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/pick-element-from-set.js
const pickElementFromSet = (set, predicate) => {
	const matchingElements = Array.from(set).filter(predicate);
	if (matchingElements.length > 1) throw Error("More than one element was found.");
	if (matchingElements.length === 0) throw Error("No element was found.");
	const [matchingElement] = matchingElements;
	set.delete(matchingElement);
	return matchingElement;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/delete-passive-input-connection-to-audio-node.js
const deletePassiveInputConnectionToAudioNode = (passiveInputs, source, output, input) => {
	const passiveInputConnections = getValueForKey(passiveInputs, source);
	const matchingConnection = pickElementFromSet(passiveInputConnections, (passiveInputConnection) => passiveInputConnection[0] === output && passiveInputConnection[1] === input);
	if (passiveInputConnections.size === 0) passiveInputs.delete(source);
	return matchingConnection;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-event-listeners-of-audio-node.js
const getEventListenersOfAudioNode = (audioNode) => {
	return getValueForKey(EVENT_LISTENERS, audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/set-internal-state-to-active.js
const setInternalStateToActive = (audioNode) => {
	if (ACTIVE_AUDIO_NODE_STORE.has(audioNode)) throw new Error("The AudioNode is already stored.");
	ACTIVE_AUDIO_NODE_STORE.add(audioNode);
	getEventListenersOfAudioNode(audioNode).forEach((eventListener) => eventListener(true));
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/audio-worklet-node.js
const isAudioWorkletNode = (audioNode) => {
	return "port" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/set-internal-state-to-passive.js
const setInternalStateToPassive = (audioNode) => {
	if (!ACTIVE_AUDIO_NODE_STORE.has(audioNode)) throw new Error("The AudioNode is not stored.");
	ACTIVE_AUDIO_NODE_STORE.delete(audioNode);
	getEventListenersOfAudioNode(audioNode).forEach((eventListener) => eventListener(false));
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/set-internal-state-to-passive-when-necessary.js
const setInternalStateToPassiveWhenNecessary = (audioNode, activeInputs) => {
	if (!isAudioWorkletNode(audioNode) && activeInputs.every((connections) => connections.size === 0)) setInternalStateToPassive(audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-connection-to-audio-node.js
const createAddConnectionToAudioNode = (addActiveInputConnectionToAudioNode$1, addPassiveInputConnectionToAudioNode$1, connectNativeAudioNodeToNativeAudioNode$1, deleteActiveInputConnectionToAudioNode$1, disconnectNativeAudioNodeFromNativeAudioNode$1, getAudioNodeConnections$1, getAudioNodeTailTime$1, getEventListenersOfAudioNode$1, getNativeAudioNode$1, insertElementInSet$1, isActiveAudioNode$1, isPartOfACycle$1, isPassiveAudioNode$1) => {
	const tailTimeTimeoutIds = /* @__PURE__ */ new WeakMap();
	return (source, destination, output, input, isOffline) => {
		const { activeInputs, passiveInputs } = getAudioNodeConnections$1(destination);
		const { outputs } = getAudioNodeConnections$1(source);
		const eventListeners = getEventListenersOfAudioNode$1(source);
		const eventListener = (isActive) => {
			const nativeDestinationAudioNode = getNativeAudioNode$1(destination);
			const nativeSourceAudioNode = getNativeAudioNode$1(source);
			if (isActive) {
				addActiveInputConnectionToAudioNode$1(activeInputs, source, deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input), false);
				if (!isOffline && !isPartOfACycle$1(source)) connectNativeAudioNodeToNativeAudioNode$1(nativeSourceAudioNode, nativeDestinationAudioNode, output, input);
				if (isPassiveAudioNode$1(destination)) setInternalStateToActive(destination);
			} else {
				addPassiveInputConnectionToAudioNode$1(passiveInputs, input, deleteActiveInputConnectionToAudioNode$1(activeInputs, source, output, input), false);
				if (!isOffline && !isPartOfACycle$1(source)) disconnectNativeAudioNodeFromNativeAudioNode$1(nativeSourceAudioNode, nativeDestinationAudioNode, output, input);
				const tailTime = getAudioNodeTailTime$1(destination);
				if (tailTime === 0) {
					if (isActiveAudioNode$1(destination)) setInternalStateToPassiveWhenNecessary(destination, activeInputs);
				} else {
					const tailTimeTimeoutId = tailTimeTimeoutIds.get(destination);
					if (tailTimeTimeoutId !== void 0) clearTimeout(tailTimeTimeoutId);
					tailTimeTimeoutIds.set(destination, setTimeout(() => {
						if (isActiveAudioNode$1(destination)) setInternalStateToPassiveWhenNecessary(destination, activeInputs);
					}, tailTime * 1e3));
				}
			}
		};
		if (insertElementInSet$1(outputs, [
			destination,
			output,
			input
		], (outputConnection) => outputConnection[0] === destination && outputConnection[1] === output && outputConnection[2] === input, true)) {
			eventListeners.add(eventListener);
			if (isActiveAudioNode$1(source)) addActiveInputConnectionToAudioNode$1(activeInputs, source, [
				output,
				input,
				eventListener
			], true);
			else addPassiveInputConnectionToAudioNode$1(passiveInputs, input, [
				source,
				output,
				eventListener
			], true);
			return true;
		}
		return false;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-passive-input-connection-to-audio-node.js
const createAddPassiveInputConnectionToAudioNode = (insertElementInSet$1) => {
	return (passiveInputs, input, [source, output, eventListener], ignoreDuplicates) => {
		const passiveInputConnections = passiveInputs.get(source);
		if (passiveInputConnections === void 0) passiveInputs.set(source, new Set([[
			output,
			input,
			eventListener
		]]));
		else insertElementInSet$1(passiveInputConnections, [
			output,
			input,
			eventListener
		], (passiveInputConnection) => passiveInputConnection[0] === output && passiveInputConnection[1] === input, ignoreDuplicates);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-silent-connection.js
const createAddSilentConnection = (createNativeGainNode$1) => {
	return (nativeContext, nativeAudioScheduledSourceNode) => {
		const nativeGainNode = createNativeGainNode$1(nativeContext, {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "discrete",
			gain: 0
		});
		nativeAudioScheduledSourceNode.connect(nativeGainNode).connect(nativeContext.destination);
		const disconnect = () => {
			nativeAudioScheduledSourceNode.removeEventListener("ended", disconnect);
			nativeAudioScheduledSourceNode.disconnect(nativeGainNode);
			nativeGainNode.disconnect();
		};
		nativeAudioScheduledSourceNode.addEventListener("ended", disconnect);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/add-unrendered-audio-worklet-node.js
const createAddUnrenderedAudioWorkletNode = (getUnrenderedAudioWorkletNodes$1) => {
	return (nativeContext, audioWorkletNode) => {
		getUnrenderedAudioWorkletNodes$1(nativeContext).add(audioWorkletNode);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/analyser-node-constructor.js
var DEFAULT_OPTIONS$20 = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	fftSize: 2048,
	maxDecibels: -30,
	minDecibels: -100,
	smoothingTimeConstant: .8
};
const createAnalyserNodeConstructor = (audionNodeConstructor, createAnalyserNodeRenderer$1, createIndexSizeError$1, createNativeAnalyserNode$1, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class AnalyserNode extends audionNodeConstructor {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeAnalyserNode = createNativeAnalyserNode$1(nativeContext, {
				...DEFAULT_OPTIONS$20,
				...options
			});
			const analyserNodeRenderer = isNativeOfflineAudioContext$1(nativeContext) ? createAnalyserNodeRenderer$1() : null;
			super(context, false, nativeAnalyserNode, analyserNodeRenderer);
			this._nativeAnalyserNode = nativeAnalyserNode;
		}
		get fftSize() {
			return this._nativeAnalyserNode.fftSize;
		}
		set fftSize(value) {
			this._nativeAnalyserNode.fftSize = value;
		}
		get frequencyBinCount() {
			return this._nativeAnalyserNode.frequencyBinCount;
		}
		get maxDecibels() {
			return this._nativeAnalyserNode.maxDecibels;
		}
		set maxDecibels(value) {
			const maxDecibels = this._nativeAnalyserNode.maxDecibels;
			this._nativeAnalyserNode.maxDecibels = value;
			if (!(value > this._nativeAnalyserNode.minDecibels)) {
				this._nativeAnalyserNode.maxDecibels = maxDecibels;
				throw createIndexSizeError$1();
			}
		}
		get minDecibels() {
			return this._nativeAnalyserNode.minDecibels;
		}
		set minDecibels(value) {
			const minDecibels = this._nativeAnalyserNode.minDecibels;
			this._nativeAnalyserNode.minDecibels = value;
			if (!(this._nativeAnalyserNode.maxDecibels > value)) {
				this._nativeAnalyserNode.minDecibels = minDecibels;
				throw createIndexSizeError$1();
			}
		}
		get smoothingTimeConstant() {
			return this._nativeAnalyserNode.smoothingTimeConstant;
		}
		set smoothingTimeConstant(value) {
			this._nativeAnalyserNode.smoothingTimeConstant = value;
		}
		getByteFrequencyData(array) {
			this._nativeAnalyserNode.getByteFrequencyData(array);
		}
		getByteTimeDomainData(array) {
			this._nativeAnalyserNode.getByteTimeDomainData(array);
		}
		getFloatFrequencyData(array) {
			this._nativeAnalyserNode.getFloatFrequencyData(array);
		}
		getFloatTimeDomainData(array) {
			this._nativeAnalyserNode.getFloatTimeDomainData(array);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-owned-by-context.js
const isOwnedByContext = (nativeAudioNode, nativeContext) => {
	return nativeAudioNode.context === nativeContext;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/analyser-node-renderer-factory.js
const createAnalyserNodeRendererFactory = (createNativeAnalyserNode$1, getNativeAudioNode$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeAnalyserNodes = /* @__PURE__ */ new WeakMap();
		const createAnalyserNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeAnalyserNode = getNativeAudioNode$1(proxy);
			if (!isOwnedByContext(nativeAnalyserNode, nativeOfflineAudioContext)) nativeAnalyserNode = createNativeAnalyserNode$1(nativeOfflineAudioContext, {
				channelCount: nativeAnalyserNode.channelCount,
				channelCountMode: nativeAnalyserNode.channelCountMode,
				channelInterpretation: nativeAnalyserNode.channelInterpretation,
				fftSize: nativeAnalyserNode.fftSize,
				maxDecibels: nativeAnalyserNode.maxDecibels,
				minDecibels: nativeAnalyserNode.minDecibels,
				smoothingTimeConstant: nativeAnalyserNode.smoothingTimeConstant
			});
			renderedNativeAnalyserNodes.set(nativeOfflineAudioContext, nativeAnalyserNode);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeAnalyserNode);
			return nativeAnalyserNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeAnalyserNode = renderedNativeAnalyserNodes.get(nativeOfflineAudioContext);
			if (renderedNativeAnalyserNode !== void 0) return Promise.resolve(renderedNativeAnalyserNode);
			return createAnalyserNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-buffer-copy-channel-methods-out-of-bounds-support.js
const testAudioBufferCopyChannelMethodsOutOfBoundsSupport = (nativeAudioBuffer) => {
	try {
		nativeAudioBuffer.copyToChannel(new Float32Array(1), 0, -1);
	} catch {
		return false;
	}
	return true;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/index-size-error.js
const createIndexSizeError = () => new DOMException("", "IndexSizeError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-buffer-get-channel-data-method.js
const wrapAudioBufferGetChannelDataMethod = (audioBuffer) => {
	audioBuffer.getChannelData = ((getChannelData) => {
		return (channel) => {
			try {
				return getChannelData.call(audioBuffer, channel);
			} catch (err) {
				if (err.code === 12) throw createIndexSizeError();
				throw err;
			}
		};
	})(audioBuffer.getChannelData);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-buffer-constructor.js
var DEFAULT_OPTIONS$19 = { numberOfChannels: 1 };
const createAudioBufferConstructor = (audioBufferStore$1, cacheTestResult$1, createNotSupportedError$1, nativeAudioBufferConstructor$1, nativeOfflineAudioContextConstructor$1, testNativeAudioBufferConstructorSupport, wrapAudioBufferCopyChannelMethods$1, wrapAudioBufferCopyChannelMethodsOutOfBounds$1) => {
	let nativeOfflineAudioContext = null;
	return class AudioBuffer {
		constructor(options) {
			if (nativeOfflineAudioContextConstructor$1 === null) throw new Error("Missing the native OfflineAudioContext constructor.");
			const { length, numberOfChannels, sampleRate } = {
				...DEFAULT_OPTIONS$19,
				...options
			};
			if (nativeOfflineAudioContext === null) nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor$1(1, 1, 44100);
			const audioBuffer = nativeAudioBufferConstructor$1 !== null && cacheTestResult$1(testNativeAudioBufferConstructorSupport, testNativeAudioBufferConstructorSupport) ? new nativeAudioBufferConstructor$1({
				length,
				numberOfChannels,
				sampleRate
			}) : nativeOfflineAudioContext.createBuffer(numberOfChannels, length, sampleRate);
			if (audioBuffer.numberOfChannels === 0) throw createNotSupportedError$1();
			if (typeof audioBuffer.copyFromChannel !== "function") {
				wrapAudioBufferCopyChannelMethods$1(audioBuffer);
				wrapAudioBufferGetChannelDataMethod(audioBuffer);
			} else if (!cacheTestResult$1(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer))) wrapAudioBufferCopyChannelMethodsOutOfBounds$1(audioBuffer);
			audioBufferStore$1.add(audioBuffer);
			return audioBuffer;
		}
		static [Symbol.hasInstance](instance) {
			return instance !== null && typeof instance === "object" && Object.getPrototypeOf(instance) === AudioBuffer.prototype || audioBufferStore$1.has(instance);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/constants.js
const MOST_NEGATIVE_SINGLE_FLOAT = -34028234663852886e22;
const MOST_POSITIVE_SINGLE_FLOAT = -MOST_NEGATIVE_SINGLE_FLOAT;

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-active-audio-node.js
const isActiveAudioNode = (audioNode) => ACTIVE_AUDIO_NODE_STORE.has(audioNode);

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-buffer-source-node-constructor.js
var DEFAULT_OPTIONS$18 = {
	buffer: null,
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	loop: false,
	loopEnd: 0,
	loopStart: 0,
	playbackRate: 1
};
const createAudioBufferSourceNodeConstructor = (audioNodeConstructor$1, createAudioBufferSourceNodeRenderer$1, createAudioParam$1, createInvalidStateError$1, createNativeAudioBufferSourceNode$1, getNativeContext$1, isNativeOfflineAudioContext$1, wrapEventListener$1) => {
	return class AudioBufferSourceNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const mergedOptions = {
				...DEFAULT_OPTIONS$18,
				...options
			};
			const nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode$1(nativeContext, mergedOptions);
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const audioBufferSourceNodeRenderer = isOffline ? createAudioBufferSourceNodeRenderer$1() : null;
			super(context, false, nativeAudioBufferSourceNode, audioBufferSourceNodeRenderer);
			this._audioBufferSourceNodeRenderer = audioBufferSourceNodeRenderer;
			this._isBufferNullified = false;
			this._isBufferSet = mergedOptions.buffer !== null;
			this._nativeAudioBufferSourceNode = nativeAudioBufferSourceNode;
			this._onended = null;
			this._playbackRate = createAudioParam$1(this, isOffline, nativeAudioBufferSourceNode.playbackRate, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
		}
		get buffer() {
			if (this._isBufferNullified) return null;
			return this._nativeAudioBufferSourceNode.buffer;
		}
		set buffer(value) {
			this._nativeAudioBufferSourceNode.buffer = value;
			if (value !== null) {
				if (this._isBufferSet) throw createInvalidStateError$1();
				this._isBufferSet = true;
			}
		}
		get loop() {
			return this._nativeAudioBufferSourceNode.loop;
		}
		set loop(value) {
			this._nativeAudioBufferSourceNode.loop = value;
		}
		get loopEnd() {
			return this._nativeAudioBufferSourceNode.loopEnd;
		}
		set loopEnd(value) {
			this._nativeAudioBufferSourceNode.loopEnd = value;
		}
		get loopStart() {
			return this._nativeAudioBufferSourceNode.loopStart;
		}
		set loopStart(value) {
			this._nativeAudioBufferSourceNode.loopStart = value;
		}
		get onended() {
			return this._onended;
		}
		set onended(value) {
			const wrappedListener = typeof value === "function" ? wrapEventListener$1(this, value) : null;
			this._nativeAudioBufferSourceNode.onended = wrappedListener;
			const nativeOnEnded = this._nativeAudioBufferSourceNode.onended;
			this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
		}
		get playbackRate() {
			return this._playbackRate;
		}
		start(when = 0, offset = 0, duration) {
			this._nativeAudioBufferSourceNode.start(when, offset, duration);
			if (this._audioBufferSourceNodeRenderer !== null) this._audioBufferSourceNodeRenderer.start = duration === void 0 ? [when, offset] : [
				when,
				offset,
				duration
			];
			if (this.context.state !== "closed") {
				setInternalStateToActive(this);
				const resetInternalStateToPassive = () => {
					this._nativeAudioBufferSourceNode.removeEventListener("ended", resetInternalStateToPassive);
					if (isActiveAudioNode(this)) setInternalStateToPassive(this);
				};
				this._nativeAudioBufferSourceNode.addEventListener("ended", resetInternalStateToPassive);
			}
		}
		stop(when = 0) {
			this._nativeAudioBufferSourceNode.stop(when);
			if (this._audioBufferSourceNodeRenderer !== null) this._audioBufferSourceNodeRenderer.stop = when;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-buffer-source-node-renderer-factory.js
const createAudioBufferSourceNodeRendererFactory = (connectAudioParam$1, createNativeAudioBufferSourceNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeAudioBufferSourceNodes = /* @__PURE__ */ new WeakMap();
		let start = null;
		let stop = null;
		const createAudioBufferSourceNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeAudioBufferSourceNode = getNativeAudioNode$1(proxy);
			const nativeAudioBufferSourceNodeIsOwnedByContext = isOwnedByContext(nativeAudioBufferSourceNode, nativeOfflineAudioContext);
			if (!nativeAudioBufferSourceNodeIsOwnedByContext) {
				nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode$1(nativeOfflineAudioContext, {
					buffer: nativeAudioBufferSourceNode.buffer,
					channelCount: nativeAudioBufferSourceNode.channelCount,
					channelCountMode: nativeAudioBufferSourceNode.channelCountMode,
					channelInterpretation: nativeAudioBufferSourceNode.channelInterpretation,
					loop: nativeAudioBufferSourceNode.loop,
					loopEnd: nativeAudioBufferSourceNode.loopEnd,
					loopStart: nativeAudioBufferSourceNode.loopStart,
					playbackRate: nativeAudioBufferSourceNode.playbackRate.value
				});
				if (start !== null) nativeAudioBufferSourceNode.start(...start);
				if (stop !== null) nativeAudioBufferSourceNode.stop(stop);
			}
			renderedNativeAudioBufferSourceNodes.set(nativeOfflineAudioContext, nativeAudioBufferSourceNode);
			if (!nativeAudioBufferSourceNodeIsOwnedByContext) await renderAutomation$1(nativeOfflineAudioContext, proxy.playbackRate, nativeAudioBufferSourceNode.playbackRate);
			else await connectAudioParam$1(nativeOfflineAudioContext, proxy.playbackRate, nativeAudioBufferSourceNode.playbackRate);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeAudioBufferSourceNode);
			return nativeAudioBufferSourceNode;
		};
		return {
			set start(value) {
				start = value;
			},
			set stop(value) {
				stop = value;
			},
			render(proxy, nativeOfflineAudioContext) {
				const renderedNativeAudioBufferSourceNode = renderedNativeAudioBufferSourceNodes.get(nativeOfflineAudioContext);
				if (renderedNativeAudioBufferSourceNode !== void 0) return Promise.resolve(renderedNativeAudioBufferSourceNode);
				return createAudioBufferSourceNode(proxy, nativeOfflineAudioContext);
			}
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/audio-buffer-source-node.js
const isAudioBufferSourceNode = (audioNode) => {
	return "playbackRate" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/biquad-filter-node.js
const isBiquadFilterNode = (audioNode) => {
	return "frequency" in audioNode && "gain" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/constant-source-node.js
const isConstantSourceNode = (audioNode) => {
	return "offset" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/gain-node.js
const isGainNode = (audioNode) => {
	return !("frequency" in audioNode) && "gain" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/oscillator-node.js
const isOscillatorNode = (audioNode) => {
	return "detune" in audioNode && "frequency" in audioNode && !("gain" in audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/stereo-panner-node.js
const isStereoPannerNode = (audioNode) => {
	return "pan" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-audio-node-connections.js
const getAudioNodeConnections = (audioNode) => {
	return getValueForKey(AUDIO_NODE_CONNECTIONS_STORE, audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-audio-param-connections.js
const getAudioParamConnections = (audioParam) => {
	return getValueForKey(AUDIO_PARAM_CONNECTIONS_STORE, audioParam);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/deactivate-active-audio-node-input-connections.js
const deactivateActiveAudioNodeInputConnections = (audioNode, trace) => {
	const { activeInputs } = getAudioNodeConnections(audioNode);
	activeInputs.forEach((connections) => connections.forEach(([source]) => {
		if (!trace.includes(audioNode)) deactivateActiveAudioNodeInputConnections(source, [...trace, audioNode]);
	}));
	const audioParams = isAudioBufferSourceNode(audioNode) ? [audioNode.playbackRate] : isAudioWorkletNode(audioNode) ? Array.from(audioNode.parameters.values()) : isBiquadFilterNode(audioNode) ? [
		audioNode.Q,
		audioNode.detune,
		audioNode.frequency,
		audioNode.gain
	] : isConstantSourceNode(audioNode) ? [audioNode.offset] : isGainNode(audioNode) ? [audioNode.gain] : isOscillatorNode(audioNode) ? [audioNode.detune, audioNode.frequency] : isStereoPannerNode(audioNode) ? [audioNode.pan] : [];
	for (const audioParam of audioParams) {
		const audioParamConnections = getAudioParamConnections(audioParam);
		if (audioParamConnections !== void 0) audioParamConnections.activeInputs.forEach(([source]) => deactivateActiveAudioNodeInputConnections(source, trace));
	}
	if (isActiveAudioNode(audioNode)) setInternalStateToPassive(audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/deactivate-audio-graph.js
const deactivateAudioGraph = (context) => {
	deactivateActiveAudioNodeInputConnections(context.destination, []);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-valid-latency-hint.js
const isValidLatencyHint = (latencyHint) => {
	return latencyHint === void 0 || typeof latencyHint === "number" || typeof latencyHint === "string" && (latencyHint === "balanced" || latencyHint === "interactive" || latencyHint === "playback");
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-context-constructor.js
const createAudioContextConstructor = (baseAudioContextConstructor$1, createInvalidStateError$1, createNotSupportedError$1, createUnknownError$1, mediaElementAudioSourceNodeConstructor$1, mediaStreamAudioDestinationNodeConstructor$1, mediaStreamAudioSourceNodeConstructor$1, mediaStreamTrackAudioSourceNodeConstructor$1, nativeAudioContextConstructor$1) => {
	return class AudioContext extends baseAudioContextConstructor$1 {
		constructor(options = {}) {
			if (nativeAudioContextConstructor$1 === null) throw new Error("Missing the native AudioContext constructor.");
			let nativeAudioContext;
			try {
				nativeAudioContext = new nativeAudioContextConstructor$1(options);
			} catch (err) {
				if (err.code === 12 && err.message === "sampleRate is not in range") throw createNotSupportedError$1();
				throw err;
			}
			if (nativeAudioContext === null) throw createUnknownError$1();
			if (!isValidLatencyHint(options.latencyHint)) throw new TypeError(`The provided value '${options.latencyHint}' is not a valid enum value of type AudioContextLatencyCategory.`);
			if (options.sampleRate !== void 0 && nativeAudioContext.sampleRate !== options.sampleRate) throw createNotSupportedError$1();
			super(nativeAudioContext, 2);
			const { latencyHint } = options;
			const { sampleRate } = nativeAudioContext;
			this._baseLatency = typeof nativeAudioContext.baseLatency === "number" ? nativeAudioContext.baseLatency : latencyHint === "balanced" ? 512 / sampleRate : latencyHint === "interactive" || latencyHint === void 0 ? 256 / sampleRate : latencyHint === "playback" ? 1024 / sampleRate : Math.max(2, Math.min(128, Math.round(latencyHint * sampleRate / 128))) * 128 / sampleRate;
			this._nativeAudioContext = nativeAudioContext;
			if (nativeAudioContextConstructor$1.name === "webkitAudioContext") {
				this._nativeGainNode = nativeAudioContext.createGain();
				this._nativeOscillatorNode = nativeAudioContext.createOscillator();
				this._nativeGainNode.gain.value = 1e-37;
				this._nativeOscillatorNode.connect(this._nativeGainNode).connect(nativeAudioContext.destination);
				this._nativeOscillatorNode.start();
			} else {
				this._nativeGainNode = null;
				this._nativeOscillatorNode = null;
			}
			this._state = null;
			if (nativeAudioContext.state === "running") {
				this._state = "suspended";
				const revokeState = () => {
					if (this._state === "suspended") this._state = null;
					nativeAudioContext.removeEventListener("statechange", revokeState);
				};
				nativeAudioContext.addEventListener("statechange", revokeState);
			}
		}
		get baseLatency() {
			return this._baseLatency;
		}
		get state() {
			return this._state !== null ? this._state : this._nativeAudioContext.state;
		}
		close() {
			if (this.state === "closed") return this._nativeAudioContext.close().then(() => {
				throw createInvalidStateError$1();
			});
			if (this._state === "suspended") this._state = null;
			return this._nativeAudioContext.close().then(() => {
				if (this._nativeGainNode !== null && this._nativeOscillatorNode !== null) {
					this._nativeOscillatorNode.stop();
					this._nativeGainNode.disconnect();
					this._nativeOscillatorNode.disconnect();
				}
				deactivateAudioGraph(this);
			});
		}
		createMediaElementSource(mediaElement) {
			return new mediaElementAudioSourceNodeConstructor$1(this, { mediaElement });
		}
		createMediaStreamDestination() {
			return new mediaStreamAudioDestinationNodeConstructor$1(this);
		}
		createMediaStreamSource(mediaStream) {
			return new mediaStreamAudioSourceNodeConstructor$1(this, { mediaStream });
		}
		createMediaStreamTrackSource(mediaStreamTrack) {
			return new mediaStreamTrackAudioSourceNodeConstructor$1(this, { mediaStreamTrack });
		}
		resume() {
			if (this._state === "suspended") return new Promise((resolve, reject) => {
				const resolvePromise = () => {
					this._nativeAudioContext.removeEventListener("statechange", resolvePromise);
					if (this._nativeAudioContext.state === "running") resolve();
					else this.resume().then(resolve, reject);
				};
				this._nativeAudioContext.addEventListener("statechange", resolvePromise);
			});
			return this._nativeAudioContext.resume().catch((err) => {
				if (err === void 0 || err.code === 15) throw createInvalidStateError$1();
				throw err;
			});
		}
		suspend() {
			return this._nativeAudioContext.suspend().catch((err) => {
				if (err === void 0) throw createInvalidStateError$1();
				throw err;
			});
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-destination-node-constructor.js
const createAudioDestinationNodeConstructor = (audioNodeConstructor$1, createAudioDestinationNodeRenderer$1, createIndexSizeError$1, createInvalidStateError$1, createNativeAudioDestinationNode, getNativeContext$1, isNativeOfflineAudioContext$1, renderInputsOfAudioNode$1) => {
	return class AudioDestinationNode extends audioNodeConstructor$1 {
		constructor(context, channelCount) {
			const nativeContext = getNativeContext$1(context);
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const nativeAudioDestinationNode = createNativeAudioDestinationNode(nativeContext, channelCount, isOffline);
			const audioDestinationNodeRenderer = isOffline ? createAudioDestinationNodeRenderer$1(renderInputsOfAudioNode$1) : null;
			super(context, false, nativeAudioDestinationNode, audioDestinationNodeRenderer);
			this._isNodeOfNativeOfflineAudioContext = isOffline;
			this._nativeAudioDestinationNode = nativeAudioDestinationNode;
		}
		get channelCount() {
			return this._nativeAudioDestinationNode.channelCount;
		}
		set channelCount(value) {
			if (this._isNodeOfNativeOfflineAudioContext) throw createInvalidStateError$1();
			if (value > this._nativeAudioDestinationNode.maxChannelCount) throw createIndexSizeError$1();
			this._nativeAudioDestinationNode.channelCount = value;
		}
		get channelCountMode() {
			return this._nativeAudioDestinationNode.channelCountMode;
		}
		set channelCountMode(value) {
			if (this._isNodeOfNativeOfflineAudioContext) throw createInvalidStateError$1();
			this._nativeAudioDestinationNode.channelCountMode = value;
		}
		get maxChannelCount() {
			return this._nativeAudioDestinationNode.maxChannelCount;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-destination-node-renderer-factory.js
const createAudioDestinationNodeRenderer = (renderInputsOfAudioNode$1) => {
	const renderedNativeAudioDestinationNodes = /* @__PURE__ */ new WeakMap();
	const createAudioDestinationNode = async (proxy, nativeOfflineAudioContext) => {
		const nativeAudioDestinationNode = nativeOfflineAudioContext.destination;
		renderedNativeAudioDestinationNodes.set(nativeOfflineAudioContext, nativeAudioDestinationNode);
		await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeAudioDestinationNode);
		return nativeAudioDestinationNode;
	};
	return { render(proxy, nativeOfflineAudioContext) {
		const renderedNativeAudioDestinationNode = renderedNativeAudioDestinationNodes.get(nativeOfflineAudioContext);
		if (renderedNativeAudioDestinationNode !== void 0) return Promise.resolve(renderedNativeAudioDestinationNode);
		return createAudioDestinationNode(proxy, nativeOfflineAudioContext);
	} };
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-listener-factory.js
const createAudioListenerFactory = (createAudioParam$1, createNativeChannelMergerNode$1, createNativeConstantSourceNode$1, createNativeScriptProcessorNode$1, createNotSupportedError$1, getFirstSample$1, isNativeOfflineAudioContext$1, overwriteAccessors$1) => {
	return (context, nativeContext) => {
		const nativeListener = nativeContext.listener;
		const createFakeAudioParams = () => {
			const buffer = new Float32Array(1);
			const channelMergerNode = createNativeChannelMergerNode$1(nativeContext, {
				channelCount: 1,
				channelCountMode: "explicit",
				channelInterpretation: "speakers",
				numberOfInputs: 9
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			let isScriptProcessorNodeCreated = false;
			let lastOrientation = [
				0,
				0,
				-1,
				0,
				1,
				0
			];
			let lastPosition = [
				0,
				0,
				0
			];
			const createScriptProcessorNode = () => {
				if (isScriptProcessorNodeCreated) return;
				isScriptProcessorNodeCreated = true;
				const scriptProcessorNode = createNativeScriptProcessorNode$1(nativeContext, 256, 9, 0);
				scriptProcessorNode.onaudioprocess = ({ inputBuffer }) => {
					const orientation = [
						getFirstSample$1(inputBuffer, buffer, 0),
						getFirstSample$1(inputBuffer, buffer, 1),
						getFirstSample$1(inputBuffer, buffer, 2),
						getFirstSample$1(inputBuffer, buffer, 3),
						getFirstSample$1(inputBuffer, buffer, 4),
						getFirstSample$1(inputBuffer, buffer, 5)
					];
					if (orientation.some((value, index) => value !== lastOrientation[index])) {
						nativeListener.setOrientation(...orientation);
						lastOrientation = orientation;
					}
					const positon = [
						getFirstSample$1(inputBuffer, buffer, 6),
						getFirstSample$1(inputBuffer, buffer, 7),
						getFirstSample$1(inputBuffer, buffer, 8)
					];
					if (positon.some((value, index) => value !== lastPosition[index])) {
						nativeListener.setPosition(...positon);
						lastPosition = positon;
					}
				};
				channelMergerNode.connect(scriptProcessorNode);
			};
			const createSetOrientation = (index) => (value) => {
				if (value !== lastOrientation[index]) {
					lastOrientation[index] = value;
					nativeListener.setOrientation(...lastOrientation);
				}
			};
			const createSetPosition = (index) => (value) => {
				if (value !== lastPosition[index]) {
					lastPosition[index] = value;
					nativeListener.setPosition(...lastPosition);
				}
			};
			const createFakeAudioParam = (input, initialValue, setValue) => {
				const constantSourceNode = createNativeConstantSourceNode$1(nativeContext, {
					channelCount: 1,
					channelCountMode: "explicit",
					channelInterpretation: "discrete",
					offset: initialValue
				});
				constantSourceNode.connect(channelMergerNode, 0, input);
				constantSourceNode.start();
				Object.defineProperty(constantSourceNode.offset, "defaultValue", { get() {
					return initialValue;
				} });
				const audioParam = createAudioParam$1({ context }, isOffline, constantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
				overwriteAccessors$1(audioParam, "value", (get) => () => get.call(audioParam), (set) => (value) => {
					try {
						set.call(audioParam, value);
					} catch (err) {
						if (err.code !== 9) throw err;
					}
					createScriptProcessorNode();
					if (isOffline) setValue(value);
				});
				audioParam.cancelAndHoldAtTime = ((cancelAndHoldAtTime) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = cancelAndHoldAtTime.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.cancelAndHoldAtTime);
				audioParam.cancelScheduledValues = ((cancelScheduledValues) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = cancelScheduledValues.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.cancelScheduledValues);
				audioParam.exponentialRampToValueAtTime = ((exponentialRampToValueAtTime) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = exponentialRampToValueAtTime.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.exponentialRampToValueAtTime);
				audioParam.linearRampToValueAtTime = ((linearRampToValueAtTime) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = linearRampToValueAtTime.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.linearRampToValueAtTime);
				audioParam.setTargetAtTime = ((setTargetAtTime) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = setTargetAtTime.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.setTargetAtTime);
				audioParam.setValueAtTime = ((setValueAtTime) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = setValueAtTime.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.setValueAtTime);
				audioParam.setValueCurveAtTime = ((setValueCurveAtTime) => {
					if (isOffline) return () => {
						throw createNotSupportedError$1();
					};
					return (...args) => {
						const value = setValueCurveAtTime.apply(audioParam, args);
						createScriptProcessorNode();
						return value;
					};
				})(audioParam.setValueCurveAtTime);
				return audioParam;
			};
			return {
				forwardX: createFakeAudioParam(0, 0, createSetOrientation(0)),
				forwardY: createFakeAudioParam(1, 0, createSetOrientation(1)),
				forwardZ: createFakeAudioParam(2, -1, createSetOrientation(2)),
				positionX: createFakeAudioParam(6, 0, createSetPosition(0)),
				positionY: createFakeAudioParam(7, 0, createSetPosition(1)),
				positionZ: createFakeAudioParam(8, 0, createSetPosition(2)),
				upX: createFakeAudioParam(3, 0, createSetOrientation(3)),
				upY: createFakeAudioParam(4, 1, createSetOrientation(4)),
				upZ: createFakeAudioParam(5, 0, createSetOrientation(5))
			};
		};
		const { forwardX, forwardY, forwardZ, positionX, positionY, positionZ, upX, upY, upZ } = nativeListener.forwardX === void 0 ? createFakeAudioParams() : nativeListener;
		return {
			get forwardX() {
				return forwardX;
			},
			get forwardY() {
				return forwardY;
			},
			get forwardZ() {
				return forwardZ;
			},
			get positionX() {
				return positionX;
			},
			get positionY() {
				return positionY;
			},
			get positionZ() {
				return positionZ;
			},
			get upX() {
				return upX;
			},
			get upY() {
				return upY;
			},
			get upZ() {
				return upZ;
			}
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/audio-node.js
const isAudioNode = (audioNodeOrAudioParam) => {
	return "context" in audioNodeOrAudioParam;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/audio-node-output-connection.js
const isAudioNodeOutputConnection = (outputConnection) => {
	return isAudioNode(outputConnection[0]);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/insert-element-in-set.js
const insertElementInSet = (set, element, predicate, ignoreDuplicates) => {
	for (const lmnt of set) if (predicate(lmnt)) {
		if (ignoreDuplicates) return false;
		throw Error("The set contains at least one similar element.");
	}
	set.add(element);
	return true;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/add-active-input-connection-to-audio-param.js
const addActiveInputConnectionToAudioParam = (activeInputs, source, [output, eventListener], ignoreDuplicates) => {
	insertElementInSet(activeInputs, [
		source,
		output,
		eventListener
	], (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output, ignoreDuplicates);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/add-passive-input-connection-to-audio-param.js
const addPassiveInputConnectionToAudioParam = (passiveInputs, [source, output, eventListener], ignoreDuplicates) => {
	const passiveInputConnections = passiveInputs.get(source);
	if (passiveInputConnections === void 0) passiveInputs.set(source, new Set([[output, eventListener]]));
	else insertElementInSet(passiveInputConnections, [output, eventListener], (passiveInputConnection) => passiveInputConnection[0] === output, ignoreDuplicates);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/native-audio-node-faker.js
const isNativeAudioNodeFaker = (nativeAudioNodeOrNativeAudioNodeFaker) => {
	return "inputs" in nativeAudioNodeOrNativeAudioNodeFaker;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/connect-native-audio-node-to-native-audio-node.js
const connectNativeAudioNodeToNativeAudioNode = (nativeSourceAudioNode, nativeDestinationAudioNode, output, input) => {
	if (isNativeAudioNodeFaker(nativeDestinationAudioNode)) {
		const fakeNativeDestinationAudioNode = nativeDestinationAudioNode.inputs[input];
		nativeSourceAudioNode.connect(fakeNativeDestinationAudioNode, output, 0);
		return [
			fakeNativeDestinationAudioNode,
			output,
			0
		];
	}
	nativeSourceAudioNode.connect(nativeDestinationAudioNode, output, input);
	return [
		nativeDestinationAudioNode,
		output,
		input
	];
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/delete-active-input-connection.js
const deleteActiveInputConnection = (activeInputConnections, source, output) => {
	for (const activeInputConnection of activeInputConnections) if (activeInputConnection[0] === source && activeInputConnection[1] === output) {
		activeInputConnections.delete(activeInputConnection);
		return activeInputConnection;
	}
	return null;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/delete-active-input-connection-to-audio-param.js
const deleteActiveInputConnectionToAudioParam = (activeInputs, source, output) => {
	return pickElementFromSet(activeInputs, (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/delete-event-listeners-of-audio-node.js
const deleteEventListenerOfAudioNode = (audioNode, eventListener) => {
	if (!getEventListenersOfAudioNode(audioNode).delete(eventListener)) throw new Error("Missing the expected event listener.");
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/delete-passive-input-connection-to-audio-param.js
const deletePassiveInputConnectionToAudioParam = (passiveInputs, source, output) => {
	const passiveInputConnections = getValueForKey(passiveInputs, source);
	const matchingConnection = pickElementFromSet(passiveInputConnections, (passiveInputConnection) => passiveInputConnection[0] === output);
	if (passiveInputConnections.size === 0) passiveInputs.delete(source);
	return matchingConnection;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/disconnect-native-audio-node-from-native-audio-node.js
const disconnectNativeAudioNodeFromNativeAudioNode = (nativeSourceAudioNode, nativeDestinationAudioNode, output, input) => {
	if (isNativeAudioNodeFaker(nativeDestinationAudioNode)) nativeSourceAudioNode.disconnect(nativeDestinationAudioNode.inputs[input], output, 0);
	else nativeSourceAudioNode.disconnect(nativeDestinationAudioNode, output, input);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-native-audio-node.js
const getNativeAudioNode = (audioNode) => {
	return getValueForKey(AUDIO_NODE_STORE, audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-native-audio-param.js
const getNativeAudioParam = (audioParam) => {
	return getValueForKey(AUDIO_PARAM_STORE, audioParam);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-part-of-a-cycle.js
const isPartOfACycle = (audioNode) => {
	return CYCLE_COUNTERS.has(audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-passive-audio-node.js
const isPassiveAudioNode = (audioNode) => {
	return !ACTIVE_AUDIO_NODE_STORE.has(audioNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-node-disconnect-method-support.js
const testAudioNodeDisconnectMethodSupport = (nativeAudioContext, nativeAudioWorkletNodeConstructor$1) => {
	return new Promise((resolve) => {
		if (nativeAudioWorkletNodeConstructor$1 !== null) resolve(true);
		else {
			const analyzer = nativeAudioContext.createScriptProcessor(256, 1, 1);
			const dummy = nativeAudioContext.createGain();
			const ones = nativeAudioContext.createBuffer(1, 2, 44100);
			const channelData = ones.getChannelData(0);
			channelData[0] = 1;
			channelData[1] = 1;
			const source = nativeAudioContext.createBufferSource();
			source.buffer = ones;
			source.loop = true;
			source.connect(analyzer).connect(nativeAudioContext.destination);
			source.connect(dummy);
			source.disconnect(dummy);
			analyzer.onaudioprocess = (event) => {
				const chnnlDt = event.inputBuffer.getChannelData(0);
				if (Array.prototype.some.call(chnnlDt, (sample) => sample === 1)) resolve(true);
				else resolve(false);
				source.stop();
				analyzer.onaudioprocess = null;
				source.disconnect(analyzer);
				analyzer.disconnect(nativeAudioContext.destination);
			};
			source.start();
		}
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/visit-each-audio-node-once.js
const visitEachAudioNodeOnce = (cycles, visitor) => {
	const counts = /* @__PURE__ */ new Map();
	for (const cycle of cycles) for (const audioNode of cycle) {
		const count = counts.get(audioNode);
		counts.set(audioNode, count === void 0 ? 1 : count + 1);
	}
	counts.forEach((count, audioNode) => visitor(audioNode, count));
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/native-audio-node.js
const isNativeAudioNode$1 = (nativeAudioNodeOrAudioParam) => {
	return "context" in nativeAudioNodeOrAudioParam;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-node-disconnect-method.js
const wrapAudioNodeDisconnectMethod = (nativeAudioNode) => {
	const connections = /* @__PURE__ */ new Map();
	nativeAudioNode.connect = ((connect) => {
		return (destination, output = 0, input = 0) => {
			const returnValue = isNativeAudioNode$1(destination) ? connect(destination, output, input) : connect(destination, output);
			const connectionsToDestination = connections.get(destination);
			if (connectionsToDestination === void 0) connections.set(destination, [{
				input,
				output
			}]);
			else if (connectionsToDestination.every((connection) => connection.input !== input || connection.output !== output)) connectionsToDestination.push({
				input,
				output
			});
			return returnValue;
		};
	})(nativeAudioNode.connect.bind(nativeAudioNode));
	nativeAudioNode.disconnect = ((disconnect) => {
		return (destinationOrOutput, output, input) => {
			disconnect.apply(nativeAudioNode);
			if (destinationOrOutput === void 0) connections.clear();
			else if (typeof destinationOrOutput === "number") for (const [destination, connectionsToDestination] of connections) {
				const filteredConnections = connectionsToDestination.filter((connection) => connection.output !== destinationOrOutput);
				if (filteredConnections.length === 0) connections.delete(destination);
				else connections.set(destination, filteredConnections);
			}
			else if (connections.has(destinationOrOutput)) if (output === void 0) connections.delete(destinationOrOutput);
			else {
				const connectionsToDestination = connections.get(destinationOrOutput);
				if (connectionsToDestination !== void 0) {
					const filteredConnections = connectionsToDestination.filter((connection) => connection.output !== output && (connection.input !== input || input === void 0));
					if (filteredConnections.length === 0) connections.delete(destinationOrOutput);
					else connections.set(destinationOrOutput, filteredConnections);
				}
			}
			for (const [destination, connectionsToDestination] of connections) connectionsToDestination.forEach((connection) => {
				if (isNativeAudioNode$1(destination)) nativeAudioNode.connect(destination, connection.output, connection.input);
				else nativeAudioNode.connect(destination, connection.output);
			});
		};
	})(nativeAudioNode.disconnect);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-node-constructor.js
var addConnectionToAudioParamOfAudioContext = (source, destination, output, isOffline) => {
	const { activeInputs, passiveInputs } = getAudioParamConnections(destination);
	const { outputs } = getAudioNodeConnections(source);
	const eventListeners = getEventListenersOfAudioNode(source);
	const eventListener = (isActive) => {
		const nativeAudioNode = getNativeAudioNode(source);
		const nativeAudioParam = getNativeAudioParam(destination);
		if (isActive) {
			addActiveInputConnectionToAudioParam(activeInputs, source, deletePassiveInputConnectionToAudioParam(passiveInputs, source, output), false);
			if (!isOffline && !isPartOfACycle(source)) nativeAudioNode.connect(nativeAudioParam, output);
		} else {
			addPassiveInputConnectionToAudioParam(passiveInputs, deleteActiveInputConnectionToAudioParam(activeInputs, source, output), false);
			if (!isOffline && !isPartOfACycle(source)) nativeAudioNode.disconnect(nativeAudioParam, output);
		}
	};
	if (insertElementInSet(outputs, [destination, output], (outputConnection) => outputConnection[0] === destination && outputConnection[1] === output, true)) {
		eventListeners.add(eventListener);
		if (isActiveAudioNode(source)) addActiveInputConnectionToAudioParam(activeInputs, source, [output, eventListener], true);
		else addPassiveInputConnectionToAudioParam(passiveInputs, [
			source,
			output,
			eventListener
		], true);
		return true;
	}
	return false;
};
var deleteInputConnectionOfAudioNode = (source, destination, output, input) => {
	const { activeInputs, passiveInputs } = getAudioNodeConnections(destination);
	const activeInputConnection = deleteActiveInputConnection(activeInputs[input], source, output);
	if (activeInputConnection === null) return [deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input)[2], false];
	return [activeInputConnection[2], true];
};
var deleteInputConnectionOfAudioParam = (source, destination, output) => {
	const { activeInputs, passiveInputs } = getAudioParamConnections(destination);
	const activeInputConnection = deleteActiveInputConnection(activeInputs, source, output);
	if (activeInputConnection === null) return [deletePassiveInputConnectionToAudioParam(passiveInputs, source, output)[1], false];
	return [activeInputConnection[2], true];
};
var deleteInputsOfAudioNode = (source, isOffline, destination, output, input) => {
	const [listener, isActive] = deleteInputConnectionOfAudioNode(source, destination, output, input);
	if (listener !== null) {
		deleteEventListenerOfAudioNode(source, listener);
		if (isActive && !isOffline && !isPartOfACycle(source)) disconnectNativeAudioNodeFromNativeAudioNode(getNativeAudioNode(source), getNativeAudioNode(destination), output, input);
	}
	if (isActiveAudioNode(destination)) {
		const { activeInputs } = getAudioNodeConnections(destination);
		setInternalStateToPassiveWhenNecessary(destination, activeInputs);
	}
};
var deleteInputsOfAudioParam = (source, isOffline, destination, output) => {
	const [listener, isActive] = deleteInputConnectionOfAudioParam(source, destination, output);
	if (listener !== null) {
		deleteEventListenerOfAudioNode(source, listener);
		if (isActive && !isOffline && !isPartOfACycle(source)) getNativeAudioNode(source).disconnect(getNativeAudioParam(destination), output);
	}
};
var deleteAnyConnection = (source, isOffline) => {
	const audioNodeConnectionsOfSource = getAudioNodeConnections(source);
	const destinations = [];
	for (const outputConnection of audioNodeConnectionsOfSource.outputs) {
		if (isAudioNodeOutputConnection(outputConnection)) deleteInputsOfAudioNode(source, isOffline, ...outputConnection);
		else deleteInputsOfAudioParam(source, isOffline, ...outputConnection);
		destinations.push(outputConnection[0]);
	}
	audioNodeConnectionsOfSource.outputs.clear();
	return destinations;
};
var deleteConnectionAtOutput = (source, isOffline, output) => {
	const audioNodeConnectionsOfSource = getAudioNodeConnections(source);
	const destinations = [];
	for (const outputConnection of audioNodeConnectionsOfSource.outputs) if (outputConnection[1] === output) {
		if (isAudioNodeOutputConnection(outputConnection)) deleteInputsOfAudioNode(source, isOffline, ...outputConnection);
		else deleteInputsOfAudioParam(source, isOffline, ...outputConnection);
		destinations.push(outputConnection[0]);
		audioNodeConnectionsOfSource.outputs.delete(outputConnection);
	}
	return destinations;
};
var deleteConnectionToDestination = (source, isOffline, destination, output, input) => {
	const audioNodeConnectionsOfSource = getAudioNodeConnections(source);
	return Array.from(audioNodeConnectionsOfSource.outputs).filter((outputConnection) => outputConnection[0] === destination && (output === void 0 || outputConnection[1] === output) && (input === void 0 || outputConnection[2] === input)).map((outputConnection) => {
		if (isAudioNodeOutputConnection(outputConnection)) deleteInputsOfAudioNode(source, isOffline, ...outputConnection);
		else deleteInputsOfAudioParam(source, isOffline, ...outputConnection);
		audioNodeConnectionsOfSource.outputs.delete(outputConnection);
		return outputConnection[0];
	});
};
const createAudioNodeConstructor = (addAudioNodeConnections, addConnectionToAudioNode, cacheTestResult$1, createIncrementCycleCounter, createIndexSizeError$1, createInvalidAccessError$1, createNotSupportedError$1, decrementCycleCounter, detectCycles, eventTargetConstructor$1, getNativeContext$1, isNativeAudioContext$1, isNativeAudioNode$2, isNativeAudioParam$1, isNativeOfflineAudioContext$1, nativeAudioWorkletNodeConstructor$1) => {
	return class AudioNode extends eventTargetConstructor$1 {
		constructor(context, isActive, nativeAudioNode, audioNodeRenderer) {
			super(nativeAudioNode);
			this._context = context;
			this._nativeAudioNode = nativeAudioNode;
			const nativeContext = getNativeContext$1(context);
			if (isNativeAudioContext$1(nativeContext) && true !== cacheTestResult$1(testAudioNodeDisconnectMethodSupport, () => {
				return testAudioNodeDisconnectMethodSupport(nativeContext, nativeAudioWorkletNodeConstructor$1);
			})) wrapAudioNodeDisconnectMethod(nativeAudioNode);
			AUDIO_NODE_STORE.set(this, nativeAudioNode);
			EVENT_LISTENERS.set(this, /* @__PURE__ */ new Set());
			if (context.state !== "closed" && isActive) setInternalStateToActive(this);
			addAudioNodeConnections(this, audioNodeRenderer, nativeAudioNode);
		}
		get channelCount() {
			return this._nativeAudioNode.channelCount;
		}
		set channelCount(value) {
			this._nativeAudioNode.channelCount = value;
		}
		get channelCountMode() {
			return this._nativeAudioNode.channelCountMode;
		}
		set channelCountMode(value) {
			this._nativeAudioNode.channelCountMode = value;
		}
		get channelInterpretation() {
			return this._nativeAudioNode.channelInterpretation;
		}
		set channelInterpretation(value) {
			this._nativeAudioNode.channelInterpretation = value;
		}
		get context() {
			return this._context;
		}
		get numberOfInputs() {
			return this._nativeAudioNode.numberOfInputs;
		}
		get numberOfOutputs() {
			return this._nativeAudioNode.numberOfOutputs;
		}
		connect(destination, output = 0, input = 0) {
			if (output < 0 || output >= this._nativeAudioNode.numberOfOutputs) throw createIndexSizeError$1();
			const isOffline = isNativeOfflineAudioContext$1(getNativeContext$1(this._context));
			if (isNativeAudioNode$2(destination) || isNativeAudioParam$1(destination)) throw createInvalidAccessError$1();
			if (isAudioNode(destination)) {
				const nativeDestinationAudioNode = getNativeAudioNode(destination);
				try {
					const connection = connectNativeAudioNodeToNativeAudioNode(this._nativeAudioNode, nativeDestinationAudioNode, output, input);
					const isPassive = isPassiveAudioNode(this);
					if (isOffline || isPassive) this._nativeAudioNode.disconnect(...connection);
					if (this.context.state !== "closed" && !isPassive && isPassiveAudioNode(destination)) setInternalStateToActive(destination);
				} catch (err) {
					if (err.code === 12) throw createInvalidAccessError$1();
					throw err;
				}
				if (addConnectionToAudioNode(this, destination, output, input, isOffline)) visitEachAudioNodeOnce(detectCycles([this], destination), createIncrementCycleCounter(isOffline));
				return destination;
			}
			const nativeAudioParam = getNativeAudioParam(destination);
			if (nativeAudioParam.name === "playbackRate" && nativeAudioParam.maxValue === 1024) throw createNotSupportedError$1();
			try {
				this._nativeAudioNode.connect(nativeAudioParam, output);
				if (isOffline || isPassiveAudioNode(this)) this._nativeAudioNode.disconnect(nativeAudioParam, output);
			} catch (err) {
				if (err.code === 12) throw createInvalidAccessError$1();
				throw err;
			}
			if (addConnectionToAudioParamOfAudioContext(this, destination, output, isOffline)) visitEachAudioNodeOnce(detectCycles([this], destination), createIncrementCycleCounter(isOffline));
		}
		disconnect(destinationOrOutput, output, input) {
			let destinations;
			const isOffline = isNativeOfflineAudioContext$1(getNativeContext$1(this._context));
			if (destinationOrOutput === void 0) destinations = deleteAnyConnection(this, isOffline);
			else if (typeof destinationOrOutput === "number") {
				if (destinationOrOutput < 0 || destinationOrOutput >= this.numberOfOutputs) throw createIndexSizeError$1();
				destinations = deleteConnectionAtOutput(this, isOffline, destinationOrOutput);
			} else {
				if (output !== void 0 && (output < 0 || output >= this.numberOfOutputs)) throw createIndexSizeError$1();
				if (isAudioNode(destinationOrOutput) && input !== void 0 && (input < 0 || input >= destinationOrOutput.numberOfInputs)) throw createIndexSizeError$1();
				destinations = deleteConnectionToDestination(this, isOffline, destinationOrOutput, output, input);
				if (destinations.length === 0) throw createInvalidAccessError$1();
			}
			for (const destination of destinations) visitEachAudioNodeOnce(detectCycles([this], destination), decrementCycleCounter);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-param-factory.js
const createAudioParamFactory = (addAudioParamConnections, audioParamAudioNodeStore$1, audioParamStore, createAudioParamRenderer$1, createCancelAndHoldAutomationEvent$1, createCancelScheduledValuesAutomationEvent$1, createExponentialRampToValueAutomationEvent$1, createLinearRampToValueAutomationEvent$1, createSetTargetAutomationEvent$1, createSetValueAutomationEvent$1, createSetValueCurveAutomationEvent$1, nativeAudioContextConstructor$1, setValueAtTimeUntilPossible$1) => {
	return (audioNode, isAudioParamOfOfflineAudioContext, nativeAudioParam, maxValue = null, minValue = null) => {
		const defaultValue = nativeAudioParam.value;
		const automationEventList = new import_bundle$1.AutomationEventList(defaultValue);
		const audioParamRenderer = isAudioParamOfOfflineAudioContext ? createAudioParamRenderer$1(automationEventList) : null;
		const audioParam = {
			get defaultValue() {
				return defaultValue;
			},
			get maxValue() {
				return maxValue === null ? nativeAudioParam.maxValue : maxValue;
			},
			get minValue() {
				return minValue === null ? nativeAudioParam.minValue : minValue;
			},
			get value() {
				return nativeAudioParam.value;
			},
			set value(value) {
				nativeAudioParam.value = value;
				audioParam.setValueAtTime(value, audioNode.context.currentTime);
			},
			cancelAndHoldAtTime(cancelTime) {
				if (typeof nativeAudioParam.cancelAndHoldAtTime === "function") {
					if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
					automationEventList.add(createCancelAndHoldAutomationEvent$1(cancelTime));
					nativeAudioParam.cancelAndHoldAtTime(cancelTime);
				} else {
					const previousLastEvent = Array.from(automationEventList).pop();
					if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
					automationEventList.add(createCancelAndHoldAutomationEvent$1(cancelTime));
					const currentLastEvent = Array.from(automationEventList).pop();
					nativeAudioParam.cancelScheduledValues(cancelTime);
					if (previousLastEvent !== currentLastEvent && currentLastEvent !== void 0) {
						if (currentLastEvent.type === "exponentialRampToValue") nativeAudioParam.exponentialRampToValueAtTime(currentLastEvent.value, currentLastEvent.endTime);
						else if (currentLastEvent.type === "linearRampToValue") nativeAudioParam.linearRampToValueAtTime(currentLastEvent.value, currentLastEvent.endTime);
						else if (currentLastEvent.type === "setValue") nativeAudioParam.setValueAtTime(currentLastEvent.value, currentLastEvent.startTime);
						else if (currentLastEvent.type === "setValueCurve") nativeAudioParam.setValueCurveAtTime(currentLastEvent.values, currentLastEvent.startTime, currentLastEvent.duration);
					}
				}
				return audioParam;
			},
			cancelScheduledValues(cancelTime) {
				if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
				automationEventList.add(createCancelScheduledValuesAutomationEvent$1(cancelTime));
				nativeAudioParam.cancelScheduledValues(cancelTime);
				return audioParam;
			},
			exponentialRampToValueAtTime(value, endTime) {
				if (value === 0) throw new RangeError();
				if (!Number.isFinite(endTime) || endTime < 0) throw new RangeError();
				const currentTime = audioNode.context.currentTime;
				if (audioParamRenderer === null) automationEventList.flush(currentTime);
				if (Array.from(automationEventList).length === 0) {
					automationEventList.add(createSetValueAutomationEvent$1(defaultValue, currentTime));
					nativeAudioParam.setValueAtTime(defaultValue, currentTime);
				}
				automationEventList.add(createExponentialRampToValueAutomationEvent$1(value, endTime));
				nativeAudioParam.exponentialRampToValueAtTime(value, endTime);
				return audioParam;
			},
			linearRampToValueAtTime(value, endTime) {
				const currentTime = audioNode.context.currentTime;
				if (audioParamRenderer === null) automationEventList.flush(currentTime);
				if (Array.from(automationEventList).length === 0) {
					automationEventList.add(createSetValueAutomationEvent$1(defaultValue, currentTime));
					nativeAudioParam.setValueAtTime(defaultValue, currentTime);
				}
				automationEventList.add(createLinearRampToValueAutomationEvent$1(value, endTime));
				nativeAudioParam.linearRampToValueAtTime(value, endTime);
				return audioParam;
			},
			setTargetAtTime(target, startTime, timeConstant) {
				if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
				automationEventList.add(createSetTargetAutomationEvent$1(target, startTime, timeConstant));
				nativeAudioParam.setTargetAtTime(target, startTime, timeConstant);
				return audioParam;
			},
			setValueAtTime(value, startTime) {
				if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
				automationEventList.add(createSetValueAutomationEvent$1(value, startTime));
				nativeAudioParam.setValueAtTime(value, startTime);
				return audioParam;
			},
			setValueCurveAtTime(values, startTime, duration) {
				const convertedValues = values instanceof Float32Array ? values : new Float32Array(values);
				if (nativeAudioContextConstructor$1 !== null && nativeAudioContextConstructor$1.name === "webkitAudioContext") {
					const endTime = startTime + duration;
					const sampleRate = audioNode.context.sampleRate;
					const firstSample = Math.ceil(startTime * sampleRate);
					const lastSample = Math.floor(endTime * sampleRate);
					const numberOfInterpolatedValues = lastSample - firstSample;
					const interpolatedValues = new Float32Array(numberOfInterpolatedValues);
					for (let i = 0; i < numberOfInterpolatedValues; i += 1) {
						const theoreticIndex = (convertedValues.length - 1) / duration * ((firstSample + i) / sampleRate - startTime);
						const lowerIndex = Math.floor(theoreticIndex);
						const upperIndex = Math.ceil(theoreticIndex);
						interpolatedValues[i] = lowerIndex === upperIndex ? convertedValues[lowerIndex] : (1 - (theoreticIndex - lowerIndex)) * convertedValues[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * convertedValues[upperIndex];
					}
					if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
					automationEventList.add(createSetValueCurveAutomationEvent$1(interpolatedValues, startTime, duration));
					nativeAudioParam.setValueCurveAtTime(interpolatedValues, startTime, duration);
					const timeOfLastSample = lastSample / sampleRate;
					if (timeOfLastSample < endTime) setValueAtTimeUntilPossible$1(audioParam, interpolatedValues[interpolatedValues.length - 1], timeOfLastSample);
					setValueAtTimeUntilPossible$1(audioParam, convertedValues[convertedValues.length - 1], endTime);
				} else {
					if (audioParamRenderer === null) automationEventList.flush(audioNode.context.currentTime);
					automationEventList.add(createSetValueCurveAutomationEvent$1(convertedValues, startTime, duration));
					nativeAudioParam.setValueCurveAtTime(convertedValues, startTime, duration);
				}
				return audioParam;
			}
		};
		audioParamStore.set(audioParam, nativeAudioParam);
		audioParamAudioNodeStore$1.set(audioParam, audioNode);
		addAudioParamConnections(audioParam, audioParamRenderer);
		return audioParam;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-param-renderer.js
const createAudioParamRenderer = (automationEventList) => {
	return { replay(audioParam) {
		for (const automationEvent of automationEventList) if (automationEvent.type === "exponentialRampToValue") {
			const { endTime, value } = automationEvent;
			audioParam.exponentialRampToValueAtTime(value, endTime);
		} else if (automationEvent.type === "linearRampToValue") {
			const { endTime, value } = automationEvent;
			audioParam.linearRampToValueAtTime(value, endTime);
		} else if (automationEvent.type === "setTarget") {
			const { startTime, target, timeConstant } = automationEvent;
			audioParam.setTargetAtTime(target, startTime, timeConstant);
		} else if (automationEvent.type === "setValue") {
			const { startTime, value } = automationEvent;
			audioParam.setValueAtTime(value, startTime);
		} else if (automationEvent.type === "setValueCurve") {
			const { duration, startTime, values } = automationEvent;
			audioParam.setValueCurveAtTime(values, startTime, duration);
		} else throw new Error("Can't apply an unknown automation.");
	} };
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/read-only-map.js
var ReadOnlyMap = class {
	constructor(parameters) {
		this._map = new Map(parameters);
	}
	get size() {
		return this._map.size;
	}
	entries() {
		return this._map.entries();
	}
	forEach(callback, thisArg = null) {
		return this._map.forEach((value, key) => callback.call(thisArg, value, key, this));
	}
	get(name) {
		return this._map.get(name);
	}
	has(name) {
		return this._map.has(name);
	}
	keys() {
		return this._map.keys();
	}
	values() {
		return this._map.values();
	}
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-worklet-node-constructor.js
var DEFAULT_OPTIONS$17 = {
	channelCount: 2,
	channelCountMode: "explicit",
	channelInterpretation: "speakers",
	numberOfInputs: 1,
	numberOfOutputs: 1,
	parameterData: {},
	processorOptions: {}
};
const createAudioWorkletNodeConstructor = (addUnrenderedAudioWorkletNode$1, audioNodeConstructor$1, createAudioParam$1, createAudioWorkletNodeRenderer$1, createNativeAudioWorkletNode$1, getAudioNodeConnections$1, getBackupOfflineAudioContext$1, getNativeContext$1, isNativeOfflineAudioContext$1, nativeAudioWorkletNodeConstructor$1, sanitizeAudioWorkletNodeOptions$1, setActiveAudioWorkletNodeInputs$1, testAudioWorkletNodeOptionsClonability$1, wrapEventListener$1) => {
	return class AudioWorkletNode extends audioNodeConstructor$1 {
		constructor(context, name, options) {
			var _a;
			const nativeContext = getNativeContext$1(context);
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const mergedOptions = sanitizeAudioWorkletNodeOptions$1({
				...DEFAULT_OPTIONS$17,
				...options
			});
			testAudioWorkletNodeOptionsClonability$1(mergedOptions);
			const nodeNameToProcessorConstructorMap = NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.get(nativeContext);
			const processorConstructor = nodeNameToProcessorConstructorMap === null || nodeNameToProcessorConstructorMap === void 0 ? void 0 : nodeNameToProcessorConstructorMap.get(name);
			const nativeAudioWorkletNode = createNativeAudioWorkletNode$1(isOffline || nativeContext.state !== "closed" ? nativeContext : (_a = getBackupOfflineAudioContext$1(nativeContext)) !== null && _a !== void 0 ? _a : nativeContext, isOffline ? null : context.baseLatency, nativeAudioWorkletNodeConstructor$1, name, processorConstructor, mergedOptions);
			const audioWorkletNodeRenderer = isOffline ? createAudioWorkletNodeRenderer$1(name, mergedOptions, processorConstructor) : null;
			super(context, true, nativeAudioWorkletNode, audioWorkletNodeRenderer);
			const parameters = [];
			nativeAudioWorkletNode.parameters.forEach((nativeAudioParam, nm) => {
				const audioParam = createAudioParam$1(this, isOffline, nativeAudioParam);
				parameters.push([nm, audioParam]);
			});
			this._nativeAudioWorkletNode = nativeAudioWorkletNode;
			this._onprocessorerror = null;
			this._parameters = new ReadOnlyMap(parameters);
			if (isOffline) addUnrenderedAudioWorkletNode$1(nativeContext, this);
			const { activeInputs } = getAudioNodeConnections$1(this);
			setActiveAudioWorkletNodeInputs$1(nativeAudioWorkletNode, activeInputs);
		}
		get onprocessorerror() {
			return this._onprocessorerror;
		}
		set onprocessorerror(value) {
			const wrappedListener = typeof value === "function" ? wrapEventListener$1(this, value) : null;
			this._nativeAudioWorkletNode.onprocessorerror = wrappedListener;
			const nativeOnProcessorError = this._nativeAudioWorkletNode.onprocessorerror;
			this._onprocessorerror = nativeOnProcessorError !== null && nativeOnProcessorError === wrappedListener ? value : nativeOnProcessorError;
		}
		get parameters() {
			if (this._parameters === null) return this._nativeAudioWorkletNode.parameters;
			return this._parameters;
		}
		get port() {
			return this._nativeAudioWorkletNode.port;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/copy-from-channel.js
function copyFromChannel(audioBuffer, parent, key, channelNumber, bufferOffset) {
	if (typeof audioBuffer.copyFromChannel === "function") {
		if (parent[key].byteLength === 0) parent[key] = new Float32Array(128);
		audioBuffer.copyFromChannel(parent[key], channelNumber, bufferOffset);
	} else {
		const channelData = audioBuffer.getChannelData(channelNumber);
		if (parent[key].byteLength === 0) parent[key] = channelData.slice(bufferOffset, bufferOffset + 128);
		else {
			const slicedInput = new Float32Array(channelData.buffer, bufferOffset * Float32Array.BYTES_PER_ELEMENT, 128);
			parent[key].set(slicedInput);
		}
	}
}

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/copy-to-channel.js
const copyToChannel = (audioBuffer, parent, key, channelNumber, bufferOffset) => {
	if (typeof audioBuffer.copyToChannel === "function") {
		if (parent[key].byteLength !== 0) audioBuffer.copyToChannel(parent[key], channelNumber, bufferOffset);
	} else if (parent[key].byteLength !== 0) audioBuffer.getChannelData(channelNumber).set(parent[key], bufferOffset);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/create-nested-arrays.js
const createNestedArrays = (x, y) => {
	const arrays = [];
	for (let i = 0; i < x; i += 1) {
		const array = [];
		const length = typeof y === "number" ? y : y[i];
		for (let j = 0; j < length; j += 1) array.push(new Float32Array(128));
		arrays.push(array);
	}
	return arrays;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-audio-worklet-processor.js
const getAudioWorkletProcessor = (nativeOfflineAudioContext, proxy) => {
	return getValueForKey(getValueForKey(NODE_TO_PROCESSOR_MAPS, nativeOfflineAudioContext), getNativeAudioNode(proxy));
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/audio-worklet-node-renderer-factory.js
var processBuffer = async (proxy, renderedBuffer, nativeOfflineAudioContext, options, outputChannelCount, processorConstructor, exposeCurrentFrameAndCurrentTime$1) => {
	const length = renderedBuffer === null ? Math.ceil(proxy.context.length / 128) * 128 : renderedBuffer.length;
	const numberOfInputChannels = options.channelCount * options.numberOfInputs;
	const numberOfOutputChannels = outputChannelCount.reduce((sum, value) => sum + value, 0);
	const processedBuffer = numberOfOutputChannels === 0 ? null : nativeOfflineAudioContext.createBuffer(numberOfOutputChannels, length, nativeOfflineAudioContext.sampleRate);
	if (processorConstructor === void 0) throw new Error("Missing the processor constructor.");
	const audioNodeConnections = getAudioNodeConnections(proxy);
	const audioWorkletProcessor = await getAudioWorkletProcessor(nativeOfflineAudioContext, proxy);
	const inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
	const outputs = createNestedArrays(options.numberOfOutputs, outputChannelCount);
	const parameters = Array.from(proxy.parameters.keys()).reduce((prmtrs, name) => ({
		...prmtrs,
		[name]: new Float32Array(128)
	}), {});
	for (let i = 0; i < length; i += 128) {
		if (options.numberOfInputs > 0 && renderedBuffer !== null) for (let j = 0; j < options.numberOfInputs; j += 1) for (let k = 0; k < options.channelCount; k += 1) copyFromChannel(renderedBuffer, inputs[j], k, k, i);
		if (processorConstructor.parameterDescriptors !== void 0 && renderedBuffer !== null) processorConstructor.parameterDescriptors.forEach(({ name }, index) => {
			copyFromChannel(renderedBuffer, parameters, name, numberOfInputChannels + index, i);
		});
		for (let j = 0; j < options.numberOfInputs; j += 1) for (let k = 0; k < outputChannelCount[j]; k += 1) if (outputs[j][k].byteLength === 0) outputs[j][k] = new Float32Array(128);
		try {
			const potentiallyEmptyInputs = inputs.map((input, index) => {
				if (audioNodeConnections.activeInputs[index].size === 0) return [];
				return input;
			});
			const activeSourceFlag = exposeCurrentFrameAndCurrentTime$1(i / nativeOfflineAudioContext.sampleRate, nativeOfflineAudioContext.sampleRate, () => audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters));
			if (processedBuffer !== null) for (let j = 0, outputChannelSplitterNodeOutput = 0; j < options.numberOfOutputs; j += 1) {
				for (let k = 0; k < outputChannelCount[j]; k += 1) copyToChannel(processedBuffer, outputs[j], k, outputChannelSplitterNodeOutput + k, i);
				outputChannelSplitterNodeOutput += outputChannelCount[j];
			}
			if (!activeSourceFlag) break;
		} catch (error) {
			proxy.dispatchEvent(new ErrorEvent("processorerror", {
				colno: error.colno,
				filename: error.filename,
				lineno: error.lineno,
				message: error.message
			}));
			break;
		}
	}
	return processedBuffer;
};
const createAudioWorkletNodeRendererFactory = (connectAudioParam$1, connectMultipleOutputs$1, createNativeAudioBufferSourceNode$1, createNativeChannelMergerNode$1, createNativeChannelSplitterNode$1, createNativeConstantSourceNode$1, createNativeGainNode$1, deleteUnrenderedAudioWorkletNode$1, disconnectMultipleOutputs$1, exposeCurrentFrameAndCurrentTime$1, getNativeAudioNode$1, nativeAudioWorkletNodeConstructor$1, nativeOfflineAudioContextConstructor$1, renderAutomation$1, renderInputsOfAudioNode$1, renderNativeOfflineAudioContext$1) => {
	return (name, options, processorConstructor) => {
		const renderedNativeAudioNodes = /* @__PURE__ */ new WeakMap();
		let processedBufferPromise = null;
		const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeAudioWorkletNode = getNativeAudioNode$1(proxy);
			let nativeOutputNodes = null;
			const nativeAudioWorkletNodeIsOwnedByContext = isOwnedByContext(nativeAudioWorkletNode, nativeOfflineAudioContext);
			const outputChannelCount = Array.isArray(options.outputChannelCount) ? options.outputChannelCount : Array.from(options.outputChannelCount);
			if (nativeAudioWorkletNodeConstructor$1 === null) {
				const numberOfOutputChannels = outputChannelCount.reduce((sum, value) => sum + value, 0);
				const outputChannelSplitterNode = createNativeChannelSplitterNode$1(nativeOfflineAudioContext, {
					channelCount: Math.max(1, numberOfOutputChannels),
					channelCountMode: "explicit",
					channelInterpretation: "discrete",
					numberOfOutputs: Math.max(1, numberOfOutputChannels)
				});
				const outputChannelMergerNodes = [];
				for (let i = 0; i < proxy.numberOfOutputs; i += 1) outputChannelMergerNodes.push(createNativeChannelMergerNode$1(nativeOfflineAudioContext, {
					channelCount: 1,
					channelCountMode: "explicit",
					channelInterpretation: "speakers",
					numberOfInputs: outputChannelCount[i]
				}));
				const outputGainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
					channelCount: options.channelCount,
					channelCountMode: options.channelCountMode,
					channelInterpretation: options.channelInterpretation,
					gain: 1
				});
				outputGainNode.connect = connectMultipleOutputs$1.bind(null, outputChannelMergerNodes);
				outputGainNode.disconnect = disconnectMultipleOutputs$1.bind(null, outputChannelMergerNodes);
				nativeOutputNodes = [
					outputChannelSplitterNode,
					outputChannelMergerNodes,
					outputGainNode
				];
			} else if (!nativeAudioWorkletNodeIsOwnedByContext) nativeAudioWorkletNode = new nativeAudioWorkletNodeConstructor$1(nativeOfflineAudioContext, name);
			renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeOutputNodes === null ? nativeAudioWorkletNode : nativeOutputNodes[2]);
			if (nativeOutputNodes !== null) {
				if (processedBufferPromise === null) {
					if (processorConstructor === void 0) throw new Error("Missing the processor constructor.");
					if (nativeOfflineAudioContextConstructor$1 === null) throw new Error("Missing the native OfflineAudioContext constructor.");
					const numberOfInputChannels = proxy.channelCount * proxy.numberOfInputs;
					const numberOfParameters = processorConstructor.parameterDescriptors === void 0 ? 0 : processorConstructor.parameterDescriptors.length;
					const numberOfChannels = numberOfInputChannels + numberOfParameters;
					const renderBuffer = async () => {
						const partialOfflineAudioContext = new nativeOfflineAudioContextConstructor$1(numberOfChannels, Math.ceil(proxy.context.length / 128) * 128, nativeOfflineAudioContext.sampleRate);
						const gainNodes = [];
						const inputChannelSplitterNodes = [];
						for (let i = 0; i < options.numberOfInputs; i += 1) {
							gainNodes.push(createNativeGainNode$1(partialOfflineAudioContext, {
								channelCount: options.channelCount,
								channelCountMode: options.channelCountMode,
								channelInterpretation: options.channelInterpretation,
								gain: 1
							}));
							inputChannelSplitterNodes.push(createNativeChannelSplitterNode$1(partialOfflineAudioContext, {
								channelCount: options.channelCount,
								channelCountMode: "explicit",
								channelInterpretation: "discrete",
								numberOfOutputs: options.channelCount
							}));
						}
						const constantSourceNodes = await Promise.all(Array.from(proxy.parameters.values()).map(async (audioParam) => {
							const constantSourceNode = createNativeConstantSourceNode$1(partialOfflineAudioContext, {
								channelCount: 1,
								channelCountMode: "explicit",
								channelInterpretation: "discrete",
								offset: audioParam.value
							});
							await renderAutomation$1(partialOfflineAudioContext, audioParam, constantSourceNode.offset);
							return constantSourceNode;
						}));
						const inputChannelMergerNode = createNativeChannelMergerNode$1(partialOfflineAudioContext, {
							channelCount: 1,
							channelCountMode: "explicit",
							channelInterpretation: "speakers",
							numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
						});
						for (let i = 0; i < options.numberOfInputs; i += 1) {
							gainNodes[i].connect(inputChannelSplitterNodes[i]);
							for (let j = 0; j < options.channelCount; j += 1) inputChannelSplitterNodes[i].connect(inputChannelMergerNode, j, i * options.channelCount + j);
						}
						for (const [index, constantSourceNode] of constantSourceNodes.entries()) {
							constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
							constantSourceNode.start(0);
						}
						inputChannelMergerNode.connect(partialOfflineAudioContext.destination);
						await Promise.all(gainNodes.map((gainNode) => renderInputsOfAudioNode$1(proxy, partialOfflineAudioContext, gainNode)));
						return renderNativeOfflineAudioContext$1(partialOfflineAudioContext);
					};
					processedBufferPromise = processBuffer(proxy, numberOfChannels === 0 ? null : await renderBuffer(), nativeOfflineAudioContext, options, outputChannelCount, processorConstructor, exposeCurrentFrameAndCurrentTime$1);
				}
				const processedBuffer = await processedBufferPromise;
				const audioBufferSourceNode = createNativeAudioBufferSourceNode$1(nativeOfflineAudioContext, {
					buffer: null,
					channelCount: 2,
					channelCountMode: "max",
					channelInterpretation: "speakers",
					loop: false,
					loopEnd: 0,
					loopStart: 0,
					playbackRate: 1
				});
				const [outputChannelSplitterNode, outputChannelMergerNodes, outputGainNode] = nativeOutputNodes;
				if (processedBuffer !== null) {
					audioBufferSourceNode.buffer = processedBuffer;
					audioBufferSourceNode.start(0);
				}
				audioBufferSourceNode.connect(outputChannelSplitterNode);
				for (let i = 0, outputChannelSplitterNodeOutput = 0; i < proxy.numberOfOutputs; i += 1) {
					const outputChannelMergerNode = outputChannelMergerNodes[i];
					for (let j = 0; j < outputChannelCount[i]; j += 1) outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
					outputChannelSplitterNodeOutput += outputChannelCount[i];
				}
				return outputGainNode;
			}
			if (!nativeAudioWorkletNodeIsOwnedByContext) for (const [nm, audioParam] of proxy.parameters.entries()) await renderAutomation$1(nativeOfflineAudioContext, audioParam, nativeAudioWorkletNode.parameters.get(nm));
			else for (const [nm, audioParam] of proxy.parameters.entries()) await connectAudioParam$1(nativeOfflineAudioContext, audioParam, nativeAudioWorkletNode.parameters.get(nm));
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeAudioWorkletNode);
			return nativeAudioWorkletNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			deleteUnrenderedAudioWorkletNode$1(nativeOfflineAudioContext, proxy);
			const renderedNativeAudioWorkletNodeOrGainNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
			if (renderedNativeAudioWorkletNodeOrGainNode !== void 0) return Promise.resolve(renderedNativeAudioWorkletNodeOrGainNode);
			return createAudioNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/base-audio-context-constructor.js
const createBaseAudioContextConstructor = (addAudioWorkletModule$1, analyserNodeConstructor$1, audioBufferConstructor$1, audioBufferSourceNodeConstructor$1, biquadFilterNodeConstructor$1, channelMergerNodeConstructor$1, channelSplitterNodeConstructor$1, constantSourceNodeConstructor$1, convolverNodeConstructor$1, decodeAudioData$1, delayNodeConstructor$1, dynamicsCompressorNodeConstructor$1, gainNodeConstructor$1, iIRFilterNodeConstructor$1, minimalBaseAudioContextConstructor$1, oscillatorNodeConstructor$1, pannerNodeConstructor$1, periodicWaveConstructor$1, stereoPannerNodeConstructor$1, waveShaperNodeConstructor$1) => {
	return class BaseAudioContext extends minimalBaseAudioContextConstructor$1 {
		constructor(_nativeContext, numberOfChannels) {
			super(_nativeContext, numberOfChannels);
			this._nativeContext = _nativeContext;
			this._audioWorklet = addAudioWorkletModule$1 === void 0 ? void 0 : { addModule: (moduleURL, options) => {
				return addAudioWorkletModule$1(this, moduleURL, options);
			} };
		}
		get audioWorklet() {
			return this._audioWorklet;
		}
		createAnalyser() {
			return new analyserNodeConstructor$1(this);
		}
		createBiquadFilter() {
			return new biquadFilterNodeConstructor$1(this);
		}
		createBuffer(numberOfChannels, length, sampleRate) {
			return new audioBufferConstructor$1({
				length,
				numberOfChannels,
				sampleRate
			});
		}
		createBufferSource() {
			return new audioBufferSourceNodeConstructor$1(this);
		}
		createChannelMerger(numberOfInputs = 6) {
			return new channelMergerNodeConstructor$1(this, { numberOfInputs });
		}
		createChannelSplitter(numberOfOutputs = 6) {
			return new channelSplitterNodeConstructor$1(this, { numberOfOutputs });
		}
		createConstantSource() {
			return new constantSourceNodeConstructor$1(this);
		}
		createConvolver() {
			return new convolverNodeConstructor$1(this);
		}
		createDelay(maxDelayTime = 1) {
			return new delayNodeConstructor$1(this, { maxDelayTime });
		}
		createDynamicsCompressor() {
			return new dynamicsCompressorNodeConstructor$1(this);
		}
		createGain() {
			return new gainNodeConstructor$1(this);
		}
		createIIRFilter(feedforward, feedback) {
			return new iIRFilterNodeConstructor$1(this, {
				feedback,
				feedforward
			});
		}
		createOscillator() {
			return new oscillatorNodeConstructor$1(this);
		}
		createPanner() {
			return new pannerNodeConstructor$1(this);
		}
		createPeriodicWave(real, imag, constraints = { disableNormalization: false }) {
			return new periodicWaveConstructor$1(this, {
				...constraints,
				imag,
				real
			});
		}
		createStereoPanner() {
			return new stereoPannerNodeConstructor$1(this);
		}
		createWaveShaper() {
			return new waveShaperNodeConstructor$1(this);
		}
		decodeAudioData(audioData, successCallback, errorCallback) {
			return decodeAudioData$1(this._nativeContext, audioData).then((audioBuffer) => {
				if (typeof successCallback === "function") successCallback(audioBuffer);
				return audioBuffer;
			}, (err) => {
				if (typeof errorCallback === "function") errorCallback(err);
				throw err;
			});
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/biquad-filter-node-constructor.js
var DEFAULT_OPTIONS$16 = {
	Q: 1,
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	detune: 0,
	frequency: 350,
	gain: 0,
	type: "lowpass"
};
const createBiquadFilterNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createBiquadFilterNodeRenderer$1, createInvalidAccessError$1, createNativeBiquadFilterNode$1, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class BiquadFilterNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeBiquadFilterNode = createNativeBiquadFilterNode$1(nativeContext, {
				...DEFAULT_OPTIONS$16,
				...options
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const biquadFilterNodeRenderer = isOffline ? createBiquadFilterNodeRenderer$1() : null;
			super(context, false, nativeBiquadFilterNode, biquadFilterNodeRenderer);
			this._Q = createAudioParam$1(this, isOffline, nativeBiquadFilterNode.Q, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._detune = createAudioParam$1(this, isOffline, nativeBiquadFilterNode.detune, 1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT), -1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT));
			this._frequency = createAudioParam$1(this, isOffline, nativeBiquadFilterNode.frequency, context.sampleRate / 2, 0);
			this._gain = createAudioParam$1(this, isOffline, nativeBiquadFilterNode.gain, 40 * Math.log10(MOST_POSITIVE_SINGLE_FLOAT), MOST_NEGATIVE_SINGLE_FLOAT);
			this._nativeBiquadFilterNode = nativeBiquadFilterNode;
			setAudioNodeTailTime$1(this, 1);
		}
		get detune() {
			return this._detune;
		}
		get frequency() {
			return this._frequency;
		}
		get gain() {
			return this._gain;
		}
		get Q() {
			return this._Q;
		}
		get type() {
			return this._nativeBiquadFilterNode.type;
		}
		set type(value) {
			this._nativeBiquadFilterNode.type = value;
		}
		getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
			try {
				this._nativeBiquadFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
			} catch (err) {
				if (err.code === 11) throw createInvalidAccessError$1();
				throw err;
			}
			if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) throw createInvalidAccessError$1();
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/biquad-filter-node-renderer-factory.js
const createBiquadFilterNodeRendererFactory = (connectAudioParam$1, createNativeBiquadFilterNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeBiquadFilterNodes = /* @__PURE__ */ new WeakMap();
		const createBiquadFilterNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeBiquadFilterNode = getNativeAudioNode$1(proxy);
			const nativeBiquadFilterNodeIsOwnedByContext = isOwnedByContext(nativeBiquadFilterNode, nativeOfflineAudioContext);
			if (!nativeBiquadFilterNodeIsOwnedByContext) nativeBiquadFilterNode = createNativeBiquadFilterNode$1(nativeOfflineAudioContext, {
				Q: nativeBiquadFilterNode.Q.value,
				channelCount: nativeBiquadFilterNode.channelCount,
				channelCountMode: nativeBiquadFilterNode.channelCountMode,
				channelInterpretation: nativeBiquadFilterNode.channelInterpretation,
				detune: nativeBiquadFilterNode.detune.value,
				frequency: nativeBiquadFilterNode.frequency.value,
				gain: nativeBiquadFilterNode.gain.value,
				type: nativeBiquadFilterNode.type
			});
			renderedNativeBiquadFilterNodes.set(nativeOfflineAudioContext, nativeBiquadFilterNode);
			if (!nativeBiquadFilterNodeIsOwnedByContext) {
				await renderAutomation$1(nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain);
			} else {
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain);
			}
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeBiquadFilterNode);
			return nativeBiquadFilterNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeBiquadFilterNode = renderedNativeBiquadFilterNodes.get(nativeOfflineAudioContext);
			if (renderedNativeBiquadFilterNode !== void 0) return Promise.resolve(renderedNativeBiquadFilterNode);
			return createBiquadFilterNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/cache-test-result.js
const createCacheTestResult = (ongoingTests, testResults) => {
	return (tester, test) => {
		const cachedTestResult = testResults.get(tester);
		if (cachedTestResult !== void 0) return cachedTestResult;
		const ongoingTest = ongoingTests.get(tester);
		if (ongoingTest !== void 0) return ongoingTest;
		try {
			const synchronousTestResult = test();
			if (synchronousTestResult instanceof Promise) {
				ongoingTests.set(tester, synchronousTestResult);
				return synchronousTestResult.catch(() => false).then((finalTestResult) => {
					ongoingTests.delete(tester);
					testResults.set(tester, finalTestResult);
					return finalTestResult;
				});
			}
			testResults.set(tester, synchronousTestResult);
			return synchronousTestResult;
		} catch {
			testResults.set(tester, false);
			return false;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/channel-merger-node-constructor.js
var DEFAULT_OPTIONS$15 = {
	channelCount: 1,
	channelCountMode: "explicit",
	channelInterpretation: "speakers",
	numberOfInputs: 6
};
const createChannelMergerNodeConstructor = (audioNodeConstructor$1, createChannelMergerNodeRenderer, createNativeChannelMergerNode$1, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class ChannelMergerNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeChannelMergerNode = createNativeChannelMergerNode$1(nativeContext, {
				...DEFAULT_OPTIONS$15,
				...options
			});
			const channelMergerNodeRenderer = isNativeOfflineAudioContext$1(nativeContext) ? createChannelMergerNodeRenderer() : null;
			super(context, false, nativeChannelMergerNode, channelMergerNodeRenderer);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/channel-merger-node-renderer-factory.js
const createChannelMergerNodeRendererFactory = (createNativeChannelMergerNode$1, getNativeAudioNode$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeAudioNodes = /* @__PURE__ */ new WeakMap();
		const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeAudioNode = getNativeAudioNode$1(proxy);
			if (!isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) nativeAudioNode = createNativeChannelMergerNode$1(nativeOfflineAudioContext, {
				channelCount: nativeAudioNode.channelCount,
				channelCountMode: nativeAudioNode.channelCountMode,
				channelInterpretation: nativeAudioNode.channelInterpretation,
				numberOfInputs: nativeAudioNode.numberOfInputs
			});
			renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioNode);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeAudioNode);
			return nativeAudioNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
			if (renderedNativeAudioNode !== void 0) return Promise.resolve(renderedNativeAudioNode);
			return createAudioNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/channel-splitter-node-constructor.js
var DEFAULT_OPTIONS$14 = {
	channelCount: 6,
	channelCountMode: "explicit",
	channelInterpretation: "discrete",
	numberOfOutputs: 6
};
const createChannelSplitterNodeConstructor = (audioNodeConstructor$1, createChannelSplitterNodeRenderer, createNativeChannelSplitterNode$1, getNativeContext$1, isNativeOfflineAudioContext$1, sanitizeChannelSplitterOptions$1) => {
	return class ChannelSplitterNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeChannelSplitterNode = createNativeChannelSplitterNode$1(nativeContext, sanitizeChannelSplitterOptions$1({
				...DEFAULT_OPTIONS$14,
				...options
			}));
			const channelSplitterNodeRenderer = isNativeOfflineAudioContext$1(nativeContext) ? createChannelSplitterNodeRenderer() : null;
			super(context, false, nativeChannelSplitterNode, channelSplitterNodeRenderer);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/channel-splitter-node-renderer-factory.js
const createChannelSplitterNodeRendererFactory = (createNativeChannelSplitterNode$1, getNativeAudioNode$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeAudioNodes = /* @__PURE__ */ new WeakMap();
		const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeAudioNode = getNativeAudioNode$1(proxy);
			if (!isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) nativeAudioNode = createNativeChannelSplitterNode$1(nativeOfflineAudioContext, {
				channelCount: nativeAudioNode.channelCount,
				channelCountMode: nativeAudioNode.channelCountMode,
				channelInterpretation: nativeAudioNode.channelInterpretation,
				numberOfOutputs: nativeAudioNode.numberOfOutputs
			});
			renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioNode);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeAudioNode);
			return nativeAudioNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
			if (renderedNativeAudioNode !== void 0) return Promise.resolve(renderedNativeAudioNode);
			return createAudioNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/connect-audio-param.js
const createConnectAudioParam = (renderInputsOfAudioParam$1) => {
	return (nativeOfflineAudioContext, audioParam, nativeAudioParam) => {
		return renderInputsOfAudioParam$1(audioParam, nativeOfflineAudioContext, nativeAudioParam);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/connect-multiple-outputs.js
const createConnectMultipleOutputs = (createIndexSizeError$1) => {
	return (outputAudioNodes, destination, output = 0, input = 0) => {
		const outputAudioNode = outputAudioNodes[output];
		if (outputAudioNode === void 0) throw createIndexSizeError$1();
		if (isNativeAudioNode$1(destination)) return outputAudioNode.connect(destination, 0, input);
		return outputAudioNode.connect(destination, 0);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/connected-native-audio-buffer-source-node-factory.js
const createConnectedNativeAudioBufferSourceNodeFactory = (createNativeAudioBufferSourceNode$1) => {
	return (nativeContext, nativeAudioNode) => {
		const nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode$1(nativeContext, {
			buffer: null,
			channelCount: 2,
			channelCountMode: "max",
			channelInterpretation: "speakers",
			loop: false,
			loopEnd: 0,
			loopStart: 0,
			playbackRate: 1
		});
		nativeAudioBufferSourceNode.buffer = nativeContext.createBuffer(1, 2, 44100);
		nativeAudioBufferSourceNode.loop = true;
		nativeAudioBufferSourceNode.connect(nativeAudioNode);
		nativeAudioBufferSourceNode.start();
		return () => {
			nativeAudioBufferSourceNode.stop();
			nativeAudioBufferSourceNode.disconnect(nativeAudioNode);
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/constant-source-node-constructor.js
var DEFAULT_OPTIONS$13 = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	offset: 1
};
const createConstantSourceNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createConstantSourceNodeRendererFactory$1, createNativeConstantSourceNode$1, getNativeContext$1, isNativeOfflineAudioContext$1, wrapEventListener$1) => {
	return class ConstantSourceNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeConstantSourceNode = createNativeConstantSourceNode$1(nativeContext, {
				...DEFAULT_OPTIONS$13,
				...options
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const constantSourceNodeRenderer = isOffline ? createConstantSourceNodeRendererFactory$1() : null;
			super(context, false, nativeConstantSourceNode, constantSourceNodeRenderer);
			this._constantSourceNodeRenderer = constantSourceNodeRenderer;
			this._nativeConstantSourceNode = nativeConstantSourceNode;
			this._offset = createAudioParam$1(this, isOffline, nativeConstantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._onended = null;
		}
		get offset() {
			return this._offset;
		}
		get onended() {
			return this._onended;
		}
		set onended(value) {
			const wrappedListener = typeof value === "function" ? wrapEventListener$1(this, value) : null;
			this._nativeConstantSourceNode.onended = wrappedListener;
			const nativeOnEnded = this._nativeConstantSourceNode.onended;
			this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
		}
		start(when = 0) {
			this._nativeConstantSourceNode.start(when);
			if (this._constantSourceNodeRenderer !== null) this._constantSourceNodeRenderer.start = when;
			if (this.context.state !== "closed") {
				setInternalStateToActive(this);
				const resetInternalStateToPassive = () => {
					this._nativeConstantSourceNode.removeEventListener("ended", resetInternalStateToPassive);
					if (isActiveAudioNode(this)) setInternalStateToPassive(this);
				};
				this._nativeConstantSourceNode.addEventListener("ended", resetInternalStateToPassive);
			}
		}
		stop(when = 0) {
			this._nativeConstantSourceNode.stop(when);
			if (this._constantSourceNodeRenderer !== null) this._constantSourceNodeRenderer.stop = when;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/constant-source-node-renderer-factory.js
const createConstantSourceNodeRendererFactory = (connectAudioParam$1, createNativeConstantSourceNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeConstantSourceNodes = /* @__PURE__ */ new WeakMap();
		let start = null;
		let stop = null;
		const createConstantSourceNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeConstantSourceNode = getNativeAudioNode$1(proxy);
			const nativeConstantSourceNodeIsOwnedByContext = isOwnedByContext(nativeConstantSourceNode, nativeOfflineAudioContext);
			if (!nativeConstantSourceNodeIsOwnedByContext) {
				nativeConstantSourceNode = createNativeConstantSourceNode$1(nativeOfflineAudioContext, {
					channelCount: nativeConstantSourceNode.channelCount,
					channelCountMode: nativeConstantSourceNode.channelCountMode,
					channelInterpretation: nativeConstantSourceNode.channelInterpretation,
					offset: nativeConstantSourceNode.offset.value
				});
				if (start !== null) nativeConstantSourceNode.start(start);
				if (stop !== null) nativeConstantSourceNode.stop(stop);
			}
			renderedNativeConstantSourceNodes.set(nativeOfflineAudioContext, nativeConstantSourceNode);
			if (!nativeConstantSourceNodeIsOwnedByContext) await renderAutomation$1(nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset);
			else await connectAudioParam$1(nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeConstantSourceNode);
			return nativeConstantSourceNode;
		};
		return {
			set start(value) {
				start = value;
			},
			set stop(value) {
				stop = value;
			},
			render(proxy, nativeOfflineAudioContext) {
				const renderedNativeConstantSourceNode = renderedNativeConstantSourceNodes.get(nativeOfflineAudioContext);
				if (renderedNativeConstantSourceNode !== void 0) return Promise.resolve(renderedNativeConstantSourceNode);
				return createConstantSourceNode(proxy, nativeOfflineAudioContext);
			}
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/convert-number-to-unsigned-long.js
const createConvertNumberToUnsignedLong = (unit32Array) => {
	return (value) => {
		unit32Array[0] = value;
		return unit32Array[0];
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/convolver-node-constructor.js
var DEFAULT_OPTIONS$12 = {
	buffer: null,
	channelCount: 2,
	channelCountMode: "clamped-max",
	channelInterpretation: "speakers",
	disableNormalization: false
};
const createConvolverNodeConstructor = (audioNodeConstructor$1, createConvolverNodeRenderer, createNativeConvolverNode$1, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class ConvolverNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const mergedOptions = {
				...DEFAULT_OPTIONS$12,
				...options
			};
			const nativeConvolverNode = createNativeConvolverNode$1(nativeContext, mergedOptions);
			const convolverNodeRenderer = isNativeOfflineAudioContext$1(nativeContext) ? createConvolverNodeRenderer() : null;
			super(context, false, nativeConvolverNode, convolverNodeRenderer);
			this._isBufferNullified = false;
			this._nativeConvolverNode = nativeConvolverNode;
			if (mergedOptions.buffer !== null) setAudioNodeTailTime$1(this, mergedOptions.buffer.duration);
		}
		get buffer() {
			if (this._isBufferNullified) return null;
			return this._nativeConvolverNode.buffer;
		}
		set buffer(value) {
			this._nativeConvolverNode.buffer = value;
			if (value === null && this._nativeConvolverNode.buffer !== null) {
				const nativeContext = this._nativeConvolverNode.context;
				this._nativeConvolverNode.buffer = nativeContext.createBuffer(1, 1, nativeContext.sampleRate);
				this._isBufferNullified = true;
				setAudioNodeTailTime$1(this, 0);
			} else {
				this._isBufferNullified = false;
				setAudioNodeTailTime$1(this, this._nativeConvolverNode.buffer === null ? 0 : this._nativeConvolverNode.buffer.duration);
			}
		}
		get normalize() {
			return this._nativeConvolverNode.normalize;
		}
		set normalize(value) {
			this._nativeConvolverNode.normalize = value;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/convolver-node-renderer-factory.js
const createConvolverNodeRendererFactory = (createNativeConvolverNode$1, getNativeAudioNode$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeConvolverNodes = /* @__PURE__ */ new WeakMap();
		const createConvolverNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeConvolverNode = getNativeAudioNode$1(proxy);
			if (!isOwnedByContext(nativeConvolverNode, nativeOfflineAudioContext)) nativeConvolverNode = createNativeConvolverNode$1(nativeOfflineAudioContext, {
				buffer: nativeConvolverNode.buffer,
				channelCount: nativeConvolverNode.channelCount,
				channelCountMode: nativeConvolverNode.channelCountMode,
				channelInterpretation: nativeConvolverNode.channelInterpretation,
				disableNormalization: !nativeConvolverNode.normalize
			});
			renderedNativeConvolverNodes.set(nativeOfflineAudioContext, nativeConvolverNode);
			if (isNativeAudioNodeFaker(nativeConvolverNode)) await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeConvolverNode.inputs[0]);
			else await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeConvolverNode);
			return nativeConvolverNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeConvolverNode = renderedNativeConvolverNodes.get(nativeOfflineAudioContext);
			if (renderedNativeConvolverNode !== void 0) return Promise.resolve(renderedNativeConvolverNode);
			return createConvolverNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/create-native-offline-audio-context.js
const createCreateNativeOfflineAudioContext = (createNotSupportedError$1, nativeOfflineAudioContextConstructor$1) => {
	return (numberOfChannels, length, sampleRate) => {
		if (nativeOfflineAudioContextConstructor$1 === null) throw new Error("Missing the native OfflineAudioContext constructor.");
		try {
			return new nativeOfflineAudioContextConstructor$1(numberOfChannels, length, sampleRate);
		} catch (err) {
			if (err.name === "SyntaxError") throw createNotSupportedError$1();
			throw err;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/data-clone-error.js
const createDataCloneError = () => new DOMException("", "DataCloneError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/detach-array-buffer.js
const detachArrayBuffer = (arrayBuffer) => {
	const { port1, port2 } = new MessageChannel();
	return new Promise((resolve) => {
		const closeAndResolve = () => {
			port2.onmessage = null;
			port1.close();
			port2.close();
			resolve();
		};
		port2.onmessage = () => closeAndResolve();
		try {
			port1.postMessage(arrayBuffer, [arrayBuffer]);
		} catch {} finally {
			closeAndResolve();
		}
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/decode-audio-data.js
const createDecodeAudioData = (audioBufferStore$1, cacheTestResult$1, createDataCloneError$1, createEncodingError$1, detachedArrayBuffers, getNativeContext$1, isNativeContext$1, testAudioBufferCopyChannelMethodsOutOfBoundsSupport$1, testPromiseSupport$1, wrapAudioBufferCopyChannelMethods$1, wrapAudioBufferCopyChannelMethodsOutOfBounds$1) => {
	return (anyContext, audioData) => {
		const nativeContext = isNativeContext$1(anyContext) ? anyContext : getNativeContext$1(anyContext);
		if (detachedArrayBuffers.has(audioData)) {
			const err = createDataCloneError$1();
			return Promise.reject(err);
		}
		try {
			detachedArrayBuffers.add(audioData);
		} catch {}
		if (cacheTestResult$1(testPromiseSupport$1, () => testPromiseSupport$1(nativeContext))) return nativeContext.decodeAudioData(audioData).then((audioBuffer) => {
			detachArrayBuffer(audioData).catch(() => {});
			if (!cacheTestResult$1(testAudioBufferCopyChannelMethodsOutOfBoundsSupport$1, () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport$1(audioBuffer))) wrapAudioBufferCopyChannelMethodsOutOfBounds$1(audioBuffer);
			audioBufferStore$1.add(audioBuffer);
			return audioBuffer;
		});
		return new Promise((resolve, reject) => {
			const complete = async () => {
				try {
					await detachArrayBuffer(audioData);
				} catch {}
			};
			const fail = (err) => {
				reject(err);
				complete();
			};
			try {
				nativeContext.decodeAudioData(audioData, (audioBuffer) => {
					if (typeof audioBuffer.copyFromChannel !== "function") {
						wrapAudioBufferCopyChannelMethods$1(audioBuffer);
						wrapAudioBufferGetChannelDataMethod(audioBuffer);
					}
					audioBufferStore$1.add(audioBuffer);
					complete().then(() => resolve(audioBuffer));
				}, (err) => {
					if (err === null) fail(createEncodingError$1());
					else fail(err);
				});
			} catch (err) {
				fail(err);
			}
		});
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/decrement-cycle-counter.js
const createDecrementCycleCounter = (connectNativeAudioNodeToNativeAudioNode$1, cycleCounters, getAudioNodeConnections$1, getNativeAudioNode$1, getNativeAudioParam$1, getNativeContext$1, isActiveAudioNode$1, isNativeOfflineAudioContext$1) => {
	return (audioNode, count) => {
		const cycleCounter = cycleCounters.get(audioNode);
		if (cycleCounter === void 0) throw new Error("Missing the expected cycle count.");
		const isOffline = isNativeOfflineAudioContext$1(getNativeContext$1(audioNode.context));
		if (cycleCounter === count) {
			cycleCounters.delete(audioNode);
			if (!isOffline && isActiveAudioNode$1(audioNode)) {
				const nativeSourceAudioNode = getNativeAudioNode$1(audioNode);
				const { outputs } = getAudioNodeConnections$1(audioNode);
				for (const output of outputs) if (isAudioNodeOutputConnection(output)) connectNativeAudioNodeToNativeAudioNode$1(nativeSourceAudioNode, getNativeAudioNode$1(output[0]), output[1], output[2]);
				else {
					const nativeDestinationAudioParam = getNativeAudioParam$1(output[0]);
					nativeSourceAudioNode.connect(nativeDestinationAudioParam, output[1]);
				}
			}
		} else cycleCounters.set(audioNode, cycleCounter - count);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/delay-node-constructor.js
var DEFAULT_OPTIONS$11 = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	delayTime: 0,
	maxDelayTime: 1
};
const createDelayNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createDelayNodeRenderer, createNativeDelayNode$1, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class DelayNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const mergedOptions = {
				...DEFAULT_OPTIONS$11,
				...options
			};
			const nativeDelayNode = createNativeDelayNode$1(nativeContext, mergedOptions);
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const delayNodeRenderer = isOffline ? createDelayNodeRenderer(mergedOptions.maxDelayTime) : null;
			super(context, false, nativeDelayNode, delayNodeRenderer);
			this._delayTime = createAudioParam$1(this, isOffline, nativeDelayNode.delayTime);
			setAudioNodeTailTime$1(this, mergedOptions.maxDelayTime);
		}
		get delayTime() {
			return this._delayTime;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/delay-node-renderer-factory.js
const createDelayNodeRendererFactory = (connectAudioParam$1, createNativeDelayNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return (maxDelayTime) => {
		const renderedNativeDelayNodes = /* @__PURE__ */ new WeakMap();
		const createDelayNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeDelayNode = getNativeAudioNode$1(proxy);
			const nativeDelayNodeIsOwnedByContext = isOwnedByContext(nativeDelayNode, nativeOfflineAudioContext);
			if (!nativeDelayNodeIsOwnedByContext) nativeDelayNode = createNativeDelayNode$1(nativeOfflineAudioContext, {
				channelCount: nativeDelayNode.channelCount,
				channelCountMode: nativeDelayNode.channelCountMode,
				channelInterpretation: nativeDelayNode.channelInterpretation,
				delayTime: nativeDelayNode.delayTime.value,
				maxDelayTime
			});
			renderedNativeDelayNodes.set(nativeOfflineAudioContext, nativeDelayNode);
			if (!nativeDelayNodeIsOwnedByContext) await renderAutomation$1(nativeOfflineAudioContext, proxy.delayTime, nativeDelayNode.delayTime);
			else await connectAudioParam$1(nativeOfflineAudioContext, proxy.delayTime, nativeDelayNode.delayTime);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeDelayNode);
			return nativeDelayNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeDelayNode = renderedNativeDelayNodes.get(nativeOfflineAudioContext);
			if (renderedNativeDelayNode !== void 0) return Promise.resolve(renderedNativeDelayNode);
			return createDelayNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/delete-active-input-connection-to-audio-node.js
const createDeleteActiveInputConnectionToAudioNode = (pickElementFromSet$1) => {
	return (activeInputs, source, output, input) => {
		return pickElementFromSet$1(activeInputs[input], (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/delete-unrendered-audio-worklet-node.js
const createDeleteUnrenderedAudioWorkletNode = (getUnrenderedAudioWorkletNodes$1) => {
	return (nativeContext, audioWorkletNode) => {
		getUnrenderedAudioWorkletNodes$1(nativeContext).delete(audioWorkletNode);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/guards/delay-node.js
const isDelayNode = (audioNode) => {
	return "delayTime" in audioNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/detect-cycles.js
const createDetectCycles = (audioParamAudioNodeStore$1, getAudioNodeConnections$1, getValueForKey$1) => {
	return function detectCycles(chain, nextLink) {
		const audioNode = isAudioNode(nextLink) ? nextLink : getValueForKey$1(audioParamAudioNodeStore$1, nextLink);
		if (isDelayNode(audioNode)) return [];
		if (chain[0] === audioNode) return [chain];
		if (chain.includes(audioNode)) return [];
		const { outputs } = getAudioNodeConnections$1(audioNode);
		return Array.from(outputs).map((outputConnection) => detectCycles([...chain, audioNode], outputConnection[0])).reduce((mergedCycles, nestedCycles) => mergedCycles.concat(nestedCycles), []);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/disconnect-multiple-outputs.js
var getOutputAudioNodeAtIndex = (createIndexSizeError$1, outputAudioNodes, output) => {
	const outputAudioNode = outputAudioNodes[output];
	if (outputAudioNode === void 0) throw createIndexSizeError$1();
	return outputAudioNode;
};
const createDisconnectMultipleOutputs = (createIndexSizeError$1) => {
	return (outputAudioNodes, destinationOrOutput = void 0, output = void 0, input = 0) => {
		if (destinationOrOutput === void 0) return outputAudioNodes.forEach((outputAudioNode) => outputAudioNode.disconnect());
		if (typeof destinationOrOutput === "number") return getOutputAudioNodeAtIndex(createIndexSizeError$1, outputAudioNodes, destinationOrOutput).disconnect();
		if (isNativeAudioNode$1(destinationOrOutput)) {
			if (output === void 0) return outputAudioNodes.forEach((outputAudioNode) => outputAudioNode.disconnect(destinationOrOutput));
			if (input === void 0) return getOutputAudioNodeAtIndex(createIndexSizeError$1, outputAudioNodes, output).disconnect(destinationOrOutput, 0);
			return getOutputAudioNodeAtIndex(createIndexSizeError$1, outputAudioNodes, output).disconnect(destinationOrOutput, 0, input);
		}
		if (output === void 0) return outputAudioNodes.forEach((outputAudioNode) => outputAudioNode.disconnect(destinationOrOutput));
		return getOutputAudioNodeAtIndex(createIndexSizeError$1, outputAudioNodes, output).disconnect(destinationOrOutput, 0);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/dynamics-compressor-node-constructor.js
var DEFAULT_OPTIONS$10 = {
	attack: .003,
	channelCount: 2,
	channelCountMode: "clamped-max",
	channelInterpretation: "speakers",
	knee: 30,
	ratio: 12,
	release: .25,
	threshold: -24
};
const createDynamicsCompressorNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createDynamicsCompressorNodeRenderer, createNativeDynamicsCompressorNode$1, createNotSupportedError$1, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class DynamicsCompressorNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeDynamicsCompressorNode = createNativeDynamicsCompressorNode$1(nativeContext, {
				...DEFAULT_OPTIONS$10,
				...options
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const dynamicsCompressorNodeRenderer = isOffline ? createDynamicsCompressorNodeRenderer() : null;
			super(context, false, nativeDynamicsCompressorNode, dynamicsCompressorNodeRenderer);
			this._attack = createAudioParam$1(this, isOffline, nativeDynamicsCompressorNode.attack);
			this._knee = createAudioParam$1(this, isOffline, nativeDynamicsCompressorNode.knee);
			this._nativeDynamicsCompressorNode = nativeDynamicsCompressorNode;
			this._ratio = createAudioParam$1(this, isOffline, nativeDynamicsCompressorNode.ratio);
			this._release = createAudioParam$1(this, isOffline, nativeDynamicsCompressorNode.release);
			this._threshold = createAudioParam$1(this, isOffline, nativeDynamicsCompressorNode.threshold);
			setAudioNodeTailTime$1(this, .006);
		}
		get attack() {
			return this._attack;
		}
		get channelCount() {
			return this._nativeDynamicsCompressorNode.channelCount;
		}
		set channelCount(value) {
			const previousChannelCount = this._nativeDynamicsCompressorNode.channelCount;
			this._nativeDynamicsCompressorNode.channelCount = value;
			if (value > 2) {
				this._nativeDynamicsCompressorNode.channelCount = previousChannelCount;
				throw createNotSupportedError$1();
			}
		}
		get channelCountMode() {
			return this._nativeDynamicsCompressorNode.channelCountMode;
		}
		set channelCountMode(value) {
			const previousChannelCount = this._nativeDynamicsCompressorNode.channelCountMode;
			this._nativeDynamicsCompressorNode.channelCountMode = value;
			if (value === "max") {
				this._nativeDynamicsCompressorNode.channelCountMode = previousChannelCount;
				throw createNotSupportedError$1();
			}
		}
		get knee() {
			return this._knee;
		}
		get ratio() {
			return this._ratio;
		}
		get reduction() {
			if (typeof this._nativeDynamicsCompressorNode.reduction.value === "number") return this._nativeDynamicsCompressorNode.reduction.value;
			return this._nativeDynamicsCompressorNode.reduction;
		}
		get release() {
			return this._release;
		}
		get threshold() {
			return this._threshold;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/dynamics-compressor-node-renderer-factory.js
const createDynamicsCompressorNodeRendererFactory = (connectAudioParam$1, createNativeDynamicsCompressorNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeDynamicsCompressorNodes = /* @__PURE__ */ new WeakMap();
		const createDynamicsCompressorNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeDynamicsCompressorNode = getNativeAudioNode$1(proxy);
			const nativeDynamicsCompressorNodeIsOwnedByContext = isOwnedByContext(nativeDynamicsCompressorNode, nativeOfflineAudioContext);
			if (!nativeDynamicsCompressorNodeIsOwnedByContext) nativeDynamicsCompressorNode = createNativeDynamicsCompressorNode$1(nativeOfflineAudioContext, {
				attack: nativeDynamicsCompressorNode.attack.value,
				channelCount: nativeDynamicsCompressorNode.channelCount,
				channelCountMode: nativeDynamicsCompressorNode.channelCountMode,
				channelInterpretation: nativeDynamicsCompressorNode.channelInterpretation,
				knee: nativeDynamicsCompressorNode.knee.value,
				ratio: nativeDynamicsCompressorNode.ratio.value,
				release: nativeDynamicsCompressorNode.release.value,
				threshold: nativeDynamicsCompressorNode.threshold.value
			});
			renderedNativeDynamicsCompressorNodes.set(nativeOfflineAudioContext, nativeDynamicsCompressorNode);
			if (!nativeDynamicsCompressorNodeIsOwnedByContext) {
				await renderAutomation$1(nativeOfflineAudioContext, proxy.attack, nativeDynamicsCompressorNode.attack);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.knee, nativeDynamicsCompressorNode.knee);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.ratio, nativeDynamicsCompressorNode.ratio);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.release, nativeDynamicsCompressorNode.release);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.threshold, nativeDynamicsCompressorNode.threshold);
			} else {
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.attack, nativeDynamicsCompressorNode.attack);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.knee, nativeDynamicsCompressorNode.knee);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.ratio, nativeDynamicsCompressorNode.ratio);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.release, nativeDynamicsCompressorNode.release);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.threshold, nativeDynamicsCompressorNode.threshold);
			}
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeDynamicsCompressorNode);
			return nativeDynamicsCompressorNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeDynamicsCompressorNode = renderedNativeDynamicsCompressorNodes.get(nativeOfflineAudioContext);
			if (renderedNativeDynamicsCompressorNode !== void 0) return Promise.resolve(renderedNativeDynamicsCompressorNode);
			return createDynamicsCompressorNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/encoding-error.js
const createEncodingError = () => new DOMException("", "EncodingError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/evaluate-source.js
const createEvaluateSource = (window$2) => {
	return (source) => new Promise((resolve, reject) => {
		if (window$2 === null) {
			reject(/* @__PURE__ */ new SyntaxError());
			return;
		}
		const head = window$2.document.head;
		if (head === null) reject(/* @__PURE__ */ new SyntaxError());
		else {
			const script = window$2.document.createElement("script");
			const blob = new Blob([source], { type: "application/javascript" });
			const url = URL.createObjectURL(blob);
			const originalOnErrorHandler = window$2.onerror;
			const removeErrorEventListenerAndRevokeUrl = () => {
				window$2.onerror = originalOnErrorHandler;
				URL.revokeObjectURL(url);
			};
			window$2.onerror = (message, src, lineno, colno, error) => {
				if (src === url || src === window$2.location.href && lineno === 1 && colno === 1) {
					removeErrorEventListenerAndRevokeUrl();
					reject(error);
					return false;
				}
				if (originalOnErrorHandler !== null) return originalOnErrorHandler(message, src, lineno, colno, error);
			};
			script.onerror = () => {
				removeErrorEventListenerAndRevokeUrl();
				reject(/* @__PURE__ */ new SyntaxError());
			};
			script.onload = () => {
				removeErrorEventListenerAndRevokeUrl();
				resolve();
			};
			script.src = url;
			script.type = "module";
			head.appendChild(script);
		}
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/event-target-constructor.js
const createEventTargetConstructor = (wrapEventListener$1) => {
	return class EventTarget {
		constructor(_nativeEventTarget) {
			this._nativeEventTarget = _nativeEventTarget;
			this._listeners = /* @__PURE__ */ new WeakMap();
		}
		addEventListener(type, listener, options) {
			if (listener !== null) {
				let wrappedEventListener = this._listeners.get(listener);
				if (wrappedEventListener === void 0) {
					wrappedEventListener = wrapEventListener$1(this, listener);
					if (typeof listener === "function") this._listeners.set(listener, wrappedEventListener);
				}
				this._nativeEventTarget.addEventListener(type, wrappedEventListener, options);
			}
		}
		dispatchEvent(event) {
			return this._nativeEventTarget.dispatchEvent(event);
		}
		removeEventListener(type, listener, options) {
			const wrappedEventListener = listener === null ? void 0 : this._listeners.get(listener);
			this._nativeEventTarget.removeEventListener(type, wrappedEventListener === void 0 ? null : wrappedEventListener, options);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/expose-current-frame-and-current-time.js
const createExposeCurrentFrameAndCurrentTime = (window$2) => {
	return (currentTime, sampleRate, fn) => {
		Object.defineProperties(window$2, {
			currentFrame: {
				configurable: true,
				get() {
					return Math.round(currentTime * sampleRate);
				}
			},
			currentTime: {
				configurable: true,
				get() {
					return currentTime;
				}
			}
		});
		try {
			return fn();
		} finally {
			if (window$2 !== null) {
				delete window$2.currentFrame;
				delete window$2.currentTime;
			}
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/fetch-source.js
const createFetchSource = (createAbortError$1) => {
	return async (url) => {
		try {
			const response = await fetch(url);
			if (response.ok) return [await response.text(), response.url];
		} catch {}
		throw createAbortError$1();
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/gain-node-constructor.js
var DEFAULT_OPTIONS$9 = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	gain: 1
};
const createGainNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createGainNodeRenderer, createNativeGainNode$1, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class GainNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeGainNode = createNativeGainNode$1(nativeContext, {
				...DEFAULT_OPTIONS$9,
				...options
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const gainNodeRenderer = isOffline ? createGainNodeRenderer() : null;
			super(context, false, nativeGainNode, gainNodeRenderer);
			this._gain = createAudioParam$1(this, isOffline, nativeGainNode.gain, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
		}
		get gain() {
			return this._gain;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/gain-node-renderer-factory.js
const createGainNodeRendererFactory = (connectAudioParam$1, createNativeGainNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeGainNodes = /* @__PURE__ */ new WeakMap();
		const createGainNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeGainNode = getNativeAudioNode$1(proxy);
			const nativeGainNodeIsOwnedByContext = isOwnedByContext(nativeGainNode, nativeOfflineAudioContext);
			if (!nativeGainNodeIsOwnedByContext) nativeGainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
				channelCount: nativeGainNode.channelCount,
				channelCountMode: nativeGainNode.channelCountMode,
				channelInterpretation: nativeGainNode.channelInterpretation,
				gain: nativeGainNode.gain.value
			});
			renderedNativeGainNodes.set(nativeOfflineAudioContext, nativeGainNode);
			if (!nativeGainNodeIsOwnedByContext) await renderAutomation$1(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain);
			else await connectAudioParam$1(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain);
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeGainNode);
			return nativeGainNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeGainNode = renderedNativeGainNodes.get(nativeOfflineAudioContext);
			if (renderedNativeGainNode !== void 0) return Promise.resolve(renderedNativeGainNode);
			return createGainNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-active-audio-worklet-node-inputs.js
const createGetActiveAudioWorkletNodeInputs = (activeAudioWorkletNodeInputsStore$1, getValueForKey$1) => {
	return (nativeAudioWorkletNode) => getValueForKey$1(activeAudioWorkletNodeInputsStore$1, nativeAudioWorkletNode);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-audio-node-renderer.js
const createGetAudioNodeRenderer = (getAudioNodeConnections$1) => {
	return (audioNode) => {
		const audioNodeConnections = getAudioNodeConnections$1(audioNode);
		if (audioNodeConnections.renderer === null) throw new Error("Missing the renderer of the given AudioNode in the audio graph.");
		return audioNodeConnections.renderer;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-audio-node-tail-time.js
const createGetAudioNodeTailTime = (audioNodeTailTimeStore$1) => {
	return (audioNode) => {
		var _a;
		return (_a = audioNodeTailTimeStore$1.get(audioNode)) !== null && _a !== void 0 ? _a : 0;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-audio-param-renderer.js
const createGetAudioParamRenderer = (getAudioParamConnections$1) => {
	return (audioParam) => {
		const audioParamConnections = getAudioParamConnections$1(audioParam);
		if (audioParamConnections.renderer === null) throw new Error("Missing the renderer of the given AudioParam in the audio graph.");
		return audioParamConnections.renderer;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-backup-offline-audio-context.js
const createGetBackupOfflineAudioContext = (backupOfflineAudioContextStore$1) => {
	return (nativeContext) => {
		return backupOfflineAudioContextStore$1.get(nativeContext);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/invalid-state-error.js
const createInvalidStateError = () => new DOMException("", "InvalidStateError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-native-context.js
const createGetNativeContext = (contextStore) => {
	return (context) => {
		const nativeContext = contextStore.get(context);
		if (nativeContext === void 0) throw createInvalidStateError();
		return nativeContext;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-or-create-backup-offline-audio-context.js
const createGetOrCreateBackupOfflineAudioContext = (backupOfflineAudioContextStore$1, nativeOfflineAudioContextConstructor$1) => {
	return (nativeContext) => {
		let backupOfflineAudioContext = backupOfflineAudioContextStore$1.get(nativeContext);
		if (backupOfflineAudioContext !== void 0) return backupOfflineAudioContext;
		if (nativeOfflineAudioContextConstructor$1 === null) throw new Error("Missing the native OfflineAudioContext constructor.");
		backupOfflineAudioContext = new nativeOfflineAudioContextConstructor$1(1, 1, 44100);
		backupOfflineAudioContextStore$1.set(nativeContext, backupOfflineAudioContext);
		return backupOfflineAudioContext;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/get-unrendered-audio-worklet-nodes.js
const createGetUnrenderedAudioWorkletNodes = (unrenderedAudioWorkletNodeStore$1) => {
	return (nativeContext) => {
		const unrenderedAudioWorkletNodes = unrenderedAudioWorkletNodeStore$1.get(nativeContext);
		if (unrenderedAudioWorkletNodes === void 0) throw new Error("The context has no set of AudioWorkletNodes.");
		return unrenderedAudioWorkletNodes;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/invalid-access-error.js
const createInvalidAccessError = () => new DOMException("", "InvalidAccessError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-iir-filter-node-get-frequency-response-method.js
const wrapIIRFilterNodeGetFrequencyResponseMethod = (nativeIIRFilterNode) => {
	nativeIIRFilterNode.getFrequencyResponse = ((getFrequencyResponse) => {
		return (frequencyHz, magResponse, phaseResponse) => {
			if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) throw createInvalidAccessError();
			return getFrequencyResponse.call(nativeIIRFilterNode, frequencyHz, magResponse, phaseResponse);
		};
	})(nativeIIRFilterNode.getFrequencyResponse);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/iir-filter-node-constructor.js
var DEFAULT_OPTIONS$8 = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers"
};
const createIIRFilterNodeConstructor = (audioNodeConstructor$1, createNativeIIRFilterNode, createIIRFilterNodeRenderer$1, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class IIRFilterNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const mergedOptions = {
				...DEFAULT_OPTIONS$8,
				...options
			};
			const nativeIIRFilterNode = createNativeIIRFilterNode(nativeContext, isOffline ? null : context.baseLatency, mergedOptions);
			const iirFilterNodeRenderer = isOffline ? createIIRFilterNodeRenderer$1(mergedOptions.feedback, mergedOptions.feedforward) : null;
			super(context, false, nativeIIRFilterNode, iirFilterNodeRenderer);
			wrapIIRFilterNodeGetFrequencyResponseMethod(nativeIIRFilterNode);
			this._nativeIIRFilterNode = nativeIIRFilterNode;
			setAudioNodeTailTime$1(this, 1);
		}
		getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
			return this._nativeIIRFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/filter-buffer.js
const filterBuffer = (feedback, feedbackLength, feedforward, feedforwardLength, minLength, xBuffer, yBuffer, bufferIndex, bufferLength, input, output) => {
	const inputLength = input.length;
	let i = bufferIndex;
	for (let j = 0; j < inputLength; j += 1) {
		let y = feedforward[0] * input[j];
		for (let k = 1; k < minLength; k += 1) {
			const x = i - k & bufferLength - 1;
			y += feedforward[k] * xBuffer[x];
			y -= feedback[k] * yBuffer[x];
		}
		for (let k = minLength; k < feedforwardLength; k += 1) y += feedforward[k] * xBuffer[i - k & bufferLength - 1];
		for (let k = minLength; k < feedbackLength; k += 1) y -= feedback[k] * yBuffer[i - k & bufferLength - 1];
		xBuffer[i] = input[j];
		yBuffer[i] = y;
		i = i + 1 & bufferLength - 1;
		output[j] = y;
	}
	return i;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/iir-filter-node-renderer-factory.js
var filterFullBuffer = (renderedBuffer, nativeOfflineAudioContext, feedback, feedforward) => {
	const convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
	const convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
	const feedbackLength = convertedFeedback.length;
	const feedforwardLength = convertedFeedforward.length;
	const minLength = Math.min(feedbackLength, feedforwardLength);
	if (convertedFeedback[0] !== 1) {
		for (let i = 0; i < feedbackLength; i += 1) convertedFeedforward[i] /= convertedFeedback[0];
		for (let i = 1; i < feedforwardLength; i += 1) convertedFeedback[i] /= convertedFeedback[0];
	}
	const bufferLength = 32;
	const xBuffer = new Float32Array(bufferLength);
	const yBuffer = new Float32Array(bufferLength);
	const filteredBuffer = nativeOfflineAudioContext.createBuffer(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);
	const numberOfChannels = renderedBuffer.numberOfChannels;
	for (let i = 0; i < numberOfChannels; i += 1) {
		const input = renderedBuffer.getChannelData(i);
		const output = filteredBuffer.getChannelData(i);
		xBuffer.fill(0);
		yBuffer.fill(0);
		filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffer, yBuffer, 0, bufferLength, input, output);
	}
	return filteredBuffer;
};
const createIIRFilterNodeRendererFactory = (createNativeAudioBufferSourceNode$1, getNativeAudioNode$1, nativeOfflineAudioContextConstructor$1, renderInputsOfAudioNode$1, renderNativeOfflineAudioContext$1) => {
	return (feedback, feedforward) => {
		const renderedNativeAudioNodes = /* @__PURE__ */ new WeakMap();
		let filteredBufferPromise = null;
		const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeAudioBufferSourceNode = null;
			let nativeIIRFilterNode = getNativeAudioNode$1(proxy);
			const nativeIIRFilterNodeIsOwnedByContext = isOwnedByContext(nativeIIRFilterNode, nativeOfflineAudioContext);
			if (nativeOfflineAudioContext.createIIRFilter === void 0) nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode$1(nativeOfflineAudioContext, {
				buffer: null,
				channelCount: 2,
				channelCountMode: "max",
				channelInterpretation: "speakers",
				loop: false,
				loopEnd: 0,
				loopStart: 0,
				playbackRate: 1
			});
			else if (!nativeIIRFilterNodeIsOwnedByContext) nativeIIRFilterNode = nativeOfflineAudioContext.createIIRFilter(feedforward, feedback);
			renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioBufferSourceNode === null ? nativeIIRFilterNode : nativeAudioBufferSourceNode);
			if (nativeAudioBufferSourceNode !== null) {
				if (filteredBufferPromise === null) {
					if (nativeOfflineAudioContextConstructor$1 === null) throw new Error("Missing the native OfflineAudioContext constructor.");
					const partialOfflineAudioContext = new nativeOfflineAudioContextConstructor$1(proxy.context.destination.channelCount, proxy.context.length, nativeOfflineAudioContext.sampleRate);
					filteredBufferPromise = (async () => {
						await renderInputsOfAudioNode$1(proxy, partialOfflineAudioContext, partialOfflineAudioContext.destination);
						return filterFullBuffer(await renderNativeOfflineAudioContext$1(partialOfflineAudioContext), nativeOfflineAudioContext, feedback, feedforward);
					})();
				}
				nativeAudioBufferSourceNode.buffer = await filteredBufferPromise;
				nativeAudioBufferSourceNode.start(0);
				return nativeAudioBufferSourceNode;
			}
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeIIRFilterNode);
			return nativeIIRFilterNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
			if (renderedNativeAudioNode !== void 0) return Promise.resolve(renderedNativeAudioNode);
			return createAudioNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/increment-cycle-counter-factory.js
const createIncrementCycleCounterFactory = (cycleCounters, disconnectNativeAudioNodeFromNativeAudioNode$1, getAudioNodeConnections$1, getNativeAudioNode$1, getNativeAudioParam$1, isActiveAudioNode$1) => {
	return (isOffline) => {
		return (audioNode, count) => {
			const cycleCounter = cycleCounters.get(audioNode);
			if (cycleCounter === void 0) {
				if (!isOffline && isActiveAudioNode$1(audioNode)) {
					const nativeSourceAudioNode = getNativeAudioNode$1(audioNode);
					const { outputs } = getAudioNodeConnections$1(audioNode);
					for (const output of outputs) if (isAudioNodeOutputConnection(output)) disconnectNativeAudioNodeFromNativeAudioNode$1(nativeSourceAudioNode, getNativeAudioNode$1(output[0]), output[1], output[2]);
					else {
						const nativeDestinationAudioParam = getNativeAudioParam$1(output[0]);
						nativeSourceAudioNode.disconnect(nativeDestinationAudioParam, output[1]);
					}
				}
				cycleCounters.set(audioNode, count);
			} else cycleCounters.set(audioNode, cycleCounter + count);
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-any-audio-context.js
const createIsAnyAudioContext = (contextStore, isNativeAudioContext$1) => {
	return (anything) => {
		return isNativeAudioContext$1(contextStore.get(anything)) || isNativeAudioContext$1(anything);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-any-audio-node.js
const createIsAnyAudioNode = (audioNodeStore, isNativeAudioNode$2) => {
	return (anything) => audioNodeStore.has(anything) || isNativeAudioNode$2(anything);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-any-audio-param.js
const createIsAnyAudioParam = (audioParamStore, isNativeAudioParam$1) => {
	return (anything) => audioParamStore.has(anything) || isNativeAudioParam$1(anything);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-any-offline-audio-context.js
const createIsAnyOfflineAudioContext = (contextStore, isNativeOfflineAudioContext$1) => {
	return (anything) => {
		return isNativeOfflineAudioContext$1(contextStore.get(anything)) || isNativeOfflineAudioContext$1(anything);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-native-audio-context.js
const createIsNativeAudioContext = (nativeAudioContextConstructor$1) => {
	return (anything) => {
		return nativeAudioContextConstructor$1 !== null && anything instanceof nativeAudioContextConstructor$1;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-native-audio-node.js
const createIsNativeAudioNode = (window$2) => {
	return (anything) => {
		return window$2 !== null && typeof window$2.AudioNode === "function" && anything instanceof window$2.AudioNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-native-audio-param.js
const createIsNativeAudioParam = (window$2) => {
	return (anything) => {
		return window$2 !== null && typeof window$2.AudioParam === "function" && anything instanceof window$2.AudioParam;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-native-context.js
const createIsNativeContext = (isNativeAudioContext$1, isNativeOfflineAudioContext$1) => {
	return (anything) => {
		return isNativeAudioContext$1(anything) || isNativeOfflineAudioContext$1(anything);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-native-offline-audio-context.js
const createIsNativeOfflineAudioContext = (nativeOfflineAudioContextConstructor$1) => {
	return (anything) => {
		return nativeOfflineAudioContextConstructor$1 !== null && anything instanceof nativeOfflineAudioContextConstructor$1;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/is-secure-context.js
const createIsSecureContext = (window$2) => window$2 !== null && window$2.isSecureContext;

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/media-element-audio-source-node-constructor.js
const createMediaElementAudioSourceNodeConstructor = (audioNodeConstructor$1, createNativeMediaElementAudioSourceNode$1, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class MediaElementAudioSourceNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeMediaElementAudioSourceNode = createNativeMediaElementAudioSourceNode$1(nativeContext, options);
			if (isNativeOfflineAudioContext$1(nativeContext)) throw TypeError();
			super(context, true, nativeMediaElementAudioSourceNode, null);
			this._nativeMediaElementAudioSourceNode = nativeMediaElementAudioSourceNode;
		}
		get mediaElement() {
			return this._nativeMediaElementAudioSourceNode.mediaElement;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/media-stream-audio-destination-node-constructor.js
var DEFAULT_OPTIONS$7 = {
	channelCount: 2,
	channelCountMode: "explicit",
	channelInterpretation: "speakers"
};
const createMediaStreamAudioDestinationNodeConstructor = (audioNodeConstructor$1, createNativeMediaStreamAudioDestinationNode$1, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class MediaStreamAudioDestinationNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			if (isNativeOfflineAudioContext$1(nativeContext)) throw new TypeError();
			const nativeMediaStreamAudioDestinationNode = createNativeMediaStreamAudioDestinationNode$1(nativeContext, {
				...DEFAULT_OPTIONS$7,
				...options
			});
			super(context, false, nativeMediaStreamAudioDestinationNode, null);
			this._nativeMediaStreamAudioDestinationNode = nativeMediaStreamAudioDestinationNode;
		}
		get stream() {
			return this._nativeMediaStreamAudioDestinationNode.stream;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/media-stream-audio-source-node-constructor.js
const createMediaStreamAudioSourceNodeConstructor = (audioNodeConstructor$1, createNativeMediaStreamAudioSourceNode$1, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class MediaStreamAudioSourceNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeMediaStreamAudioSourceNode = createNativeMediaStreamAudioSourceNode$1(nativeContext, options);
			if (isNativeOfflineAudioContext$1(nativeContext)) throw new TypeError();
			super(context, true, nativeMediaStreamAudioSourceNode, null);
			this._nativeMediaStreamAudioSourceNode = nativeMediaStreamAudioSourceNode;
		}
		get mediaStream() {
			return this._nativeMediaStreamAudioSourceNode.mediaStream;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/media-stream-track-audio-source-node-constructor.js
const createMediaStreamTrackAudioSourceNodeConstructor = (audioNodeConstructor$1, createNativeMediaStreamTrackAudioSourceNode, getNativeContext$1) => {
	return class MediaStreamTrackAudioSourceNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeMediaStreamTrackAudioSourceNode = createNativeMediaStreamTrackAudioSourceNode(getNativeContext$1(context), options);
			super(context, true, nativeMediaStreamTrackAudioSourceNode, null);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/minimal-audio-context-constructor.js
const createMinimalAudioContextConstructor = (createInvalidStateError$1, createNotSupportedError$1, createUnknownError$1, minimalBaseAudioContextConstructor$1, nativeAudioContextConstructor$1) => {
	return class MinimalAudioContext extends minimalBaseAudioContextConstructor$1 {
		constructor(options = {}) {
			if (nativeAudioContextConstructor$1 === null) throw new Error("Missing the native AudioContext constructor.");
			let nativeAudioContext;
			try {
				nativeAudioContext = new nativeAudioContextConstructor$1(options);
			} catch (err) {
				if (err.code === 12 && err.message === "sampleRate is not in range") throw createNotSupportedError$1();
				throw err;
			}
			if (nativeAudioContext === null) throw createUnknownError$1();
			if (!isValidLatencyHint(options.latencyHint)) throw new TypeError(`The provided value '${options.latencyHint}' is not a valid enum value of type AudioContextLatencyCategory.`);
			if (options.sampleRate !== void 0 && nativeAudioContext.sampleRate !== options.sampleRate) throw createNotSupportedError$1();
			super(nativeAudioContext, 2);
			const { latencyHint } = options;
			const { sampleRate } = nativeAudioContext;
			this._baseLatency = typeof nativeAudioContext.baseLatency === "number" ? nativeAudioContext.baseLatency : latencyHint === "balanced" ? 512 / sampleRate : latencyHint === "interactive" || latencyHint === void 0 ? 256 / sampleRate : latencyHint === "playback" ? 1024 / sampleRate : Math.max(2, Math.min(128, Math.round(latencyHint * sampleRate / 128))) * 128 / sampleRate;
			this._nativeAudioContext = nativeAudioContext;
			if (nativeAudioContextConstructor$1.name === "webkitAudioContext") {
				this._nativeGainNode = nativeAudioContext.createGain();
				this._nativeOscillatorNode = nativeAudioContext.createOscillator();
				this._nativeGainNode.gain.value = 1e-37;
				this._nativeOscillatorNode.connect(this._nativeGainNode).connect(nativeAudioContext.destination);
				this._nativeOscillatorNode.start();
			} else {
				this._nativeGainNode = null;
				this._nativeOscillatorNode = null;
			}
			this._state = null;
			if (nativeAudioContext.state === "running") {
				this._state = "suspended";
				const revokeState = () => {
					if (this._state === "suspended") this._state = null;
					nativeAudioContext.removeEventListener("statechange", revokeState);
				};
				nativeAudioContext.addEventListener("statechange", revokeState);
			}
		}
		get baseLatency() {
			return this._baseLatency;
		}
		get state() {
			return this._state !== null ? this._state : this._nativeAudioContext.state;
		}
		close() {
			if (this.state === "closed") return this._nativeAudioContext.close().then(() => {
				throw createInvalidStateError$1();
			});
			if (this._state === "suspended") this._state = null;
			return this._nativeAudioContext.close().then(() => {
				if (this._nativeGainNode !== null && this._nativeOscillatorNode !== null) {
					this._nativeOscillatorNode.stop();
					this._nativeGainNode.disconnect();
					this._nativeOscillatorNode.disconnect();
				}
				deactivateAudioGraph(this);
			});
		}
		resume() {
			if (this._state === "suspended") return new Promise((resolve, reject) => {
				const resolvePromise = () => {
					this._nativeAudioContext.removeEventListener("statechange", resolvePromise);
					if (this._nativeAudioContext.state === "running") resolve();
					else this.resume().then(resolve, reject);
				};
				this._nativeAudioContext.addEventListener("statechange", resolvePromise);
			});
			return this._nativeAudioContext.resume().catch((err) => {
				if (err === void 0 || err.code === 15) throw createInvalidStateError$1();
				throw err;
			});
		}
		suspend() {
			return this._nativeAudioContext.suspend().catch((err) => {
				if (err === void 0) throw createInvalidStateError$1();
				throw err;
			});
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/minimal-base-audio-context-constructor.js
const createMinimalBaseAudioContextConstructor = (audioDestinationNodeConstructor$1, createAudioListener$1, eventTargetConstructor$1, isNativeOfflineAudioContext$1, unrenderedAudioWorkletNodeStore$1, wrapEventListener$1) => {
	return class MinimalBaseAudioContext extends eventTargetConstructor$1 {
		constructor(_nativeContext, numberOfChannels) {
			super(_nativeContext);
			this._nativeContext = _nativeContext;
			CONTEXT_STORE.set(this, _nativeContext);
			if (isNativeOfflineAudioContext$1(_nativeContext)) unrenderedAudioWorkletNodeStore$1.set(_nativeContext, /* @__PURE__ */ new Set());
			this._destination = new audioDestinationNodeConstructor$1(this, numberOfChannels);
			this._listener = createAudioListener$1(this, _nativeContext);
			this._onstatechange = null;
		}
		get currentTime() {
			return this._nativeContext.currentTime;
		}
		get destination() {
			return this._destination;
		}
		get listener() {
			return this._listener;
		}
		get onstatechange() {
			return this._onstatechange;
		}
		set onstatechange(value) {
			const wrappedListener = typeof value === "function" ? wrapEventListener$1(this, value) : null;
			this._nativeContext.onstatechange = wrappedListener;
			const nativeOnStateChange = this._nativeContext.onstatechange;
			this._onstatechange = nativeOnStateChange !== null && nativeOnStateChange === wrappedListener ? value : nativeOnStateChange;
		}
		get sampleRate() {
			return this._nativeContext.sampleRate;
		}
		get state() {
			return this._nativeContext.state;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-promise-support.js
const testPromiseSupport = (nativeContext) => {
	const uint32Array = new Uint32Array([
		1179011410,
		40,
		1163280727,
		544501094,
		16,
		131073,
		44100,
		176400,
		1048580,
		1635017060,
		4,
		0
	]);
	try {
		const promise = nativeContext.decodeAudioData(uint32Array.buffer, () => {});
		if (promise === void 0) return false;
		promise.catch(() => {});
		return true;
	} catch {}
	return false;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/minimal-offline-audio-context-constructor.js
var DEFAULT_OPTIONS$6 = { numberOfChannels: 1 };
const createMinimalOfflineAudioContextConstructor = (cacheTestResult$1, createInvalidStateError$1, createNativeOfflineAudioContext$1, minimalBaseAudioContextConstructor$1, startRendering$1) => {
	return class MinimalOfflineAudioContext extends minimalBaseAudioContextConstructor$1 {
		constructor(options) {
			const { length, numberOfChannels, sampleRate } = {
				...DEFAULT_OPTIONS$6,
				...options
			};
			const nativeOfflineAudioContext = createNativeOfflineAudioContext$1(numberOfChannels, length, sampleRate);
			if (!cacheTestResult$1(testPromiseSupport, () => testPromiseSupport(nativeOfflineAudioContext))) nativeOfflineAudioContext.addEventListener("statechange", (() => {
				let i = 0;
				const delayStateChangeEvent = (event) => {
					if (this._state === "running") if (i > 0) {
						nativeOfflineAudioContext.removeEventListener("statechange", delayStateChangeEvent);
						event.stopImmediatePropagation();
						this._waitForThePromiseToSettle(event);
					} else i += 1;
				};
				return delayStateChangeEvent;
			})());
			super(nativeOfflineAudioContext, numberOfChannels);
			this._length = length;
			this._nativeOfflineAudioContext = nativeOfflineAudioContext;
			this._state = null;
		}
		get length() {
			if (this._nativeOfflineAudioContext.length === void 0) return this._length;
			return this._nativeOfflineAudioContext.length;
		}
		get state() {
			return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
		}
		startRendering() {
			if (this._state === "running") return Promise.reject(createInvalidStateError$1());
			this._state = "running";
			return startRendering$1(this.destination, this._nativeOfflineAudioContext).finally(() => {
				this._state = null;
				deactivateAudioGraph(this);
			});
		}
		_waitForThePromiseToSettle(event) {
			if (this._state === null) this._nativeOfflineAudioContext.dispatchEvent(event);
			else setTimeout(() => this._waitForThePromiseToSettle(event));
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/monitor-connections.js
const createMonitorConnections = (insertElementInSet$1, isNativeAudioNode$2) => {
	return (nativeAudioNode, whenConnected, whenDisconnected) => {
		const connections = /* @__PURE__ */ new Set();
		nativeAudioNode.connect = ((connect) => {
			return (destination, output = 0, input = 0) => {
				const wasDisconnected = connections.size === 0;
				if (isNativeAudioNode$2(destination)) {
					connect.call(nativeAudioNode, destination, output, input);
					insertElementInSet$1(connections, [
						destination,
						output,
						input
					], (connection) => connection[0] === destination && connection[1] === output && connection[2] === input, true);
					if (wasDisconnected) whenConnected();
					return destination;
				}
				connect.call(nativeAudioNode, destination, output);
				insertElementInSet$1(connections, [destination, output], (connection) => connection[0] === destination && connection[1] === output, true);
				if (wasDisconnected) whenConnected();
			};
		})(nativeAudioNode.connect);
		nativeAudioNode.disconnect = ((disconnect) => {
			return (destinationOrOutput, output, input) => {
				const wasConnected = connections.size > 0;
				if (destinationOrOutput === void 0) {
					disconnect.apply(nativeAudioNode);
					connections.clear();
				} else if (typeof destinationOrOutput === "number") {
					disconnect.call(nativeAudioNode, destinationOrOutput);
					for (const connection of connections) if (connection[1] === destinationOrOutput) connections.delete(connection);
				} else {
					if (isNativeAudioNode$2(destinationOrOutput)) disconnect.call(nativeAudioNode, destinationOrOutput, output, input);
					else disconnect.call(nativeAudioNode, destinationOrOutput, output);
					for (const connection of connections) if (connection[0] === destinationOrOutput && (output === void 0 || connection[1] === output) && (input === void 0 || connection[2] === input)) connections.delete(connection);
				}
				const isDisconnected = connections.size === 0;
				if (wasConnected && isDisconnected) whenDisconnected();
			};
		})(nativeAudioNode.disconnect);
		return nativeAudioNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/assign-native-audio-node-option.js
const assignNativeAudioNodeOption = (nativeAudioNode, options, option) => {
	const value = options[option];
	if (value !== void 0 && value !== nativeAudioNode[option]) nativeAudioNode[option] = value;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/assign-native-audio-node-options.js
const assignNativeAudioNodeOptions = (nativeAudioNode, options) => {
	assignNativeAudioNodeOption(nativeAudioNode, options, "channelCount");
	assignNativeAudioNodeOption(nativeAudioNode, options, "channelCountMode");
	assignNativeAudioNodeOption(nativeAudioNode, options, "channelInterpretation");
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-analyser-node-get-float-time-domain-data-method-support.js
const testAnalyserNodeGetFloatTimeDomainDataMethodSupport = (nativeAnalyserNode) => {
	return typeof nativeAnalyserNode.getFloatTimeDomainData === "function";
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-analyser-node-get-float-time-domain-data-method.js
const wrapAnalyserNodeGetFloatTimeDomainDataMethod = (nativeAnalyserNode) => {
	nativeAnalyserNode.getFloatTimeDomainData = (array) => {
		const byteTimeDomainData = new Uint8Array(array.length);
		nativeAnalyserNode.getByteTimeDomainData(byteTimeDomainData);
		const length = Math.max(byteTimeDomainData.length, nativeAnalyserNode.fftSize);
		for (let i = 0; i < length; i += 1) array[i] = (byteTimeDomainData[i] - 128) * .0078125;
		return array;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-analyser-node-factory.js
const createNativeAnalyserNodeFactory = (cacheTestResult$1, createIndexSizeError$1) => {
	return (nativeContext, options) => {
		const nativeAnalyserNode = nativeContext.createAnalyser();
		assignNativeAudioNodeOptions(nativeAnalyserNode, options);
		if (!(options.maxDecibels > options.minDecibels)) throw createIndexSizeError$1();
		assignNativeAudioNodeOption(nativeAnalyserNode, options, "fftSize");
		assignNativeAudioNodeOption(nativeAnalyserNode, options, "maxDecibels");
		assignNativeAudioNodeOption(nativeAnalyserNode, options, "minDecibels");
		assignNativeAudioNodeOption(nativeAnalyserNode, options, "smoothingTimeConstant");
		if (!cacheTestResult$1(testAnalyserNodeGetFloatTimeDomainDataMethodSupport, () => testAnalyserNodeGetFloatTimeDomainDataMethodSupport(nativeAnalyserNode))) wrapAnalyserNodeGetFloatTimeDomainDataMethod(nativeAnalyserNode);
		return nativeAnalyserNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-buffer-constructor.js
const createNativeAudioBufferConstructor = (window$2) => {
	if (window$2 === null) return null;
	if (window$2.hasOwnProperty("AudioBuffer")) return window$2.AudioBuffer;
	return null;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/assign-native-audio-node-audio-param-value.js
const assignNativeAudioNodeAudioParamValue = (nativeAudioNode, options, audioParam) => {
	const value = options[audioParam];
	if (value !== void 0 && value !== nativeAudioNode[audioParam].value) nativeAudioNode[audioParam].value = value;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-buffer-source-node-start-method-consecutive-calls.js
const wrapAudioBufferSourceNodeStartMethodConsecutiveCalls = (nativeAudioBufferSourceNode) => {
	nativeAudioBufferSourceNode.start = ((start) => {
		let isScheduled = false;
		return (when = 0, offset = 0, duration) => {
			if (isScheduled) throw createInvalidStateError();
			start.call(nativeAudioBufferSourceNode, when, offset, duration);
			isScheduled = true;
		};
	})(nativeAudioBufferSourceNode.start);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-scheduled-source-node-start-method-negative-parameters.js
const wrapAudioScheduledSourceNodeStartMethodNegativeParameters = (nativeAudioScheduledSourceNode) => {
	nativeAudioScheduledSourceNode.start = ((start) => {
		return (when = 0, offset = 0, duration) => {
			if (typeof duration === "number" && duration < 0 || offset < 0 || when < 0) throw new RangeError("The parameters can't be negative.");
			start.call(nativeAudioScheduledSourceNode, when, offset, duration);
		};
	})(nativeAudioScheduledSourceNode.start);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-scheduled-source-node-stop-method-negative-parameters.js
const wrapAudioScheduledSourceNodeStopMethodNegativeParameters = (nativeAudioScheduledSourceNode) => {
	nativeAudioScheduledSourceNode.stop = ((stop) => {
		return (when = 0) => {
			if (when < 0) throw new RangeError("The parameter can't be negative.");
			stop.call(nativeAudioScheduledSourceNode, when);
		};
	})(nativeAudioScheduledSourceNode.stop);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-buffer-source-node-factory.js
const createNativeAudioBufferSourceNodeFactory = (addSilentConnection$1, cacheTestResult$1, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport$1, testAudioBufferSourceNodeStartMethodOffsetClampingSupport$1, testAudioBufferSourceNodeStopMethodNullifiedBufferSupport$1, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport$1, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1, wrapAudioBufferSourceNodeStartMethodOffsetClampling, wrapAudioBufferSourceNodeStopMethodNullifiedBuffer, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls$1) => {
	return (nativeContext, options) => {
		const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
		assignNativeAudioNodeOptions(nativeAudioBufferSourceNode, options);
		assignNativeAudioNodeAudioParamValue(nativeAudioBufferSourceNode, options, "playbackRate");
		assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, "buffer");
		assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, "loop");
		assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, "loopEnd");
		assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, "loopStart");
		if (!cacheTestResult$1(testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport$1, () => testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport$1(nativeContext))) wrapAudioBufferSourceNodeStartMethodConsecutiveCalls(nativeAudioBufferSourceNode);
		if (!cacheTestResult$1(testAudioBufferSourceNodeStartMethodOffsetClampingSupport$1, () => testAudioBufferSourceNodeStartMethodOffsetClampingSupport$1(nativeContext))) wrapAudioBufferSourceNodeStartMethodOffsetClampling(nativeAudioBufferSourceNode);
		if (!cacheTestResult$1(testAudioBufferSourceNodeStopMethodNullifiedBufferSupport$1, () => testAudioBufferSourceNodeStopMethodNullifiedBufferSupport$1(nativeContext))) wrapAudioBufferSourceNodeStopMethodNullifiedBuffer(nativeAudioBufferSourceNode, nativeContext);
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1, () => testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeAudioBufferSourceNode);
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport$1, () => testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls$1(nativeAudioBufferSourceNode, nativeContext);
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1, () => testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeAudioBufferSourceNode);
		addSilentConnection$1(nativeContext, nativeAudioBufferSourceNode);
		return nativeAudioBufferSourceNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-context-constructor.js
const createNativeAudioContextConstructor = (window$2) => {
	if (window$2 === null) return null;
	if (window$2.hasOwnProperty("AudioContext")) return window$2.AudioContext;
	return window$2.hasOwnProperty("webkitAudioContext") ? window$2.webkitAudioContext : null;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-destination-node.js
const createNativeAudioDestinationNodeFactory = (createNativeGainNode$1, overwriteAccessors$1) => {
	return (nativeContext, channelCount, isNodeOfNativeOfflineAudioContext) => {
		const nativeAudioDestinationNode = nativeContext.destination;
		if (nativeAudioDestinationNode.channelCount !== channelCount) try {
			nativeAudioDestinationNode.channelCount = channelCount;
		} catch {}
		if (isNodeOfNativeOfflineAudioContext && nativeAudioDestinationNode.channelCountMode !== "explicit") nativeAudioDestinationNode.channelCountMode = "explicit";
		if (nativeAudioDestinationNode.maxChannelCount === 0) Object.defineProperty(nativeAudioDestinationNode, "maxChannelCount", { value: channelCount });
		const gainNode = createNativeGainNode$1(nativeContext, {
			channelCount,
			channelCountMode: nativeAudioDestinationNode.channelCountMode,
			channelInterpretation: nativeAudioDestinationNode.channelInterpretation,
			gain: 1
		});
		overwriteAccessors$1(gainNode, "channelCount", (get) => () => get.call(gainNode), (set) => (value) => {
			set.call(gainNode, value);
			try {
				nativeAudioDestinationNode.channelCount = value;
			} catch (err) {
				if (value > nativeAudioDestinationNode.maxChannelCount) throw err;
			}
		});
		overwriteAccessors$1(gainNode, "channelCountMode", (get) => () => get.call(gainNode), (set) => (value) => {
			set.call(gainNode, value);
			nativeAudioDestinationNode.channelCountMode = value;
		});
		overwriteAccessors$1(gainNode, "channelInterpretation", (get) => () => get.call(gainNode), (set) => (value) => {
			set.call(gainNode, value);
			nativeAudioDestinationNode.channelInterpretation = value;
		});
		Object.defineProperty(gainNode, "maxChannelCount", { get: () => nativeAudioDestinationNode.maxChannelCount });
		gainNode.connect(nativeAudioDestinationNode);
		return gainNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-worklet-node-constructor.js
const createNativeAudioWorkletNodeConstructor = (window$2) => {
	if (window$2 === null) return null;
	return window$2.hasOwnProperty("AudioWorkletNode") ? window$2.AudioWorkletNode : null;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-clonability-of-audio-worklet-node-options.js
const testClonabilityOfAudioWorkletNodeOptions = (audioWorkletNodeOptions) => {
	const { port1 } = new MessageChannel();
	try {
		port1.postMessage(audioWorkletNodeOptions);
	} finally {
		port1.close();
	}
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-worklet-node-factory.js
const createNativeAudioWorkletNodeFactory = (createInvalidStateError$1, createNativeAudioWorkletNodeFaker, createNativeGainNode$1, createNotSupportedError$1, monitorConnections$1) => {
	return (nativeContext, baseLatency, nativeAudioWorkletNodeConstructor$1, name, processorConstructor, options) => {
		if (nativeAudioWorkletNodeConstructor$1 !== null) try {
			const nativeAudioWorkletNode = new nativeAudioWorkletNodeConstructor$1(nativeContext, name, options);
			const patchedEventListeners = /* @__PURE__ */ new Map();
			let onprocessorerror = null;
			Object.defineProperties(nativeAudioWorkletNode, {
				channelCount: {
					get: () => options.channelCount,
					set: () => {
						throw createInvalidStateError$1();
					}
				},
				channelCountMode: {
					get: () => "explicit",
					set: () => {
						throw createInvalidStateError$1();
					}
				},
				onprocessorerror: {
					get: () => onprocessorerror,
					set: (value) => {
						if (typeof onprocessorerror === "function") nativeAudioWorkletNode.removeEventListener("processorerror", onprocessorerror);
						onprocessorerror = typeof value === "function" ? value : null;
						if (typeof onprocessorerror === "function") nativeAudioWorkletNode.addEventListener("processorerror", onprocessorerror);
					}
				}
			});
			nativeAudioWorkletNode.addEventListener = ((addEventListener) => {
				return (...args) => {
					if (args[0] === "processorerror") {
						const unpatchedEventListener = typeof args[1] === "function" ? args[1] : typeof args[1] === "object" && args[1] !== null && typeof args[1].handleEvent === "function" ? args[1].handleEvent : null;
						if (unpatchedEventListener !== null) {
							const patchedEventListener = patchedEventListeners.get(args[1]);
							if (patchedEventListener !== void 0) args[1] = patchedEventListener;
							else {
								args[1] = (event) => {
									if (event.type === "error") {
										Object.defineProperties(event, { type: { value: "processorerror" } });
										unpatchedEventListener(event);
									} else unpatchedEventListener(new ErrorEvent(args[0], { ...event }));
								};
								patchedEventListeners.set(unpatchedEventListener, args[1]);
							}
						}
					}
					addEventListener.call(nativeAudioWorkletNode, "error", args[1], args[2]);
					return addEventListener.call(nativeAudioWorkletNode, ...args);
				};
			})(nativeAudioWorkletNode.addEventListener);
			nativeAudioWorkletNode.removeEventListener = ((removeEventListener) => {
				return (...args) => {
					if (args[0] === "processorerror") {
						const patchedEventListener = patchedEventListeners.get(args[1]);
						if (patchedEventListener !== void 0) {
							patchedEventListeners.delete(args[1]);
							args[1] = patchedEventListener;
						}
					}
					removeEventListener.call(nativeAudioWorkletNode, "error", args[1], args[2]);
					return removeEventListener.call(nativeAudioWorkletNode, args[0], args[1], args[2]);
				};
			})(nativeAudioWorkletNode.removeEventListener);
			if (options.numberOfOutputs !== 0) {
				const nativeGainNode = createNativeGainNode$1(nativeContext, {
					channelCount: 1,
					channelCountMode: "explicit",
					channelInterpretation: "discrete",
					gain: 0
				});
				nativeAudioWorkletNode.connect(nativeGainNode).connect(nativeContext.destination);
				const whenConnected = () => nativeGainNode.disconnect();
				const whenDisconnected = () => nativeGainNode.connect(nativeContext.destination);
				return monitorConnections$1(nativeAudioWorkletNode, whenConnected, whenDisconnected);
			}
			return nativeAudioWorkletNode;
		} catch (err) {
			if (err.code === 11) throw createNotSupportedError$1();
			throw err;
		}
		if (processorConstructor === void 0) throw createNotSupportedError$1();
		testClonabilityOfAudioWorkletNodeOptions(options);
		return createNativeAudioWorkletNodeFaker(nativeContext, baseLatency, processorConstructor, options);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/compute-buffer-size.js
const computeBufferSize = (baseLatency, sampleRate) => {
	if (baseLatency === null) return 512;
	return Math.max(512, Math.min(16384, Math.pow(2, Math.round(Math.log2(baseLatency * sampleRate)))));
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/clone-audio-worklet-node-options.js
const cloneAudioWorkletNodeOptions = (audioWorkletNodeOptions) => {
	return new Promise((resolve, reject) => {
		const { port1, port2 } = new MessageChannel();
		port1.onmessage = ({ data }) => {
			port1.close();
			port2.close();
			resolve(data);
		};
		port1.onmessageerror = ({ data }) => {
			port1.close();
			port2.close();
			reject(data);
		};
		port2.postMessage(audioWorkletNodeOptions);
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/create-audio-worklet-processor-promise.js
const createAudioWorkletProcessorPromise = async (processorConstructor, audioWorkletNodeOptions) => {
	return new processorConstructor(await cloneAudioWorkletNodeOptions(audioWorkletNodeOptions));
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/create-audio-worklet-processor.js
const createAudioWorkletProcessor = (nativeContext, nativeAudioWorkletNode, processorConstructor, audioWorkletNodeOptions) => {
	let nodeToProcessorMap = NODE_TO_PROCESSOR_MAPS.get(nativeContext);
	if (nodeToProcessorMap === void 0) {
		nodeToProcessorMap = /* @__PURE__ */ new WeakMap();
		NODE_TO_PROCESSOR_MAPS.set(nativeContext, nodeToProcessorMap);
	}
	const audioWorkletProcessorPromise = createAudioWorkletProcessorPromise(processorConstructor, audioWorkletNodeOptions);
	nodeToProcessorMap.set(nativeAudioWorkletNode, audioWorkletProcessorPromise);
	return audioWorkletProcessorPromise;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-audio-worklet-node-faker-factory.js
const createNativeAudioWorkletNodeFakerFactory = (connectMultipleOutputs$1, createIndexSizeError$1, createInvalidStateError$1, createNativeChannelMergerNode$1, createNativeChannelSplitterNode$1, createNativeConstantSourceNode$1, createNativeGainNode$1, createNativeScriptProcessorNode$1, createNotSupportedError$1, disconnectMultipleOutputs$1, exposeCurrentFrameAndCurrentTime$1, getActiveAudioWorkletNodeInputs, monitorConnections$1) => {
	return (nativeContext, baseLatency, processorConstructor, options) => {
		if (options.numberOfInputs === 0 && options.numberOfOutputs === 0) throw createNotSupportedError$1();
		const outputChannelCount = Array.isArray(options.outputChannelCount) ? options.outputChannelCount : Array.from(options.outputChannelCount);
		if (outputChannelCount.some((channelCount) => channelCount < 1)) throw createNotSupportedError$1();
		if (outputChannelCount.length !== options.numberOfOutputs) throw createIndexSizeError$1();
		if (options.channelCountMode !== "explicit") throw createNotSupportedError$1();
		const numberOfInputChannels = options.channelCount * options.numberOfInputs;
		const numberOfOutputChannels = outputChannelCount.reduce((sum, value) => sum + value, 0);
		const numberOfParameters = processorConstructor.parameterDescriptors === void 0 ? 0 : processorConstructor.parameterDescriptors.length;
		if (numberOfInputChannels + numberOfParameters > 6 || numberOfOutputChannels > 6) throw createNotSupportedError$1();
		const messageChannel = new MessageChannel();
		const gainNodes = [];
		const inputChannelSplitterNodes = [];
		for (let i = 0; i < options.numberOfInputs; i += 1) {
			gainNodes.push(createNativeGainNode$1(nativeContext, {
				channelCount: options.channelCount,
				channelCountMode: options.channelCountMode,
				channelInterpretation: options.channelInterpretation,
				gain: 1
			}));
			inputChannelSplitterNodes.push(createNativeChannelSplitterNode$1(nativeContext, {
				channelCount: options.channelCount,
				channelCountMode: "explicit",
				channelInterpretation: "discrete",
				numberOfOutputs: options.channelCount
			}));
		}
		const constantSourceNodes = [];
		if (processorConstructor.parameterDescriptors !== void 0) for (const { defaultValue, maxValue, minValue, name } of processorConstructor.parameterDescriptors) {
			const constantSourceNode = createNativeConstantSourceNode$1(nativeContext, {
				channelCount: 1,
				channelCountMode: "explicit",
				channelInterpretation: "discrete",
				offset: options.parameterData[name] !== void 0 ? options.parameterData[name] : defaultValue === void 0 ? 0 : defaultValue
			});
			Object.defineProperties(constantSourceNode.offset, {
				defaultValue: { get: () => defaultValue === void 0 ? 0 : defaultValue },
				maxValue: { get: () => maxValue === void 0 ? MOST_POSITIVE_SINGLE_FLOAT : maxValue },
				minValue: { get: () => minValue === void 0 ? MOST_NEGATIVE_SINGLE_FLOAT : minValue }
			});
			constantSourceNodes.push(constantSourceNode);
		}
		const inputChannelMergerNode = createNativeChannelMergerNode$1(nativeContext, {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "speakers",
			numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
		});
		const bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
		const scriptProcessorNode = createNativeScriptProcessorNode$1(nativeContext, bufferSize, numberOfInputChannels + numberOfParameters, Math.max(1, numberOfOutputChannels));
		const outputChannelSplitterNode = createNativeChannelSplitterNode$1(nativeContext, {
			channelCount: Math.max(1, numberOfOutputChannels),
			channelCountMode: "explicit",
			channelInterpretation: "discrete",
			numberOfOutputs: Math.max(1, numberOfOutputChannels)
		});
		const outputChannelMergerNodes = [];
		for (let i = 0; i < options.numberOfOutputs; i += 1) outputChannelMergerNodes.push(createNativeChannelMergerNode$1(nativeContext, {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "speakers",
			numberOfInputs: outputChannelCount[i]
		}));
		for (let i = 0; i < options.numberOfInputs; i += 1) {
			gainNodes[i].connect(inputChannelSplitterNodes[i]);
			for (let j = 0; j < options.channelCount; j += 1) inputChannelSplitterNodes[i].connect(inputChannelMergerNode, j, i * options.channelCount + j);
		}
		const parameterMap = new ReadOnlyMap(processorConstructor.parameterDescriptors === void 0 ? [] : processorConstructor.parameterDescriptors.map(({ name }, index) => {
			const constantSourceNode = constantSourceNodes[index];
			constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
			constantSourceNode.start(0);
			return [name, constantSourceNode.offset];
		}));
		inputChannelMergerNode.connect(scriptProcessorNode);
		let channelInterpretation = options.channelInterpretation;
		let onprocessorerror = null;
		const outputAudioNodes = options.numberOfOutputs === 0 ? [scriptProcessorNode] : outputChannelMergerNodes;
		const nativeAudioWorkletNodeFaker = {
			get bufferSize() {
				return bufferSize;
			},
			get channelCount() {
				return options.channelCount;
			},
			set channelCount(_) {
				throw createInvalidStateError$1();
			},
			get channelCountMode() {
				return options.channelCountMode;
			},
			set channelCountMode(_) {
				throw createInvalidStateError$1();
			},
			get channelInterpretation() {
				return channelInterpretation;
			},
			set channelInterpretation(value) {
				for (const gainNode of gainNodes) gainNode.channelInterpretation = value;
				channelInterpretation = value;
			},
			get context() {
				return scriptProcessorNode.context;
			},
			get inputs() {
				return gainNodes;
			},
			get numberOfInputs() {
				return options.numberOfInputs;
			},
			get numberOfOutputs() {
				return options.numberOfOutputs;
			},
			get onprocessorerror() {
				return onprocessorerror;
			},
			set onprocessorerror(value) {
				if (typeof onprocessorerror === "function") nativeAudioWorkletNodeFaker.removeEventListener("processorerror", onprocessorerror);
				onprocessorerror = typeof value === "function" ? value : null;
				if (typeof onprocessorerror === "function") nativeAudioWorkletNodeFaker.addEventListener("processorerror", onprocessorerror);
			},
			get parameters() {
				return parameterMap;
			},
			get port() {
				return messageChannel.port2;
			},
			addEventListener(...args) {
				return scriptProcessorNode.addEventListener(args[0], args[1], args[2]);
			},
			connect: connectMultipleOutputs$1.bind(null, outputAudioNodes),
			disconnect: disconnectMultipleOutputs$1.bind(null, outputAudioNodes),
			dispatchEvent(...args) {
				return scriptProcessorNode.dispatchEvent(args[0]);
			},
			removeEventListener(...args) {
				return scriptProcessorNode.removeEventListener(args[0], args[1], args[2]);
			}
		};
		const patchedEventListeners = /* @__PURE__ */ new Map();
		messageChannel.port1.addEventListener = ((addEventListener) => {
			return (...args) => {
				if (args[0] === "message") {
					const unpatchedEventListener = typeof args[1] === "function" ? args[1] : typeof args[1] === "object" && args[1] !== null && typeof args[1].handleEvent === "function" ? args[1].handleEvent : null;
					if (unpatchedEventListener !== null) {
						const patchedEventListener = patchedEventListeners.get(args[1]);
						if (patchedEventListener !== void 0) args[1] = patchedEventListener;
						else {
							args[1] = (event) => {
								exposeCurrentFrameAndCurrentTime$1(nativeContext.currentTime, nativeContext.sampleRate, () => unpatchedEventListener(event));
							};
							patchedEventListeners.set(unpatchedEventListener, args[1]);
						}
					}
				}
				return addEventListener.call(messageChannel.port1, args[0], args[1], args[2]);
			};
		})(messageChannel.port1.addEventListener);
		messageChannel.port1.removeEventListener = ((removeEventListener) => {
			return (...args) => {
				if (args[0] === "message") {
					const patchedEventListener = patchedEventListeners.get(args[1]);
					if (patchedEventListener !== void 0) {
						patchedEventListeners.delete(args[1]);
						args[1] = patchedEventListener;
					}
				}
				return removeEventListener.call(messageChannel.port1, args[0], args[1], args[2]);
			};
		})(messageChannel.port1.removeEventListener);
		let onmessage = null;
		Object.defineProperty(messageChannel.port1, "onmessage", {
			get: () => onmessage,
			set: (value) => {
				if (typeof onmessage === "function") messageChannel.port1.removeEventListener("message", onmessage);
				onmessage = typeof value === "function" ? value : null;
				if (typeof onmessage === "function") {
					messageChannel.port1.addEventListener("message", onmessage);
					messageChannel.port1.start();
				}
			}
		});
		processorConstructor.prototype.port = messageChannel.port1;
		let audioWorkletProcessor = null;
		createAudioWorkletProcessor(nativeContext, nativeAudioWorkletNodeFaker, processorConstructor, options).then((dWrkltPrcssr) => audioWorkletProcessor = dWrkltPrcssr);
		const inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
		const outputs = createNestedArrays(options.numberOfOutputs, outputChannelCount);
		const parameters = processorConstructor.parameterDescriptors === void 0 ? [] : processorConstructor.parameterDescriptors.reduce((prmtrs, { name }) => ({
			...prmtrs,
			[name]: new Float32Array(128)
		}), {});
		let isActive = true;
		const disconnectOutputsGraph = () => {
			if (options.numberOfOutputs > 0) scriptProcessorNode.disconnect(outputChannelSplitterNode);
			for (let i = 0, outputChannelSplitterNodeOutput = 0; i < options.numberOfOutputs; i += 1) {
				const outputChannelMergerNode = outputChannelMergerNodes[i];
				for (let j = 0; j < outputChannelCount[i]; j += 1) outputChannelSplitterNode.disconnect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
				outputChannelSplitterNodeOutput += outputChannelCount[i];
			}
		};
		const activeInputIndexes = /* @__PURE__ */ new Map();
		scriptProcessorNode.onaudioprocess = ({ inputBuffer, outputBuffer }) => {
			if (audioWorkletProcessor !== null) {
				const activeInputs = getActiveAudioWorkletNodeInputs(nativeAudioWorkletNodeFaker);
				for (let i = 0; i < bufferSize; i += 128) {
					for (let j = 0; j < options.numberOfInputs; j += 1) for (let k = 0; k < options.channelCount; k += 1) copyFromChannel(inputBuffer, inputs[j], k, k, i);
					if (processorConstructor.parameterDescriptors !== void 0) processorConstructor.parameterDescriptors.forEach(({ name }, index) => {
						copyFromChannel(inputBuffer, parameters, name, numberOfInputChannels + index, i);
					});
					for (let j = 0; j < options.numberOfInputs; j += 1) for (let k = 0; k < outputChannelCount[j]; k += 1) if (outputs[j][k].byteLength === 0) outputs[j][k] = new Float32Array(128);
					try {
						const potentiallyEmptyInputs = inputs.map((input, index) => {
							if (activeInputs[index].size > 0) {
								activeInputIndexes.set(index, bufferSize / 128);
								return input;
							}
							const count = activeInputIndexes.get(index);
							if (count === void 0) return [];
							if (input.every((channelData) => channelData.every((sample) => sample === 0))) if (count === 1) activeInputIndexes.delete(index);
							else activeInputIndexes.set(index, count - 1);
							return input;
						});
						isActive = exposeCurrentFrameAndCurrentTime$1(nativeContext.currentTime + i / nativeContext.sampleRate, nativeContext.sampleRate, () => audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters));
						for (let j = 0, outputChannelSplitterNodeOutput = 0; j < options.numberOfOutputs; j += 1) {
							for (let k = 0; k < outputChannelCount[j]; k += 1) copyToChannel(outputBuffer, outputs[j], k, outputChannelSplitterNodeOutput + k, i);
							outputChannelSplitterNodeOutput += outputChannelCount[j];
						}
					} catch (error) {
						isActive = false;
						nativeAudioWorkletNodeFaker.dispatchEvent(new ErrorEvent("processorerror", {
							colno: error.colno,
							filename: error.filename,
							lineno: error.lineno,
							message: error.message
						}));
					}
					if (!isActive) {
						for (let j = 0; j < options.numberOfInputs; j += 1) {
							gainNodes[j].disconnect(inputChannelSplitterNodes[j]);
							for (let k = 0; k < options.channelCount; k += 1) inputChannelSplitterNodes[i].disconnect(inputChannelMergerNode, k, j * options.channelCount + k);
						}
						if (processorConstructor.parameterDescriptors !== void 0) {
							const length = processorConstructor.parameterDescriptors.length;
							for (let j = 0; j < length; j += 1) {
								const constantSourceNode = constantSourceNodes[j];
								constantSourceNode.disconnect(inputChannelMergerNode, 0, numberOfInputChannels + j);
								constantSourceNode.stop();
							}
						}
						inputChannelMergerNode.disconnect(scriptProcessorNode);
						scriptProcessorNode.onaudioprocess = null;
						if (isConnected) disconnectOutputsGraph();
						else disconnectFakeGraph();
						break;
					}
				}
			}
		};
		let isConnected = false;
		const nativeGainNode = createNativeGainNode$1(nativeContext, {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "discrete",
			gain: 0
		});
		const connectFakeGraph = () => scriptProcessorNode.connect(nativeGainNode).connect(nativeContext.destination);
		const disconnectFakeGraph = () => {
			scriptProcessorNode.disconnect(nativeGainNode);
			nativeGainNode.disconnect();
		};
		const whenConnected = () => {
			if (isActive) {
				disconnectFakeGraph();
				if (options.numberOfOutputs > 0) scriptProcessorNode.connect(outputChannelSplitterNode);
				for (let i = 0, outputChannelSplitterNodeOutput = 0; i < options.numberOfOutputs; i += 1) {
					const outputChannelMergerNode = outputChannelMergerNodes[i];
					for (let j = 0; j < outputChannelCount[i]; j += 1) outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
					outputChannelSplitterNodeOutput += outputChannelCount[i];
				}
			}
			isConnected = true;
		};
		const whenDisconnected = () => {
			if (isActive) {
				connectFakeGraph();
				disconnectOutputsGraph();
			}
			isConnected = false;
		};
		connectFakeGraph();
		return monitorConnections$1(nativeAudioWorkletNodeFaker, whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-biquad-filter-node.js
const createNativeBiquadFilterNode = (nativeContext, options) => {
	const nativeBiquadFilterNode = nativeContext.createBiquadFilter();
	assignNativeAudioNodeOptions(nativeBiquadFilterNode, options);
	assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, "Q");
	assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, "detune");
	assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, "frequency");
	assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, "gain");
	assignNativeAudioNodeOption(nativeBiquadFilterNode, options, "type");
	return nativeBiquadFilterNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-channel-merger-node-factory.js
const createNativeChannelMergerNodeFactory = (nativeAudioContextConstructor$1, wrapChannelMergerNode) => {
	return (nativeContext, options) => {
		const nativeChannelMergerNode = nativeContext.createChannelMerger(options.numberOfInputs);
		if (nativeAudioContextConstructor$1 !== null && nativeAudioContextConstructor$1.name === "webkitAudioContext") wrapChannelMergerNode(nativeContext, nativeChannelMergerNode);
		assignNativeAudioNodeOptions(nativeChannelMergerNode, options);
		return nativeChannelMergerNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-channel-splitter-node.js
const wrapChannelSplitterNode = (channelSplitterNode) => {
	const channelCount = channelSplitterNode.numberOfOutputs;
	Object.defineProperty(channelSplitterNode, "channelCount", {
		get: () => channelCount,
		set: (value) => {
			if (value !== channelCount) throw createInvalidStateError();
		}
	});
	Object.defineProperty(channelSplitterNode, "channelCountMode", {
		get: () => "explicit",
		set: (value) => {
			if (value !== "explicit") throw createInvalidStateError();
		}
	});
	Object.defineProperty(channelSplitterNode, "channelInterpretation", {
		get: () => "discrete",
		set: (value) => {
			if (value !== "discrete") throw createInvalidStateError();
		}
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-channel-splitter-node.js
const createNativeChannelSplitterNode = (nativeContext, options) => {
	const nativeChannelSplitterNode = nativeContext.createChannelSplitter(options.numberOfOutputs);
	assignNativeAudioNodeOptions(nativeChannelSplitterNode, options);
	wrapChannelSplitterNode(nativeChannelSplitterNode);
	return nativeChannelSplitterNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-constant-source-node-factory.js
const createNativeConstantSourceNodeFactory = (addSilentConnection$1, cacheTestResult$1, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1) => {
	return (nativeContext, options) => {
		if (nativeContext.createConstantSource === void 0) return createNativeConstantSourceNodeFaker(nativeContext, options);
		const nativeConstantSourceNode = nativeContext.createConstantSource();
		assignNativeAudioNodeOptions(nativeConstantSourceNode, options);
		assignNativeAudioNodeAudioParamValue(nativeConstantSourceNode, options, "offset");
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1, () => testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeConstantSourceNode);
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1, () => testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeConstantSourceNode);
		addSilentConnection$1(nativeContext, nativeConstantSourceNode);
		return nativeConstantSourceNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/intercept-connections.js
const interceptConnections = (original, interceptor) => {
	original.connect = interceptor.connect.bind(interceptor);
	original.disconnect = interceptor.disconnect.bind(interceptor);
	return original;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-constant-source-node-faker-factory.js
const createNativeConstantSourceNodeFakerFactory = (addSilentConnection$1, createNativeAudioBufferSourceNode$1, createNativeGainNode$1, monitorConnections$1) => {
	return (nativeContext, { offset, ...audioNodeOptions }) => {
		const audioBuffer = nativeContext.createBuffer(1, 2, 44100);
		const audioBufferSourceNode = createNativeAudioBufferSourceNode$1(nativeContext, {
			buffer: null,
			channelCount: 2,
			channelCountMode: "max",
			channelInterpretation: "speakers",
			loop: false,
			loopEnd: 0,
			loopStart: 0,
			playbackRate: 1
		});
		const gainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			gain: offset
		});
		const channelData = audioBuffer.getChannelData(0);
		channelData[0] = 1;
		channelData[1] = 1;
		audioBufferSourceNode.buffer = audioBuffer;
		audioBufferSourceNode.loop = true;
		const nativeConstantSourceNodeFaker = {
			get bufferSize() {},
			get channelCount() {
				return gainNode.channelCount;
			},
			set channelCount(value) {
				gainNode.channelCount = value;
			},
			get channelCountMode() {
				return gainNode.channelCountMode;
			},
			set channelCountMode(value) {
				gainNode.channelCountMode = value;
			},
			get channelInterpretation() {
				return gainNode.channelInterpretation;
			},
			set channelInterpretation(value) {
				gainNode.channelInterpretation = value;
			},
			get context() {
				return gainNode.context;
			},
			get inputs() {
				return [];
			},
			get numberOfInputs() {
				return audioBufferSourceNode.numberOfInputs;
			},
			get numberOfOutputs() {
				return gainNode.numberOfOutputs;
			},
			get offset() {
				return gainNode.gain;
			},
			get onended() {
				return audioBufferSourceNode.onended;
			},
			set onended(value) {
				audioBufferSourceNode.onended = value;
			},
			addEventListener(...args) {
				return audioBufferSourceNode.addEventListener(args[0], args[1], args[2]);
			},
			dispatchEvent(...args) {
				return audioBufferSourceNode.dispatchEvent(args[0]);
			},
			removeEventListener(...args) {
				return audioBufferSourceNode.removeEventListener(args[0], args[1], args[2]);
			},
			start(when = 0) {
				audioBufferSourceNode.start.call(audioBufferSourceNode, when);
			},
			stop(when = 0) {
				audioBufferSourceNode.stop.call(audioBufferSourceNode, when);
			}
		};
		const whenConnected = () => audioBufferSourceNode.connect(gainNode);
		const whenDisconnected = () => audioBufferSourceNode.disconnect(gainNode);
		addSilentConnection$1(nativeContext, audioBufferSourceNode);
		return monitorConnections$1(interceptConnections(nativeConstantSourceNodeFaker, gainNode), whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-convolver-node-factory.js
const createNativeConvolverNodeFactory = (createNotSupportedError$1, overwriteAccessors$1) => {
	return (nativeContext, options) => {
		const nativeConvolverNode = nativeContext.createConvolver();
		assignNativeAudioNodeOptions(nativeConvolverNode, options);
		if (options.disableNormalization === nativeConvolverNode.normalize) nativeConvolverNode.normalize = !options.disableNormalization;
		assignNativeAudioNodeOption(nativeConvolverNode, options, "buffer");
		if (options.channelCount > 2) throw createNotSupportedError$1();
		overwriteAccessors$1(nativeConvolverNode, "channelCount", (get) => () => get.call(nativeConvolverNode), (set) => (value) => {
			if (value > 2) throw createNotSupportedError$1();
			return set.call(nativeConvolverNode, value);
		});
		if (options.channelCountMode === "max") throw createNotSupportedError$1();
		overwriteAccessors$1(nativeConvolverNode, "channelCountMode", (get) => () => get.call(nativeConvolverNode), (set) => (value) => {
			if (value === "max") throw createNotSupportedError$1();
			return set.call(nativeConvolverNode, value);
		});
		return nativeConvolverNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-delay-node.js
const createNativeDelayNode = (nativeContext, options) => {
	const nativeDelayNode = nativeContext.createDelay(options.maxDelayTime);
	assignNativeAudioNodeOptions(nativeDelayNode, options);
	assignNativeAudioNodeAudioParamValue(nativeDelayNode, options, "delayTime");
	return nativeDelayNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-dynamics-compressor-node-factory.js
const createNativeDynamicsCompressorNodeFactory = (createNotSupportedError$1) => {
	return (nativeContext, options) => {
		const nativeDynamicsCompressorNode = nativeContext.createDynamicsCompressor();
		assignNativeAudioNodeOptions(nativeDynamicsCompressorNode, options);
		if (options.channelCount > 2) throw createNotSupportedError$1();
		if (options.channelCountMode === "max") throw createNotSupportedError$1();
		assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, "attack");
		assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, "knee");
		assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, "ratio");
		assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, "release");
		assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, "threshold");
		return nativeDynamicsCompressorNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-gain-node.js
const createNativeGainNode = (nativeContext, options) => {
	const nativeGainNode = nativeContext.createGain();
	assignNativeAudioNodeOptions(nativeGainNode, options);
	assignNativeAudioNodeAudioParamValue(nativeGainNode, options, "gain");
	return nativeGainNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-iir-filter-node-factory.js
const createNativeIIRFilterNodeFactory = (createNativeIIRFilterNodeFaker$1) => {
	return (nativeContext, baseLatency, options) => {
		if (nativeContext.createIIRFilter === void 0) return createNativeIIRFilterNodeFaker$1(nativeContext, baseLatency, options);
		const nativeIIRFilterNode = nativeContext.createIIRFilter(options.feedforward, options.feedback);
		assignNativeAudioNodeOptions(nativeIIRFilterNode, options);
		return nativeIIRFilterNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-iir-filter-node-faker-factory.js
function divide(a, b) {
	const denominator = b[0] * b[0] + b[1] * b[1];
	return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
}
function multiply(a, b) {
	return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
function evaluatePolynomial(coefficient, z) {
	let result = [0, 0];
	for (let i = coefficient.length - 1; i >= 0; i -= 1) {
		result = multiply(result, z);
		result[0] += coefficient[i];
	}
	return result;
}
const createNativeIIRFilterNodeFakerFactory = (createInvalidAccessError$1, createInvalidStateError$1, createNativeScriptProcessorNode$1, createNotSupportedError$1) => {
	return (nativeContext, baseLatency, { channelCount, channelCountMode, channelInterpretation, feedback, feedforward }) => {
		const bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
		const convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
		const convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
		const feedbackLength = convertedFeedback.length;
		const feedforwardLength = convertedFeedforward.length;
		const minLength = Math.min(feedbackLength, feedforwardLength);
		if (feedbackLength === 0 || feedbackLength > 20) throw createNotSupportedError$1();
		if (convertedFeedback[0] === 0) throw createInvalidStateError$1();
		if (feedforwardLength === 0 || feedforwardLength > 20) throw createNotSupportedError$1();
		if (convertedFeedforward[0] === 0) throw createInvalidStateError$1();
		if (convertedFeedback[0] !== 1) {
			for (let i = 0; i < feedforwardLength; i += 1) convertedFeedforward[i] /= convertedFeedback[0];
			for (let i = 1; i < feedbackLength; i += 1) convertedFeedback[i] /= convertedFeedback[0];
		}
		const scriptProcessorNode = createNativeScriptProcessorNode$1(nativeContext, bufferSize, channelCount, channelCount);
		scriptProcessorNode.channelCount = channelCount;
		scriptProcessorNode.channelCountMode = channelCountMode;
		scriptProcessorNode.channelInterpretation = channelInterpretation;
		const bufferLength = 32;
		const bufferIndexes = [];
		const xBuffers = [];
		const yBuffers = [];
		for (let i = 0; i < channelCount; i += 1) {
			bufferIndexes.push(0);
			const xBuffer = new Float32Array(bufferLength);
			const yBuffer = new Float32Array(bufferLength);
			xBuffer.fill(0);
			yBuffer.fill(0);
			xBuffers.push(xBuffer);
			yBuffers.push(yBuffer);
		}
		scriptProcessorNode.onaudioprocess = (event) => {
			const inputBuffer = event.inputBuffer;
			const outputBuffer = event.outputBuffer;
			const numberOfChannels = inputBuffer.numberOfChannels;
			for (let i = 0; i < numberOfChannels; i += 1) {
				const input = inputBuffer.getChannelData(i);
				const output = outputBuffer.getChannelData(i);
				bufferIndexes[i] = filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffers[i], yBuffers[i], bufferIndexes[i], bufferLength, input, output);
			}
		};
		const nyquist = nativeContext.sampleRate / 2;
		return interceptConnections({
			get bufferSize() {
				return bufferSize;
			},
			get channelCount() {
				return scriptProcessorNode.channelCount;
			},
			set channelCount(value) {
				scriptProcessorNode.channelCount = value;
			},
			get channelCountMode() {
				return scriptProcessorNode.channelCountMode;
			},
			set channelCountMode(value) {
				scriptProcessorNode.channelCountMode = value;
			},
			get channelInterpretation() {
				return scriptProcessorNode.channelInterpretation;
			},
			set channelInterpretation(value) {
				scriptProcessorNode.channelInterpretation = value;
			},
			get context() {
				return scriptProcessorNode.context;
			},
			get inputs() {
				return [scriptProcessorNode];
			},
			get numberOfInputs() {
				return scriptProcessorNode.numberOfInputs;
			},
			get numberOfOutputs() {
				return scriptProcessorNode.numberOfOutputs;
			},
			addEventListener(...args) {
				return scriptProcessorNode.addEventListener(args[0], args[1], args[2]);
			},
			dispatchEvent(...args) {
				return scriptProcessorNode.dispatchEvent(args[0]);
			},
			getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
				if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) throw createInvalidAccessError$1();
				const length = frequencyHz.length;
				for (let i = 0; i < length; i += 1) {
					const omega = -Math.PI * (frequencyHz[i] / nyquist);
					const z = [Math.cos(omega), Math.sin(omega)];
					const response = divide(evaluatePolynomial(convertedFeedforward, z), evaluatePolynomial(convertedFeedback, z));
					magResponse[i] = Math.sqrt(response[0] * response[0] + response[1] * response[1]);
					phaseResponse[i] = Math.atan2(response[1], response[0]);
				}
			},
			removeEventListener(...args) {
				return scriptProcessorNode.removeEventListener(args[0], args[1], args[2]);
			}
		}, scriptProcessorNode);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-media-element-audio-source-node.js
const createNativeMediaElementAudioSourceNode = (nativeAudioContext, options) => {
	return nativeAudioContext.createMediaElementSource(options.mediaElement);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-media-stream-audio-destination-node.js
const createNativeMediaStreamAudioDestinationNode = (nativeAudioContext, options) => {
	const nativeMediaStreamAudioDestinationNode = nativeAudioContext.createMediaStreamDestination();
	assignNativeAudioNodeOptions(nativeMediaStreamAudioDestinationNode, options);
	if (nativeMediaStreamAudioDestinationNode.numberOfOutputs === 1) Object.defineProperty(nativeMediaStreamAudioDestinationNode, "numberOfOutputs", { get: () => 0 });
	return nativeMediaStreamAudioDestinationNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-media-stream-audio-source-node.js
const createNativeMediaStreamAudioSourceNode = (nativeAudioContext, { mediaStream }) => {
	const audioStreamTracks = mediaStream.getAudioTracks();
	audioStreamTracks.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
	const filteredAudioStreamTracks = audioStreamTracks.slice(0, 1);
	const nativeMediaStreamAudioSourceNode = nativeAudioContext.createMediaStreamSource(new MediaStream(filteredAudioStreamTracks));
	Object.defineProperty(nativeMediaStreamAudioSourceNode, "mediaStream", { value: mediaStream });
	return nativeMediaStreamAudioSourceNode;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-media-stream-track-audio-source-node-factory.js
const createNativeMediaStreamTrackAudioSourceNodeFactory = (createInvalidStateError$1, isNativeOfflineAudioContext$1) => {
	return (nativeAudioContext, { mediaStreamTrack }) => {
		if (typeof nativeAudioContext.createMediaStreamTrackSource === "function") return nativeAudioContext.createMediaStreamTrackSource(mediaStreamTrack);
		const mediaStream = new MediaStream([mediaStreamTrack]);
		const nativeMediaStreamAudioSourceNode = nativeAudioContext.createMediaStreamSource(mediaStream);
		if (mediaStreamTrack.kind !== "audio") throw createInvalidStateError$1();
		if (isNativeOfflineAudioContext$1(nativeAudioContext)) throw new TypeError();
		return nativeMediaStreamAudioSourceNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-offline-audio-context-constructor.js
const createNativeOfflineAudioContextConstructor = (window$2) => {
	if (window$2 === null) return null;
	if (window$2.hasOwnProperty("OfflineAudioContext")) return window$2.OfflineAudioContext;
	return window$2.hasOwnProperty("webkitOfflineAudioContext") ? window$2.webkitOfflineAudioContext : null;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-oscillator-node-factory.js
const createNativeOscillatorNodeFactory = (addSilentConnection$1, cacheTestResult$1, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport$1, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls$1) => {
	return (nativeContext, options) => {
		const nativeOscillatorNode = nativeContext.createOscillator();
		assignNativeAudioNodeOptions(nativeOscillatorNode, options);
		assignNativeAudioNodeAudioParamValue(nativeOscillatorNode, options, "detune");
		assignNativeAudioNodeAudioParamValue(nativeOscillatorNode, options, "frequency");
		if (options.periodicWave !== void 0) nativeOscillatorNode.setPeriodicWave(options.periodicWave);
		else assignNativeAudioNodeOption(nativeOscillatorNode, options, "type");
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1, () => testAudioScheduledSourceNodeStartMethodNegativeParametersSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeOscillatorNode);
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport$1, () => testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls$1(nativeOscillatorNode, nativeContext);
		if (!cacheTestResult$1(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1, () => testAudioScheduledSourceNodeStopMethodNegativeParametersSupport$1(nativeContext))) wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeOscillatorNode);
		addSilentConnection$1(nativeContext, nativeOscillatorNode);
		return nativeOscillatorNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-panner-node-factory.js
const createNativePannerNodeFactory = (createNativePannerNodeFaker) => {
	return (nativeContext, options) => {
		const nativePannerNode = nativeContext.createPanner();
		if (nativePannerNode.orientationX === void 0) return createNativePannerNodeFaker(nativeContext, options);
		assignNativeAudioNodeOptions(nativePannerNode, options);
		assignNativeAudioNodeAudioParamValue(nativePannerNode, options, "orientationX");
		assignNativeAudioNodeAudioParamValue(nativePannerNode, options, "orientationY");
		assignNativeAudioNodeAudioParamValue(nativePannerNode, options, "orientationZ");
		assignNativeAudioNodeAudioParamValue(nativePannerNode, options, "positionX");
		assignNativeAudioNodeAudioParamValue(nativePannerNode, options, "positionY");
		assignNativeAudioNodeAudioParamValue(nativePannerNode, options, "positionZ");
		assignNativeAudioNodeOption(nativePannerNode, options, "coneInnerAngle");
		assignNativeAudioNodeOption(nativePannerNode, options, "coneOuterAngle");
		assignNativeAudioNodeOption(nativePannerNode, options, "coneOuterGain");
		assignNativeAudioNodeOption(nativePannerNode, options, "distanceModel");
		assignNativeAudioNodeOption(nativePannerNode, options, "maxDistance");
		assignNativeAudioNodeOption(nativePannerNode, options, "panningModel");
		assignNativeAudioNodeOption(nativePannerNode, options, "refDistance");
		assignNativeAudioNodeOption(nativePannerNode, options, "rolloffFactor");
		return nativePannerNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-panner-node-faker-factory.js
const createNativePannerNodeFakerFactory = (connectNativeAudioNodeToNativeAudioNode$1, createInvalidStateError$1, createNativeChannelMergerNode$1, createNativeGainNode$1, createNativeScriptProcessorNode$1, createNativeWaveShaperNode$1, createNotSupportedError$1, disconnectNativeAudioNodeFromNativeAudioNode$1, getFirstSample$1, monitorConnections$1) => {
	return (nativeContext, { coneInnerAngle, coneOuterAngle, coneOuterGain, distanceModel, maxDistance, orientationX, orientationY, orientationZ, panningModel, positionX, positionY, positionZ, refDistance, rolloffFactor, ...audioNodeOptions }) => {
		const pannerNode = nativeContext.createPanner();
		if (audioNodeOptions.channelCount > 2) throw createNotSupportedError$1();
		if (audioNodeOptions.channelCountMode === "max") throw createNotSupportedError$1();
		assignNativeAudioNodeOptions(pannerNode, audioNodeOptions);
		const SINGLE_CHANNEL_OPTIONS = {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "discrete"
		};
		const channelMergerNode = createNativeChannelMergerNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			channelInterpretation: "speakers",
			numberOfInputs: 6
		});
		const inputGainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			gain: 1
		});
		const orientationXGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 1
		});
		const orientationYGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const orientationZGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const positionXGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const positionYGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const positionZGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const scriptProcessorNode = createNativeScriptProcessorNode$1(nativeContext, 256, 6, 1);
		const waveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			curve: new Float32Array([1, 1]),
			oversample: "none"
		});
		let lastOrientation = [
			orientationX,
			orientationY,
			orientationZ
		];
		let lastPosition = [
			positionX,
			positionY,
			positionZ
		];
		const buffer = new Float32Array(1);
		scriptProcessorNode.onaudioprocess = ({ inputBuffer }) => {
			const orientation = [
				getFirstSample$1(inputBuffer, buffer, 0),
				getFirstSample$1(inputBuffer, buffer, 1),
				getFirstSample$1(inputBuffer, buffer, 2)
			];
			if (orientation.some((value, index) => value !== lastOrientation[index])) {
				pannerNode.setOrientation(...orientation);
				lastOrientation = orientation;
			}
			const positon = [
				getFirstSample$1(inputBuffer, buffer, 3),
				getFirstSample$1(inputBuffer, buffer, 4),
				getFirstSample$1(inputBuffer, buffer, 5)
			];
			if (positon.some((value, index) => value !== lastPosition[index])) {
				pannerNode.setPosition(...positon);
				lastPosition = positon;
			}
		};
		Object.defineProperty(orientationYGainNode.gain, "defaultValue", { get: () => 0 });
		Object.defineProperty(orientationZGainNode.gain, "defaultValue", { get: () => 0 });
		Object.defineProperty(positionXGainNode.gain, "defaultValue", { get: () => 0 });
		Object.defineProperty(positionYGainNode.gain, "defaultValue", { get: () => 0 });
		Object.defineProperty(positionZGainNode.gain, "defaultValue", { get: () => 0 });
		const nativePannerNodeFaker = {
			get bufferSize() {},
			get channelCount() {
				return pannerNode.channelCount;
			},
			set channelCount(value) {
				if (value > 2) throw createNotSupportedError$1();
				inputGainNode.channelCount = value;
				pannerNode.channelCount = value;
			},
			get channelCountMode() {
				return pannerNode.channelCountMode;
			},
			set channelCountMode(value) {
				if (value === "max") throw createNotSupportedError$1();
				inputGainNode.channelCountMode = value;
				pannerNode.channelCountMode = value;
			},
			get channelInterpretation() {
				return pannerNode.channelInterpretation;
			},
			set channelInterpretation(value) {
				inputGainNode.channelInterpretation = value;
				pannerNode.channelInterpretation = value;
			},
			get coneInnerAngle() {
				return pannerNode.coneInnerAngle;
			},
			set coneInnerAngle(value) {
				pannerNode.coneInnerAngle = value;
			},
			get coneOuterAngle() {
				return pannerNode.coneOuterAngle;
			},
			set coneOuterAngle(value) {
				pannerNode.coneOuterAngle = value;
			},
			get coneOuterGain() {
				return pannerNode.coneOuterGain;
			},
			set coneOuterGain(value) {
				if (value < 0 || value > 1) throw createInvalidStateError$1();
				pannerNode.coneOuterGain = value;
			},
			get context() {
				return pannerNode.context;
			},
			get distanceModel() {
				return pannerNode.distanceModel;
			},
			set distanceModel(value) {
				pannerNode.distanceModel = value;
			},
			get inputs() {
				return [inputGainNode];
			},
			get maxDistance() {
				return pannerNode.maxDistance;
			},
			set maxDistance(value) {
				if (value < 0) throw new RangeError();
				pannerNode.maxDistance = value;
			},
			get numberOfInputs() {
				return pannerNode.numberOfInputs;
			},
			get numberOfOutputs() {
				return pannerNode.numberOfOutputs;
			},
			get orientationX() {
				return orientationXGainNode.gain;
			},
			get orientationY() {
				return orientationYGainNode.gain;
			},
			get orientationZ() {
				return orientationZGainNode.gain;
			},
			get panningModel() {
				return pannerNode.panningModel;
			},
			set panningModel(value) {
				pannerNode.panningModel = value;
			},
			get positionX() {
				return positionXGainNode.gain;
			},
			get positionY() {
				return positionYGainNode.gain;
			},
			get positionZ() {
				return positionZGainNode.gain;
			},
			get refDistance() {
				return pannerNode.refDistance;
			},
			set refDistance(value) {
				if (value < 0) throw new RangeError();
				pannerNode.refDistance = value;
			},
			get rolloffFactor() {
				return pannerNode.rolloffFactor;
			},
			set rolloffFactor(value) {
				if (value < 0) throw new RangeError();
				pannerNode.rolloffFactor = value;
			},
			addEventListener(...args) {
				return inputGainNode.addEventListener(args[0], args[1], args[2]);
			},
			dispatchEvent(...args) {
				return inputGainNode.dispatchEvent(args[0]);
			},
			removeEventListener(...args) {
				return inputGainNode.removeEventListener(args[0], args[1], args[2]);
			}
		};
		if (coneInnerAngle !== nativePannerNodeFaker.coneInnerAngle) nativePannerNodeFaker.coneInnerAngle = coneInnerAngle;
		if (coneOuterAngle !== nativePannerNodeFaker.coneOuterAngle) nativePannerNodeFaker.coneOuterAngle = coneOuterAngle;
		if (coneOuterGain !== nativePannerNodeFaker.coneOuterGain) nativePannerNodeFaker.coneOuterGain = coneOuterGain;
		if (distanceModel !== nativePannerNodeFaker.distanceModel) nativePannerNodeFaker.distanceModel = distanceModel;
		if (maxDistance !== nativePannerNodeFaker.maxDistance) nativePannerNodeFaker.maxDistance = maxDistance;
		if (orientationX !== nativePannerNodeFaker.orientationX.value) nativePannerNodeFaker.orientationX.value = orientationX;
		if (orientationY !== nativePannerNodeFaker.orientationY.value) nativePannerNodeFaker.orientationY.value = orientationY;
		if (orientationZ !== nativePannerNodeFaker.orientationZ.value) nativePannerNodeFaker.orientationZ.value = orientationZ;
		if (panningModel !== nativePannerNodeFaker.panningModel) nativePannerNodeFaker.panningModel = panningModel;
		if (positionX !== nativePannerNodeFaker.positionX.value) nativePannerNodeFaker.positionX.value = positionX;
		if (positionY !== nativePannerNodeFaker.positionY.value) nativePannerNodeFaker.positionY.value = positionY;
		if (positionZ !== nativePannerNodeFaker.positionZ.value) nativePannerNodeFaker.positionZ.value = positionZ;
		if (refDistance !== nativePannerNodeFaker.refDistance) nativePannerNodeFaker.refDistance = refDistance;
		if (rolloffFactor !== nativePannerNodeFaker.rolloffFactor) nativePannerNodeFaker.rolloffFactor = rolloffFactor;
		if (lastOrientation[0] !== 1 || lastOrientation[1] !== 0 || lastOrientation[2] !== 0) pannerNode.setOrientation(...lastOrientation);
		if (lastPosition[0] !== 0 || lastPosition[1] !== 0 || lastPosition[2] !== 0) pannerNode.setPosition(...lastPosition);
		const whenConnected = () => {
			inputGainNode.connect(pannerNode);
			connectNativeAudioNodeToNativeAudioNode$1(inputGainNode, waveShaperNode, 0, 0);
			waveShaperNode.connect(orientationXGainNode).connect(channelMergerNode, 0, 0);
			waveShaperNode.connect(orientationYGainNode).connect(channelMergerNode, 0, 1);
			waveShaperNode.connect(orientationZGainNode).connect(channelMergerNode, 0, 2);
			waveShaperNode.connect(positionXGainNode).connect(channelMergerNode, 0, 3);
			waveShaperNode.connect(positionYGainNode).connect(channelMergerNode, 0, 4);
			waveShaperNode.connect(positionZGainNode).connect(channelMergerNode, 0, 5);
			channelMergerNode.connect(scriptProcessorNode).connect(nativeContext.destination);
		};
		const whenDisconnected = () => {
			inputGainNode.disconnect(pannerNode);
			disconnectNativeAudioNodeFromNativeAudioNode$1(inputGainNode, waveShaperNode, 0, 0);
			waveShaperNode.disconnect(orientationXGainNode);
			orientationXGainNode.disconnect(channelMergerNode);
			waveShaperNode.disconnect(orientationYGainNode);
			orientationYGainNode.disconnect(channelMergerNode);
			waveShaperNode.disconnect(orientationZGainNode);
			orientationZGainNode.disconnect(channelMergerNode);
			waveShaperNode.disconnect(positionXGainNode);
			positionXGainNode.disconnect(channelMergerNode);
			waveShaperNode.disconnect(positionYGainNode);
			positionYGainNode.disconnect(channelMergerNode);
			waveShaperNode.disconnect(positionZGainNode);
			positionZGainNode.disconnect(channelMergerNode);
			channelMergerNode.disconnect(scriptProcessorNode);
			scriptProcessorNode.disconnect(nativeContext.destination);
		};
		return monitorConnections$1(interceptConnections(nativePannerNodeFaker, pannerNode), whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-periodic-wave-factory.js
const createNativePeriodicWaveFactory = (createIndexSizeError$1) => {
	return (nativeContext, { disableNormalization, imag, real }) => {
		const convertedImag = imag instanceof Float32Array ? imag : new Float32Array(imag);
		const convertedReal = real instanceof Float32Array ? real : new Float32Array(real);
		const nativePeriodicWave = nativeContext.createPeriodicWave(convertedReal, convertedImag, { disableNormalization });
		if (Array.from(imag).length < 2) throw createIndexSizeError$1();
		return nativePeriodicWave;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-script-processor-node.js
const createNativeScriptProcessorNode = (nativeContext, bufferSize, numberOfInputChannels, numberOfOutputChannels) => {
	return nativeContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-stereo-panner-node-factory.js
const createNativeStereoPannerNodeFactory = (createNativeStereoPannerNodeFaker, createNotSupportedError$1) => {
	return (nativeContext, options) => {
		const channelCountMode = options.channelCountMode;
		if (channelCountMode === "clamped-max") throw createNotSupportedError$1();
		if (nativeContext.createStereoPanner === void 0) return createNativeStereoPannerNodeFaker(nativeContext, options);
		const nativeStereoPannerNode = nativeContext.createStereoPanner();
		assignNativeAudioNodeOptions(nativeStereoPannerNode, options);
		assignNativeAudioNodeAudioParamValue(nativeStereoPannerNode, options, "pan");
		Object.defineProperty(nativeStereoPannerNode, "channelCountMode", {
			get: () => channelCountMode,
			set: (value) => {
				if (value !== channelCountMode) throw createNotSupportedError$1();
			}
		});
		return nativeStereoPannerNode;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-stereo-panner-node-faker-factory.js
const createNativeStereoPannerNodeFakerFactory = (createNativeChannelMergerNode$1, createNativeChannelSplitterNode$1, createNativeGainNode$1, createNativeWaveShaperNode$1, createNotSupportedError$1, monitorConnections$1) => {
	const CURVE_SIZE = 16385;
	const DC_CURVE = new Float32Array([1, 1]);
	const HALF_PI = Math.PI / 2;
	const SINGLE_CHANNEL_OPTIONS = {
		channelCount: 1,
		channelCountMode: "explicit",
		channelInterpretation: "discrete"
	};
	const SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS = {
		...SINGLE_CHANNEL_OPTIONS,
		oversample: "none"
	};
	const buildInternalGraphForMono = (nativeContext, inputGainNode, panGainNode, channelMergerNode) => {
		const leftWaveShaperCurve = new Float32Array(CURVE_SIZE);
		const rightWaveShaperCurve = new Float32Array(CURVE_SIZE);
		for (let i = 0; i < CURVE_SIZE; i += 1) {
			const x = i / (CURVE_SIZE - 1) * HALF_PI;
			leftWaveShaperCurve[i] = Math.cos(x);
			rightWaveShaperCurve[i] = Math.sin(x);
		}
		const leftGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const leftWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: leftWaveShaperCurve
		});
		const panWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: DC_CURVE
		});
		const rightGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const rightWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: rightWaveShaperCurve
		});
		return {
			connectGraph() {
				inputGainNode.connect(leftGainNode);
				inputGainNode.connect(panWaveShaperNode.inputs === void 0 ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
				inputGainNode.connect(rightGainNode);
				panWaveShaperNode.connect(panGainNode);
				panGainNode.connect(leftWaveShaperNode.inputs === void 0 ? leftWaveShaperNode : leftWaveShaperNode.inputs[0]);
				panGainNode.connect(rightWaveShaperNode.inputs === void 0 ? rightWaveShaperNode : rightWaveShaperNode.inputs[0]);
				leftWaveShaperNode.connect(leftGainNode.gain);
				rightWaveShaperNode.connect(rightGainNode.gain);
				leftGainNode.connect(channelMergerNode, 0, 0);
				rightGainNode.connect(channelMergerNode, 0, 1);
			},
			disconnectGraph() {
				inputGainNode.disconnect(leftGainNode);
				inputGainNode.disconnect(panWaveShaperNode.inputs === void 0 ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
				inputGainNode.disconnect(rightGainNode);
				panWaveShaperNode.disconnect(panGainNode);
				panGainNode.disconnect(leftWaveShaperNode.inputs === void 0 ? leftWaveShaperNode : leftWaveShaperNode.inputs[0]);
				panGainNode.disconnect(rightWaveShaperNode.inputs === void 0 ? rightWaveShaperNode : rightWaveShaperNode.inputs[0]);
				leftWaveShaperNode.disconnect(leftGainNode.gain);
				rightWaveShaperNode.disconnect(rightGainNode.gain);
				leftGainNode.disconnect(channelMergerNode, 0, 0);
				rightGainNode.disconnect(channelMergerNode, 0, 1);
			}
		};
	};
	const buildInternalGraphForStereo = (nativeContext, inputGainNode, panGainNode, channelMergerNode) => {
		const leftInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
		const leftInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
		const rightInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
		const rightInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
		const centerIndex = Math.floor(CURVE_SIZE / 2);
		for (let i = 0; i < CURVE_SIZE; i += 1) if (i > centerIndex) {
			const x = (i - centerIndex) / (CURVE_SIZE - 1 - centerIndex) * HALF_PI;
			leftInputForLeftOutputWaveShaperCurve[i] = Math.cos(x);
			leftInputForRightOutputWaveShaperCurve[i] = Math.sin(x);
			rightInputForLeftOutputWaveShaperCurve[i] = 0;
			rightInputForRightOutputWaveShaperCurve[i] = 1;
		} else {
			const x = i / (CURVE_SIZE - 1 - centerIndex) * HALF_PI;
			leftInputForLeftOutputWaveShaperCurve[i] = 1;
			leftInputForRightOutputWaveShaperCurve[i] = 0;
			rightInputForLeftOutputWaveShaperCurve[i] = Math.cos(x);
			rightInputForRightOutputWaveShaperCurve[i] = Math.sin(x);
		}
		const channelSplitterNode = createNativeChannelSplitterNode$1(nativeContext, {
			channelCount: 2,
			channelCountMode: "explicit",
			channelInterpretation: "discrete",
			numberOfOutputs: 2
		});
		const leftInputForLeftOutputGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const leftInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: leftInputForLeftOutputWaveShaperCurve
		});
		const leftInputForRightOutputGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const leftInputForRightOutputWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: leftInputForRightOutputWaveShaperCurve
		});
		const panWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: DC_CURVE
		});
		const rightInputForLeftOutputGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const rightInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: rightInputForLeftOutputWaveShaperCurve
		});
		const rightInputForRightOutputGainNode = createNativeGainNode$1(nativeContext, {
			...SINGLE_CHANNEL_OPTIONS,
			gain: 0
		});
		const rightInputForRightOutputWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
			...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
			curve: rightInputForRightOutputWaveShaperCurve
		});
		return {
			connectGraph() {
				inputGainNode.connect(channelSplitterNode);
				inputGainNode.connect(panWaveShaperNode.inputs === void 0 ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
				channelSplitterNode.connect(leftInputForLeftOutputGainNode, 0);
				channelSplitterNode.connect(leftInputForRightOutputGainNode, 0);
				channelSplitterNode.connect(rightInputForLeftOutputGainNode, 1);
				channelSplitterNode.connect(rightInputForRightOutputGainNode, 1);
				panWaveShaperNode.connect(panGainNode);
				panGainNode.connect(leftInputForLeftOutputWaveShaperNode.inputs === void 0 ? leftInputForLeftOutputWaveShaperNode : leftInputForLeftOutputWaveShaperNode.inputs[0]);
				panGainNode.connect(leftInputForRightOutputWaveShaperNode.inputs === void 0 ? leftInputForRightOutputWaveShaperNode : leftInputForRightOutputWaveShaperNode.inputs[0]);
				panGainNode.connect(rightInputForLeftOutputWaveShaperNode.inputs === void 0 ? rightInputForLeftOutputWaveShaperNode : rightInputForLeftOutputWaveShaperNode.inputs[0]);
				panGainNode.connect(rightInputForRightOutputWaveShaperNode.inputs === void 0 ? rightInputForRightOutputWaveShaperNode : rightInputForRightOutputWaveShaperNode.inputs[0]);
				leftInputForLeftOutputWaveShaperNode.connect(leftInputForLeftOutputGainNode.gain);
				leftInputForRightOutputWaveShaperNode.connect(leftInputForRightOutputGainNode.gain);
				rightInputForLeftOutputWaveShaperNode.connect(rightInputForLeftOutputGainNode.gain);
				rightInputForRightOutputWaveShaperNode.connect(rightInputForRightOutputGainNode.gain);
				leftInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
				rightInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
				leftInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
				rightInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
			},
			disconnectGraph() {
				inputGainNode.disconnect(channelSplitterNode);
				inputGainNode.disconnect(panWaveShaperNode.inputs === void 0 ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
				channelSplitterNode.disconnect(leftInputForLeftOutputGainNode, 0);
				channelSplitterNode.disconnect(leftInputForRightOutputGainNode, 0);
				channelSplitterNode.disconnect(rightInputForLeftOutputGainNode, 1);
				channelSplitterNode.disconnect(rightInputForRightOutputGainNode, 1);
				panWaveShaperNode.disconnect(panGainNode);
				panGainNode.disconnect(leftInputForLeftOutputWaveShaperNode.inputs === void 0 ? leftInputForLeftOutputWaveShaperNode : leftInputForLeftOutputWaveShaperNode.inputs[0]);
				panGainNode.disconnect(leftInputForRightOutputWaveShaperNode.inputs === void 0 ? leftInputForRightOutputWaveShaperNode : leftInputForRightOutputWaveShaperNode.inputs[0]);
				panGainNode.disconnect(rightInputForLeftOutputWaveShaperNode.inputs === void 0 ? rightInputForLeftOutputWaveShaperNode : rightInputForLeftOutputWaveShaperNode.inputs[0]);
				panGainNode.disconnect(rightInputForRightOutputWaveShaperNode.inputs === void 0 ? rightInputForRightOutputWaveShaperNode : rightInputForRightOutputWaveShaperNode.inputs[0]);
				leftInputForLeftOutputWaveShaperNode.disconnect(leftInputForLeftOutputGainNode.gain);
				leftInputForRightOutputWaveShaperNode.disconnect(leftInputForRightOutputGainNode.gain);
				rightInputForLeftOutputWaveShaperNode.disconnect(rightInputForLeftOutputGainNode.gain);
				rightInputForRightOutputWaveShaperNode.disconnect(rightInputForRightOutputGainNode.gain);
				leftInputForLeftOutputGainNode.disconnect(channelMergerNode, 0, 0);
				rightInputForLeftOutputGainNode.disconnect(channelMergerNode, 0, 0);
				leftInputForRightOutputGainNode.disconnect(channelMergerNode, 0, 1);
				rightInputForRightOutputGainNode.disconnect(channelMergerNode, 0, 1);
			}
		};
	};
	const buildInternalGraph = (nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode) => {
		if (channelCount === 1) return buildInternalGraphForMono(nativeContext, inputGainNode, panGainNode, channelMergerNode);
		if (channelCount === 2) return buildInternalGraphForStereo(nativeContext, inputGainNode, panGainNode, channelMergerNode);
		throw createNotSupportedError$1();
	};
	return (nativeContext, { channelCount, channelCountMode, pan, ...audioNodeOptions }) => {
		if (channelCountMode === "max") throw createNotSupportedError$1();
		const channelMergerNode = createNativeChannelMergerNode$1(nativeContext, {
			...audioNodeOptions,
			channelCount: 1,
			channelCountMode,
			numberOfInputs: 2
		});
		const inputGainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			channelCount,
			channelCountMode,
			gain: 1
		});
		const panGainNode = createNativeGainNode$1(nativeContext, {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "discrete",
			gain: pan
		});
		let { connectGraph, disconnectGraph } = buildInternalGraph(nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode);
		Object.defineProperty(panGainNode.gain, "defaultValue", { get: () => 0 });
		Object.defineProperty(panGainNode.gain, "maxValue", { get: () => 1 });
		Object.defineProperty(panGainNode.gain, "minValue", { get: () => -1 });
		const nativeStereoPannerNodeFakerFactory = {
			get bufferSize() {},
			get channelCount() {
				return inputGainNode.channelCount;
			},
			set channelCount(value) {
				if (inputGainNode.channelCount !== value) {
					if (isConnected) disconnectGraph();
					({connectGraph, disconnectGraph} = buildInternalGraph(nativeContext, value, inputGainNode, panGainNode, channelMergerNode));
					if (isConnected) connectGraph();
				}
				inputGainNode.channelCount = value;
			},
			get channelCountMode() {
				return inputGainNode.channelCountMode;
			},
			set channelCountMode(value) {
				if (value === "clamped-max" || value === "max") throw createNotSupportedError$1();
				inputGainNode.channelCountMode = value;
			},
			get channelInterpretation() {
				return inputGainNode.channelInterpretation;
			},
			set channelInterpretation(value) {
				inputGainNode.channelInterpretation = value;
			},
			get context() {
				return inputGainNode.context;
			},
			get inputs() {
				return [inputGainNode];
			},
			get numberOfInputs() {
				return inputGainNode.numberOfInputs;
			},
			get numberOfOutputs() {
				return inputGainNode.numberOfOutputs;
			},
			get pan() {
				return panGainNode.gain;
			},
			addEventListener(...args) {
				return inputGainNode.addEventListener(args[0], args[1], args[2]);
			},
			dispatchEvent(...args) {
				return inputGainNode.dispatchEvent(args[0]);
			},
			removeEventListener(...args) {
				return inputGainNode.removeEventListener(args[0], args[1], args[2]);
			}
		};
		let isConnected = false;
		const whenConnected = () => {
			connectGraph();
			isConnected = true;
		};
		const whenDisconnected = () => {
			disconnectGraph();
			isConnected = false;
		};
		return monitorConnections$1(interceptConnections(nativeStereoPannerNodeFakerFactory, channelMergerNode), whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-wave-shaper-node-factory.js
const createNativeWaveShaperNodeFactory = (createConnectedNativeAudioBufferSourceNode$1, createInvalidStateError$1, createNativeWaveShaperNodeFaker, isDCCurve$1, monitorConnections$1, nativeAudioContextConstructor$1, overwriteAccessors$1) => {
	return (nativeContext, options) => {
		const nativeWaveShaperNode = nativeContext.createWaveShaper();
		if (nativeAudioContextConstructor$1 !== null && nativeAudioContextConstructor$1.name === "webkitAudioContext" && nativeContext.createGain().gain.automationRate === void 0) return createNativeWaveShaperNodeFaker(nativeContext, options);
		assignNativeAudioNodeOptions(nativeWaveShaperNode, options);
		const curve = options.curve === null || options.curve instanceof Float32Array ? options.curve : new Float32Array(options.curve);
		if (curve !== null && curve.length < 2) throw createInvalidStateError$1();
		assignNativeAudioNodeOption(nativeWaveShaperNode, { curve }, "curve");
		assignNativeAudioNodeOption(nativeWaveShaperNode, options, "oversample");
		let disconnectNativeAudioBufferSourceNode = null;
		let isConnected = false;
		overwriteAccessors$1(nativeWaveShaperNode, "curve", (get) => () => get.call(nativeWaveShaperNode), (set) => (value) => {
			set.call(nativeWaveShaperNode, value);
			if (isConnected) {
				if (isDCCurve$1(value) && disconnectNativeAudioBufferSourceNode === null) disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode$1(nativeContext, nativeWaveShaperNode);
				else if (!isDCCurve$1(value) && disconnectNativeAudioBufferSourceNode !== null) {
					disconnectNativeAudioBufferSourceNode();
					disconnectNativeAudioBufferSourceNode = null;
				}
			}
			return value;
		});
		const whenConnected = () => {
			isConnected = true;
			if (isDCCurve$1(nativeWaveShaperNode.curve)) disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode$1(nativeContext, nativeWaveShaperNode);
		};
		const whenDisconnected = () => {
			isConnected = false;
			if (disconnectNativeAudioBufferSourceNode !== null) {
				disconnectNativeAudioBufferSourceNode();
				disconnectNativeAudioBufferSourceNode = null;
			}
		};
		return monitorConnections$1(nativeWaveShaperNode, whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/native-wave-shaper-node-faker-factory.js
const createNativeWaveShaperNodeFakerFactory = (createConnectedNativeAudioBufferSourceNode$1, createInvalidStateError$1, createNativeGainNode$1, isDCCurve$1, monitorConnections$1) => {
	return (nativeContext, { curve, oversample, ...audioNodeOptions }) => {
		const negativeWaveShaperNode = nativeContext.createWaveShaper();
		const positiveWaveShaperNode = nativeContext.createWaveShaper();
		assignNativeAudioNodeOptions(negativeWaveShaperNode, audioNodeOptions);
		assignNativeAudioNodeOptions(positiveWaveShaperNode, audioNodeOptions);
		const inputGainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			gain: 1
		});
		const invertGainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			gain: -1
		});
		const outputGainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			gain: 1
		});
		const revertGainNode = createNativeGainNode$1(nativeContext, {
			...audioNodeOptions,
			gain: -1
		});
		let disconnectNativeAudioBufferSourceNode = null;
		let isConnected = false;
		let unmodifiedCurve = null;
		const nativeWaveShaperNodeFaker = {
			get bufferSize() {},
			get channelCount() {
				return negativeWaveShaperNode.channelCount;
			},
			set channelCount(value) {
				inputGainNode.channelCount = value;
				invertGainNode.channelCount = value;
				negativeWaveShaperNode.channelCount = value;
				outputGainNode.channelCount = value;
				positiveWaveShaperNode.channelCount = value;
				revertGainNode.channelCount = value;
			},
			get channelCountMode() {
				return negativeWaveShaperNode.channelCountMode;
			},
			set channelCountMode(value) {
				inputGainNode.channelCountMode = value;
				invertGainNode.channelCountMode = value;
				negativeWaveShaperNode.channelCountMode = value;
				outputGainNode.channelCountMode = value;
				positiveWaveShaperNode.channelCountMode = value;
				revertGainNode.channelCountMode = value;
			},
			get channelInterpretation() {
				return negativeWaveShaperNode.channelInterpretation;
			},
			set channelInterpretation(value) {
				inputGainNode.channelInterpretation = value;
				invertGainNode.channelInterpretation = value;
				negativeWaveShaperNode.channelInterpretation = value;
				outputGainNode.channelInterpretation = value;
				positiveWaveShaperNode.channelInterpretation = value;
				revertGainNode.channelInterpretation = value;
			},
			get context() {
				return negativeWaveShaperNode.context;
			},
			get curve() {
				return unmodifiedCurve;
			},
			set curve(value) {
				if (value !== null && value.length < 2) throw createInvalidStateError$1();
				if (value === null) {
					negativeWaveShaperNode.curve = value;
					positiveWaveShaperNode.curve = value;
				} else {
					const curveLength = value.length;
					const negativeCurve = new Float32Array(curveLength + 2 - curveLength % 2);
					const positiveCurve = new Float32Array(curveLength + 2 - curveLength % 2);
					negativeCurve[0] = value[0];
					positiveCurve[0] = -value[curveLength - 1];
					const length = Math.ceil((curveLength + 1) / 2);
					const centerIndex = (curveLength + 1) / 2 - 1;
					for (let i = 1; i < length; i += 1) {
						const theoreticIndex = i / length * centerIndex;
						const lowerIndex = Math.floor(theoreticIndex);
						const upperIndex = Math.ceil(theoreticIndex);
						negativeCurve[i] = lowerIndex === upperIndex ? value[lowerIndex] : (1 - (theoreticIndex - lowerIndex)) * value[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * value[upperIndex];
						positiveCurve[i] = lowerIndex === upperIndex ? -value[curveLength - 1 - lowerIndex] : -((1 - (theoreticIndex - lowerIndex)) * value[curveLength - 1 - lowerIndex]) - (1 - (upperIndex - theoreticIndex)) * value[curveLength - 1 - upperIndex];
					}
					negativeCurve[length] = curveLength % 2 === 1 ? value[length - 1] : (value[length - 2] + value[length - 1]) / 2;
					negativeWaveShaperNode.curve = negativeCurve;
					positiveWaveShaperNode.curve = positiveCurve;
				}
				unmodifiedCurve = value;
				if (isConnected) {
					if (isDCCurve$1(unmodifiedCurve) && disconnectNativeAudioBufferSourceNode === null) disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode$1(nativeContext, inputGainNode);
					else if (disconnectNativeAudioBufferSourceNode !== null) {
						disconnectNativeAudioBufferSourceNode();
						disconnectNativeAudioBufferSourceNode = null;
					}
				}
			},
			get inputs() {
				return [inputGainNode];
			},
			get numberOfInputs() {
				return negativeWaveShaperNode.numberOfInputs;
			},
			get numberOfOutputs() {
				return negativeWaveShaperNode.numberOfOutputs;
			},
			get oversample() {
				return negativeWaveShaperNode.oversample;
			},
			set oversample(value) {
				negativeWaveShaperNode.oversample = value;
				positiveWaveShaperNode.oversample = value;
			},
			addEventListener(...args) {
				return inputGainNode.addEventListener(args[0], args[1], args[2]);
			},
			dispatchEvent(...args) {
				return inputGainNode.dispatchEvent(args[0]);
			},
			removeEventListener(...args) {
				return inputGainNode.removeEventListener(args[0], args[1], args[2]);
			}
		};
		if (curve !== null) nativeWaveShaperNodeFaker.curve = curve instanceof Float32Array ? curve : new Float32Array(curve);
		if (oversample !== nativeWaveShaperNodeFaker.oversample) nativeWaveShaperNodeFaker.oversample = oversample;
		const whenConnected = () => {
			inputGainNode.connect(negativeWaveShaperNode).connect(outputGainNode);
			inputGainNode.connect(invertGainNode).connect(positiveWaveShaperNode).connect(revertGainNode).connect(outputGainNode);
			isConnected = true;
			if (isDCCurve$1(unmodifiedCurve)) disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode$1(nativeContext, inputGainNode);
		};
		const whenDisconnected = () => {
			inputGainNode.disconnect(negativeWaveShaperNode);
			negativeWaveShaperNode.disconnect(outputGainNode);
			inputGainNode.disconnect(invertGainNode);
			invertGainNode.disconnect(positiveWaveShaperNode);
			positiveWaveShaperNode.disconnect(revertGainNode);
			revertGainNode.disconnect(outputGainNode);
			isConnected = false;
			if (disconnectNativeAudioBufferSourceNode !== null) {
				disconnectNativeAudioBufferSourceNode();
				disconnectNativeAudioBufferSourceNode = null;
			}
		};
		return monitorConnections$1(interceptConnections(nativeWaveShaperNodeFaker, outputGainNode), whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/not-supported-error.js
const createNotSupportedError = () => new DOMException("", "NotSupportedError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/offline-audio-context-constructor.js
var DEFAULT_OPTIONS$5 = { numberOfChannels: 1 };
const createOfflineAudioContextConstructor = (baseAudioContextConstructor$1, cacheTestResult$1, createInvalidStateError$1, createNativeOfflineAudioContext$1, startRendering$1) => {
	return class OfflineAudioContext extends baseAudioContextConstructor$1 {
		constructor(a, b, c) {
			let options;
			if (typeof a === "number" && b !== void 0 && c !== void 0) options = {
				length: b,
				numberOfChannels: a,
				sampleRate: c
			};
			else if (typeof a === "object") options = a;
			else throw new Error("The given parameters are not valid.");
			const { length, numberOfChannels, sampleRate } = {
				...DEFAULT_OPTIONS$5,
				...options
			};
			const nativeOfflineAudioContext = createNativeOfflineAudioContext$1(numberOfChannels, length, sampleRate);
			if (!cacheTestResult$1(testPromiseSupport, () => testPromiseSupport(nativeOfflineAudioContext))) nativeOfflineAudioContext.addEventListener("statechange", (() => {
				let i = 0;
				const delayStateChangeEvent = (event) => {
					if (this._state === "running") if (i > 0) {
						nativeOfflineAudioContext.removeEventListener("statechange", delayStateChangeEvent);
						event.stopImmediatePropagation();
						this._waitForThePromiseToSettle(event);
					} else i += 1;
				};
				return delayStateChangeEvent;
			})());
			super(nativeOfflineAudioContext, numberOfChannels);
			this._length = length;
			this._nativeOfflineAudioContext = nativeOfflineAudioContext;
			this._state = null;
		}
		get length() {
			if (this._nativeOfflineAudioContext.length === void 0) return this._length;
			return this._nativeOfflineAudioContext.length;
		}
		get state() {
			return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
		}
		startRendering() {
			if (this._state === "running") return Promise.reject(createInvalidStateError$1());
			this._state = "running";
			return startRendering$1(this.destination, this._nativeOfflineAudioContext).finally(() => {
				this._state = null;
				deactivateAudioGraph(this);
			});
		}
		_waitForThePromiseToSettle(event) {
			if (this._state === null) this._nativeOfflineAudioContext.dispatchEvent(event);
			else setTimeout(() => this._waitForThePromiseToSettle(event));
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/oscillator-node-constructor.js
var DEFAULT_OPTIONS$4 = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	detune: 0,
	frequency: 440,
	periodicWave: void 0,
	type: "sine"
};
const createOscillatorNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createNativeOscillatorNode$1, createOscillatorNodeRenderer, getNativeContext$1, isNativeOfflineAudioContext$1, wrapEventListener$1) => {
	return class OscillatorNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const mergedOptions = {
				...DEFAULT_OPTIONS$4,
				...options
			};
			const nativeOscillatorNode = createNativeOscillatorNode$1(nativeContext, mergedOptions);
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const oscillatorNodeRenderer = isOffline ? createOscillatorNodeRenderer() : null;
			const nyquist = context.sampleRate / 2;
			super(context, false, nativeOscillatorNode, oscillatorNodeRenderer);
			this._detune = createAudioParam$1(this, isOffline, nativeOscillatorNode.detune, 153600, -153600);
			this._frequency = createAudioParam$1(this, isOffline, nativeOscillatorNode.frequency, nyquist, -nyquist);
			this._nativeOscillatorNode = nativeOscillatorNode;
			this._onended = null;
			this._oscillatorNodeRenderer = oscillatorNodeRenderer;
			if (this._oscillatorNodeRenderer !== null && mergedOptions.periodicWave !== void 0) this._oscillatorNodeRenderer.periodicWave = mergedOptions.periodicWave;
		}
		get detune() {
			return this._detune;
		}
		get frequency() {
			return this._frequency;
		}
		get onended() {
			return this._onended;
		}
		set onended(value) {
			const wrappedListener = typeof value === "function" ? wrapEventListener$1(this, value) : null;
			this._nativeOscillatorNode.onended = wrappedListener;
			const nativeOnEnded = this._nativeOscillatorNode.onended;
			this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
		}
		get type() {
			return this._nativeOscillatorNode.type;
		}
		set type(value) {
			this._nativeOscillatorNode.type = value;
			if (this._oscillatorNodeRenderer !== null) this._oscillatorNodeRenderer.periodicWave = null;
		}
		setPeriodicWave(periodicWave) {
			this._nativeOscillatorNode.setPeriodicWave(periodicWave);
			if (this._oscillatorNodeRenderer !== null) this._oscillatorNodeRenderer.periodicWave = periodicWave;
		}
		start(when = 0) {
			this._nativeOscillatorNode.start(when);
			if (this._oscillatorNodeRenderer !== null) this._oscillatorNodeRenderer.start = when;
			if (this.context.state !== "closed") {
				setInternalStateToActive(this);
				const resetInternalStateToPassive = () => {
					this._nativeOscillatorNode.removeEventListener("ended", resetInternalStateToPassive);
					if (isActiveAudioNode(this)) setInternalStateToPassive(this);
				};
				this._nativeOscillatorNode.addEventListener("ended", resetInternalStateToPassive);
			}
		}
		stop(when = 0) {
			this._nativeOscillatorNode.stop(when);
			if (this._oscillatorNodeRenderer !== null) this._oscillatorNodeRenderer.stop = when;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/oscillator-node-renderer-factory.js
const createOscillatorNodeRendererFactory = (connectAudioParam$1, createNativeOscillatorNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeOscillatorNodes = /* @__PURE__ */ new WeakMap();
		let periodicWave = null;
		let start = null;
		let stop = null;
		const createOscillatorNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeOscillatorNode = getNativeAudioNode$1(proxy);
			const nativeOscillatorNodeIsOwnedByContext = isOwnedByContext(nativeOscillatorNode, nativeOfflineAudioContext);
			if (!nativeOscillatorNodeIsOwnedByContext) {
				nativeOscillatorNode = createNativeOscillatorNode$1(nativeOfflineAudioContext, {
					channelCount: nativeOscillatorNode.channelCount,
					channelCountMode: nativeOscillatorNode.channelCountMode,
					channelInterpretation: nativeOscillatorNode.channelInterpretation,
					detune: nativeOscillatorNode.detune.value,
					frequency: nativeOscillatorNode.frequency.value,
					periodicWave: periodicWave === null ? void 0 : periodicWave,
					type: nativeOscillatorNode.type
				});
				if (start !== null) nativeOscillatorNode.start(start);
				if (stop !== null) nativeOscillatorNode.stop(stop);
			}
			renderedNativeOscillatorNodes.set(nativeOfflineAudioContext, nativeOscillatorNode);
			if (!nativeOscillatorNodeIsOwnedByContext) {
				await renderAutomation$1(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency);
			} else {
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency);
			}
			await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeOscillatorNode);
			return nativeOscillatorNode;
		};
		return {
			set periodicWave(value) {
				periodicWave = value;
			},
			set start(value) {
				start = value;
			},
			set stop(value) {
				stop = value;
			},
			render(proxy, nativeOfflineAudioContext) {
				const renderedNativeOscillatorNode = renderedNativeOscillatorNodes.get(nativeOfflineAudioContext);
				if (renderedNativeOscillatorNode !== void 0) return Promise.resolve(renderedNativeOscillatorNode);
				return createOscillatorNode(proxy, nativeOfflineAudioContext);
			}
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/panner-node-constructor.js
var DEFAULT_OPTIONS$3 = {
	channelCount: 2,
	channelCountMode: "clamped-max",
	channelInterpretation: "speakers",
	coneInnerAngle: 360,
	coneOuterAngle: 360,
	coneOuterGain: 0,
	distanceModel: "inverse",
	maxDistance: 1e4,
	orientationX: 1,
	orientationY: 0,
	orientationZ: 0,
	panningModel: "equalpower",
	positionX: 0,
	positionY: 0,
	positionZ: 0,
	refDistance: 1,
	rolloffFactor: 1
};
const createPannerNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createNativePannerNode$1, createPannerNodeRenderer, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class PannerNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativePannerNode = createNativePannerNode$1(nativeContext, {
				...DEFAULT_OPTIONS$3,
				...options
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const pannerNodeRenderer = isOffline ? createPannerNodeRenderer() : null;
			super(context, false, nativePannerNode, pannerNodeRenderer);
			this._nativePannerNode = nativePannerNode;
			this._orientationX = createAudioParam$1(this, isOffline, nativePannerNode.orientationX, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._orientationY = createAudioParam$1(this, isOffline, nativePannerNode.orientationY, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._orientationZ = createAudioParam$1(this, isOffline, nativePannerNode.orientationZ, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._positionX = createAudioParam$1(this, isOffline, nativePannerNode.positionX, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._positionY = createAudioParam$1(this, isOffline, nativePannerNode.positionY, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			this._positionZ = createAudioParam$1(this, isOffline, nativePannerNode.positionZ, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
			setAudioNodeTailTime$1(this, 1);
		}
		get coneInnerAngle() {
			return this._nativePannerNode.coneInnerAngle;
		}
		set coneInnerAngle(value) {
			this._nativePannerNode.coneInnerAngle = value;
		}
		get coneOuterAngle() {
			return this._nativePannerNode.coneOuterAngle;
		}
		set coneOuterAngle(value) {
			this._nativePannerNode.coneOuterAngle = value;
		}
		get coneOuterGain() {
			return this._nativePannerNode.coneOuterGain;
		}
		set coneOuterGain(value) {
			this._nativePannerNode.coneOuterGain = value;
		}
		get distanceModel() {
			return this._nativePannerNode.distanceModel;
		}
		set distanceModel(value) {
			this._nativePannerNode.distanceModel = value;
		}
		get maxDistance() {
			return this._nativePannerNode.maxDistance;
		}
		set maxDistance(value) {
			this._nativePannerNode.maxDistance = value;
		}
		get orientationX() {
			return this._orientationX;
		}
		get orientationY() {
			return this._orientationY;
		}
		get orientationZ() {
			return this._orientationZ;
		}
		get panningModel() {
			return this._nativePannerNode.panningModel;
		}
		set panningModel(value) {
			this._nativePannerNode.panningModel = value;
		}
		get positionX() {
			return this._positionX;
		}
		get positionY() {
			return this._positionY;
		}
		get positionZ() {
			return this._positionZ;
		}
		get refDistance() {
			return this._nativePannerNode.refDistance;
		}
		set refDistance(value) {
			this._nativePannerNode.refDistance = value;
		}
		get rolloffFactor() {
			return this._nativePannerNode.rolloffFactor;
		}
		set rolloffFactor(value) {
			this._nativePannerNode.rolloffFactor = value;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/panner-node-renderer-factory.js
const createPannerNodeRendererFactory = (connectAudioParam$1, createNativeChannelMergerNode$1, createNativeConstantSourceNode$1, createNativeGainNode$1, createNativePannerNode$1, getNativeAudioNode$1, nativeOfflineAudioContextConstructor$1, renderAutomation$1, renderInputsOfAudioNode$1, renderNativeOfflineAudioContext$1) => {
	return () => {
		const renderedNativeAudioNodes = /* @__PURE__ */ new WeakMap();
		let renderedBufferPromise = null;
		const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeGainNode = null;
			let nativePannerNode = getNativeAudioNode$1(proxy);
			const commonAudioNodeOptions = {
				channelCount: nativePannerNode.channelCount,
				channelCountMode: nativePannerNode.channelCountMode,
				channelInterpretation: nativePannerNode.channelInterpretation
			};
			const commonNativePannerNodeOptions = {
				...commonAudioNodeOptions,
				coneInnerAngle: nativePannerNode.coneInnerAngle,
				coneOuterAngle: nativePannerNode.coneOuterAngle,
				coneOuterGain: nativePannerNode.coneOuterGain,
				distanceModel: nativePannerNode.distanceModel,
				maxDistance: nativePannerNode.maxDistance,
				panningModel: nativePannerNode.panningModel,
				refDistance: nativePannerNode.refDistance,
				rolloffFactor: nativePannerNode.rolloffFactor
			};
			const nativePannerNodeIsOwnedByContext = isOwnedByContext(nativePannerNode, nativeOfflineAudioContext);
			if ("bufferSize" in nativePannerNode) nativeGainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
				...commonAudioNodeOptions,
				gain: 1
			});
			else if (!nativePannerNodeIsOwnedByContext) nativePannerNode = createNativePannerNode$1(nativeOfflineAudioContext, {
				...commonNativePannerNodeOptions,
				orientationX: nativePannerNode.orientationX.value,
				orientationY: nativePannerNode.orientationY.value,
				orientationZ: nativePannerNode.orientationZ.value,
				positionX: nativePannerNode.positionX.value,
				positionY: nativePannerNode.positionY.value,
				positionZ: nativePannerNode.positionZ.value
			});
			renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeGainNode === null ? nativePannerNode : nativeGainNode);
			if (nativeGainNode !== null) {
				if (renderedBufferPromise === null) {
					if (nativeOfflineAudioContextConstructor$1 === null) throw new Error("Missing the native OfflineAudioContext constructor.");
					const partialOfflineAudioContext = new nativeOfflineAudioContextConstructor$1(6, proxy.context.length, nativeOfflineAudioContext.sampleRate);
					const nativeChannelMergerNode = createNativeChannelMergerNode$1(partialOfflineAudioContext, {
						channelCount: 1,
						channelCountMode: "explicit",
						channelInterpretation: "speakers",
						numberOfInputs: 6
					});
					nativeChannelMergerNode.connect(partialOfflineAudioContext.destination);
					renderedBufferPromise = (async () => {
						const nativeConstantSourceNodes = await Promise.all([
							proxy.orientationX,
							proxy.orientationY,
							proxy.orientationZ,
							proxy.positionX,
							proxy.positionY,
							proxy.positionZ
						].map(async (audioParam, index) => {
							const nativeConstantSourceNode = createNativeConstantSourceNode$1(partialOfflineAudioContext, {
								channelCount: 1,
								channelCountMode: "explicit",
								channelInterpretation: "discrete",
								offset: index === 0 ? 1 : 0
							});
							await renderAutomation$1(partialOfflineAudioContext, audioParam, nativeConstantSourceNode.offset);
							return nativeConstantSourceNode;
						}));
						for (let i = 0; i < 6; i += 1) {
							nativeConstantSourceNodes[i].connect(nativeChannelMergerNode, 0, i);
							nativeConstantSourceNodes[i].start(0);
						}
						return renderNativeOfflineAudioContext$1(partialOfflineAudioContext);
					})();
				}
				const renderedBuffer = await renderedBufferPromise;
				const inputGainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
					...commonAudioNodeOptions,
					gain: 1
				});
				await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, inputGainNode);
				const channelDatas = [];
				for (let i = 0; i < renderedBuffer.numberOfChannels; i += 1) channelDatas.push(renderedBuffer.getChannelData(i));
				let lastOrientation = [
					channelDatas[0][0],
					channelDatas[1][0],
					channelDatas[2][0]
				];
				let lastPosition = [
					channelDatas[3][0],
					channelDatas[4][0],
					channelDatas[5][0]
				];
				let gateGainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
					...commonAudioNodeOptions,
					gain: 1
				});
				let partialPannerNode = createNativePannerNode$1(nativeOfflineAudioContext, {
					...commonNativePannerNodeOptions,
					orientationX: lastOrientation[0],
					orientationY: lastOrientation[1],
					orientationZ: lastOrientation[2],
					positionX: lastPosition[0],
					positionY: lastPosition[1],
					positionZ: lastPosition[2]
				});
				inputGainNode.connect(gateGainNode).connect(partialPannerNode.inputs[0]);
				partialPannerNode.connect(nativeGainNode);
				for (let i = 128; i < renderedBuffer.length; i += 128) {
					const orientation = [
						channelDatas[0][i],
						channelDatas[1][i],
						channelDatas[2][i]
					];
					const positon = [
						channelDatas[3][i],
						channelDatas[4][i],
						channelDatas[5][i]
					];
					if (orientation.some((value, index) => value !== lastOrientation[index]) || positon.some((value, index) => value !== lastPosition[index])) {
						lastOrientation = orientation;
						lastPosition = positon;
						const currentTime = i / nativeOfflineAudioContext.sampleRate;
						gateGainNode.gain.setValueAtTime(0, currentTime);
						gateGainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
							...commonAudioNodeOptions,
							gain: 0
						});
						partialPannerNode = createNativePannerNode$1(nativeOfflineAudioContext, {
							...commonNativePannerNodeOptions,
							orientationX: lastOrientation[0],
							orientationY: lastOrientation[1],
							orientationZ: lastOrientation[2],
							positionX: lastPosition[0],
							positionY: lastPosition[1],
							positionZ: lastPosition[2]
						});
						gateGainNode.gain.setValueAtTime(1, currentTime);
						inputGainNode.connect(gateGainNode).connect(partialPannerNode.inputs[0]);
						partialPannerNode.connect(nativeGainNode);
					}
				}
				return nativeGainNode;
			}
			if (!nativePannerNodeIsOwnedByContext) {
				await renderAutomation$1(nativeOfflineAudioContext, proxy.orientationX, nativePannerNode.orientationX);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.orientationY, nativePannerNode.orientationY);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.orientationZ, nativePannerNode.orientationZ);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.positionX, nativePannerNode.positionX);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.positionY, nativePannerNode.positionY);
				await renderAutomation$1(nativeOfflineAudioContext, proxy.positionZ, nativePannerNode.positionZ);
			} else {
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.orientationX, nativePannerNode.orientationX);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.orientationY, nativePannerNode.orientationY);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.orientationZ, nativePannerNode.orientationZ);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.positionX, nativePannerNode.positionX);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.positionY, nativePannerNode.positionY);
				await connectAudioParam$1(nativeOfflineAudioContext, proxy.positionZ, nativePannerNode.positionZ);
			}
			if (isNativeAudioNodeFaker(nativePannerNode)) await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativePannerNode.inputs[0]);
			else await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativePannerNode);
			return nativePannerNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeGainNodeOrNativePannerNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
			if (renderedNativeGainNodeOrNativePannerNode !== void 0) return Promise.resolve(renderedNativeGainNodeOrNativePannerNode);
			return createAudioNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/periodic-wave-constructor.js
var DEFAULT_OPTIONS$2 = { disableNormalization: false };
const createPeriodicWaveConstructor = (createNativePeriodicWave, getNativeContext$1, periodicWaveStore, sanitizePeriodicWaveOptions$1) => {
	return class PeriodicWave {
		constructor(context, options) {
			const periodicWave = createNativePeriodicWave(getNativeContext$1(context), sanitizePeriodicWaveOptions$1({
				...DEFAULT_OPTIONS$2,
				...options
			}));
			periodicWaveStore.add(periodicWave);
			return periodicWave;
		}
		static [Symbol.hasInstance](instance) {
			return instance !== null && typeof instance === "object" && Object.getPrototypeOf(instance) === PeriodicWave.prototype || periodicWaveStore.has(instance);
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/render-automation.js
const createRenderAutomation = (getAudioParamRenderer, renderInputsOfAudioParam$1) => {
	return (nativeOfflineAudioContext, audioParam, nativeAudioParam) => {
		getAudioParamRenderer(audioParam).replay(nativeAudioParam);
		return renderInputsOfAudioParam$1(audioParam, nativeOfflineAudioContext, nativeAudioParam);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/render-inputs-of-audio-node.js
const createRenderInputsOfAudioNode = (getAudioNodeConnections$1, getAudioNodeRenderer$1, isPartOfACycle$1) => {
	return async (audioNode, nativeOfflineAudioContext, nativeAudioNode) => {
		const audioNodeConnections = getAudioNodeConnections$1(audioNode);
		await Promise.all(audioNodeConnections.activeInputs.map((connections, input) => Array.from(connections).map(async ([source, output]) => {
			const renderedNativeAudioNode = await getAudioNodeRenderer$1(source).render(source, nativeOfflineAudioContext);
			const destination = audioNode.context.destination;
			if (!isPartOfACycle$1(source) && (audioNode !== destination || !isPartOfACycle$1(audioNode))) renderedNativeAudioNode.connect(nativeAudioNode, output, input);
		})).reduce((allRenderingPromises, renderingPromises) => [...allRenderingPromises, ...renderingPromises], []));
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/render-inputs-of-audio-param.js
const createRenderInputsOfAudioParam = (getAudioNodeRenderer$1, getAudioParamConnections$1, isPartOfACycle$1) => {
	return async (audioParam, nativeOfflineAudioContext, nativeAudioParam) => {
		const audioParamConnections = getAudioParamConnections$1(audioParam);
		await Promise.all(Array.from(audioParamConnections.activeInputs).map(async ([source, output]) => {
			const renderedNativeAudioNode = await getAudioNodeRenderer$1(source).render(source, nativeOfflineAudioContext);
			if (!isPartOfACycle$1(source)) renderedNativeAudioNode.connect(nativeAudioParam, output);
		}));
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/render-native-offline-audio-context.js
const createRenderNativeOfflineAudioContext = (cacheTestResult$1, createNativeGainNode$1, createNativeScriptProcessorNode$1, testOfflineAudioContextCurrentTimeSupport) => {
	return (nativeOfflineAudioContext) => {
		if (cacheTestResult$1(testPromiseSupport, () => testPromiseSupport(nativeOfflineAudioContext))) return Promise.resolve(cacheTestResult$1(testOfflineAudioContextCurrentTimeSupport, testOfflineAudioContextCurrentTimeSupport)).then((isOfflineAudioContextCurrentTimeSupported) => {
			if (!isOfflineAudioContextCurrentTimeSupported) {
				const scriptProcessorNode = createNativeScriptProcessorNode$1(nativeOfflineAudioContext, 512, 0, 1);
				nativeOfflineAudioContext.oncomplete = () => {
					scriptProcessorNode.onaudioprocess = null;
					scriptProcessorNode.disconnect();
				};
				scriptProcessorNode.onaudioprocess = () => nativeOfflineAudioContext.currentTime;
				scriptProcessorNode.connect(nativeOfflineAudioContext.destination);
			}
			return nativeOfflineAudioContext.startRendering();
		});
		return new Promise((resolve) => {
			const gainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
				channelCount: 1,
				channelCountMode: "explicit",
				channelInterpretation: "discrete",
				gain: 0
			});
			nativeOfflineAudioContext.oncomplete = (event) => {
				gainNode.disconnect();
				resolve(event.renderedBuffer);
			};
			gainNode.connect(nativeOfflineAudioContext.destination);
			nativeOfflineAudioContext.startRendering();
		});
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/set-active-audio-worklet-node-inputs.js
const createSetActiveAudioWorkletNodeInputs = (activeAudioWorkletNodeInputsStore$1) => {
	return (nativeAudioWorkletNode, activeInputs) => {
		activeAudioWorkletNodeInputsStore$1.set(nativeAudioWorkletNode, activeInputs);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/set-audio-node-tail-time.js
const createSetAudioNodeTailTime = (audioNodeTailTimeStore$1) => {
	return (audioNode, tailTime) => audioNodeTailTimeStore$1.set(audioNode, tailTime);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/start-rendering.js
const createStartRendering = (audioBufferStore$1, cacheTestResult$1, getAudioNodeRenderer$1, getUnrenderedAudioWorkletNodes$1, renderNativeOfflineAudioContext$1, testAudioBufferCopyChannelMethodsOutOfBoundsSupport$1, wrapAudioBufferCopyChannelMethods$1, wrapAudioBufferCopyChannelMethodsOutOfBounds$1) => {
	return (destination, nativeOfflineAudioContext) => getAudioNodeRenderer$1(destination).render(destination, nativeOfflineAudioContext).then(() => Promise.all(Array.from(getUnrenderedAudioWorkletNodes$1(nativeOfflineAudioContext)).map((audioWorkletNode) => getAudioNodeRenderer$1(audioWorkletNode).render(audioWorkletNode, nativeOfflineAudioContext)))).then(() => renderNativeOfflineAudioContext$1(nativeOfflineAudioContext)).then((audioBuffer) => {
		if (typeof audioBuffer.copyFromChannel !== "function") {
			wrapAudioBufferCopyChannelMethods$1(audioBuffer);
			wrapAudioBufferGetChannelDataMethod(audioBuffer);
		} else if (!cacheTestResult$1(testAudioBufferCopyChannelMethodsOutOfBoundsSupport$1, () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport$1(audioBuffer))) wrapAudioBufferCopyChannelMethodsOutOfBounds$1(audioBuffer);
		audioBufferStore$1.add(audioBuffer);
		return audioBuffer;
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/stereo-panner-node-constructor.js
var DEFAULT_OPTIONS$1 = {
	channelCount: 2,
	channelCountMode: "explicit",
	channelInterpretation: "speakers",
	pan: 0
};
const createStereoPannerNodeConstructor = (audioNodeConstructor$1, createAudioParam$1, createNativeStereoPannerNode$1, createStereoPannerNodeRenderer, getNativeContext$1, isNativeOfflineAudioContext$1) => {
	return class StereoPannerNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeStereoPannerNode = createNativeStereoPannerNode$1(nativeContext, {
				...DEFAULT_OPTIONS$1,
				...options
			});
			const isOffline = isNativeOfflineAudioContext$1(nativeContext);
			const stereoPannerNodeRenderer = isOffline ? createStereoPannerNodeRenderer() : null;
			super(context, false, nativeStereoPannerNode, stereoPannerNodeRenderer);
			this._pan = createAudioParam$1(this, isOffline, nativeStereoPannerNode.pan);
		}
		get pan() {
			return this._pan;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/stereo-panner-node-renderer-factory.js
const createStereoPannerNodeRendererFactory = (connectAudioParam$1, createNativeStereoPannerNode$1, getNativeAudioNode$1, renderAutomation$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeStereoPannerNodes = /* @__PURE__ */ new WeakMap();
		const createStereoPannerNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeStereoPannerNode = getNativeAudioNode$1(proxy);
			const nativeStereoPannerNodeIsOwnedByContext = isOwnedByContext(nativeStereoPannerNode, nativeOfflineAudioContext);
			if (!nativeStereoPannerNodeIsOwnedByContext) nativeStereoPannerNode = createNativeStereoPannerNode$1(nativeOfflineAudioContext, {
				channelCount: nativeStereoPannerNode.channelCount,
				channelCountMode: nativeStereoPannerNode.channelCountMode,
				channelInterpretation: nativeStereoPannerNode.channelInterpretation,
				pan: nativeStereoPannerNode.pan.value
			});
			renderedNativeStereoPannerNodes.set(nativeOfflineAudioContext, nativeStereoPannerNode);
			if (!nativeStereoPannerNodeIsOwnedByContext) await renderAutomation$1(nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan);
			else await connectAudioParam$1(nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan);
			if (isNativeAudioNodeFaker(nativeStereoPannerNode)) await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeStereoPannerNode.inputs[0]);
			else await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeStereoPannerNode);
			return nativeStereoPannerNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeStereoPannerNode = renderedNativeStereoPannerNodes.get(nativeOfflineAudioContext);
			if (renderedNativeStereoPannerNode !== void 0) return Promise.resolve(renderedNativeStereoPannerNode);
			return createStereoPannerNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/test-audio-buffer-constructor-support.js
const createTestAudioBufferConstructorSupport = (nativeAudioBufferConstructor$1) => {
	return () => {
		if (nativeAudioBufferConstructor$1 === null) return false;
		try {
			new nativeAudioBufferConstructor$1({
				length: 1,
				sampleRate: 44100
			});
		} catch {
			return false;
		}
		return true;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/test-audio-worklet-processor-post-message-support.js
const createTestAudioWorkletProcessorPostMessageSupport = (nativeAudioWorkletNodeConstructor$1, nativeOfflineAudioContextConstructor$1) => {
	return async () => {
		if (nativeAudioWorkletNodeConstructor$1 === null) return true;
		if (nativeOfflineAudioContextConstructor$1 === null) return false;
		const blob = new Blob(["class A extends AudioWorkletProcessor{process(i){this.port.postMessage(i,[i[0][0].buffer])}}registerProcessor(\"a\",A)"], { type: "application/javascript; charset=utf-8" });
		const offlineAudioContext = new nativeOfflineAudioContextConstructor$1(1, 128, 44100);
		const url = URL.createObjectURL(blob);
		let isEmittingMessageEvents = false;
		let isEmittingProcessorErrorEvents = false;
		try {
			await offlineAudioContext.audioWorklet.addModule(url);
			const audioWorkletNode = new nativeAudioWorkletNodeConstructor$1(offlineAudioContext, "a", { numberOfOutputs: 0 });
			const oscillator = offlineAudioContext.createOscillator();
			audioWorkletNode.port.onmessage = () => isEmittingMessageEvents = true;
			audioWorkletNode.onprocessorerror = () => isEmittingProcessorErrorEvents = true;
			oscillator.connect(audioWorkletNode);
			oscillator.start(0);
			await offlineAudioContext.startRendering();
			await new Promise((resolve) => setTimeout(resolve));
		} catch {} finally {
			URL.revokeObjectURL(url);
		}
		return isEmittingMessageEvents && !isEmittingProcessorErrorEvents;
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/test-offline-audio-context-current-time-support.js
const createTestOfflineAudioContextCurrentTimeSupport = (createNativeGainNode$1, nativeOfflineAudioContextConstructor$1) => {
	return () => {
		if (nativeOfflineAudioContextConstructor$1 === null) return Promise.resolve(false);
		const nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor$1(1, 1, 44100);
		const gainNode = createNativeGainNode$1(nativeOfflineAudioContext, {
			channelCount: 1,
			channelCountMode: "explicit",
			channelInterpretation: "discrete",
			gain: 0
		});
		return new Promise((resolve) => {
			nativeOfflineAudioContext.oncomplete = () => {
				gainNode.disconnect();
				resolve(nativeOfflineAudioContext.currentTime !== 0);
			};
			nativeOfflineAudioContext.startRendering();
		});
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/unknown-error.js
const createUnknownError = () => new DOMException("", "UnknownError");

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/wave-shaper-node-constructor.js
var DEFAULT_OPTIONS = {
	channelCount: 2,
	channelCountMode: "max",
	channelInterpretation: "speakers",
	curve: null,
	oversample: "none"
};
const createWaveShaperNodeConstructor = (audioNodeConstructor$1, createInvalidStateError$1, createNativeWaveShaperNode$1, createWaveShaperNodeRenderer, getNativeContext$1, isNativeOfflineAudioContext$1, setAudioNodeTailTime$1) => {
	return class WaveShaperNode extends audioNodeConstructor$1 {
		constructor(context, options) {
			const nativeContext = getNativeContext$1(context);
			const nativeWaveShaperNode = createNativeWaveShaperNode$1(nativeContext, {
				...DEFAULT_OPTIONS,
				...options
			});
			const waveShaperNodeRenderer = isNativeOfflineAudioContext$1(nativeContext) ? createWaveShaperNodeRenderer() : null;
			super(context, true, nativeWaveShaperNode, waveShaperNodeRenderer);
			this._isCurveNullified = false;
			this._nativeWaveShaperNode = nativeWaveShaperNode;
			setAudioNodeTailTime$1(this, 1);
		}
		get curve() {
			if (this._isCurveNullified) return null;
			return this._nativeWaveShaperNode.curve;
		}
		set curve(value) {
			if (value === null) {
				this._isCurveNullified = true;
				this._nativeWaveShaperNode.curve = new Float32Array([0, 0]);
			} else {
				if (value.length < 2) throw createInvalidStateError$1();
				this._isCurveNullified = false;
				this._nativeWaveShaperNode.curve = value;
			}
		}
		get oversample() {
			return this._nativeWaveShaperNode.oversample;
		}
		set oversample(value) {
			this._nativeWaveShaperNode.oversample = value;
		}
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/wave-shaper-node-renderer-factory.js
const createWaveShaperNodeRendererFactory = (createNativeWaveShaperNode$1, getNativeAudioNode$1, renderInputsOfAudioNode$1) => {
	return () => {
		const renderedNativeWaveShaperNodes = /* @__PURE__ */ new WeakMap();
		const createWaveShaperNode = async (proxy, nativeOfflineAudioContext) => {
			let nativeWaveShaperNode = getNativeAudioNode$1(proxy);
			if (!isOwnedByContext(nativeWaveShaperNode, nativeOfflineAudioContext)) nativeWaveShaperNode = createNativeWaveShaperNode$1(nativeOfflineAudioContext, {
				channelCount: nativeWaveShaperNode.channelCount,
				channelCountMode: nativeWaveShaperNode.channelCountMode,
				channelInterpretation: nativeWaveShaperNode.channelInterpretation,
				curve: nativeWaveShaperNode.curve,
				oversample: nativeWaveShaperNode.oversample
			});
			renderedNativeWaveShaperNodes.set(nativeOfflineAudioContext, nativeWaveShaperNode);
			if (isNativeAudioNodeFaker(nativeWaveShaperNode)) await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeWaveShaperNode.inputs[0]);
			else await renderInputsOfAudioNode$1(proxy, nativeOfflineAudioContext, nativeWaveShaperNode);
			return nativeWaveShaperNode;
		};
		return { render(proxy, nativeOfflineAudioContext) {
			const renderedNativeWaveShaperNode = renderedNativeWaveShaperNodes.get(nativeOfflineAudioContext);
			if (renderedNativeWaveShaperNode !== void 0) return Promise.resolve(renderedNativeWaveShaperNode);
			return createWaveShaperNode(proxy, nativeOfflineAudioContext);
		} };
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/window.js
const createWindow = () => typeof window === "undefined" ? null : window;

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/wrap-audio-buffer-copy-channel-methods.js
const createWrapAudioBufferCopyChannelMethods = (convertNumberToUnsignedLong$1, createIndexSizeError$1) => {
	return (audioBuffer) => {
		audioBuffer.copyFromChannel = (destination, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
			const bufferOffset = convertNumberToUnsignedLong$1(bufferOffsetAsNumber);
			const channelNumber = convertNumberToUnsignedLong$1(channelNumberAsNumber);
			if (channelNumber >= audioBuffer.numberOfChannels) throw createIndexSizeError$1();
			const audioBufferLength = audioBuffer.length;
			const channelData = audioBuffer.getChannelData(channelNumber);
			const destinationLength = destination.length;
			for (let i = bufferOffset < 0 ? -bufferOffset : 0; i + bufferOffset < audioBufferLength && i < destinationLength; i += 1) destination[i] = channelData[i + bufferOffset];
		};
		audioBuffer.copyToChannel = (source, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
			const bufferOffset = convertNumberToUnsignedLong$1(bufferOffsetAsNumber);
			const channelNumber = convertNumberToUnsignedLong$1(channelNumberAsNumber);
			if (channelNumber >= audioBuffer.numberOfChannels) throw createIndexSizeError$1();
			const audioBufferLength = audioBuffer.length;
			const channelData = audioBuffer.getChannelData(channelNumber);
			const sourceLength = source.length;
			for (let i = bufferOffset < 0 ? -bufferOffset : 0; i + bufferOffset < audioBufferLength && i < sourceLength; i += 1) channelData[i + bufferOffset] = source[i];
		};
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/wrap-audio-buffer-copy-channel-methods-out-of-bounds.js
const createWrapAudioBufferCopyChannelMethodsOutOfBounds = (convertNumberToUnsignedLong$1) => {
	return (audioBuffer) => {
		audioBuffer.copyFromChannel = ((copyFromChannel$1) => {
			return (destination, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
				const bufferOffset = convertNumberToUnsignedLong$1(bufferOffsetAsNumber);
				const channelNumber = convertNumberToUnsignedLong$1(channelNumberAsNumber);
				if (bufferOffset < audioBuffer.length) return copyFromChannel$1.call(audioBuffer, destination, channelNumber, bufferOffset);
			};
		})(audioBuffer.copyFromChannel);
		audioBuffer.copyToChannel = ((copyToChannel$1) => {
			return (source, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
				const bufferOffset = convertNumberToUnsignedLong$1(bufferOffsetAsNumber);
				const channelNumber = convertNumberToUnsignedLong$1(channelNumberAsNumber);
				if (bufferOffset < audioBuffer.length) return copyToChannel$1.call(audioBuffer, source, channelNumber, bufferOffset);
			};
		})(audioBuffer.copyToChannel);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/wrap-audio-buffer-source-node-stop-method-nullified-buffer.js
const createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer = (overwriteAccessors$1) => {
	return (nativeAudioBufferSourceNode, nativeContext) => {
		const nullifiedBuffer = nativeContext.createBuffer(1, 1, 44100);
		if (nativeAudioBufferSourceNode.buffer === null) nativeAudioBufferSourceNode.buffer = nullifiedBuffer;
		overwriteAccessors$1(nativeAudioBufferSourceNode, "buffer", (get) => () => {
			const value = get.call(nativeAudioBufferSourceNode);
			return value === nullifiedBuffer ? null : value;
		}, (set) => (value) => {
			return set.call(nativeAudioBufferSourceNode, value === null ? nullifiedBuffer : value);
		});
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/factories/wrap-channel-merger-node.js
const createWrapChannelMergerNode = (createInvalidStateError$1, monitorConnections$1) => {
	return (nativeContext, channelMergerNode) => {
		channelMergerNode.channelCount = 1;
		channelMergerNode.channelCountMode = "explicit";
		Object.defineProperty(channelMergerNode, "channelCount", {
			get: () => 1,
			set: () => {
				throw createInvalidStateError$1();
			}
		});
		Object.defineProperty(channelMergerNode, "channelCountMode", {
			get: () => "explicit",
			set: () => {
				throw createInvalidStateError$1();
			}
		});
		const audioBufferSourceNode = nativeContext.createBufferSource();
		const whenConnected = () => {
			const length = channelMergerNode.numberOfInputs;
			for (let i = 0; i < length; i += 1) audioBufferSourceNode.connect(channelMergerNode, 0, i);
		};
		const whenDisconnected = () => audioBufferSourceNode.disconnect(channelMergerNode);
		monitorConnections$1(channelMergerNode, whenConnected, whenDisconnected);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/get-first-sample.js
const getFirstSample = (audioBuffer, buffer, channelNumber) => {
	if (audioBuffer.copyFromChannel === void 0) return audioBuffer.getChannelData(channelNumber)[0];
	audioBuffer.copyFromChannel(buffer, channelNumber);
	return buffer[0];
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/is-dc-curve.js
const isDCCurve = (curve) => {
	if (curve === null) return false;
	const length = curve.length;
	if (length % 2 !== 0) return curve[Math.floor(length / 2)] !== 0;
	return curve[length / 2 - 1] + curve[length / 2] !== 0;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/overwrite-accessors.js
const overwriteAccessors = (object, property, createGetter, createSetter) => {
	let prototype = object;
	while (!prototype.hasOwnProperty(property)) prototype = Object.getPrototypeOf(prototype);
	const { get, set } = Object.getOwnPropertyDescriptor(prototype, property);
	Object.defineProperty(object, property, {
		get: createGetter(get),
		set: createSetter(set)
	});
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/sanitize-audio-worklet-node-options.js
const sanitizeAudioWorkletNodeOptions = (options) => {
	return {
		...options,
		outputChannelCount: options.outputChannelCount !== void 0 ? options.outputChannelCount : options.numberOfInputs === 1 && options.numberOfOutputs === 1 ? [options.channelCount] : Array.from({ length: options.numberOfOutputs }, () => 1)
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/sanitize-channel-splitter-options.js
const sanitizeChannelSplitterOptions = (options) => {
	return {
		...options,
		channelCount: options.numberOfOutputs
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/sanitize-periodic-wave-options.js
const sanitizePeriodicWaveOptions = (options) => {
	const { imag, real } = options;
	if (imag === void 0) {
		if (real === void 0) return {
			...options,
			imag: [0, 0],
			real: [0, 0]
		};
		return {
			...options,
			imag: Array.from(real, () => 0),
			real
		};
	}
	if (real === void 0) return {
		...options,
		imag,
		real: Array.from(imag, () => 0)
	};
	return {
		...options,
		imag,
		real
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/set-value-at-time-until-possible.js
const setValueAtTimeUntilPossible = (audioParam, value, startTime) => {
	try {
		audioParam.setValueAtTime(value, startTime);
	} catch (err) {
		if (err.code !== 9) throw err;
		setValueAtTimeUntilPossible(audioParam, value, startTime + 1e-7);
	}
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-buffer-source-node-start-method-consecutive-calls-support.js
const testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport = (nativeContext) => {
	const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
	nativeAudioBufferSourceNode.start();
	try {
		nativeAudioBufferSourceNode.start();
	} catch {
		return true;
	}
	return false;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-buffer-source-node-start-method-offset-clamping-support.js
const testAudioBufferSourceNodeStartMethodOffsetClampingSupport = (nativeContext) => {
	const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
	nativeAudioBufferSourceNode.buffer = nativeContext.createBuffer(1, 1, 44100);
	try {
		nativeAudioBufferSourceNode.start(0, 1);
	} catch {
		return false;
	}
	return true;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-buffer-source-node-stop-method-nullified-buffer-support.js
const testAudioBufferSourceNodeStopMethodNullifiedBufferSupport = (nativeContext) => {
	const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
	nativeAudioBufferSourceNode.start();
	try {
		nativeAudioBufferSourceNode.stop();
	} catch {
		return false;
	}
	return true;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-scheduled-source-node-start-method-negative-parameters-support.js
const testAudioScheduledSourceNodeStartMethodNegativeParametersSupport = (nativeContext) => {
	const nativeAudioBufferSourceNode = nativeContext.createOscillator();
	try {
		nativeAudioBufferSourceNode.start(-1);
	} catch (err) {
		return err instanceof RangeError;
	}
	return false;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-scheduled-source-node-stop-method-consecutive-calls-support.js
const testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport = (nativeContext) => {
	const nativeAudioBuffer = nativeContext.createBuffer(1, 1, 44100);
	const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
	nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
	nativeAudioBufferSourceNode.start();
	nativeAudioBufferSourceNode.stop();
	try {
		nativeAudioBufferSourceNode.stop();
		return true;
	} catch {
		return false;
	}
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-scheduled-source-node-stop-method-negative-parameters-support.js
const testAudioScheduledSourceNodeStopMethodNegativeParametersSupport = (nativeContext) => {
	const nativeAudioBufferSourceNode = nativeContext.createOscillator();
	try {
		nativeAudioBufferSourceNode.stop(-1);
	} catch (err) {
		return err instanceof RangeError;
	}
	return false;
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/test-audio-worklet-node-options-clonability.js
const testAudioWorkletNodeOptionsClonability = (audioWorkletNodeOptions) => {
	const { port1, port2 } = new MessageChannel();
	try {
		port1.postMessage(audioWorkletNodeOptions);
	} finally {
		port1.close();
		port2.close();
	}
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-buffer-source-node-start-method-offset-clamping.js
const wrapAudioBufferSourceNodeStartMethodOffsetClamping = (nativeAudioBufferSourceNode) => {
	nativeAudioBufferSourceNode.start = ((start) => {
		return (when = 0, offset = 0, duration) => {
			const buffer = nativeAudioBufferSourceNode.buffer;
			const clampedOffset = buffer === null ? offset : Math.min(buffer.duration, offset);
			if (buffer !== null && clampedOffset > buffer.duration - .5 / nativeAudioBufferSourceNode.context.sampleRate) start.call(nativeAudioBufferSourceNode, when, 0, 0);
			else start.call(nativeAudioBufferSourceNode, when, clampedOffset, duration);
		};
	})(nativeAudioBufferSourceNode.start);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-audio-scheduled-source-node-stop-method-consecutive-calls.js
const wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls = (nativeAudioScheduledSourceNode, nativeContext) => {
	const nativeGainNode = nativeContext.createGain();
	nativeAudioScheduledSourceNode.connect(nativeGainNode);
	const disconnectGainNode = ((disconnect) => {
		return () => {
			disconnect.call(nativeAudioScheduledSourceNode, nativeGainNode);
			nativeAudioScheduledSourceNode.removeEventListener("ended", disconnectGainNode);
		};
	})(nativeAudioScheduledSourceNode.disconnect);
	nativeAudioScheduledSourceNode.addEventListener("ended", disconnectGainNode);
	interceptConnections(nativeAudioScheduledSourceNode, nativeGainNode);
	nativeAudioScheduledSourceNode.stop = ((stop) => {
		let isStopped = false;
		return (when = 0) => {
			if (isStopped) try {
				stop.call(nativeAudioScheduledSourceNode, when);
			} catch {
				nativeGainNode.gain.setValueAtTime(0, when);
			}
			else {
				stop.call(nativeAudioScheduledSourceNode, when);
				isStopped = true;
			}
		};
	})(nativeAudioScheduledSourceNode.stop);
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/helpers/wrap-event-listener.js
const wrapEventListener = (target, eventListener) => {
	return (event) => {
		const descriptor = { value: target };
		Object.defineProperties(event, {
			currentTarget: descriptor,
			target: descriptor
		});
		if (typeof eventListener === "function") return eventListener.call(target, event);
		return eventListener.handleEvent.call(target, event);
	};
};

//#endregion
//#region node_modules/standardized-audio-context/build/es2019/module.js
var import_bundle = require_bundle();
var addActiveInputConnectionToAudioNode = createAddActiveInputConnectionToAudioNode(insertElementInSet);
var addPassiveInputConnectionToAudioNode = createAddPassiveInputConnectionToAudioNode(insertElementInSet);
var deleteActiveInputConnectionToAudioNode = createDeleteActiveInputConnectionToAudioNode(pickElementFromSet);
var audioNodeTailTimeStore = /* @__PURE__ */ new WeakMap();
var getAudioNodeTailTime = createGetAudioNodeTailTime(audioNodeTailTimeStore);
var cacheTestResult = createCacheTestResult(/* @__PURE__ */ new Map(), /* @__PURE__ */ new WeakMap());
var window$1 = createWindow();
var createNativeAnalyserNode = createNativeAnalyserNodeFactory(cacheTestResult, createIndexSizeError);
var getAudioNodeRenderer = createGetAudioNodeRenderer(getAudioNodeConnections);
var renderInputsOfAudioNode = createRenderInputsOfAudioNode(getAudioNodeConnections, getAudioNodeRenderer, isPartOfACycle);
var createAnalyserNodeRenderer = createAnalyserNodeRendererFactory(createNativeAnalyserNode, getNativeAudioNode, renderInputsOfAudioNode);
var getNativeContext = createGetNativeContext(CONTEXT_STORE);
var nativeOfflineAudioContextConstructor = createNativeOfflineAudioContextConstructor(window$1);
var isNativeOfflineAudioContext = createIsNativeOfflineAudioContext(nativeOfflineAudioContextConstructor);
var audioParamAudioNodeStore = /* @__PURE__ */ new WeakMap();
var eventTargetConstructor = createEventTargetConstructor(wrapEventListener);
var nativeAudioContextConstructor = createNativeAudioContextConstructor(window$1);
var isNativeAudioContext = createIsNativeAudioContext(nativeAudioContextConstructor);
var isNativeAudioNode = createIsNativeAudioNode(window$1);
var isNativeAudioParam = createIsNativeAudioParam(window$1);
var nativeAudioWorkletNodeConstructor = createNativeAudioWorkletNodeConstructor(window$1);
var audioNodeConstructor = createAudioNodeConstructor(createAddAudioNodeConnections(AUDIO_NODE_CONNECTIONS_STORE), createAddConnectionToAudioNode(addActiveInputConnectionToAudioNode, addPassiveInputConnectionToAudioNode, connectNativeAudioNodeToNativeAudioNode, deleteActiveInputConnectionToAudioNode, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getAudioNodeTailTime, getEventListenersOfAudioNode, getNativeAudioNode, insertElementInSet, isActiveAudioNode, isPartOfACycle, isPassiveAudioNode), cacheTestResult, createIncrementCycleCounterFactory(CYCLE_COUNTERS, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, isActiveAudioNode), createIndexSizeError, createInvalidAccessError, createNotSupportedError, createDecrementCycleCounter(connectNativeAudioNodeToNativeAudioNode, CYCLE_COUNTERS, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, getNativeContext, isActiveAudioNode, isNativeOfflineAudioContext), createDetectCycles(audioParamAudioNodeStore, getAudioNodeConnections, getValueForKey), eventTargetConstructor, getNativeContext, isNativeAudioContext, isNativeAudioNode, isNativeAudioParam, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor);
var analyserNodeConstructor = createAnalyserNodeConstructor(audioNodeConstructor, createAnalyserNodeRenderer, createIndexSizeError, createNativeAnalyserNode, getNativeContext, isNativeOfflineAudioContext);
var audioBufferStore = /* @__PURE__ */ new WeakSet();
var nativeAudioBufferConstructor = createNativeAudioBufferConstructor(window$1);
var convertNumberToUnsignedLong = createConvertNumberToUnsignedLong(new Uint32Array(1));
var wrapAudioBufferCopyChannelMethods = createWrapAudioBufferCopyChannelMethods(convertNumberToUnsignedLong, createIndexSizeError);
var wrapAudioBufferCopyChannelMethodsOutOfBounds = createWrapAudioBufferCopyChannelMethodsOutOfBounds(convertNumberToUnsignedLong);
var audioBufferConstructor = createAudioBufferConstructor(audioBufferStore, cacheTestResult, createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, createTestAudioBufferConstructorSupport(nativeAudioBufferConstructor), wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
var addSilentConnection = createAddSilentConnection(createNativeGainNode);
var renderInputsOfAudioParam = createRenderInputsOfAudioParam(getAudioNodeRenderer, getAudioParamConnections, isPartOfACycle);
var connectAudioParam = createConnectAudioParam(renderInputsOfAudioParam);
var createNativeAudioBufferSourceNode = createNativeAudioBufferSourceNodeFactory(addSilentConnection, cacheTestResult, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, testAudioBufferSourceNodeStartMethodOffsetClampingSupport, testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioBufferSourceNodeStartMethodOffsetClamping, createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer(overwriteAccessors), wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
var renderAutomation = createRenderAutomation(createGetAudioParamRenderer(getAudioParamConnections), renderInputsOfAudioParam);
var createAudioBufferSourceNodeRenderer = createAudioBufferSourceNodeRendererFactory(connectAudioParam, createNativeAudioBufferSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
var createAudioParam = createAudioParamFactory(createAddAudioParamConnections(AUDIO_PARAM_CONNECTIONS_STORE), audioParamAudioNodeStore, AUDIO_PARAM_STORE, createAudioParamRenderer, import_bundle.createCancelAndHoldAutomationEvent, import_bundle.createCancelScheduledValuesAutomationEvent, import_bundle.createExponentialRampToValueAutomationEvent, import_bundle.createLinearRampToValueAutomationEvent, import_bundle.createSetTargetAutomationEvent, import_bundle.createSetValueAutomationEvent, import_bundle.createSetValueCurveAutomationEvent, nativeAudioContextConstructor, setValueAtTimeUntilPossible);
var audioBufferSourceNodeConstructor = createAudioBufferSourceNodeConstructor(audioNodeConstructor, createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
var audioDestinationNodeConstructor = createAudioDestinationNodeConstructor(audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNodeFactory(createNativeGainNode, overwriteAccessors), getNativeContext, isNativeOfflineAudioContext, renderInputsOfAudioNode);
var createBiquadFilterNodeRenderer = createBiquadFilterNodeRendererFactory(connectAudioParam, createNativeBiquadFilterNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
var setAudioNodeTailTime = createSetAudioNodeTailTime(audioNodeTailTimeStore);
var biquadFilterNodeConstructor = createBiquadFilterNodeConstructor(audioNodeConstructor, createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var monitorConnections = createMonitorConnections(insertElementInSet, isNativeAudioNode);
var createNativeChannelMergerNode = createNativeChannelMergerNodeFactory(nativeAudioContextConstructor, createWrapChannelMergerNode(createInvalidStateError, monitorConnections));
var channelMergerNodeConstructor = createChannelMergerNodeConstructor(audioNodeConstructor, createChannelMergerNodeRendererFactory(createNativeChannelMergerNode, getNativeAudioNode, renderInputsOfAudioNode), createNativeChannelMergerNode, getNativeContext, isNativeOfflineAudioContext);
var channelSplitterNodeConstructor = createChannelSplitterNodeConstructor(audioNodeConstructor, createChannelSplitterNodeRendererFactory(createNativeChannelSplitterNode, getNativeAudioNode, renderInputsOfAudioNode), createNativeChannelSplitterNode, getNativeContext, isNativeOfflineAudioContext, sanitizeChannelSplitterOptions);
var createNativeConstantSourceNode = createNativeConstantSourceNodeFactory(addSilentConnection, cacheTestResult, createNativeConstantSourceNodeFakerFactory(addSilentConnection, createNativeAudioBufferSourceNode, createNativeGainNode, monitorConnections), testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport);
var constantSourceNodeConstructor = createConstantSourceNodeConstructor(audioNodeConstructor, createAudioParam, createConstantSourceNodeRendererFactory(connectAudioParam, createNativeConstantSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode), createNativeConstantSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
var createNativeConvolverNode = createNativeConvolverNodeFactory(createNotSupportedError, overwriteAccessors);
var convolverNodeConstructor = createConvolverNodeConstructor(audioNodeConstructor, createConvolverNodeRendererFactory(createNativeConvolverNode, getNativeAudioNode, renderInputsOfAudioNode), createNativeConvolverNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var delayNodeConstructor = createDelayNodeConstructor(audioNodeConstructor, createAudioParam, createDelayNodeRendererFactory(connectAudioParam, createNativeDelayNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode), createNativeDelayNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var createNativeDynamicsCompressorNode = createNativeDynamicsCompressorNodeFactory(createNotSupportedError);
var dynamicsCompressorNodeConstructor = createDynamicsCompressorNodeConstructor(audioNodeConstructor, createAudioParam, createDynamicsCompressorNodeRendererFactory(connectAudioParam, createNativeDynamicsCompressorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode), createNativeDynamicsCompressorNode, createNotSupportedError, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var gainNodeConstructor = createGainNodeConstructor(audioNodeConstructor, createAudioParam, createGainNodeRendererFactory(connectAudioParam, createNativeGainNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode), createNativeGainNode, getNativeContext, isNativeOfflineAudioContext);
var createNativeIIRFilterNodeFaker = createNativeIIRFilterNodeFakerFactory(createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError);
var renderNativeOfflineAudioContext = createRenderNativeOfflineAudioContext(cacheTestResult, createNativeGainNode, createNativeScriptProcessorNode, createTestOfflineAudioContextCurrentTimeSupport(createNativeGainNode, nativeOfflineAudioContextConstructor));
var createIIRFilterNodeRenderer = createIIRFilterNodeRendererFactory(createNativeAudioBufferSourceNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
var iIRFilterNodeConstructor = createIIRFilterNodeConstructor(audioNodeConstructor, createNativeIIRFilterNodeFactory(createNativeIIRFilterNodeFaker), createIIRFilterNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var createAudioListener = createAudioListenerFactory(createAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeScriptProcessorNode, createNotSupportedError, getFirstSample, isNativeOfflineAudioContext, overwriteAccessors);
var unrenderedAudioWorkletNodeStore = /* @__PURE__ */ new WeakMap();
var minimalBaseAudioContextConstructor = createMinimalBaseAudioContextConstructor(audioDestinationNodeConstructor, createAudioListener, eventTargetConstructor, isNativeOfflineAudioContext, unrenderedAudioWorkletNodeStore, wrapEventListener);
var createNativeOscillatorNode = createNativeOscillatorNodeFactory(addSilentConnection, cacheTestResult, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
var oscillatorNodeConstructor = createOscillatorNodeConstructor(audioNodeConstructor, createAudioParam, createNativeOscillatorNode, createOscillatorNodeRendererFactory(connectAudioParam, createNativeOscillatorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode), getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
var createConnectedNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNodeFactory(createNativeAudioBufferSourceNode);
var createNativeWaveShaperNode = createNativeWaveShaperNodeFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeWaveShaperNodeFakerFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeGainNode, isDCCurve, monitorConnections), isDCCurve, monitorConnections, nativeAudioContextConstructor, overwriteAccessors);
var createNativePannerNode = createNativePannerNodeFactory(createNativePannerNodeFakerFactory(connectNativeAudioNodeToNativeAudioNode, createInvalidStateError, createNativeChannelMergerNode, createNativeGainNode, createNativeScriptProcessorNode, createNativeWaveShaperNode, createNotSupportedError, disconnectNativeAudioNodeFromNativeAudioNode, getFirstSample, monitorConnections));
var pannerNodeConstructor = createPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativePannerNode, createPannerNodeRendererFactory(connectAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeGainNode, createNativePannerNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext), getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var periodicWaveConstructor = createPeriodicWaveConstructor(createNativePeriodicWaveFactory(createIndexSizeError), getNativeContext, /* @__PURE__ */ new WeakSet(), sanitizePeriodicWaveOptions);
var createNativeStereoPannerNode = createNativeStereoPannerNodeFactory(createNativeStereoPannerNodeFakerFactory(createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError, monitorConnections), createNotSupportedError);
var stereoPannerNodeConstructor = createStereoPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRendererFactory(connectAudioParam, createNativeStereoPannerNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode), getNativeContext, isNativeOfflineAudioContext);
var waveShaperNodeConstructor = createWaveShaperNodeConstructor(audioNodeConstructor, createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRendererFactory(createNativeWaveShaperNode, getNativeAudioNode, renderInputsOfAudioNode), getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
var isSecureContext = createIsSecureContext(window$1);
var exposeCurrentFrameAndCurrentTime = createExposeCurrentFrameAndCurrentTime(window$1);
var backupOfflineAudioContextStore = /* @__PURE__ */ new WeakMap();
var getOrCreateBackupOfflineAudioContext = createGetOrCreateBackupOfflineAudioContext(backupOfflineAudioContextStore, nativeOfflineAudioContextConstructor);
const addAudioWorkletModule = isSecureContext ? createAddAudioWorkletModule(cacheTestResult, createNotSupportedError, createEvaluateSource(window$1), exposeCurrentFrameAndCurrentTime, createFetchSource(createAbortError), getNativeContext, getOrCreateBackupOfflineAudioContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, /* @__PURE__ */ new WeakMap(), /* @__PURE__ */ new WeakMap(), createTestAudioWorkletProcessorPostMessageSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor), window$1) : void 0;
var isNativeContext = createIsNativeContext(isNativeAudioContext, isNativeOfflineAudioContext);
const decodeAudioData = createDecodeAudioData(audioBufferStore, cacheTestResult, createDataCloneError, createEncodingError, /* @__PURE__ */ new WeakSet(), getNativeContext, isNativeContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, testPromiseSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
var baseAudioContextConstructor = createBaseAudioContextConstructor(addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, convolverNodeConstructor, decodeAudioData, delayNodeConstructor, dynamicsCompressorNodeConstructor, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, pannerNodeConstructor, periodicWaveConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor);
var mediaElementAudioSourceNodeConstructor = createMediaElementAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaElementAudioSourceNode, getNativeContext, isNativeOfflineAudioContext);
var mediaStreamAudioDestinationNodeConstructor = createMediaStreamAudioDestinationNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext);
var mediaStreamAudioSourceNodeConstructor = createMediaStreamAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioSourceNode, getNativeContext, isNativeOfflineAudioContext);
var mediaStreamTrackAudioSourceNodeConstructor = createMediaStreamTrackAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamTrackAudioSourceNodeFactory(createInvalidStateError, isNativeOfflineAudioContext), getNativeContext);
var audioContextConstructor = createAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, createNotSupportedError, createUnknownError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioDestinationNodeConstructor, mediaStreamAudioSourceNodeConstructor, mediaStreamTrackAudioSourceNodeConstructor, nativeAudioContextConstructor);
var getUnrenderedAudioWorkletNodes = createGetUnrenderedAudioWorkletNodes(unrenderedAudioWorkletNodeStore);
var addUnrenderedAudioWorkletNode = createAddUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes);
var connectMultipleOutputs = createConnectMultipleOutputs(createIndexSizeError);
var deleteUnrenderedAudioWorkletNode = createDeleteUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes);
var disconnectMultipleOutputs = createDisconnectMultipleOutputs(createIndexSizeError);
var activeAudioWorkletNodeInputsStore = /* @__PURE__ */ new WeakMap();
var createNativeAudioWorkletNode = createNativeAudioWorkletNodeFactory(createInvalidStateError, createNativeAudioWorkletNodeFakerFactory(connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, createGetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore, getValueForKey), monitorConnections), createNativeGainNode, createNotSupportedError, monitorConnections);
var createAudioWorkletNodeRenderer = createAudioWorkletNodeRendererFactory(connectAudioParam, connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, deleteUnrenderedAudioWorkletNode, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getNativeAudioNode, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
var getBackupOfflineAudioContext = createGetBackupOfflineAudioContext(backupOfflineAudioContextStore);
var setActiveAudioWorkletNodeInputs = createSetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore);
var audioWorkletNodeConstructor = isSecureContext ? createAudioWorkletNodeConstructor(addUnrenderedAudioWorkletNode, audioNodeConstructor, createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, getAudioNodeConnections, getBackupOfflineAudioContext, getNativeContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, sanitizeAudioWorkletNodeOptions, setActiveAudioWorkletNodeInputs, testAudioWorkletNodeOptionsClonability, wrapEventListener) : void 0;
var minimalAudioContextConstructor = createMinimalAudioContextConstructor(createInvalidStateError, createNotSupportedError, createUnknownError, minimalBaseAudioContextConstructor, nativeAudioContextConstructor);
var createNativeOfflineAudioContext = createCreateNativeOfflineAudioContext(createNotSupportedError, nativeOfflineAudioContextConstructor);
var startRendering = createStartRendering(audioBufferStore, cacheTestResult, getAudioNodeRenderer, getUnrenderedAudioWorkletNodes, renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
var minimalOfflineAudioContextConstructor = createMinimalOfflineAudioContextConstructor(cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, minimalBaseAudioContextConstructor, startRendering);
var offlineAudioContextConstructor = createOfflineAudioContextConstructor(baseAudioContextConstructor, cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, startRendering);
const isAnyAudioContext = createIsAnyAudioContext(CONTEXT_STORE, isNativeAudioContext);
const isAnyAudioNode = createIsAnyAudioNode(AUDIO_NODE_STORE, isNativeAudioNode);
const isAnyAudioParam = createIsAnyAudioParam(AUDIO_PARAM_STORE, isNativeAudioParam);
const isAnyOfflineAudioContext = createIsAnyOfflineAudioContext(CONTEXT_STORE, isNativeOfflineAudioContext);

//#endregion
//#region node_modules/web-audio-beat-detector-broker/build/es2019/helpers/render.js
const render = (audioBuffer, offset, duration) => {
	const offlineAudioContext = new offlineAudioContextConstructor(audioBuffer.numberOfChannels, Math.round(duration * audioBuffer.sampleRate), audioBuffer.sampleRate);
	const biquadFilter = offlineAudioContext.createBiquadFilter();
	const bufferSourceNode = offlineAudioContext.createBufferSource();
	biquadFilter.frequency.value = 240;
	biquadFilter.type = "lowpass";
	bufferSourceNode.buffer = audioBuffer;
	bufferSourceNode.connect(biquadFilter).connect(offlineAudioContext.destination);
	bufferSourceNode.start(0, offset, duration);
	return offlineAudioContext.startRendering().then((renderedBuffer) => {
		return {
			channelData: renderedBuffer.getChannelData(0),
			sampleRate: renderedBuffer.sampleRate
		};
	});
};

//#endregion
//#region node_modules/web-audio-beat-detector-broker/build/es2019/module.js
const wrap = createBroker({
	analyze: ({ call }) => {
		return async (...args) => {
			var _a;
			const [audioBuffer, offsetOrTempoSettings, durationOrTempoSettings] = args;
			const offset = typeof offsetOrTempoSettings === "number" ? offsetOrTempoSettings : 0;
			const { channelData, sampleRate } = await render(audioBuffer, offset, typeof durationOrTempoSettings === "number" ? durationOrTempoSettings : audioBuffer.duration - offset);
			const tempoSettings = typeof offsetOrTempoSettings === "object" ? offsetOrTempoSettings : typeof durationOrTempoSettings === "object" ? durationOrTempoSettings : (_a = args[3]) !== null && _a !== void 0 ? _a : null;
			return call("analyze", {
				channelData,
				sampleRate,
				...tempoSettings === null ? tempoSettings : { tempoSettings }
			}, [channelData.buffer]);
		};
	},
	guess: ({ call }) => {
		return async (...args) => {
			var _a;
			const [audioBuffer, offsetOrTempoSettings, durationOrTempoSettings] = args;
			const offset = typeof offsetOrTempoSettings === "number" ? offsetOrTempoSettings : 0;
			const { channelData, sampleRate } = await render(audioBuffer, offset, typeof durationOrTempoSettings === "number" ? durationOrTempoSettings : audioBuffer.duration - offset);
			const tempoSettings = typeof offsetOrTempoSettings === "object" ? offsetOrTempoSettings : typeof durationOrTempoSettings === "object" ? durationOrTempoSettings : (_a = args[3]) !== null && _a !== void 0 ? _a : null;
			return call("guess", {
				channelData,
				sampleRate,
				...tempoSettings === null ? tempoSettings : { tempoSettings }
			}, [channelData.buffer]);
		};
	}
});
const load = (url) => {
	return wrap(new Worker(url));
};

//#endregion
//#region node_modules/web-audio-beat-detector/build/es2019/factories/load-or-return-broker.js
const createLoadOrReturnBroker = (loadBroker, worker$1) => {
	let broker = null;
	return () => {
		if (broker !== null) return broker;
		const blob = new Blob([worker$1], { type: "application/javascript; charset=utf-8" });
		const url = URL.createObjectURL(blob);
		broker = loadBroker(url);
		setTimeout(() => URL.revokeObjectURL(url));
		return broker;
	};
};

//#endregion
//#region node_modules/web-audio-beat-detector/build/es2019/worker/worker.js
const worker = `(()=>{var e={455(e,t){!function(e){"use strict";var t=function(e){return function(t){var r=e(t);return t.add(r),r}},r=function(e){return function(t,r){return e.set(t,r),r}},n=void 0===Number.MAX_SAFE_INTEGER?9007199254740991:Number.MAX_SAFE_INTEGER,o=536870912,s=2*o,a=function(e,t){return function(r){var a=t.get(r),i=void 0===a?r.size:a<s?a+1:0;if(!r.has(i))return e(r,i);if(r.size<o){for(;r.has(i);)i=Math.floor(Math.random()*s);return e(r,i)}if(r.size>n)throw new Error("Congratulations, you created a collection of unique numbers which uses all available integers!");for(;r.has(i);)i=Math.floor(Math.random()*n);return e(r,i)}},i=new WeakMap,c=r(i),u=a(c,i),l=t(u);e.addUniqueNumber=l,e.generateUniqueNumber=u}(t)}},t={};function r(n){var o=t[n];if(void 0!==o)return o.exports;var s=t[n]={exports:{}};return e[n].call(s.exports,s,s.exports,r),s.exports}(()=>{"use strict";const e=-32603,t=-32602,n=-32601,o=(e,t)=>Object.assign(new Error(e),{status:t}),s=t=>o('The handler of the method called "'.concat(t,'" returned an unexpected result.'),e),a=(t,r)=>async({data:{id:a,method:i,params:c}})=>{const u=r[i];try{if(void 0===u)throw(e=>o('The requested method called "'.concat(e,'" is not supported.'),n))(i);const r=void 0===c?u():u(c);if(void 0===r)throw(t=>o('The handler of the method called "'.concat(t,'" returned no required result.'),e))(i);const l=r instanceof Promise?await r:r;if(null===a){if(void 0!==l.result)throw s(i)}else{if(void 0===l.result)throw s(i);const{result:e,transferables:r=[]}=l;t.postMessage({id:a,result:e},r)}}catch(e){const{message:r,status:n=-32603}=e;t.postMessage({error:{code:n,message:r},id:a})}};var i=r(455);const c=new Map,u=(e,r,n)=>({...r,connect:({port:t})=>{t.start();const n=e(t,r),o=(0,i.generateUniqueNumber)(c);return c.set(o,()=>{n(),t.close(),c.delete(o)}),{result:o}},disconnect:({portId:e})=>{const r=c.get(e);if(void 0===r)throw(e=>o('The specified parameter called "portId" with the given value "'.concat(e,'" does not identify a port connected to this worker.'),t))(e);return r(),{result:null}},isSupported:async()=>{if(await new Promise(e=>{const t=new ArrayBuffer(0),{port1:r,port2:n}=new MessageChannel;r.onmessage=({data:t})=>e(null!==t),n.postMessage(t,[t])})){const e=n();return{result:e instanceof Promise?await e:e}}return{result:!1}}}),l=(e,t,r=()=>!0)=>{const n=u(l,t,r),o=a(e,n);return e.addEventListener("message",o),()=>e.removeEventListener("message",o)},h=(e,t,r)=>{const n=e.length,o=[];let s=!1;for(let a=0;a<n;a+=1)e[a]>t?s=!0:s&&(s=!1,o.push(a-1),a+=r/4-1);return s&&o.push(n-1),o},d=(e,t,r)=>{const n=(e=>{let t=0;const r=e.length;for(let n=0;n<r;n+=1)e[n]>t&&(t=e[n]);return t})(e),o=.3*n;let s=[],a=n-.05*n;if(n>.25)for(;s.length<30&&a>=o;)s=h(e,a,t),a-=.05*n;const i=(e=>{const t=[];return e.forEach((r,n)=>{const o=Math.min(e.length-n,10);for(let s=1;s<o;s+=1){const o=e[n+s]-r;t.some(e=>e.interval===o&&(e.peaks.push(r),!0))||t.push({interval:o,peaks:[r]})}}),t})(s),c=((e,t,r={})=>{var n,o;const s=Math.max(0,null!==(n=r.maxTempo)&&void 0!==n?n:180),a=Math.max(0,null!==(o=r.minTempo)&&void 0!==o?o:90),i=[];return e.forEach(e=>{let r=60/(e.interval/t);for(;r<a;)r*=2;for(;r>s;)r/=2;if(r<a)return;let n=!1,o=e.peaks.length;i.forEach(t=>{if(t.tempo===r&&(t.score+=e.peaks.length,t.peaks=[...t.peaks,...e.peaks],n=!0),t.tempo>r-.5&&t.tempo<r+.5){const n=2*Math.abs(t.tempo-r);o+=(1-n)*t.peaks.length,t.score+=(1-n)*e.peaks.length}}),n||i.push({peaks:e.peaks,score:o,tempo:r})}),i})(i,t,r);return c.sort((e,t)=>t.score-e.score),c},p=(e,t,r)=>{const n=d(e,t,r);if(0===n.length)throw new Error("The given channelData does not contain any detectable beats.");return n[0].tempo},f=(e,t,r)=>{const n=d(e,t,r);if(0===n.length)throw new Error("The given channelData does not contain any detectable beats.");const{peaks:o,tempo:s}=n[0],a=Math.round(s),i=60/a;o.sort((e,t)=>e-t);let c=o[0]/t;for(;c>i;)c-=i;return{bpm:a,offset:c,tempo:s}};l(self,{analyze:({channelData:e,sampleRate:t,tempoSettings:r})=>({result:p(e,t,r)}),guess:({channelData:e,sampleRate:t,tempoSettings:r})=>({result:f(e,t,r)})})})()})();`;

//#endregion
//#region node_modules/web-audio-beat-detector/build/es2019/module.js
var loadOrReturnBroker = createLoadOrReturnBroker(load, worker);
const analyze = (...args) => loadOrReturnBroker().analyze(...args);
const guess = (...args) => loadOrReturnBroker().guess(...args);

//#endregion
export { analyze, guess };
//# sourceMappingURL=web-audio-beat-detector.js.map