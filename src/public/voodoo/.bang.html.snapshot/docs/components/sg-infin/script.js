class Infin extends Base {
  // state 
    // hidden variables

    #updating = false;
    #yer;
    #viewport;
    #xdirection = 0;
    #ydirection = 0;
    #lastScrollTop = 0;
    #lastScrollLeft = 0;
    #lastYDirection = 0;
    #lastXDirection = 0;
    #yrejig = false;
    #xrejig = false;
    #cols = [];
    #colPool = [];

    get viewport() {
      if ( this.#viewport ) return this.#viewport;
      this.#viewport = this.shadowRoot.querySelector('.box');
      return this.#viewport;
    }

  constructor() {
    super();
    // API sketches / ideas
      // setWidth(x)
      // setHeight(y)
      // set the width and height CSS variable properties
      // to set the size of the table element

      // setRowCount(p)
      // setColumnCount(q)

      // setRowHeight(height, index = ALL)
      // setColumnWidth(width, index = ALL)

      // setRowLabels(labels = [1, 2, 3, ...])
      // setColumnLabels(labels = ['A', 'B', ...., 'AA', 'AB', ...])

      // setScrollLeft(x)
      // setScrollTop(y)
      
      // scrollToColumn(c: string Label | number index)
      // scrollToRow(r: string Label | number index)

      // setCellValue(x, y, {value, formula, ...etc})
      // getCellValue

      // getViewportDimensions() : {rows, columns, startRow, startColumn}

      // setViewportData(<[cellLabel]: cellData> data) : true | throws 
      // if data not big enough or has incorrect labels

      // setDataSource({labelTranslator, dataTransformer}) 
      // sets logical data source for entire table
      // automatically sets viewport with correct data after scroll

    this.untilVisible().then(() => {
      this.#yer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          this.topToPool();
          this.bottomToPool();
          if ( this.#ydirection >= 0 ) {
            this.poolToBottom();
          } else {
            this.poolToTop();
          }
        }), 
        {root: this.viewport}
      );
      // so when the first row crosses threshold, put new one on bottom
      // when last row crosses threashold, put one on top
      let start = 0;
      Array.from(this.viewport.querySelectorAll('tr.sc-item')).forEach(row => {
        row.style.top = `${start}px`;
        this.#yer.observe(row);
        start += row.clientHeight;

        {
          let cellStart = parseFloat(row.style.left || this.viewport.scrollLeft);

          Array.from(row.querySelectorAll('td')).forEach((cell,j) => {
            let col = this.#cols[j];
            if ( ! col ) {
              const processEntries = () => {
                col.entries.length = 0;
                this.handleEntry();
              };
              col = {
                entries: [],
                left: cellStart,
                width: cell.clientWidth,
                observer: new IntersectionObserver(
                  entries => {
                    entries.forEach(entry => col.entries.push(entry));
                    setTimeout(processEntries, 0);
                  },
                  {root: this.viewport}
                ),
                cells: []
              };
              this.#cols[j] = col;
            }
            cell.style.left = `${cellStart}px`;
            col.cells.push(cell);
            col.observer.observe(cell);
            cellStart += cell.clientWidth;
          });
        }
      });

      this.topToPool();
      this.bottomToPool();
      this.leftToPool();
      this.rightToPool();
    });
  }

  handleEntry() {
    if ( this.#xdirection == 0 ) return;
    this.leftToPool();
    this.rightToPool();
    if ( this.#xdirection >= 0 ) {
      this.poolToRight();
    } else {
      this.poolToLeft();
    }
  }

  Recalculate() {
    // do nothing
  }

  rowsAbove() {
    const first = [];
    const start = this.viewport.scrollTop;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top) + el.clientHeight;
        if ( thisTop < start ) {
          first.push(el);
        }
      });
    return first;
  }

  rowsBelow() {
    const last = [];
    const end = this.viewport.scrollTop + this.viewport.clientHeight;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop > end ) {
          last.push(el);
        }
      });
    return last;
  }

  colsLeft() {
    const left = [];
    const start = this.viewport.scrollLeft;
    this.#cols = this.#cols
      .filter((col,i) => {
        const thisLeft = col.left + col.width;
        if ( thisLeft < start ) {
          left.push(col);
          return false;
        }
        return true;
      });
    return left;
  }

  colsRight() {
    const right = [];
    const end = this.viewport.scrollLeft + this.viewport.clientWidth;
    this.#cols = this.#cols
      .filter((col,i) => {
        const thisLeft = col.left;
        if ( thisLeft > end ) {
          right.push(col);
          return false;
        }
        return true;
      });
    return right;
  }

  allRows() {
    return Array.from(this.viewport.querySelectorAll('tbody tr'));
  }

  leftmostCellLeft() {
    let leftmostCellLeft = Infinity;
    this.#cols.forEach(col => {
      const left = col.left;
      if ( left < leftmostCellLeft ) {
        leftmostCellLeft = left;
      }
    });
    return leftmostCellLeft;
  }

  rightmostCellRight() {
    let rightmostCellRight = -Infinity;
    this.#cols.forEach(col => {
      const right = col.left + col.width; 
      if ( right > rightmostCellRight ) {
        rightmostCellRight = right;
      }
    });
    return rightmostCellRight;
  }

  highestRowTop() {
    let highestRowTop = Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).forEach(el => {
      const top = parseFloat(el.style.top);
      if ( top < highestRowTop ) {
        highestRowTop = top;
      }
    });
    return highestRowTop;
  }

  lowestRowBottom() {
    let lowestRowBottom = -Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).forEach(el => {
      const bottom = parseFloat(el.style.top) + el.clientHeight;
      if ( bottom > lowestRowBottom ) {
        lowestRowBottom = bottom;
      }
    });
    return lowestRowBottom;
  }

  allToPool() {
    this.allRows().forEach(this.toPool);
  }

  topToPool() {
    this.rowsAbove().forEach(this.toPool);
  }

  bottomToPool() {
    this.rowsBelow().forEach(this.toPool);
  }

  leftToPool() {
    this.colsLeft().forEach(col => this.toPoolCol(col));
  }

  rightToPool() {
    this.colsRight().forEach(col => this.toPoolCol(col));
  }

  allCellsToPool() {
    this.#cols.forEach(col => this.toPoolCol(col));
    this.#cols.length = 0;
  }

  poolToLeft(atST = false, lockScroll = this.viewport.scrollLeft) {
    //lockScroll = this.viewport.scrollLeft;
    let BUFFER = Math.max(0, lockScroll - 150);
    let i = 0, pool, leftmostCellLeft;
    leftmostCellLeft = this.leftmostCellLeft();
    if ( atST || leftmostCellLeft == Infinity ) {
      if ( atST ) {
        leftmostCellLeft = lockScroll + this.viewport.clientWidth;
      } else {
        leftmostCellLeft = BUFFER;
        BUFFER -= this.viewport.clientWidth;
      }
      this.allCellsToPool();
    }
    do {
      pool = this.#colPool.shift();
      if ( pool ) {
        this.#cols.unshift(pool);
        i++;
        pool.left = leftmostCellLeft-pool.width;
        pool.cells.forEach(cell => {
          cell.classList.remove('sc-cell');
          cell.classList.add('sc-item');
          cell.style.top = 0;
          cell.style.left = `${pool.left}px`;
          cell.style.width = `${pool.width}px`;
        });
        leftmostCellLeft -= pool.width;
      }
    } while( (i < 1 || atST) && pool && leftmostCellLeft > BUFFER );
  }

  poolToRight(r, atST = false, lockScroll = this.viewport.scrollLeft) {
    //lockScroll = this.viewport.scrollLeft;
    let BUFFER = lockScroll + this.viewport.clientWidth + 150;
    let i = 0, pool, rightmostCellRight;
    rightmostCellRight = this.rightmostCellRight();
    if ( atST || rightmostCellRight == -Infinity ) {
      if ( atST ) {
        rightmostCellRight = lockScroll; 
      } else {
        rightmostCellRight = BUFFER; 
        BUFFER += this.viewport.clientWidth;
      }
      this.allCellsToPool();
    }
    do {
      pool = this.#colPool.shift();
      if ( pool ) {
        pool.left = rightmostCellRight;
        this.#cols.push(pool);
        i++;
        pool.cells.forEach(cell => {
          cell.classList.remove('sc-cell');
          cell.classList.add('sc-item');
          cell.style.top = 0;
          cell.style.left = `${pool.left}px`;
          cell.style.width = `${pool.width}px`;
        });
        rightmostCellRight += pool.width;
      }
    } while ( (i < 1 || atST) && pool && rightmostCellRight < BUFFER );
  }

  toPool(el) {
    el.style.top = `-${el.clientHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
  }

  toPoolCol(col) {
    const top = this.viewport.scrollTop + this.viewport.clientHeight;
    col.cells.forEach(cell => this.toPoolCell(cell, top));
    this.#colPool.push(col);
  }

  toPoolCell(el, top) {
    el.style.top = `-${top+el.clientHeight+150}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
  }

  poolToTop(atST = false) {
    let BUFFER = Math.max(0, this.viewport.scrollTop - 50);
    let i = 0, pool, highestRowTop;
    highestRowTop = this.highestRowTop();
    if ( atST || highestRowTop == Infinity ) {
      if ( atST ) {
        highestRowTop = this.viewport.scrollTop + this.viewport.clientHeight;
      } else {
        highestRowTop = BUFFER;
        BUFFER -= this.viewport.clientHeight;
      }
      this.allToPool();
    }
    do {
      pool = this.viewport.querySelector('tr.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${highestRowTop-pool.clientHeight}px`;
        highestRowTop -= pool.clientHeight;
      }
    } while( (i < 1 || atST) && pool && highestRowTop > BUFFER );
  }

  poolToBottom(atST = false) {
    let BUFFER = this.viewport.scrollTop + this.viewport.clientHeight + 50;
    let i = 0, pool, lowestRowBottom;
    lowestRowBottom = this.lowestRowBottom();
    if ( atST || lowestRowBottom == -Infinity ) {
      if ( atST ) {
        lowestRowBottom = this.viewport.scrollTop; 
      } else {
        lowestRowBottom = BUFFER; 
        BUFFER += this.viewport.clientHeight;
      }
      this.allToPool();
    }
    do {
      pool = this.viewport.querySelector('tr.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${lowestRowBottom}px`;
        lowestRowBottom += pool.clientHeight;
      }
    } while ( (i < 1 || atST) && pool && lowestRowBottom < BUFFER );
  }

  UpdatePosition(scrollEvent) {
    if ( this.#updating ) return;
    this.#updating = true;
    const {target} = scrollEvent; 

    {
      const thisScrollTop = target.scrollTop;
      let dist = 0, needRejig = false;
      if ( thisScrollTop !== this.#lastScrollTop ) {
        dist = thisScrollTop - this.#lastScrollTop;
        this.#ydirection = Math.sign(dist);
        this.#lastScrollTop = thisScrollTop;
        needRejig = Math.abs(dist) > this.viewport.clientHeight || (this.#lastYDirection !== this.#ydirection);
        this.#lastYDirection = this.#ydirection;
        if ( needRejig ) {
          // we could debounce/throttle this on scroll
          if ( this.#yrejig ) clearTimeout(this.#yrejig );
          this.#yrejig = setTimeout(() => {
            this.#yrejig = false;
            this.allToPool();
            if ( this.#ydirection > 0 ) {
              this.poolToBottom(true);
            } else {
              this.poolToTop(true);
            }
          }, 50);
        }
      }
    }

    {
      const thisScrollLeft = target.scrollLeft;
      let span = 0, needRejigX = false;
      if ( thisScrollLeft !== this.#lastScrollLeft ) {
        span = thisScrollLeft - this.#lastScrollLeft;
        this.#xdirection = Math.sign(span);
        this.#lastScrollLeft = thisScrollLeft;
        needRejigX = Math.abs(span) > this.viewport.clientWidth || (this.#lastXDirection !== this.#xdirection && this.#xdirection !== 0);
        if ( needRejigX ) {
          this.#lastXDirection = this.#xdirection;
          // we could debounce/throttle this on scroll
          if ( this.#xrejig ) clearTimeout(this.#xrejig );
          this.#xrejig = setTimeout(() => {
            this.#xrejig = false;
            this.allCellsToPool();
            const lockScroll = this.viewport.scrollLeft;
            if ( this.#xdirection > 0 ) {
              this.poolToRight(true, lockScroll);
            } else {
              this.poolToLeft(true, lockScroll);
            }
          }, 50);
        }
      }
    }
    this.#updating = false;
  }
}
