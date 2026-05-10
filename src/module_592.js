/**
 * Module ID: 592
 */
"use strict";

const _g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 592);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";
Object.defineProperty(e, '__esModule', { value: !0 });
Object.defineProperty(e, "getShadowStyle", { enumerable: !0, get: function () { return getShadowStyle } });
require("./module_98");

const getShadowStyle = (config) => {
    const n = 'number' == typeof config ? { elevation: config } : config;
    const {
        shadowColor: s = "#000000",
        shadowOffset: o = { width: 0, height: Math.floor((n.elevation || 4) / 2) },
        shadowOpacity: u = .2,
        shadowRadius: h = n.elevation || 4,
        elevation: l = n.elevation || 4
    } = n;

    if (typeof window !== 'undefined') {
        const t = s.startsWith('#') ? hexToRgba(s, u) : s;
        return { boxShadow: `${o.width}px ${o.height}px ${h}px ${t}` };
    }
    return { shadowColor: s, shadowOffset: o, shadowOpacity: u, shadowRadius: h, elevation: l };
};

const hexToRgba = (color, opacity) => {
    if (!color) return `rgba(0,0,0,${opacity})`;
    if (color.startsWith('rgba')) return color;
    if ('black' === color) return `rgba(0,0,0,${opacity})`;
    if ('white' === color) return `rgba(255,255,255,${opacity})`;
    let n = 0, s = 0, o = 0, u = color.replace('#', '');
    if (3 === u.length) {
        n = parseInt(u[0] + u[0], 16);
        s = parseInt(u[1] + u[1], 16);
        o = parseInt(u[2] + u[2], 16);
    } else {
        if (6 !== u.length) return color;
        n = parseInt(u.substring(0, 2), 16);
        s = parseInt(u.substring(2, 4), 16);
        o = parseInt(u.substring(4, 6), 16);
    }
    return `rgba(${n}, ${s}, ${o}, ${opacity})`;
};