import keyMirror from 'keymirror';

var AdminConstants = {
  'Copy' : {
    'TEXT_IMAGE_ADD' : 'add image',
    'TEXT_IMAGE_CHANGE' : 'change image',
    'TEXT_DELETE' : 'delete',
    'TEXT_SAVE' : 'save',
    'TEXT_SELECT_FILE' : 'select file'
  },
  'Urls' : {
    'IMAGE_GET' : '/api/image',
    'IMAGE_POST' : '/private/api/image',
    'PROFILE_POST' : '/private/api/profile',
    'PIC_POST' : '/private/api/pic'
  }
}

AdminConstants.Actions = keyMirror({
  GET : null,
  GET_IMAGE_FILE : null,
  GET_HTTP_ERROR_MESSAGE : null,
	SAVE : null,
  RECEIVE : null
});

AdminConstants.Components = keyMirror({
  ADMIN_BIO_CARD : null,
  ADMIN_BIO_COVER : null,
  ADMIN_BIO_DESCRIPTION : null
});

export default AdminConstants;