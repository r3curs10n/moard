(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.app = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var canvas = document.getElementById('main');
var isDrawing = false;
var points = [];
var ox = 0;
var oy = 0;
var scale = 1;
if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    // draw(ctx);
}
else {
    // canvas-unsupported code here
}
canvas.addEventListener('mousedown', function (e) {
    isDrawing = true;
    points = [{ x: e.offsetX, y: e.offsetY }];
});
canvas.addEventListener('mouseup', function (e) {
    isDrawing = false;
});
canvas.addEventListener('mousemove', function (e) {
    if (isDrawing === true) {
        points.push({ x: e.offsetX, y: e.offsetY });
        draw(ctx, points);
    }
});
function draw(ctx, points) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(200,0,0)';
    ctx.fillRect(10, 10, 50, 50);
    var pts = points.map(function (p) {
        return { x: p.x * scale, y: p.y * scale };
    });
    ctx.beginPath();
    for (var i = 0; i < pts.length - 2; i++) {
        var m1x = Math.floor((pts[i].x + pts[i + 1].x) / 2);
        var m1y = Math.floor((pts[i].y + pts[i + 1].y) / 2);
        var m2x = Math.floor((pts[i + 1].x + pts[i + 2].x) / 2);
        var m2y = Math.floor((pts[i + 1].y + pts[i + 2].y) / 2);
        ctx.moveTo(ox + m1x, oy + m1y);
        ctx.quadraticCurveTo(ox + pts[i + 1].x, oy + pts[i + 1].y, ox + m2x, oy + m2y);
    }
    ctx.stroke();
}
function redraw() {
    draw(ctx, points);
}
function setScale(s) {
    scale = s;
}
module.exports = {
    setScale: setScale,
    redraw: redraw
};

},{}]},{},[1])(1)
});
