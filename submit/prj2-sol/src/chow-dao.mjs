import { AppError,} from './util.mjs';
import params from './params.mjs';

import mongo from 'mongodb';
import assert from'assert';

//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

const EATERIES_COLLECTION = 'eateries';
const ORDERS_COLLECTION = 'orders';

// properties which are used only within mongo documents and should be
// removed from returned objects.
const INTERNALS = [ '_id', '_cuisine', '_location' ];
const ORDER_TABLE = ['_id','_eateryId','_items'];
/** Exported factory method. */
export default async function make(dbUrl) {
  return await ChowDao.make(dbUrl);
}

/**
 * In addition to the docs for each method, each method is subject to
 * the following additional requirements:
 *
 *   + All string matching is case-insensitive.  Hence specifying
 *     cuisine "american" or "American" for locate() should return
 *     a list of all eateries having American cuisine.
 *
 *   + The implementation of each of the required methods should not
 *     require searching.  Instead, the database should set up
 *     suitable data structure which allow returning the requested
 *     information without searching.
 *  
 *   + Errors are returned by returning an object with property
 *     _errors which must be a list of objects, each having 
 *     message and code properties.
 *
 *   + Any otherwise uncategorized database error should be returned
 *     with code 'DB'.
 */
class ChowDao {

  constructor(params) {  Object.assign(this, params); }

  //factory method which performs connection set up async calls
  //and all other necessary initialization, sets up properties
  //to be stored in the ChowDao instance and finally returns
  //the instance created using the properties.
  //Returns object containsing an errors property if a db errors.
  static async make(dbUrl) {
    const params = {};
    try {
      params._client = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS);
      const db = params._client.db();
      params._eateries = db.collection(EATERIES_COLLECTION);
     params._orders = db.collection(ORDERS_COLLECTION);
    }
    catch (err) {
      const msg = `cannot connect to URL "${dbUrl}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
    return new ChowDao(params);
  }

  /** Release all resources held by this instance.
	   *  Specifically, close any database connections.
   */
  async close() {
    await this._client.close();
  }

  /** Return a new order object { id, eateryId } having an id
   *  field set to an ID different from that of any existing order.
   *  The order-id should be hard to guess.
   *  Returns an object with errors property if db errors encountered.
   */
  // Returns a unique, difficult to guess order-id.
  async _nextOrderId() {
    //TODO
	let counter;
	const counterArr = await this._orders.find({_id:"counterCnt"}).toArray();
	if ( counterArr.length === 0)
	{  
		await this._orders.insertOne({_id: "counterCnt","lastcount" : 0});
		counter = 0;

	}
	else
	{	counter = counterArr[0].lastcount+1;
		await this._orders.updateOne({_id: "counterCnt"},{$set:{"lastcount" : counter}},{upsert:true});
	}
	
	const _nextId = new IdGen(counter).nextId();

	return _nextId;
    // return '';
  }
 
  async newOrder(eateryId) {
    try {
	const orderId =(await this. _nextOrderId()).toString();
	const insert_order = {
			_id : orderId,
			eateryId : eateryId
			}
	 const ret = await this._orders.insertOne(insert_order);
	if (ret.insertedCount !== 1) {
           throw `inserted ${ret.insertedCount} orders for ${eateryId}`;
        }

	return insert_order;
	//console.log(_nextOrderId());
      //return {};
    }
    catch (err) {
      const msg = `cannot create new order: ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }


  /** Return object { id, eateryId, items? } containing details for
   *  order identified by orderId.  The returned items should be an object
   *  mapping an item-id to the positive quantity for that item.  
   *
   *  If there is no order having orderId, then return a NOT_FOUND error.
   */
  async getOrder(orderId) {
    try {
      //TODO
	const order  = await
        this._orders.findOne({ _id: orderId.replaceAll('.', '_') });
	if (order  === null) {
		const msg = ` no order with orderId "${orderId}"`;
		return { errors: [ new AppError(msg, { code: 'NOT_FOUND'}) ] };
	}
      const ret = { ...order };
     // ORDER_TABLE.forEach(i => delete ret[i]);
      return ret;

      //return {};
    }
    catch (err) {
      const msg = `cannot read order ${orderId}: ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** Remove order identified by orderId from db.  Returns {} if ok,
   *  NOT_FOUND error if there is no order having id orderId.
   */
  async removeOrder(orderId) {
    try {
      //TODO
	const existingDbOrders = await this._orders.deleteOne({ _id: orderId.replaceAll('.', '_') });
	if(existingDbOrders === null)
	{
		 const msg = `cannot find your order with orderId "${orderId}"`;
                 return { errors: [ new AppError(msg, { code: 'NOT_FOUND'}) ] };

	}
      return {};
    }
    catch (err) {
      const msg = `cannot read order ${orderId}: ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** Change quantity for itemId in order orderId by nChanges.  If
   *  itemId does not occur in the order, then set the quantity for
   *  itemId to nChanges.  If the item specified by itemId occurs in
   *  the order and nChanges >= 0, then increment the quantity by
   *  nChanges; if nChanges < 0, then decrement the quantity by
   *  |nChanges|.  Return updated order.  
   *
   *  Return error NOT_FOUND if there is no order for orderId, BAD_REQ
   *  if nChanges would result in a negative quantity for itemId.
   */
  async editOrder(orderId, itemId, nChanges) {
    try {
      //TODO
	const orderObj  = await
        this._orders.findOne({ _id: orderId.replaceAll('.', '_') });
	
        if (orderObj  === null) {
                const msg = ` no order with orderId "${orderId}"`;
                return { errors: [ new AppError(msg, { code: 'NOT_FOUND'}) ] };
        }
	if(orderObj.items == null) {
		const itemObject = {};
		itemObject[itemId] = nChanges;
		orderObj["items"] = {};
		orderObj["items"] = itemObject;
      }
      else if(Object.keys(orderObj.items).includes(itemId))
	{
		const output  = orderObj.items[itemId] + nChanges;
		if(output < 0){
			const msg = `cannot remove "${nChanges}" items with only "${ord.items[itemId]}" items available`;
	                return { errors: [ new AppError(msg, { code: 'BAD_REQ'}) ] };

		}
		else {
			orderObj.items[itemId] = output;
		}
      }
      else {
		orderObj.items[itemId] = nChanges;
      }
      
      const result = await this._orders.updateOne({_id: orderId}, {$set: { items : orderObj.items}});
      
      if(result.modifiedCount === 1) {
	return this._orders.findOne({_id: orderId});
      }
      else throw "BAD_REQ";
      
    }
    catch (err) {
      const msg = `cannot read order ${orderId}: ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** Return eatery having specified id eid.  Return errors if eid is
   *  invalid with error object having code property 'NOT_FOUND'.
   */
  async getEatery(eid) {
    try {
      const eatery = await
        this._eateries.findOne({ _id: eid.replaceAll('.', '_') });
      if (eatery === null) {
	const msg = `cannot find eatery "${eid}"`;
	return { errors: [ new AppError(msg, { code: 'NOT_FOUND'}) ] };
      }
      const ret = { ...eatery };
      INTERNALS.forEach(i => delete ret[i]);
      return ret;
    }
    catch (err) {
      const msg = `cannot find eatery "${eid}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** Replace all existing eateries in underlying database with eateries. */
  async loadEateries(eateries) {
    try {
      await this._eateries.deleteMany({});
      await this._eateries.createIndex({_cuisine: 'hashed'});
      await this._eateries.createIndex({_location: '2dsphere'});
      for (const eatery of eateries) {
	const insert = {
	  ...eatery,
	  _id: eatery.id.replaceAll('.', '_'),
	  _cuisine: eatery.cuisine.toLowerCase(),
	  _location: {
	    type: 'Point',
	    coordinates: [ eatery.loc.lng, eatery.loc.lat ],
	  },
	};
	const ret = await this._eateries.insertOne(insert);
	if (ret.insertedCount !== 1) {
	  throw `inserted ${ret.insertedCount} eateries for ${eatery.id}`;
	}
      }
    }
    catch (err) {
      const msg = `cannot load eateries: ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** return list giving info for eateries having the
   *  specified cuisine.
   *  The info returned for each eatery must contain the
   *  following fields: 
   *     id: the eatery ID.
   *     name: the eatery name.
   *     loc: { lat, lng } object giving location of eatery,
   *     dist: the distance of the eatery from loc
   *  The returned list must be sorted by dist from 
   *  loc { lat, lng }.  Return [] if there are no eateries for the 
   *  specified cuisine.
   */
  async locateEateries(cuisine, loc=params.bingLoc, index=0,
		       count=params.defaultCount)
  {
    try {
      const params = [{
	$geoNear: {
	  near: { type: 'Point', coordinates: [ loc.lng, loc.lat ] },
	  spherical: true,
	  query: { _cuisine: cuisine.toLowerCase(), },
	  distanceField: 'dist',
	  distanceMultiplier: 1/1600,
	},
      }];
      const cursor = await
        this._eateries.aggregate(params).skip(index).limit(count);
      const arr = await cursor.toArray();
      return arr.map(a => ({
	id: a.id,
	name: a.name,
	loc: a.loc,
	dist: a.dist,
	cusine: a.cuisine,
      }));
    }
    catch (err) {
      const msg = `
	cannot locate "${cuisine} eateries at (${loc.lat}, ${loc.lng}): ${err}
      `.trim();
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

}

/** Generate id strings.  Construct by passing an integer base which
 *  will be used to generate the base part of an id as "baseInc_rand"
 *  where baseInc is an increment of base and rand is a random number.
 *  baseInc will make the id unique and rand will make the id
 *  difficult to guess.
 *
 *  Exposes a base property giving the current value of base.
 */
const ID_RAND_LEN = 2;  //increase for production code
class IdGen {
  constructor(base = 0) { this._base = base; }

  nextId() {
    return (this._base++ + Math.random())
      .toFixed(ID_RAND_LEN)
      .replace('.', '_');
  }

  get base() { return this._base; }
  
}
