import AdminActions from '../../actions/AdminActions.js';

class AdminBioComponent extends React.Component {

  constructor(props) {
    super(props);

    this.onFileChange = this.onFileChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChangeImageClick = this.onChangeImageClick.bind(this);
    if(this.onChange) this.onChange = this.onChange.bind(this);
  }

  onFileChange(e) {
    AdminActions.getImageFile(e, this.name);
  }

  onFormSubmit(e) {
    e.preventDefault();
    this.setState({ 'isUnsaved' : false });
    AdminActions.save(e, this.name);
  }

  onChangeImageClick(e) {
    e.preventDefault();
    let isEditing = !this.state.isEditing;

    this.setState({
      'isEditing' : isEditing
    });
  }

}
 
export default AdminBioComponent;
