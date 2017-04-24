import React from 'react';

const style = {
  tab: {
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    height: 100,
  },
  content: {
    flex: 1,
    textAlign: 'center',
    padding: 'auto',
    backgroundColor: '#eee',
    color: 'black',
    borderRadius: 3,
    fontSize: '1.2rem',
    paddingTop: 40,
  },
  active: {
    backgroundColor: 'tomato',
    color: '#fff',
  },
};

const Tab = ({isAsync, onClick}) => (
  <ul style={style.tab}>
    <li
      style={Object.assign({}, style.content, isAsync ? style.active : null)}
      onClick={() => onClick(true)}
    >
      Async mode
    </li>
    <li
      style={Object.assign({}, style.content, !isAsync ? style.active : null)}
      onClick={() => onClick(false)}
    >
      Sync mode
    </li>
  </ul>
);
export default Tab;
