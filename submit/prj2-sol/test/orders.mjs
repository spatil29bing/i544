import { setupDao, tearDownDao } from './util.mjs'
import params from '../src/params.mjs';

import fs from 'fs';

import chai from 'chai';
const { assert } = chai;

const COURSE_DIR = `${process.env.HOME}/cs544`;
const DATA_PATH = `${COURSE_DIR}/data/chow-down1.json`;
const DATA = readJson(DATA_PATH);

describe('eateries DAO', function() {

  let dao;

  beforeEach(async () => {
    dao = await setupDao();
    await dao.loadEateries(DATA);
  });

  afterEach(async () => {
    await tearDownDao(dao);
  });

   it ('must create a new order after running newOrder', async function () {
    const eatId = '0';
    const results  = await dao.newOrder(eatId);
    assert.equal(results.eateryId,eatId);
  });

  it ('must return NOT_FOUND error with bad order id', async function () {
    const orderId = '0';
    const order  = await dao.getOrder(orderId);
    assert.isAbove(order.errors?.length, 0);
    assert.equal(order.errors[0].code, 'NOT_FOUND');
  });

   it ('must remove a order with specified orderId after excecuting removeOrder', async function () {
    const eatId = '100';
    const insert_order  = await dao.newOrder(eatId);
    const remove_order  = dao.removeOrder(insert_order._id);
    const order  = await dao.getOrder(insert_order._id);
    assert.isAbove(order.errors?.length, 0);
    assert.equal(order.errors[0].code, 'NOT_FOUND');
  });
  it ('must return NOT_FOUND error with bad order id after excecuting editOrder', async function () {
    const eatId = '100';
    const insert_order  = await dao.newOrder(eatId);
    const remove_order  = dao.removeOrder(insert_order._id);
    const order  = await dao.editOrder(insert_order._id);
    assert.isAbove(order.errors?.length, 0);
    assert.equal(order.errors[0].code, 'NOT_FOUND');
  });
it ('must return BAD_REQ error when nChanges would result in a negative quantity after excecuting editOrder', async function () {
    const eatId = '100';
    const itemId = 'some-item-id';
    const nChanges = '4';
    const insert_order  = await dao.newOrder(eatId);
    const order  = await dao.editOrder(insert_order._id,itemId,nChanges);
    const nChanges_one = '-5';
    const order_one  = await dao.editOrder(insert_order._id,itemId,nChanges_one);
    assert.isAbove(order_one.errors?.length, 0);
    assert.equal(order_one.errors[0].code, 'BAD_REQ');
  });
	

});

function readJson(path) {
  const text = fs.readFileSync(path, 'utf8');
  return JSON.parse(text);
}

