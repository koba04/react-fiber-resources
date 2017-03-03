import React from 'react';
import ReactDOMFiber from 'react-dom';
import ReactDOM from 'react-dom/lib/ReactDOM';

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

const render = (element, renderer = ReactDOMFiber) => {
  const container = document.getElementById('app');
  const div = document.createElement('div');
  container.innerHTML = '';
  renderer.unmountComponentAtNode(container);
  container.appendChild(div);
  renderer.render(element, div);
};

const Nav = () => (
  <div>
    <h3>ReactDOMFiber</h3>
    <div>
      <button onClick={() => render(<App />)}>Hello</button>
      <button onClick={() => render(<Items />)}>10,000 items</button>
      <button onClick={() => render(<Counter />)}>Counter</button>
    </div>
    <h3>ReactDOM <span style={{color: 'tomato'}}>not Fiber</span></h3>
    <div>
      <button onClick={() => render(<Items />, ReactDOM)}>10,000 items</button>
      <button onClick={() => render(<Counter />, ReactDOM)}>Counter</button>
    </div>
  </div>
);
ReactDOMFiber.render(<Nav />, document.getElementById('nav'));
