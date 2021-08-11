import React from 'react';
import ReactDOM from 'react-dom';

import ChowApp from './chow-app.jsx';
import './eatery-components.mjs'; //import only for side-effects

const DEFAULT_WS_URL = 'https://zdu.binghamton.edu:2345';


/** Return url set in query param 'ws-url' if present; otherwise
 *  return DEFAULT_WS_URL.
 */
function getWsUrl() {
  const locationUrl = new URL(window.location.href);
  return locationUrl.searchParams.get('ws-url') ?? DEFAULT_WS_URL;
}

//render top-level ChowApp into DOM.  Note the use of createElement()
//rather than JSX <ChowApp wsUrl={getWsUrl}/>
ReactDOM.render(React.createElement(ChowApp, { 'ws-url': getWsUrl() }),
		document.querySelector('#app'));

