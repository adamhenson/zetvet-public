import AdminActions from '../actions/AdminActions.js';

export default {

  /**
   * Get image file from an input on change invoked by input. This action
   * simply executes the file API method to get the file. The data that
   * is retrieved is delegated via the `receive` method.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */
  getImageFile(event, component) {
    var self = this;
    let target = event.currentTarget;
    let $target = $(event.currentTarget);

    if(target.files && target.files[0]) {
      if(target.files[0].type.indexOf('image') === -1) {
        self.handleResponse({ 'error' : 'Invalid file type.' }, component);
      } else {
        let fileReader = new FileReader;

        fileReader.onload = function() {
          self.handleResponse({
            'data' : {
              'pic' : {
                'full' : fileReader.result,
                'thumb' : fileReader.result
              },
              'isUnsaved' : true
            }
          }, component);
        };
        
        fileReader.readAsDataURL(target.files[0]);
      }
    }
  },

  /**
   * Helper function to reduce redundancy in this file.
   * @param  {object} response Data object to transmit to the store
   * via the `receive` method.
   * @param  {object} component A React component class name.
   */
  handleResponse(response, component) {
    if(response.error) {
      AdminActions.receive({
        'type' : 'error',
        'component' : component,
        'body' : response.error
      });
    } else {
      AdminActions.receive({
        'component' : component,
        'data' : response.data
      });
    }
  }

};