    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // =========================================================================
    // 1. 定数・カラーパレット・初期設定
    // =========================================================================
    const GRID_SIZE = 20; // 20x20 グリッド (-10 ～ +9)
    const HALF_GRID = GRID_SIZE / 2; // 10
    const MAX_HEIGHT = 40;

    // 厳選18色パレット
    const PALETTE_COLORS = [
      { name: '赤', hex: '#ef4444' },
      { name: 'オレンジ', hex: '#f97316' },
      { name: '黄', hex: '#eab308' },
      { name: 'ライム', hex: '#84cc16' },
      { name: '緑', hex: '#22c55e' },
      { name: 'シアン', hex: '#06b6d4' },
      { name: '青', hex: '#3b82f6' },
      { name: '紫', hex: '#a855f7' },
      { name: 'ピンク', hex: '#ec4899' },
      { name: '白', hex: '#f8fafc' },
      { name: 'ライトグレー', hex: '#cbd5e1' },
      { name: 'ダークグレー', hex: '#475569' },
      { name: '黒', hex: '#1e293b' },
      { name: '肌色', hex: '#fed7aa' },
      { name: '茶色', hex: '#92400e' },
      { name: 'ダークブラウン', hex: '#451a03' },
      { name: 'ゴールド', hex: '#fbbf24' },
      { name: 'パステルブルー', hex: '#93c5fd' }
    ];

    // アプリ状態
    const state = {
      tool: 'build',         // 'build' | 'erase' | 'paint' | 'eyedropper'
      shape: 'voxel',         // 'voxel' | 'stud' | 'brick2x1' | 'brick2x2' | 'slope' | 'cylinder'
      material: 'standard',  // 'standard' | 'matte' | 'clear' | 'neon'
      color: '#ef4444',
      rotation: 0,           // 0, 1, 2, 3 (90度単位)
      mirrorX: false,
      mirrorZ: false,
      theme: 'light',        // 'light' | 'sky' | 'dark'
      soundEnabled: true,
      blocks: new Map(),     // id -> blockData
      occupied: new Map(),   // "x,y,z" -> id
      undoStack: [],
      redoStack: [],
      nextId: 1
    };

    // =========================================================================
    // 2. Web Audio API 効果音エンジン
    // =========================================================================
    class SoundEngine {
      constructor() {
        this.ctx = null;
      }
      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
      playPlace() {
        if (!state.soundEnabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          // カチッというプラスチック噛み合わせ音
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(190, now + 0.055);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.065);

          // 2段目の軽いクリック
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, now + 0.02);
          osc2.frequency.exponentialRampToValueAtTime(420, now + 0.06);
          gain2.gain.setValueAtTime(0.12, now + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.start(now + 0.02);
          osc2.stop(now + 0.07);
        } catch (e) {}
      }
      playErase() {
        if (!state.soundEnabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(340, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        } catch (e) {}
      }
      playRotate() {
        if (!state.soundEnabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(640, now);
          osc.frequency.exponentialRampToValueAtTime(820, now + 0.035);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.045);
        } catch (e) {}
      }
      playPop() {
        if (!state.soundEnabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(740, now + 0.06);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
        } catch (e) {}
      }
    }
    const sound = new SoundEngine();

    // =========================================================================
    // 3. UI通知・モーダルヘルパー
    // =========================================================================
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      const badgeColor = type === 'error' ? 'bg-rose-600 text-white' :
                         type === 'success' ? 'bg-emerald-600 text-white' :
                         'bg-slate-800/90 text-white';
      el.className = `toast-anim px-4 py-2 rounded-full text-xs font-bold shadow-lg ${badgeColor}`;
      el.textContent = message;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.25s ease';
        setTimeout(() => el.remove(), 260);
      }, 2200);
    }

    // =========================================================================
    // ナビキャラのガイド（開くたびに6人からランダムで1人が案内役になる）
    // =========================================================================
    const NAVI_IMG_BASE = 'https://tt-sensei.github.io/navi-character-/assets/web/characters/';
    const GUIDE_CHARS = [
      { id: 'riku', name: 'りく' },
      { id: 'sora', name: 'そら' },
      { id: 'kai', name: 'かい' },
      { id: 'saku', name: 'さく' },
      { id: 'tsuki', name: 'つき' },
      { id: 'nami', name: 'なみ' }
    ];
    const guideChar = GUIDE_CHARS[Math.floor(Math.random() * GUIDE_CHARS.length)];
    const guideImgEl = document.getElementById('guide-img');
    guideImgEl.addEventListener('error', () => {
      document.getElementById('guide-panel').style.display = 'none';
    });
    function guideSay(expression, text) {
      guideImgEl.src = NAVI_IMG_BASE + guideChar.id + '/expressions/' + expression + '.webp';
      document.getElementById('guide-name').textContent = guideChar.name;
      document.getElementById('guide-text').textContent = text;
    }

    function showConfirmDialog(title, message, onConfirm) {
      const modal = document.getElementById('modal-confirm');
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      const btnOk = document.getElementById('confirm-ok');
      const btnCancel = document.getElementById('confirm-cancel');

      const cleanup = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        btnOk.onclick = null;
        btnCancel.onclick = null;
      };
      btnCancel.onclick = cleanup;
      btnOk.onclick = () => {
        cleanup();
        onConfirm();
      };
    }

    // =========================================================================
    // 4. Three.js シーン・カメラ・ライティング・ベースプレート構築
    // =========================================================================
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f1f5f9');
    scene.fog = new THREE.FogExp2('#f1f5f9', 0.0085);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.set(18, 17, 20);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // PNGスクリーンショット撮影用
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    container.appendChild(renderer.domElement);

    // OrbitControls 設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 2, 0);
    controls.minDistance = 5;
    controls.maxDistance = 65;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // 地面の下に潜り込まないように制限
    controls.mouseButtons = {
      LEFT: null, // 左クリックはブロック配置・編集に専念（Shift+左ドラッグは別途制御可）
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE
    };

    // ライティング（環境光＋太陽光＋補助光）
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#cbd5e1', 0.85);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.45);
    dirLight.position.set(16, 28, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 75;
    const d = 16;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight('#e0f2fe', 0.55);
    fillLight.position.set(-18, 14, -14);
    scene.add(fillLight);

    // ベースプレート＆グリッドグループ
    const environmentGroup = new THREE.Group();
    scene.add(environmentGroup);

    // 厚みのあるベースプレート台座
    const plateGeo = new THREE.BoxGeometry(GRID_SIZE + 0.6, 0.5, GRID_SIZE + 0.6);
    const plateMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.75,
      metalness: 0.05
    });
    const basePlateMesh = new THREE.Mesh(plateGeo, plateMat);
    basePlateMesh.position.set(0, -0.25, 0);
    basePlateMesh.receiveShadow = true;
    environmentGroup.add(basePlateMesh);

    // レイキャスト用の透明地面プレーン (y = 0)
    const groundHitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    groundHitPlane.rotation.x = -Math.PI / 2;
    groundHitPlane.position.set(0, 0, 0);
    scene.add(groundHitPlane);

    // 20x20 グリッドヘルパー
    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, '#94a3b8', '#cbd5e1');
    gridHelper.position.y = 0.003;
    environmentGroup.add(gridHelper);

    // 対称ミラーガイドライン（X軸・Z軸）
    const mirrorGuideX = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, GRID_SIZE + 0.4),
      new THREE.MeshBasicMaterial({ color: '#ec4899', transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    mirrorGuideX.rotation.x = -Math.PI / 2;
    mirrorGuideX.position.y = 0.012;
    mirrorGuideX.visible = false;
    environmentGroup.add(mirrorGuideX);

    const mirrorGuideZ = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE + 0.4, 0.08),
      new THREE.MeshBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    mirrorGuideZ.rotation.x = -Math.PI / 2;
    mirrorGuideZ.position.y = 0.012;
    mirrorGuideZ.visible = false;
    environmentGroup.add(mirrorGuideZ);

    // ブロックメッシュ格納グループ
    const blocksGroup = new THREE.Group();
    scene.add(blocksGroup);

    // =========================================================================
    // 5. ブロックジオメトリ＆マテリアルビルダー
    // =========================================================================
    // ジオメトリキャッシュ
    const geometryCache = new Map();

    function createSlopeGeometry() {
      // 1x1x1 のスロープ（+Z側が低く、-Z側が高い斜めカット形状）
      const shape = new THREE.Shape();
      const s = 0.496;
      shape.moveTo(-s, -s);
      shape.lineTo(s, -s);
      shape.lineTo(-s, s);
      shape.closePath();

      const extrudeSettings = {
        steps: 1,
        depth: s * 2,
        bevelEnabled: false
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // X軸中心に回転して、底面がXZ平面、傾斜がZ方向を向くように調整
      geo.rotateY(Math.PI / 2);
      geo.translate(-s, 0, 0);
      geo.computeVertexNormals();
      return geo;
    }

    function getShapeGeometries(shapeType) {
      if (geometryCache.has(shapeType)) {
        return geometryCache.get(shapeType);
      }

      const parts = []; // { geo, offset: [x, y, z] }
      const gap = 0.992; // 隣接ブロックとの微細な境界表現のためのスケール

      if (shapeType === 'voxel') {
        parts.push({
          geo: new THREE.BoxGeometry(gap, gap, gap),
          offset: [0, 0, 0]
        });
      } else if (shapeType === 'stud') {
        parts.push({
          geo: new THREE.BoxGeometry(gap, gap, gap),
          offset: [0, 0, 0]
        });
        parts.push({
          geo: new THREE.CylinderGeometry(0.28, 0.28, 0.18, 20),
          offset: [0, 0.5 + 0.08, 0]
        });
      } else if (shapeType === 'brick2x1') {
        // ローカル基準: (0,0,0) と (+1,0,0) の2マス分 → 中心は (+0.5, 0, 0)
        parts.push({
          geo: new THREE.BoxGeometry(2 - (1 - gap), gap, gap),
          offset: [0.5, 0, 0]
        });
        parts.push({
          geo: new THREE.CylinderGeometry(0.28, 0.28, 0.18, 20),
          offset: [0, 0.5 + 0.08, 0]
        });
        parts.push({
          geo: new THREE.CylinderGeometry(0.28, 0.28, 0.18, 20),
          offset: [1, 0.5 + 0.08, 0]
        });
      } else if (shapeType === 'brick2x2') {
        // ローカル基準: (0..1, 0, 0..1) → 中心は (+0.5, 0, +0.5)
        parts.push({
          geo: new THREE.BoxGeometry(2 - (1 - gap), gap, 2 - (1 - gap)),
          offset: [0.5, 0, 0.5]
        });
        const studOffsets = [[0, 0], [1, 0], [0, 1], [1, 1]];
        for (const [sx, sz] of studOffsets) {
          parts.push({
            geo: new THREE.CylinderGeometry(0.28, 0.28, 0.18, 20),
            offset: [sx, 0.5 + 0.08, sz]
          });
        }
      } else if (shapeType === 'slope') {
        parts.push({
          geo: createSlopeGeometry(),
          offset: [0, 0, 0]
        });
      } else if (shapeType === 'cylinder') {
        parts.push({
          geo: new THREE.CylinderGeometry(0.492, 0.492, gap, 28),
          offset: [0, 0, 0]
        });
        parts.push({
          geo: new THREE.CylinderGeometry(0.26, 0.26, 0.16, 20),
          offset: [0, 0.5 + 0.07, 0]
        });
      }

      geometryCache.set(shapeType, parts);
      return parts;
    }

    function createBlockMaterial(colorHex, materialType, isGhost = false, isValid = true) {
      if (isGhost) {
        return new THREE.MeshStandardMaterial({
          color: isValid ? colorHex : '#ef4444',
          transparent: true,
          opacity: isValid ? 0.52 : 0.45,
          roughness: 0.3,
          depthWrite: false
        });
      }

      const baseColor = new THREE.Color(colorHex);

      if (materialType === 'matte') {
        return new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.88,
          metalness: 0.02
        });
      } else if (materialType === 'clear') {
        return new THREE.MeshPhysicalMaterial({
          color: baseColor,
          roughness: 0.12,
          metalness: 0.0,
          transparent: true,
          opacity: 0.62,
          transmission: 0.25,
          ior: 1.45
        });
      } else if (materialType === 'neon') {
        return new THREE.MeshStandardMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.72,
          roughness: 0.25,
          metalness: 0.1
        });
      } else {
        // standard (プラスチック風)
        return new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.28,
          metalness: 0.05
        });
      }
    }

    // =========================================================================
    // 6. グリッド占有セル計算・回転・ミラーロジック
    // =========================================================================
    /**
     * 形状・基準座標(x,y,z)・回転(0..3)から占有する全グリッドセルの配列を返す
     */
    function getOccupiedCells(x, y, z, shape, rotation) {
      const rot = ((rotation % 4) + 4) % 4;
      if (shape === 'brick2x1') {
        // rotation 0: +X方向, 1: +Z方向, 2: -X方向, 3: -Z方向
        const dx = rot === 0 ? 1 : rot === 2 ? -1 : 0;
        const dz = rot === 1 ? 1 : rot === 3 ? -1 : 0;
        return [
          { x, y, z },
          { x: x + dx, y, z: z + dz }
        ];
      } else if (shape === 'brick2x2') {
        // 回転に応じて4マス展開
        const offsets = [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1]
        ];
        return offsets.map(([ox, oz]) => {
          let rx = ox, rz = oz;
          if (rot === 1) { rx = -oz; rz = ox; }
          else if (rot === 2) { rx = -ox; rz = -oz; }
          else if (rot === 3) { rx = oz; rz = -ox; }
          return { x: x + rx, y, z: z + rz };
        });
      }
      return [{ x, y, z }];
    }

    /**
     * セル配列が20x20xMAX_HEIGHTの範囲内で、かつ既存ブロックと干渉しないか検証
     */
    function canPlaceCells(cells, tempOccupied = state.occupied) {
      for (const c of cells) {
        if (c.x < -HALF_GRID || c.x >= HALF_GRID ||
            c.z < -HALF_GRID || c.z >= HALF_GRID ||
            c.y < 0 || c.y >= MAX_HEIGHT) {
          return false;
        }
        const key = `${c.x},${c.y},${c.z}`;
        if (tempOccupied.has(key)) {
          return false;
        }
      }
      return true;
    }

    /**
     * 回転インデックスを Y軸ラジアン角へ変換
     */
    function rotationToAngle(rotation) {
      return -(((rotation % 4) + 4) % 4) * (Math.PI / 2);
    }

    /**
     * ミラー対称モード時の候補ブロック一覧を生成（重複除去済み）
     */
    function getMirroredPlacements(baseBlock) {
      const list = [{ ...baseBlock }];

      const mirrorAlongX = (b) => {
        // X軸対称: グリッド -10..9 において x <-> -1 - x
        let nx = -1 - b.x;
        let nrot = b.rotation;
        if (b.shape === 'brick2x1') {
          if (b.rotation === 0) { nx = -1 - b.x; nrot = 2; }
          else if (b.rotation === 2) { nx = -1 - b.x; nrot = 0; }
        } else if (b.shape === 'brick2x2') {
          if (b.rotation === 0) { nx = -1 - b.x; nrot = 1; }
          else if (b.rotation === 1) { nx = -1 - b.x; nrot = 0; }
          else if (b.rotation === 2) { nx = -1 - b.x; nrot = 3; }
          else if (b.rotation === 3) { nx = -1 - b.x; nrot = 2; }
        } else if (b.shape === 'slope') {
          // スロープの左右向き反転 (1 <-> 3)
          if (b.rotation === 1) nrot = 3;
          else if (b.rotation === 3) nrot = 1;
        }
        return { ...b, x: nx, rotation: nrot };
      };

      const mirrorAlongZ = (b) => {
        // Z軸対称: グリッド -10..9 において z <-> -1 - z
        let nz = -1 - b.z;
        let nrot = b.rotation;
        if (b.shape === 'brick2x1') {
          if (b.rotation === 1) { nz = -1 - b.z; nrot = 3; }
          else if (b.rotation === 3) { nz = -1 - b.z; nrot = 1; }
        } else if (b.shape === 'brick2x2') {
          if (b.rotation === 0) { nz = -1 - b.z; nrot = 3; }
          else if (b.rotation === 3) { nz = -1 - b.z; nrot = 0; }
          else if (b.rotation === 1) { nz = -1 - b.z; nrot = 2; }
          else if (b.rotation === 2) { nz = -1 - b.z; nrot = 1; }
        } else if (b.shape === 'slope') {
          // スロープの前後向き反転 (0 <-> 2)
          if (b.rotation === 0) nrot = 2;
          else if (b.rotation === 2) nrot = 0;
        }
        return { ...b, z: nz, rotation: nrot };
      };

      if (state.mirrorX) {
        const currentLen = list.length;
        for (let i = 0; i < currentLen; i++) {
          list.push(mirrorAlongX(list[i]));
        }
      }
      if (state.mirrorZ) {
        const currentLen = list.length;
        for (let i = 0; i < currentLen; i++) {
          list.push(mirrorAlongZ(list[i]));
        }
      }

      // 同一占有セル集合になる重複候補を除外
      const unique = [];
      const seenSignatures = new Set();
      for (const item of list) {
        const cells = getOccupiedCells(item.x, item.y, item.z, item.shape, item.rotation);
        const sig = cells.map(c => `${c.x},${c.y},${c.z}`).sort().join('|');
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          unique.push(item);
        }
      }
      return unique;
    }

    // =========================================================================
    // 7. ブロックメッシュ生成・管理・履歴(Undo/Redo)
    // =========================================================================
    const blockMeshes = new Map(); // id -> THREE.Group

    function createBlockGroupMesh(blockData, isGhost = false, isValid = true) {
      const group = new THREE.Group();
      const parts = getShapeGeometries(blockData.shape);
      const mat = createBlockMaterial(blockData.color, blockData.material, isGhost, isValid);

      for (const p of parts) {
        const mesh = new THREE.Mesh(p.geo, mat);
        mesh.position.set(p.offset[0], p.offset[1], p.offset[2]);
        if (!isGhost) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.blockId = blockData.id;
        }
        group.add(mesh);
      }

      group.position.set(blockData.x + 0.5, blockData.y + 0.5, blockData.z + 0.5);
      group.rotation.y = rotationToAngle(blockData.rotation);
      if (!isGhost) {
        group.userData.blockId = blockData.id;
      }
      return group;
    }

    function addBlockToScene(blockData, recordHistory = true) {
      const cells = getOccupiedCells(blockData.x, blockData.y, blockData.z, blockData.shape, blockData.rotation);
      if (!canPlaceCells(cells)) return false;

      const id = blockData.id || state.nextId++;
      if (id >= state.nextId) state.nextId = id + 1;
      const fullData = { ...blockData, id };

      state.blocks.set(id, fullData);
      for (const c of cells) {
        state.occupied.set(`${c.x},${c.y},${c.z}`, id);
      }

      const meshGroup = createBlockGroupMesh(fullData, false);
      blocksGroup.add(meshGroup);
      blockMeshes.set(id, meshGroup);

      updateBlockCountUI();
      return true;
    }

    function removeBlockFromScene(id) {
      const data = state.blocks.get(id);
      if (!data) return false;

      const cells = getOccupiedCells(data.x, data.y, data.z, data.shape, data.rotation);
      for (const c of cells) {
        state.occupied.delete(`${c.x},${c.y},${c.z}`);
      }
      state.blocks.delete(id);

      const meshGroup = blockMeshes.get(id);
      if (meshGroup) {
        blocksGroup.remove(meshGroup);
        blockMeshes.delete(id);
      }

      updateBlockCountUI();
      return true;
    }

    function updateBlockAppearance(id, newColor, newMaterial) {
      const data = state.blocks.get(id);
      if (!data) return false;
      if (data.color === newColor && data.material === newMaterial) return false;

      data.color = newColor;
      data.material = newMaterial;

      const oldMesh = blockMeshes.get(id);
      if (oldMesh) blocksGroup.remove(oldMesh);

      const newMesh = createBlockGroupMesh(data, false);
      blocksGroup.add(newMesh);
      blockMeshes.set(id, newMesh);
      saveWork();
      return true;
    }

    // 履歴スナップショット保存
    function pushHistorySnapshot() {
      const snapshot = Array.from(state.blocks.values()).map(b => ({ ...b }));
      state.undoStack.push(snapshot);
      if (state.undoStack.length > 50) state.undoStack.shift();
      state.redoStack = [];
      updateUndoRedoUI();
    }

    function restoreFromSnapshot(snapshot) {
      // 既存クリア
      for (const id of Array.from(state.blocks.keys())) {
        removeBlockFromScene(id);
      }
      state.blocks.clear();
      state.occupied.clear();
      state.nextId = 1;

      for (const b of snapshot) {
        addBlockToScene(b, false);
      }
      updateBlockCountUI();
      updateUndoRedoUI();
    }

    function performUndo() {
      if (state.undoStack.length === 0) return;
      const currentSnapshot = Array.from(state.blocks.values()).map(b => ({ ...b }));
      state.redoStack.push(currentSnapshot);
      const prev = state.undoStack.pop();
      restoreFromSnapshot(prev);
      sound.playRotate();
      showToast('元に戻しました');
    }

    function performRedo() {
      if (state.redoStack.length === 0) return;
      const currentSnapshot = Array.from(state.blocks.values()).map(b => ({ ...b }));
      state.undoStack.push(currentSnapshot);
      const next = state.redoStack.pop();
      restoreFromSnapshot(next);
      sound.playRotate();
      showToast('やり直しました');
    }

    let lastGuideCount = 0;
    function updateBlockCountUI() {
      const count = state.blocks.size;
      document.getElementById('block-count').textContent = count;
      saveWork();
      if (count === 0 && lastGuideCount > 0) {
        guideSay('05-surprised', 'まっさらに なったよ。なにを つくろうか？');
      } else if (count > lastGuideCount && count % 50 === 0 && count - lastGuideCount <= 4) {
        guideSay('08-celebrating', count + 'こ のブロック！すごい！');
      }
      lastGuideCount = count;
    }

    // 端末への自動保存（作品・テーマ・音の設定）
    const SAVE_KEY = 'voxelStudio3d.save.v1';
    function saveWork() {
      try {
        const data = {
          version: 1,
          theme: state.theme,
          soundEnabled: state.soundEnabled,
          blocks: Array.from(state.blocks.values()).map(({ x, y, z, shape, rotation, color, material }) => ({
            x, y, z, shape, rotation, color, material
          }))
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      } catch (e) {}
    }
    function loadWork() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.blocks)) return null;
        return data;
      } catch (e) {
        return null;
      }
    }

    function updateUndoRedoUI() {
      document.getElementById('btn-undo').disabled = state.undoStack.length === 0;
      document.getElementById('btn-redo').disabled = state.redoStack.length === 0;
    }

    // =========================================================================
    // 8. ゴーストプレビュー＆ホバーハイライト制御
    // =========================================================================
    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);

    let currentHoverTarget = null; // { mode: 'place', x, y, z } | { mode: 'block', blockId }
    let highlightedBlockId = null;

    function clearHighlight() {
      if (highlightedBlockId !== null) {
        const meshGroup = blockMeshes.get(highlightedBlockId);
        if (meshGroup) {
          meshGroup.traverse(child => {
            if (child.isMesh && child.material) {
              child.material.emissive?.setHex(
                state.blocks.get(highlightedBlockId)?.material === 'neon'
                  ? new THREE.Color(state.blocks.get(highlightedBlockId).color).getHex()
                  : 0x000000
              );
              child.material.emissiveIntensity =
                state.blocks.get(highlightedBlockId)?.material === 'neon' ? 0.72 : 0;
            }
          });
        }
        highlightedBlockId = null;
      }
    }

    function applyBlockHighlight(blockId, hexColor, intensity = 0.45) {
      if (highlightedBlockId === blockId) return;
      clearHighlight();
      const meshGroup = blockMeshes.get(blockId);
      if (meshGroup) {
        meshGroup.traverse(child => {
          if (child.isMesh && child.material) {
            // マテリアルをクローンして個別ハイライト
            if (!child.userData.clonedMat) {
              child.material = child.material.clone();
              child.userData.clonedMat = true;
            }
            child.material.emissive = new THREE.Color(hexColor);
            child.material.emissiveIntensity = intensity;
          }
        });
        highlightedBlockId = blockId;
      }
    }

    function rebuildGhostPreview() {
      while (ghostGroup.children.length > 0) {
        ghostGroup.remove(ghostGroup.children[0]);
      }

      if (!currentHoverTarget || currentHoverTarget.mode !== 'place') return;
      if (state.tool !== 'build') return;

      const baseCandidate = {
        x: currentHoverTarget.x,
        y: currentHoverTarget.y,
        z: currentHoverTarget.z,
        shape: state.shape,
        rotation: state.rotation,
        color: state.color,
        material: state.material
      };

      const candidates = getMirroredPlacements(baseCandidate);
      const tempOcc = new Map(state.occupied);

      for (const cand of candidates) {
        const cells = getOccupiedCells(cand.x, cand.y, cand.z, cand.shape, cand.rotation);
        const valid = canPlaceCells(cells, tempOcc);
        if (valid) {
          for (const c of cells) tempOcc.set(`${c.x},${c.y},${c.z}`, -1);
        }
        const gMesh = createBlockGroupMesh(cand, true, valid);
        ghostGroup.add(gMesh);
      }
    }

    // =========================================================================
    // 9. レイキャスト＆マウス・タッチインタラクション
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownButton = -1;
    let isShiftPressed = false;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        isShiftPressed = true;
        updateHoverFromLastPointer();
      }
      // 入力フォームフォーカス時はショートカット無効
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        rotateCurrentBlock();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) performRedo();
        else performUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        performRedo();
      } else if (e.key === '1') selectTool('build');
      else if (e.key === '2') selectTool('erase');
      else if (e.key === '3') selectTool('paint');
      else if (e.key === '4') selectTool('eyedropper');
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        isShiftPressed = false;
        updateHoverFromLastPointer();
      }
    });

    let lastClientX = -9999;
    let lastClientY = -9999;

    function updateHoverFromLastPointer() {
      if (lastClientX < -1000) return;
      updateHoverState(lastClientX, lastClientY);
    }

    function updateHoverState(clientX, clientY) {
      lastClientX = clientX;
      lastClientY = clientY;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // 既存ブロックのメッシュ一覧を取得
      const targetMeshes = [];
      blocksGroup.traverse(obj => {
        if (obj.isMesh) targetMeshes.push(obj);
      });

      const blockHits = raycaster.intersectObjects(targetMeshes, false);
      const effectiveTool = (state.tool === 'build' && isShiftPressed) ? 'erase' : state.tool;

      // 削除・塗替・吸取モードのときは既存ブロックを直接ターゲット
      if (effectiveTool === 'erase' || effectiveTool === 'paint' || effectiveTool === 'eyedropper') {
        while (ghostGroup.children.length > 0) ghostGroup.remove(ghostGroup.children[0]);

        if (blockHits.length > 0) {
          const hitBlockId = blockHits[0].object.userData.blockId;
          currentHoverTarget = { mode: 'block', blockId: hitBlockId };

          if (effectiveTool === 'erase') {
            applyBlockHighlight(hitBlockId, '#ef4444', 0.55);
          } else if (effectiveTool === 'paint') {
            applyBlockHighlight(hitBlockId, state.color, 0.35);
          } else if (effectiveTool === 'eyedropper') {
            applyBlockHighlight(hitBlockId, '#06b6d4', 0.45);
          }
          renderer.domElement.style.cursor = 'pointer';
        } else {
          clearHighlight();
          currentHoverTarget = null;
          renderer.domElement.style.cursor = 'default';
        }
        return;
      }

      // 配置モード (build)
      clearHighlight();

      if (blockHits.length > 0) {
        const hit = blockHits[0];
        // ワールド空間の法線を取得
        const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).round();
        // ヒット点から法線方向に少し押し出した位置のセルを算出
        const targetPt = hit.point.clone().addScaledVector(worldNormal, 0.45);
        let gx = Math.floor(targetPt.x);
        let gy = Math.max(0, Math.floor(targetPt.y));
        let gz = Math.floor(targetPt.z);

        // 2x1 / 2x2ブロックを負の法線方向面に貼る際のスマートオフセット補正
        if (state.shape === 'brick2x1') {
          if (worldNormal.x < 0 && state.rotation === 0) gx -= 1;
          if (worldNormal.x > 0 && state.rotation === 2) gx += 1;
          if (worldNormal.z < 0 && state.rotation === 1) gz -= 1;
          if (worldNormal.z > 0 && state.rotation === 3) gz += 1;
        } else if (state.shape === 'brick2x2') {
          if (worldNormal.x < 0 && (state.rotation === 0 || state.rotation === 1)) gx -= 1;
          if (worldNormal.x > 0 && (state.rotation === 2 || state.rotation === 3)) gx += 1;
          if (worldNormal.z < 0 && (state.rotation === 0 || state.rotation === 3)) gz -= 1;
          if (worldNormal.z > 0 && (state.rotation === 1 || state.rotation === 2)) gz += 1;
        }

        currentHoverTarget = { mode: 'place', x: gx, y: gy, z: gz, hitBlockId: hit.object.userData.blockId };
        rebuildGhostPreview();
        renderer.domElement.style.cursor = 'crosshair';
        return;
      }

      // 地面プレーンとの交差判定
      const groundHits = raycaster.intersectObject(groundHitPlane, false);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const gx = Math.floor(pt.x);
        const gz = Math.floor(pt.z);
        if (gx >= -HALF_GRID && gx < HALF_GRID && gz >= -HALF_GRID && gz < HALF_GRID) {
          currentHoverTarget = { mode: 'place', x: gx, y: 0, z: gz };
          rebuildGhostPreview();
          renderer.domElement.style.cursor = 'crosshair';
          return;
        }
      }

      // どこにもヒットしない場合
      currentHoverTarget = null;
      while (ghostGroup.children.length > 0) ghostGroup.remove(ghostGroup.children[0]);
      renderer.domElement.style.cursor = 'default';
    }

    // ポインターイベント（クリック・ドラッグ判別）
    renderer.domElement.addEventListener('pointermove', (e) => {
      updateHoverState(e.clientX, e.clientY);
    });

    renderer.domElement.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownButton = e.button;
      updateHoverState(e.clientX, e.clientY);
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);

      // ドラッグ（カメラ回転・移動）だった場合はクリックアクションを発火しない
      if (dist > 6) return;

      // 右クリック単押し → 配置モード中でも素早く削除
      if (e.button === 2) {
        if (currentHoverTarget) {
          const targetId = currentHoverTarget.mode === 'block'
            ? currentHoverTarget.blockId
            : currentHoverTarget.hitBlockId;
          if (targetId && state.blocks.has(targetId)) {
            pushHistorySnapshot();
            removeBlockFromScene(targetId);
            sound.playErase();
            updateHoverState(e.clientX, e.clientY);
          }
        }
        return;
      }

      // 左クリックまたはタップ (button === 0)
      if (e.button !== 0) return;

      const effectiveTool = (state.tool === 'build' && isShiftPressed) ? 'erase' : state.tool;

      if (effectiveTool === 'build') {
        if (!currentHoverTarget || currentHoverTarget.mode !== 'place') return;
        const baseCandidate = {
          x: currentHoverTarget.x,
          y: currentHoverTarget.y,
          z: currentHoverTarget.z,
          shape: state.shape,
          rotation: state.rotation,
          color: state.color,
          material: state.material
        };
        const candidates = getMirroredPlacements(baseCandidate);

        // 1つでも配置可能なブロックがあれば履歴を保存して配置実行
        let placedAny = false;
        const tempOcc = new Map(state.occupied);
        const validCandidates = [];

        for (const cand of candidates) {
          const cells = getOccupiedCells(cand.x, cand.y, cand.z, cand.shape, cand.rotation);
          if (canPlaceCells(cells, tempOcc)) {
            for (const c of cells) tempOcc.set(`${c.x},${c.y},${c.z}`, -1);
            validCandidates.push(cand);
          }
        }

        if (validCandidates.length > 0) {
          pushHistorySnapshot();
          for (const vc of validCandidates) {
            if (addBlockToScene(vc, false)) placedAny = true;
          }
          if (placedAny) {
            sound.playPlace();
            updateHoverState(e.clientX, e.clientY);
          }
        }
      } else if (effectiveTool === 'erase') {
        if (currentHoverTarget && currentHoverTarget.mode === 'block') {
          pushHistorySnapshot();
          removeBlockFromScene(currentHoverTarget.blockId);
          sound.playErase();
          updateHoverState(e.clientX, e.clientY);
        }
      } else if (effectiveTool === 'paint') {
        if (currentHoverTarget && currentHoverTarget.mode === 'block') {
          const targetBlock = state.blocks.get(currentHoverTarget.blockId);
          if (targetBlock && (targetBlock.color !== state.color || targetBlock.material !== state.material)) {
            pushHistorySnapshot();
            updateBlockAppearance(currentHoverTarget.blockId, state.color, state.material);
            sound.playPop();
            updateHoverState(e.clientX, e.clientY);
          }
        }
      } else if (effectiveTool === 'eyedropper') {
        if (currentHoverTarget && currentHoverTarget.mode === 'block') {
          const b = state.blocks.get(currentHoverTarget.blockId);
          if (b) {
            setColor(b.color);
            selectShape(b.shape);
            selectMaterial(b.material);
            state.rotation = b.rotation;
            document.getElementById('rot-deg').textContent = `${state.rotation * 90}°`;
            selectTool('build');
            sound.playPop();
            showToast('ブロックの色・形状・質感を吸い取りました');
          }
        }
      }
    });

    // 右クリックメニュー抑止
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // =========================================================================
    // 10. カメラ視点プリセット＆滑らかな補間アニメーション
    // =========================================================================
    let camAnim = null; // { startPos, endPos, startTarget, endTarget, progress }

    // 作品全体が画面に収まるよう、大きさに合わせてカメラを引く
    function frameCameraForBlocks(blocks) {
      if (!blocks || blocks.length === 0) {
        animateCameraTo([18, 17, 20], [0, 2, 0]);
        return;
      }
      let maxY = 0, minX = 99, maxX = -99, minZ = 99, maxZ = -99;
      for (const b of blocks) {
        if (b.y > maxY) maxY = b.y;
        if (b.x < minX) minX = b.x;
        if (b.x > maxX) maxX = b.x;
        if (b.z < minZ) minZ = b.z;
        if (b.z > maxZ) maxZ = b.z;
      }
      const cx = (minX + maxX) / 2 + 0.5;
      const cz = (minZ + maxZ) / 2 + 0.5;
      const span = Math.max(maxX - minX + 1, maxZ - minZ + 1, (maxY + 1) * 1.2);
      const dist = Math.min(58, Math.max(26, span * 2.4));
      const ty = Math.max(2, (maxY + 1) / 2);
      animateCameraTo([cx + dist * 0.55, dist * 0.52, cz + dist * 0.62], [cx, ty, cz]);
    }

    function animateCameraTo(pos, target) {
      camAnim = {
        startPos: camera.position.clone(),
        endPos: new THREE.Vector3(...pos),
        startTarget: controls.target.clone(),
        endTarget: new THREE.Vector3(...target),
        progress: 0
      };
      sound.playRotate();
    }

    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.cam;
        if (mode === 'reset') animateCameraTo([18, 17, 20], [0, 2, 0]);
        else if (mode === 'iso') animateCameraTo([-19, 17, -19], [0, 2, 0]);
        else if (mode === 'front') animateCameraTo([0, 9, 25], [0, 3, 0]);
        else if (mode === 'top') animateCameraTo([0, 28, 0.01], [0, 0, 0]);
      });
    });

    // =========================================================================
    // 11. UIイベントバインディング（ツール・形状・質感・カラー・テーマ）
    // =========================================================================
    function selectTool(toolName) {
      state.tool = toolName;
      document.querySelectorAll('.tool-btn').forEach(btn => {
        const active = btn.dataset.tool === toolName;
        if (active) {
          btn.classList.remove('ui-btn-subtle');
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/30');
        } else {
          btn.classList.add('ui-btn-subtle');
          btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/30');
        }
      });
      clearHighlight();
      rebuildGhostPreview();
      updateHoverFromLastPointer();
    }

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectTool(btn.dataset.tool);
        sound.playRotate();
      });
    });

    function selectShape(shapeName) {
      state.shape = shapeName;
      document.querySelectorAll('.shape-btn').forEach(btn => {
        const active = btn.dataset.shape === shapeName;
        if (active) {
          btn.classList.remove('ui-btn-subtle');
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
        } else {
          btn.classList.add('ui-btn-subtle');
          btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
        }
      });
      rebuildGhostPreview();
    }

    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectShape(btn.dataset.shape);
        sound.playRotate();
      });
    });

    function selectMaterial(matName) {
      state.material = matName;
      document.querySelectorAll('.mat-btn').forEach(btn => {
        const active = btn.dataset.material === matName;
        if (active) {
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
          btn.classList.remove('opacity-75');
        } else {
          btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
          btn.classList.add('opacity-75');
        }
      });
      rebuildGhostPreview();
    }

    document.querySelectorAll('.mat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectMaterial(btn.dataset.material);
        sound.playRotate();
      });
    });

    // 18色カラーパレット生成
    const paletteContainer = document.getElementById('color-palette');
    function renderColorPalette() {
      paletteContainer.innerHTML = '';
      PALETTE_COLORS.forEach(c => {
        const btn = document.createElement('button');
        const isSelected = state.color.toLowerCase() === c.hex.toLowerCase();
        btn.className = `w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 transition-transform cursor-pointer border ${
          isSelected ? 'scale-115 ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent border-white' : 'border-black/15 hover:scale-110'
        }`;
        btn.style.backgroundColor = c.hex;
        btn.title = c.name;
        btn.addEventListener('click', () => {
          setColor(c.hex);
          sound.playRotate();
        });
        paletteContainer.appendChild(btn);
      });
    }

    function setColor(hex) {
      state.color = hex;
      document.getElementById('custom-color-picker').value = hex;
      renderColorPalette();
      rebuildGhostPreview();
    }

    document.getElementById('custom-color-picker').addEventListener('input', (e) => {
      setColor(e.target.value);
    });

    // 回転ボタン
    function rotateCurrentBlock() {
      state.rotation = (state.rotation + 1) % 4;
      document.getElementById('rot-deg').textContent = `${state.rotation * 90}°`;
      sound.playRotate();
      rebuildGhostPreview();
    }
    document.getElementById('btn-rotate').addEventListener('click', rotateCurrentBlock);

    // ミラー対称トグル
    const btnMirrorX = document.getElementById('btn-mirror-x');
    const btnMirrorZ = document.getElementById('btn-mirror-z');

    btnMirrorX.addEventListener('click', () => {
      state.mirrorX = !state.mirrorX;
      mirrorGuideX.visible = state.mirrorX;
      btnMirrorX.classList.toggle('bg-pink-600', state.mirrorX);
      btnMirrorX.classList.toggle('text-white', state.mirrorX);
      btnMirrorX.classList.toggle('ui-btn-subtle', !state.mirrorX);
      sound.playRotate();
      rebuildGhostPreview();
      showToast(`X軸（左右）対称ミラー: ${state.mirrorX ? 'ON' : 'OFF'}`);
    });

    btnMirrorZ.addEventListener('click', () => {
      state.mirrorZ = !state.mirrorZ;
      mirrorGuideZ.visible = state.mirrorZ;
      btnMirrorZ.classList.toggle('bg-cyan-600', state.mirrorZ);
      btnMirrorZ.classList.toggle('text-white', state.mirrorZ);
      btnMirrorZ.classList.toggle('ui-btn-subtle', !state.mirrorZ);
      sound.playRotate();
      rebuildGhostPreview();
      showToast(`Z軸（前後）対称ミラー: ${state.mirrorZ ? 'ON' : 'OFF'}`);
    });

    // Undo / Redo / 全消去
    document.getElementById('btn-undo').addEventListener('click', performUndo);
    document.getElementById('btn-redo').addEventListener('click', performRedo);
    document.getElementById('btn-clear-all').addEventListener('click', () => {
      if (state.blocks.size === 0) return;
      showConfirmDialog(
        'すべてのブロックを消去',
        '現在配置されているすべてのブロックを削除しますか？（Ctrl+Zで元に戻すことも可能です）',
        () => {
          pushHistorySnapshot();
          restoreFromSnapshot([]);
          sound.playErase();
          showToast('キャンバスをクリアしました');
        }
      );
    });

    // 背景テーマ切替
    function applyTheme(themeName) {
      state.theme = themeName;
      saveWork();
      document.body.className = `theme-${themeName}`;

      document.querySelectorAll('.theme-btn').forEach(btn => {
        const active = btn.dataset.theme === themeName;
        if (active) {
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
          btn.classList.remove('opacity-70', 'bg-white', 'text-slate-800');
        } else {
          btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm', 'bg-white', 'text-slate-800');
          btn.classList.add('opacity-70');
        }
      });

      if (themeName === 'light') {
        scene.background = new THREE.Color('#f1f5f9');
        scene.fog = new THREE.FogExp2('#f1f5f9', 0.008);
        plateMat.color.set('#e2e8f0');
        gridHelper.material.color.set('#94a3b8');
        hemiLight.intensity = 0.85;
        dirLight.intensity = 1.45;
      } else if (themeName === 'sky') {
        scene.background = new THREE.Color('#bae6fd');
        scene.fog = new THREE.FogExp2('#bae6fd', 0.0075);
        plateMat.color.set('#bbf7d0'); // 爽やかな草原ベースプレート風
        gridHelper.material.color.set('#4ade80');
        hemiLight.intensity = 0.95;
        dirLight.intensity = 1.5;
      }
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
        sound.playRotate();
      });
    });

    // サウンドミュート切替
    document.getElementById('btn-sound').addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      saveWork();
      document.getElementById('icon-sound-on').classList.toggle('hidden', !state.soundEnabled);
      document.getElementById('icon-sound-off').classList.toggle('hidden', state.soundEnabled);
      if (state.soundEnabled) sound.playPop();
      showToast(`効果音: ${state.soundEnabled ? 'ON' : 'OFF'}`);
    });

    // 操作ガイド折りたたみ
    let guideExpanded = true;
    document.getElementById('btn-toggle-guide').addEventListener('click', () => {
      guideExpanded = !guideExpanded;
      document.getElementById('help-guide-body').classList.toggle('hidden', !guideExpanded);
      document.getElementById('guide-chevron').style.transform = guideExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    // =========================================================================
    // 12. 保存・読込（JSON）＆ PNGスクリーンショット撮影
    // =========================================================================
    document.getElementById('btn-export-json').addEventListener('click', () => {
      try {
        const exportObj = {
          app: 'アートdeブロック',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          theme: state.theme,
          blocks: Array.from(state.blocks.values()).map(({ x, y, z, shape, rotation, color, material }) => ({
            x, y, z, shape, rotation, color, material
          }))
        };
        const jsonStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxel-studio-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        sound.playPop();
        showToast('作品データをJSON保存しました', 'success');
        guideSay('01-normal-smile', 'ファイルに ほぞんしたよ');
      } catch (err) {
        showToast('保存に失敗しました', 'error');
      }
    });

    const fileInputJson = document.getElementById('file-input-json');
    document.getElementById('btn-import-json').addEventListener('click', () => {
      fileInputJson.click();
    });

    fileInputJson.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (!parsed || !Array.isArray(parsed.blocks)) {
            throw new Error('不正なJSONフォーマットです');
          }
          pushHistorySnapshot();
          if (parsed.theme && ['light', 'sky'].includes(parsed.theme)) {
            applyTheme(parsed.theme);
          }
          const validShapes = ['voxel', 'stud', 'brick2x1', 'brick2x2', 'slope', 'cylinder'];
          const validMats = ['standard', 'matte', 'clear', 'neon'];
          const sanitized = parsed.blocks.filter(b =>
            typeof b.x === 'number' && typeof b.y === 'number' && typeof b.z === 'number' &&
            validShapes.includes(b.shape)
          ).map(b => ({
            x: Math.round(b.x),
            y: Math.round(b.y),
            z: Math.round(b.z),
            shape: b.shape,
            rotation: typeof b.rotation === 'number' ? b.rotation : 0,
            color: typeof b.color === 'string' ? b.color : '#ef4444',
            material: validMats.includes(b.material) ? b.material : 'standard'
          }));

          restoreFromSnapshot(sanitized);
          frameCameraForBlocks(sanitized);
          sound.playPop();
          showToast(`${sanitized.length}個のブロックを読み込みました`, 'success');
          guideSay('02-happy', 'よみこんだよ！');
        } catch (err) {
          showToast('JSONファイルの読み込みに失敗しました', 'error');
        } finally {
          fileInputJson.value = '';
        }
      };
      reader.readAsText(file);
    });

    // スクリーンショットモーダル＆撮影処理
    const modalShot = document.getElementById('modal-screenshot');
    document.getElementById('btn-screenshot').addEventListener('click', () => {
      modalShot.classList.remove('hidden');
      modalShot.classList.add('flex');
    });
    document.getElementById('cancel-screenshot').addEventListener('click', () => {
      modalShot.classList.add('hidden');
      modalShot.classList.remove('flex');
    });
    document.getElementById('confirm-screenshot').addEventListener('click', () => {
      const hideGrid = document.getElementById('chk-hide-grid-shot').checked;
      modalShot.classList.add('hidden');
      modalShot.classList.remove('flex');

      // 撮影用にゴースト・ハイライト・グリッドを一時非表示
      const prevGhostVis = ghostGroup.visible;
      const prevGridVis = gridHelper.visible;
      const prevMirrorXVis = mirrorGuideX.visible;
      const prevMirrorZVis = mirrorGuideZ.visible;

      ghostGroup.visible = false;
      if (hideGrid) {
        gridHelper.visible = false;
        mirrorGuideX.visible = false;
        mirrorGuideZ.visible = false;
      }

      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');

      // 表示状態を復元
      ghostGroup.visible = prevGhostVis;
      gridHelper.visible = prevGridVis;
      mirrorGuideX.visible = prevMirrorXVis;
      mirrorGuideZ.visible = prevMirrorZVis;

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `voxel-studio-shot-${Date.now()}.png`;
      a.click();

      sound.playPop();
      showToast('PNGスクリーンショットを保存しました', 'success');
      guideSay('10-confident', 'しゃしん、とれたよ！');
    });

    // =========================================================================
    // 13. サンプル作品プリセットデータ生成＆ロード
    // =========================================================================
    function generatePresetBlocks(presetKey) {
      const list = [];
      const add = (x, y, z, shape = 'stud', rotation = 0, color = '#ef4444', material = 'standard') => {
        list.push({ x, y, z, shape, rotation, color, material });
      };

      if (presetKey === 'house') {
        // 小さな赤い屋根の家（コテージ）
        // 芝生の庭ベース
        for (let x = -5; x <= 5; x++) {
          for (let z = -5; z <= 5; z++) {
            if (x === 0 && z >= 3) continue; // 石畳のマスは空けておく
            add(x, 0, z, 'voxel', 0, '#84cc16', 'matte');
          }
        }
        // アプローチ石畳
        for (let z = 3; z <= 5; z++) {
          add(0, 0, z, 'voxel', 0, '#cbd5e1', 'matte');
        }
        // 白い外壁 (x: -3..2, z: -3..2, y: 1..3)
        for (let y = 1; y <= 3; y++) {
          for (let x = -3; x <= 2; x++) {
            for (let z = -3; z <= 2; z++) {
              const isEdge = x === -3 || x === 2 || z === -3 || z === 2;
              if (!isEdge) continue;
              // ドア開口 (x=0, z=2, y=1..2)
              if (x === 0 && z === 2 && (y === 1 || y === 2)) continue;
              // クリアガラスの窓
              if (y === 2 && ((z === 2 && (x === -2 || x === 1)) || ((x === -3 || x === 2) && (z === -1 || z === 0)))) {
                add(x, y, z, 'voxel', 0, '#93c5fd', 'clear');
                continue;
              }
              add(x, y, z, 'stud', 0, '#f8fafc', 'standard');
            }
          }
        }
        // ドア（茶色）
        add(0, 1, 2, 'voxel', 0, '#92400e', 'matte');
        add(0, 2, 2, 'voxel', 0, '#92400e', 'matte');
        // 赤いスロープ屋根
        for (let x = -4; x <= 3; x++) {
          add(x, 4, 3, 'slope', 0, '#ef4444', 'standard');
          add(x, 4, -4, 'slope', 2, '#ef4444', 'standard');
          for (let z = -3; z <= 2; z++) {
            add(x, 4, z, 'voxel', 0, '#ef4444', 'standard');
          }
          add(x, 5, 2, 'slope', 0, '#ef4444', 'standard');
          add(x, 5, -3, 'slope', 2, '#ef4444', 'standard');
          for (let z = -2; z <= 1; z++) {
            add(x, 5, z, 'voxel', 0, '#ef4444', 'standard');
          }
          add(x, 6, 1, 'slope', 0, '#ef4444', 'standard');
          add(x, 6, -2, 'slope', 2, '#ef4444', 'standard');
          add(x, 6, 0, 'stud', 0, '#ef4444', 'standard');
          add(x, 6, -1, 'stud', 0, '#ef4444', 'standard');
        }
        // 煙突
        add(2, 6, -2, 'voxel', 0, '#475569', 'matte');
        add(2, 7, -2, 'stud', 0, '#475569', 'matte');
        // 庭の木
        add(-4, 1, 4, 'cylinder', 0, '#92400e', 'matte');
        add(-4, 2, 4, 'cylinder', 0, '#92400e', 'matte');
        for (let lx = -5; lx <= -3; lx++) {
          for (let lz = 3; lz <= 5; lz++) {
            add(lx, 3, lz, 'stud', 0, '#22c55e', 'standard');
          }
        }
        add(-4, 4, 4, 'stud', 0, '#22c55e', 'standard');
        // 花
        add(3, 1, 4, 'cylinder', 0, '#eab308', 'neon');
        add(4, 1, 3, 'cylinder', 0, '#ec4899', 'standard');
      } else if (presetKey === 'robot') {
        // レトロロボット
        // 足
        add(-2, 0, 0, 'brick2x1', 1, '#475569', 'standard');
        add(1, 0, 0, 'brick2x1', 1, '#475569', 'standard');
        // 脚
        for (let y = 1; y <= 3; y++) {
          add(-2, y, 0, 'cylinder', 0, '#cbd5e1', 'standard');
          add(1, y, 0, 'cylinder', 0, '#cbd5e1', 'standard');
        }
        // 腰・胴体
        for (let x = -2; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            add(x, 4, z, 'voxel', 0, '#eab308', 'standard');
            for (let y = 5; y <= 8; y++) {
              if (z === 1 && y === 6 && (x === -1 || x === 0)) continue; // 胸コアのマス
              add(x, y, z, 'stud', 0, '#3b82f6', 'standard');
            }
          }
        }
        // 胸のネオンコア
        add(-1, 6, 1, 'cylinder', 0, '#06b6d4', 'neon');
        add(0, 6, 1, 'cylinder', 0, '#06b6d4', 'neon');
        // 両腕
        for (let y = 5; y <= 8; y++) {
          add(-3, y, 0, 'cylinder', 0, '#cbd5e1', 'standard');
          add(2, y, 0, 'cylinder', 0, '#cbd5e1', 'standard');
        }
        add(-3, 4, 0, 'voxel', 0, '#ef4444', 'standard');
        add(2, 4, 0, 'voxel', 0, '#ef4444', 'standard');
        // 首＆頭部
        add(-1, 9, 0, 'cylinder', 0, '#475569', 'standard');
        add(0, 9, 0, 'cylinder', 0, '#475569', 'standard');
        for (let x = -2; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            for (let y = 10; y <= 12; y++) {
              if (z === 1 && (x === -1 || x === 0) && (y === 10 || y === 11)) continue; // 目と口のマス
              add(x, y, z, 'voxel', 0, '#f8fafc', 'standard');
            }
          }
        }
        // 光る目と口
        add(-1, 11, 1, 'cylinder', 0, '#fbbf24', 'neon');
        add(0, 11, 1, 'cylinder', 0, '#fbbf24', 'neon');
        add(-1, 10, 1, 'voxel', 0, '#ef4444', 'standard');
        add(0, 10, 1, 'voxel', 0, '#ef4444', 'standard');
        // アンテナ
        add(-1, 13, 0, 'cylinder', 0, '#475569', 'standard');
        add(-1, 14, 0, 'cylinder', 0, '#ef4444', 'neon');
      } else if (presetKey === 'garden') {
        // 桜と池のミニ庭園
        for (let x = -5; x <= 5; x++) {
          for (let z = -5; z <= 5; z++) {
            if (x >= -2 && x <= 2 && z >= -4 && z <= 4) {
              // クリアブルーの池
              add(x, 0, z, 'voxel', 0, '#06b6d4', 'clear');
            } else {
              add(x, 0, z, 'voxel', 0, '#84cc16', 'matte');
            }
          }
        }
        // 太鼓橋
        for (let z = -1; z <= 1; z++) {
          add(-3, 1, z, 'slope', 1, '#92400e', 'matte');
          add(-2, 1, z, 'voxel', 0, '#92400e', 'matte');
          add(-1, 2, z, 'voxel', 0, '#92400e', 'matte');
          add(0, 2, z, 'voxel', 0, '#92400e', 'matte');
          add(1, 2, z, 'voxel', 0, '#92400e', 'matte');
          add(2, 1, z, 'voxel', 0, '#92400e', 'matte');
          add(3, 1, z, 'slope', 3, '#92400e', 'matte');
        }
        // 桜の木
        for (let y = 1; y <= 4; y++) {
          add(-4, y, -3, 'cylinder', 0, '#451a03', 'matte');
        }
        for (let lx = -5; lx <= -2; lx++) {
          for (let lz = -5; lz <= -1; lz++) {
            for (let ly = 4; ly <= 6; ly++) {
              if (Math.abs(lx + 4) + Math.abs(lz + 3) + Math.abs(ly - 5) <= 3) {
                add(lx, ly, lz, 'stud', 0, '#ec4899', 'standard');
              }
            }
          }
        }
        // 石灯籠
        add(4, 1, 3, 'cylinder', 0, '#cbd5e1', 'matte');
        add(4, 2, 3, 'voxel', 0, '#fbbf24', 'neon');
        add(4, 3, 3, 'slope', 0, '#cbd5e1', 'matte');
      } else if (presetKey === 'rocket') {
        // スペースロケット
        for (let x = -4; x <= 4; x++) {
          for (let z = -4; z <= 4; z++) {
            add(x, 0, z, 'voxel', 0, '#475569', 'matte');
          }
        }
        // ネオン噴射炎
        add(0, 1, 0, 'cylinder', 0, '#f97316', 'neon');
        add(0, 2, 0, 'cylinder', 0, '#eab308', 'neon');
        // ロケット本体
        for (let y = 3; y <= 10; y++) {
          const col = (y === 3 || y === 10) ? '#ef4444' : '#f8fafc';
          add(0, y, 0, 'cylinder', 0, col, 'standard');
        }
        // クリア丸窓
        add(0, 7, 1, 'cylinder', 0, '#06b6d4', 'clear');
        // 4枚の翼
        add(1, 3, 0, 'slope', 1, '#ef4444', 'standard');
        add(-1, 3, 0, 'slope', 3, '#ef4444', 'standard');
        add(0, 3, 1, 'slope', 0, '#ef4444', 'standard');
        add(0, 3, -1, 'slope', 2, '#ef4444', 'standard');
        // ノーズコーン
        add(0, 11, 0, 'cylinder', 0, '#ef4444', 'standard');
        // 発射タワー
        for (let y = 1; y <= 10; y++) {
          add(-3, y, -3, 'stud', 0, '#eab308', 'standard');
        }
        add(-2, 9, -3, 'brick2x1', 0, '#cbd5e1', 'standard');
      }
      return list;
    }

    const modalPresets = document.getElementById('modal-presets');
    document.getElementById('btn-presets').addEventListener('click', () => {
      modalPresets.classList.remove('hidden');
      modalPresets.classList.add('flex');
    });
    document.getElementById('close-presets').addEventListener('click', () => {
      modalPresets.classList.add('hidden');
      modalPresets.classList.remove('flex');
    });

    document.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.preset;
        modalPresets.classList.add('hidden');
        modalPresets.classList.remove('flex');

        pushHistorySnapshot();
        const blocks = generatePresetBlocks(key);
        restoreFromSnapshot(blocks);
        frameCameraForBlocks(blocks);
        sound.playPop();
        showToast('サンプル作品を読み込みました！', 'success');
        guideSay('04-idea', 'サンプルを よみこんだよ。じゆうに かえてみてね');
      });
    });

    // =========================================================================
    // 14. リサイズ対応＆メインアニメーションループ
    // =========================================================================
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);

      // カメラプリセット補間アニメーション
      if (camAnim) {
        camAnim.progress += 0.065;
        const t = Math.min(1, camAnim.progress);
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
        camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, ease);
        controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, ease);
        if (t >= 1) camAnim = null;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    // 初期化実行
    const savedWork = loadWork();
    renderColorPalette();
    if (savedWork && savedWork.soundEnabled === false) {
      state.soundEnabled = false;
      document.getElementById('icon-sound-on').classList.add('hidden');
      document.getElementById('icon-sound-off').classList.remove('hidden');
    }
    applyTheme(savedWork && ['light', 'sky'].includes(savedWork.theme) ? savedWork.theme : 'light');
    if (savedWork && savedWork.blocks.length > 0) {
      // 端末に残っている作品があれば、続きから始める
      restoreFromSnapshot(savedWork.blocks);
      showToast('つづきの作品を読み込みました');
      guideSay('02-happy', 'おかえり！まえの つづきから はじまるよ');
    } else {
      // 初めてのときは、すぐ楽しめるよう「小さな赤い屋根の家」を初期配置
      restoreFromSnapshot(generatePresetBlocks('house'));
      guideSay('02-happy', 'いっしょに つくろう！まずは ブロックを おいてみてね');
    }
    state.undoStack = [];
    state.redoStack = [];
    updateUndoRedoUI();
    animate();