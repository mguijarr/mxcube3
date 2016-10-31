from flask import request
from flask.ext.socketio import emit, join_room, leave_room
from mxcube3 import socketio
import functools
import json
import uuid
from collections import OrderedDict

MASTER = None
SOCKETIO_MASTER_ID = None
UI_STATE = dict()
PENDING_EVENTS = OrderedDict()

def set_master(master_sid):
    global MASTER
    MASTER = master_sid

def is_master(sid):
    return MASTER == sid

def flush():
    global UI_STATE
    global MASTER
    global PENDING_EVENTS
    UI_STATE = dict()
    MASTER = None
    PENDING_EVENTS = OrderedDict()

def emit_pending_events():
    print 'PENDING EVENTS', PENDING_EVENTS
    for key, event_data in PENDING_EVENTS.items():
        event, json_dict, kwargs = event_data
        kwargs['key'] = key
        safe_emit_to_master(event, json_dict, **kwargs)

def _event_callback(event_key, event, json_dict, kwargs):
    print event_key, 'RECEIVED OK'
    PENDING_EVENTS.pop(event_key, None)

def safe_emit_to_master(event, json_dict, **kwargs):
    event_key = kwargs.pop('key', uuid.uuid4())
    kwargs_copy = dict(kwargs)
    kwargs['callback'] = functools.partial(_event_callback, event_key, event, json_dict, kwargs_copy)
    kwargs['room'] = SOCKETIO_MASTER_ID
    PENDING_EVENTS[event_key] = (event, json_dict, kwargs_copy)
    print 'EMITTING', event, json_dict, kwargs
    socketio.emit(event, json_dict, **kwargs)

@socketio.on('connect', namespace='/ui_state')
def connect():
    pass

@socketio.on('disconnect', namespace='/ui_state')
def disconnect():
    pass

@socketio.on('ui_state_get', namespace='/ui_state')
def ui_state_get(k):
    k = k.replace("reduxPersist:", "")
    #print 'ui state GET',k,'returning:',STATE[k]
    return json.dumps(UI_STATE[k])

@socketio.on('ui_state_rm', namespace='/ui_state')
def ui_state_rm(k):
    k = k.replace("reduxPersist:", "")
    print 'ui state REMOVE',k
    del UI_STATE[k]

@socketio.on('ui_state_set', namespace='/ui_state')
def ui_state_update(key_val):
    print request.sid, 'leaving slaves room'
    leave_room('raSlaves')

    key, val = key_val
    print 'ui state SET', key
    UI_STATE[key.replace("reduxPersist:", "")] = json.loads(val)
    #print ' '*10,json.loads(val)

    emit("state_update", json.dumps(UI_STATE), namespace="/ui_state", room="raSlaves")

@socketio.on('ui_state_getkeys', namespace='/ui_state')
def ui_state_getkeys(*args):
    print request.sid,'entering slaves room'
    join_room("raSlaves")

    return ['reduxPersist:'+k for k in UI_STATE.iterkeys()]

