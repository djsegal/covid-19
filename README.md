# covid-19

If you want to test it local, maybe add this to your bashrc:
```
alias js="npm run dev; bundle exec jekyll serve --baseurl ''"
```

Here,
+ `npm run dev` compiles the css/js assets (we use tailwind scss which needs this done)
+ `bundle exec` was needed on my machine because i have different ruby versions
+ `baseurl` is because github pages are hosted at a path on your github pages

// i.e. [djsegal.github.io/covid-19](https://djsegal.github.io/covid-19/) is on the /covid-19 path

----

Before running this command you may have to `cd docs` and run the following commands before `js`:

+ `yarn install`
+ `bundle install`

// this makes a few assumptions like you have: [jekyll](https://jekyllrb.com) and [yarn](https://classic.yarnpkg.com/en/docs/install)
