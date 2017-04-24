import React from 'react';

export default class Items extends React.PureComponent {
  render() {
    return (
      <ul>
          {this.props.items.map(item => <li key={item.index}>{item.name}</li>)}
      </ul>
    );
  }
}
