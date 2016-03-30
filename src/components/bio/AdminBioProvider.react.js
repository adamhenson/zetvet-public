import classNames from 'classnames';

import AdminStore from '../../stores/AdminStore.js';
import AdminBioCover from './AdminBioCover.react.js';
import AdminBioCard from './AdminBioCard.react.js';
import AdminBioDescription from './AdminBioDescription.react.js';

function getStateFromStores(){
  return AdminStore.getAll();
}

class AdminBioProvider extends React.Component {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    this.setState({ 
      'store' : getStateFromStores() 
    });

    this.state = {
      'isEditing' : false
    }
  }

  componentDidMount() {
    AdminStore.addChangeListener(this.onChange);
  }

  componentWillUnmount() {
    AdminStore.removeChangeListener(this.onChange);
  }

  render() {
    let self = this;
    let mainClass = 'main';
    let withMessage = (self.state.store.message && self.state.store.message.type && self.state.store.message.body);
    let classObject = {
      [mainClass] : true,
      [mainClass + '--page'] : true,
      [mainClass + '--loading'] : self.state.store.isLoading,
      [mainClass + '--message-active'] : withMessage
    };
    let classes = classNames(classObject);
    let message = (!withMessage)
      ? ''
      : (<div className={'message message--' + self.state.store.message.type}>{self.state.store.message.body}</div>);
    let loadingElement = '';

    if(self.state.store.isLoading){
      loadingElement = <div className='page__overlay'></div>;
      $('body').addClass('page--blur');
    } else {
      $('body').removeClass('page--blur');
    }
    
    return (
      <main className={classes}>
        {loadingElement}
        {message}
        <AdminBioCover store={self.state.store} />
        <AdminBioCard store={self.state.store} />
        <AdminBioDescription store={self.state.store} />
      </main>
    );
  }

  onChange() {
    this.setState({ 
      'store' : getStateFromStores() 
    });
  }

}
 
export default AdminBioProvider;
