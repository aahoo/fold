/**
Handles all the drag and drop features. Configuration of what can be dropped
into what and what should happen is made using `Config` object below. For
elements to be draggable, `draggable="true"` should be assigned.
@module drag
@memberof $$
@property {object} source HTML element being dragged
@property {object} target HTML element that is being dropped upon
@property {string} dropEffect see `config` for examples
@property {object} [root=document.body] element to attach drag&drop events
@property {number} [hoverTimeout=700] hover delay in miliseconds after which
                  the drop effect changes
@property {boolean} active a flag that is true when drag&drop is activated
*/

$$.drag = {
  source: null,
  target: null,
  dropEffect: '',
  root: document.body,
  hoverTimeout: 700,
  get active() {
    return this._active;
  },
  set active(val) {
    this.root.clss('drag-active', val);
    this._active = val;
  },
};

/**
Config object that determines wat goes into what and what should happen.
General pattern is as follows:
{
`source css selector (item being dragged)`: {
  `alternative target 1(item being dropped) css selector` : `action to perform`,
  `alternative target 2(item being dropped) css selector` : `action to perform`,
  `alternative target n(item being dropped) css selector` : `action to perform`
  }
}
`action to perform` can be a simple string or it can be an object like:
{
  enter: `action to perform(must be a simple string)`,
  hover: `action to perform(must be a simple string)`,
}
@property config
@memberof $$.drag
*/
$$.drag.config = {
  '*': {
    '.action.li': 'move-action',
  },
  '.action.li': {
    '*': 'move-action',
  },
  '.content.grid>.li .li': {
    '.content.grid': 'link-in',
  },
  '.content.grid>.li .bookmark.li': {
    '.content.grid>.li .item.bookmark': 'move-after',
    '.content.grid>.li .folder.bookmark': {
      enter: 'move-in',
      hover: 'move-after',
    },
    '.content.grid>.item': 'link-after',
    '.content.grid>.folder.bookmark': {
      enter: 'move-in',
      hover: 'link-after',
    },
  },
  // '.content.grid>.li .app.li': {
  //   '.content.grid>.li .item.app': 'move-after',
  //   '.content.grid>.li .folder.app': {
  //     enter: 'move-in',
  //     hover: 'move-after',
  //   },
  //   '.content.grid>.item': 'link-after',
  //   '.content.grid>.folder.app': {
  //     enter: 'move-in',
  //     hover: 'link-after',
  //   },
  // },
  '.content.grid>.li .li:not(.bookmark):not(.action)': {
    '.content.grid:not(#default_column)>.li': 'link-after',
  },
  '.content.grid:not(#default_column)>.li:not(.action)': {
    '.content.grid:not(#default_column)>.li:not(.action)': 'move-after',
    '.content.grid:not(#default_column)': 'move-in',
  },
  '#default_column.content.grid>.li': {
    '.content.grid:not(#default_column)>.li': 'link-after',
    '.content.grid:not(#default_column)': 'link-in',
  },
  '.bar.content': {
    '.bar.content': 'move-after',
    '.vertical.wrapper': 'move-in',
  },
  '.column.content': {
    '.column.content': 'move-after',
    '.horizontal.wrapper': 'move-in',
  },
  '.wrapper.grid': {
    '.wrapper.grid': 'move-after',
  },
};

(function(drag, mouse, _, Timer, domOrder, eStop) {

  // variables //

  let config = drag.config,
    s, t, // drag source and target
    x, y = 0, // for detecting mouse move
    droppables = null,
    hoverTimer = Timer(setEffect);
  hoverTimer.delay = drag.hoverTimeout;

  const transparent1x1 = document.createElement('img');
  transparent1x1.src =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  // event handlers //

  function start(e) { // this/e.target is the source node.
    eStop(e);
    s = drag.source = findDraggable(e.srcElement);
    droppables = {};
    _.forOwn(config, (_val, _key) => {
      if(s.matches(_key)) Object.assign(droppables, _val);
    });
    s.attr('dragging', '');
    drag.active = true;
    // e.dataTransfer.effectAllowed = 'move';
    if(!s.clss('drag-image'))
      e.dataTransfer.setDragImage(transparent1x1, 0, 0);
  }

  function enter(e) { // this/e.target is the current hover target.
    eStop(e);
    hoverTimer.clear();
    t && resetEl(t);
    t = drag.target = null;
    s.removeAttribute('func');
    let _drop = findDroppable(s, findDraggable(e.srcElement));
    if(!_drop) return;
    t = drag.target = _drop.t;
    let _effect = _drop.effect;
    if(_.isPlainObject(_effect)) {
      hoverTimer.params[0] = _effect.hover;
      hoverTimer.refresh();
      _effect = _effect.enter;
    }
    setEffect(_effect);
  }

  function leave( /*e*/ ) { // this/e.target is previous target element.
  }

  function over(e) {
    e.preventDefault && e.preventDefault(); // Necessary. Allows drop.
    if(drag.dropEffect) e.dataTransfer.dropEffect = drag.dropEffect.split('-')[0];
    if(hoverTimer.active && (Math.abs(e.x - x) > 1 || Math.abs(e.y - y) > 1)) {
      hoverTimer.refresh();
      x = e.x;
      y = e.y;
    }
  }

  function end( /*e*/ ) { // this/e.target is the source node.
    s && s.attr('dragging', false).attr('func', false);
    drag.active = false;
    droppables = null;
    s = drag.source = null;
    t && resetEl(t);
    t = drag.target = null;
    hoverTimer.clear();
    mouse.wasDown = false;
  }

  function drop(e) { // this/e.target is current target element.
    eStop(e); // stops redirecting
    let _effect = drag.dropEffect;
    if(!t) {
      console.log('no target to drop in!');
      return false;
    }
    if(_effect == 'move-action') {
      let _action, _el;
      s.action ?
        (_action = s.action, _el = t) :
        (_action = t.action, _el = s);
      _el[_action.drop] && _el[_action.drop](_action.dropArgs);
    } else {
      let _parts = _effect.split('-'),
        _model = _parts[0] == 'move' ? s.cut() : s.copy();
      switch(_parts[1]) {
        case 'in':
          t.append(_model);
          break;
        case 'before':
          t.parent.insert(_model, { before: t.model });
          break;
        case 'after':
          t.nextSibling ?
            t.parent.insert(_model, { before: t.nextSibling.model }) :
            t.parent.append(_model);
          break;
      }
    }
    end();
    return false; // some browsers need this
  }

  // utility //

  function findDraggable(_el) {
    return !_el || !_el.getAttribute ? null : _el.hasAttribute('draggable') ?
      _el : findDraggable(_el.parentElement);
  }

  function findDroppable(_s, _t) {
    if(!_t || _s === _t || domOrder(_s, _t) === '2in1') return;
    let _effect;
    _.forOwn(droppables, (_val, _key) => {
      if(_t.matches(_key)) {
        _effect = _val;
        return true;
      }
    });
    return _effect ? { t: _t, effect: _effect } :
      findDroppable(_s, findDraggable(_t.parentElement));
  }

  function resetEl(_el) {
    if(_el) _el.attr('func', false).clss('dragged-over move-in move-before ' +
      'move-after link-in link-before link-after move-action', false);
  }

  // drop effect //

  function setEffect(_v) {
    domOrder(s, t) != '1>2' ? null :
      _v == 'move-after' ? _v = 'move-before' :
      _v == 'link-after' ? _v = 'link-before' : null;
    drag.dropEffect = _v;
    t && resetEl(t);
    let _f;
    if(_v == 'move-action') s.action ?
      (_f = s.action.drop, t[_f] && t.attr('func', _f)) :
      (_f = t.action.drop, s[_f] && s.attr('func', _f));
    t.clss([_v, 'dragged-over'], true);
  }

  // attach event listeners //

  drag.root.addEventListener('dragstart', start);
  drag.root.addEventListener('dragenter', enter);
  drag.root.addEventListener('dragover', over);
  drag.root.addEventListener('dragleave', leave);
  drag.root.addEventListener('dragend', end);
  drag.root.addEventListener('drop', drop);

}($$.drag, $$.mouse, _, __.Timer, __.domOrder, __.eStop));
