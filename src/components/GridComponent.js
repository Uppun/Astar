import React, {Component} from 'react';
import A_store from '../stores/A_store';
import {Container} from 'flux/utils';
import Cell from './CellComponent';
import StageButtons from './StageButtons';
import GridActions from '../actions/GridActions';
import '../main.css';

class PathfinderGrid extends Component {
    static getStores() {
        return [A_store];
    }

    static calculateState(prevState) {
        return A_store.getState();
    }

    shouldComponentUpdate(nextProps, nextState) {
        const currentWidth = this.state.grid.width;
        const currentHeight = this.state.grid.height;
        const newWidth = nextState.grid.width;
        const newHeight = nextState.grid.height;

        if (currentWidth !== newWidth || currentHeight !== newHeight) {
            return true;
        }

        return false;
    }

    handleCellClick = (x, y) => {
        const {stage} = this.state;
        
        switch (stage) {
            case 'STARTP': {
                GridActions.start(x, y);
                break;
            }

            case 'ENDP': {
                GridActions.end(x, y);
                break;
            }

            case 'WALL': {
                GridActions.pass(x, y);
                break;
            }

            default: {
                break;
            }
        }
    }

    render() {
        const {pathGrid} = this.state;
        return(
            <div>
                <div className="grid">
                    {pathGrid.grid.map((row, rowIndex) =>
                        <div className="grid-row" key={rowIndex}>
                            {row.map((cell, columnIndex) => {
                                return (<Cell key={columnIndex} handleClick={this.handleCellClick} x={cell.x} y={cell.y} />);
                            })}
                        </div>)}
                </div>
                <StageButtons />
            </div>
        )
    }
}

export default Container.create(PathfinderGrid);