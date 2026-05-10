/**
 * Module ID: 860
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 860);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"parsers",{enumerable:!0,get:function(){return x}});var n=require("./module_861"),s=require("./module_863"),P=require("./u_866"),w=require("./module_867"),o=require("./module_868"),t=require("./module_869"),c=require("./module_870"),u=require("./module_871"),l=require("./module_872"),S=require("./module_873"),M=require("./module_875"),y=require("./module_877"),O=require("./u_878"),D=require("./module_879"),T=require("./module_881"),f=require("./module_882"),I=require("./module_883"),Y=require("./module_885"),h=require("./module_886"),k=require("./module_887"),p=require("./module_888"),A=require("./module_889"),H=require("./module_890"),L=require("./u_891"),W=require("./module_892"),b=require("./u_893"),_=require("./module_894"),E=require("./u_895"),Q=require("./u_896"),j=require("./module_897"),v=require("./module_898");const x={G:new n.EraParser,y:new s.YearParser,Y:new P.LocalWeekYearParser,R:new w.ISOWeekYearParser,u:new o.ExtendedYearParser,Q:new t.QuarterParser,q:new c.StandAloneQuarterParser,M:new u.MonthParser,L:new l.StandAloneMonthParser,w:new S.LocalWeekParser,I:new M.ISOWeekParser,d:new y.DateParser,D:new O.DayOfYearParser,E:new D.DayParser,e:new T.LocalDayParser,c:new f.StandAloneLocalDayParser,i:new I.ISODayParser,a:new Y.AMPMParser,b:new h.AMPMMidnightParser,B:new k.DayPeriodParser,h:new p.Hour1to12Parser,H:new A.Hour0to23Parser,K:new H.Hour0To11Parser,k:new L.Hour1To24Parser,m:new W.MinuteParser,s:new b.SecondParser,S:new _.FractionOfSecondParser,X:new E.ISOTimezoneWithZParser,x:new Q.ISOTimezoneParser,t:new j.TimestampSecondsParser,T:new v.TimestampMillisecondsParser}