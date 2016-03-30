import AdminActions from '../actions/AdminActions.js';

export default class ElementEditable extends React.Component {

  constructor(props) {
    super(props);
    this.emitChange = this.emitChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.html !== ReactDOM.findDOMNode(this).innerHTML;
  }

  componentDidUpdate() {
    if(this.props.html !== ReactDOM.findDOMNode(this).innerHTML) ReactDOM.findDOMNode(this).innerHTML = this.props.html;
  }

  render() {
    let el = <div className={this.props.className} onInput={this.emitChange} onBlur={this.emitChange} contentEditable spellCheck='false' dangerouslySetInnerHTML={{__html: this.props.html}} />
    
    if(this.props.type === 'h1') el = <h1 className={this.props.className} onInput={this.emitChange} onBlur={this.emitChange} contentEditable spellCheck='false' dangerouslySetInnerHTML={{__html: this.props.html}} />
    if(this.props.type === 'p') el = <p className={this.props.className} onInput={this.emitChange} onBlur={this.emitChange} contentEditable spellCheck='false' dangerouslySetInnerHTML={{__html: this.props.html}} />
    if(this.props.type === 'span') el = <span className={this.props.className} onInput={this.emitChange} onBlur={this.emitChange} contentEditable spellCheck='false' dangerouslySetInnerHTML={{__html: this.props.html}} />
    
    return el;
  }

  emitChange() {
    let self = this;
    let html = ReactDOM.findDOMNode(self).innerHTML;

    if(html !== self.lastHtml) {
      AdminActions.receive({
        'component' : self.props.component,
        'data' : {
          [self.props.input] : html
        }
      });
    }
    
    self.lastHtml = html;
  }

}