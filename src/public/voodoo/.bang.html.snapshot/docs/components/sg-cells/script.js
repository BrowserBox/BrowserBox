class Cells extends Base {
  static EMPTY = '';
  static MAX_ITERATIONS = 10;
  static CHANGED = 1e12+1;
  static DEBUG = false;

  constructor() {
    super();
    this.untilLoaded().then(async () => {
      await sleep(3000);
      const cells = this.state;
      await this.run(cells);
      cells.cell.A2.editFormula = false;
      this.state = cells;
    });
  }

  async run({cell}) {
    Cells.DEBUG && console.log('running');
    const Formulas = [];
    const CellProxy = {};
    for( let [coord, {formula,value}] of Object.entries(cell) ) {
      if ( formula ) {
        Formulas.push(() => {
          let newValue = Cells.EMPTY;
          try {
            newValue = runCode(CellProxy, `(function(){ 
              try {
                const result ${formula}; 
                return result;
              } catch(e) {
                console.warn(e);
                return e;
              }
            }())`);
            Cells.DEBUG && console.log({newValue});
          } catch(e) {
            console.info('cell error', coord, formula, e);
            newValue = 'error'; 
          } finally {
            if ( Number.isNaN(value) ) {
              newValue = 'not a number';
              console.info('cell error nan');
            }
          }
          CellProxy[coord] = newValue;
          if ( newValue !== cell[coord].value ) {
            cell[coord].value = newValue;
            return Cells.CHANGED;
          }
        });
      }
      if ( value === Cells.EMPTY ) {
        CellProxy[coord] = Cells.EMPTY; 
        CellProxy[coord.toLowerCase()] = Cells.EMPTY; 
      } else {
        CellProxy[coord] = !Number.isNaN(Number(value)) ? Number(value) : value;
        CellProxy[coord.toLowerCase()] = !Number.isNaN(Number(value)) ? Number(value) : value;
      }
    }
    let iter = Cells.MAX_ITERATIONS;
    while( iter-- && Formulas.map(f => f()).some(status => status === Cells.CHANGED) );
  }

  fastUpdate() {
    const state = cloneState('data'); 
    const {cells} = state;

    Object.entries(cells.cell).forEach(([key, cellState]) => this.updateIfChanged(cellState));
  }

  async loadCalculator() {
    const calculator = await import('./components/sg-cells/calculator.js');
    Object.assign(this, {calculator});
  }

  async Recalculate(event) {
    const cells = this.state;
    const {target} = event;
    const host = target.getRootNode().host;
    const entry = target.value.trim();
    const key = host.dataset.key;
   
    if ( ! cells.cell[key] ) {
      cells.cell[key] = {key, value:'', formula:''}; 
    }
    
    if ( entry.startsWith('=') ) {
      cells.cell[key].formula = entry;
    } else {
      cells.cell[key].value = entry;
      cells.cell[key].formula = '';
    }

    cells.cell[key].editFormula = false;

    await this.run(cells);
    setTimeout(() => target.scrollLeft = 0, 100);
    this.state = cells;
  }
}
