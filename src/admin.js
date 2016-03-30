import AdminBioProvider from './components/bio/AdminBioProvider.react.js';

(function(window, document, undefined){

  let components = {
    'AdminBioProvider' : AdminBioProvider
  };

  function renderReactComponent(componentName){
    let $el = $('.' + componentName);
    let ReactComponent = components[componentName];
    if($el.length) {
      ReactDOM.render(
        <ReactComponent />,
        $el[0]
      );
    };
  };

  if(typeof Zetvet !== 'undefined' && Zetvet.loadObject && Zetvet.loadObject.components){
    for(let i = 0; Zetvet.loadObject.components.length > i; i++){
      renderReactComponent(Zetvet.loadObject.components[i]);
    }
  }

})(window, document);