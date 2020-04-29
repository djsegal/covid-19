const curWhitelist = [
    "noUi-connect"
]

const curWhitelistPatterns = [
    /bg-$/, /text-$/, /border-$/,
    /p-$/, /pl-$/, /pr-$/, /pt-$/, /pb-$/, /py-$/, /px-$/,
    /m-$/, /ml-$/, /mr-$/, /mt-$/, /mb-$/, /my-$/, /mx-$/
]

const purgecss = require('@fullhuman/postcss-purgecss')({
    content: [
        // Jekyll output directory
        './_site/**/*.html',
    ],
    defaultExtractor: content => content.match(/[\w-/.:]+(?<!:)/g) || [],
    whitelist: curWhitelist,
    whitelistPatterns: curWhitelistPatterns
});

module.exports = {
    plugins: [
        require("tailwindcss")("./tailwind.config.js"),
        require('cssnano')(),
        require('autoprefixer'),
        ...process.env.NODE_ENV === 'production'
            ? [purgecss]
            : []
    ]
};
