const React = require('react');
const ReactConsole = require('./ReactConsole');
const colors = require('colors/safe');

ReactConsole.render(
  <>
    <red>Hello</red>
    <yellow>World</yellow>
    <cyan>React</cyan>
    <rainbow>Custom Renderer!</rainbow>
  </>,
  () => console.log(colors.inverse('##### Update ######'))
);

ReactConsole.render(
  <>
    <green>Hello</green>
    <yellow>World2</yellow>
    <cyan>React</cyan>
  </>
);
