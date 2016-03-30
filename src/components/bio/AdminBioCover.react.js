import classNames from 'classnames';

import AdminConstants from '../../constants/AdminConstants.js';
import AdminActions from '../../actions/AdminActions.js';
import ElementEditable from '../ElementEditable.react.js';
import AdminBioComponent from './AdminBioComponent.react.js';

class AdminBioCoverEditForm extends React.Component {

  render() {
    let self = this;
    let formMethod = (self.props.id)
      ? 'put'
      : 'post';
    let formAction = (!self.props.id)
      ? AdminConstants.Urls.IMAGE_POST
      : AdminConstants.Urls.IMAGE_POST + '/' + self.props.id;
    let deleteFormElement = (!self.props.id)
      ? ''
      : (
        <form action={formAction} method='post' data-method='delete' encType='multipart/form-data' onSubmit={self.props.onFormSubmit}>
          <input type='hidden' name='_id' value={self.props.id} />
          <button className='btn btn--delete'>{AdminConstants.Copy.TEXT_DELETE}</button>
        </form>
      );

    return (
      <div className='container--form'>
        <form action={formAction} method='post' data-method={formMethod} encType='multipart/form-data' onSubmit={self.props.onFormSubmit}>
          <a href='#' onClick={self.props.onChangeImageClick} className='btn btn--no-border'>{self.props.editButtonText}</a>
          <div className='form__file-container'>
            <label htmlFor='upload' className='btn btn--label'>{AdminConstants.Copy.TEXT_SELECT_FILE}</label>
            <input type='file' name='upload' id='upload' onChange={self.props.onFileChange} />
          </div>
          <input type='hidden' name='type' value='cover' />
          <button className='btn btn--save'>{AdminConstants.Copy.TEXT_SAVE}</button>
        </form>
        {deleteFormElement}
      </div>
    );
  }

}
 
class AdminBioCover extends AdminBioComponent {

  constructor(props) {
    super(props);
    this.name = AdminConstants.Components.ADMIN_BIO_COVER;
  }

  componentWillMount() {
    this.state = {
      'isEditing' : false
    }

    AdminActions.receive({
      'component' : this.name,
      'data' : Zetvet.loadObject.user.cover || {}
    });
  }

  render() {
    let self = this;
    let component = this.name;
    let store = self.props.store.data[component];
    let image = (!store || !store.pic || !store.pic.full)
      ? false
      : store.pic.full;
    let imageId = (!store || !store._id || !image)
      ? false
      : store._id;
    let sectionClass = 'section-module';
    let classObject = {
      [sectionClass] : true,
      [sectionClass + '--cover'] : true,
      [sectionClass + '--editing'] : self.state.isEditing,
      [sectionClass + '--unsaved'] : !!store.isUnsaved,
      [sectionClass + '--empty'] : !image
    };
    let classes = classNames(classObject);
    let style = {
      'backgroundImage' : !image
        ? null
        : 'url(' + image + ')'
    };
    let coverImage = (!image)
      ? ''
      : <img src={image} />;
    let coverEditButtonTextPrefix = (self.state.isEditing)
      ? '- '
      : '+ ';
    let coverEditButtonText = (!image)
      ? coverEditButtonTextPrefix + AdminConstants.Copy.TEXT_IMAGE_ADD
      : coverEditButtonTextPrefix + AdminConstants.Copy.TEXT_IMAGE_CHANGE;

    return (
      <section className={classes}>
        <figure style={style}>
          <AdminBioCoverEditForm id={imageId} onChangeImageClick={self.onChangeImageClick} onFormSubmit={self.onFormSubmit} onFileChange={self.onFileChange} editButtonText={coverEditButtonText} />
          {coverImage}
        </figure>
      </section>
    );
  }

}
 
export default AdminBioCover;
