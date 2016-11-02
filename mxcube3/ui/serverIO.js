import io from 'socket.io-client';
import { addLogRecord } from './actions/logger';
import {
  updatePointsPosition,
  saveMotorPositions,
  setCurrentPhase,
  setBeamInfo,
  startClickCentring,
} from './actions/sampleview';
import { setBeamlineAttrAction } from './actions/beamline';
import { setStatus,
         addTaskResultAction,
         addTaskAction,
         setCurrentSample,
         sendStopQueue,
         collapseTask } from './actions/queue';
import { setLoading } from './actions/general';


class ServerIO {

  constructor() {
    this.hwrSocket = null;
    this.loggingSocket = null;
    this.uiStateSocket = null;

    this.uiStorage = {
      setItem: (key, value) => {
        this.uiStateSocket.emit('ui_state_set', [key, value]);
      },
      getItem: (key, cb) => {
        this.uiStateSocket.emit('ui_state_get', key, (value) => { cb(false, value); });
      },
      removeItem: (key) => {
        this.uiStateSocket.emit('ui_state_rm', key);
      },
      getAllKeys: (cb) => {
        this.uiStateSocket.emit('ui_state_getkeys', null, (value) => { cb(false, value); });
      }
    };
  }

  connectStateSocket(statePersistor) {
    this.uiStateSocket = io.connect(`http://${document.domain}:${location.port}/ui_state`);

    this.uiStateSocket.on('state_update', (newState) => {
      statePersistor.rehydrate(JSON.parse(newState));
    });
  }

  setRemoteAccessMaster(cb) {
    this.hwrSocket.emit('setRaMaster', cb);
  }

  listen(store) {
    this.hwrSocket = io.connect(`http://${document.domain}:${location.port}/hwr`);

    this.loggingSocket = io.connect(`http://${document.domain}:${location.port}/logging`);

    this.loggingSocket.on('log_record', (record) => {
      store.dispatch(addLogRecord(record));
    });

    this.hwrSocket.on('Motors', (record) => {
      store.dispatch(updatePointsPosition(record.CentredPositions));
      store.dispatch(saveMotorPositions(record.Motors));
      switch (record.Signal) {
        case 'minidiffPhaseChanged':
          store.dispatch(setCurrentPhase(record.Data));
          break;
        default:
      }
    });

    this.hwrSocket.on('beam_changed', (record) => {
      store.dispatch(setBeamInfo(record.Data));
    });

    this.hwrSocket.on('beamline_value_change', (data) => {
      store.dispatch(setBeamlineAttrAction(data));
    });

    this.hwrSocket.on('task', (record, callback) => {
      if (callback) {
        callback();
      }

      const sampleDisplayData = store.getState().queue.displayData[record.sample];
      const taskCollapsed = sampleDisplayData.tasks[record.taskIndex].collapsed;

      if (record.state === 1 && !taskCollapsed) {
        store.dispatch(collapseTask(record.sample, record.taskIndex));
      } else if (record.state === 2 && taskCollapsed) {
        store.dispatch(collapseTask(record.sample, record.taskIndex));
      }
      store.dispatch(addTaskResultAction(record.sample, record.taskIndex, record.state,
                                        record.progress, record.taskLimsID));
    });

    this.hwrSocket.on('add_task', (record, callback) => {
      if (callback) {
        callback();
      }

      store.dispatch(addTaskAction(record));
    });

    this.hwrSocket.on('queue', (record, callback) => {
      if (callback) {
        callback();
      }

      store.dispatch(setStatus(record.Signal));
    });

    this.hwrSocket.on('sc', (record) => {
      store.dispatch(setLoading((record.signal === 'loadingSample' ||
                                record.signal === 'loadedSample'),
                               'Loading sample',
                               record.message, true, () => (store.dispatch(sendStopQueue()))));

      if (record.signal === 'loadReady') {
        store.dispatch(setCurrentSample(record.location));
      }
    });

    this.hwrSocket.on('sample_centring', (record) => {
      store.dispatch(setLoading(record.signal === 'SampleCentringRequest',
                              'Center sample',
                               record.message, false));
      store.dispatch(startClickCentring());
    });
  }
}

export const serverIO = new ServerIO();

