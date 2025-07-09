import mqtt from 'mqtt';
import type { Vector2D } from '../types/Vector2D';
import type { EventStream } from './EventStreamInterface';
import type { RobotData } from '../types/RobotData'; // Adjust the import path as necessary


export class MQTTEventStream implements EventStream {
  private client: mqtt.MqttClient;
  private robots: { [key: string]: any } = {};

  constructor(brokerUrl: string) {
    this.client = mqtt.connect(brokerUrl);
  }

  subscribe(callback: (robots: RobotData[]) => void): void {
    this.client.on('connect', () => {
      Object.keys(this.robots).forEach((id) => {
        this.client.subscribe(`robot/${id}/position`);
        this.client.subscribe(`robot/${id}/neighbours`);
        this.client.subscribe(`robot/${id}/leader`);
      });
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        const id = topic.split('/')[1];

        if (topic.endsWith('/position')) {
          this.updateRobotPosition(id, data);
        } else if (topic.endsWith('/neighbours')) {
          this.robots[id] = {
            ...this.robots[id],
            neighbors: data,
          };
        } else if (topic.endsWith('/leader')) {
          this.robots[id] = {
            ...this.robots[id],
            isLeader: data,
          };
        }

        callback(Object.values(this.robots) as RobotData[]); // Send the entire updated map as RobotData[]
      } catch (e) {
        console.error('Error processing MQTT message:', e);
      }
    });
  }

  private updateRobotPosition(id: string, data: { x: number; y: number; orientation: number }): void {
    this.robots[id] = {
      ...this.robots[id],
      position: { x: data.x, y: data.y },
      orientation: data.orientation,
    };
  }

  publishCommand(command: Vector2D): void {
    const leaderId = Object.keys(this.robots).find((id) => this.robots[id]?.isLeader);
    if (leaderId) {
      this.client.publish(`robot/${leaderId}/move`, JSON.stringify(command));
    }
  }

  cleanup(): void {
    this.client.end();
  }
}
