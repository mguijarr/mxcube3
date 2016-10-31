import fetch from 'isomorphic-fetch';
import io from 'socket.io-client';

export function setMaster(master) {
  if (master) {
    return function (dispatch) {
       window.hwrSocket.emit("setRaMaster", () => {
         dispatch({ type: 'SET_MASTER', master });
       });
    } 
  } else {
    return { type: 'SET_MASTER', master };
  }
}

