/*
The `x-icon` element is a fork of iron-icon element by polymer team. All the
functionalities and usage is similar with the following changes:

1. the default icon set is changed to x-icons from iron-icons
2. icons will be chosen from svg3line if it exists (see the list of available
icons below in SVG3LINE array). SVG3LINE is made up of 3 svg lines which takes
shape based on css classes applied in svg3line.scss file.
*/

Polymer({
  is: 'x-icon',
  extends: 'div',
  properties: {

    /**
     * The name of the icon to use. The name should be of the form:
     * `iconset_name:icon_name`.
     */
    icon: { type: String, observer: '_iconChanged', reflectToAttribute: true },

    /**
     * The size of the icon to use. defaults to 24.
     */
    size: { type: Number, value: 24, reflectToAttribute: true },

    /**
     * The name of the theme to be used, if one is specified by the iconset.
     */
    theme: { type: String, observer: '_updateIcon' },

    /**
     * If using iron-icon without an iconset, you can set the src to be
     * the URL of an individual icon image file. Note that this will take
     * precedence over a given icon attribute.
     */
    src: { type: String, observer: '_srcChanged' },

    /**
     * @type {!Polymer.IronMeta}
     */
    _meta: {
      value: Polymer.Base.create('iron-meta', { type: 'iconset' }),
      observer: '_updateIcon'
    },

  },

  _DEFAULT_ICONSET: 'x-icons',

  SVG3LINE: ['add', 'arrow-back', 'arrow-forward', 'check',
    'chevron-left', 'chevron-right', 'close', 'expand-less', 'expand-more',
    'menu', 'more-horiz', 'more-vert'
  ],

  _iconChanged: function(icon) {
    var parts = (icon || '').split(':');
    this._iconName = parts.pop();
    this._iconsetName = parts.pop() || this._DEFAULT_ICONSET;
    if(this.SVG3LINE.indexOf(this._iconName) >= 0) {
      if(this._type == 'svg3line') return;
      else this._type = 'svg3line';
    }
    this._updateIcon();
  },

  _srcChanged: function( /* src */ ) {
    this._updateIcon();
  },

  _usesIconset: function() {
    return this.icon || !this.src;
  },

  /** @suppress {visibility} */
  _updateIcon: function() {
    if(this._type == 'svg3line') {
      this._iconset && this._iconset.removeIcon(this);
      this._img && this._img.remove();
      if(!this._svg) {
        this.innerHTML =
          `<svg id="svg" viewbox="0 0 100 100">
      <g transform="translate(50, 50)">
        <line x1="-3" y1="0" x2="3" y2="0"></line>
        <line x1="-3" y1="0" x2="3" y2="0"></line>
        <line x1="-3" y1="0" x2="3" y2="0"></line>
      </g>
    </svg>`;
        this._svg = this.firstChild;
      }
      this.appendChild(this._svg);
    } else if(this._usesIconset()) {
      this._img && this._img.remove();
      this._svg && this._svg.remove();
      if(this._iconName === '') {
        this._iconset && this._iconset.removeIcon(this);
      } else if(this._iconsetName && this._meta) {
        this._iconset = /** @type {?Polymer.Iconset} */ (
          this._meta.byKey(this._iconsetName));
        if(this._iconset) {
          this._iconset.applyIcon(this, this._iconName, this.theme);
          this.unlisten(window, 'iron-iconset-added', '_updateIcon');
        } else {
          this.listen(window, 'iron-iconset-added', '_updateIcon');
        }
      }
    } else {
      this._iconset && this._iconset.removeIcon(this);
      this._svg && this._svg.remove();
      if(!this._img) {
        this._img = document.createElement('img');
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.draggable = false;
      }
      this._img.src = this.src;
      this.appendChild(this._img);
    }
  },

  /* some scratchings to implement icons with alternate shape on mouseover */
  // properties: {
  //   onhoverEnabled: {
  //     type: Boolean,
  //     reflectToAttribute: true,
  //   },
  //   color: {
  //     type: String,
  //     value: '#000',
  //     observer: 'setColor',
  //   },
  //   shape: {
  //     type: String,
  //     observer: 'setShape',
  //   },
  //   toggled: {
  //     type: Boolean,
  //     observer: 'applyToggle',
  //   },
  //   defaultShape: String,
  //   altShape: String,
  // },
  // applyToggle() {
  //   this.$.svg.attr('class', this.getDefaultShape());
  // },
  // setColor(color) {
  //   this.$.svg.attr('stroke', color);
  // },
  // attached() {
  //   this.$.svg.attr('class', this.getDefaultShape());
  //   if(this.onhoverEnabled) {
  //     this.listen(this, 'mouseenter', 'setShape')
  //     this.listen(this, 'mouseleave', 'resetShape')
  //   }
  // },
  // detached() {
  //   if(this.onhoverEnabled) {
  //     this.unlisten(this, 'mouseenter', 'setShape')
  //     this.unlisten(this, 'mouseleave', 'resetShape')
  //   }
  // },
  // setShape(shape) {
  //   if(typeof shape !== 'string') shape = this.getAltShape();
  //   this.$.svg.attr('class', shape);
  // },
  // resetShape() {
  //   this.$.svg.attr('class', this.getDefaultShape());
  // },
  // getDefaultShape() {
  //   return this.toggled ? this.altShape : this.defaultShape;
  // },
  // getAltShape() {
  //   return this.toggled ? this.defaultShape : this.altShape;
  // },
});
