import { newElement, geoLoc } from './util.mjs';

const DEFAULT_WS_URL = 'https://zdu.binghamton.edu:2345';
/*
  A component which searches for eateries by location and cuisine.
  The location must be set to the browser's location (from geoLoc()).

  This component has two attributes:

    ws-url:  the base URL (protocol, host, port) where the web
             services are located.
    cuisine: the cuisine to be searched for.

  This component does not do anything when first connected to the DOM.
  It must respond to changes in its attribute values:

    ws-url: when this attribute changes, the component simply remembers
    its value.

    cuisine: when changed, the component should make a web-service call
    to search for eateries for that cuisine with location set to the 
    browser's location.  Then it should set it's content corresponding
    to the pseudo-HTML shown below (dynamic data is shown within ${...} and
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


  static get observedAttributes() { return [ 'ws-url', 'cuisine', ]; }

  async attributeChangedCallback(name, oldValue, newValue) {

      if(name ==='cuisine' && newValue){
      const wsUrl = this.getAttribute('ws-url');
      let loc = await geoLoc();
      let lat = loc.lat;
      let log = loc.lng;
      
      let url = new URL('/eateries/${lat},${log}',wsUrl);
      url.searchParams.append("cuisine",this.getAttribute('cuisine'));
      //`${DEFAULT_WS_URL}/eateries/${lat},${log}?cuisine=${newValue}`;
      this.fetchData(url.href);    
    }
    
}

  async fetchData(url){
    this.innerHTML = ''
    this.wsData  = await fetchUrl(url)
    this.getEateryResultsElements()    


  }
      //let getData = '';
    //let url = `${DEFAULT_WS_URL}/eateries/${lat},${log}?cuisine=${newValue}`;
    //const wsUrl = 'https://zdu.binghamton.edu:2345';
    
    //const wsData = await fetchUrl(url.href);
  getEateryResultsElements(){
    const finalRes = []
    for(const eatery of this.wsData.eateries)
     { 
        //console.log(getData.eateries[i].name);
      const eat_name = eatery.name;
      var distance = eatery.dist.toFixed(1);
      distance += 'miles';
        //const hdr = newElement('ul',{class:"eatery-results"} , 
      const name =  newElement('span',{class: "eatery-name"}, eat_name);
      const dist = newElement('span',{class: 'eatery-dist'},distance);
      const itemLinks = newElement('a',{ href : getHref(eatery.links, 'self'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            )},newElement('button',{ }, 'Select'))
      itemLinks.addEventListener('click',(ev) => {
      document.querySelector('eatery-details').setAttribute('eatery-url',ev.currentTarget.href); ev.preventDefault();
      })
      const results = newElement('li',{ },name,dist,itemLinks);
      finalRes.push(results);
    }
   
     const finalout= newElement('ul',{class : 'eatery-results'},...finalRes);
     this.append(finalout);

     const scrollDiv = newElement('div', { class: 'scroll' });
     this.append(scrollDiv);
     if(getHref(wsData.links, 'prev')) {
        const previous = newElement('a', { rel: 'prev', href: getHref(wsData.links, 'prev')});
        scrollDiv.append(previous);
        const prevbtn = newElement('button', {}, '<');
        previous.append(prevbtn);
        previos.addEventListener('click', ev => {
          this.wsUrl = ev.currentTarget.href;
          ev.preventDefault();
        });
      }
      if(getHref(wsData.links, 'next')) {
        const nexturl = newElement('a', { rel: 'next', href: getHref(wsData.links, 'next')});
        scrollDiv.append(nexturl);
        const nextBtn = newElement('button', {}, '>');
        nexturl.append(nextBtn);
        nexturl.addEventListener('click', ev => {
          this.wsUrl = ev.currentTarget.href;
          ev.preventDefault();
        });
      }

   }

  
  //TODO auxiliary methods
 
 get wsUrl() {
    return this.getAttribute('ws-url');
  }
  
  set wsUrl(val) {
    if(val) {
      this.setAttribute('ws-url', val);
    } else {
      this.removeAttribute('ws-url');
    }
  }
}
//register custom-element as eatery-results
customElements.define('eatery-results', EateryResults);
/*
  A component which shows the details of an eatery.  

  When created, it is set up with a buyFn property which should be
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
  <button class="menu-category">${category}</button>
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
    if(oldValue !== newValue && newValue !== ''){
  this.wsData  = await fetchUrl(this.eateryUrl);
        const Menuname = `${wsData.name} Menu`;
        const hdr = newElement('h2', { class: 'eatery-name' }, Menuname);
        this.append(hdr);
        const menu = newElement('ul',{class : 'eatery-categories'});
        this.append(menu);
        for(const cat  of wsData.menuCategories){
        const category = `${cat}`;
        const categoryBtn = newElement('button', { class: 'menu-category' }, category);
        categoryBtn.addEventListener('click', ev => {
          categoryBtnHandler(category);
          ev.preventDefault();
        });
        menu.append(categoryBtn);
      }
      const category_hdr = newElement('div', { id: 'category-details'});
      this.append(category_hdr);
      const categoryBtnHandler = (category) => {
        const categoryName = `${category}`;
        const categoryNameh2 = newElement('h2', {}, categoryName);
        this.querySelector('#category-details').append(categoryNameh2);
        const catitemUl = newElement('ul', { class: 'category-items' });
        this.querySelector('#category-details').append(categoryItemsUl);
        for(const itemId of wsData.menu[category]){
          const itemId = wsData.flatMenu[itemId];
          const catitemLi = newElement('li');
          catitemUl.append(catitemLi);
          const itemName = newElement('span', { class: 'item-name' }, `${item.name}`);
          catitemLi.append(itemName);
          const itemPrice = newElement('span', { class: 'item-price' }, `${item.price}`);
          catitemLi.append(itemPrice);
          const itemDetails = newElement('span', { class: 'item-details' }, `${item.details}`);
          catitemLi.append(itemDetails);
          const itemBuyButton = newElement('button', { class: 'item-buy' }, 'Buy');
          catitemLi.append(itemBuyButton);
          itemBuyButton.addEventListener('click', ev => {
            const eateryId = new URL(this.eateryUrl).pathname.split("/");
            this.buyFn(eateryId[2], item.id);
            ev.preventDefault();
          });
        }
      };
      this.scrollIntoView();
   }
 }
    get eateryUrl() {
    return this.getAttribute('eatery-url');
  }

   set eateryUrl(val) {
    if(val) {
      this.setAttribute('eatery-url', val);
    } else {
      this.removeAttribute('eatery-url');
    }
  }

}
 

  //TODO auxiliary methods
 
async  function fetchUrl(url)
{
  try {
   console.log(url);
    const response = await fetch(url);
    if(response.status === 200){
    let data = await response.json();   
    return data;
    }
  }
  catch (err) {
     return  (data.errors) ? data : console.log(response.statusText);

  }
}
//register custom-element as eatery-details
customElements.define('eatery-details', EateryDetails);

/** Given a list of links and a rel value, return the href for the
 *  link in links having the specified value.
 */
function getHref(links, rel) {
  return links.find(link => link.rel === rel)?.href;
}


