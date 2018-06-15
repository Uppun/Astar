import ActionTypes from './ActionTypes';
import Dispatcher from '../Dispatcher';

export default {
    start(x, y) {
        Dispatcher.dispatch({
            type: ActionTypes.STARTP,
            x,
            y,
        });
    },

    end(x, y) {
        Dispatcher.dispatch({
            type: ActionTypes.ENDP,
            x,
            y,
        });
    },

    pass(x, y) {
        Dispatcher.dispatch({
            type: ActionTypes.PASS,
            x,
            y,
        });
    },

    pathfind() {
        Dispatcher.dispatch({
            type: ActionTypes.PATHFIND,
        });
    },

    reset() {
        Dispatcher.dispatch({
            type: ActionTypes.RESET,
        });
    },

    step() {
        Dispatcher.dispatch({
            type: ActionTypes.STEP,
        });
    },
}