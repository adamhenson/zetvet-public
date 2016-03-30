import AppDispatcher from '../dispatcher/AppDispatcher.js';
import AdminConstants from '../constants/AdminConstants.js';
import AdminWebAPIUtils from '../utils/AdminWebAPIUtils.js';
import AdminFileAPIUtils from '../utils/AdminFileAPIUtils.js';

var AdminActions = {

  /**
   * Get data from via http GET request. This action simply
   *    executes the request. The response is then delegated 
   *    via the `receive` action.
   * @param  {object} url A URL to make the GET request with.
   * @param  {object} component A React component class name.
   */
  get(url, component) {
    AppDispatcher.dispatch({
      'actionType' : AdminConstants.Actions.GET,
      'component' : component
    });

    AdminWebAPIUtils.get(url, component);
  },

  /**
   * Save data from a submitted form, via http POST, PUT, or DELETE
   *    request. This action simply executes the request. The response
   *    is then delegated via the `receive` action.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */
  save(event, component) {
    AppDispatcher.dispatch({
      'actionType' : AdminConstants.Actions.SAVE,
      'component' : component
    });

    AdminWebAPIUtils.save(event, component);
  },

  /**
   * Get image file from an input on change invoked by input. This action
   * simply executes the file API method to get the file. The data that
   * is retrieved is delegated via the `receive` method.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */
  getImageFile(event, component) {
    AppDispatcher.dispatch({
      'actionType' : AdminConstants.Actions.GET_IMAGE_FILE,
      'component' : component
    });
    
    AdminFileAPIUtils.getImageFile(event, component);
  },

  /**
   * Receive a payload, analyze, and delegate to stores.
   * @param  {object} payload An object containing message, http, and/or
   *    component data. This data is delegated to stores.
   */
  receive(payload) {
    AppDispatcher.dispatch({
      'actionType' : AdminConstants.Actions.RECEIVE,
      'payload' : payload
    });
  }

};

export default AdminActions;
