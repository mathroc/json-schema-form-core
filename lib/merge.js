import {stringify, parse} from './sfPath';
import canonicalTitleMap from './canonicalTitleMap';

//export function merge(schema, form, schemaDefaultTypes, ignore, options, readonly, asyncTemplates) {
export function merge(lookup, form, options, readonly, asyncTemplates) {
  form  = form || [];
  options = options || {};

  //ok let's merge!
  //We look at the supplied form and extend it with schema standards
  return form.map((obj) => {

    //handle the shortcut with just a name
    if (typeof obj === 'string') {
      obj = { key: obj };
    }

    if (obj.key) {
      if (typeof obj.key === 'string') {
        obj.key = parse(obj.key);
      }
    }

    //If it has a titleMap make sure it's a list
    if (obj.titleMap) {
      obj.titleMap = canonicalTitleMap(obj.titleMap);
    }

    //extend with std form from schema.
    if (obj.key) {
      const strid = stringify(obj.key);
      if (lookup[strid]) {
        const schemaDefaults = lookup[strid];
        if (schemaDefaults) {
          Object.keys(schemaDefaults).forEach((attr) => {
            if (obj[attr] === undefined) {
              obj[attr] = schemaDefaults[attr];
            }
          });
        }
      }
    }

    // Are we inheriting readonly?
    if (readonly === true) { // Inheriting false is not cool.
      obj.readonly = true;
    }

    //if it's a type with items, merge 'em!
    if (obj.items) {
      obj.items = merge(lookup, obj.items, options, obj.readonly, asyncTemplates);
    }

    //if its has tabs, merge them also!
    if (obj.tabs) {
      obj.tabs.forEach((tab) => {
        if (tab.items) {
          tab.items = merge(lookup, tab.items, options, obj.readonly, asyncTemplates);
        }
      });
    }

    // Special case: checkbox
    // Since have to ternary state we need a default
    if (obj.type === 'checkbox' && obj.schema['default'] === undefined) {
      obj.schema['default'] = false;
    };

    // Special case: template type with tempplateUrl that's needs to be loaded before rendering
    // TODO: this is not a clean solution. Maybe something cleaner can be made when $ref support
    // is introduced since we need to go async then anyway
    if (asyncTemplates && obj.type === 'template' && !obj.template && obj.templateUrl) {
      asyncTemplates.push(obj);
    }

    return obj;
  });
}
