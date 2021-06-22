import { AppError } from './util.mjs';

/**
 * In addition to the docs for each method, each method is subject to
 * the following additional requirements:
 *
 *   + All string matching is case-insensitive.  Hence specifying
 *     cuisine "american" or "American" for locate() should return
 *     a list of all eateries having American cuisine.
 *
 *   + The implementation of each of the required methods should not
 *     require searching.  Instead, the returned object instance
 *     should set up suitable data structure which allow returning the
 *     requested information without searching.
 *  
 *   + Errors are returned by returning an object with property
 *     _errors which must be a list of objects, each having a 
 *     message property.
 */
class ChowDown {

  /** Create a new ChowDown object for specified eateries */
  constructor(eateries) {
	this.eateriesObj = {};
	this._group_eateriesbycuisine = {}
	this.extractmenu_bycuisine_eatID = {}
	for(const eatery of eateries){
		const eateryKey = eatery.id.toLowerCase();
		const eateryCuisineIdKey = eatery.cuisine.toLowerCase();
		this.eateriesObj[eateryKey] = {
						id : eatery.id,
						name : eatery.name,
						dist : eatery.dist,
						menu : {
							   categories : Object.keys(eatery.menu)
							}
					      };
		
		if(this._group_eateriesbycuisine[eateryCuisineIdKey]){
			this._group_eateriesbycuisine[eateryCuisineIdKey].push(eateryKey);
		} 
		else
		{
			this._group_eateriesbycuisine[eateryCuisineIdKey] = [eateryKey];
		}

		
		this.extractmenu_bycuisine_eatID[eateryKey] = {}
		for(const category of this.eateriesObj[eateryKey].menu.categories)
		{
			this.extractmenu_bycuisine_eatID[eateryKey][category.toLowerCase()] = eatery.menu[category];
		}
		
	}
	//Sorting eateries  on basic of cuisine and distance
	for(const eatId of Object.values(this._group_eateriesbycuisine)){
		eatId.sort((x,y)=> this.eateriesObj[x].dist - this.eateriesObj[y].dist);
	} 
	
	//console.log(this.extractmenu_bycuisine_eatID["82.80"]["salads"]);
	//console.log(this.eateriesObj["82.80"].menu.categories);
	//console.log(this._group_eateriesbycuisine);
    //TODO
  }

  /** return list giving info for eateries having the
   *  specified cuisine.  The info for each eatery must contain the
   *  following fields: 
   *     id: the eatery ID.
   *     name: the eatery name.
   *     dist: the distance of the eatery.
   *  The returned list must be sorted by distance.  Return [] if
   *  there are no eateries for the specified cuisine.
   */
  locate(cuisine) {
	for(const cuisine_name of Object.keys(this._group_eateriesbycuisine)){
		if(cuisine.toLowerCase() === cuisine_name){
			const eateryIds = this._group_eateriesbycuisine[cuisine_name];
			const storeEateryData = {}	
			for(const eatId of eateryIds){
				storeEateryData[eatId] = this.eateriesObj[eatId];
			}
			const result = [];
			for (const data of Object.values(storeEateryData)){
				result.push({"id":data.id,
					     "name" : data.name,
					     "dist" : data.dist}
				);
			}
			return result;
		}
			
		
	} 
	return [];
    //TODO
  }

  /** return list of menu categories for eatery having ID eid.  Return
   *  errors if eid is invalid with error object having code property
   *  'NOT_FOUND'.
   */
  categories(eid) {
	const out_categories =  this.eateriesObj[eid.toLowerCase()]?.menu.categories;
	//console.log(out_categories);
	if(out_categories === undefined){
		const msg = `bad eatery id ${eid}`;
		return {
			 _errors: [
				       new AppError(
					msg, { code: 'NOT_FOUND', }),
				   ]
			 };
   
	}
	return out_categories;
 //TODO
  }

  /** return list of menu-items for eatery eid in the specified
   *  category.  Return errors if eid or category are invalid
   *  with error object having code property 'NOT_FOUND'.
   */ 
  menu(eid, category) {
	const menu = this.extractmenu_bycuisine_eatID[eid.toLowerCase()];
	if(menu === undefined){
		 const msg = `bad eatery id ${eid}`;
                return {
                         _errors: [
                                       new AppError(
                                        msg, { code: 'NOT_FOUND', }),
                                   ]
                         };
	}
	
	const menu_items = menu[category.toLowerCase()];
	if(menu_items === undefined){
                 const msg = `bad eatery category ${category}`;
                return {
                         _errors: [
                                       new AppError(
                                        msg, { code: 'NOT_FOUND', }),
                                   ]
                         };
        }

	return menu_items;

	
    return [];
  }
  
}

export default function make(eateries) {
  return new ChowDown(eateries);
}
