import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import NeighborLines from './NeighborLines';
import RobotShape from './RobotShape';
import type { RobotData } from '../types/RobotData';
import { useEffect } from 'react';


function CameraController({ trigger }: { trigger: number }) {
  const { camera } = useThree();

  useEffect(() => {
      camera.position.set(0, 30, 0); // Reset to default position
      camera.lookAt(0,0,0);
  }, [trigger]);

  return null;
}

function RobotScene({ robots, trigger, onRobotClick }: { robots: RobotData[]; trigger: number; onRobotClick: (id: number | null) => void }) {
  return (
    <>
      <Canvas onPointerMissed={(e) => onRobotClick(null)}> 
        <axesHelper args={[100]} />
        <CameraController trigger={trigger} /> 
        <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />
        <ambientLight />
        <NeighborLines robots={robots} />
        <group> 
          {robots.map((robot) => (
            <RobotShape key={robot.id} data={robot} onClick={(id) => {
              onRobotClick(id);
            }} />
          ))}
        </group>
      </Canvas>
    </>
  );
}

export default RobotScene;
