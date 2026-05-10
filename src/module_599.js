/**
 * Module ID: 599
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 599);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"NotificationFeedbackType",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"ImpactFeedbackStyle",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"AndroidHaptics",{enumerable:!0,get:function(){return o}});let t=(function(t){return t.Success="success",t.Warning="warning",t.Error="error",t})({}),n=(function(t){return t.Light="light",t.Medium="medium",t.Heavy="heavy",t.Soft="soft",t.Rigid="rigid",t})({}),o=(function(t){return t.Confirm="confirm",t.Reject="reject",t.Gesture_Start="gesture-start",t.Gesture_End="gesture-end",t.Toggle_On="toggle-on",t.Toggle_Off="toggle-off",t.Clock_Tick="clock-tick",t.Context_Click="context-click",t.Drag_Start="drag-start",t.Keyboard_Tap="keyboard-tap",t.Keyboard_Press="keyboard-press",t.Keyboard_Release="keyboard-release",t.Long_Press="long-press",t.Virtual_Key="virtual-key",t.Virtual_Key_Release="virtual-key-release",t.No_Haptics="no-haptics",t.Segment_Tick="segment-tick",t.Segment_Frequent_Tick="segment-frequent-tick",t.Text_Handle_Move="text-handle-move",t})({})