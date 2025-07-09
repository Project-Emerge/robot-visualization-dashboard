// Required dependencies:
// npm install three mqtt react-three-fiber drei

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import mqtt from 'mqtt';
import './App.css';

const MQTT_BROKER_URL = 'ws://YOUR_MQTT_BROKER_URL'; // Replace with actual broker

function RobotCube({ id, position, isLeader, neighbors }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={isLeader ? 'gold' : 'skyblue'} />
      </mesh>
      {neighbors.map((nPos, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...position, ...nPos])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="red" linewidth={1} />
        </line>
      ))}
    </>
  );
}

function CameraController({ follow, robotPositions }) {
  const { camera } = useThree();
  useFrame(() => {
    let target;
    if (follow === 'centroid') {
      const center = robotPositions.reduce((acc, p) => [
        acc[0] + p[0],
        acc[1] + p[1],
        acc[2] + p[2]
      ], [0, 0, 0]).map(x => x / robotPositions.length);
      target = center;
    } else if (robotPositions[follow]) {
      target = robotPositions[follow];
    } else {
      return;
    }
    camera.position.set(target[0], target[1] + 30, target[2]);
    camera.lookAt(...target);
  });
  return null;
}

function RobotScene({ robots, follow }) {
  const positions = Object.values(robots).map(r => r.position);

  return (
    <Canvas style={{ height: '100%', width: '100%' }}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <CameraController follow={follow} robotPositions={positions} />
      {Object.entries(robots).map(([id, data]) => (
        <RobotCube
          key={id}
          id={id}
          position={data.position}
          isLeader={data.isLeader}
          neighbors={data.neighbors.map(nid => robots[nid]?.position || data.position)}
        />
      ))}
    </Canvas>
  );
}

function ControlPanel({ onCommand }) {
  const send = (dx, dy) => onCommand({ x: dx, y: dy });

  return (
    <div className="control-panel">
      <h3>Control panel for robot</h3>
      <div className="arrows">
        <button onClick={() => send(0, 1)}>↑</button>
        <button onClick={() => send(-1, 0)}>←</button>
        <button onClick={() => send(1, 0)}>→</button>
        <button onClick={() => send(0, -1)}>↓</button>
      </div>
    </div>
  );
}

function App() {
  const [client, setClient] = useState(null);
  const [robots, setRobots] = useState({});
  const [follow, setFollow] = useState('centroid');

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER_URL);
    setClient(mqttClient);

    mqttClient.on('connect', () => {
      mqttClient.subscribe('robots/#');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (topic.startsWith('robots/')) {
          const id = topic.split('/')[1];
          setRobots(prev => ({
            ...prev,
            [id]: {
              position: data.position,
              isLeader: data.isLeader,
              neighbors: data.neighbors
            }
          }));
        }
      } catch (e) {
        console.error(e);
      }
    });

    return () => mqttClient.end();
  }, []);

  const handleMove = (vec) => {
    const leaderId = Object.entries(robots).find(([_, r]) => r.isLeader)?.[0];
    if (leaderId && client) {
      client.publish(`robots/${leaderId}/move`, JSON.stringify(vec));
    }
  };

  const handleFormationChange = (e) => {
    const formation = e.target.value;
    if (client) {
      client.publish('formation', formation);
    }
  };

  return (
    <div className="app-layout">
      <div className="top-bar">
        <select onChange={handleFormationChange}>
          <option value="circle">Circle</option>
          <option value="arrow">Arrow</option>
        </select>
      </div>
      <div className="main-content">
        <div className="map-container">
          <RobotScene robots={robots} follow={follow} />
        </div>
        <ControlPanel onCommand={handleMove} />
      </div>
    </div>
  );
}

export default App;
