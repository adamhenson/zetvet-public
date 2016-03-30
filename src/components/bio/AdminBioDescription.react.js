import classNames from 'classnames';

import AdminConstants from '../../constants/AdminConstants.js';
import AdminActions from '../../actions/AdminActions.js';
import ElementEditable from '../ElementEditable.react.js';
import AdminBioComponent from './AdminBioComponent.react.js';

class AdminBioDescription extends AdminBioComponent {

  constructor(props) {
    super(props);
    this.name = AdminConstants.Components.ADMIN_BIO_DESCRIPTION;
  }

  componentWillMount() {
    this.state = {
      'isEditing' : false
    }

    AdminActions.receive({
      'component' : this.name,
      'data' : {
        '_id' : Zetvet.loadObject.user._id,
        'description' : Zetvet.loadObject.user.description
      }
    });
  }

  render() {
    let self = this;
    let component = this.name;
    let store = self.props.store.data[component];
    let sectionClass = 'section-module';
    let classObject = {
      [sectionClass] : true,
      [sectionClass + '--bio-description'] : true,
      [sectionClass + '--empty'] : (!Zetvet.loadObject.user.description || Zetvet.loadObject.user.description === ''),
      [sectionClass + '--editing'] : self.state.isEditing,
      [sectionClass + '--unsaved'] : self.state.isUnsaved
    };
    let classes = classNames(classObject);
    
    return (
      <section className={classes}>
        <ElementEditable className='paragraphs' input='description' html={store.description} component={component} />
        <form action={AdminConstants.Urls.PROFILE_POST + '/' + Zetvet.loadObject.user._id} method='post' data-method='put' encType='multipart/form-data' onSubmit={self.onFormSubmit}>
          <input type='hidden' name='description' value={store.description} />
          <button className='btn btn--save'>{AdminConstants.Copy.TEXT_SAVE}</button>
        </form>
      </section>
    );
  }

}
 
export default AdminBioDescription;
