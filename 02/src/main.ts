import './style.css'
import * as THREE from 'three';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// デバイスのピクセル密度を考慮したレンダラーの設定
const renderer = new THREE.WebGLRenderer({ canvas });
const dpr = window.devicePixelRatio;
renderer.setPixelRatio(dpr);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

// シーンの作成
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // 黒背景

// カメラの設定
const camera = new THREE.PerspectiveCamera(
    45, // 視野角
    canvas.clientWidth / canvas.clientHeight, // アスペクト比
    0.1, // near plane
    100 // far plane
);
camera.position.z = 6;

// キューブの作成
const geometry = new THREE.BoxGeometry(2, 2, 2);

// 各面に異なる色を設定するマテリアルを作成
const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // 赤 (前面)
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // 緑 (背面)
    new THREE.MeshBasicMaterial({ color: 0x0000ff }), // 青 (上面)
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), // 黄 (底面)
    new THREE.MeshBasicMaterial({ color: 0xff00ff }), // 紫 (右面)
    new THREE.MeshBasicMaterial({ color: 0x00ffff }), // シアン (左面)
];

const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

// ウィンドウのリサイズ対応
function onWindowResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    // Y軸周りの回転
    cube.rotation.y -= 0.01;

    renderer.render(scene, camera);
}

animate();

