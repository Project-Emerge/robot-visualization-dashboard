import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, useGLTF } from '@react-three/drei';
import type { RobotData } from '../types/RobotData';


function RobotShape({ data, onClick }: { data: RobotData; onClick?: (id : number) => void }) {
  const { position, orientation, isLeader, id } = data;
  const meshRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  // Load the GLB model
  const { scene } = useGLTF('/src/assets/base.glb');
  
  // Use the original model with leader/follower coloring
  const robotModel = useMemo(() => {
    const clonedScene = scene.clone();
    const color = isLeader ? 'gold' : 'skyblue';
    
    // Ensure all meshes in the model cast shadows and apply color
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material instanceof THREE.Material) {
          child.material = child.material.clone();
          (child.material as any).color = new THREE.Color(color);
        }
      }
    });
    
    return clonedScene;
  }, [scene, isLeader]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position.x, 0, position.y);
      meshRef.current.rotation.set(0, THREE.MathUtils.degToRad(orientation), 0);
      meshRef.current.userData = { id }; // Set userData with robot ID
    }
    if (textRef.current) {
      textRef.current.lookAt(camera.position); // Make the text face the camera
    }
  });

  return (
    <>
      <group 
        ref={meshRef} 
        castShadow 
        receiveShadow 
        onClick={(event) => {
          event.stopPropagation(); // Prevent event bubbling
          if (onClick) onClick(data.id);
        }}
      >
        <primitive 
          object={robotModel} 
          scale={[0.01, 0.01, 0.01]}
        />
      </group>
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

// Preload the GLB model
useGLTF.preload('/src/assets/base.glb');

export default RobotShape;
