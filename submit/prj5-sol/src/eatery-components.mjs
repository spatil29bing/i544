import { newElement, geoLoc, makeUrl, sendBuyEvent, } from './util.mjs';

/*
  A component which searches for eateries by location and cuisine.
  The location must be set to the browser's location (from geoLoc()).

  This component a single attributes:

    url:  the url for eatery location search.

  This component does not do anything when first connected to the DOM.
  It must respond to changes in its attribute value:

    url: when this attribute changes, the component should make a
    web-service call to search for eateries for that url.  browser's
    location.  Then it should set it's content corresponding to the
    pseudo-HTML shown below (dynamic data is shown within ${...} and
    wsData is the data returned from the web-service call):

      <ul class="eatery-results">
	<!-- repeat for each eatery in wsData.eateries -->
	<li>
	  <span class="eatery-name">${eatery.name}</span>
	  <span>${eatery.dist} miles</span>
	  <a href=${links:self.href}>
	    <button>Select</button>
	  </a>
	</li>
      </ul>

    The handler for the Select button should be set up to set
    the eatery-url attribute for the eatery-details component.

    This should be followed by up-to two scrolling links:

      <div class="scroll">
	<!-- only when ${wsData.links:prev} -->
	<a rel="prev" href="${wsData.links:prev.href}">
	  <button>&lt;</button>
	</a>
	<!-- only when ${wsData.links:next} -->
	<a rel="next" href="${wsData.links:next.href}">
	  <button>&gt;</button>
	</a>
      </div>

    When the above scrolling links are clicked, the results should
    be scrolled back-and-forth.

*/
class EateryResults extends HTMLElement {


  static get observedAttributes() { return [ 'url',  ]; }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (newValue.trim().length === 0) return;
    if (name === 'url' && typeof newValue === 'string' && newValue.length > 0) {
      const searchUrl = newValue;
      await this._results(searchUrl);
    }
  }

  async _results(url) {
    const results = await get(url);
    this.innerHTML = '';
    this._appendEateries(results);
    this._appendLinks(results);
  }

  _appendEateries(results) {
    const eateryDetails = document.querySelector('eatery-details');
    const ul = newElement('ul', { class: 'eatery-results' });
    this.append(ul);
    for (const eatery of results.eateries) {
      const li = newElement('li');
      ul.append(li);
      li.append(newElement('span', { class: 'eatery-name' }, eatery.name));
      const dist = String(eatery.dist).replace(/(\.\d).*/, '$1')
      li.append(newElement('span', { }, `${dist} miles`));
      const selAttr = {
	class: 'select-eatery',
	href: getHref(eatery.links, 'self'),
      };
      const button = newElement('button', {}, 'Select');
      const sel = newElement('a', selAttr, button);
      sel.addEventListener('click', (ev) => {
	const eateryUrl = ev.currentTarget.href;
	sendUrlChangeEvent('eateryUrl', eateryUrl);
	ev.preventDefault();
      });
      li.append(sel);
    }
  }

  _appendLinks(results) {
    const scroll = newElement('div', { class: 'scroll' });
    this.append(scroll);
    for (const [rel, text] of Object.entries({prev: '<', next: '>', })) {
      const href = getHref(results.links, rel);
      if (href) {
	const button = newElement('button', {}, text);
	const link = newElement('a', { rel, href }, button);
	scroll.append(link);
	link.addEventListener('click', (ev) => {
	  sendUrlChangeEvent('searchUrl', ev.currentTarget.href);
	  ev.preventDefault();
	});
      }
    }
  }
  
}

//register custom-element as eatery-results
customElements.define('eatery-results', EateryResults);


/*
  A component which shows the details of an eatery.  

  When created, it is set up with a buyFn *property* which should be
  called with an eatery-id and item-id to order a single unit of the
  item item-id belonging to eatery-id.

  The component has a single attribute: eatery-url which is the url
  for the web service which provides details for a particular eatery.

  This component does not do anything when first connected to the DOM.
  It must respond to changes in its eatery-url attribute.  It must
  call the web service corresponding to the eatery-url and set it's
  content corresponding to the pseudo-HTML shown below (dynamic data
  is shown within ${...} and wsData is the data returned from the
  web-service call):


      <h2 class="eatery-name">${wsData.name} Menu</h2>
      <ul class="eatery-categories">
	<!-- repeat for each category in wsData.menuCategories -->
	<li><button class="menu-category">${category}</button></li>
      </ul>
      <!-- will be populated with items for category when clicked above -->
      <div id="category-details"></div>

  The handler for the menu-category button should populate the
  category-details div for the button's category as follows:

      <h2>${category}</h2>
      <ul class="category-items">
	<!-- repeat for each item in wsData.flatMenu[wsData.menu[category]] -->
	<li>
	  <span class="item-name">${item.name}</span>
	  <span class="item-price">${item.price}</span>
	  <span class="item-details">${item.details}</span>
	  <button class="item-buy">Buy</button>
	</li>
      </ul>

  The handler for the Buy button should be set up to call
  buyFn(eatery.id, item.id).

*/
class EateryDetails extends HTMLElement {

  static get observedAttributes() { return [ 'eatery-url', ]; }
  
  async attributeChangedCallback(name, oldValue, newValue) {
    if (newValue.trim().length === 0) return;
    if (name === 'eatery-url') {
      this.innerHTML = '';
      const eateryUrl = newValue;
      const eatery = await get(eateryUrl);
      this._eatery = eatery;
      const categoryList = newElement('ul', { class: 'eatery-categories' });
      for (const category of eatery.menuCategories) {
	const categoryLink =
	  newElement('button', { class: 'menu-category'}, category);
	categoryList.append(newElement('li', {}, categoryLink));
	categoryLink.addEventListener('click', ev => {
	  this._categoryDetails(category);
	  ev.preventDefault();
	});
      }
      const name = `${eatery.name} Menu`;
      this.append(newElement('h2', { class: 'eatery-name' }, name));
      this.append(categoryList);
      this.append(newElement('div', { id: 'category-details' }));
    }
  }

  _categoryDetails(category) {
    const eatery = this._eatery;
    const items = eatery.menu[category].map(itemId => eatery.flatMenu[itemId]);
    const details = document.querySelector('#category-details');
    details.innerHTML = '';
    const categoryHdr = newElement('h2', {}, category);
    details.append(categoryHdr);
    const itemsList = newElement('ul', { class: 'category-items' });
    details.append(itemsList);
    for (const item of items) {
      const { id, name, details, price } = item;
      if (!name || !price) continue;
      const li = newElement('li');
      itemsList.append(li);
      li.append(newElement('span', { class: 'item-name' }, name));
      const fmtPrice = `$ ${price.toFixed(2)}`;
      li.append(newElement('span', { class: 'item-price' }, fmtPrice));
      li.append(newElement('span', { class: 'item-details' }, details));
      const buy = newElement('button', { class: 'item-buy', }, 'Buy');
      li.append(buy);
      buy.addEventListener('click', () => sendBuyEvent(eatery.id, id));
    }
    details.scrollIntoView();
  }
  
}

//register custom-element as eatery-details
customElements.define('eatery-details', EateryDetails);

function sendUrlChangeEvent(urlType, url) {
  const detail = { urlType, url };
  const urlEvent = new CustomEvent('urlChange', { detail });
  document.dispatchEvent(urlEvent);
}


/** Given a list of links and a rel value, return the href for the
 *  link in links having the specified value.
 */
function getHref(links, rel) {
  return links.find(link => link.rel === rel)?.href;
}

async function get(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw `cannot fetch ${url}: ${response.statusText}`;
    }
    return await response.json();
  }
  catch (err) {
    console.error(err);
    return {};
  }
}
