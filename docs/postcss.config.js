// const purgecss = require('@fullhuman/postcss-purgecss')({
//   content: [
//     './src/**/*.html',
//     './src/**/*.vue',
//     './src/**/*.jsx',
//     // etc.
//   ],
//   defaultExtractor: content => content.match(/[\w-/.:]+(?<!:)/g) || [];
// })

module.exports = {
  plugins: [
    require("postcss-import"),
    require("tailwindcss")("./_includes/tailwind.config.js"),
    require("autoprefixer")
  ]
};
