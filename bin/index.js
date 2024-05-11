#! /usr/bin/env node

const { create } = require("create-strapi-types");

let hasFrontend = false;

process.argv.forEach(function (val, index, array) {
  console.log(index + ": " + val);
  if (val === "frontend") {
    hasFrontend = true;
  }
});

create(hasFrontend);
