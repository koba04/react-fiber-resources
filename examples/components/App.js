import React from 'react';
import ReactDOM from 'react-dom';

import Tab from './Tab';
import Input from './Input';
import Items from './Items';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAsync: true,
      text: '',
      items: [...new Array(5000)].map((_, i) => ({index: i, name: `item:${i}`, value: i}))
    }
  }
  syncUpdate(fn, cb) {
    ReactDOM.flushSync(() => {
      this.setState(fn, cb);
    });
  }
  tick() {
    this.setState(
      state => ({
        count: state.count + 1,
        items: state.items.map(item => Object.assign({}, item, {name: `item:${item.value + 1}`, value: item.value + 1})),
      }),
      () => {
        this.timerId = setTimeout(() => {
          this.state.isAsync ? this.tick() : ReactDOM.flushSync(() => this.tick());
        }, 100);
      }
    );
  }
  componentDidMount() {
    this.tick();
  }
  componentWillUnmount() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  }
  render() {
    const {isAsync, text, count, items} = this.state;
    return (
      <main>
        <h1>React Fiber Time Slicing Sample</h1>
        <p>You can switch a rendering mode to Async or Sync.</p>
        <p>Please try to input text and switch the mode.</p>
        <p style={{color: 'red'}}>If you can't get any diferrence between Async mode and Sync mode, you should use CPU throttling on DevTools</p>
        <Tab
          isAsync={isAsync}
          onClick={value => this.setState(() => ({isAsync: value, text: ''}))}
        />
        <h3>Rendering a text input as sync priority</h3>
        <Input value={text} onChange={value => this.syncUpdate(() => ({text: value}))} />
        <h3>Rendering {items.length}items as {isAsync ? 'low' : 'sync'} priority</h3>
        <Items items={items} />
      </main>
    );
  }
}
