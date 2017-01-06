/**
*  Initial redux state for SampleGrid,
*
*  selected:   Object (key, selected), selected indicating if sample with key
*              currently is selected
*
*  order:      Map (key, order) for each sample. The order map is kept sorted
*              (ascending)
*
*  moving:     Object (key, moving), moving indicating if sample with key is
*              currently beeing moved
*
*  filterText: Current filter text
*/
const INITIAL_STATE = { selected: {},
                        sampleList: {},
                        order: [],
                        moving: {},
                        contextMenu: {},
                        filterText: '',
                        manualMount: false };


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_MANUAL_MOUNT': {
      return Object.assign({}, state, { manualMount: action.manual });
    }
    // Set the list of samples (sampleList), clearing any existing list
    case 'SET_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: action.sampleList, order: action.order });
    }
    case 'ADD_SAMPLES_TO_LIST': {
      const sampleList = { ...state.sampleList };
      const order = [...state.order];

      action.samplesData.forEach((sampleData) => {
        sampleList[sampleData.sampleID] = sampleData; order.push(sampleData.sampleID);
      });

      return Object.assign({}, state, { sampleList, order });
    }
    case 'SET_SAMPLES_INFO': {
      const sampleList = {};
      Object.keys(state.sampleList).forEach(key => {
        const sample = state.sampleList[key];
        let sampleInfo;
        for (sampleInfo of action.sampleInfoList) {
          if (sampleInfo.code) {
            // find sample with data matrix code
            if (sample.code === sampleInfo.code) {
              sampleList[key] = Object.assign({}, sample, { ...sampleInfo });
              break;
            }
          } else {
            // check with sample changer location
            const containerLocation = sampleInfo.containerSampleChangerLocation;
            const sampleLocation = sampleInfo.sampleLocation;
            const limsLocation = `${containerLocation}:${sampleLocation}`;

            if (sample.location === limsLocation) {
              sampleList[key] = Object.assign({}, sample, { ...sampleInfo });
              break;
            }
          }
        }
        if (sampleList[key] === undefined) {
          sampleList[key] = Object.assign({}, sample, { });
        }
      });
      return Object.assign({}, state, { sampleList });
    }
    // Toggles a samples movable flag
    case 'TOGGLE_MOVABLE_SAMPLE': {
      const moving = {};
      moving[action.key] = (!state.moving[action.key]);
      return Object.assign({}, state, { moving });
    }
    // Select a range of samples
    case 'SELECT_SAMPLES': {
      const selectedItems = {};
      const movingItems = {};

      for (const key of action.keys) {
        selectedItems[key] = action.selected;
        movingItems[action.key] = (state.moving[action.key] && state.selected[action.key]);
      }

      return Object.assign({}, state, { selected: selectedItems, moving: movingItems });
    }
    case 'TOGGLE_SELECTED_SAMPLE': {
      const selected = Object.assign({}, state.selected);
      selected[action.sampleID] = (!state.selected[action.sampleID]);
      return Object.assign({}, state, { selected });
    }
    case 'SAMPLE_GRID_CONTEXT_MENU': {
      return Object.assign({}, state, { contextMenu: { x: action.x,
                                                       y: action.y,
                                                       show: action.show } });
    }
    case 'FILTER_SAMPLE_LIST': {
      return Object.assign({}, state, { filterText: action.filterText });
    }
    case 'SET_INITIAL_STATUS': {
      return { ...state };
    }
    default: {
      return state;
    }
  }
};
