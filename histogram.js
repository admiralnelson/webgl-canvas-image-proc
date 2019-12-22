"use strict";

var canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 120;
var m4 = twgl.m4;
var gl = canvas.getContext("webgl");
var ext = gl.getExtension("OES_texture_float");
if (!ext) {
   alert("requires OES_texture_float");
}

twgl.createTexture(gl, {
  //src: "https://i.imgur.com/9Y3sd8S.png",
  src: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Landesmuseum_Z%C3%BCrich_2010-09-20_14-38-14_ShiftN.jpg",//"https://i.ibb.co/gV91h80/exp-2.png", //"https://i.ibb.co/23cVt8H/exp-3.png", //
  // required link: https://www.flickr.com/photos/greggman/18414763798/in/album-72157653822314919/
  min: gl.NEAREST,
  mag: gl.NEAREST,
  wrap: gl.CLAMP_TO_EDGE,
  crossOrigin: "",
}, function(err, tex, img) {
  log("img");
  document.body.appendChild(img);
  log("histogram");
  document.body.appendChild(canvas);

  var quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
  var histProgramInfo = twgl.createProgramInfo(gl, ["hist-vs", "hist-fs"]);
  var pixelIds = [];
  var numIds = img.width * img.height;
  var t1 = 0, t2 = 0

  // Just fill a buffer with an incrementing count. If we wanted to make this
  // generic we'd re-use this buffer and just make it bigger if we were
  // processing a bigger image
  t1 = performance.now();
  for (var i = 0; i < numIds; ++i) {
    pixelIds.push(i);
  }
  var pixelIdBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    pixelId: { size: 1, data: new Float32Array(pixelIds), },
  });

  // make a 256x1 RGBA floating point texture and attach to a framebuffer
  var sumFbi = twgl.createFramebufferInfo(gl, [
    { type: gl.FLOAT,
      min: gl.NEAREST,
      mag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
    },
  ], 256, 1);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    alert("can't render to floating point texture");
  }

  // Render sum of each color

  // we're going to render a gl.POINT for each pixel in the source image
  // That point will be positioned based on the color of the source image
  // we're just going to render vec4(1,1,1,1). This blend function will
  // mean each time we render to a specific point that point will get
  // incremented by 1.
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.enable(gl.BLEND);
  gl.useProgram(histProgramInfo.program);
  twgl.setBuffersAndAttributes(gl, histProgramInfo, pixelIdBufferInfo);
  twgl.bindFramebufferInfo(gl, sumFbi);
  // render each channel separately since we can only position each POINT
  // for one channel at a time.
  for (var channel = 0; channel < 4; ++channel) {
    gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
    twgl.setUniforms(histProgramInfo, {
      u_texture: tex,
      u_colorMult: [
        channel === 0 ? 1 : 0,
        channel === 1 ? 1 : 0,
        channel === 2 ? 1 : 0,
        channel === 3 ? 1 : 0,
      ],
      u_resolution: [img.width, img.height],
    });
    twgl.drawBufferInfo(gl, gl.POINTS, pixelIdBufferInfo);
  }
  t2 = performance.now();
  gl.colorMask(true, true, true, true);
  gl.blendFunc(gl.ONE, gl.ZERO);
  gl.disable(gl.BLEND);

  // render-compute min
  // We're rendering are 256x1 pixel sum texture to a single 1x1 pixel texture

  // make a 1x1 pixel RGBA, FLOAT texture attached to a framebuffer
  var maxFbi = twgl.createFramebufferInfo(gl, [
    { type: gl.FLOAT, min: gl.NEAREST, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
  ], 1, 1);

  twgl.bindFramebufferInfo(gl, maxFbi);
  var maxProgramInfo = twgl.createProgramInfo(gl, ["show-vs", "max-fs"]);
  gl.useProgram(maxProgramInfo.program);
  twgl.setBuffersAndAttributes(gl, maxProgramInfo, quadBufferInfo);
  twgl.setUniforms(maxProgramInfo, { u_texture: sumFbi.attachments[0] });
  twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);

  // render histogram.
  twgl.bindFramebufferInfo(gl, null);
  var showProgramInfo = twgl.createProgramInfo(gl, ["show-vs", "show-fs"]);
  gl.useProgram(showProgramInfo.program);
  twgl.setUniforms(showProgramInfo, {
    u_histTexture: sumFbi.attachments[0],
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_maxTexture: maxFbi.attachments[0],
  });
  twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
  alert("process took " + Number(t2 - t1) + "ms")
});

function log() {
  var elem = document.createElement("pre");
  elem.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
  document.body.appendChild(elem);
}