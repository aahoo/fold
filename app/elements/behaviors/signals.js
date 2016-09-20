/**
`Signals` behavior provides basic publish-subscribe functionality. To send a
signal, fire a custom event of type `signal`, with a detail object containing
`name` and `data` fields.
    this.fire('signal', {name: 'hello', data: null});
To receive a signal, listen for `signal-<name>` event on a element with
`Signals` behavior.
  this.listen(this, 'signal-hello', 'helloHandler');
You can fire a signal event from anywhere, and all elements with `Signals`
behavior will receive the event, regardless of where they are in DOM.
*/

Polymer.Behaviros.Signals = (function() {
  // private shared database
  var signals = [];
  // signal dispatcher
  function notify(name, data) {
    // convert generic-signal event to named-signal event
    var signal = new CustomEvent('signal-' + name, {
      // if signals bubble, it's easy to get confusing duplicates
      // (1) listen on a container on behalf of local child
      // (2) some deep child ignores the event and it bubbles
      //     up to said container
      // (3) local child event bubbles up to container
      // also, for performance, we avoid signals flying up the
      // tree from all over the place
      bubbles: false,
      detail: data
    });
    // dispatch named-signal to all 'signals' instances,
    // only interested listeners will react
    signals.forEach(function(s) {
      s.dispatchEvent(signal);
    });
  }
  // signal listener at document
  document.addEventListener('signal', function(e) {
    notify(e.detail.name, e.detail.data);
  });
  // signals behavior
  return {
    attached: function() {
      signals.push(this);
    },
    detached: function() {
      var i = signals.indexOf(this);
      if(i >= 0) signals.splice(i, 1);
    }
  };

})();
