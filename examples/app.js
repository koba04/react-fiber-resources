var $ = React.createElement.bind(React);

var Hello = () => 'Hello ReactFiber';
var List = () => [1, 2, 3];


var items = [];
for (let i = 0; i < 100; ++i) {
  items.push({index: i, name: `item:${i}`});
}

var Items = () => (
  $('ul', {},
    items.map(item => $('li', {key: item.index,}, item.name))
  )
);

class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.initialTime = Date.now();
    this.state = {
      time: 0
    };
  }
  tick() {
    this.setState({
      time: Date.now() - this.initialTime,
    });
    requestAnimationFrame(() => this.tick());
  }
  componentDidMount() {
    this.tick();
  }
  render() {
    return $('div', null, this.state.time);
  }
}

class App extends React.Component {
  render() {
    return $(Items);
    // return $(Timer);
    // return [$(Hello), $('br'), $(List)];
  }
}

ReactDOMFiber.render(
// ReactDOM.render(
  $(App),
  document.getElementById('app')
);
