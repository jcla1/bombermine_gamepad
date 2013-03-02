(function(){
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}

var gamepadSupport = {
  // A number of typical buttons recognized by Gamepad API and mapped to
  // standard controls. Any extraneous buttons will have larger indexes.
  TYPICAL_BUTTON_COUNT: 16,

  // A number of typical axes recognized by Gamepad API and mapped to
  // standard controls. Any extraneous buttons will have larger indexes.
  TYPICAL_AXIS_COUNT: 4,

  // Whether we’re requestAnimationFrameing like it’s 1999.
  ticking: false,

  gamepad: null,

  oldPad: null,

  // Previous timestamps for gamepad state; used in Chrome to not bother with
  // analyzing the polled data if nothing changed (timestamp is the same
  // as last time).
  prevTimestamp: 0,

  /**
   * Initialize support for Gamepad API.
   */
  init: function() {
    var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;

    if (!gamepadSupportAvailable) {
      // It doesn’t seem Gamepad API is available – show a message telling
      // the visitor about it.
      alert('No gamepad support!')
    } else {
      gamepadSupport.startPolling();
    }
  },

  /**
   * Starts a polling loop to check for gamepad state.
   */
  startPolling: function() {
    // Don’t accidentally start a second loop, man.
    if (!gamepadSupport.ticking) {
      gamepadSupport.ticking = true;
      gamepadSupport.tick();
    }
  },

  /**
   * Stops a polling loop by setting a flag which will prevent the next
   * requestAnimationFrame() from being scheduled.
   */
  stopPolling: function() {
    gamepadSupport.ticking = false;
  },

  /**
   * A function called with each requestAnimationFrame(). Polls the gamepad
   * status and schedules another poll.
   */
  tick: function() {
    gamepadSupport.pollStatus();
    gamepadSupport.scheduleNextTick();
  },

  scheduleNextTick: function() {
    // Only schedule the next frame if we haven’t decided to stop via
    // stopPolling() before.
    if (gamepadSupport.ticking) {
      requestAnimFrame(gamepadSupport.tick);
    }
  },

  /**
   * Checks for the gamepad status. Monitors the necessary data and notices
   * the differences from previous state (buttons for Chrome/Firefox,
   * new connects/disconnects for Chrome). If differences are noticed, asks
   * to update the display accordingly. Should run as close to 60 frames per
   * second as possible.
   */
  pollStatus: function() {
    // Poll to see if gamepads are connected or disconnected. Necessary
    // only on Chrome.
    gamepadSupport.oldPad = deepCopy(gamepadSupport.gamepad);
    gamepadSupport.pollGamepad();

    var gamepad = gamepadSupport.gamepad;

    if (gamepad) {
      // Don’t do anything if the current timestamp is the same as previous
      // one, which means that the state of the gamepad hasn’t changed.
      // This is only supported by Chrome right now, so the first check
      // makes sure we’re not doing anything if the timestamps are empty
      // or undefined.
      if (gamepad.timestamp && (gamepad.timestamp == gamepadSupport.prevTimestamp)) {
        return;
      }

      gamepadSupport.prevTimestamp = gamepad.timestamp;

      if (gamepadSupport.oldPad.constructor == Object) gamepadSupport.updateDisplay();
    }
  },

  // This function is called only on Chrome, which does not yet support
  // connection/disconnection events, but requires you to monitor
  // an array for changes.
  pollGamepad: function() {
    var rawGamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads());

    if (rawGamepads && rawGamepads[0]) {
      gamepadSupport.gamepad = rawGamepads[0];
    }
  },


  ANALOGUE_BUTTON_THRESHOLD: .5,
  AXIS_THRESHOLD: .3,

  buttonPressed_: function(pad, buttonId) {
    return pad.buttons[buttonId] &&
          (pad.buttons[buttonId] > gamepadSupport.ANALOGUE_BUTTON_THRESHOLD);
  },

  stickMoved_: function(pad, axisId, negativeDirection) {
    if (typeof pad.axes[axisId] == 'undefined') {
      return false;
    } else if (negativeDirection) {
      return pad.axes[axisId] < -gamepadSupport.AXIS_THRESHOLD;
    } else {
      return pad.axes[axisId] > gamepadSupport.AXIS_THRESHOLD;
    }
  },

  // Call the tester with new state and ask it to update the visual
  // representation of a given gamepad.
  updateDisplay: function() {
    var pad = gamepadSupport.gamepad;
    var oldPad = gamepadSupport.oldPad;

    if (!oldPad.buttons) return;

    // Drop the bomb!
    if (gamepadSupport.buttonPressed_(pad, 0) != gamepadSupport.buttonPressed_(oldPad, 0)) { // Button has been used
      if (gamepadSupport.buttonPressed_(pad, 0)) {
        dropBomb();
      }
    }

    // Detonate
    if (gamepadSupport.buttonPressed_(pad, 2) != gamepadSupport.buttonPressed_(oldPad, 2)) { // Button has been used
      if (gamepadSupport.buttonPressed_(pad, 2)) {
        detonate();
      }
    }

    // Pause
    if (gamepadSupport.buttonPressed_(pad, 3) != gamepadSupport.buttonPressed_(oldPad, 3)) { // Button has been used
      if (gamepadSupport.buttonPressed_(pad, 3)) {
        pause();
      }
    }

    // Stats
    if (gamepadSupport.buttonPressed_(pad, 8) != gamepadSupport.buttonPressed_(oldPad, 8)) { // Button has been used
      if (gamepadSupport.buttonPressed_(pad, 8)) {
        showStats();
      }
    }

    // Zoom
    if (gamepadSupport.buttonPressed_(pad, 1) != gamepadSupport.buttonPressed_(oldPad, 1)) { // Button has been used
      if (gamepadSupport.buttonPressed_(pad, 1)) {
        zoomOutDown();
      } else {
        zoomOutUp();
      }
    }


    // Move down
    if (gamepadSupport.stickMoved_(pad, 1, false) != gamepadSupport.stickMoved_(oldPad, 1, false)) {
      if (gamepadSupport.stickMoved_(pad, 1, false)) {
        keyDownDown();
      } else {
        keyUpDown();
      }
    }

    // Move up
    if (gamepadSupport.stickMoved_(pad, 1, true) != gamepadSupport.stickMoved_(oldPad, 1, true)) {
      if (gamepadSupport.stickMoved_(pad, 1, true)) {
        keyDownForward();
      } else {
        keyUpForward();
      }
    }

    // Move right
    if (gamepadSupport.stickMoved_(pad, 0, false) != gamepadSupport.stickMoved_(oldPad, 0, false)) {
      if (gamepadSupport.stickMoved_(pad, 0, false)) {
        keyDownRight();
      } else {
        keyUpRight();
      }
    }


    // Move left
    if (gamepadSupport.stickMoved_(pad, 0, true) != gamepadSupport.stickMoved_(oldPad, 0, true)) {
      if (gamepadSupport.stickMoved_(pad, 0, true)) {
        keyDownLeft();
      } else {
        keyUpLeft();
      }
    }

  }
};

function dropBomb() {
  appInputBomb();
}

function detonate() {
  appInputDetonation();
}

function showStats() {
  appInputTab();
}

function pause() {
  appInputPause();
}

function zoomOutDown() {
  keyDown(16)
}
function zoomOutUp() {
  keyUp(16)
}

function keyDownForward() {
  keyDown(2);
}
function keyUpForward() {
  keyUp(2);
}

function keyDownRight() {
  keyDown(1);
}
function keyUpRight() {
  keyUp(1);
}

function keyDownLeft() {
  keyDown(4);
}
function keyUpLeft() {
  keyUp(4);
}

function keyDownDown() {
  keyDown(8);
}
function keyUpDown() {
  keyUp(8);
}

gamepadSupport.init();
})();