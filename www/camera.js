/*
 * Camera.js
 * Copyright 2015, ezAR Technologies
 * Licensed under a modified MIT license, see LICENSE or http://ezartech.com/ezarstartupkit-license
 *
 * @file Implements the ezar camera api for controlling device cameras and zoom level. 
 * @author @wayne_parrott, @vridosh, @kwparrott
 * @version 0.1.0 
 */

var exec = require('cordova/exec'),
    utils = require('cordova/utils');

/**
 * Manages a mobile device camera
 * @class
 * 
 * Created by ezar during initialization. Do not use directly.
 * 
 * @param {ezAR} ezar  protected 
 * @param {string} id  unique camera id assigned by the device os
 * @param {string} position  side of the device the camera resides, BACK
 * 			faces away from the user, FRONT faces the user
 * @param {boolean} hasZoom  true if the camera's magnification can be changed
 * @param {float} zoom  current magnification level of the camera up 
 * 			to the maxZoom
 */
var Camera = function(ezar,id,position,hasZoom,maxZoom,zoom) {
	var _ezar,
        _self,
	    _id,
		_position,
		_viewport, //not used
		_hasZoom,
		_maxZoom,
		_zoom,
        _androidZoomScale;
		//_state = Camera.State.STOPPED,
    
    _self = this;
	_ezar = ezar;
    _id = id;
    _position = position;
    _hasZoom = hasZoom;
    _maxZoom = maxZoom;
    _zoom = zoom;
    _androidZoomScale = 0.0;
	    
     //normalize android zoom vals [0-99] to [1.0-normalizedMaxZoom]
     if (_hasZoom && cordova.platformId == "android") {        
         _maxZoom = Math.max(1.0,  (_maxZoom - 9) / 10.0);
         _zoom = Math.max(1.0, zoom * 10.0 - 9);
     }
     
    /**
     * @return {boolean} Test if this camera is currently running.
     */
    this.isActive = function() {
        return _ezar.hasActiveCamera() && _ezar.getActiveCamera() === _self;
    }
        
    /**
     * Camera's unique id assigned by the device.
     * @return {string} 
     */
	this.getId = function() {
		return _id;
	};
	
	/**
	 * The side of the device on which the camera resides
	 * 		BACK is the side of the device facing away from the user,
	 *      FRONT is the side of the device facing the user.
	 *  @return {string}
	 */
	this.getPosition = function() {
		return _position;
	};
	
	/**
	 * Camera supports magnification.
	 * @return {boolean} true indicates the camera supports zooming; otherwise return false.
	 */
	this.hasZoom = function() {
		return _hasZoom;
	};
	
    /**
	 * Maximum magnification level
	 * @return {float} a value between 1.0 and maxZoom
	 */
	this.getMaxZoom = function() {
		return _maxZoom;
	};
    
	/**
	 * Current magnification level
	 * @return {float} a value between 1.0 and maxZoom
	 */
	this.getZoom = function() {
		return _zoom;
	};
	
	/**
	 * Increase or decrease magnification
	 * @param {float} zoom new magnification level, must be between 1.0 and maxZoom 
	 * @param {function} [successCB] function called on success
	 * @param {function} [errorCB] function with error data parameter called on error
	 */
	this.setZoom = function(zoom, successCallback,errorCallback) {
	   var zooom = Math.max(1.0,zoom);
       var normalizedZoom = zooom;
       if (_hasZoom && cordova.platformId == "android") {
           normalizedZoom = Math.max(0, zooom * 10.0 - 9);           
        }
     
        if (_self.isActive() && _self.isRunning()) {
            exec(function(data) {
                   _zoom = zooom;
                    if (isFunction(successCallback)) {
                        successCallback(data);
                    }
                },
                function(error) {
                    if (isFunction(errorCallback)) {
                        errorCallback(error);
                    }
                },                 
                 "videoOverlay",
                 "setZoom",
                 [normalizedZoom]);
        }
	};

	/**
	 * Start video capture and presentation. This camera is the ezar#activeCamera
	 * @param {function} [successCB] function called on success
	 * @param {function} [errorCB] function with error data parameter called on error
	 */
	this.start = function(successCallback,errorCallback) {
        if (!_self.isStopped()) return;
        
        exec(function(data) {
                _ezar._activateCamera(_self);
                if (isFunction(successCallback)) {
                    successCallback(data);
                }
             },
             function(error) {
            	 if (isFunction(errorCallback)) {
            		 errorCallback(error);
            	 }
             },
             "videoOverlay",
             "startCamera",
             [_self.getPosition(),
              _self.hasZoom() ? _self.getZoom() : 0]);
    };
    
	/**
	 * Stop video capture and presentation. Update ezar#activeCamera to be null
	 * @param {function} [successCB] function called on success
	 * @param {function} [errorCB] function with error data parameter called on error
	 */    
    this.stop = function(successCallback,errorCallback) {
        if (!_self.isRunning()) return;
        
        exec(function(data) {
                _ezar._deactivateCamera(_self);
                if (successCallback) {
                    successCallback(data);
                }
             },
             function(error) {
                if (errorCallback) {
                    errorCallback(error);
                }
             },
             "videoOverlay",
             "stopCamera",
             []);
    };
    
    /**
     * Check if camera is running.
     * @return {boolean} 
     */
    this.isRunning = function() {
        return _self.isActive();
    };
    
    /**
     * Check if camera is stopped.
     * @return {boolean} 
     */
    this.isStopped = function() {
        return !_self.isRunning();
    };
    
}

function isFunction(f) {
    return typeof f == "function";
}

module.exports = Camera;