import fs from 'fs';

import makeChowDown from '../src/chow-down.mjs';

import chai from 'chai';
const { assert } = chai;

const COURSE_DIR = `${process.env.HOME}/cs544`;
const DATA_PATH = `${COURSE_DIR}/data/chow-down.json`;
const DATA = readJson(DATA_PATH);

describe('chowDown', function() {

  let chowDown;

  beforeEach(() => chowDown = makeChowDown(DATA));

  it ('must find Chinese cuisine', function () {
    const results = chowDown.locate('Chinese');
    assert.equal(results.length, 19);
  });

  it ('must find cuisine sorted by dist', function () {
    const results = chowDown.locate('indian');
    assert(results.length > 0);
    assert(results.every((r, i, res) => i === 0 || r.dist >= res[i - 1].dist));
  });

  it ('must find cuisine irrespective of case', function () {
    const results = chowDown.locate('aMeRIcaN');
    assert(results.length > 0);
  });

  it ('must return empty list for non-existent cuisine', function () {
    const results = chowDown.locate('italian');
    assert(results.length === 0);
  });

  it ('must find eatery categories', function () {
    const results = chowDown.categories('5.70');
    assert.equal(results.length, 17);
    assert(results.includes('Dessert'));
    assert(results.includes('Grill'));
  });

  it ('must return a NOT_FOUND error for a non-existent eatery', function () {
    const results = chowDown.categories('5.7');
    assert.equal(results._errors?.[0]?.code, 'NOT_FOUND');
  });

  it ('must return a NOT_FOUND error for a non-existent eatery', function () {
    const results = chowDown.menu('5.70' , '');
    assert.equal(results._errors?.[0]?.code, 'NOT_FOUND');
  });

 it ('must return a NOT_FOUND error for a non-existent eatery', function () {
    const results = chowDown.menu('5.7','Sweden');
    assert.equal(results._errors?.[0]?.code, 'NOT_FOUND');
  });
 it ('must return a correct menu-items for a know eatery with catetory', function () {
    const results = chowDown.menu('5.70','Grill');
    const miscaseResults = chowDown.menu('5.70','gRill');
    assert.equal(results,miscaseResults);
  });

});	

function readJson(path) {
  const text = fs.readFileSync(path, 'utf8');
  return JSON.parse(text);
}
