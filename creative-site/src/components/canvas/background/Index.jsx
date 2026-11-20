import Background from '@src/components/canvas/background/Background';
import { Canvas } from '@react-three/fiber';
import { useProjectWindowOpen } from '@src/components/dom/projectWindow/ProjectWindow';

function Index() {
  const viewingProject = useProjectWindowOpen();
  const devicePixelRatio = typeof window !== 'undefined' ? Math.min(1, window.devicePixelRatio) : 1;

  return (
    <Canvas
      frameloop={viewingProject ? 'never' : 'always'}
      flat
      linear
      dpr={[devicePixelRatio, 1]}
      gl={{
        antialias: false,
        stencil: false,
        depth: false,
        pixelRatio: 0.5,
      }}
    >
      <Background />
    </Canvas>
  );
}
export default Index;
