import React from 'react';

import { sendBuyEvent } from './util.mjs';

import OrdersWs from './orders-ws.mjs';

export default function Order(props) {
  const { wsUrl, expand, expandFn } = props;

  const ordersWsRef = React.useRef(new OrdersWs(wsUrl));

  const localOrderRead = () => {
    const orderJson = localStorage.getItem('order');
    return orderJson ? JSON.parse(orderJson) : null;
  };

  async function doBuy(ordersWs, order, eateryId, itemId, nChanges) {
    if(order && eateryId === order.eateryId){
      let newOrder = await ordersWs.changeOrder(order.id, itemId, nChanges)
      localStorage.setItem('order',JSON.stringify(newOrder));
      return newOrder;
    }else{
      order = await ordersWs.newOrder(eateryId)
      let newOrder = await ordersWs.changeOrder(order.id, itemId, nChanges)
      localStorage.setItem('order',JSON.stringify(newOrder));
      return newOrder;
    }
  }

  const listener = async ev => {
    const updatedOrder = await doBuy(ordersWsRef.current, order, ev.detail.eateryId, ev.detail.itemId, ev.detail.nChanges)
    modifyOrder(updatedOrder)
  };

  const [ order, modifyOrder ] = React.useState(localOrderRead);

  let orderId;
  if(order){
    orderId = order
  }else{
    orderId = ''
  }

  React.useEffect(()=>{
    document.addEventListener('buy', listener);
    return () => document.removeEventListener('buy', listener);
  },[orderId])

  return (expand) //delegate to separate components depending on expand
    ? <OrderDetail order={order} expandFn={expandFn}/>
    : <OrderSummary order={order} expandFn={expandFn}/>;
}

const formatPrice = num => num.toFixed(2)

const OrderSummary=props=>
  props.order ? <a onClick={()=>{props.expandFn(true)}} href="#" className="order summary header">
     <span className="eatery-name">{props.order.name}</span><br/>
      <span className="order-total">$ {formatPrice(props.order.total)}</span>
   </a>:''

const OrderDetail = (props) => {
  const renderedItems = props.order.items.map((orderItem, arrayInd)=> {
    let formattedPrice = formatPrice(orderItem.quantityPrice)
    return <React.Fragment key={arrayInd}>
    <div>
      <div className="heading">{orderItem.name}</div>
      <div>{orderItem.details}</div>
      <div>
        {orderItem.quantity} @ ${orderItem.price} ea.
        <button className="item-change" onClick={()=>sendBuyEvent(props.order.eateryId, orderItem.id, 1)}>+</button>
        <button className="item-change" onClick={()=>sendBuyEvent(props.order.eateryId, orderItem.id, -1)}>-</button>
      </div>
    </div>
    <div>$ {formattedPrice}</div>
  </React.Fragment>
  })

  return <React.Fragment>
    {(props.order && (props.order.items && props.order.items.length>0))
        ? <React.Fragment><h2 key="order-eatery" className="order-eatery">{props.order.name}</h2>
            <div key="order-items" className="order-grid">{renderedItems}</div>
            <div key="order-total" className="order-total order-grid">
              <span className="heading">Total</span><span>$ {props.order.total.toFixed(2)}</span>
            </div>
        </React.Fragment>
        : <div key="order" className="order-empty">Your order is empty.</div>

    }     
    <button key="order-shop" className="order-shop" onClick={() => props.expandFn(false)}>
      Continue Shopping
    </button>
  </React.Fragment>
}