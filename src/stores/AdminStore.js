import EventEmitter from 'events';
import AppDispatcher from '../dispatcher/AppDispatcher.js';
import AdminConstants from '../constants/AdminConstants.js';

const CHANGE_EVENT = 'change';

var adminData = {};
var message = {};
var isLoading = false;

/**
 * Receive a payload, analyze, and delegate to stores.
 * @param  {object} payload An object containing message, http, and/or
 *    component data. This data is delegated to stores.
 */
function receive(payload) {
  if(payload.data) {
    if(adminData[payload.component]) {
      adminData[payload.component] = Object.assign(adminData[payload.component], payload.data);
    } else {
      let componentData = {
        [payload.component] : payload.data
      };
      
      adminData = Object.assign(adminData, componentData);
    }
  } else if(payload.body) {
    message = payload;
  }
}

var AdminStore = Object.assign({}, EventEmitter.prototype, {

  emitChange() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  /**
   * Get all admin data.
   */
  getAll() {
    return {
      'isLoading' : isLoading,
      'message' : message,
      'data' : adminData
    };
  }

});

AppDispatcher.register((action) => {

  switch(action.actionType) {

    case AdminConstants.Actions.SAVE:
      isLoading = true;
      AdminStore.emitChange();
      break;

    case AdminConstants.Actions.RECEIVE:
      receive(action.payload);
      isLoading = false;
      AdminStore.emitChange();
      break;

    default:
      // no op

  }

});

export default AdminStore;