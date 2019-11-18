const
    g_Canvas = document.getElementById("id-canvas"),
    g_Context = g_Canvas.getContext("webgl");

var
    g_positionAttribute = -1;

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

    return shaderProgram;
}

function LoadVertex(data)
{   
    if (data.constructor.name !== "Float32Array")
        throw new Error("Invalid data type expected: Float32Array");
    if (g_positionAttribute === -1)
        throw new Error("shader not initialised");


    var
        bufferNo = g_Context.createBuffer();

    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, bufferNo);
    g_Context.bufferData(g_Context.ARRAY_BUFFER, data, g_Context.STATIC_DRAW);
   
    function Vert(bufferNo, length) {
        this.bufferNo = bufferNo;
        this.length = length;
    }

    return new Vert(bufferNo, data.length);
}


function DetroyVertex(bufferNo)
{
    if (typeof(bufferNo) !== "number") 
        throw new Error("Invalid bufferNo type expected: number");

    g_Context.deleteBuffer(bufferNo);
}

function Draw(vert)
{
    if (vert.constructor.name !== "Vert")
        throw new Error("Invalid vert type expected: Vert");

    g_Context.bindBuffer(g_Context.ARRAY_BUFFER, vert.bufferNo);
    g_Context.enableVertexAttribArray(g_positionAttribute);
    g_Context.vertexAttribPointer(g_positionAttribute, 2, g_Context.FLOAT, false, 0, 0);
    g_Context.drawArrays(g_Context.TRIANGLE_FAN, 0, vert.length/2);
}

function LoadImageToTexture(data)
{

}

function LoadImageToTextureFromUrl(url)
{
    if (url.constructor.name !== "String")
        throw new Error("Invalid url type expected: String");

    var
        textureNo = g_Context.createTexture(),
        level = 0,
        width = 1,
        height = 1,
        border = 0,
        pictureFormat = g_Context.RGBA,
        pictureType = g_Context.UNSIGNED_BYTE,
        pixels = new Uint8Array([0, 0, 255, 255]),
        image = new Image();

    function isPowerOf2(value)
    {
        return (value & (value - 1)) === 0;
    }

    g_Context.bindTexture(g_Context.GL_TEXTURE, textureNo);
    g_Context.texImage2D(g_Context.TEXTURE_2D,
        level,
        pictureFormat,
        width, height,
        border,
        pictureFormat,
        pictureType,
        pixels);

    image.onload = function ()
    {
        g_Context.bindTexture(g_Context.GL_TEXTURE, textureNo);
        g_Context.texImage2D(g_Context.GL_TEXTURE,
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
    };
    image.src = url;

    return textureNo;

}

function InitWebGL()
{
    var
        program = ShaderCompile(
            `attribute vec2 a_position;
            void main(void) {
              gl_Position = vec4(a_position, 0.0, 1.0);
            }`,
            `void main(void) {
              gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
            }`),
        vert = null;

    g_Context.useProgram(program);
    vert = LoadVertex(new Float32Array([
            -1.0, -1.0,
            +1.0, -1.0,
            +1.0, +1.0,
            -1.0, +1.0
        ]));
    Draw(vert);

}

InitWebGL();