import { makeUrl, } from './util.mjs';


export default class OrdersWs {

  constructor(wsUrl) { this.wsUrl = wsUrl; }

  async getOrder(orderId) {
    const url = makeUrl(this.wsUrl, `/orders/${orderId}`);
    return await doFetch('GET', url);
  }

  async newOrder(eateryId) {
    const url = makeUrl(this.wsUrl, `/orders`, { eateryId });
    return await doFetch('POST', url);
  }

  async changeOrder(orderId, itemId, nChanges) {
    const url = makeUrl(this.wsUrl, `/orders/${orderId}`, {itemId, nChanges});
    return await doFetch('PATCH', url);
  }
}

async function doFetch(method, url) {
  const response = await fetch(url, { method });
  if (response.ok) {
    const result = await response.json();
    if (result.errors) throw result;
    return result;
  }
  else {
    const status = response.statusText ?? response.status ?? 'UNKNOWN';
    const msg = `failed ${method} on ${url}: ${status}`;
    throw { errors: [ { message: msg } ], };
  }
}
