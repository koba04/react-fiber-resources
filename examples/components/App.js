import React from 'react';
import ReactDOM from 'react-dom';

import Tab from './Tab';
import Input from './Input';
import Items from './Items';
import List from './List';
import Text from './Text';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAsync: true,
      text: '',
      items: [...new Array(5000)].map((_, i) => ({index: i, name: `item:${i}`, value: i}))
    }
  }
  highPriUpdate(fn, cb) {
    // High Priority update is not same as wrapping rAF.
    // Currently, we can'nt emulate it.
    // if (this.state.isAsync) {
    //  requestAnimationFrame(() => this.setState(fn, cb));
    // } else {
    this.setState(fn, cb);
    // }
  }
  lowPriUpdate(fn, cb) {
    if (this.state.isAsync) {
      ReactDOM.unstable_deferredUpdates(() => {
        this.setState(fn, cb);
      });
    } else {
      this.setState(fn, cb);
    }
  }
  tick() {
    this.lowPriUpdate(
      state => ({
        count: state.count + 1,
        items: state.items.map(item => Object.assign({}, item, {name: `item:${item.value + 1}`, value: item.value + 1})),
      }),
      () => {
        this.timerId = setTimeout(() => this.tick(), 100);
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
        <h2>This is new features of v16, which returns an array and a string directly</h2>
        <p>You can check them through React Devtool!</p>
        <div style={{backgroundColor: '#EEF'}}>
          <Text />
          <List />
        </div>
        <h2>A sample for React Fiber priorities</h2>
        <p>You can switch a rendering mode to Async or Sync.</p>
        <p>Please try to input text and switch the mode.</p>
        <Tab
          isAsync={isAsync}
          onClick={value => this.setState(() => ({isAsync: value, text: ''}))}
        />
        <h3>Rendering a text input as sync priority</h3>
        <Input value={text} onChange={value => this.highPriUpdate(() => ({text: value}))} />
        <h3>Rendering {items.length}items as {isAsync ? 'low' : 'sync'} priority</h3>
        <Items items={items} />
      </main>
    );
  }
}
