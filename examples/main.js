import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';

const AsyncMode = React.unstable_AsyncMode;

ReactDOM.render(
  <AsyncMode>
    <App />
  </AsyncMode>,
  document.getElementById('app')
);
