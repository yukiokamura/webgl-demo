import './style.css'

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// デバイスのピクセル密度を考慮したサイズ調整
const dpr = window.devicePixelRatio || 1;
const displayWidth = canvas.clientWidth;
const displayHeight = canvas.clientHeight;

// キャンバスのバッファサイズをデバイスのピクセル密度に合わせる
canvas.width = Math.floor(displayWidth * dpr);
canvas.height = Math.floor(displayHeight * dpr);

// CSSのサイズを設定（見た目のサイズ）
canvas.style.width = `${displayWidth}px`;
canvas.style.height = `${displayHeight}px`;

const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGLが利用できません');
    throw new Error('WebGL not supported');
}

// シェーダーのソースコード
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying lowp vec4 vColor;
    
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying lowp vec4 vColor;
    
    void main() {
        gl_FragColor = vColor;
    }
`;

// シェーダーの作成
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('シェーダーの作成に失敗しました');
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('シェーダーのコンパイルエラー:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error('シェーダーのコンパイルに失敗しました');
    }
    
    return shader;
}

// プログラムの作成
function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if (!program) throw new Error('プログラムの作成に失敗しました');
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('プログラムのリンクエラー:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        throw new Error('プログラムのリンクに失敗しました');
    }
    
    return program;
}

// 行列計算のヘルパー関数
function createProjectionMatrix(gl: WebGLRenderingContext): Float32Array {
    // キャンバスの型アサーション
    const canvas = gl.canvas as HTMLCanvasElement;
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = new Float32Array(16);
    
    const f = 1.0 / Math.tan(fieldOfView / 2);
    const rangeInv = 1.0 / (zNear - zFar);
    
    projectionMatrix[0] = f / aspect;
    projectionMatrix[1] = 0;
    projectionMatrix[2] = 0;
    projectionMatrix[3] = 0;
    projectionMatrix[4] = 0;
    projectionMatrix[5] = f;
    projectionMatrix[6] = 0;
    projectionMatrix[7] = 0;
    projectionMatrix[8] = 0;
    projectionMatrix[9] = 0;
    projectionMatrix[10] = (zNear + zFar) * rangeInv;
    projectionMatrix[11] = -1;
    projectionMatrix[12] = 0;
    projectionMatrix[13] = 0;
    projectionMatrix[14] = zNear * zFar * rangeInv * 2;
    projectionMatrix[15] = 0;
    
    return projectionMatrix;
}

function createModelViewMatrix(rotation: number): Float32Array {
    const modelViewMatrix = new Float32Array(16);
    
    // 単位行列で初期化
    modelViewMatrix.fill(0);
    modelViewMatrix[0] = Math.cos(rotation);
    modelViewMatrix[2] = Math.sin(rotation);
    modelViewMatrix[5] = 1;
    modelViewMatrix[8] = -Math.sin(rotation);
    modelViewMatrix[10] = Math.cos(rotation);
    modelViewMatrix[15] = 1;
    
    // Z軸方向に移動（カメラから離す）
    modelViewMatrix[14] = -6;
    
    return modelViewMatrix;
}

// シェーダーとプログラムの初期化
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// 頂点データの設定（3D座標）
const positions = new Float32Array([
    // 前面
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    
    // 背面
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    
    // 上面
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
    
    // 底面
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    
    // 右面
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    
    // 左面
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
]);

// 色データ
const colors = new Float32Array([
    // 前面: 赤
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    
    // 背面: 緑
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    
    // 上面: 青
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    
    // 底面: 黄
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    
    // 右面: 紫
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    
    // 左面: シアン
    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
]);

// インデックスデータ
const indices = new Uint16Array([
    0,  1,  2,    0,  2,  3,  // 前面
    4,  5,  6,    4,  6,  7,  // 背面
    8,  9,  10,   8,  10, 11, // 上面
    12, 13, 14,   12, 14, 15, // 底面
    16, 17, 18,   16, 18, 19, // 右面
    20, 21, 22,   20, 22, 23  // 左面
]);

// バッファの作成と設定
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// シェーダー変数の位置を取得
const programInfo = {
    attribLocations: {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
    },
};

// 描画関数
function render(gl: WebGLRenderingContext, rotation: number) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const projectionMatrix = createProjectionMatrix(gl);
    const modelViewMatrix = createModelViewMatrix(rotation);
    
    // 頂点位置の設定
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3,        // 要素数
        gl.FLOAT, // データ型
        false,    // 正規化
        0,        // ストライド
        0         // オフセット
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    // 頂点色の設定
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,        // 要素数
        gl.FLOAT, // データ型
        false,    // 正規化
        0,        // ストライド
        0         // オフセット
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
    // インデックスバッファのバインド
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    
    // シェーダープログラムの使用
    gl.useProgram(program);
    
    // uniform変数の設定
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );
    
    // 描画
    gl.drawElements(
        gl.TRIANGLES,
        36,             // 頂点数
        gl.UNSIGNED_SHORT,
        0
    );
}

// アニメーションループ
let rotation = 0;
function animate() {
    rotation += 0.01;
    render(gl as WebGLRenderingContext, rotation);
    requestAnimationFrame(animate);
}

animate();