class Table extends Base {
  static #DragSizeStart = new Set(['pointerdown', 'contextmenu', 'touchstart']);
  static #DragSizeStop = new Set(['pointerup', 'touchend', 'touchcancel']);
  static get EMPTY() { return ''; }
  static get MAX_ITERATIONS() { return 10; }
  static get CHANGED() { return 1e12+1; }
  static get DEBUG() { return false; }

  static getRealValue(thing) {
    const realValue = !Number.isNaN(Number(thing)) ? Number(thing) : thing;
    return realValue;
  }

  constructor() {
    super();
    const resizer = this.Resizer();
    this.Resize = event => resizer.next(event);
  }

  connectedCallback() {
    super.connectedCallback();
  }

  SelectColumn(focusEvent) {
    const th = Array.from(focusEvent.composedPath()).find(el => el?.matches?.('th[scope="col"]'));
    if ( this.isDragSizing ) {
      //return;
    }
    if ( th ) {
      const colElement = th.closest('table').querySelector(`col[name="${th.getAttribute('name')}"]`);
      colElement.classList.add('selected');
    }
  }

  DeselectColumn(focusEvent) {
    const th = Array.from(focusEvent.composedPath()).find(el => el?.matches?.('th[scope="col"]'));
    if ( th ) {
      const colElement = th.closest('table').querySelector(`col[name="${th.getAttribute('name')}"]`);
      colElement.classList.remove('selected');
    }
  }

  async run({cell}) {
    let iter = Table.MAX_ITERATIONS;
    const Formulas = [];
    const Deps = new Map();

    do {
      Formulas.length = 0;
      const CellProxy = {_currentCoord: null};
      const CellMap = {};
      for( let [coord, {formula,value}] of Object.entries(cell) ) {
        const cellCoord = coord.split(':')[1];
        if ( formula ) {
          Formulas.push(() => {
            let newValue = Table.EMPTY;
            try {
              newValue = runCode(CellProxy, `(function(){ 
                _currentCoord = "${cellCoord}";
                const result ${formula}; 
                return result;
              }())`);
            } catch(e) {
              console.info('cell error', coord, formula, e);
              newValue = 'error'; 
            }
            CellMap[cellCoord] = newValue;
            if ( newValue !== cell[coord].value ) {
              Table.DEBUG && console.log(`Cell ${cellCoord} changed.`, cell[coord].value, newValue);
              if ( Array.isArray(newValue) ) {
                cell[coord].value = JSON.stringify(newValue);
              } else {
                cell[coord].value = newValue;
              }
              return Table.CHANGED;
            } else {
              Table.DEBUG && console.log(`Cell ${cellCoord} did NOT change.`);
            }
          });
        }
        if ( value === Table.EMPTY ) {
          defineGetter(CellMap, CellProxy, cellCoord, Table.EMPTY);
        } else {
          const realValue = Table.getRealValue(value);
          defineGetter(CellMap, CellProxy, cellCoord, realValue);
        }
      }
    } while( iter-- && Formulas.map(f => f()).some(status => status === Table.CHANGED) );

    //console.log(Deps);

    function defineGetter(env, proxy, name, value) {
      const descriptor = {
        get() {
          //console.log(proxy._currentCoord, 'getting', name); 
          noteDep(proxy._currentCoord, name);
          return env[name];
        },
        set(value) {
          console.warn(proxy._currentCoord, 'setting', name); 
          //noteDep(proxy._currentCoord, name);
          env[name] = value; 
          return true;
        },
        enumerable: true,
        configurable: true
      };
      env[name] = value;
      Object.defineProperty(proxy, name, descriptor);
      Object.defineProperty(proxy, name.toLowerCase(), descriptor);
    }

    function noteDep(source, scope) {
      let deps = Deps.get(source);
      if ( ! deps ) {
        deps = new Set();
        Deps.set(source, deps);
      }
      deps.add(scope);
    }
  }

  nofastUpdate() {
    const state = this.state;
    const cells = state.cells || state;

    Object.entries(cells.cell).forEach(([key, cellState]) => this.updateIfChanged(cellState));
  }

  async loadCalculator() {
    const calculator = await import('./components/sg-table/calculator.js');
    Object.assign(this, {calculator});
  }

  async Recalculate(event) {
    const cells = this.state;
    const {target} = event;
    const host = target.getRootNode().host;
    const entry = target.value.trim();
    const value = Table.getRealValue(entry);
    const key = host.dataset.key;

    console.log({host, key, cells, that: this});
   
    if ( ! cells.cell[key] ) {
      cells.cell[key] = {key, value:'', formula:''}; 
    }
    
    if ( entry.startsWith('=') ) {
      cells.cell[key].formula = value;
    } else {
      cells.cell[key].value = value;
      cells.cell[key].formula = '';
    }

    cells.cell[key].editFormula = false;

    await this.run(cells);
    setTimeout(() => target.scrollLeft = 0, 100);
    console.log({cells});
    this.state = cells;
  }

  *Resizer() {
    let frontEl, backEl, table, box, scrollLeft, scrollTop;
    picking: while(true) {
      try {
        let event = yield;
        const target = event.composedPath()[0];
        sizing: if ( target.matches('.sizer') ) {
          if ( Table.#DragSizeStart.has(event.type) ) {
            if ( event.type === 'contextmenu' ) {
              event.preventDefault();
            }

            const {clientX:startX,clientY:startY} = event.type.includes('touch') ? event.touches[0] : event;
            frontEl = target.closest('th');
            table = table || frontEl.closest('table');
            backEl = frontEl.previousElementSibling || (
              frontEl.closest('tr').previousElementSibling || 
              table.querySelector('thead').lastElementChild
            )?.firstElementChild;
            box = box || backEl.closest('.box');
            const boxStyle = getComputedStyle(box);
            const minWidth = parseFloat(boxStyle.getPropertyValue('min-width'));
            const minHeight = parseFloat(boxStyle.getPropertyValue('min-height'));

            this.isDragSizing = true;
            //frontEl.blur();

            if ( target.matches('.column') ) {
              const columnElement = table.querySelector(`colgroup col[name="${frontEl.getAttribute('name')}"]`);
              const previousColumnElement = columnElement.previousElementSibling;
              if ( ! previousColumnElement ) continue picking;
              const widthBack = parseFloat(previousColumnElement.width || previousColumnElement.style.width || backEl.getBoundingClientRect().width);
              const widthFront = parseFloat(columnElement.width || columnElement.style.width)
              let newX = startX;

              col_size_dragging: while(true) {
                if ( event.type.includes('move') ) event.preventDefault();
                ({scrollLeft, scrollTop} = box);
                backEl.classList.add('dragging');
                previousColumnElement.classList.add('sizing');
                box.style.overflow = 'hidden';
                box.classList.add('snap-free');
                event = yield;
                if ( event.type === 'contextmenu' ) {
                  continue col_size_dragging;
                }
                if ( Table.#DragSizeStop.has(event.type) ) {
                  break col_size_dragging;
                }
                if ( event.target.matches('.column.sizer') && event.target !== target ) {
                  //continue newTarget;
                  //break col_size_dragging;
                }
                ({clientX:newX} = event.type.includes('touch') ? event.touches[0] : event);
                const [back, front] = newWidth();
                if ( previousColumnElement.matches('.row-header') ) {
                  box.style.setProperty(`--row-headers-width`, back);
                  table.classList.add('row-header-sizing');
                } else {
                  previousColumnElement.width = back;
                }
                //columnElement.width = front;
              }
              table.classList.remove('row-header-sizing');
              previousColumnElement.classList.remove('sizing');
              backEl.classList.remove('dragging');
              box.classList.remove('snap-free');
              box.style.overflow = 'auto';
              Object.assign(box, {scrollLeft,scrollTop});

              function newWidth() {
                return [
                  `${Math.max(minWidth, widthBack + newX - startX).toFixed(3)}px`,
                  `${Math.max(minWidth, widthFront + startX - newX).toFixed(3)}px`
                ];
              }
            } else if ( target.matches('.row') ) {
              const rowElement = frontEl.closest('tr');
              const previousRowElement = backEl.closest('tr');
              if ( ! previousRowElement ) continue picking;
              const heightBack = parseFloat(previousRowElement.height || previousRowElement.style.height || previousRowElement.getBoundingClientRect().height )
              const heightFront = parseFloat(rowElement.height || rowElement.style.height || rowElement.getBoundingClientRect().height)
              let newY = startY;

              row_size_dragging: while(true) {
                if ( event.type.includes('move') ) event.preventDefault();
                ({scrollLeft,scrollTop} = box);
                box.style.overflow = 'hidden';
                box.classList.add('snap-free');
                backEl.classList.add('dragging');
                previousRowElement.classList.add('sizing');
                event = yield;
                if ( Table.#DragSizeStop.has(event.type) ) {
                  break row_size_dragging;
                }
                if ( event.type === 'contextmenu' ) {
                  continue row_size_dragging;
                }
                if ( event.target.matches('.row.sizer') && event.target !== target ) {
                  //continue newTarget;
                  //break row_size_dragging;
                }
                ({clientY:newY} = event.type.includes('touch') ? event.touches[0] : event);
                const [back, front] = newHeight();
                if ( previousRowElement.matches('.column-header') ) {
                  previousRowElement.closest('.box').style.setProperty(`--column-headers-height`, back);
                } else {
                  previousRowElement.style.height = back;
                }
                //rowElement.style.height = front;
              }
              previousRowElement.classList.remove('sizing');
              backEl.classList.remove('dragging');
              box.classList.remove('snap-free');
              box.style.overflow = 'auto';
              Object.assign(box, {scrollLeft,scrollTop});

              function newHeight() {
                return [
                  `${Math.max(minHeight, heightBack + newY - startY).toFixed(3)}px`,
                  `${Math.max(minHeight, heightFront + startY - newY).toFixed(3)}px`
                ];
              }
            }
            this.isDragSizing = false;
            //frontEl.blur();
          }
        }
      } catch(e) {
        alert(e);
      }
    }
  }
}
