var $ = React.createElement.bind(React);

var Hello = () => 'Hello ReactFiber';
var List = () => [1, 2, 3];

class App extends React.Component {
  render() {
    return [$(Hello), $('br'), $(List)];
  }
}

ReactDOMFiber.render(
  $(App),
  document.getElementById('app')
);
