import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';

// Web版とNative版を条件分岐で実装
let KyudoBackgroundAnimation;

if (Platform.OS === 'web') {
  KyudoBackgroundAnimation = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
      let renderer, scene, camera, animationFrameId;
      let active = true;

      const initThree = () => {
        if (!canvasRef.current || !containerRef.current) return;
        const THREE = window.THREE;
        if (!THREE) return;

        const W = containerRef.current.offsetWidth || window.innerWidth;
        const H = containerRef.current.offsetHeight || window.innerHeight;

        try {
          renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
          });
        } catch (e) {
          console.warn('WebGL initialization failed in background: ', e);
          return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(W, H);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
        camera.position.z = 8;

        // 星屑粒子
        const count = 180;
        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const speeds = [];
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 15;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
          speeds.push(0.005 + Math.random() * 0.01);
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
          color: 0xe5c184,
          size: 0.07,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
        });
        const stars = new THREE.Points(geom, mat);
        scene.add(stars);

        // 矢ペアグループ
        const arrowPairGroup = new THREE.Group();
        scene.add(arrowPairGroup);

        const createKyudoVectorArrow = () => {
          const arrow = new THREE.Group();
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xe5c184,
            transparent: true,
            opacity: 0.85,
          });
          const subMat = new THREE.LineBasicMaterial({
            color: 0xb8965a,
            transparent: true,
            opacity: 0.45,
          });

          // シャフト
          const shaftPts = [new THREE.Vector3(0, -2.4, 0), new THREE.Vector3(0, 2.4, 0)];
          const shaftGeom = new THREE.BufferGeometry().setFromPoints(shaftPts);
          arrow.add(new THREE.Line(shaftGeom, lineMat));

          // 節
          [-1.3, 0.4, 1.7].forEach((yPos) => {
            const ringPts = [];
            for (let a = 0; a <= 16; a++) {
              const theta = (a / 16) * Math.PI * 2;
              ringPts.push(new THREE.Vector3(Math.cos(theta) * 0.035, yPos, Math.sin(theta) * 0.035));
            }
            const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPts);
            arrow.add(new THREE.Line(ringGeom, subMat));
          });

          // 矢尻
          const tipPts = [
            new THREE.Vector3(0, 2.4, 0),
            new THREE.Vector3(-0.06, 2.2, 0),
            new THREE.Vector3(0.06, 2.2, 0),
            new THREE.Vector3(0, 2.4, 0),
          ];
          const tipGeom = new THREE.BufferGeometry().setFromPoints(tipPts);
          arrow.add(new THREE.Line(tipGeom, lineMat));

          // 筈 (切り込み)
          const nockPts = [
            new THREE.Vector3(-0.024, -2.4, 0),
            new THREE.Vector3(-0.024, -2.55, 0),
            new THREE.Vector3(0, -2.48, 0),
            new THREE.Vector3(0.024, -2.55, 0),
            new THREE.Vector3(0.024, -2.4, 0),
          ];
          const nockGeom = new THREE.BufferGeometry().setFromPoints(nockPts);
          arrow.add(new THREE.Line(nockGeom, lineMat));

          // 矧糸
          const createBinding = (yPos) => {
            const bindPts = [new THREE.Vector3(-0.028, yPos, 0), new THREE.Vector3(0.028, yPos, 0)];
            return new THREE.Line(new THREE.BufferGeometry().setFromPoints(bindPts), lineMat);
          };
          arrow.add(createBinding(-2.28));
          arrow.add(createBinding(-0.92));

          // 矢羽根
          const fPts = [
            new THREE.Vector3(0, -1.0, 0),
            new THREE.Vector3(0.22, -2.0, 0),
            new THREE.Vector3(0.15, -2.06, 0),
            new THREE.Vector3(0, -2.2, 0),
            new THREE.Vector3(0, -1.0, 0),
          ];
          const fGeom = new THREE.BufferGeometry().setFromPoints(fPts);
          const quillPts = [new THREE.Vector3(0.02, -1.0, 0), new THREE.Vector3(0.02, -2.18, 0)];
          const quillGeom = new THREE.BufferGeometry().setFromPoints(quillPts);

          for (let r = 0; r < 3; r++) {
            const angle = (r * Math.PI * 2) / 3;
            const feather = new THREE.Line(fGeom, lineMat);
            feather.rotation.y = angle;
            arrow.add(feather);

            const quill = new THREE.Line(quillGeom, subMat);
            quill.rotation.y = angle;
            arrow.add(quill);
          }

          return arrow;
        };

        const arrow1 = createKyudoVectorArrow();
        arrow1.position.set(-0.35, 0, 0);
        arrowPairGroup.add(arrow1);

        const arrow2 = createKyudoVectorArrow();
        arrow2.position.set(0.35, 0.3, -0.3);
        arrowPairGroup.add(arrow2);

        // 同心円の軌道
        const ringsGroup = new THREE.Group();
        arrowPairGroup.add(ringsGroup);

        const createRing = (r, op) => {
          const pts = [];
          for (let a = 0; a <= 64; a++) {
            const theta = (a / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r));
          }
          return new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0xe5c184, transparent: true, opacity: op })
          );
        };
        ringsGroup.add(createRing(1.2, 0.4));
        ringsGroup.add(createRing(2.0, 0.2));
        ringsGroup.add(createRing(2.8, 0.1));

        arrowPairGroup.rotation.x = 0.45;
        arrowPairGroup.rotation.y = -0.6;

        let t = 0;
        const animate = () => {
          if (!active) return;
          animationFrameId = requestAnimationFrame(animate);
          t += 0.004;

          arrowPairGroup.rotation.y = t * 0.4;
          arrowPairGroup.rotation.z = Math.sin(t * 0.25) * 0.12;
          ringsGroup.rotation.x = Math.cos(t * 0.2) * 0.08;

          const arr = stars.geometry.attributes.position.array;
          for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] -= speeds[i];
            if (arr[i * 3 + 1] < -5) {
              arr[i * 3 + 1] = 5;
            }
          }
          stars.geometry.attributes.position.needsUpdate = true;

          renderer.render(scene, camera);
        };

        animate();
      };

      // Three.js スクリプトをロード
      if (!window.THREE) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.async = true;
        script.onload = () => {
          if (active) initThree();
        };
        document.body.appendChild(script);
      } else {
        initThree();
      }

      const handleResize = () => {
        if (!containerRef.current || !camera || !renderer) return;
        const W = containerRef.current.offsetWidth;
        const H = containerRef.current.offsetHeight;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        active = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if (renderer) renderer.dispose();
      };
    }, []);

    return (
      <View ref={containerRef} style={styles.webContainer}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  };
} else {
  // Native版 (iOS / Android) - SVG & Reanimated で再現
  const Svg = require('react-native-svg').default;
  const { Circle, G, Path, Line } = require('react-native-svg');
  const Animated = require('react-native-reanimated').default;
  const {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
  } = require('react-native-reanimated');

  KyudoBackgroundAnimation = () => {
    const rotation = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
      // 的と全体のゆっくりとした回転
      rotation.value = withRepeat(withTiming(360, { duration: 35000, easing: Easing.linear }), -1, false);

      // 上下の緩やかな浮遊モーション
      translateY.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ rotate: `${rotation.value}deg` }, { translateY: translateY.value }],
      };
    });

    const screenWidth = Dimensions.get('window').width;
    const scale = screenWidth > 500 ? 1.0 : 0.85;

    return (
      <View style={styles.nativeContainer}>
        <Animated.View style={[styles.animationWrapper, animatedStyle, { transform: [{ scale }] }]}>
          <Svg width="480" height="480" viewBox="0 0 480 480">
            {/* Concentric Circles (Concentric Rings / Mato) */}
            <Circle cx="240" cy="240" r="239" stroke="#b8965a" strokeWidth="1" strokeOpacity="0.25" />
            <Circle cx="240" cy="240" r="186" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3" />
            <Circle cx="240" cy="240" r="133" stroke="#b8965a" strokeWidth="1" strokeOpacity="0.4" />
            <Circle cx="240" cy="240" r="84" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.5" />
            <Circle cx="240" cy="240" r="42" stroke="#e5c184" strokeWidth="1.5" strokeOpacity="0.75" />
            <Circle cx="240" cy="240" r="10" fill="#e5c184" fillOpacity="0.8" />

            {/* Grid Lines */}
            <Line x1="240" y1="0" x2="240" y2="480" stroke="#8b5cf6" strokeWidth="0.5" strokeOpacity="0.15" />
            <Line x1="0" y1="240" x2="480" y2="240" stroke="#8b5cf6" strokeWidth="0.5" strokeOpacity="0.15" />

            {/* Vector Arrow 1 (手前の矢) */}
            <G transform="translate(225, 240) rotate(-35)">
              {/* シャフト */}
              <Line x1="0" y1="-120" x2="0" y2="120" stroke="#e5c184" strokeWidth="1.8" strokeOpacity="0.9" />
              {/* 筈 */}
              <Path
                d="M-2.5,-120 L-2.5,-126 L0,-123 L2.5,-126 L2.5,-120"
                stroke="#e5c184"
                strokeWidth="1.5"
                fill="none"
              />
              {/* 矢尻 */}
              <Path d="M0,120 L-4,112 L4,112 Z" fill="#e5c184" />
              {/* 矧糸 */}
              <Line x1="-3" y1="-110" x2="3" y2="-110" stroke="#e5c184" strokeWidth="2" />
              <Line x1="-3" y1="-60" x2="3" y2="-60" stroke="#e5c184" strokeWidth="2" />
              {/* 矢羽根 (左・右のフラット表現) */}
              <Path d="M0,-100 L12,-115 L8,-117 L0,-120" fill="#e5c184" fillOpacity="0.85" />
              <Path d="M0,-100 L-12,-115 L-8,-117 L0,-120" fill="#e5c184" fillOpacity="0.85" />
              {/* 羽軸 */}
              <Line x1="1" y1="-100" x2="1" y2="-119" stroke="#b8965a" strokeWidth="1" strokeOpacity="0.5" />
              <Line
                x1="-1"
                y1="-100"
                x2="-1"
                y2="-119"
                stroke="#b8965a"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            </G>

            {/* Vector Arrow 2 (奥の矢) */}
            <G transform="translate(255, 220) rotate(-35)" opacity="0.6">
              {/* シャフト */}
              <Line
                x1="0"
                y1="-120"
                x2="0"
                y2="120"
                stroke="#b8965a"
                strokeWidth="1.5"
                strokeOpacity="0.75"
              />
              {/* 筈 */}
              <Path
                d="M-2,-120 L-2,-126 L0,-123 L2,-126 L2,-120"
                stroke="#b8965a"
                strokeWidth="1.2"
                fill="none"
              />
              {/* 矢尻 */}
              <Path d="M0,120 L-3,112 L3,112 Z" fill="#b8965a" />
              {/* 矢羽根 */}
              <Path d="M0,-100 L10,-115 L7,-117 L0,-120" fill="#b8965a" fillOpacity="0.7" />
              <Path d="M0,-100 L-10,-115 L-7,-117 L0,-120" fill="#b8965a" fillOpacity="0.7" />
            </G>
          </Svg>
        </Animated.View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  webContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  nativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundColor: '#030508',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  animationWrapper: {
    width: 480,
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default KyudoBackgroundAnimation;
