import fetch from 'isomorphic-fetch';
import { sendClearQueue } from './queue';
import { setLoading, showErrorPanel } from './general';

export function setSampleList(sampleList) {
  return { type: 'SET_SAMPLE_LIST', sampleList };
}

export function setManualMount(manual) {
  return function (dispatch) {
    dispatch({ type:'SET_MANUAL_MOUNT', manual });
    if (manual) {
      dispatch(sendClearQueue());
      dispatch(setSampleList({ "Manual": { code: "Manual", "defaultPrefix": "", "location":"Manual", sampleID:"1", sampleName:"", "type":"Sample" } }));
    }
  }
}

export function sendGetSampleList() {
  return function (dispatch) {
    dispatch(setLoading(true, 'Please wait', 'Retrieving sample changer contents', true));
    fetch('mxcube/api/v0.1/sample_changer/samples_list', { credentials: 'include' })
                        .then(response => response.json())
                        .then(json => {
                          dispatch(setLoading(false));
                          dispatch(setSampleList(json));
                        }, () => {
                          dispatch(setLoading(false));
                          dispatch(showErrorPanel(true, 'Could not get samples list'));
                        });
  };
}


export function selectAction(keys, selected = true) {
  return { type: 'SELECT_SAMPLES', keys, selected };
}


export function toggleSelectedAction(sampleID) {
  return { type: 'TOGGLE_SELECTED_SAMPLE', sampleID };
}


export function filterAction(filterText) {
  return { type: 'FILTER_SAMPLE_LIST', filterText };
}


export function setSamplesInfoAction(sampleInfoList) {
  return { type: 'SET_SAMPLES_INFO', sampleInfoList };
}


export function sendSyncSamples(proposalId) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/samples/${proposalId}`, { credentials: 'include' })
            .then(response => response.json())
            .then(json => {
              dispatch(setSamplesInfoAction(json.samples_info));
            });
  };
}


export function toggleMovableAction(key) {
  return { type: 'TOGGLE_MOVABLE_SAMPLE', key };
}


export function showSampleGridContextMenu(x, y, show) {
  return { type: 'SAMPLE_GRID_CONTEXT_MENU', x, y, show };
}

