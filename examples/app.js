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
    }, () => {
      requestAnimationFrame(() => this.tick());
    });
  }
  componentDidMount() {
    this.tick();
  }
  render() {
    return <div>{this.state.time}</div>;
  }
}

const App = () => [<Hello />, <br />, <List />];

const render = (element) => {
  const container = document.getElementById('app');
  const div = document.createElement('div');
  container.innerHTML = '';
  ReactDOM.unmountComponentAtNode(container);
  container.appendChild(div);
  ReactDOM.render(element, div);
};

const Nav = () => (
  <div>
    <h3>ReactDOMFiber</h3>
    <div>
      <button onClick={() => render(<App />)}>Hello</button>
      <button onClick={() => render(<Items />)}>10,000 items</button>
      <button onClick={() => render(<Counter />)}>Counter</button>
    </div>
  </div>
);
ReactDOM.render(<Nav />, document.getElementById('nav'));
