# Minnow.js – a minimalist JavaScript library

Minnow is (a toy) library that attempts to implement the complete (ish) jQuery
API using Google Closure Library to back-up function implementations.

Don't depend on it for anything where you expect to have a working library.

## Building

run:

> $ script/minnow_build.sh

## TODOs:

* grep -Ir --exclude=".*(\.git)" TODO *
* Complete the jQuery api
* Get it running against the jQuery test framework
* Get it to compile to a smaller exec than jQuery (Advanced Optimizations)
* Better build scripts
* Interchangeable modules with the jQuery 2.0 modules
* Win.

## Why jQuery?

I'm not really excited about (nor do I hate) jQuery, but figured this would be
interesting.

jQuery is very widely known, and if I can bake the closure-compiler/library into
it, maybe more people will use the compiler on advanced mode. That means the web
will become faster.
