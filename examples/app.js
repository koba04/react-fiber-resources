import React from 'react';
import ReactDOM from 'react-dom';

var Hello = () => 'Hello ReactFiber';
var List = () => [1, 2, 3];

var items = [];
for (let i = 0; i < 10000; ++i) {
  items.push({index: i, name: `item:${i}`});
}

var Items = () => (
  <ul>
      {items.map(item => <li key={item.index}>{item.name}</li>)}
  </ul>
);

class Counter extends React.Component {
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
    this.id = requestAnimationFrame(() => this.tick());
  }
  componentDidMount() {
    this.tick();
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.id);
  }
  render() {
    return <div>{this.state.time}</div>;
  }
}

const App = () => [<Hello />, <br />, <List />];

const render = (element) => {
  const container = document.getElementById('app');
  ReactDOM.unmountComponentAtNode(container);
  ReactDOM.render(element, container);
};

const Nav = () => (
  <div>
    <button onClick={() => render(<App />)}>Hello</button>
    <button onClick={() => render(<Items />)}>10,000 items</button>
    <button onClick={() => render(<Counter />)}>Counter</button>
  </div>
);
ReactDOM.render(<Nav />, document.getElementById('nav'));
