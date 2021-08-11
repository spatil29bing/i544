import React from 'react';

import Order from './order.jsx';

import { geoLoc, makeUrl } from './util.mjs';

export default function ChowApp(props) {

  const wsUrl = props['ws-url'];

  //retain state of cuisine select-box
  const [cuisine, setCuisine] = React.useState('');

  //retain state of attributes for HTML custom elements
  const [searchUrl, setSearchUrl] = React.useState('');
  const [eateryUrl, setEateryUrl] = React.useState('');

  //retain state of whether order is expanded into details or summarized.
  const [expand, setExpand] = React.useState(false);

  //react to change in cuisine select box
  const onChange = async ev => {
    const cuisine = ev.target.value;
    setCuisine(cuisine);
    const loc = await geoLoc(); //browser's location
    const searchUrl =
      makeUrl(wsUrl, `/eateries/${loc.lat},${loc.lng}`, { cuisine });
    setSearchUrl(searchUrl);
  };

  //Set up handler for custom event signalling changes in
  //eateryUrl and searchUrl.
  React.useEffect(() => {
    const urlChangeHandler = ev => {
      const { urlType, url } = ev.detail;
      if (urlType === 'eateryUrl') {
        setEateryUrl(url);
      }
      else if (urlType === 'searchUrl') {
        setSearchUrl(url);
      }
    };
    document.addEventListener('urlChange', urlChangeHandler);

    //cleanup listener on unmount
    return () => document.removeEventListener('urlChange', urlChangeHandler);
  }, []);  //[] dependency array means effect run only on mount

  const orderElement =
        <Order key="order" wsUrl={wsUrl} expand={expand} expandFn={setExpand}/>;
  const hdrOrder = expand ? '' : orderElement; //order in header if !expand
  const elements = [
      <div key="header" className="header order-grid">
        <h1 key="header">Chow Down App</h1>
        {hdrOrder}
      </div>,
  ];
  if (expand) {
    elements.push(orderElement); //order in body when expand === true
  }
  else { //push eatery search elements when expand === false
    elements.push(...eateryElements(cuisine, onChange, eateryUrl, searchUrl));
  }
  return elements;
}


/** Return largely static JSX for eatery search controls */
function eateryElements(cuisine, onChange, eateryUrl, searchUrl) {
  return [
    <form key="select">
      <label htmlFor="cuisine">Choose cuisine</label>
      <select id="cuisine" onChange={onChange}  value={cuisine}>
        <option value=''>Select</option>
        <option>American</option>
        <option>Chinese</option>
        <option>Indian</option>
        <option>Mexican</option>
      </select>
    </form>,

    <div key="results" id="results">
      <eatery-results url={searchUrl} >
      </eatery-results>
      <eatery-details eatery-url={eateryUrl}>
      </eatery-details>
    </div>
  ];
}
