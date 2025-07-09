import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { RobotData } from '../types/RobotData';


function RobotShape({ data, onClick }: { data: RobotData; onClick?: (id : number) => void }) {
  const { position, orientation, isLeader, id } = data;
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position.x, 0, position.y);
      meshRef.current.rotation.set(0, 0, THREE.MathUtils.degToRad(-90)); //cones are rotated of 90 degrees to face the X-axis
      meshRef.current.rotateX(THREE.MathUtils.degToRad(orientation)) // Rotate cones correctly to face the X-axis orientation
      meshRef.current.userData = { id }; // Set userData with robot ID
    }
    if (textRef.current) {
      textRef.current.lookAt(camera.position); // Make the text face the camera
    }
  });

  return (
    <>
      <mesh ref={meshRef} castShadow receiveShadow onClick={(event) => {
        event.stopPropagation(); // Prevent event bubbling
        if (onClick) onClick(data.id);
      }}>
        <coneGeometry args={[0.5, 1.5, 32]} /> {/* Arrow shape */}
        <meshStandardMaterial color={isLeader ? 'gold' : 'skyblue'} />
      </mesh>
      <Text
        ref={textRef}
        position={[position.x, 1.5, position.y]} // Position text above the mesh
        fontSize={0.5}
        color="black"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf" // Use a compatible font
      >
        {id}
      </Text>
    </>
  );
}

export default RobotShape;
