from flask import request
from flask.ext.socketio import emit
from mxcube3 import socketio
import functools
import uuid
#from collections import OrderedDict
from collections import deque

MASTER = None
MASTER_ROOM = None
PENDING_EVENTS = deque()

def set_master(master_sid):
    global MASTER
    MASTER = master_sid

def is_master(sid):
    return MASTER == sid

def flush():
    global MASTER
    global PENDING_EVENTS
    MASTER = None
    PENDING_EVENTS = OrderedDict()

def _event_callback(event):
    print event, 'RECEIVED OK'
    PENDING_EVENTS.popleft()
    # emit next pending event, if any
    emit_pending_events()

def emit_pending_events():
    print 'pending events=',PENDING_EVENTS
    try:
        event, json_dict, kwargs = PENDING_EVENTS[0] 
    except IndexError:
        pass
    else:
        return _emit(event, json_dict, **kwargs)

def _emit(event, json_dict, **kwargs):
    kw = dict(kwargs)
    kw['callback'] = functools.partial(_event_callback, event)
    kw['room'] = MASTER_ROOM
    print 'EMITTING', event, json_dict, kw
    socketio.emit(event, json_dict, **kw)

def safe_emit(event, json_dict, **kwargs):
    PENDING_EVENTS.append((event, json_dict, kwargs))
    _emit(event, json_dict, **kwargs)

@socketio.on("setRaMaster", namespace="/hwr")
def set_master_id():
    global MASTER_ROOM
    print 'SETTING MASTER ROOM TO',request.sid
    MASTER_ROOM = request.sid
    emit_pending_events()
 
