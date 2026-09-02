'use strict';

/**
 * Custom Metro transformer for Expo SDK 55.
 *
 * Purpose: LoginScreen.js is a pre-compiled Metro bundle file
 * (not normal JSX source). It contains ({hovered:e})=> patterns that
 * Babel's Flow parser misinterprets as Flow type annotations, causing
 * SyntaxError: Unexpected token, expected ",".
 *
 * This transformer temporarily removes the 'flow' plugin from
 * @babel/parser for JP_*.js files only, allowing them to parse correctly.
 */

function getUpstreamTransformer() {
  const candidates = [
    '@expo/metro-config/build/babel-transformer',
    'metro-react-native-babel-transformer',
    '@react-native/metro-babel-transformer',
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      // この候補には無い。次の候補を試す
    }
  }
  throw new Error(
    '[metroTransformer] Could not find upstream babel transformer. ' +
    'Tried: ' + candidates.join(', ')
  );
}

const upstream = getUpstreamTransformer();

module.exports.transform = async function transform(options) {
  const filename = options.filename || '';

  // Only patch pre-compiled JP_*.js files in the src directory
  if (/[/\\]src[/\\]JP_[^/\\]+\.js$/.test(filename)) {
    const parser = require('@babel/parser');
    const originalParse = parser.parse;

    // Temporarily remove Flow from parser plugins
    parser.parse = function patchedParse(code, opts) {
      if (opts && Array.isArray(opts.plugins)) {
        opts = Object.assign({}, opts, {
          plugins: opts.plugins.filter(function(p) {
            if (typeof p === 'string') {
              return p !== 'flow' && p !== 'flowComments';
            }
            if (Array.isArray(p)) {
              return p[0] !== 'flow';
            }
            return true;
          }),
        });
      }
      return originalParse.call(this, code, opts);
    };

    try {
      return await upstream.transform(options);
    } finally {
      // Always restore the original parser
      parser.parse = originalParse;
    }
  }

  // All other files: use default transformer
  return upstream.transform(options);
};
