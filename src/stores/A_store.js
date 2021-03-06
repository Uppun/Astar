import {ReduceStore} from 'flux/utils';
import Dispatcher from '../Dispatcher';
import ActionTypes from '../actions/ActionTypes';
import Grid from '../Grid';
import Cell from '../Cell';
import Astar from '../Astar';
import mapGenerator from '../mapGenerator';
import Dstarlite from '../Dstarlite';

const SIZE = 50; 

function pathfind(player, end, pathGrid) {
    const start = pathGrid.getCell(player.x, player.y);
    const goal = pathGrid.getCell(end.x, end.y);
    const path = Astar(start, goal, Cell.heuristic);
    if (path) {
        path.shift();
    }
    return path; 
}

function updateCellSets(seenCells, location, pathGrid, revealedGrid) {
    const visibleCells = pathGrid.getVisible(location.x, location.y);
    const changedCells = revealedGrid.copyCells(visibleCells);

    for (const cell of visibleCells) {
        seenCells.add(cell);
    }

    return {visibleCells, changedCells};
}


class A_store extends ReduceStore {
    constructor() {
        super(Dispatcher);
    }

    getInitialState() {
        return {
            pathGrid: new Grid(SIZE, SIZE),
            stage: 'STARTP',
            player: {x: -1, y: -1},
            end: {x: -2, y: -2},
        };
    }

    reduce(state, action) {
        switch (action.type) {
            case ActionTypes.STARTP: {
                return {...state, player: {x: action.x, y: action.y}, stage: 'ENDP'};
            }

            case ActionTypes.ENDP: {
                const {player} = state;
                if (player.x === action.x && player.y === action.y) {
                    return {...state, stage: 'ENDP'};
                }
                return {...state, end: {x: action.x, y: action.y}, stage: 'WALL'};
            }

            case ActionTypes.WALL: {
                const {player, end} = state;
                const {x, y} = action;
                const pathGrid = state.pathGrid.clone();
                const cell = pathGrid.getCell(x, y);
                if (x === player.x && y === player.y) return state;
                if (x === end.x && y === end.y) return state;
                if (cell.terrain === Cell.Terrain.WALL) {
                    cell.terrain = Cell.Terrain.MOUNTAIN;
                } else if (cell.terrain === Cell.Terrain.MOUNTAIN) {
                    cell.terrain = Cell.Terrain.NORMAL;
                } else {
                    cell.terrain = Cell.Terrain.WALL;
                }
                return {...state, pathGrid};
            }

            case ActionTypes.GENERATE: {
                const {player, end} = state;
                const pathGrid = mapGenerator(player, end, state.pathGrid);
                return {...state, pathGrid};
            }
            
            case ActionTypes.PATHFIND: {
                const {pathGrid, player, end} = state;
                const path = pathfind(player, end, pathGrid);
                if (path) {
                    return {...state, path, stage: 'STEP'};
                }

                return {...state, stage: 'RESET_FAIL'};
            }

            case ActionTypes.RESET: {
                return {
                    pathGrid: new Grid(SIZE, SIZE), 
                    player: {x: -1, y: -1},
                    end: {x: -2, y: -2}, 
                    stage: 'STARTP', 
                    path: null, 
                    visibleCells: null, 
                    seenCells: null,
                    dsl: null,
                };
            }

            case ActionTypes.RESET_FAIL: {
                return {
                    pathGrid: new Grid(SIZE, SIZE), 
                    player: {x: -1, y: -1},
                    end: {x: -2, y: -2}, 
                    stage: 'STARTP', 
                    path: null, 
                    visibleCells: null, 
                    seenCells: null,
                    dsl: null,
                };
            }

            case ActionTypes.STEP: {
                const [nextLocation, ...path] = state.path;

                const stage = path.length > 0 ? 'STEP' : 'RESET';
                return {
                    ...state, 
                    stage, 
                    path, 
                    player: {x: nextLocation.x, y: nextLocation.y}
                };
            }

            case ActionTypes.GENERATE_FOG: {
                const {player, end} = state;
                let {pathGrid} = state;
                const revealedGrid = mapGenerator(player, end, pathGrid);
                pathGrid = new Grid(SIZE, SIZE);
                const seenCells = new Set();

                const {visibleCells} = updateCellSets(seenCells, player, pathGrid, revealedGrid);

                return {
                    ...state, 
                    pathGrid, 
                    revealedGrid,
                    stage: 'SELECT_ALGORITHM', 
                    visibleCells, 
                    seenCells
                };
            }

            case ActionTypes.STEP_FOG: {
                const {revealedGrid, end, seenCells, player} = state;
                let {pathGrid} = state;
                let path = pathfind(player, end, pathGrid);
                if (!path) {
                    return {...state, stage: 'RESET_FAIL'};
                }

                let nextLocation = path.shift();
                let stage;
                let visibleCells;

                if (path.length > 0) {
                    stage = 'STEP_FOG';

                    ({visibleCells} = updateCellSets(seenCells, nextLocation, pathGrid, revealedGrid));
                    path = pathfind(nextLocation, end, pathGrid);
                } else {
                    stage = 'RESET';
                    pathGrid = revealedGrid;
                }

                return {
                    ...state, 
                    stage, 
                    path, 
                    player: {x: nextLocation.x, y: nextLocation.y}, 
                    pathGrid, 
                    visibleCells, 
                    seenCells
                }
            }

            case ActionTypes.DSTARLITE: {
                const {player, end, pathGrid} = state;
                const start = pathGrid.getCell(player.x, player.y);
                const goal = pathGrid.getCell(end.x, end.y);
                const dsl = new Dstarlite(start, goal, Cell.heuristic);
                dsl.beginPathfinding();

                return {...state, dsl, stage: 'DSTAR_STEP'};
            }

            case ActionTypes.DSTAR_STEP: {
                const {dsl, seenCells, revealedGrid, end} = state;
                const nextLocation = dsl.nextStep();
                if (!nextLocation) {
                    return {...state, stage: 'RESET_FAIL'};
                }

                let {pathGrid} = state;
                let stage;
                let visibleCells;
                let changedCells;

                if ((nextLocation.x === end.x && nextLocation.y === end.y) || nextLocation === null) {
                    stage = 'RESET';
                    pathGrid = revealedGrid;
                } else {
                    stage = 'DSTAR_STEP';

                    ({visibleCells, changedCells} = updateCellSets(seenCells, nextLocation, pathGrid, revealedGrid));
                    if (changedCells.size >= 1) {
                        dsl.updateCost(changedCells);
                    }
                }

                return {
                    ...state,
                    stage,
                    player: {x: nextLocation.x, y: nextLocation.y},
                    pathGrid,
                    visibleCells,
                    seenCells,
                    dsl,
                }
            }

            default: {
                return state;
            }
        }
    }
}

export default new A_store();