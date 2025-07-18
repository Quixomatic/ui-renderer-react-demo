import { isFunction } from "lodash";
import { SN_RECORD_CHOICE } from "./constants";

export default [
  {
    events: ['click'],
    effect: ({
      action: {
        payload: {
          event
        }
      },
      properties: { onClick }
    }) => {
      if (isFunction(onClick)) {
        onClick(event);
      }
    }
  },
  {
    events: ['blur'],
    effect: ({
      action: {
        payload: {
          event
        }
      },
      properties: { onBlur },
      dispatch
    }) => {
      dispatch(SN_RECORD_CHOICE.FOCUS_SET, { value: false });
      if (isFunction(onBlur)) {
        onBlur(event);
      }
    }
  },
  {
    events: ['focus'],
    effect: ({
      action: {
        payload: {
          event
        }
      },
      properties: { onFocus },
      dispatch
    }) => {
      dispatch(SN_RECORD_CHOICE.FOCUS_SET, { value: true });
      if (isFunction(onFocus)) {
        onFocus(event);
      }
    }
  },
  {
    events: ['keydown'],
    effect: ({
      action: {
        payload: {
          event
        }
      },
      properties: { onKeyDown }
    }) => {
      if (isFunction(onKeyDown)) {
        onKeyDown(event);
      }
    }
  },
  {
    events: ['keyup'],
    effect: ({
      action: {
        payload: {
          event
        }
      },
      properties: { onKeyUp }
    }) => {
      if (isFunction(onKeyUp)) {
        onKeyUp(event);
      }
    }
  },
]