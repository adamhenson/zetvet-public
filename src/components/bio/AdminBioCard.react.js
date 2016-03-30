import classNames from 'classnames';

import AdminConstants from '../../constants/AdminConstants.js';
import AdminActions from '../../actions/AdminActions.js';
import ElementEditable from '../ElementEditable.react.js';
import AdminBioComponent from './AdminBioComponent.react.js';

class AdminBioPicEditForm extends React.Component {

  render() {
    let self = this;
    let formMethod = (self.props.id)
      ? 'put'
      : 'post';
    let formAction = (!self.props.id)
      ? AdminConstants.Urls.PIC_POST
      : AdminConstants.Urls.PIC_POST + '/' + self.props.id;
    let deleteFormElement = (!self.props.bioImage)
      ? ''
      : (
        <form action={formAction} method='post' data-method='put' encType='multipart/form-data' onSubmit={self.props.onFormSubmit}>
          <input type='hidden' name='upload' value='undefined' />
          <button className='btn btn--delete'>{AdminConstants.Copy.TEXT_DELETE}</button>
        </form>
      );

    return (
      <div className='container--form'>
        <form action={formAction} method='post' data-method={formMethod} encType='multipart/form-data' onSubmit={self.props.onFormSubmit}>
          <a href='#' onClick={self.props.onChangeImageClick} className='btn btn--no-border'>{self.props.editButtonText}</a>
          <div className='form__file-container'>
            <label htmlFor='upload-pic' className='btn btn--label'>{AdminConstants.Copy.TEXT_SELECT_FILE}</label>
            <input type='file' name='upload' id='upload-pic' onChange={self.props.onFileChange} />
          </div>
          <button className='btn btn--save'>{AdminConstants.Copy.TEXT_SAVE}</button>
        </form>
        {deleteFormElement}
      </div>
    );
  }

}

class AdminBioCard extends AdminBioComponent {

  constructor(props) {
    super(props);
    this.name = AdminConstants.Components.ADMIN_BIO_CARD;
  }

  componentWillMount() {
    this.state = {
      'isEditing' : false
    }

    if(!Zetvet.loadObject.user.name) {
      Zetvet.loadObject.user.name = Zetvet.loadObject.user.username;
    }

    AdminActions.receive({
      'component' : this.name,
      'data' : Zetvet.loadObject.user
    });
  }

  render() {
    let self = this;
    let component = this.name;
    let store = self.props.store.data[component];
    let image = (!store.pic || !store.pic.thumb)
      ? false
      : store.pic.thumb;
    let sectionClass = 'section-module';
    let classObject = {
      [sectionClass] : true,
      [sectionClass + '--bio-card'] : true,
      [sectionClass + '--editing'] : self.state.isEditing,
      [sectionClass + '--unsaved'] : !!store.isUnsaved,
      [sectionClass + '--pic-empty'] : !image
    };
    let classes = classNames(classObject);
    let style = {
      'backgroundImage' : !image
        ? null
        : 'url(' + image + ')'
    };
    let bioImage = (!image)
      ? (<figcaption>{store.initial}</figcaption>)
      : <img src={image} />;
    let bioImageEditButtonTextPrefix = (self.state.isEditing)
      ? '- '
      : '+ ';
    let bioImageEditButtonText = (!image)
      ? bioImageEditButtonTextPrefix + AdminConstants.Copy.TEXT_IMAGE_ADD
      : bioImageEditButtonTextPrefix + AdminConstants.Copy.TEXT_IMAGE_CHANGE;
      
    return (
      <section className={classes}>
        <figure style={style}>
          <AdminBioPicEditForm bioImage={image} id={store._id} onChangeImageClick={self.onChangeImageClick} onFormSubmit={self.onFormSubmit} onFileChange={self.onFileChange} editButtonText={bioImageEditButtonText} />
          {bioImage}
        </figure>
        <div>
          <form action={AdminConstants.Urls.PROFILE_POST + '/' + store._id} method='post' data-method='put' encType='multipart/form-data' onSubmit={self.onFormSubmit}>
            <ElementEditable input='name' html={store.name} type='h1' component={component} />
            <input type='hidden' name='name' value={store.name} />
            <p className='small'>
              <ElementEditable input='phone' className='small__span small__span--phone' html={store.phone} type='span' component={component} />
              <input type='hidden' name='phone' value={store.phone} />
            </p>
            <p className='small'>
              <ElementEditable className='small__span small__span--adress' input='address' html={store.address} type='span' component={component} />
              <input type='hidden' name='address' value={store.address} />
              <input type='hidden' name='zipcode' />
            </p>
            <button className='btn btn--save'>{AdminConstants.Copy.TEXT_SAVE}</button>
          </form>
        </div>
      </section>
    );
  }

}
 
export default AdminBioCard;
