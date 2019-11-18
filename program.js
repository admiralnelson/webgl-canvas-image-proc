const
    g_Canvas = document.getElementById("id-canvas"),
    g_File = document.getElementById("id-file"),
    g_Context = g_Canvas.getContext("webgl");

var
    g_positionAttribute = -1,
    g_textureCoordAttribute = -1,
    g_samplerUniform = -1;

function ShaderCompile(vertexShaderSource, fragmentShaderSource)
{
    if (vertexShaderSource.constructor.name !== "String")
        throw new Error("Invalid vertexShaderSource type expected: String");
    if (fragmentShaderSource.constructor.name !== "String")
        throw new Error("Invalid fragmentShaderSource type expected: String");

    var
        vertexShader = g_Context.createShader(g_Context.VERTEX_SHADER),
        fragShader = g_Context.createShader(g_Context.FRAGMENT_SHADER),
        shaderProgram = g_Context.createProgram();

    g_Context.shaderSource(vertexShader, vertexShaderSource);
    g_Context.compileShader(vertexShader);
    if (!g_Context.getShaderParameter(vertexShader, g_Context.COMPILE_STATUS))
        throw new Error(g_Context.getShaderInfoLog(vertexShader));

    g_Context.shaderSource(fragShader, fragmentShaderSource);
    g_Context.compileShader(fragShader);
    if (!g_Context.getShaderParameter(fragShader, g_Context.COMPILE_STATUS))
        throw new Error(g_Context.getShaderInfoLog(fragShader));

    g_Context.attachShader(shaderProgram, vertexShader);
    g_Context.attachShader(shaderProgram, fragShader);
    g_Context.linkProgram(shaderProgram);

    if (!g_Context.getProgramParameter(shaderProgram, g_Context.LINK_STATUS))
        throw new Error(g_Context.getProgramInfoLog(shaderProgram));

    g_positionAttribute = g_Context.getAttribLocation(shaderProgram, "a_position");
    g_textureCoordAttribute = g_Context.getAttribLocation(shaderProgram, "a_textureCoord");
    g_samplerUniform = g_Context.getUniformLocation(shaderProgram, "u_sampler");

    return shaderProgram;
}

function LoadVertex(data)
{   
    if (data.constructor.name !== "Float32Array")
        throw new Error("Invalid data type expected: Float32Array");

    
    if (g_positionAttribute === -1)
        throw new Error("shader not initialised");

    function Vert(bufferNo, length) {
        this.bufferNo = bufferNo;
        this.length = length;
    }

    var
        bufferNo = g_Context.createBuffer();

    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, bufferNo);
    g_Context.bufferData(g_Context.ARRAY_BUFFER, data, g_Context.STATIC_DRAW);

    return new Vert(bufferNo, data.length);
}


function DetroyVertex(bufferNo)
{
    if (typeof(bufferNo) !== "number") 
        throw new Error("Invalid bufferNo type expected: number");

    g_Context.deleteBuffer(bufferNo);
}

function DestroyTexture(texture) {
    if (texture.constructor.name !== "Texture")
        throw new Error("Invalid texture type expected: Texture");

    g_Context.deleteBuffer(texture.textureCoordBufferNo);
    g_Context.deleteTexture(texture.textureNo);
}

function Draw(vert, texture)
{
    if (vert.constructor.name !== "Vert")
        throw new Error("Invalid vert type expected: Vert");

    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, vert.bufferNo);
    g_Context.enableVertexAttribArray(g_positionAttribute);
    g_Context.vertexAttribPointer(g_positionAttribute, 2, g_Context.FLOAT, false, 0, 0);


    g_Context.enableVertexAttribArray(g_textureCoordAttribute);
    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, texture.textureCoordBufferNo);
    g_Context.vertexAttribPointer(g_textureCoordAttribute, 2, g_Context.FLOAT, false, 0, 0);
    g_Context.bindTexture(g_Context.TEXTURE_2D, texture.textureNo);
    g_Context.uniform1i(g_samplerUniform, 0);

    g_Context.drawArrays(g_Context.TRIANGLE_FAN, 0, vert.length / 2);

}

function LoadImageToTexture(data)
{

}

function LoadImageToTextureFromUrl(url, textureCoord)
{
    if (url.constructor.name !== "String")
        throw new Error("Invalid url type expected: String");
    if (textureCoord.constructor.name !== "Float32Array")
        throw new Error("Invalid textureCoord type expected: Float32Array");

    if (g_samplerUniform === -1)
        throw new Error("shader does not support texture");

    function isPowerOf2(value)
    {
        return (value & (value - 1)) === 0;
    }

    function Texture(textureNo, textureCoordBufferNo)
    {
        this.textureNo = textureNo;
        this.textureCoordBufferNo = textureCoordBufferNo;
    }

    var
        textureNo = g_Context.createTexture(),
        level = 0,
        width = 1,
        height = 1,
        border = 0,
        pictureFormat = g_Context.RGBA,
        pictureType = g_Context.UNSIGNED_BYTE,
        pixels = new Uint8Array([0, 0, 255, 255]),
        image = new Image(),
        textureCoordBufferNo = g_Context.createBuffer();

    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, textureCoordBufferNo);
    g_Context.bufferData(g_Context.ARRAY_BUFFER, textureCoord, g_Context.STATIC_DRAW);

    g_Context.bindTexture(g_Context.TEXTURE_2D, textureNo);
    g_Context.texImage2D(g_Context.TEXTURE_2D,
        level,
        pictureFormat,
        width, height,
        border,
        pictureFormat,
        pictureType,
        pixels);

    image.onloadstart = function () {
        console.log("ok");
    };
    image.onload = function () {
        g_Context.bindTexture(g_Context.TEXTURE_2D, textureNo);
        g_Context.texImage2D(g_Context.TEXTURE_2D,
            level,
            pictureFormat,
            pictureFormat,
            pictureType,
            image);
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            g_Context.generateMipmap(g_Context.TEXTURE_2D);
        }
        else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            g_Context.texParameteri(g_Context.TEXTURE_2D, g_Context.TEXTURE_WRAP_S, g_Context.CLAMP_TO_EDGE);
            g_Context.texParameteri(g_Context.TEXTURE_2D, g_Context.TEXTURE_WRAP_T, g_Context.CLAMP_TO_EDGE);
            g_Context.texParameteri(g_Context.TEXTURE_2D, g_Context.TEXTURE_MIN_FILTER, g_Context.LINEAR);
        }
        console.log("done");

    };
    image.src = url;

    return new Texture(textureNo, textureCoordBufferNo);
}

function LoadTextureFromImage(image, textureCoord)
{
    if (image.constructor.name !== "HTMLImageElement")
        throw new Error("Invalid data type expected: HTMLImageElement (Image)");
    if (textureCoord.constructor.name !== "Float32Array")
        throw new Error("Invalid textureCoord type expected: Float32Array");

    if (g_samplerUniform === -1)
        throw new Error("shader does not support texture");

    function isPowerOf2(value)
    {
        return (value & (value - 1)) === 0;
    }

    function Texture(textureNo, textureCoordBufferNo)
    {
        this.textureNo = textureNo;
        this.textureCoordBufferNo = textureCoordBufferNo;
    }

    var
        textureNo = g_Context.createTexture(),
        level = 0,
        pictureFormat = g_Context.RGBA,
        pictureType = g_Context.UNSIGNED_BYTE,
        textureCoordBufferNo = g_Context.createBuffer();

    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, textureCoordBufferNo);
    g_Context.bufferData(g_Context.ARRAY_BUFFER, textureCoord, g_Context.STATIC_DRAW);

    g_Context.bindTexture(g_Context.TEXTURE_2D, textureNo);
    g_Context.texImage2D(g_Context.TEXTURE_2D,
        level,
        pictureFormat,
        pictureFormat,
        pictureType,
        image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height))
    {
        g_Context.generateMipmap(g_Context.TEXTURE_2D);
    }
    else
    {
        // No, it's not a power of 2. Turn off mips and set
        // wrapping to clamp to edge
        g_Context.texParameteri(g_Context.TEXTURE_2D, g_Context.TEXTURE_WRAP_S, g_Context.CLAMP_TO_EDGE);
        g_Context.texParameteri(g_Context.TEXTURE_2D, g_Context.TEXTURE_WRAP_T, g_Context.CLAMP_TO_EDGE);
        g_Context.texParameteri(g_Context.TEXTURE_2D, g_Context.TEXTURE_MIN_FILTER, g_Context.LINEAR);
    }


    return new Texture(textureNo, textureCoordBufferNo);
}

function InitWebGL()
{
    var
        program = ShaderCompile(
            `attribute vec2 a_position;
             attribute vec2 a_textureCoord;

            varying vec2 v_textureCoord;

            void main(void) {
              gl_Position = vec4(a_position, 0.0, 1.0);
              v_textureCoord = a_textureCoord;
            }`,
            `precision mediump float;
            // Passed in from the vertex shader.
            varying vec2 v_textureCoord;

            // The texture.
            uniform sampler2D u_sampler;
            
            vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
              vec4 color = vec4(0.0);
              vec2 off1 = vec2(1.3846153846) * direction;
              vec2 off2 = vec2(3.2307692308) * direction;
              color += texture2D(image, uv) * 0.2270270270;
              color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
              color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
              color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
              color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
              return color;
            }

            void main() {
                vec4 col  = texture2D(u_sampler, v_textureCoord) ;
                vec4 bwCol = vec4( vec3(col.r), 1.0 );
               gl_FragColor = bwCol;
            }`),
        vert = null,
        tex = null;


    g_Context.useProgram(program);
    vert = LoadVertex(
        new Float32Array([
            -1.0, -1.0,
            +1.0, -1.0,
            +1.0, +1.0,
            -1.0, +1.0
        ]));
    tex = LoadImageToTextureFromUrl("file:///D:/0000032.jpg",
        new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            1.0, 0.0
        ]));


    g_File.onchange = function (ev)
    {
        var
            file = g_File.files[0],
            image = new Image(),
            time_1 = null,
            deltaTime = 0;

        if (file)
        {
            image.onload = function ()
            {
                DestroyTexture(tex);
                tex = LoadTextureFromImage(image,
                    new Float32Array([
                        0.0, 0.0,
                        1.0, 0.0,
                        1.0, 1.0,
                        0.0, 1.0
                    ])
                );
                time_1 = performance.now();
                Draw(vert, tex);
                deltaTime = performance.now() - time_1;
                alert("Operation took: " + deltaTime + " ms");
                
            };

            image.src = URL.createObjectURL(file);
            console.log(image.src);
        }
    };

    Draw(vert, tex);


}

InitWebGL();