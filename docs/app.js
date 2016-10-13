var $ = React.createElement.bind(React);

class App extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      $('div', null,
        $('p', null, 'Hello ReactFiber')
      )
    );
  }
}

ReactDOMFiber.render(
  $(App),
  document.getElementById('app')
);
